#!/usr/bin/env node
/**
 * Dua sesleri → Mişari (Alafasy) hazırlığı.
 *
 * - Amentü zaten amentu-v2.mp3 (hybrid).
 * - Kur’anî dualar: everyayah Alafasy dosyaları.
 * - Flag DUA_MISHARI_ENABLED bu branch’te AÇIK (ready-to-merge).
 * - main/live’a merge YALNIZ Amentü onayı sonrası.
 *
 * Kaynak yok (Expo TS); entry-medine604 bundle üzerinde tek seferlik patch.
 */
const fs = require("fs");
const path = require("path");

const ENTRY = path.resolve(
  __dirname,
  "..",
  "dist/_expo/static/js/web/entry-medine604-a0324b1a9e2452bea2896449b9d2b456.js"
);
const INDEX = path.resolve(__dirname, "..", "dist/index.html");
const SW = path.resolve(__dirname, "..", "dist/sw.js");
const MANIFEST = path.resolve(
  __dirname,
  "..",
  "dist/assets/data/dua-mishari-manifest.json"
);

let src = fs.readFileSync(ENTRY, "utf8");
let n = 0;

function replaceOnce(label, from, to) {
  const i = src.indexOf(from);
  if (i < 0) {
    console.error("MISSING:", label);
    console.error("needle:", from.slice(0, 200));
    process.exit(1);
  }
  if (src.indexOf(from, i + 1) >= 0) {
    console.error("AMBIGUOUS:", label);
    process.exit(1);
  }
  src = src.slice(0, i) + to + src.slice(i + from.length);
  n += 1;
  console.log("ok:", label);
}

const FROM = [
  "let n=!1,p=null;",
  "function r(t){return new Promise(e=>setTimeout(e,t))}",
  "function i(){const t=window.speechSynthesis;if(t)try{t.resume(),t.paused&&t.resume()}catch{}}",
  "function k(t){const n=String(t||'').replace(/[\\u064B-\\u065F\\u0670\\u0640\\u06D6-\\u06ED]/g,'');return n.indexOf('\\u0622\\u0645\\u0646\\u062a')>=0&&n.indexOf('\\u0645\\u0644\\u0627\\u0626\\u0643\\u062a')>=0}",
  "function U(t,r,e,cb){return new Promise(c=>{n=!0;try{p&&(p.pause(),p.src='')}catch{}const a=new Audio('/assets/audio/amentu-v2.mp3');p=a;a.preload='auto';a.playbackRate=Math.min(1.05,Math.max(.7,r/.82*0.88));let u=!1,l=null,i=0;const f=()=>{u||(u=!0,l&&clearInterval(l),cb&&e&&cb(Math.max(0,e-1)),n=!1,p===a&&(p=null),c())};a.onended=f;a.onerror=f;a.onloadedmetadata=()=>{if(cb&&e>0&&isFinite(a.duration)&&a.duration>0){const s=Math.max(280,Math.round(a.duration*1e3/e/Math.max(.5,a.playbackRate)));cb(0);l=setInterval(()=>{i+=1;i>=e?clearInterval(l):cb(i)},s)}};const play=()=>a.play().catch(f);a.readyState>=2?play():(a.oncanplay=play,a.load())})}",
  "function o(t,r,lang){return new Promise(c=>{if(!t.trim())return void c();if(k(t)&&'tr-TR'!==lang)return void U(t,r,0,null).then(c);n=!0,i();const l=t.trim().split(/\\s+/).filter(Boolean).length,s=Math.min(9e4,Math.max(1e4,900*l+4e3));let u=!1;const f=()=>{u||(u=!0,clearTimeout(w),n=!1,c())},w=setTimeout(()=>{try{e.stop()}catch{}f()},s);e.speak(t,{language:lang,rate:Math.min(2,Math.max(.4,r)),pitch:1,onDone:f,onStopped:f,onError:f})})}",
].join("");

