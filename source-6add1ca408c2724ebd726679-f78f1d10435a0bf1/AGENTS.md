# Architecture

Card Monarchs is a framework-free SPA, built with Vite for Netlify. `index.html` owns title and sharing metadata. `src/main.js` renders views, owns transient interface state, wires Identity, sends JSON API requests, and implements pack reveals and Web Audio. `src/style.css` defines the royal-parlor aesthetic and responsive layouts. The visual reference uses Archivo/Manrope; this project's artwork, brand, and layout are original.

`shared/catalog.mjs` contains pack definitions, normal templates, catalogue merging, deterministic injectable pack rolls, and weighted payouts. `shared/rules.mjs` contains activity accrual, trade reservation verification, friend-code validation, and unbiased large-pot sampling. `shared/leaders.json` and `shared/portraits.json` are versioned catalogue/art manifests, not mutable player storage. `public/img/` contains generated static artwork. Leader images retain external provenance and are served through Image CDN.

`netlify/functions/api.mts` is the JSON API. Its default handler always uses Netlify Identity's verified `getUser()`. The exported `handle` accepts an identity reader solely for server-side integration tests; it is not remotely exposed or populated from request data. `settle.mts` performs scheduled idempotent settlement and ensures the current global round exists. There is no Express server to keep alive.

`db/schema.ts` defines PostgreSQL tables with Drizzle. `db/index.ts` constructs the ORM client inside a function. High-integrity multi-step operations use `@netlify/database` pooled SQL transactions with a single advisory transaction lock. Use parameterized SQL. No player state belongs in local files, localStorage, or process memory. UI selections and filters may remain transient in browser memory.

# Invariants

Money is always integer pence. Convert to decimal GBP only at display/input boundaries. Every balance change must go through the ledger-writing change helper in the same database transaction. Account provisioning credits the welcome bonus once. Do not add real-money features.

Never trust card values, rarity, owners, trade status, payout amounts, deadlines, reward totals, or OAuth identity supplied by the browser. Verify origins on mutations and enforce ownership/friendship server-side. Never use dashboard SSO `context.user` for game authentication. Never trust a decoded but unverified JWT. Identity controls confirmation, refresh, and expiry.

Trade offers reserve inventory rows. A successful offer resets both confirmations. A final acceptance validates both owners, all IDs, the reservation, and vault flags, then atomically changes ownership and releases reservations. Sale/vault actions reject reserved cards. Removing a friend cancels open trades and releases cards. Completed and cancelled trades are immutable.

Apex has the only regular rarity guarantee. Chase cards and Alpha must stay out of normal pools. Chase replacements never remove an Alpha or a more valuable card. Alpha sequences are global; gaps after transaction rollbacks are acceptable, duplicate serials are not. Randomness must remain cryptographic on the server and injectable only for deterministic tests.

A friend table uses equal stakes, two friends, a five-minute server deadline, and no house contribution. Unjoined expired stakes refund. Global rounds last ten minutes, with a stake-weighted full-pot payout. Scheduled settlement and request-driven settlement share the same locking and idempotency behavior.

World leadership is a reviewed dated snapshot. Preserve old template IDs when updating, and retain retired templates needed to display existing inventory. Never silently reassign an existing template ID to a new person. Political rarity/value is fictional. Preserve image provenance. No age field is required by the current user brief.

# Conventions and maintenance

Use ESM, semantic HTML, accessible buttons/dialogs, escaped externally sourced strings, and responsive CSS. Respect reduced-motion preferences. Read Identity provider settings before enabling Google. Don't introduce simulated users, fabricated statistics, fake successful transactions, or local balance fallbacks when the API fails.

Schema edits need migrations under `netlify/database/migrations`. The generated initial migration is followed by an explicit integrity migration for checks, expression/partial indexes, and the inventory/trade foreign key. Preserve those when generating future migrations. Never apply migrations directly during coding; deployment handles them. Never log credentials or environment values.

Run locally with `netlify dev --port 8889`. `npm test` uses Node's test runner and tsx. Pure tests require no services. Deployment and database tests are opt-in; use an isolated database. In constrained agent runs, follow platform restrictions on builds/tests and report validation limits honestly.
