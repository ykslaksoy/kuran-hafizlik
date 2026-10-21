#!/usr/bin/env node
/**
 * Mark En popüler / En kolay on Mushaf editions + fonts in the Expo web bundle.
 * Safe to re-run only on a clean medine604 entry that has not been badge-patched.
 */
const fs = require("fs");
const path = require("path");

const ENTRY = path.resolve(
  __dirname,
  "..",
  "dist/_expo/static/js/web/entry-medine604-a0324b1a9e2452bea2896449b9d2b456.js"
);

let s = fs.readFileSync(ENTRY, "utf8");
let n = 0;

function once(label, from, to) {
  if (s.includes(to.slice(0, Math.min(80, to.length))) && !s.includes(from)) {
    console.log("skip (already):", label);
    return;
  }
  const i = s.indexOf(from);
  if (i < 0) {
    console.error("MISSING:", label);
    process.exit(1);
  }
  if (s.indexOf(from, i + 1) >= 0) {
    console.error("AMBIGUOUS:", label);
    process.exit(1);
  }
  s = s.slice(0, i) + to + s.slice(i + from.length);
  n += 1;
  console.log("ok:", label);
}

if (s.includes("badgeTr:'En pop\\xfcler'") || s.includes("badgeTr:'En popüler'")) {
  console.log("badges already present; nothing to do");
  process.exit(0);
}

once(
  "edition medine popular badge",
  "id:'medine-hafs-sade',nameTr:'Medine Mushaf\\u0131 (Hafs)',descriptionTr:'Ezan Vakti mushaf sayfas\\u0131 \\u2014 krem zemin, \\xe7er\\xe7eve, oklu takip',riwayetTr:'Hafs \\xb7 Medine 604 sayfa',fontId:'uthmanic-hafs',layoutMode:'mushaf',popularityTr:1,isDefault:!0",
  "id:'medine-hafs-sade',nameTr:'Medine Mushaf\\u0131 (Hafs)',descriptionTr:'Ezan Vakti mushaf sayfas\\u0131 \\u2014 krem zemin, \\xe7er\\xe7eve, oklu takip',riwayetTr:'Hafs \\xb7 Medine 604 sayfa',fontId:'uthmanic-hafs',layoutMode:'mushaf',popularityTr:1,isDefault:!0,badgeTr:'En pop\\xfcler',badge:'popular'"
);
once(
  "edition amiri easy badge",
  "id:'amiri-sade',nameTr:'Amiri Kur\\'an Mushaf\\u0131',descriptionTr:'Dijital okuma sitelerinde yayg\\u0131n ak\\u0131c\\u0131 naskh',riwayetTr:'Hafs \\xb7 Medine 604 sayfa',fontId:'amiri-quran',layoutMode:'ezan-vakti',popularityTr:6",
  "id:'amiri-sade',nameTr:'Amiri Kur\\'an Mushaf\\u0131',descriptionTr:'Dijital okuma sitelerinde yayg\\u0131n ak\\u0131c\\u0131 naskh',riwayetTr:'Hafs \\xb7 Medine 604 sayfa',fontId:'amiri-quran',layoutMode:'ezan-vakti',popularityTr:6,badgeTr:'En kolay',badge:'easy'"
);
once(
  "font uthmanic popular",
  "id:'uthmanic-hafs',nameTr:'Medine Hafs',descriptionTr:'KFGQPC Uthmanic \\u2014 Ezan Vakti & haf\\u0131zl\\u0131k standard\\u0131',popularityTr:1,fontFamily:'UthmanicHafs',sizeScale:1.14,letterSpacing:.2,isDefault:!0",
  "id:'uthmanic-hafs',nameTr:'Medine Hafs',descriptionTr:'KFGQPC Uthmanic \\u2014 Ezan Vakti & haf\\u0131zl\\u0131k standard\\u0131',popularityTr:1,fontFamily:'UthmanicHafs',sizeScale:1.14,letterSpacing:.2,isDefault:!0,badgeTr:'En pop\\xfcler',badge:'popular'"
);
once(
  "font amiri easy",
  "id:'amiri-quran',nameTr:'Amiri Kur\\'an',descriptionTr:'Dijital meal ve okuma sitelerinde yayg\\u0131n \\u2014 ak\\u0131c\\u0131 naskh',popularityTr:4,fontFamily:'AmiriQuran_400Regular',sizeScale:1.12,letterSpacing:0",
  "id:'amiri-quran',nameTr:'Amiri Kur\\'an',descriptionTr:'Dijital meal ve okuma sitelerinde yayg\\u0131n \\u2014 ak\\u0131c\\u0131 naskh',popularityTr:4,fontFamily:'AmiriQuran_400Regular',sizeScale:1.12,letterSpacing:0,badgeTr:'En kolay',badge:'easy'"
);
once(
  "settings edition badges UI",
  "(0,A.jsxs)(o.default,{style:{color:t.text,fontWeight:'700'},children:[s.nameTr,k===s.id||n.defaultMushafEditionId===s.id?' \\u2713':'']}),(0,A.jsx)(o.default,{style:{color:t.muted,fontSize:12,marginTop:2},children:s.descriptionTr})",
  "(0,A.jsxs)(o.default,{style:{color:t.text,fontWeight:'700'},children:[s.nameTr,s.badgeTr?` · ${s.badgeTr}`:'',k===s.id||n.defaultMushafEditionId===s.id?' \\u2713':'']}),(0,A.jsx)(o.default,{style:{color:t.muted,fontSize:12,marginTop:2},children:s.descriptionTr})"
);
once(
  "settings hint fonts",
  'children:"Varsay\\u0131lan: Ezan Vakti tarz\\u0131 (krem sayfa + ok). Ba\\u015fka bask\\u0131 se\\xe7ebilirsin."',
  'children:"Varsay\\u0131lan: Medine Hafs (En pop\\xfcler). Amiri Kur\'an = En kolay. Kur\'an ekran\\u0131nda Hat men\\xfcs\\xfcnden QCF ve di\\u011fer yaz\\u0131 tiplerini de se\\xe7ebilirsin."'
);

fs.writeFileSync(ENTRY, s);
console.log("patched", n);
