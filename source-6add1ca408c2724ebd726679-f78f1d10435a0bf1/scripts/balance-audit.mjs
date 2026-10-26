// Reproducible simulation only: no accounts, database writes, or production RNG changes.
import { packs, rollPack, money } from "../shared/catalog.mjs";
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
  let loss = 0,
    smallWin = 0,
    mediumWin = 0,
    jackpot = 0,
    special = 0,
    failedGuarantees = 0;
  for (let i = 1; i <= samples; i++) {
    const cards = rollPack(pack, random, { guaranteedEpic: i % 10 === 0 });
    const total = cards.reduce((sum, c) => sum + c.value, 0);
    values.push(total);
    if (total < pack.price) loss++;
    else if (total < pack.price * 2) smallWin++;
    else if (total < pack.price * 10) mediumWin++;
    if (total >= pack.price * 10) jackpot++;
    if (cards.some((c) => ["Alpha", "Chase"].includes(c.rarity))) special++;
    if (
      i % 10 === 0 &&
      !cards.some((c) => ["Epic", "Crown", "Alpha", "Chase"].includes(c.rarity))
    )
      failedGuarantees++;
  }
  values.sort((a, b) => a - b);
  report.push({
    pack: pack.name,
    samples,
    price: money(pack.price),
    medianSellValue: money((values[samples / 2 - 1] + values[samples / 2]) / 2),
    losingPacks: `${((loss / samples) * 100).toFixed(2)}%`,
    smallWinsUnder2x: `${((smallWin / samples) * 100).toFixed(2)}%`,
    mediumWins2xTo10x: `${((mediumWin / samples) * 100).toFixed(2)}%`,
    winsAtLeast10x: `${((jackpot / samples) * 100).toFixed(2)}%`,
    specialPacks: special,
    failedGuarantees,
  });
}
console.log(JSON.stringify(report, null, 2));
console.log(
  "Simulated sell values, not automatic cash credits. Rare jackpots do not establish a stable average return or guarantee profit.",
);
const outsideBalancedRange = report.some((pack) => {
  const lossRate = Number.parseFloat(pack.losingPacks);
  return lossRate < 45 || lossRate > 55;
});
if (report.some((pack) => pack.failedGuarantees) || outsideBalancedRange)
  process.exitCode = 1;
