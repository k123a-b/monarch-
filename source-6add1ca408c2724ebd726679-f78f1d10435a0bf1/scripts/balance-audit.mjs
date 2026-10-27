// Reproducible simulation only: no accounts, database writes, or production RNG changes.
import { cardMap, money, packs, rollPack } from "../shared/catalog.mjs";

const samples = 100000;
const report = [];
for (const pack of packs) {
  let seed = [...pack.id].reduce(
    (n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0,
    8374201,
  );
  const random = (max) => {
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
  const values = [];
  let returned = 0;
  let loss = 0;
  let smallWin = 0;
  let mediumWin = 0;
  let jackpot = 0;
  let special = 0;
  let mythics = 0;
  let failedGuarantees = 0;
  for (let i = 1; i <= samples; i++) {
    const cards = rollPack(pack, random, { guaranteedEpic: i % 10 === 0 });
    const total = cards.reduce((sum, card) => sum + card.value, 0);
    values.push(total);
    returned += total;
    if (total < pack.price) loss++;
    else if (total < pack.price * 2) smallWin++;
    else if (total < pack.price * 10) mediumWin++;
    if (total >= pack.price * 10) jackpot++;
    if (cards.some((card) => ["Alpha", "Chase", "Mythic"].includes(card.rarity)))
      special++;
    if (cards.some((card) => card.rarity === "Mythic")) mythics++;
    if (
      i % 10 === 0 &&
      !cards.some((card) =>
        ["Epic", "Crown", "Alpha", "Chase", "Mythic"].includes(card.rarity),
      )
    )
      failedGuarantees++;
  }
  values.sort((a, b) => a - b);
  report.push({
    pack: pack.name,
    samples,
    price: money(pack.price),
    returnToPlayer: `${((returned / samples / pack.price) * 100).toFixed(1)}%`,
    medianSellValue: money((values[samples / 2 - 1] + values[samples / 2]) / 2),
    winningPacks: `${(((samples - loss) / samples) * 100).toFixed(1)}%`,
    losingPacks: `${((loss / samples) * 100).toFixed(1)}%`,
    smallWinsUnder2x: `${((smallWin / samples) * 100).toFixed(1)}%`,
    mediumWins2xTo10x: `${((mediumWin / samples) * 100).toFixed(1)}%`,
    winsAtLeast10x: `${((jackpot / samples) * 100).toFixed(3)}%`,
    bestObserved: money(values[samples - 1]),
    worstObserved: money(values[0]),
    specialPacks: special,
    mythicPacks: mythics,
    mythicOdds: `1 in ${pack.jackpotOdds.toLocaleString()}`,
    mythicValue: money(cardMap[pack.jackpot].value),
    failedGuarantees,
  });
}

console.log(JSON.stringify(report, null, 2));
console.log(
  "Simulated sell values, not automatic cash credits. The model includes the every-tenth-pack Epic floor, so real return without milestones is lower.",
);
const problems = [];
for (const [index, pack] of report.entries()) {
  const lossRate = Number.parseFloat(pack.losingPacks);
  const rtp = Number.parseFloat(pack.returnToPlayer);
  if (pack.failedGuarantees)
    problems.push(`${pack.pack}: ${pack.failedGuarantees} failed guarantees`);
  if (lossRate < 50 || lossRate > 90)
    problems.push(`${pack.pack}: loss rate ${pack.losingPacks} is outside 50–90%`);
  if (Number.parseFloat(pack.winningPacks) <= 0)
    problems.push(`${pack.pack}: simulation produced no profitable packs`);
  if (rtp >= 100)
    problems.push(`${pack.pack}: simulated RTP ${pack.returnToPlayer} is not below 100%`);
  if (!packs[index].jackpot || !cardMap[packs[index].jackpot])
    problems.push(`${pack.pack}: missing Mythic jackpot`);
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exitCode = 1;
}
