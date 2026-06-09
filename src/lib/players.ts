import roster from "../data/roster.json";
import manifest from "../../public/jugadores/manifest.json";

export type Player = {
  slug: string;
  name: string;
  pos: string;
  number: number;
  club: string;
};

export const PLAYERS: Player[] = roster as Player[];

const M = manifest as Record<string, string>;

// Ruta pública de la foto del jugador, o null si no se descargó.
export function photo(slug: string): string | null {
  return M[slug] ? `/jugadores/${M[slug]}` : null;
}

// Jugadores estrella usados en los banners decorativos.
export const STARS = [
  "santiago-gimenez",
  "hirving-lozano",
  "edson-alvarez",
  "raul-jimenez",
  "alexis-vega",
  "orbelin-pineda",
  "guillermo-ochoa",
  "cesar-montes",
];

export const POSITIONS = ["Portero", "Defensa", "Mediocampista", "Delantero"] as const;
