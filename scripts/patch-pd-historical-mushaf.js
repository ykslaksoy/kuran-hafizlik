#!/usr/bin/env node
/**
 * Restore hyPageStyle=tezhip as PD historical frame mode + original-hat toggle.
 * Bumps asset cache bust (currently pdhist4).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const QCF = path.join(ROOT, "dist/assets/mushaf/qcf-mushaf.js");
const CSS = path.join(ROOT, "dist/assets/mushaf/qcf-mushaf.css");
const PLAYER = path.join(ROOT, "dist/assets/mushaf/hy-player.js");
const INDEX = path.join(ROOT, "dist/index.html");
const EDITIONS = path.join(ROOT, "dist/assets/mushaf/mushaf-editions.json");

const FROM = "dekor1";
const TO = "pdhist4";

function read(p) {
  return fs.readFileSync(p, "utf8");
}
function write(p, s) {
  fs.writeFileSync(p, s);
  console.log("wrote", path.relative(ROOT, p));
}
function mustReplace(s, from, to, label) {
  if (!s.includes(from)) {
    if (to.length > 40 && s.includes(to.slice(0, 30))) {
      console.log("skip (already):", label);
      return s;
    }
    console.error("MISSING:", label);
    process.exit(1);
  }
  return s.split(from).join(to);
}

let js = read(QCF);

js = mustReplace(
  js,
  "  var pageStyle = \"sade\";\n  var editionCatalog = null;",
  `  var pageStyle = "sade";
  var editionCatalog = null;
  var pdManifest = null;
  var pdFrameId = "pd-walters-w569";
  var originalHat = false;`,
  "pd vars"
);

js = mustReplace(
  js,
  `        '<div id="hy-qcf-ornament" aria-hidden="true"></div>' +
        '<div id="hy-qcf-special-frame" aria-hidden="true"></div>' +`,
  `        '<div id="hy-qcf-ornament" aria-hidden="true"></div>' +
        '<div id="hy-qcf-scan" aria-hidden="true"></div>' +
        '<div id="hy-qcf-paper-infill" aria-hidden="true"></div>' +
        '<div id="hy-qcf-special-frame" aria-hidden="true"></div>' +`,
  "host scan layers"
);

const pdBlock = `
  var DECOR_SUB_SADE = "Sayfa fontu KFGQPC QCF · Sade/Altın çerçeve özgün dekoratif";
  var DECOR_SUB_PD = "İç metin: KFGQPC QCF + ok takibi · kenar/kağıt: kamu malı (PD) tarihî tarama";

  function pdEditionMeta(id) {
    if (!pdManifest || !pdManifest.editions) return null;
    for (var i = 0; i < pdManifest.editions.length; i++) {
      if (pdManifest.editions[i].id === id) return pdManifest.editions[i];
    }
    return null;
  }

  function readPdFrameId() {
    try {
      var id = localStorage.getItem("hyPdFrameId");
      if (id) return id;
    } catch (e0) {}
    return "pd-walters-w569";
  }

  function readOriginalHat() {
    try {
      return localStorage.getItem("hyOriginalHat") === "1";
    } catch (e1) {}
    return false;
  }

  function loadPdManifest() {
    if (pdManifest) return Promise.resolve(pdManifest);
    return fetch("/assets/mushaf/pd/manifest.json?v=${TO}")
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        pdManifest = j;
        pdFrameId = readPdFrameId();
        return j;
      })
      .catch(function () {
        return null;
      });
  }

  function clearPdLayers() {
    var orn = document.getElementById("hy-qcf-ornament");
    if (orn) {
      orn.classList.remove("hy-tezhip-on", "hy-pd-frame-on");
      orn.removeAttribute("data-hy-pd");
      var img = orn.querySelector(".hy-pd-frame-img");
      if (img) img.parentNode.removeChild(img);
    }
    var scan = document.getElementById("hy-qcf-scan");
    if (scan) {
      scan.style.backgroundImage = "";
      scan.classList.remove("hy-on");
    }
    var paper = document.getElementById("hy-qcf-paper-infill");
    if (paper) {
      paper.style.backgroundImage = "";
      paper.classList.remove("hy-on");
    }
  }

  function applyPdDecor() {
    var meta = pdEditionMeta(pdFrameId);
    if (!meta || pageStyle !== "tezhip") {
      clearPdLayers();
      return;
    }
    var orn = document.getElementById("hy-qcf-ornament");
    if (!orn) return;
    orn.classList.add("hy-tezhip-on", "hy-pd-frame-on");
    orn.setAttribute("data-hy-pd", pdFrameId);
    if (!orn.querySelector(".hy-pd-frame-img")) {
      var im = document.createElement("img");
      im.className = "hy-pd-frame-img";
      im.alt = "";
      im.setAttribute("aria-hidden", "true");
      im.src = meta.assets.frame + "?v=${TO}";
      orn.appendChild(im);
    } else {
      orn.querySelector(".hy-pd-frame-img").src = meta.assets.frame + "?v=${TO}";
    }
    var paper = document.getElementById("hy-qcf-paper-infill");
    if (paper) {
      paper.classList.add("hy-on");
      paper.style.backgroundImage = "url(" + meta.assets.paper + "?v=${TO})";
    }
    applyOriginalHatLayer();
  }

  function applyOriginalHatLayer() {
    var on = originalHat && pageStyle === "tezhip";
    document.body.classList.toggle("hy-original-hat", !!on);
    var scan = document.getElementById("hy-qcf-scan");
    if (!scan) return;
    if (!on) {
      scan.classList.remove("hy-on");
      scan.style.backgroundImage = "";
      return;
    }
    var meta = pdEditionMeta(pdFrameId);
    if (!meta || !paintedData || paintedData.page !== 1) {
      scan.classList.remove("hy-on");
      scan.style.backgroundImage = "";
      document.body.classList.remove("hy-original-hat");
      return;
    }
    scan.classList.add("hy-on");
    scan.style.backgroundImage = "url(" + meta.assets.scan + "?v=${TO})";
  }

  function setOriginalHat(on) {
    originalHat = !!on;
    try {
      localStorage.setItem("hyOriginalHat", on ? "1" : "0");
    } catch (e2) {}
    applyOriginalHatLayer();
    var btn = document.getElementById("hy-hat-btn");
    if (btn) {
      btn.classList.toggle("on", !!on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function cyclePdFrame() {
    loadPdManifest().then(function () {
      if (!pdManifest || !pdManifest.editions || !pdManifest.editions.length) return;
      var ids = pdManifest.editions.map(function (e) {
        return e.id;
      });
      var idx = ids.indexOf(pdFrameId);
      pdFrameId = ids[(idx + 1) % ids.length];
      try {
        localStorage.setItem("hyPdFrameId", pdFrameId);
      } catch (e3) {}
      applyPdDecor();
      syncSourceRibbon();
      var btn = document.getElementById("hy-pd-btn");
      if (btn && pdEditionMeta(pdFrameId)) {
        var p = pdEditionMeta(pdFrameId).provenance;
        btn.textContent = p.shelfmark || "PD";
        btn.title = p.nameTr + " · " + p.licenseTr;
      }
    });
  }

  function pdAttribLine() {
    var p = pdEditionMeta(pdFrameId);
    if (!p || !p.provenance) return "";
    var pr = p.provenance;
    return pr.institutionTr + " · " + pr.shelfmark + " · " + pr.licenseTr;
  }
`;

js = mustReplace(
  js,
  `  var DECOR_SUB_TR = "Sayfa fontu KFGQPC QCF · çerçeve ve gül özgün dekoratif (basılı tezhip değil)";`,
  pdBlock + `\n  var DECOR_SUB_TR = DECOR_SUB_SADE;`,
  "pd block"
);

js = mustReplace(
  js,
  `  function normalizeStyle(style) {
    if (style === "altin") return "altin";
    return "sade";
  }

  function styleLabel(style) {
    if (style === "altin") return "Altın";
    return "Sade";
  }

  function nextStyle(style) {
    return style === "sade" ? "altin" : "sade";
  }

  function readStyle() {
    try {
      var s = global.localStorage && localStorage.getItem("hyPageStyle");
      if (s === "tezhip") {
        localStorage.setItem("hyPageStyle", "sade");
        return "sade";
      }
      if (s === "sade" || s === "altin") return s;
    } catch (e) {}
    return "sade";
  }`,
  `  function normalizeStyle(style) {
    if (style === "tezhip" || style === "altin") return style;
    return "sade";
  }

  function styleLabel(style) {
    if (style === "tezhip") return "Tezhip";
    if (style === "altin") return "Altın";
    return "Sade";
  }

  function nextStyle(style) {
    if (style === "sade") return "altin";
    if (style === "altin") return "tezhip";
    return "sade";
  }

  function readStyle() {
    try {
      var s = global.localStorage && localStorage.getItem("hyPageStyle");
      if (s === "tezhip" || s === "sade" || s === "altin") return s;
    } catch (e) {}
    return "sade";
  }`,
  "style cycle"
);

js = mustReplace(
  js,
  `  function applyStyle(style) {
    pageStyle = normalizeStyle(style);
    document.body.classList.toggle("hy-style-sade", pageStyle === "sade");
    document.body.classList.toggle("hy-style-altin", pageStyle === "altin");
    document.body.classList.remove("hy-style-tezhip");
    var orn = document.getElementById("hy-qcf-ornament");
    if (orn) {
      orn.classList.remove("hy-tezhip-on");
      if (orn.querySelector("svg")) orn.innerHTML = "";
    }
    var btn = document.getElementById("hy-style-btn");
    if (btn) {
      btn.textContent = styleLabel(pageStyle);
      btn.title = "Sayfa süsü (dekoratif): Sade veya Sade Altın";
      btn.setAttribute("aria-label", btn.title);
    }
    applyAllah(readAllah());
    if (paintedData) applySpecialTops(paintedData);
  }`,
  `  function applyStyle(style) {
    pageStyle = normalizeStyle(style);
    document.body.classList.toggle("hy-style-sade", pageStyle === "sade");
    document.body.classList.toggle("hy-style-altin", pageStyle === "altin");
    document.body.classList.toggle("hy-style-tezhip", pageStyle === "tezhip");
    if (pageStyle !== "tezhip") {
      clearPdLayers();
      document.body.classList.remove("hy-original-hat");
    } else {
      if (orn.querySelector("svg")) orn.innerHTML = "";
      applyPdDecor();
    }
    var orn = document.getElementById("hy-qcf-ornament");
    if (orn && pageStyle !== "tezhip" && orn.querySelector("svg")) orn.innerHTML = "";
    var btn = document.getElementById("hy-style-btn");
    if (btn) {
      btn.textContent = styleLabel(pageStyle);
      btn.title =
        pageStyle === "tezhip"
          ? "Tarihî tezhip (PD tarama çerçevesi) + QCF metin"
          : "Sayfa süsü: Sade veya Sade Altın";
      btn.setAttribute("aria-label", btn.title);
    }
    var pdBtn = document.getElementById("hy-pd-btn");
    if (pdBtn) pdBtn.style.display = pageStyle === "tezhip" ? "" : "none";
    var hatBtn = document.getElementById("hy-hat-btn");
    if (hatBtn) hatBtn.style.display = pageStyle === "tezhip" ? "" : "none";
    applyAllah(readAllah());
    if (paintedData) {
      applySpecialTops(paintedData);
      applyOriginalHatLayer();
    }
    syncSourceRibbon();
  }`,
  "applyStyle"
);

// fix bug: orn used before defined in applyStyle - reorder
js = js.replace(
  `    if (pageStyle !== "tezhip") {
      clearPdLayers();
      document.body.classList.remove("hy-original-hat");
    } else {
      if (orn.querySelector("svg")) orn.innerHTML = "";
      applyPdDecor();
    }
    var orn = document.getElementById("hy-qcf-ornament");
    if (orn && pageStyle !== "tezhip" && orn.querySelector("svg")) orn.innerHTML = "";`,
  `    var orn = document.getElementById("hy-qcf-ornament");
    if (pageStyle !== "tezhip") {
      clearPdLayers();
      document.body.classList.remove("hy-original-hat");
      if (orn && orn.querySelector("svg")) orn.innerHTML = "";
    } else {
      if (orn && orn.querySelector("svg")) orn.innerHTML = "";
      applyPdDecor();
    }`
);

js = mustReplace(
  js,
  `    var main = activeEdition.shortLabelTr || activeEdition.nameTr || "";
    el.innerHTML =
      '<span class="hy-qcf-source-main">' +
      esc(main) +
      '</span><span class="hy-qcf-source-sub">' +
      esc(DECOR_SUB_TR) +
      "</span>";
    el.title =
      (activeEdition.nameTr || "") +
      " — QCF sayfa fontu, basılı Medine mushaf düzeni (15 satır). Kenar süsleri uygulama dekorasyonu; gerçek mushaf tezhibi veya Diyanet sayfa görüntüsü değil. Türkiye hafız boy için Diyanet izni ayrı.";`,
  `    var main = activeEdition.shortLabelTr || activeEdition.nameTr || "";
    var sub = pageStyle === "tezhip" ? DECOR_SUB_PD : DECOR_SUB_SADE;
    if (pageStyle === "tezhip") {
      var pa = pdAttribLine();
      if (pa) sub = pa;
    }
    el.innerHTML =
      '<span class="hy-qcf-source-main">' +
      esc(main) +
      '</span><span class="hy-qcf-source-sub">' +
      esc(sub) +
      "</span>";
    el.title =
      pageStyle === "tezhip"
        ? (activeEdition.nameTr || "") + " — " + (pdAttribLine() || DECOR_SUB_PD)
        : (activeEdition.nameTr || "") +
          " — QCF sayfa fontu, basılı Medine mushaf düzeni (15 satır). Sade/Altın kenar özgün dekoratif.";`,
  "syncSourceRibbon"
);

js = mustReplace(
  js,
  `    var s =
      pageStyle === "sade" || pageStyle === "altin" || landscape
        ? availW / DESIGN_W
        : Math.min(availW / DESIGN_W, availH / DESIGN_H);`,
  `    var s =
      pageStyle === "sade" || pageStyle === "altin" || pageStyle === "tezhip" || landscape
        ? availW / DESIGN_W
        : Math.min(availW / DESIGN_W, availH / DESIGN_H);`,
  "fit tezhip landscape"
);

js = mustReplace(
  js,
  `  function boot() {
    loadEditionCatalog();`,
  `  function boot() {
    pdFrameId = readPdFrameId();
    originalHat = readOriginalHat();
    loadPdManifest();
    loadEditionCatalog();`,
  "boot pd"
);

js = mustReplace(
  js,
  `    styleLabel: styleLabel,
    nextStyle: nextStyle,
    setAllah: setAllah,`,
  `    styleLabel: styleLabel,
    nextStyle: nextStyle,
    cyclePdFrame: cyclePdFrame,
    setOriginalHat: setOriginalHat,
    getOriginalHat: function () {
      return originalHat;
    },
    getPdFrameId: function () {
      return pdFrameId;
    },
    setAllah: setAllah,`,
  "exports"
);

js = js.split(FROM).join(TO);
write(QCF, js);

let css = read(CSS);
const cssAdd = `
#hy-qcf-scan {
  display: none;
  position: absolute;
  inset: 0;
  z-index: 4;
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  pointer-events: none;
}

#hy-qcf-scan.hy-on { display: block; }

#hy-qcf-paper-infill {
  display: none;
  position: absolute;
  top: 72px;
  left: 56px;
  width: 888px;
  height: 1470px;
  z-index: 0;
  opacity: 0.42;
  mix-blend-mode: multiply;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  pointer-events: none;
}

#hy-qcf-paper-infill.hy-on { display: block; }

body.hy-style-tezhip #hy-qcf-ornament.hy-pd-frame-on {
  inset: 0;
  border: none;
  box-shadow: none;
  background: transparent;
}

body.hy-style-tezhip #hy-qcf-ornament.hy-pd-frame-on::before {
  display: none;
}

body.hy-style-tezhip #hy-qcf-ornament .hy-pd-frame-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  filter: saturate(1.05) contrast(1.03);
}

body.hy-original-hat #hy-qcf-glyphs,
body.hy-original-hat #hy-qcf-paper-infill,
body.hy-original-hat #hy-qcf-ornament .hy-pd-frame-img {
  opacity: 0;
}

body.hy-original-hat #hy-qcf-glyphs {
  pointer-events: none;
}

#hy-player-dock #hy-pd-btn,
#hy-player-dock #hy-hat-btn {
  display: none;
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
}

body.hy-style-tezhip #hy-player-dock #hy-pd-btn,
body.hy-style-tezhip #hy-player-dock #hy-hat-btn {
  display: inline-flex;
}
`;

if (!css.includes("#hy-qcf-scan")) {
  css += cssAdd;
}
css = css.split(FROM).join(TO);
write(CSS, css);

let player = read(PLAYER);
player = mustReplace(
  player,
  `      '<button type="button" data-act="style" id="hy-style-btn" title="Sayfa süsü (dekoratif): Sade veya Sade Altın" aria-label="Sayfa süsü (dekoratif): Sade veya Sade Altın">Sade</button>' +
      '<button type="button" data-act="allah" id="hy-allah-btn"`,
  `      '<button type="button" data-act="style" id="hy-style-btn" title="Sayfa süsü" aria-label="Sayfa süsü">Sade</button>' +
      '<button type="button" data-act="pd" id="hy-pd-btn" title="PD tezhip kaynağı" aria-label="PD tezhip kaynağı">W.569</button>' +
      '<button type="button" data-act="hat" id="hy-hat-btn" title="Orijinal hat / el yazması (sayfa 1)" aria-label="Orijinal hat">Hat</button>' +
      '<button type="button" data-act="allah" id="hy-allah-btn"`,
  "player buttons"
);

player = mustReplace(
  player,
  `    } else if (act === "style") {`,
  `    } else if (act === "pd") {
      if (global.hyQcfMushaf && global.hyQcfMushaf.cyclePdFrame) global.hyQcfMushaf.cyclePdFrame();
    } else if (act === "hat") {
      var hatOn = global.hyQcfMushaf && global.hyQcfMushaf.getOriginalHat ? global.hyQcfMushaf.getOriginalHat() : false;
      if (global.hyQcfMushaf && global.hyQcfMushaf.setOriginalHat) global.hyQcfMushaf.setOriginalHat(!hatOn);
      btn.classList.toggle("on", !hatOn);
    } else if (act === "style") {`,
  "player handlers"
);

player = player.split(FROM).join(TO);
write(PLAYER, player);

let index = read(INDEX);
index = index.split(FROM).join(TO);
write(INDEX, index);

let ed = JSON.parse(read(EDITIONS));
ed.editions[0].licenseTr =
  "QCF sayfa fontları KFGQPC; satır–kelime düzeni Quran Foundation / quran.com. Sade/Altın kenar özgün dekoratif SVG. «Tezhip» modu: kamu malı tarihî mushaf taramasından çerçeve/kağıt (manifest: /assets/mushaf/pd/manifest.json); iç metin yine QCF.";
ed.editions[0].notesTr =
  "Tezhip = PD tarihî çerçeve + QCF (2026-10-26). «Orijinal hat» sayfa 1’de el yazması taraması; diğer sayfalarda QCF.";
const pdNotes = {
  schema: 1,
  manifest: "/assets/mushaf/pd/manifest.json",
  licensePolicyTr: "Yalnız Public Domain / serbest kullanım; CC BY-SA paketleri kullanılmaz.",
};
ed.pdHistoricalFrames = pdNotes;
ed.pdFrameEditions = JSON.parse(read(path.join(ROOT, "scripts/pd-mushaf-sources.json"))).editions.map(function (e) {
  return {
    id: e.id,
    nameTr: e.nameTr,
    shortLabelTr: e.shortLabelTr,
    institutionTr: e.institutionTr,
    shelfmark: e.shelfmark,
    licenseTr: e.licenseTr,
    licenseUrl: e.licenseUrl,
  };
});
write(EDITIONS, JSON.stringify(ed, null, 2) + "\n");

console.log("ok: pd historical mushaf patch");
