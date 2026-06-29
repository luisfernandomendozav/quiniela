import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { computePoints } from "@/lib/points";

// Registra el resultado final de un partido y recalcula los puntos
// de todos los pronósticos de ese partido (solo admin).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const matchId = Number(params.id);
  const { homeScore, awayScore, penWinner } = await req.json();
  const hs = Number(homeScore);
  const as = Number(awayScore);
  if (!Number.isInteger(hs) || !Number.isInteger(as) || hs < 0 || as < 0) {
    return NextResponse.json({ error: "Marcador inválido" }, { status: 400 });
  }
  // Ganador por penales: solo aplica si el marcador quedó empatado (eliminatorias).
  // Si no es empate, se ignora (queda null).
  const pen = hs === as && (penWinner === "home" || penWinner === "away") ? penWinner : null;

  await sql`
    UPDATE quiniela.matches
    SET home_score = ${hs}, away_score = ${as}, status = 'finished', pen_winner = ${pen}
    WHERE id = ${matchId}
  `;

  // Recalcula puntos de cada pronóstico de este partido.
  const preds = (await sql`
    SELECT id, pred_home, pred_away FROM quiniela.predictions WHERE match_id = ${matchId}
  `) as { id: number; pred_home: number; pred_away: number }[];

  for (const p of preds) {
    const pts = computePoints(p.pred_home, p.pred_away, hs, as);
    await sql`UPDATE quiniela.predictions SET points = ${pts} WHERE id = ${p.id}`;
  }

  return NextResponse.json({ ok: true, updated: preds.length });
}
