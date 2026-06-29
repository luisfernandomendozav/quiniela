import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { computePoints } from "@/lib/points";
import { fetchWorldCupMatches, toCanonKey, normalize } from "@/lib/worldcup";
import { R32_CANONICAL } from "@/lib/bracket";

export const dynamic = "force-dynamic";

// Sincroniza resultados reales del Mundial y recalcula puntos.
// Lo dispara Vercel Cron (ver vercel.json). Protegido con CRON_SECRET.
//
// Pruebas manuales:  /api/cron/sync-resultados?key=<CRON_SECRET>&dryRun=1
export async function GET(req: NextRequest) {
  // --- Autorización ---
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

  // --- Partidos de la BD con su par de equipos REALES (clave normalizada) ---
  type DbMatch = {
    id: number;
    status: string;
    homeKey: string;
    awayKey: string;
  };
  const dbMatches: DbMatch[] = [];

  // Fase de grupos (J1-J3): los nombres ya son reales.
  const groups = (await sql`
    SELECT id, home_team, away_team, status FROM quiniela.matches WHERE jornada <= 3
  `) as { id: number; home_team: string; away_team: string; status: string }[];
  for (const m of groups) {
    dbMatches.push({
      id: m.id,
      status: m.status,
      homeKey: toCanonKey(m.home_team),
      awayKey: toCanonKey(m.away_team),
    });
  }

  // Dieciseisavos (J4): nombres con apodos -> el equipo real se sabe por la
  // posición en el cuadro, que coincide con el orden por fecha (P73..P88).
  const j4 = (await sql`
    SELECT id, status FROM quiniela.matches
    WHERE jornada = 4 ORDER BY match_date ASC, id ASC
  `) as { id: number; status: string }[];
  j4.slice(0, 16).forEach((m, i) => {
    const [home, away] = R32_CANONICAL[i];
    dbMatches.push({
      id: m.id,
      status: m.status,
      homeKey: normalize(home),
      awayKey: normalize(away),
    });
  });

  // índice por par no ordenado de equipos
  const pairKey = (a: string, b: string) => [a, b].sort().join("__");
  const byPair = new Map<string, DbMatch>();
  for (const m of dbMatches) byPair.set(pairKey(m.homeKey, m.awayKey), m);

  // --- Resultados reales terminados ---
  const finished = await fetchWorldCupMatches(token, "FINISHED");

  const updated: { id: number; score: string; preds: number }[] = [];
  const skipped: string[] = [];
  const unmatched: string[] = [];

  for (const f of finished) {
    if (f.homeScore == null || f.awayScore == null) continue;
    const apiHome = toCanonKey(f.homeName);
    const apiAway = toCanonKey(f.awayName);
    const db = byPair.get(pairKey(apiHome, apiAway));
    if (!db) {
      unmatched.push(`${f.homeName} ${f.homeScore}-${f.awayScore} ${f.awayName}`);
      continue;
    }
    if (db.status === "finished") {
      skipped.push(`#${db.id} ya tenía resultado`);
      continue;
    }
    // Alinea el marcador a la orientación local/visitante de la BD.
    const homeIsApiHome = db.homeKey === apiHome;
    const hs = homeIsApiHome ? f.homeScore : f.awayScore;
    const as = homeIsApiHome ? f.awayScore : f.homeScore;

    if (dryRun) {
      updated.push({ id: db.id, score: `${hs}-${as}`, preds: -1 });
      continue;
    }

    await sql`
      UPDATE quiniela.matches
      SET home_score = ${hs}, away_score = ${as}, status = 'finished'
      WHERE id = ${db.id}
    `;
    const preds = (await sql`
      SELECT id, pred_home, pred_away FROM quiniela.predictions WHERE match_id = ${db.id}
    `) as { id: number; pred_home: number; pred_away: number }[];
    for (const p of preds) {
      const pts = computePoints(p.pred_home, p.pred_away, hs, as);
      await sql`UPDATE quiniela.predictions SET points = ${pts} WHERE id = ${p.id}`;
    }
    updated.push({ id: db.id, score: `${hs}-${as}`, preds: preds.length });
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    finishedFromApi: finished.length,
    updated,
    skippedCount: skipped.length,
    unmatched,
  });
}
