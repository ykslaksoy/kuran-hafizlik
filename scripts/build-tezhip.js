#!/usr/bin/env node
/**
 * DEPRECATED (2026-10-24): Tezhip UI mode removed — user feedback «bunlar gerçek değil».
 * File kept for history; qcf-mushaf no longer loads tezhip.svg.
 * Original Ottoman/Turkish tezhip for Hafızyol.
 * Refined classical frame: bright gold cetvel, thin lacquer, corner emphasis — not a busy pattern fill.
 */
const fs = require("fs");
const path = require("path");

const W = 1000;
const H = 1610;
/** Metallic mushaf gold (matches qcf-mushaf.css --hy-gold-*) */
const G = {
  hi: "#F6D77A",
  mid: "#E8C547",
  deep: "#C9A227",
  antique: "#9C7414",
  pale: "#FBECC0",
  shine: "#FFF4D4",
};
const N = { ink: "#08142c", deep: "#0b1d4a", mid: "#15305c" };

function hatayiDef(id, r, gold, navy) {
  const parts = [`<g id="${id}">`];
  for (let i = 0; i < 8; i++) {
    parts.push(
      `<ellipse transform="rotate(${i * 45})" cx="0" cy="${(-r * 0.58).toFixed(2)}" rx="${(r * 0.26).toFixed(2)}" ry="${(r * 0.5).toFixed(2)}" fill="${gold}"/>`
    );
  }
  for (let i = 0; i < 8; i++) {
    parts.push(
      `<ellipse transform="rotate(${i * 45 + 22.5})" cx="0" cy="${(-r * 0.34).toFixed(2)}" rx="${(r * 0.14).toFixed(2)}" ry="${(r * 0.28).toFixed(2)}" fill="${navy}"/>`
    );
  }
  parts.push(`<circle r="${(r * 0.3).toFixed(2)}" fill="${gold}"/>`);
  parts.push(`<circle r="${(r * 0.12).toFixed(2)}" fill="${G.shine}"/>`);
  parts.push("</g>");
  return parts.join("");
}

function use(id, x, y, rot, s) {
  const t = [`translate(${x.toFixed(1)} ${y.toFixed(1)})`];
  if (rot) t.push(`rotate(${rot})`);
  if (s && s !== 1) t.push(`scale(${s})`);
  return `<use href="#${id}" transform="${t.join(" ")}"/>`;
}

