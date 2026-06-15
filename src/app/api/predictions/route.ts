import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getActiveJornada, getPredictionsLocked } from "@/lib/settings";

// Guarda o actualiza el pronóstico del usuario para un partido.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Candado global del admin: bloquea ediciones en todas las jornadas.
  if (await getPredictionsLocked()) {
    return NextResponse.json(
      { error: "Los pronósticos están bloqueados por el administrador" },
      { status: 403 }
    );
  }

  const { matchId, predHome, predAway } = await req.json();
  const h = Number(predHome);
  const a = Number(predAway);
  if (!matchId || !Number.isInteger(h) || !Number.isInteger(a) || h < 0 || a < 0) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const matches = (await sql`
    SELECT status, match_date, jornada FROM quiniela.matches WHERE id = ${matchId}
  `) as { status: string; match_date: string; jornada: number }[];
  if (!matches.length) {
    return NextResponse.json({ error: "Partido no encontrado" }, { status: 404 });
  }
  const m = matches[0];

  // Solo se puede pronosticar la jornada activa (la que abrió el admin).
  const active = await getActiveJornada();
  if (m.jornada !== active) {
    const msg =
      m.jornada < active
        ? "Esta jornada ya cerró"
        : "Esta jornada aún no está abierta";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  // Tampoco partidos ya finalizados o que ya empezaron.
  if (m.status === "finished" || new Date(m.match_date) <= new Date()) {
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
