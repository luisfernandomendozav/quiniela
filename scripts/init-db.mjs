import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

// Carga DATABASE_URL desde .env sin dependencias extra
function loadEnv() {
  try {
    const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {}
}
loadEnv();

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Creando schema 'quiniela' y tablas...");

  await sql`CREATE SCHEMA IF NOT EXISTS quiniela`;

  await sql`
    CREATE TABLE IF NOT EXISTS quiniela.users (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin      BOOLEAN NOT NULL DEFAULT FALSE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quiniela.matches (
      id          SERIAL PRIMARY KEY,
      jornada     INTEGER NOT NULL DEFAULT 1,
      home_team   TEXT NOT NULL,
      away_team   TEXT NOT NULL,
      match_date  TIMESTAMPTZ NOT NULL,
      home_score  INTEGER,
      away_score  INTEGER,
      status      TEXT NOT NULL DEFAULT 'pending',
      stage       TEXT,
      group_name  TEXT,
      venue       TEXT,
      city        TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;

  // Por si la tabla ya existía sin estas columnas
  await sql`ALTER TABLE quiniela.matches ADD COLUMN IF NOT EXISTS stage      TEXT`;
  await sql`ALTER TABLE quiniela.matches ADD COLUMN IF NOT EXISTS group_name TEXT`;
  await sql`ALTER TABLE quiniela.matches ADD COLUMN IF NOT EXISTS venue      TEXT`;
  await sql`ALTER TABLE quiniela.matches ADD COLUMN IF NOT EXISTS city       TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS quiniela.stadiums (
      id        SERIAL PRIMARY KEY,
      name      TEXT NOT NULL,
      city      TEXT NOT NULL,
      country   TEXT NOT NULL,
      capacity  INTEGER,
      is_mexico BOOLEAN NOT NULL DEFAULT FALSE
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS quiniela.predictions (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES quiniela.users(id) ON DELETE CASCADE,
      match_id   INTEGER NOT NULL REFERENCES quiniela.matches(id) ON DELETE CASCADE,
      pred_home  INTEGER NOT NULL,
      pred_away  INTEGER NOT NULL,
      points     INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (user_id, match_id)
    )
  `;

  console.log("✅ Schema y tablas listas.");
}

main().catch((e) => {
  console.error("Error inicializando la base de datos:", e);
  process.exit(1);
});
