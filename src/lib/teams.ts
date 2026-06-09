import CODES from "../data/flag-codes.json";

const FLAG_CODES = CODES as Record<string, string>;

// Código ISO (flagcdn) de la selección, o null si no está mapeada.
export function flagCode(team: string): string | null {
  return FLAG_CODES[team] ?? null;
}

// Ruta local de la imagen de bandera (descargada en public/banderas/), o null.
export function flagSrc(team: string): string | null {
  const code = FLAG_CODES[team];
  return code ? `/banderas/${code}.png` : null;
}

export function isMexico(team: string): boolean {
  return team === "México";
}
