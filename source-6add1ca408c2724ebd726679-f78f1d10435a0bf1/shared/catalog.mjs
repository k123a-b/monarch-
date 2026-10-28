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
const fortniteCard = (id, name, rarity, value, cosmeticId, emoji, pattern, colors, flavor) => ({
  id, name, set: "fortnite", rarity, value, emoji, pattern, colors,
  image: `https://fortnite-api.com/images/cosmetics/br/${cosmeticId}/icon.png`,
  flavor,
});
const fortniteCards = [
  fortniteCard("fortnite-recruit", "Recruit", "Common", 2000, "CID_563_Athena_Commando_M_RebirthDefaultD", "🪖", "grid", ["#39495b", "#a4b9c8"], "The original recruit, ready for one more match."),
  fortniteCard("fortnite-jonesy", "Bunker Jonesy", "Uncommon", 4667, "CID_409_Athena_Commando_M_BunkerMan", "🧢", "waves", ["#46586a", "#d0bd91"], "A rugged survivor who has seen it all."),
  fortniteCard("fortnite-commando", "Commando", "Uncommon", 4000, "CID_016_Athena_Commando_F", "🎖️", "chevrons", ["#43533e", "#c6b27a"], "A classic outfit from the early days."),
  fortniteCard("fortnite-fishstick", "Fishstick", "Epic", 13333, "CID_315_Athena_Commando_M_TeriyakiFish", "🐟", "waves", ["#344f62", "#e4a07a"], "A fish out of water, and somehow still winning."),
  fortniteCard("fortnite-agent-peely", "Agent Peely", "Epic", 23333, "CID_701_Athena_Commando_M_BananaAgent", "🍌", "rays", ["#66551f", "#f1db65"], "Undercover, but never underdressed."),
  fortniteCard("fortnite-midas", "Midas", "Epic", 33333, "CID_694_Athena_Commando_M_CatBurglar", "🪙", "orbs", ["#554321", "#f0cd72"], "Every match turns to gold."),
  fortniteCard("fortnite-renegade-raider", "Renegade Raider", "Crown", 400000, "CID_028_Athena_Commando_F", "🛩️", "scales", ["#4e3919", "#f0ca77"], "A rare Crown pull with a special odds power."),
  fortniteCard("fortnite-peely", "Peely", "Common", 2400, "CID_349_Athena_Commando_M_Banana", "🍌", "rays", ["#766128", "#f5d746"], "The original banana with a surprisingly serious attitude."),
  fortniteCard("fortnite-skull-trooper", "Skull Trooper", "Epic", 18000, "CID_030_Athena_Commando_M_Halloween", "💀", "skulls", ["#40364c", "#d6d2e4"], "A spooky classic with unmistakable style."),
  fortniteCard("fortnite-ghoul-trooper", "Ghoul Trooper", "Epic", 16000, "CID_029_Athena_Commando_F_Halloween", "🧟", "orbs", ["#4c4e38", "#b3ce82"], "A Halloween favorite from the early days."),
  fortniteCard("fortnite-drift", "Drift", "Epic", 20000, "CID_161_Athena_Commando_M_Drift", "🦊", "rays", ["#51434c", "#f2ae61"], "A masked wanderer with a legendary transformation."),
  fortniteCard("fortnite-lynx", "Lynx", "Epic", 18000, "CID_286_Athena_Commando_F_NeonCat", "🐈", "waves", ["#25364c", "#73d9d2"], "A sleek cat-themed legend."),
  fortniteCard("fortnite-cuddle-team-leader", "Cuddle Team Leader", "Uncommon", 5333, "CID_069_Athena_Commando_F_PinkBear", "🧸", "hearts", ["#633e57", "#f49bc8"], "A bear hug with battle-ready confidence."),
  fortniteCard("fortnite-black-knight", "Black Knight", "Crown", 200000, "CID_035_Athena_Commando_M_Medieval", "⚔️", "scales", ["#292a32", "#b8b8c0"], "A legendary knight from the earliest seasons."),
  fortniteCard("fortnite-the-reaper", "The Reaper", "Epic", 30000, "CID_084_Athena_Commando_M_Assassin", "🕴️", "grid", ["#343943", "#aeb9c6"], "The quiet professional."),
  fortniteCard("fortnite-omega", "Omega", "Epic", 25000, "CID_116_Athena_Commando_M_CarbideBlack", "🤖", "chevrons", ["#333044", "#a18ce0"], "A high-tech armored enforcer."),
  fortniteCard("fortnite-ragnarok", "Ragnarok", "Epic", 27000, "CID_165_Athena_Commando_M_DarkViking", "🪓", "scales", ["#42343e", "#d49b73"], "A storm-forged Viking warrior."),
  fortniteCard("fortnite-brite-bomber", "Brite Bomber", "Common", 2667, "CID_044_Athena_Commando_F_SciPop", "🌈", "rays", ["#58447c", "#f397cb"], "Bright colors, brighter explosions."),
  fortniteCard("fortnite-raven", "Raven", "Epic", 23000, "CID_102_Athena_Commando_M_Raven", "🐦‍⬛", "orbs", ["#262b3d", "#9a8bbc"], "A mysterious wanderer from the shadows."),
  fortniteCard("fortnite-raptor", "Raptor", "Uncommon", 5600, "CID_031_Athena_Commando_M_Retro", "🪂", "waves", ["#493b2f", "#e1c56d"], "A flight-ready classic."),
  fortniteCard("fortnite-sparkle-specialist", "Sparkle Specialist", "Epic", 21000, "CID_039_Athena_Commando_F_Disco", "✨", "stars", ["#4d3e75", "#e8c3ff"], "A disco-floor legend."),
  fortniteCard("fortnite-tomatohead", "Tomatohead", "Common", 2933, "CID_109_Athena_Commando_M_Pizza", "🍅", "orbs", ["#6e382e", "#f59870"], "A saucy mascot with a cult following."),
  fortniteCard("fortnite-red-knight", "Red Knight", "Crown", 180000, "CID_034_Athena_Commando_F_Medieval", "🛡️", "scales", ["#662f34", "#e29b91"], "A crimson knight fit for the royal vault."),
  fortniteCard("fortnite-tricera-ops", "Tricera Ops", "Uncommon", 8000, "CID_107_Athena_Commando_F_PajamaParty", "🦖", "chevrons", ["#4f5d43", "#c4da84"], "A dinosaur-themed favorite."),
  fortniteCard("fortnite-love-ranger", "Love Ranger", "Crown", 190000, "CID_070_Athena_Commando_M_Cupid", "💘", "hearts", ["#56405e", "#e9b3e2"], "A stone guardian with a soft side."),
  fortniteCard("fortnite-fable", "Fable", "Epic", 18000, "CID_231_Athena_Commando_F_RedRiding", "🧺", "waves", ["#693f48", "#e39c9c"], "A storybook look with a battle-ready twist."),
  fortniteCard("fortnite-dire", "Dire", "Epic", 22000, "CID_230_Athena_Commando_M_Werewolf", "🐺", "scales", ["#384b5c", "#9caec3"], "A wild transformation under the moon."),
  fortniteCard("fortnite-calamity", "Calamity", "Epic", 24000, "CID_237_Athena_Commando_F_Cowgirl", "🤠", "sand", ["#66513d", "#d7b787"], "A frontier legend with a changing look."),
  fortniteCard("fortnite-dynamo", "Dynamo", "Uncommon", 7000, "CID_170_Athena_Commando_F_Luchador", "🤼", "chevrons", ["#4d3b55", "#db8bcb"], "A high-energy luchador."),
  fortniteCard("fortnite-aura", "Aura", "Common", 3200, "CID_397_Athena_Commando_F_TreasureHunterFashion", "💎", "orbs", ["#48584c", "#d3ba73"], "A sharp look for a sharp player."),
];
const fastFoodChains = [
  ["mcdonalds", "McDonald's"],
  ["starbucks", "Starbucks"],
  ["kfc", "KFC"],
  ["subway", "Subway"],
  ["burgerking", "Burger King"],
  ["chickfila", "Chick-fil-A"],
  ["tacobell", "Taco Bell"],
  ["dominos", "Domino's"],
  ["chipotle", "Chipotle"],
  ["wendys", "Wendy's"],
  ["pizzahut", "Pizza Hut"],
  ["dunkindonuts", "Dunkin'"],
  ["popeyes", "Popeyes"],
  ["timhortons", "Tim Hortons"],
  ["pandaexpress", "Panda Express"],
  ["sonicdrivein", "Sonic Drive-In"],
  ["littlecaesars", "Little Caesars"],
  ["papajohns", "Papa John's"],
  ["wingstop", "Wingstop"],
  ["raisingcanes", "Raising Cane's"],
  ["arbys", "Arby's"],
  ["dairyqueen", "Dairy Queen"],
  ["panerabread", "Panera Bread"],
  ["fiveguys", "Five Guys"],
  ["shakeshack", "Shake Shack"],
  ["whataburger", "Whataburger"],
  ["innoutburger", "In-N-Out Burger"],
  ["culvers", "Culver's"],
  ["jackinthebox", "Jack in the Box"],
  ["jerseymikes", "Jersey Mike's"],
  ["jimmyjohns", "Jimmy John's"],
  ["firehousesubs", "Firehouse Subs"],
  ["zaxbys", "Zaxby's"],
  ["bojangles", "Bojangles"],
  ["carlsjr", "Carl's Jr."],
  ["hardees", "Hardee's"],
  ["deltaco", "Del Taco"],
  ["qdoba", "QDOBA"],
  ["cava", "CAVA"],
  ["pretamanger", "Pret A Manger"],
  ["greggs", "Greggs"],
  ["costa", "Costa Coffee"],
  ["nandos", "Nando's"],
  ["jollibee", "Jollibee"],
  ["mixue", "Mixue"],
  ["luckincoffee", "Luckin Coffee"],
  ["yoshinoya", "Yoshinoya"],
  ["wafflehouse", "Waffle House"],
  ["krispykreme", "Krispy Kreme"],
  ["elpolloloco", "El Pollo Loco"],
];
const fastFoodCards = fastFoodChains.map(([slug, name], index) => {
  const rank = index + 1;
  const rarity = rank <= 3 ? "Crown" : rank <= 13 ? "Epic" : rank <= 28 ? "Uncommon" : "Common";
  const value = rank <= 3
    ? 161000 - (rank - 1) * 34500
    : rank <= 13
      ? 21850 - (rank - 4) * 690
      : rank <= 28
        ? 11500 - (rank - 14) * 460
        : 7475 - (rank - 29) * 207;
  const colors = rarity === "Crown"
    ? ["#5b4320", "#e1bc68"]
    : rarity === "Epic"
      ? ["#1a345c", "#8bb9ef"]
      : rarity === "Uncommon"
        ? ["#243a3c", "#9db9b7"]
        : ["#3b312b", "#d6a263"];
  return {
    id: "food-" + slug,
    name,
    set: "fastfood",
    rarity,
    value,
    emoji: "🍔",
    pattern: patterns[index % patterns.length],
    colors,
    image: "/img/fastfood/" + slug + ".png",
    flavor: "A real restaurant-chain brand card. Its fictional sell value uses a broad popularity tier.",
  };
});

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
// Mythic cards are exclusive to one pack each and only ever come from that
// pack's separate jackpot roll. Their values are authored in pence and are not
// scaled with the rest of the catalogue.
const mythics = [
  [
    "mythic-brainrot",
    "The Final Algorithm",
    "brainrot",
    25000,
    "🌀",
    "The meme that ate the internet and asked for seconds.",
  ],
  [
    "mythic-royal",
    "The Empty Throne",
    "royal",
    250000,
    "♛",
    "No one is sitting in it. That has never stopped anyone.",
  ],
  [
    "mythic-vault",
    "Vault Zero",
    "royal",
    1000000,
    "🗝",
    "The crate the treasury uses to hide from its own auditors.",
  ],
  [
    "mythic-apex",
    "Solar Sovereign",
    "royal",
    3000000,
    "☀",
    "A crown forged where the light does not politely stop.",
  ],
  [
    "mythic-fortnite",
    "Zero Point Monarch",
    "fortnite",
    4000000,
    "🌌",
    "A victory royale written into the fabric of the island.",
  ],
  [
    "mythic-world",
    "The Last Superpower",
    "world",
    500000,
    "🌍",
    "A diplomatic incident in card form. Handle with ceremony.",
  ],
  [
    "mythic-fastfood",
    "The First Franchise",
    "fastfood",
    9000000,
    "🍟",
    "The original order. The queue has been waiting for centuries.",
  ],
].map(([id, name, set, value, emoji, flavor]) => ({
  id,
  name,
  set,
  rarity: "Mythic",
  value,
  emoji,
  pattern: "stars",
  colors: ["#3d2a55", "#f3d489"],
  image: "/img/mythic.svg",
  flavor,
}));
// Secret cards are hidden trophy pulls. Their only roll is the once-a-day
// Secret window, boosted by equipped Crown cards, so they never enter normal
// rarity pools, chase rolls, jackpot rolls, or the Card Index.
const secretCards = [
  [
    "secret-brainrot",
    "The Forbidden Meme",
    "brainrot",
    2400,
    "🤫",
    "You did not see this. Neither did the algorithm.",
    "The algorithm has no comment.",
  ],
  [
    "secret-royal",
    "The Empty Title",
    "royal",
    7200,
    "🕯",
    "The palace has no record of this card.",
    "The palace has no record of this card.",
  ],
  [
    "secret-world",
    "The Backchannel",
    "world",
    12000,
    "🤝",
    "This meeting never happened.",
    "This meeting never happened.",
  ],
  [
    "secret-vault",
    "The Missing Ledger",
    "royal",
    30000,
    "📕",
    "Nothing to declare. Especially not this.",
    "Nothing to declare. Especially not this.",
  ],
  [
    "secret-apex",
    "The Shadow Sovereign",
    "royal",
    120000,
    "♛",
    "The crown denies everything.",
    "The crown denies everything.",
  ],
  [
    "secret-fortnite",
    "The Unreleased Skin",
    "fortnite",
    150000,
    "🛸",
    "It is not in the patch notes.",
    "It is not in the patch notes.",
  ],
  [
    "secret-fastfood",
    "The Secret Menu",
    "fastfood",
    360000,
    "🍔",
    "Off-menu. Do not ask for it by name.",
    "Off-menu. Do not ask for it by name.",
  ],
].map(([id, name, set, value, emoji, flavor, caption]) => ({
  id,
  name,
  set,
  rarity: "Secret",
  value,
  emoji,
  pattern: "grid",
  colors: ["#27303a", "#d6b46a"],
  image: "/img/secret.svg",
  flavor,
  secretCaption: caption,
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
// World Leaders packs compare each four-card pull with a £10 price, so the
// ordinary Epics sit in a tight, still-unique band just below and above it.
// That keeps the loss rate honest instead of concentrating almost all value in
// rare Epics. The three headline Epics keep their full authored values.
const featuredWorldEpics = new Set([
  "Andy Burnham",
  "King Charles III",
  "Flag of Israel",
]);
const ordinaryWorldEpics = [
  ...leaderData.cards.map(rateLeader),
  ...nationFlagCards,
]
  .filter(
    (card) =>
      card.set === "world" &&
      card.rarity === "Epic" &&
      !featuredWorldEpics.has(card.name),
  )
  .sort((a, b) => a.value - b.value || a.id.localeCompare(b.id));
const worldEpicBand = new Map(
  ordinaryWorldEpics.map((card, index) => [
    card.id,
    950 +
      Math.round((index * 200) / Math.max(1, ordinaryWorldEpics.length - 1)),
  ]),
);
function worldEpicValue(card) {
  return (
    worldEpicBand.get(card.id) ?? Math.round(Math.abs(card.value) * 0.73)
  );
}
// Every pack lifts its win chance by moving a slice of the cheap tier into Epic
// and keeping the top ordinary payouts in a tight band. Rare pulls are trimmed
// so the higher hit rate still returns less than the pack price on average.
const liftedValues = new Map([
  ["crocodilo", 1500],
  ["signet", 2190],
  ["apex-crown", 32800],
  ["mythic-brainrot", 9000],
  ["mythic-royal", 100000],
  ["mythic-apex", 2400000],
  ["mythic-fortnite", 1600000],
  ["mystery-gold", 36500],
]);
const fortniteFixedEpics = new Set([
  "fortnite-fishstick",
  "fortnite-agent-peely",
  "fortnite-midas",
]);
// Brainrot bands: source range (post-scale) maps linearly onto the play range.
const brainrotBands = {
  Common: [7, 26, 8, 16],
  Uncommon: [35, 95, 45, 62],
  Epic: [161, 240, 168, 208],
};
function bandValue(value, [sourceLow, sourceHigh, low, high]) {
  const clamped = Math.min(sourceHigh, Math.max(sourceLow, value));
  const t = sourceHigh === sourceLow ? 0 : (clamped - sourceLow) / (sourceHigh - sourceLow);
  return Math.round(low + t * (high - low));
}
function liftValue(card, value) {
  if (liftedValues.has(card.id)) return liftedValues.get(card.id);
  if (card.set === "brainrot") {
    if (card.rarity === "Crown") return 800;
    if (brainrotBands[card.rarity])
      return bandValue(value, brainrotBands[card.rarity]);
  }
  if (
    card.set === "fortnite" &&
    card.rarity === "Epic" &&
    !fortniteFixedEpics.has(card.id)
  )
    return Math.round(value * 0.9);
  return value;
}
export const catalog = [
  ...cards,
  ...fortniteCards,
  ...fastFoodCards,
  ...chases,
  ...mythics,
  ...secretCards,
  alpha,
  ...leaderData.cards.map(rateLeader),
  ...nationFlagCards,
].map((c) => ({
  ...c,
  value:
    c.id === "kim" ||
    c.id === "fortnite-renegade-raider" ||
    c.rarity === "Mythic" ||
    c.rarity === "Secret"
      ? c.value
      : c.name === "Donald Trump"
        ? 50000
        : c.set === "fastfood"
          ? c.value
          : c.set === "world" && c.rarity === "Epic"
            ? worldEpicValue(c)
            : Math.sign(c.value) * Math.round(Math.abs(c.value) * (c.set === "fortnite" && c.rarity === "Epic" ? 0.45 : 0.73)),
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
})).map((c) => ({ ...c, value: liftValue(c, c.value) }));
export const cardMap = Object.fromEntries(catalog.map((c) => [c.id, c]));
const rarityPowerups = Object.freeze({
  // Cheap cards may nudge Uncommon odds or offer a discount, but they never
  // move meaningful Epic or Crown weight. Boosts scale with card quality.
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
    { name: "No power-up", epicBonus: 0 },
    { name: "No power-up", epicBonus: 0 },
    { name: "Small lucky lift", epicBonus: 10000 },
    { name: "Uncommon nudge", epicBonus: 0, uncommonBonus: 25000 },
    { name: "Slight stumble", epicBonus: -10000 },
    { name: "Thrifty crown", epicBonus: 0, packDiscount: 10 },
  ],
  Uncommon: [
    { name: "Uncommon lift", epicBonus: 0, uncommonBonus: 60000 },
    { name: "A little luck", epicBonus: 0, uncommonBonus: 40000 },
    { name: "Steady hands", epicBonus: 15000 },
    { name: "Gentle stumble", epicBonus: -25000 },
    { name: "No power-up", epicBonus: 0 },
  ],
  Epic: [
    { name: "Court's favor", epicBonus: 120000 },
    { name: "Measured momentum", epicBonus: 90000 },
    { name: "Uncommon boost", epicBonus: 0, uncommonBonus: 120000 },
    { name: "No power-up", epicBonus: 0 },
    { name: "Small setback", epicBonus: -30000 },
  ],
  Crown: [
    { name: "Royal decree", epicBonus: 600000, crownBonus: 50000 },
    {
      name: "Crown's favor",
      epicBonus: 500000,
      uncommonBonus: 100000,
      crownBonus: 100000,
    },
    // One Crown card stays Crown-focused; the rest trade Crown odds for Epic
    // or Uncommon so a loadout is a choice rather than five copies of the same bet.
    { name: "Golden momentum", epicBonus: 350000, crownBonus: 200000 },
    {
      name: "Sovereign chance",
      epicBonus: 250000,
      uncommonBonus: 200000,
      crownBonus: 30000,
    },
  ],
  // Chase cards are all upside; the rarest pulls should never be a downgrade.
  Chase: [
    { name: "Chase energy", epicBonus: 500000 },
    {
      name: "Chase insight",
      epicBonus: 0,
      uncommonBonus: 100000,
      crownBonus: 100000,
    },
    { name: "Chase instinct", epicBonus: 300000, crownBonus: 50000 },
  ],
  Mythic: [
    {
      name: "Mythic dominion · +2% Epic and +1% Crown",
      epicBonus: 2000000,
      crownBonus: 1000000,
    },
  ],
  Alpha: [
    {
      name: "Mystery Gold",
      epicBonus: 1500000,
      uncommonBonus: 100000,
      crownBonus: 500000,
    },
  ],
  // Every Secret card has an authored effect in secretPowerups below.
  Secret: [{ name: "Classified", epicBonus: 0 }],
});
// Odds are whole numbers out of 100,000,000, so 2% is 2,000,000.
export const ODDS_TOTAL = 100000000;
// Kim's equipped bonus is deliberately outside the caps below: it is the reward
// for pulling a 1-in-45,000 chase card.
export const KIM_EPIC_BONUS = 2000000;
// Every 0.1 percentage point (100,000) of Crown bonus makes the pack's chase
// card 10% more likely, and the same bonus counts whether it comes from a
// loadout card or a permanent set reward. At the +1.00% Crown cap that is
// double the base chase chance, not the sixfold spike of the old scale.
export const CHASE_BONUS_SCALE = 1000000;
// Loadout odds shifts, before any permanent set reward is added. A full set of
// Crown powerups can reach +2.50% Epic, and Renegade Raider plus Crown cards
// can reach +1.00% Crown. Uncommon cards only move a fraction of that.
export const EPIC_SHIFT_CAP = 2500000;
export const UNCOMMON_SHIFT_CAP = 400000;
export const CROWN_SHIFT_CAP = 1000000;
// Permanent character-index rewards: four completions can be claimed for each
// reward at +0.50% Epic or +0.10% Crown per set.
export const SET_EPIC_REWARD = 500000;
export const SET_CROWN_REWARD = 100000;
export const SET_EPIC_CAP = 2000000;
export const SET_CROWN_CAP = 400000;
// Crown cards each add 0.08% to the once-a-day Secret roll. The total is capped
// at 0.40% so a full five-card loadout keeps the promised per-card value.
// Odds are out of 1,000,000, so 0.08% is 800.
export const SECRET_CROWN_BONUS = 800;
export const SECRET_CHANCE_CAP = 4000;
export const SECRET_ROLL_SCALE = 1000000;
const secretPowerups = Object.freeze({
  "secret-brainrot": {
    name: "Algorithmic whisper",
    secretBonus: 200,
  },
  "secret-royal": {
    name: "Black-market invitation",
    randomPackDiscount: 20,
  },
  "secret-world": {
    name: "Off the record",
    randomPackDiscount: 20,
  },
  "secret-vault": {
    name: "Nothing to declare",
    epicBonus: 1500000,
    crownBonus: 300000,
    secretBonus: 200,
  },
  "secret-apex": {
    name: "Sovereign's shadow",
    epicBonus: 2500000,
    crownBonus: 500000,
  },
  "secret-fortnite": {
    name: "Not in the patch notes",
    randomPackDiscount: 20,
    secretBonus: 200,
  },
  "secret-fastfood": {
    name: "The secret menu",
    packDiscount: 50,
  },
});
// Named chase cards each keep a distinct, positive effect so a rare pull is
// always an upgrade over the generic rarity profile.
const chasePowerups = Object.freeze({
  crocodilo: {
    name: "Crocodile surge",
    epicBonus: 400000,
    uncommonBonus: 100000,
  },
  signet: { name: "Gilded edge", epicBonus: 300000, crownBonus: 100000 },
  sovereign: {
    name: "Vault leverage",
    epicBonus: 200000,
    uncommonBonus: 150000,
    crownBonus: 50000,
  },
  "apex-crown": { name: "Apex instinct", epicBonus: 500000, crownBonus: 100000 },
});
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
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
      rarity: template.rarity,
      epicBonus: 150000,
      uncommonBonus: 0,
      crownBonus: 500000,
      everyOtherCard: false,
    };
  if (template.id === "kim")
    return {
      name: "Every other card · Uncommon+ and +2% Epic",
      rarity: template.rarity,
      // Kim's +2% Epic sits on top of the normal loadout cap and never stacks
      // with a second copy of Kim.
      epicBonus: KIM_EPIC_BONUS,
      uncappedEpic: true,
      uncommonBonus: 0,
      crownBonus: 0,
      everyOtherCard: true,
    };
  const powerup =
    secretPowerups[template.id] ||
    chasePowerups[template.id] ||
    rarityPowerups[template.rarity][
      hash % rarityPowerups[template.rarity].length
    ];
  return {
    ...powerup,
    rarity: template.rarity,
    epicBonus: powerup.epicBonus || 0,
    uncommonBonus: powerup.uncommonBonus || 0,
    crownBonus: powerup.crownBonus || 0,
    secretBonus: powerup.secretBonus || 0,
    randomPackDiscount: powerup.randomPackDiscount || 0,
    everyOtherCard: false,
  };
}
export function loadoutPowerup(cards) {
  if (!Array.isArray(cards) || cards.length > 5)
    throw Error("A loadout can contain at most five cards.");
  const powerups = cards.map(cardPowerup);
  // Kim's bonus is excluded here and re-added outside every cap, so a full
  // loadout of boosts cannot dilute it and a second Kim cannot double it.
  const cappedEpic = clamp(
    powerups.reduce((total, p) => total + (p.uncappedEpic ? 0 : p.epicBonus), 0),
    -EPIC_SHIFT_CAP,
    EPIC_SHIFT_CAP,
  );
  const uncappedEpic = Math.max(
    0,
    ...powerups.map((p) => (p.uncappedEpic ? p.epicBonus : 0)),
  );
  const uncommonBonus = clamp(
    powerups.reduce((total, p) => total + (p.uncommonBonus || 0), 0),
    -UNCOMMON_SHIFT_CAP,
    UNCOMMON_SHIFT_CAP,
  );
  const crownBonus = clamp(
    powerups.reduce((total, p) => total + (p.crownBonus || 0), 0),
    0,
    CROWN_SHIFT_CAP,
  );
  const crownCards = powerups.filter(
    (powerup) => powerup.rarity === "Crown",
  ).length;
  const secretChance = clamp(
    crownCards * SECRET_CROWN_BONUS +
      powerups.reduce((total, powerup) => total + powerup.secretBonus, 0),
    0,
    SECRET_CHANCE_CAP,
  );
  return {
    epicBonus: cappedEpic + uncappedEpic,
    cappedEpic,
    uncappedEpic,
    uncommonBonus,
    crownBonus,
    secretChance,
    crownCards,
    everyOtherCard: powerups.some((powerup) => powerup.everyOtherCard),
    packDiscount: Math.max(
      0,
      ...powerups.map((powerup) => powerup.packDiscount || 0),
    ),
    randomPackDiscount: clamp(
      powerups.reduce(
        (total, powerup) => total + powerup.randomPackDiscount,
        0,
      ),
      0,
      40,
    ),
  };
}
// Deterministic so the browser and server agree on the day's discounted pack.
export function dailyDiscountPack(accountId, day) {
  let hash = 2166136261;
  for (const character of `${accountId}:${day}:secret-pack`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return packs[(hash >>> 0) % packs.length].id;
}
export function secretPackDiscount(pack, accountId, day, effect) {
  if (!effect?.randomPackDiscount) return 0;
  if (dailyDiscountPack(accountId, day) !== pack.id) return 0;
  return Math.min(
    pack.price,
    Math.round((pack.price * effect.randomPackDiscount) / 100),
  );
}
export const leaderSource = {
  source: leaderData.source,
  retrieved: leaderData.retrieved,
  note: leaderData.note,
};
// Odds are integers out of 100,000,000. Each pack carries a deliberate
// win-rate lift over its original bands: a slice of the cheap tier sits in Epic
// and Crown so wins land more often and sell for more. The largest payouts stay
// in the separate Crown, chase and Mythic rolls.
export const packs = [
  {
    id: "brainrot",
    name: "Brainrot Pack",
    short: "BRAINROT",
    subtitle: "A little unhinged. Entirely collectible.",
    price: 200,
    count: 4,
    set: "brainrot",
    odds: [70960000, 12000000, 17000000, 40000, 0],
    chase: "crocodilo",
    chaseOdds: 800,
    secret: "secret-brainrot",
    jackpot: "mythic-brainrot",
    jackpotOdds: 20000,
    art: "brainrot",
    color: "#64a3ce",
    tag: "THE PEOPLE’S FAVOURITE",
  },
  {
    id: "royalty",
    name: "Royalty Booster",
    short: "ROYALTY",
    subtitle: "An invitation to the inner circle.",
    price: 600,
    count: 4,
    set: "royal",
    odds: [68940000, 20400000, 10500000, 160000, 0],
    chase: "signet",
    chaseOdds: 1000,
    secret: "secret-royal",
    jackpot: "mythic-royal",
    jackpotOdds: 60000,
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
    odds: [0, 37169000, 61500000, 1330000, 1000],
    chase: "sovereign",
    chaseOdds: 1000,
    secret: "secret-vault",
    jackpot: "mythic-vault",
    jackpotOdds: 60000,
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
    odds: [0, 0, 42995000, 57000000, 5000],
    chase: "apex-crown",
    chaseOdds: 2000,
    secret: "secret-apex",
    jackpot: "mythic-apex",
    jackpotOdds: 100000,
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
    odds: [51699000, 43998990, 4300000, 2000, 10],
    chase: "fortnite-renegade-raider",
    chaseOdds: 40000,
    secret: "secret-fortnite",
    jackpot: "mythic-fortnite",
    jackpotOdds: 80000,
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
    odds: [69880000, 22000000, 8000000, 120000, 0],
    chase: "kim",
    chaseOdds: 45000,
    secret: "secret-world",
    jackpot: "mythic-world",
    jackpotOdds: 200000,
    art: "world",
    color: "#a8a6ce",
    tag: "THE WORLD IS YOUR COLLECTION",
  },
  {
    id: "fastfood",
    name: "Fast Food Legends Pack",
    short: "FAST FOOD",
    subtitle: "50 familiar chains, with a rare top-brand pull.",
    price: 30000,
    count: 5,
    set: "fastfood",
    odds: [74998000, 21249000, 3750000, 3000, 0],
    chase: "food-mcdonalds",
    chaseOdds: 50000,
    secret: "secret-fastfood",
    jackpot: "mythic-fastfood",
    jackpotOdds: 150000,
    art: "fastfood",
    color: "#df8c46",
    tag: "50 REAL CHAINS · FICTIONAL CARD VALUES",
  },
];
const indexFamilies = Object.freeze({
  brainrot: { name: "Meme Hall", subtitle: "The internet oddities collection." },
  royal: { name: "Royal Archive", subtitle: "The full and questionable royal court." },
  fortnite: { name: "Fortnite Field Guide", subtitle: "Every Fortnite character in the collection." },
  world: { name: "World Stage", subtitle: "Every leader and flag in the archive." },
  alpha: { name: "Mystery Gold", subtitle: "The one-off Alpha card." },
  fastfood: { name: "Fast Food Hall of Fame", subtitle: "Fifty real chains, ranked in broad popularity tiers." },
});
export const indexSets = Object.freeze(
  Object.entries(indexFamilies).flatMap(([family, info]) => {
    // Mythic jackpots and Secret cards are trophy pulls, not index objectives.
    const cards = catalog.filter(
      (card) =>
        card.set === family &&
        card.rarity !== "Mythic" &&
        card.rarity !== "Secret",
    );
    return Array.from({ length: Math.ceil(cards.length / 8) }, (_, index) => {
      const cardIds = cards.slice(index * 8, index * 8 + 8).map((card) => card.id);
      const hasCrown = cardIds.some((id) => cardMap[id]?.rarity === "Crown");
      const hasEpic = cardIds.some((id) => cardMap[id]?.rarity === "Epic");
      return {
        id: family + "-set-" + String(index + 1).padStart(2, "0"),
        family,
        name: info.name + " · Set " + String(index + 1).padStart(2, "0") + " · " + cardIds.length + " cards",
        subtitle: info.subtitle + " Collect all " + cardIds.length + " cards in this set to claim its reward.",
        cardIds,
        // Paid only after both permanent odds caps are full. £50 or less.
        cashReward: hasCrown ? 5000 : hasEpic ? 2500 : 1000,
      };
    });
  }),
);

export const rarities = ["Common", "Uncommon", "Epic", "Crown", "Alpha"];
export const starterOdds = [85000000, 12000000, 2500000, 500000, 0];
// A pack's chase card is never sold through that pack's ordinary rarity pool, so
// the chase roll is the only way to pull it.
const chaseIds = new Set(packs.map((pack) => pack.chase));
// Immutable template pools are safe to reuse; player state always stays in the database.
// Within a tier, the priciest card is the rarest pull: rank weights run from n for the
// cheapest entry down to 1 for the most valuable, so authored card values decide the
// chase without any revaluation.
const normalPools = new Map();
for (const card of catalog) {
  if (!["Common", "Uncommon", "Epic", "Crown"].includes(card.rarity)) continue;
  if (chaseIds.has(card.id)) continue;
  const key = `${card.set}:${card.rarity}`;
  if (!normalPools.has(key)) normalPools.set(key, []);
  normalPools.get(key).push({ card, weight: 1 });
}
for (const pool of normalPools.values()) {
  const ranked = [...pool].sort((a, b) => a.card.value - b.card.value);
  ranked.forEach((entry, index) => {
    entry.weight = ranked.length - index;
  });
}
// All randomness is injected; production supplies cryptographic integer sampling.
export function rollPack(
  pack,
  randomInt,
  {
    guaranteedEpic = false,
    guaranteedUncommon = false,
    powerups = [],
    permanentEpicBonus = 0,
    permanentCrownBonus = 0,
    secretChance = 0,
  } = {},
) {
  const effect = loadoutPowerup(powerups);
  const odds = [...pack.odds];
  if (effect.uncommonBonus > 0) {
    const shifted = Math.min(odds[0], effect.uncommonBonus);
    odds[0] -= shifted;
    odds[1] += shifted;
  } else if (effect.uncommonBonus < 0) {
    const shifted = Math.min(odds[1], -effect.uncommonBonus);
    odds[1] -= shifted;
    odds[0] += shifted;
  }
  // Loadout and permanent index rewards share one Epic band: the floor keeps a
  // stumble card honest, the ceiling stops rewards from emptying the Common tier.
  const epicBonus =
    clamp(
      effect.cappedEpic + permanentEpicBonus,
      -EPIC_SHIFT_CAP,
      EPIC_SHIFT_CAP + SET_EPIC_CAP,
    ) + effect.uncappedEpic;
  const crownBonus = clamp(
    effect.crownBonus + permanentCrownBonus,
    0,
    CROWN_SHIFT_CAP + SET_CROWN_CAP,
  );
  if (epicBonus > 0) {
    let remaining = epicBonus;
    for (const index of [0, 1]) {
      const shifted = Math.min(odds[index], remaining);
      odds[index] -= shifted;
      odds[2] += shifted;
      remaining -= shifted;
    }
  } else if (epicBonus < 0) {
    const shifted = Math.min(odds[2], -epicBonus);
    odds[2] -= shifted;
    odds[0] += shifted;
  }
  if (crownBonus > 0) {
    let remaining = crownBonus;
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
    if (rarity === "Alpha") return { ...cardMap["mystery-gold"] };
    const pool = normalPools.get(`${pack.set}:${rarity}`) || [];
    const fresh = pool.filter((entry) => !used.has(entry.card.id));
    const available = fresh.length ? fresh : pool;
    if (!available.length) throw Error("Empty rarity pool");
    let roll = randomInt(available.reduce((sum, entry) => sum + entry.weight, 0));
    for (const entry of available) {
      if (roll < entry.weight) {
        used.add(entry.card.id);
        return { ...entry.card };
      }
      roll -= entry.weight;
    }
    throw Error("Card pick was outside its pool weights.");
  }
  const result = Array.from({ length: pack.count }, (_, index) => {
    const floor = effect.everyOtherCard && index % 2 === 1 ? 1 : 0;
    const rarity = rollRarity(floor);
    // Pity floor: a losing streak guarantees the pack holds no Common cards.
    // Only Common results are upgraded, so Epic, Crown and Alpha odds stay put.
    return pick(
      guaranteedUncommon && rarity === "Common" ? "Uncommon" : rarity,
    );
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
  // The Secret roll only runs inside the daily window. It is independent of
  // the rarity bands, chase roll and Mythic jackpot.
  if (
    secretChance > 0 &&
    pack.secret &&
    cardMap[pack.secret]?.rarity === "Secret" &&
    randomInt(SECRET_ROLL_SCALE) < secretChance
  ) {
    const secret = cardMap[pack.secret];
    const eligible = result
      .map((c, i) => ({ c, i }))
      .filter(
        ({ c }) => !["Alpha", "Mythic", "Chase", "Secret"].includes(c.rarity),
      )
      .sort((a, b) => a.c.value - b.c.value);
    if (eligible.length)
      result[eligible[0].i] = { ...secret, rarity: "Secret" };
  }
  // The Crown bonus also lifts the chase chance. With no bonus this is exactly
  // the original 1-in-chaseOdds roll.
  const chaseHit =
    crownBonus > 0
      ? randomInt(CHASE_BONUS_SCALE * pack.chaseOdds) < CHASE_BONUS_SCALE + crownBonus
      : randomInt(pack.chaseOdds) === 0;
  if (chaseHit) {
    const chase = cardMap[pack.chase];
    const eligible = result
      .map((c, i) => ({ c, i }))
      .filter(
        ({ c }) =>
          !["Alpha", "Mythic", "Chase", "Secret"].includes(c.rarity) &&
          c.value < chase.value,
      )
      .sort((a, b) => a.c.value - b.c.value);
    if (eligible.length)
      result[eligible[0].i] = { ...chase, rarity: "Chase" };
  }
  // The jackpot is a separate per-pack roll, never part of the rarity bands.
  // It can only replace an ordinary card, and never an Alpha, Secret or chase.
  if (pack.jackpot && randomInt(pack.jackpotOdds) === 0) {
    const mythic = cardMap[pack.jackpot];
    if (!mythic || mythic.rarity !== "Mythic")
      throw Error("Unknown Mythic jackpot card.");
    const eligible = result
      .map((c, i) => ({ c, i }))
      .filter(
        ({ c }) => !["Alpha", "Mythic", "Chase", "Secret"].includes(c.rarity),
      )
      .sort((a, b) => a.c.value - b.c.value);
    if (eligible.length)
      result[eligible[0].i] = { ...mythic, rarity: "Mythic" };
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
      (c) =>
        c.set === pack.set &&
        c.id !== pack.chase &&
        ["Common", "Uncommon", "Epic", "Crown"].includes(c.rarity) &&
        pack.odds[rarities.indexOf(c.rarity)] > 0,
    )
    .map((c) => c.value);
  return { min: Math.min(...values), max: Math.max(...values) };
}
