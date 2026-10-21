#!/usr/bin/env node
/**
 * Original Ottoman/Turkish tezhip for Hafızyol.
 * Geometric rumi + hatayi drawn here; not copied from any mushaf or app.
 */
const fs = require("fs");
const path = require("path");

const W = 1000;
const H = 1610;
const G = { pale: "#f4e3a1", mid: "#d4af37", deep: "#b88912", antique: "#8a6a1c", shine: "#f8efc4" };
const N = { ink: "#08142c", deep: "#0b1d4a", mid: "#15305c" };
const T = { burg: "#7a2433" };

function hatayiDef(id, r, gold, navy, burg) {
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
  parts.push(`<circle r="${(r * 0.16).toFixed(2)}" fill="${burg}"/>`);
  parts.push(`<circle r="${(r * 0.07).toFixed(2)}" fill="${G.shine}"/>`);
  parts.push("</g>");
  return parts.join("");
}

function use(id, x, y, rot, s) {
  const t = [`translate(${x.toFixed(1)} ${y.toFixed(1)})`];
  if (rot) t.push(`rotate(${rot})`);
  if (s && s !== 1) t.push(`scale(${s})`);
  return `<use href="#${id}" transform="${t.join(" ")}"/>`;
}

function cetvel(x, y, w, h, gaps) {
  return gaps
    .map((g, i) => {
      const stroke = i % 2 === 0 ? G.mid : G.pale;
      const sw = i === 0 ? 2.4 : i === gaps.length - 1 ? 2 : 1.1;
      return `<rect x="${(x + g).toFixed(1)}" y="${(y + g).toFixed(1)}" width="${(w - g * 2).toFixed(1)}" height="${(h - g * 2).toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${sw}"/>`;
    })
    .join("");
}

function band(x, y, w, h, t, fill) {
  const x2 = x + w;
  const y2 = y + h;
  return `<path fill="${fill}" fill-rule="evenodd" d="M${x} ${y}H${x2}V${y2}H${x}Z M${x + t} ${y + t}H${x2 - t}V${y2 - t}H${x + t}Z"/>`;
}

function vineOnRect(x, y, w, h, t, step, flowerId, rich) {
  const cx0 = x + t / 2;
  const cy0 = y + t / 2;
  const cx1 = x + w - t / 2;
  const cy1 = y + h - t / 2;
  const parts = [];
  const stem = `M${cx0.toFixed(1)} ${cy0.toFixed(1)}H${cx1.toFixed(1)}V${cy1.toFixed(1)}H${cx0.toFixed(1)}Z`;
  parts.push(`<path d="${stem}" fill="none" stroke="${G.antique}" stroke-width="1.8"/>`);
  parts.push(`<path d="${stem}" fill="none" stroke="${G.pale}" stroke-width="0.8" opacity="0.85"/>`);
  const rumiS = rich ? 0.5 : 0.42;
  const rumiS2 = rich ? 0.36 : 0.3;
  function place(px, py, rot, i) {
    if (i % 2 === 0) parts.push(use(flowerId, px, py, rot, 1));
    else {
      parts.push(use("rumi-mid", px, py, rot + 16, rumiS));
      parts.push(use("rumi-pale", px, py, rot + 196, rumiS2));
    }
  }
  const inset = 28;
  let i = 0;
  for (let px = x + inset; px <= x + w - inset; px += step) {
    place(px, cy0, 0, i);
    place(px + step / 2, cy1, 180, i + 1);
    i += 1;
  }
  i = 0;
  for (let py = y + inset + step / 2; py <= y + h - inset; py += step) {
    place(cx0, py, 270, i);
    place(cx1, py + step / 2, 90, i + 1);
    i += 1;
  }
  return parts.join("");
}

function cornerKose(x, y, rot, rich) {
  const s = rich ? 1.08 : 0.96;
  return (
    `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">` +
    `<path d="M0 0H58V11H11V58H0Z" fill="${G.deep}"/>` +
    `<path d="M3 3H50V8H8V50H3Z" fill="${N.ink}"/>` +
    use("palmette", 30, 22, -18, 1.05) +
    use("palmette", 22, 30, 72, 1.05) +
    use(rich ? "hatayi-lg" : "hatayi-md", 24, 24, 0, 1) +
    use("rumi-pale", 42, 11, 8, 0.7) +
    use("rumi-pale", 11, 42, 98, 0.7) +
    `</g>`
  );
}

