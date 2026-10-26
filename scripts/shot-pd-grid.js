#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const OUT =
  process.env.SHOT_DIR ||
  "/cursor/stores/bc-114252f7-dc62-4152-81a7-76cb5dd7da05/media";
const BASE = process.env.BASE || "http://127.0.0.1:3000";
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";

const EDITIONS = [
  { id: "pd-mehmed-sevki-ssm", slug: "mehmed-sevki-ssm" },
  { id: "pd-ruzbihan-cbl-1558", slug: "ruzbihan-cbl-1558" },
  { id: "pd-walters-w569", slug: "walters-w569" },
  { id: "pd-walters-w557", slug: "walters-w557" },
  { id: "pd-loc-or-15227", slug: "loc-or-15227" },
  { id: "pd-loc-plmp-m131", slug: "loc-plmp-m131" },
];

const PAGES = [1, 2, 3];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function prep(page) {
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(() => {
    localStorage.setItem("@hafizyol/onboarding-done-v2", "1");
    localStorage.setItem("hyTimingSource", "hafizyol");
    localStorage.setItem("hyAllahColor", "1");
    localStorage.setItem("hyOriginalHat", "0");
    localStorage.setItem("hyPageStyle", "tezhip");
  });
}

async function waitMushaf(page, pageNo) {
  await page.goto(BASE + "/kuran?page=" + pageNo, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(
    (p) => {
      const stage = document.getElementById("hy-qcf-stage");
      const glyphs = document.getElementById("hy-qcf-glyphs");
      if (!stage || !glyphs || stage.classList.contains("hy-waiting")) return false;
      if (!glyphs.children.length) return false;
      const painted = window.hyQcfMushaf && window.hyQcfMushaf.paintedPage && window.hyQcfMushaf.paintedPage();
      return painted === p;
    },
    { timeout: 60000 },
    pageNo
  );
  await page.waitForFunction(
    () => {
      const orn = document.getElementById("hy-qcf-ornament");
      return !!(orn && orn.querySelector(".hy-pd-frame-img"));
    },
    { timeout: 20000 }
  );
  await sleep(450);
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
  await page.setCacheEnabled(false);
  await prep(page);
  const saved = [];

  for (const ed of EDITIONS) {
    for (const p of PAGES) {
      await page.evaluate((id) => {
        localStorage.setItem("hyPdFrameId", id);
        localStorage.setItem("hyPageStyle", "tezhip");
        localStorage.setItem("hyOriginalHat", "0");
        if (window.hyQcfMushaf && window.hyQcfMushaf.setStyle) window.hyQcfMushaf.setStyle("tezhip");
      }, ed.id);
      await waitMushaf(page, p);
      const name = `pd-${ed.slug}-p${p}-tezhip.png`;
      const file = path.join(OUT, name);
      await page.screenshot({ path: file, fullPage: false });
      saved.push(name);
      console.log("saved", name);
    }
  }

  fs.writeFileSync(path.join(OUT, "pd-grid-index.json"), JSON.stringify({ saved, at: new Date().toISOString() }, null, 2));
  await browser.close();
  console.log("total", saved.length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
