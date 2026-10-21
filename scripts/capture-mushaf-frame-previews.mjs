#!/usr/bin/env node
/**
 * Mushaf çerçeve E/F × sayfa 1 & 2 (+ referans karşılaştırma).
 */
import { chromium } from "playwright";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";

const HOST = process.env.HY_HOST || "127.0.0.1";
const PORT = process.env.PORT || "3000";
const BASE = `http://${HOST}:${PORT}/preview/mushaf-frames/index.html`;
const OUT = process.env.HY_ARTIFACTS || "/opt/cursor/artifacts";

const ALTS = ["E", "F"];
const PAGES = [1, 2];

const REFS = {
  E: {
    label: "Kadıasker Mustafa İzzet (PD-Art)",
    url: "https://upload.wikimedia.org/wikipedia/commons/8/89/Copied_by_Kad%C4%B1asker_Mustafa_%C4%B0zzet_Efendi_-_Qur%E2%80%99an_-_Google_Art_Project.jpg",
    license: "Public domain (PD-Art, ölüm+100)",
  },
  F: {
    label: "Şeyh Hamdullah 1503–04 (PD-Art)",
    url: "https://upload.wikimedia.org/wikipedia/commons/5/5b/First_pages_of_the_Quran_written_by_%C5%9Eeyh_Hamdullah_in_1503-1504%2C_Topkapi_A._5.jpg",
    license: "Public domain (PD-Art)",
  },
};

async function waitForPage(page) {
  await page.waitForFunction(
    () => {
      const stage = document.getElementById("hy-qcf-stage");
      return stage && !stage.classList.contains("hy-waiting") && document.body.getAttribute("data-hy-preview-ready") === "1";
    },
    { timeout: 120000 }
  );
  await page.waitForTimeout(600);
}

async function shot(page, url, viewport, outFile) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await waitForPage(page);
  await page.locator("#hy-qcf-stage").screenshot({ path: outFile, type: "png" });
  console.log("wrote", outFile);
}

async function downloadRef(alt) {
  const ref = REFS[alt];
  const out = path.join(OUT, `ref-${alt}-commons.jpg`);
  const res = await fetch(ref.url, { headers: { "User-Agent": "HafizyolPreview/1.0" } });
  if (!res.ok) throw new Error("ref download " + alt + " " + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(out, buf);
  return { out, ref };
}

async function comparison(page, alt, pageNum, ourPng) {
  const { out: refPath, ref } = await downloadRef(alt);
  const ourB64 = (await readFile(ourPng)).toString("base64");
  const refB64 = (await readFile(refPath)).toString("base64");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
    *{box-sizing:border-box} body{margin:0;background:#111;font-family:system-ui,sans-serif;color:#ddd}
    h1{font-size:14px;font-weight:600;padding:12px 16px;margin:0}
    .row{display:flex;gap:12px;padding:12px;align-items:flex-start;justify-content:center}
    .col{flex:1;max-width:49%}
    .col img{width:100%;height:auto;display:block;border:1px solid #333}
    .cap{font-size:11px;padding:8px 4px 0;color:#aaa;line-height:1.35}
  </style></head><body>
  <h1>Karşılaştırma — Alternatif ${alt} · sayfa ${pageNum} · ${ref.label}</h1>
  <div class="row">
    <div class="col"><img src="data:image/png;base64,${ourB64}" alt="Hafızyol önizleme"/><div class="cap">Hafızyol önizleme (E/F SVG/CSS, QCF metin sabit)</div></div>
    <div class="col"><img src="data:image/jpeg;base64,${refB64}" alt="referans"/><div class="cap">Wikimedia Commons referans — ${ref.license}. Yalnızca rapor; repoda değil.</div></div>
  </div></body></html>`;
  const cmp = path.join(OUT, `alt-${alt}-sayfa${pageNum}-karsilastirma.html`);
  await writeFile(cmp, html);
  await page.setViewportSize({ width: 2200, height: 1400 });
  await page.goto("file://" + cmp, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(400);
  const png = path.join(OUT, `alt-${alt}-sayfa${pageNum}-karsilastirma.png`);
  await page.screenshot({ path: png, fullPage: true });
  console.log("wrote", png);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  for (const alt of ALTS) {
    for (const p of PAGES) {
      const q = `kuran=1&page=${p}&alt=${alt}`;
      const url = `${BASE}?${q}`;
      const base = `alt-${alt}-sayfa${p}`;
      const hd = path.join(OUT, `${base}.png`);
      await shot(page, url, { width: 390, height: 844 }, path.join(OUT, `${base}-iphone.png`));
      await shot(page, url, { width: 1500, height: 2410 }, hd);
      await comparison(page, alt, p, hd);
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
