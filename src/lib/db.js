import { Pool } from 'pg';

// Server-side Postgres connection pool. This module must never be imported
// from client components — it talks to the database directly.
const connectionString =
  process.env.DATABASE_URL ||
  'postgres://splituser:splitpass@localhost:5442/splitdb';

// SSL is opt-in: a bare Postgres (e.g. the docker image) speaks no TLS, so
// enabling SSL there breaks the connection. Managed providers (Neon, Railway,
// RDS, …) advertise it via `sslmode=require` in the URL — honor that. Override
// explicitly with PGSSL=true / PGSSL=false.
function sslConfig() {
  if (process.env.PGSSL === 'false') return false;
  if (process.env.PGSSL === 'true') return { rejectUnauthorized: false };
  return /sslmode=(require|verify-ca|verify-full)/.test(connectionString)
    ? { rejectUnauthorized: false }
    : false;
}

// Reuse the pool across hot-reloads in dev to avoid exhausting connections.
const globalForPg = globalThis;

export const pool =
  globalForPg._pgPool ||
  new Pool({
    connectionString,
    max: 10,
    ssl: sslConfig(),
    // Fail fast on an unreachable DB instead of hanging until the platform's
    // function timeout turns it into an opaque 504.
    connectionTimeoutMillis: 5000,
  });

if (!globalForPg._pgPool) {
  globalForPg._pgPool = pool;
}

export function query(text, params) {
  return pool.query(text, params);
}
