import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  packs,
  rollPack,
  rollStarterPack,
  weightedWinner,
  catalog,
  cardMap,
  packProgress,
  packValueRange,
  cardPowerup,
  indexSets,
  rarities,
  loadoutPowerup,
  ODDS_TOTAL,
  EPIC_SHIFT_CAP,
  CROWN_SHIFT_CAP,
  CHASE_BONUS_SCALE,
  SET_EPIC_CAP,
  SET_CROWN_CAP,
  SET_EPIC_REWARD,
  SET_CROWN_REWARD,
  SECRET_CROWN_BONUS,
  SECRET_CHANCE_CAP,
  SECRET_ROLL_SCALE,
  WINDFALL_CHANCE,
  WINDFALL_ROLL_SCALE,
  dailyDiscountPack,
  secretPackDiscount,
} from "../shared/catalog.mjs";
import {
  activityReward,
  dailySpin,
  dailySpinSegments,
  dailyQuests,
  normalizeQuestState,
  addQuestProgress,
  completeDailyQuest,
  claimableQuests,
  friendTablePayout,
  giftLimits,
  giftQuotaLeft,
  validGiftAmount,
  matchedPotBotStake,
  validFriendCode,
  validTradeCards,
  validUsername,
  randomBelow,
} from "../shared/rules.mjs";
import { rateLeader } from "../shared/leader-ratings.mjs";
import leaderData from "../shared/leaders.json" with { type: "json" };
const rng =
  (rarityRoll, chase = false) =>
  (max) =>
    max === ODDS_TOTAL
      ? rarityRoll
      : packs.some((p) => p.jackpotOdds === max)
        ? max - 1
        : packs.some((p) => p.chaseOdds === max)
          ? chase
            ? 0
            : max - 1
          : max - 1;
test("Brainrot Pack: Epic is the boosted winning tier and Crown stays rarest", () => {
  const p = packs.find((p) => p.id === "brainrot");
  assert.equal(p.odds[0], 70960000);
  assert.equal(p.price, 200);
  assert.ok(p.odds[0] > p.odds[1], "Common stays the majority tier");
  assert.ok(p.odds[0] > p.odds[2]);
  assert.ok(p.odds[2] > p.odds[1], "Epic is the boosted winning tier");
  assert.ok(p.odds[2] > p.odds[3], "Crown is rarer than Epic");
  // Roll just inside and just outside each band.
  assert.equal(rollPack(p, rng(p.odds[0] - 1))[0].rarity, "Common");
  assert.equal(rollPack(p, rng(p.odds[0]))[0].rarity, "Uncommon");
  assert.equal(
    rollPack(p, rng(p.odds[0] + p.odds[1] - 1))[0].rarity,
    "Uncommon",
  );
  assert.equal(rollPack(p, rng(p.odds[0] + p.odds[1]))[0].rarity, "Epic");
  assert.equal(rollPack(p, rng(ODDS_TOTAL - 1))[0].rarity, "Crown");
});
for (const p of packs) {
  test(`${p.name}: integer odds sum to exactly 100%`, () =>
    assert.equal(
      p.odds.reduce((s, n) => s + n, 0),
      ODDS_TOTAL,
    ));
  test("starter pack grants one common-heavy card from every regular collection", () => {
    const roll = (rarityRoll) =>
      rollStarterPack((max) => (max === 100000000 ? rarityRoll : 0));
    assert.equal(roll(0).rarity, "Common");
    assert.equal(roll(84999999).rarity, "Common");
    assert.equal(roll(85000000).rarity, "Uncommon");
    assert.equal(roll(97000000).rarity, "Epic");
    assert.equal(roll(99500000).rarity, "Crown");
    for (let n = 0; n < 100; n++) {
      const card = rollStarterPack((max) => (n * 104729) % max);
      assert.ok(["brainrot", "royal", "world"].includes(card.set));
      assert.ok(["Common", "Uncommon", "Epic", "Crown"].includes(card.rarity));
      assert.ok(card.value >= 0);
      assert.notEqual(card.rarity, "Alpha");
      assert.notEqual(card.rarity, "Chase");
    }
    for (const [setIndex, set] of ["brainrot", "royal", "world"].entries()) {
      let call = 0;
      const card = rollStarterPack((max) => {
        call++;
        if (call === 1) return 0;
        if (call === 2) return setIndex;
        return max - 1;
      });
      assert.equal(
        card.set,
        set,
        "each regular collection is present in the pool",
      );
    }
  });
  test(`${p.name}: exactly ${p.count} cards, no duplicates with a non-exhausted pool`, () => {
    const pull = rollPack(p, rng(0));
    assert.equal(pull.length, p.count);
    assert.equal(new Set(pull.map((c) => c.id)).size, p.count);
  });
  test(`${p.name}: exclusive chase replaces one eligible card`, () => {
    const pull = rollPack(p, rng(0, true));
    assert.equal(pull.filter((c) => c.id === p.chase).length, 1);
    assert.equal(pull.length, p.count);
    assert.equal(pull.filter((c) => c.rarity === "Chase").length, 1);
  });
  if (p.odds[4] > 0)
    test(`${p.name}: a successful chase never overwrites an Alpha`, () => {
      const pull = rollPack(p, rng(ODDS_TOTAL - 1, true));
      assert.ok(pull.every((c) => c.rarity === "Alpha"));
    });
  test(`${p.name}: the Mythic jackpot replaces one ordinary card and nothing else`, () => {
    const jackpotRng = (max) =>
      max === ODDS_TOTAL
        ? 0
        : max === p.jackpotOdds
          ? 0
          : max === p.chaseOdds
            ? max - 1
            : max - 1;
    const pull = rollPack(p, jackpotRng);
    const mythic = pull.find((c) => c.rarity === "Mythic");
    assert.equal(pull.length, p.count);
    assert.equal(pull.filter((c) => c.rarity === "Mythic").length, 1);
    assert.equal(mythic.id, p.jackpot);
    assert.equal(mythic.value, cardMap[p.jackpot].value);
  });
  let boundary = 0;
  p.odds.forEach((weight, i) => {
    if (!weight) return;
    const start = boundary;
    boundary += weight;
    for (const n of [start, boundary - 1])
      test(`${p.id} rarity boundary ${n}`, () => {
        const pull = rollPack(p, rng(n));
        assert.ok(
          pull.some(
            (c) =>
              c.rarity === ["Common", "Uncommon", "Epic", "Crown", "Alpha"][i],
          ),
        );
      });
  });
}
test("Fortnite Drop Pack favors Uncommons without inflating its Epic character values", () => {
  const pack = packs.find((entry) => entry.id === "fortnite");
  assert.deepEqual(pack.odds, [31029000, 64668990, 4300000, 2000, 10]);
  assert.equal(pack.odds.reduce((sum, weight) => sum + weight, 0), ODDS_TOTAL);
  assert.deepEqual(
    [
      cardMap["fortnite-recruit"].value,
      cardMap["fortnite-jonesy"].value,
      cardMap["fortnite-commando"].value,
      cardMap["fortnite-fishstick"].value,
      cardMap["fortnite-agent-peely"].value,
      cardMap["fortnite-midas"].value,
      cardMap["fortnite-renegade-raider"].value,
    ],
    [1358, 3134, 2686, 6000, 10500, 15000, 400000],
  );
  const fortniteCards = catalog.filter(
    (card) =>
      card.set === "fortnite" &&
      card.rarity !== "Mythic" &&
      card.rarity !== "Secret" &&
      !card.id.startsWith("payday-") &&
      !card.id.startsWith("windfall-"),
  );
  assert.equal(fortniteCards.length, 30);
  assert.equal(new Set(fortniteCards.map((card) => card.name)).size, 30);
  assert.equal(new Set(fortniteCards.map((card) => card.id)).size, 30);
  assert.ok(
    fortniteCards.every((card) =>
      /^https:\/\/fortnite-api\.com\/images\/cosmetics\/br\/[^/]+\/icon\.png$/.test(card.image),
    ),
    "all 30 distinct Fortnite cards point to a cosmetic portrait",
  );
  assert.equal(cardMap["mythic-fortnite"].rarity, "Mythic");
  assert.equal(cardMap["mythic-fortnite"].set, "fortnite");
});

