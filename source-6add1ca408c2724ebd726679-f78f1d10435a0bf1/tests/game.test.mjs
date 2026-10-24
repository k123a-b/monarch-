import test from "node:test";
import assert from "node:assert/strict";
import {
  packs,
  rollPack,
  weightedWinner,
  catalog,
  cardMap,
  packProgress,
  packValueRange,
} from "../shared/catalog.mjs";
import {
  activityReward,
  validFriendCode,
  validTradeCards,
  randomBelow,
} from "../shared/rules.mjs";
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
test("Apex replaces exactly one low card with Crown when all rolls are Epic", () => {
  const pull = rollPack(
    packs.find((p) => p.id === "apex"),
    rng(0),
  );
  assert.equal(pull.filter((c) => c.rarity === "Crown").length, 1);
  assert.equal(pull.filter((c) => c.rarity === "Epic").length, 4);
});
test("original catalogue contains exactly 93 templates excluding world expansion", () =>
  assert.equal(catalog.filter((c) => c.set !== "world").length, 93));
test("Kim Jong Un cannot occur in normal world rarity pools", () => {
  const kim = cardMap.kim;
  assert.equal(kim.rarity, "Chase");
  assert.equal(kim.value, 21000000);
  const world = packs.find((p) => p.id === "world");
  assert.equal(world.chaseOdds, 45000);
  assert.equal(world.price, 1000);
});
test("weighted draw respects exact stake boundaries", () => {
  const entries = [
    { user_id: "a", amount: 1 },
    { user_id: "b", amount: 3 },
  ];
  assert.equal(
    weightedWinner(entries, () => 0),
    "a",
  );
  assert.equal(
    weightedWinner(entries, () => 1),
    "b",
  );
  assert.equal(
    weightedWinner(entries, () => 3),
    "b",
  );
  assert.equal(
    weightedWinner([], () => 0),
    null,
  );
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
  last_heartbeat: new Date(now - 30000),
};
test("active 10-minute threshold pays 50 pence", () =>
  assert.deepEqual(activityReward(account, true, now), {
    day: "2026-10-24",
    reward: 50,
    active: 0,
    paid: 50,
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
test("daily rewards stop at 300 pence", () => {
  const result = activityReward({ ...account, daily_reward: 300 }, true, now);
  assert.equal(result.reward, 0);
  assert.equal(result.paid, 300);
});
test("UTC midnight resets both daily earnings and progress", () => {
  const result = activityReward(
    { ...account, reward_day: "2026-10-23", daily_reward: 300 },
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
});
test("Trump returns £70 and the explicit satirical penalty is isolated to its template", () => {
  assert.equal(cardMap["world-c6af8a1c1faf4aae"].name, "Donald Trump");
  assert.equal(cardMap["world-c6af8a1c1faf4aae"].value, 7000);
  assert.deepEqual(
    catalog.filter((c) => c.value < 0).map((c) => c.id),
    ["world-former-keir-starmer"],
  );
  assert.equal(cardMap["world-former-keir-starmer"].value, -2500);
});
test("world packs can return less or more than their purchase price", () => {
  const p = packs.find((p) => p.id === "world");
  const low = rollPack(p, rng(0)).reduce((sum, c) => sum + c.value, 0);
  const high = rollPack(p, rng(99800000)).reduce((sum, c) => sum + c.value, 0);
  assert.ok(low < p.price);
  assert.ok(high > p.price);
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
  const random = (max) => (max === 100000000 ? 0 : max - 1);
  const ordinary = rollPack(pack, random);
  assert.ok(ordinary.some((c) => c.value < 0));
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
test("simultaneous tabs cannot multiply a full day of play rewards", () => {
  const start = Date.parse("2026-10-24T12:00:00Z");
  let a = {
    reward_day: "2026-10-24",
    active_seconds: 0,
    daily_reward: 0,
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
        last_heartbeat: new Date(at),
      };
    }
  }
  assert.equal(credited, 300);
  assert.equal(a.daily_reward, 300);
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
  });
});
