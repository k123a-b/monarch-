import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { catalog, cardMap } from "../shared/catalog.mjs";
import { imageSource, presentedCard } from "../shared/presentation.mjs";

test("Wikimedia thumbnail requests use original files on the serving hostname", () => {
  assert.equal(
    imageSource(
      "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Portrait.jpg/400px-Portrait.jpg",
    ),
    "https://upload.wikimedia.org/wikipedia/commons/a/ab/Portrait.jpg",
  );
  assert.equal(
    imageSource(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Portrait.svg/400px-Portrait.svg.png",
    ),
    "https://upload.wikimedia.org/wikipedia/commons/a/ab/Portrait.svg",
  );
});
test("all bundled catalogue images and both fallback assets exist", () => {
  for (const card of catalog) {
    const source = imageSource(card.image);
    if (source.startsWith("/"))
      assert.ok(
        existsSync(new URL("../public" + source, import.meta.url)),
        card.id,
      );
    else assert.equal(new URL(source).hostname, "upload.wikimedia.org");
  }
  assert.ok(
    existsSync(new URL("../public/img/mystery-leader.svg", import.meta.url)),
  );
});
test("locked chase presentation contains no identity, country, portrait or provenance spoilers", () => {
  const locked = presentedCard(cardMap.kim);
  assert.equal(locked.name, "Mystery world leader");
  assert.equal(locked.value, 1500000);
  assert.equal(locked.image, "/img/mystery-leader.svg");
  assert.doesNotMatch(JSON.stringify(locked), /kim|korea|wikimedia|wikipedia/i);
  assert.equal(locked.page, undefined);
});
test("unlock restores the genuine card and preserves all ordinary leader identities", () => {
  assert.equal(presentedCard(cardMap.kim, true), cardMap.kim);
  for (const card of catalog.filter((c) => c.id !== "kim"))
    assert.equal(presentedCard(card), card);
});
