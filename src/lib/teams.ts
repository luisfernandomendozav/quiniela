// Banderas (emoji) por selección para la temática del Mundial 2026.
const FLAGS: Record<string, string> = {
  "México": "🇲🇽",
  "Sudáfrica": "🇿🇦",
  "Corea del Sur": "🇰🇷",
  "Chequia": "🇨🇿",
};

export function flag(team: string): string {
  return FLAGS[team] ?? "🏳️";
}

export function isMexico(team: string): boolean {
  return team === "México";
}
