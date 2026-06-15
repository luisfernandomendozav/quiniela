import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PlayersStrip from "@/components/PlayersStrip";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const rows = (await sql`
    SELECT u.id, u.name,
           COALESCE(SUM(p.points), 0)::int AS points,
           COUNT(p.id)::int AS preds,
           COALESCE(SUM(CASE WHEN p.points = 2 THEN 1 ELSE 0 END), 0)::int AS exactos
    FROM quiniela.users u
    LEFT JOIN quiniela.predictions p ON p.user_id = u.id
    GROUP BY u.id, u.name
    ORDER BY points DESC, exactos DESC, u.name ASC
  `) as { id: number; name: string; points: number; preds: number; exactos: number }[];

  return (
    <>
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 pt-6 pb-24 md:pb-8">
        <PlayersStrip subtitle="¿Quién manda en la quiniela? 🏆" />
        <h1 className="text-xl font-bold mb-4">Tabla de posiciones</h1>
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="text-left px-3 sm:px-4 py-2.5 w-10">#</th>
                <th className="text-left px-2 sm:px-4 py-2.5">Jugador</th>
                <th className="text-center px-2 py-2.5 hidden sm:table-cell">Pron.</th>
                <th className="text-center px-2 py-2.5 hidden sm:table-cell">Exactos</th>
                <th className="text-right px-3 sm:px-4 py-2.5">Puntos</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, i) => (
                <tr key={r.id} className={r.id === user.id ? "bg-green-50" : ""}>
                  <td className="px-3 sm:px-4 py-3 font-semibold text-gray-400">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                  </td>
                  <td className="px-2 sm:px-4 py-3 font-medium">
                    <span className="truncate inline-block max-w-[55vw] sm:max-w-none align-middle">
                      {r.name}
                    </span>
                    {r.id === user.id && <span className="text-brand text-xs ml-1">(tú)</span>}
                    {/* En móvil, las estadísticas secundarias van debajo del nombre */}
                    <span className="block sm:hidden text-[11px] text-gray-400 font-normal mt-0.5">
                      {r.preds} pron. · {r.exactos} exactos
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center text-gray-500 hidden sm:table-cell">{r.preds}</td>
                  <td className="px-2 py-3 text-center text-gray-500 hidden sm:table-cell">{r.exactos}</td>
                  <td className="px-3 sm:px-4 py-3 text-right font-bold text-brand text-base">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Puntuación: resultado exacto = 2 pts · acertar ganador/empate = 1 pt
        </p>
      </main>
    </>
  );
}
