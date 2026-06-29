import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql, type Match } from "@/lib/db";
import { getActiveJornada, getPredictionsLocked } from "@/lib/settings";
import NavBar from "@/components/NavBar";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.is_admin) redirect("/dashboard");

  const matches = (await sql`
    SELECT id, jornada, home_team, away_team, match_date, home_score, away_score, status,
           stage, group_name, venue, city, pen_winner
    FROM quiniela.matches
    ORDER BY match_date DESC
  `) as Match[];

  const activeJornada = await getActiveJornada();
  const predictionsLocked = await getPredictionsLocked();
  const jornadas = (await sql`
    SELECT DISTINCT jornada FROM quiniela.matches ORDER BY jornada ASC
  `) as { jornada: number }[];

  return (
    <>
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 pt-6 pb-24 md:pb-8">
        <h1 className="text-xl font-bold mb-4">Panel de administración</h1>
        <AdminPanel
          matches={matches}
          activeJornada={activeJornada}
          jornadas={jornadas.map((j) => j.jornada)}
          predictionsLocked={predictionsLocked}
        />
      </main>
    </>
  );
}
