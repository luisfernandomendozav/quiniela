import Link from "next/link";
import { PLAYERS, STARS, photo } from "@/lib/players";

// Banner decorativo con fotos de jugadores estrella del Tri.
// Se usa como encabezado elegante en varias páginas.
export default function PlayersStrip({
  title = "Selección Mexicana",
  subtitle = "¡Vamos México! 🇲🇽",
}: {
  title?: string;
  subtitle?: string;
}) {
  const stars = STARS.map((slug) => PLAYERS.find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .map((p) => ({ ...p, src: photo(p.slug) }))
    .filter((p) => p.src);

  return (
    <Link
      href="/plantilla"
      className="block rounded-2xl bg-gradient-to-r from-brand via-brand-dark to-mxred p-4 text-white shadow-md mb-6 hover:brightness-105 transition"
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide opacity-80">{title}</div>
          <div className="font-extrabold text-lg leading-tight">{subtitle}</div>
          <div className="text-xs opacity-80 mt-0.5">Ver plantilla completa →</div>
        </div>
        <div className="flex -space-x-3 ml-auto shrink-0">
          {stars.map((p) => (
            <img
              key={p.slug}
              src={p.src!}
              alt={p.name}
              title={p.name}
              loading="lazy"
              className="w-12 h-12 rounded-full object-cover border-2 border-white bg-white/20"
            />
          ))}
        </div>
      </div>
    </Link>
  );
}
