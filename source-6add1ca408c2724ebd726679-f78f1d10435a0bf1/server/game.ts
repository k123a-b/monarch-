import { randomInt, randomBytes } from "node:crypto";
import {
  packs,
  cardMap,
  rollPack,
  rollStarterPack,
  weightedWinner,
  packProgress,
  loadoutPowerup,
  indexSets,
  SET_EPIC_REWARD,
  SET_CROWN_REWARD,
  SET_EPIC_CAP,
  SET_CROWN_CAP,
  secretPackDiscount,
} from "../shared/catalog.mjs";
import { database, pool, databaseTarget } from "../db/index.js";
import { accounts, inventory } from "../db/schema.js";
import { sessionUser, type SessionUser } from "./session.js";
import { eq, desc, inArray } from "drizzle-orm";

import {
  activityReward,
  dailySpin,
  validTradeCards,
  validFriendCode,
  validUsername,
  friendTablePayout,
  giftLimits,
  giftQuotaLeft,
  validGiftAmount,
  matchedPotBotStake,
  FRIEND_ALPHABET,
  randomBelow,
  addQuestProgress,
  completeDailyQuest,
} from "../shared/rules.mjs";

type Client = any;
class GameError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
const fail = (message: string, status = 400): never => {
  throw new GameError(message, status);
};
const code = () =>
  Array.from(
    randomBytes(6),
    (b) => FRIEND_ALPHABET[b % FRIEND_ALPHABET.length],
  ).join("");
const POT_BOT_ID = "system-pot-bot";
const integer = (v: any, min = 1, max = 1e12) =>
  Number.isSafeInteger(v) && v >= min && v <= max
    ? v
    : fail("Enter a valid whole-pence amount.");
const ids = (v: any) =>
  Array.isArray(v) &&
  v.length <= 200 &&
  v.every((n) => Number.isSafeInteger(n) && n > 0)
    ? ([...new Set(v)] as number[])
    : fail("Select up to 200 valid cards.");
