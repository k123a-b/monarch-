import flags from "./flags.json" with { type: "json" };
import leaderData from "./leaders.json" with { type: "json" };
import portraits from "./portraits.json" with { type: "json" };
export const money = (p) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(
    p / 100,
  );
const cards = [];
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
const chases = [
  ["crocodilo", "Bombardiro Crocodilo", 10000, "🐊", "brainrot"],
  ["signet", "Gilded Signet", 20000, "🖋", "royal"],
  ["sovereign", "Vault Sovereign", 50000, "🏛", "royal"],
  ["apex-crown", "Apex Crown", 150000, "⚡", "royal"],
  ["kim", "Kim Jong Un", 21000000, "🌏", "world"],
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
export const catalog = [...cards, ...chases, alpha, ...leaderData.cards].map(
  (c) => ({
    ...c,
    flag: flags[c.country],
    image:
      portraits[c.id] ||
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
          : undefined),
  }),
);
export const cardMap = Object.fromEntries(catalog.map((c) => [c.id, c]));
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
    id: "world",
    name: "World Leaders Pack",
    short: "WORLD LEADERS",
    subtitle: "International affairs. Unreasonable pulls.",
    price: 1000,
    count: 4,
    set: "world",
    odds: [85000000, 12000000, 2800000, 199900, 100],
    chase: "kim",
    chaseOdds: 45000,
    art: "world",
    color: "#a8a6ce",
    tag: "THE WORLD IS YOUR COLLECTION",
  },
];
export const rarities = ["Common", "Uncommon", "Epic", "Crown", "Alpha"];
// Immutable template pools are safe to reuse; player state always stays in the database.
const normalPools = new Map();
for (const card of catalog) {
  if (!["Common", "Uncommon", "Epic", "Crown"].includes(card.rarity)) continue;
  const key = `${card.set}:${card.rarity}`;
  if (!normalPools.has(key)) normalPools.set(key, []);
  normalPools.get(key).push(card);
}
// All randomness is injected; production supplies cryptographic integer sampling.
export function rollPack(pack, randomInt, { guaranteedEpic = false } = {}) {
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
  const result = Array.from({ length: pack.count }, () => {
    const n = randomInt(100000000);
    let cumulative = 0;
    const idx = pack.odds.findIndex((w) => (cumulative += w) > n);
    return pick(rarities[idx]);
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
