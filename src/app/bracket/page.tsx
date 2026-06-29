import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import NavBar from "@/components/NavBar";
import { buildBracket, type R32Result } from "@/lib/bracket";
import BracketMap from "./BracketMap";

export const dynamic = "force-dynamic";

export default async function BracketPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Los 16 dieciseisavos viven en la jornada 4. Ordenados por fecha, su orden
  // coincide con el del cuadro oficial (P73..P88), así mapeamos cada uno a su
  // posición real. Ver src/lib/bracket.ts.
  const rows = (await sql`
    SELECT id, home_team, away_team, home_score, away_score, status, pen_winner
    FROM quiniela.matches
    WHERE jornada = 4
    ORDER BY match_date ASC, id ASC
  `) as {
    id: number;
    home_team: string;
    away_team: string;
    home_score: number | null;
    away_score: number | null;
    status: string;
    pen_winner: "home" | "away" | null;
  }[];

  // Indexado por posición canónica (0..15 = P73..P88).
  const r32: (R32Result | undefined)[] = rows.slice(0, 16).map((m) => ({
    id: m.id,
    homeLabel: m.home_team.trim(),
    awayLabel: m.away_team.trim(),
    homeScore: m.home_score,
    awayScore: m.away_score,
    status: m.status,
    penWinner: m.pen_winner,
  }));

  const bracket = buildBracket(r32);
  const played = r32.filter((r) => r && r.status === "finished").length;

  return (
    <>
      <NavBar user={user} />
      <main className="max-w-5xl mx-auto px-3 pt-6 pb-24 md:pb-10">
        <h1 className="text-xl font-bold mb-1">Camino al título 🏆</h1>
        <p className="text-sm text-gray-500 mb-4">
          Mapa de la fase de eliminación. Los 32 equipos avanzan hacia el centro: el campeón de la
          Copa Mundial 2026. Se llena solo conforme el admin captura resultados ({played}/16
          dieciseisavos jugados).
        </p>
        <BracketMap bracket={bracket} />
      </main>
    </>
  );
}
