// Wikimedia thumbnails occasionally use a non-serving hostname in source manifests.
// Ask Image CDN to resize the original; keep the manifest and provenance intact.
export function imageSource(source) {
  if (!source) return "/img/leader-placeholder.svg";
  if (source.startsWith("/")) return source;
  const url = new URL(source);
  if (["thumb.wikimedia.org", "upload.wikimedia.org"].includes(url.hostname)) {
    url.hostname = "upload.wikimedia.org";
    if (url.pathname.includes("/thumb/")) {
      url.pathname = url.pathname
        .replace("/thumb/", "/")
        .replace(/\/[^/]+$/, "");
    }
  }
  return url.href;
}
export function presentedCard(card, unlocked = false) {
  return card.id === "kim" && !unlocked
    ? {
        id: "locked-world-chase",
        name: "Mystery world leader",
        set: "world",
        rarity: "Chase",
        value: card.value,
        image: "/img/mystery-leader.svg",
        flavor: "Unlock this chase card to discover its identity.",
        role: "Identity locked",
        pattern: "rays",
        colors: card.colors,
      }
    : card;
}
