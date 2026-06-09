import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql, type Match } from "@/lib/db";
import NavBar from "@/components/NavBar";
import AdminPanel from "./AdminPanel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.is_admin) redirect("/dashboard");

  const matches = (await sql`
    SELECT id, jornada, home_team, away_team, match_date, home_score, away_score, status
    FROM quiniela.matches
    ORDER BY match_date DESC
  `) as Match[];

  return (
    <>
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-4">Panel de administración</h1>
        <AdminPanel matches={matches} />
      </main>
    </>
  );
}
