import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
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
  venue: string | null;
  city: string | null;
  pred_home: number | null;
  pred_away: number | null;
  points: number | null;
};

export default async function MatchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const matches = (await sql`
    SELECT m.id, m.jornada, m.home_team, m.away_team, m.match_date,
           m.home_score, m.away_score, m.status, m.stage, m.venue, m.city,
           p.pred_home, p.pred_away, p.points
    FROM quiniela.matches m
    LEFT JOIN quiniela.predictions p
      ON p.match_id = m.id AND p.user_id = ${user.id}
    ORDER BY m.match_date ASC
  `) as MatchWithPred[];

  return (
    <>
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <PlayersStrip subtitle="Pronostica al Tri ⚽🇲🇽" />
        <h1 className="text-xl font-bold mb-1">Partidos · Grupo A 🇲🇽</h1>
        <p className="text-sm text-gray-500 mb-4">
          Pronostica el marcador de cada partido. ¡Vamos por el Tri!
        </p>
        <MatchList matches={matches} />
      </main>
    </>
  );
}
