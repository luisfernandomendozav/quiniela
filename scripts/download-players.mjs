// Descarga fotos de los jugadores de la Selección Mexicana desde Wikimedia
// Commons (imágenes de licencia libre) usando la API de búsqueda de Wikipedia.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const roster = JSON.parse(
  readFileSync(new URL("../src/data/roster.json", import.meta.url), "utf8")
);

const OUT = new URL("../public/jugadores/", import.meta.url);
mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const UA = { "User-Agent": "QuinielaMundial2026/1.0 (contacto@ejemplo.com)" };

// fetch con reintentos ante 429 (rate limit)
async function fetchRetry(url, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: UA });
    if (res.status === 429) {
      await sleep(2000 * (i + 1));
      continue;
    }
    return res;
  }
  throw new Error("429 persistente");
}

// Busca la miniatura de un jugador en es.wikipedia y, si falla, en en.wikipedia.
async function findThumb(search) {
  for (const lang of ["es", "en"]) {
    const url =
      `https://${lang}.wikipedia.org/w/api.php?action=query&format=json` +
      `&generator=search&gsrsearch=${encodeURIComponent(search)}&gsrlimit=1` +
      `&prop=pageimages&piprop=thumbnail&pithumbsize=600&redirects=1`;
    try {
      const res = await fetchRetry(url);
      const data = await res.json();
      const pages = data?.query?.pages;
      if (!pages) continue;
      const page = Object.values(pages)[0];
      if (page?.thumbnail?.source) return page.thumbnail.source;
    } catch {}
    await sleep(400);
  }
  return null;
}

async function download(slug, src) {
  const ext = src.split("?")[0].toLowerCase().endsWith(".png") ? "png" : "jpg";
  const dest = new URL(`${slug}.${ext}`, OUT);
  const res = await fetchRetry(src);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(dest, buf);
  return `${slug}.${ext}`;
}

const manifest = {};
for (const p of roster) {
  process.stdout.write(`  ${p.name.padEnd(22)} `);
  try {
    const src = await findThumb(p.search);
    if (!src) {
      console.log("✗ sin foto");
      continue;
    }
    const file = await download(p.slug, src);
    manifest[p.slug] = file;
    console.log(`✓ ${file}`);
  } catch (e) {
    console.log(`✗ error: ${e.message}`);
  }
  await sleep(1200); // respeta el rate limit de Wikimedia
}

writeFileSync(new URL("manifest.json", OUT), JSON.stringify(manifest, null, 2));
console.log(`\n🇲🇽 ${Object.keys(manifest).length}/${roster.length} fotos descargadas en public/jugadores/`);
