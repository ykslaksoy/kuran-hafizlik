#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const OUT = process.env.SHOT_DIR || "/cursor/stores/bc-114252f7-dc62-4152-81a7-76cb5dd7da05/media";
const BASE = process.env.BASE || "http://127.0.0.1:3000";
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ready(page) {
  await page.waitForFunction(() => {
    const stage = document.getElementById("hy-qcf-stage");
    const title = document.querySelector(".hy-chrome-title");
    return !!(
      stage &&
      !stage.classList.contains("hy-waiting") &&
      document.body.classList.contains("hy-style-sade") &&
      title &&
      /Suresi$/.test((title.textContent || "").trim()) &&
      !/\d+\.\s*Ayet/.test((title.textContent || ""))
    );
  }, { timeout: 60000 });
  await sleep(500);
}

async function pinTop(page) {
  await page.evaluate(() => {
    const hit = document.querySelector("#hy-qcf-overlay [data-hy-qcf]");
    if (hit && window.hyQuranTiming) {
      const p = (hit.getAttribute("data-hy-qcf") || "0-0-0").split("-");
      window.hyQuranTiming.setActive({ ayahIndex: +p[0], wordIndex: +p[1], letterIndex: +p[2] });
    }
  });
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => {
      if (window.hyQcfMushaf) window.hyQcfMushaf.scrollActive = function () {};
      const sc = document.getElementById("hy-qcf-scroll");
      if (sc) sc.scrollTop = 0;
    });
    await sleep(50);
  }
}

async function shot(browser, name, pageNo, vp) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem("@hafizyol/onboarding-done-v2", "1");
    localStorage.setItem("hyPageStyle", "sade");
    localStorage.setItem("hyAllahColor", "1");
    localStorage.setItem("hyTimingSource", "hafizyol");
  });
  await page.goto(BASE + "/kuran?page=" + pageNo, { waitUntil: "domcontentloaded", timeout: 60000 });
  await ready(page);
  await pinTop(page);
  const metrics = await page.evaluate(() => {
    const title = document.querySelector(".hy-chrome-title");
    const meta = document.querySelector(".hy-chrome-meta");
    const nums = Array.prototype.map.call(document.querySelectorAll(".hy-qcf-ayah-n"), (n) => n.textContent || "");
    const headerMeta = document.querySelector(".hy-qcf-header-meta");
    return {
      title: (title && title.textContent) || "",
      meta: (meta && meta.textContent) || "",
      headerMeta: (headerMeta && headerMeta.textContent) || "",
      ayahNums: nums.slice(0, 4),
      finial: !!document.getElementById("hy-qcf-finial"),
      build: document.querySelector('meta[name="hafiz-yol-build"]') && document.querySelector('meta[name="hafiz-yol-build"]').content,
    };
  });
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  await page.close();
  return { name, metrics };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--user-data-dir=/tmp/chrome-sade-ref"],
  });
  const portrait = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const land = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const out = [];
  for (const j of [
    ["sade-reference-match-fatiha-portrait.png", 1, portrait],
    ["sade-reference-match-fatiha-landscape.png", 1, land],
    ["sade-reference-match-bakara-portrait.png", 2, portrait],
  ]) {
    const r = await shot(browser, j[0], j[1], j[2]);
    out.push(r);
    console.log(JSON.stringify({ file: r.name, ...r.metrics }));
  }
  fs.writeFileSync(path.join(OUT, "sade-reference-match-verify.json"), JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
