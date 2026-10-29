import { imageSource, presentedCard } from "../shared/presentation.mjs";
import "./style.css";
import { getUser, getProviders, loginWithGoogle, logout } from "./auth.js";
import {
  catalog,
  cardMap,
  packs,
  money,
  rarities,
  leaderSource,
  packProgress,
  packValueRange,
  starterOdds,
  cardPowerup,
  loadoutPowerup,
  indexSets,
  CHASE_BONUS_SCALE,
  EPIC_SHIFT_CAP,
  CROWN_SHIFT_CAP,
  SET_EPIC_REWARD,
  SET_CROWN_REWARD,
  SET_EPIC_CAP,
  SET_CROWN_CAP,
  SECRET_CHANCE_CAP,
  SECRET_CROWN_BONUS,
  SECRET_BASE_CHANCE,
  WINDFALL_CHANCE,
  WINDFALL_ROLL_SCALE,
  dailyDiscountPack,
  secretPackDiscount,
} from "../shared/catalog.mjs";
import {
  dailySpinSegments,
  playReward,
  dailyQuests,
  normalizeQuestState,
  claimableQuests,
  upgradePrices,
  slotLimits,
  slotOutcomes,
} from "../shared/rules.mjs";
const ordinaryPullNote = "Stronger ordinary pulls, real wins and losses; sell cards to credit your balance.";
const secretRollNote = () =>
  `${(SECRET_BASE_CHANCE / 10000).toFixed(2)}% base chance for everyone, +${(SECRET_CROWN_BONUS / 10000).toFixed(2)}% per equipped Crown, capped at ${(SECRET_CHANCE_CAP / 10000).toFixed(2)}% total. Only the first successful paid purchase each UTC day opens the Secret window; each pack in that batch rolls separately. The window is used even on a miss. No Secret or profit is guaranteed.`;
const familyCaption = (set) => ({
  brainrot: "Brainrot", royal: "Royal Court", world: "World Leaders",
  fortnite: "Fortnite", fastfood: "Fast Food", uk: "UK Collection",
  alpha: "Mystery Gold",
})[set] || set || "Royal Court";
const ukCoreCards = () => catalog.filter((card) =>
  card.set === "uk" && ["celebrity", "location"].includes(card.kind) &&
  !["payday-uk", "windfall-uk", "mythic-uk", "secret-uk"].includes(card.id),
);
const silverPrize = () => dailySpinSegments.find((segment) => segment.id === "silver");
const spinWeight = () => dailySpinSegments.reduce((sum, segment) => sum + segment.weight, 0);
const spinPercent = (weight) => Number((weight / spinWeight() * 100).toFixed(3));
const slotWeight = () => slotOutcomes.reduce((sum, outcome) => sum + outcome.weight, 0);
const slotPercent = (weight) => Number((weight / slotWeight() * 100).toFixed(3));
const slotReturnRate = () =>
  slotOutcomes.reduce((sum, outcome) => sum + outcome.multiplier * outcome.weight, 0) /
  slotWeight();
const slotMissWeight = slotOutcomes.find((outcome) => !outcome.multiplier).weight;
const slotBigWeight = slotOutcomes
  .filter((outcome) => outcome.multiplier >= 10)
  .reduce((sum, outcome) => sum + outcome.weight, 0);
const slotOddsNote = () =>
  slotOutcomes
    .map(
      (outcome) =>
        `${slotPercent(outcome.weight)}% ${
          outcome.multiplier ? `pays ${outcome.multiplier}×` : "loses the stake"
        }`,
    )
    .join(" · ");
