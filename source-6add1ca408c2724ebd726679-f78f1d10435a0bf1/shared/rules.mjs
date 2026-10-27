export const FRIEND_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const validFriendCode = (value) =>
  typeof value === "string" && /^[A-HJ-NP-Z2-9]{6}$/.test(value);
export const validUsername = (value) =>
  typeof value === "string" &&
  value.length >= 3 &&
  value.length <= 24 &&
  /^[a-zA-Z0-9_ -]+$/.test(value);
export const playReward = Object.freeze({
  intervalSeconds: 600,
  firstPence: 50,
  increasePence: 25,
  dailyCap: 500,
});
export const dailySpinSegments = Object.freeze([
  { id: "miss-a", label: "No prize", reward: 0, weight: 25000000 },
  { id: "miss-b", label: "No prize", reward: 0, weight: 25000000 },
  { id: "miss-c", label: "No prize", reward: 0, weight: 25000000 },
  { id: "small", label: "25p", reward: 25, weight: 10000000 },
  { id: "nice", label: "50p", reward: 50, weight: 7000000 },
  { id: "bright", label: "£1", reward: 100, weight: 5000000 },
  { id: "gold", label: "£5", reward: 500, weight: 2900000 },
  { id: "silver", label: "£45", reward: 4500, weight: 100000 },
]);
export function dailySpin(randomInt) {
  const total = dailySpinSegments.reduce(
    (sum, segment) => sum + segment.weight,
    0,
  );
  if (total !== 100000000) throw Error("Daily spin odds must total 100%.");
  let roll = randomInt(total);
  for (const segment of dailySpinSegments) {
    if (roll < segment.weight) return segment;
    roll -= segment.weight;
  }
  throw Error("Daily spin roll was outside its odds.");
}
export const giftLimits = Object.freeze({
  minPence: 1,
  maxPence: 10000,
  dailyCount: 10,
});
export const validGiftAmount = (amount) =>
  Number.isSafeInteger(amount) &&
  amount >= giftLimits.minPence &&
  amount <= giftLimits.maxPence;
export function giftQuotaLeft(sentToday) {
  const sent =
    Number.isSafeInteger(sentToday) && sentToday > 0 ? sentToday : 0;
  return Math.max(0, giftLimits.dailyCount - sent);
}
export function friendTablePayout(stake, hasOpponent) {
  if (!Number.isSafeInteger(stake) || stake < 1)
    throw Error("Stake must be a positive whole-pence amount.");
  const payout = stake * (hasOpponent ? 2 : 1);
  if (!Number.isSafeInteger(payout))
    throw Error("Payout exceeds the supported balance limit.");
  return payout;
}
export function matchedPotBotStake(contributors) {
  if (!Array.isArray(contributors))
    throw Error("Pot contributors must be a list.");
  if (contributors.length !== 1) return 0;
  const amount = Number(contributors[0]?.amount);
  if (!Number.isSafeInteger(amount) || amount < 1)
    throw Error("Pot contribution must be a positive whole-pence amount.");
  return amount;
}
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
  let steps = account.reward_day === day ? account.reward_steps || 0 : 0;
  const reward =
    active >= playReward.intervalSeconds && paid < playReward.dailyCap
      ? Math.min(
          playReward.firstPence + steps * playReward.increasePence,
          playReward.dailyCap - paid,
        )
      : 0;
  if (reward) {
    paid += reward;
    active -= playReward.intervalSeconds;
    steps++;
  }
  return { day, reward, active: Math.min(active, 600), paid, steps };
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
export const dailyQuests = Object.freeze([
  {
    id: "open-1",
    title: "First opening",
    text: "Open 1 pack today.",
    metric: "packs",
    target: 1,
    reward: 100,
  },
  {
    id: "open-3",
    title: "Triple threat",
    text: "Open 3 packs today.",
    metric: "packs",
    target: 3,
    reward: 150,
  },
  {
    id: "epic-hunt",
    title: "Court favourite",
    text: "Pull an Epic or better card today.",
    metric: "epic",
    target: 1,
    reward: 100,
  },
  {
    id: "sell-3",
    title: "Clear the shelves",
    text: "Sell 3 cards today.",
    metric: "sold",
    target: 3,
    reward: 75,
  },
]);
const questMetrics = new Set(dailyQuests.map((quest) => quest.metric));
export function normalizeQuestState(state, day) {
  const source =
    state && typeof state === "object" && !Array.isArray(state) ? state : {};
  const sameDay = source.day === day;
  const progress =
    sameDay && source.progress && typeof source.progress === "object"
      ? source.progress
      : {};
  return {
    day,
    progress: Object.fromEntries(
      [...questMetrics].map((metric) => [
        metric,
        sameDay ? Math.max(0, Math.floor(Number(progress[metric]) || 0)) : 0,
      ]),
    ),
    claimed:
      sameDay && Array.isArray(source.claimed)
        ? source.claimed.filter((id) =>
            dailyQuests.some((quest) => quest.id === id),
          )
        : [],
  };
}
export function addQuestProgress(state, day, metric, amount = 1) {
  if (!questMetrics.has(metric))
    throw Error("Quest progress requires a known metric.");
  if (!Number.isSafeInteger(amount) || amount < 0)
    throw Error("Quest progress must be a non-negative whole number.");
  const next = normalizeQuestState(state, day);
  next.progress[metric] += amount;
  return next;
}
export function completeDailyQuest(state, day, questId) {
  const quest = dailyQuests.find((entry) => entry.id === questId);
  if (!quest) throw Error("Unknown quest.");
  const next = normalizeQuestState(state, day);
  if (next.claimed.includes(quest.id))
    throw Error("That quest reward has already been claimed.");
  if (next.progress[quest.metric] < quest.target)
    throw Error("That quest is not complete yet.");
  next.claimed.push(quest.id);
  return { state: next, quest };
}
export function claimableQuests(state, day) {
  const current = normalizeQuestState(state, day);
  return dailyQuests.filter(
    (quest) =>
      !current.claimed.includes(quest.id) &&
      current.progress[quest.metric] >= quest.target,
  );
}
