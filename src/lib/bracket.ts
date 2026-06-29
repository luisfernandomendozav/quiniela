// Topología fija del bracket del Mundial 2026 (fase de eliminación).
//
// La BD solo guarda los 16 partidos de Dieciseisavos (jornada 4) y los nombres
// de equipo pueden estar personalizados ("apodos") por los admins. Pero las
// FECHAS se conservan del calendario oficial, así que ordenando los 16 partidos
// por fecha obtenemos exactamente el orden P73..P88. Con ese orden mapeamos cada
// partido a su posición real en el cuadro y a su selección canónica (para la
// bandera), conservando el apodo como etiqueta visible.

// Selecciones canónicas de cada dieciseisavos en orden P73..P88 (para banderas).
export const R32_CANONICAL: [string, string][] = [
  ["Sudáfrica", "Canadá"], // 73
  ["Brasil", "Japón"], // 74
  ["Alemania", "Paraguay"], // 75
  ["Países Bajos", "Marruecos"], // 76
  ["Costa de Marfil", "Noruega"], // 77
  ["Francia", "Suecia"], // 78
  ["México", "Ecuador"], // 79
  ["Inglaterra", "RD Congo"], // 80
  ["Bélgica", "Senegal"], // 81
  ["Estados Unidos", "Bosnia y Herzegovina"], // 82
  ["España", "Austria"], // 83
  ["Portugal", "Croacia"], // 84
  ["Suiza", "Argelia"], // 85
  ["Australia", "Egipto"], // 86
  ["Argentina", "Cabo Verde"], // 87
  ["Colombia", "Ghana"], // 88
];

// Código corto (3 letras) de cada selección canónica.
export const TEAM_CODE: Record<string, string> = {
  Sudáfrica: "RSA",
  Canadá: "CAN",
  Brasil: "BRA",
  Japón: "JPN",
  Alemania: "GER",
  Paraguay: "PAR",
  "Países Bajos": "NED",
  Marruecos: "MAR",
  "Costa de Marfil": "CIV",
  Noruega: "NOR",
  Francia: "FRA",
  Suecia: "SWE",
  México: "MEX",
  Ecuador: "ECU",
  Inglaterra: "ENG",
  "RD Congo": "COD",
  Bélgica: "BEL",
  Senegal: "SEN",
  "Estados Unidos": "USA",
  "Bosnia y Herzegovina": "BIH",
  España: "ESP",
  Austria: "AUT",
  Portugal: "POR",
  Croacia: "CRO",
  Suiza: "SUI",
  Argelia: "ALG",
  Australia: "AUS",
  Egipto: "EGY",
  Argentina: "ARG",
  "Cabo Verde": "CPV",
  Colombia: "COL",
  Ghana: "GHA",
};

// Orden angular de los 16 dieciseisavos (recorrido in-order del árbol), como
// índices 0..15 donde índice = (nº de partido − 73). Garantiza que cada par de
// partidos adyacentes comparte un padre, así el cuadro anida 2:1 sin cruces.
export const R32_ANGULAR_ORDER = [0, 2, 1, 4, 10, 11, 8, 9, 3, 5, 6, 7, 13, 15, 12, 14];

export type R32Result = {
  id: number;
  homeLabel: string; // nombre tal cual en BD (puede ser apodo)
  awayLabel: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  penWinner: "home" | "away" | null; // quién pasó si fue empate (penales)
};

export type Slot = {
  label: string; // apodo / nombre visible
  flagTeam: string; // selección canónica (para la bandera)
  code: string; // código de 3 letras
  isMexico: boolean;
  decided: boolean;
} | null;

export type Bracket = {
  levels: Slot[][]; // de afuera (32 equipos) hacia adentro: [32, 16, 8, 4, 2]
  champion: Slot;
  roundNames: string[]; // nombre de cada nivel + campeón al final
};

function makeSlot(label: string, flagTeam: string, decided: boolean): Slot {
  return {
    label,
    flagTeam,
    code: TEAM_CODE[flagTeam] ?? flagTeam.slice(0, 3).toUpperCase(),
    isMexico: flagTeam === "México",
    decided,
  };
}

// Lado ganador de un dieciseisavos: 0 = local, 1 = visitante, null = sin definir.
function winnerSide(r: R32Result | undefined): 0 | 1 | null {
  if (!r || r.status !== "finished" || r.homeScore == null || r.awayScore == null) return null;
  if (r.homeScore > r.awayScore) return 0;
  if (r.awayScore > r.homeScore) return 1;
  // Empate: lo define quién pasó en penales (si el admin lo capturó).
  if (r.penWinner === "home") return 0;
  if (r.penWinner === "away") return 1;
  return null; // empate sin definir aún
}

// Construye el cuadro radial a partir de los 16 resultados de dieciseisavos.
// `r32` debe venir indexado por posición canónica (0..15 = P73..P88).
export function buildBracket(r32: (R32Result | undefined)[]): Bracket {
  const order = R32_ANGULAR_ORDER;

  // Nivel 0: 32 equipos (2 por partido) en orden angular.
  const teams: Slot[] = [];
  for (const i of order) {
    const r = r32[i];
    const [hCanon, aCanon] = R32_CANONICAL[i];
    teams.push(makeSlot(r?.homeLabel ?? hCanon, hCanon, true));
    teams.push(makeSlot(r?.awayLabel ?? aCanon, aCanon, true));
  }

  // Nivel 1: 16 ganadores de dieciseisavos (participantes de octavos).
  const r16: Slot[] = order.map((i) => {
    const r = r32[i];
    const [hCanon, aCanon] = R32_CANONICAL[i];
    const side = winnerSide(r);
    if (side === null) return null;
    const canon = side === 0 ? hCanon : aCanon;
    const label = side === 0 ? r?.homeLabel ?? hCanon : r?.awayLabel ?? aCanon;
    return makeSlot(label, canon, true);
  });

  // Niveles 2-4 (octavos, cuartos, semis): aún sin partidos en BD → por definir.
  const eights: Slot[] = Array(8).fill(null);
  const fours: Slot[] = Array(4).fill(null);
  const twos: Slot[] = Array(2).fill(null);

  return {
    levels: [teams, r16, eights, fours, twos],
    champion: null,
    roundNames: ["Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Final", "Campeón"],
  };
}
