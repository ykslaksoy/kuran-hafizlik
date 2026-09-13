#!/usr/bin/env node
/**
 * Restyle QiblaCompassScreen to match PrayerTimesScreen chrome
 * and vertically center the compass. All compass features stay.
 */
const fs = require("fs");
const path = require("path");

const ENTRY = path.resolve(
  __dirname,
  "..",
  "dist/_expo/static/js/web/entry-a0324b1a9e2452bea2896449b9d2b456.js"
);

const START = "e.QiblaCompassScreen=function(){";
const END = "},1019,[20,15,466,21,372,160,148,276,622,22,773,1020,13]);";
const MODULE = path.resolve(__dirname, "qibla-compass-screen.module.js");
const replacement = fs.readFileSync(MODULE, "utf8").trim();

let src = fs.readFileSync(ENTRY, "utf8");
const startIdx = src.indexOf(START);
if (startIdx < 0) {
  console.error("QiblaCompassScreen start not found");
  process.exit(1);
}
const moduleStart = src.lastIndexOf("__d(function", startIdx);
const endIdx = src.indexOf(END, startIdx);
if (moduleStart < 0 || endIdx < 0) {
  console.error("QiblaCompassScreen bounds not found", { moduleStart, endIdx });
  process.exit(1);
}
const old = src.slice(moduleStart, endIdx + END.length);
if (!old.includes("e.QiblaCompassScreen") || old.includes("heroStage")) {
  console.error("Unexpected existing module", old.slice(0, 80), old.length);
  process.exit(1);
}
src = src.slice(0, moduleStart) + replacement + src.slice(endIdx + END.length);
fs.writeFileSync(ENTRY, src);
console.log("patched", ENTRY, "oldLen", old.length, "newLen", replacement.length);
