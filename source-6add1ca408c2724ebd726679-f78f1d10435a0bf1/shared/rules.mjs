export const FRIEND_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const validFriendCode = (value) =>
  typeof value === "string" && /^[A-HJ-NP-Z2-9]{6}$/.test(value);
export function activityReward(account, visible, now = Date.now()) {
  const day = new Date(now).toISOString().slice(0, 10);
  const last = account.last_heartbeat
    ? new Date(account.last_heartbeat).getTime()
    : now;
  const elapsed =
    visible === true
      ? Math.max(
          0,
          Math.min(
            45,
            Math.floor(
              (now - Math.max(last, Date.parse(day + "T00:00:00Z"))) / 1000,
            ),
          ),
        )
      : 0;
  let active =
    (account.reward_day === day ? account.active_seconds : 0) + elapsed;
  let paid = account.reward_day === day ? account.daily_reward : 0;
  const reward = Math.max(
    0,
    Math.min(Math.floor(active / 600) * 50, 300 - paid),
  );
  if (reward) {
    paid += reward;
    active -= (reward / 50) * 600;
  }
  return { day, reward, active: Math.min(active, 600), paid };
}
export function validTradeCards(trade, offered) {
  return (
    offered.length === trade.offer_a.length + trade.offer_b.length &&
    offered.every(
      (v) =>
        !v.vaulted &&
        v.trade_id === trade.id &&
        ((v.owner_id === trade.user_a && trade.offer_a.includes(v.id)) ||
          (v.owner_id === trade.user_b && trade.offer_b.includes(v.id))),
    )
  );
}
// Unbiased random selection up to JavaScript's safe integer limit, including large pots.
export function randomBelow(max, bytes) {
  if (!Number.isSafeInteger(max) || max < 1)
    throw Error("Random range must be a positive safe integer.");
  const range = 1n << 53n,
    bound = BigInt(max),
    limit = range - (range % bound);
  let n;
  do {
    const input = bytes(7);
    n = 0n;
    for (const byte of input) n = (n << 8n) | BigInt(byte);
    n >>= 3n;
  } while (n >= limit);
  return Number(n % bound);
}
