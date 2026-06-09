import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";

function loadEnv() {
  const raw = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnv();

const sql = neon(process.env.DATABASE_URL);

// Las 16 sedes oficiales del Mundial 2026 (USA / México / Canadá)
const STADIUMS = [
  ["Estadio Azteca (Estadio Banorte)", "Ciudad de México", "México", 87523, true],
  ["Estadio Akron", "Guadalajara", "México", 49813, true],
  ["Estadio BBVA", "Monterrey", "México", 53500, true],
  ["AT&T Stadium", "Dallas", "Estados Unidos", 94000, false],
  ["MetLife Stadium", "Nueva York / Nueva Jersey", "Estados Unidos", 82500, false],
  ["Mercedes-Benz Stadium", "Atlanta", "Estados Unidos", 75000, false],
  ["Arrowhead Stadium", "Kansas City", "Estados Unidos", 73000, false],
  ["NRG Stadium", "Houston", "Estados Unidos", 72000, false],
  ["Levi's Stadium", "Bahía de San Francisco", "Estados Unidos", 71000, false],
  ["SoFi Stadium", "Los Ángeles", "Estados Unidos", 70000, false],
  ["Lincoln Financial Field", "Filadelfia", "Estados Unidos", 69000, false],
  ["Lumen Field", "Seattle", "Estados Unidos", 69000, false],
  ["Gillette Stadium", "Boston", "Estados Unidos", 65000, false],
  ["Hard Rock Stadium", "Miami", "Estados Unidos", 65000, false],
  ["BC Place", "Vancouver", "Canadá", 54000, false],
  ["BMO Field", "Toronto", "Canadá", 45000, false],
];

// Grupo A — partidos con fechas/horas (UTC) y sedes oficiales.
// Horarios convertidos desde ET (EDT = UTC-4) anunciados por FIFA/FOX.
const GROUP_A = [
  // Jornada 1 — 11 de junio
  { j: 1, home: "México", away: "Sudáfrica", date: "2026-06-11T19:00:00Z", venue: "Estadio Azteca (Estadio Banorte)", city: "Ciudad de México" },
  { j: 1, home: "Corea del Sur", away: "Chequia", date: "2026-06-12T02:00:00Z", venue: "Estadio Akron", city: "Guadalajara" },
  // Jornada 2 — 18 de junio
  { j: 2, home: "Chequia", away: "Sudáfrica", date: "2026-06-18T16:00:00Z", venue: "Mercedes-Benz Stadium", city: "Atlanta" },
  { j: 2, home: "México", away: "Corea del Sur", date: "2026-06-19T01:00:00Z", venue: "Estadio Akron", city: "Guadalajara" },
  // Jornada 3 — 24 de junio
  { j: 3, home: "Chequia", away: "México", date: "2026-06-25T01:00:00Z", venue: "Estadio Azteca (Estadio Banorte)", city: "Ciudad de México" },
  { j: 3, home: "Sudáfrica", away: "Corea del Sur", date: "2026-06-25T01:00:00Z", venue: "Estadio BBVA", city: "Monterrey" },
];

async function main() {
  console.log("Cargando sedes del Mundial 2026...");
  await sql`DELETE FROM quiniela.stadiums`;
  for (const [name, city, country, cap, mx] of STADIUMS) {
    await sql`
      INSERT INTO quiniela.stadiums (name, city, country, capacity, is_mexico)
      VALUES (${name}, ${city}, ${country}, ${cap}, ${mx})
    `;
  }
  console.log(`  ✅ ${STADIUMS.length} sedes`);

  console.log("Cargando partidos del Grupo A (El Tri)...");
  // Limpia partidos y pronósticos para evitar duplicados
  await sql`DELETE FROM quiniela.predictions`;
  await sql`DELETE FROM quiniela.matches`;
  for (const m of GROUP_A) {
    await sql`
      INSERT INTO quiniela.matches (jornada, home_team, away_team, match_date, stage, venue, city)
      VALUES (${m.j}, ${m.home}, ${m.away}, ${m.date}, ${"Fase de Grupos · Grupo A"}, ${m.venue}, ${m.city})
    `;
  }
  console.log(`  ✅ ${GROUP_A.length} partidos del Grupo A`);
  console.log("🇲🇽 ¡Listo! Quiniela del Mundial 2026 cargada.");
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
