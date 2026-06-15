import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getActiveJornada, getPredictionsLocked } from "@/lib/settings";
import NavBar from "@/components/NavBar";
import PlayersStrip from "@/components/PlayersStrip";
import MatchList from "./MatchList";

export const dynamic = "force-dynamic";

export type MatchWithPred = {
  id: number;
  jornada: number;
  home_team: string;
  away_team: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  stage: string | null;
  group_name: string | null;
  venue: string | null;
  city: string | null;
  pred_home: number | null;
  pred_away: number | null;
  points: number | null;
};

// Pronóstico de otro jugador, visible cuando el partido ya cerró
export type RevealedPred = {
  match_id: number;
  user_name: string;
  pred_home: number;
  pred_away: number;
  points: number;
};

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const matches = (await sql`
    SELECT m.id, m.jornada, m.home_team, m.away_team, m.match_date,
           m.home_score, m.away_score, m.status, m.stage, m.group_name, m.venue, m.city,
           p.pred_home, p.pred_away, p.points
    FROM quiniela.matches m
    LEFT JOIN quiniela.predictions p
      ON p.match_id = m.id AND p.user_id = ${user.id}
    ORDER BY m.group_name ASC, m.jornada ASC, m.match_date ASC
  `) as MatchWithPred[];

  const activeJornada = await getActiveJornada();
  const predictionsLocked = await getPredictionsLocked();

  // Pronósticos de TODOS los jugadores, pero solo de partidos donde ya nadie
  // puede cambiar el suyo: jornada cerrada, partido iniciado o terminado.
  const revealedRows = (await sql`
    SELECT p.match_id, u.name AS user_name, p.pred_home, p.pred_away, p.points
    FROM quiniela.predictions p
    JOIN quiniela.users u ON u.id = p.user_id
    JOIN quiniela.matches m ON m.id = p.match_id
    WHERE m.jornada < ${activeJornada}
       OR m.status = 'finished'
       OR m.match_date <= now()
    ORDER BY u.name ASC
  `) as RevealedPred[];

  const revealed: Record<number, RevealedPred[]> = {};
  for (const r of revealedRows) (revealed[r.match_id] ||= []).push(r);

  return (
    <>
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 pt-6 pb-24 md:pb-8">
        <PlayersStrip subtitle="Pronostica al Tri ⚽🇲🇽" />
        <h1 className="text-xl font-bold mb-1">Fase de Grupos · Mundial 2026</h1>
        <p className="text-sm text-gray-500 mb-4">
          72 partidos en 12 grupos. Solo puedes pronosticar la{" "}
          <span className="font-semibold text-brand">jornada activa (J{activeJornada})</span>.
        </p>
        {predictionsLocked && (
          <div className="mb-4 rounded-xl border border-mxred/40 bg-mxred/10 text-mxred px-4 py-3 text-sm font-medium flex items-center gap-2">
            🔒 Los pronósticos están bloqueados por el administrador. No se pueden hacer cambios por ahora.
          </div>
        )}
        <MatchList
          matches={matches}
          activeJornada={activeJornada}
          revealed={revealed}
          locked={predictionsLocked}
        />
      </main>
    </>
  );
}
