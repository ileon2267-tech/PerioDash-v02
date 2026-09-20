import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.ts";
import fs from "fs";
import path from "path";

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

function resolveSqlHost(): string | undefined {
  const envHost = process.env.SQL_HOST;
  if (envHost) {
    try {
      if (fs.existsSync(envHost)) {
        return envHost;
      }
    } catch {}
  }

  // Scan /app/cloudsql for active socket directory
  const cloudSqlDir = "/app/cloudsql";
  try {
    if (fs.existsSync(cloudSqlDir)) {
      const entries = fs.readdirSync(cloudSqlDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const socketDir = path.join(cloudSqlDir, entry.name);
          const socketFile = path.join(socketDir, ".s.PGSQL.5432");
          if (fs.existsSync(socketFile) || fs.existsSync(socketDir)) {
            return socketDir;
          }
        }
      }
    }
  } catch {}

  return envHost;
}

// Function to create or retrieve the connection pool using the Object Method.
export const createPool = () => {
  if (!global._postgresPool) {
    const host = resolveSqlHost();
    global._postgresPool = new Pool({
      host,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 5,
      connectionTimeoutMillis: 5000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on("error", (err) => {
      console.warn("Notice: Cloud SQL idle pool client error:", err.message);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance lazily on-demand.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });

