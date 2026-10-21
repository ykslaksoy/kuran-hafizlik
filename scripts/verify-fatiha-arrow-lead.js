#!/usr/bin/env node
/**
 * Offline check: Fatiha letter windows open ~leadMs before audio and still
 * cover the letter onset (incl. shadda/sukun). Exit 1 on failure.
 */
const fs = require("fs");
const path = require("path");

const FILE = path.resolve(__dirname, "../dist/assets/timing/positions-hafizyol-fatiha.json");
const LEAD = 100 + 20; // desktop lookAhead = lead + audioLag
const MINV = 70;

const data = JSON.parse(fs.readFileSync(FILE, "utf8"));

function isShort(s) {
  return s.kind === "sukun" || s.kind === "shadda" || s.kind === "ghunnah" || s.duration < 140;
}

function windows(segs) {
  return segs.map((s, i) => {
    const start = s.startMs - LEAD;
    const dur = Math.max(1, s.duration);
    const minEnd = s.startMs + (isShort(s) ? MINV : Math.min(48, Math.max(24, dur * 0.15)));
    let end = s.startMs + dur;
    if (i + 1 < segs.length) {
      const nextLead = segs[i + 1].startMs - LEAD;
      if (nextLead >= minEnd) end = nextLead;
      else end = Math.max(minEnd, Math.min(end, segs[i + 1].startMs));
    } else {
      end = Math.max(minEnd, s.startMs + dur);
    }
    if (end <= start) end = start + MINV;
    return { start, end, s };
  });
}

let lag = 0;
let earlyMiss = 0;
let total = 0;
const samples = [];

for (const ay of data.ayahs) {
  const wins = windows(ay.segments);
  for (const w of wins) {
    total += 1;
    const onset = w.s.startMs;
    const early = w.s.startMs - LEAD;
    if (!(w.start <= onset && onset < w.end)) {
      lag += 1;
      samples.push({ ayah: ay.ayah, ch: w.s.ch, kind: w.s.kind, onset, w });
    }
    if (!(w.start <= early && early < w.end)) earlyMiss += 1;
  }
}

const out = {
  total,
  lagAtOnset: lag,
  missAtLead: earlyMiss,
  leadMs: LEAD,
  ok: lag === 0 && earlyMiss === 0,
  samples: samples.slice(0, 8),
};
console.log(JSON.stringify(out, null, 2));
if (!out.ok) process.exit(1);
