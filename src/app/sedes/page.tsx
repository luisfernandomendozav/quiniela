import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { sql, type Stadium } from "@/lib/db";
import NavBar from "@/components/NavBar";
import PlayersStrip from "@/components/PlayersStrip";

export const dynamic = "force-dynamic";

const FLAG: Record<string, string> = {
  "México": "🇲🇽",
  "Estados Unidos": "🇺🇸",
  "Canadá": "🇨🇦",
};

export default async function SedesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stadiums = (await sql`
    SELECT id, name, city, country, capacity, is_mexico
    FROM quiniela.stadiums
    ORDER BY is_mexico DESC, capacity DESC
  `) as Stadium[];

  return (
    <>
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <PlayersStrip subtitle="Las casas del Tri 🏟️🇲🇽" />
        <h1 className="text-xl font-bold mb-1">Sedes del Mundial 2026</h1>
        <p className="text-sm text-gray-500 mb-4">
          16 estadios en 🇲🇽 México, 🇺🇸 Estados Unidos y 🇨🇦 Canadá. El Tri juega en las tres
          sedes mexicanas.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          {stadiums.map((s) => (
            <div
              key={s.id}
              className={`bg-white rounded-xl border shadow-sm p-4 ${
                s.is_mexico ? "border-brand/40 ring-1 ring-brand/20" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">{s.name}</h2>
                {s.is_mexico && (
                  <span className="text-[10px] uppercase tracking-wide bg-brand text-white rounded-full px-2 py-0.5">
                    Sede El Tri
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {FLAG[s.country] ?? "🏟️"} {s.city}, {s.country}
              </p>
              {s.capacity != null && (
                <p className="text-xs text-gray-400 mt-1">
                  Capacidad: {s.capacity.toLocaleString("es-MX")} espectadores
                </p>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