test("Apex replaces exactly one low card with Crown when all rolls are Epic", () => {
  const pull = rollPack(
    packs.find((p) => p.id === "apex"),
    rng(0),
  );
  assert.equal(pull.filter((c) => c.rarity === "Crown").length, 1);
  assert.equal(pull.filter((c) => c.rarity === "Epic").length, 4);
});
test("character index sets use existing cards and keep earned bonuses bounded", () => {
  assert.ok(indexSets.length > 4);
  assert.equal(
    new Set(indexSets.flatMap((set) => set.cardIds)).size,
    catalog.filter(
      (card) =>
        card.rarity !== "Mythic" &&
        card.rarity !== "Secret" &&
        !card.id.startsWith("payday-") &&
        !card.id.startsWith("windfall-"),
    ).length,
  );
  for (const set of indexSets) {
    assert.ok(set.cardIds.length >= 1 && set.cardIds.length <= 8);
    assert.equal(new Set(set.cardIds).size, set.cardIds.length);
    assert.ok(set.cardIds.every((id) => cardMap[id]), set.name + " only references catalog cards");
  }
  const fourCrowns = loadoutPowerup(
    ["royal-crown-0", "royal-crown-1", "royal-crown-2", "royal-crown-3"].map(
      (id) => cardMap[id],
    ),
  );
  assert.equal(fourCrowns.epicBonus, 1700000);
  assert.equal(fourCrowns.uncommonBonus, 300000);
  assert.equal(fourCrowns.crownBonus, 380000);
  const crownProfiles = new Set(
    catalog
      .filter(
        (card) =>
          card.rarity === "Crown" &&
          card.id !== "fortnite-renegade-raider",
      )
      .map((card) => {
        const powerup = cardPowerup(card);
        return [
          powerup.epicBonus,
          powerup.uncommonBonus,
          powerup.crownBonus,
        ].join(":");
      }),
  );
  assert.equal(crownProfiles.size, 4, "Crown power-ups should vary");
  assert.equal(SET_EPIC_CAP, 4 * SET_EPIC_REWARD);
  assert.equal(SET_CROWN_CAP, 4 * SET_CROWN_REWARD);
  assert.ok(SET_EPIC_CAP >= 2000000);
  assert.ok(SET_CROWN_CAP >= 400000);
});
test("five equipped Crown cards can reach the +2.5% Epic and +1% Crown loadout caps", () => {
  const crownCards = catalog.filter((card) => card.rarity === "Crown");
  const epicFive = crownCards
    .filter((card) => cardPowerup(card).epicBonus === 600000)
    .slice(0, 5);
  assert.equal(epicFive.length, 5);
  assert.equal(loadoutPowerup(epicFive).epicBonus, EPIC_SHIFT_CAP);
  const crownFive = [
    cardMap["fortnite-renegade-raider"],
    ...crownCards
      .filter((card) => cardPowerup(card).crownBonus >= 200000)
      .slice(0, 4),
  ];
  assert.equal(crownFive.length, 5);
  assert.equal(loadoutPowerup(crownFive).crownBonus, CROWN_SHIFT_CAP);
  assert.equal(EPIC_SHIFT_CAP, 2500000);
  assert.equal(CROWN_SHIFT_CAP, 1000000);
});
test("permanent character-index rewards shift Epic and Crown odds by their stated amounts", () => {
  const deterministic = (value) => (max) =>
    max === ODDS_TOTAL ? value : Math.max(0, max - 1);
  const brainrot = packs.find((pack) => pack.id === "brainrot");
  const uncommonRoll = brainrot.odds[0] + brainrot.odds[1] - 1;
  assert.equal(
    rollPack(brainrot, deterministic(uncommonRoll))[0].rarity,
    "Uncommon",
  );
  assert.equal(
    rollPack(brainrot, deterministic(uncommonRoll), {
      permanentEpicBonus: SET_EPIC_REWARD,
    })[0].rarity,
    "Epic",
  );
  const fortnite = packs.find((pack) => pack.id === "fortnite");
  assert.equal(
    rollPack(fortnite, deterministic(99950000))[0].rarity,
    "Epic",
  );
  assert.equal(
    rollPack(fortnite, deterministic(99950000), {
      permanentCrownBonus: SET_CROWN_REWARD,
    })[0].rarity,
    "Crown",
  );
});
test("card powerups are defined and Kim guarantees every second pack card Uncommon+", () => {
  const bonuses = [];
  let discountCard;
  let commonCards = 0;
  let commonCardsWithoutPowerup = 0;
  for (const card of catalog) {
    assert.ok(
      Number.isSafeInteger(card.value),
      `${card.id} has a whole-pence value`,
    );
    const powerup = cardPowerup(card);
    assert.equal(typeof powerup.name, "string");
    assert.ok(Number.isInteger(powerup.epicBonus));
    assert.ok(Number.isInteger(powerup.uncommonBonus));
    if (card.rarity === "Common") {
      commonCards++;
      if (
        powerup.epicBonus === 0 &&
        powerup.uncommonBonus === 0 &&
        !powerup.packDiscount &&
        !powerup.everyOtherCard
      )
        commonCardsWithoutPowerup++;
    } else if (["Crown", "Chase", "Alpha", "Mythic"].includes(card.rarity)) {
      assert.ok(
        powerup.epicBonus !== 0 ||
          powerup.uncommonBonus !== 0 ||
          powerup.crownBonus !== 0 ||
          powerup.everyOtherCard,
        card.id + " should retain a special-card power-up",
      );
    }
    bonuses.push(powerup.epicBonus);
    if (powerup.packDiscount) discountCard = card;
  }
  assert.ok(
    commonCardsWithoutPowerup / commonCards >= 0.7,
    "most Common cards should not have a power-up",
  );
  assert.ok(bonuses.some((bonus) => bonus > 0));
  assert.ok(bonuses.some((bonus) => bonus < 0));
  assert.ok(discountCard);
  assert.equal(cardPowerup(discountCard).packDiscount, 10);
  assert.equal(loadoutPowerup([discountCard]).packDiscount, 10);
  const powerup = loadoutPowerup([cardMap.kim]);
  assert.equal(powerup.everyOtherCard, true);
  assert.equal(powerup.epicBonus, 2000000);
  assert.equal(powerup.uncommonBonus, 0);
  // Kim's +2% never stacks with extra copies of Kim.
  assert.equal(
    loadoutPowerup([cardMap.kim, cardMap.kim, cardMap.kim]).epicBonus,
    2000000,
  );
  assert.equal(cardMap["mystery-gold"].rarity, "Alpha");
  assert.equal(rarities.includes("Alpha"), true);
  assert.throws(
    () =>
      loadoutPowerup([
        cardMap.kim,
        cardMap.kim,
        cardMap.kim,
        cardMap.kim,
        cardMap.kim,
        cardMap.kim,
      ]),
    /at most five cards/,
  );
  const world = packs.find((pack) => pack.id === "world");
  const cards = rollPack(
    world,
    (max) =>
      max === world.chaseOdds || max === world.jackpotOdds ? max - 1 : 0,
    { powerups: [cardMap.kim] },
  );
  assert.equal(cards.length, world.count);
  assert.ok(["Uncommon", "Epic", "Crown", "Alpha"].includes(cards[1].rarity));
  assert.ok(["Uncommon", "Epic", "Crown", "Alpha"].includes(cards[3].rarity));
});
test("power-up strength scales with card rarity and chase cards are all upside", () => {
  const maxEpic = (rarity) =>
    Math.max(
      ...catalog
        .filter((card) => card.rarity === rarity)
        .map((card) => cardPowerup(card).epicBonus),
    );
  assert.ok(maxEpic("Common") <= 10000);
  assert.ok(maxEpic("Uncommon") <= 15000);
  assert.ok(maxEpic("Epic") < maxEpic("Crown"));
  assert.ok(maxEpic("Crown") <= 600000);
  const weakest = catalog
    .filter((card) => card.rarity === "Uncommon")
    .slice(0, 5);
  const crownFive = catalog.filter((card) => card.rarity === "Crown").slice(0, 5);
  assert.ok(
    loadoutPowerup(weakest).epicBonus <
      loadoutPowerup(crownFive).epicBonus / 10,
    "cheap loadouts should be far weaker than a Crown loadout",
  );
  for (const card of catalog.filter((entry) => entry.rarity === "Chase")) {
    const powerup = cardPowerup(card);
    assert.ok(
      powerup.epicBonus > 0 ||
        powerup.uncommonBonus > 0 ||
        powerup.crownBonus > 0 ||
        powerup.everyOtherCard,
      card.id + " should never roll a downgrade",
    );
  }
});
test("a pack's card values can total below or above its virtual price", () => {
  const pack = packs.find((entry) => entry.id === "brainrot");
  const loss = rollPack(pack, rng(0)).reduce(
    (total, card) => total + card.value,
    0,
  );
  const gain = rollPack(pack, rng(99999999, true)).reduce(
    (total, card) => total + card.value,
    0,
  );
  assert.ok(
    loss < pack.price,
    "a pack can return less than its purchase price",
  );
  assert.ok(
    gain > pack.price,
    "a pack can return more than its purchase price",
  );
});
test("daily rewards wheel has three no-prize sectors and an exact 0.1% £45 silver prize", () => {
  assert.equal(
    dailySpinSegments.reduce((sum, segment) => sum + segment.weight, 0),
    100000000,
  );
  assert.equal(
    dailySpinSegments.filter((segment) => segment.reward === 0).length,
    3,
  );
  assert.equal(
    dailySpinSegments.find((segment) => segment.id === "silver").weight,
    100000,
  );
  assert.equal(
    dailySpinSegments.find((segment) => segment.id === "silver").reward,
    4500,
  );
  assert.equal(dailySpin((max) => max - 1).id, "silver");
  assert.equal(dailySpin((max) => 0).reward, 0);
});
test("original catalogue contains 93 non-Mythic templates before the world and Fortnite expansions", () =>
  assert.equal(
    catalog.filter(
      (c) =>
        ["brainrot", "royal", "alpha"].includes(c.set) &&
        c.rarity !== "Mythic" &&
        c.rarity !== "Secret" &&
        !c.id.startsWith("payday-") &&
        !c.id.startsWith("windfall-"),
    ).length,
    93,
  ));
