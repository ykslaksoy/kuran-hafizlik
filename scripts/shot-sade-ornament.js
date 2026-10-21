#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const OUT = process.env.SHOT_DIR || "/opt/cursor/artifacts";
const BASE = process.env.BASE || "http://127.0.0.1:3000";
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ready(page, style) {
  await page.waitForFunction(
    (style) => {
      const stage = document.getElementById("hy-qcf-stage");
      const header = document.querySelector(".hy-qcf-header .hy-qcf-bsml");
      const meta = document.querySelector(".hy-qcf-header-meta");
      const cls = style === "altin" ? "hy-style-altin" : "hy-style-sade";
      return !!(
        stage &&
        !stage.classList.contains("hy-waiting") &&
        document.body.classList.contains(cls) &&
        header &&
        meta &&
        /آيات|آية/.test(meta.textContent || "")
      );
    },
    { timeout: 45000 },
    style
  );
  await sleep(400);
}

async function inspect(page) {
  return page.evaluate(() => {
    const header = document.querySelector(".hy-qcf-header");
    const meta = document.querySelector(".hy-qcf-header-meta");
    const bism = document.querySelector(".hy-qcf-bismillah");
    const chrome = document.getElementById("hy-qcf-chrome");
    const glyphs = document.getElementById("hy-qcf-glyphs");
    const g = glyphs ? getComputedStyle(glyphs) : null;
    const hs = header ? getComputedStyle(header) : null;
    const orn = document.getElementById("hy-qcf-ornament");
    const os = orn ? getComputedStyle(orn) : null;
    const linehl = document.getElementById("hy-qcf-linehl");
    const arrow = document.getElementById("hy-track-arrow");
    const fin = document.getElementById("hy-qcf-finial");
    const ends = document.querySelectorAll(".hy-qcf-end");
    const roses = Array.prototype.map.call(ends, (el) => getComputedStyle(el).backgroundImage || "");
    const codes = (el) =>
      el
        ? Array.prototype.map
            .call(el.querySelectorAll(".hy-qcf-bsml"), (n) => (n.textContent || "").charCodeAt(0))
            .join(",")
        : "";
    return {
      style: document.body.classList.contains("hy-style-altin")
        ? "altin"
        : document.body.classList.contains("hy-style-sade")
          ? "sade"
          : "other",
      chrome: (chrome && chrome.textContent) || "",
      headerCodes: codes(header),
      headerMeta: (meta && meta.textContent) || "",
      headerBg: hs && (hs.backgroundImage || "").slice(0, 90),
      headerSize: hs && hs.width + "x" + hs.height,
      ornamentBg: os && (os.backgroundImage || os.background || "").slice(0, 90),
      ornamentBox: os && os.boxShadow,
      bismCodes: codes(bism),
      glyphs: g ? { top: g.top, left: g.left, width: g.width, height: g.height } : null,
      design: {
        w: document.getElementById("hy-qcf-stage") && document.getElementById("hy-qcf-stage").offsetWidth,
        h: document.getElementById("hy-qcf-stage") && document.getElementById("hy-qcf-stage").offsetHeight,
      },
      hits: document.querySelectorAll("#hy-qcf-overlay [data-hy-qcf]").length,
      roseBg: roses[0] ? roses[0].slice(0, 90) : "",
      roses: roses.length,
      ayahNums: document.querySelectorAll(".hy-qcf-ayah-n").length,
      allah: document.querySelectorAll(".hy-qcf-allah").length,
      allahOn: document.body.classList.contains("hy-allah-on"),
      finial: !!(fin && fin.classList.contains("hy-on") && getComputedStyle(fin).display !== "none"),
      linehl: !!(linehl && getComputedStyle(linehl).display !== "none"),
      arrow: !!(arrow && getComputedStyle(arrow).display !== "none"),
      land: window.innerWidth > window.innerHeight,
    };
  });
}

async function shot(browser, name, pageNo, vp, style) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.setUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  );
  await page.evaluateOnNewDocument((style) => {
    try {
      localStorage.setItem("@hafizyol/onboarding-done-v2", "1");
      localStorage.setItem("hyPageStyle", style);
      localStorage.setItem("hyTimingSource", "hafizyol");
      localStorage.setItem("hyAllahColor", "1");
    } catch (e) {}
  }, style);
  await page.goto(BASE + "/kuran?page=" + pageNo, { waitUntil: "domcontentloaded", timeout: 60000 });
  await ready(page, style);
  await page.evaluate(() => {
    const sc = document.getElementById("hy-qcf-scroll");
    if (sc) sc.scrollTop = 0;
    const hit = document.querySelector("#hy-qcf-overlay [data-hy-qcf]");
    if (hit && window.hyQuranTiming) {
      const p = (hit.getAttribute("data-hy-qcf") || "0-0-0").split("-");
      window.hyQuranTiming.setActive({ ayahIndex: +p[0], wordIndex: +p[1], letterIndex: +p[2] });
    }
    if (sc) sc.scrollTop = 0;
  });
  await sleep(280);
  const metrics = await inspect(page);
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  await page.close();
  return { name, metrics };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--user-data-dir=/tmp/chrome-sade-ornament"],
  });
  const portrait = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const land = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const jobs = [
    ["sade_orn_fatiha_portrait.png", 1, portrait, "sade"],
    ["sade_orn_fatiha_landscape.png", 1, land, "sade"],
    ["sade_orn_bakara_portrait.png", 2, portrait, "sade"],
    ["sade_orn_bakara_landscape.png", 2, land, "sade"],
    ["altin_orn_fatiha_portrait.png", 1, portrait, "altin"],
    ["altin_orn_fatiha_landscape.png", 1, land, "altin"],
    ["altin_orn_bakara_portrait.png", 2, portrait, "altin"],
    ["altin_orn_bakara_landscape.png", 2, land, "altin"],
  ];
  const out = [];
  for (const j of jobs) {
    const r = await shot(browser, j[0], j[1], j[2], j[3]);
    out.push(r);
    console.log(JSON.stringify({ file: r.name, ...r.metrics }));
  }
  fs.writeFileSync(path.join(OUT, "sade_ornament_verify.json"), JSON.stringify(out, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
