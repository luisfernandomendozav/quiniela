"use client";

import { useEffect, useRef, useState } from "react";

// Mascota animada: deambula por la parte baja de la pantalla y, cada cierto
// rato, aparece comida que el pet PERSIGUE, alcanza y se come. Al hacerle clic
// suelta una frase. La imagen vive en /public/pet.png (silueta transparente).
const PET_SRC = "/pet.png"; // silueta recortada (fondo transparente)
const W = 106; // ancho px
const H = 110; // alto px (≈ proporción de la silueta)
const SPEED = 55; // velocidad al deambular (px/s)
const CHASE = 135; // velocidad al perseguir comida (px/s)
const FLEE = 80; // la comida huye (px/s)
const BOTTOM = 96; // separación del fondo (deja libre la barra inferior móvil)

// Al hacerle clic es como pegarle: se queja y le salen moretones 😅
const PAIN_PHRASES = ["¡Auch! 😖", "¡Ya bájale! 😵", "¡Me duele! 🤕", "¡No! 😩", "¡Ouch! 💢", "¡Ya wey! 😭"];
const EAT_PHRASES = ["¡Ñam ñam! 🤤", "¡Qué rico! 😋", "¡Mío! 🍴", "¡A comer! 🤩"];
const FOODS = ["🍔", "🌮", "🍕", "🌭", "🍟", "🥤", "🍗", "🌯"];

// Posiciones de los moretones sobre la silueta (fracción de W×H). Van apareciendo
// uno por uno con cada golpe; se curan solos si lo dejas en paz.
const BRUISES: { x: number; y: number; s: number }[] = [
  { x: 0.44, y: 0.20, s: 15 },
  { x: 0.60, y: 0.26, s: 13 },
  { x: 0.34, y: 0.32, s: 17 },
  { x: 0.56, y: 0.42, s: 20 },
  { x: 0.30, y: 0.52, s: 15 },
  { x: 0.68, y: 0.47, s: 14 },
  { x: 0.48, y: 0.63, s: 21 },
  { x: 0.62, y: 0.14, s: 12 },
];
const MAX_BRUISES = BRUISES.length;

