// Reproducible simulation only: no accounts, database writes, or production RNG changes.
import {
  cardMap,
  catalog,
  loadoutPowerup,
  money,
  packs,
  rollPack,
  WINDFALL_CHANCE,
  WINDFALL_ROLL_SCALE,
} from "../shared/catalog.mjs";

const samples = 100000;
const sensitivitySamples = 20000;

function seededRandom(pack) {
  let seed = [...pack.id].reduce(
    (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
    8374201,
  );
  const next32 = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return seed >>> 0;
  };
  return (max) => {
    if (!Number.isSafeInteger(max) || max <= 0)
      throw Error("Random range must be a positive safe integer.");
    if (max <= 0x100000000) {
      const limit = 0x100000000 - (0x100000000 % max);
      let value;
      do value = next32();
      while (value >= limit);
      return value % max;
    }
    // A boosted chase roll exceeds 32 bits, so build a 53-bit sample.
    const limit = Math.floor(2 ** 53 / max) * max;
    let value;
    do value = (next32() & 0x1fffff) * 0x100000000 + next32();
    while (value >= limit);
    return value % max;
  };
}

function simulate(pack, powerups, count, withPity = false) {
  const random = seededRandom(pack);
  const values = [];
  let returned = 0;
  let loss = 0;
  let substantialLoss = 0;
  let smallWin = 0;
  let moderateWin = 0;
  let mediumWin = 0;
  let jackpot = 0;
  let special = 0;
  let mythics = 0;
  let failedGuarantees = 0;
  let epicOrBetter = 0;
  let crownOrBetter = 0;
  let chases = 0;
  let streak = 0;
  let pityPacks = 0;
  let pityWins = 0;
  let pityReturned = 0;
  for (let i = 1; i <= count; i++) {
    const guaranteedUncommon = withPity && streak >= 3;
    if (guaranteedUncommon) pityPacks++;
    const cards = rollPack(pack, random, {
      guaranteedEpic: i % 10 === 0,
      guaranteedUncommon,
      powerups,
    });
    const total = cards.reduce((sum, card) => sum + card.value, 0);
    const won = total >= pack.price;
    if (guaranteedUncommon) {
      pityReturned += total;
      if (won) pityWins++;
    }
    if (won) streak = 0;
    else streak = guaranteedUncommon ? 1 : streak + 1;
    values.push(total);
    returned += total;
    if (total < pack.price * 0.75) substantialLoss++;
    if (!won) loss++;
    else if (total < pack.price * 2) smallWin++;
    else {
      if (total < pack.price * 5) moderateWin++;
      if (total < pack.price * 10) mediumWin++;
    }
    if (total >= pack.price * 10) jackpot++;
    if (cards.some((card) => ["Alpha", "Chase", "Mythic"].includes(card.rarity)))
      special++;
    if (cards.some((card) => card.rarity === "Mythic")) mythics++;
    if (
      cards.some((card) =>
        ["Epic", "Crown", "Alpha", "Chase", "Mythic"].includes(card.rarity),
      )
    )
      epicOrBetter++;
    if (
      cards.some((card) =>
        ["Crown", "Alpha", "Chase", "Mythic"].includes(card.rarity),
      )
    )
      crownOrBetter++;
    if (cards.some((card) => card.rarity === "Chase")) chases++;
    if (
      i % 10 === 0 &&
      !cards.some((card) =>
        ["Epic", "Crown", "Alpha", "Chase", "Mythic"].includes(card.rarity),
      )
    )
      failedGuarantees++;
  }
  values.sort((a, b) => a - b);
  return {
    values,
    returned,
    loss,
    substantialLoss,
    smallWin,
    moderateWin,
    mediumWin,
    jackpot,
    special,
    mythics,
    failedGuarantees,
    epicOrBetter,
    crownOrBetter,
    chases,
    count,
    pityPacks,
    pityWins,
    pityReturned,
  };
}

const pitySamples = 100000;

const report = packs.map((pack) => {
  const result = simulate(pack, [], samples);
  const withPity = simulate(pack, [], pitySamples, true);
  const { values } = result;
  return {
    pack: pack.name,
    samples,
    price: money(pack.price),
    returnToPlayer: `${((result.returned / samples / pack.price) * 100).toFixed(1)}%`,
    medianSellValue: money(
      (values[samples / 2 - 1] + values[samples / 2]) / 2,
    ),
    winningPacks: `${(((samples - result.loss) / samples) * 100).toFixed(1)}%`,
    losingPacks: `${((result.loss / samples) * 100).toFixed(1)}%`,
    lossesOfAtLeast25Percent: `${((result.substantialLoss / samples) * 100).toFixed(1)}%`,
    smallWinsUnder2x: `${((result.smallWin / samples) * 100).toFixed(1)}%`,
    moderateWins2xTo5x: `${((result.moderateWin / samples) * 100).toFixed(1)}%`,
    mediumWins2xTo10x: `${((result.mediumWin / samples) * 100).toFixed(1)}%`,
    bigWins5xTo10x: `${(((result.mediumWin - result.moderateWin) / samples) * 100).toFixed(2)}%`,
    winsAtLeast10x: `${((result.jackpot / samples) * 100).toFixed(3)}%`,
    bestObserved: money(values[samples - 1]),
    worstObserved: money(values[0]),
    specialPacks: result.special,
    mythicPacks: result.mythics,
    mythicOdds: `1 in ${pack.jackpotOdds.toLocaleString()}`,
    mythicValue: money(cardMap[pack.jackpot].value),
    paydayOdds: pack.payday ? `1 in ${pack.paydayOdds}` : "natural only",
    paydayValue: pack.payday ? money(cardMap[pack.payday].value) : "n/a",
    windfallChance: `${(100 * WINDFALL_CHANCE / WINDFALL_ROLL_SCALE).toFixed(2)}%`,
    windfallValue: money(cardMap[pack.windfall].value),
    failedGuarantees: result.failedGuarantees,
    comebackPacks: withPity.pityPacks,
    comebackAverageValue: withPity.pityPacks
      ? money(withPity.pityReturned / withPity.pityPacks)
      : "n/a",
    comebackWinningPacks: `${(((pitySamples - withPity.loss) / pitySamples) * 100).toFixed(1)}%`,
    comebackWinRate: withPity.pityPacks
      ? `${((withPity.pityWins / withPity.pityPacks) * 100).toFixed(1)}%`
      : "n/a",
    returnToPlayerWithComeback: `${((withPity.returned / pitySamples / pack.price) * 100).toFixed(1)}%`,
  };
});

