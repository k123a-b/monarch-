import flags from "./flags.json" with { type: "json" };
import leaderData from "./leaders.json" with { type: "json" };
import portraits from "./portraits.json" with { type: "json" };
import { rateLeader } from "./leader-ratings.mjs";
import { ukCards } from "./uk-cards.mjs";
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
  // Payday cards only ever come from their own pack's separate 1-in-25 roll.
  ["payday-vault", "The Vault Key", 5200, "🗝", "royal"],
  ["payday-apex", "Apex Sigil", 31000, "🔱", "royal"],
  ["payday-fortnite", "Golden Llama", 26000, "🦙", "fortnite"],
  ["payday-fastfood", "Golden Receipt", 62000, "🧾", "fastfood"],
  ["payday-uk", "The Golden Ticket", 126000, "", "uk"],
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
  ...(id.startsWith("payday-")
    ? { flavor: "A rare payout. This pack finally owed you one." }
    : {}),
}));
const windfalls = [
  ["brainrot", "Algorithm Windfall", "brainrot", 1100],
  ["royalty", "Royal Dividend", "royal", 3300],
  ["vault", "Treasury Windfall", "royal", 13750],
  ["apex", "Sovereign Dividend", "royal", 82500],
  ["fortnite", "Victory Windfall", "fortnite", 68750],
  ["world", "World Dividend", "world", 5500],
  ["fastfood", "Franchise Dividend", "fastfood", 165000],
  ["uk", "British Windfall", "uk", 330000],
].map(([pack, name, set, value]) => ({
  id: "windfall-" + pack,
  name,
  set,
  value,
  rarity: "Chase",
  emoji: "",
  pattern: "rays",
  colors: ["#4e3919", "#f0ca77"],
  image: "/img/apex.png",
  flavor: "The court shares a little more of its fortune.",
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
  [
    "mythic-uk",
    "The National Treasure",
    "uk",
    2500000,
    "",
    "One extraordinary piece of a very British collection.",
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
  [
    "secret-uk",
    "Free Palestine",
    "uk",
    800000,
    "",
    "A flag of hope. A rare Secret from the UK Pack.",
    "A quiet symbol. An extraordinary discovery.",
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
  image: id === "secret-uk" ? "/img/free-palestine-secret.webp" : "/img/secret.svg",
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
// World Leaders packs price a four-card pull at £10, so the ordinary Epics are
// the carrier tier: each one is worth roughly twice the pack on its own. The
// three headline Epics keep their full authored values.
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
    2100 +
      Math.round((index * 300) / Math.max(1, ordinaryWorldEpics.length - 1)),
  ]),
);
function worldEpicValue(card) {
  return (
    worldEpicBand.get(card.id) ?? Math.round(Math.abs(card.value) * 0.73)
  );
}
const liftedValues = new Map([
  ["crocodilo", 1500],
  ["signet", 2190],
  ["apex-crown", 66000],
  ["mythic-brainrot", 9000],
  ["mythic-royal", 100000],
  ["mythic-apex", 2400000],
  ["mythic-fortnite", 1600000],
  ["mystery-gold", 33750],
  ["payday-vault", 5200],
  ["payday-apex", 31000],
  ["payday-fortnite", 26000],
  ["payday-fastfood", 62000],
]);
const fortniteFixedEpics = new Set([
  "fortnite-fishstick",
  "fortnite-agent-peely",
  "fortnite-midas",
]);
// Brainrot bands: source range (post-scale) maps linearly onto the play range.
// The £2 pack carries on Epic, so Epics sit at about twice the price, Crowns
// clear five times it and the two Commons tiers stay worth pocket change.
const brainrotBands = {
  Common: [7, 26, 10, 16],
  Uncommon: [35, 95, 26, 38],
  Epic: [161, 240, 400, 480],
};
function bandValue(value, [sourceLow, sourceHigh, low, high]) {
  const clamped = Math.min(sourceHigh, Math.max(sourceLow, value));
  const t = sourceHigh === sourceLow ? 0 : (clamped - sourceLow) / (sourceHigh - sourceLow);
  return Math.round(low + t * (high - low));
}
// A pack only reads as a gamble when its tiers straddle the price: dust well
// under it, one carrier tier at about twice the price and trophies above that.
// A pull then either holds a card worth more than the pack cost or it does not,
// which is the difference between a win and a shrug. Headline cards keep their
// authored values, so Kim, Burnham and Renegade Raider are never re-laddered.
// Royal is drawn by three packs at £6, £25 and £150, so its five rungs step by
// roughly five times each: Royalty carries on Epic, Vault on Crown, Apex on the
// Alpha serial and every cheaper rung is dust for the pack above it.
const tierScales = {
  "royal:Common": 0.61,
  "royal:Uncommon": 0.79,
  "royal:Epic": 2.1,
  "royal:Crown": 1.71,
  "fortnite:Common": 0.2,
  "fortnite:Uncommon": 0.3,
  "fortnite:Epic": 1.69,
  "fortnite:Crown": 0.18,
  "world:Common": 0.35,
  "world:Uncommon": 0.25,
  "world:Crown": 0.69,
  "fastfood:Common": 0.47,
  "fastfood:Uncommon": 0.45,
  "fastfood:Epic": 0.93,
  "fastfood:Crown": 0.47,
  "uk:Common": 0.53,
  "uk:Uncommon": 0.93,
  "uk:Epic": 2.0,
  "uk:Crown": 0.66,
};
const authoredValues = new Set([
  "kim",
  "world-former-keir-starmer",
  "fortnite-renegade-raider",
  "world-b8356339d506f77d",
  "world-38b1a8656815ee75",
  "world-israel-flag",
  "world-c6af8a1c1faf4aae",
  "world-4a1d751b1005de43",
]);
function tierScale(card) {
  return (
    authoredValues.has(card.id) ||
    card.id.startsWith("windfall-") ||
    // Nation flags are authored as penny collectables and stay at those prices.
    card.id.startsWith("world-flag-") ||
    card.rarity === "Alpha" ||
    card.rarity === "Chase" ||
    card.rarity === "Mythic" ||
    card.rarity === "Secret"
  )
    ? 1
    : (tierScales[`${card.set}:${card.rarity}`] ?? 1);
}
function scaleValue(value, factor) {
  if (factor === 1) return value;
  return Math.sign(value) * Math.max(1, Math.round(Math.abs(value) * factor));
}
function liftValue(card, value) {
  if (liftedValues.has(card.id)) return liftedValues.get(card.id);
  if (card.id.startsWith("windfall-")) return value;
  if (card.set === "brainrot") {
    if (card.rarity === "Crown") return 1100;
    if (brainrotBands[card.rarity])
      return bandValue(value, brainrotBands[card.rarity]);
  }
  if (
    card.set === "fortnite" &&
    card.rarity === "Epic" &&
    !fortniteFixedEpics.has(card.id)
  )
    return Math.round(value * 0.9);
  // Bulk-tier trims fund the 1-in-25 payday roll without touching the top pulls.
  if (card.set === "fortnite" && card.rarity === "Common")
    return Math.round(value * 0.93);
  if (card.set === "fortnite" && card.rarity === "Uncommon")
    return Math.round(value * 0.92);
  if (card.set === "fastfood" && card.rarity === "Common")
    return Math.round(value * 0.96);
  if (card.set === "fastfood" && card.rarity === "Epic")
    return Math.round(value * 0.86);
  return value;
}
export const catalog = [
  ...cards,
  ...fortniteCards,
  ...fastFoodCards,
  ...chases,
  ...windfalls,
  ...mythics,
  ...secretCards,
  alpha,
  ...leaderData.cards.map(rateLeader),
  ...nationFlagCards,
  ...ukCards,
].map((c) => ({
  ...c,
  value:
    c.id === "kim" ||
    c.id === "world-former-keir-starmer" ||
    c.id === "fortnite-renegade-raider" ||
    c.id.startsWith("windfall-") ||
    c.rarity === "Mythic" ||
    c.rarity === "Secret" ||
    c.set === "uk"
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
})).map((c) => ({
  ...c,
  value: scaleValue(liftValue(c, c.value), tierScale(c)),
}));
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
    { name: "Small lucky lift", epicBonus: 20000 },
    { name: "Uncommon nudge", epicBonus: 0, uncommonBonus: 35000 },
    { name: "Slight stumble", epicBonus: -10000 },
    { name: "Thrifty crown", epicBonus: 0, packDiscount: 10 },
  ],
  Uncommon: [
    { name: "Uncommon lift", epicBonus: 0, uncommonBonus: 80000 },
    { name: "A little luck", epicBonus: 0, uncommonBonus: 55000 },
    { name: "Steady hands", epicBonus: 30000 },
    { name: "Gentle stumble", epicBonus: -20000 },
    { name: "No power-up", epicBonus: 0 },
  ],
  // Epic cards are the first loadout tier a player can really build around, so
  // five of them now reach most of the +2.50% Epic cap instead of a quarter.
  Epic: [
    { name: "Court's favor", epicBonus: 400000 },
    { name: "Measured momentum", epicBonus: 320000 },
    { name: "Uncommon boost", epicBonus: 0, uncommonBonus: 200000 },
    { name: "No power-up", epicBonus: 0 },
    { name: "Small setback", epicBonus: -40000 },
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
    { name: "Chase energy", epicBonus: 650000 },
    {
      name: "Chase insight",
      epicBonus: 0,
      uncommonBonus: 150000,
      crownBonus: 150000,
    },
    { name: "Chase instinct", epicBonus: 450000, crownBonus: 100000 },
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
// Daily Secrets have a base chance; equipped Crowns add weight up to the cap.
export const SECRET_BASE_CHANCE = 500;
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
  // The UK Secret sits on the Vault tier: it guards the priciest pack.
  "secret-uk": {
    name: "A little hope",
    epicBonus: 1500000,
    crownBonus: 300000,
    randomPackDiscount: 20,
    secretBonus: 200,
  },
});
// Named chase cards each keep a distinct, positive effect so a rare pull is
// always an upgrade over the generic rarity profile.
const chasePowerups = Object.freeze({
  crocodilo: {
    name: "Crocodile surge",
    epicBonus: 600000,
    uncommonBonus: 150000,
  },
  signet: { name: "Gilded edge", epicBonus: 500000, crownBonus: 150000 },
  sovereign: {
    name: "Vault leverage",
    epicBonus: 400000,
    uncommonBonus: 200000,
    crownBonus: 100000,
  },
  "apex-crown": { name: "Apex instinct", epicBonus: 700000, crownBonus: 150000 },
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
    SECRET_BASE_CHANCE + crownCards * SECRET_CROWN_BONUS +
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
    odds: [65300000, 22700000, 11000000, 1000000, 0],
    chase: "crocodilo",
    chaseOdds: 800,
    secret: "secret-brainrot",
    windfall: "windfall-brainrot",
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
    odds: [78600000, 11000000, 10000000, 400000, 0],
    chase: "signet",
    chaseOdds: 1000,
    secret: "secret-royal",
    windfall: "windfall-royalty",
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
    odds: [0, 82400000, 11000000, 6500000, 100000],
    chase: "sovereign",
    chaseOdds: 1000,
    payday: "payday-vault",
    paydayOdds: 25,
    secret: "secret-vault",
    windfall: "windfall-vault",
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
    price: 15000,
    count: 5,
    set: "royal",
    odds: [0, 69500000, 13000000, 10000000, 7500000],
    chase: "apex-crown",
    chaseOdds: 2000,
    payday: "payday-apex",
    paydayOdds: 25,
    secret: "secret-apex",
    windfall: "windfall-apex",
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
    odds: [44349990, 41620000, 7130000, 6900000, 10],
    chase: "fortnite-renegade-raider",
    chaseOdds: 40000,
    payday: "payday-fortnite",
    paydayOdds: 25,
    secret: "secret-fortnite",
    windfall: "windfall-fortnite",
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
    odds: [47000000, 40500000, 11000000, 1500000, 0],
    chase: "kim",
    chaseOdds: 45000,
    secret: "secret-world",
    windfall: "windfall-world",
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
    odds: [52000000, 29000000, 11000000, 8000000, 0],
    chase: "food-mcdonalds",
    chaseOdds: 50000,
    payday: "payday-fastfood",
    paydayOdds: 25,
    secret: "secret-fastfood",
    windfall: "windfall-fastfood",
    jackpot: "mythic-fastfood",
    jackpotOdds: 150000,
    art: "fastfood",
    color: "#df8c46",
    tag: "50 REAL CHAINS · FICTIONAL CARD VALUES",
  },
  {
    id: "uk",
    name: "UK Pack",
    short: "UNITED KINGDOM",
    subtitle: "40 celebrities. 30 locations. A collection closer to home.",
    price: 60000,
    count: 5,
    set: "uk",
    odds: [65500000, 22000000, 11000000, 1500000, 0],
    chase: "uk-celebrity-paul-mccartney",
    chaseOdds: 25000,
    payday: "payday-uk",
    paydayOdds: 25,
    secret: "secret-uk",
    windfall: "windfall-uk",
    jackpot: "mythic-uk",
    jackpotOdds: 100000,
    art: "uk",
    color: "#b5bddc",
    tag: "40 CELEBRITIES · 30 UK LOCATIONS",
  },
];
const indexFamilies = Object.freeze({
  brainrot: { name: "Meme Hall", subtitle: "The internet oddities collection." },
  royal: { name: "Royal Archive", subtitle: "The full and questionable royal court." },
  fortnite: { name: "Fortnite Field Guide", subtitle: "Every Fortnite character in the collection." },
  world: { name: "World Stage", subtitle: "Every leader and flag in the archive." },
  alpha: { name: "Mystery Gold", subtitle: "The one-off Alpha card." },
  fastfood: { name: "Fast Food Hall of Fame", subtitle: "Fifty real chains, ranked in broad popularity tiers." },
  uk: { name: "UK Collection", subtitle: "Forty celebrities and thirty places from across the United Kingdom." },
});
export const indexSets = Object.freeze(
  Object.entries(indexFamilies).flatMap(([family, info]) => {
    // New trophy pulls must not shift existing set IDs or claimed rewards.
    const cards = catalog.filter(
      (card) =>
        card.set === family &&
        card.rarity !== "Mythic" &&
        card.rarity !== "Secret" &&
        !card.id.startsWith("payday-") &&
        !card.id.startsWith("windfall-"),
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
export const starterOdds = [55000000, 35000000, 9000000, 1000000, 0];
export const WINDFALL_ROLL_SCALE = 1000000;
export const WINDFALL_CHANCE = 30000;
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
  // Independent trophy rolls never replace another special pull.
  if (pack.payday && randomInt(pack.paydayOdds) === 0) {
    const payday = cardMap[pack.payday];
    if (!payday || payday.rarity !== "Chase")
      throw Error("Unknown Payday card.");
    const eligible = result
      .map((c, i) => ({ c, i }))
      .filter(
        ({ c }) => !["Alpha", "Mythic", "Chase", "Secret"].includes(c.rarity),
      )
      .sort((a, b) => a.c.value - b.c.value);
    if (eligible.length)
      result[eligible[0].i] = { ...payday, rarity: "Chase" };
  }
  if (pack.windfall && randomInt(WINDFALL_ROLL_SCALE) < WINDFALL_CHANCE) {
    const windfall = cardMap[pack.windfall];
    if (!windfall || windfall.rarity !== "Chase")
      throw Error("Unknown Windfall card.");
    const eligible = result
      .map((c, i) => ({ c, i }))
      .filter(
        ({ c }) =>
          !["Alpha", "Mythic", "Chase", "Secret"].includes(c.rarity) &&
          c.value < windfall.value,
      )
      .sort((a, b) => a.c.value - b.c.value);
    if (eligible.length)
      result[eligible[0].i] = { ...windfall };
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