test("Kim Jong Un cannot occur in normal world rarity pools", () => {
  const kim = cardMap.kim;
  assert.equal(kim.rarity, "Chase");
  assert.equal(kim.value, 1500000);
  const world = packs.find((p) => p.id === "world");
  assert.equal(world.chaseOdds, 45000);
  assert.equal(world.price, 1000);
  assert.equal(world.jackpot, "mythic-world");
  assert.equal(world.jackpotOdds, 200000);
  assert.equal(cardMap["mythic-world"].rarity, "Mythic");
  assert.equal(cardMap["mythic-world"].value, 500000);
});
test("featured World Leaders cards keep their authored values", () => {
  const leader = (name, country) =>
    catalog.find((card) => card.name === name && card.country === country);
  assert.equal(leader("Donald Trump", "United States").value, 50000);
  assert.equal(leader("Andy Burnham", "United Kingdom").value, 7787);
  assert.equal(leader("Benjamin Netanyahu", "Israel").value, 97333);
  assert.equal(leader("King Charles III", "United Kingdom").value, 5475);
  assert.equal(cardMap["world-israel-flag"].value, 3650);
  const world = packs.find((pack) => pack.id === "world");
  assert.deepEqual(world.odds, [62750000, 22000000, 15130000, 120000, 0]);
});
test("weighted pot draw includes every contributor, bot or player, at exact stake boundaries", () => {
  const entries = [
    { user_id: "bot", amount: 1 },
    { user_id: "player-a", amount: 3 },
  ];
  assert.equal(
    weightedWinner(entries, () => 0),
    "bot",
  );
  assert.equal(
    weightedWinner(entries, () => 1),
    "player-a",
  );
  assert.equal(
    weightedWinner(entries, () => 3),
    "player-a",
  );
  assert.equal(
    weightedWinner([], () => 0),
    null,
  );
});
test("Pot Bot matches only a sole human contributor's total stake", () => {
  assert.equal(matchedPotBotStake([]), 0);
  assert.equal(matchedPotBotStake([{ user_id: "player", amount: "725" }]), 725);
  assert.equal(
    matchedPotBotStake([
      { user_id: "player-a", amount: "725" },
      { user_id: "player-b", amount: "100" },
    ]),
    0,
  );
  assert.throws(() => matchedPotBotStake([{ amount: "not-money" }]));
});
test("a sole player and matching bot have equal odds in the weighted draw", () => {
  const entries = [
    { user_id: "player", amount: 725 },
    { user_id: "bot", amount: 725 },
  ];
  assert.equal(
    weightedWinner(entries, () => 0),
    "player",
  );
  assert.equal(
    weightedWinner(entries, () => 725),
    "bot",
  );
});
test("friend table winner receives twice the stake while an unjoined table is refunded", () => {
  assert.equal(friendTablePayout(250, true), 500);
  assert.equal(friendTablePayout(250, false), 250);
  assert.throws(() => friendTablePayout(0, true));
  assert.throws(() => friendTablePayout(Number.MAX_SAFE_INTEGER, true));
});
test("friend gifts are bounded whole-pence transfers with a daily quota", () => {
  for (const amount of [1, 500, 10000]) assert.ok(validGiftAmount(amount));
  for (const amount of [0, -5, 10001, 1.5, 500.25, "500", null])
    assert.ok(!validGiftAmount(amount));
  assert.equal(giftLimits.dailyCount, 10);
  assert.equal(giftQuotaLeft(0), 10);
  assert.equal(giftQuotaLeft(9), 1);
  assert.equal(giftQuotaLeft(10), 0);
  assert.equal(giftQuotaLeft(25), 0);
  assert.equal(giftQuotaLeft(undefined), 10);
});
test("usernames are case-friendly public names with strict length and character bounds", () => {
  for (const name of ["Monarch 7", "Lady_Gold", "A-B"])
    assert.ok(validUsername(name));
  for (const name of ["", "ab", "a".repeat(25), "bad/name", "👑King"])
    assert.ok(!validUsername(name));
});
test("large-pot random selection supports safe integers beyond crypto.randomInt limits", () => {
  assert.equal(
    randomBelow(2 ** 49, () => new Uint8Array(7)),
    0,
  );
  assert.throws(() => randomBelow(0, () => []));
});
const now = Date.parse("2026-10-24T12:00:00Z");
const account = {
  reward_day: "2026-10-24",
  active_seconds: 570,
  daily_reward: 0,
  reward_steps: 0,
  last_heartbeat: new Date(now - 30000),
};
test("active 10-minute threshold pays 50 pence", () =>
  assert.deepEqual(activityReward(account, true, now), {
    day: "2026-10-24",
    reward: 50,
    active: 0,
    paid: 50,
    steps: 1,
  }));
