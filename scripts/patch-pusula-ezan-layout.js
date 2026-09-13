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

const START = "e.QiblaCompassScreen";
const END_MARKERS = [
  "},1019,[20,15,466,21,372,160,148,276,622,22,773,1020,13]);",
  "}, 1019, [20, 15, 466, 470, 21, 372, 284, 160, 148, 498, 276, 622, 22, 1030, 773, 1020, 776, 13]);",
];
const MODULE = path.resolve(__dirname, "qibla-compass-screen.module.js");
const replacement = fs.readFileSync(MODULE, "utf8").trim();

let src = fs.readFileSync(ENTRY, "utf8");
const startIdx = src.indexOf(START);
if (startIdx < 0) {
  console.error("QiblaCompassScreen start not found");
  process.exit(1);
}
const moduleStart = src.lastIndexOf("__d(function", startIdx);
let endIdx = -1;
let endLen = 0;
for (const end of END_MARKERS) {
  const i = src.indexOf(end, startIdx);
  if (i >= 0) {
    endIdx = i;
    endLen = end.length;
    break;
  }
}
if (moduleStart < 0 || endIdx < 0) {
  console.error("QiblaCompassScreen bounds not found", { moduleStart, endIdx });
  process.exit(1);
}
const old = src.slice(moduleStart, endIdx + endLen);
if (!old.includes("e.QiblaCompassScreen")) {
  console.error("Unexpected existing module", old.slice(0, 80), old.length);
  process.exit(1);
}
src = src.slice(0, moduleStart) + replacement + src.slice(endIdx + endLen);
fs.writeFileSync(ENTRY, src);
console.log("patched", ENTRY, "oldLen", old.length, "newLen", replacement.length);
