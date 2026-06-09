import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";
import { PLAYERS, POSITIONS, photo } from "@/lib/players";

export const dynamic = "force-dynamic";

export default async function PlantillaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <NavBar user={user} />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="rounded-2xl bg-gradient-to-r from-brand via-brand-dark to-mxred text-white p-6 mb-6 shadow">
          <h1 className="text-2xl font-extrabold">Plantilla de México 🇲🇽</h1>
          <p className="text-sm opacity-90 mt-1">
            Los jugadores del Tri rumbo al Mundial 2026. Fotos de Wikimedia Commons.
          </p>
        </div>

        {POSITIONS.map((pos) => {
          const group = PLAYERS.filter((p) => p.pos === pos);
          if (!group.length) return null;
          return (
            <section key={pos} className="mb-8">
              <h2 className="text-sm font-bold text-brand uppercase tracking-wide mb-3">
                {pos}s
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {group.map((p) => {
                  const src = photo(p.slug);
                  return (
                    <div
                      key={p.slug}
                      className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="relative aspect-[4/5] bg-gradient-to-b from-gray-100 to-gray-200">
                        {src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={src}
                            alt={p.name}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-4xl text-gray-400">
                            ⚽
                          </div>
                        )}
                        <span className="absolute top-2 left-2 bg-brand text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center shadow">
                          {p.number}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="font-semibold leading-tight">{p.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.club}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
