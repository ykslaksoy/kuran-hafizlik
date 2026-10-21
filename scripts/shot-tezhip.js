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

async function waitReady(page) {
  await page.waitForFunction(
    () => {
      const stage = document.getElementById("hy-qcf-stage");
      const glyphs = document.getElementById("hy-qcf-glyphs");
      if (!stage || !glyphs) return false;
      if (stage.classList.contains("hy-waiting")) return false;
      if (!glyphs.children.length) return false;
      return true;
    },
    { timeout: 45000 }
  );
  await page.waitForFunction(
    () => {
      const orn = document.getElementById("hy-qcf-ornament");
      return !!(orn && orn.querySelector("svg #tezhip-std"));
    },
    { timeout: 15000 }
  ).catch(() => {});
  await sleep(400);
}

async function measure(page) {
  return page.evaluate(() => {
    const stage = document.getElementById("hy-qcf-stage");
    const glyphs = document.getElementById("hy-qcf-glyphs");
    const orn = document.getElementById("hy-qcf-ornament");
    const spec = document.getElementById("hy-qcf-special-frame");
    const host = document.getElementById("hy-qcf-host");
    const dock = document.getElementById("hy-player-dock");
    const overlay = document.getElementById("hy-qcf-overlay");
    const csBody = getComputedStyle(document.body);
    const csHost = host ? getComputedStyle(host) : null;
    const csSpec = spec ? getComputedStyle(spec) : null;
    const csOrn = orn ? getComputedStyle(orn) : null;
    const gcs = glyphs ? getComputedStyle(glyphs) : null;
    const header = document.querySelector(".hy-qcf-header");
    const end = document.querySelector(".hy-qcf-end");
    const dockR = dock ? dock.getBoundingClientRect() : null;
    const hostR = host ? host.getBoundingClientRect() : null;
    const fit = document.getElementById("hy-qcf-fit");
    return {
      painted: window.hyQcfMushaf && window.hyQcfMushaf.paintedPage(),
      waiting: !!(stage && stage.classList.contains("hy-waiting")),
      special: !!(stage && stage.classList.contains("hy-special")),
      design: stage ? { w: stage.offsetWidth, h: stage.offsetHeight } : null,
      glyphs: gcs
        ? { top: gcs.top, left: gcs.left, width: gcs.width, height: gcs.height }
        : null,
      bodyBg: csBody && csBody.backgroundColor,
      hostBg: csHost && csHost.backgroundColor,
      specRadius: csSpec && csSpec.borderRadius,
      specDisplay: csSpec && csSpec.display,
      ornInset: csOrn && { top: csOrn.top, right: csOrn.right, bottom: csOrn.bottom, left: csOrn.left },
      tezhip: !!(orn && orn.querySelector("svg")),
      unvanOn: !!(orn && orn.querySelector(".tezhip-unvan") && getComputedStyle(orn.querySelector(".tezhip-unvan")).display !== "none"),
      headerColor: header ? getComputedStyle(header).color : null,
      headerBg: header ? getComputedStyle(header).backgroundColor : null,
      endBg: end ? getComputedStyle(end).backgroundImage : null,
      overlayHits: overlay ? overlay.querySelectorAll("[data-hy-qcf]").length : 0,
      lines: glyphs ? glyphs.querySelectorAll(".hy-qcf-linebox").length : 0,
      dockTop: dockR && dockR.top,
      hostBottom: hostR && hostR.bottom,
      pageCoveredByDock: !!(dockR && hostR && hostR.bottom > dockR.top + 2),
      fit: fit ? { w: Math.round(fit.getBoundingClientRect().width), h: Math.round(fit.getBoundingClientRect().height) } : null,
      brownGone: !/61,\s*50,\s*36/.test((csBody && csBody.backgroundColor) || "") && !/61,\s*50,\s*36/.test((csHost && csHost.backgroundColor) || ""),
    };
  });
}

async function shot(browser, kind, pageNo, vp) {
  const page = await browser.newPage();
  await page.setViewport(vp);
  if (vp.isMobile) {
    await page.setUserAgent(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    );
  }
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("@hafizyol/onboarding-done-v2", "1");
    } catch (e) {}
  });
  await page.goto(`${BASE}/kuran?page=${pageNo}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await waitReady(page);
  const metrics = await measure(page);
  const name = `tezhip_${kind}_page${pageNo}.png`;
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  await page.close();
  return { name, file, metrics };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
  });
  const jobs = [
    ["iphone", 1, { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ["iphone", 2, { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ["iphone", 50, { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
    ["desktop", 1, { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false }],
    ["desktop", 2, { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false }],
    ["desktop", 50, { width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false }],
  ];
  const results = [];
  for (const job of jobs) {
    const r = await shot(browser, job[0], job[1], job[2]);
    results.push({ kind: job[0], page: job[1], ...r });
    console.log(JSON.stringify({ kind: job[0], page: job[1], file: r.name, ...r.metrics }, null, 0));
  }
  fs.writeFileSync(path.join(OUT, "tezhip_verify.json"), JSON.stringify(results, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
