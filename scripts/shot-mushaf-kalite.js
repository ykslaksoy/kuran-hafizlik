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

async function ready(page, style) {
  await page.waitForFunction(
    (style) => {
      const stage = document.getElementById("hy-qcf-stage");
      const header = document.querySelector(".hy-qcf-header");
      const cls =
        style === "altin" ? "hy-style-altin" : style === "tezhip" ? "hy-style-tezhip" : "hy-style-sade";
      return !!(
        stage &&
        !stage.classList.contains("hy-waiting") &&
        document.body.classList.contains(cls) &&
        header
      );
    },
    { timeout: 60000 },
    style
  );
  await sleep(450);
}

async function pinTop(page) {
  await page.evaluate(() => {
    if (window.hyQcfMushaf) window.hyQcfMushaf.scrollActive = function () {};
  });
  for (var i = 0; i < 10; i++) {
    await page.evaluate(() => {
      if (window.hyQcfMushaf) window.hyQcfMushaf.scrollActive = function () {};
      var sc = document.getElementById("hy-qcf-scroll");
      if (sc) sc.scrollTop = 0;
    });
    await sleep(50);
  }
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
  await pinTop(page);
  await page.evaluate(() => {
    if (window.hyQcfMushaf) window.hyQcfMushaf.scrollActive = function () {};
    var hit = document.querySelector("#hy-qcf-overlay [data-hy-qcf]");
    if (hit && window.hyQuranTiming) {
      var p = (hit.getAttribute("data-hy-qcf") || "0-0-0").split("-");
      window.hyQuranTiming.setActive({ ayahIndex: +p[0], wordIndex: +p[1], letterIndex: +p[2] });
    }
  });
  await pinTop(page);
  const metrics = await page.evaluate(() => {
    var stage = document.getElementById("hy-qcf-stage");
    var glyphs = document.getElementById("hy-qcf-glyphs");
    var header = document.querySelector(".hy-qcf-header");
    var g = glyphs ? glyphs.getBoundingClientRect() : null;
    var arrow = document.getElementById("hy-track-arrow");
    var dock = document.getElementById("hy-player-dock");
    var chrome = document.getElementById("hy-qcf-chrome");
    var sc = document.getElementById("hy-qcf-scroll");
    return {
      style: document.body.classList.contains("hy-style-altin")
        ? "altin"
        : document.body.classList.contains("hy-style-tezhip")
          ? "tezhip"
          : "sade",
      chrome: (chrome && chrome.textContent) || "",
      dockRows: dock ? dock.querySelectorAll(".hy-player-row").length : 0,
      scale: document.getElementById("hy-qcf-host") && document.getElementById("hy-qcf-host").getAttribute("data-hy-scale"),
      land: window.innerWidth > window.innerHeight,
      scrollTop: sc && sc.scrollTop,
      glyphsTop: g && g.top,
      headerTop: header && header.getBoundingClientRect().top,
      stageW: stage && stage.offsetWidth,
      arrowOn: !!(arrow && getComputedStyle(arrow).display !== "none"),
      allah: document.querySelectorAll(".hy-qcf-allah").length,
      build: document.querySelector('meta[name="hafiz-yol-build"]') && document.querySelector('meta[name="hafiz-yol-build"]').content,
    };
  });
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
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--user-data-dir=/tmp/chrome-mushaf-kalite2"],
  });
  const portrait = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const land = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const jobs = [
    ["after-mushaf-sade-fatiha-portrait.png", 1, portrait, "sade"],
    ["after-mushaf-sade-fatiha-landscape.png", 1, land, "sade"],
    ["after-mushaf-altin-fatiha-portrait.png", 1, portrait, "altin"],
    ["after-mushaf-altin-bakara-portrait.png", 2, portrait, "altin"],
    ["after-mushaf-tezhip-fatiha-portrait.png", 1, portrait, "tezhip"],
    ["after-mushaf-tezhip-fatiha-landscape.png", 1, land, "tezhip"],
  ];
  const out = [];
  for (const j of jobs) {
    const r = await shot(browser, j[0], j[1], j[2], j[3]);
    out.push(r);
    console.log(JSON.stringify({ file: r.name, ...r.metrics }));
  }
  fs.writeFileSync(path.join(OUT, "mushaf-kalite-verify.json"), JSON.stringify(out, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
