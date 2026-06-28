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

// Rondas eliminatorias del Mundial 2026 (partidos 73-104).
// Fuente: calendario oficial replicado en Wikipedia, con horas convertidas a UTC.
// Formato: [local, visitante, jornada, fecha UTC, etapa, estadio, ciudad]
const KNOCKOUTS = [
  // Dieciseisavos de final
  ["Sudáfrica", "Canadá", 4, "2026-06-28T19:00:00Z", "Dieciseisavos de Final", "SoFi Stadium", "Inglewood"],
  ["Brasil", "Japón", 4, "2026-06-29T17:00:00Z", "Dieciseisavos de Final", "NRG Stadium", "Houston"],
  ["Alemania", "Paraguay", 4, "2026-06-29T20:30:00Z", "Dieciseisavos de Final", "Gillette Stadium", "Foxborough"],
  ["Países Bajos", "Marruecos", 4, "2026-06-30T01:00:00Z", "Dieciseisavos de Final", "Estadio BBVA", "Guadalupe"],
  ["Costa de Marfil", "Noruega", 4, "2026-06-30T17:00:00Z", "Dieciseisavos de Final", "AT&T Stadium", "Arlington"],
  ["Francia", "Suecia", 4, "2026-06-30T21:00:00Z", "Dieciseisavos de Final", "MetLife Stadium", "East Rutherford"],
  ["México", "Ecuador", 4, "2026-07-01T01:00:00Z", "Dieciseisavos de Final", "Estadio Azteca (Estadio Banorte)", "Ciudad de México"],
  ["Inglaterra", "RD Congo", 4, "2026-07-01T16:00:00Z", "Dieciseisavos de Final", "Mercedes-Benz Stadium", "Atlanta"],
  ["Bélgica", "Senegal", 4, "2026-07-01T20:00:00Z", "Dieciseisavos de Final", "Lumen Field", "Seattle"],
  ["Estados Unidos", "Bosnia y Herzegovina", 4, "2026-07-02T00:00:00Z", "Dieciseisavos de Final", "Levi's Stadium", "Santa Clara"],
  ["España", "Austria", 4, "2026-07-02T19:00:00Z", "Dieciseisavos de Final", "SoFi Stadium", "Inglewood"],
  ["Portugal", "Croacia", 4, "2026-07-02T23:00:00Z", "Dieciseisavos de Final", "BMO Field", "Toronto"],
  ["Suiza", "Argelia", 4, "2026-07-03T03:00:00Z", "Dieciseisavos de Final", "BC Place", "Vancouver"],
  ["Australia", "Egipto", 4, "2026-07-03T18:00:00Z", "Dieciseisavos de Final", "AT&T Stadium", "Arlington"],
  ["Argentina", "Cabo Verde", 4, "2026-07-03T22:00:00Z", "Dieciseisavos de Final", "Hard Rock Stadium", "Miami Gardens"],
  ["Colombia", "Ghana", 4, "2026-07-04T01:30:00Z", "Dieciseisavos de Final", "Arrowhead Stadium", "Kansas City"],

  // Octavos de final
  ["Ganador Partido 73", "Ganador Partido 75", 5, "2026-07-04T17:00:00Z", "Octavos de Final", "NRG Stadium", "Houston"],
  ["Ganador Partido 74", "Ganador Partido 77", 5, "2026-07-04T21:00:00Z", "Octavos de Final", "Lincoln Financial Field", "Filadelfia"],
  ["Ganador Partido 76", "Ganador Partido 78", 5, "2026-07-05T20:00:00Z", "Octavos de Final", "MetLife Stadium", "East Rutherford"],
  ["Ganador Partido 79", "Ganador Partido 80", 5, "2026-07-06T00:00:00Z", "Octavos de Final", "Estadio Azteca (Estadio Banorte)", "Ciudad de México"],
  ["Ganador Partido 83", "Ganador Partido 84", 5, "2026-07-06T19:00:00Z", "Octavos de Final", "AT&T Stadium", "Arlington"],
  ["Ganador Partido 81", "Ganador Partido 82", 5, "2026-07-07T00:00:00Z", "Octavos de Final", "Lumen Field", "Seattle"],
  ["Ganador Partido 86", "Ganador Partido 88", 5, "2026-07-07T16:00:00Z", "Octavos de Final", "Mercedes-Benz Stadium", "Atlanta"],
  ["Ganador Partido 85", "Ganador Partido 87", 5, "2026-07-07T20:00:00Z", "Octavos de Final", "BC Place", "Vancouver"],

  // Cuartos de final
  ["Ganador Partido 89", "Ganador Partido 90", 6, "2026-07-09T20:00:00Z", "Cuartos de Final", "Gillette Stadium", "Foxborough"],
  ["Ganador Partido 93", "Ganador Partido 94", 6, "2026-07-10T19:00:00Z", "Cuartos de Final", "SoFi Stadium", "Inglewood"],
  ["Ganador Partido 91", "Ganador Partido 92", 6, "2026-07-11T21:00:00Z", "Cuartos de Final", "Hard Rock Stadium", "Miami Gardens"],
  ["Ganador Partido 95", "Ganador Partido 96", 6, "2026-07-12T01:00:00Z", "Cuartos de Final", "Arrowhead Stadium", "Kansas City"],

  // Semifinales
  ["Ganador Partido 97", "Ganador Partido 98", 7, "2026-07-14T19:00:00Z", "Semifinal", "AT&T Stadium", "Arlington"],
  ["Ganador Partido 99", "Ganador Partido 100", 7, "2026-07-15T19:00:00Z", "Semifinal", "Mercedes-Benz Stadium", "Atlanta"],

  // Tercer lugar y final
  ["Perdedor Partido 101", "Perdedor Partido 102", 8, "2026-07-18T21:00:00Z", "Tercer Lugar", "Hard Rock Stadium", "Miami Gardens"],
  ["Ganador Partido 101", "Ganador Partido 102", 8, "2026-07-19T19:00:00Z", "Final", "MetLife Stadium", "East Rutherford"],
];

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

  console.log("Cargando los 104 partidos del Mundial 2026...");
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

  for (const [home, away, jornada, date, stage, venue, city] of KNOCKOUTS) {
    await sql`
      INSERT INTO quiniela.matches
        (jornada, home_team, away_team, match_date, stage, group_name, venue, city)
      VALUES
        (${jornada}, ${home}, ${away}, ${toISO(date)},
         ${stage}, ${null}, ${venue}, ${city})
    `;
    total++;
  }
  console.log(`  ✅ Eliminatorias: ${KNOCKOUTS.length} partidos`);
  console.log(`\n🇲🇽 ¡Listo! ${total} partidos cargados para el Mundial 2026.`);
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
