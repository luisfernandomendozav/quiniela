"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchWithPred } from "./page";
import { isMexico } from "@/lib/teams";
import Flag from "@/components/Flag";

export default function MatchList({
  matches,
  activeJornada,
}: {
  matches: MatchWithPred[];
  activeJornada: number;
}) {
  // Jornadas disponibles (1, 2, 3...) y filtro seleccionado (por defecto la activa)
  const jornadas = Array.from(new Set(matches.map((m) => m.jornada))).sort((a, b) => a - b);
  const [filter, setFilter] = useState<number | "all">(activeJornada);

  if (matches.length === 0) {
    return <p className="text-gray-500">Aún no hay partidos cargados.</p>;
  }

  const visible = filter === "all" ? matches : matches.filter((m) => m.jornada === filter);

  // Agrupa por grupo (A-L)
  const byGroup = visible.reduce<Record<string, MatchWithPred[]>>((acc, m) => {
    const g = m.group_name ?? "?";
    (acc[g] ||= []).push(m);
    return acc;
  }, {});

  const tab = (value: number | "all", label: string) => {
    const isActive = value === activeJornada;
    const selected = filter === value;
    return (
      <button
        key={String(value)}
        onClick={() => setFilter(value)}
        className={`relative px-3 py-1.5 rounded-full text-sm font-medium border transition ${
          selected
            ? "bg-brand text-white border-brand"
            : "bg-white text-gray-600 border-gray-200 hover:border-brand"
        }`}
      >
        {label}
        {isActive && (
          <span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-mxred ring-2 ring-white"
            title="Jornada activa"
          />
        )}
      </button>
    );
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {tab("all", "Todas")}
        {jornadas.map((j) => tab(j, `Jornada ${j}`))}
        <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-mxred inline-block" /> jornada activa
        </span>
      </div>

      <div className="space-y-8">
      {Object.keys(byGroup).length === 0 && (
        <p className="text-gray-500">No hay partidos en esta jornada.</p>
      )}
      {Object.keys(byGroup)
        .sort()
        .map((g) => {
          const games = byGroup[g];
          const hasMexico = games.some(
            (m) => isMexico(m.home_team) || isMexico(m.away_team)
          );
          // Equipos del grupo (orden de aparición)
          const teams = Array.from(
            new Set(games.flatMap((m) => [m.home_team, m.away_team]))
          );
          return (
            <section key={g} id={`grupo-${g}`}>
              <div
                className={`flex items-center gap-2 mb-3 pb-2 border-b ${
                  hasMexico ? "border-brand" : "border-gray-200"
                }`}
              >
                <h2
                  className={`text-lg font-extrabold ${
                    hasMexico ? "text-brand" : "text-gray-700"
                  }`}
                >
                  Grupo {g}
                </h2>
                {hasMexico && (
                  <span className="text-[10px] uppercase tracking-wide bg-brand text-white rounded-full px-2 py-0.5">
                    El Tri 🇲🇽
                  </span>
                )}
                <span className="ml-auto flex items-center gap-1">
                  {teams.map((t) => (
                    <Flag key={t} team={t} className="h-3.5 w-5" />
                  ))}
                </span>
              </div>
              <div className="space-y-3">
                {games.map((m) => (
                  <MatchCard key={m.id} match={m} activeJornada={activeJornada} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}

function MatchCard({
  match,
  activeJornada,
}: {
  match: MatchWithPred;
  activeJornada: number;
}) {
  const router = useRouter();
  const jornadaOpen = match.jornada === activeJornada;
  const started = match.status === "finished" || new Date(match.match_date) <= new Date();
  const closed = !jornadaOpen || started;
  const [home, setHome] = useState(match.pred_home?.toString() ?? "");
  const [away, setAway] = useState(match.pred_away?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const mexicoMatch = isMexico(match.home_team) || isMexico(match.away_team);

  async function save() {
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, predHome: Number(home), predAway: Number(away) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMsg(data.error || "Error");
      return;
    }
    setMsg("✓ Guardado");
    router.refresh();
  }

  return (
    <div
      className={`bg-white rounded-xl border shadow-sm p-4 ${
        mexicoMatch ? "border-brand/40 ring-1 ring-brand/20" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 text-xs text-gray-400 mb-3">
        <span className="min-w-0">
          <span className="font-semibold text-gray-500 mr-2">J{match.jornada}</span>
          {new Date(match.match_date).toLocaleString("es-MX", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {match.venue && (
            <span className="block text-gray-400 mt-0.5">
              📍 {match.venue}
              {match.city ? `, ${match.city}` : ""}
            </span>
          )}
        </span>
        {match.status === "finished" && (
          <span className="text-brand font-semibold whitespace-nowrap shrink-0">
            Final {match.home_score}-{match.away_score}
            {match.points != null && <span className="ml-1">(+{match.points})</span>}
          </span>
        )}
        {match.status !== "finished" && closed && (
          <span className="text-gray-400 whitespace-nowrap shrink-0">
            {!jornadaOpen
              ? match.jornada < activeJornada
                ? "🔒 Cerrada"
                : "🔒 No abierta"
              : "🔒 Cerrado"}
          </span>
        )}
      </div>

      {/* Cada equipo en su fila: cómodo de tocar en móvil */}
      <div className="space-y-2">
        <TeamRow
          team={match.home_team}
          value={home}
          onChange={setHome}
          disabled={closed}
          finalScore={match.status === "finished" ? match.home_score : null}
        />
        <TeamRow
          team={match.away_team}
          value={away}
          onChange={setAway}
          disabled={closed}
          finalScore={match.status === "finished" ? match.away_score : null}
        />
      </div>

      {!closed && (
        <div className="flex items-center justify-end gap-3 mt-3">
          {msg && <span className="text-xs text-gray-500">{msg}</span>}
          <button
            onClick={save}
            disabled={saving || home === "" || away === ""}
            className="bg-brand hover:bg-brand-dark active:bg-brand-dark text-white font-medium rounded-lg px-5 py-2.5 min-h-[44px] disabled:opacity-50 w-full sm:w-auto"
          >
            {saving ? "Guardando..." : match.pred_home != null ? "Actualizar pronóstico" : "Pronosticar"}
          </button>
        </div>
      )}
    </div>
  );
}

function TeamRow({
  team,
  value,
  onChange,
  disabled,
  finalScore,
}: {
  team: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  finalScore: number | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <Flag team={team} className="h-5 w-7 shrink-0" />
      <span className="flex-1 min-w-0 font-medium truncate">{team}</span>
      {finalScore != null ? (
        <span className="w-12 text-center text-lg font-bold text-gray-700">{finalScore}</span>
      ) : (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="–"
          className="w-14 h-11 text-center text-lg border rounded-lg disabled:bg-gray-100 disabled:text-gray-400 focus:border-brand focus:ring-1 focus:ring-brand outline-none"
        />
      )}
    </div>
  );
}
