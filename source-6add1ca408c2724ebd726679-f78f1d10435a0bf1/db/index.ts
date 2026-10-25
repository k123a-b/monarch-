import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

// One pool per warm serverless instance. Point DATABASE_URL at Supabase's
// pooled connection string (Transaction pooler, port 6543); the game only uses
// transaction-scoped locks and settings, which that pooler supports.
// Accept DATABASE_URL, or POSTGRES_URL as set by Vercel's Supabase integration.
// Query parameters such as sslmode are removed: pg would let sslmode override
// the TLS settings below.
export function connectionString(): string {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!raw) throw new Error("DATABASE_URL (or POSTGRES_URL) is not set.");
  try {
    const url = new URL(raw);
    url.search = "";
    return url.toString();
  } catch {
    return raw.split("?")[0];
  }
}

// Safe description of the connection in use for error logs: user, host, port,
// which variable supplied it and how long the password is. Never the password.
export function databaseTarget(): string {
  const from = process.env.DATABASE_URL ? "DATABASE_URL" : "POSTGRES_URL";
  try {
    const u = new URL(connectionString());
    return `[${from} user=${decodeURIComponent(u.username)} host=${u.hostname} port=${u.port} db=${u.pathname.slice(1)} passwordLength=${decodeURIComponent(u.password).length} hasBrackets=${/[\[\]]/.test(decodeURIComponent(u.password))}]`;
  } catch {
    return `[${from} could not be parsed as a URL]`;
  }
}

const holder = globalThis as unknown as { __cardMonarchsPool?: pg.Pool };

export function pool(): pg.Pool {
  if (!holder.__cardMonarchsPool) {
    const url = connectionString();
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    holder.__cardMonarchsPool = new pg.Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 10_000,
      // Supabase requires TLS. Do not add ?sslmode= to the URL: pg would let it
      // override this setting.
      ssl: local ? false : { rejectUnauthorized: false },
    });
  }
  return holder.__cardMonarchsPool;
}

export const database = () => drizzle({ client: pool(), schema });
