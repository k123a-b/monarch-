import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

// One pool per warm serverless instance. Point DATABASE_URL at Supabase's
// pooled connection string (Transaction pooler, port 6543); the game only uses
// transaction-scoped locks and settings, which that pooler supports.
const holder = globalThis as unknown as { __cardMonarchsPool?: pg.Pool };

export function pool(): pg.Pool {
  if (!holder.__cardMonarchsPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");
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
