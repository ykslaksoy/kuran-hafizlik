#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdir, readFile } from "fs/promises";
import path from "path";

const HOST = process.env.HY_HOST || "127.0.0.1";
const PORT = process.env.PORT || "3000";
const BASE = `http://${HOST}:${PORT}/preview/mushaf-ms/index.html`;
const OUT = process.env.HY_ARTIFACTS || "/opt/cursor/artifacts";
const PAGES = [1, 2];

async function waitReady(page) {
  await page.waitForFunction(
    () => {
      const stage = document.getElementById("hy-qcf-stage");
      return stage && !stage.classList.contains("hy-waiting") && document.body.getAttribute("data-hy-ms-ready") === "1";
    },
    { timeout: 120000 }
  );
  await page.waitForTimeout(500);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const list = JSON.parse(await readFile("/workspace/dist/preview/mushaf-ms/manuscripts.json", "utf8"));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const m of list.filter((x) => x.usable)) {
    for (const p of PAGES) {
      const suffix = p === 1 ? "fatiha" : "bakara";
      const url = `${BASE}?kuran=1&page=${p}&ms=${m.id}`;
      await page.setViewportSize({ width: 1500, height: 2410 });
      await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
      await waitReady(page);
      const file = path.join(OUT, `ms-${m.id}-${suffix}.png`);
      await page.locator("#hy-qcf-stage").screenshot({ path: file, type: "png" });
      console.log("wrote", file);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(url, { waitUntil: "networkidle", timeout: 120000 });
      await waitReady(page);
      await page.locator("#hy-qcf-stage").screenshot({
        path: path.join(OUT, `ms-${m.id}-${suffix}-iphone.png`),
        type: "png",
      });
    }
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
