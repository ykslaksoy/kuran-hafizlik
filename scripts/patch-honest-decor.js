#!/usr/bin/env node
/**
 * Remove fake «Tezhip» page style; keep Sade + Sade Altın only.
 * Adds honest decor disclaimer on Kur'an source ribbon.
 * Run after mushaf asset edits; bumps dist cache to dekor1.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const INDEX = path.join(ROOT, "dist/index.html");
const QCF = path.join(ROOT, "dist/assets/mushaf/qcf-mushaf.js");

function bumpBust(file, from, to) {
  let s = fs.readFileSync(file, "utf8");
  if (!s.includes(from)) {
    if (s.includes(to)) {
      console.log("skip bust (already):", file);
      return;
    }
    console.error("MISSING bust", from, "in", file);
    process.exit(1);
  }
  fs.writeFileSync(file, s.split(from).join(to));
  console.log("bust", from, "->", to, "in", path.basename(file));
}

if (!fs.readFileSync(QCF, "utf8").includes("DECOR_SUB_TR")) {
  console.error("qcf-mushaf.js missing honest-decor patch — apply dist edits first");
  process.exit(1);
}

bumpBust(INDEX, "gercek1", "dekor1");
bumpBust(QCF, "gercek1", "dekor1");
console.log("ok: honest decor patch verified");
