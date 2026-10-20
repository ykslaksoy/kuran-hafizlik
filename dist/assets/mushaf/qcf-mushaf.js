/**
 * Locked QCF V2 Medine page.
 * - Design canvas 1000×1610 (ratio 0.621); only transform:scale.
 * - Page font must be ready; glyphs stay hidden until then (no FOUT).
 * - 15 fixed line boxes; no wrap, no fallback font on QCF codes.
 * - Arrow / green highlight live in #hy-qcf-overlay, never in the text.
 * Fonts: KFGQPC via Quran Foundation. Layout: quran.com QDC / QUL.
 */
(function (global) {
  var DESIGN_W = 1000;
  var DESIGN_H = 1610;
  var LINE_N = 15;
  var LINE_H = 98;
  var FONT_BASE = "https://verses.quran.foundation/fonts/quran/hafs/v2/woff2";
  var API =
    "https://api.qurancdn.com/api/qdc/verses/by_page/{page}?words=true&word_fields=code_v2,text_uthmani,line_number,char_type_name";
  var BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

  var cache = {};
  var chapters = null;
  var fontReady = {};
  var host = null;
  var paintedPage = 0;
  var paintedFont = "";
  var fitRaf = 0;

  function onKuran() {
    return /kuran/i.test(location.pathname + location.hash + location.search) || !!document.querySelector('[aria-label="Sonraki sayfa"]');
  }

  function pageFromUi() {
    var q = /[?&]page=(\d+)/.exec(location.search);
    if (q) return Math.max(1, Math.min(604, Number(q[1])));
    var nodes = document.querySelectorAll("div,span");
    for (var i = 0; i < nodes.length; i++) {
      var t = (nodes[i].textContent || "").trim();
      var m = /^Sayfa\s+(\d+)$/.exec(t);
      if (m) return Number(m[1]);
    }
    return 1;
  }

  function fetchJson(url) {
    return fetch(url, { cache: "force-cache" }).then(function (r) {
      return r.ok ? r.json() : null;
    });
  }

  function compactApi(page, data) {
    if (!data || !data.verses) return null;
    var lines = {};
    var verses = [];
    var marks = [];
    data.verses.forEach(function (v) {
      var parts = String(v.verse_key).split(":");
      var surah = Number(parts[0]);
      var ayah = Number(parts[1]);
      var words = (v.words || []).map(function (w) {
        var rec = {
          code: w.code_v2 || "",
          uth: w.text_uthmani || "",
          line: Number(w.line_number) || 1,
          type: w.char_type_name === "end" ? "end" : "word",
          pos: Number(w.position) || 0,
        };
        if (!lines[rec.line]) lines[rec.line] = [];
        lines[rec.line].push({
          surah: surah,
          ayah: ayah,
          pos: rec.pos,
          code: rec.code,
          type: rec.type,
          uth: rec.uth,
        });
        return rec;
      });
      verses.push({
        surah: surah,
        ayah: ayah,
        key: v.verse_key,
        juz: v.juz_number || 1,
        hizb: v.hizb_number || 1,
        rub: v.rub_el_hizb_number || 1,
        sajdah: v.sajdah_number || null,
        words: words,
      });
      if (v.sajdah_number) marks.push({ kind: "sajdah", surah: surah, ayah: ayah, line: words[0] && words[0].line });
    });
    var lineNos = Object.keys(lines)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      });
    return {
      page: page,
      font: FONT_BASE + "/p" + page + ".woff2",
      juz: (verses[0] && verses[0].juz) || 1,
      lines: lineNos.map(function (n) {
        return { n: n, words: lines[n] };
      }),
      verses: verses,
      marks: marks,
      special: page <= 2,
    };
  }

  function loadPage(n) {
    if (cache[n]) return Promise.resolve(cache[n]);
    return fetchJson("/assets/mushaf/qcf-page-" + n + ".json").then(function (j) {
      if (j) {
        cache[n] = j;
        return j;
      }
      return fetchJson(API.replace("{page}", n)).then(function (api) {
        var c = compactApi(n, api);
        cache[n] = c;
        return c;
      });
    });
  }

  function loadChapters() {
    if (chapters) return Promise.resolve(chapters);
    return fetchJson("/assets/mushaf/qcf-chapters.json").then(function (j) {
      chapters = j || [];
      return chapters;
    });
  }

  function fontName(page) {
    return "QCF_P" + page;
  }

  function injectFace(page, url) {
    var id = "hy-qcf-ff-" + page;
    if (document.getElementById(id)) return;
    var st = document.createElement("style");
    st.id = id;
    st.textContent =
      '@font-face{font-family:"' +
      fontName(page) +
      '";src:url("' +
      (url || FONT_BASE + "/p" + page + ".woff2") +
      '") format("woff2");font-display:block;}';
    document.head.appendChild(st);
  }

  function loadFont(page, url) {
    var name = fontName(page);
    if (fontReady[name]) return fontReady[name];
    injectFace(page, url);
    var href = url || FONT_BASE + "/p" + page + ".woff2";
    var tasks = [];
    if (typeof FontFace !== "undefined") {
      var face = new FontFace(name, "url(" + href + ")", { display: "block", style: "normal", weight: "400" });
      tasks.push(
        face.load().then(function (f) {
          document.fonts.add(f);
        })
      );
    }
    fontReady[name] = Promise.all(tasks)
      .then(function () {
        return document.fonts ? document.fonts.load('46px "' + name + '"') : null;
      })
      .then(function () {
        var ok = document.fonts && document.fonts.check('46px "' + name + '"');
        if (!ok) return new Promise(function (res) { setTimeout(res, 80); });
      })
      .then(function () {
        return name;
      })
      .catch(function () {
        return name;
      });
    return fontReady[name];
  }

  function prefetchNear(page) {
    [page - 1, page + 1].forEach(function (p) {
      if (p < 1 || p > 604) return;
      loadPage(p).then(function (d) {
        if (d) loadFont(p, d.font);
      });
    });
  }

  function findFrame() {
    var row =
      document.getElementById("hy-row-0") ||
      document.querySelector('[id="hy-row-0"]') ||
      document.querySelector('[nativeid="hy-row-0"]');
    if (!row) return null;
    return row.parentElement && row.parentElement.parentElement;
  }

  function tagBookFrame(frame) {
    var walk = frame;
    for (var i = 0; i < 6 && walk; i++) {
      walk.classList.add("hy-book-frame");
      walk = walk.parentElement;
    }
  }

  function hideNative(frame) {
    Array.prototype.forEach.call(frame.children, function (ch) {
      if (ch.id === "hy-qcf-host") return;
      if (ch.querySelector && ch.querySelector('[id^="hy-row-"], [nativeid^="hy-row-"]')) return;
      ch.classList.add("hy-native-hide");
    });
  }

  function chapterById(id) {
    if (!chapters) return null;
    for (var i = 0; i < chapters.length; i++) if (chapters[i].id === id) return chapters[i];
    return null;
  }

  function surahsStartingOn(page, data) {
    var out = [];
    (data.verses || []).forEach(function (v) {
      if (v.ayah !== 1) return;
      var ch = chapterById(v.surah);
      if (ch && ch.pages && ch.pages[0] === page) out.push({ surah: v.surah, firstLine: v.words[0] && v.words[0].line, ch: ch });
    });
    return out;
  }

  function headerAtMap(data) {
    var used = {};
    (data.lines || []).forEach(function (l) {
      used[l.n] = 1;
    });
    var headerAt = {};
    if (data.page === 1) {
      headerAt[3] = { ch: chapterById(1), kind: "header" };
      return headerAt;
    }
    if (data.page === 2) {
      headerAt[3] = { ch: chapterById(2), kind: "header" };
      headerAt[5] = { ch: chapterById(2), kind: "bismillah" };
      return headerAt;
    }
    surahsStartingOn(data.page, data).forEach(function (s) {
      var line = s.firstLine || 1;
      var slot = line - 1;
      while (slot >= 1 && used[slot]) slot -= 1;
      if (slot >= 1) headerAt[slot] = { ch: s.ch, kind: "header" };
      if (s.ch && s.ch.bismillah) {
        var b = slot + 1;
        if (b < line && !used[b] && !headerAt[b]) headerAt[b] = { ch: s.ch, kind: "bismillah" };
      }
    });
    return headerAt;
  }

  function lineByN(data, n) {
    for (var i = 0; i < (data.lines || []).length; i++) if (data.lines[i].n === n) return data.lines[i];
    return null;
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

  function ensureHost(frame) {
    if (!host) {
      host = document.createElement("div");
      host.id = "hy-qcf-host";
      host.innerHTML =
        '<div id="hy-qcf-fit"><div id="hy-qcf-stage" class="hy-waiting">' +
        '<div id="hy-qcf-ornament"></div>' +
        '<div id="hy-qcf-special-frame"></div>' +
        '<div id="hy-qcf-meta"></div>' +
        '<div id="hy-qcf-glyphs"></div>' +
        '<div id="hy-qcf-overlay"><div id="hy-qcf-hl"></div></div>' +
        '<div id="hy-qcf-pagenum"></div>' +
        '<div id="hy-qcf-wait">Sayfa hattı yükleniyor</div>' +
        "</div></div>";
      frame.appendChild(host);
    } else if (host.parentElement !== frame) {
      frame.appendChild(host);
    }
    return host;
  }

  function fitStage() {
    var fit = document.getElementById("hy-qcf-fit");
    var stage = document.getElementById("hy-qcf-stage");
    if (!fit || !stage || !host) return;
    var box = host.getBoundingClientRect();
    var availW = Math.max(120, box.width);
    var availH = Math.max(160, box.height);
    var s = Math.min(availW / DESIGN_W, availH / DESIGN_H);
    fit.style.width = DESIGN_W * s + "px";
    fit.style.height = DESIGN_H * s + "px";
    stage.style.transform = "scale(" + s + ")";
  }

  function scheduleFit() {
    if (fitRaf) cancelAnimationFrame(fitRaf);
    fitRaf = requestAnimationFrame(fitStage);
  }

  function paintLocked(data, name) {
    var frame = findFrame();
    if (!frame) return;
    frame.style.position = frame.style.position || "relative";
    tagBookFrame(frame);
    hideNative(frame);
    ensureHost(frame);
    var stage = document.getElementById("hy-qcf-stage");
    var glyphs = document.getElementById("hy-qcf-glyphs");
    var meta = document.getElementById("hy-qcf-meta");
    var pnum = document.getElementById("hy-qcf-pagenum");
    stage.className = (data.page <= 2 ? "hy-special " : "") + "hy-waiting";
    meta.innerHTML = "<span>الجزء " + toIndic(data.juz || 1) + "</span><span>" + esc((data.verses[0] && data.verses[0].key) || "") + "</span>";
    pnum.textContent = toIndic(data.page);

    var used = {};
    (data.lines || []).forEach(function (l) {
      used[l.n] = l;
    });
    var headers = headerAtMap(data);
    var html = "";
    for (var n = 1; n <= LINE_N; n++) {
      var top = (n - 1) * LINE_H;
      var line = used[n];
      var header = headers[n];
      html +=
        '<div class="hy-qcf-linebox" data-hy-qcf-row="' +
        n +
        '" id="hy-qcf-row-' +
        n +
        '" data-empty="' +
        (line || header ? "0" : "1") +
        '" data-kind="' +
        (header ? header.kind : line ? "text" : "empty") +
        '" style="top:' +
        top +
        'px">';
      if (header && header.kind === "header" && header.ch) {
        html += '<span class="hy-qcf-header">سُورَةُ ' + esc(header.ch.name) + "</span>";
      } else if (header && header.kind === "bismillah") {
        html += '<span class="hy-qcf-bismillah">' + BISMILLAH + "</span>";
      } else if (line) {
        (data.marks || []).forEach(function (m) {
          if (m.line === n && m.kind === "sajdah") html += '<span class="hy-qcf-margin">۩</span>';
        });
        line.words.forEach(function (w, wi) {
          var cls = w.type === "end" ? "hy-qcf-end" : "hy-qcf-word";
          var extra =
            w.type === "word"
              ? ' data-hy-qcf-word="' + w.surah + ":" + w.ayah + ":" + w.pos + '" data-uth="' + esc(w.uth) + '"'
              : "";
          html +=
            '<span class="' +
            cls +
            '"' +
            extra +
            ' style="font-family:\'' +
            name +
            "';font-synthesis:none\">" +
            esc(w.code) +
            "</span>" +
            (wi < line.words.length - 1 ? " " : "");
        });
      }
      html += "</div>";
    }
    glyphs.innerHTML = html;
    glyphs.style.fontFamily = "'" + name + "'";
    paintedPage = data.page;
    paintedFont = name;
    document.body.classList.add("hy-kuran", "hy-qcf-on");
    scheduleFit();
    loadFont(data.page, data.font).then(function () {
      if (paintedPage !== data.page) return;
      var tries = 0;
      function reveal() {
        var ok = !document.fonts || document.fonts.check('46px "' + name + '"');
        if (!ok && tries < 20) {
          tries += 1;
          setTimeout(reveal, 100);
          return;
        }
        stage.classList.remove("hy-waiting");
        scheduleFit();
        placeHits(data);
        prefetchNear(data.page);
      }
      reveal();
    });
  }

  function localWordStream() {
    var nodes = document.querySelectorAll('[id^="hy-l-"], [nativeid^="hy-l-"]');
    var seen = {};
    var out = [];
    for (var i = 0; i < nodes.length; i++) {
      var id = nodes[i].id || nodes[i].getAttribute("nativeid") || "";
      var m = /hy-l-(\d+)-(\d+)-/.exec(id);
      if (!m) continue;
      var key = m[1] + "-" + m[2];
      if (seen[key]) continue;
      seen[key] = 1;
      out.push({ ayahIndex: +m[1], wordIndex: +m[2] });
    }
    return out;
  }

  function qcfContentWords(data) {
    var out = [];
    (data.verses || []).forEach(function (v) {
      (v.words || []).forEach(function (w) {
        if (w.type === "end") return;
        out.push({ surah: v.surah, ayah: v.ayah, pos: w.pos, uth: w.uth });
      });
    });
    return out;
  }

  function letterCount(uth) {
    var hy = global.hyQuranTiming;
    if (hy && hy.glyphs) {
      var gs = hy.glyphs(uth).filter(function (g) {
        return g && !g.skip && String(g.ch || "").replace(/\s/g, "");
      });
      return Math.max(1, gs.length);
    }
    return 1;
  }

  function placeHits(data) {
    var overlay = document.getElementById("hy-qcf-overlay");
    if (!overlay) return;
    var hl = document.getElementById("hy-qcf-hl");
    overlay.querySelectorAll("[data-hy-qcf]").forEach(function (n) {
      n.parentNode.removeChild(n);
    });
    var locals = localWordStream();
    var qcfs = qcfContentWords(data);
    var map = {};
    var n = Math.min(locals.length, qcfs.length);
    for (var i = 0; i < n; i++) map[qcfs[i].surah + ":" + qcfs[i].ayah + ":" + qcfs[i].pos] = locals[i];
    var words = document.querySelectorAll("#hy-qcf-glyphs [data-hy-qcf-word]");
    var stage = document.getElementById("hy-qcf-stage").getBoundingClientRect();
    var scale = stage.width / DESIGN_W || 1;
    for (var w = 0; w < words.length; w++) {
      var el = words[w];
      var loc = map[el.getAttribute("data-hy-qcf-word")];
      if (!loc) continue;
      var r = el.getBoundingClientRect();
      var count = letterCount(el.getAttribute("data-uth") || "");
      for (var li = 0; li < count; li++) {
        var hit = document.createElement("span");
        hit.setAttribute("data-hy-qcf", loc.ayahIndex + "-" + loc.wordIndex + "-" + li);
        hit.style.position = "absolute";
        hit.style.pointerEvents = "none";
        hit.style.top = (r.top - stage.top) / scale + "px";
        hit.style.left = (r.left - stage.left) / scale + (li / count) * (r.width / scale) + "px";
        hit.style.width = r.width / scale / count + "px";
        hit.style.height = r.height / scale + "px";
        overlay.appendChild(hit);
      }
    }
    if (hl && !hl.parentNode) overlay.appendChild(hl);
    if (global.hyQuranTiming && global.hyQuranTiming.placeArrow) global.hyQuranTiming.placeArrow();
  }

  function paint() {
    if (!onKuran()) {
      document.body.classList.remove("hy-kuran", "hy-qcf-on");
      paintedPage = 0;
      return;
    }
    var frame = findFrame();
    if (!frame) return;
    var page = pageFromUi();
    if (page === paintedPage && host && host.querySelector("#hy-qcf-stage")) {
      scheduleFit();
      return;
    }
    Promise.all([loadPage(page), loadChapters()]).then(function (pair) {
      var data = pair[0];
      if (!data) return;
      var name = fontName(page);
      paintLocked(data, name);
    });
  }

  function boot() {
    if (!document.getElementById("hy-qcf-style-link")) {
      var link = document.createElement("link");
      link.id = "hy-qcf-style-link";
      link.rel = "stylesheet";
      link.href = "/assets/mushaf/qcf-mushaf.css?v=qcf1";
      document.head.appendChild(link);
    }
    paint();
    window.addEventListener("resize", scheduleFit);
    window.addEventListener("orientationchange", scheduleFit);
    window.addEventListener("popstate", function () {
      paintedPage = 0;
      paint();
    });
    var last = 0;
    setInterval(function () {
      if (!onKuran()) return;
      var p = pageFromUi();
      if (p !== paintedPage) paint();
      else if (Date.now() - last > 800) {
        last = Date.now();
        scheduleFit();
      }
    }, 240);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  global.hyQcfMushaf = {
    paint: paint,
    loadPage: loadPage,
    pageFromUi: pageFromUi,
    DESIGN_W: DESIGN_W,
    DESIGN_H: DESIGN_H,
  };
})(typeof window !== "undefined" ? window : globalThis);
