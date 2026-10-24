# Card Monarchs

A multiplayer browser card game where Italian brainrot meets a satirical royal court. Every price, wager, balance, and payout is fictional virtual GBP, represented by integer pence. There are no payment, deposit, withdrawal, or redemption features.

The vanilla JavaScript SPA includes five pack tiers, an animated card reveal with optional synthesized audio, an inventory with vault and bulk sales, weighted ten-minute global pots, five-minute matched-stake friend tables, reserved two-party trades, active-play rewards, five leaderboards, and an accounting ledger.

## Technology

Vite bundles the HTML, CSS, and framework-free JavaScript frontend. Netlify Functions provide a JSON API and scheduled settlement. Netlify Database provides managed PostgreSQL with a Drizzle schema and migrations. Transactional game operations use the database's native pooled connection for explicit transactions and locking; recent pulls use Drizzle ORM. Netlify Identity manages email/password accounts, confirmation, password recovery, session verification, and OAuth callbacks. Netlify Image CDN serves generated pack/meme artwork and externally sourced leader portraits.

## Local development

Use Node.js 22 or later. Install dependencies with `npm install`, then run `netlify dev --port 8889`. The CLI runs Vite and emulates the platform services. Use a linked Netlify project with Identity enabled and a provisioned database. Database migrations in `netlify/database/migrations/` are applied by Netlify during deployment; do not manually apply or push the schema to a deployed database.

`npm test` runs deterministic pack and game-rule checks. Optional deployment API checks run when `CARD_MONARCHS_TEST_URL` names a running deployment. Database integration checks require `CARD_MONARCHS_DATABASE_TESTS=1` in an environment where Netlify Database is configured. These create temporary test accounts, exercise the actual API handler and database transactions, and clean up afterward. Do not use production for database tests.

Local build, development-server, and test commands were not executed during initial implementation; the platform's build pipeline performs validation.

## Accounts and Google login

Email is required for password login and account recovery; usernames are public display names. A new authenticated Identity account receives a single £5.00 welcome credit when its game account is provisioned. No age field is collected.

Identity is enabled. Configure the Google OAuth provider in the site's Identity settings, including its provider credentials and redirect URLs, to enable Google sign-in. The UI reads provider settings and disables Google until it is configured. No provider credentials are embedded in the project. Email confirmation follows Identity's current configuration; the UI handles confirmation and recovery callbacks. Session expiry and refresh are managed by Identity rather than custom application session cookies.

## Economy and fairness

The four original packs use the base per-card odds, expressed as integers out of 100,000,000. Alpha/Mystery Gold is isolated from regular pools and numbered using a database sequence. Apex guarantees at least a Crown by replacing its lowest card if necessary. Chase rolls are per pack; they replace only an eligible lower-value, non-Alpha card. Normal template duplicates are avoided until a rarity pool is exhausted. Pack value may be above or below the purchase price; card values enter the balance only when cards are sold.

Every tenth successful purchase per account, across all pack types, now guarantees an Epic or better. The server reads the existing persisted `accounts.packs` counter under the purchase transaction lock; failed purchases do not advance it, and natural rare pulls do not reset it. If the milestone pack has no Epic or better, its lowest card is replaced by an independently selected Epic from that pack’s collection before the unchanged chase roll. Apex keeps its stronger Crown guarantee. Existing players keep progress from their lifetime pack count. Card sell values remain varied, fixed in integer pence and visible before selling; rarity guarantees do not promise profit.

The £10 World Leaders Pack has four cards. Its per-card odds are 85% Common, 12% Uncommon, 2.8% Epic, 0.1999% Crown, and 0.0001% Alpha. Kim Jong Un is exclusive to the separate 1-in-45,000 pack chase roll, worth £210,000 virtual GBP. His reveal triggers a screen shake; reduced-motion preferences suppress the shake.

Global pot winner probability is proportional to stake with no house rake. Friend tables escrow equal stakes and pay exactly twice the stake to the winner after five minutes. Unjoined tables refund their host. Requests settle overdue games before relevant game actions; a scheduled function also settles and creates rounds every minute. Settlement is idempotent, transaction-locked, and reflected in each player's ledger. Anonymous pot views show live server data; no fictitious players, pots, or wins are seeded.

Active play sends visible-tab heartbeats every 30 seconds, only treating a tab with recent interaction as active. The server credits at most 45 seconds per heartbeat, pays 50 pence per 600 seconds, caps rewards at 300 pence per UTC day, and records payouts in the ledger. Browser visibility is an anti-idle signal, not a tamper-proof bot-detection system.

Run `node scripts/balance-audit.mjs` for a reproducible 500,000-pack simulation including tenth-pack guarantees, median sell values, and profitable-pull frequencies. It does not connect to the database or change live randomness. Results describe virtual inventory values, not automatic cash credits or guaranteed returns.

All economy mutations serialize with a PostgreSQL advisory transaction lock. Pack cards are inserted in one statement to shorten the write lock. Leaderboard reads use a separate read-only snapshot without acquiring the game write lock. Transactions bound lock waits to five seconds and individual statements to fifteen seconds; busy requests roll back and return a retryable error without automatic replay of purchases. Browser refreshes do not overlap, stale view responses are ignored, and forms reject duplicate submissions while a request is pending. This locking policy prioritizes correctness for an initial game population. Higher traffic should replace it with carefully ordered account, trade, and round locks. Mutations check the request origin, verify the Identity session, validate inputs, and scope cards/trades to their owners. Database constraints provide additional protection against negative balances, duplicate friendships, and invalid reservations.

## Catalogue and artwork

The original named roster contains 60 brainrot templates, 28 court templates, four chase cards, and Mystery Gold: 93 total. The brief's brainrot subtotal of 58 did not match its 60 explicitly listed names; all named cards were retained. Chase is a sixth visual tier alongside the five normal rarities.

The world expansion contains both leadership roles from 195 countries, including the collective Swiss Federal Council. Shared roles are represented by one card; the same person serving different countries has a separate country card. The roster is a dated snapshot, not a promise of real-time political accuracy. `shared/leaders.json` retains the reference, retrieval date, individual article links, and portrait URLs. Card values and rarity assignments are fictional and stable for a given country/person. Available portraits are sourced from individual Wikipedia articles; image licenses and authorship are available through those sources. Three source pages had no available portrait and use emblem fallbacks.

Pack and meme art was generated for this project; it is illustrative rather than canonical meme photography. `scripts/art.mjs` and `scripts/portraits.mjs` regenerate artwork through Netlify AI Gateway without storing credentials. `scripts/leaders.mjs` refreshes the roster from a downloaded reference page at `/tmp/leaders.html`; review the results before publishing roster changes. Stable country/name hashes preserve template IDs. Retain retired templates while players still own them.
