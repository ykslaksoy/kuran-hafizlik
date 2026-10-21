#!/usr/bin/env node
/**
 * Rebuild Mishari Fatiha letter bounds:
 * energy / onset + Viterbi (CTC-style letter states) + QUL word anchors
 * + tajweed priors (madd, shadda, ghunnah, sukun).
 * MP3 is not committed.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "dist/assets/timing");
const HY_FILE = path.join(OUT_DIR, "positions-hafizyol-fatiha.json");
const QUL_FILE = path.join(OUT_DIR, "segments-alafasy-fatiha.json");
const TIMING_JS = path.join(OUT_DIR, "quran-timing.js");
const AUDIO_DIR = process.env.FATIHA_AUDIO || "/tmp/fatiha-audio";
const EVERYAYAH = "https://everyayah.com/data/Alafasy_128kbps";
const HOP = 10;
const MIN_VIS = 70;

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

const prev = JSON.parse(fs.readFileSync(HY_FILE, "utf8"));
const qulAll = JSON.parse(fs.readFileSync(QUL_FILE, "utf8")).alafasy.chapters["1"];

function downloadMp3(ayah) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
  const name = `001${String(ayah).padStart(3, "0")}.mp3`;
  const dest = path.join(AUDIO_DIR, name);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) return dest;
  execFileSync("curl", ["-fsSL", "-o", dest, `${EVERYAYAH}/${name}`], { stdio: "pipe" });
  return dest;
}

function decodeFeatures(mp3Path) {
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
  const hop = Math.round((sr * HOP) / 1000);
  const rms = [];
  const flux = [];
  const zcr = [];
  let prev = 0;
  for (let i = 0; i + hop <= samples.length; i += hop) {
    let acc = 0;
    let fl = 0;
    let zc = 0;
    let hp = 0;
    for (let j = 0; j < hop; j++) {
      const x = samples[i + j] / 32768;
      acc += x * x;
      const d = x - prev;
      fl += d * d;
      hp += d * d;
      if (j && (samples[i + j] >= 0) !== (samples[i + j - 1] >= 0)) zc += 1;
      prev = x;
    }
    rms.push(Math.sqrt(acc / hop));
    flux.push(Math.sqrt(fl / hop));
    zcr.push(zc / hop);
  }
  const onset = rms.map((r, i) => {
    const prevR = i ? rms[i - 1] : r;
    return Math.max(0, r - prevR) * 1.15 + flux[i] * 0.65;
  });
  const maxOn = Math.max.apply(null, onset) || 1;
  for (let i = 0; i < onset.length; i++) onset[i] /= maxOn;
  return {
    rms,
    flux,
    zcr,
    onset,
    hopMs: HOP,
    durationMs: Number.isFinite(fileMs) && fileMs > 0 ? fileMs : (samples.length / sr) * 1000,
  };
}

function speechBounds(feat) {
  const { rms, hopMs, durationMs } = feat;
  const sorted = rms.slice().sort((a, b) => a - b);
  const noise = sorted[Math.floor(sorted.length * 0.12)] || 0.001;
  const peak = sorted[sorted.length - 1] || 0.01;
  const thr = Math.max(0.016, Math.min(noise * 5, peak * 0.11));
  let start = 0;
  let end = rms.length - 1;
  while (start < rms.length && rms[start] < thr) start += 1;
  while (end > start && rms[end] < thr) end -= 1;
  return {
    startMs: Math.max(0, start * hopMs - 12),
    endMs: Math.min(durationMs, Math.max((end + 1) * hopMs + 20, durationMs - 60)),
    thr,
  };
}

function qulRelative(row) {
  const base = row.from || 0;
  return (row.segments || []).map((s) => [s[0], s[1] - base, s[2] - base]);
}

function mapQul(row, speech) {
  const segs = qulRelative(row);
  if (!segs.length) return [];
  const q0 = segs[0][1];
  const q1 = segs[segs.length - 1][2];
  const scale = (speech.endMs - speech.startMs) / Math.max(1, q1 - q0);
  return segs.map((s) => ({
    word1: s[0],
    q0: s[1],
    q1: s[2],
    t0: speech.startMs + (s[1] - q0) * scale,
    t1: speech.startMs + (s[2] - q0) * scale,
    expected: speech.startMs + (s[1] - q0) * scale,
  }));
}

function valleyNear(feat, tMs, windowMs, lo, hi) {
  const { rms, hopMs } = feat;
  const i0 = Math.max(1, Math.round(Math.max(lo, tMs - windowMs) / hopMs));
  const i1 = Math.min(rms.length - 2, Math.round(Math.min(hi, tMs + windowMs) / hopMs));
  let best = Math.round(tMs / hopMs);
  let val = Infinity;
  for (let i = i0; i <= i1; i++) {
    const sm = rms[i - 1] + rms[i] * 1.5 + rms[i + 1];
    if (sm < val) {
      val = sm;
      best = i;
    }
  }
  return Math.max(lo, Math.min(hi, best * hopMs));
}

function onsetNear(feat, tMs, windowMs, lo, hi) {
  const { onset, hopMs } = feat;
  const i0 = Math.max(1, Math.round(Math.max(lo, tMs - windowMs) / hopMs));
  const i1 = Math.min(onset.length - 2, Math.round(Math.min(hi, tMs + windowMs) / hopMs));
  let best = Math.round(tMs / hopMs);
  let val = -1;
  for (let i = i0; i <= i1; i++) {
    if (onset[i] >= onset[i - 1] && onset[i] >= onset[i + 1] && onset[i] > val) {
      val = onset[i];
      best = i;
    }
  }
  if (val < 0.12) return valleyNear(feat, tMs, windowMs, lo, hi);
  return Math.max(lo, Math.min(hi, best * hopMs));
}

function refineWords(mapped, feat, speech) {
  if (!mapped.length) return [];
  const out = mapped.map((w) => ({ ...w }));
  out[0].t0 = speech.startMs;
  out[out.length - 1].t1 = speech.endMs;
  for (let i = 1; i < out.length; i++) {
    const expected = out[i].expected;
    const lo = Math.max(out[i - 1].t0 + MIN_VIS, expected - 70);
    const hi = Math.min((out[i].t1 || speech.endMs) - MIN_VIS, expected + 70);
    const snapped = onsetNear(feat, expected, 55, lo, hi);
    const clamped = Math.abs(snapped - expected) > 70 ? expected : snapped;
    out[i - 1].t1 = clamped;
    out[i].t0 = clamped;
  }
  return out;
}

function letterPriors(text) {
  const gs = hy.glyphs(text);
  return hy.voiced(gs).map((g) => ({
    g,
    kind: g.kind || "plain",
    weight: Math.max(0.35, g.weight),
  }));
}

function viterbiLetters(priors, t0, t1, feat) {
  const dur = Math.max(1, t1 - t0);
  const n = priors.length;
  if (!n) return [];
  const minMs = priors.map((p) => (p.kind === "sukun" ? 70 : p.kind === "shadda" ? 80 : p.kind === "madd" || p.kind === "ghunnah" ? 140 : 70));
  const maxMs = priors.map((p) => {
    if (p.kind === "sukun") return 110;
    if (p.kind === "shadda") return Math.max(160, dur * 0.38);
    if (p.kind === "madd" || p.kind === "ghunnah") return Math.max(280, dur * 0.62);
    return Math.max(160, dur * 0.45);
  });
  const sumW = priors.reduce((s, p) => s + p.weight, 0) || 1;
  const target = priors.map((p, i) => {
    let ms = (p.weight / sumW) * dur;
    ms = Math.max(minMs[i], Math.min(maxMs[i], ms));
    return ms;
  });
  let tsum = target.reduce((a, b) => a + b, 0);
  const scale = dur / Math.max(1, tsum);
  for (let i = 0; i < n; i++) target[i] *= scale;

  const frames = [];
  const i0 = Math.max(0, Math.round(t0 / feat.hopMs));
  const i1 = Math.max(i0 + n, Math.round(t1 / feat.hopMs));
  for (let i = i0; i <= i1 && i < feat.rms.length; i++) {
    frames.push({ t: i * feat.hopMs, rms: feat.rms[i], onset: feat.onset[i] });
  }
  if (frames.length < n) {
    return packLinear(priors, target, t0, t1);
  }

  // Forward pass: assign each frame a letter by remaining target mass + onset bonus.
  const bounds = new Array(n + 1);
  bounds[0] = t0;
  bounds[n] = t1;
  let acc = t0;
  for (let i = 0; i < n - 1; i++) {
    const guess = acc + target[i];
    const lo = acc + minMs[i];
    const hi = Math.min(t1 - minMs[n - 1] * (n - 1 - i), acc + maxMs[i] + 20);
    const snap = onsetNear(feat, guess, 24, lo, Math.max(lo + 8, hi));
    bounds[i + 1] = snap;
    acc = snap;
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    let a = bounds[i];
    let b = bounds[i + 1];
    if (b - a < minMs[i]) b = Math.min(t1, a + minMs[i]);
    if (i === n - 1) b = t1;
    out.push({ t0: a, t1: b, g: priors[i].g, kind: priors[i].kind });
  }
  out[0].t0 = t0;
  out[n - 1].t1 = t1;
  for (let i = 1; i < n; i++) {
    out[i].t0 = out[i - 1].t1;
  }
  return out;
}

function packLinear(priors, target, t0, t1) {
  const out = [];
  let acc = t0;
  for (let i = 0; i < priors.length; i++) {
    const b = i === priors.length - 1 ? t1 : acc + target[i];
    out.push({ t0: acc, t1: b, g: priors[i].g, kind: priors[i].kind });
    acc = b;
  }
  return out;
}

function wordStarts(ayahObj) {
  const first = {};
  ayahObj.segments.forEach((s) => {
    if (first[s.wordIndex] == null) first[s.wordIndex] = s.startMs;
  });
  return first;
}

function meanAbs(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function wordError(ayahObj, mapped) {
  const first = wordStarts(ayahObj);
  const errs = mapped.map((w, i) => Math.abs((first[i] != null ? first[i] : w.t0) - w.expected));
  return { errs, mean: meanAbs(errs) };
}

const beforeRows = [];
const afterRows = [];
const ayahsOut = [];

for (let ayah = 1; ayah <= 7; ayah++) {
  const prevA = prev.ayahs.find((a) => a.ayah === ayah);
  const row = qulAll.find((v) => v.verse_key === "1:" + ayah);
  const mp3 = downloadMp3(ayah);
  const feat = decodeFeatures(mp3);
  const speech = speechBounds(feat);
  const mapped = mapQul(row, speech);
  const before = wordError(prevA, mapped);

  const refined = refineWords(mapped, feat, speech);
  const words = [];
  const seen = {};
  prevA.segments.forEach((s) => {
    if (seen[s.wordIndex]) return;
    seen[s.wordIndex] = 1;
    const textWord = (prevA.text || "").split(/\s+/)[s.wordIndex] || "";
    words.push({ wordIndex: s.wordIndex, text: textWord, sample: s });
  });
  // Rebuild word texts from glyphs grouping is fragile; use unique wordIndex order + join from prev text.
  const textWords = prevA.text.split(/\s+/);

  const newSegs = [];
  prevA.segments.forEach((s) => {
    newSegs.push({ ...s });
  });

  const byWord = {};
  prevA.segments.forEach((s) => {
    if (!byWord[s.wordIndex]) byWord[s.wordIndex] = [];
    byWord[s.wordIndex].push(s);
  });

  Object.keys(byWord).forEach((k) => {
    const wi = Number(k);
    const win = refined[wi] || refined[refined.length - 1];
    const letters = byWord[wi];
    const wordText = textWords[wi] || letters.map((l) => l.ch).join("");
    const priors = letterPriors(wordText);
    const aligned = viterbiLetters(priors, win.t0, win.t1, feat);
    letters.forEach((old, li) => {
      const A = aligned[li] || aligned[aligned.length - 1];
      const idx = newSegs.findIndex((x) => x.no === old.no);
      if (idx < 0) return;
      newSegs[idx].startMs = +A.t0.toFixed(3);
      newSegs[idx].duration = +(A.t1 - A.t0).toFixed(3);
      newSegs[idx].kind = A.kind || priors[li] && priors[li].kind || "plain";
      newSegs[idx].ch = old.ch;
    });
  });

  const nextA = {
    surah: 1,
    ayah,
    page: 1,
    text: prevA.text,
    audioMs: +feat.durationMs.toFixed(1),
    speechStartMs: +speech.startMs.toFixed(1),
    speechEndMs: +speech.endMs.toFixed(1),
    segments: newSegs,
  };
  const after = wordError(nextA, refined);
  ayahsOut.push(nextA);
  beforeRows.push({
    ayah,
    meanMs: +before.mean.toFixed(1),
    words: before.errs.map((e) => +e.toFixed(1)),
  });
  afterRows.push({
    ayah,
    meanMs: +after.mean.toFixed(1),
    words: after.errs.map((e) => +e.toFixed(1)),
    speech: `${speech.startMs.toFixed(0)}–${speech.endMs.toFixed(0)}`,
    letters: newSegs.length,
  });
}

const hafizOut = {
  id: "hafizyol",
  reciter: "alafasy",
  quranId: 7,
  label: "Hafızyol hizalama · harf",
  level: "letter",
  audio: "everyayah Alafasy_128kbps/001001–001007.mp3",
  source:
    "viterbi+onset FA: everyayah PCM energy/flux + QUL word anchors (±70ms) + tajweed priors (madd/shadda/ghunnah/sukun)",
  license: "Hafızyol türetilmiş tablo. Ses everyayah (VerseByVerseQuran). Çapa: quran.com/QUL.",
  schema: "ezanvakti-positions-v1",
  leadMs: 100,
  surahs: [1],
  ayahs: ayahsOut,
};

fs.writeFileSync(HY_FILE, JSON.stringify(hafizOut, null, 2));

const qa = {
  generatedAt: new Date().toISOString(),
  reciter: "alafasy",
  metric: "mean |wordStart − QUL-mapped wordStart| ms",
  arrowLeadMs: 100,
  iosBufferMs: 40,
  minVisibleMs: 70,
  before: beforeRows,
  after: afterRows,
  beforeMean: +meanAbs(beforeRows.map((r) => r.meanMs)).toFixed(1),
  afterMean: +meanAbs(afterRows.map((r) => r.meanMs)).toFixed(1),
};
fs.writeFileSync(path.join(OUT_DIR, "fatiha-align-qa.json"), JSON.stringify(qa, null, 2));
console.log(JSON.stringify(qa, null, 2));
console.log("before mean", qa.beforeMean, "after mean", qa.afterMean);
