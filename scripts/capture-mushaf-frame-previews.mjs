#!/usr/bin/env node
/**
 * Mushaf çerçeve önizleme ekran görüntüleri (A/B/C/D × sayfa 1 & 2).
 */
import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import path from "path";

const HOST = process.env.HY_HOST || "127.0.0.1";
const PORT = process.env.PORT || "3000";
const BASE = `http://${HOST}:${PORT}/preview/mushaf-frames/index.html`;
const OUT = process.env.HY_ARTIFACTS || "/opt/cursor/artifacts";

const ALTS = ["A", "B", "C", "D"];
const PAGES = [1, 2];

async function waitForPage(page) {
  await page.waitForFunction(
    () => {
      const stage = document.getElementById("hy-qcf-stage");
      return stage && !stage.classList.contains("hy-waiting") && document.body.getAttribute("data-hy-preview-ready") === "1";
    },
    { timeout: 90000 }
  );
  await page.waitForTimeout(400);
}

async function shot(page, url, viewport, outFile) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
  await waitForPage(page);
  const stage = page.locator("#hy-qcf-stage");
  await stage.screenshot({ path: outFile, type: "png" });
  console.log("wrote", outFile);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  for (const alt of ALTS) {
    for (const p of PAGES) {
      const q = `kuran=1&page=${p}&alt=${alt}`;
      const url = `${BASE}?${q}`;
      const base = `alt-${alt}-sayfa${p}`;
      await shot(page, url, { width: 390, height: 844 }, path.join(OUT, `${base}-iphone.png`));
      await shot(page, url, { width: 1500, height: 2410 }, path.join(OUT, `${base}.png`));
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
