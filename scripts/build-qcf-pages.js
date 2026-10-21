#!/usr/bin/env node
/**
 * Bake QCF V2 (KFGQPC / quran.com) page layouts for Medine 604.
 * Pages 1–2 are stored locally; 3–604 are fetched at runtime.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");

const OUT = path.resolve(__dirname, "..", "dist/assets/mushaf");
const FONT_DIR = path.join(OUT, "fonts", "qcf");
const API = "https://api.qurancdn.com/api/qdc/verses/by_page";
const FONT = "https://verses.quran.foundation/fonts/quran/hafs/v2/woff2";

function getBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Hafizyol/1.0" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return getBuffer(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(url + " " + res.statusCode));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "Hafizyol/1.0", Accept: "application/json" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          reject(new Error(url + " " + res.statusCode));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function compactPage(page, data) {
  const lines = {};
  const verses = [];
  const marks = [];
  for (const v of data.verses || []) {
    const [surah, ayah] = String(v.verse_key).split(":").map(Number);
    const words = [];
    for (const w of v.words || []) {
      const type = w.char_type_name === "end" ? "end" : "word";
      const line = Number(w.line_number) || 1;
      const rec = {
        code: w.code_v2 || "",
        uth: w.text_uthmani || "",
        line,
        type,
        pos: Number(w.position) || words.length + 1,
      };
      words.push(rec);
      if (!lines[line]) lines[line] = [];
      lines[line].push({
        surah,
        ayah,
        pos: rec.pos,
        code: rec.code,
        type,
        uth: rec.uth,
      });
    }
    const verse = {
      surah,
      ayah,
      key: v.verse_key,
      juz: v.juz_number || 1,
      hizb: v.hizb_number || 1,
      rub: v.rub_el_hizb_number || 1,
      sajdah: v.sajdah_number || null,
      words,
    };
    verses.push(verse);
    if (v.sajdah_number) marks.push({ kind: "sajdah", surah, ayah, line: words[0] && words[0].line });
  }
  const lineNos = Object.keys(lines)
    .map(Number)
    .sort((a, b) => a - b);
  return {
    page,
    mushaf: "qcf-v2",
    font: `/assets/mushaf/fonts/qcf/p${page}.woff2`,
    fontRemote: `${FONT}/p${page}.woff2`,
    juz: (verses[0] && verses[0].juz) || 1,
    lines: lineNos.map((n) => ({ n, words: lines[n] })),
    verses,
    marks,
    special: page <= 2,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(FONT_DIR, { recursive: true });
  const pages = {};
  for (const n of [1, 2, 3, 50, 604]) {
    const url = `${API}/${n}?words=true&word_fields=code_v2,text_uthmani,line_number,char_type_name`;
    const data = await get(url);
    const page = compactPage(n, data);
    pages[n] = page;
    fs.writeFileSync(path.join(OUT, `qcf-page-${n}.json`), JSON.stringify(page));
    const fontBuf = await getBuffer(`${FONT}/p${n}.woff2`);
    fs.writeFileSync(path.join(FONT_DIR, `p${n}.woff2`), fontBuf);
    console.log("wrote page", n, "lines", page.lines.map((l) => l.n).join(","), "verses", page.verses.length, "font", fontBuf.length);
  }
  const chaptersRaw = await get("https://api.qurancdn.com/api/qdc/chapters?language=ar");
  const chapters = (chaptersRaw.chapters || []).map((c) => ({
    id: c.id,
    name: c.name_arabic,
    pages: c.pages,
    bismillah: !!c.bismillah_pre,
  }));
  fs.writeFileSync(path.join(OUT, "qcf-chapters.json"), JSON.stringify(chapters));
  const index = {
    editionId: "medine604-qcf",
    mushaf: "qcf-v2",
    pages: 604,
    special: [1, 2],
    lineCount: 15,
    fontBase: FONT,
    fontLocal: "/assets/mushaf/fonts/qcf/p{page}.woff2",
    api: `${API}/{page}?words=true&word_fields=code_v2,text_uthmani,line_number,char_type_name`,
    baked: [1, 2, 3, 50, 604],
    license:
      "QCF V2 page fonts: King Fahd Glorious Quran Printing Complex (KFGQPC). Same-origin copies of p1/p2/p3/p50/p604 woff2 for FOUT-free render; remote source Quran Foundation / quran.com. Page-line-word layout: quran.com QDC / QUL. Hafızyol does not copy Ezan Vakti PNG or assets.",
  };
  fs.writeFileSync(path.join(OUT, "qcf-index.json"), JSON.stringify(index, null, 2));
  console.log("chapters", chapters.length);
  console.log("ok", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
