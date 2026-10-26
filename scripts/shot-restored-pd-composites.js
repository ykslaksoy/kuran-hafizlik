#!/usr/bin/env node
/** Overwrite p1/p2/p3 proof PNGs with live QCF composites (Tezhip + restored folios). */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const OUT =
  process.env.SHOT_DIR ||
  "/cursor/stores/bc-114252f7-dc62-4152-81a7-76cb5dd7da05/media";
const BASE = process.env.BASE || "http://127.0.0.1:3000";
const CHROME = process.env.CHROME || "/usr/local/bin/google-chrome";

const EDITIONS = [
  { id: "pd-mehmed-sevki-ssm", prefix: "mehmed-sevki-ssm", p3: "mehmed-sevki-ssm-restored-p3.png" },
  { id: "pd-ruzbihan-cbl-1558", prefix: "ruzbihan-cbl-1558", p3: "ruzbihan-cbl-1558-restored-p3.png" },
  { id: "pd-walters-w569", prefix: "w569", p3: "w569-restored-p3-sade2.png" },
  { id: "pd-walters-w557", prefix: "walters-w557", p3: "walters-w557-restored-p3.png" },
  { id: "pd-loc-or-15227", prefix: "loc15227", p3: "loc15227-restored-p3.png" },
  { id: "pd-loc-plmp-m131", prefix: "loc-plmp-m131", p3: "loc-plmp-m131-restored-p3.png" },
];

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
    { timeout: 90000 }
  );
  await sleep(600);
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
    localStorage.setItem("hyPageStyle", "tezhip");
    localStorage.setItem("hyOriginalHat", "0");
  });

  for (const ed of EDITIONS) {
    await page.evaluate((frameId) => {
      localStorage.setItem("hyPdFrameId", frameId);
      if (window.hyQcfMushaf && window.hyQcfMushaf.setStyle) {
        window.hyQcfMushaf.setStyle("tezhip");
      }
    }, ed.id);

    for (const n of [1, 2, 3]) {
      await page.goto(`${BASE}/kuran?page=${n}`, { waitUntil: "domcontentloaded", timeout: 90000 });
      await waitReady(page);
      await page.waitForFunction(
        () => {
          const img = document.querySelector("#hy-qcf-ornament .hy-pd-frame-img");
          return img && img.complete && img.naturalWidth > 0;
        },
        { timeout: 30000 }
      ).catch(() => {});
      await sleep(500);
      const name =
        n === 1
          ? `${ed.prefix}-restored-p1-fatiha.png`
          : n === 2
            ? `${ed.prefix}-restored-p2-bakara.png`
            : ed.p3;
      await page.screenshot({ path: path.join(OUT, name) });
      console.log("shot", name);
    }
  }
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
