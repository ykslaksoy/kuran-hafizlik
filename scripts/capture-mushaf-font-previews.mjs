#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const HOST = process.env.HY_HOST || "127.0.0.1";
const PORT = process.env.PORT || "3000";
const OUT = process.env.HY_ARTIFACTS || "/opt/cursor/artifacts";
const BASE = `http://${HOST}:${PORT}/preview/mushaf-fonts`;

const FONTS = [
  "qcf-v2",
  "qcf-v1",
  "qcf-v4",
  "kfgqpc-uthmanic-hafs",
  "digital-khatt-v2",
  "amiri-quran",
  "scheherazade-new",
  "noto-naskh-arabic",
  "uthman-taha",
  "indopak-nastaleeq",
  "diyanet-abay",
];

const PAGES = [
  { n: 1, suffix: "fatiha" },
  { n: 2, suffix: "bakara" },
];

async function waitReady(page, token) {
  await page.waitForFunction(
    (t) => document.body.getAttribute("data-hy-font-ready") === t,
    token,
    { timeout: 120000 }
  );
  await page.waitForTimeout(500);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  for (const font of FONTS) {
    for (const { n, suffix } of PAGES) {
      const token = `${font}-p${n}`;
      await page.setViewportSize({ width: 1600, height: 2600 });
      await page.goto(`${BASE}/index.html?font=${font}&page=${n}`, {
        waitUntil: "networkidle",
        timeout: 120000,
      });
      await waitReady(page, token);
      await page.locator("#hy-font-stage").screenshot({
        path: path.join(OUT, `font-${font}-${suffix}.png`),
        type: "png",
      });
      console.log("wrote", `font-${font}-${suffix}.png`);
    }
  }

  await page.setViewportSize({ width: 2200, height: 4200 });
  await page.goto(`${BASE}/compare.html`, { waitUntil: "networkidle", timeout: 120000 });
  await waitReady(page, "compare");
  await page.locator("#hy-font-root").screenshot({
    path: path.join(OUT, "fonts-karsilastirma-fatiha.png"),
    type: "png",
  });
  console.log("wrote fonts-karsilastirma-fatiha.png");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