export default function Pet() {
  const [x, setX] = useState(40);
  const [dir, setDir] = useState<1 | -1>(1);
  const [shaking, setShaking] = useState(false); // sacudida al pegarle
  const [hits, setHits] = useState(0); // moretones acumulados
  const [eating, setEating] = useState(false);
  const [paused, setPaused] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [hidden, setHidden] = useState(false); // escondido arriba (doble clic)
  const [leaving, setLeaving] = useState(false); // animación de salida

  // Comida que el pet persigue
  const [foodX, setFoodX] = useState(0);
  const [foodEmoji, setFoodEmoji] = useState<string | null>(null);

  const xRef = useRef(x);
  const dirRef = useRef<1 | -1>(dir);
  const pausedRef = useRef(false);
  const foodXRef = useRef(0);
  const foodActiveRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const msgTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    xRef.current = x;
  }, [x]);
  useEffect(() => {
    dirRef.current = dir;
  }, [dir]);
  useEffect(() => {
    pausedRef.current = paused || msg !== null || hidden || leaving;
  }, [paused, msg, hidden, leaving]);

  function maxX() {
    return window.innerWidth - W - 8;
  }

  function spawnFood() {
    const max = maxX();
    const emoji = FOODS[Math.floor(Math.random() * FOODS.length)];
    let fx = Math.random() * (max - 16) + 8;
    // Que aparezca lejos del pet para que haya buena persecución
    if (Math.abs(fx - xRef.current) < 180) fx = xRef.current > max / 2 ? 8 : max;
    foodXRef.current = fx;
    foodActiveRef.current = true;
    setFoodX(fx);
    setFoodEmoji(emoji);
  }

  function eat() {
    foodActiveRef.current = false;
    setFoodEmoji(null);
    setEating(true);
    setTimeout(() => setEating(false), 450);
    const phrase = EAT_PHRASES[Math.floor(Math.random() * EAT_PHRASES.length)];
    setMsg(phrase);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), 1800);
    // siguiente comida en 4-9 s
    if (spawnTimer.current) clearTimeout(spawnTimer.current);
    spawnTimer.current = setTimeout(spawnFood, 4000 + Math.random() * 5000);
  }

  useEffect(() => {
    const step = (t: number) => {
      if (lastRef.current == null) lastRef.current = t;
      const dt = Math.min((t - lastRef.current) / 1000, 0.05);
      lastRef.current = t;
      const max = maxX();

      if (!pausedRef.current) {
        if (foodActiveRef.current) {
          // --- Modo persecución ---
          const px = xRef.current;
          const fx = foodXRef.current;
          const d: 1 | -1 = fx >= px ? 1 : -1;
          if (d !== dirRef.current) {
            dirRef.current = d;
            setDir(d);
          }
          // la comida huye en la misma dirección hasta toparse con el borde
          let nfx = fx + d * FLEE * dt;
          nfx = Math.max(8, Math.min(max, nfx));
          foodXRef.current = nfx;
          setFoodX(nfx);
          // el pet la alcanza (más rápido)
          let npx = px + d * CHASE * dt;
          if (Math.abs(npx - nfx) < 28) {
            npx = nfx;
            eat();
          }
          npx = Math.max(8, Math.min(max, npx));
          xRef.current = npx;
          setX(npx);
        } else {
          // --- Modo deambular ---
          let nx = xRef.current + dirRef.current * SPEED * dt;
          if (nx >= max) {
            nx = max;
            dirRef.current = -1;
            setDir(-1);
          } else if (nx <= 8) {
            nx = 8;
            dirRef.current = 1;
            setDir(1);
          }
          xRef.current = nx;
          setX(nx);
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    // primera comida a los ~3.5 s
    spawnTimer.current = setTimeout(spawnFood, 3500);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (msgTimer.current) clearTimeout(msgTimer.current);
      if (spawnTimer.current) clearTimeout(spawnTimer.current);
    };
  }, []);

  function say(phrase: string, ms = 2600) {
    setMsg(phrase);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(null), ms);
  }

  // Cada clic = un golpe: se sacude, se queja y le sale un moretón más.
  function hitPet() {
    setHits((h) => Math.min(h + 1, MAX_BRUISES));
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
    say(PAIN_PHRASES[Math.floor(Math.random() * PAIN_PHRASES.length)], 1600);
  }

  // Se cura solo: cada 8 s se le quita un moretón si lo dejas en paz.
  useEffect(() => {
    const t = setInterval(() => setHits((h) => (h > 0 ? h - 1 : 0)), 8000);
    return () => clearInterval(t);
  }, []);

  // Otros componentes (p. ej. el modo rápido) pueden hacerlo hablar:
  //   window.dispatchEvent(new CustomEvent("pet:say", { detail: "texto" }))
  useEffect(() => {
    const onSay = (e: Event) => {
      const text = (e as CustomEvent).detail;
      if (typeof text === "string" && !hidden) say(text, 2400);
    };
    window.addEventListener("pet:say", onSay);
    return () => window.removeEventListener("pet:say", onSay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  function hide() {
    // se va para arriba para no estorbar
    setLeaving(true);
    foodActiveRef.current = false;
    setFoodEmoji(null);
    if (spawnTimer.current) clearTimeout(spawnTimer.current);
    if (msgTimer.current) clearTimeout(msgTimer.current);
    setMsg(null);
    setTimeout(() => {
      setHidden(true);
      setLeaving(false);
    }, 480);
  }

  function summon() {
    setHidden(false);
    // vuelve a deambular y a aparecer comida
    if (spawnTimer.current) clearTimeout(spawnTimer.current);
    spawnTimer.current = setTimeout(spawnFood, 3000);
  }

  // Distingue 1 clic (frase) de 2 clics (esconderse)
  function handleClick() {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      hide();
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        hitPet();
      }, 250);
    }
  }

  const bodyAnim = shaking ? "pet-hit" : eating ? "pet-chomp" : "pet-float";

  // Escondido: solo una pestañita para traerlo de vuelta
  if (hidden) {
    return (
      <button
        type="button"
        onClick={summon}
        aria-label="Traer la mascota"
        title="Traer la mascota"
        className="fixed z-40 right-3 bottom-24 grid h-11 w-11 place-items-center rounded-full bg-brand text-white shadow-lg ring-2 ring-white active:scale-90 transition"
      >
        🐾
      </button>
    );
  }

  return (
    <>
      {/* Comida que persigue */}
      {foodEmoji && (
        <div
          className="fixed z-40 pointer-events-none food-bob"
          style={{ left: foodX + W / 2 - 16, bottom: BOTTOM + H * 0.35, fontSize: 30 }}
        >
          {foodEmoji}
        </div>
      )}

      {/* El pet */}
      <div
        className="fixed z-40 select-none"
        style={{
          left: x,
          bottom: BOTTOM,
          width: W,
          transform: leaving ? "translateY(-240px)" : undefined,
          opacity: leaving ? 0 : 1,
          transition: leaving ? "transform .48s ease-in, opacity .48s ease-in" : undefined,
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {msg && (
          <div className="pet-bubble absolute left-1/2 -translate-x-1/2 -top-11 whitespace-nowrap rounded-2xl bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 shadow-lg border border-gray-200">
            {msg}
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 bg-white border-r border-b border-gray-200 rotate-45" />
          </div>
        )}

        <button
          type="button"
          onClick={handleClick}
          aria-label="Mascota de la quiniela (doble clic para esconderla)"
          title="Doble clic para esconderla"
          className="block focus:outline-none"
          style={{ transform: `scaleX(${dir})` }}
        >
          <div className={`pet-body ${bodyAnim}`}>
            {broken ? (
              <div
                className="grid place-items-center rounded-2xl bg-brand text-white shadow-lg ring-2 ring-white"
                style={{ width: W, height: H, fontSize: 34 }}
              >
                🐹
              </div>
            ) : (
              <div className="relative" style={{ width: W, height: H }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={PET_SRC}
                  alt="Mascota"
                  onError={() => setBroken(true)}
                  className="object-contain"
                  style={{
                    width: W,
                    height: H,
                    filter: "drop-shadow(0 3px 4px rgba(0,0,0,0.35))",
                  }}
                  draggable={false}
                />
                {/* Moretones que se acumulan con cada golpe */}
                {BRUISES.slice(0, hits).map((b, i) => (
                  <span
                    key={i}
                    className="pet-bruise absolute rounded-full"
                    style={{
                      left: b.x * W - b.s / 2,
                      top: b.y * H - b.s / 2,
                      width: b.s,
                      height: b.s,
                      background:
                        "radial-gradient(circle, rgba(76,29,149,0.9) 0%, rgba(30,64,175,0.6) 45%, rgba(30,64,175,0) 72%)",
                      filter: "blur(0.7px)",
                      mixBlendMode: "multiply",
                    }}
                  />
                ))}
              </div>
            )}
            {/* sombrita */}
            <div
              className="pet-shadow mx-auto rounded-[50%] bg-black/20 blur-[1px]"
              style={{ width: W * 0.6, height: 6, marginTop: 2 }}
            />
          </div>
        </button>
      </div>
    </>
  );
}
