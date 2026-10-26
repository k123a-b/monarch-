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
  loadoutPowerup,
} from "../shared/catalog.mjs";
import {
  activityReward,
  dailySpin,
  dailySpinSegments,
  friendTablePayout,
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
    max === 100000000
      ? rarityRoll
      : packs.some((p) => p.chaseOdds === max)
        ? chase
          ? 0
          : max - 1
        : 0;
test("Brainrot Pack: Common is 74% per card and every tier scales together", () => {
  const p = packs.find((p) => p.id === "brainrot");
  assert.equal(p.odds[0], 74000000);
  // Non-Common tiers keep their original relative proportions (26% / 8% = 3.25x).
  const original = [7500000, 499900, 80, 20];
  p.odds.slice(1).forEach((w, i) => assert.equal(w, original[i] * 3.25));
  // Roll just inside and just outside the Common band.
  assert.equal(rollPack(p, rng(73999999))[0].rarity, "Common");
  assert.equal(rollPack(p, rng(74000000))[0].rarity, "Uncommon");
});
for (const p of packs) {
  test(`${p.name}: integer odds sum to exactly 100%`, () =>
    assert.equal(
      p.odds.reduce((s, n) => s + n, 0),
      100000000,
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
  test(`${p.name}: a successful chase never overwrites an Alpha`, () => {
    const pull = rollPack(p, rng(99999999, true));
    assert.ok(pull.every((c) => c.rarity === "Alpha"));
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
test("Fortnite Drop Pack keeps 50/50 loss odds while making Epic characters much rarer", () => {
  const pack = packs.find((entry) => entry.id === "fortnite");
  assert.deepEqual(pack.odds, [55000000, 43998990, 1000000, 1000, 10]);
  assert.equal(pack.odds.reduce((sum, weight) => sum + weight, 0), 100000000);
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
    [1500, 3500, 3000, 8000, 14000, 20000, 400000],
  );
  const fortniteCards = catalog.filter((card) => card.set === "fortnite");
  assert.equal(fortniteCards.length, 30);
  assert.equal(new Set(fortniteCards.map((card) => card.name)).size, 30);
  assert.equal(new Set(fortniteCards.map((card) => card.id)).size, 30);
  assert.ok(
    fortniteCards.every((card) =>
      /^https:\/\/fortnite-api\.com\/images\/cosmetics\/br\/[^/]+\/icon\.png$/.test(card.image),
    ),
    "all 30 distinct Fortnite cards point to a cosmetic portrait",
  );
});

test("Apex replaces exactly one low card with Crown when all rolls are Epic", () => {
  const pull = rollPack(
    packs.find((p) => p.id === "apex"),
    rng(0),
  );
  assert.equal(pull.filter((c) => c.rarity === "Crown").length, 1);
  assert.equal(pull.filter((c) => c.rarity === "Epic").length, 4);
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
    } else {
      assert.ok(
        powerup.epicBonus !== 0 ||
          powerup.uncommonBonus !== 0 ||
          powerup.crownBonus !== 0 ||
          powerup.everyOtherCard,
        `${card.id} has an active power-up`,
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
  assert.equal(powerup.epicBonus, 0);
  assert.equal(powerup.uncommonBonus, 0);
  assert.ok(
    Math.abs(
      loadoutPowerup([cardMap.kim, cardMap.kim, cardMap.kim]).epicBonus,
    ) <= 1000000,
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
      ]),
    /at most four cards/,
  );
  const world = packs.find((pack) => pack.id === "world");
  const cards = rollPack(
    world,
    (max) => (max === world.chaseOdds ? max - 1 : 0),
    { powerups: [cardMap.kim] },
  );
  assert.equal(cards.length, world.count);
  assert.ok(["Uncommon", "Epic", "Crown", "Alpha"].includes(cards[1].rarity));
  assert.ok(["Uncommon", "Epic", "Crown", "Alpha"].includes(cards[3].rarity));
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
test("original catalogue contains 93 templates excluding world and Fortnite expansions", () =>
  assert.equal(catalog.filter((c) => c.set !== "world" && c.set !== "fortnite").length, 93));
test("Kim Jong Un cannot occur in normal world rarity pools", () => {
  const kim = cardMap.kim;
  assert.equal(kim.rarity, "Chase");
  assert.equal(kim.value, 1500000);
  const world = packs.find((p) => p.id === "world");
  assert.equal(world.chaseOdds, 45000);
  assert.equal(world.price, 1000);
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
  const leaders = catalog.filter((c) => c.set === "world");
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
  assert.equal(cardMap["world-israel-flag"].value, 3750);
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
test("World Leaders shifts 1.08 percentage points from Common to Epic", () => {
  const world = packs.find((pack) => pack.id === "world");
  assert.deepEqual(world.odds, [74920000, 19200000, 5560000, 319840, 160]);
  assert.equal(
    world.odds.reduce((sum, odds) => sum + odds, 0),
    100000000,
  );
  assert.equal(76000000 - world.odds[0], 1080000);
  assert.equal(world.odds[2] - 4480000, 1080000);
  assert.ok(
    world.odds
      .slice(1)
      .every((odds, index) => odds > [12000000, 2800000, 199900, 100][index]),
  );
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
    ["Epic", 23000],
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
  assert.ok(nonUkCharles.every((card) => card.value <= 400));
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
  assert.equal(trump.value, 250000);
  const netanyahu = catalog.find((card) => card.name === "Benjamin Netanyahu");
  assert.equal(netanyahu.rarity, "Crown");
  assert.equal(netanyahu.value, 100000);
  const andy = catalog.find((card) => card.name === "Andy Burnham");
  assert.equal(andy.rarity, "Epic");
  assert.equal(andy.value, 8000);
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
  assert.equal(king.value, 5625);
  assert.equal(king.rarity, "Epic");
  assert.equal(king.flag, "🇬🇧");
  assert.equal(cardMap["world-c6af8a1c1faf4aae"].name, "Donald Trump");
  assert.equal(cardMap["world-c6af8a1c1faf4aae"].value, 17250);
  assert.equal(cardMap["world-israel-flag"].rarity, "Epic");
  assert.equal(cardMap["world-israel-flag"].value, 5000);
  assert.equal(cardMap["world-israel-flag"].flag, "🇮🇱");
  assert.equal(cardMap["world-flag-greece"].value, 9);
  assert.equal(cardMap["world-flag-qatar"].value, 14);
  assert.equal(cardMap["world-flag-bangladesh"].value, 18);
  assert.deepEqual(
    catalog.filter((c) => c.value < 0).map((c) => c.id),
    ["world-former-keir-starmer"],
  );
  assert.equal(cardMap["world-former-keir-starmer"].value, -250);
});
test("world packs can return less or more than their purchase price", () => {
  const p = packs.find((p) => p.id === "world");
  const low = rollPack(p, rng(0)).reduce((sum, c) => sum + c.value, 0);
  const high = rollPack(p, rng(99800000)).reduce((sum, c) => sum + c.value, 0);
  assert.ok(low < p.price);
  assert.ok(high > p.price);
});
test("every pack can lose, win modestly, or produce a 10x jackpot", () => {
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
    const outcomes = { loss: 0, smallWin: 0, mediumWin: 0, jackpot: 0 };
    for (let i = 1; i <= 10000; i++) {
      const total = rollPack(pack, randomInt, {
        guaranteedEpic: i % 10 === 0,
      }).reduce((sum, card) => sum + card.value, 0);
      if (total < pack.price) outcomes.loss++;
      else if (total < pack.price * 2) outcomes.smallWin++;
      else if (total < pack.price * 10) outcomes.mediumWin++;
      if (total >= pack.price * 10) outcomes.jackpot++;
    }
    assert.ok(outcomes.loss > 0, `${pack.name} can return less than its cost`);
    assert.ok(outcomes.smallWin > 0, `${pack.name} can return a small win`);
    assert.ok(outcomes.mediumWin > 0, `${pack.name} can return 2x to 10x`);
    if (pack.id !== "fortnite")
      assert.ok(outcomes.jackpot > 0, `${pack.name} can return at least 10x`);
    if (pack.id === "world") {
      assert.ok(
        outcomes.loss / 10000 >= 0.65 && outcomes.loss / 10000 <= 0.8,
        `World Leaders loss chance should increase after the value rebalance, got ${(outcomes.loss / 100).toFixed(2)}%`,
      );
    }
  }
});

for (const pack of packs) {
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
        const normal = cards.filter((c) => c.rarity !== "Alpha");
        assert.equal(new Set(normal.map((c) => c.id)).size, normal.length);
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

test("the world milestone upgrades the negative penalty when it is the lowest card", () => {
  const pack = packs.find((p) => p.id === "world");
  const negativeIndex = catalog
    .filter((card) => card.set === "world" && card.rarity === "Common")
    .findIndex((card) => card.value < 0);
  let firstCard = true;
  const random = (max) => {
    if (max === 100000000) return 0;
    if (firstCard) {
      firstCard = false;
      return negativeIndex;
    }
    return max - 1;
  };
  const ordinary = rollPack(pack, random);
  assert.ok(ordinary.some((c) => c.value < 0));
  firstCard = true;
  const milestone = rollPack(pack, random, { guaranteedEpic: true });
  assert.ok(milestone.every((c) => c.value >= 0));
  assert.equal(milestone.filter((c) => c.rarity === "Epic").length, 1);
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