const collectionRarities = [...rarities, "Mythic", "Chase", "Secret"];
const $ = (s, root = document) => root.querySelector(s);
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icons = {
  crown: '<path d="m3 6 5 4 4-7 4 7 5-4-3 13H6L3 6Z"/><path d="M7 22h10"/>',
  packs: '<path d="M6 3h12v18H6zM6 7h12M6 17h12m-8-5 2-2 2 2-2 2z"/>',
  collection:
    '<rect x="7" y="5" width="13" height="16" rx="2"/><path d="M4 17V3h12M11 10h5m-5 4h5"/>',
  pot: '<path d="M8 4h8v4c0 8-8 8-8 0V4Zm4 10v6m-4 1h8M8 6H4v3c0 3 4 3 4 3m8-6h4v3c0 3-4 3-4 3"/>',
  friends:
    '<circle cx="9" cy="7" r="3"/><path d="M3 21v-4c0-5 12-5 12 0v4m3-17c5 0 5 7 0 7m1 4c3 0 3 3 3 6"/>',
  rewards:
    '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13m0-13C1 8 7-2 12 8Zm0 0C23 8 17-2 12 8Z"/>',
  leaderboards: '<path d="M3 21V11h6v10m0 0V4h6v17m0 0v-7h6v7M1 21h22"/>',
  wallet:
    '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 8V5l14-3v3m-2 6h6v5h-6z"/>',
  arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  sound:
    '<path d="M3 9h4l5-5v16l-5-5H3V9Zm13-2c4 3 4 7 0 10m3-13c6 5 6 11 0 16"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6c0-6 8-6 8 0v4m-4 4v3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/>',
  spark:
    '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 7h-3a3 3 0 0 0-3 3v7m-2-5h7m-6 5h8"/>',
  slots:
    '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7 5v14m5-14v14m5-14v14M3 12h18"/>',
  bolt: '<path d="M13 2 5 13h5l-2 9 9-12h-5l2-8Z"/>',
  settings:
    '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a7.8 7.8 0 0 1-1.5.9L16 21h-3l-.3-2.1a7.8 7.8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a7.8 7.8 0 0 1 1.5-.9L13 7h3l.3 2.1a7.8 7.8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1-.1 2.1Z"/>',
};
const icon = (n, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n] || icons.crown}</svg>`;
let state = {
  view: "packs",
  filter: "all",
  user: null,
  account: null,
  inventory: [],
  pot: null,
  friends: null,
  board: "wealth",
  selected: new Set(),
  rarity: "all",
  set: "all",
  sort: "recent",
  search: "",
  rosterSearch: "",
  rosterKind: "all",
  rosterLimit: 40,
  ukSearch: "",
  ukKind: "all",
  ukLimit: 40,
  indexFamily: "all",
  slotBet: 1000,
  slotLast: null,
  slotStats: { spins: 0, wagered: 0, returned: 0 },
  muted: false,
  busy: false,
};
const app = $("#app"),
  modal = $("#modal");
let toastTimer, modalFocus;
let lastActivity = Date.now();
let renderVersion = 0;
let viewRequest = 0;
let syncRequest = 0;
// vercel.json only whitelists these widths; any other w= makes /_vercel/image answer 400.
const IMAGE_SIZES = [400, 500, 650];
const image = (src, w = 500) => {
  const source = imageSource(src);
  if (source.startsWith("https://cdn.jsdelivr.net/npm/simple-icons@")) return source;
  const size = IMAGE_SIZES.reduce(
    (best, candidate) =>
      Math.abs(candidate - w) < Math.abs(best - w) ? candidate : best,
    IMAGE_SIZES[0],
  );
  return source.startsWith("/img/flags/") ||
    (source.startsWith("/") && source.endsWith(".svg"))
    ? source
    : import.meta.env.DEV
      ? source
      : `/_vercel/image?url=${encodeURIComponent(source)}&w=${size}&q=75`;
};
const art = (pack) =>
  image(
    pack.art === "uk"
      ? "/img/uk-pack.webp"
      : pack.art === "world"
        ? "/img/mystery-leader.svg"
        : pack.art === "fortnite"
          ? cardMap["fortnite-renegade-raider"].image
          : pack.art === "fastfood"
            ? "/img/fastfood.svg"
            : "/img/" + pack.art + ".png",
  );
// Retry the original if image transformation fails, then use a bundled fallback.
document.addEventListener(
  "error",
  (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    if (
      !img.dataset.originalTried &&
      img.getAttribute("src")?.startsWith("/_vercel/image?")
    ) {
      img.dataset.originalTried = "true";
      const original = new URL(img.src).searchParams.get("url");
      if (original) {
        img.src = original;
        return;
      }
    }
    if (!img.dataset.fallbackTried) {
      img.dataset.fallbackTried = "true";
      img.src = "/img/leader-placeholder.svg";
      img.alt += " (image unavailable)";
    }
  },
  true,
);
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 4500);
}
async function api(path, data) {
  const r = await fetch("/api/" + path, {
    method: data === undefined ? "GET" : "POST",
    headers: data === undefined ? {} : { "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
    ...(data === undefined ? { signal: AbortSignal.timeout(30000) } : {}),
  });
  let out;
  try {
    out = await r.json();
  } catch {
    throw Error("The court is temporarily unavailable. Please try again.");
  }
  if (!r.ok) throw Error(out.error || "Request failed.");
  return out;
}
async function sync() {
  if (!state.user) return;
  const userId = state.user.id;
  const request = ++syncRequest;
  const r = await api("me");
  if (request !== syncRequest || state.user?.id !== userId) return;
  state.account = r.account;
  state.inventory = r.inventory;
  updateWallet();
}
function updateWallet() {
  const el = $("#wallet-value");
  if (el) el.textContent = money(state.account?.balance || 0);
  document.querySelectorAll("[data-pack-progress]").forEach((node) => {
    node.outerHTML = guaranteeProgress();
  });
}
function showModal(content, cls = "") {
  modalFocus = document.activeElement;
  modal.className = cls;
  modal.innerHTML = `<button class="modal-close icon-button" data-action="close" aria-label="Close dialog">${icon("close")}</button>${content}`;
  const heading = modal.querySelector("h2");
  if (heading) {
    heading.id = "modal-title";
    modal.setAttribute("aria-labelledby", heading.id);
  } else modal.removeAttribute("aria-labelledby");
  if (!modal.open) modal.showModal();
}
function closeModal() {
  if (state.busy || modal.classList.contains("username-required-modal")) return;
  modal.close();
  modalFocus?.focus();
}
modal.addEventListener("cancel", (e) => {
  if (state.busy || modal.classList.contains("username-required-modal"))
    e.preventDefault();
});
modal.addEventListener("click", (e) => {
  if (
    e.target === modal &&
    !state.busy &&
    !modal.classList.contains("username-required-modal")
  )
    closeModal();
});
function requireUser() {
  if (state.user) return true;
  authModal();
  return false;
}
const tabs = [
  "packs",
  "codex",
  "uk",
  "collection",
  "index",
  "loadout",
  "upgrades",
  "pot",
  "slots",
  "friends",
  "rewards",
  "leaderboards",
];
const todayKey = () => new Date().toISOString().slice(0, 10);
function hasClaimableReward() {
  const a = state.account;
  if (!state.user || !a) return false;
  const day = todayKey();
  if (!a.starter_claimed) return true;
  if (a.spin_day !== day) return true;
  return claimableQuests(a.quest_state, day).length > 0;
}
function hasClaimableIndexReward() {
  const a = state.account;
  if (!state.user || !a) return false;
  const discovered = new Set([
    ...(a.character_index || []),
    ...(a.fortnite_collection || []),
  ]);
  const rewards = a.set_rewards || {};
  return indexSets.some(
    (set) =>
      !rewards[set.id] &&
      set.cardIds.every((id) => discovered.has(id)),
  );
}
function shell() {
  app.innerHTML = `<a class="skip-link" href="#main">Skip to content</a><header class="header"><a class="brand" href="#packs" aria-label="Card Monarchs home"><span class="brand-mark">${icon("crown")}</span><span>CARD<span class="brand-secondary">MONARCHS</span></span></a><nav aria-label="Main navigation">${tabs.map((n) => `<a href="#${n}" ${state.view === n ? 'aria-current="page"' : ""} class="nav-item ${n === "index" ? "index-nav-item" : ""} ${state.view === n ? "active" : ""}">${icon(n === "codex" || n === "index" || n === "uk" ? "globe" : n === "upgrades" ? "spark" : n)}<span>${n === "pot" ? "The Pot" : n === "codex" ? "Leaders" : n === "uk" ? "UK Collection" : n === "index" ? "Card Index" : n[0].toUpperCase() + n.slice(1)}</span>${(n === "rewards" && hasClaimableReward()) || (n === "index" && hasClaimableIndexReward()) ? '<i class="claim-dot" aria-label="Claimable reward"></i>' : ""}</a>`).join("")}</nav><div class="header-actions"><div class="wallet">${icon("wallet")}<span id="wallet-value">${money(state.account?.balance || 0)}</span><span class="virtual-chip">VIRTUAL</span></div>${state.user ? `<button class="button ghost small settings-button" data-action="settings">${icon("settings")} Settings</button><button class="avatar" data-action="profile" aria-label="Open profile">${esc((state.account?.username || state.user.name || "M").slice(0, 1))}</button>` : `<button class="button small" data-action="auth">Join the court ${icon("arrow")}</button>`}</div></header><main id="main" tabindex="-1"></main><footer><a href="#packs" class="footer-brand">${icon("crown")} CARD MONARCHS</a><span>A very unserious game. A seriously good collection.</span><div><button class="text-button" data-action="how">How to play</button><button class="icon-button" data-action="mute" aria-label="${state.muted ? "Unmute" : "Mute"} sound">${icon("sound")}<span>${state.muted ? "Off" : "On"}</span></button></div><p>All GBP is fictional. No deposits, withdrawals, or real-world value. Nothing here is financial advice. Obviously.</p></footer>`;
}
function title(eyebrow, heading, text) {
  return `<div class="page-heading"><span class="eyebrow">${eyebrow}</span><h1>${heading}</h1><p>${text}</p></div>`;
}
function packArt(p, extra = "") {
  return `<div class="foil-pack ${p.id} ${extra}" style="--pack-color:${p.color}"><img src="${art(p)}" alt="${esc(p.name)} artwork" loading="${extra ? "eager" : "lazy"}"><div class="pack-sheen"></div><div class="pack-brand">${icon("crown")} CARD MONARCHS</div>${p.id === "starter" ? '<div class="starter-pack-seal">FREE · ONE CARD</div>' : ""}<div class="pack-label"><span>${p.id === "starter" ? "A GIFT FOR EVERY PLAYER" : p.id === "brainrot" ? "THE ORIGINAL COLLECTION" : p.id === "apex" ? "THE ULTIMATE COLLECTION" : "THE " + familyCaption(p.set).toUpperCase() + (p.set === "uk" ? "" : " COLLECTION")}</span><strong>${p.short.replace(" ", "<br>")}</strong><small>${p.count} ${p.count === 1 ? "CARD" : "CARDS"} INSIDE</small></div><div class="pack-crimp"></div></div>`;
}
const starterPackArt = {
  id: "starter",
  name: "Starter Pack",
  short: "STARTER",
  color: "#d8b96e",
  art: "brainrot",
  count: 1,
};
function guaranteeProgress() {
  const { progress, remaining, nextGuaranteed } = packProgress(
    Number(state.account?.packs || 0),
  );
  return `<aside class="epic-progress ${nextGuaranteed ? "guarantee-ready" : ""}" data-pack-progress><div>${icon("spark")}<span class="eyebrow">THE TENTH-PACK PROMISE</span><strong>${state.user ? (nextGuaranteed ? "Next pack: Epic or better" : `${remaining} packs to your guaranteed Epic`) : "An Epic or better every 10 packs"}</strong></div><progress max="10" value="${progress}" aria-label="Packs toward your next guaranteed Epic">${progress} / 10</progress><p>${state.user ? `${progress} / 10 packs · ` : "Sign in to track your progress. "}All pack types count. Every tenth successful purchase contains an Epic or better. Earlier lucky pulls never reset this promise. Rarity does not guarantee profit.</p></aside>`;
}
function lossStreakProgress() {
  const streak = Math.max(0, Math.min(3, Number(state.account?.loss_streak || 0)));
  const ready = Boolean(state.user) && streak >= 3;
  const remaining = Math.max(0, 3 - streak);
  return `<aside class="epic-progress pity-progress ${ready ? "guarantee-ready" : ""}" data-loss-streak><div>${icon("spark")}<span class="eyebrow">THE COMEBACK PROMISE</span><strong>${state.user ? (ready ? "Next pack: Uncommon or better" : `${remaining} losing pack${remaining === 1 ? "" : "s"} until an Uncommon-or-better pack`) : "Three straight losses unlock a better pack"}</strong></div><progress max="3" value="${streak}" aria-label="Losing packs toward your next guaranteed Uncommon pack">${streak} / 3</progress><p>${state.user ? `${streak} / 3 money-losing packs · ` : "Sign in to track your progress. "}Lose money on three packs in a row and the next pack contains no Commons. Every pack type counts, and the promise is used when that pack opens. Rarity does not guarantee profit.</p></aside>`;
}
function loadoutEffects() {
  const equippedCards = (state.account?.loadout || [])
    .map((id) => state.inventory.find((card) => Number(card.id) === Number(id)))
    .filter(Boolean);
  return loadoutPowerup(equippedCards);
}
function nextPackDiscount() {
  const nextPack = Number(state.account?.packs || 0) + 1;
  if (!state.user || nextPack % 3 !== 0) return 0;
  return loadoutEffects().packDiscount;
}
function secretDiscountFor(pack) {
  if (!state.user || !state.account) return 0;
  return secretPackDiscount(
    pack,
    state.account.id,
    todayKey(),
    loadoutEffects(),
  );
}
function packPrice(pack) {
  return Math.max(0, pack.price - nextPackDiscount() - secretDiscountFor(pack));
}
// The Crown bonus also makes each pack's chase card more likely.
const chaseNote = (crownBonus) =>
  `+${Math.round((crownBonus / CHASE_BONUS_SCALE) * 100)}% chase chance`;
function powerupDescription(powerup) {
  const effects = [];
  if (powerup.everyOtherCard) effects.push("Every 2nd pack card · Uncommon+");
  if (powerup.uncommonBonus)
    effects.push(`${powerup.uncommonBonus > 0 ? "+" : ""}${(powerup.uncommonBonus / 1000000).toFixed(2)}% Uncommon odds`);
  if (powerup.epicBonus)
    effects.push(`${powerup.epicBonus > 0 ? "+" : ""}${(powerup.epicBonus / 1000000).toFixed(2)}% Epic odds`);
  if (powerup.crownBonus)
    effects.push(`+${(powerup.crownBonus / 1000000).toFixed(2)}% Crown odds`, chaseNote(powerup.crownBonus));
  if (powerup.secretBonus)
    effects.push(`+${(powerup.secretBonus / 10000).toFixed(2)}% daily Secret chance`);
  if (powerup.packDiscount) effects.push(`${powerup.packDiscount}p off every 3rd pack`);
  if (powerup.randomPackDiscount)
    effects.push(`${powerup.randomPackDiscount}% off one random pack type each day`);
  return effects.join(" · ") || "No power-up";
}
function packLoadoutSummary() {
  const equipped = (state.account?.loadout || [])
    .map((id) => state.inventory.find((card) => Number(card.id) === Number(id)))
    .filter(Boolean);
  const cards = equipped.map((card) => cardMap[card.template_id]).filter(Boolean);
  const effect = loadoutPowerup(equipped);
  const discountedPack = packs.find(
    (pack) => pack.id === dailyDiscountPack(state.account?.id || "", todayKey()),
  );
  const totals = [
    effect.uncommonBonus && `${effect.uncommonBonus > 0 ? "+" : ""}${(effect.uncommonBonus / 1000000).toFixed(2)}% Uncommon odds`,
    effect.epicBonus && `${effect.epicBonus > 0 ? "+" : ""}${(effect.epicBonus / 1000000).toFixed(2)}% Epic odds`,
    effect.crownBonus && `+${(effect.crownBonus / 1000000).toFixed(2)}% Crown odds · ${chaseNote(effect.crownBonus)}`,
    effect.everyOtherCard && "Every 2nd card is Uncommon+",
    state.account?.permanent_epic_bonus && `Permanent +${(Number(state.account.permanent_epic_bonus) / 1000000).toFixed(2)}% Epic odds`,
    state.account?.permanent_crown_bonus && `Permanent +${(Number(state.account.permanent_crown_bonus) / 1000000).toFixed(2)}% Crown odds · ${chaseNote(Number(state.account.permanent_crown_bonus))}`,
    effect.packDiscount && `${effect.packDiscount}p off every 3rd pack`,
    `${(effect.secretChance / 10000).toFixed(2)}% daily Secret chance · first successful purchase, each pack in the batch` +
      (effect.crownCards ? ` · ${effect.crownCards} Crown card${effect.crownCards === 1 ? "" : "s"}` : ""),
    effect.randomPackDiscount &&
      `${effect.randomPackDiscount}% off ${discountedPack?.name || "a random pack"} today`,
    state.account?.secret_day === todayKey() && "Secret window used today",
  ].filter(Boolean);
  return `<aside class="pack-loadout-hud" aria-label="Equipped loadout effects"><span class="eyebrow">LOADOUT EFFECTS</span>${cards.length ? `<div class="pack-loadout-cards">${equipped.map((card) => `<span><strong>${esc(cardMap[card.template_id]?.name)}</strong><small>${esc(powerupDescription(cardPowerup(card)))}</small></span>`).join("")}</div>` : ""}<p>${totals.length ? totals.join(" · ") : "No odds changes active."}</p></aside>`;
}
function ukFeaturedBanner() {
  const pack = packs.find((p) => p.id === "uk");
  if (!pack) return "";
  return `<article class="world-banner uk-banner"><div class="world-banner-art uk-banner-art"><img src="/img/uk-pack.webp" alt="UK collection pack artwork" loading="lazy"></div><div><span class="eyebrow">NEW COLLECTION · UNITED KINGDOM</span><h2>Icons. Landmarks.<br>A very British collection.</h2><p>40 celebrities. 30 locations. Five cards per £600 pack. Paul McCartney is the £6,000 Chase within the 40 celebrities.</p></div><div class="world-banner-action"><span>RARE ONCE-A-DAY SECRET</span><strong>£8,000</strong><small>Free Palestine · virtual sell value<br>No guaranteed Secret or profit.</small><button class="button ghost" data-action="buy" data-id="uk">Five cards · £600 ${icon("arrow")}</button><a class="text-button roster-link" href="#uk">Browse UK collection ${icon("globe")}</a></div></article>`;
}
function shop() {
  const visible = packs.filter((p) =>
    state.filter === "all" ? true : p.set === state.filter,
  );
  $("#main").innerHTML =
    `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="tiny-crown">${icon("crown")}</span> WELCOME TO YOUR KINGDOM</div><h1>Chaos is<br><span>collectible.</span></h1><p>Ridiculous cards. Royal-level pulls.<br>Open packs, trade with your court, and play for the pot.</p><div class="hero-buttons"><a href="#shop" class="button" data-action="scroll-shop">Explore packs ${icon("arrow")}</a><button class="button ghost" data-action="how">How it works ${icon("info")}</button></div><div class="hero-note"><span class="green-dot"></span> Real fun. Fictional money. <span>Always.</span></div></div><div class="hero-stage" aria-label="Featured collectible cards"><div class="orbital"></div><span class="stage-star s1">✦</span><span class="stage-star s2">✧</span><div class="hero-card back-left"><div class="ornate-corner"></div><img src="${image("/img/royal.png")}" alt="Royal crown"><span>THE ROYAL COURT</span><strong>Crown of Eternity</strong><b>CROWN • ${money(4500)}</b></div><div class="hero-card back-right"><img src="${image("/img/apex.png")}" alt="Mystery Gold crown"><span>THE ONE. THE ONLY.</span><strong>Mystery Gold</strong><b>ALPHA • SERIAL № 001</b></div><div class="hero-card front"><div class="hero-card-top">${icon("crown")} THE BRAINROT COLLECTION <span>001</span></div><img src="${image("/img/brainrot.png", 650)}" alt="Tralalero Tralala, a crowned shark wearing blue sneakers"><div class="hero-card-bottom"><span>COMMON</span><strong>Tralalero<br>Tralala</strong><small>All hail the king of absolutely nothing.</small><div><span>SELL VALUE</span><b>${money(cardMap["brainrot-common-0"].value)}</b></div></div></div><div class="floating-label">${icon("spark")} Your next legendary pull?</div></div></section><section class="trust-strip"><div>${icon("rewards")}<span><strong>£5 on the house</strong><small>Your welcome bonus awaits.</small></span></div><div>${icon("collection")}<span><strong>Collect. Trade. Reign.</strong><small>Build a collection fit for a monarch.</small></span></div><div>${icon("coin")}<span><strong>Growing play rewards</strong><small>Earn more the longer you play.</small></span></div><span class="play-label">100% VIRTUAL<br><strong>0% REAL MONEY</strong></span></section><section id="shop" class="shop-section"><div class="section-heading"><div><span class="eyebrow">THE ROYAL PACK SHOP</span><h2>Pick your poison.<span> Or your crown.</span></h2><p>${ordinaryPullNote}</p></div><button class="text-button odds-link" data-action="all-odds">${icon("info")} Transparent odds. Always.</button></div><div class="shop-promises">${guaranteeProgress()}${lossStreakProgress()}</div><div class="shop-filters" role="group" aria-label="Pack collection"><div>${[
      ["all", "All packs"],
      ["brainrot", "Brainrot collection"],
      ["royal", "The royal court"],
      ["world", "World leaders"],
      ["uk", "UK collection"],
      ["fortnite", "Fortnite"],
      ["fastfood", "Fast Food"],
    ]
      .map(
        ([id, label]) =>
          `<button data-action="filter" data-filter="${id}" aria-pressed="${state.filter === id}" class="filter-button ${state.filter === id ? "active" : ""}">${label}${id === "uk" ? '<span class="new-tag">NEW</span>' : ""}</button>`,
      )
      .join(
        "",
      )}</div><span class="shop-hint">Every pack. A new possibility.</span></div><div class="packs-grid ${visible.length === 1 ? "single" : ""}">${visible.map((p, i) => `<article class="pack-product ${state.lastOpenedPackId === p.id ? "last-opened" : ""}" data-pack-id="${p.id}" style="--pack-color:${p.color};--i:${i}"><div class="product-visual"><span class="product-tag">${p.tag}</span>${packArt(p)}<div class="pack-aura"></div><button class="odds-button" data-action="odds" data-id="${p.id}" aria-label="View ${p.name} odds">${icon("info")}</button></div><div class="product-info"><div class="product-meta"><span>${p.count} CARDS PER PACK</span><span>${esc(familyCaption(p.set).toUpperCase())}</span></div><h3>${p.name}</h3><p>${p.subtitle}</p><p class="pack-values">Regular card values: ${money(packValueRange(p).min)} – ${money(packValueRange(p).max)}. Chase, Alpha and Mythic jackpot values are higher.</p><button class="button buy-button" data-action="buy" data-id="${p.id}"><span>${state.lastOpenedPackId === p.id ? "Open this pack again" : "Open pack"} ${icon("arrow")}</span><b>${money(packPrice(p))}</b></button>${nextPackDiscount() ? '<small class="discount-hint">Loadout boost · 10p off this pack</small>' : ""}${secretDiscountFor(p) ? `<small class="discount-hint secret-discount-hint">Secret power-up · ${money(secretDiscountFor(p))} off today</small>` : ""}${p.set === "world" ? '<button class="text-button roster-link" data-action="codex">Browse every leader ' + icon("globe") + "</button>" : p.set === "uk" ? `<a class="text-button roster-link" href="#uk">Browse UK collection ${icon("globe")}</a><p class="uk-secret-note">Rare once-a-day Secret · Free Palestine · £8,000 virtual sell value. No guaranteed pull.</p>` : ""}<div class="chase-note">${icon("spark")} ${p.guarantee ? "Crown or better in every pack · " : ""}Chase 1 in ${p.chaseOdds.toLocaleString()} · Mythic 1 in ${p.jackpotOdds.toLocaleString()}${p.payday ? ` · Payday 1 in ${p.paydayOdds}` : ""} · Windfall ${100 * WINDFALL_CHANCE / WINDFALL_ROLL_SCALE}%</div></div></article>`).join("")}</div>${state.filter === "all" ? `${ukFeaturedBanner()}<article class="world-banner"><div class="world-banner-art">${icon("globe")}<img src="/img/mystery-leader.svg" alt="Locked mystery leader"></div><div><span class="eyebrow">THE WORLD LEADERS COLLECTION</span><h2>World domination.<br>In your pocket.</h2><p>Heads of state. Heads of government. One secret chase identity.</p></div><div class="world-banner-action"><span>THE 1 IN 45,000 CHASE</span><strong>£15,000</strong><small>Mystery leader · virtual sell value</small><span class="mythic-banner-line">MYTHIC · 1 IN 200,000 · £5,000</span><button class="button ghost" data-action="world">Discover the pack ${icon("arrow")}</button><button class="text-button roster-link" data-action="codex">Browse all leaders ${icon("globe")}</button></div></article>` : ""}</section><section class="bottom-panels"><div class="pot-promo"><span class="eyebrow">A SEAT AT THE TABLE</span><h2>The crown is anyone’s.</h2><p>One global pot. Ten minutes. One lucky monarch.</p><a href="#pot" class="text-button">Enter the pot ${icon("arrow")}</a>${icon("pot", "large-icon")}</div><div class="collection-promo"><span class="eyebrow">BUILT FOR YOUR INNER HOARDER</span><h2>Some cards just hit different.</h2><p>Keep the legends. Sell the rest. Trade with your friends.</p><a href="#collection" class="text-button">Your collection ${icon("collection", "large-icon")}</a></div></section>`;
}
function gameCard(
  row,
  {
    selectable = false,
    actions = false,
    owned = false,
    loadoutAction = false,
  } = {},
) {
  const template = cardMap[row.template_id || row.id] || row;
  const t = presentedCard(
    row.template_id && row.rarity ? { ...template, rarity: row.rarity } : template,
    owned ||
      Boolean(row.template_id) ||
      state.inventory.some((c) => c.template_id === template.id),
  );
  const val = Number(row.value ?? t.value);
  const rarity = t.rarity.toLowerCase();
  const isLocation = t.kind === "location";
  const isUk = t.set === "uk";
  const sources = !owned || isUk
    ? [
        t.page && {
          url: t.page,
          label:
            t.role === "National flag"
              ? "Flag image source"
              : isLocation
                ? "Location / landmark source"
                : t.set === "world" || t.kind === "celebrity"
                  ? "Portrait / biography"
                  : "Card source",
        },
        t.imageSource && {
          url: t.imageSource,
          label: isLocation || t.role === "National flag" ? "Image source" : "Photo / artwork source",
        },
        t.officialSource && { url: t.officialSource, label: "Official office" },
      ]
        .filter(Boolean)
        .map(
          ({ url, label }) =>
            `<a class="portrait-source" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`,
        )
        .join("")
    : "";
  const imageCredit = isUk && (t.imageCredit || t.imageLicense)
    ? `<small class="uk-image-credit">${esc(t.imageCredit || "")}${t.imageCredit && t.imageLicense ? " · " : ""}${t.imageLicenseUrl ? `<a href="${esc(t.imageLicenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(t.imageLicense || "Image license")} ↗</a>` : esc(t.imageLicense || "")}</small>`
    : "";
  const countryFlag = t.flag
    ? `<span class="country-flag-badge" role="img" aria-label="${esc(t.country)} flag">${t.flag}<small>${esc(t.country)}</small></span>`
    : "";
  const portraitAlt =
    t.role === "National flag"
      ? `Flag of ${esc(t.country)}`
      : t.id === "locked-world-chase"
        ? "Locked mystery leader"
        : isLocation
          ? `${esc(t.name)} · UK location`
          : t.portraitPlaceholder
            ? `Image unavailable for ${esc(t.name)}`
            : t.rarity === "Secret"
              ? `${esc(t.name)} Secret card artwork`
              : t.kind === "celebrity" || t.set === "world"
                ? `Portrait of ${esc(t.name)}`
                : `${esc(t.name)} card artwork`;
  const portrait =
    t.role === "National flag"
      ? `<div class="card-portrait national-flag-portrait">${countryFlag}<img src="${image(t.image, 320)}" loading="lazy" alt="${portraitAlt}"></div>`
      : `<div class="card-portrait">${countryFlag}<img src="${image(t.image || (t.set === "world" ? "/img/leader-placeholder.svg" : "/img/apex.png"), 400)}" loading="lazy" alt="${portraitAlt}"></div>`;
  const powerup = cardPowerup(t);
  const noPowerup =
    powerup.epicBonus === 0 &&
    !powerup.uncommonBonus &&
    !powerup.crownBonus &&
    !powerup.secretBonus &&
    !powerup.packDiscount &&
    !powerup.randomPackDiscount &&
    !powerup.everyOtherCard;
  const powerupText = powerupDescription(powerup);
  const loadoutIds = state.account?.loadout || [];
  const equipped = owned && loadoutIds.includes(Number(row.id));
  const slotLimit = Number(state.account?.loadout_slots || 3);
  const loadoutFull = loadoutIds.length >= slotLimit && !equipped;
  const boostTone = noPowerup
    ? "boost-none"
    : powerup.epicBonus > 0 ||
        powerup.uncommonBonus > 0 ||
        powerup.crownBonus > 0 ||
        powerup.secretBonus > 0 ||
        powerup.randomPackDiscount > 0
      ? "boost-positive"
      : powerup.epicBonus < 0
        ? "boost-negative"
        : "boost-neutral";
  return `<article class="game-card family-${esc(t.set || "royal")} ${t.kind ? `kind-${esc(t.kind)}` : ""} rarity-${rarity} pattern-${t.pattern || "grid"} ${state.selected.has(row.id) ? "selected" : ""}" style="--card-a:${t.colors?.[0] || "#26303e"};--card-b:${t.colors?.[1] || "#bca270"}" ${loadoutAction ? `data-action="loadout-preview" data-id="${row.id}" tabindex="0" role="button" aria-label="View odds effect for ${esc(t.name)}"` : selectable ? `data-action="select-card" data-id="${row.id}" tabindex="0" role="button" aria-pressed="${state.selected.has(row.id)}"` : ""}><div class="card-top"><span>${esc(t.rarity)}</span><span>${row.serial ? "№ " + String(row.serial).padStart(3, "0") : owned && state.inventory.filter((c) => c.template_id === row.template_id).length > 1 ? "×" + state.inventory.filter((c) => c.template_id === row.template_id).length : t.set === "world" ? icon("globe") : icon("crown")}</span></div>${portrait}<div class="card-caption"><small>${t.flag ? `<span class="country-flag" role="img" aria-label="${esc(t.country)} flag">${t.flag}</span> ` : ""}${esc(isUk ? familyCaption(t.set) + (t.kind === "location" ? " · Location" : t.kind === "celebrity" ? " · Celebrity" : "") : t.country || familyCaption(t.set).toUpperCase())}</small><h3>${esc(t.name)}</h3>${(t.set === "world" || isUk) && t.role ? `<small class="${isUk ? "uk-role" : "leader-role"}">${esc(t.role)}</small>` : ""}<p>${esc(t.secretCaption || t.flavor || "The court approves. Probably.")}</p><small class="card-powerup ${boostTone}">${icon("spark")} ${esc(powerupText)}</small><div class="card-value"><span>${row.vaulted ? icon("lock") + " VAULTED" : row.trade_id ? "RESERVED" : "SELL VALUE"}</span><strong>${money(val)}</strong></div></div>${sources}${imageCredit}${actions ? `<div class="card-actions"><button class="text-button" data-action="vault" data-id="${row.id}" ${row.trade_id || equipped ? "disabled" : ""}>${icon("lock")} ${row.vaulted ? "Unvault" : "Vault"}</button><button class="text-button" data-action="sell-one" data-id="${row.id}" ${row.vaulted || row.trade_id || equipped ? "disabled" : ""}>${val < 0 ? "Pay penalty & discard" : "Sell"} ${icon("arrow")}</button></div>` : ""}${loadoutAction ? `<div class="card-actions loadout-card-actions"><button class="button ${equipped ? "ghost" : "small"}" data-action="loadout-toggle" data-id="${row.id}" ${row.vaulted || row.trade_id || loadoutFull ? "disabled" : ""}>${equipped ? "Unequip" : loadoutFull ? "Loadout full" : "Equip power"}</button></div>` : ""}</article>`;
}
function fortniteCollectionAlbum() {
  const cards = catalog.filter(
    (card) => card.set === "fortnite" && card.rarity !== "Mythic",
  );
  const discovered = new Set([
    ...(Array.isArray(state.account?.fortnite_collection)
      ? state.account.fortnite_collection
      : []),
    ...state.inventory
      .filter((card) => card.template_id?.startsWith("fortnite-"))
      .map((card) => card.template_id),
  ]);
  const revealedCount = cards.filter((card) => discovered.has(card.id)).length;
  return `<section class="fortnite-album"><div class="fortnite-album-heading"><div><span class="eyebrow">FORTNITE FIELD GUIDE</span><h2>Character collection</h2><p>Discover all 30 characters. Pull a character once to reveal it permanently.</p></div><strong>${revealedCount} / ${cards.length} revealed</strong></div><div class="fortnite-album-grid">${cards
    .map((card, index) => {
      const revealed = discovered.has(card.id);
      const mysteryName = `Mystery character ${String(index + 1).padStart(2, "0")}`;
      return `<article class="fortnite-album-card ${revealed ? "revealed" : "mystery"}" aria-label="${revealed ? esc(card.name + ", " + card.rarity) : esc(mysteryName)}">
        <div class="fortnite-album-art"><img src="${image(card.image, 360)}" alt="${revealed ? esc(card.name + " Fortnite outfit") : "Mystery Fortnite character"}" loading="lazy">${revealed ? "" : '<span aria-hidden="true">?</span>'}</div>
        <div class="fortnite-album-info"><small>${revealed ? esc(card.rarity.toUpperCase()) : "UNDISCOVERED"}</small><h3>${revealed ? esc(card.name) : "Mystery character"}</h3><p>${revealed ? money(card.value) + " sell value" : "Open a Fortnite Drop Pack to reveal this character."}</p></div>
      </article>`;
    })
    .join("")}</div></section>`;
}
function indexView() {
  const discovered = new Set([
    ...(Array.isArray(state.account?.character_index) ? state.account.character_index : []),
    ...(Array.isArray(state.account?.fortnite_collection) ? state.account.fortnite_collection : []),
  ]);
  const rewards = state.account?.set_rewards || {};
  const epicBonus = Number(state.account?.permanent_epic_bonus || 0);
  const crownBonus = Number(state.account?.permanent_crown_bonus || 0);
  const families = [
    ["all", "All sets"],
    ["brainrot", "Meme Hall"],
    ["royal", "Royal Archive"],
    ["fortnite", "Fortnite"],
    ["world", "World Stage"],
    ["uk", "UK Collection"],
    ["alpha", "Mystery Gold"],
    ["fastfood", "Fast Food"],
  ];
  const visibleSets = state.indexFamily === "all"
    ? indexSets
    : indexSets.filter((set) => set.family === state.indexFamily);
  const familyButtons = families.map(([id, label]) =>
    '<button class="index-filter ' + (state.indexFamily === id ? "active" : "") + '" data-action="index-family" data-family="' + id + '" aria-pressed="' + (state.indexFamily === id) + '">' + label + (id === "all" ? " · " + indexSets.length : " · " + indexSets.filter((set) => set.family === id).length) + "</button>"
  ).join("");
  const sections = visibleSets.map((set) => {
    const cards = set.cardIds.map((id) => cardMap[id]).filter(Boolean);
    const count = cards.filter((card) => discovered.has(card.id)).length;
    const complete = count === cards.length;
    const claimed = rewards[set.id];
    const pct = cards.length ? Math.round(count / cards.length * 100) : 0;
    let rewardPanel;
    if (claimed) {
      const text = claimed === "epic" ? "Permanent +" + (SET_EPIC_REWARD / 1000000).toFixed(2) + "% Epic chance claimed" : claimed === "crown" ? "Permanent +" + (SET_CROWN_REWARD / 1000000).toFixed(2) + "% Crown chance claimed" : claimed === "cash" ? money(set.cashReward) + " completion cash claimed" : "Set badge claimed";
      rewardPanel = '<div class="index-reward-panel claimed"><div><span class="eyebrow">SET REWARD CLAIMED</span><strong>' + text + '</strong></div><span class="claim-status">COMPLETE</span></div>';
    } else {
      const locked = !complete || !state.user;
      const epicDisabled = locked || epicBonus + SET_EPIC_REWARD > SET_EPIC_CAP;
      const crownDisabled =
        locked || crownBonus + SET_CROWN_REWARD > SET_CROWN_CAP;
      const capsFull =
        epicBonus + SET_EPIC_REWARD > SET_EPIC_CAP &&
        crownBonus + SET_CROWN_REWARD > SET_CROWN_CAP;
      const buttons = capsFull
        ? '<button class="button small" data-action="claim-index-reward" data-set="' + set.id + '" data-reward="cash" ' + (locked ? "disabled" : "") + '>Claim ' + money(set.cashReward) + '</button><button class="button small ghost" data-action="claim-index-reward" data-set="' + set.id + '" data-reward="badge" ' + (locked ? "disabled" : "") + '>Claim set badge</button>'
        : '<button class="button small" data-action="claim-index-reward" data-set="' + set.id + '" data-reward="epic" ' + (epicDisabled ? "disabled" : "") + '>Claim +' + (SET_EPIC_REWARD / 1000000).toFixed(2) + '% Epic</button><button class="button small ghost" data-action="claim-index-reward" data-set="' + set.id + '" data-reward="crown" ' + (crownDisabled ? "disabled" : "") + '>Claim +' + (SET_CROWN_REWARD / 1000000).toFixed(2) + '% Crown</button>';
      const prompt = !state.user ? "Sign in to claim this set reward." : complete ? "Set complete — choose one reward." : "Complete the set to unlock these rewards.";
      const copy = capsFull
        ? "Both permanent set caps are full, so this set offers " + money(set.cashReward) + " virtual cash or the set badge. Claiming either completes the set."
        : "Choose a permanent +" + (SET_EPIC_REWARD / 1000000).toFixed(2) + "% Epic chance or +" + (SET_CROWN_REWARD / 1000000).toFixed(2) + "% Crown chance. Four of each can be claimed account-wide.";
      rewardPanel = '<div class="index-reward-panel ' + (complete ? "ready" : "locked") + '"><div class="index-reward-copy"><span class="eyebrow">' + (complete ? "REWARD READY" : "SET REWARD") + '</span><strong>' + prompt + '</strong><small>' + copy + '</small></div><div class="index-reward-actions">' + buttons + '</div></div>';
    }
    const cardTiles = cards.map((card, i) => {
      const found = discovered.has(card.id);
      const art = found
        ? '<img src="' + image(card.image || "/img/leader-placeholder.svg", 360) + '" alt="' + esc(card.name) + '" loading="lazy">'
        : '<span aria-hidden="true">?</span>';
      return '<article class="index-card ' + (found ? "index-found" : "index-mystery") + '" aria-label="' + (found ? esc(card.name + ", " + card.rarity) : "Mystery card " + (i + 1)) + '"><div class="index-card-art">' + art + '</div><small>' + (found ? esc(card.rarity.toUpperCase()) : "UNDISCOVERED") + '</small><h3>' + (found ? esc(card.name) : "Mystery card") + '</h3><p>' + (found ? money(card.value) + " sell value" : "Pull or trade this card to reveal it.") + '</p></article>';
    }).join("");
    return '<section class="index-set panel"><div class="index-set-heading"><div><span class="eyebrow">COLLECTION SET</span><h2>' + esc(set.name) + '</h2><p>' + esc(set.subtitle) + '</p></div><strong>' + count + ' / ' + cards.length + ' discovered</strong></div><div class="index-progress" role="progressbar" aria-label="' + esc(set.name) + ' completion" aria-valuemin="0" aria-valuemax="' + cards.length + '" aria-valuenow="' + count + '"><span style="width:' + pct + '%"></span></div>' + rewardPanel + '<div class="index-grid">' + cardTiles + '</div></section>';
  }).join("");
  const epicText = epicBonus ? "+" + (epicBonus / 1000000).toFixed(2) + "% Epic" : "No Epic set bonus";
  const crownText = crownBonus ? "+" + (crownBonus / 1000000).toFixed(2) + "% Crown · " + chaseNote(crownBonus) : "No Crown set bonus";
  $("#main").innerHTML =
    title("THE CARD ARCHIVE", "Character index.", "Browse every card, track set progress, and see the reward before you complete a set.") +
    '<div class="index-top-actions"><span>' + indexSets.length + " sets · " + new Set(indexSets.flatMap((set) => set.cardIds)).size + ' cards</span><strong>' + (indexSets.filter((set) => !rewards[set.id] && set.cardIds.every((id) => discovered.has(id))).length) + ' rewards ready to claim</strong></div>' +
    '<div class="index-bonus-summary panel"><span class="eyebrow">YOUR PERMANENT SET BONUSES</span><strong>' + epicText + ' chance · ' + crownText + ' chance</strong><small>Caps: +' + (SET_EPIC_CAP / 1000000).toFixed(2) + '% Epic and +' + (SET_CROWN_CAP / 1000000).toFixed(2) + '% Crown — four claims of each. Once both caps are full, a completed set offers virtual cash or the set badge instead. Secret cards stay outside the index.</small></div>' +
    '<nav class="index-filters" aria-label="Filter card index sets">' + familyButtons + '</nav>' +
    (sections || '<div class="panel index-empty"><h2>No sets in this group yet.</h2><p>Choose another collection filter.</p></div>');
}
function collection() {
  const mine = state.inventory;
  let filtered = mine.filter((c) => {
    const t = cardMap[c.template_id];
    return (
      t &&
      (state.rarity === "all" || (c.rarity || t.rarity) === state.rarity) &&
      (state.set === "all" || t.set === state.set) &&
      t.name.toLowerCase().includes(state.search.toLowerCase())
    );
  });
  filtered.sort((a, b) =>
    state.sort === "value" ? Number(b.value) - Number(a.value) : b.id - a.id,
  );
  $("#main").innerHTML =
    title(
      "THE ROYAL ARCHIVES",
      "Your collection.",
      "A kingdom is only as good as its questionable possessions.",
    ) +
    `<div class="stats-row"><div><span>CARDS COLLECTED</span><strong>${mine.length}</strong></div><div><span>COLLECTION VALUE</span><strong>${money(mine.reduce((s, c) => s + Number(c.value), 0))}</strong></div><div><span>UNIQUE TEMPLATES</span><strong>${new Set(mine.map((c) => c.template_id)).size}</strong></div><div><span>SAFELY VAULTED</span><strong>${mine.filter((c) => c.vaulted).length}</strong></div></div><div class="toolbar"><input id="card-search" aria-label="Search cards" placeholder="Search your collection…" value="${esc(state.search)}"><select id="rarity-filter" aria-label="Filter rarity"><option value="all">All rarities</option>${collectionRarities.map((r) => `<option ${state.rarity === r ? "selected" : ""}>${r}</option>`).join("")}</select><select id="set-filter" aria-label="Filter collection">${[
      ["all", "All collections"],
      ["brainrot", "Brainrot"],
      ["royal", "Royal court"],
      ["world", "World leaders"],
      ["uk", "UK collection"],
      ["fortnite", "Fortnite"],
      ["fastfood", "Fast Food"],
      ["alpha", "Mystery Gold"],
    ]
      .map(
        ([v, t]) =>
          `<option value="${v}" ${state.set === v ? "selected" : ""}>${t}</option>`,
      )
      .join(
        "",
      )}</select><select id="sort-filter" aria-label="Sort cards"><option value="recent">Most recent</option><option value="value" ${state.sort === "value" ? "selected" : ""}>Highest value</option></select><button class="button ghost small" data-action="sell-selected" ${state.selected.size ? "" : "disabled"}>Sell selected (${state.selected.size})</button></div>${state.set === "fortnite" ? fortniteCollectionAlbum() : ""}${filtered.length ? `<p class="muted">${filtered.length} cards · Click cards to select for a bulk sale. Duplicates: ${mine.length - new Set(mine.map((c) => c.template_id)).size}</p>      <div class="collection-grid">${filtered.map((row) => gameCard(row, { selectable: !row.vaulted && !row.trade_id && !(state.account?.loadout || []).includes(Number(row.id)), actions: true, owned: true })).join("")}</div>` : empty("collection", state.user ? "Your court is looking a little empty." : "Your collection starts with a crown.", "Open a pack to discover your first cards.", state.user ? "Explore packs" : "Join the court", state.user ? "go-packs" : "auth")}`;
}
function loadoutEffectModal(cardId) {
  const row = state.inventory.find((card) => Number(card.id) === Number(cardId));
  if (!row) return toast("That card is no longer in your collection.");
  const template = cardMap[row.template_id];
  const equippedIds = (state.account?.loadout || []).map(Number);
  const isEquipped = equippedIds.includes(Number(row.id));
  const equippedCards = equippedIds
    .map((id) => state.inventory.find((card) => Number(card.id) === id))
    .filter(Boolean);
  const withoutCard = equippedCards.filter(
    (card) => Number(card.id) !== Number(row.id),
  );
  const current = loadoutPowerup(equippedCards);
  const powerup = cardPowerup(row);
  const previewAtCapacity =
    !isEquipped &&
    equippedCards.length >= Number(state.account?.loadout_slots || 3);
  const before = isEquipped ? loadoutPowerup(withoutCard) : current;
  const after = isEquipped
    ? current
    : previewAtCapacity
      ? current
      : loadoutPowerup([...equippedCards, row]);
  const epicChange = previewAtCapacity
    ? powerup.epicBonus
    : after.epicBonus - before.epicBonus;
  const uncommonChange = previewAtCapacity
    ? powerup.uncommonBonus || 0
    : after.uncommonBonus - before.uncommonBonus;
  const crownChange = previewAtCapacity
    ? powerup.crownBonus || 0
    : after.crownBonus - before.crownBonus;
  const secretChange = previewAtCapacity
    ? (powerup.rarity === "Crown" ? SECRET_CROWN_BONUS : 0) +
      (powerup.secretBonus || 0)
    : after.secretChance - before.secretChance;
  const points = (value) =>
    `${value > 0 ? "+" : ""}${(value / 1000000).toFixed(2)} percentage points`;
  const secretPoints = (value) =>
    `${value > 0 ? "+" : ""}${(value / 10000).toFixed(2)} percentage points`;
  const effects = [];
  if (epicChange)
    effects.push(
      previewAtCapacity
        ? `This card would ${epicChange > 0 ? 'increase' : 'decrease'} Epic odds by ${points(epicChange)} if equipped.`
        : `Epic odds ${epicChange > 0 ? 'increase' : 'decrease'} by ${points(epicChange)}.`,
    );
  else effects.push("This card makes no additional change to Epic odds.");
  if (uncommonChange)
    effects.push(
      previewAtCapacity
        ? `This card would ${uncommonChange > 0 ? 'increase' : 'decrease'} Uncommon odds by ${points(uncommonChange)} if equipped.`
        : `Uncommon odds ${uncommonChange > 0 ? 'increase' : 'decrease'} by ${points(uncommonChange)}.`,
    );
  if (crownChange)
    effects.push(
      previewAtCapacity
        ? `This card would increase Crown odds by ${points(crownChange)} if equipped.`
        : `Crown odds increase by ${points(crownChange)}.`,
    );
  if (secretChange)
    effects.push(
      previewAtCapacity
        ? `This card would add ${secretPoints(secretChange)} to the once-a-day Secret roll if equipped.`
        : `The once-a-day Secret roll gains ${secretPoints(secretChange)}.`,
    );
  if (powerup.everyOtherCard)
    effects.push("Every second card in a pack is guaranteed Uncommon or better.");
  if (powerup.packDiscount)
    effects.push(`Every third pack costs ${powerup.packDiscount}p less.`);
  if (powerup.randomPackDiscount)
    effects.push(`One random pack each day costs ${powerup.randomPackDiscount}% less.`);
  if (
    !epicChange &&
    !uncommonChange &&
    !crownChange &&
    !secretChange &&
    !powerup.everyOtherCard &&
    !powerup.packDiscount &&
    !powerup.randomPackDiscount
  )
    effects.push("This card has no active odds or price effect.");
  const combined = [
    after.uncommonBonus && `Uncommon odds ${points(after.uncommonBonus)}`,
    after.epicBonus && `Epic odds ${points(after.epicBonus)}`,
    after.crownBonus && `Crown odds ${points(after.crownBonus)}`,
    after.secretChance && `Secret chance ${(after.secretChance / 10000).toFixed(2)}% total`,
    after.randomPackDiscount && `${after.randomPackDiscount}% off one random pack daily`,
  ].filter(Boolean).join(" · ") || "No net rarity odds adjustment.";
  showModal(
    `<span class="eyebrow">${isEquipped ? "ACTIVE CARD EFFECT" : "CARD EFFECT PREVIEW"}</span><h2>${esc(template.name)}</h2><p>${esc(powerup.name)} · ${esc(template.rarity)}</p><div class="panel odds-effect-detail"><strong>${effects.map(esc).join(" ")}</strong><p>${esc(combined)}</p><small>Uncommon adjustments shift odds between Common and Uncommon. Positive Epic adjustments shift odds from Common, then Uncommon, into Epic; negative Epic adjustments return odds to Common. Renegade Raider shifts odds into Crown by up to 1.00 percentage point. Loadout adjustments are capped at ±0.40 percentage points for Uncommon, +${(EPIC_SHIFT_CAP / 1000000).toFixed(2)} for Epic and +${(CROWN_SHIFT_CAP / 1000000).toFixed(2)} for Crown. ${secretRollNote()} Kim Jong Un's +2.00% Epic sits outside the cap.</small></div>${previewAtCapacity ? '<p class="muted">Your loadout is full. Unequip a card before adding this one.</p>' : !isEquipped ? '<p class="muted">This preview shows the change if you equip this card.</p>' : ""}`,
    "odds-effect-modal",
  );
}
function loadoutView() {
  if (!state.user) {
    $("#main").innerHTML =
      title(
        "YOUR CARD POWER",
        "Build your card loadout.",
        "Equip cards to shape your pack odds.",
      ) +
      empty(
        "collection",
        "Your loadout awaits.",
        "Sign in to equip cards from your collection.",
        "Join the court",
        "auth",
      );
    return;
  }
  const equipped = state.account?.loadout || [];
  const slotLimit = Number(state.account?.loadout_slots || 3);
  const cards = state.inventory.filter(
    (row) => cardMap[row.template_id] && !row.vaulted && !row.trade_id,
  );
  $("#main").innerHTML =
    title(
      "YOUR CARD POWER",
      "Build your card loadout.",
      "Mix boosts and trade-offs to shape your pack odds. Equipped cards stay yours, but must be unequipped before selling, vaulting, or trading.",
    ) +
    `<div class="loadout-summary panel"><div><span class="eyebrow">ACTIVE POWER</span><h2>${equipped.length} / ${slotLimit} cards equipped</h2><p>Loadout odds shifts are capped at +${(EPIC_SHIFT_CAP / 1000000).toFixed(2)}% Epic, +${(CROWN_SHIFT_CAP / 1000000).toFixed(2)}% Crown and ±0.40% Uncommon. Kim's +2.00% Epic sits outside the cap. Index rewards are permanent and capped at +${(SET_EPIC_CAP / 1000000).toFixed(2)}% Epic / +${(SET_CROWN_CAP / 1000000).toFixed(2)}% Crown. ${secretRollNote()} Secret power-ups can also take 20% off one random pack each day, and frugal cards reduce every third pack by up to 50p.</p></div>${slotLimit < 5 ? `<aside class="slot-upgrade"><span class="eyebrow">EXPAND YOUR STRATEGY</span><strong>Unlock slot ${slotLimit + 1}</strong><small>One-time purchase · ${money(upgradePrices.loadoutSlots[slotLimit + 1])} virtual cash</small><button class="button small" data-action="loadout-upgrade" ${Number(state.account?.balance || 0) < (upgradePrices.loadoutSlots[slotLimit + 1]) ? "disabled" : ""}>${Number(state.account?.balance || 0) < (upgradePrices.loadoutSlots[slotLimit + 1]) ? "Need more virtual cash" : `Unlock slot · ${money(upgradePrices.loadoutSlots[slotLimit + 1])}`}</button></aside>` : '<span class="slot-unlocked">FIVE SLOTS UNLOCKED</span>'}${equipped
      .map((id) =>
        state.inventory.find((card) => Number(card.id) === Number(id)),
      )
      .filter(Boolean)
      .map(
        (row) =>
          `<span class="loadout-chip">${esc(cardMap[row.template_id].name)} · ${esc(cardPowerup(row).name)}</span>`,
      )
      .join(
        "",
      )}</div>${cards.length ? `<div class="collection-grid loadout-grid">${cards.map((row) => gameCard(row, { owned: true, loadoutAction: true })).join("")}</div>` : empty("collection", "No available cards.", "Open a pack to find cards for your loadout.", "Explore packs", "go-packs")}`;
}
function empty(symbol, heading, text, button, action) {
  return `<div class="empty-state">${icon(symbol)}<h2>${heading}</h2><p>${text}</p>${button ? `<button class="button" data-action="${action}">${button} ${icon("arrow")}</button>` : ""}</div>`;
}
function loading() {
  return '<div class="loading-panel"><span></span><span></span><span></span></div>';
}
function countdown(time) {
  const n = Math.max(0, Math.floor((new Date(time) - Date.now()) / 1000));
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
async function potView() {
  const v = renderVersion,
    request = ++viewRequest;
  $("#main").innerHTML =
    title(
      "THE GLOBAL POT",
      "One pot. One monarch.",
      "A bigger stake buys a bigger chance. Even a penny can take the crown.",
    ) + loading();
  try {
    const p = await api("pot");
    if (v !== renderVersion || request !== viewRequest) return;
    const previous = state.pot;
    state.pot = p;
    if (
      previous &&
      Number(previous.round.id) !== Number(p.round.id) &&
      p.history[0]
    ) {
      toast(
        `${p.history[0].username} won ${money(Number(p.history[0].total))} in the global pot!`,
      );
      sound("Crown");
    }
    const total = Number(p.round.total);
    const own = p.entrants.find((e) => e.user_id === state.user?.id);
    $("#main").innerHTML =
      title(
        "THE GLOBAL POT",
        "One pot. One monarch.",
        "A bigger stake buys a bigger chance. Even a penny can take the crown.",
      ) +
      `<div class="pot-layout"><section class="pot-main panel"><span class="live-badge"><i></i> ROUND #${p.round.id}</span><div class="pot-trophy">${icon("pot")}</div><span class="eyebrow">THE ROYAL POT</span><div class="pot-total">${money(total)}</div><span class="muted">Entirely virtual. Entirely up for grabs.</span><div class="countdown" data-countdown="${p.round.ends_at}">${countdown(p.round.ends_at)}</div><span class="eyebrow">UNTIL THE NEXT CORONATION</span><div class="pot-progress"><span style="width:${Math.max(0, 100 - ((new Date(p.round.ends_at) - Date.now()) / 600000) * 100)}%"></span></div><div class="pot-summary"><span>${p.entrants.length} entrants</span><span>Your chance: ${total && own ? ((Number(own.amount) / total) * 100).toFixed(2) : "0"}%</span></div><form id="wager-form"><label for="stake">Your wager (virtual GBP)</label><div class="input-button"><input id="stake" name="stake" type="number" min="0.01" step="0.01" placeholder="0.01" required><button class="button">Take a seat ${icon("arrow")}</button></div></form><small class="muted">Winner takes the full pot. Wagers cannot be cancelled.</small></section><section class="panel entrants"><h2>The court is in session</h2><p class="muted">Every penny is a ticket. If you are the only player, Pot Bot matches your total wager; it sits out when other players join.</p>${p.entrants.length ? p.entrants.map((e) => `<div class="list-row"><span class="avatar">${esc(e.username.slice(0, 1))}</span><div><strong>${esc(e.username)}${e.bot ? " · BOT" : ""}</strong><small>${((Number(e.amount) / total) * 100).toFixed(2)}% chance</small></div><b>${money(Number(e.amount))}</b></div>`).join("") : empty("pot", "An empty throne.", "Be the first to enter this round.", "", "")}</section></div>${p.history[0] ? `<div class="coronation panel">${icon("crown")}<div><span class="eyebrow">THE LATEST CORONATION</span><h2>${esc(p.history[0].username)} takes the throne.</h2><p>${money(Number(p.history[0].total))} in fictional GBP · Round #${p.history[0].id}</p></div></div>` : ""}<section class="panel history"><h2>Recent coronations</h2>${p.history.length ? p.history.map((h) => `<div class="list-row"><span>${icon("crown")} ${esc(h.username)}</span><small>Round #${h.id}</small><b>${money(Number(h.total))}</b></div>`).join("") : '<p class="muted">Completed rounds appear here. No monarch has been crowned yet.</p>'}</section>`;
  } catch (e) {
    if (v === renderVersion && request === viewRequest) errorView(e);
  }
}
const slotSpinOrder = ["coin", "crown", "pot", "face", "bolt"];
const slotStripCells = 20;
const slotCellHtml = (symbol) =>
  `<div class="slot-cell${symbol === "face" ? " slot-cell-face" : ""}" data-slot-symbol="${symbol}">${
    symbol === "face"
      ? `<img src="${image("/img/slot-face.webp", 400)}" alt="" draggable="false">`
      : icon(symbol)
  }</div>`;
const slotBlurStrip = () =>
  Array.from({ length: slotStripCells }, (_, i) => slotCellHtml(slotSpinOrder[i % slotSpinOrder.length])).join("");
const slotLandStrip = (finalSymbol) =>
  Array.from({ length: slotStripCells }, (_, i) =>
    slotCellHtml(i === slotStripCells - 1 ? finalSymbol : slotSpinOrder[(i * 2 + 1) % slotSpinOrder.length]),
  ).join("");
const slotReducedMotion = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches;
const slotStakePence = () => {
  const raw = String($("#slot-stake")?.value ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return NaN;
  return Math.round(Number(raw) * 100);
};
function slotPaytable(bet) {
  const rows = [...slotOutcomes].reverse();
  return rows
    .map(
      (outcome) =>
        `<div class="slot-pay-row${outcome.multiplier >= 25 ? " slot-pay-big" : ""}">${
          outcome.symbol
            ? `<span class="slot-pay-glyph${outcome.symbol === "face" ? " is-face" : ""}">${
                outcome.symbol === "face"
                  ? `<img src="${image("/img/slot-face.webp", 200)}" alt="">`
                  : icon(outcome.symbol)
              }</span>`
            : '<span class="slot-pay-glyph is-miss">–</span>'
        }<span class="slot-pay-label">${esc(outcome.label)}</span><b>${
          outcome.multiplier ? outcome.multiplier + "×" : "—"
        }</b><i>${money(bet * outcome.multiplier)}</i><small>${slotPercent(outcome.weight)}% · 1 in ${(
          slotWeight() / outcome.weight
        ).toLocaleString("en-GB", { maximumFractionDigits: 1 })}</small></div>`,
    )
    .join("");
}
function slotsView() {
  const balance = Number(state.account?.balance || 0);
  const bet = Math.min(Math.max(state.slotBet, slotLimits.minPence), slotLimits.maxPence);
  const maxBet = Math.min(slotLimits.maxPence, balance);
  const presets = [slotLimits.minPence, 2500, 10000, 50000, 100000, 250000, 1000000].filter(
    (amount) => amount <= slotLimits.maxPence && amount !== bet,
  );
  const last = state.slotLast;
  const reels = last ? last.reels : ["coin", "crown", "pot"];
  const stats = state.slotStats;
  const edge = (100 - slotReturnRate() * 100).toFixed(1);
  $("#main").innerHTML =
    title(
      "THE MONARCH PARLOUR",
      "Three in a row.",
      "Choose a stake, pull the lever and watch the reels settle. Every line pays a multiple of your stake.",
    ) +
    `<div class="slots-layout"><section class="panel slot-machine" data-slot-machine><div class="slot-cabinet"><div class="slot-marquee">${icon("crown")}<span>MONARCH SLOTS</span>${icon("crown")}</div><div class="slot-reels">${reels
      .map(
        (symbol, index) =>
          `<div class="slot-reel" data-reel="${index}"><div class="slot-strip">${slotCellHtml(symbol)}</div></div>`,
      )
      .join("")}</div><div class="slot-payline" aria-hidden="true"></div><div class="slot-glare" aria-hidden="true"></div></div><p id="slot-status" class="slot-status" role="status" aria-live="polite">${
      last
        ? last.payout > 0
          ? `${esc(last.outcome.label)} · ${last.outcome.multiplier}× · ${money(last.payout)} credited.`
          : `${esc(last.outcome.label)} · ${money(last.bet)} stake lost.`
        : "Set your stake and pull the lever."
    }</p><div class="slot-stake-row"><label class="slot-stake-label" for="slot-stake"><span>Stake</span><span class="slot-stake-input"><i>£</i><input id="slot-stake" type="number" min="5" max="12000" step="1" inputmode="decimal" value="${(bet / 100).toFixed(2)}"></span></label><div class="slot-stake-side"><div class="slot-presets">${presets
      .map(
        (amount) =>
          `<button type="button" class="button ghost small" data-action="slot-stake" data-amount="${amount}">${money(amount)}</button>`,
      )
      .join("")}<button type="button" class="button ghost small" data-action="slot-stake" data-amount="max">Max ${money(maxBet)}</button></div><p class="fine-print">Minimum ${money(slotLimits.minPence)} · maximum ${money(slotLimits.maxPence)} or your whole balance, whichever is smaller. You hold ${money(balance)}.</p></div></div><div class="slot-win-lines"><span>${slotPercent(slotMissWeight)}% lose the stake</span><span>${slotPercent(
      slotWeight() - slotMissWeight,
    )}% line up a win</span><span>${slotPercent(slotBigWeight)}% pay 10× or more</span></div><button class="button full slot-lever" data-action="slot-spin" ${
      state.user && balance >= bet ? "" : "disabled"
    }>${
      state.user
        ? balance >= bet
          ? `Pull the lever · ${money(bet)} ${icon("spark")}`
          : `Stake more than your ${money(balance)} balance`
        : "Sign in to play"
    }</button><p class="slot-session" data-slot-session>${
      stats.spins
        ? `${stats.spins} spin${stats.spins === 1 ? "" : "s"} this visit · wagered ${money(stats.wagered)} · returned ${money(stats.returned)} · net ${money(stats.returned - stats.wagered)}`
        : "No spins yet this visit."
    }</p></section><aside class="panel slot-side"><div class="spin-heading"><div><span class="eyebrow">PAYTABLE</span><h2>What each line pays</h2><p>Multipliers apply to your current ${money(bet)} stake.</p></div></div><div class="slot-pay-list" data-slot-paytable>${slotPaytable(bet)}</div><div class="slot-edge"><span>House edge</span><strong>${edge}% per spin</strong></div><p class="fine-print">Roughly ${money(slotReturnRate() * 10000)} of every ${money(10000)} staked comes back as an average. The parlour is a slow drain: it is a way to burn or grow a stack quickly, not a living.</p><p class="fine-print">Odds are fixed server-side and rolled with cryptographic randomness on every spin: ${slotOddsNote()}. A win credits your virtual balance in the same transaction that takes the stake. ${slotPercent(slotBigWeight)}% of spins pay 10× or more.</p></aside></div>`;
  if (last) $("[data-slot-machine]").classList.add("has-result");
}
function updateSlotStake() {
  const bet = Number.isSafeInteger(slotStakePence()) ? slotStakePence() : state.slotBet;
  state.slotBet = Math.min(Math.max(bet, slotLimits.minPence), slotLimits.maxPence);
  const table = $("[data-slot-paytable]");
  if (table) table.innerHTML = slotPaytable(state.slotBet);
  const lever = $('[data-action="slot-spin"]');
  const balance = Number(state.account?.balance || 0);
  if (lever) {
    lever.disabled = !state.user || balance < state.slotBet;
    lever.innerHTML = state.user
      ? balance >= state.slotBet
        ? `Pull the lever · ${money(state.slotBet)} ${icon("spark")}`
        : `Stake more than your ${money(balance)} balance`
      : "Sign in to play";
  }
  const note = $(".slot-side h2")?.parentElement?.querySelector("p");
  if (note) note.textContent = `Multipliers apply to your current ${money(state.slotBet)} stake.`;
}
let slotPopTimer = null;
function hideSlotPop() {
  clearTimeout(slotPopTimer);
  $("#slot-pop")?.classList.remove("is-open");
}
// A receipt for the spin, not a second animation to wait through: it pops in
// as soon as the reels settle and is gone inside about a second.
function slotPop(result) {
  const pop = $("#slot-pop");
  if (!pop) return;
  const won = result.payout > 0;
  const big = result.outcome.multiplier >= 10;
  pop.classList.remove("is-open", "is-win", "is-loss", "is-big", "is-jackpot");
  pop.innerHTML = `<div class="slot-pop-inner">${
    won
      ? `<strong>${money(result.payout)}</strong><span>${esc(result.outcome.label)} · ${
          result.outcome.multiplier
        }× stake${big ? " · big win" : ""}</span>`
      : `<strong>${money(result.bet)} gone</strong><span>No line · pull again</span>`
  }</div>`;
  pop.classList.add(won ? "is-win" : "is-loss");
  if (big) pop.classList.add("is-big");
  if (result.outcome.id === "jackpot") pop.classList.add("is-jackpot");
  requestAnimationFrame(() => pop.classList.add("is-open"));
  clearTimeout(slotPopTimer);
  slotPopTimer = setTimeout(
    hideSlotPop,
    slotReducedMotion()
      ? 900
      : result.outcome.id === "jackpot"
        ? 2000
        : big
          ? 1500
          : won
            ? 1000
            : 800,
  );
}
async function slotSpinAction() {
  const machine = $("[data-slot-machine]");
  if (!machine || state.busy) return;
  const raw = slotStakePence();
  if (!Number.isSafeInteger(raw)) {
    toast("Enter a stake in pounds with at most two decimals.");
    return;
  }
  const bet = raw;
  if (bet < slotLimits.minPence || bet > slotLimits.maxPence) {
    toast(`Stakes run from ${money(slotLimits.minPence)} to ${money(slotLimits.maxPence)}.`);
    return;
  }
  if (bet > Number(state.account?.balance || 0)) {
    toast("That stake is bigger than your virtual balance.");
    return;
  }
  state.busy = true;
  state.slotBet = bet;
  hideSlotPop();
  // Keeps the reels under the receipt that lands on them a second later.
  machine.scrollIntoView({
    block: "center",
    behavior: slotReducedMotion() ? "auto" : "smooth",
  });
  const lever = $('[data-action="slot-spin"]');
  if (lever) lever.disabled = true;
  const status = $("#slot-status");
  const reduced = slotReducedMotion();
  const reels = Array.from(machine.querySelectorAll(".slot-reel"));
  machine.classList.add("is-spinning");
  machine.classList.remove("is-jackpot", "is-big");
  if (!reduced) {
    machine.classList.remove("has-result");
    reels.forEach((reel) => {
      reel.classList.add("spinning");
      const strip = reel.querySelector(".slot-strip");
      strip.style.transition = "";
      strip.style.transform = "";
      strip.innerHTML = slotBlurStrip();
    });
  }
  try {
    const result = await api("slots", { bet });
    state.account = result.account;
    $("#wallet-value").textContent = money(Number(result.account.balance));
    state.slotLast = result;
    state.slotStats.spins += 1;
    state.slotStats.wagered += result.bet;
    state.slotStats.returned += result.payout;
    const big = result.outcome.multiplier >= 10;
    if (!reduced) {
      const cellHeight = reels[0].clientHeight;
      const settle = (reel, symbol, delay) =>
        new Promise((resolve) => {
          setTimeout(() => {
            const strip = reel.querySelector(".slot-strip");
            reel.classList.remove("spinning");
            strip.innerHTML = slotLandStrip(symbol);
            strip.style.transition = "none";
            strip.style.transform = "translateY(0)";
            strip.getBoundingClientRect();
            strip.style.transition = `transform ${big ? 1.45 : 1.05}s cubic-bezier(.22,.84,.28,1.06)`;
            strip.style.transform = `translateY(-${(slotStripCells - 1) * cellHeight}px)`;
            setTimeout(resolve, big ? 1500 : 1100);
          }, delay);
        });
      for (let index = 0; index < reels.length; index++) {
        await settle(reels[index], result.reels[index], index * 200);
      }
    } else {
      reels.forEach((reel, index) => {
        reel.querySelector(".slot-strip").innerHTML = slotCellHtml(result.reels[index]);
      });
    }
    machine.classList.remove("is-spinning");
    if (status) {
      status.textContent =
        result.payout > 0
          ? `${result.outcome.label} · ${result.outcome.multiplier}× · ${money(result.payout)} credited.`
          : `${result.outcome.label} · ${money(result.bet)} stake lost.`;
      status.classList.toggle("is-win", result.payout > 0);
      status.classList.toggle("is-jackpot", result.outcome.id === "jackpot");
    }
    machine.classList.toggle("is-jackpot", result.outcome.id === "jackpot");
    machine.classList.toggle("is-big", big && result.outcome.id !== "jackpot");
    const session = $("[data-slot-session]");
    if (session)
      session.textContent = `${state.slotStats.spins} spin${
        state.slotStats.spins === 1 ? "" : "s"
      } this visit · wagered ${money(state.slotStats.wagered)} · returned ${money(
        state.slotStats.returned,
      )} · net ${money(state.slotStats.returned - state.slotStats.wagered)}`;
    sound(result.outcome.id === "jackpot" || result.outcome.id === "triple" ? "Mythic" : big ? "Crown" : result.payout ? "Epic" : "Common");
    slotPop(result);
  } catch (e) {
    machine.classList.remove("is-spinning");
    reels.forEach((reel) => {
      reel.classList.remove("spinning");
      reel.querySelector(".slot-strip").innerHTML = slotCellHtml("crown");
    });
    if (status) status.textContent = e.message;
    toast(e.message);
  } finally {
    state.busy = false;
    updateSlotStake();
  }
}
function rewardsView() {
  const a = state.account;
  const earned =
    a?.reward_day === new Date().toISOString().slice(0, 10)
      ? a.daily_reward
      : 0;
  const steps =
    a?.reward_day === new Date().toISOString().slice(0, 10)
      ? a.reward_steps || 0
      : 0;
  const seconds =
    a?.reward_day === new Date().toISOString().slice(0, 10)
      ? a.active_seconds
      : 0;
  const nextReward = Math.min(
    playReward.firstPence + steps * playReward.increasePence,
    playReward.dailyCap - earned,
  );
  const rewardSteps = [];
  for (let step = 0, total = 0; total < playReward.dailyCap; step++) {
    const reward = Math.min(
      playReward.firstPence + step * playReward.increasePence,
      playReward.dailyCap - total,
    );
    rewardSteps.push(reward);
    total += reward;
  }
  $("#main").innerHTML =
    title(
      "A LITTLE ROYAL ALLOWANCE",
      "Good things come to players.",
      "Keep playing. The treasury picks up the tab.",
    ) +
    `<div class="rewards-layout"><section class="panel reward-card">${icon("rewards", "reward-icon")}<span class="eyebrow">YOUR DAILY PLAY REWARD</span><h2>${earned >= playReward.dailyCap ? "Allowance complete" : money(nextReward)} <span>${earned >= playReward.dailyCap ? "for today" : "next · every 10 active minutes"}</span></h2><p>Your reward grows by ${money(playReward.increasePence)} each time you reach another 10 minutes, up to ${money(playReward.dailyCap)} per day.</p><div class="reward-track">${rewardSteps.map((amount, i) => `<span class="${steps > i ? "claimed" : ""}">${steps > i ? icon("check") : icon("coin")}<small>${money(amount)}</small></span>`).join("")}</div><div class="pot-progress"><span style="width:${Math.min(100, (seconds / playReward.intervalSeconds) * 100)}%"></span></div><div class="pot-summary"><span>${Math.floor(seconds / 60)} / 10 active minutes</span><span>${money(earned)} / ${money(playReward.dailyCap)} today</span></div><p class="muted">${earned >= playReward.dailyCap ? `Today’s ${money(playReward.dailyCap)} allowance is complete. Come back after midnight UTC.` : `Next reward: ${money(nextReward)}. Rewards land automatically; keep this tab visible and interact to count active time.`}</p>${!state.user ? '<button class="button" data-action="auth">Start earning ' + icon("arrow") + "</button>" : ""}</section><section class="panel starter-reward"><span class="eyebrow">A GIFT FOR EVERY PLAYER</span><h2>Your free starter pack</h2><p>Every account, new or existing, gets one claim for a single random card from the Brainrot, Royalty, or World Leaders collections. It’s ${starterOdds[0] / 1000000}% likely to be Common, with a chance at something rarer.</p><p class="fine-print">One card per account · once opened, it cannot be claimed again · no charge.</p>${!state.user ? `<button class="button" data-action="auth">Sign in to claim ${icon("arrow")}</button>` : a?.starter_claimed ? '<button class="button ghost" disabled>Starter pack opened</button>' : '<button class="button" data-action="claim-starter">Open your free starter pack ' + icon("arrow") + "</button>"}</section><section class="panel"><span class="eyebrow">YOUR FIRST ROYAL DECREE</span><h2>A £5.00 welcome.</h2><p>Every new account gets £5.00 of virtual cash. Enough to open two Brainrot Packs, with £1.00 left to build your balance.</p><div class="welcome-amount">£5<span>.00</span></div><button class="button ghost" data-action="${state.user ? "go-packs" : "auth"}">${state.user ? "Browse packs" : "Claim your welcome bonus"} ${icon("arrow")}</button><div class="fine-print">${icon("info")} Virtual currency only. Resets and daily limits use UTC. Background tabs earn nothing.</div></section></div>`;
  $(".starter-reward h2").insertAdjacentHTML(
    "afterend",
    `<div class="starter-pack-preview">${packArt(starterPackArt)}</div>`,
  );
  const starterButton = $('[data-action="claim-starter"]');
  if (starterButton)
    starterButton.innerHTML = `Open Starter Pack ${icon("arrow")}`;
  const day = todayKey();
  const questState = normalizeQuestState(a?.quest_state, day);
  const readyQuests = claimableQuests(a?.quest_state, day);
  const questRows = dailyQuests
    .map((quest) => {
      const progress = Math.min(
        quest.target,
        questState.progress[quest.metric] || 0,
      );
      const complete = progress >= quest.target;
      const claimed = questState.claimed.includes(quest.id);
      const percent = Math.min(100, (progress / quest.target) * 100);
      return `<li class="quest-row ${complete ? "complete" : ""} ${claimed ? "claimed" : ""}"><div class="quest-copy"><strong>${esc(quest.title)}</strong><span>${esc(quest.text)}</span><div class="quest-progress" role="progressbar" aria-valuemin="0" aria-valuemax="${quest.target}" aria-valuenow="${progress}" aria-label="${esc(quest.title)} progress"><span style="width:${percent}%"></span></div><small>${progress} / ${quest.target}</small></div><div class="quest-reward">${
        claimed
          ? `<span class="quest-status">${icon("check")} Claimed</span>`
          : complete && state.user
            ? `<button class="button small" data-action="claim-quest" data-quest="${quest.id}">Claim ${money(quest.reward)}</button>`
            : complete
              ? '<button class="button small ghost" data-action="auth">Sign in to claim</button>'
              : `<span class="quest-amount">${money(quest.reward)}</span>`
      }</div></li>`;
    })
    .join("");
  const questMarkup = `<section class="panel daily-quests"><div class="spin-heading"><div><span class="eyebrow">DAILY DECREES</span><h2>Quests for today</h2><p>${dailyQuests.length} small tasks · ${money(dailyQuests.reduce((total, quest) => total + quest.reward, 0))} total. Claim each reward before midnight UTC.</p></div><span class="spin-daily-badge">${icon("spark")} ${state.user ? `${readyQuests.length} READY` : "SIGN IN TO TRACK"}</span></div><ul class="quest-list">${questRows}</ul><p class="fine-print">Virtual cash rewards. Quest progress resets each UTC day; unclaimed rewards do not carry over.</p></section>`;
  const spunToday = a?.spin_day === new Date().toISOString().slice(0, 10);
  const spinPrizeRows = [
    {
      id: "no-prize",
      label: "No prize",
      reward: 0,
      weight: dailySpinSegments
        .filter((segment) => !segment.reward)
        .reduce((sum, segment) => sum + segment.weight, 0),
    },
    ...dailySpinSegments.filter((segment) => segment.reward),
  ];
  const silver = silverPrize();
  $(".rewards-layout").insertAdjacentHTML(
    "beforeend",
    `${questMarkup}<section class="panel daily-spin"><div class="spin-heading"><div><span class="eyebrow">A LITTLE DAILY LUCK</span><h2>Your daily spin</h2><p>One free spin each day. Give the wheel a turn and see what the treasury has in store.</p></div><span class="spin-daily-badge">${icon("spark")} ONCE A DAY</span></div><div class="spin-content"><div class="spin-wheel-column">${dailySpinWheel()}<p id="spin-status" class="spin-result" aria-live="polite"></p></div><div class="spin-prize-panel"><div class="spin-jackpot"><span>THE SILVER JACKPOT</span><strong>${esc(silver.label)}</strong><small>${spinPercent(silver.weight)}% · 1 in ${(spinWeight() / silver.weight).toLocaleString()} spins · ${money(silver.reward)} virtual cash</small></div><div class="spin-prizes">${spinPrizeRows.map((segment) => `<div class="spin-prize-row ${segment.id === "no-prize" ? "no-prize" : ""} ${segment.id === "silver" ? "silver-prize" : ""}"><i aria-hidden="true"></i><span>${esc(segment.label)}</span><b>${segment.reward ? money(segment.reward) : "Try again"}</b><small>${spinPercent(segment.weight)}%</small></div>`).join("")}</div>${!state.user ? '<button class="button full" data-action="auth">Sign in to spin ' + icon("arrow") + "</button>" : spunToday ? `<button class="button ghost full" disabled>Come back tomorrow</button><p class="spin-result" role="status">${Number(a.spin_reward) ? `Today’s spin paid ${money(Number(a.spin_reward))}.` : "No prize this time. Your next spin is available tomorrow."}</p>` : '<button class="button full" data-action="spin-wheel">Spin for today’s prize ' + icon("spark") + "</button>"}<p class="fine-print">Virtual GBP only. One spin per account per UTC day. Odds shown; no purchase required.</p></div></div></section>`,
  );
}
function dailySpinWheel() {
  let angle = -90;
  const silver = silverPrize();
  const missWeight = dailySpinSegments.filter((segment) => !segment.reward).reduce((total, segment) => total + segment.weight, 0);
  const sectors = dailySpinSegments
    .map((segment) => {
      const sweep = (segment.weight / spinWeight()) * 360;
      const start = angle;
      const end = angle + sweep;
      const point = (degrees, radius) => {
        const radians = (degrees * Math.PI) / 180;
        return [
          110 + Math.cos(radians) * radius,
          110 + Math.sin(radians) * radius,
        ];
      };
      const [x1, y1] = point(start, 104);
      const [x2, y2] = point(end, 104);
      const [tx, ty] = point((start + end) / 2, 67);
      const large = sweep > 180 ? 1 : 0;
      const missIndex = ["miss-a", "miss-b", "miss-c"].indexOf(segment.id);
      const color =
        segment.id === "silver"
          ? "#dfe5ef"
          : segment.reward
            ? segment.reward >= 500
              ? "#c49b53"
              : "#427d69"
            : ["#3b4050", "#4b5060", "#303544"][missIndex];
      const textColor = segment.id === "silver" ? "#18202a" : "#fff5dc";
      angle = end;
      return `<path d="M 110 110 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 104 104 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${color}" stroke="#181b24" stroke-width="2"/>${sweep >= 20 ? `<text x="${tx.toFixed(2)}" y="${ty.toFixed(2)}" fill="${textColor}" transform="rotate(${((start + end) / 2 + 90).toFixed(2)} ${tx.toFixed(2)} ${ty.toFixed(2)})">${esc(segment.label.toUpperCase())}</text>` : ""}`;
    })
    .join("");
  return `<div class="spin-wheel-wrap"><span class="spin-pointer" aria-hidden="true"></span><svg class="spin-wheel" data-wheel viewBox="0 0 220 220" role="img" aria-label="Daily prize wheel: ${spinPercent(missWeight)} percent no prize, ${spinPercent(spinWeight() - missWeight)} percent virtual cash payout. Silver jackpot ${esc(silver.label)}: ${spinPercent(silver.weight)} percent chance to win ${money(silver.reward)} virtual cash"><circle cx="110" cy="110" r="108" fill="#13161e" stroke="#e2ca8e" stroke-width="3"/>${sectors}<circle cx="110" cy="110" r="25" fill="#171a22" stroke="#e2ca8e" stroke-width="3"/><text class="spin-wheel-center" x="110" y="114">SPIN</text></svg></div>`;
}
async function friendsView() {
  const v = renderVersion,
    request = ++viewRequest;
  $("#main").innerHTML = title(
    "YOUR INNER CIRCLE",
    "Build your royal court.",
    "Good friends. Questionable trades. Perfectly friendly wagers.",
  );
  if (!state.user) {
    $("#main").innerHTML += empty(
      "friends",
      "Every monarch needs a court.",
      "Sign in to add friends, trade cards, and create private tables.",
      "Join the court",
      "auth",
    );
    return;
  }
  $("#main").innerHTML += loading();
  try {
    const data = await api("friends");
    if (v !== renderVersion || request !== viewRequest) return;
    state.friends = data;
    const giftLimit = Number(data.giftLimit || 10);
    const giftLeft = Math.max(0, Number(data.giftLeft ?? giftLimit));
    const giftSection = `<section class="panel gift-panel"><div class="section-heading"><h2>Send a gift</h2><span class="gift-quota">${giftLeft} of ${giftLimit} left today</span></div><p class="muted">Friends only. 1p–£100 per gift, paid from your virtual balance. Up to ${giftLimit} gifts each UTC day.</p>${data.friends.length ? `<form id="gift-form"><label>Friend<select name="friend">${data.friends.map((f) => `<option value="${esc(f.id)}">${esc(f.username)}</option>`).join("")}</select></label><label>Amount (virtual GBP)<input id="gift-amount" name="amount" type="number" min="0.01" max="100" step="0.01" inputmode="decimal" placeholder="5.00" required></label><div class="gift-presets">${[100, 500, 1000, 2500].map((p) => `<button type="button" class="button ghost small" data-action="gift-amount" data-amount="${p}">${money(p)}</button>`).join("")}</div><button class="button full" ${giftLeft > 0 ? "" : "disabled"}>${giftLeft > 0 ? `Send gift ${icon("arrow")}` : "Gift limit reached"}</button><p class="form-error" role="alert"></p></form>` : '<p class="muted">Add a friend first, then you can send them virtual cash.</p>'}</section>`;
    $("#main").innerHTML =
      title(
        "YOUR INNER CIRCLE",
        "Build your royal court.",
        "Good friends. Questionable trades. Perfectly friendly wagers.",
      ) +
      `<div class="friend-code panel"><div><span class="eyebrow">YOUR FRIEND CODE</span><strong>${esc(state.account.friend_code)}</strong><small>Share this code with your friends.</small></div><button class="button ghost small" data-action="copy-code">Copy code</button><form id="add-friend" class="input-button"><input name="code" aria-label="Friend code" placeholder="Enter a friend’s code" minlength="6" maxlength="6" required><button class="button">Add friend ${icon("arrow")}</button></form></div><div class="friends-layout"><section class="panel"><h2>Your court <span class="count">${data.friends.length}</span></h2>${data.friends.length ? data.friends.map((f) => `<div class="list-row friend-row"><span class="avatar">${esc(f.username[0])}</span><div><strong>${esc(f.username)}</strong><small>${esc(f.friend_code)}</small></div><button class="text-button" data-action="trade-create" data-id="${esc(f.id)}">Trade ${icon("arrow")}</button><button class="icon-button" data-action="unfriend" data-id="${esc(f.id)}" aria-label="Unfriend ${esc(f.username)}">${icon("close")}</button></div>`).join("") : empty("friends", "No friends. Yet.", "Swap codes and bring your friends into the court.", "", "")}</section><section class="panel"><h2>Private tables</h2><p class="muted">Five minutes. Two friends. Matched stakes. Winner takes 2×.</p><div class="table-controls"><button class="button ghost small" data-action="table-create">Create a table</button><form id="join-table" class="input-button"><input aria-label="Table join code" name="code" placeholder="Join code" required maxlength="6"><button class="button small">Join</button></form></div>${data.tables.map((t) => `<div class="list-row"><div><strong>${esc(t.code)} · ${money(Number(t.stake))}</strong><small>${esc(t.host_name)} ${t.guest_name ? "vs " + esc(t.guest_name) : "· waiting for a friend"}</small></div><span>${t.settled ? (t.winner_id ? (t.winner_id === state.account.id ? "You won!" : "Round complete") : "Expired · refunded") : `<span data-countdown="${t.ends_at}">${countdown(t.ends_at)}</span>`}</span></div>`).join("")}</section></div>${giftSection}<section class="panel history"><div class="section-heading"><h2>The trading floor</h2><button class="text-button" data-action="refresh">Refresh ${icon("arrow")}</button></div><p class="muted">Offered cards are reserved. Updating an offer resets both confirmations. Both players must confirm.</p>${data.trades.length ? data.trades.map((t) => `<div class="list-row"><div><strong>${esc(t.name_a)} ↔ ${esc(t.name_b)}</strong><small>${t.offer_a.length} cards for ${t.offer_b.length} cards · ${esc(t.status)}</small></div>${t.status === "open" ? `<button class="button ghost small" data-action="trade-open" data-id="${t.id}">Open trade</button>` : icon("check")}</div>`).join("") : '<p class="muted">Start a trade from your friends list.</p>'}</section>`;
  } catch (e) {
    if (v === renderVersion && request === viewRequest) errorView(e);
  }
}
async function leaderboardView() {
  const v = renderVersion,
    request = ++viewRequest;
  $("#main").innerHTML =
    title(
      "LONG LIVE THE LEADERBOARD",
      "A very public flex.",
      "The richest, the luckiest, and the royally obsessed.",
    ) +
    `<div class="board-tabs">${[
      ["wealth", "Richest monarchs"],
      ["seller", "Heaviest sellers"],
      ["packs", "Packs opened"],
      ["cards", "Cards pulled"],
      ["alpha", "Alpha collectors"],
    ]
      .map(
        ([id, label]) =>
          `<button class="filter-button ${state.board === id ? "active" : ""}" data-action="board" data-id="${id}">${label}</button>`,
      )
      .join(
        "",
      )}<button class="text-button" data-action="refresh">Refresh ${icon("arrow")}</button></div><div id="ranking">${loading()}</div>`;
  try {
    const rows = await api("leaderboards?board=" + state.board);
    if (v !== renderVersion || request !== viewRequest) return;
    const own = rows.findIndex((r) => r.id === state.user?.id);
    const score = (r) =>
      ["wealth", "seller"].includes(state.board)
        ? money(Number(r.score))
        : Number(r.score).toLocaleString();
    $("#ranking").innerHTML =
      `${own >= 0 ? `<div class="pinned-rank panel">${icon("crown")} Your rank <strong>#${rows[own].rank || own + 1}</strong><span>${esc(rows[own].username)}</span><b>${score(rows[own])}</b></div>` : ""}<section class="panel">${rows.length ? `<div class="ranking-row ranking-header"><span>RANK</span><span>MONARCH</span><span>${state.board === "wealth" ? "CASH + COLLECTION" : "TOTAL"}</span></div>${rows.map((r, i) => `<div class="ranking-row ${r.id === state.user?.id ? "is-you" : ""}"><span class="rank-number">${i < 3 ? icon("crown") : ""} ${r.rank || i + 1}</span><strong>${esc(r.username)} ${r.id === state.user?.id ? "<small>YOU</small>" : ""}</strong><b>${score(r)}</b></div>`).join("")}` : empty("leaderboards", "An unclaimed throne.", "Create an account and start your climb.", "Join the court", "auth")}</section>`;
  } catch (e) {
    if (v === renderVersion && request === viewRequest) errorView(e);
  }
}
async function profileView() {
  const version = renderVersion,
    request = ++viewRequest;
  if (!state.user) {
    $("#main").innerHTML =
      title(
        "YOUR ROYAL RECORD",
        "A kingdom of your own.",
        "Join the court to build your collection and track your virtual cash.",
      ) +
      empty(
        "crown",
        "Your throne awaits.",
        "Create an account to receive your £5 welcome bonus.",
        "Join the court",
        "auth",
      );
    return;
  }
  $("#main").innerHTML =
    title(
      "YOUR ROYAL RECORD",
      esc(state.account?.username || "Monarch"),
      "Every penny accounted for. Every questionable decision, documented.",
    ) + loading();
  try {
    const rows = await api("ledger");
    if (version !== renderVersion || request !== viewRequest) return;
    $("#main").innerHTML =
      title(
        "YOUR ROYAL RECORD",
        esc(state.account.username),
        "Every penny accounted for. Every questionable decision, documented.",
      ) +
      `<div class="stats-row"><div><span>VIRTUAL BALANCE</span><strong>${money(state.account.balance)}</strong></div><div><span>PACKS OPENED</span><strong>${state.account.packs}</strong></div><div><span>ALL-TIME SALES</span><strong>${money(state.account.sold)}</strong></div><div><span>FRIEND CODE</span><strong>${esc(state.account.friend_code)}</strong></div></div><div class="section-heading"><h2>Your accounting ledger</h2><button class="button ghost small" data-action="logout">Sign out</button></div><section class="panel ledger">${rows.map((r) => `<div class="list-row"><div><strong>${esc(r.reason)}</strong><small>${new Date(r.created_at).toLocaleString("en-GB")}</small></div><b class="${Number(r.amount) > 0 ? "positive" : "negative"}">${Number(r.amount) > 0 ? "+" : ""}${money(Number(r.amount))}</b><span>Balance ${money(Number(r.balance))}</span></div>`).join("")}</section>`;
  } catch (e) {
    if (version === renderVersion && request === viewRequest) errorView(e);
  }
}
function errorView(e) {
  $("#main").innerHTML +=
    `<div class="error-box" role="alert">${esc(e.message)} <button class="text-button" data-action="refresh">Try again</button></div>`;
  $(".loading-panel")?.remove();
}
function upgradesView() {
  const slots = Math.max(1, Math.min(3, Number(state.account?.pack_slots || 1)));
  const balance = Number(state.account?.balance || 0);
  const upgrade = (target, price) => slots >= target
    ? '<span class="slot-unlocked">' + target + '-PACK OPENINGS UNLOCKED</span>'
    : '<article class="panel upgrade-card"><span class="eyebrow">PACK OPENING UPGRADE</span><h2>Open up to ' + target + ' packs</h2><p>Choose several copies of one pack and open them together.</p><strong>' + money(price) + ' virtual cash · one time</strong><button class="button" data-action="pack-opening-upgrade" data-slots="' + target + '" ' + (balance < price || slots < target - 1 ? 'disabled' : '') + '>' + (slots < target - 1 ? 'Unlock the previous step first' : balance < price ? 'Need more virtual cash' : 'Unlock · ' + money(price)) + '</button></article>';
  const loadoutSlots = Math.max(3, Math.min(5, Number(state.account?.loadout_slots || 3)));
  const loadoutUpgrade = (target, price) => loadoutSlots >= target ? '<span class="slot-unlocked">' + target + '-CARD LOADOUT UNLOCKED</span>' : '<article class="panel upgrade-card"><span class="eyebrow">LOADOUT UPGRADE</span><h2>Equip ' + target + ' cards</h2><p>Add another owned card power to your pack odds.</p><strong>' + money(price) + ' virtual cash · one time</strong><button class="button" data-action="loadout-upgrade" ' + (balance < price || loadoutSlots < target - 1 ? 'disabled' : '') + '>' + (loadoutSlots < target - 1 ? 'Unlock the previous step first' : balance < price ? 'Need more virtual cash' : 'Unlock · ' + money(price)) + '</button></article>';
  $('#main').innerHTML = title('MAKE IT A BIGGER OPENING', 'Game upgrades.', 'Unlock batch openings and loadout slots one step at a time.') + '<div class="upgrades-grid">' + upgrade(2, upgradePrices.packSlots[2]) + upgrade(3, upgradePrices.packSlots[3]) + loadoutUpgrade(4, upgradePrices.loadoutSlots[4]) + loadoutUpgrade(5, upgradePrices.loadoutSlots[5]) + `</div><p class="fine-print">Pack openings: ${money(upgradePrices.packSlots[2])} then ${money(upgradePrices.packSlots[3])}. Loadout slots: ${money(upgradePrices.loadoutSlots[4])} then ${money(upgradePrices.loadoutSlots[5])}. Buy each previous step first. Prices are fictional GBP.</p>`;
}
function render() {
  renderVersion++;
  if (state.view !== "slots") hideSlotPop();
  shell();
  (
    ({
      packs: shop,
      collection,
      index: indexView,
      loadout: loadoutView,
      upgrades: upgradesView,
      rewards: rewardsView,
      slots: slotsView,
      pot: potView,
      friends: friendsView,
      leaderboards: leaderboardView,
      profile: profileView,
      codex: codexView,
      uk: ukView,
    })[state.view] || shop
  )();
}
function navigate(view) {
  if (location.hash === "#" + view) {
    state.view = view;
    render();
  } else location.hash = view;
}
window.addEventListener("hashchange", () => {
  const v = location.hash.slice(1);
  if ([...tabs, "profile", "codex"].includes(v)) {
    state.view = v;
    state.selected.clear();
    render();
    if (
      state.user &&
      ["collection", "index", "loadout", "upgrades", "profile", "friends", "slots"].includes(v)
    )
      sync()
        .then(() => {
          if (state.view === v) render();
        })
        .catch((e) => toast(e.message));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});
function authModal(mode = "signup") {
  showModal(
    `<div class="auth-heading">${icon("crown")}<span class="eyebrow">YOUR KINGDOM AWAITS</span><h2>${mode === "signup" ? "Join the court." : "Welcome back, monarch."}</h2><p>${mode === "signup" ? "Your first £5.00 of virtual cash is on us." : "Your collection missed you. Probably."}</p></div><button class="button google full" data-action="google" disabled><span class="google-g">G</span> Continue with Google</button><p id="oauth-note" class="fine-print" role="status"></p><p class="fine-print">Just a game. All money is fictional virtual GBP. No purchases, deposits, or withdrawals.</p>`,
    "auth-modal",
  );
  getProviders()
    .then((settings) => {
      if (!modal.open) return;
      const btn = $("[data-action=google]", modal);
      if (btn) btn.disabled = !settings.google;
      if (btn && !settings.google) {
        $("#oauth-note").textContent =
          "Google sign-in is not configured on this site yet.";
        btn.disabled = true;
      }
    })
    .catch(() => {});
}
function firstUsernameModal() {
  showModal(
    `<span class="eyebrow">WELCOME TO THE COURT</span><h2>Choose your public username</h2><p>This is the name other players will see in the app. Choose a unique name you’re happy to use.</p><form id="username-form"><label for="username-input">Your username</label><input id="username-input" name="username" minlength="3" maxlength="24" pattern="[A-Za-z0-9_ -]+" autocomplete="nickname" placeholder="3–24 letters, numbers, spaces, _ or -" required autofocus><p class="form-error" role="alert"></p><button class="button full">Save username & continue ${icon("arrow")}</button></form>`,
    "settings-modal username-required-modal",
  );
  $("#username-input")?.focus();
}
function settingsModal() {
  if (!state.account) {
    toast("Your account is still loading. Please try again.");
    return;
  }
  showModal(
    `<span class="eyebrow">YOUR COURT, YOUR CALL</span><h2>Account settings</h2><p>Choose the username other players see. It must be unique.</p><form id="username-form"><label for="username-input">Username</label><input id="username-input" name="username" value="${esc(state.account.username)}" minlength="3" maxlength="24" pattern="[A-Za-z0-9_ -]+" autocomplete="nickname" required><p class="form-error" role="alert"></p><button class="button full">Save username ${icon("arrow")}</button></form><div class="settings-divider"></div><section class="panel patch-notes"><span class="eyebrow">LATEST UPDATE · 29 OCTOBER 2026</span><h3>The slot room &amp; a fairer coin flip</h3><ul><li><strong>New: Slots.</strong> Choose any stake from ${money(slotLimits.minPence)} to ${money(slotLimits.maxPence)} and pull the lever on three reels. You lose the stake 60% of the time and line up a win the other 40%, from 2× up to the 100× Monarch jackpot that lands the face on all three reels. Every win pays a whole multiple of your stake, so a ${money(slotLimits.minPence)} spin tops out at ${money(slotLimits.minPence * 100)} — small stakes never mint millions. The server rolls, the ledger pays, and reduced-motion settles the reels straight to their symbols.</li><li><strong>Every pack rebalanced</strong> to roughly fifty-fifty: 44.3%–52.7% of openings now recover their price, and losses bite — 21.8%–53.6% of openings return less than 75% of the price you paid. Returns of 2×–10× land in 11.3%–30.9% of openings.</li><li><strong>The Apex Alpha Pack is now ${money(15000)}</strong> for five cards with 30% Crown and 0.5% Alpha odds. That repricing is what finally lets the pack lose heavily while keeping its Crown guarantee.</li><li><strong>Rarity ladders are honest now:</strong> no pack makes a rarer tier more likely than a cheaper one, and each collection's values were re-laddered so commons are dust, mid tiers sit near the pack price and Crowns carry the wins.</li><li><strong>Payday cards pay properly:</strong> each one is worth about 2.1× its pack price, so a 1-in-25 Payday hit usually lands the 2×–5× band on its own.</li><li><strong>Buffs rebalanced on every card:</strong> Epic cards are now a real loadout tier (+0.32% to +0.40% Epic each, so five reach +2.00% of the +2.50% cap), Uncommons nudge Uncommon odds by up to +0.80%, and every Chase keeps an all-positive boost. The UK Secret moved up to the Vault power tier.</li><li>${ordinaryPullNote}</li></ul></section><section class="panel patch-notes"><span class="eyebrow">EARLIER UPDATE · 28 OCTOBER 2026</span><h3>UK icons & stronger ordinary pulls</h3><ul><li>${ordinaryPullNote}</li><li>The UK collection brings 40 celebrities and 30 locations, including the £6,000 Paul McCartney Chase. Each £600 pack contains five cards. Free Palestine is a separate £8,000 Secret; special trophies are excluded from the 70 core cards.</li><li>Windfall remains a separate ${100 * WINDFALL_CHANCE / WINDFALL_ROLL_SCALE}% per-pack roll for a trophy worth 5.5× the listed price. It only replaces a cheaper ordinary card and never removes an Alpha, Chase, Mythic or Secret.</li><li>${secretRollNote()}</li><li>Play rewards grow from ${money(playReward.firstPence)} in ${money(playReward.increasePence)} steps every 10 active minutes, up to ${money(playReward.dailyCap)} daily. Daily quests offer ${money(dailyQuests.reduce((total, quest) => total + quest.reward, 0))} total. The free spin has ${spinPercent(dailySpinSegments.filter((segment) => !segment.reward).reduce((total, segment) => total + segment.weight, 0))}% no-prize odds and a ${money(silverPrize().reward)} jackpot at ${spinPercent(silverPrize().weight)}%.</li></ul></section><section class="panel patch-notes"><span class="eyebrow">EARLIER UPDATE · 28 OCTOBER 2026</span><h3>The payday pull</h3><ul><li>Some packs carry a separate Payday roll, replacing a lower-value eligible card. Current card values and per-pack chances are disclosed in Know your odds.</li></ul></section><section class="panel patch-notes"><span class="eyebrow">EARLIER UPDATE · 28 OCTOBER 2026</span><h3>The comeback promise & a luckier Brainrot</h3><ul><li>Lose money on three packs in a row and your next pack contains no Common cards: every card is Uncommon or better. The promise is spent when that pack opens, a losing comeback pack still counts as the first loss of your next streak, and every pack type counts toward the same streak.</li><li>Friends can now send virtual cash from the Friends tab: 1p–£100 per gift, up to 10 gifts per UTC day, straight from your balance.</li><li>Secret cards sit outside the Card Index. Their daily eligibility and current chances are disclosed in Know your odds.</li><li>Secret cards carry new power-ups: up to 20% off one random pack each day, bonus Secret chance, Epic/Crown shifts and a 50p recurring pack discount.</li><li>Claim completed daily quests from Rewards; rewards and limits come from the shared game rules.</li><li>Current ordinary odds and separate special chances are shown in Know your odds.</li><li>Power-ups now scale with card quality: Uncommon cards only nudge Uncommon odds, Epic cards stay modest, and Crown and Chase cards carry the real boosts. Each +0.10% Crown now adds 10% to the chase chance instead of 25%.</li><li>Every named Chase card now carries a positive power-up, so the rarest pulls are never a downgrade.</li><li>Completed Card Index sets pay £10–£50 cash once both permanent odds caps are full, so every completed set still has a reward.</li><li>Multi-pack openings now play every special animation side by side, including a full-length Andy Burnham sequence and new Secret reveals.</li><li>The rewards dot only appears when there is something to claim. Loadout caps are now +2.50% Epic / +1.00% Crown; index caps remain +2.00% Epic / +0.40% Crown.</li></ul></section><button class="button ghost full" data-action="change-user">Switch Google account</button><button class="text-button full" data-action="logout">Log out</button>`,
    "settings-modal",
  );
}
function oddsModal(id) {
  const list = id ? packs.filter((p) => p.id === id) : packs;
  showModal(
    `<span class="eyebrow">NOTHING UP OUR ROYAL SLEEVES</span><h2>Know your odds.</h2><p>Base odds per card, with separate special rolls per pack. ${ordinaryPullNote} Windfall remains ${100 * WINDFALL_CHANCE / WINDFALL_ROLL_SCALE}% per pack. Profit is never guaranteed.</p><details class="collection-details"><summary>How guarantees, bonuses & special rolls work</summary><p>These are the base odds per card. Every tenth successful pack purchase across all types contains an Epic or better; a low card is upgraded if needed. Apex also keeps its Crown guarantee. The comeback promise is separate: when three purchases in a row each sell for less than their price, your next pack is opened with no Common cards, so every card in it is Uncommon or better. The promise is spent when that pack opens, and a losing comeback pack counts as the first loss of your next streak. Chase, Payday, Windfall and Mythic jackpots are separate per-pack rolls. Windfall has a ${100 * WINDFALL_CHANCE / WINDFALL_ROLL_SCALE}% chance per pack for a card worth 5.5× its listed price; it only replaces a cheaper ordinary card. ${ordinaryPullNote} Crown-chance bonuses from loadout or Card Index rewards raise both your Crown odds and the chase chance for that pack. ${secretRollNote()} Guarantees improve the final outcome beyond the base odds. A pack’s sell value can be lower or higher than its price.</p></details>${list
      .map((p) => {
        const mythic = cardMap[p.jackpot];
        const mythicPct = (100 / p.jackpotOdds).toFixed(4);
        const secretKnown = state.inventory.some(
          (card) => card.template_id === p.secret,
        );
        return `<div class="odds-section"><h3>${p.name} <span>${money(p.price)} · ${p.count} cards</span></h3>${rarities.map((r, i) => `<div class="odds-row"><span class="rarity-dot rarity-${r.toLowerCase()}"></span><span>${r === "Alpha" ? "Mystery Gold (Alpha)" : r}</span><b>${p.odds[i] / 1000000}%</b></div>`).join("")}<div class="odds-row mythic-odds-row"><span class="rarity-dot rarity-mythic"></span><span>${esc(mythic.name)} (Mythic jackpot)</span><b>${mythicPct}% <small>per pack · 1 in ${p.jackpotOdds.toLocaleString()}</small></b></div><div class="odds-row secret-odds-row"><span class="rarity-dot rarity-secret"></span><span>Secret card${secretKnown || p.id === "uk" ? ` · ${esc(cardMap[p.secret]?.name || "")}` : " · identity undiscovered"}</span><b>${(SECRET_BASE_CHANCE / 10000).toFixed(2)}% base <small>+${(SECRET_CROWN_BONUS / 10000).toFixed(2)}% per equipped Crown · ${(SECRET_CHANCE_CAP / 10000).toFixed(2)}% total cap · ${money(cardMap[p.secret]?.value || 0)}<br>First successful purchase per UTC day · each pack in that batch</small></b></div>${p.payday ? `<div class="odds-row payday-odds-row"><span class="rarity-dot rarity-chase"></span><span>${esc(presentedCard(cardMap[p.payday], state.inventory.some((c) => c.template_id === p.payday)).name)} (Payday)</span><b>${100 / p.paydayOdds}% <small>per pack · 1 in ${p.paydayOdds} · ${money(cardMap[p.payday].value)}</small></b></div>` : ""}<div class="odds-row windfall-odds-row"><span class="rarity-dot rarity-chase"></span><span>${esc(cardMap[p.windfall].name)} (Windfall)</span><b>${100 * WINDFALL_CHANCE / WINDFALL_ROLL_SCALE}% <small>per pack · ${money(cardMap[p.windfall].value)} · 5.5× listed price</small></b></div><p>${esc(
            presentedCard(
              cardMap[p.chase],
              state.inventory.some((c) => c.template_id === p.chase),
            ).name,
          )} · 1 in ${p.chaseOdds.toLocaleString()} packs · ${money(cardMap[p.chase].value)}</p>${p.guarantee ? "<small>Crown or better guaranteed: the lowest card is replaced if needed.</small>" : ""}</div>`;
      })
      .join(
        "",
      )}<p class="fine-print">Chase, Payday, Windfall, Mythic and Secret rolls are separate and replace the lowest-value eligible card. Windfall and Payday trophies are excluded from Card Index completion requirements. Alpha, Chase, Mythic and Secret cards are never replaced by another special roll. ${secretRollNote()} Secret cards are hidden from the Card Index. Mystery Gold: ${money(cardMap["mystery-gold"].value)} base value, globally numbered. All values are fictional.</p>`,
    "odds-modal",
  );
}
function sound(rarity) {
  if (state.muted) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(260, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(
      ["Alpha", "Chase", "Crown", "Mythic", "Secret"].includes(rarity)
        ? 1040
        : 520,
      ctx.currentTime + 0.25,
    );
    g.gain.setValueAtTime(0.065, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.6);
    o.onended = () => ctx.close();
  } catch {}
}
async function buyPack(id) {
  if (!requireUser()) return;
  await sync();
  const p = packs.find((entry) => entry.id === id);
  const limit = Math.max(1, Math.min(3, Number(state.account?.pack_slots || 1)));
  const opened = Number(state.account?.packs || 0);
  const discountPerMilestone = loadoutEffects().packDiscount;
  const buttons = Array.from({length: limit}, (_, index) => index + 1).map((quantity) => {
    const milestones = Math.floor((opened + quantity) / 3) - Math.floor(opened / 3);
    const secretDiscount = secretDiscountFor(p) * quantity;
    const discount = Math.min(p.price * quantity, discountPerMilestone * milestones + secretDiscount);
    const price = p.price * quantity - discount;
    return '<button class="button full" data-action="confirm-buy" data-id="' + p.id + '" data-quantity="' + quantity + '" ' + (Number(state.account?.balance || 0) < price ? 'disabled' : '') + '>Open ' + quantity + ' pack' + (quantity === 1 ? '' : 's') + ' for ' + money(price) + (discount ? ' · saves ' + money(discount) : '') + ' ' + icon('arrow') + '</button>';
  }).join('');
  const secretDiscount = secretDiscountFor(p);
  const mythic = cardMap[p.jackpot];
  showModal('<span class="eyebrow">YOUR NEXT ROYAL MISTAKE</span><h2>Open ' + p.name + '?</h2><p>' + p.count + ' cards per pack. Select how many identical packs to open. One-time limit: ' + limit + '.</p>' + guaranteeProgress() + lossStreakProgress() + '<div class="purchase-preview">' + packArt(p) + '</div><p class="fine-print">You might pull less than you spend, or something worth much more. Chase odds: 1 in ' + p.chaseOdds.toLocaleString() + (p.payday ? '. Payday odds: 1 in ' + p.paydayOdds + ', a ' + money(cardMap[p.payday].value) + ' virtual-value card' : '') + '. Windfall: ' + (100 * WINDFALL_CHANCE / WINDFALL_ROLL_SCALE) + '% per pack, a ' + money(cardMap[p.windfall].value) + ' virtual-value card. ' + ordinaryPullNote + ' ' + secretRollNote() + ' Mythic jackpot: ' + esc(mythic.name) + ', 1 in ' + p.jackpotOdds.toLocaleString() + ' packs, ' + money(mythic.value) + '.' + (secretDiscount ? ' Secret power-up: ' + money(secretDiscount) + ' off each pack today.' : '') + (p.id === 'uk' ? ' UK collection: five cards for £600 listed price. Free Palestine is the rare once-a-day Secret with an £8,000 virtual sell value, separate from the 70 core cards.' : '') + (p.id === 'world' ? ' Includes former leaders and a satirical −£2.50 Keir Starmer card. Negative cards reduce collection value; discarding one charges its penalty. No automatic penalty debit on opening.' : '') + '</p><div class="purchase-quantities">' + buttons + '</div>', 'purchase-modal');
}
async function openPack(id, quantity = 1) {
  if (state.busy) return;
  state.busy = true;
  state.lastOpenedPackId = id;
  const p = packs.find((p) => p.id === id);
  showModal(
    `${packLoadoutSummary()}<span class="eyebrow">THE COURT HOLDS ITS BREATH</span><h2>A little suspense…</h2><div class="opening-pack">${packArt(p)}</div><p class="muted">Opening ${quantity} ${p.name} pack${quantity === 1 ? "" : "s"}.</p>`,
    "opening-modal",
  );
  try {
    const [result] = await Promise.all([
      api("open", { pack: id, quantity }),
      new Promise((resolve) => setTimeout(resolve, 950)),
    ]);
    state.account = result.account;
    state.inventory = [...result.cards, ...state.inventory];
    updateWallet();
    state.busy = false;
    let revealed = 0;
    const cards = result.cards;
    const total = cards.reduce((s, c) => s + Number(c.value), 0);
    const totalSpend = Number(result.pricePaid || 0);
    function revealMarkup() {
      showModal(
        `${packLoadoutSummary()}<span class="eyebrow">${esc(p.name.toUpperCase())} · ${quantity} PACK${quantity === 1 ? "" : "S"} · ${revealed} / ${cards.length} CARDS REVEALED</span><h2>${revealed === cards.length ? "The court has spoken." : "Let’s see your hand."}</h2>${result.epicGuaranteed ? '<p class="guarantee-earned" role="status">Tenth-pack promise · Epic or better guaranteed</p>' : ""}${result.pityGuaranteed ? '<p class="guarantee-earned" role="status">Comeback promise · the comeback pack has no Commons</p>' : ""}${result.discount ? `<p class="guarantee-earned" role="status">Discounts applied · ${money(Number(result.discount))} off this opening${Number(result.secretDiscount) ? ` · Secret pays ${money(Number(result.secretDiscount))}` : ""}</p>` : ""}${result.secretWindow ? `<p class="secret-window-line" role="status">Secret window opened · ${(Number(result.secretChance) / 10000).toFixed(2)}% chance per pack today</p>` : ""}<div class="reveal-cards">${cards.map((c, i) => (i < revealed ? `<div class="revealed">${gameCard(c)}<button class="button ghost small" data-action="sell-one" data-id="${c.id}">${Number(c.value) < 0 ? "Pay penalty & discard" : "Sell now · " + money(Number(c.value))}</button></div>` : `<button class="card-back" data-action="reveal-card" data-index="${i}" aria-label="Reveal card ${i + 1}">${icon("crown")}<span>CARD<br>MONARCHS</span><small>CLICK TO REVEAL</small></button>`)).join("")}</div><div class="reveal-summary">${revealed === cards.length ? `<span>Pack value <strong>${money(total)}</strong></span><span class="${total >= totalSpend ? "positive" : "negative"}">${total >= totalSpend ? "+" : ""}${money(total - totalSpend)} vs pack price</span>` : "<span>Click each card to reveal your pull.</span>"}</div>${revealed === cards.length ? `<button class="button ghost" data-action="sell-pack">${total < 0 ? "Sell all cards · pay " + money(Math.abs(total)) : "Sell all cards · receive " + money(total)}</button>` : '<button class="button ghost" data-action="skip-reveal">Skip animation</button>'}<button class="button" data-action="${revealed === cards.length ? "reveal-done" : "reveal-all"}">${revealed === cards.length ? "Open another pack" : "Reveal all cards"} ${icon("arrow")}</button>`,
        "reveal-modal",
      );
    }
    let stageLayer = null;
    function addCenteredRevealStage(
      index,
      stageClass,
      cardClass,
      decoration,
      { multi = false, secondary = false, shift = 0 } = {},
    ) {
      const target = $(".reveal-cards", modal)?.children[index];
      const card = target && $(".game-card", target);
      if (!card) return;
      if (!stageLayer) {
        stageLayer = document.createElement("div");
        stageLayer.className = "reveal-stage-layer";
        stageLayer.setAttribute("aria-hidden", "true");
        modal.append(stageLayer);
      }
      const rect = card.getBoundingClientRect();
      const stage = document.createElement("div");
      stage.className = `reveal-stage ${stageClass}${multi ? " stage-multi" : ""}${secondary ? " stage-secondary" : ""}`;
      stage.setAttribute("aria-hidden", "true");
      stage.style.setProperty("--stage-shift", `${shift}px`);
      stage.style.setProperty(
        "--start-x",
        `${rect.left + rect.width / 2 - window.innerWidth / 2 - shift}px`,
      );
      stage.style.setProperty(
        "--start-y",
        `${rect.top + rect.height / 2 - window.innerHeight / 2}px`,
      );
      const clone = card.cloneNode(true);
      clone.classList.add(cardClass);
      stage.append(clone);
      if (decoration) stage.insertAdjacentHTML("beforeend", decoration);
      stageLayer.append(stage);
    }
    function secretStageDecoration(entry) {
      const template = entry.template || cardMap[entry.card.template_id] || {};
      return `<div class="secret-scanlines" aria-hidden="true"></div><div class="secret-classified" aria-hidden="true"><b>CLASSIFIED</b><small>SECRET PULL</small></div><strong class="secret-caption">${esc(template.secretCaption || "This card does not exist.")}</strong><div class="secret-glitch" aria-hidden="true"><span>NO RECORD</span><i>${esc(template.name || "SECRET")}</i><span>REDACTED</span></div>`;
    }
    revealMarkup();
    let animationTimer;
    let releaseEffects = () => {};
    let animating = false;
    const handler = (e) => {
      const b = e.target.closest("[data-action]");
      if (!b) return;
      if (b.dataset.action === "skip-reveal") {
        releaseEffects();
        revealed = cards.length;
        revealMarkup();
        modal
          .querySelectorAll(".revealed")
          .forEach((node) => node.classList.add("new-reveal"));
        return;
      }
      if (animating) return;
      if (["reveal-card", "reveal-all"].includes(b.dataset.action)) {
        if (
          b.dataset.action === "reveal-card" &&
          Number(b.dataset.index) !== revealed
        ) {
          toast("Reveal your cards from left to right.");
          return;
        }
        const start = revealed;
        revealed =
          b.dataset.action === "reveal-all" ? cards.length : revealed + 1;
        const newCards = cards.slice(start, revealed);
        const ranks = [
          "Common",
          "Uncommon",
          "Epic",
          "Crown",
          "Chase",
          "Alpha",
          "Mythic",
          "Secret",
        ];
        sound(
          newCards.reduce(
            (best, c) =>
              ranks.indexOf(c.rarity) > ranks.indexOf(best) ? c.rarity : best,
            "Common",
          ),
        );
        releaseEffects();
        revealMarkup();
        const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
        const entries = newCards.map((card, offset) => ({
          card,
          template: cardMap[card.template_id] || card,
          index: start + offset,
        }));
        const isSecret = (entry) =>
          entry.card.rarity === "Secret" || entry.template?.rarity === "Secret";
        const isWorldPerson = (entry, name) =>
          entry.template?.set === "world" && entry.template?.name === name;
        entries.forEach((entry) => {
          const target = $(".reveal-cards", modal)?.children[entry.index];
          if (!target) return;
          target.classList.add("new-reveal");
          if (entry.card.rarity === "Epic") target.classList.add("epic-reveal");
          if (entry.card.rarity === "Mythic")
            target.classList.add("mythic-reveal");
          if (
            entry.card.rarity === "Crown" &&
            !isWorldPerson(entry, "King Charles III")
          )
            target.classList.add("crown-reveal");
          if (isSecret(entry)) target.classList.add("secret-reveal");
        });
        const secretEntries = entries.filter(isSecret);
        const kimEntries = entries.filter(
          (entry) => entry.card.template_id === "kim",
        );
        const charlesEntries = entries.filter(
          (entry) => isWorldPerson(entry, "King Charles III"),
        );
        charlesEntries.forEach((entry) => {
          const target = $(".reveal-cards", modal)?.children[entry.index];
          if (!target) return;
          target.classList.add("trumpet-reveal");
          target.insertAdjacentHTML(
            "beforeend",
            '<div class="trumpet-fanfare" aria-hidden="true"><span>🎺</span><i>♪</i><i>♫</i><i>♬</i></div>',
          );
        });
        kimEntries.forEach((entry) => {
          const target = $(".reveal-cards", modal)?.children[entry.index];
          if (!target) return;
          target.classList.add("supreme-reveal");
          target.insertAdjacentHTML(
            "beforeend",
            '<div class="supreme-stars" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span><span>✧</span></div>',
          );
        });
        const hasKim = kimEntries.length > 0;
        if (
          !hasKim &&
          entries.some((entry) =>
            ["Alpha", "Chase", "Crown", "Mythic", "Secret"].includes(
              entry.card.rarity,
            ),
          )
        )
          modal.classList.add("legendary-flash");
        entries
          .filter((entry) => entry.card.rarity === "Mythic")
          .forEach((entry) => {
            const target = $(".reveal-cards", modal)?.children[entry.index];
            target?.insertAdjacentHTML(
              "beforeend",
              '<div class="mythic-burst" aria-hidden="true"><span>✦</span><i>✧</i><i>✦</i><i>✧</i><b>JACKPOT</b></div>',
            );
          });
        entries
          .filter(
            (entry) =>
              entry.card.rarity === "Crown" &&
              !isWorldPerson(entry, "King Charles III"),
          )
          .forEach((entry) => {
            const target = $(".reveal-cards", modal)?.children[entry.index];
            target?.insertAdjacentHTML(
              "beforeend",
              '<div class="crown-burst" aria-hidden="true"><span>♛</span><i>✦</i><i>✦</i><i>✦</i><b>CROWN</b></div>',
            );
          });
        if (
          entries.some((entry) =>
            ["Alpha", "Chase", "Mythic", "Secret"].includes(
              entry.card.rarity,
            ),
          )
        ) {
          modal.insertAdjacentHTML(
            "beforeend",
            `<div class="celebration" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<i style="--i:${i};--x:${((i % 6) - 2.5) * 80}px;--y:${Math.floor(i / 6) % 2 ? -240 : 200}px"></i>`).join("")}</div>`,
          );
        }
        const stageSpecials = [];
        entries.forEach((entry) => {
          if (isSecret(entry))
            stageSpecials.push({ kind: "secret", entry, priority: 100 });
          else if (isWorldPerson(entry, "Andy Burnham"))
            stageSpecials.push({ kind: "andy", entry, priority: 90 });
          else if (isWorldPerson(entry, "Donald Trump"))
            stageSpecials.push({ kind: "trump", entry, priority: 80 });
          else if (isWorldPerson(entry, "Benjamin Netanyahu"))
            stageSpecials.push({ kind: "netanyahu", entry, priority: 70 });
          else if (entry.card.template_id === "world-israel-flag")
            stageSpecials.push({ kind: "israel", entry, priority: 60 });
        });
        const maxStages = reduced ? 0 : window.innerWidth < 720 ? 1 : 3;
        const chosen = stageSpecials
          .slice()
          .sort((a, b) => b.priority - a.priority)
          .slice(0, maxStages)
          .sort((a, b) => a.entry.index - b.entry.index);
        const chosenEntries = new Set(
          chosen.map((special) => special.entry),
        );
        const stageCardWidth =
          chosen.length === 3
            ? Math.min(238, window.innerWidth * 0.25)
            : Math.min(300, window.innerWidth * 0.33);
        const gap =
          chosen.length === 3
            ? Math.max(Math.min(205, window.innerWidth * 0.19), stageCardWidth + 16)
            : Math.min(180, window.innerWidth * 0.18);
        const shifts =
          chosen.length === 3
            ? [-gap, 0, gap]
            : chosen.length === 2
              ? [-gap, gap]
              : [0];
        const stageClasses = {
          secret: ["secret-stage", "secret-card"],
          andy: ["andy-stage", "andy-card"],
          trump: ["american-stage", "american-card"],
          netanyahu: ["netanyahu-stage", "netanyahu-card"],
          israel: ["israel-stage", "israel-card"],
        };
        const stageDecorations = {
          andy: '<div class="andy-northern-lights"><span>✦</span><span>✧</span><i>✦</i></div><strong class="andy-normal-bloke">Just a normal bloke</strong>',
          trump:
            '<div class="american-fireworks"><span>★</span><span>★</span><span>★</span><b>🇺🇸</b><i>★</i><i>★</i><i>★</i></div>',
          netanyahu:
            '<div class="netanyahu-glints" aria-hidden="true"><span>✦</span><i>✧</i><i>✦</i></div>',
          israel:
            '<div class="israel-star-glow"><span>✡</span><i>✦</i><i>✦</i></div>',
        };
        chosen.forEach((special, position) => {
          const [stageClass, cardClass] = stageClasses[special.kind];
          addCenteredRevealStage(
            special.entry.index,
            stageClass,
            cardClass,
            special.kind === "secret"
              ? secretStageDecoration(special.entry)
              : stageDecorations[special.kind],
            {
              multi: chosen.length > 1,
              secondary: chosen.length > 1 && position > 0,
              shift: shifts[position],
            },
          );
        });
        if (chosen.length > 1 && stageLayer)
          stageLayer.classList.add(`stage-count-${chosen.length}`);
        secretEntries
          .filter((entry) => !chosenEntries.has(entry))
          .forEach((entry) => {
            const target = $(".reveal-cards", modal)?.children[entry.index];
            target?.insertAdjacentHTML(
              "beforeend",
              `<div class="secret-dossier" aria-hidden="true"><b>CLASSIFIED</b><span>${esc(entry.template?.secretCaption || "This card does not exist.")}</span></div>`,
            );
          });
        stageSpecials
          .filter((special) => !chosenEntries.has(special.entry))
          .forEach((special) => {
            const target =
              $(".reveal-cards", modal)?.children[special.entry.index];
            target?.classList.add("special-inline");
          });
        const hasMythic = entries.some(
          (entry) => entry.card.rarity === "Mythic",
        );
        const hasSecret = secretEntries.length > 0;
        const hasCharles = charlesEntries.length > 0;
        const duration = reduced
          ? 0
          : Math.max(
              stageSpecials.some((special) => special.kind === "andy")
                ? 5400
                : 0,
              hasSecret ? 4400 : 0,
              hasMythic ? 3800 : 0,
              stageSpecials.some((special) => special.kind === "netanyahu")
                ? 3600
                : 0,
              stageSpecials.some((special) => special.kind === "israel")
                ? 3000
                : 0,
              stageSpecials.some((special) => special.kind === "trump") ||
              hasCharles
                ? 2700
                : 0,
              hasKim ? 1900 : 0,
              entries.some((entry) =>
                ["Epic", "Crown", "Chase", "Alpha"].includes(
                  entry.card.rarity,
                ),
              )
                ? 1900
                : 0,
              550,
            );
        const controls = [...modal.querySelectorAll("button")].map((button) => [
          button,
          button.disabled,
        ]);
        releaseEffects = () => {
          clearTimeout(animationTimer);
          animating = false;
          controls.forEach(([button, disabled]) => {
            button.disabled = disabled;
          });
          modal.classList.remove("legendary-flash");
          stageLayer?.remove();
          stageLayer = null;
          modal
            .querySelectorAll(
              ".celebration,.mythic-burst,.crown-burst,.supreme-stars,.presidential-sparkle,.trumpet-fanfare,.secret-dossier,.secret-glitch,.reveal-stage-layer",
            )
            .forEach((node) => node.remove());
          modal
            .querySelectorAll(".special-inline")
            .forEach((node) => node.classList.remove("special-inline"));
        };
        const announce = () => {
          if (!modal.open) return;
          const secret = secretEntries[0];
          const mythic = newCards.find((c) => c.rarity === "Mythic");
          if (secret)
            toast(
              `SECRET PULL · ${secret.template.name} · ${money(secret.card.value)} VIRTUAL`,
            );
          else if (mythic)
            toast(
              `MYTHIC JACKPOT · ${mythic.name} · ${money(mythic.value)} VIRTUAL`,
            );
          else if (hasKim)
            toast("SUPREME PULL · KIM JONG UN · £15,000 VIRTUAL");
        };
        if (duration) {
          animating = true;
          controls.forEach(([button]) => {
            button.disabled = true;
          });
          animationTimer = setTimeout(() => {
            releaseEffects();
            announce();
          }, duration);
        } else {
          releaseEffects();
          announce();
        }
      }
      if (b.dataset.action === "reveal-done") {
        modal.removeEventListener("click", handler);
        closeModal();
        render();
        document.querySelector(`[data-pack-id="${id}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      if (b.dataset.action === "sell-pack") {
        modal.removeEventListener("click", handler);
        sellModal(cards.map((card) => card.id));
      }
    };
    modal.addEventListener("click", handler);
    modal.addEventListener(
      "close",
      () => {
        releaseEffects();
        modal.removeEventListener("click", handler);
      },
      { once: true },
    );
  } catch (e) {
    state.busy = false;
    closeModal();
    toast(e.message);
  }
}
function sellModal(selected) {
  const rows = state.inventory.filter((r) => selected.includes(r.id));
  if (!rows.length) {
    toast("Select cards to sell first.");
    return;
  }
  if (rows.some((r) => r.vaulted || r.trade_id)) {
    toast("Unvault cards or cancel their trade before selling.");
    return;
  }
  showModal(
    `<span class="eyebrow">A CONTRIBUTION TO THE TREASURY</span><h2>Sell ${rows.length} card${rows.length === 1 ? "" : "s"}?</h2><p>These cards leave your collection permanently.</p><div class="sale-list">${rows.map((r) => `<div class="list-row"><span>${esc(cardMap[r.template_id]?.name)}</span><b>${money(Number(r.value))}</b></div>`).join("")}</div><div class="sale-total">${rows.reduce((s, r) => s + Number(r.value), 0) < 0 ? "You pay (penalty)" : "You receive"} <strong>${money(Math.abs(rows.reduce((s, r) => s + Number(r.value), 0)))}</strong></div><button class="button full" data-action="confirm-sell" data-ids="${rows.map((r) => r.id).join(",")}">Confirm sale ${icon("arrow")}</button>`,
  );
}
async function tradeModal(id) {
  const t = state.friends?.trades.find((t) => t.id === Number(id));
  if (!t) return;
  const side = t.user_a === state.account.id ? "a" : "b";
  const rows = await api("trades/cards?id=" + id);
  const otherRows = rows.filter((r) => r.owner_id !== state.account.id);
  const mine = state.inventory.filter(
    (r) => !r.vaulted && (!r.trade_id || r.trade_id === t.id),
  );
  showModal(
    `<span class="eyebrow">FRIEND-TO-FRIEND · TRADE #${t.id}</span><h2>${esc(t.name_a)} ↔ ${esc(t.name_b)}</h2><p>Your offered cards are reserved until this trade ends.</p><form id="trade-offer" data-id="${t.id}"><h3>Your offer</h3><div class="trade-picker">${mine.length ? mine.map((r) => `<label><input type="checkbox" name="cards" value="${r.id}" ${t["offer_" + side].includes(r.id) ? "checked" : ""}><span>${esc(cardMap[r.template_id]?.name)} <small>${money(Number(r.value))}</small></span></label>`).join("") : "<p>No available cards. Unvault a card or open a pack.</p>"}</div><button class="button ghost small">Save offer & reserve cards</button></form><h3>Their offer</h3>${otherRows.length ? otherRows.map((r) => `<div class="list-row"><span>${esc(cardMap[r.template_id]?.name)}</span><b>${money(Number(r.value))}</b></div>`).join("") : '<p class="muted">Waiting for their offer.</p>'}<p class="fine-print">You: ${t["confirm_" + side] ? "confirmed" : "not confirmed"} · Friend: ${t["confirm_" + (side === "a" ? "b" : "a")] ? "confirmed" : "not confirmed"}. Saving either offer resets both confirmations.</p><div class="modal-buttons"><button class="button" data-action="trade-confirm" data-id="${t.id}" data-offera="${esc(JSON.stringify(t.offer_a))}" data-offerb="${esc(JSON.stringify(t.offer_b))}" ${t["confirm_" + side] ? "disabled" : ""}>Confirm this exchange</button><button class="text-button" data-action="trade-cancel" data-id="${t.id}">Cancel trade</button><button class="text-button" data-action="trade-reload" data-id="${t.id}">Refresh</button></div>`,
    "trade-modal",
  );
}
document.addEventListener("click", async (e) => {
  const target = e.target.closest("[data-action]");
  if (!target || target.disabled) return;
  const action = target.dataset.action,
    id = target.dataset.id;
  try {
    if (action === "codex") return navigate("codex");
    if (action === "uk-kind") {
      state.ukKind = ["celebrity", "location"].includes(target.dataset.kind) ? target.dataset.kind : "all";
      state.ukLimit = 40;
      ukView();
      $(`[data-action="uk-kind"][data-kind="${state.ukKind}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (action === "uk-more") {
      const previousCount = Math.min(state.ukLimit, $("#uk-cards")?.children.length || 0);
      state.ukLimit = Math.min(ukCoreCards().length, state.ukLimit + 40);
      ukView();
      const nextCard = $("#uk-cards")?.children[previousCount];
      if (nextCard) {
        nextCard.tabIndex = -1;
        nextCard.focus({ preventScroll: true });
      }
      return;
    }
    if (action === "uk-reset") {
      state.ukSearch = "";
      state.ukKind = "all";
      state.ukLimit = 40;
      ukView();
      $("#uk-search")?.focus({ preventScroll: true });
      return;
    }
    if (action === "roster-filter") {
      state.rosterKind = target.dataset.filter;
      state.rosterLimit = 40;
      codexView();
      return;
    }
    if (action === "roster-more") {
      state.rosterLimit += 40;
      codexView();
      return;
    }
    if (action === "close") return closeModal();
    if (action === "auth") return authModal();
    if (action === "auth-login") return authModal("login");
    if (action === "auth-signup") return authModal("signup");
    if (action === "google") {
      const btn = $("[data-action=google]", modal);
      if (btn) btn.disabled = true;
      try {
        await loginWithGoogle();
      } catch (e) {
        if (btn) btn.disabled = false;
        throw e;
      }
      return;
    }
    if (action === "logout") {
      await logout();
      state.user = null;
      state.account = null;
      state.inventory = [];
      navigate("packs");
      render();
      return;
    }
    if (action === "change-user") {
      await logout();
      state.user = null;
      state.account = null;
      state.inventory = [];
      await loginWithGoogle("select_account");
      return;
    }
    if (action === "profile") return navigate("profile");
    if (action === "settings") return settingsModal();
    if (action === "go-packs") return navigate("packs");
    if (action === "loadout-preview") {
      if (!requireUser()) return;
      loadoutEffectModal(id);
      return;
    }
    if (action === "loadout-toggle") {
      if (!requireUser()) return;
      const selected = (state.account?.loadout || []).map(Number);
      const cardId = Number(id);
      const next = selected.includes(cardId)
        ? selected.filter((existing) => existing !== cardId)
        : [...selected, cardId];
      const result = await api("loadout", { ids: next });
      state.account = result.account;
      render();
      toast(
        next.includes(cardId)
          ? "Card equipped. Its power now affects pack odds."
          : "Card unequipped.",
      );
      return;
    }
    if (action === "index-family") {
      state.indexFamily = target.dataset.family || "all";
      render();
      return;
    }
    if (action === "claim-index-reward") {
      if (!requireUser()) return;
      target.disabled = true;
      try {
        const result = await api("index/claim", { set_id: target.dataset.set, reward: target.dataset.reward });
        state.account = result.account;
        updateWallet();
        render();
        toast(
          result.cash
            ? `${money(Number(result.cash))} index completion cash claimed.`
            : result.reward === "badge"
              ? "Set badge claimed. Your collection is complete."
              : "Character set reward claimed.",
        );
      } catch (e) { target.disabled = false; throw e; }
      return;
    }
    if (action === "claim-quest") {
      if (!requireUser()) return;
      target.disabled = true;
      try {
        const result = await api("quests/claim", { quest: target.dataset.quest });
        state.account = result.account;
        updateWallet();
        render();
        toast(`Quest reward claimed · ${money(Number(result.reward))} virtual cash.`);
      } catch (e) { target.disabled = false; throw e; }
      return;
    }
    if (action === "pack-opening-upgrade") {
      if (!requireUser()) return;
      target.disabled = true;
      try {
        const result = await api("upgrades/pack-opening", { pack_slots: Number(target.dataset.slots) });
        state.account = result.account;
        updateWallet();
        render();
        toast(`${Number(result.account.pack_slots)}-pack openings unlocked for ${money(upgradePrices.packSlots[Number(result.account.pack_slots)])} virtual cash.`);
      } catch (e) { target.disabled = false; throw e; }
      return;
    }
    if (action === "loadout-upgrade") {
      if (!requireUser()) return;
      target.disabled = true;
      const result = await api("loadout/upgrade", {});
      state.account = result.account;
      render();
      toast(`Loadout slot ${Number(result.account.loadout_slots)} unlocked for ${money(upgradePrices.loadoutSlots[Number(result.account.loadout_slots)])} virtual cash.`);
      return;
    }
    if (action === "slot-stake") {
      const amount =
        target.dataset.amount === "max"
          ? Math.min(
              slotLimits.maxPence,
              Number(state.account?.balance || slotLimits.minPence),
            )
          : Number(target.dataset.amount);
      const input = $("#slot-stake");
      if (!input) return;
      input.value = (Math.round(amount) / 100).toFixed(2);
      state.slotBet = Math.round(amount);
      updateSlotStake();
      return;
    }
    if (action === "slot-spin") {
      if (!requireUser()) return;
      await slotSpinAction();
      return;
    }
    if (action === "spin-wheel") {
      if (!requireUser() || state.busy) return;
      state.busy = true;
      target.disabled = true;
      try {
        const result = await api("rewards/spin", {});
        const wheel = $("[data-wheel]");
        if (wheel) {
          let start = -90;
          const segment = dailySpinSegments.find(
            (entry) => entry.id === result.prize.id,
          );
          if (!segment)
            throw Error("The rewards wheel returned an unknown prize.");
          for (const entry of dailySpinSegments) {
            const sweep = (entry.weight / spinWeight()) * 360;
            if (entry.id === segment.id) {
              const midpoint = start + sweep / 2;
              const settle = (((-90 - midpoint) % 360) + 360) % 360;
              wheel.style.transform = `rotate(${1440 + settle}deg)`;
              break;
            }
            start += sweep;
          }
          $("#spin-status").textContent = "The wheel is spinning…";
          const duration = matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? 0
            : 4300;
          await new Promise((resolve) => setTimeout(resolve, duration));
        }
        state.account = result.account;
        if (state.view === "rewards") render();
        toast(
          result.prize.reward
            ? `Daily spin prize: ${money(result.prize.reward)}!`
            : "No prize this time. Your next spin is available tomorrow.",
        );
      } finally {
        state.busy = false;
        if (target.isConnected) target.disabled = false;
      }
      return;
    }
    if (action === "mute") {
      state.muted = !state.muted;
      target.innerHTML =
        icon("sound") + `<span>${state.muted ? "Off" : "On"}</span>`;
      target.setAttribute(
        "aria-label",
        state.muted ? "Unmute sound" : "Mute sound",
      );
      return;
    }
    if (action === "how") {
      showModal(
        `<span class="eyebrow">THE ROYAL HANDBOOK</span><h2>Welcome to the chaos.</h2><div class="how-steps">${[
          [
            "01",
            "Join the court",
            "Create an account and receive £5.00 in fictional virtual GBP.",
          ],
          [
            "02",
            "Pick a pack",
            "Open individually randomized cards. Some packs return less than they cost; lucky pulls return more.",
          ],
          [
            "03",
            "Build your kingdom",
            "Keep and vault your favourites. Sell the rest, or trade cards directly with friends.",
          ],
          [
            "04",
            "Take your chances",
            "Enter the weighted global pot, or play equal-stake double-or-nothing at a friend’s private table.",
          ],
          [
            "05",
            "Earn your allowance",
            `Earn from ${money(playReward.firstPence)}, growing by ${money(playReward.increasePence)} every 10 active minutes, up to ${money(playReward.dailyCap)} daily. Background tabs do not count.`,
          ],
        ]
          .map(
            ([n, h, p]) =>
              `<div><span>${n}</span><section><h3>${h}</h3><p>${p}</p></section></div>`,
          )
          .join(
            "",
          )}</div><p class="fine-print">All money is fictional. There are no payments, deposits, withdrawals, or cash prizes.</p>`,
      );
      return;
    }
    if (action === "scroll-shop") {
      e.preventDefault();
      $("#shop")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (action === "filter") {
      state.filter = target.dataset.filter;
      shop();
      $("#shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (action === "world") {
      state.filter = "world";
      shop();
      $("#shop")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (action === "odds") return oddsModal(id);
    if (action === "all-odds") return oddsModal();
    if (action === "buy") return buyPack(id);
    if (action === "confirm-buy") return openPack(id, Number(target.dataset.quantity || 1));
    if (action === "claim-starter") {
      if (!requireUser() || state.busy) return;
      showModal(
        `<span class="eyebrow">A GIFT FOR EVERY PLAYER</span><h2>Your Starter Pack is ready.</h2><p>One surprise card, free. Give the pack a click to open it.</p><button class="starter-pack-open" data-action="open-starter" aria-label="Open your Starter Pack">${packArt(starterPackArt, "starter-opening-art")}</button><p class="muted">One card inside · no charge</p>`,
        "starter-opening-modal",
      );
      return;
    }
    if (action === "open-starter") {
      if (state.busy) return;
      state.busy = true;
      try {
        showModal(
          `<span class="eyebrow">YOUR FREE STARTER PACK</span><h2>The court holds its breath…</h2><div class="opening-pack">${packArt(starterPackArt)}</div><p class="muted">Opening your Starter Pack.</p>`,
          "opening-modal",
        );
        const result = await api("rewards/starter", {});
        state.account = result.account;
        state.inventory.unshift(result.card);
        updateWallet();
        // Rebuild the shell too so the Rewards dot clears as soon as the
        // starter pack is claimed.
        render();
        showModal(
          `<span class="eyebrow">YOUR FREE STARTER PACK</span><h2>Tap to reveal your card.</h2><div class="starter-flip-scene"><button class="starter-flip-card" data-action="reveal-starter-card" aria-label="Flip and reveal your starter card"><span class="starter-flip-inner"><span class="starter-flip-front">${icon("crown")}<strong>STARTER</strong><small>TAP TO REVEAL</small></span><span class="starter-flip-back">${gameCard(result.card, { owned: true })}</span></span></button></div><button class="button starter-reveal-done" data-action="close" hidden>To your rewards ${icon("arrow")}</button>`,
          "reveal-modal",
        );
      } finally {
        state.busy = false;
      }
      return;
    }
    if (action === "reveal-starter-card") {
      target.classList.add("flipped");
      target.disabled = true;
      $(".starter-reveal-done", modal).hidden = false;
      return;
    }
    if (action === "select-card") {
      if (e.target.closest("button")) return;
      if (state.selected.has(Number(id))) state.selected.delete(Number(id));
      else if (state.selected.size < 200) state.selected.add(Number(id));
      else toast("Select up to 200 cards.");
      collection();
      return;
    }
    if (action === "sell-one") {
      e.stopPropagation();
      return sellModal([Number(id)]);
    }
    if (action === "sell-selected") return sellModal([...state.selected]);
    if (action === "confirm-sell") {
      if (state.busy) return;
      target.disabled = true;
      await api("sell", { ids: target.dataset.ids.split(",").map(Number) });
      state.selected.clear();
      await sync();
      closeModal();
      render();
      toast("Cards sold. The treasury thanks you.");
      return;
    }
    if (action === "vault") {
      e.stopPropagation();
      await api("vault", { id: Number(id) });
      await sync();
      collection();
      return;
    }
    if (action === "copy-code") {
      await navigator.clipboard.writeText(state.account.friend_code);
      toast("Friend code copied.");
      return;
    }
    if (action === "gift-amount") {
      const input = $("#gift-amount");
      if (input) {
        input.value = (Number(target.dataset.amount) / 100).toFixed(2);
        input.focus();
      }
      return;
    }
    if (action === "unfriend") {
      showModal(
        `<h2>Leave this court?</h2><p>Open trades with this friend are cancelled and reserved cards are released.</p><button class="button" data-action="confirm-unfriend" data-id="${esc(id)}">Remove friend</button>`,
      );
      return;
    }
    if (action === "confirm-unfriend") {
      await api("friends/remove", { id });
      await sync();
      closeModal();
      friendsView();
      return;
    }
    if (action === "table-create") {
      showModal(
        `<span class="eyebrow">A FRIENDLY LITTLE WAGER</span><h2>Set the table.</h2><p>Your friend matches your stake. After five minutes, the winner gets twice the stake. An unjoined table is refunded.</p><form id="create-table"><label>Your stake (virtual GBP)<input name="stake" type="number" min="0.01" step="0.01" required placeholder="1.00"></label><button class="button full">Create a 5-minute table ${icon("arrow")}</button></form>`,
      );
      return;
    }
    if (action === "trade-create") {
      await api("trades/create", { friend: id });
      await sync();
      await friendsView();
      toast("Trade opened. Pick your offer on the trading floor.");
      return;
    }
    if (action === "trade-open") return tradeModal(id);
    if (action === "trade-reload") {
      const d = await api("friends");
      state.friends = d;
      await sync();
      return tradeModal(id);
    }
    if (action === "trade-confirm" || action === "trade-cancel") {
      target.disabled = true;
      await api(
        action === "trade-confirm" ? "trades/confirm" : "trades/cancel",
        {
          id: Number(id),
          ...(action === "trade-confirm"
            ? {
                offerA: JSON.parse(target.dataset.offera),
                offerB: JSON.parse(target.dataset.offerb),
              }
            : {}),
        },
      );
      await sync();
      closeModal();
      await friendsView();
      toast(
        action === "trade-confirm"
          ? "Confirmation saved. Cards swap when both friends confirm."
          : "Trade cancelled. Cards released.",
      );
      return;
    }
    if (action === "board") {
      state.board = id;
      leaderboardView();
      return;
    }
    if (action === "refresh") {
      await sync();
      render();
      return;
    }
  } catch (err) {
    toast(err.message);
    target.disabled = false;
  }
});
document.addEventListener("submit", async (e) => {
  const form = e.target;
  if (!(form instanceof HTMLFormElement)) return;
  e.preventDefault();
  if (form.dataset.submitting) return;
  form.dataset.submitting = "true";
  const submit = $("button[type=submit],button:not([type])", form);
  if (submit) submit.disabled = true;
  const data = new FormData(form);
  const pence = (key) => {
    const raw = String(data.get(key) || "");
    if (!/^\d+(\.\d{1,2})?$/.test(raw))
      throw Error("Enter a GBP amount with at most two decimal places.");
    const n = Math.round(Number(raw) * 100);
    if (!Number.isSafeInteger(n) || n < 1)
      throw Error("The minimum amount is £0.01.");
    return n;
  };
  try {
    if (form.id === "wager-form") {
      if (!requireUser()) return;
      const result = await api("wager", {
        amount: pence("stake"),
        round: Number(state.pot.round.id),
      });
      await sync();
      await potView();
      const bot = result.entrants?.find((entrant) => entrant.bot);
      toast(
        bot
          ? `Pot Bot matched ${money(Number(bot.amount))}. You both have an equal chance.`
          : "Your stake is in. The pot is open to other players.",
      );
    }
    if (form.id === "add-friend") {
      await api("friends/add", { code: String(data.get("code")) });
      friendsView();
      toast("Your court just got bigger.");
    }
    if (form.id === "gift-form") {
      const amount = pence("amount");
      if (amount > 10000) throw Error("Gifts are capped at £100.00 each.");
      const result = await api("friends/gift", {
        id: String(data.get("friend")),
        amount,
      });
      state.account = result.account;
      await sync();
      await friendsView();
      toast(`Sent ${money(result.sent)} to ${result.to}.`);
    }
    if (form.id === "join-table") {
      await api("tables/join", { code: String(data.get("code")) });
      await sync();
      friendsView();
      toast("You joined the table. The draw happens at its deadline.");
    }
    if (form.id === "create-table") {
      const t = await api("tables/create", { stake: pence("stake") });
      await sync();
      closeModal();
      friendsView();
      toast(`Table created. Share code ${t.code} with a friend.`);
    }
    if (form.id === "username-form") {
      const result = await api("account/username", {
        username: String(data.get("username") || "").trim(),
      });
      state.account = result.account;
      modal.classList.remove("username-required-modal");
      closeModal();
      render();
      toast(
        result.account.username_set
          ? "Your public username is saved."
          : "Username updated.",
      );
    }
    if (form.id === "trade-offer") {
      await api("trades/offer", {
        id: Number(form.dataset.id),
        ids: data.getAll("cards").map(Number),
      });
      await sync();
      const d = await api("friends");
      state.friends = d;
      await tradeModal(form.dataset.id);
      toast("Offer saved. Both confirmations reset.");
    }
  } catch (err) {
    const inline = $(".form-error", form);
    if (inline) inline.textContent = err.message;
    else toast(err.message);
  } finally {
    delete form.dataset.submitting;
    if (submit) submit.disabled = false;
  }
});
document.addEventListener("change", (e) => {
  const el = e.target;
  if (el.id === "rarity-filter") state.rarity = el.value;
  else if (el.id === "set-filter") state.set = el.value;
  else if (el.id === "sort-filter") state.sort = el.value;
  else return;
  collection();
});
document.addEventListener("input", (e) => {
  if (e.target.id === "slot-stake") {
    updateSlotStake();
    return;
  }
  if (e.target.id === "uk-search") {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    state.ukSearch = e.target.value;
    state.ukLimit = 40;
    ukView();
    $("#uk-search")?.focus({ preventScroll: true });
    $("#uk-search")?.setSelectionRange(start, end);
    return;
  }
  if (e.target.id === "roster-search") {
    const pos = e.target.selectionStart;
    state.rosterSearch = e.target.value;
    state.rosterLimit = 40;
    codexView();
    $("#roster-search")?.focus();
    $("#roster-search")?.setSelectionRange(pos, pos);
    return;
  }
  if (e.target.id === "card-search") {
    const pos = e.target.selectionStart;
    state.search = e.target.value;
    collection();
    $("#card-search")?.focus();
    $("#card-search")?.setSelectionRange(pos, pos);
  }
});
document.addEventListener("keydown", (e) => {
  if (
    (e.key === "Enter" || e.key === " ") &&
    e.target.matches("[data-action=select-card], [data-action=loadout-preview]")
  ) {
    e.preventDefault();
    e.target.click();
  }
});
["pointerdown", "keydown", "wheel", "touchstart"].forEach((event) =>
  document.addEventListener(
    event,
    () => {
      lastActivity = Date.now();
    },
    { passive: true },
  ),
);
setInterval(() => {
  document
    .querySelectorAll("[data-countdown]")
    .forEach((el) => (el.textContent = countdown(el.dataset.countdown)));
}, 1000);
let heartbeatPending = false;
setInterval(async () => {
  if (!state.user || heartbeatPending) return;
  const userId = state.user.id;
  heartbeatPending = true;
  try {
    const r = await api("heartbeat", {
      visible: !document.hidden && Date.now() - lastActivity < 60000,
    });
    if (state.user?.id !== userId) return;
    state.account = r.account;
    updateWallet();
    if (r.reward) {
      toast(`Royal allowance received: ${money(r.reward)}.`);
    }
    if (state.view === "rewards") rewardsView();
  } catch {
  } finally {
    heartbeatPending = false;
  }
}, 30000);
let refreshPending = false;
setInterval(async () => {
  if (
    refreshPending ||
    document.hidden ||
    modal.open ||
    document.activeElement?.closest("form")
  )
    return;
  const view = state.view;
  refreshPending = true;
  try {
    if (view === "pot") await potView();
    if (view === "friends") {
      await sync();
      if (state.view === view && !modal.open) await friendsView();
    }
    if (view === "leaderboards") await leaderboardView();
  } catch (e) {
    if (state.view === view) toast(e.message);
  } finally {
    refreshPending = false;
  }
}, 15000);
async function boot() {
  const initial = location.hash.slice(1);
  if ([...tabs, "profile", "codex"].includes(initial)) state.view = initial;
  render();
  try {
    state.user = await getUser();
    if (state.user) {
      await sync();
      render();
      if (state.account?.username_set === false) firstUsernameModal();
    }
    const failed = new URLSearchParams(location.search).get("error");
    if (failed) {
      history.replaceState(null, "", location.pathname + location.hash);
      toast(
        failed === "AccessDenied"
          ? "Google sign-in was cancelled."
          : "Google sign-in failed. Please try again.",
      );
    }
  } catch (e) {
    toast(e.message);
  }
}
boot();
function ukView() {
  const all = ukCoreCards();
  const search = state.ukSearch.trim().toLowerCase();
  const matched = all.filter((card) =>
    (state.ukKind === "all" || card.kind === state.ukKind) &&
    `${card.name} ${card.role || ""}`.toLowerCase().includes(search),
  );
  const visible = matched.slice(0, state.ukLimit);
  const pack = packs.find((p) => p.id === "uk");
  const filters = [["all", "All"], ["celebrity", "Celebrities"], ["location", "Locations"]];
  $("#main").innerHTML =
    title("THE UK COLLECTION", "A kingdom of icons.", "40 celebrities and 30 locations. Explore all 70 core cards, from familiar faces to unmistakable landmarks.") +
    `<section class="codex-intro uk-intro panel"><div><h2>Five cards. One UK collection.</h2><p>Five cards per £600 UK pack. Paul McCartney is the £6,000 Chase, included among the 40 celebrities.</p><details class="collection-details"><summary>Special pulls & collection details</summary><p>The 70 core cards contain 40 celebrities and 30 locations. Payday, Windfall, Mythic and Secret cards are separate special pulls, not extra core cards. Free Palestine is the rare once-a-day Secret, worth £8,000 in virtual sell value.</p><p>${secretRollNote()}</p><p>${ordinaryPullNote} All values and rarities are fictional game assignments, not real-world financial claims.</p></details></div>${pack ? `<button class="button" data-action="buy" data-id="uk">Five cards · £600 ${icon("arrow")}</button>` : ""}</section>
    <div class="toolbar uk-toolbar"><input id="uk-search" type="search" aria-label="Search UK celebrities and locations" placeholder="Search celebrities, locations, or roles…" value="${esc(state.ukSearch)}"><div class="roster-filters" role="group" aria-label="Filter UK collection by type">${filters.map(([kind, label]) => `<button class="button ghost small ${state.ukKind === kind ? "active" : ""}" data-action="uk-kind" data-kind="${kind}" aria-pressed="${state.ukKind === kind}" aria-controls="uk-cards">${label}</button>`).join("")}</div>${pack ? `<button class="button ghost small" data-action="odds" data-id="uk">Pack odds ${icon("info")}</button>` : ""}</div>
    <p class="source-note">Celebrity biographies, landmark pages and image provenance are linked on each card. Special trophies stay outside this 70-card browse collection.</p>
    <p class="muted uk-count" role="status" aria-live="polite">${matched.length} matching core card${matched.length === 1 ? "" : "s"} · Showing ${visible.length} of ${matched.length} · ${all.length} in the collection</p>
    <div id="uk-cards" class="collection-grid uk-grid">${visible.map((card) => gameCard(card)).join("")}</div>
    ${!matched.length ? empty("globe", "No UK cards match.", "Try another name, landmark, or card type.", "Clear filters", "uk-reset") : ""}
    ${matched.length > state.ukLimit ? `<button class="button ghost full uk-more" data-action="uk-more" aria-controls="uk-cards">Show ${Math.min(40, matched.length - state.ukLimit)} more cards ${icon("arrow")}</button>` : ""}`;
}
function codexView() {
  const all = catalog
    .filter((c) => c.set === "world")
    .map((c) =>
      presentedCard(
        c,
        state.inventory.some((r) => r.template_id === c.id),
      ),
    );
  const search = state.rosterSearch.toLowerCase();
  const matched = all.filter((c) => {
    const flagCard = c.role === "National flag";
    return (
      (state.rosterKind === "all" ||
        (state.rosterKind === "flags" ? flagCard : !flagCard)) &&
      `${c.name} ${c.country} ${c.role}`.toLowerCase().includes(search)
    );
  });
  const filters = [
    ["all", "All cards"],
    ["leaders", "Leaders"],
    ["flags", "40 nation flags"],
  ];
  $("#main").innerHTML =
    title(
      "THE WORLD LEADERS COLLECTION",
      "A world of questionable power.",
      `${all.length - 40} leader cards and 40 standalone national flag cards. Browse the flags separately or explore the full collection.`,
    ) +
    `<div class="codex-intro panel"><div><h2>Leaders and 40 standalone national flags</h2><p>Four cards per £10 pack. Collect the world’s leaders, discover national flags, and hunt for the hidden £15,000 chase.</p><details class="collection-details"><summary>Special pulls & collection details</summary><p>The £10 World Leaders Pack contains four independently rolled cards. The mystery chase leader is isolated from normal pools: a separate 1-in-45,000 pack roll, with a £15,000 virtual sell value and a special unlock animation. Its identity stays hidden until you reveal the card. Crown-chance bonuses from your loadout or Card Index also nudge that roll upward: every +0.10% Crown adds about 10% to the chase chance. The pack also carries The Last Superpower Mythic jackpot on a separate 1-in-200,000 roll, worth £5,000. King Charles III is an Epic worth ${money(cardMap["world-38b1a8656815ee75"].value)}; Donald Trump is a Crown worth ${money(cardMap["world-c6af8a1c1faf4aae"].value)}; and Israel’s flag is an Epic worth ${money(cardMap["world-israel-flag"].value)}. Flag rarity and value are fictional game assignments based on a broad power-tier estimate, not real-world financial values.</p></details></div><button class="button" data-action="buy" data-id="world">Open for £10 ${icon("arrow")}</button></div><div class="toolbar"><input id="roster-search" aria-label="Search leaders or countries" placeholder="Search leaders, flags, countries, or roles…" value="${esc(state.rosterSearch)}"><div class="roster-filters" role="group" aria-label="Filter the World Leaders collection">${filters.map(([filter, label]) => `<button class="button ghost small ${state.rosterKind === filter ? "active" : ""}" data-action="roster-filter" data-filter="${filter}" aria-pressed="${state.rosterKind === filter}">${label}</button>`).join("")}</div><button class="button ghost small" data-action="odds" data-id="world">Pack odds ${icon("info")}</button></div><p class="source-note">Roster snapshot: ${esc(leaderSource.retrieved)}. <a href="${esc(leaderSource.source)}" target="_blank" rel="noopener noreferrer">Current heads of state and government ↗</a>. Flag values are fictional game ratings informed by a broad power-tier estimate; they do not represent real-world value. Portrait links on leader cards provide individual sources.</p><p class="muted">${matched.length} matching cards · Showing ${Math.min(matched.length, state.rosterLimit)}</p><div class="collection-grid">${matched
      .slice(0, state.rosterLimit)
      .map((c) => gameCard(c))
      .join(
        "",
      )}</div>${matched.length > state.rosterLimit ? '<button class="button ghost full" data-action="roster-more">Show more cards ' + icon("arrow") + "</button>" : ""}`;
}
