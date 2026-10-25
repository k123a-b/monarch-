// Applies db/migrations in filename order, once each, to the database named by
// DATABASE_URL. Safe to re-run. Usage: DATABASE_URL=... npm run migrate
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!raw) {
  console.error("Set DATABASE_URL to your Supabase connection string.");
  process.exit(1);
}
const url = raw.split("?")[0];
const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations");
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const client = new pg.Client({
  connectionString: url,
  ssl: local ? false : { rejectUnauthorized: false },
});

// Drizzle's generated migration is a folder holding migration.sql; the others
// are plain .sql files.
const migrations = readdirSync(dir)
  .sort()
  .map((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      const file = join(path, "migration.sql");
      return existsSync(file) ? { name, file } : null;
    }
    return name.endsWith(".sql") ? { name, file: path } : null;
  })
  .filter(Boolean);

await client.connect();
try {
  await client.query("SELECT pg_advisory_lock(8374202)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS card_monarchs_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())",
  );
  const done = new Set(
    (await client.query("SELECT name FROM card_monarchs_migrations")).rows.map(
      (r) => r.name,
    ),
  );
  for (const m of migrations) {
    if (done.has(m.name)) {
      console.log("skip   ", m.name);
      continue;
    }
    await client.query("BEGIN");
    try {
      await client.query(readFileSync(m.file, "utf8"));
      await client.query(
        "INSERT INTO card_monarchs_migrations(name) VALUES($1)",
        [m.name],
      );
      await client.query("COMMIT");
      console.log("applied", m.name);
    } catch (e) {
      await client.query("ROLLBACK");
      throw new Error(`Migration ${m.name} failed: ${e.message}`);
    }
  }
} finally {
  await client.end();
}
