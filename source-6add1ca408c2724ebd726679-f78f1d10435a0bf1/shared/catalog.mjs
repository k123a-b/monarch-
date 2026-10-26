import flags from "./flags.json" with { type: "json" };
import leaderData from "./leaders.json" with { type: "json" };
import portraits from "./portraits.json" with { type: "json" };
import { rateLeader } from "./leader-ratings.mjs";
export const money = (p) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    p / 100,
  );
const cards = [];
const flagCode = (country) =>
  [...(flags[country] || "")]
    .map((character) =>
      String.fromCharCode(character.codePointAt(0) - 0x1f1e6 + 97),
    )
    .join("");
const patterns = [
  "waves",
  "grid",
  "sand",
  "spiral",
  "rays",
  "stars",
  "scales",
  "chevrons",
  "orbs",
];
function add(set, rarity, names, values, emoji) {
  names.split("|").forEach((name, i) =>
    cards.push({
      id: `${set}-${rarity.toLowerCase()}-${i}`,
      name,
      set,
      rarity,
      value: values[i],
      emoji: emoji[i % emoji.length],
      pattern: patterns[i % patterns.length],
      colors:
        rarity === "Crown"
          ? ["#5b4320", "#e1bc68"]
          : rarity === "Epic"
            ? ["#1a345c", "#8bb9ef"]
            : ["#243a3c", "#9db9b7"],
      flavor: [
        "An entirely normal member of the royal court.",
        "The treasury has requested a word.",
        "Born to rule. Mostly here for the snacks.",
        "His Majesty regrets absolutely nothing.",
      ][i % 4],
    }),
  );
}
add(
  "brainrot",
  "Common",
  "Tralalero Tralala|Tung Tung Tung Sahur|Chimpanzini Bananini|Lirilì Larilà|Brr Brr Patapim|Bombombini Gusini|Trippi Troppi|Rhino Toasterino|Bobritto Bandito|Il Cacto Hipopotamo|Crocodillo Ananasinno|Croco Potato|Bluberini Octopusini|Ganganzeli Trulala|Pot Hotspot|Ballerino Lololo|Bulbito Bandito Traktorito|Malame Amarale|Girafa Celestre|Pippi Poppa Pippo Peppe|Slimo Li Appluni|Bananita Dolfinita|Frogilato Limituni|Penguino Cocosino",
  [
    28, 18, 14, 22, 16, 24, 12, 20, 30, 26, 10, 32, 15, 35, 34, 29, 25, 23, 19,
    17, 15, 13, 11, 9,
  ],
  [
    "🦈",
    "🪵",
    "🍌",
    "🌵",
    "🌳",
    "🪿",
    "🦐",
    "🦏",
    "🦫",
    "🦛",
    "🐊",
    "🥔",
    "🐙",
    "🎺",
  ],
);
add(
  "brainrot",
  "Uncommon",
  "Cappuccino Assassino|Ballerina Cappuccina|Boneca Ambalabu|Glorbo Fruttodrillo|Frigo Camelo|Tukanno Bananno|Cocofanto Elefanto|Trullimero Trullicina|Espressona Signora|Piccione Macchina|Porco Elettronico|Trenostruzzo Turbo 3000|Giraffa Meloniera|Penguinelli Cactussini|Matteo Lavacanita|Orangutini Ananasini|Perochello Lemonchello|Spijuniro Golubiro|Graipussi Medussi|Frulli Frulla|Ecco Cavallo Virtuoso|Cocosino Rhino|Chimpansini Capuchini|Bobrini Cocococini",
  [
    90, 95, 85, 80, 100, 70, 65, 110, 105, 60, 115, 130, 75, 125, 76, 78, 82,
    88, 72, 68, 62, 58, 52, 48,
  ],
  [
    "☕",
    "🩰",
    "🐸",
    "🍉",
    "🐫",
    "🦜",
    "🐘",
    "🐈",
    "☕",
    "🐦",
    "🐷",
    "🚂",
    "🦒",
    "🐧",
  ],
);
add(
  "brainrot",
  "Epic",
  "Spaghetti Tualetti|Burbaloni Luliloli|Gorillo Watermellondrillo|Brri Brri Bicus Dicus Bombicus|Tric Trac Baraboom|Zibra Zubra Zibralini|Pearuni Deeruni|Raccooni Watermelunni|Tigroligre Frutonni|Tigrrullini Watermellini",
  [250, 300, 220, 350, 400, 380, 240, 320, 340, 360],
  ["🍝", "🦫", "🦍", "💣", "🌳", "🦓", "🍐", "🦝", "🐅", "🍉"],
);
add(
  "brainrot",
  "Crown",
  "La Vaca Saturno Saturnita|Tracotucotulu Delapeladustuz",
  [3500, 3800],
  ["🐄", "🐫"],
);
add(
  "royal",
  "Common",
  "Copper Pawn|Tinfoil Squire|Rusty Rook|Loyal Lackey|Cardboard Baron|Mothball Marquis|Velvet Urchin",
  [60, 70, 80, 90, 100, 110, 120],
  ["♟", "🛡", "♜", "⚔", "🎩", "🪶", "💎"],
);
add(
  "royal",
  "Uncommon",
  "Silver Herald|Velvet Knight|Gilded Goose|Brass Bishop|Marbled Marshall|Clockwork Count|Porcelain Pike",
  [180, 190, 200, 210, 225, 240, 260],
  ["📯", "♞", "🪿", "♝", "⚔", "⚙", "🔱"],
);
add(
  "royal",
  "Epic",
  "Sapphire Regent|Emerald Vizier|Obsidian Duchess|Ruby Marshal|Astral Chancellor|Starlit Strategist|Crimson Cartographer",
  [700, 760, 820, 880, 950, 1020, 1100],
  ["💎", "💚", "♛", "♦", "✨", "♞", "🗺"],
);
add(
  "royal",
  "Crown",
  "Crown of Ashes|Crown of Frost|Crown of Tides|Crown of Spades|Crown of Embers|Crown of Cinders|Crown of Eternity",
  [3000, 3500, 4000, 4500, 5000, 5500, 6000],
  ["👑"],
);
const fortniteCards = [
  { id: "fortnite-recruit", name: "Recruit", set: "fortnite", rarity: "Common", value: 8, emoji: "🪖", pattern: "grid", colors: ["#39495b", "#a4b9c8"], image: "https://fortnite-api.com/images/cosmetics/br/CID_001_Athena_Commando_F_Default/icon.png", flavor: "The original recruit, ready for one more match." },
  { id: "fortnite-jonesy", name: "Jonesy the First", set: "fortnite", rarity: "Uncommon", value: 50, emoji: "🧢", pattern: "waves", colors: ["#46586a", "#d0bd91"], image: "https://fortnite-api.com/images/cosmetics/br/CID_883_Athena_Commando_M_ChOneJones/icon.png", flavor: "A familiar face from the very first run." },
  { id: "fortnite-commando", name: "Commando", set: "fortnite", rarity: "Uncommon", value: 35, emoji: "🎖️", pattern: "chevrons", colors: ["#43533e", "#c6b27a"], image: "https://fortnite-api.com/images/cosmetics/br/CID_016_Athena_Commando_F/icon.png", flavor: "A classic outfit from the early days." },
  { id: "fortnite-fishstick", name: "Fishstick", set: "fortnite", rarity: "Epic", value: 180, emoji: "🐟", pattern: "waves", colors: ["#344f62", "#e4a07a"], image: "https://fortnite-api.com/images/cosmetics/br/CID_315_Athena_Commando_M_TeriyakiFish/icon.png", flavor: "A fish out of water, and somehow still winning." },
  { id: "fortnite-agent-peely", name: "Agent Peely", set: "fortnite", rarity: "Epic", value: 260, emoji: "🍌", pattern: "rays", colors: ["#66551f", "#f1db65"], image: "https://fortnite-api.com/images/cosmetics/br/CID_701_Athena_Commando_M_BananaAgent/icon.png", flavor: "Undercover, but never underdressed." },
  { id: "fortnite-midas", name: "Midas", set: "fortnite", rarity: "Epic", value: 420, emoji: "🪙", pattern: "orbs", colors: ["#554321", "#f0cd72"], image: "https://fortnite-api.com/images/cosmetics/br/CID_694_Athena_Commando_M_CatBurglar/icon.png", flavor: "Every match turns to gold." },
  { id: "fortnite-renegade-raider", name: "Renegade Raider", set: "fortnite", rarity: "Crown", value: 400000, emoji: "🛩️", pattern: "scales", colors: ["#4e3919", "#f0ca77"], image: "https://fortnite-api.com/images/cosmetics/br/CID_028_Athena_Commando_F/icon.png", flavor: "A rare Crown pull with a special odds power." },
];
const chases = [
  ["crocodilo", "Bombardiro Crocodilo", 10000, "🐊", "brainrot"],
  ["signet", "Gilded Signet", 20000, "🖋", "royal"],
  ["sovereign", "Vault Sovereign", 50000, "🏛", "royal"],
  ["apex-crown", "Apex Crown", 150000, "⚡", "royal"],
  ["kim", "Kim Jong Un", 1500000, "🌏", "world"],
].map(([id, name, value, emoji, set]) => ({
  id,
  name,
  value,
  emoji,
  set,
  rarity: "Chase",
  pattern: "rays",
  colors: ["#4e3919", "#f0ca77"],
  flavor: "The court has officially lost its collective mind.",
  ...(id === "kim"
    ? {
        country: "North Korea",
        role: "Supreme Leader",
        image: leaderData.kim?.image,
        page: leaderData.kim?.page,
      }
    : {}),
}));
export const alpha = {
  id: "mystery-gold",
  name: "Mystery Gold",
  rarity: "Alpha",
  value: 1000000,
  set: "alpha",
  emoji: "👑",
  pattern: "stars",
  colors: ["#56401a", "#ffe093"],
  flavor: "One crown. One serial. An unreasonable amount of gold.",
};
const nationFlagValues = [
  ["United States", 50000],
  ["China", 45000],
  ["Russia", 40000],
  ["India", 35000],
  ["United Kingdom", 32000],
  ["France", 30000],
  ["Germany", 28000],
  ["Japan", 26000],
  ["South Korea", 24000],
  ["Turkey", 22000],
  ["Brazil", 20000],
  ["Saudi Arabia", 18000],
  ["Italy", 17000],
  ["Pakistan", 16000],
  ["Indonesia", 15000],
  ["Canada", 14000],
  ["Australia", 13000],
  ["Spain", 12000],
  ["Mexico", 11000],
  ["Poland", 10000],
  ["Ukraine", 9500],
  ["Netherlands", 9000],
  ["Iran", 8500],
  ["Egypt", 8000],
  ["United Arab Emirates", 7500],
  ["Switzerland", 7000],
  ["Sweden", 6500],
  ["Norway", 6000],
  ["Singapore", 5500],
  ["South Africa", 4900],
  ["Argentina", 4500],
  ["Nigeria", 4000],
  ["Thailand", 3500],
  ["Vietnam", 3000],
  ["Malaysia", 2500],
  ["Philippines", 2000],
  ["Bangladesh", 1500],
  ["Qatar", 1000],
  ["Greece", 900],
];
const nationFlagCards = nationFlagValues.map(([country, value], index) => {
  const rarity =
    value >= 25000
      ? "Crown"
      : value >= 10000
        ? "Epic"
        : value >= 5000
          ? "Uncommon"
          : "Common";
  const valueMultiplier = {
    Common: 0.03,
    Uncommon: 0.06,
    Epic: 0.1,
    Crown: 0.12,
  }[rarity];
  const lowValueFlags = {
    Greece: 12,
    Qatar: 18,
    Bangladesh: 24,
  };
  return {
    id: `world-flag-${country.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: `Flag of ${country}`,
    country,
    role: "National flag",
    set: "world",
    rarity,
    value: lowValueFlags[country] ?? Math.round(value * valueMultiplier * 1.13),
    page: `https://flagcdn.com/w320/${flagCode(country)}.png`,
    emoji: flags[country],
    pattern: patterns[index % patterns.length],
    colors:
      rarity === "Crown" ? ["#5b4320", "#e1bc68"] : ["#1a345c", "#8bb9ef"],
    flavor:
      "A national flag card. Its fictional value reflects a broad game-power tier.",
  };
});
export const catalog = [
  ...cards,
  ...fortniteCards,
  ...chases,
  alpha,
  ...leaderData.cards.map(rateLeader),
  ...nationFlagCards,
].map((c) => ({
  ...c,
  value:
    c.id === "kim" || c.id === "fortnite-renegade-raider"
      ? c.value
      : Math.sign(c.value) * Math.round(Math.abs(c.value) * 0.75),
  flag: flags[c.country],
  page:
    c.role === "National flag"
      ? `https://flagcdn.com/w320/${flagCode(c.country)}.png`
      : c.page,
  image:
    c.role === "National flag"
      ? `/img/flags/${flagCode(c.country)}.png`
      : portraits[c.id] ||
        c.image ||
        (c.set === "royal"
          ? "/img/" +
            (c.rarity === "Crown"
              ? "apex"
              : c.rarity === "Epic"
                ? "vault"
                : "royal") +
            ".png"
          : c.rarity === "Alpha"
            ? "/img/apex.png"
            : c.set === "world"
              ? "/img/leader-placeholder.svg"
              : undefined),
  portraitPlaceholder: Boolean(
    c.portraitPlaceholder ||
    (c.set === "world" &&
      c.role !== "National flag" &&
      !portraits[c.id] &&
      !c.image),
  ),
}));
export const cardMap = Object.fromEntries(catalog.map((c) => [c.id, c]));
const rarityPowerups = Object.freeze({
  Common: [
    { name: "No power-up", epicBonus: 0 },
    { name: "No power-up", epicBonus: 0 },
    { name: "No power-up", epicBonus: 0 },
    { name: "No power-up", epicBonus: 0 },
    { name: "No power-up", epicBonus: 0 },
    { name: "No power-up", epicBonus: 0 },
    { name: "No power-up", epicBonus: 0 },
    { name: "No power-up", epicBonus: 0 },
    { name: "No power-up", epicBonus: 0 },
    { name: "Tiny lift", epicBonus: 10000 },
    { name: "Slight stumble", epicBonus: -10000 },
    { name: "Thrifty crown", epicBonus: 0, packDiscount: 10 },
  ],
  Uncommon: [
    { name: "Lucky charm", epicBonus: 20000 },
    { name: "Crooked luck", epicBonus: -20000 },
  ],
  Epic: [
    { name: "Court's favor", epicBonus: 100000 },
    { name: "Court intrigue", epicBonus: -100000 },
  ],
  Crown: [
    { name: "Royal decree", epicBonus: 1500000 },
    { name: "Royal blunder", epicBonus: -1500000 },
  ],
  Chase: [
    { name: "Chase energy", epicBonus: 3000000 },
    { name: "Chase misstep", epicBonus: -3000000 },
  ],
  Alpha: [
    { name: "Golden touch", epicBonus: 4000000 },
    { name: "Gilded curse", epicBonus: -4000000 },
  ],
});
export function cardPowerup(card) {
  const template = cardMap[card?.template_id || card?.id] || card;
  if (!template?.id || !rarityPowerups[template.rarity])
    throw Error("Card powerup requires a known card template.");
  let hash = 0;
  for (const character of template.id)
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  if (template.id === "fortnite-renegade-raider")
    return {
      name: "Renegade's command",
      epicBonus: 0,
      crownBonus: 700000,
      everyOtherCard: false,
    };
  const powerup =
    rarityPowerups[template.rarity][
      hash % rarityPowerups[template.rarity].length
    ];
  return {
    ...powerup,
    crownBonus: 0,
    everyOtherCard: template.id === "kim",
  };
}
export function loadoutPowerup(cards) {
  if (!Array.isArray(cards) || cards.length > 4)
    throw Error("A loadout can contain at most four cards.");
  const powerups = cards.map(cardPowerup);
  const epicBonus = Math.max(
    -4000000,
    Math.min(
      4000000,
      powerups.reduce((total, powerup) => total + powerup.epicBonus, 0),
    ),
  );
  const crownBonus = Math.max(
    0,
    Math.min(
      700000,
      powerups.reduce((total, powerup) => total + (powerup.crownBonus || 0), 0),
    ),
  );
  return {
    epicBonus,
    crownBonus,
    everyOtherCard: powerups.some((powerup) => powerup.everyOtherCard),
    packDiscount: Math.max(
      0,
      ...powerups.map((powerup) => powerup.packDiscount || 0),
    ),
  };
}
export const leaderSource = {
  source: leaderData.source,
  retrieved: leaderData.retrieved,
  note: leaderData.note,
};
export const packs = [
  {
    id: "brainrot",
    name: "Brainrot Pack",
    short: "BRAINROT",
    subtitle: "A little unhinged. Entirely collectible.",
    price: 100,
    count: 4,
    set: "brainrot",
    odds: [74000000, 24375000, 1624675, 260, 65],
    chase: "crocodilo",
    chaseOdds: 400,
    art: "brainrot",
    color: "#64a3ce",
    tag: "THE PEOPLE’S FAVOURITE",
  },
  {
    id: "royalty",
    name: "Royalty Booster",
    short: "ROYALTY",
    subtitle: "An invitation to the inner circle.",
    price: 500,
    count: 4,
    set: "royal",
    odds: [86000000, 12000000, 1900000, 99900, 100],
    chase: "signet",
    chaseOdds: 500,
    art: "royal",
    color: "#ba7983",
    tag: "A TASTE OF THE HIGH LIFE",
  },
  {
    id: "vault",
    name: "Monarch Vault Crate",
    short: "MONARCH VAULT",
    subtitle: "The treasury keeps its best secrets.",
    price: 2500,
    count: 5,
    set: "royal",
    odds: [0, 78000000, 18000000, 3998000, 2000],
    chase: "sovereign",
    chaseOdds: 800,
    art: "vault",
    color: "#70b69b",
    tag: "NO COMMONS. ALL CLASS.",
  },
  {
    id: "apex",
    name: "Apex Alpha Pack",
    short: "APEX ALPHA",
    subtitle: "For those who were born to reign.",
    price: 10000,
    count: 5,
    set: "royal",
    odds: [0, 0, 64000000, 35990000, 10000],
    chase: "apex-crown",
    chaseOdds: 2000,
    guarantee: true,
    art: "apex",
    color: "#d9bb72",
    tag: "CROWN OR BETTER GUARANTEED",
  },
  {
    id: "fortnite",
    name: "Fortnite Drop Pack",
    short: "FORTNITE DROP",
    subtitle: "Drop in with familiar faces and rare pulls.",
    price: 12500,
    count: 4,
    set: "fortnite",
    odds: [86000000, 11990000, 1999000, 1000, 10],
    chase: "fortnite-renegade-raider",
    chaseOdds: 40000,
    art: "fortnite",
    color: "#81a2b7",
    tag: "DROP IN · BUILD YOUR SQUAD",
  },
  {
    id: "world",
    name: "World Leaders Pack",
    short: "WORLD LEADERS",
    subtitle: "International affairs. Unreasonable pulls.",
    price: 1000,
    count: 4,
    set: "world",
    odds: [74920000, 19200000, 5560000, 319840, 160],
    chase: "kim",
    chaseOdds: 45000,
    art: "world",
    color: "#a8a6ce",
    tag: "THE WORLD IS YOUR COLLECTION",
  },
];
export const rarities = ["Common", "Uncommon", "Epic", "Crown", "Alpha"];
export const starterOdds = [85000000, 12000000, 2500000, 500000, 0];
// Immutable template pools are safe to reuse; player state always stays in the database.
const normalPools = new Map();
for (const card of catalog) {
  if (!["Common", "Uncommon", "Epic", "Crown"].includes(card.rarity)) continue;
  const key = `${card.set}:${card.rarity}`;
  if (!normalPools.has(key)) normalPools.set(key, []);
  normalPools.get(key).push(card);
}
// All randomness is injected; production supplies cryptographic integer sampling.
export function rollPack(
  pack,
  randomInt,
  { guaranteedEpic = false, powerups = [] } = {},
) {
  const effect = loadoutPowerup(powerups);
  const odds = [...pack.odds];
  if (effect.epicBonus > 0) {
    let remaining = effect.epicBonus;
    for (const index of [0, 1]) {
      const shifted = Math.min(odds[index], remaining);
      odds[index] -= shifted;
      odds[2] += shifted;
      remaining -= shifted;
    }
  } else if (effect.epicBonus < 0) {
    const shifted = Math.min(odds[2], -effect.epicBonus);
    odds[2] -= shifted;
    odds[0] += shifted;
  }
  if (effect.crownBonus > 0) {
    let remaining = effect.crownBonus;
    for (const index of [0, 1]) {
      const shifted = Math.min(odds[index], remaining);
      odds[index] -= shifted;
      odds[3] += shifted;
      remaining -= shifted;
    }
  }
  function rollRarity(minimumIndex = 0) {
    const total = odds
      .slice(minimumIndex)
      .reduce((sum, weight) => sum + weight, 0);
    if (total <= 0) throw Error("Empty rarity odds pool.");
    let roll = randomInt(total);
    for (let index = minimumIndex; index < odds.length; index++) {
      if (roll < odds[index]) return rarities[index];
      roll -= odds[index];
    }
    throw Error("Rarity roll was outside its odds.");
  }
  const used = new Set();
  function pick(rarity) {
    if (rarity === "Alpha") return { ...alpha };
    const pool = normalPools.get(`${pack.set}:${rarity}`) || [];
    const fresh = pool.filter((c) => !used.has(c.id));
    const available = fresh.length ? fresh : pool;
    if (!available.length) throw Error("Empty rarity pool");
    const card = available[randomInt(available.length)];
    used.add(card.id);
    return { ...card };
  }
  const result = Array.from({ length: pack.count }, (_, index) => {
    const floor = effect.everyOtherCard && index % 2 === 1 ? 1 : 0;
    return pick(rollRarity(floor));
  });
  if (
    pack.guarantee &&
    !result.some((c) => ["Crown", "Alpha"].includes(c.rarity))
  ) {
    const i = result.reduce(
      (a, c, j) => (c.value < result[a].value ? j : a),
      0,
    );
    result[i] = pick("Crown");
  }
  // Account milestones raise the floor without removing a better natural pull.
  if (
    guaranteedEpic &&
    !result.some((c) => ["Epic", "Crown", "Alpha", "Chase"].includes(c.rarity))
  ) {
    const lowest = result.reduce(
      (a, c, i) => (c.value < result[a].value ? i : a),
      0,
    );
    result[lowest] = pick("Epic");
  }
  if (randomInt(pack.chaseOdds) === 0) {
    const chase = cardMap[pack.chase];
    const eligible = result
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.rarity !== "Alpha" && c.value < chase.value)
      .sort((a, b) => a.c.value - b.c.value);
    if (eligible.length) result[eligible[0].i] = { ...chase };
  }
  return result;
}
export function rollStarterPack(randomInt) {
  const roll = randomInt(100000000);
  let cumulative = 0;
  const rarity = rarities.find(
    (_, index) => (cumulative += starterOdds[index]) > roll,
  );
  if (!rarity) throw Error("Invalid starter pack odds");
  const sets = [
    ...new Set(
      catalog
        .filter(
          (card) =>
            card.rarity === rarity &&
            card.value >= 0 &&
            ["brainrot", "royal", "world"].includes(card.set),
        )
        .map((card) => card.set),
    ),
  ];
  if (!sets.length) throw Error("Empty starter pack rarity pool");
  const set = sets[randomInt(sets.length)];
  const pool = catalog.filter(
    (card) =>
      card.rarity === rarity &&
      card.set === set &&
      card.value >= 0 &&
      ["brainrot", "royal", "world"].includes(card.set),
  );
  return { ...pool[randomInt(pool.length)] };
}
export function weightedWinner(entries, randomInt) {
  const total = entries.reduce((s, e) => s + Number(e.amount), 0);
  if (!total) return null;
  let n = randomInt(total);
  return entries.find((e) => (n -= Number(e.amount)) < 0)?.user_id;
}

// Counts successful purchases across every pack, using the persisted account total.
export function packProgress(opened = 0) {
  if (!Number.isSafeInteger(opened) || opened < 0)
    throw Error("Invalid pack count");
  const progress = opened % 10;
  return { progress, remaining: 10 - progress, nextGuaranteed: progress === 9 };
}
export function packValueRange(pack) {
  const values = catalog
    .filter(
      (c) => c.set === pack.set && pack.odds[rarities.indexOf(c.rarity)] > 0,
    )
    .map((c) => c.value);
  return { min: Math.min(...values), max: Math.max(...values) };
}
