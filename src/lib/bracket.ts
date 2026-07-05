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
// índices 0..15 donde índice = (nº de partido − 73). Refleja el CUADRO REAL del
// Mundial 2026 (verificado con los cruces oficiales de octavos → cuartos → semis),
// de modo que cada par adyacente comparte partido y el cuadro anida 2:1 sin cruces.
// Cruces reales: R16 = (73,76)(75,78)(84,83)(82,81)(74,77)(79,80)(87,86)(85,88).
export const R32_ANGULAR_ORDER = [0, 3, 2, 5, 11, 10, 9, 8, 1, 4, 6, 7, 14, 13, 12, 15];

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

// Partido de una ronda posterior (octavos en adelante), con nombres reales.
export type KoMatch = {
  jornada: number; // 5=octavos, 6=cuartos, 7=semis, 8=final
  home: string;
  away: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  penWinner: "home" | "away" | null;
};

function nameKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

// Equipo ganador (nombre real) de un partido de eliminación, o null si no está definido.
function koWinnerName(m: KoMatch): string | null {
  if (m.status !== "finished" || m.homeScore == null || m.awayScore == null) return null;
  if (m.homeScore > m.awayScore) return m.home;
  if (m.awayScore > m.homeScore) return m.away;
  if (m.penWinner === "home") return m.home;
  if (m.penWinner === "away") return m.away;
  return null;
}

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

// Construye el cuadro radial. `r32` = 16 dieciseisavos indexados por posición
// canónica (0..15 = P73..P88). `later` = partidos de octavos en adelante (con
// nombres reales), que llenan los anillos internos emparejando por nombre.
export function buildBracket(r32: (R32Result | undefined)[], later: KoMatch[] = []): Bracket {
  const order = R32_ANGULAR_ORDER;

  // Equipos hoja (32) en orden angular, para saber qué selecciones caen en cada anillo.
  const leaf: string[] = [];
  for (const i of order) {
    const [h, a] = R32_CANONICAL[i];
    leaf.push(h, a);
  }
  const leafKey = leaf.map(nameKey);

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

  // Anillos internos: cada slot cubre un tramo de equipos hoja; se empareja el
  // partido de esa ronda cuyos dos equipos caen dentro de ese tramo.
  function fillRing(nSlots: number, jornada: number): Slot[] {
    const per = 32 / nSlots;
    return Array.from({ length: nSlots }, (_, j) => {
      const cands = new Set(leafKey.slice(j * per, (j + 1) * per));
      const m = later.find(
        (x) => x.jornada === jornada && cands.has(nameKey(x.home)) && cands.has(nameKey(x.away))
      );
      if (!m) return null;
      const w = koWinnerName(m);
      return w ? makeSlot(w, w, true) : null;
    });
  }

  const eights = fillRing(8, 5); // octavos → participantes de cuartos
  const fours = fillRing(4, 6); // cuartos → semifinalistas
  const twos = fillRing(2, 7); // semis → finalistas
  const champion = fillRing(1, 8)[0]; // final → campeón

  return {
    levels: [teams, r16, eights, fours, twos],
    champion,
    roundNames: ["Dieciseisavos", "Octavos", "Cuartos", "Semifinal", "Final", "Campeón"],
  };
}
