import { Pool } from 'pg';

// Server-side Postgres connection pool. This module must never be imported
// from client components — it talks to the database directly.
const connectionString =
  process.env.DATABASE_URL ||
  'postgres://splituser:splitpass@localhost:5442/splitdb';

// Reuse the pool across hot-reloads in dev to avoid exhausting connections.
const globalForPg = globalThis;

export const pool =
  globalForPg._pgPool || new Pool({ connectionString, max: 10 });

if (!globalForPg._pgPool) {
  globalForPg._pgPool = pool;
}

export function query(text, params) {
  return pool.query(text, params);
}
