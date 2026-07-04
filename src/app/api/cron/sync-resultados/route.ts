import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { computePoints } from "@/lib/points";
import { fetchWorldCupMatches, toCanonKey } from "@/lib/worldcup";

export const dynamic = "force-dynamic";

// Sincroniza resultados reales del Mundial y recalcula puntos.
// Lo dispara Vercel Cron (ver vercel.json). Protegido con CRON_SECRET.
//
// Empareja cada partido por NOMBRE real de las selecciones (grupos y
// eliminatorias), así que funciona en todas las rondas. Solo rellena partidos
// PENDIENTES; nunca pisa un resultado ya capturado. En eliminatorias, si el
// tiempo reglamentario quedó empatado, usa el ganador (penales) para pen_winner.
//
// Prueba manual:  /api/cron/sync-resultados?key=<CRON_SECRET>&dryRun=1
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const key = req.nextUrl.searchParams.get("key");
  const secret = process.env.CRON_SECRET;
  const ok = secret && (auth === `Bearer ${secret}` || key === secret);
  if (!ok) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Falta FOOTBALL_DATA_TOKEN" }, { status: 500 });
  }
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";

  // Partidos PENDIENTES de la BD, indexados por par de equipos (nombre canónico).
  const rows = (await sql`
    SELECT id, home_team, away_team, jornada, group_name
    FROM quiniela.matches
    WHERE status <> 'finished'
  `) as {
    id: number;
    home_team: string;
    away_team: string;
    jornada: number;
    group_name: string | null;
  }[];

  const pairKey = (a: string, b: string) => [a, b].sort().join("__");
  type Target = { id: number; homeKey: string; awayKey: string; knockout: boolean };
  const byPair = new Map<string, Target>();
  for (const m of rows) {
    const homeKey = toCanonKey(m.home_team);
    const awayKey = toCanonKey(m.away_team);
    byPair.set(pairKey(homeKey, awayKey), {
      id: m.id,
      homeKey,
      awayKey,
      knockout: m.group_name == null && m.jornada >= 4,
    });
  }

  const finished = await fetchWorldCupMatches(token, "FINISHED");

  const updated: { id: number; score: string; pen: string | null; preds: number }[] = [];
  const unmatched: string[] = [];

  for (const f of finished) {
    if (f.homeScore == null || f.awayScore == null) continue;
    const apiHome = toCanonKey(f.homeName);
    const apiAway = toCanonKey(f.awayName);
    const t = byPair.get(pairKey(apiHome, apiAway));
    if (!t) {
      // Solo reportamos los que NO son de grupos ya cerrados (ruido).
      unmatched.push(`${f.homeName} ${f.homeScore}-${f.awayScore} ${f.awayName}`);
      continue;
    }

    // Orienta el marcador a local/visitante de la BD.
    const homeIsApiHome = t.homeKey === apiHome;
    const hs = homeIsApiHome ? f.homeScore : f.awayScore;
    const as = homeIsApiHome ? f.awayScore : f.homeScore;

    // Penales: solo si es eliminatoria y el tiempo quedó empatado.
    let pen: "home" | "away" | null = null;
    if (t.knockout && hs === as && f.winner && f.winner !== "DRAW") {
      const apiHomeWon = f.winner === "HOME_TEAM";
      pen = apiHomeWon === homeIsApiHome ? "home" : "away";
    }

    if (dryRun) {
      updated.push({ id: t.id, score: `${hs}-${as}`, pen, preds: -1 });
      continue;
    }

    await sql`
      UPDATE quiniela.matches
      SET home_score = ${hs}, away_score = ${as}, status = 'finished', pen_winner = ${pen}
      WHERE id = ${t.id}
    `;
    const preds = (await sql`
      SELECT id, pred_home, pred_away FROM quiniela.predictions WHERE match_id = ${t.id}
    `) as { id: number; pred_home: number; pred_away: number }[];
    for (const p of preds) {
      const pts = computePoints(p.pred_home, p.pred_away, hs, as);
      await sql`UPDATE quiniela.predictions SET points = ${pts} WHERE id = ${p.id}`;
    }
    updated.push({ id: t.id, score: `${hs}-${as}`, pen, preds: preds.length });
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    finishedFromApi: finished.length,
    pendingInDb: rows.length,
    updated,
    unmatched,
  });
}
