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
      const header = document.querySelector(".hy-qcf-header .hy-qcf-bsml");
      return !!(
        stage &&
        !stage.classList.contains("hy-waiting") &&
        document.body.classList.contains("hy-style-sade") &&
        header
      );
    },
    { timeout: 45000 }
  );
  await sleep(400);
}

async function inspect(page) {
  return page.evaluate(() => {
    const header = document.querySelector(".hy-qcf-header");
    const bism = document.querySelector(".hy-qcf-bismillah");
    const chrome = document.getElementById("hy-qcf-chrome");
    const glyphs = document.getElementById("hy-qcf-glyphs");
    const g = glyphs ? getComputedStyle(glyphs) : null;
    const hs = header ? getComputedStyle(header) : null;
    const bs = bism ? getComputedStyle(bism) : null;
    const codes = (el) =>
      el
        ? Array.prototype.map
            .call(el.querySelectorAll(".hy-qcf-bsml"), (n) => (n.textContent || "").charCodeAt(0))
            .join(",")
        : "";
    return {
      chrome: (chrome && chrome.textContent) || "",
      headerFont: hs && hs.fontFamily,
      headerCodes: codes(header),
      headerBorder: hs && hs.borderTopWidth + " " + hs.borderTopColor,
      bismFont: bs && bs.fontFamily,
      bismCodes: codes(bism),
      glyphs: g ? { top: g.top, left: g.left, width: g.width, height: g.height } : null,
      design: {
        w: document.getElementById("hy-qcf-stage") && document.getElementById("hy-qcf-stage").offsetWidth,
        h: document.getElementById("hy-qcf-stage") && document.getElementById("hy-qcf-stage").offsetHeight,
      },
      hits: document.querySelectorAll("#hy-qcf-overlay [data-hy-qcf]").length,
      land: window.innerWidth > window.innerHeight,
    };
  });
}

async function shot(browser, name, pageNo, vp) {
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
  await sleep(250);
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
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--user-data-dir=/tmp/chrome-qcf-header"],
  });
  const portrait = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const land = { width: 844, height: 390, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  const jobs = [
    ["sade_qcf_bakara_portrait.png", 2, portrait],
    ["sade_qcf_bakara_landscape.png", 2, land],
  ];
  const out = [];
  for (const j of jobs) {
    const r = await shot(browser, j[0], j[1], j[2]);
    out.push(r);
    console.log(JSON.stringify({ file: r.name, ...r.metrics }));
  }
  fs.writeFileSync(path.join(OUT, "sade_qcf_header_verify.json"), JSON.stringify(out, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
