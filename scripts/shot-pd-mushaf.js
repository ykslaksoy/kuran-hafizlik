#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const OUT =
  process.env.SHOT_DIR ||
  "/cursor/stores/bc-114252f7-dc62-4152-81a7-76cb5dd7da05/media";
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
      return glyphs.children.length > 0;
    },
    { timeout: 60000 }
  );
  await sleep(500);
}

async function setStyle(page, style) {
  await page.evaluate((s) => {
    if (window.hyQcfMushaf && window.hyQcfMushaf.setStyle) window.hyQcfMushaf.setStyle(s);
  }, style);
  await sleep(600);
}

async function setHat(page, on) {
  await page.evaluate((v) => {
    if (window.hyQcfMushaf && window.hyQcfMushaf.setOriginalHat) window.hyQcfMushaf.setOriginalHat(v);
  }, on);
  await sleep(400);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
    defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true },
  });
  const page = await browser.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(() => {
    localStorage.setItem("@hafizyol/onboarding-done-v2", "1");
    localStorage.setItem("hyTimingSource", "hafizyol");
    localStorage.setItem("hyAllahColor", "1");
    localStorage.setItem("hyPdFrameId", "pd-walters-w569");
  });
  await page.goto(BASE + "/kuran?page=1", { waitUntil: "domcontentloaded", timeout: 90000 });
  await waitReady(page);

  await setStyle(page, "sade");
  await page.screenshot({ path: path.join(OUT, "pd-mushaf-sade-fatiha-portrait.png") });

  await setStyle(page, "tezhip");
  await page.waitForFunction(
    () => {
      const orn = document.getElementById("hy-qcf-ornament");
      return !!(orn && orn.querySelector(".hy-pd-frame-img"));
    },
    { timeout: 20000 }
  ).catch(() => {});
  await sleep(400);
  await page.screenshot({ path: path.join(OUT, "pd-mushaf-tezhip-frame-portrait.png") });

  await setHat(page, true);
  await sleep(500);
  await page.screenshot({ path: path.join(OUT, "pd-mushaf-original-hat-portrait.png") });

  await browser.close();
  console.log("shots in", OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