test("background tabs earn no additional time", () =>
  assert.equal(activityReward(account, false, now).reward, 0));
test("a long gap credits at most 45 seconds", () =>
  assert.equal(
    activityReward(
      {
        ...account,
        active_seconds: 0,
        last_heartbeat: new Date(now - 86400000),
      },
      true,
      now,
    ).active,
    45,
  ));
test("replayed simultaneous heartbeats earn no additional time", () =>
  assert.equal(
    activityReward(
      { ...account, active_seconds: 0, last_heartbeat: new Date(now) },
      true,
      now,
    ).active,
    0,
  ));
test("play rewards step up by 25 pence and cap at five pounds per day", () => {
  let progress = { ...account, active_seconds: 570 };
  const rewards = [];
  for (let steps = 0; steps < 5; steps++) {
    const result = activityReward(progress, true, now);
    rewards.push(result.reward);
    progress = {
      ...progress,
      active_seconds: 570,
      daily_reward: result.paid,
      reward_steps: result.steps,
    };
  }
  assert.deepEqual(rewards, [50, 75, 100, 125, 150]);
  const result = activityReward(
    { ...progress, daily_reward: 500, reward_steps: 5 },
    true,
    now,
  );
  assert.equal(result.reward, 0);
  assert.equal(result.paid, 500);
});
test("UTC midnight resets both daily earnings and progress", () => {
  const result = activityReward(
    {
      ...account,
      reward_day: "2026-10-23",
      daily_reward: 500,
      reward_steps: 5,
    },
    true,
    now,
  );
  assert.equal(result.paid, 0);
  assert.equal(result.active, 30);
});
test("first heartbeat never retroactively credits time", () =>
  assert.equal(
    activityReward(
      { ...account, active_seconds: 0, last_heartbeat: null },
      true,
      now,
    ).active,
    0,
  ));
test("friend codes reject ambiguous characters and malformed input", () => {
  assert.ok(validFriendCode("AB2Z9H"));
  for (const bad of ["AB10CD", "ABCIO2", "ABCDE", "abcdef", "ABCDEFG", null])
    assert.ok(!validFriendCode(bad));
});
const trade = { id: 1, user_a: "a", user_b: "b", offer_a: [1], offer_b: [2] };
const offered = [
  { id: 1, owner_id: "a", trade_id: 1, vaulted: false },
  { id: 2, owner_id: "b", trade_id: 1, vaulted: false },
];
test("trade verifies both owners and both reserved offers", () =>
  assert.ok(validTradeCards(trade, offered)));
test("a missing reserved card invalidates the entire exchange", () =>
  assert.ok(!validTradeCards(trade, offered.slice(0, 1))));
test("a changed owner, unrelated reservation, or vaulted card prevents exchange", () => {
  for (const change of [
    { owner_id: "stranger" },
    { trade_id: 2 },
    { vaulted: true },
  ])
    assert.ok(
      !validTradeCards(trade, [{ ...offered[0], ...change }, offered[1]]),
    );
});

