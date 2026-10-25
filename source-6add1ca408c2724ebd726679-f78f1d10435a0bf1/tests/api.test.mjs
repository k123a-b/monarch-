import test from "node:test";
import assert from "node:assert/strict";
// Optional deployment smoke checks; no local database or server is started by this suite.
const site = process.env.CARD_MONARCHS_TEST_URL;
for (const route of ["me", "ledger", "friends"])
  test(
    `${route} requires an authenticated session`,
    { skip: !site },
    async () => {
      const r = await fetch(new URL("/api/" + route, site));
      assert.equal(r.status, 401);
    },
  );
test(
  "mutations reject cross-origin requests before touching funds",
  { skip: !site },
  async () => {
    const r = await fetch(new URL("/api/open", site), {
      method: "POST",
      headers: {
        origin: "https://unrelated.invalid",
        "content-type": "application/json",
      },
      body: JSON.stringify({ pack: "brainrot" }),
    });
    assert.equal(r.status, 403);
  },
);
test(
  "global pot exposes a server deadline and entrant ledger",
  { skip: !site },
  async () => {
    const r = await fetch(new URL("/api/pot", site));
    assert.equal(r.status, 200);
    const data = await r.json();
    assert.ok(data.round.ends_at);
    assert.ok(Array.isArray(data.entrants));
    assert.ok(Array.isArray(data.history));
  },
);

// These request-validation checks deliberately stop before any database access.
test("malformed and non-object mutation payloads return 400 before accessing accounts", async () => {
  const { handle } = await import("../server/game.ts");
  for (const body of ["{", "null", "[]", "42", '"pack"']) {
    const r = await handle(
      new Request("https://game.example/api/open", {
        method: "POST",
        headers: {
          origin: "https://game.example",
          "content-type": "application/json",
        },
        body,
      }),
      async () => ({ id: "validation-fixture" }),
    );
    assert.equal(r.status, 400);
    assert.match((await r.json()).error, /JSON object/);
  }
});
test("unknown and inherited leaderboard names return 400 before running SQL", async () => {
  const { handle } = await import("../server/game.ts");
  for (const board of ["unknown", "constructor", "__proto__", "toString"]) {
    const r = await handle(
      new Request("https://game.example/api/leaderboards?board=" + board),
    );
    assert.equal(r.status, 400);
  }
});
