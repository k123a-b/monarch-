import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { cardMap, cardPowerup, indexSets } from "../shared/catalog.mjs";

// Uses a dedicated configured database, never a mocked SQL implementation.
test(
  "transactional economy integration",
  { skip: process.env.CARD_MONARCHS_DATABASE_TESTS !== "1" },
  async (t) => {
    const { handle } = await import("../server/game.ts");
    const { pool: getPool } = await import("../db/index.ts");
    const pool = getPool();
    const suffix = randomUUID().slice(0, 8);
    const a = {
        id: randomUUID(),
        name: "Test Monarch " + suffix,
        email: `test-monarch-${suffix}@example.test`,
      },
      b = {
        id: randomUUID(),
        name: "Test Courtier " + suffix,
        email: `test-courtier-${suffix}@example.test`,
      };
    const alternateLogin = {
      id: randomUUID(),
      name: "Test Monarch Alternate " + suffix,
      email: a.email,
    };
    const milestoneUser = {
      id: randomUUID(),
      name: "Test Milestone " + suffix,
    };
    const batchUser = { id: randomUUID(), name: "Test Batch " + suffix };
    const indexUser = { id: randomUUID(), name: "Test Index " + suffix };
    const questUser = { id: randomUUID(), name: "Test Quests " + suffix };
    const secretUser = { id: randomUUID(), name: "Test Secret " + suffix };
    const roundId = -Date.now();
    async function request(user, path, body) {
      const req = new Request("http://localhost:8889/api/" + path, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          origin: "http://localhost:8889",
          "content-type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const response = await handle(req, async () => user);
      return { status: response.status, data: await response.json() };
    }
    const query = (sql, params = []) => pool.query(sql, params);
    const balances = async () =>
      Number(
        (
          await query(
            "SELECT SUM(balance) AS total FROM accounts WHERE id=ANY($1::text[])",
            [[a.id, b.id]],
          )
        ).rows[0].total,
      );
    try {
      let aa = (await request(a, "me")).data.account;
      let bb = (await request(b, "me")).data.account;
      await t.test("welcome bonus is issued only once", async () => {
        assert.equal(Number(aa.balance), 500);
        await request(a, "me");
        assert.equal(
          Number(
            (
              await query("SELECT COUNT(*) AS n FROM ledger WHERE user_id=$1", [
                a.id,
              ])
            ).rows[0].n,
          ),
          1,
        );
      });
      await t.test(
        "the verified Google email reuses its existing game account",
        async () => {
          const responses = await Promise.all([
            request(a, "me"),
            request(alternateLogin, "me"),
          ]);
          assert.ok(responses.every((response) => response.status === 200));
          assert.equal(responses[0].data.account.id, a.id);
          assert.equal(responses[1].data.account.id, a.id);
          assert.equal(
            Number(
              (
                await query(
                  "SELECT COUNT(*) AS n FROM accounts WHERE lower(google_email)=lower($1)",
                  [a.email],
                )
              ).rows[0].n,
            ),
            1,
          );
        },
      );
      await t.test(
        "new accounts choose a public username before continuing",
        async () => {
          assert.equal(aa.username_set, false);
          const response = await request(a, "account/username", {
            username: "Court " + suffix,
          });
          assert.equal(response.status, 200);
          assert.equal(response.data.account.username, "Court " + suffix);
          assert.equal(response.data.account.username_set, true);
          aa = response.data.account;
        },
      );
      await t.test(
        "username changes reject duplicates without changing the saved name",
        async () => {
          const response = await request(a, "account/username", {
            username: bb.username,
          });
          assert.equal(response.status, 409);
          assert.equal(
            (await request(a, "me")).data.account.username,
            aa.username,
          );
        },
      );
      await t.test(
        "pack upgrades charge £450 then £550 and batch-open three packs together",
        async () => {
          await request(batchUser, "me");
          await query("UPDATE accounts SET balance=200000 WHERE id=$1", [batchUser.id]);
          const secondSlot = await request(batchUser, "upgrades/pack-opening", { pack_slots: 2 });
          assert.equal(secondSlot.status, 200);
          assert.equal(secondSlot.data.account.pack_slots, 2);
          assert.equal(Number(secondSlot.data.account.balance), 155000);
          assert.equal((await request(batchUser, "open", { pack: "brainrot", quantity: 3 })).status, 409);
          const thirdSlot = await request(batchUser, "upgrades/pack-opening", { pack_slots: 3 });
          assert.equal(thirdSlot.status, 200);
          assert.equal(Number(thirdSlot.data.account.balance), 100000);
          const batch = await request(batchUser, "open", { pack: "brainrot", quantity: 3 });
          assert.equal(batch.status, 200);
          assert.equal(batch.data.packCount, 3);
          assert.equal(batch.data.cards.length, 12);
          assert.equal(batch.data.pricePaid, 600);
          assert.equal(Number(batch.data.account.packs), 3);
          assert.equal(Number(batch.data.account.balance), 99400);
        },
      );
      await t.test(
        "index set rewards persist, apply to pack odds, and respect the account caps",
        async () => {
          await request(indexUser, "me");
          const allSetCards = indexSets.flatMap((set) => set.cardIds);
          await query("UPDATE accounts SET character_index=$2::text[] WHERE id=$1", [indexUser.id, allSetCards]);
          for (let index = 0; index < 4; index++) {
            const epic = await request(indexUser, "index/claim", {
              set_id: indexSets[index].id,
              reward: "epic",
            });
            assert.equal(epic.status, 200);
          }
          assert.equal(
            (await request(indexUser, "me")).data.account.permanent_epic_bonus,
            2000000,
          );
          assert.equal(
            (await request(indexUser, "index/claim", {
              set_id: indexSets[4].id,
              reward: "epic",
            })).status,
            409,
          );
          for (let index = 4; index < 8; index++) {
            const crown = await request(indexUser, "index/claim", {
              set_id: indexSets[index].id,
              reward: "crown",
            });
            assert.equal(crown.status, 200);
          }
          assert.equal(
            (await request(indexUser, "me")).data.account.permanent_crown_bonus,
            400000,
          );
          assert.equal(
            (await request(indexUser, "index/claim", {
              set_id: indexSets[8].id,
              reward: "crown",
            })).status,
            409,
          );
          const badge = await request(indexUser, "index/claim", { set_id: indexSets[8].id, reward: "badge" });
          assert.equal(badge.status, 200);
          assert.equal(badge.data.account.set_rewards[indexSets[8].id], "badge");
          const balanceBeforeCash = Number((await request(indexUser, "me")).data.account.balance);
          const cash = await request(indexUser, "index/claim", { set_id: indexSets[9].id, reward: "cash" });
          assert.equal(cash.status, 200);
          assert.equal(Number(cash.data.cash), indexSets[9].cashReward);
          assert.equal(Number(cash.data.account.balance), balanceBeforeCash + indexSets[9].cashReward);
          assert.equal(cash.data.account.set_rewards[indexSets[9].id], "cash");
          assert.equal((await request(indexUser, "index/claim", { set_id: indexSets[9].id, reward: "cash" })).status, 409);
        },
      );
      await t.test(
        "daily quest claims are validated server-side and pay exactly once",
        async () => {
          await request(questUser, "me");
          assert.equal(
            (await request(questUser, "quests/claim", { quest: "open-1" })).status,
            409,
          );
          const today = new Date().toISOString().slice(0, 10);
          await query("UPDATE accounts SET quest_state=$2::jsonb WHERE id=$1", [
            questUser.id,
            JSON.stringify({
              day: today,
              progress: { packs: 3, epic: 1, sold: 3 },
              claimed: [],
            }),
          ]);
          const first = await request(questUser, "quests/claim", { quest: "open-1" });
          assert.equal(first.status, 200);
          assert.equal(Number(first.data.reward), 100);
          assert.equal(Number(first.data.account.balance), 600);
          assert.equal(
            (await request(questUser, "quests/claim", { quest: "open-1" })).status,
            409,
          );
          for (const quest of ["open-3", "epic-hunt", "sell-3"]) {
            assert.equal(
              (await request(questUser, "quests/claim", { quest })).status,
              200,
            );
          }
          assert.equal(Number((await request(questUser, "me")).data.account.balance), 925);
          assert.equal(
            Number(
              (
                await query(
                  "SELECT COUNT(*) AS n FROM ledger WHERE user_id=$1 AND description LIKE 'Daily quest:%'",
                  [questUser.id],
                )
              ).rows[0].n,
            ),
            4,
          );
        },
      );
      await t.test(
        "the Secret window rolls once per UTC day and Crown cards set the chance",
        async () => {
          await request(secretUser, "me");
          const crowns = Object.values(cardMap)
            .filter((card) => card.rarity === "Crown")
            .slice(0, 4);
          assert.equal(crowns.length, 4);
          const equipped = [];
          for (const card of crowns) {
            const row = await query(
              "INSERT INTO inventory(owner_id,template_id,value,rarity) VALUES ($1,$2,$3,$4) RETURNING id",
              [secretUser.id, card.id, card.value, card.rarity],
            );
            equipped.push(row.rows[0].id);
          }
          await query(
            "UPDATE accounts SET balance=20000, loadout=$2::int[], secret_day='' WHERE id=$1",
            [secretUser.id, equipped],
          );
          const first = await request(secretUser, "open", { pack: "world" });
          assert.equal(first.status, 200);
          assert.equal(first.data.secretWindow, true);
          assert.equal(Number(first.data.secretChance), 3200);
          const second = await request(secretUser, "open", { pack: "world" });
          assert.equal(second.status, 200);
          assert.equal(second.data.secretWindow, false);
          assert.equal(Number(second.data.secretChance), 0);
          assert.equal(Number(second.data.account.balance), 18000);
        },
      );
      await t.test(
        "authentication boundary rejects absent or expired Identity sessions",
        async () => {
          assert.equal((await request(null, "me")).status, 401);
          assert.equal(
            (await request(null, "open", { pack: "brainrot" })).status,
            401,
          );
        },
      );
      await t.test(
        "friends reject self and unknown codes, then allow a real friend",
        async () => {
          assert.equal(
            (await request(a, "friends/add", { code: aa.friend_code })).status,
            400,
          );
          assert.equal(
            (await request(a, "friends/add", { code: "ZZZZZZ" })).status,
            404,
          );
          assert.equal(
            (await request(a, "friends/add", { code: bb.friend_code })).status,
            200,
          );
        },
      );
      await t.test(
        "pack purchase inserts cards and debits exactly its integer-pence price",
        async () => {
          const result = await request(a, "open", { pack: "brainrot" });
          assert.equal(result.status, 200);
          assert.equal(result.data.cards.length, 4);
          assert.equal(Number(result.data.account.balance), 400);
          const persisted = (
            await query(
              "SELECT * FROM inventory WHERE owner_id=$1 ORDER BY id",
              [a.id],
            )
          ).rows;
          assert.equal(persisted.length, 4);
          assert.deepEqual(
            persisted.map((card) => card.id),
            result.data.cards.map((card) => card.id),
          );
          for (const card of persisted) {
            assert.equal(Number(card.value), cardMap[card.template_id].value);
            assert.equal(card.rarity, cardMap[card.template_id].rarity);
          }
        },
      );
      await t.test(
        "fourth loadout slot unlocks once and discounts every third pack by 10p",
        async () => {
          const discountTemplate = Object.values(cardMap).find(
            (card) => cardPowerup(card).packDiscount === 10,
          );
          assert.ok(discountTemplate);
          const discountCard = (
            await query(
              "INSERT INTO inventory(owner_id,template_id,value,rarity) VALUES($1,$2,$3,$4) RETURNING *",
              [
                a.id,
                discountTemplate.id,
                discountTemplate.value,
                discountTemplate.rarity,
              ],
            )
          ).rows[0];
          const ownedIds = (
            await query(
              "SELECT id FROM inventory WHERE owner_id=$1 ORDER BY id",
              [a.id],
            )
          ).rows.map((row) => row.id);
          assert.equal(ownedIds.length, 5);
          assert.equal(
            (await request(a, "loadout", { ids: ownedIds.slice(0, 4) })).status,
            400,
          );

          await query("UPDATE accounts SET balance=50000 WHERE id=$1", [a.id]);
          const unlocked = await request(a, "loadout/upgrade", {});
          assert.equal(unlocked.status, 200);
          assert.equal(unlocked.data.account.loadout_slots, 4);
          assert.equal(Number(unlocked.data.account.balance), 10000);
          assert.equal((await request(a, "loadout/upgrade", {})).status, 409);
          assert.equal(
            Number((await request(a, "me")).data.account.balance),
            10000,
          );
          assert.equal(
            (
              await request(a, "loadout", {
                ids: ownedIds.slice(0, 4),
              })
            ).status,
            200,
          );
          await query("UPDATE accounts SET packs=2 WHERE id=$1", [a.id]);
          const undiscounted = await request(a, "open", {
            pack: "brainrot",
          });
          assert.equal(undiscounted.status, 200);
          assert.equal(undiscounted.data.discount, 0);
          assert.equal(Number(undiscounted.data.account.balance), 9900);

          assert.equal(
            (await request(a, "loadout", { ids: [discountCard.id] })).status,
            200,
          );
          await query("UPDATE accounts SET packs=2 WHERE id=$1", [a.id]);
          const discounted = await request(a, "open", { pack: "brainrot" });
          assert.equal(discounted.status, 200);
          assert.equal(discounted.data.discount, 10);
          assert.equal(Number(discounted.data.account.packs), 3);
          assert.equal(Number(discounted.data.account.balance), 9810);
        },
      );
      await t.test(
        "starter reward grants one free card once and does not count as a paid pack",
        async () => {
          const before = (await request(a, "me")).data.account;
          const claim = await request(a, "rewards/starter", {});
          assert.equal(claim.status, 200);
          assert.ok(
            ["brainrot", "royal", "world"].includes(claim.data.card.set),
          );
          assert.ok(
            ["Common", "Uncommon", "Epic", "Crown"].includes(
              claim.data.card.rarity,
            ),
          );
          assert.equal(claim.data.account.starter_claimed, true);
          assert.equal(Number(claim.data.account.packs), Number(before.packs));
          assert.equal(
            Number(claim.data.account.balance),
            Number(before.balance),
          );
          assert.equal((await request(a, "rewards/starter", {})).status, 409);
          assert.equal(
            Number(
              (
                await query(
                  "SELECT COUNT(*) AS n FROM inventory WHERE owner_id=$1",
                  [a.id],
                )
              ).rows[0].n,
            ),
            14,
          );
        },
      );
      await t.test(
        "daily spin pays its recorded prize once per UTC day",
        async () => {
          const before = Number((await request(a, "me")).data.account.balance);
          const spin = await request(a, "rewards/spin", {});
          assert.equal(spin.status, 200);
          assert.equal(
            spin.data.account.spin_day,
            new Date().toISOString().slice(0, 10),
          );
          assert.equal(
            Number(spin.data.account.balance),
            before + spin.data.prize.reward,
          );
          assert.equal((await request(a, "rewards/spin", {})).status, 409);
        },
      );
      await t.test(
        "equipped Kim improves packs and cannot be sold or vaulted",
        async () => {
          const kim = (
            await query(
              "INSERT INTO inventory(owner_id,template_id,value,rarity) VALUES($1,$2,$3,'Chase') RETURNING *",
              [a.id, cardMap.kim.id, cardMap.kim.value],
            )
          ).rows[0];
          try {
            const equipped = await request(a, "loadout", { ids: [kim.id] });
            assert.equal(equipped.status, 200);
            assert.deepEqual(equipped.data.account.loadout, [kim.id]);
            assert.equal(
              (await request(a, "sell", { ids: [kim.id] })).status,
              409,
            );
            assert.equal(
              (await request(a, "vault", { id: kim.id })).status,
              409,
            );
            const pack = await request(a, "open", { pack: "brainrot" });
            assert.equal(pack.status, 200);
            assert.ok(
              ["Uncommon", "Epic", "Crown", "Alpha"].includes(
                pack.data.cards[1].rarity,
              ),
            );
            assert.ok(
              ["Uncommon", "Epic", "Crown", "Alpha"].includes(
                pack.data.cards[3].rarity,
              ),
            );
          } finally {
            await request(a, "loadout", { ids: [] });
          }
        },
      );
      const ca = (
        await query(
          "INSERT INTO inventory(owner_id,template_id,value,rarity) VALUES($1,'brainrot-common-0',28,'Common') RETURNING *",
          [a.id],
        )
      ).rows[0];
      const cb = (
        await query(
          "INSERT INTO inventory(owner_id,template_id,value,rarity) VALUES($1,'brainrot-common-1',18,'Common') RETURNING *",
          [b.id],
        )
      ).rows[0];
      const trade = (await request(a, "trades/create", { friend: b.id })).data;
      await t.test(
        "trade reservations prevent sales and vaulting",
        async () => {
          assert.equal(
            (await request(a, "trades/offer", { id: trade.id, ids: [ca.id] }))
              .status,
            200,
          );
          assert.equal(
            (await request(a, "sell", { ids: [ca.id] })).status,
            409,
          );
          assert.equal((await request(a, "vault", { id: ca.id })).status, 409);
        },
      );
      await t.test(
        "confirmations atomically swap both owners once",
        async () => {
          await request(b, "trades/offer", { id: trade.id, ids: [cb.id] });
          await request(a, "trades/confirm", {
            id: trade.id,
            offerA: [ca.id],
            offerB: [cb.id],
          });
          assert.equal(
            (await query("SELECT owner_id FROM inventory WHERE id=$1", [ca.id]))
              .rows[0].owner_id,
            a.id,
          );
          assert.equal(
            (
              await request(b, "trades/confirm", {
                id: trade.id,
                offerA: [ca.id],
                offerB: [cb.id],
              })
            ).status,
            200,
          );
          const cards = (
            await query("SELECT * FROM inventory WHERE id=ANY($1::int[])", [
              [ca.id, cb.id],
            ])
          ).rows;
          assert.equal(cards.find((c) => c.id === ca.id).owner_id, b.id);
          assert.equal(cards.find((c) => c.id === cb.id).owner_id, a.id);
          assert.ok(cards.every((c) => c.trade_id === null));
          assert.equal(
            (
              await request(b, "trades/confirm", {
                id: trade.id,
                offerA: [ca.id],
                offerB: [cb.id],
              })
            ).status,
            409,
          );
        },
      );
      await t.test(
        "mixed-owner bulk sale rolls back the entire operation",
        async () => {
          assert.equal(
            (await request(a, "sell", { ids: [ca.id, cb.id] })).status,
            409,
          );
          assert.equal(
            Number(
              (
                await query(
                  "SELECT COUNT(*) AS n FROM inventory WHERE id=ANY($1::int[])",
                  [[ca.id, cb.id]],
                )
              ).rows[0].n,
            ),
            2,
          );
        },
      );
      await t.test("cancelled trade releases reservations", async () => {
        const tr = (await request(a, "trades/create", { friend: b.id })).data;
        await request(a, "trades/offer", { id: tr.id, ids: [cb.id] });
        await request(b, "trades/cancel", { id: tr.id });
        assert.equal(
          (await query("SELECT trade_id FROM inventory WHERE id=$1", [cb.id]))
            .rows[0].trade_id,
          null,
        );
      });
      await t.test("selling credits exactly the saved card value", async () => {
        const before = Number((await request(a, "me")).data.account.balance);
        const sale = await request(a, "sell", { ids: [cb.id] });
        assert.equal(sale.status, 200);
        assert.equal(Number(sale.data.account.balance), before + 18);
      });
      await t.test("concurrent sales credit one owner only once", async () => {
        const card = (
          await query(
            "INSERT INTO inventory(owner_id,template_id,value,rarity) VALUES($1,'brainrot-common-0',28,'Common') RETURNING id",
            [a.id],
          )
        ).rows[0];
        const before = Number((await request(a, "me")).data.account.balance);
        const results = await Promise.all([
          request(a, "sell", { ids: [card.id] }),
          request(a, "sell", { ids: [card.id] }),
          request(b, "sell", { ids: [card.id] }),
        ]);
        assert.deepEqual(
          results
            .slice(0, 2)
            .map((r) => r.status)
            .sort(),
          [200, 409],
        );
        assert.equal(results[2].status, 409);
        assert.equal(
          Number((await request(a, "me")).data.account.balance),
          before + 28,
        );
      });
      await t.test(
        "penalty sales cannot overdraw and failed sales preserve the card",
        async () => {
          const card = (
            await query(
              "INSERT INTO inventory(owner_id,template_id,value,rarity) VALUES($1,'world-former-keir-starmer',-250,'Common') RETURNING id",
              [a.id],
            )
          ).rows[0];
          const previousBalance = Number(
            (await request(a, "me")).data.account.balance,
          );
          await query("UPDATE accounts SET balance=100 WHERE id=$1", [a.id]);
          await query(
            "INSERT INTO ledger(user_id,amount,balance,reason) VALUES($1,$2,100,'test setup')",
            [a.id, 100 - previousBalance],
          );
          const before = Number((await request(a, "me")).data.account.balance);
          assert.ok(before < 250);
          assert.equal(
            (await request(a, "sell", { ids: [card.id] })).status,
            409,
          );
          assert.equal(
            Number((await request(a, "me")).data.account.balance),
            before,
          );
          assert.equal(
            (await query("SELECT id FROM inventory WHERE id=$1", [card.id]))
              .rows.length,
            1,
          );
        },
      );
      await t.test(
        "unjoined private table refunds once at expiry",
        async () => {
          const before = Number((await request(a, "me")).data.account.balance);
          const table = (await request(a, "tables/create", { stake: 10 })).data;
          await query(
            "UPDATE friend_tables SET ends_at=NOW()-INTERVAL '1 second' WHERE id=$1",
            [table.id],
          );
          await request(a, "me");
          await request(a, "me");
          assert.equal(
            Number((await request(a, "me")).data.account.balance),
            before,
          );
        },
      );
      await t.test(
        "matched private table pays two stakes with no house subsidy",
        async () => {
          const before = await balances();
          const table = (await request(a, "tables/create", { stake: 10 })).data;
          assert.equal(
            (await request(b, "tables/join", { code: table.code })).status,
            200,
          );
          assert.equal(await balances(), before - 20);
          await query(
            "UPDATE friend_tables SET ends_at=NOW()-INTERVAL '1 second' WHERE id=$1",
            [table.id],
          );
          await request(a, "me");
          assert.equal(await balances(), before);
          const row = (
            await query("SELECT * FROM friend_tables WHERE id=$1", [table.id])
          ).rows[0];
          assert.ok([a.id, b.id].includes(row.winner_id));
          await request(b, "me");
          assert.equal(await balances(), before);
        },
      );
      await t.test(
        "concurrent purchases honor one tenth-pack milestone and reject browser overrides",
        async () => {
          await request(milestoneUser, "me");
          await query("UPDATE accounts SET packs=9 WHERE id=$1", [
            milestoneUser.id,
          ]);
          assert.equal(
            (await request(milestoneUser, "open", { pack: "apex" })).status,
            409,
          );
          assert.equal(
            Number((await request(milestoneUser, "me")).data.account.packs),
            9,
          );
          const purchases = await Promise.all([
            request(milestoneUser, "open", {
              pack: "brainrot",
              epicGuaranteed: false,
              packs: 0,
            }),
            request(milestoneUser, "open", {
              pack: "brainrot",
              epicGuaranteed: true,
              packs: 9,
            }),
          ]);
          assert.ok(purchases.every((result) => result.status === 200));
          const guaranteed = purchases.filter(
            (result) => result.data.epicGuaranteed,
          );
          assert.equal(guaranteed.length, 1);
          assert.ok(
            guaranteed[0].data.cards.some((card) =>
              ["Epic", "Crown", "Chase", "Alpha"].includes(card.rarity),
            ),
          );
          const after = (await request(milestoneUser, "me")).data.account;
          assert.equal(Number(after.packs), 11);
          assert.equal(Number(after.balance), 300);
          assert.equal(
            (await request(milestoneUser, "open", { pack: "apex" })).status,
            409,
          );
          assert.equal(
            Number((await request(milestoneUser, "me")).data.account.packs),
            11,
          );
        },
      );
      await t.test("global pot pays its full total exactly once", async () => {
        await query(
          "INSERT INTO rounds(id,ends_at,total) VALUES($1,NOW()-INTERVAL '1 second',4)",
          [roundId],
        );
        await query(
          "INSERT INTO wagers(round_id,user_id,amount) VALUES($1,$2,1),($1,$3,3)",
          [roundId, a.id, b.id],
        );
        const before = await balances();
        await request(a, "me");
        assert.equal(await balances(), before + 4);
        await request(b, "me");
        assert.equal(await balances(), before + 4);
        const round = (
          await query("SELECT * FROM rounds WHERE id=$1", [roundId])
        ).rows[0];
        assert.ok(round.settled);
        assert.ok([a.id, b.id].includes(round.winner_id));
      });
      await t.test(
        "global pot instantly matches a solo player and removes the bot when a second player joins",
        async (t) => {
          const current = (await request(a, "pot")).data;
          const rid = Number(current.round.id);
          const existingWagers = Number(
            (
              await query(
                "SELECT COUNT(*) AS n FROM wagers WHERE round_id=$1",
                [rid],
              )
            ).rows[0].n,
          );
          if (
            existingWagers ||
            new Date(current.round.ends_at).getTime() - Date.now() < 30000
          )
            return t.skip("The live test round is occupied or nearly over.");

          const solo = await request(a, "wager", {
            amount: 100,
            round: rid,
          });
          assert.equal(solo.status, 200);
          assert.equal(Number(solo.data.round.total), 200);
          assert.deepEqual(
            Object.fromEntries(
              solo.data.entrants.map((entry) => [
                entry.user_id,
                Number(entry.amount),
              ]),
            ),
            { [a.id]: 100, "system-pot-bot": 100 },
          );

          const joined = await request(b, "wager", {
            amount: 50,
            round: rid,
          });
          assert.equal(joined.status, 200);
          assert.equal(Number(joined.data.round.total), 150);
          assert.ok(joined.data.entrants.every((entry) => !entry.bot));
          assert.deepEqual(
            joined.data.entrants.map((entry) => [
              entry.user_id,
              Number(entry.amount),
            ]),
            [
              [a.id, 100],
              [b.id, 50],
            ],
          );
        },
      );
    } finally {
      const users = [a.id, b.id, alternateLogin.id, milestoneUser.id, batchUser.id, indexUser.id, questUser.id, secretUser.id];
      await query("DELETE FROM inventory WHERE owner_id=ANY($1::text[])", [
        users,
      ]);
      await query(
        "DELETE FROM trades WHERE user_a=ANY($1::text[]) OR user_b=ANY($1::text[])",
        [users],
      );
      await query("DELETE FROM wagers WHERE user_id=ANY($1::text[])", [users]);
      await query("DELETE FROM rounds WHERE id=$1", [roundId]);
      await query(
        "DELETE FROM friend_tables WHERE host_id=ANY($1::text[]) OR guest_id=ANY($1::text[])",
        [users],
      );
      await query(
        "DELETE FROM friends WHERE user_a=ANY($1::text[]) OR user_b=ANY($1::text[])",
        [users],
      );
      await query("DELETE FROM ledger WHERE user_id=ANY($1::text[])", [users]);
      await query("DELETE FROM accounts WHERE id=ANY($1::text[])", [users]);
    }
  },
);
