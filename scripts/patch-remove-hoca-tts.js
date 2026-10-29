#!/usr/bin/env node
/**
 * Remove selectable Hoca (browser TTS) from Kur'an reciter lists.
 * Does not remove ezber coaching speechSynthesis in the Expo bundle.
 * Safe to run on pdhist5+ dist export. Idempotent where possible.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ENTRY = path.join(
  ROOT,
  "dist/_expo/static/js/web/entry-medine604-a0324b1a9e2452bea2896449b9d2b456.js"
);
const TIMING = path.join(ROOT, "dist/assets/timing/quran-timing.js");
const PLAYER = path.join(ROOT, "dist/assets/mushaf/hy-player.js");
const PATCH_MEDINE = path.join(ROOT, "scripts/patch-medine-mushaf.js");

const HOCA_RECITER =
  ",{id:'hoca-tts',nameTr:'Hoca (TTS)',folder:null,styleTr:'Sentez ses \\u2014 kelime timing yok',quranId:null,wordTiming:!1}";
const HOCA_RECITER_ALT =
  ",{id:'hoca-tts',nameTr:'Hoca (TTS)',folder:null,styleTr:'Sentez ses — kelime timing yok',quranId:null,wordTiming:!1}";
const HOCA_TIMING_LINE =
  '    "hoca-tts": { quranId: null, wordTiming: false, labelTr: "Hoca (TTS)" },\n';
const HOCA_PLAYER_LINE = '    { id: "hoca-tts", label: "Hoca" },\n';
const MEDIA_IDS =
  "['alafasy','abdulbasit','minshawi','abdulbasit-murattal','husary','sudais','hoca-tts']";
const MEDIA_IDS_CLEAN =
  "['alafasy','abdulbasit','minshawi','abdulbasit-murattal','husary','sudais']";

function replaceOnce(file, label, from, to) {
  let s = fs.readFileSync(file, "utf8");
  if (!s.includes(from)) {
    if (to === "" && !s.includes("hoca-tts")) {
      console.log("skip (already):", label);
      return;
    }
    if (to !== "" && s.includes(to)) {
      console.log("skip (already):", label);
      return;
    }
    console.error("MISSING:", label, "in", path.basename(file));
    process.exit(1);
  }
  if (from && s.split(from).length - 1 > 1) {
    console.error("AMBIGUOUS:", label);
    process.exit(1);
  }
  s = s.replace(from, to);
  fs.writeFileSync(file, s);
  console.log("ok:", label);
}

if (fs.readFileSync(ENTRY, "utf8").includes(HOCA_RECITER)) {
  replaceOnce(ENTRY, "QURAN_RECITERS hoca", HOCA_RECITER, "");
} else {
  console.log("skip (already): QURAN_RECITERS hoca");
}
if (fs.readFileSync(ENTRY, "utf8").includes(HOCA_RECITER_ALT)) {
  replaceOnce(ENTRY, "QURAN_RECITERS hoca alt", HOCA_RECITER_ALT, "");
}
replaceOnce(ENTRY, "media row reciter ids", MEDIA_IDS, MEDIA_IDS_CLEAN);
replaceOnce(TIMING, "timing map hoca", HOCA_TIMING_LINE, "");
replaceOnce(PLAYER, "hy-player reciter", HOCA_PLAYER_LINE, "");

if (fs.existsSync(PATCH_MEDINE)) {
  let pm = fs.readFileSync(PATCH_MEDINE, "utf8");
  const bad =
    "{id:'hoca-tts',nameTr:'Hoca (TTS)',folder:null,styleTr:'Sentez ses \\\\u2014 kelime timing yok',quranId:null,wordTiming:!1}";
  if (pm.includes(bad)) {
    pm = pm.split(bad).join("");
    fs.writeFileSync(PATCH_MEDINE, pm);
    console.log("ok: patch-medine-mushaf.js no longer re-adds hoca-tts");
  }
}

if (
  fs.readFileSync(ENTRY, "utf8").includes("hoca-tts") ||
  fs.readFileSync(TIMING, "utf8").includes("hoca-tts") ||
  fs.readFileSync(PLAYER, "utf8").includes("hoca-tts")
) {
  console.error("hoca-tts still present after patch");
  process.exit(1);
}
console.log("done: hoca-tts removed from selectable Kur'an reciters");
