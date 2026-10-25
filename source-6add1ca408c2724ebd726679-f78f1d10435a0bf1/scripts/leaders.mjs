import { readFile, writeFile } from "node:fs/promises";
import { load } from "cheerio";
import { createHash } from "node:crypto";
import { rateLeader } from "../shared/leader-ratings.mjs";
const source =
  "https://en.wikipedia.org/wiki/List_of_current_heads_of_state_and_government";
const html = await readFile("/tmp/leaders.html", "utf8");
const $ = load(html);
let country = "";
const cards = [];
const seen = new Set();
let previous;
try {
  previous = JSON.parse(await readFile("shared/leaders.json", "utf8"));
} catch {}
const portraitMap = new Map(
  [...(previous?.cards || []), previous?.kim]
    .filter(Boolean)
    .map((c) => [c.page, c.image]),
);
const featuredDetails = {
  "Andy Burnham": {
    role: "MP · Greater Manchester",
    officialSource: "https://members.parliament.uk/member/1427",
    imageSource:
      "https://commons.wikimedia.org/wiki/File:Official_portrait_of_Andy_Burnham_MP_2026_(cropped_3x4).jpg",
    image:
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6b/Official_portrait_of_Andy_Burnham_MP_2026_%28cropped_3x4%29.jpg/500px-Official_portrait_of_Andy_Burnham_MP_2026_%28cropped_3x4%29.jpg",
  },
};
$("table")
  .eq(1)
  .find("tr")
  .each((_, tr) => {
    const th = $(tr).children("th[scope=row]");
    if (th.length)
      country = (
        th.children("a").first().text() || th.find("a").first().text()
      ).trim();
    if (!country) return;
    $(tr)
      .children("td")
      .each((j, td) => {
        const cell = $(td).clone();
        cell.find("sup,small,.mw-ref").remove();
        if (/representative|governor.general/i.test(cell.text())) return;
        const links = cell.find('a[rel="mw:WikiLink"]');
        let after = false;
        links.each((_, a) => {
          const name = $(a).text().trim();
          const title = $(a).attr("title") || name;
          const prev = a.previousSibling?.data || "";
          if (/[–—]/.test(prev)) after = true;
          if (
            !after ||
            !name ||
            /\b(acting|interim|vacant|disputed|suspended)\b/i.test(name) ||
            name.length < 4
          )
            return;
          if (
            /presiden|minister|leader|council|government|succession|monarchy|regent|sovereign/i.test(
              title,
            ) &&
            !/[–—]/.test(prev)
          )
            return;
          const key = country + "|" + name;
          if (seen.has(key)) return;
          seen.add(key);
          cards.push({
            id: "world-" + cards.length,
            name,
            country,
            role:
              cell.attr("colspan") === "2"
                ? "Head of state and government"
                : j === 0
                  ? "Head of state"
                  : "Head of government",
            page: new URL($(a).attr("href"), source).href,
          });
        });
      });
  });
cards.push({
  id: "swiss-council",
  name: "Federal Council",
  country: "Switzerland",
  role: "Collective head of state and government",
  page: "https://en.wikipedia.org/wiki/Federal_Council_(Switzerland)",
});
// Portraits are read from each leader's Wikipedia page, with source attribution retained.
let done = 0;
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (done < cards.length) {
      const i = done++;
      const c = cards[i];
      if (portraitMap.get(c.page)) {
        c.image = portraitMap.get(c.page);
        continue;
      }
      try {
        const r = await fetch(c.page, { signal: AbortSignal.timeout(12000) });
        if (r.ok) {
          const p = load(await r.text());
          let src =
            p(".infobox .infobox-image img").first().attr("src") ||
            p(".infobox img").first().attr("src") ||
            p('meta[property="og:image"]').attr("content");
          if (src) {
            src = src.startsWith("//") ? "https:" + src : src;
            c.image = src.replace(/\/\d+px-/, "/400px-").split("?")[0];
          }
        }
      } catch {}
    }
  }),
);
const filtered = cards.filter((c) => !/^Kim Jong Un$/i.test(c.name));
for (let i = 0; i < filtered.length; i++) {
  const c = filtered[i];
  c.id =
    "world-" +
    createHash("sha256")
      .update(c.country + "|" + c.name)
      .digest("hex")
      .slice(0, 16);
  c.set = "world";
  Object.assign(c, featuredDetails[c.name]);
  if (!c.image) {
    c.image = "/img/leader-placeholder.svg";
    c.portraitPlaceholder = true;
  }
  Object.assign(c, rateLeader(c));
  c.emoji = "🌍";
  c.pattern = "grid";
  c.colors = ["#33495e", "#c8a96a"];
  c.flavor = "Diplomatic immunity does not cover a bad pack pull.";
}
const kim = cards.find((c) => /^Kim Jong Un$/i.test(c.name));
await writeFile(
  "shared/leaders.json",
  JSON.stringify(
    {
      source,
      retrieved: new Date().toISOString().slice(0, 10),
      note: "Snapshot of the cited list. Offices and portraits may change; see individual sources.",
      cards: filtered,
      kim: kim || null,
    },
    null,
    2,
  ),
);
console.log(
  `Saved ${filtered.length} leader cards across ${new Set(filtered.map((c) => c.country)).size} countries; ${filtered.filter((c) => c.image).length} portraits.`,
);
