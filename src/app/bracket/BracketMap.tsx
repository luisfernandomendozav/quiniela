"use client";

import { useState } from "react";
import { flagSrc } from "@/lib/teams";
import type { Bracket, Slot } from "@/lib/bracket";

const CX = 500;
const CY = 500;
// Radios (de afuera hacia adentro): R[k] = borde exterior del nivel k.
const R = [488, 392, 304, 226, 156, 96];
const CHAMP_R = 96;

// Tamaño de bandera y texto por nivel.
const FLAG_W = [22, 27, 32, 38, 46];
const FONT = [8, 9, 10.5, 12, 13.5];

const GREEN = "#006847";
const GREEN_DARK = "#00543a";
const RED = "#ce1126";

// Punto polar con 0° arriba, sentido horario. Redondeamos a 3 decimales para que
// el path sea idéntico en servidor y cliente (evita warnings de hidratación por
// diferencias de coma flotante).
function pt(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  const round = (v: number) => Math.round(v * 1000) / 1000;
  return [round(CX + r * Math.cos(rad)), round(CY + r * Math.sin(rad))];
}

// Path de sector anular entre los ángulos a0..a1 y radios rIn..rOut.
function sector(rIn: number, rOut: number, a0: number, a1: number) {
  const [x0, y0] = pt(rOut, a0);
  const [x1, y1] = pt(rOut, a1);
  const [x2, y2] = pt(rIn, a1);
  const [x3, y3] = pt(rIn, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return [
    `M ${x0} ${y0}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${x3} ${y3}`,
    "Z",
  ].join(" ");
}

export default function BracketMap({ bracket }: { bracket: Bracket }) {
  const [hover, setHover] = useState<{ x: number; y: number; text: string } | null>(null);
  const { levels, champion, roundNames } = bracket;

  return (
    <div className="relative">
      <div className="overflow-x-auto -mx-3 px-3">
        <svg
          viewBox="0 0 1000 1000"
          className="mx-auto block"
          style={{ width: "100%", maxWidth: 780, minWidth: 320 }}
          role="img"
          aria-label="Cuadro de eliminatorias del Mundial 2026"
        >
          {/* aros guía */}
          {R.map((r) => (
            <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="#e5e7eb" strokeWidth={1} />
          ))}

          {levels.map((slots, level) => {
            const rOut = R[level];
            const rIn = R[level + 1];
            const n = slots.length;
            const step = 360 / n;
            return (
              <g key={level}>
                {slots.map((slot, j) => {
                  const a0 = j * step;
                  const a1 = a0 + step;
                  const mid = a0 + step / 2;
                  const rMid = (rIn + rOut) / 2;
                  const [mx, my] = pt(rMid, mid);
                  const fill = slot
                    ? slot.isMexico
                      ? GREEN
                      : "#ffffff"
                    : "#f9fafb";
                  const stroke = slot?.isMexico ? GREEN_DARK : "#e5e7eb";
                  const src = slot ? flagSrc(slot.flagTeam) : null;
                  const fw = FLAG_W[level];
                  const fh = fw * 0.68;
                  const fs = FONT[level];
                  const textColor = slot?.isMexico ? "#ffffff" : "#374151";
                  return (
                    <g
                      key={j}
                      onMouseEnter={() =>
                        slot &&
                        setHover({ x: mx, y: my, text: `${slot.label} (${slot.code})` })
                      }
                      onMouseLeave={() => setHover(null)}
                      style={{ cursor: slot ? "pointer" : "default" }}
                    >
                      <path d={sector(rIn, rOut, a0 + 0.6, a1 - 0.6)} fill={fill} stroke={stroke} strokeWidth={1} />
                      {src && (
                        <image
                          href={src}
                          x={mx - fw / 2}
                          y={my - fh / 2 - fs * 0.45}
                          width={fw}
                          height={fh}
                          preserveAspectRatio="xMidYMid slice"
                          style={{ pointerEvents: "none" }}
                        />
                      )}
                      {slot && (
                        <text
                          x={mx}
                          y={my + fh / 2 + fs * 0.55}
                          textAnchor="middle"
                          fontSize={fs}
                          fontWeight={slot.isMexico ? 800 : 600}
                          fill={textColor}
                          style={{ pointerEvents: "none" }}
                        >
                          {slot.code}
                        </text>
                      )}
                      {!slot && level >= 1 && (
                        <text
                          x={mx}
                          y={my}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={fs - 1}
                          fill="#d1d5db"
                          style={{ pointerEvents: "none" }}
                        >
                          ?
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Centro: campeón */}
          <circle cx={CX} cy={CY} r={CHAMP_R} fill={champion ? GREEN : "#fff7ed"} stroke={RED} strokeWidth={3} />
          <text x={CX} y={CY - 18} textAnchor="middle" fontSize={42} style={{ pointerEvents: "none" }}>
            🏆
          </text>
          {champion ? (
            <>
              <text x={CX} y={CY + 30} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">
                {champion.code}
              </text>
              <text x={CX} y={CY + 48} textAnchor="middle" fontSize={10} fill="#fff">
                Campeón
              </text>
            </>
          ) : (
            <text x={CX} y={CY + 34} textAnchor="middle" fontSize={12} fontWeight={700} fill="#9a3412">
              Campeón
            </text>
          )}
        </svg>
      </div>

      {/* Tooltip */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-gray-900 text-white text-xs px-2 py-1 shadow-lg -translate-x-1/2 -translate-y-full"
          style={{ left: `${(hover.x / 1000) * 100}%`, top: `${(hover.y / 1000) * 100}%` }}
        >
          {hover.text}
        </div>
      )}

      {/* Leyenda de rondas */}
      <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
        {roundNames.map((name, i) => (
          <span key={name} className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-gray-300" />
            {i === 0 ? "Exterior" : i === roundNames.length - 1 ? "Centro" : ""} {name}
          </span>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-gray-400">
        🇲🇽 El Tri va resaltado en verde · pasa el cursor sobre un equipo para ver su nombre
      </p>
    </div>
  );
}
