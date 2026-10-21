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
      short: "Hafızyol",
      file: "/assets/timing/positions-hafizyol-fatiha.json",
      level: "letter",
      demoOnly: false,
    },
    {
      id: "qurancom",
      label: "quran.com / QUL · kelime→harf · kıyas",
      short: "QUL harf",
      file: "/assets/timing/positions-qurancom-fatiha.json",
      level: "word",
      demoOnly: true,
    },
    {
      id: "qurancom-word",
      label: "quran.com / QUL · kelime · kıyas",
      short: "QUL kelime",
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
  var QALQALA = /[\u0642\u0637\u0628\u062C\u062F]/;
  var ARROW_LEAD_MS = 100;
  var ARROW_MIN_VIS_MS = 70;

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
      var kind = "plain";
      if (marks.indexOf(SHADDA) >= 0) {
        weight += 0.55;
        kind = "shadda";
      }
      if (marks.indexOf(MADDAH) >= 0 || marks.indexOf(SUPER_ALEF) >= 0) {
        weight += 3.0;
        if (kind === "plain") kind = "madd";
      }
      if (marks.indexOf(FATHATAN) >= 0 || marks.indexOf(DAMMATAN) >= 0 || marks.indexOf(KASRATAN) >= 0) {
        weight += 0.55;
      }
      if ((ch === NOON || ch === MEEM) && marks.indexOf(SHADDA) >= 0) {
        weight += 1.8;
        kind = "ghunnah";
      }
      var prevMarks = out.length ? out[out.length - 1].marks : "";
      if (ch === ALEF && prevMarks.indexOf(FATHA) >= 0) {
        weight += 2.2;
        if (kind === "plain") kind = "madd";
      }
      if (ch === WAW && prevMarks.indexOf(DAMMA) >= 0) {
        weight += 2.2;
        if (kind === "plain") kind = "madd";
      }
      if ((ch === YEH || ch === ALEF_MAQSURA) && prevMarks.indexOf(KASRA) >= 0) {
        weight += 2.2;
        if (kind === "plain") kind = "madd";
      }
      if (marks.indexOf(SUKUN) >= 0 && !skip) {
        weight = QALQALA.test(ch) ? 0.7 : 0.48;
        kind = "sukun";
      }
      out.push({
        i: gi,
        ch: ch + marks,
        base: ch,
        marks: marks,
        weight: skip ? 0 : weight,
        skip: skip,
        kind: skip ? "skip" : kind,
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
      if (isKnownSource(s)) return s;
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

  function readLeadMs() {
    try {
      var n = Number(global.localStorage && localStorage.getItem("hyArrowLeadMs"));
      if (n >= 40 && n <= 200) return n;
    } catch (e) {}
    return ARROW_LEAD_MS;
  }

  function audioLagMs() {
    if (typeof navigator === "undefined") return 20;
    var ua = navigator.userAgent || "";
    if (/iPhone|iPad|iPod/.test(ua)) return 40;
    if (/Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document) return 40;
    return 20;
  }

  function lookAheadMs() {
    return readLeadMs() + audioLagMs();
  }

  function isShortSeg(seg) {
    if (!seg) return false;
    if (seg.kind === "sukun" || seg.kind === "shadda") return true;
    return seg.duration > 0 && seg.duration < 140;
  }

  function atTime(reciterId, surah, ayah, timeSec, spans) {
    var pin = { ayahIndex: spans && spans[0] ? spans[0].ayahIndex : 0, wordIndex: 0, letterIndex: 0, pinned: true };
    if (!hasWordTiming(reciterId)) return pin;
    if (Number(surah) !== 1) return pin;
    var tMs = Math.max(0, Number(timeSec) || 0) * 1000;
    var table = positionAyah(surah, ayah);
    if (table && table.segments && table.segments.length) {
      var segs = table.segments;
      var lead = lookAheadMs();
      var hit = segs[0];
      for (var i = 0; i < segs.length; i++) {
        var start = segs[i].startMs - lead;
        var dur = Math.max(1, segs[i].duration);
        var hold = isShortSeg(segs[i]) ? Math.max(ARROW_MIN_VIS_MS, Math.min(dur, 110)) : dur;
        var end = start + hold;
        if (i + 1 < segs.length) {
          var nextStart = segs[i + 1].startMs - lead;
          if (isShortSeg(segs[i])) {
            end = Math.max(start + ARROW_MIN_VIS_MS, Math.min(end, nextStart));
          } else if (nextStart > start) {
            end = Math.min(end, nextStart);
          }
        }
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
        kind: hit.kind || "",
        leadMs: lead,
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
    var overlay = document.getElementById("hy-qcf-overlay");
    var host = overlay || document.body;
    if (arrowEl && arrowEl.parentNode === host) return arrowEl;
    arrowEl = document.getElementById("hy-track-arrow");
    if (!arrowEl) {
      arrowEl = document.createElement("div");
      arrowEl.id = "hy-track-arrow";
      arrowEl.setAttribute("aria-hidden", "true");
      arrowEl.innerHTML =
        '<span class="hy-arrow-mark" style="display:block;font-size:15px;line-height:14px;color:#8a6a1c;text-shadow:0 0 1px #fff8e7,0 1px 0 rgba(42,34,24,0.35)">\u25B2</span>';
    }
    if (overlay) {
      arrowEl.style.cssText = "position:absolute;z-index:2;pointer-events:none;transform:translate(-50%,0);display:none;";
      overlay.appendChild(arrowEl);
    } else {
      arrowEl.style.cssText =
        "position:fixed;z-index:99999;pointer-events:none;transform:translate(-50%,0);display:none;";
      if (!arrowEl.parentNode) document.body.appendChild(arrowEl);
    }
    return arrowEl;
  }

  function ensureHighlight() {
    var overlay = document.getElementById("hy-qcf-overlay");
    if (!overlay) return null;
    var hl = document.getElementById("hy-qcf-hl");
    if (!hl) {
      hl = document.createElement("div");
      hl.id = "hy-qcf-hl";
      overlay.appendChild(hl);
    } else if (hl.parentNode !== overlay) {
      overlay.appendChild(hl);
    }
    return hl;
  }

  function ensureLineHl() {
    var el = document.getElementById("hy-qcf-linehl");
    if (el) return el;
    var stage = document.getElementById("hy-qcf-stage");
    var glyphs = document.getElementById("hy-qcf-glyphs");
    if (!stage) return null;
    el = document.createElement("div");
    el.id = "hy-qcf-linehl";
    if (glyphs && glyphs.parentNode === stage) stage.insertBefore(el, glyphs);
    else stage.appendChild(el);
    return el;
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

  function findLetterHit(ayahIndex, wordIndex, letterIndex) {
    var li = letterIndex || 0;
    var i;
    for (i = 0; i < 8; i++) {
      var hit = document.querySelector('[data-hy-qcf="' + ayahIndex + "-" + wordIndex + "-" + (li + i) + '"]');
      if (hit) return hit;
    }
    for (i = li; i >= 0; i--) {
      hit = document.querySelector('[data-hy-qcf="' + ayahIndex + "-" + wordIndex + "-" + i + '"]');
      if (hit) return hit;
    }
    return (
      document.querySelector('[data-hy-qcf^="' + ayahIndex + "-" + wordIndex + '-"]') ||
      document.querySelector('[data-hy-qcf-word][data-hy-local="' + ayahIndex + "-" + wordIndex + '"]')
    );
  }

  function placeArrow() {
    if (typeof document === "undefined") return;
    var el = ensureArrow();
    var node = findLetterHit(active.ayahIndex, active.wordIndex, active.letterIndex);
    var r = usableRect(node);
    if (!r) {
      el.style.display = "none";
      var hl0 = document.getElementById("hy-qcf-hl");
      if (hl0) hl0.style.display = "none";
      var lh0 = document.getElementById("hy-qcf-linehl");
      if (lh0) {
        lh0.style.display = "none";
        lh0.classList.remove("hy-on");
      }
      return;
    }
    var overlay = document.getElementById("hy-qcf-overlay");
    el.style.display = "block";
    var left = parseFloat(node.style.left);
    var top = parseFloat(node.style.top);
    var width = parseFloat(node.style.width);
    var height = parseFloat(node.style.height);
    var d = null;
    if (overlay && node.parentNode === overlay && !isNaN(left) && !isNaN(top)) {
      d = { left: left, top: top, width: width || r.width, height: height || r.height };
    } else if (overlay && el.parentNode === overlay && global.hyQcfMushaf && global.hyQcfMushaf.toDesignRect) {
      d = global.hyQcfMushaf.toDesignRect(r);
    }
    if (d) {
      el.style.left = d.left + d.width / 2 + "px";
      el.style.top = d.top + d.height * 0.82 + "px";
      var hl = ensureHighlight();
      if (hl) {
        hl.style.display = "block";
        hl.style.left = d.left + "px";
        hl.style.top = d.top + "px";
        hl.style.width = Math.max(8, d.width) + "px";
        hl.style.height = Math.max(20, d.height) + "px";
      }
      var linehl = ensureLineHl();
      var row = node.getAttribute && node.getAttribute("data-hy-row");
      var box = row ? document.getElementById("hy-qcf-row-" + row) : null;
      if (linehl && box && global.hyQcfMushaf && global.hyQcfMushaf.toDesignRect) {
        var ld = global.hyQcfMushaf.toDesignRect(box.getBoundingClientRect());
        if (ld) {
          linehl.classList.add("hy-on");
          linehl.style.display = "block";
          linehl.style.left = ld.left + "px";
          linehl.style.top = ld.top + "px";
          linehl.style.width = ld.width + "px";
          linehl.style.height = ld.height + "px";
        }
      }
      if (global.hyQcfMushaf && global.hyQcfMushaf.scrollActive) {
        global.hyQcfMushaf.scrollActive(d.top, d.height);
      }
    } else {
      el.style.left = r.left + r.width / 2 + "px";
      el.style.top = r.top + r.height * 0.82 + "px";
    }
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
    var hl = document.getElementById("hy-qcf-hl");
    if (hl) hl.style.display = "none";
    var linehl = document.getElementById("hy-qcf-linehl");
    if (linehl) {
      linehl.style.display = "none";
      linehl.classList.remove("hy-on");
    }
  }

  function onKuran() {
    if (typeof location === "undefined") return false;
    if (typeof document !== "undefined" && document.querySelector('[aria-label="Sonraki sayfa"]')) return true;
    if (typeof location === "undefined") return false;
    return /kuran/i.test(location.pathname + location.hash + location.search);
  }

  var pickerOpen = false;

  function pickerHost() {
    return document.getElementById("hy-src-slot") || document.getElementById("hy-player-dock") || document.body;
  }

  function paintPicker() {
    if (!pickerEl) return;
    var html =
      '<button type="button" class="hy-src-toggle" data-hy-src-toggle="1" aria-expanded="' +
      (pickerOpen ? "true" : "false") +
      '" aria-label="Takip kaynağı">' +
      (sourceMeta(sourceId).short || "Kaynak") +
      (pickerOpen ? " ▴" : " ▾") +
      "</button>";
    if (pickerOpen) {
      html += '<div class="hy-src-menu" role="menu">';
      html += '<div class="hy-src-title">Fatiha demo · takip kaynağı</div>';
      SOURCES.forEach(function (s) {
        var on = s.id === sourceId;
        html +=
          '<button type="button" data-hy-src="' +
          s.id +
          '" class="hy-src-btn' +
          (on ? " on" : "") +
          '" role="menuitem">' +
          '<span class="hy-src-full">' +
          s.label +
          (on ? " ✓" : "") +
          "</span></button>";
      });
      html += "</div>";
    }
    pickerEl.innerHTML = html;
    pickerEl.className = pickerOpen ? "hy-src-open" : "hy-src-collapsed";
    pickerEl.style.display = onKuran() ? "flex" : "none";
  }

  function bindPicker() {
    if (!pickerEl || pickerEl.getAttribute("data-hy-bound")) return;
    pickerEl.setAttribute("data-hy-bound", "1");
    pickerEl.addEventListener("click", function (e) {
      e.stopPropagation();
      var t = e.target;
      if (t && t.closest && t.closest("[data-hy-src-toggle]")) {
        pickerOpen = !pickerOpen;
        paintPicker();
        return;
      }
      var btn = t && t.closest && t.closest("[data-hy-src]");
      var id = btn && btn.getAttribute("data-hy-src");
      if (id) {
        pickerOpen = false;
        setSource(id);
      }
    });
  }

  function ensurePicker() {
    if (typeof document === "undefined") return;
    var host = pickerHost();
    pickerEl = document.getElementById("hy-timing-source");
    if (!pickerEl) {
      pickerEl = document.createElement("div");
      pickerEl.id = "hy-timing-source";
    }
    if (pickerEl.parentNode !== host) host.appendChild(pickerEl);
    bindPicker();
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
    document.addEventListener("click", function (e) {
      if (!pickerOpen || !pickerEl) return;
      if (e.target && pickerEl.contains(e.target)) return;
      pickerOpen = false;
      paintPicker();
    });
    setInterval(function () {
      if (!onKuran()) {
        if (pickerEl && pickerEl.style.display !== "none") pickerEl.style.display = "none";
        return;
      }
      ensurePicker();
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
    ARROW_LEAD_MS: ARROW_LEAD_MS,
    lookAheadMs: lookAheadMs,
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
