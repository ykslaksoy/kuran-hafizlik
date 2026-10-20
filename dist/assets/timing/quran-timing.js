/**
 * Hafızyol ok takibi — Fatiha / Mişari demo.
 * Varsayılan: Hafızyol harf hizalaması (everyayah PCM + QUL çapa + tecvid).
 * Kıyas kaynakları ürüne gömülmez; yalnızca demo seçicisinde.
 */
(function (global) {
  var RECITERS = {
    alafasy: { quranId: 7, wordTiming: true, labelTr: "Mişari" },
    abdulbasit: { quranId: 1, wordTiming: true, labelTr: "Abdülbasit (Mujawwad)" },
    "abdulbasit-murattal": { quranId: 2, wordTiming: true, labelTr: "Abdülbasit (Murattal)" },
    sudais: { quranId: 3, wordTiming: true, labelTr: "Sudais" },
    husary: { quranId: 6, wordTiming: true, labelTr: "Husary" },
    minshawi: { quranId: 8, wordTiming: true, labelTr: "Minşevi (Mujawwad)" },
    "hoca-tts": { quranId: null, wordTiming: false, labelTr: "Hoca (TTS)" },
  };

  var SOURCES = [
    {
      id: "hafizyol",
      label: "Hafızyol hizalama · harf (varsayılan)",
      file: "/assets/timing/positions-hafizyol-fatiha.json",
      level: "letter",
      demoOnly: false,
    },
    {
      id: "qurancom",
      label: "quran.com / QUL · kelime→harf · kıyas",
      file: "/assets/timing/positions-qurancom-fatiha.json",
      level: "word",
      demoOnly: true,
    },
    {
      id: "qurancom-word",
      label: "quran.com / QUL · kelime · kıyas",
      file: "/assets/timing/positions-qurancom-fatiha.json",
      level: "word-only",
      demoOnly: true,
    },
  ];

  var BASE = /[\u0621-\u063A\u0641-\u064A\u0671\u0672\u0673\u0674\u0675\u067E\u0686\u0698\u06A9\u06AF\u06BE\u06C0\u06C1\u06CC\u06D5]/;
  var SKIP_CP = /[\u0640\u200C\u200D\uFEFF\s]/;
  var SHADDA = "\u0651";
  var MADDAH = "\u0653";
  var SUPER_ALEF = "\u0670";
  var SUKUN = "\u0652";
  var FATHA = "\u064E";
  var DAMMA = "\u064F";
  var KASRA = "\u0650";
  var FATHATAN = "\u064B";
  var DAMMATAN = "\u064C";
  var KASRATAN = "\u064D";
  var ALEF = "\u0627";
  var ALEF_WASLA = "\u0671";
  var WAW = "\u0648";
  var YEH = "\u064A";
  var ALEF_MAQSURA = "\u0649";
  var NOON = "\u0646";
  var MEEM = "\u0645";

  function isBase(ch) {
    return BASE.test(ch);
  }

  function glyphs(word) {
    var s = String(word || "");
    var out = [];
    var i = 0;
    var gi = 0;
    while (i < s.length) {
      var ch = s[i];
      if (SKIP_CP.test(ch)) {
        i += 1;
        continue;
      }
      if (!isBase(ch)) {
        i += 1;
        continue;
      }
      var marks = "";
      var j = i + 1;
      while (j < s.length && !isBase(s[j]) && !SKIP_CP.test(s[j])) {
        marks += s[j];
        j += 1;
      }
      var skip = false;
      if (ch === ALEF_WASLA) skip = true;
      if (ch === ALEF && i > 0 && (s[i - 1] === FATHATAN || (out.length && out[out.length - 1].marks.indexOf(FATHATAN) >= 0))) {
        skip = true;
      }
      var weight = 1;
      if (marks.indexOf(SHADDA) >= 0) weight += 0.85;
      if (marks.indexOf(MADDAH) >= 0 || marks.indexOf(SUPER_ALEF) >= 0) weight += 2.2;
      if (marks.indexOf(FATHATAN) >= 0 || marks.indexOf(DAMMATAN) >= 0 || marks.indexOf(KASRATAN) >= 0) {
        weight += 0.55;
      }
      if ((ch === NOON || ch === MEEM) && marks.indexOf(SHADDA) >= 0) weight += 1.15;
      var prevMarks = out.length ? out[out.length - 1].marks : "";
      if (ch === ALEF && prevMarks.indexOf(FATHA) >= 0) weight += 1.6;
      if (ch === WAW && prevMarks.indexOf(DAMMA) >= 0) weight += 1.6;
      if ((ch === YEH || ch === ALEF_MAQSURA) && prevMarks.indexOf(KASRA) >= 0) weight += 1.6;
      if (marks.indexOf(SUKUN) >= 0 && !skip) weight = Math.max(0.75, weight * 0.85);
      out.push({
        i: gi,
        ch: ch + marks,
        base: ch,
        marks: marks,
        weight: skip ? 0 : weight,
        skip: skip,
      });
      gi += 1;
      i = j;
    }
    if (!out.length) {
      out.push({ i: 0, ch: s || " ", base: s || " ", marks: "", weight: 1, skip: false });
    }
    return out;
  }

  function voiced(glyphsList) {
    return glyphsList.filter(function (g) {
      return !g.skip && g.weight > 0;
    });
  }

  var sourceCache = {};
  var sourceP = {};
  var positions = null;
  var sourceId = "hafizyol";
  var active = { reciter: "alafasy", surah: 1, ayah: 1, wordIndex: 0, letterIndex: 0, ayahIndex: 0 };
  var arrowEl = null;
  var pickerEl = null;

  function sourceMeta(id) {
    for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].id === id) return SOURCES[i];
    return SOURCES[0];
  }

  function isKnownSource(id) {
    for (var i = 0; i < SOURCES.length; i++) if (SOURCES[i].id === id) return true;
    return false;
  }

  function readStoredSource() {
    try {
      var q = typeof location !== "undefined" && /[?&]src=([^&]+)/.exec(location.search);
      if (q && isKnownSource(decodeURIComponent(q[1]))) return decodeURIComponent(q[1]);
    } catch (e) {}
    try {
      var s = global.localStorage && localStorage.getItem("hyTimingSource");
      if (isKnownSource(s) && !sourceMeta(s).demoOnly) return s;
      if (isKnownSource(s) && sourceMeta(s).demoOnly) {
        localStorage.removeItem("hyTimingSource");
      }
    } catch (e2) {}
    return "hafizyol";
  }

  function storeSource(id) {
    try {
      global.localStorage && localStorage.setItem("hyTimingSource", id);
    } catch (e) {}
  }

  function loadSource(id) {
    var meta = sourceMeta(id);
    sourceId = meta.id;
    if (sourceCache[meta.file]) {
      positions = sourceCache[meta.file];
      return Promise.resolve(positions);
    }
    if (sourceP[meta.file]) return sourceP[meta.file];
    sourceP[meta.file] = fetch(meta.file, { cache: "force-cache" })
      .then(function (r) {
        return r.ok ? r.json() : null;
      })
      .then(function (j) {
        sourceCache[meta.file] = j;
        if (sourceMeta(sourceId).file === meta.file) positions = j;
        return j;
      })
      .catch(function () {
        return null;
      });
    return sourceP[meta.file];
  }

  function setSource(id) {
    var meta = sourceMeta(id);
    sourceId = meta.id;
    storeSource(meta.id);
    return loadSource(meta.id).then(function () {
      paintPicker();
      placeArrow();
      return meta;
    });
  }

  function positionAyah(surah, ayah) {
    if (!positions || !positions.ayahs) return null;
    var list = positions.ayahs;
    for (var i = 0; i < list.length; i++) {
      if (list[i].surah === surah && list[i].ayah === ayah) return list[i];
    }
    return null;
  }

  function hasWordTiming(reciterId) {
    var meta = RECITERS[reciterId];
    return !!(meta && meta.wordTiming);
  }

  function atTime(reciterId, surah, ayah, timeSec, spans) {
    var pin = { ayahIndex: spans && spans[0] ? spans[0].ayahIndex : 0, wordIndex: 0, letterIndex: 0, pinned: true };
    if (!hasWordTiming(reciterId)) return pin;
    if (Number(surah) !== 1) return pin;
    var tMs = Math.max(0, Number(timeSec) || 0) * 1000;
    var table = positionAyah(surah, ayah);
    if (table && table.segments && table.segments.length) {
      var segs = table.segments;
      var hit = segs[0];
      for (var i = 0; i < segs.length; i++) {
        var start = segs[i].startMs;
        var end = start + segs[i].duration;
        if (tMs >= start && tMs < end) {
          hit = segs[i];
          break;
        }
        if (tMs >= start) hit = segs[i];
      }
      var span = spans && spans[hit.wordIndex] ? spans[hit.wordIndex] : spans && spans[0];
      var letterIndex = hit.letterIndex;
      if (sourceMeta(sourceId).level === "word-only") letterIndex = 0;
      return {
        ayahIndex: span ? span.ayahIndex : pin.ayahIndex,
        wordIndex: hit.wordIndex,
        letterIndex: letterIndex,
        pinned: false,
        row: hit.row,
        startoffset: hit.startoffset,
        endoffset: hit.endoffset,
        startMs: hit.startMs,
        duration: hit.duration,
        sourceId: sourceId,
      };
    }
    return pin;
  }

  function letterInWord(text, startMs, endMs, tMs) {
    var gs = voiced(glyphs(text));
    if (!gs.length) return 0;
    var dur = Math.max(1, endMs - startMs);
    var rel = Math.max(0, Math.min(dur, tMs - startMs));
    var sum = 0;
    for (var i = 0; i < gs.length; i++) sum += gs[i].weight;
    var acc = 0;
    for (var j = 0; j < gs.length; j++) {
      acc += (gs[j].weight / sum) * dur;
      if (rel < acc) return gs[j].i;
    }
    return gs[gs.length - 1].i;
  }

  function ensureArrow() {
    if (arrowEl && arrowEl.parentNode) return arrowEl;
    arrowEl = document.getElementById("hy-track-arrow");
    if (arrowEl) return arrowEl;
    arrowEl = document.createElement("div");
    arrowEl.id = "hy-track-arrow";
    arrowEl.setAttribute("aria-hidden", "true");
    arrowEl.innerHTML = '<span style="display:block;font-size:34px;line-height:28px;color:#97FF0A;text-shadow:0 0 8px #14532d,0 2px 0 #052e16">\u25B2</span>';
    arrowEl.style.cssText =
      "position:fixed;z-index:99999;pointer-events:none;transform:translate(-50%,0);display:none;";
    document.body.appendChild(arrowEl);
    return arrowEl;
  }

  function findByNativeId(id) {
    var qcf = document.querySelector('[data-hy-qcf="' + id.replace(/^hy-l-/, "") + '"]');
    if (qcf) return qcf;
    if (id.indexOf("hy-row-") === 0) {
      var n = id.slice(7);
      var qrow = document.getElementById("hy-qcf-row-" + n) || document.querySelector('[data-hy-qcf-row="' + n + '"]');
      if (qrow) return qrow;
    }
    return (
      document.getElementById(id) ||
      document.querySelector('[id="' + id + '"]') ||
      document.querySelector('[nativeID="' + id + '"]') ||
      document.querySelector('[nativeid="' + id + '"]') ||
      document.querySelector('[data-nativeid="' + id + '"]') ||
      document.querySelector('[data-hy-qcf="' + id.replace(/^hy-l-/, "") + '"]')
    );
  }

  function usableRect(node) {
    if (!node) return null;
    var r = node.getBoundingClientRect();
    if (r.width || r.height) return r;
    if (node.firstElementChild) {
      r = node.firstElementChild.getBoundingClientRect();
      if (r.width || r.height) return r;
    }
    return null;
  }

  function textBoxForRow(row) {
    var line = findByNativeId("hy-row-" + row);
    if (!line) return null;
    var nodes = line.querySelectorAll('[id^="hy-l-"], [nativeID^="hy-l-"], [nativeid^="hy-l-"]');
    var minL = Infinity;
    var maxR = -Infinity;
    var bottom = 0;
    var top = 0;
    for (var i = 0; i < nodes.length; i++) {
      var rr = nodes[i].getBoundingClientRect();
      if (!rr.width && !rr.height) continue;
      if (rr.left < minL) minL = rr.left;
      if (rr.right > maxR) maxR = rr.right;
      bottom = rr.bottom;
      top = rr.top;
    }
    if (!isFinite(minL) || maxR <= minL) return null;
    return { left: minL, width: maxR - minL, bottom: bottom, top: top, height: bottom - top };
  }

  function placeArrow() {
    if (typeof document === "undefined") return;
    var el = ensureArrow();
    var r = null;
    var li = active.letterIndex || 0;
    for (var k = 0; k < 6 && !r; k++) {
      r = usableRect(findByNativeId("hy-l-" + active.ayahIndex + "-" + active.wordIndex + "-" + (li + k)));
    }
    if (!r && typeof active.startoffset === "number" && active.row != null) {
      var box = textBoxForRow(active.row);
      if (box) {
        var mid = (active.startoffset + (typeof active.endoffset === "number" ? active.endoffset : active.startoffset)) / 2;
        r = { left: box.left + mid * box.width, width: 0, bottom: box.bottom, top: box.top, height: box.height };
      }
    }
    if (!r) {
      el.style.display = "none";
      return;
    }
    var letterNode = findByNativeId("hy-l-" + active.ayahIndex + "-" + active.wordIndex + "-" + li);
    var rowNode = letterNode && letterNode.closest && (letterNode.closest(".hy-qcf-line") || letterNode.closest('[id^="hy-row-"]'));
    if (!rowNode && active.row != null) rowNode = findByNativeId("hy-row-" + active.row);
    el.style.display = "block";
    el.style.left = r.left + r.width / 2 + "px";
    // Glyph boxes overflow the 15-line band; pin the tip inside the row, not onto the next ayah.
    var tip = r.bottom - 8;
    if (rowNode) {
      var band = rowNode.getBoundingClientRect();
      if (band.height) tip = band.top + band.height * 0.62;
    }
    el.style.top = tip + "px";
  }

  function setActive(hit) {
    if (!hit) return;
    active.ayahIndex = hit.ayahIndex;
    active.wordIndex = hit.wordIndex;
    active.letterIndex = hit.letterIndex || 0;
    active.row = hit.row;
    active.startoffset = hit.startoffset;
    active.endoffset = hit.endoffset;
    placeArrow();
  }

  function hideArrow() {
    if (arrowEl) arrowEl.style.display = "none";
  }

  function onKuran() {
    if (typeof location === "undefined") return false;
    if (typeof document !== "undefined" && document.querySelector('[aria-label="Sonraki sayfa"]')) return true;
    if (typeof location === "undefined") return false;
    return /kuran/i.test(location.pathname + location.hash + location.search);
  }

  var pickerOpen = false;

  function paintPicker() {
    if (!pickerEl) return;
    var html =
      '<button type="button" class="hy-src-toggle" data-hy-src-toggle="1">' +
      (pickerOpen ? "Kaynak ▴" : "Kaynak ▾") +
      "</button>";
    if (pickerOpen) {
      html += '<div class="hy-src-title">Fatiha demo · takip kaynağı</div>';
      SOURCES.forEach(function (s) {
        var on = s.id === sourceId;
        html +=
          '<button type="button" data-hy-src="' +
          s.id +
          '" class="hy-src-btn' +
          (on ? " on" : "") +
          '">' +
          s.label +
          (on ? " ✓" : "") +
          "</button>";
      });
    }
    pickerEl.innerHTML = html;
    pickerEl.className = pickerOpen ? "" : "hy-src-collapsed";
    pickerEl.style.display = onKuran() ? "flex" : "none";
  }

  function ensurePicker() {
    if (typeof document === "undefined") return;
    if (pickerEl && pickerEl.parentNode) {
      paintPicker();
      return pickerEl;
    }
    if (!document.getElementById("hy-src-style")) {
      var st = document.createElement("style");
      st.id = "hy-src-style";
      st.textContent =
        "#hy-timing-source{position:fixed;right:8px;bottom:76px;z-index:99991;display:none;flex-direction:column;align-items:flex-end;gap:4px;background:transparent;color:#e8f5e9;border:0;padding:0;font:11px/1.3 system-ui,sans-serif;max-width:min(320px,92vw)}" +
        "#hy-timing-source .hy-src-title{width:100%;font-weight:700;color:#97FF0A;font-size:11px;background:#0f2418f2;padding:4px 6px;border-radius:6px}" +
        "#hy-timing-source .hy-src-btn{background:#1b4332;color:#fff;border:1px solid #2d6a4f;border-radius:8px;padding:4px 7px;cursor:pointer;font-size:11px;width:100%;text-align:right}" +
        "#hy-timing-source .hy-src-btn.on{background:#2d6a4f;border-color:#97FF0A;color:#97FF0A;font-weight:700}" +
        "#hy-timing-source .hy-src-toggle{background:#1b4332;color:#97FF0A;border:1px solid #2d6a4f;border-radius:8px;padding:4px 8px;cursor:pointer;font:600 11px/1.2 system-ui,sans-serif}";
      document.head.appendChild(st);
    }
    pickerEl = document.getElementById("hy-timing-source");
    if (!pickerEl) {
      pickerEl = document.createElement("div");
      pickerEl.id = "hy-timing-source";
      document.body.appendChild(pickerEl);
      pickerEl.addEventListener("click", function (e) {
        var t = e.target;
        if (t && t.getAttribute && t.getAttribute("data-hy-src-toggle")) {
          pickerOpen = !pickerOpen;
          paintPicker();
          return;
        }
        var id = t && t.getAttribute && t.getAttribute("data-hy-src");
        if (id) setSource(id);
      });
    }
    paintPicker();
    return pickerEl;
  }

  function boot() {
    sourceId = readStoredSource();
    loadSource(sourceId);
    ensurePicker();
  }

  if (
    typeof window !== "undefined" &&
    typeof window.addEventListener === "function" &&
    typeof document !== "undefined"
  ) {
    window.addEventListener("resize", placeArrow);
    window.addEventListener("scroll", placeArrow, true);
    window.addEventListener("popstate", paintPicker);
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    setInterval(function () {
      if (pickerEl && onKuran() && pickerEl.style.display === "none") paintPicker();
      if (pickerEl && !onKuran() && pickerEl.style.display !== "none") pickerEl.style.display = "none";
    }, 800);
  }

  global.hyQuranTiming = {
    RECITERS: RECITERS,
    SOURCES: SOURCES,
    ready: true,
    glyphs: glyphs,
    voiced: voiced,
    hasWordTiming: hasWordTiming,
    prefetchSurah: function (reciterId, chapter) {
      if (Number(chapter) !== 1) return Promise.resolve(null);
      return loadSource(sourceId);
    },
    atTime: atTime,
    letterInWord: letterInWord,
    setActive: setActive,
    placeArrow: placeArrow,
    hideArrow: hideArrow,
    loadPositions: function () {
      return loadSource(sourceId);
    },
    setSource: setSource,
    getSource: function () {
      return sourceMeta(sourceId);
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
