"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MatchWithPred } from "./page";
import { flag, isMexico } from "@/lib/teams";

export default function MatchList({ matches }: { matches: MatchWithPred[] }) {
  if (matches.length === 0) {
    return <p className="text-gray-500">Aún no hay partidos cargados.</p>;
  }

  // Agrupa por jornada
  const byJornada = matches.reduce<Record<number, MatchWithPred[]>>((acc, m) => {
    (acc[m.jornada] ||= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.keys(byJornada)
        .map(Number)
        .sort((a, b) => a - b)
        .map((j) => (
          <div key={j}>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">Jornada {j}</h2>
            <div className="space-y-3">
              {byJornada[j].map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}

function MatchCard({ match }: { match: MatchWithPred }) {
  const router = useRouter();
  const closed = match.status === "finished" || new Date(match.match_date) <= new Date();
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
      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span>
          {new Date(match.match_date).toLocaleString("es-MX", {
            weekday: "short",
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {match.venue && (
            <span className="ml-2 text-gray-400">
              · 📍 {match.venue}
              {match.city ? `, ${match.city}` : ""}
            </span>
          )}
        </span>
        {match.status === "finished" && (
          <span className="text-brand font-semibold">
            Final: {match.home_score} - {match.away_score}
            {match.points != null && <span className="ml-2">(+{match.points} pts)</span>}
          </span>
        )}
        {!match.status?.includes("finished") && closed && <span>Cerrado</span>}
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 text-right font-medium">
          {match.home_team} <span className="text-lg">{flag(match.home_team)}</span>
        </span>

        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            value={home}
            disabled={closed}
            onChange={(e) => setHome(e.target.value)}
            className="w-12 text-center border rounded-lg py-1 disabled:bg-gray-100"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min={0}
            value={away}
            disabled={closed}
            onChange={(e) => setAway(e.target.value)}
            className="w-12 text-center border rounded-lg py-1 disabled:bg-gray-100"
          />
        </div>

        <span className="flex-1 text-left font-medium">
          <span className="text-lg">{flag(match.away_team)}</span> {match.away_team}
        </span>
      </div>

      {!closed && (
        <div className="flex items-center justify-end gap-3 mt-3">
          {msg && <span className="text-xs text-gray-500">{msg}</span>}
          <button
            onClick={save}
            disabled={saving || home === "" || away === ""}
            className="bg-brand hover:bg-brand-dark text-white text-sm rounded-lg px-4 py-1.5 disabled:opacity-50"
          >
            {saving ? "..." : match.pred_home != null ? "Actualizar" : "Pronosticar"}
          </button>
        </div>
      )}
    </div>
  );
}