function unvanFrieze(y, h) {
  const parts = [];
  parts.push(`<rect x="52" y="${y}" width="896" height="${h}" fill="${N.ink}"/>`);
  parts.push(`<rect x="54" y="${y + 2}" width="892" height="${h - 4}" fill="${N.deep}"/>`);
  parts.push(`<rect x="56" y="${y + 3}" width="888" height="${h - 6}" fill="none" stroke="${G.mid}" stroke-width="1.6"/>`);
  parts.push(`<rect x="59" y="${y + 6}" width="882" height="${h - 12}" fill="none" stroke="${G.pale}" stroke-width="0.9"/>`);
  const midY = y + h / 2;
  for (let x = 78; x <= 922; x += 44) {
    parts.push(use("hatayi-sm", x, midY, 0, 1.05));
    parts.push(use("rumi-pale", x + 22, midY, x % 88 === 78 ? 12 : -12, 0.42));
  }
  parts.push(use("palmette", 68, midY, 90, 0.85));
  parts.push(use("palmette", 932, midY, -90, 0.85));
  return parts.join("");
}

function midBoss(x, y) {
  return (
    `<g transform="translate(${x} ${y})">` +
    `<circle r="16" fill="${N.ink}" stroke="${G.mid}" stroke-width="2"/>` +
    use("hatayi-md", 0, 0, 0, 1.15) +
    `</g>`
  );
}

function paperGrain() {
  const dots = [];
  let s = 7919;
  function rnd() {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  }
  for (let i = 0; i < 140; i++) {
    const x = (rnd() * W).toFixed(1);
    const y = (rnd() * H).toFixed(1);
    const r = (0.18 + rnd() * 0.65).toFixed(2);
    const o = (0.04 + rnd() * 0.055).toFixed(3);
    dots.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#8a6a1c" opacity="${o}"/>`);
  }
  return `<g id="paper-grain" pointer-events="none">${dots.join("")}</g>`;
}

function pearls(x, y, w, h, pad) {
  const parts = [];
  const step = 20;
  for (let px = x + pad; px <= x + w - pad; px += step) {
    parts.push(use("pearl", px, y, 0, 1));
    parts.push(use("pearl", px + 10, y + h, 0, 1));
  }
  for (let py = y + pad; py <= y + h - pad; py += step) {
    parts.push(use("pearl", x, py + 10, 0, 1));
    parts.push(use("pearl", x + w, py, 0, 1));
  }
  return parts.join("");
}

const defs =
  `<defs>` +
  `<path id="rumi-d" d="M0 0C3.2-9.6 12.4-15.2 21.2-12.4C16.4-8.2 14.8-1.6 16.6 5.2C19.2-1.2 26.4-5.6 33.6-3.2C26.8 3.6 19.2 12.4 9.6 16.4C14.4 9.2 12.8 2.4 6.4 2C8.8 8.8 6.4 16 0.8 19.2C0.4 12.4 1.2 5.2 0 0Z"/>` +
  `<g id="rumi-mid"><use href="#rumi-d" fill="${G.mid}"/></g>` +
  `<g id="rumi-pale"><use href="#rumi-d" fill="${G.pale}"/></g>` +
  `<g id="palmette">` +
  `<path d="M0 0C6-16 22-22 28-8C18-10 12 2 10 14C18 2 30-2 38 8C24 10 12 22 2 20C8 10 6 2 0 0Z" fill="${G.mid}"/>` +
  `<path d="M4-1C8-10 18-13 22-5C16-6 12 2 10 8C16 2 24 0 28 6C20 6 12 14 6 12C8 6 8 1 4-1Z" fill="${N.deep}"/>` +
  `<path d="M8 0C10-5 16-6 18-2C14-2 12 2 12 6C16 2 20 2 22 5C16 6 12 10 8 8C10 4 10 1 8 0Z" fill="${G.pale}"/>` +
  `</g>` +
  `<g id="pearl"><circle r="1.15" fill="${G.pale}"/><circle r="0.45" fill="${G.shine}"/></g>` +
  hatayiDef("hatayi-sm", 8.6, G.mid, N.ink, T.burg) +
  hatayiDef("hatayi-md", 11.5, G.mid, N.deep, T.burg) +
  hatayiDef("hatayi-lg", 14.5, G.mid, N.deep, T.burg) +
  `</defs>`;

