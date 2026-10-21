#!/usr/bin/env node
/**
 * Mehmed Şevki: original + composite (qcf-v2, qcf-v1, digital-khatt-v2) × Fâtiha/Bakara.
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const HOST = process.env.HY_HOST || "127.0.0.1";
const PORT = process.env.PORT || "3000";
const BASE = `http://${HOST}:${PORT}/preview/mushaf-ms/index.html`;
const OUT = process.env.HY_ARTIFACTS || "/opt/cursor/artifacts";
const MS = "mehmed-sevki-gart";
const PAGES = [
  { n: 1, suffix: "fatiha" },
  { n: 2, suffix: "bakara" },
];
const FONTS = ["qcf-v2", "qcf-v1", "digital-khatt-v2"];

async function waitReady(page, composite) {
  await page.waitForFunction(
    (needGlyphs) => {
      if (document.body.getAttribute("data-hy-ms-ready") !== "1") return false;
      const stage = document.getElementById("hy-qcf-stage");
      if (!stage) return false;
      if (!needGlyphs) return true;
      const g = document.querySelector("#hy-qcf-glyphs");
      return g && g.querySelector(".hy-qcf-linebox, .hy-qcf-word, .hy-qcf-header");
    },
    composite,
    { timeout: 120000 }
  );
  await page.waitForTimeout(800);
}

async function shot(page, url, viewport, outFile, composite) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await waitReady(page, composite);
  await page.locator("#hy-qcf-stage").screenshot({ path: outFile, type: "png" });
  const { size } = await import("fs/promises").then((fs) => fs.stat(outFile));
  console.log("wrote", outFile, size, "bytes");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const { n, suffix } of PAGES) {
    const origUrl = `${BASE}?kuran=1&page=${n}&ms=${MS}&mode=original`;
    const hd = path.join(OUT, `sevki-original-${suffix}.png`);
    const ip = path.join(OUT, `sevki-original-${suffix}-iphone.png`);
    await shot(page, origUrl, { width: 1500, height: 2410 }, hd, false);
    await shot(page, origUrl, { width: 390, height: 844 }, ip, false);

    for (const font of FONTS) {
      const q = `kuran=1&page=${n}&ms=${MS}&mode=composite&font=${font}`;
      const url = `${BASE}?${q}`;
      const base = `sevki-composite-${font}-${suffix}`;
      await shot(page, url, { width: 1500, height: 2410 }, path.join(OUT, `${base}.png`), true);
      await shot(page, url, { width: 390, height: 844 }, path.join(OUT, `${base}-iphone.png`), true);
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
