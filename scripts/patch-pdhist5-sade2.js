#!/usr/bin/env node
/** Bump PD cache to pdhist5 + hyPageStyle sade2 (W.569 restored 2. Sade). */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QCF = path.join(ROOT, "dist/assets/mushaf/qcf-mushaf.js");
const CSS = path.join(ROOT, "dist/assets/mushaf/qcf-mushaf.css");
const INDEX = path.join(ROOT, "dist/index.html");
const FROM = "pdhist4";
const TO = "pdhist5";

function read(p) {
  return fs.readFileSync(p, "utf8");
}
function write(p, s) {
  fs.writeFileSync(p, s);
  console.log("wrote", path.relative(ROOT, p));
}

let js = read(QCF);
if (!js.includes('pageStyle === "tezhip"') && !js.includes("tezhip")) {
  console.error("unexpected qcf-mushaf.js");
  process.exit(1);
}

js = js.split(FROM).join(TO);

if (!js.includes("sade2Manifest")) {
  js = js.replace(
    "  var pdManifest = null;",
    `  var pdManifest = null;
  var sade2Manifest = null;`
  );

  const loadBlock = `
  function loadSade2Manifest() {
    if (sade2Manifest) return Promise.resolve(sade2Manifest);
    return fetch("/assets/mushaf/restored/pd-walters-w569/manifest.json?v=${TO}")
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        sade2Manifest = j;
        return j;
      })
      .catch(function () {
        return null;
      });
  }

  function isPdDecorStyle() {
    return pageStyle === "tezhip" || pageStyle === "sade2";
  }

  function activePdMeta() {
    if (pageStyle === "sade2") return sade2Manifest;
    return pdEditionMeta(pdFrameId);
  }
`;
  js = js.replace("  function loadPdManifest() {", loadBlock + "\n  function loadPdManifest() {");
}

// Selective replacements only (avoid breaking isPdDecorStyle body / tezhip-only UI).
const pdDecorChecks = [
  ["if (!data || pageStyle !== \"tezhip\")", "if (!data || !isPdDecorStyle())"],
  ["if (!meta || pageStyle !== \"tezhip\")", "if (!meta || !isPdDecorStyle())"],
  ["return pageStyle === \"tezhip\" ? 18 : 68;", "return isPdDecorStyle() ? 18 : 68;"],
  [
    "if (data.page <= 2 && pageStyle !== \"tezhip\") start = 28;",
    "if (data.page <= 2 && !isPdDecorStyle()) start = 28;",
  ],
];
for (const [from, to] of pdDecorChecks) {
  js = js.split(from).join(to);
}
if (!js.includes("function isPdDecorStyle()")) {
  js = js.replace(
    "  function loadPdManifest() {",
    `  function isPdDecorStyle() {
    return pageStyle === "tezhip" || pageStyle === "sade2";
  }

  function loadPdManifest() {`
  );
}

js = js.replace(
  /var on = originalHat && isPdDecorStyle\(\);/,
  'var on = originalHat && pageStyle === "tezhip";'
);

js = js.replace(
  "function applyPdDecor() {\n    var meta = pdEditionMeta(pdFrameId);",
  "function applyPdDecor() {\n    var meta = activePdMeta();"
);

js = js.replace(
  "function applyWritingPortBox(data) {\n    if (!data || !isPdDecorStyle()) {",
  `function applyWritingPortBox(data) {
    if (!data || !isPdDecorStyle()) {`
);

js = js.replace(
  "    var meta = pdEditionMeta(pdFrameId);\n    var box = meta ? writingBoxForPage(meta, data.page) : null;",
  "    var meta = activePdMeta();\n    var box = meta ? writingBoxForPage(meta, data.page) : null;"
);

