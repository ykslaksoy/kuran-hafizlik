(function (global) {
  var DESIGN_W = 1000;
  var DESIGN_H = 1610;
  var LINE_H = 98;
  var LINE_N = 15;
  var BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

  var FONTS = {
    "qcf-v2": { label: "KFGQPC QCF V2 (1421H)", mode: "qcf-v2", qcf: "v2", preview: true },
    "qcf-v1": { label: "KFGQPC QCF V1 (1405H)", mode: "qcf-v1", qcf: "v1", preview: true },
    "qcf-v4": { label: "KFGQPC QCF V4 (tecvid)", mode: "qcf-v2", qcf: "v4", preview: true },
    "kfgqpc-uthmanic-hafs": {
      label: "KFGQPC Uthmanic Hafs (Unicode)",
      family: "UthmanicHafs",
      src: "/preview/mushaf-fonts/fonts/UthmanicHafs1Ver18.woff2",
      mode: "unicode",
      preview: true,
    },
    "digital-khatt-v2": {
      label: "Digital Khatt V2",
      family: "DigitalKhatt",
      src: "/preview/mushaf-fonts/fonts/DigitalKhatt.woff2",
      mode: "unicode",
      preview: true,
    },
    "amiri-quran": {
      label: "Amiri Quran",
      family: "AmiriQuran",
      src: "/preview/mushaf-fonts/fonts/AmiriQuran.ttf",
      mode: "unicode",
      preview: true,
    },
    "scheherazade-new": {
      label: "Scheherazade New",
      family: "ScheherazadeNew",
      src: "/preview/mushaf-fonts/fonts/ScheherazadeNew.ttf",
      mode: "unicode",
      preview: true,
    },
    "noto-naskh-arabic": {
      label: "Noto Naskh Arabic",
      family: "NotoNaskhArabic",
      src: "/preview/mushaf-fonts/fonts/NotoNaskhArabic.woff2",
      mode: "unicode",
      preview: true,
    },
    "uthman-taha": {
      label: "Uthman Taha (Medine naskh)",
      family: "UthmanTaha",
      src: "/preview/mushaf-fonts/fonts/UthmanTaha.otf",
      mode: "unicode",
      preview: true,
    },
    "indopak-nastaleeq": {
      label: "IndoPak Nastaleeq",
      family: "IndoPakNastaleeq",
      src: "/preview/mushaf-fonts/fonts/indopak-nastaleeq.woff2",
      mode: "indopak",
      preview: true,
    },
    "diyanet-abay": {
      label: "Diyanet Abay (Zekr türevi)",
      family: "DiyanetAbay",
      src: "/preview/mushaf-fonts/fonts/DiyanetAbay.ttf",
      mode: "unicode",
      preview: true,
    },
  };

  var pageData = null;
  var altScripts = null;
  var pageNum = 1;

  function resolveDef(slug, page) {
    var base = FONTS[slug];
    if (!base) return null;
    var def = {
      label: base.label,
      mode: base.mode,
      preview: base.preview,
      family: base.family,
      src: base.src,
    };
    if (base.qcf) {
      var tag = base.qcf === "v1" ? "v1" : base.qcf === "v4" ? "v4" : "v2";
      def.family = "QCF_" + tag.toUpperCase() + "_P" + page;
      def.src = "/preview/mushaf-fonts/fonts/qcf-" + tag + "-p" + page + ".woff2";
    }
    return def;
  }

  function injectFace(id, family, href) {
    if (document.getElementById(id)) return;
    var st = document.createElement("style");
    st.id = id;
    st.textContent =
      '@font-face{font-family:"' +
      family +
      '";src:url("' +
      href +
      '") format("woff2"),url("' +
      href +
      '") format("truetype");font-display:block;font-weight:400;font-style:normal;}';
    document.head.appendChild(st);
  }

  function loadFont(def) {
    injectFace("hy-ff-" + def.family, def.family, def.src);
    if (!document.fonts) return Promise.resolve();
    return document.fonts.load('46px "' + def.family + '"').catch(function () {});
  }

  function lineByN(data, n) {
    for (var i = 0; i < (data.lines || []).length; i++) if (data.lines[i].n === n) return data.lines[i];
    return null;
  }

  function headerAtMap(data) {
    if (data.page === 1) return { 3: { kind: "header", title: "الْفَاتِحَة" } };
    if (data.page === 2) return { 3: { kind: "header", title: "البَقَرَة" }, 5: { kind: "bismillah" } };
    return {};
  }

  function packSpecialTops(data, headers) {
    if (!data || data.page > 2) return null;
    var items = [];
    for (var n = 1; n <= LINE_N; n++) {
      if (headers[n] || lineByN(data, n)) items.push(n);
    }
    var extra = 0;
    for (var i = 0; i < items.length; i++) if (headers[items[i]]) extra += 18;
    var block = items.length * LINE_H + extra;
    var start = Math.round((1470 - block) / 2);
    if (start < 36) start = 36;
    var tops = {};
    var y = start;
    for (var j = 0; j < items.length; j++) {
      tops[items[j]] = y;
      y += LINE_H;
      if (headers[items[j]]) y += 18;
    }
    return tops;
  }

  function toIndic(n) {
    return String(n).replace(/\d/g, function (d) {
      return "٠١٢٣٤٥٦٧٨٩"[d];
    });
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function wordHtml(def, w, endUnicodeFamily) {
    if (def.mode === "qcf-v2") return '<span class="hy-qcf-word">' + esc(w.code) + "</span>";
    if (def.mode === "qcf-v1") return '<span class="hy-qcf-word">' + esc(w.v1 || w.code) + "</span>";
    if (def.mode === "indopak") return '<span class="hy-qcf-word">' + esc(w.t || w.uth) + "</span>";
    if (w.type === "end" && endUnicodeFamily) {
      return '<span class="hy-qcf-end" style="font-family:\'' + endUnicodeFamily + "'\">" + esc(w.uth) + "</span>";
    }
    return '<span class="hy-qcf-word">' + esc(w.uth) + "</span>";
  }

  function lineWords(def, lineNo, line) {
    if (def.mode === "qcf-v1" && altScripts && altScripts.v1[String(lineNo)]) {
      return altScripts.v1[String(lineNo)].map(function (w) {
        return { type: w.type, v1: w.v1, uth: w.uth, code: w.v1 };
      });
    }
    if (def.mode === "indopak" && altScripts && altScripts.indopak[String(lineNo)]) {
      return altScripts.indopak[String(lineNo)];
    }
    return line ? line.words : [];
  }

  function buildStageHtml(def) {
    var headers = headerAtMap(pageData);
    var tops = packSpecialTops(pageData, headers);
    var ff = def.family;
    var endFf = def.mode === "indopak" ? ff : "UthmanicHafs";
    if (def.mode !== "indopak" && def.mode !== "qcf-v2" && def.mode !== "qcf-v1") {
      injectFace("hy-ff-UthmanicHafs-end", "UthmanicHafs", "/preview/mushaf-fonts/fonts/UthmanicHafs1Ver18.woff2");
    }
    var html = "";
    for (var n = 1; n <= LINE_N; n++) {
      var line = lineByN(pageData, n);
      var header = headers[n];
      if (tops) {
        if (!line && !header) continue;
      } else if (!line) continue;
      var top = tops ? tops[n] : 72 + (n - 1) * LINE_H;
      html +=
        '<div class="hy-qcf-linebox" style="top:' +
        top +
        'px;font-family:\'' +
        ff +
        "', serif\">";
      if (header && header.kind === "header") {
        html += '<span class="hy-qcf-header">سُورَةُ ' + esc(header.title) + "</span>";
      } else if (header && header.kind === "bismillah") {
        html += '<span class="hy-qcf-bismillah">' + BISMILLAH + "</span>";
      } else if (line) {
        var words = lineWords(def, n, line);
        words.forEach(function (w, wi) {
          html += wordHtml(def, w, endFf) + (wi < words.length - 1 ? " " : "");
        });
      }
      html += "</div>";
    }
    return html;
  }

  function mountStage(stage, def, opts) {
    opts = opts || {};
    var v0 = pageData.verses && pageData.verses[0];
    var juz = pageData.juz || 1;
    stage.className = pageData.page <= 2 ? "hy-special" : "";
    var inner =
      '<div id="hy-qcf-meta" style="position:absolute;top:20px;left:40px;right:40px;display:flex;justify-content:space-between;direction:rtl;font-size:15px;color:#9a9690"><span>الجزء ' +
      toIndic(juz) +
      '</span><span>' +
      esc(v0 && v0.key ? v0.key : "") +
      "</span></div>" +
      '<div id="hy-qcf-glyphs">' +
      buildStageHtml(def) +
      "</div>" +
      '<div id="hy-qcf-overlay"><div id="hy-qcf-hl"></div></div>' +
      '<div id="hy-qcf-pagenum" style="position:absolute;bottom:18px;left:0;right:0;text-align:center;font-size:17px;color:#8a8680">' +
      toIndic(pageData.page) +
      "</div>";
    if (opts.sevki) {
      stage.innerHTML = inner;
      return;
    }
    stage.innerHTML =
      '<div id="hy-qcf-ornament" data-hy-frame="D">' +
      '<div class="hy-frame-deco"><svg class="hy-frame-border-svg" viewBox="0 0 1000 1610" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<rect x="18" y="18" width="964" height="1574" fill="none" stroke="#e3e0da" stroke-width="1"/></svg></div></div>' +
      inner;
    if (global.hyFrameDeco) global.hyFrameDeco.inject("D");
  }

  function ensureQcfHost(frame) {
    frame.style.position = frame.style.position || "relative";
    var host = document.getElementById("hy-qcf-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "hy-qcf-host";
      host.innerHTML =
        '<div id="hy-qcf-fit"><div id="hy-qcf-stage" class="hy-waiting">' +
        '<div id="hy-qcf-wait">Sayfa hattı yükleniyor</div></div></div>';
      frame.appendChild(host);
    } else if (host.parentElement !== frame) {
      frame.appendChild(host);
    }
    return host;
  }

  function fitQcfHost() {
    var host = document.getElementById("hy-qcf-host");
    var fit = document.getElementById("hy-qcf-fit");
    var stage = document.getElementById("hy-qcf-stage");
    if (!host || !fit || !stage) return;
    var box = host.getBoundingClientRect();
    var s = Math.min(Math.max(120, box.width) / DESIGN_W, Math.max(160, box.height) / DESIGN_H);
    fit.style.width = DESIGN_W * s + "px";
    fit.style.height = DESIGN_H * s + "px";
    stage.style.width = DESIGN_W + "px";
    stage.style.height = DESIGN_H + "px";
    stage.style.transform = "scale(" + s + ")";
    stage.style.transformOrigin = "top left";
  }

  function renderIntoQcfStage(slug) {
    var def = resolveDef(slug, pageNum);
    if (!def || !pageData) return Promise.resolve();
    return loadFont(def).then(function () {
      var row = document.getElementById("hy-row-0") || document.querySelector('[id="hy-row-0"]');
      var frame = row && row.parentElement && row.parentElement.parentElement;
      if (!frame) return;
      ensureQcfHost(frame);
      var stage = document.getElementById("hy-qcf-stage");
      stage.classList.remove("hy-waiting");
      var wait = document.getElementById("hy-qcf-wait");
      if (wait) wait.style.display = "none";
      mountStage(stage, def, { sevki: true });
      fitQcfHost();
      window.addEventListener("resize", fitQcfHost);
    });
  }

  function readyToken(slug) {
    return slug + "-p" + pageNum;
  }

  function fitStage() {
    var fit = document.getElementById("hy-font-fit");
    var stage = document.getElementById("hy-font-stage");
    if (!fit || !stage) return;
    var box = document.getElementById("hy-font-root").getBoundingClientRect();
    var s = Math.min((box.width - 48) / DESIGN_W, (box.height - 48) / DESIGN_H, 1.6);
    if (document.body.classList.contains("hy-font-compare")) s = 0.48;
    fit.style.width = DESIGN_W * s + "px";
    fit.style.height = DESIGN_H * s + "px";
    stage.style.transform = "scale(" + s + ")";
    stage.style.transformOrigin = "top left";
  }

  function renderOne(slug, parent) {
    var def = resolveDef(slug, pageNum);
    if (!def || !def.preview) return Promise.resolve();
    return loadFont(def).then(function () {
      var wrap = parent || document.getElementById("hy-font-root");
      var stage = document.createElement("div");
      if (parent) stage.className = "mini-stage";
      else {
        wrap.innerHTML = '<div id="hy-font-fit"></div>';
        stage.id = "hy-font-stage";
        document.getElementById("hy-font-fit").appendChild(stage);
      }
      mountStage(stage, def);
      if (!parent) {
        fitStage();
        document.body.setAttribute("data-hy-font-ready", readyToken(slug));
      }
    });
  }

  function renderCompare() {
    pageNum = 1;
    return loadPageData(1).then(function () {
      var root = document.getElementById("hy-font-root");
      var grid = document.createElement("div");
      grid.className = "hy-font-grid";
      root.innerHTML = "";
      root.appendChild(grid);
      var slugs = Object.keys(FONTS).filter(function (k) {
        return FONTS[k].preview;
      });
      return Promise.all(
        slugs.map(function (slug) {
          var def = resolveDef(slug, 1);
          return loadFont(def).then(function () {
            var card = document.createElement("div");
            card.className = "hy-font-card";
            card.innerHTML = "<h2>" + esc(def.label) + " · Fâtiha</h2>";
            var stage = document.createElement("div");
            stage.className = "mini-stage";
            card.appendChild(stage);
            grid.appendChild(card);
            mountStage(stage, def);
          });
        })
      ).then(function () {
        document.body.setAttribute("data-hy-font-ready", "compare");
      });
    });
  }

  function loadPageData(n) {
    pageNum = n;
    return Promise.all([
      fetch("/assets/mushaf/qcf-page-" + n + ".json").then(function (r) {
        return r.json();
      }),
      fetch("/preview/mushaf-fonts/page" + n + "-alt-scripts.json")
        .then(function (r) {
          return r.ok ? r.json() : { v1: {}, indopak: {} };
        })
        .catch(function () {
          return { v1: {}, indopak: {} };
        }),
    ]).then(function (pair) {
      pageData = pair[0];
      altScripts = pair[1];
    });
  }

  function boot() {
    document.body.classList.add("hy-font-preview", "hy-frame-preview", "hy-frame-alt-d", "hy-kuran");
    var q = new URLSearchParams(location.search);
    var mode = q.get("mode") || (/\/compare\.html/i.test(location.pathname) ? "compare" : "single");
    var n = parseInt(q.get("page") || "1", 10);
    if (n < 1 || n > 604) n = 1;
    if (mode === "compare") {
      renderCompare().then(function () {
        fitStage();
        window.addEventListener("resize", fitStage);
      });
      return;
    }
    var slug = q.get("font") || "qcf-v2";
    loadPageData(n)
      .then(function () {
        return renderOne(slug);
      })
      .then(function () {
        fitStage();
        window.addEventListener("resize", fitStage);
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  global.hyFontPreview = {
    FONTS: FONTS,
    resolveDef: resolveDef,
    renderOne: renderOne,
    loadPageData: loadPageData,
    renderIntoQcfStage: renderIntoQcfStage,
  };
})(window);
