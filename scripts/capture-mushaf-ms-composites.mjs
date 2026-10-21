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

async function waitReady(page) {
  await page.waitForFunction(
    () => {
      const stage = document.getElementById("hy-qcf-stage");
      return stage && document.body.getAttribute("data-hy-ms-ready") === "1";
    },
    { timeout: 120000 }
  );
  await page.waitForTimeout(600);
}

async function shot(page, url, viewport, outFile) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await waitReady(page);
  await page.locator("#hy-qcf-stage").screenshot({ path: outFile, type: "png" });
  console.log("wrote", outFile);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const { n, suffix } of PAGES) {
    const origUrl = `${BASE}?kuran=1&page=${n}&ms=${MS}&mode=original`;
    const hd = path.join(OUT, `sevki-original-${suffix}.png`);
    const ip = path.join(OUT, `sevki-original-${suffix}-iphone.png`);
    await shot(page, origUrl, { width: 1500, height: 2410 }, hd);
    await shot(page, origUrl, { width: 390, height: 844 }, ip);

    for (const font of FONTS) {
      const q = `kuran=1&page=${n}&ms=${MS}&mode=composite&font=${font}`;
      const url = `${BASE}?${q}`;
      const base = `sevki-composite-${font}-${suffix}`;
      await shot(page, url, { width: 1500, height: 2410 }, path.join(OUT, `${base}.png`));
      await shot(page, url, { width: 390, height: 844 }, path.join(OUT, `${base}-iphone.png`));
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