async function change(c: Client, id: string, amount: number, reason: string) {
  const q = await c.query(
    "UPDATE accounts SET balance=balance+$2 WHERE id=$1 AND balance+$2>=0 RETURNING balance",
    [id, amount],
  );
  if (!q.rows.length) fail("Not enough virtual cash.", 409);
  await c.query(
    "INSERT INTO ledger(user_id,amount,balance,reason) VALUES($1,$2,$3,$4)",
    [id, amount, q.rows[0].balance, reason],
  );
}
async function recordQuestProgress(
  c: Client,
  id: string,
  day: string,
  metric: string,
  amount: number,
) {
  if (amount <= 0) return;
  const current = (
    await c.query("SELECT quest_state FROM accounts WHERE id=$1", [id])
  ).rows[0]?.quest_state;
  const next = addQuestProgress(current, day, metric, amount);
  await c.query("UPDATE accounts SET quest_state=$2::jsonb WHERE id=$1", [
    id,
    JSON.stringify(next),
  ]);
}
async function areFriends(c: Client, a: string, b: string) {
  const q = await c.query(
    "SELECT id FROM friends WHERE (user_a=$1 AND user_b=$2) OR (user_a=$2 AND user_b=$1)",
    [a, b],
  );
  return q.rows.length > 0;
}
async function giftsToday(c: Client, id: string) {
  const q = await c.query(
    "SELECT COUNT(*)::int AS n FROM ledger WHERE user_id=$1 AND reason LIKE 'Gift sent to %' AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'",
    [id],
  );
  return Number(q.rows[0]?.n) || 0;
}
async function ensurePotBot(c: Client) {
  const existing = await c.query("SELECT id FROM accounts WHERE id=$1", [
    POT_BOT_ID,
  ]);
  if (existing.rows.length) {
    await c.query("UPDATE accounts SET bot=true WHERE id=$1", [POT_BOT_ID]);
    return POT_BOT_ID;
  }
  let username = "Pot Bot";
  if (
    (
      await c.query("SELECT id FROM accounts WHERE lower(username)=lower($1)", [
        username,
      ])
    ).rows.length
  )
    username = `Pot Bot ${code()}`;
  await c.query(
    "INSERT INTO accounts(id,username,friend_code,bot,balance) VALUES($1,$2,$3,true,0) ON CONFLICT(id) DO NOTHING",
    [POT_BOT_ID, username, code()],
  );
  return POT_BOT_ID;
}
async function transact<T>(fn: (c: Client) => Promise<T>, readOnly = false) {
  const c = await pool().connect();
  try {
    await c.query(
      readOnly ? "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY" : "BEGIN",
    );
    await c.query(
      "SELECT set_config('lock_timeout','5s',true),set_config('statement_timeout','15s',true)",
    );
    const r = await fn(c);
    await c.query("COMMIT");
    return r;
  } catch (e) {
    await c.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}
export async function settle(c: Client) {
  const now = new Date();
  const expired = await c.query(
    "SELECT * FROM rounds WHERE ends_at<=$1 AND settled=false ORDER BY id FOR UPDATE SKIP LOCKED",
    [now],
  );
  for (const round of expired.rows) {
    const entries = (
      await c.query("SELECT user_id,amount FROM wagers WHERE round_id=$1", [
        round.id,
      ])
    ).rows;
    const total = entries.reduce((sum: number, entry: any) => {
      const amount = Number(entry.amount);
      if (!Number.isSafeInteger(amount) || amount < 1)
        fail("The pot contains an invalid contribution.");
      return sum + amount;
    }, 0);
    if (!Number.isSafeInteger(total))
      fail("The pot total is too large to settle.");
    const winner = weightedWinner(entries, (max: number) =>
      randomBelow(max, randomBytes),
    );
    if (winner) await change(c, winner, total, `Global pot #${round.id} won`);
    await c.query(
      "UPDATE rounds SET settled=true,winner_id=$2,total=$3 WHERE id=$1",
      [round.id, winner, total],
    );
  }
  for (const table of (
    await c.query(
      "SELECT * FROM friend_tables WHERE ends_at<=$1 AND settled=false ORDER BY id FOR UPDATE SKIP LOCKED",
      [now],
    )
  ).rows) {
    const winner = table.guest_id
      ? randomInt(2)
        ? table.host_id
        : table.guest_id
      : null;
    await change(
      c,
      winner || table.host_id,
      friendTablePayout(Number(table.stake), Boolean(winner)),
      winner
        ? `Friend table ${table.code} won`
        : `Friend table ${table.code} expired: refund`,
    );
    await c.query(
      "UPDATE friend_tables SET settled=true,winner_id=$2 WHERE id=$1",
      [table.id, winner],
    );
  }
}
export async function settleRounds() {
  return transact(async (c) => {
    await settle(c);
    await pot(c);
  });
}
async function ensureAccount(c: Client, user: SessionUser) {
  const email = user.email?.trim().toLowerCase() || null;
  await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
    email ? `google:${email}` : `subject:${user.id}`,
  ]);
  if (email) {
    const linked = (
      await c.query(
        "SELECT * FROM accounts WHERE lower(google_email)=lower($1)",
        [email],
      )
    ).rows[0];
    if (linked) return linked;
  }
  const existing = (
    await c.query("SELECT * FROM accounts WHERE id=$1", [user.id])
  ).rows[0];
  if (existing) {
    if (email && existing.google_email !== email) {
      await c.query("UPDATE accounts SET google_email=$2 WHERE id=$1", [
        user.id,
        email,
      ]);
      return (await c.query("SELECT * FROM accounts WHERE id=$1", [user.id]))
        .rows[0];
    }
    return existing;
  }
  let name =
    String(user.name || "Monarch")
      .replace(/[^a-zA-Z0-9_ -]/g, "")
      .trim()
      .slice(0, 24) || "Monarch";
  const baseName = name.slice(0, 16);
  let availableName = false;
  for (let attempt = 0; attempt < 5; attempt++) {
    await c.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      `username:${name.toLowerCase()}`,
    ]);
    const taken = await c.query(
      "SELECT id FROM accounts WHERE lower(username)=lower($1)",
      [name],
    );
    if (!taken.rows.length) {
      availableName = true;
      break;
    }
    name = `${baseName} ${code()}`;
  }
  if (!availableName) throw new Error("Could not reserve a unique username.");
  const a = (
    await c.query(
      "INSERT INTO accounts(id,google_email,username,friend_code) VALUES($1,$2,$3,$4) RETURNING *",
      [user.id, email, name, code()],
    )
  ).rows[0];
  await c.query(
    "INSERT INTO ledger(user_id,amount,balance,reason) VALUES($1,500,500,'Welcome to the court')",
    [user.id],
  );
  return a;
}
async function pot(c: Client) {
  const rid = Math.floor(Date.now() / 600000);
  await c.query(
    "INSERT INTO rounds(id,ends_at) VALUES($1,$2) ON CONFLICT DO NOTHING",
    [rid, new Date((rid + 1) * 600000)],
  );
  await c.query("SELECT id FROM rounds WHERE id=$1 FOR UPDATE", [rid]);
  const contributors = (
    await c.query(
      "SELECT w.user_id,SUM(w.amount)::bigint AS amount FROM wagers w JOIN accounts a ON a.id=w.user_id WHERE w.round_id=$1 AND a.bot=false GROUP BY w.user_id",
      [rid],
    )
  ).rows;
  const botStake = matchedPotBotStake(contributors);
  const botAccount = await c.query("SELECT id FROM accounts WHERE id=$1", [
    POT_BOT_ID,
  ]);
  if (botStake) {
    const botId = await ensurePotBot(c);
    await c.query("DELETE FROM wagers WHERE round_id=$1 AND user_id=$2", [
      rid,
      botId,
    ]);
    await c.query(
      "INSERT INTO wagers(round_id,user_id,amount) VALUES($1,$2,$3)",
      [rid, botId, botStake],
    );
  } else if (botAccount.rows.length) {
    await c.query("DELETE FROM wagers WHERE round_id=$1 AND user_id=$2", [
      rid,
      POT_BOT_ID,
    ]);
  }
  const total = (
    await c.query(
      "SELECT COALESCE(SUM(amount),0)::bigint AS total FROM wagers WHERE round_id=$1",
      [rid],
    )
  ).rows[0].total;
  await c.query("UPDATE rounds SET total=$2 WHERE id=$1", [rid, total]);
  return {
    round: (await c.query("SELECT * FROM rounds WHERE id=$1", [rid])).rows[0],
    entrants: (
      await c.query(
        "SELECT a.username,a.bot,w.user_id,SUM(w.amount)::bigint AS amount FROM wagers w JOIN accounts a ON a.id=w.user_id WHERE w.round_id=$1 GROUP BY w.user_id,a.username,a.bot ORDER BY amount DESC",
        [rid],
      )
    ).rows,
    history: (
      await c.query(
        "SELECT r.*,a.username FROM rounds r LEFT JOIN accounts a ON a.id=r.winner_id WHERE r.settled=true AND r.total>0 ORDER BY r.id DESC LIMIT 10",
      )
    ).rows,
    serverTime: Date.now(),
  };
}
export async function handle(
  req: Request,
  readUser: (req: Request) => Promise<SessionUser | null> = sessionUser,
) {
  const url = new URL(req.url),
    route = url.pathname.replace(/^\/api\/?/, "");
  try {
    if (!["GET", "POST"].includes(req.method))
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    if (req.method === "POST" && req.headers.get("origin") !== url.origin)
      fail("This request must come from Card Monarchs.", 403);
    if (route === "pot" && req.method === "GET")
      return Response.json(
        await transact(async (c) => {
          await settle(c);
          return pot(c);
        }),
      );
    if (route === "recent" && req.method === "GET")
      return Response.json(
        await database()
          .select({
            template_id: inventory.templateId,
            rarity: inventory.rarity,
            created_at: inventory.createdAt,
            username: accounts.username,
          })
          .from(inventory)
          .innerJoin(accounts, eq(inventory.ownerId, accounts.id))
          .where(inArray(inventory.rarity, ["Epic", "Crown", "Alpha", "Chase"]))
          .orderBy(desc(inventory.id))
          .limit(12),
      );
    if (route === "leaderboards" && req.method === "GET") {
      const board = url.searchParams.get("board") || "wealth";
      const metrics = {
        wealth: "a.balance+COALESCE(SUM(i.value),0)",
        seller: "a.sold",
        packs: "a.packs",
        cards: "a.pulled",
        alpha: "COUNT(i.id) FILTER (WHERE i.rarity='Alpha')",
      };
      if (!Object.hasOwn(metrics, board)) fail("Unknown leaderboard.");
      const metric = metrics[board as keyof typeof metrics];
      const viewer = await readUser(req);
      return Response.json(
        await transact(async (c) => {
          const viewerId = viewer
            ? (
                await c.query(
                  "SELECT id FROM accounts WHERE id=$1 OR lower(google_email)=lower($2) ORDER BY (lower(google_email)=lower($2)) DESC LIMIT 1",
                  [viewer.id, viewer.email || null],
                )
              ).rows[0]?.id || viewer.id
            : "";
          return (
            await c.query(
              `WITH scores AS (SELECT a.id,a.username,a.created_at,${metric} AS score FROM accounts a LEFT JOIN inventory i ON i.owner_id=a.id WHERE a.bot=false GROUP BY a.id),ranked AS (SELECT *,ROW_NUMBER() OVER(ORDER BY score DESC,created_at ASC) AS rank FROM scores) SELECT id,username,score,rank FROM ranked WHERE rank<=100 OR id=$1 ORDER BY rank`,
              [viewerId],
            )
          ).rows;
        }, true),
      );
    }
    const user = await readUser(req);
    if (!user) throw new GameError("Sign in to enter the court.", 401);
    const authenticatedUser: SessionUser = user;
    let body: any = {};
    if (req.method === "POST") {
      try {
        body = await req.json();
      } catch {
        fail("Send a valid JSON object.");
      }
      if (body === null || Array.isArray(body) || typeof body !== "object")
        fail("Send a valid JSON object.");
    }
    return Response.json(
      await transact(async (c) => {
        const player = await ensureAccount(c, authenticatedUser);
        await settle(c);
        const id = player.id;
        await c.query("SELECT id FROM accounts WHERE id=$1 FOR UPDATE", [id]);
        const account = async () =>
          (await c.query("SELECT * FROM accounts WHERE id=$1", [id])).rows[0];
        if (route === "me" && req.method === "GET")
          return {
            account: await account(),
            inventory: (
              await c.query(
                "SELECT * FROM inventory WHERE owner_id=$1 ORDER BY id DESC",
                [id],
              )
            ).rows,
          };
        if (route === "account/username" && req.method === "POST") {
          const username =
            typeof body.username === "string" ? body.username.trim() : "";
          if (!validUsername(username))
            fail(
              "Choose a username with 3–24 letters, numbers, spaces, _ or -.",
            );
          await c.query(
            "SELECT pg_advisory_xact_lock(hashtextextended($1,0))",
            [`username:${username.toLowerCase()}`],
          );
          const taken = await c.query(
            "SELECT id FROM accounts WHERE lower(username)=lower($1) AND id<>$2",
            [username, id],
          );
          if (taken.rows.length) fail("That username is already taken.", 409);
          await c.query(
            "UPDATE accounts SET username=$2,username_set=true WHERE id=$1",
            [id, username],
          );
          return { account: await account() };
        }
        if (route === "loadout" && req.method === "POST") {
          const selected = ids(body.ids);
          const currentAccount = await account();
          const slotLimit = Number(currentAccount.loadout_slots || 3);
          if (selected.length > slotLimit)
            fail(
              `Your loadout has ${slotLimit} slots. Unlock the fourth slot to equip another card.`,
            );
          if (
            Array.isArray(body.ids) &&
            new Set(body.ids).size !== body.ids.length
          )
            fail("Each loadout card can only be selected once.");
          const owned = selected.length
            ? (
                await c.query(
                  "SELECT id FROM inventory WHERE owner_id=$1 AND id=ANY($2::int[]) AND vaulted=false AND trade_id IS NULL",
                  [id, selected],
                )
              ).rows
            : [];
          if (owned.length !== selected.length)
            fail("Loadout cards must be available in your collection.", 409);
          await c.query("UPDATE accounts SET loadout=$2::int[] WHERE id=$1", [
            id,
            selected,
          ]);
          return { account: await account() };
        }
        if (route === "loadout/upgrade" && req.method === "POST") {
          const currentAccount = await account();
          const slots = Number(currentAccount.loadout_slots || 3);
          if (slots >= 5) fail("All five loadout slots are unlocked.", 409);
          const nextSlots = slots + 1;
          const cost = nextSlots === 4 ? 40000 : 50000;
          await change(c, id, -cost, "Unlocked loadout slot " + nextSlots);
          await c.query("UPDATE accounts SET loadout_slots=$2 WHERE id=$1", [id, nextSlots]);
          return { account: await account() };
        }
        if (route === "index/claim" && req.method === "POST") {
          const set = indexSets.find((entry) => entry.id === body.set_id);
          if (!set) fail("Unknown character index set.", 404);
          const current = await account();
          const discovered = new Set(current.character_index || []);
          if (!set.cardIds.every((cardId: string) => discovered.has(cardId)))
            fail("Discover every card in this set before claiming its reward.", 409);
          const setRewards = current.set_rewards || {};
          if (setRewards[set.id]) fail("This set reward has already been claimed.", 409);
          const epicBonus = Number(current.permanent_epic_bonus || 0);
          const crownBonus = Number(current.permanent_crown_bonus || 0);
          const epicRoom = SET_EPIC_CAP - epicBonus;
          const crownRoom = SET_CROWN_CAP - crownBonus;
          if (body.reward === "epic") {
            if (epicRoom < SET_EPIC_REWARD) fail(`Your permanent Epic bonus is at its +${(SET_EPIC_CAP / 1000000).toFixed(2)}% limit. Claim Crown or the set badge instead.`, 409);
            await c.query("UPDATE accounts SET permanent_epic_bonus=permanent_epic_bonus+$3,set_rewards=COALESCE(set_rewards,'{}'::jsonb)||jsonb_build_object($2::text,'epic') WHERE id=$1", [id, set.id, SET_EPIC_REWARD]);
          } else if (body.reward === "crown") {
            if (crownRoom < SET_CROWN_REWARD) fail(`Your permanent Crown bonus is at its +${(SET_CROWN_CAP / 1000000).toFixed(2)}% limit. Claim Epic or the set badge instead.`, 409);
            await c.query("UPDATE accounts SET permanent_crown_bonus=permanent_crown_bonus+$3,set_rewards=COALESCE(set_rewards,'{}'::jsonb)||jsonb_build_object($2::text,'crown') WHERE id=$1", [id, set.id, SET_CROWN_REWARD]);
          } else if (body.reward === "cash") {
            // Once both permanent caps are full, a completed set pays cash
            // instead of an odds bonus. The amount is authored per set (£50 max).
            if (epicRoom >= SET_EPIC_REWARD || crownRoom >= SET_CROWN_REWARD)
              fail("A permanent odds reward is still available for this set.", 409);
            await change(c, id, set.cashReward, `Set completion cash: ${set.name}`);
            await c.query("UPDATE accounts SET set_rewards=COALESCE(set_rewards,'{}'::jsonb)||jsonb_build_object($2::text,'cash') WHERE id=$1", [id, set.id]);
          } else if (body.reward === "badge") {
            // The badge is the reward for a set completed after both odds
            // bonuses are maxed, so it cannot be taken instead of them.
            if (epicRoom >= SET_EPIC_REWARD || crownRoom >= SET_CROWN_REWARD)
              fail("A permanent odds reward is still available for this set.", 409);
            await c.query("UPDATE accounts SET set_rewards=COALESCE(set_rewards,'{}'::jsonb)||jsonb_build_object($2::text,'badge') WHERE id=$1", [id, set.id]);
          } else fail("Choose a valid set reward.");
          return { account: await account(), reward: body.reward, cash: body.reward === "cash" ? set.cashReward : 0 };
        }
        if (route === "quests/claim" && req.method === "POST") {
          const today = new Date().toISOString().slice(0, 10);
          const current = await account();
          let claimed: any;
          try {
            claimed = completeDailyQuest(current.quest_state, today, body.quest);
          } catch (e: any) {
            fail(e.message, 409);
          }
          await change(c, id, claimed.quest.reward, `Daily quest: ${claimed.quest.title}`);
          await c.query("UPDATE accounts SET quest_state=$2::jsonb WHERE id=$1", [id, JSON.stringify(claimed.state)]);
          return { account: await account(), reward: claimed.quest.reward, quest: claimed.quest.id };
        }
        if (route === "upgrades/pack-opening" && req.method === "POST") {
          const currentAccount = await account();
          const slots = Number(currentAccount.pack_slots || 1);
          if (slots >= 3) fail("All pack-opening upgrades are unlocked.", 409);
          const nextSlots = slots + 1;
          if (body.pack_slots !== nextSlots) fail("Unlock pack-opening slots one step at a time.", 409);
          const cost = nextSlots === 2 ? 45000 : 55000;
          await change(c, id, -cost, "Unlocked opening up to " + nextSlots + " packs at once");
          await c.query("UPDATE accounts SET pack_slots=$2 WHERE id=$1", [id, nextSlots]);
          return { account: await account() };
        }
        if (route === "rewards/spin" && req.method === "POST") {
          const today = new Date().toISOString().slice(0, 10);
          const current = await account();
          if (current.spin_day === today)
            fail(
              "You have already used today’s spin. Come back tomorrow.",
              409,
            );
          const prize = dailySpin(randomInt);
          if (prize.reward > 0)
            await change(c, id, prize.reward, "Daily rewards wheel");
          await c.query(
            "UPDATE accounts SET spin_day=$2,spin_reward=$3 WHERE id=$1",
            [id, today, prize.reward],
          );
          return { prize, account: await account() };
        }
        if (route === "ledger" && req.method === "GET")
          return (
            await c.query(
              "SELECT * FROM ledger WHERE user_id=$1 ORDER BY id DESC LIMIT 200",
              [id],
            )
          ).rows;
        if (route === "open" && req.method === "POST") {
          const pack = packs.find((p) => p.id === body.pack);
          if (!pack) return fail("Unknown pack.");
          const quantity = body.quantity === undefined ? 1 : integer(body.quantity, 1, 3);
          const currentAccount = await account();
          const slots = Math.max(1, Math.min(3, Number(currentAccount.pack_slots || 1)));
          if (quantity > slots) fail("Unlock the " + quantity + "-pack upgrade first.", 409);
          const equippedIds: number[] = currentAccount.loadout || [];
          const equipped = equippedIds.length
            ? (await c.query("SELECT id,template_id FROM inventory WHERE owner_id=$1 AND id=ANY($2::int[]) AND vaulted=false AND trade_id IS NULL", [id, equippedIds])).rows
            : [];
          if (equipped.length !== equippedIds.length)
            fail("Your loadout has an unavailable card. Update it before opening a pack.", 409);
          const powerCards = equipped.map((row: any) => cardMap[row.template_id]);
          const effects = loadoutPowerup(powerCards);
          const today = new Date().toISOString().slice(0, 10);
          const opened = Number(currentAccount.packs || 0);
          const discountMilestones = Math.floor((opened + quantity) / 3) - Math.floor(opened / 3);
          const secretDiscountPerPack = secretPackDiscount(pack, id, today, effects);
          const discount = Math.min(
            pack.price * quantity,
            effects.packDiscount * discountMilestones +
              secretDiscountPerPack * quantity,
          );
          const pricePaid = pack.price * quantity - discount;
          await change(c, id, -pricePaid, quantity + " " + pack.name + (quantity === 1 ? "" : " packs") + " opened" + (discount ? " (loadout discount)" : ""));
          // The Secret window opens once per UTC day. Each pack in that first
          // purchase gets a roll; it closes whether or not anything is found.
          const secretWindow =
            effects.secretChance > 0 && currentAccount.secret_day !== today;
          const secretChance = secretWindow ? effects.secretChance : 0;
          const cards: any[] = [];
          const guaranteedPacks: number[] = [];
          const pityPacks: number[] = [];
          // Three money-losing packs in a row unlock one pack with no Commons.
          // The guarantee is spent when it is applied; a losing pity pack counts
          // as the first loss of the next streak.
          let lossStreak = Math.max(0, Number(currentAccount.loss_streak || 0));
          const perPackPrice = pricePaid / quantity;
          for (let offset = 0; offset < quantity; offset++) {
            const guaranteedEpic = packProgress(opened + offset).nextGuaranteed;
            if (guaranteedEpic) guaranteedPacks.push(offset + 1);
            const guaranteedUncommon = lossStreak >= 3;
            if (guaranteedUncommon) pityPacks.push(offset + 1);
            const packCards = rollPack(pack, randomInt, { guaranteedEpic, guaranteedUncommon, powerups: powerCards, permanentEpicBonus: Number(currentAccount.permanent_epic_bonus || 0), permanentCrownBonus: Number(currentAccount.permanent_crown_bonus || 0), secretChance });
            cards.push(...packCards);
            const packTotal = packCards.reduce((sum: number, card: any) => sum + Number(card.value), 0);
            if (packTotal >= perPackPrice) lossStreak = 0;
            else lossStreak = guaranteedUncommon ? 1 : lossStreak + 1;
          }
          const minted = [];
          for (const card of cards) {
            const serial = card.rarity === "Alpha"
              ? (await c.query("INSERT INTO alpha_pulls DEFAULT VALUES RETURNING id")).rows[0].id
              : null;
            minted.push({ template_id: card.id, value: card.value, rarity: card.rarity, serial });
          }
          const stored = await c.query(
            "INSERT INTO inventory(owner_id,template_id,value,rarity,serial) SELECT $1,card.template_id,card.value,card.rarity,card.serial FROM jsonb_to_recordset($2::jsonb) AS card(template_id text,value bigint,rarity text,serial integer) RETURNING *",
            [id, JSON.stringify(minted)],
          );
          const result = stored.rows.sort((a: any, b: any) => a.id - b.id).map((row: any) => ({ ...cardMap[row.template_id], ...row }));
          const discoveredFortnite = cards.filter((card: any) => card.set === "fortnite").map((card: any) => card.id);
          const discoveryColumn = discoveredFortnite.length
            ? await c.query("SELECT 1 FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='accounts' AND column_name='fortnite_collection'")
            : { rows: [] };
          if (discoveryColumn.rows.length) {
            await c.query(
              "UPDATE accounts SET packs=packs+$2,pulled=pulled+$3,fortnite_collection=COALESCE((SELECT array_agg(DISTINCT template_id ORDER BY template_id) FROM unnest(accounts.fortnite_collection || $4::text[]) AS discovered(template_id)),ARRAY[]::text[]) WHERE id=$1",
              [id, quantity, cards.length, discoveredFortnite],
            );
          } else {
            await c.query("UPDATE accounts SET packs=packs+$2,pulled=pulled+$3 WHERE id=$1", [id, quantity, cards.length]);
          }
          const discoveredTemplates = cards.map((card: any) => card.id);
          await c.query("UPDATE accounts SET character_index=COALESCE((SELECT array_agg(DISTINCT template_id ORDER BY template_id) FROM unnest(accounts.character_index || $2::text[]) AS discovered(template_id)),ARRAY[]::text[]) WHERE id=$1", [id, discoveredTemplates]);
          if (secretWindow)
            await c.query("UPDATE accounts SET secret_day=$2 WHERE id=$1", [id, today]);
          await c.query("UPDATE accounts SET loss_streak=$2 WHERE id=$1", [id, lossStreak]);
          await recordQuestProgress(c, id, today, "packs", quantity);
          const epicPulled = cards.filter((card: any) =>
            ["Epic", "Crown", "Alpha", "Chase", "Mythic", "Secret"].includes(card.rarity),
          ).length;
          if (epicPulled)
            await recordQuestProgress(c, id, today, "epic", epicPulled);
          return {
            cards: result,
            account: await account(),
            packCount: quantity,
            epicGuaranteed: guaranteedPacks.length > 0,
            guaranteedPacks,
            pityGuaranteed: pityPacks.length > 0,
            pityPacks,
            lossStreak,
            discount,
            pricePaid,
            secretChance,
            secretWindow,
            secretDiscount: secretDiscountPerPack * quantity,
          };
        }
        if (route === "rewards/starter" && req.method === "POST") {
          const card = rollStarterPack(randomInt);
          const claimed = await c.query(
            "UPDATE accounts SET starter_claimed=true,pulled=pulled+1 WHERE id=$1 AND starter_claimed=false RETURNING id",
            [id],
          );
          if (!claimed.rows.length)
            fail("Your one-time starter pack has already been claimed.", 409);
          const stored = (
            await c.query(
              "INSERT INTO inventory(owner_id,template_id,value,rarity) VALUES($1,$2,$3,$4) RETURNING *",
              [id, card.id, card.value, card.rarity],
            )
          ).rows[0];
          await c.query("UPDATE accounts SET character_index=COALESCE((SELECT array_agg(DISTINCT template_id ORDER BY template_id) FROM unnest(accounts.character_index || $2::text[]) AS discovered(template_id)),ARRAY[]::text[]) WHERE id=$1", [id, [card.id]]);
          return {
            card: { ...card, ...stored },
            account: await account(),
          };
        }
        if (route === "sell" && req.method === "POST") {
          const selected = ids(body.ids);
          if (!selected.length) fail("Select cards to sell.");
          const equippedIds: number[] = (await account()).loadout || [];
          if (selected.some((cardId) => equippedIds.includes(cardId)))
            fail("Unequip loadout cards before selling them.", 409);
          const cards = (
            await c.query(
              "SELECT * FROM inventory WHERE owner_id=$1 AND id=ANY($2::int[]) FOR UPDATE",
              [id, selected],
            )
          ).rows;
          if (
            cards.length !== selected.length ||
            cards.some((v: any) => v.vaulted || v.trade_id)
          )
            fail("Some cards are vaulted, reserved, or no longer yours.", 409);
          const value = cards.reduce(
            (s: number, x: any) => s + Number(x.value),
            0,
          );
          await c.query(
            "DELETE FROM inventory WHERE owner_id=$1 AND id=ANY($2::int[])",
            [id, selected],
          );
          await change(
            c,
            id,
            value,
            `Sold ${cards.length} card${cards.length === 1 ? "" : "s"}`,
          );
          await c.query("UPDATE accounts SET sold=sold+$2 WHERE id=$1", [
            id,
            value,
          ]);
          await recordQuestProgress(
            c,
            id,
            new Date().toISOString().slice(0, 10),
            "sold",
            cards.length,
          );
          return { account: await account(), value };
        }
        if (route === "vault" && req.method === "POST") {
          const card = integer(body.id);
          const equippedIds: number[] = (await account()).loadout || [];
          if (equippedIds.includes(card))
            fail("Unequip this card before vaulting it.", 409);
          const r = await c.query(
            "UPDATE inventory SET vaulted=NOT vaulted WHERE owner_id=$1 AND id=$2 AND trade_id IS NULL RETURNING *",
            [id, card],
          );
          if (!r.rows.length) fail("Card is reserved or unavailable.", 409);
          return r.rows[0];
        }
        if (route === "wager" && req.method === "POST") {
          const amount = integer(body.amount);
          const p = await pot(c);
          if (
            Number(body.round) !== Number(p.round.id) ||
            new Date(p.round.ends_at).getTime() <= Date.now()
          )
            fail("The round ended. Refresh before wagering.", 409);
          await change(c, id, -amount, `Global pot #${p.round.id} wager`);
          await c.query(
            "INSERT INTO wagers(round_id,user_id,amount) VALUES($1,$2,$3)",
            [p.round.id, id, amount],
          );
          await c.query("UPDATE rounds SET total=total+$2 WHERE id=$1", [
            p.round.id,
            amount,
          ]);
          return pot(c);
        }
        if (route === "heartbeat" && req.method === "POST") {
          const result = activityReward(await account(), body.visible);
          if (result.reward)
            await change(c, id, result.reward, "Active play reward");
          await c.query(
            "UPDATE accounts SET last_heartbeat=NOW(),active_seconds=$2,daily_reward=$3,reward_day=$4,reward_steps=$5 WHERE id=$1",
            [id, result.active, result.paid, result.day, result.steps],
          );
          return { account: await account(), reward: result.reward };
        }
        if (route === "friends" && req.method === "GET") {
          const sentToday = await giftsToday(c, id);
          return {
            giftLimit: giftLimits.dailyCount,
            giftLeft: giftQuotaLeft(sentToday),
            friends: (
              await c.query(
                "SELECT a.id,a.username,a.friend_code FROM friends f JOIN accounts a ON a.id=CASE WHEN f.user_a=$1 THEN f.user_b ELSE f.user_a END WHERE f.user_a=$1 OR f.user_b=$1",
                [id],
              )
            ).rows,
            tables: (
              await c.query(
                "SELECT t.*,a.username AS host_name,b.username AS guest_name FROM friend_tables t JOIN accounts a ON a.id=t.host_id LEFT JOIN accounts b ON b.id=t.guest_id WHERE t.host_id=$1 OR t.guest_id=$1 OR (t.settled=false AND t.guest_id IS NULL AND t.host_id IN (SELECT CASE WHEN user_a=$1 THEN user_b ELSE user_a END FROM friends WHERE user_a=$1 OR user_b=$1)) ORDER BY t.id DESC LIMIT 30",
                [id],
              )
            ).rows,
            trades: (
              await c.query(
                "SELECT t.*,a.username AS name_a,b.username AS name_b FROM trades t JOIN accounts a ON a.id=t.user_a JOIN accounts b ON b.id=t.user_b WHERE t.user_a=$1 OR t.user_b=$1 ORDER BY t.id DESC LIMIT 30",
                [id],
              )
            ).rows,
          };
        }
        if (route === "friends/add" && req.method === "POST") {
          const friendCode = String(body.code || "")
            .trim()
            .toUpperCase();
          if (!validFriendCode(friendCode))
            fail("Use a valid 6-character friend code.");
          const other = (
            await c.query(
              "SELECT * FROM accounts WHERE friend_code=$1 AND bot=false",
              [friendCode],
            )
          ).rows[0];
          if (!other) fail("No player has that code.", 404);
          if (other.id === id) fail("You cannot add yourself.");
          if (await areFriends(c, id, other.id))
            fail("You are already friends.");
          await c.query("INSERT INTO friends(user_a,user_b) VALUES($1,$2)", [
            id,
            other.id,
          ]);
          return { ok: true };
        }
        if (route === "friends/remove" && req.method === "POST") {
          const target = String(body.id);
          const open = (
            await c.query(
              "SELECT id FROM trades WHERE status='open' AND ((user_a=$1 AND user_b=$2) OR (user_a=$2 AND user_b=$1))",
              [id, target],
            )
          ).rows;
          for (const t of open) {
            await c.query(
              "UPDATE inventory SET trade_id=NULL WHERE trade_id=$1",
              [t.id],
            );
            await c.query("UPDATE trades SET status='cancelled' WHERE id=$1", [
              t.id,
            ]);
          }
          await c.query(
            "DELETE FROM friends WHERE (user_a=$1 AND user_b=$2) OR (user_a=$2 AND user_b=$1)",
            [id, target],
          );
          return { ok: true };
        }
        if (route === "friends/gift" && req.method === "POST") {
          const amount = body.amount;
          if (!validGiftAmount(amount))
            fail("Gifts must be between 1p and £100.00.");
          const target = String(body.id || "");
          if (!target) fail("Choose a friend to gift.");
          if (target === id) fail("You cannot gift yourself.");
          const recipient = (
            await c.query(
              "SELECT id,username FROM accounts WHERE id=$1 AND bot=false",
              [target],
            )
          ).rows[0];
          if (!recipient) fail("That player cannot receive gifts.", 404);
          if (!(await areFriends(c, id, target)))
            fail("Gift to friends only.", 403);
          const sentToday = await giftsToday(c, id);
          if (sentToday >= giftLimits.dailyCount)
            fail(
              `You have sent ${giftLimits.dailyCount} gifts today. Try again after midnight UTC.`,
              429,
            );
          const sender = await account();
          await change(c, id, -amount, `Gift sent to ${recipient.username}`);
          await change(c, target, amount, `Gift from ${sender.username}`);
          return {
            account: await account(),
            sent: amount,
            to: recipient.username,
            giftLimit: giftLimits.dailyCount,
            giftLeft: giftQuotaLeft(sentToday + 1),
          };
        }
        if (route === "tables/create" && req.method === "POST") {
          const stake = integer(body.stake);
          await change(c, id, -stake, "Friend table stake");
          return (
            await c.query(
              "INSERT INTO friend_tables(code,host_id,stake,ends_at) VALUES($1,$2,$3,$4) RETURNING *",
              [code(), id, stake, new Date(Date.now() + 300000)],
            )
          ).rows[0];
        }
        if (route === "tables/join" && req.method === "POST") {
          const t = (
            await c.query(
              "SELECT * FROM friend_tables WHERE code=$1 FOR UPDATE",
              [
                String(body.code || "")
                  .trim()
                  .toUpperCase(),
              ],
            )
          ).rows[0];
          if (
            !t ||
            t.settled ||
            t.guest_id ||
            t.host_id === id ||
            new Date(t.ends_at).getTime() <= Date.now()
          )
            fail("Table is unavailable.", 409);
          if (!(await areFriends(c, id, t.host_id)))
            fail("Only friends can join this table.", 403);
          await change(c, id, -Number(t.stake), `Joined table ${t.code}`);
          await c.query("UPDATE friend_tables SET guest_id=$2 WHERE id=$1", [
            t.id,
            id,
          ]);
          return { ok: true };
        }
        if (route === "trades/create" && req.method === "POST") {
          const friend = String(body.friend);
          if (!(await areFriends(c, id, friend)))
            fail("Trade with friends only.", 403);
          return (
            await c.query(
              "INSERT INTO trades(user_a,user_b) VALUES($1,$2) RETURNING *",
              [id, friend],
            )
          ).rows[0];
        }
        if (route.startsWith("trades/") && req.method === "POST") {
          const t = (
            await c.query(
              "SELECT * FROM trades WHERE id=$1 AND (user_a=$2 OR user_b=$2) FOR UPDATE",
              [integer(body.id), id],
            )
          ).rows[0];
          if (!t || t.status !== "open")
            fail("This trade is no longer open.", 409);
          const side = t.user_a === id ? "a" : "b";
          if (route === "trades/cancel") {
            await c.query(
              "UPDATE inventory SET trade_id=NULL WHERE trade_id=$1",
              [t.id],
            );
            await c.query("UPDATE trades SET status='cancelled' WHERE id=$1", [
              t.id,
            ]);
            return { ok: true };
          }
          if (!(await areFriends(c, t.user_a, t.user_b)))
            fail("Trade partners must be friends.", 403);
          if (route === "trades/offer") {
            const selected = ids(body.ids);
            if (selected.length > 50) fail("Offer at most 50 cards.");
            const equippedIds: number[] = (await account()).loadout || [];
            if (selected.some((cardId) => equippedIds.includes(cardId)))
              fail(
                "Unequip loadout cards before offering them in a trade.",
                409,
              );
            await c.query(
              "UPDATE inventory SET trade_id=NULL WHERE trade_id=$1 AND owner_id=$2",
              [t.id, id],
            );
            if (selected.length) {
              const q = await c.query(
                "UPDATE inventory SET trade_id=$3 WHERE id=ANY($1::int[]) AND owner_id=$2 AND vaulted=false AND trade_id IS NULL RETURNING id",
                [selected, id, t.id],
              );
              if (q.rows.length !== selected.length)
                fail(
                  "An offered card is vaulted, reserved, or unavailable.",
                  409,
                );
            }
            await c.query(
              `UPDATE trades SET offer_${side}=$2,confirm_a=false,confirm_b=false WHERE id=$1`,
              [t.id, JSON.stringify(selected)],
            );
            return { ok: true };
          }
          if (route === "trades/confirm") {
            if (
              JSON.stringify(body.offerA) !== JSON.stringify(t.offer_a) ||
              JSON.stringify(body.offerB) !== JSON.stringify(t.offer_b)
            )
              fail(
                "The offer changed. Refresh and review both sides before confirming.",
                409,
              );
            if (!t.offer_a.length || !t.offer_b.length)
              fail("Both players must offer at least one card.");
            await c.query(
              `UPDATE trades SET confirm_${side}=true WHERE id=$1`,
              [t.id],
            );
            if (
              (side === "a" && t.confirm_b) ||
              (side === "b" && t.confirm_a)
            ) {
              const offered = (
                await c.query(
                  "SELECT * FROM inventory WHERE trade_id=$1 FOR UPDATE",
                  [t.id],
                )
              ).rows;
              const valid = validTradeCards(t, offered);
              if (!valid)
                fail("The offered cards changed. Update the trade.", 409);
              const discoveredByA = offered.filter((card: any) => card.owner_id === t.user_b).map((card: any) => card.template_id);
              const discoveredByB = offered.filter((card: any) => card.owner_id === t.user_a).map((card: any) => card.template_id);
              if (discoveredByA.length)
                await c.query("UPDATE accounts SET character_index=COALESCE((SELECT array_agg(DISTINCT template_id ORDER BY template_id) FROM unnest(accounts.character_index || $2::text[]) AS discovered(template_id)),ARRAY[]::text[]) WHERE id=$1", [t.user_a, discoveredByA]);
              if (discoveredByB.length)
                await c.query("UPDATE accounts SET character_index=COALESCE((SELECT array_agg(DISTINCT template_id ORDER BY template_id) FROM unnest(accounts.character_index || $2::text[]) AS discovered(template_id)),ARRAY[]::text[]) WHERE id=$1", [t.user_b, discoveredByB]);
              await c.query(
                "UPDATE inventory SET owner_id=CASE WHEN owner_id=$2 THEN $3 ELSE $2 END,trade_id=NULL WHERE trade_id=$1",
                [t.id, t.user_a, t.user_b],
              );
              await c.query(
                "UPDATE trades SET status='completed' WHERE id=$1",
                [t.id],
              );
            }
            return { ok: true };
          }
        }
        if (route === "trades/cards" && req.method === "GET") {
          const tradeId = integer(Number(url.searchParams.get("id")));
          const t = (
            await c.query(
              "SELECT id FROM trades WHERE id=$1 AND (user_a=$2 OR user_b=$2)",
              [tradeId, id],
            )
          ).rows[0];
          if (!t) fail("Trade not found.", 404);
          return (
            await c.query("SELECT * FROM inventory WHERE trade_id=$1", [
              tradeId,
            ])
          ).rows;
        }
        fail("Not found.", 404);
      }),
    );
  } catch (e: any) {
    const busy = ["55P03", "57014", "53300", "57P03"].includes(e?.code);
    const status = e instanceof GameError ? e.status : busy ? 503 : 500;
    // Unexpected failures are shown to players only as a generic message, so
    // record the cause in the server logs (code and message only, never request
    // data or environment values).
    if (status === 500 || busy)
      console.error(
        "api error",
        req.method,
        route,
        e?.code,
        e?.message,
        // Which database the site is trying to reach (never the password).
        e?.code === "28P01" || e?.code === "XX000" || e?.code === "ENOTFOUND"
          ? databaseTarget()
          : "",
      );
    return Response.json(
      {
        error:
          status === 500
            ? "The court could not complete that request. Please try again."
            : busy
              ? "The court is busy. Please try again in a moment."
              : e.message,
      },
      {
        status,
        headers: {
          "Cache-Control": "no-store",
          ...(busy ? { "Retry-After": "2" } : {}),
        },
      },
    );
  }
}