js = js.replace(
  /if \(pdLayoutForPage\(data\.page\) === "margin"\) \{\s*var meta = pdEditionMeta\(pdFrameId\);/,
  'if (pageStyle === "sade2" || pdLayoutForPage(data.page) === "margin") {\n      var meta = activePdMeta();'
);

js = js.replace(
  "document.body.classList.toggle(\"hy-pd-serlevha\", data.page <= 2);",
  'document.body.classList.toggle("hy-pd-serlevha", data.page <= 2);\n    document.body.classList.toggle("hy-style-sade2", pageStyle === "sade2");'
);

js = js.replace(
  'if (style === "tezhip" || style === "altin") return style;\n    return "sade";',
  'if (style === "tezhip" || style === "altin" || style === "sade2") return style;\n    return "sade";'
);

js = js.replace(
  'if (style === "tezhip") return "Tezhip";',
  'if (style === "sade2") return "2. Sade";\n    if (style === "tezhip") return "Tezhip";'
);

js = js.replace(
  'if (style === "sade") return "altin";\n    if (style === "altin") return "tezhip";\n    return "sade";',
  'if (style === "sade") return "altin";\n    if (style === "altin") return "tezhip";\n    if (style === "tezhip") return "sade2";\n    return "sade";'
);

js = js.replace(
  'if (s === "tezhip" || s === "sade" || s === "altin") return s;',
  'if (s === "tezhip" || s === "sade" || s === "altin" || s === "sade2") return s;'
);

js = js.replace(
  'document.body.classList.toggle("hy-style-tezhip", pageStyle === "tezhip");',
  `document.body.classList.toggle("hy-style-tezhip", pageStyle === "tezhip");
    document.body.classList.toggle("hy-style-sade2", pageStyle === "sade2");`
);

js = js.replace(
  "    if (pageStyle !== \"tezhip\") {\n      clearPdLayers();",
  `    if (!isPdDecorStyle()) {
      clearPdLayers();`
);

js = js.replace(
  "    } else {\n      if (orn && orn.querySelector(\"svg\")) orn.innerHTML = \"\";\n      applyPdDecor();\n    }",
  `    } else if (pageStyle === "sade2") {
      if (orn && orn.querySelector("svg")) orn.innerHTML = "";
      loadSade2Manifest().then(function () {
        applyPdDecor();
      });
    } else {
      if (orn && orn.querySelector("svg")) orn.innerHTML = "";
      applyPdDecor();
    }`
);

js = js.replace(
  'if (pdBtn) pdBtn.style.display = pageStyle === "tezhip" ? "" : "none";',
  'if (pdBtn) pdBtn.style.display = pageStyle === "tezhip" ? "" : "none";'
);

js = js.replace(
  'if (hatBtn) hatBtn.style.display = pageStyle === "tezhip" ? "" : "none";',
  'if (hatBtn) hatBtn.style.display = pageStyle === "tezhip" ? "" : "none";'
);

js = js.replace(
  "    var sub = pageStyle === \"tezhip\" ? DECOR_SUB_PD : DECOR_SUB_SADE;",
  `    var sub = isPdDecorStyle() ? DECOR_SUB_PD : DECOR_SUB_SADE;
    if (pageStyle === "sade2") sub = "2. Sade · Walters W.569 restorasyonlu tezhip + KFGQPC QCF";`
);

js = js.replace(
  /return pageStyle === "tezhip" \? 18 : 68;/,
  'return isPdDecorStyle() ? 18 : 68;'
);

js = js.replace(
  "    if (data.page <= 2 && pageStyle !== \"tezhip\") start = 28;",
  "    if (data.page <= 2 && !isPdDecorStyle()) start = 28;"
);

write(QCF, js);

let css = read(CSS);
css = css.split(FROM).join(TO);
if (!css.includes("hy-style-sade2")) {
  css += `
body.hy-style-sade2 #hy-qcf-ornament.hy-pd-frame-on,
body.hy-style-sade2 #hy-qcf-stage[data-hy-pd-layout="margin"] #hy-qcf-writing-port {
  /* full folio — no margin mask hole for 2. Sade */
}
body.hy-style-sade2 #hy-qcf-ornament .hy-pd-frame-img {
  mask-image: none !important;
  -webkit-mask-image: none !important;
}
body.hy-style-sade2.hy-pd-serlevha #hy-qcf-glyphs .hy-qcf-linebox[data-kind="header"] {
  display: none !important;
}
`;
}
write(CSS, css);

let html = read(INDEX);
html = html.split(FROM).join(TO);
write(INDEX, html);