// Compare an end-game Crown loadout with a cheap Uncommon one so boost
// strength can be checked against the economy instead of eyeballed.
const crownLoadout = [
  "fortnite-renegade-raider",
  "royal-crown-0",
  "royal-crown-4",
  "food-mcdonalds",
  "world-746ff6f1c48f0b0d",
].map((id) => cardMap[id]);
const uncommonLoadout = catalog
  .filter((card) => card.rarity === "Uncommon")
  .slice(0, 5);
const loadoutSensitivity = packs.flatMap((pack) =>
  [
    ["Crown loadout", crownLoadout],
    ["Uncommon loadout", uncommonLoadout],
  ].map(([mode, cards]) => {
    const result = simulate(pack, cards, sensitivitySamples);
    const effect = loadoutPowerup(cards);
    const percent = (value) => `${value.toFixed(1)}%`;
    return {
      pack: pack.name,
      mode,
      samples: sensitivitySamples,
      returnToPlayer: percent(
        (result.returned / sensitivitySamples / pack.price) * 100,
      ),
      losingPacks: percent((result.loss / sensitivitySamples) * 100),
      packsWithEpicOrBetter: percent(
        (result.epicOrBetter / sensitivitySamples) * 100,
      ),
      packsWithCrownOrBetter: percent(
        (result.crownOrBetter / sensitivitySamples) * 100,
      ),
      chasePacks: result.chases,
      epicBonus: `${(effect.epicBonus / 1000000).toFixed(2)}%`,
      crownBonus: `${(effect.crownBonus / 1000000).toFixed(2)}%`,
    };
  }),
);

console.log(JSON.stringify(report, null, 2));
console.log(
  "\nSimulated sell values, not automatic cash credits. The model includes the every-tenth-pack Epic floor, so real return without milestones is lower.",
);
console.log(
  "\nComeback columns simulate three money-losing purchases in a row followed by a pack with no Commons (100,000 packs per pack). They are an upper bound: a spent comeback pack restarts the streak, and the server also stops a losing pack from counting as two losses. Comeback packs are a bonus above the published base odds, so returnToPlayerWithComeback can sit a few points above the base figure on packs whose Uncommon tier is close to the pack price.",
);
console.log("\nLoadout sensitivity (same model, 20,000 packs per mode):");
console.log(JSON.stringify(loadoutSensitivity, null, 2));
console.log(
  "Crown loadout: 5 distinct Crown-rarity cards reaching the Epic cap. Uncommon loadout: the five Uncommon-rarity cards. Both exclude Kim, Secret cards and permanent Index bonuses.",
);
const problems = [];
for (const [index, pack] of report.entries()) {
  const lossRate = Number.parseFloat(pack.losingPacks);
  const rtp = Number.parseFloat(pack.returnToPlayer);
  if (pack.failedGuarantees)
    problems.push(`${pack.pack}: ${pack.failedGuarantees} failed guarantees`);
  if (!(lossRate > 0 && lossRate < 100))
    problems.push(`${pack.pack}: both wins and losses must remain possible`);
  if (!(Number.parseFloat(pack.lossesOfAtLeast25Percent) > 0))
    problems.push(`${pack.pack}: no substantial losses observed`);
  if (!(Number.parseFloat(pack.smallWinsUnder2x) > 0))
    problems.push(`${pack.pack}: no small wins observed`);
  if (!(Number.isFinite(rtp) && rtp > 0))
    problems.push(`${pack.pack}: invalid simulated return`);
  if (!packs[index].jackpot || !cardMap[packs[index].jackpot])
    problems.push(`${pack.pack}: missing Mythic jackpot`);
  if (!(Number.parseFloat(pack.moderateWins2xTo5x) > 0))
    problems.push(`${pack.pack}: no moderate wins observed`);
  if (!(Number.parseFloat(pack.bigWins5xTo10x) > 0))
    problems.push(`${pack.pack}: no big wins observed`);
  const windfall = cardMap[packs[index].windfall];
  if (!windfall || windfall.rarity !== "Chase" || windfall.value !== packs[index].price * 5.5)
    problems.push(`${pack.pack}: invalid Windfall card`);
  if (packs[index].payday) {
    const card = cardMap[packs[index].payday];
    if (!card || card.rarity !== "Chase")
      problems.push(`${pack.pack}: missing Payday card`);
    else if (card.value < packs[index].price * 1.3)
      problems.push(`${pack.pack}: Payday card cannot reach 2x the price`);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
}
