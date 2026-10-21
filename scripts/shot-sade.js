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

async function ready(page) {
  await page.waitForFunction(
    () => {
      const stage = document.getElementById("hy-qcf-stage");
      const chrome = document.getElementById("hy-qcf-chrome");
      return !!(
        stage &&
        !stage.classList.contains("hy-waiting") &&
        document.body.classList.contains("hy-style-sade") &&
        chrome &&
        /Cüz/.test(chrome.textContent || "") &&
        document.querySelector("#hy-qcf-overlay [data-hy-qcf]")
      );
    },
    { timeout: 45000 }
  );
  await sleep(350);
}

async function putArrow(page, ayah, t) {
  await page.evaluate(
    (ayah, t) => {
      const hy = window.hyQuranTiming;
      const hit = hy.atTime("alafasy", 1, ayah, t, [{ ayahIndex: ayah - 1, wordIndex: 0, letterIndex: 0 }]);
      hy.setActive(hit);
      if (window.hyQcfMushaf && window.hyQcfMushaf.setChromeVerse) {
        window.hyQcfMushaf.setChromeVerse({ surah: 1, ayah: ayah });
      }
    },
    ayah,
    t
  );
  await sleep(200);
}

async function measure(page) {
  return page.evaluate(() => {
    const stage = document.getElementById("hy-qcf-stage");
    const glyphs = document.getElementById("hy-qcf-glyphs");
    const chrome = document.getElementById("hy-qcf-chrome");
    const host = document.getElementById("hy-qcf-host");
    const scroll = document.getElementById("hy-qcf-scroll");
    const fit = document.getElementById("hy-qcf-fit");
    const dock = document.getElementById("hy-player-dock");
    const arrow = document.getElementById("hy-track-arrow");
    const hl = document.getElementById("hy-qcf-hl");
    const orn = document.getElementById("hy-qcf-ornament");
    const g = glyphs ? getComputedStyle(glyphs) : null;
    const dockR = dock && dock.getBoundingClientRect();
    const fitR = fit && fit.getBoundingClientRect();
    const ar = arrow && arrow.getBoundingClientRect();
    return {
      style: document.body.classList.contains("hy-style-sade") ? "sade" : "other",
      chrome: (chrome && chrome.textContent) || "",
      design: stage ? { w: stage.offsetWidth, h: stage.offsetHeight } : null,
      glyphs: g ? { top: g.top, left: g.left, width: g.width, height: g.height } : null,
      svgOn: !!(orn && orn.querySelector("svg") && getComputedStyle(orn.querySelector("svg")).display !== "none"),
      frame: orn ? getComputedStyle(orn).borderTopWidth + " " + getComputedStyle(orn).borderTopColor : "",
      fitW: fitR && Math.round(fitR.width),
      viewW: window.innerWidth,
      viewH: window.innerHeight,
      land: window.innerWidth > window.innerHeight,
      scrollH: scroll && scroll.scrollHeight,
      clientH: scroll && scroll.clientHeight,
      arrowOn: !!(arrow && arrow.style.display !== "none" && ar && ar.height > 0),
      hlOn: !!(hl && hl.style.display !== "none"),
      dockTop: dockR && dockR.top,
      pageBottom: fitR && fitR.bottom,
      hostBottom: host && host.getBoundingClientRect().bottom,
      pageCovered: !!(dockR && fitR && fitR.bottom > dockR.top + 8 && fitR.top < dockR.top),
    };
  });
}

async function shot(browser, name, pageNo, vp, ayah) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  await page.setUserAgent(
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
  );
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("@hafizyol/onboarding-done-v2", "1");
      localStorage.setItem("hyPageStyle", "sade");
      localStorage.setItem("hyTimingSource", "hafizyol");
    } catch (e) {}
  });
  await page.goto(BASE + "/kuran?page=" + pageNo, { waitUntil: "domcontentloaded", timeout: 60000 });
  await ready(page);
  if (pageNo === 1) await putArrow(page, ayah || 1, 0.25);
  else {
    await page.evaluate(() => {
      const hit = document.querySelector("#hy-qcf-overlay [data-hy-qcf]");
      if (hit && window.hyQuranTiming) {
        const p = (hit.getAttribute("data-hy-qcf") || "0-0-0").split("-");
        window.hyQuranTiming.setActive({ ayahIndex: +p[0], wordIndex: +p[1], letterIndex: +p[2] });
      }
    });
    await sleep(200);
  }
  const metrics = await measure(page);
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
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
  });
  const portrait = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const land = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const jobs = [
    ["sade_iphone_portrait_fatiha.png", 1, portrait, 1],
    ["sade_iphone_portrait_bakara.png", 2, portrait, 1],
    ["sade_iphone_landscape_fatiha.png", 1, land, 1],
    ["sade_iphone_landscape_bakara.png", 2, land, 1],
  ];
  const out = [];
  for (const j of jobs) {
    const r = await shot(browser, j[0], j[1], j[2], j[3]);
    out.push(r);
    console.log(JSON.stringify({ file: r.name, ...r.metrics }));
  }
  fs.writeFileSync(path.join(OUT, "sade_verify.json"), JSON.stringify(out, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