test("every country in the world collection has a flag and stable template IDs", () => {
  const leaders = catalog.filter(
    (c) =>
      c.set === "world" &&
      c.rarity !== "Mythic" &&
      c.rarity !== "Secret" &&
      !c.id.startsWith("windfall-"),
  );
  assert.equal(new Set(leaders.map((c) => c.country)).size, 195);
  assert.equal(new Set(catalog.map((c) => c.id)).size, catalog.length);
  for (const c of leaders)
    assert.match(c.flag, /^\p{Regional_Indicator}{2}$/u, c.country);
  assert.ok(
    leaders.every(
      (card) =>
        card.image &&
        (!card.image.startsWith("/") ||
          existsSync(new URL(`../public${card.image}`, import.meta.url))),
    ),
    "every World Leaders card has a bundled or remote image",
  );
  const placeholders = leaders.filter((card) => card.portraitPlaceholder);
  assert.equal(placeholders.length, 3);
  assert.ok(
    placeholders.every((card) => card.image === "/img/leader-placeholder.svg"),
    "unavailable portraits use the clearly labeled neutral placeholder",
  );
});
test("World Leaders includes 40 unique standalone national flag cards", () => {
  const flags = catalog.filter((card) => card.role === "National flag");
  assert.equal(flags.length, 40);
  assert.equal(new Set(flags.map((card) => card.country)).size, 40);
  assert.equal(new Set(flags.map((card) => card.value)).size, 40);
  assert.ok(
    flags.every((card) => /^\p{Regional_Indicator}{2}$/u.test(card.flag)),
  );
  assert.ok(
    flags.every(
      (card) =>
        card.image.startsWith("/img/flags/") &&
        existsSync(new URL(`../public${card.image}`, import.meta.url)) &&
        card.page.startsWith("https://flagcdn.com/w320/"),
    ),
    "each flag card has a bundled image",
  );
  assert.ok(
    flags.every((card) => {
      const bytes = readFileSync(
        new URL(`../public${card.image}`, import.meta.url),
      );
      return bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    }),
    "each bundled flag asset is a real PNG image",
  );
  assert.equal(cardMap["world-israel-flag"].value, 3650);
  assert.equal(cardMap["world-israel-flag"].rarity, "Epic");
  assert.ok(
    cardMap["world-flag-united-states"].value >
      cardMap["world-flag-greece"].value,
  );
  assert.ok(cardMap["world-flag-united-states"].rarity === "Crown");
  assert.ok(cardMap["world-flag-greece"].rarity === "Common");
  const flagValues = ["Common", "Uncommon", "Epic", "Crown"].map((rarity) =>
    flags
      .filter((card) => card.rarity === rarity && card.country !== "Israel")
      .map((card) => card.value),
  );
  assert.ok(
    flagValues.every((values) => values.length > 0),
    "every flag rarity has cards",
  );
  assert.ok(Math.max(...flagValues[0]) < Math.min(...flagValues[1]));
  assert.ok(Math.max(...flagValues[1]) < Math.min(...flagValues[2]));
  assert.ok(Math.max(...flagValues[2]) < Math.min(...flagValues[3]));
});
test("World Leaders uses its own balanced rarity bands", () => {
  const world = packs.find((pack) => pack.id === "world");
  assert.deepEqual(world.odds, [62750000, 22000000, 15130000, 120000, 0]);
  assert.equal(
    world.odds.reduce((sum, odds) => sum + odds, 0),
    ODDS_TOTAL,
  );
  for (let index = 1; index < world.odds.length; index++)
    assert.ok(world.odds[index - 1] > world.odds[index]);
  assert.equal(world.price, 1000);
  assert.equal(world.count, 4);
  assert.equal(world.jackpotOdds, 200000);
});
test("leader ratings reflect country GDP and recognition while preserving featured values", () => {
  const americanLeader = rateLeader({
    name: "Unlisted American Leader",
    country: "United States",
    rarity: "Common",
    value: 100,
  });
  const greekLeader = rateLeader({
    name: "Unlisted Greek Leader",
    country: "Greece",
    rarity: "Crown",
    value: 999999,
  });
  assert.equal(americanLeader.rarity, "Crown");
  assert.equal(greekLeader.rarity, "Uncommon");
  assert.ok(americanLeader.value >= 6500 && americanLeader.value <= 8000);
  assert.ok(greekLeader.value >= 305 && greekLeader.value <= 373);
  assert.ok(americanLeader.value > greekLeader.value);
  assert.ok(
    rateLeader({ name: "King Charles III", country: "Canada" }).value <= 400,
  );
  assert.deepEqual(
    [
      rateLeader({ name: "Donald Trump", country: "United States" }).rarity,
      rateLeader({ name: "Donald Trump", country: "United States" }).value,
    ],
    ["Crown", 50000],
  );
  assert.deepEqual(
    [
      rateLeader({ name: "King Charles III", country: "United Kingdom" })
        .rarity,
      rateLeader({ name: "King Charles III", country: "United Kingdom" }).value,
    ],
    ["Epic", 7500],
  );
  assert.ok(
    catalog
      .filter((card) => card.set === "world")
      .every((card) => card.rarity && Number.isInteger(card.value)),
  );
  const nonUkCharles = catalog.filter((card) => card.name === "Charles III");
  assert.equal(nonUkCharles.length, 14);
  assert.ok(
    nonUkCharles
      .filter((card) => card.rarity !== "Epic")
      .every((card) => card.value <= 400),
  );
  assert.ok(
    nonUkCharles
      .filter((card) => card.rarity === "Epic")
      .every((card) => card.value >= 950 && card.value <= 1150),
  );
  assert.ok(
    catalog
      .filter(
        (card) =>
          card.set === "world" &&
          card.rarity === "Uncommon" &&
          card.role !== "National flag",
      )
      .every((card) => card.value <= 750),
  );
  assert.ok(
    catalog
      .filter(
        (card) => card.role === "National flag" && card.rarity === "Common",
      )
      .every((card) => card.value < 170),
  );
  const worldCommons = catalog.filter(
    (card) =>
      card.set === "world" &&
      card.rarity === "Common" &&
      card.role !== "National flag",
  );
  assert.ok(new Set(worldCommons.map((card) => card.value)).size > 1);
  const macronCards = catalog.filter((card) => card.name === "Emmanuel Macron");
  assert.ok(macronCards.length > 0);
  assert.ok(macronCards.every((card) => card.rarity === "Epic"));
  const trump = catalog.find((card) => card.name === "Donald Trump");
  assert.equal(trump.rarity, "Crown");
  assert.equal(trump.value, 50000);
  const netanyahu = catalog.find((card) => card.name === "Benjamin Netanyahu");
  assert.equal(netanyahu.rarity, "Crown");
  assert.equal(netanyahu.value, 97333);
  const andy = catalog.find((card) => card.name === "Andy Burnham");
  assert.equal(andy.rarity, "Epic");
  assert.equal(andy.value, 7787);
  assert.equal(andy.flavor, "Just a normal bloke");
  assert.equal(andy.role, "MP · Greater Manchester");
  assert.ok(andy.image.includes("Official_portrait_of_Andy_Burnham_MP_2026"));
  assert.match(andy.imageSource, /commons\.wikimedia\.org/);
  assert.ok(
    leaderData.cards
      .filter((card) => card.image)
      .every(
        (card) =>
          card.image.startsWith("/img/") ||
          (card.page.startsWith("https://en.wikipedia.org/wiki/") &&
            ["thumb.wikimedia.org", "upload.wikimedia.org"].includes(
              new URL(card.image).hostname,
            )),
      ),
    "each leader portrait comes from the referenced leader biography",
  );
});
test("requested featured cards keep their fictional GBP values and flags", () => {
  const king = cardMap["world-38b1a8656815ee75"];
  assert.equal(king.name, "King Charles III");
  assert.equal(king.country, "United Kingdom");
  assert.equal(king.value, 5475);
  assert.equal(king.rarity, "Epic");
  assert.equal(king.flag, "🇬🇧");
  assert.equal(cardMap["world-c6af8a1c1faf4aae"].name, "Donald Trump");
  assert.equal(cardMap["world-c6af8a1c1faf4aae"].value, 50000);
  assert.equal(cardMap["world-israel-flag"].rarity, "Epic");
  assert.equal(cardMap["world-israel-flag"].value, 3650);
  assert.equal(cardMap["world-israel-flag"].flag, "🇮🇱");
  assert.equal(cardMap["world-flag-greece"].value, 9);
  assert.equal(cardMap["world-flag-qatar"].value, 13);
  assert.equal(cardMap["world-flag-bangladesh"].value, 18);
  assert.deepEqual(
    catalog.filter((c) => c.value < 0).map((c) => c.id),
    ["world-former-keir-starmer"],
  );
  assert.equal(cardMap["world-former-keir-starmer"].value, -183);
});
test("ordinary World Leaders Epics sit in a tight band around the pack price", () => {
  const featured = new Set([
    "Andy Burnham",
    "King Charles III",
    "Flag of Israel",
  ]);
  const epics = catalog.filter(
    (card) => card.set === "world" && card.rarity === "Epic",
  );
  const ordinary = epics.filter((card) => !featured.has(card.name));
  assert.ok(ordinary.length > 30);
  assert.ok(
    ordinary.every((card) => card.value >= 950 && card.value <= 1150),
    "ordinary World Epics stay in the £9.50–£11.50 band",
  );
  assert.equal(
    new Set(ordinary.map((card) => card.value)).size,
    ordinary.length,
    "ordinary World Epics keep distinct sell values",
  );
  for (const name of featured) {
    assert.ok(
      epics.find((card) => card.name === name).value > 3500,
      `${name} keeps its headline value`,
    );
  }
});
test("world packs can return less or more than their purchase price", () => {
  const p = packs.find((p) => p.id === "world");
  const low = rollPack(p, rng(0)).reduce((sum, c) => sum + c.value, 0);
  const high = rollPack(p, rng(99800000)).reduce((sum, c) => sum + c.value, 0);
  assert.ok(low < p.price);
  assert.ok(high > p.price);
});
test("every pack wins about 55% of the time and keeps small and big payouts", () => {
  for (const pack of packs) {
    let seed = [...pack.id].reduce(
      (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
      8374201,
    );
    const randomInt = (max) => {
      const limit = 2 ** 32 - (2 ** 32 % max);
      let value;
      do {
        seed ^= seed << 13;
        seed ^= seed >>> 17;
        seed ^= seed << 5;
        value = seed >>> 0;
      } while (value >= limit);
      return value % max;
    };
    const samples = 20000;
    let loss = 0;
    let smallWin = 0;
    let mediumWin = 0;
    let bigWin = 0;
    let totalValue = 0;
    for (let i = 1; i <= samples; i++) {
      const total = rollPack(pack, randomInt, {
        guaranteedEpic: i % 10 === 0,
      }).reduce((sum, card) => sum + card.value, 0);
      totalValue += total;
      if (total < pack.price) loss++;
      else if (total < pack.price * 2) smallWin++;
      else mediumWin++;
      if (total >= pack.price * 5 && total < pack.price * 10) bigWin++;
    }
    const lossRate = loss / samples;
    assert.ok(
      lossRate >= 0.42 && lossRate <= 0.46,
      `${pack.name} should lose about 45% of the time; got ${(lossRate * 100).toFixed(1)}%`,
    );
    assert.ok(smallWin / samples > 0.3, `${pack.name} keeps frequent small wins`);
    assert.ok(mediumWin > 0, `${pack.name} can return 2x or more`);
    assert.ok(bigWin / samples >= 0.025 && bigWin / samples <= 0.04,
      `${pack.name} keeps roughly 3% of openings in the 5x–10x band`);
    assert.ok(
      totalValue / samples <= pack.price * 1.45,
      `${pack.name} keeps simulated average returns below the 145% inflation ceiling`,
    );
  }
});
test("every pack can produce a configured 10x or better jackpot", () => {
  for (const pack of packs) {
    const randomInt = (max) =>
      max === ODDS_TOTAL
        ? 0
        : max === pack.jackpotOdds
          ? 0
          : max === pack.chaseOdds
            ? max - 1
            : max - 1;
    const total = rollPack(pack, randomInt).reduce(
      (sum, card) => sum + card.value,
      0,
    );
    assert.ok(
      total >= pack.price * 10,
      `${pack.name} jackpot must pay at least 10x its price, got ${total}`,
    );
    assert.ok(cardMap[pack.jackpot].value >= pack.price * 10);
  }
});
test("every Payday pack carries its own 1-in-25 card and lands a moderate win", () => {
  const paydayPacks = packs.filter((pack) => pack.payday);
  assert.equal(paydayPacks.length, 4);
  for (const pack of paydayPacks) {
    assert.equal(pack.paydayOdds, 25);
    assert.equal(cardMap[pack.payday].rarity, "Chase");
    assert.ok(cardMap[pack.payday].value >= pack.price * 1.3);
    assert.equal(pack.odds.reduce((sum, weight) => sum + weight, 0), ODDS_TOTAL);
    const randomInt = (max) =>
      max === ODDS_TOTAL
        ? 45000000
        : max === pack.paydayOdds
          ? 0
          : max - 1;
    const cards = rollPack(pack, randomInt);
    assert.ok(cards.some((card) => card.id === pack.payday));
    const total = cards.reduce((sum, card) => sum + card.value, 0);
    assert.ok(
      total >= pack.price * 2 && total < pack.price * 5,
      `${pack.name} payday total ${total} must land in the 2x-5x band`,
    );
    const withoutPayday = rollPack(pack, (max) =>
      max === ODDS_TOTAL ? 45000000 : max - 1,
    );
    assert.ok(
      !withoutPayday.some((card) => card.id === pack.payday),
      `${pack.name} can only pull its Payday card from the Payday roll`,
    );
  }
});

for (const pack of packs) {
  test(`${pack.name}: Windfall hits exactly inside the 3% boundary`, () => {
    assert.equal(cardMap[pack.windfall].value, pack.price * 5.5);
    assert.equal(cardMap[pack.windfall].rarity, "Chase");
    assert.ok(!indexSets.some((set) => set.cardIds.includes(pack.windfall)));
    const draw = (windfallRoll) => rollPack(pack, (max) =>
      max === ODDS_TOTAL ? 0 : max === WINDFALL_ROLL_SCALE ? windfallRoll : max - 1,
    );
    for (const roll of [0, WINDFALL_CHANCE - 1]) {
      const cards = draw(roll);
      assert.equal(cards.length, pack.count);
      assert.equal(new Set(cards.map((card) => card.id)).size, pack.count);
      assert.equal(cards.filter((card) => card.id === pack.windfall).length, 1);
      const total = cards.reduce((sum, card) => sum + card.value, 0);
      assert.ok(total >= pack.price * 5 && total < pack.price * 10);
    }
    for (const roll of [WINDFALL_CHANCE, WINDFALL_ROLL_SCALE - 1])
      assert.ok(!draw(roll).some((card) => card.id === pack.windfall));
    if (pack.odds[4] > 0) {
      const cards = rollPack(pack, (max) =>
        max === ODDS_TOTAL ? max - 1 : max === WINDFALL_ROLL_SCALE ? 0 : max - 1,
      );
      assert.ok(cards.every((card) => card.rarity === "Alpha"));
    }
  });
  test(`${pack.name}: Windfall preserves every other special pull`, () => {
    const cards = rollPack(pack, (max) =>
      max === ODDS_TOTAL ? 0 :
      [WINDFALL_ROLL_SCALE, pack.chaseOdds, pack.jackpotOdds, pack.paydayOdds].includes(max)
        ? 0 : max - 1,
      { secretChance: 1 },
    );
    const protectedIds = [pack.chase, pack.jackpot, pack.secret, pack.payday].filter(Boolean);
    for (const id of protectedIds)
      assert.ok(cards.some((card) => card.id === id), id + " survives the Windfall roll");
    assert.equal(cards.some((card) => card.id === pack.windfall), protectedIds.length < pack.count);
    assert.equal(cards.length, pack.count);
  });
  test(`${pack.name}: tenth-pack floor preserves count, unique cards and an Epic or better`, () => {
    for (const rarityRoll of [0, 92000000, 99500000, 99999600, 99999999]) {
      for (const chase of [false, true]) {
        const cards = rollPack(pack, rng(rarityRoll, chase), {
          guaranteedEpic: true,
        });
        assert.equal(cards.length, pack.count);
        assert.ok(
          cards.some((c) =>
            ["Epic", "Crown", "Chase", "Alpha"].includes(c.rarity),
          ),
        );
        if (!chase)
          for (const rarity of ["Common", "Uncommon", "Epic", "Crown"]) {
            const drawn = cards.filter((c) => c.rarity === rarity);
            const poolSize = catalog.filter(
              (c) =>
                c.set === pack.set &&
                c.rarity === rarity &&
                c.id !== pack.chase,
            ).length;
            if (drawn.length <= poolSize)
              assert.equal(
                new Set(drawn.map((c) => c.id)).size,
                drawn.length,
                `${pack.name} repeated a ${rarity} card before exhausting its pool`,
              );
          }
      }
    }
  });
  test(`${pack.name}: milestone never downgrades a natural high pull or changes ordinary packs`, () => {
    for (const rarityRoll of [0, 99500000, 99999999]) {
      assert.deepEqual(
        rollPack(pack, rng(rarityRoll)),
        rollPack(pack, rng(rarityRoll), { guaranteedEpic: false }),
      );
    }
    const natural = rollPack(pack, rng(99999999));
    assert.deepEqual(
      rollPack(pack, rng(99999999), { guaranteedEpic: true }),
      natural,
    );
  });
}

test("milestones recur every ten successful purchases without resetting for lucky pulls", () => {
  for (let count = 0; count < 100; count++) {
    const p = packProgress(count);
    assert.equal(p.nextGuaranteed, (count + 1) % 10 === 0);
    assert.equal(p.remaining, 10 - (count % 10));
  }
  assert.throws(() => packProgress(-1));
  assert.throws(() => packProgress(1.5));
});
test("each pack has varied integer-pence values and honest displayed ranges", () => {
  for (const p of packs) {
    const range = packValueRange(p);
    assert.ok(
      Number.isSafeInteger(range.min) && Number.isSafeInteger(range.max),
    );
    assert.ok(range.min < range.max);
    assert.ok(
      new Set(catalog.filter((c) => c.set === p.set).map((c) => c.value)).size >
        10,
    );
  }
});
test("a tenth Brainrot pack upgrades only its lowest card and keeps three ordinary cards", () => {
  const p = packs.find((p) => p.id === "brainrot");
  const cards = rollPack(p, rng(0), { guaranteedEpic: true });
  assert.equal(cards.filter((c) => c.rarity === "Epic").length, 1);
  assert.equal(cards.filter((c) => c.rarity === "Common").length, 3);
});

test("the comeback pack replaces every Common with Uncommon or better", () => {
  for (const pack of packs) {
    for (const rarityRoll of [0, pack.odds[0], 99500000, 99999999]) {
      const cards = rollPack(pack, rng(rarityRoll), {
        guaranteedUncommon: true,
      });
      assert.equal(cards.length, pack.count);
      assert.ok(
        cards.every((card) => card.rarity !== "Common"),
        `${pack.name} comeback pack must contain no Common cards`,
      );
    }
  }
  const brainrot = packs.find((pack) => pack.id === "brainrot");
  assert.ok(
    rollPack(brainrot, rng(0)).every((card) => card.rarity === "Common"),
  );
  assert.ok(
    rollPack(brainrot, rng(0), { guaranteedUncommon: true }).every(
      (card) => card.rarity === "Uncommon",
    ),
  );
  // Like the milestone, the comeback floor never downgrades a natural high pull.
  for (const rarityRoll of [99500000, 99999999]) {
    assert.deepEqual(
      rollPack(brainrot, rng(rarityRoll), { guaranteedUncommon: true }),
      rollPack(brainrot, rng(rarityRoll)),
    );
  }
});

test("the world milestone upgrades the lowest card instead of adding a sixth", () => {
  const pack = packs.find((p) => p.id === "world");
  const ordinary = rollPack(pack, rng(0));
  const lowest = Math.min(...ordinary.map((card) => card.value));
  const milestone = rollPack(pack, rng(0), { guaranteedEpic: true });
  assert.equal(milestone.length, pack.count);
  assert.equal(milestone.filter((card) => card.rarity === "Epic").length, 1);
  assert.ok(
    Math.min(...milestone.map((card) => card.value)) > lowest,
    "the milestone must raise the cheapest card rather than add another card",
  );
});

test("weighted pots allocate exactly one ticket per staked penny without a house ticket", () => {
  const entries = [
    { user_id: "one", amount: 1 },
    { user_id: "two", amount: 2 },
    { user_id: "seven", amount: 7 },
  ];
  const wins = { one: 0, two: 0, seven: 0 };
  for (let ticket = 0; ticket < 10; ticket++)
    wins[weightedWinner(entries, () => ticket)]++;
  assert.deepEqual(wins, { one: 1, two: 2, seven: 7 });
});
test("simultaneous tabs cannot multiply the five-pound daily play reward", () => {
  const start = Date.parse("2026-10-24T12:00:00Z");
  let a = {
    reward_day: "2026-10-24",
    active_seconds: 0,
    daily_reward: 0,
    reward_steps: 0,
    last_heartbeat: new Date(start),
  };
  let credited = 0;
  for (let seconds = 30; seconds <= 7200; seconds += 30) {
    const at = start + seconds * 1000;
    for (let tab = 0; tab < 4; tab++) {
      const result = activityReward(a, true, at);
      credited += result.reward;
      a = {
        ...a,
        reward_day: result.day,
        active_seconds: result.active,
        daily_reward: result.paid,
        reward_steps: result.steps,
        last_heartbeat: new Date(at),
      };
    }
  }
  assert.equal(credited, 500);
  assert.equal(a.daily_reward, 500);
});
test("a heartbeat crossing UTC midnight credits only the new day’s seconds", () => {
  const result = activityReward(
    {
      reward_day: "2026-10-23",
      active_seconds: 590,
      daily_reward: 300,
      last_heartbeat: new Date("2026-10-23T23:59:45Z"),
    },
    true,
    Date.parse("2026-10-24T00:00:05Z"),
  );
  assert.deepEqual(result, {
    day: "2026-10-24",
    active: 5,
    paid: 0,
    reward: 0,
    steps: 0,
  });
});

test("Kim adds exactly 2% Epic chance on top of the normal loadout cap", () => {
  const world = packs.find((p) => p.id === "world");
  const kim = { template_id: "kim" };
  const [common, uncommon] = world.odds;
  const rarity = (roll, options) => rollPack(world, rng(roll), options)[0].rarity;
  // 2% of the odds move out of Common and into Epic.
  assert.equal(rarity(common - 1), "Common");
  assert.equal(rarity(common - 1, { powerups: [kim] }), "Uncommon");
  assert.equal(rarity(common + uncommon - 1), "Uncommon");
  assert.equal(rarity(common + uncommon - 1, { powerups: [kim] }), "Epic");
  assert.equal(loadoutPowerup([cardMap.kim]).epicBonus, 2000000);
});

test("the Crown bonus also raises the chase chance, and does nothing without it", () => {
  const world = packs.find((p) => p.id === "world");
  const scale = CHASE_BONUS_SCALE * world.chaseOdds;
  assert.equal(CHASE_BONUS_SCALE, 1000000);
  // Land just under the +0.40% Crown threshold and just over the +0.10% one.
  const roll = (max) =>
    max === ODDS_TOTAL
      ? 0
      : max === scale
        ? CHASE_BONUS_SCALE + 399999
        : max - 1;
  const hasKim = (cards) => cards.some((c) => c.id === "kim");
  assert.equal(hasKim(rollPack(world, roll)), false);
  assert.equal(hasKim(rollPack(world, roll, { permanentCrownBonus: 400000 })), true);
  assert.equal(hasKim(rollPack(world, roll, { permanentCrownBonus: 100000 })), false);
  // A loadout Crown bonus counts too.
  assert.equal(hasKim(rollPack(world, roll, { powerups: [{ template_id: "fortnite-renegade-raider" }] })), true);
  // Without a bonus the original 1-in-chaseOdds roll is unchanged.
  assert.equal(
    hasKim(
      rollPack(world, (max) =>
        max === ODDS_TOTAL || max === world.chaseOdds ? 0 : max - 1,
      ),
    ),
    true,
  );
});

test("Secret cards are isolated, valuable and carry working power-ups", () => {
  const secrets = catalog.filter((card) => card.rarity === "Secret");
  assert.equal(secrets.length, 7);
  assert.ok(secrets.every((card) => card.value >= 2400));
  assert.ok(
    secrets.every((card) => card.secretCaption && card.image === "/img/secret.svg"),
  );
  for (const pack of packs) {
    assert.equal(cardMap[pack.secret]?.rarity, "Secret");
    assert.equal(cardMap[pack.secret]?.set, pack.set);
  }
  assert.ok(
    !indexSets.some((set) =>
      set.cardIds.some((id) => cardMap[id]?.rarity === "Secret"),
    ),
    "Secret cards stay outside the Card Index",
  );
  assert.equal(cardPowerup(cardMap["secret-royal"]).randomPackDiscount, 20);
  assert.equal(cardPowerup(cardMap["secret-vault"]).secretBonus, 200);
  assert.equal(cardPowerup(cardMap["secret-vault"]).epicBonus, 1500000);
  assert.equal(cardPowerup(cardMap["secret-fastfood"]).packDiscount, 50);
  assert.equal(cardPowerup(cardMap["secret-brainrot"]).secretBonus, 200);
});

test("each equipped Crown card adds 0.08% Secret chance up to a 0.40% cap", () => {
  const crownCards = catalog
    .filter((card) => card.rarity === "Crown")
    .slice(0, 5);
  assert.equal(crownCards.length, 5);
  assert.equal(SECRET_CROWN_BONUS, 800);
  assert.equal(SECRET_CHANCE_CAP, 4000);
  assert.equal(loadoutPowerup(crownCards.slice(0, 1)).secretChance, 800);
  assert.equal(loadoutPowerup(crownCards.slice(0, 2)).secretChance, 1600);
  assert.equal(loadoutPowerup(crownCards).secretChance, 4000);
  const vault = cardMap["secret-vault"];
  assert.equal(
    loadoutPowerup([...crownCards.slice(0, 4), vault]).secretChance,
    3400,
  );
  const crownCount = loadoutPowerup([
    ...crownCards.slice(0, 4),
    cardMap["secret-royal"],
  ]).crownCards;
  assert.equal(crownCount, 4);
});

test("the Secret roll is separate, one-shot and never overwrites Alpha, Chase or Mythic", () => {
  const pack = packs.find((p) => p.id === "apex");
  const forceSecret = (max) => {
    if (max === SECRET_ROLL_SCALE) return 0;
    if (max === ODDS_TOTAL) return 0;
    if (max === pack.jackpotOdds || max === pack.chaseOdds) return max - 1;
    return 0;
  };
  const hit = rollPack(pack, forceSecret, { secretChance: SECRET_CROWN_BONUS });
  assert.equal(hit.filter((card) => card.rarity === "Secret").length, 1);
  assert.ok(hit.some((card) => card.id === pack.secret));
  assert.ok(!rollPack(pack, forceSecret).some((card) => card.rarity === "Secret"));
  const allAlpha = (max) =>
    max === SECRET_ROLL_SCALE
      ? 0
      : max === ODDS_TOTAL
        ? ODDS_TOTAL - 1
        : max - 1;
  const alphaPull = rollPack(pack, allAlpha, { secretChance: SECRET_CROWN_BONUS });
  assert.ok(alphaPull.every((card) => card.rarity === "Alpha"));
  assert.ok(!alphaPull.some((card) => card.rarity === "Secret"));
});

test("the daily Secret discount is deterministic, pack-specific and 20% off", () => {
  const day = "2026-10-27";
  assert.equal(dailyDiscountPack("42", day), dailyDiscountPack("42", day));
  const pack = packs.find(
    (entry) => entry.id === dailyDiscountPack("42", day),
  );
  assert.ok(pack);
  const effect = { randomPackDiscount: 20 };
  assert.equal(
    secretPackDiscount(pack, "42", day, effect),
    Math.round(pack.price * 0.2),
  );
  assert.equal(
    secretPackDiscount(
      packs.find((entry) => entry.id !== pack.id),
      "42",
      day,
      effect,
    ),
    0,
  );
  assert.equal(secretPackDiscount(pack, "42", day, { randomPackDiscount: 0 }), 0);
  assert.equal(secretPackDiscount(pack, "42", day, null), 0);
});

test("daily quests track progress, pay once and reset on a new UTC day", () => {
  const day = "2026-10-27";
  assert.equal(dailyQuests.length, 4);
  assert.ok(dailyQuests.every((quest) => quest.reward > 0));
  assert.ok(
    dailyQuests.reduce((total, quest) => total + quest.reward, 0) >= 400,
    "the day's quests should pay at least £4.00",
  );
  let state = normalizeQuestState({}, day);
  assert.deepEqual(state.progress, { packs: 0, epic: 0, sold: 0 });
  assert.equal(claimableQuests(state, day).length, 0);
  state = addQuestProgress(state, day, "packs", 1);
  assert.equal(claimableQuests(state, day).length, 1);
  const first = completeDailyQuest(state, day, "open-1");
  assert.equal(first.quest.reward, 100);
  assert.deepEqual(first.state.claimed, ["open-1"]);
  assert.equal(claimableQuests(first.state, day).length, 0);
  assert.throws(() => completeDailyQuest(first.state, day, "open-1"), /already/);
  state = addQuestProgress(first.state, day, "packs", 2);
  assert.equal(claimableQuests(state, day).length, 1);
  assert.equal(claimableQuests(state, day)[0].id, "open-3");
  assert.throws(() => addQuestProgress(state, day, "unknown", 1), /known metric/);
  assert.throws(() => addQuestProgress(state, day, "packs", -1), /non-negative/);
  const tomorrow = normalizeQuestState(state, "2026-10-28");
  assert.deepEqual(tomorrow.progress, { packs: 0, epic: 0, sold: 0 });
  assert.deepEqual(tomorrow.claimed, []);
});

test("completed Card Index sets always pay cash of £50 or less once caps are full", () => {
  assert.ok(indexSets.length > 4);
  for (const set of indexSets) {
    const raritiesInSet = set.cardIds.map((id) => cardMap[id]?.rarity);
    const expected = raritiesInSet.includes("Crown")
      ? 5000
      : raritiesInSet.includes("Epic")
        ? 2500
        : 1000;
    assert.equal(set.cashReward, expected);
    assert.ok(set.cashReward > 0 && set.cashReward <= 5000);
  }
});
