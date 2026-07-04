// Cliente del proveedor de resultados (football-data.org v4) + utilidades de
// mapeo de nombres. El plan GRATUITO incluye la Copa del Mundo (competición "WC").
//
// Variables de entorno necesarias (en Vercel):
//   FOOTBALL_DATA_TOKEN  -> API key gratuita de https://www.football-data.org/
//   CRON_SECRET          -> secreto que Vercel Cron manda en el header Authorization

const API = "https://api.football-data.org/v4";

export type ApiMatch = {
  utcDate: string;
  status: string; // FINISHED, IN_PLAY, TIMED, etc.
  stage: string;
  homeName: string;
  awayName: string;
  homeScore: number | null; // marcador final (tras alargue si lo hubo)
  awayScore: number | null;
  winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null; // ganador total (incluye penales)
};

// Nombre del proveedor (inglés) -> nombre canónico en español (como en la BD).
// Se compara normalizado (sin acentos, minúsculas), así que las llaves van igual.
const EN_TO_ES: Record<string, string> = {
  mexico: "México",
  "south africa": "Sudáfrica",
  "korea republic": "Corea del Sur",
  "south korea": "Corea del Sur",
  "czech republic": "Chequia",
  czechia: "Chequia",
  canada: "Canadá",
  "bosnia-herzegovina": "Bosnia y Herzegovina",
  "bosnia and herzegovina": "Bosnia y Herzegovina",
  qatar: "Catar",
  switzerland: "Suiza",
  brazil: "Brasil",
  morocco: "Marruecos",
  haiti: "Haití",
  scotland: "Escocia",
  "united states": "Estados Unidos",
  usa: "Estados Unidos",
  paraguay: "Paraguay",
  australia: "Australia",
  turkey: "Turquía",
  turkiye: "Turquía",
  germany: "Alemania",
  curacao: "Curazao",
  "ivory coast": "Costa de Marfil",
  "cote d'ivoire": "Costa de Marfil",
  ecuador: "Ecuador",
  netherlands: "Países Bajos",
  japan: "Japón",
  sweden: "Suecia",
  tunisia: "Túnez",
  belgium: "Bélgica",
  egypt: "Egipto",
  iran: "Irán",
  "new zealand": "Nueva Zelanda",
  spain: "España",
  "cape verde": "Cabo Verde",
  "cabo verde": "Cabo Verde",
  "saudi arabia": "Arabia Saudita",
  uruguay: "Uruguay",
  france: "Francia",
  senegal: "Senegal",
  iraq: "Irak",
  norway: "Noruega",
  argentina: "Argentina",
  algeria: "Argelia",
  austria: "Austria",
  jordan: "Jordania",
  portugal: "Portugal",
  "dr congo": "RD Congo",
  "congo dr": "RD Congo",
  uzbekistan: "Uzbekistán",
  colombia: "Colombia",
  england: "Inglaterra",
  croatia: "Croacia",
  ghana: "Ghana",
  panama: "Panamá",
};

// Quita acentos, signos y pasa a minúsculas para comparar nombres de forma laxa.
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

// Convierte un nombre del proveedor a su canónico en español (o el original si
// no está mapeado). Devuelve la forma NORMALIZADA, lista para comparar.
export function toCanonKey(providerName: string): string {
  const es = EN_TO_ES[normalize(providerName)];
  return normalize(es ?? providerName);
}

// Trae los partidos del Mundial con un estado dado (por defecto FINISHED).
export async function fetchWorldCupMatches(
  token: string,
  status = "FINISHED"
): Promise<ApiMatch[]> {
  const res = await fetch(`${API}/competitions/WC/matches?status=${status}`, {
    headers: { "X-Auth-Token": token },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`football-data ${res.status}: ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as { matches?: any[] };
  return (data.matches ?? []).map((m) => ({
    utcDate: m.utcDate,
    status: m.status,
    stage: m.stage,
    homeName: m.homeTeam?.name ?? "",
    awayName: m.awayTeam?.name ?? "",
    homeScore: m.score?.fullTime?.home ?? null,
    awayScore: m.score?.fullTime?.away ?? null,
    winner: m.score?.winner ?? null,
  }));
}
