"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchWithPred } from "./page";
import { isMexico } from "@/lib/teams";
import Flag from "@/components/Flag";

// Modo rápido estilo TikTok: una tarjeta a pantalla completa por partido,
// se avanza deslizando hacia arriba (scroll-snap vertical).
export default function SwipeMode({
  matches,
  onClose,
}: {
  matches: MatchWithPred[];
  onClose: () => void;
}) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [savedIds, setSavedIds] = useState<Set<number>>(
    () => new Set(matches.filter((m) => m.pred_home != null).map((m) => m.id))
  );

  const total = matches.length;

  // Bloquea el scroll de la página mientras el modo está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    setIndex(Math.min(total, Math.round(el.scrollTop / el.clientHeight)));
  }

  function scrollToNext(i: number) {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: (i + 1) * el.clientHeight, behavior: "smooth" });
  }

  function close() {
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col">
      {/* Encabezado: progreso + cerrar */}
      <div className="absolute top-0 inset-x-0 z-10">
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-brand-light transition-all duration-300"
            style={{ width: `${(Math.min(index, total) / total) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold text-white/70">
            {index < total ? `${index + 1} / ${total}` : "🎉"}
          </span>
          <button
            onClick={close}
            aria-label="Cerrar"
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-xl leading-none"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tarjetas con snap vertical */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto snap-y snap-mandatory overscroll-contain"
      >
        {matches.map((m, i) => (
          <SwipeCard
            key={m.id}
            match={m}
            showHint={i === 0 && index === 0}
            saved={savedIds.has(m.id)}
            onSaved={() => {
              setSavedIds((prev) => new Set(prev).add(m.id));
              scrollToNext(i);
            }}
          />
        ))}

        {/* Tarjeta final */}
        <div className="h-full snap-start flex flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="text-6xl">{savedIds.size === total ? "🎉" : "👀"}</span>
          <h2 className="text-2xl font-extrabold">
            {savedIds.size === total ? "¡Jornada completa!" : "Casi listo"}
          </h2>
          <p className="text-white/60">
            Guardaste {savedIds.size} de {total} pronósticos.
          </p>
          <button
            onClick={close}
            className="mt-4 bg-brand hover:bg-brand-dark text-white font-semibold rounded-full px-8 py-3"
          >
            {savedIds.size === total ? "Cerrar" : "Salir de todos modos"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SwipeCard({
  match,
  saved,
  showHint,
  onSaved,
}: {
  match: MatchWithPred;
  saved: boolean;
  showHint: boolean;
  onSaved: () => void;
}) {
  const [home, setHome] = useState(match.pred_home ?? 0);
  const [away, setAway] = useState(match.pred_away ?? 0);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [err, setErr] = useState("");
  const mexicoMatch = isMexico(match.home_team) || isMexico(match.away_team);

  async function save() {
    setSaving(true);
    setErr("");
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, predHome: home, predAway: away }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data.error || "Error al guardar");
      return;
    }
    setJustSaved(true);
    // Pequeña pausa para ver la confirmación antes de pasar al siguiente
    setTimeout(onSaved, 400);
  }

  return (
    <div
      className={`h-full snap-start flex flex-col items-center justify-center gap-6 px-6 relative bg-gradient-to-b ${
        mexicoMatch
          ? "from-brand-dark/60 via-gray-950 to-gray-950"
          : "from-gray-900 via-gray-950 to-gray-950"
      }`}
    >
      <div className="text-center text-xs text-white/50">
        <span className="font-semibold text-white/70">
          J{match.jornada}
          {match.group_name ? ` · Grupo ${match.group_name}` : ""}
        </span>
        <br />
        {new Date(match.match_date).toLocaleString("es-MX", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {match.venue && <span className="block mt-0.5">📍 {match.venue}</span>}
      </div>

      <TeamScore team={match.home_team} value={home} onChange={setHome} />
      <span className="text-white/30 font-bold text-sm tracking-widest">VS</span>
      <TeamScore team={match.away_team} value={away} onChange={setAway} />

      <div className="h-14 flex flex-col items-center justify-center">
        <button
          onClick={save}
          disabled={saving}
          className={`font-bold rounded-full px-10 py-3.5 text-base transition disabled:opacity-60 ${
            justSaved
              ? "bg-brand-light text-white"
              : "bg-white text-gray-900 active:scale-95"
          }`}
        >
          {justSaved
            ? "✓ Guardado"
            : saving
              ? "Guardando..."
              : saved
                ? "Actualizar"
                : "Guardar y seguir"}
        </button>
        {err && <span className="text-mxred text-xs mt-1.5">{err}</span>}
      </div>

      {showHint && (
        <span className="absolute bottom-6 inset-x-0 text-center text-white/40 text-xs animate-bounce">
          Desliza hacia arriba para el siguiente ↑
        </span>
      )}
      {saved && !justSaved && (
        <span className="absolute top-16 right-4 text-[10px] uppercase tracking-wide bg-brand/30 text-brand-light rounded-full px-2 py-0.5">
          Ya pronosticado
        </span>
      )}
    </div>
  );
}

function TeamScore({
  team,
  value,
  onChange,
}: {
  team: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="w-full max-w-xs flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <Flag team={team} className="h-8 w-12 rounded shadow" />
        <span className="text-xl font-extrabold">{team}</span>
      </div>
      <div className="flex items-center gap-6">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Menos goles para ${team}`}
          className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-3xl font-bold transition"
        >
          −
        </button>
        <span className="text-6xl font-black tabular-nums w-20 text-center">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          aria-label={`Más goles para ${team}`}
          className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-3xl font-bold transition"
        >
          +
        </button>
      </div>
    </div>
  );
}
