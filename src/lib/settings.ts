import { sql } from "./db";

// Jornada actualmente abierta para pronosticar (la controla el admin).
export async function getActiveJornada(): Promise<number> {
  const rows = (await sql`
    SELECT value FROM quiniela.settings WHERE key = 'active_jornada'
  `) as { value: string }[];
  const n = rows[0] ? parseInt(rows[0].value, 10) : 1;
  return Number.isFinite(n) ? n : 1;
}

export async function setActiveJornada(n: number): Promise<void> {
  await sql`
    INSERT INTO quiniela.settings (key, value)
    VALUES ('active_jornada', ${String(n)})
    ON CONFLICT (key) DO UPDATE SET value = ${String(n)}
  `;
}

// Candado global: si está activo, NADIE puede crear ni editar pronósticos,
// en ninguna jornada. Lo controla el admin.
export async function getPredictionsLocked(): Promise<boolean> {
  const rows = (await sql`
    SELECT value FROM quiniela.settings WHERE key = 'predictions_locked'
  `) as { value: string }[];
  return rows[0]?.value === "true";
}

export async function setPredictionsLocked(locked: boolean): Promise<void> {
  await sql`
    INSERT INTO quiniela.settings (key, value)
    VALUES ('predictions_locked', ${locked ? "true" : "false"})
    ON CONFLICT (key) DO UPDATE SET value = ${locked ? "true" : "false"}
  `;
}
