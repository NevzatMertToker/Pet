import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
/** Hem ana bağlantı hem de transaction ile çalışabilen servisler için. */
export type DbExecutor = Database | Transaction;

const globalForDb = globalThis as unknown as { __patipaketPool?: Pool; __patipaketDb?: Database };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL tanımlı değil. apps/web/.env.example dosyasına bakın.");
  }
  return new Pool({
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  });
}

/** Geliştirme modunda hot-reload her seferinde yeni havuz açmasın diye global'de tutulur. */
export function getPool(): Pool {
  if (!globalForDb.__patipaketPool) globalForDb.__patipaketPool = createPool();
  return globalForDb.__patipaketPool;
}

export function getDb(): Database {
  if (!globalForDb.__patipaketDb) globalForDb.__patipaketDb = drizzle(getPool(), { schema });
  return globalForDb.__patipaketDb;
}

export async function closeDb(): Promise<void> {
  const pool = globalForDb.__patipaketPool;
  globalForDb.__patipaketPool = undefined;
  globalForDb.__patipaketDb = undefined;
  if (pool) await pool.end();
}

export { schema };
