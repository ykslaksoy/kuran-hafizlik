#!/usr/bin/env node
/**
 * Ezan Vakti positions-benzeri tablo — yalnızca Fatiha / Mishari (demo).
 *
 * Şema (docs/rakip/ezanvakti.md §5.1):
 *   no, row, startoffset, endoffset, duration, location, length, startMs
 * Zaman: QUL/quran.com kelime segmentleri (çapa) + tecvid ağırlıklı harf dağılımı.
 * Konum: 604 sayfa satır grid'i (kâriden bağımsız).
 *
 * Diğer kâriler: --reciter + segments JSON ile aynı pipeline.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const CHUNK = path.join(ROOT, "dist/_expo/static/js/web/chunk-00-e7db129c6b4d07680bdef6a086abfc55.js");
const SEGMENTS = path.join(ROOT, "dist/assets/timing/segments-s1-s2.json");
const TIMING_JS = path.join(ROOT, "dist/assets/timing/quran-timing.js");
const OUT = path.join(ROOT, "dist/assets/timing/positions-alafasy-fatiha.json");

const code = fs.readFileSync(TIMING_JS, "utf8");
const ctx = {
  window: { addEventListener() {}, fetch: async () => ({ ok: false }) },
  globalThis: {},
  fetch: async () => ({ ok: false }),
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(code, ctx);
const hy = ctx.hyQuranTiming || ctx.window.hyQuranTiming;
if (!hy) {
  console.error("hyQuranTiming load failed");
  process.exit(1);
}

const chunk = fs.readFileSync(CHUNK, "utf8");
const ayahsSrc = chunk.match(/ayahs:(\[\{surah:1[\s\S]*?\}\])(?=,surahHeaders|,bismillah|,page)/);
if (!ayahsSrc) {
  console.error("page-1 ayahs not found");
  process.exit(1);
}
const ayahs = Function("return " + ayahsSrc[1])();
const qul = JSON.parse(fs.readFileSync(SEGMENTS, "utf8")).alafasy.chapters["1"];

function lettersOnLine(ayahList, lineIndex) {
  const letters = [];
  ayahList.forEach((a, ayahIndex) => {
    a.words.forEach((w, wi) => {
      if ((w.lineIndex ?? a.lineIndex) !== lineIndex) return;
      hy.glyphs(w.text).forEach((g) => {
        if (g.skip) return;
        letters.push({ ayahIndex, wordIndex: wi, letterIndex: g.i, g });
      });
    });
  });
  return letters;
}

const lineCache = {};
function offsetsFor(ayahList, lineIndex, ayahIndex, wordIndex, letterIndex) {
  const key = lineIndex;
  if (!lineCache[key]) lineCache[key] = lettersOnLine(ayahList, lineIndex);
  const list = lineCache[key];
  const n = Math.max(1, list.length);
  const i = list.findIndex(
    (x) => x.ayahIndex === ayahIndex && x.wordIndex === wordIndex && x.letterIndex === letterIndex
  );
  const idx = i < 0 ? 0 : i;
  // RTL: ilk harf sağda
  return {
    startoffset: 1 - (idx + 1) / n,
    endoffset: 1 - idx / n,
  };
}

const byAyah = {};
ayahs.forEach((a) => {
  const k = a.surah + ":" + a.ayah;
  if (!byAyah[k]) byAyah[k] = [];
  byAyah[k].push(a);
});

const pages = [];
const ayahsOut = [];

for (let ayah = 1; ayah <= 7; ayah++) {
  const key = "1:" + ayah;
  const parts = byAyah[key] || [];
  const rowQ = qul.find((v) => v.verse_key === key);
  if (!parts.length || !rowQ) {
    console.error("missing", key, "parts", parts.length, "qul", !!rowQ);
    process.exit(1);
  }
  const words = [];
  parts.forEach((p, ayahIndex) => {
    p.words.forEach((w, wi) => {
      words.push({
        text: w.text,
        lineIndex: w.lineIndex ?? p.lineIndex,
        page: 1,
        ayahIndex,
        wordIndex: wi,
      });
    });
  });

  const base = rowQ.from || 0;
  const segs = (rowQ.segments || []).map((s) => [s[0], Math.max(0, s[1] - base), Math.max(0, s[2] - base)]);
  const segments = [];
  let location = 0;
  let no = 0;
  let cum = 0;

  words.forEach((w, wi) => {
    const gs = hy.glyphs(w.text);
    const voiced = hy.voiced(gs);
    const q = segs[wi] || segs[segs.length - 1] || [wi + 1, cum, cum + 400];
    const t0 = q[1];
    const t1 = q[2];
    const dur = Math.max(1, t1 - t0);
    const sum = voiced.reduce((s, g) => s + g.weight, 0) || 1;
    let acc = 0;
    gs.forEach((g) => {
      const loc = location;
      location += g.ch.length;
      if (g.skip) return;
      const slice = (g.weight / sum) * dur;
      const off = offsetsFor(parts, w.lineIndex, w.ayahIndex, w.wordIndex, g.i);
      segments.push({
        no,
        row: w.lineIndex,
        page: 1,
        startoffset: +off.startoffset.toFixed(6),
        endoffset: +off.endoffset.toFixed(6),
        duration: +slice.toFixed(3),
        startMs: +(t0 + acc).toFixed(3),
        location: loc,
        length: g.ch.length,
        ch: g.base,
        wordIndex: wi,
        letterIndex: g.i,
      });
      acc += slice;
      no += 1;
    });
    cum = t1;
  });

  ayahsOut.push({
    surah: 1,
    ayah,
    page: 1,
    text: words.map((w) => w.text).join(" "),
    segments,
  });
}

const out = {
  reciter: "alafasy",
  quranId: 7,
  source: "quran.com/api/v4/chapter_recitations/7/1?segments=true + Medine page-1 line grid + tajweed letter weights",
  schema: "ezanvakti-positions-v1",
  surahs: [1],
  ayahs: ayahsOut,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
const nseg = ayahsOut.reduce((s, a) => s + a.segments.length, 0);
console.log("wrote", OUT);
console.log(
  ayahsOut
    .map((a) => `1:${a.ayah} segs=${a.segments.length} last=${a.segments[a.segments.length - 1].startMs + a.segments[a.segments.length - 1].duration}`)
    .join("\n")
);
console.log("total segments", nseg);