const std = [];
std.push(cetvel(7, 7, W - 14, H - 14, [0, 3.4, 6.2]));
std.push(band(14, 14, W - 28, H - 28, 30, N.deep));
std.push(vineOnRect(14, 14, W - 28, H - 28, 30, 54, "hatayi-sm", false));
std.push(cetvel(44.5, 44.5, W - 89, H - 89, [0, 3.2, 5.8]));
std.push(pearls(51.5, 51.5, W - 103, H - 103, 14));
std.push(cornerKose(7, 7, 0, false));
std.push(cornerKose(W - 7, 7, 90, false));
std.push(cornerKose(W - 7, H - 7, 180, false));
std.push(cornerKose(7, H - 7, 270, false));
std.push(midBoss(W / 2, 29));
std.push(midBoss(W / 2, H - 29));
std.push(midBoss(29, H / 2));
std.push(midBoss(W - 29, H / 2));

const unvan = [];
unvan.push(cetvel(4, 4, W - 8, H - 8, [0, 3.2, 6]));
unvan.push(band(11, 11, W - 22, H - 22, 16, N.ink));
unvan.push(vineOnRect(11, 11, W - 22, H - 22, 16, 40, "hatayi-sm", true));
unvan.push(cetvel(27, 27, W - 54, H - 54, [0, 2.6]));
unvan.push(band(32, 32, W - 64, H - 64, 16, N.deep));
unvan.push(vineOnRect(32, 32, W - 64, H - 64, 16, 44, "hatayi-sm", false));
unvan.push(cetvel(48.5, 48.5, W - 97, H - 97, [0, 2.8, 5]));
unvan.push(unvanFrieze(53, 16));
unvan.push(unvanFrieze(1543, 16));
unvan.push(cornerKose(4, 4, 0, true));
unvan.push(cornerKose(W - 4, 4, 90, true));
unvan.push(cornerKose(W - 4, H - 4, 180, true));
unvan.push(cornerKose(4, H - 4, 270, true));
unvan.push(use("palmette", W / 2, 61, 180, 1));
unvan.push(use("palmette", W / 2, H - 61, 0, 1));

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="1000" height="1610" fill="none">
  <title>Hafızyol orijinal tezhip</title>
  ${defs}
  ${paperGrain()}
  <g id="tezhip-std">${std.join("")}</g>
  <g id="tezhip-unvan" class="tezhip-unvan">${unvan.join("")}</g>
</svg>
`;

const out = path.resolve(__dirname, "..", "dist", "assets", "mushaf", "tezhip.svg");
fs.writeFileSync(out, svg);

const rose = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="15" fill="#0b1d4a"/>
  <circle cx="16" cy="16" r="13.2" fill="#d4af37"/>
  <g fill="#0b1d4a">
    <ellipse cx="16" cy="6.2" rx="3.1" ry="5.6"/>
    <ellipse cx="16" cy="6.2" rx="3.1" ry="5.6" transform="rotate(45 16 16)"/>
    <ellipse cx="16" cy="6.2" rx="3.1" ry="5.6" transform="rotate(90 16 16)"/>
    <ellipse cx="16" cy="6.2" rx="3.1" ry="5.6" transform="rotate(135 16 16)"/>
  </g>
  <circle cx="16" cy="16" r="6.4" fill="#f4e3a1"/>
  <circle cx="16" cy="16" r="4.2" fill="#b88912"/>
  <circle cx="16" cy="16" r="1.8" fill="#f8efc4"/>
</svg>
`;
const roseOut = path.resolve(__dirname, "..", "dist", "assets", "mushaf", "ayah-rose.svg");
fs.writeFileSync(roseOut, rose);
console.log("wrote", out, Buffer.byteLength(svg), "bytes");
console.log("wrote", roseOut, Buffer.byteLength(rose), "bytes");
