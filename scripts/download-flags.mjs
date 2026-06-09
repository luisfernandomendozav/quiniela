// Descarga las banderas de los 48 países del Mundial 2026 desde flagcdn.com
// (imágenes libres) y las guarda en public/banderas/<codigo>.png
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const codes = JSON.parse(
  readFileSync(new URL("../src/data/flag-codes.json", import.meta.url), "utf8")
);

const OUT = new URL("../public/banderas/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(code) {
  const url = `https://flagcdn.com/w320/${code}.png`;
  const res = await fetch(url, { headers: { "User-Agent": "QuinielaMundial2026/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 60) throw new Error("imagen vacía");
  writeFileSync(new URL(`${code}.png`, OUT), buf);
}

let ok = 0;
const unique = [...new Set(Object.values(codes))];
for (const code of unique) {
  process.stdout.write(`  ${code.padEnd(8)} `);
  try {
    await download(code);
    ok++;
    console.log("✓");
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }
  await sleep(200);
}
console.log(`\n🏳️ ${ok}/${unique.length} banderas descargadas en public/banderas/`);
