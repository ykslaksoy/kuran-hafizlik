#!/usr/bin/env node
import { mkdir, writeFile, readFile, copyFile } from "fs/promises";
import path from "path";

const ROOT = path.resolve("/workspace/dist/preview/mushaf-ms");
const CACHE = path.join(ROOT, "cache");
const ART = process.env.HY_ARTIFACTS || "/opt/cursor/artifacts";
const UA = "HafizyolPreview/1.0 (license research)";

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(ART, { recursive: true });
  const list = JSON.parse(await readFile(path.join(ROOT, "manuscripts.json"), "utf8"));
  for (const m of list) {
    if (!m.usable || !m.download) continue;
    await new Promise((r) => setTimeout(r, 2500));
    const res = await fetch(m.download, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(m.id + " " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(path.join(CACHE, m.id + ".jpg"), buf);
    await writeFile(path.join(ART, m.artifact), buf);
    console.log("cached", m.id, buf.length);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
