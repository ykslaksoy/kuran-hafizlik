#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const OUT =
  process.env.SHOT_DIR ||
  "/cursor/stores/bc-114252f7-dc62-4152-81a7-76cb5dd7da05/media/mushaf-gercek-kaynak";
const BASE = process.env.BASE || "http://127.0.0.1:3000";
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function ready(page, needSourceRibbon) {
  await page.waitForFunction(
    (needRibbon) => {
      const stage = document.getElementById("hy-qcf-stage");
      if (!stage || stage.classList.contains("hy-waiting")) return false;
      if (!needRibbon) return true;
      const src = document.getElementById("hy-qcf-source");
      return !!(src && src.textContent);
    },
    { timeout: 60000 },
    !!needSourceRibbon
  );
  await sleep(400);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("@hafizyol/onboarding-done-v2", "1");
      localStorage.setItem("hyPageStyle", "sade");
    } catch (e) {}
  });
  await page.goto(BASE + "/kuran?page=1", { waitUntil: "domcontentloaded", timeout: 60000 });
  const suffix = process.env.SHOT_SUFFIX || "sonra";
  await ready(page, suffix !== "once");
  const out1 = path.join(OUT, "kuran-page1-" + suffix + ".png");
  await page.screenshot({ path: out1, fullPage: false });
  await page.goto(BASE + "/ayarlar", { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  const out2 = path.join(OUT, "ayarlar-mushaf-secimi-" + suffix + ".png");
  await page.screenshot({ path: out2, fullPage: true });
  await browser.close();
  console.log("wrote", out1);
  console.log("wrote", out2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