const TO = [
  "let n=!1,p=null;",
  // Ready-to-merge on this branch; merge to main only after Amentü approval.
  "const DUA_MISHARI_ENABLED=!0;",
  "const DUA_MISHARI_SRC={amentu:'/assets/audio/amentu-v2.mp3',rabbena:'/assets/audio/duas-mishari/rabbena-002201.mp3','rabbena-ghfirli':'/assets/audio/duas-mishari/rabbena-ghfirli-014041.mp3','euzu-besmele':'/assets/audio/duas-mishari/besmele-001001.mp3'};",
  "function r(t){return new Promise(e=>setTimeout(e,t))}",
  "function i(){const t=window.speechSynthesis;if(t)try{t.resume(),t.paused&&t.resume()}catch{}}",
  "function stripAr(t){return String(t||'').replace(/[\\u064B-\\u065F\\u0670\\u0640\\u06D6-\\u06ED]/g,'')}",
  "function k(t){const n=stripAr(t);return n.indexOf('\\u0622\\u0645\\u0646\\u062a')>=0&&n.indexOf('\\u0645\\u0644\\u0627\\u0626\\u0643\\u062a')>=0}",
  "function matchDuaId(t){const n=stripAr(t);if(k(t))return'amentu';if(n.indexOf('\\u0631\\u0628\\u0646\\u0627')>=0&&n.indexOf('\\u0627\\u062a\\u0646\\u0627')>=0&&n.indexOf('\\u0627\\u0644\\u062f\\u0646\\u064a\\u0627')>=0)return'rabbena';if(n.indexOf('\\u0648\\u0627\\u0644\\u062f\\u064a')>=0&&n.indexOf('\\u0627\\u0644\\u062d\\u0633\\u0627\\u0628')>=0)return'rabbena-ghfirli';if(n.indexOf('\\u0627\\u0639\\u0648\\u0630')>=0||n.indexOf('\\u0628\\u0633\\u0645')>=0&&n.indexOf('\\u0627\\u0644\\u0631\\u062d\\u0645\\u0646')>=0&&n.indexOf('\\u0627\\u0644\\u0631\\u062d\\u064a\\u0645')>=0&&n.length<120)return'euzu-besmele';return null}",
  "function U(t,r,e,cb,src){return new Promise(c=>{n=!0;try{p&&(p.pause(),p.src='')}catch{}const a=new Audio(src||'/assets/audio/amentu-v2.mp3');p=a;a.preload='auto';a.playbackRate=Math.min(1.05,Math.max(.7,r/.82*0.88));let u=!1,l=null,i=0;const f=()=>{u||(u=!0,l&&clearInterval(l),cb&&e&&cb(Math.max(0,e-1)),n=!1,p===a&&(p=null),c())};a.onended=f;a.onerror=f;a.onloadedmetadata=()=>{if(cb&&e>0&&isFinite(a.duration)&&a.duration>0){const s=Math.max(280,Math.round(a.duration*1e3/e/Math.max(.5,a.playbackRate)));cb(0);l=setInterval(()=>{i+=1;i>=e?clearInterval(l):cb(i)},s)}};const play=()=>a.play().catch(f);a.readyState>=2?play():(a.oncanplay=play,a.load())})}",
  "function o(t,r,lang){return new Promise(c=>{if(!t.trim())return void c();if('tr-TR'!==lang){const id=matchDuaId(t);const src=id&&((id==='amentu'||DUA_MISHARI_ENABLED)&&DUA_MISHARI_SRC[id]);if(src)return void U(t,r,0,null,src).then(c)}n=!0,i();const l=t.trim().split(/\\s+/).filter(Boolean).length,s=Math.min(9e4,Math.max(1e4,900*l+4e3));let u=!1;const f=()=>{u||(u=!0,clearTimeout(w),n=!1,c())},w=setTimeout(()=>{try{e.stop()}catch{}f()},s);e.speak(t,{language:lang,rate:Math.min(2,Math.max(.4,r)),pitch:1,onDone:f,onStopped:f,onError:f})})}",
].join("");

replaceOnce("dua mishari voice routing", FROM, TO);

// Also route playHocaReadingWithFollow for matched duas (already uses U via o for amentu;
// WithFollow path calls U directly for amentu — keep that, extend for other ids)
replaceOnce(
  "withFollow use matchDua audio",
  "if(k(t)){await U(t,.82,r,n);return}",
  "const _duaId=matchDuaId(t);const _duaSrc=_duaId&&((_duaId==='amentu'||DUA_MISHARI_ENABLED)&&DUA_MISHARI_SRC[_duaId]);if(_duaSrc){await U(t,.82,r,n,_duaSrc);return}"
);

fs.writeFileSync(ENTRY, src);
console.log("patched", n, "sites →", path.basename(ENTRY));

if (!fs.existsSync(MANIFEST)) {
  console.error("MISSING manifest", MANIFEST);
  process.exit(1);
}

let index = fs.readFileSync(INDEX, "utf8");
if (!index.includes("dua-mishari")) {
  index = index.replace(
    '<meta name="hafiz-yol-build" content="2026-10-19-fatiha4" />',
    '<meta name="hafiz-yol-build" content="2026-10-21-dua-mishari1" />\n    <meta name="hafiz-yol-dua-mishari" content="ready-awaiting-amentu-approval" />'
  );
  index = index.replace(
    'entry-medine604-a0324b1a9e2452bea2896449b9d2b456.js?v=fatiha4',
    'entry-medine604-a0324b1a9e2452bea2896449b9d2b456.js?v=dua-mishari1'
  );
  fs.writeFileSync(INDEX, index);
  console.log("ok: index.html cache bump + gate meta");
}

if (fs.existsSync(SW)) {
  let sw = fs.readFileSync(SW, "utf8");
  if (sw.includes("fatiha4") && !sw.includes("dua-mishari1")) {
    sw = sw.replace(/fatiha4/g, "dua-mishari1");
    fs.writeFileSync(SW, sw);
    console.log("ok: sw.js cache bump");
  }
}

console.log(
  "DONE — DUA_MISHARI_ENABLED=true on branch; do NOT merge to main until Amentü approved."
);
