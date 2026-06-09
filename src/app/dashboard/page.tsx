import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import NavBar from "@/components/NavBar";
import { flag } from "@/lib/teams";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = (await sql`
    SELECT
      COALESCE(SUM(points), 0)::int AS total_points,
      COUNT(*)::int AS total_preds
    FROM quiniela.predictions WHERE user_id = ${user.id}
  `) as { total_points: number; total_preds: number }[];

  const rank = (await sql`
    SELECT pos FROM (
      SELECT user_id, RANK() OVER (ORDER BY SUM(points) DESC) AS pos
      FROM quiniela.predictions GROUP BY user_id
    ) t WHERE user_id = ${user.id}
  `) as { pos: number }[];

  const upcoming = (await sql`
    SELECT id, home_team, away_team, match_date, jornada, venue, city
    FROM quiniela.matches
    WHERE status = 'pending' AND match_date > now()
    ORDER BY match_date ASC
    LIMIT 6
  `) as {
    id: number; home_team: string; away_team: string; match_date: string;
    jornada: number; venue: string | null; city: string | null;
  }[];

  const nextMx = (await sql`
    SELECT home_team, away_team, match_date, venue, city
    FROM quiniela.matches
    WHERE status = 'pending' AND match_date > now()
      AND (home_team = 'México' OR away_team = 'México')
    ORDER BY match_date ASC
    LIMIT 1
  `) as { home_team: string; away_team: string; match_date: string; venue: string | null; city: string | null }[];

  const s = stats[0];

  return (
    <>
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-4">Hola, {user.name} 👋</h1>

        {nextMx[0] && (
          <div className="mb-6 rounded-xl p-4 text-white bg-gradient-to-r from-brand to-brand-light shadow">
            <div className="text-xs uppercase tracking-wide opacity-80">Próximo partido de México 🇲🇽</div>
            <div className="text-lg font-bold mt-1">
              {flag(nextMx[0].home_team)} {nextMx[0].home_team} vs {nextMx[0].away_team} {flag(nextMx[0].away_team)}
            </div>
            <div className="text-sm opacity-90 mt-1">
              {new Date(nextMx[0].match_date).toLocaleString("es-MX", {
                weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit",
              })}
              {nextMx[0].venue ? ` · 📍 ${nextMx[0].venue}, ${nextMx[0].city}` : ""}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card label="Puntos" value={s.total_points} />
          <Card label="Pronósticos" value={s.total_preds} />
          <Card label="Posición" value={rank[0] ? `#${rank[0].pos}` : "—"} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Próximos partidos</h2>
            <Link href="/matches" className="text-sm text-brand">
              Ver todos →
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay partidos próximos.</p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((m) => (
                <li key={m.id} className="py-2 flex items-center justify-between text-sm">
                  <span>
                    <span className="text-gray-400 mr-2">J{m.jornada}</span>
                    {flag(m.home_team)} {m.home_team} vs {m.away_team} {flag(m.away_team)}
                  </span>
                  <span className="text-gray-500">
                    {new Date(m.match_date).toLocaleString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
