import { randomInt, randomBytes } from "node:crypto";
import {
  packs,
  cardMap,
  rollPack,
  weightedWinner,
  packProgress,
} from "../shared/catalog.mjs";
import { database, pool, databaseTarget } from "../db/index.js";
import { accounts, inventory } from "../db/schema.js";
import { sessionUser, type SessionUser } from "./session.js";
import { eq, desc, inArray } from "drizzle-orm";

import {
  activityReward,
  validTradeCards,
  validFriendCode,
  validUsername,
  friendTablePayout,
  matchedPotBotStake,
  FRIEND_ALPHABET,
  randomBelow,
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
async function areFriends(c: Client, a: string, b: string) {
  const q = await c.query(
    "SELECT id FROM friends WHERE (user_a=$1 AND user_b=$2) OR (user_a=$2 AND user_b=$1)",
    [a, b],
  );
  return q.rows.length > 0;
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
    if (!readOnly) await c.query("SELECT pg_advisory_xact_lock(8374201)");
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
    "SELECT * FROM rounds WHERE ends_at<=$1 AND settled=false FOR UPDATE",
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
    if (!Number.isSafeInteger(total)) fail("The pot total is too large to settle.");
    const winner = weightedWinner(entries, (max: number) =>
      randomBelow(max, randomBytes),
    );
    if (winner)
      await change(
        c,
        winner,
        total,
        `Global pot #${round.id} won`,
      );
    await c.query(
      "UPDATE rounds SET settled=true,winner_id=$2,total=$3 WHERE id=$1",
      [round.id, winner, total],
    );
  }
  for (const table of (
    await c.query(
      "SELECT * FROM friend_tables WHERE ends_at<=$1 AND settled=false FOR UPDATE",
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
  const existing = (
    await c.query("SELECT * FROM accounts WHERE id=$1", [user.id])
  ).rows[0];
  if (existing) return existing;
  let name =
    String(
      user.name || "Monarch",
    )
      .replace(/[^a-zA-Z0-9_ -]/g, "")
      .trim()
      .slice(0, 24) || "Monarch";
  if (
    (
      await c.query("SELECT id FROM accounts WHERE lower(username)=lower($1)", [
        name,
      ])
    ).rows.length
  )
    name = name.slice(0, 16) + " " + code();
  const a = (
    await c.query(
      "INSERT INTO accounts(id,username,friend_code) VALUES($1,$2,$3) RETURNING *",
      [user.id, name, code()],
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
          return (
            await c.query(
              `WITH scores AS (SELECT a.id,a.username,a.created_at,${metric} AS score FROM accounts a LEFT JOIN inventory i ON i.owner_id=a.id WHERE a.bot=false GROUP BY a.id),ranked AS (SELECT *,ROW_NUMBER() OVER(ORDER BY score DESC,created_at ASC) AS rank FROM scores) SELECT id,username,score,rank FROM ranked WHERE rank<=100 OR id=$1 ORDER BY rank`,
              [viewer?.id || ""],
            )
          ).rows;
        }, true),
      );
    }
    const user = await readUser(req);
    if (!user) fail("Sign in to enter the court.", 401);
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
        await ensureAccount(c, user);
        await settle(c);
        const id = user.id;
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
            fail("Choose a username with 3–24 letters, numbers, spaces, _ or -.");
          const taken = await c.query(
            "SELECT id FROM accounts WHERE lower(username)=lower($1) AND id<>$2",
            [username, id],
          );
          if (taken.rows.length) fail("That username is already taken.", 409);
          await c.query("UPDATE accounts SET username=$2 WHERE id=$1", [
            id,
            username,
          ]);
          return { account: await account() };
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
          if (!pack) fail("Unknown pack.");
          await change(c, id, -pack.price, `${pack.name} opened`);
          const currentAccount = await account();
          const epicGuaranteed = packProgress(
            Number(currentAccount.packs),
          ).nextGuaranteed;
          const cards = rollPack(pack, randomInt, {
            guaranteedEpic: epicGuaranteed,
          });
          const minted = [];
          for (const card of cards) {
            const serial =
              card.rarity === "Alpha"
                ? (
                    await c.query(
                      "INSERT INTO alpha_pulls DEFAULT VALUES RETURNING id",
                    )
                  ).rows[0].id
                : null;
            minted.push({
              template_id: card.id,
              value: card.value,
              rarity: card.rarity,
              serial,
            });
          }
          // Insert the whole pack together to shorten the shared write-lock duration.
          const stored = await c.query(
            "INSERT INTO inventory(owner_id,template_id,value,rarity,serial) SELECT $1,card.template_id,card.value,card.rarity,card.serial FROM jsonb_to_recordset($2::jsonb) AS card(template_id text,value bigint,rarity text,serial integer) RETURNING *",
            [id, JSON.stringify(minted)],
          );
          const result = stored.rows
            .sort((a: any, b: any) => a.id - b.id)
            .map((row: any) => ({ ...cardMap[row.template_id], ...row }));
          await c.query(
            "UPDATE accounts SET packs=packs+1,pulled=pulled+$2 WHERE id=$1",
            [id, cards.length],
          );
          return { cards: result, account: await account(), epicGuaranteed };
        }
        if (route === "sell" && req.method === "POST") {
          const selected = ids(body.ids);
          if (!selected.length) fail("Select cards to sell.");
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
          return { account: await account(), value };
        }
        if (route === "vault" && req.method === "POST") {
          const card = integer(body.id);
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
            "UPDATE accounts SET last_heartbeat=NOW(),active_seconds=$2,daily_reward=$3,reward_day=$4 WHERE id=$1",
            [id, result.active, result.paid, result.day],
          );
          return { account: await account(), reward: result.reward };
        }
        if (route === "friends" && req.method === "GET") {
          return {
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
