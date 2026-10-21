#!/usr/bin/env node
/**
 * Clarify that default mushaf is KFGQPC printed Medine (QCF), not a synthetic UI clone.
 * Disable Diyanet font-only edition until licensed page pack exists.
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
const BUST = "gercek1";

let s = fs.readFileSync(ENTRY, "utf8");
let n = 0;

function once(label, from, to) {
  if (!s.includes(from)) {
    if (to.length < 120 && s.includes(to.slice(0, 40))) {
      console.log("skip (already):", label);
      return;
    }
    console.error("MISSING:", label);
    process.exit(1);
  }
  if (s.indexOf(from, s.indexOf(from) + 1) >= 0) {
    console.error("AMBIGUOUS:", label);
    process.exit(1);
  }
  s = s.replace(from, to);
  n += 1;
  console.log("ok:", label);
}

once(
  "onboarding quran slide",
  "bodyTr:'Ezan Vakti tarz\\u0131 sayfa, Medine Hafs hatt\\u0131. Okurken metin sabit kal\\u0131r; dikkat da\\u011f\\u0131tan hareket yok.'",
  "bodyTr:'Ger\\xe7ek bas\\u0131l\\u0131 mushaf: KFGQPC Medine 604, QCF sayfa fontu (15 sat\\u0131r). Okurken sayfa sabit; dikkat da\\u011f\\u0131tan hareket yok.'"
);

once(
  "medine sade edition desc",
  "id:'medine-hafs-sade',nameTr:'Medine Mushaf\\u0131 (Hafs)',descriptionTr:'Ezan Vakti mushaf sayfas\\u0131 \\u2014 krem zemin, \\xe7er\\xe7eve, oklu takip'",
  "id:'medine-hafs-sade',nameTr:'Medine Mushaf\\u0131 (Hafs)',descriptionTr:'KFGQPC bas\\u0131l\\u0131 Medine mushaf\\u0131 \\u2014 QCF sayfa fontu, 15 sat\\u0131r (604 sayfa)'"
);

once(
  "medine basili edition desc",
  "id:'medine-hafs-basili',nameTr:'Medine Mushaf\\u0131 (Bas\\u0131l\\u0131)',descriptionTr:'Ah\\u015fap \\xe7er\\xe7eveli bas\\u0131l\\u0131 mushaf g\\xf6r\\xfcn\\xfcm\\xfc \\u2014 ayn\\u0131 sayfa d\\xfczeni'",
  "id:'medine-hafs-basili',nameTr:'Medine Mushaf\\u0131 (Bas\\u0131l\\u0131)',descriptionTr:'Ayn\\u0131 KFGQPC QCF sayfa d\\xfczeni \\u2014 ah\\u015fap \\xe7er\\xe7eve g\\xf6r\\xfcn\\xfcm\\xfc'"
);

once(
  "uthmanic font desc",
  "id:'uthmanic-hafs',nameTr:'Medine Hafs',descriptionTr:'KFGQPC Uthmanic \\u2014 Ezan Vakti & haf\\u0131zl\\u0131k standard\\u0131'",
  "id:'uthmanic-hafs',nameTr:'Medine Hafs',descriptionTr:'KFGQPC Uthmanic \\u2014 sade mod (tek font, QCF de\\u011fil)'"
);

once(
  "diyanet unavailable",
  "id:'diyanet-hafiz-kitabi',nameTr:'Diyanet Haf\\u0131z Kitab\\u0131',descriptionTr:'Haf\\u0131z: Lafz\\u0131n Hamili Manan\\u0131n Amili \\u2014 bilgisayar hatl\\u0131 mushaf',riwayetTr:'Hafs \\xb7 Diyanet',fontId:'diyanet-hafiz-kitabi',layoutMode:'mushaf',popularityTr:5",
  "id:'diyanet-hafiz-kitabi',nameTr:'Diyanet haf\\u0131z boy (yak\\u0131nda)',descriptionTr:'Bas\\u0131l\\u0131 sayfa d\\xfczeni i\\xe7in Diyanet izni bekleniyor \\u2014 ge\\xe7ici olarak se\\xe7ilemez',riwayetTr:'Hafs \\xb7 Diyanet 604',fontId:'diyanet-hafiz-kitabi',layoutMode:'mushaf',popularityTr:5,available:!1"
);

once(
  "marmara placeholder edition",
  "id:'amiri-sade',nameTr:'Amiri Kur\\'an Mushaf\\u0131'",
  "id:'marmara-muifv-hafizboy',nameTr:'Marmara \\u0130lahiyat haf\\u0131z boy (yak\\u0131nda)',descriptionTr:'M\\xdc\\u0130FV bas\\u0131l\\u0131 mushaf \\u2014 y\\xfcr\\xfct\\xfcc\\xfc lisans bekleniyor',riwayetTr:'Hafs \\xb7 M\\xdc\\u0130FV',fontId:'uthmanic-hafs',layoutMode:'mushaf',popularityTr:5,available:!1},{id:'amiri-sade',nameTr:'Amiri Kur\\'an Mushaf\\u0131'"
);

once(
  "settings mushaf intro",
  'children:"Kur\'an okuyucu, m\\xfcezzin ve namaz dualar\\u0131 \\u2014 se\\xe7ilen mushaf her yerde ge\\xe7erli"',
  'children:"Varsay\\u0131lan: KFGQPC bas\\u0131l\\u0131 Medine 604 (QCF). Diyanet / M\\xdc\\u0130FV haf\\u0131z boy izin sonras\\u0131 eklenecek."'
);

once(
  "settings edition press guard",
  "onPress:()=>T(c.id),children:[(0,p.jsx)(s.default,{style:h.optionHeader",
  "onPress:()=>{!1===c.available||T(c.id)},children:[(0,p.jsx)(s.default,{style:h.optionHeader"
);

once(
  "settings edition disabled style",
  "style:[h.option,u&&h.optionActive],onPress",
  "style:[h.option,u&&h.optionActive,!1===c.available&&{opacity:.42}],onPress"
);

once(
  "layout tag printed qcf",
  "children:'ezan-vakti'===c.layoutMode?'Sade sayfa':'Bas\\u0131l\\u0131 mushaf'",
  "children:!1===c.available?'\\u0130zin bekleniyor':'ezan-vakti'===c.layoutMode?'Sade sayfa (tek font)':'Bas\\u0131l\\u0131 mushaf (QCF)'"
);

fs.writeFileSync(ENTRY, s);
console.log("entry patches", n);

let html = fs.readFileSync(INDEX, "utf8");
html = html
  .replace(/qcf15/g, BUST)
  .replace(/2026-10-21-qcf15/g, "2026-10-21-gercek1")
  .replace(/bust: qcf15/, "bust: gercek1");
fs.writeFileSync(INDEX, html);

let sw = fs.readFileSync(SW, "utf8");
if (!sw.includes("gercek-mushaf")) {
  sw = "/* gercek-mushaf-edition */\n" + sw;
}
fs.writeFileSync(SW, sw);
console.log("cache bust", BUST);
