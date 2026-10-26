import flags from "./flags.json" with { type: "json" };
import countryData from "./country-gdp.json" with { type: "json" };

const countryTiers = [
  [5_000_000_000_000, "Crown", 6500],
  [2_000_000_000_000, "Epic", 4500],
  [1_000_000_000_000, "Epic", 3200],
  [500_000_000_000, "Uncommon", 1800],
  [100_000_000_000, "Uncommon", 1000],
  [30_000_000_000, "Common", 200],
  [0, "Common", 100],
];
const notableFigures = {
  "Donald Trump": { rarity: "Epic", value: 23000 },
  "King Charles III": { rarity: "Epic", value: 7500 },
  "Charles III": { rarity: "Epic", value: 2600 },
  "Xi Jinping": { rarity: "Crown", value: 5600 },
  "Vladimir Putin": { rarity: "Crown", value: 5000 },
  "Narendra Modi": { rarity: "Crown", value: 4000 },
  "Volodymyr Zelenskyy": { rarity: "Crown", value: 4400 },
  "Emmanuel Macron": { rarity: "Epic", value: 3400 },
  "Benjamin Netanyahu": { rarity: "Epic", value: 3000 },
  "Andy Burnham": { rarity: "Epic", value: 2000 },
};

function countryCode(country) {
  const emoji = flags[country];
  if (!emoji) return null;
  return [...emoji]
    .map((character) =>
      String.fromCharCode(character.codePointAt(0) - 0x1f1e6 + 97),
    )
    .join("");
}

export function rateLeader(card) {
  if (card.role === "National flag" || card.value < 0) return card;
  const notable = notableFigures[card.name];
  if (notable) return { ...card, ...notable };

  const gdp = countryData.countries[countryCode(card.country)] || 0;
  const [threshold, rarity, value] =
    countryTiers.find(([minimum]) => gdp >= minimum) || countryTiers.at(-1);
  return { ...card, rarity, value: Math.round(value * 0.4) };
}
