import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Guarda o actualiza el pronóstico del usuario para un partido.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { matchId, predHome, predAway } = await req.json();
  const h = Number(predHome);
  const a = Number(predAway);
  if (!matchId || !Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // No se permite pronosticar partidos ya finalizados o que ya empezaron.
  const matches = (await sql`
    SELECT status, match_date FROM quiniela.matches WHERE id = ${matchId}
  `) as { status: string; match_date: string }[];
  if (!matches.length) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }
  if (matches[0].status === "finished" || new Date(matches[0].match_date) <= new Date()) {
    return NextResponse.json({ error: "El partido ya cerró pronósticos" }, { status: 403 });
  }

  await sql`
    INSERT INTO quiniela.predictions (user_id, match_id, pred_home, pred_away)
    VALUES (${user.id}, ${matchId}, ${h}, ${a})
    ON CONFLICT (user_id, match_id)
    DO UPDATE SET pred_home = ${h}, pred_away = ${a}, updated_at = now()
  `;

  return NextResponse.json({ ok: true });
}