function cetvel(x, y, w, h, gaps, strokes) {
  return gaps
    .map((g, i) => {
      const stroke = strokes[i % strokes.length];
      const sw = i === 0 ? 2.2 : i === gaps.length - 1 ? 1.4 : 0.95;
      return `<rect x="${(x + g).toFixed(1)}" y="${(y + g).toFixed(1)}" width="${(w - g * 2).toFixed(1)}" height="${(h - g * 2).toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
    })
    .join("");
}

function lacquerFrame(x, y, w, h, inset) {
  const x2 = x + w;
  const y2 = y + h;
  const i = inset;
  return (
    `<path fill="none" stroke="${N.deep}" stroke-width="1.6" d="M${x} ${y}H${x2}V${y2}H${x}Z"/>` +
    `<path fill="none" stroke="${G.mid}" stroke-width="0.85" opacity="0.9" d="M${x + 1.5} ${y + 1.5}H${x2 - 1.5}V${y2 - 1.5}H${x + 1.5}Z"/>` +
    `<rect x="${(x + i).toFixed(1)}" y="${(y + i).toFixed(1)}" width="${(w - i * 2).toFixed(1)}" height="${(h - i * 2).toFixed(1)}" fill="none" stroke="${G.hi}" stroke-width="1.5"/>`
  );
}

/** A few motifs on each long edge — not a full vine carpet. */
function sparseEdgeAccents(x, y, w, h, inset, step, rich) {
  const parts = [];
  const cyT = y + inset;
  const cyB = y + h - inset;
  const cxL = x + inset;
  const cxR = x + w - inset;
  const flower = rich ? "hatayi-md" : "hatayi-sm";
  const rumiS = rich ? 0.48 : 0.4;
  let i = 0;
  for (let px = x + inset + step * 0.5; px <= x + w - inset - step * 0.5; px += step) {
    if (i % 2 === 0) {
      parts.push(use(flower, px, cyT, 0, 1));
      parts.push(use(flower, px, cyB, 180, 1));
    } else {
      parts.push(use("rumi-mid", px, cyT, 14, rumiS));
      parts.push(use("rumi-pale", px, cyB, 194, rumiS * 0.85));
    }
    i += 1;
  }
  i = 0;
  for (let py = y + inset + step; py <= y + h - inset - step; py += step) {
    if (i % 3 === 0) parts.push(use("rumi-pale", cxL, py, 270, rumiS));
    if (i % 3 === 1) parts.push(use("rumi-pale", cxR, py + step / 2, 90, rumiS));
    i += 1;
  }
  return parts.join("");
}

function cornerKose(x, y, rot, rich) {
  const s = rich ? 1.02 : 0.92;
  const hat = rich ? "hatayi-md" : "hatayi-sm";
  return (
    `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
    `<path d="M0 0H52V9H9V52H0Z" fill="${G.deep}"/>` +
    `<path d="M2.5 2.5H45V7H7V45H2.5Z" fill="${N.ink}"/>` +
    `<path d="M4 4H42V6.5H6.5V42H4Z" fill="none" stroke="${G.hi}" stroke-width="0.9"/>` +
    use("palmette", 26, 20, -18, 0.92) +
    use(hat, 22, 22, 0, 1) +
    use("rumi-pale", 38, 10, 8, 0.55) +
    `</g>`
  );
}

function unvanFrieze(y, h) {
  const parts = [];
  parts.push(`<rect x="36" y="${y}" width="928" height="${h}" fill="${N.ink}" rx="1"/>`);
  parts.push(`<rect x="38" y="${y + 1.5}" width="924" height="${h - 3}" fill="${N.deep}" rx="1"/>`);
  parts.push(
    `<rect x="40" y="${y + 2.5}" width="920" height="${h - 5}" fill="none" stroke="${G.mid}" stroke-width="1.4"/>`
  );
  const midY = y + h / 2;
  parts.push(use("hatayi-sm", 56, midY, 0, 1));
  parts.push(use("hatayi-sm", 944, midY, 0, 1));
  parts.push(use("palmette", 500, midY, 180, 0.75));
  for (let x = 120; x <= 880; x += 96) {
    parts.push(use("rumi-mid", x, midY, x % 192 === 120 ? 0 : 180, 0.38));
  }
  return parts.join("");
}

function paperGrain(n) {
  const dots = [];
  let s = 7919;
  function rnd() {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  }
  for (let i = 0; i < n; i++) {
    const x = (rnd() * W).toFixed(1);
    const y = (rnd() * H).toFixed(1);
    const r = (0.15 + rnd() * 0.45).toFixed(2);
    const o = (0.025 + rnd() * 0.035).toFixed(3);
    dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="${G.antique}" opacity="${o}"/>`);
  }
  return `<g id="paper-grain" pointer-events="none">${dots.join("")}</g>`;
}

const defs =
  `<defs>` +
  `<linearGradient id="gold-shine" x1="0%" y1="0%" x2="100%" y2="100%">` +
  `<stop offset="0%" stop-color="${G.hi}"/>` +
  `<stop offset="45%" stop-color="${G.mid}"/>` +
  `<stop offset="100%" stop-color="${G.deep}"/>` +
  `</linearGradient>` +
  `<path id="rumi-d" d="M0 0C3.2-9.6 12.4-15.2 21.2-12.4C16.4-8.2 14.8-1.6 16.6 5.2C19.2-1.2 26.4-5.6 33.6-3.2C26.8 3.6 19.2 12.4 9.6 16.4C14.4 9.2 12.8 2.4 6.4 2C8.8 8.8 6.4 16 0.8 19.2C0.4 12.4 1.2 5.2 0 0Z"/>` +
  `<g id="rumi-mid"><use href="#rumi-d" fill="${G.mid}"/></g>` +
  `<g id="rumi-pale"><use href="#rumi-d" fill="${G.pale}"/></g>` +
  `<g id="palmette">` +
  `<path d="M0 0C6-16 22-22 28-8C18-10 12 2 10 14C18 2 30-2 38 8C24 10 12 22 2 20C8 10 6 2 0 0Z" fill="${G.mid}"/>` +
  `<path d="M4-1C8-10 18-13 22-5C16-6 12 2 10 8C16 2 24 0 28 6C20 6 12 14 6 12C8 6 8 1 4-1Z" fill="${N.deep}"/>` +
  `<path d="M8 0C10-5 16-6 18-2C14-2 12 2 12 6C16 2 20 2 22 5C16 6 12 10 8 8C10 4 10 1 8 0Z" fill="${G.pale}"/>` +
  `</g>` +
  hatayiDef("hatayi-sm", 8.2, G.mid, N.ink) +
  hatayiDef("hatayi-md", 10.8, G.mid, N.deep) +
  `</defs>`;

/** Inner pages: wide cream field, bright gold margin (~28px decorative band). */
const std = [];
std.push(cetvel(9, 9, W - 18, H - 18, [0, 2.8, 5.6], [G.mid, G.pale, G.hi]));
std.push(lacquerFrame(18, 18, W - 36, H - 36, 10));
std.push(sparseEdgeAccents(18, 18, W - 36, H - 36, 11, 112, false));
std.push(cornerKose(9, 9, 0, false));
std.push(cornerKose(W - 9, 9, 90, false));
std.push(cornerKose(W - 9, H - 9, 180, false));
std.push(cornerKose(9, H - 9, 270, false));
std.push(
  `<rect x="30" y="30" width="940" height="1550" fill="none" stroke="url(#gold-shine)" stroke-width="0.75" opacity="0.55"/>`
);

/** Fâtiha / unvan: slightly richer band + slim frieze; still leaves text band clear. */
const unvan = [];
unvan.push(cetvel(7, 7, W - 14, H - 14, [0, 3, 5.8], [G.hi, G.pale, G.mid]));
unvan.push(lacquerFrame(16, 16, W - 32, H - 32, 9));
unvan.push(sparseEdgeAccents(16, 16, W - 32, H - 32, 10, 88, true));
unvan.push(unvanFrieze(48, 12));
unvan.push(unvanFrieze(H - 60, 12));
unvan.push(cornerKose(7, 7, 0, true));
unvan.push(cornerKose(W - 7, 7, 90, true));
unvan.push(cornerKose(W - 7, H - 7, 180, true));
unvan.push(cornerKose(7, H - 7, 270, true));

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="1000" height="1610" fill="none">
  <title>Hafızyol orijinal tezhip</title>
  ${defs}
  ${paperGrain(48)}
  <g id="tezhip-std">${std.join("")}</g>
  <g id="tezhip-unvan" class="tezhip-unvan">${unvan.join("")}</g>
</svg>
`;

const out = path.resolve(__dirname, "..", "dist", "assets", "mushaf", "tezhip.svg");
fs.writeFileSync(out, svg);

const rose = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="15" fill="#0b1d4a"/>
  <circle cx="16" cy="16" r="13.2" fill="#E8C547"/>
  <g fill="#0b1d4a">
    <ellipse cx="16" cy="6.2" rx="3.1" ry="5.6"/>
    <ellipse cx="16" cy="6.2" rx="3.1" ry="5.6" transform="rotate(45 16 16)"/>
    <ellipse cx="16" cy="6.2" rx="3.1" ry="5.6" transform="rotate(90 16 16)"/>
    <ellipse cx="16" cy="6.2" rx="3.1" ry="5.6" transform="rotate(135 16 16)"/>
  </g>
  <circle cx="16" cy="16" r="6.4" fill="#FBECC0"/>
  <circle cx="16" cy="16" r="4.2" fill="#C9A227"/>
  <circle cx="16" cy="16" r="1.8" fill="#FFF4D4"/>
</svg>
`;
const roseOut = path.resolve(__dirname, "..", "dist", "assets", "mushaf", "ayah-rose.svg");
fs.writeFileSync(roseOut, rose);
console.log("wrote", out, Buffer.byteLength(svg), "bytes");
console.log("wrote", roseOut, Buffer.byteLength(rose), "bytes");
