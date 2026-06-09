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

// Fase de grupos completa del Mundial 2026 — 12 grupos (A-L), 72 partidos.
// Formato por partido: [local, visitante, jornada, fecha, estadio, ciudad]
// El Grupo A conserva horarios exactos (UTC); el resto usa la fecha confirmada.
const GROUPS = {
  A: [
    ["México", "Sudáfrica", 1, "2026-06-11T19:00:00Z", "Estadio Azteca (Estadio Banorte)", "Ciudad de México"],
    ["Corea del Sur", "Chequia", 1, "2026-06-12T02:00:00Z", "Estadio Akron", "Guadalajara"],
    ["Chequia", "Sudáfrica", 2, "2026-06-18T16:00:00Z", "Mercedes-Benz Stadium", "Atlanta"],
    ["México", "Corea del Sur", 2, "2026-06-19T01:00:00Z", "Estadio Akron", "Guadalajara"],
    ["Chequia", "México", 3, "2026-06-25T01:00:00Z", "Estadio Azteca (Estadio Banorte)", "Ciudad de México"],
    ["Sudáfrica", "Corea del Sur", 3, "2026-06-25T01:00:00Z", "Estadio BBVA", "Monterrey"],
  ],
  B: [
    ["Canadá", "Bosnia y Herzegovina", 1, "2026-06-12", "BMO Field", "Toronto"],
    ["Catar", "Suiza", 1, "2026-06-13", "Levi's Stadium", "Santa Clara"],
    ["Suiza", "Bosnia y Herzegovina", 2, "2026-06-18", "SoFi Stadium", "Inglewood"],
    ["Canadá", "Catar", 2, "2026-06-18", "BC Place", "Vancouver"],
    ["Suiza", "Canadá", 3, "2026-06-24", "BC Place", "Vancouver"],
    ["Bosnia y Herzegovina", "Catar", 3, "2026-06-24", "Lumen Field", "Seattle"],
  ],
  C: [
    ["Brasil", "Marruecos", 1, "2026-06-13", "MetLife Stadium", "East Rutherford"],
    ["Haití", "Escocia", 1, "2026-06-13", "Gillette Stadium", "Foxborough"],
    ["Escocia", "Marruecos", 2, "2026-06-19", "Gillette Stadium", "Foxborough"],
    ["Brasil", "Haití", 2, "2026-06-19", "Lincoln Financial Field", "Filadelfia"],
    ["Escocia", "Brasil", 3, "2026-06-24", "Hard Rock Stadium", "Miami Gardens"],
    ["Marruecos", "Haití", 3, "2026-06-24", "Mercedes-Benz Stadium", "Atlanta"],
  ],
  D: [
    ["Estados Unidos", "Paraguay", 1, "2026-06-12", "SoFi Stadium", "Inglewood"],
    ["Australia", "Turquía", 1, "2026-06-14", "BC Place", "Vancouver"],
    ["Estados Unidos", "Australia", 2, "2026-06-19", "Lumen Field", "Seattle"],
    ["Turquía", "Paraguay", 2, "2026-06-20", "Levi's Stadium", "Santa Clara"],
    ["Turquía", "Estados Unidos", 3, "2026-06-25", "SoFi Stadium", "Inglewood"],
    ["Paraguay", "Australia", 3, "2026-06-25", "Levi's Stadium", "Santa Clara"],
  ],
  E: [
    ["Alemania", "Curazao", 1, "2026-06-14", "NRG Stadium", "Houston"],
    ["Costa de Marfil", "Ecuador", 1, "2026-06-14", "Lincoln Financial Field", "Filadelfia"],
    ["Alemania", "Costa de Marfil", 2, "2026-06-20", "BMO Field", "Toronto"],
    ["Ecuador", "Curazao", 2, "2026-06-20", "Arrowhead Stadium", "Kansas City"],
    ["Curazao", "Costa de Marfil", 3, "2026-06-25", "Lincoln Financial Field", "Filadelfia"],
    ["Ecuador", "Alemania", 3, "2026-06-25", "MetLife Stadium", "East Rutherford"],
  ],
  F: [
    ["Países Bajos", "Japón", 1, "2026-06-14", "AT&T Stadium", "Arlington"],
    ["Suecia", "Túnez", 1, "2026-06-14", "Estadio BBVA", "Monterrey"],
    ["Países Bajos", "Suecia", 2, "2026-06-20", "NRG Stadium", "Houston"],
    ["Túnez", "Japón", 2, "2026-06-21", "Estadio BBVA", "Monterrey"],
    ["Japón", "Suecia", 3, "2026-06-25", "AT&T Stadium", "Arlington"],
    ["Túnez", "Países Bajos", 3, "2026-06-25", "Arrowhead Stadium", "Kansas City"],
  ],
  G: [
    ["Bélgica", "Egipto", 1, "2026-06-15", "Lumen Field", "Seattle"],
    ["Irán", "Nueva Zelanda", 1, "2026-06-15", "SoFi Stadium", "Inglewood"],
    ["Bélgica", "Irán", 2, "2026-06-21", "SoFi Stadium", "Inglewood"],
    ["Nueva Zelanda", "Egipto", 2, "2026-06-21", "BC Place", "Vancouver"],
    ["Egipto", "Irán", 3, "2026-06-26", "Lumen Field", "Seattle"],
    ["Nueva Zelanda", "Bélgica", 3, "2026-06-26", "BC Place", "Vancouver"],
  ],
  H: [
    ["España", "Cabo Verde", 1, "2026-06-15", "Mercedes-Benz Stadium", "Atlanta"],
    ["Arabia Saudita", "Uruguay", 1, "2026-06-15", "Hard Rock Stadium", "Miami Gardens"],
    ["España", "Arabia Saudita", 2, "2026-06-21", "Mercedes-Benz Stadium", "Atlanta"],
    ["Uruguay", "Cabo Verde", 2, "2026-06-21", "Hard Rock Stadium", "Miami Gardens"],
    ["Cabo Verde", "Arabia Saudita", 3, "2026-06-26", "NRG Stadium", "Houston"],
    ["Uruguay", "España", 3, "2026-06-26", "Estadio Akron", "Guadalajara"],
  ],
  I: [
    ["Francia", "Senegal", 1, "2026-06-16", "MetLife Stadium", "East Rutherford"],
    ["Irak", "Noruega", 1, "2026-06-16", "Gillette Stadium", "Foxborough"],
    ["Francia", "Irak", 2, "2026-06-22", "Lincoln Financial Field", "Filadelfia"],
    ["Noruega", "Senegal", 2, "2026-06-22", "MetLife Stadium", "East Rutherford"],
    ["Noruega", "Francia", 3, "2026-06-26", "Gillette Stadium", "Foxborough"],
    ["Senegal", "Irak", 3, "2026-06-26", "BMO Field", "Toronto"],
  ],
  J: [
    ["Argentina", "Argelia", 1, "2026-06-16", "Arrowhead Stadium", "Kansas City"],
    ["Austria", "Jordania", 1, "2026-06-17", "Levi's Stadium", "Santa Clara"],
    ["Argentina", "Austria", 2, "2026-06-22", "AT&T Stadium", "Arlington"],
    ["Jordania", "Argelia", 2, "2026-06-22", "Levi's Stadium", "Santa Clara"],
    ["Argelia", "Austria", 3, "2026-06-27", "Arrowhead Stadium", "Kansas City"],
    ["Jordania", "Argentina", 3, "2026-06-27", "AT&T Stadium", "Arlington"],
  ],
  K: [
    ["Portugal", "RD Congo", 1, "2026-06-17", "NRG Stadium", "Houston"],
    ["Uzbekistán", "Colombia", 1, "2026-06-17", "Estadio Azteca (Estadio Banorte)", "Ciudad de México"],
    ["Portugal", "Uzbekistán", 2, "2026-06-23", "NRG Stadium", "Houston"],
    ["Colombia", "RD Congo", 2, "2026-06-23", "Estadio Akron", "Guadalajara"],
    ["Colombia", "Portugal", 3, "2026-06-27", "Hard Rock Stadium", "Miami Gardens"],
    ["RD Congo", "Uzbekistán", 3, "2026-06-27", "Mercedes-Benz Stadium", "Atlanta"],
  ],
  L: [
    ["Inglaterra", "Croacia", 1, "2026-06-17", "AT&T Stadium", "Arlington"],
    ["Ghana", "Panamá", 1, "2026-06-17", "BMO Field", "Toronto"],
    ["Inglaterra", "Ghana", 2, "2026-06-23", "Gillette Stadium", "Foxborough"],
    ["Panamá", "Croacia", 2, "2026-06-23", "BMO Field", "Toronto"],
    ["Panamá", "Inglaterra", 3, "2026-06-27", "MetLife Stadium", "East Rutherford"],
    ["Croacia", "Ghana", 3, "2026-06-27", "Lincoln Financial Field", "Filadelfia"],
  ],
};

// Normaliza la fecha: si viene solo el día, asigna las 19:00 UTC.
function toISO(d) {
  return d.includes("T") ? d : `${d}T19:00:00Z`;
}

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

  console.log("Cargando los 72 partidos de la fase de grupos...");
  await sql`DELETE FROM quiniela.predictions`;
  await sql`DELETE FROM quiniela.matches`;

  let total = 0;
  for (const [letter, fixtures] of Object.entries(GROUPS)) {
    for (const [home, away, jornada, date, venue, city] of fixtures) {
      await sql`
        INSERT INTO quiniela.matches
          (jornada, home_team, away_team, match_date, stage, group_name, venue, city)
        VALUES
          (${jornada}, ${home}, ${away}, ${toISO(date)},
           ${"Fase de Grupos"}, ${letter}, ${venue}, ${city})
      `;
      total++;
    }
    console.log(`  ✅ Grupo ${letter}: ${fixtures.length} partidos`);
  }
  console.log(`\n🇲🇽 ¡Listo! ${total} partidos en 12 grupos cargados para el Mundial 2026.`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
