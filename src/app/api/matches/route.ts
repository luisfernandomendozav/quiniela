import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Crea un partido nuevo (solo admin).
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { jornada, homeTeam, awayTeam, matchDate } = await req.json();
  if (!homeTeam || !awayTeam || !matchDate) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  await sql`
    INSERT INTO quiniela.matches (jornada, home_team, away_team, match_date)
    VALUES (${Number(jornada) || 1}, ${homeTeam}, ${awayTeam}, ${matchDate})
  `;

  return NextResponse.json({ ok: true });
}

// Elimina un partido (solo admin).
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Falta id" }, { status: 400 });
  await sql`DELETE FROM quiniela.matches WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
