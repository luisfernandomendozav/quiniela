"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Match } from "@/lib/db";

export default function AdminPanel({
  matches,
  activeJornada,
  jornadas,
  predictionsLocked,
}: {
  matches: Match[];
  activeJornada: number;
  jornadas: number[];
  predictionsLocked: boolean;
}) {
  const router = useRouter();
  const [jornada, setJornada] = useState("1");
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [date, setDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");
  const [savingJornada, setSavingJornada] = useState(false);
  const [savingLock, setSavingLock] = useState(false);

  async function changeActiveJornada(n: number) {
    setSavingJornada(true);
    await fetch("/api/settings/active-jornada", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jornada: n }),
    });
    setSavingJornada(false);
    router.refresh();
  }

  async function toggleLock() {
    setSavingLock(true);
    await fetch("/api/settings/predictions-lock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked: !predictionsLocked }),
    });
    setSavingLock(false);
    router.refresh();
  }

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setCreating(true);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jornada: Number(jornada),
        homeTeam: home,
        awayTeam: away,
        matchDate: new Date(date).toISOString(),
      }),
    });
    setCreating(false);
    if (!res.ok) {
      const d = await res.json();
      setErr(d.error || "Error");
      return;
    }
    setHome("");
    setAway("");
    setDate("");
    router.refresh();
  }

  async function deleteMatch(id: number) {
    if (!confirm("¿Eliminar este partido y sus pronósticos?")) return;
    await fetch("/api/matches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Candado global de pronósticos */}
      <section
        className={`rounded-xl shadow-sm p-4 border ${
          predictionsLocked
            ? "bg-mxred/10 border-mxred/40"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-semibold flex items-center gap-2">
              {predictionsLocked ? "🔒" : "🔓"} Bloquear pronósticos
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {predictionsLocked
                ? "Bloqueado: nadie puede crear ni editar pronósticos en ninguna jornada."
                : "Abierto: los jugadores pueden pronosticar la jornada activa con normalidad."}
            </p>
          </div>
          <button
            onClick={toggleLock}
            disabled={savingLock}
            role="switch"
            aria-checked={predictionsLocked}
            className={`relative shrink-0 w-14 h-8 rounded-full transition disabled:opacity-60 ${
              predictionsLocked ? "bg-mxred" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                predictionsLocked ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>
      </section>

      {/* Jornada activa */}
      <section className="bg-gradient-to-r from-brand to-brand-light text-white rounded-xl shadow-sm p-4">
        <h2 className="font-semibold mb-1">Jornada activa</h2>
        <p className="text-sm opacity-90 mb-3">
          Solo la jornada activa está abierta para que los jugadores pronostiquen. Las
          anteriores y futuras quedan bloqueadas.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {jornadas.map((n) => (
            <button
              key={n}
              onClick={() => changeActiveJornada(n)}
              disabled={savingJornada}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition disabled:opacity-60 ${
                n === activeJornada
                  ? "bg-white text-brand border-white"
                  : "bg-white/10 text-white border-white/40 hover:bg-white/20"
              }`}
            >
              Jornada {n}
              {n === activeJornada && " ✓"}
            </button>
          ))}
          {jornadas.length === 0 && (
            <span className="text-sm opacity-90">Crea partidos para habilitar jornadas.</span>
          )}
        </div>
      </section>

      {/* Crear partido */}
      <section className="bg-white rounded-xl border shadow-sm p-4">
        <h2 className="font-semibold mb-3">Nuevo partido</h2>
        <form onSubmit={createMatch} className="grid sm:grid-cols-5 gap-2 items-end">
          <label className="text-sm">
            <span className="text-gray-500 text-xs">Jornada</span>
            <input
              type="number"
              min={1}
              value={jornada}
              onChange={(e) => setJornada(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="text-gray-500 text-xs">Local</span>
            <input
              value={home}
              onChange={(e) => setHome(e.target.value)}
              required
              className="w-full border rounded-lg px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="text-gray-500 text-xs">Visitante</span>
            <input
              value={away}
              onChange={(e) => setAway(e.target.value)}
              required
              className="w-full border rounded-lg px-2 py-1.5"
            />
          </label>
          <label className="text-sm">
            <span className="text-gray-500 text-xs">Fecha y hora</span>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border rounded-lg px-2 py-1.5"
            />
          </label>
          <button
            disabled={creating}
            className="bg-brand hover:bg-brand-dark text-white rounded-lg py-2 disabled:opacity-50"
          >
            {creating ? "..." : "Agregar"}
          </button>
        </form>
        {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
      </section>

      {/* Lista de partidos / registrar resultado */}
      <section>
        <h2 className="font-semibold mb-3">Partidos ({matches.length})</h2>
        <div className="space-y-3">
          {matches.map((m) => (
            <ResultRow key={m.id} match={m} onDelete={() => deleteMatch(m.id)} />
          ))}
          {matches.length === 0 && <p className="text-gray-500 text-sm">No hay partidos.</p>}
        </div>
      </section>
    </div>
  );
}

function ResultRow({ match, onDelete }: { match: Match; onDelete: () => void }) {
  const router = useRouter();
  const [hs, setHs] = useState(match.home_score?.toString() ?? "");
  const [as, setAs] = useState(match.away_score?.toString() ?? "");
  const [penWinner, setPenWinner] = useState<"home" | "away" | null>(match.pen_winner);
  const [saving, setSaving] = useState(false);

  // En eliminatorias (sin grupo) un empate se define por penales.
  const isKnockout = match.group_name == null;
  const isDraw = hs !== "" && as !== "" && Number(hs) === Number(as);
  const needsPen = isKnockout && isDraw;

  async function saveResult() {
    setSaving(true);
    await fetch(`/api/matches/${match.id}/result`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeScore: Number(hs),
        awayScore: Number(as),
        penWinner: needsPen ? penWinner : null,
      }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm p-3 flex flex-wrap items-center gap-3">
      <span className="text-xs text-gray-400 w-10">J{match.jornada}</span>
      <span className="flex-1 min-w-[180px] text-sm font-medium">
        {match.home_team} vs {match.away_team}
      </span>
      <span className="text-xs text-gray-400">
        {new Date(match.match_date).toLocaleString("es-MX", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          value={hs}
          onChange={(e) => setHs(e.target.value)}
          className="w-12 text-center border rounded-lg py-1"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          min={0}
          value={as}
          onChange={(e) => setAs(e.target.value)}
          className="w-12 text-center border rounded-lg py-1"
        />
      </div>
      <button
        onClick={saveResult}
        disabled={saving || hs === "" || as === "" || (needsPen && !penWinner)}
        className="bg-brand hover:bg-brand-dark text-white text-sm rounded-lg px-3 py-1.5 disabled:opacity-50"
      >
        {saving ? "..." : "Resultado"}
      </button>
      {match.status === "finished" && <span className="text-xs text-brand">✓ Final</span>}
      <button onClick={onDelete} className="text-red-500 text-sm hover:underline">
        Eliminar
      </button>

      {/* Empate en eliminatoria → ¿quién pasó en penales? */}
      {needsPen && (
        <div className="basis-full flex flex-wrap items-center gap-2 mt-1 pt-2 border-t border-gray-100">
          <span className="text-xs text-gray-500">🥅 Penales — pasó:</span>
          {(["home", "away"] as const).map((side) => {
            const team = side === "home" ? match.home_team : match.away_team;
            const active = penWinner === side;
            return (
              <button
                key={side}
                type="button"
                onClick={() => setPenWinner(side)}
                className={`text-xs rounded-full px-3 py-1 border transition ${
                  active
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-gray-600 border-gray-300 hover:border-brand"
                }`}
              >
                {team}
              </button>
            );
          })}
          {!penWinner && <span className="text-xs text-mxred">elige quién avanzó</span>}
        </div>
      )}
    </div>
  );
}
