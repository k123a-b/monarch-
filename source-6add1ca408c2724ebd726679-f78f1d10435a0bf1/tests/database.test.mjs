import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { cardMap } from "../shared/catalog.mjs";

// Uses a dedicated configured database, never a mocked SQL implementation.
test(
  "transactional economy integration",
  { skip: process.env.CARD_MONARCHS_DATABASE_TESTS !== "1" },
  async (t) => {
    const { handle } = await import("../server/game.ts");
    const { pool: getPool } = await import("../db/index.ts");
    const pool = getPool();
    const suffix = randomUUID().slice(0, 8);
    const a = { id: randomUUID(), name: "Test Monarch " + suffix },
      b = { id: randomUUID(), name: "Test Courtier " + suffix };
    const milestoneUser = {
      id: randomUUID(),
      name: "Test Milestone " + suffix,
    };
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
              "INSERT INTO inventory(owner_id,template_id,value,rarity) VALUES($1,'world-former-keir-starmer',-2500,'Common') RETURNING id",
              [a.id],
            )
          ).rows[0];
          const before = Number((await request(a, "me")).data.account.balance);
          assert.ok(before < 2500);
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
    } finally {
      const users = [a.id, b.id, milestoneUser.id];
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
