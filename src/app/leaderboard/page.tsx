import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import NavBar from "@/components/NavBar";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = (await sql`
    SELECT u.id, u.name,
           COALESCE(SUM(p.points), 0)::int AS points,
           COUNT(p.id)::int AS preds,
           COALESCE(SUM(CASE WHEN p.points = 3 THEN 1 ELSE 0 END), 0)::int AS exactos
    FROM quiniela.users u
    LEFT JOIN quiniela.predictions p ON p.user_id = u.id
    GROUP BY u.id, u.name
    ORDER BY points DESC, exactos DESC, u.name ASC
  `) as { id: number; name: string; points: number; preds: number; exactos: number }[];

  return (
    <>
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold mb-4">Tabla de posiciones</h1>
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-4 py-2 w-10">#</th>
                <th className="text-left px-4 py-2">Jugador</th>
                <th className="text-center px-2 py-2">Pron.</th>
                <th className="text-center px-2 py-2">Exactos</th>
                <th className="text-right px-4 py-2">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, i) => (
                <tr key={r.id} className={r.id === user.id ? "bg-green-50" : ""}>
                  <td className="px-4 py-2 font-semibold text-gray-400">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td className="px-4 py-2 font-medium">
                    {r.name}
                    {r.id === user.id && <span className="text-brand text-xs ml-1">(tú)</span>}
                  </td>
                  <td className="px-2 py-2 text-center text-gray-500">{r.preds}</td>
                  <td className="px-2 py-2 text-center text-gray-500">{r.exactos}</td>
                  <td className="px-4 py-2 text-right font-bold text-brand">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Puntuación: resultado exacto = 3 pts · acertar ganador/empate = 1 pt
        </p>
      </main>
    </>
  );
}
