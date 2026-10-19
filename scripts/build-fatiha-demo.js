#!/usr/bin/env node
/**
 * Fatiha (Mişari) demo tabloları.
 *
 * 1) Hafızyol hizalama (varsayılan, harf): everyayah Alafasy MP3 PCM
 *    + QUL kelime çapası + tecvid ağırlığı + enerji vadisi.
 * 2) quran.com / QUL (kıyas, kelime→harf): hazır segment + aynı harf bölüşümü.
 *
 * Bakara / Amme üretilmez. MP3 commit edilmez.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CHUNK = path.join(ROOT, "dist/_expo/static/js/web/chunk-00-e7db129c6b4d07680bdef6a086abfc55.js");
const SEGMENTS_IN = path.join(ROOT, "dist/assets/timing/segments-s1-s2.json");
const TIMING_JS = path.join(ROOT, "dist/assets/timing/quran-timing.js");
const OUT_DIR = path.join(ROOT, "dist/assets/timing");
const AUDIO_DIR = process.env.FATIHA_AUDIO || "/tmp/fatiha-audio";
const EVERYAYAH = "https://everyayah.com/data/Alafasy_128kbps";

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

function loadQulFatiha() {
  if (fs.existsSync(SEGMENTS_IN)) {
    const all = JSON.parse(fs.readFileSync(SEGMENTS_IN, "utf8"));
    return all.alafasy.chapters["1"];
  }
  const raw = execFileSync(
    "curl",
    ["-fsSL", "https://api.quran.com/api/v4/chapter_recitations/7/1?segments=true"],
    { encoding: "utf8", maxBuffer: 2e6 }
  );
  const d = JSON.parse(raw);
  return (d.audio_file.timestamps || []).map((v) => ({
    verse_key: v.verse_key,
    from: Number(v.timestamp_from) || 0,
    to: Number(v.timestamp_to) || 0,
    segments: v.segments || [],
  }));
}

const qul = loadQulFatiha();

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
  if (!lineCache[lineIndex]) lineCache[lineIndex] = lettersOnLine(ayahList, lineIndex);
  const list = lineCache[lineIndex];
  const n = Math.max(1, list.length);
  const i = list.findIndex(
    (x) => x.ayahIndex === ayahIndex && x.wordIndex === wordIndex && x.letterIndex === letterIndex
  );
  const idx = i < 0 ? 0 : i;
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

function ayahWords(ayah) {
  const parts = byAyah["1:" + ayah] || [];
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
  return { parts, words };
}

function ayahRelative(row) {
  const base = row.from || 0;
  return (row.segments || []).map((s) => [
    s[0],
    Math.max(0, s[1] - base),
    Math.max(0, s[2] - base),
  ]);
}

function downloadMp3(ayah) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const name = `001${String(ayah).padStart(3, "0")}.mp3`;
  const dest = path.join(AUDIO_DIR, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return dest;
  execFileSync("curl", ["-fsSL", "-o", dest, `${EVERYAYAH}/${name}`], { stdio: "pipe" });
  return dest;
}

function decodeRms(mp3Path, hopMs = 10) {
  const probe = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3Path],
    { encoding: "utf8" }
  );
  const fileMs = Number(probe.trim()) * 1000;
  const raw = execFileSync(
    "ffmpeg",
    ["-v", "error", "-i", mp3Path, "-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1", "-ar", "16000", "pipe:1"],
    { maxBuffer: 20e6 }
  );
  const samples = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
  const sr = 16000;
  const hop = Math.round((sr * hopMs) / 1000);
  const frames = [];
  for (let i = 0; i + hop <= samples.length; i += hop) {
    let acc = 0;
    for (let j = 0; j < hop; j++) {
      const x = samples[i + j] / 32768;
      acc += x * x;
    }
    frames.push(Math.sqrt(acc / hop));
  }
  const pcmMs = (samples.length / sr) * 1000;
  return { frames, hopMs, durationMs: Number.isFinite(fileMs) && fileMs > 0 ? fileMs : pcmMs, pcmMs };
}

function speechBounds(rms) {
  const { frames, hopMs, durationMs } = rms;
  const sorted = frames.slice().sort((a, b) => a - b);
  const noise = sorted[Math.floor(sorted.length * 0.12)] || 0.001;
  const peak = sorted[sorted.length - 1] || 0.01;
  const thr = Math.max(0.018, Math.min(noise * 5, peak * 0.12));
  let start = 0;
  let end = frames.length - 1;
  while (start < frames.length && frames[start] < thr) start += 1;
  while (end > start && frames[end] < thr) end -= 1;
  return {
    startMs: Math.max(0, start * hopMs - 15),
    // HTMLAudio currentTime uses container duration; keep the last letter on through the tail.
    endMs: Math.min(durationMs, Math.max((end + 1) * hopMs + 25, durationMs - 70)),
    thr,
  };
}

function valleyNear(rms, tMs, windowMs, lo, hi) {
  const { frames, hopMs } = rms;
  const i0 = Math.max(1, Math.round((Math.max(lo, tMs - windowMs)) / hopMs));
  const i1 = Math.min(frames.length - 2, Math.round((Math.min(hi, tMs + windowMs)) / hopMs));
  let best = Math.round(tMs / hopMs);
  let val = Infinity;
  for (let i = i0; i <= i1; i++) {
    const sm = frames[i - 1] + frames[i] * 1.4 + frames[i + 1];
    if (sm < val) {
      val = sm;
      best = i;
    }
  }
  return Math.max(lo, Math.min(hi, best * hopMs));
}

function mapQulWords(row, speech) {
  const segs = ayahRelative(row);
  if (!segs.length) return [];
  const q0 = segs[0][1];
  const q1 = segs[segs.length - 1][2];
  const qDur = Math.max(1, q1 - q0);
  const sDur = Math.max(1, speech.endMs - speech.startMs);
  const scale = sDur / qDur;
  return segs.map((s) => {
    const t0 = speech.startMs + (s[1] - q0) * scale;
    const t1 = speech.startMs + (s[2] - q0) * scale;
    return { word1: s[0], t0, t1 };
  });
}

function refineWordWindows(mapped, rms, speech) {
  if (!mapped.length) return [];
  const out = mapped.map((w) => ({ ...w }));
  out[0].t0 = speech.startMs;
  out[out.length - 1].t1 = speech.endMs;
  for (let i = 1; i < out.length; i++) {
    const lo = out[i - 1].t0 + 40;
    const hi = (out[i].t1 || speech.endMs) - 40;
    const guess = (out[i - 1].t1 + out[i].t0) / 2;
    const v = valleyNear(rms, guess, 80, lo, hi);
    out[i - 1].t1 = v;
    out[i].t0 = v;
  }
  return out;
}

function letterWindows(word, t0, t1, rms) {
  const gs = hy.glyphs(word.text);
  const voiced = hy.voiced(gs);
  const dur = Math.max(1, t1 - t0);
  const sum = voiced.reduce((s, g) => s + g.weight, 0) || 1;
  const raw = [];
  let acc = 0;
  gs.forEach((g) => {
    if (g.skip) return;
    const slice = (g.weight / sum) * dur;
    raw.push({ g, t0: t0 + acc, t1: t0 + acc + slice });
    acc += slice;
  });
  if (raw.length) {
    raw[0].t0 = t0;
    raw[raw.length - 1].t1 = t1;
    for (let i = 1; i < raw.length; i++) {
      const lo = raw[i - 1].t0 + 18;
      const hi = raw[i].t1 - 18;
      if (hi - lo < 12) continue;
      const v = valleyNear(rms, raw[i].t0, 28, lo, hi);
      raw[i - 1].t1 = v;
      raw[i].t0 = v;
    }
  }
  return raw;
}

function buildSegments(ayah, words, parts, windows, location0 = 0) {
  const segments = [];
  let location = location0;
  let no = 0;
  words.forEach((w, wi) => {
    const win = windows[wi] || windows[windows.length - 1] || { t0: 0, t1: 400 };
    const letters = letterWindows(w, win.t0, win.t1, win.rms);
    const gs = hy.glyphs(w.text);
    let li = 0;
    gs.forEach((g) => {
      const loc = location;
      location += g.ch.length;
      if (g.skip) return;
      const L = letters[li] || { t0: win.t0, t1: win.t1, g };
      li += 1;
      const off = offsetsFor(parts, w.lineIndex, w.ayahIndex, w.wordIndex, g.i);
      segments.push({
        no,
        row: w.lineIndex,
        page: 1,
        startoffset: +off.startoffset.toFixed(6),
        endoffset: +off.endoffset.toFixed(6),
        duration: +(L.t1 - L.t0).toFixed(3),
        startMs: +L.t0.toFixed(3),
        location: loc,
        length: g.ch.length,
        ch: g.base,
        wordIndex: wi,
        letterIndex: g.i,
      });
      no += 1;
    });
  });
  return segments;
}

function buildQulLetterSegments(ayah, words, parts, row) {
  const segs = ayahRelative(row);
  const fakeRms = { frames: [0.05], hopMs: 10, durationMs: (row.to || 0) - (row.from || 0) };
  const windows = words.map((w, wi) => {
    const q = segs[wi] || segs[segs.length - 1] || [wi + 1, 0, 400];
    return { t0: q[1], t1: q[2], rms: fakeRms };
  });
  // no energy snap: pass a flat rms so valleyNear stays at guess
  windows.forEach((win) => {
    win.rms = { frames: Array(Math.max(3, Math.ceil(win.t1 / 10) + 2)).fill(0.05), hopMs: 10, durationMs: win.t1 };
  });
  const segments = [];
  let location = 0;
  let no = 0;
  words.forEach((w, wi) => {
    const q = segs[wi] || segs[segs.length - 1] || [wi + 1, 0, 400];
    const t0 = q[1];
    const t1 = q[2];
    const gs = hy.glyphs(w.text);
    const voiced = hy.voiced(gs);
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
  });
  return segments;
}

const qurancomAyahs = [];
const hafizAyahs = [];
const qa = [];

for (let ayah = 1; ayah <= 7; ayah++) {
  const key = "1:" + ayah;
  const row = qul.find((v) => v.verse_key === key);
  const { parts, words } = ayahWords(ayah);
  if (!parts.length || !row) {
    console.error("missing", key);
    process.exit(1);
  }

  const qulSegs = buildQulLetterSegments(ayah, words, parts, row);
  qurancomAyahs.push({
    surah: 1,
    ayah,
    page: 1,
    text: words.map((w) => w.text).join(" "),
    segments: qulSegs,
  });

  const mp3 = downloadMp3(ayah);
  const rms = decodeRms(mp3);
  const speech = speechBounds(rms);
  const mapped = mapQulWords(row, speech);
  const refined = refineWordWindows(mapped, rms, speech);
  refined.forEach((w) => {
    w.rms = rms;
  });
  const hySegs = buildSegments(ayah, words, parts, refined);
  hafizAyahs.push({
    surah: 1,
    ayah,
    page: 1,
    text: words.map((w) => w.text).join(" "),
    audioMs: +rms.durationMs.toFixed(1),
    speechStartMs: +speech.startMs.toFixed(1),
    speechEndMs: +speech.endMs.toFixed(1),
    segments: hySegs,
  });

  const rel = ayahRelative(row);
  const wordErr = refined.map((w, i) => {
    const q = rel[i];
    if (!q) return 0;
    const qDur = row.to - row.from;
    const scale = (speech.endMs - speech.startMs) / Math.max(1, (rel[rel.length - 1][2] - rel[0][1]));
    const expected = speech.startMs + (q[1] - rel[0][1]) * scale;
    return Math.abs(w.t0 - expected);
  });
  const last = hySegs[hySegs.length - 1];
  const endGap = last ? speech.endMs - (last.startMs + last.duration) : 0;
  qa.push({
    ayah,
    words: words.length,
    letters: hySegs.length,
    audioMs: +rms.durationMs.toFixed(0),
    qulDur: +(row.to - row.from).toFixed(0),
    audioVsQul: +(rms.durationMs - (row.to - row.from)).toFixed(1),
    speech: `${speech.startMs.toFixed(0)}–${speech.endMs.toFixed(0)}`,
    meanWordSnapMs: +(wordErr.reduce((a, b) => a + b, 0) / Math.max(1, wordErr.length)).toFixed(1),
    endGapMs: +endGap.toFixed(1),
    firstLetter: hySegs[0] && `${hySegs[0].ch}@${hySegs[0].startMs.toFixed(0)}`,
    lastLetter: last && `${last.ch}@${last.startMs.toFixed(0)}+${last.duration.toFixed(0)}`,
  });
}

const qurancomOut = {
  id: "qurancom",
  reciter: "alafasy",
  quranId: 7,
  label: "quran.com / QUL · kelime→harf",
  level: "word",
  audio: "everyayah Alafasy_128kbps (ayet MP3; QUL süreleri ±4 ms)",
  source: "https://api.quran.com/api/v4/chapter_recitations/7/1?segments=true",
  license: "Quran.com / QUL public API (Tarteel QUL word segments). Ses: everyayah Alafasy_128kbps.",
  schema: "ezanvakti-positions-v1",
  surahs: [1],
  ayahs: qurancomAyahs,
};

const hafizOut = {
  id: "hafizyol",
  reciter: "alafasy",
  quranId: 7,
  label: "Hafızyol hizalama · harf",
  level: "letter",
  audio: "everyayah Alafasy_128kbps/001001–001007.mp3",
  source:
    "forced-alignment-lite: everyayah PCM RMS + QUL word anchors scaled to speech + tajweed letter priors + energy-valley snap",
  license: "Hafızyol türetilmiş tablo. Ses everyayah (VerseByVerseQuran). Çapa: quran.com/QUL.",
  schema: "ezanvakti-positions-v1",
  surahs: [1],
  ayahs: hafizAyahs,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "positions-hafizyol-fatiha.json"), JSON.stringify(hafizOut, null, 2));
fs.writeFileSync(path.join(OUT_DIR, "positions-qurancom-fatiha.json"), JSON.stringify(qurancomOut, null, 2));

const slim = {
  alafasy: {
    quranId: 7,
    chapters: {
      1: qul.map((v) => ({
        verse_key: v.verse_key,
        from: v.from,
        to: v.to,
        segments: v.segments,
      })),
    },
  },
};
fs.writeFileSync(path.join(OUT_DIR, "segments-alafasy-fatiha.json"), JSON.stringify(slim));

const report = { generatedAt: new Date().toISOString(), reciter: "alafasy", ayahs: qa };
fs.writeFileSync(path.join(OUT_DIR, "fatiha-align-qa.json"), JSON.stringify(report, null, 2));

console.log("wrote Hafızyol + quran.com Fatiha tables");
console.table(qa);
const nHy = hafizAyahs.reduce((s, a) => s + a.segments.length, 0);
const nQc = qurancomAyahs.reduce((s, a) => s + a.segments.length, 0);
console.log("letters hafizyol", nHy, "qurancom", nQc);
