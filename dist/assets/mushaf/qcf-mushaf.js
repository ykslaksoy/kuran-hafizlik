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
  var FONT_LOCAL = "/assets/mushaf/fonts/qcf";
  var API =
    "https://api.qurancdn.com/api/qdc/verses/by_page/{page}?words=true&word_fields=code_v2,text_uthmani,line_number,char_type_name";
  var BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";

  var cache = {};
  var chapters = null;
  var fontReady = {};
  var host = null;
  var paintedPage = 0;
  var paintedData = null;
  var paintedFont = "";
  var chromeVerse = null;
  var fitRaf = 0;
  var lastReactPage = 0;
  var bootPinned = false;
  var SURAH_TR = [
    "",
    "Fâtiha",
    "Bakara",
    "Âl-i İmrân",
    "Nisâ",
    "Mâide",
    "En‘âm",
    "A‘râf",
    "Enfâl",
    "Tevbe",
    "Yûnus",
    "Hûd",
    "Yûsuf",
    "Ra‘d",
    "İbrâhîm",
    "Hicr",
    "Nahl",
    "İsrâ",
    "Kehf",
    "Meryem",
    "Tâhâ",
    "Enbiyâ",
    "Hac",
    "Mü’minûn",
    "Nûr",
    "Furkân",
    "Şuarâ",
    "Neml",
    "Kasas",
    "Ankebût",
    "Rûm",
    "Lokmân",
    "Secde",
    "Ahzâb",
    "Sebe’",
    "Fâtır",
    "Yâsîn",
    "Sâffât",
    "Sâd",
    "Zümer",
    "Mü’min",
    "Fussilet",
    "Şûrâ",
    "Zuhruf",
    "Duhân",
    "Câsiye",
    "Ahkâf",
    "Muhammed",
    "Fetih",
    "Hucurât",
    "Kâf",
    "Zâriyât",
    "Tûr",
    "Necm",
    "Kamer",
    "Rahmân",
    "Vâkıa",
    "Hadîd",
    "Mücâdele",
    "Haşr",
    "Mümtehine",
    "Saff",
    "Cuma",
    "Münâfikûn",
    "Teğâbün",
    "Talâk",
    "Tahrîm",
    "Mülk",
    "Kalem",
    "Hâkka",
    "Meâric",
    "Nûh",
    "Cin",
    "Müzzemmil",
    "Müddessir",
    "Kıyâme",
    "İnsân",
    "Mürselât",
    "Nebe",
    "Nâziât",
    "Abese",
    "Tekvîr",
    "İnfitâr",
    "Mutaffifîn",
    "İnşikâk",
    "Bürûc",
    "Târık",
    "A‘lâ",
    "Gâşiye",
    "Fecr",
    "Beled",
    "Şems",
    "Leyl",
    "Duhâ",
    "İnşirah",
    "Tîn",
    "Alak",
    "Kadr",
    "Beyyine",
    "Zilzâl",
    "Âdiyât",
    "Kâria",
    "Tekâsür",
    "Asr",
    "Hümeze",
    "Fîl",
    "Kureyş",
    "Mâûn",
    "Kevser",
    "Kâfirûn",
    "Nasr",
    "Tebbet",
    "İhlâs",
    "Felak",
    "Nâs",
  ];

  function onKuran() {
    return /kuran/i.test(location.pathname + location.hash + location.search) || !!document.querySelector('[aria-label="Sonraki sayfa"]');
  }

  function clampPage(n) {
    n = Number(n);
    if (!n || n < 1) return 1;
    if (n > 604) return 604;
    return n;
  }

  function reactPageLabel() {
    var nodes = document.querySelectorAll("div,span");
    for (var i = 0; i < nodes.length; i++) {
      var t = (nodes[i].textContent || "").replace(/\s+/g, " ").trim();
      if (!t || t.length > 48) continue;
      var m = /^Sayfa\s+(\d+)\b/.exec(t);
      if (m) return clampPage(m[1]);
    }
    return 0;
  }

  function pageFromUi() {
    var q = /[?&]page=(\d+)/.exec(location.search);
    if (q) return clampPage(q[1]);
    var react = reactPageLabel();
    if (!bootPinned) {
      bootPinned = true;
      lastReactPage = react || 1;
      return paintedPage || 1;
    }
    if (react && lastReactPage && react !== lastReactPage) {
      lastReactPage = react;
      return react;
    }
    if (react && !lastReactPage) lastReactPage = react;
    return paintedPage || react || 1;
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
      font: FONT_LOCAL + "/p" + page + ".woff2",
      fontRemote: FONT_BASE + "/p" + page + ".woff2",
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

  function fontLocal(page) {
    return FONT_LOCAL + "/p" + page + ".woff2";
  }

  function fontRemote(page, url) {
    return url && url.indexOf("http") === 0 ? url : FONT_BASE + "/p" + page + ".woff2";
  }

  function injectFace(page, local, remote) {
    var id = "hy-qcf-ff-" + page;
    if (document.getElementById(id)) return;
    var st = document.createElement("style");
    st.id = id;
    st.textContent =
      '@font-face{font-family:"' +
      fontName(page) +
      '";src:url("' +
      local +
      '") format("woff2"),url("' +
      remote +
      '") format("woff2");font-display:block;font-style:normal;font-weight:400;}';
    document.head.appendChild(st);
  }

  function pageSample(data) {
    var out = "";
    var lines = (data && data.lines) || [];
    for (var i = 0; i < lines.length; i++) {
      var words = lines[i].words || [];
      for (var j = 0; j < words.length; j++) {
        if (words[j].code) out += words[j].code;
        if (out.length >= 8) return out;
      }
    }
    return out || "\uFC41";
  }

  function measureApplied(name, sample) {
    var el = document.createElement("span");
    el.textContent = sample || "\uFC41";
    el.style.cssText =
      "position:absolute;left:-99999px;top:0;font-size:200px;font-synthesis:none;visibility:hidden;white-space:nowrap;";
    document.body.appendChild(el);
    el.style.fontFamily = "serif";
    var serif = el.getBoundingClientRect().width;
    el.style.fontFamily = '"' + name + '"';
    var qcf = el.getBoundingClientRect().width;
    document.body.removeChild(el);
    return { serif: serif, qcf: qcf, ok: qcf > 0 && Math.abs(qcf - serif) > 6 };
  }

  function waitApplied(name, sample) {
    return new Promise(function (resolve) {
      var tries = 0;
      function tick() {
        var check = !document.fonts || document.fonts.check('46px "' + name + '"');
        var m = measureApplied(name, sample);
        if (check && m.ok) {
          resolve(true);
          return;
        }
        if (tries++ >= 40) {
          resolve(false);
          return;
        }
        setTimeout(tick, 80);
      }
      tick();
    });
  }

  function loadFaceUrl(name, href) {
    if (typeof FontFace === "undefined") return Promise.resolve();
    var face = new FontFace(name, "url(" + href + ")", { display: "block", style: "normal", weight: "400" });
    return face.load().then(function (f) {
      document.fonts.add(f);
    });
  }

  function loadFont(page, url, sample) {
    var name = fontName(page);
    if (fontReady[name]) return fontReady[name];
    var local = fontLocal(page);
    var remote = fontRemote(page, url);
    injectFace(page, local, remote);
    fontReady[name] = loadFaceUrl(name, local)
      .catch(function () {
        return loadFaceUrl(name, remote);
      })
      .then(function () {
        return document.fonts ? document.fonts.load('46px "' + name + '"') : null;
      })
      .then(function () {
        return waitApplied(name, sample);
      })
      .then(function (ok) {
        var checked = document.fonts && document.fonts.check('46px "' + name + '"');
        if (!ok && !checked) throw new Error("qcf-font-not-applied");
        return name;
      });
    return fontReady[name];
  }

  function prefetchNear(page) {
    [page - 1, page + 1].forEach(function (p) {
      if (p < 1 || p > 604) return;
      loadPage(p).then(function (d) {
        if (d) loadFont(p, d.fontRemote || d.font, pageSample(d));
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
      var empties = [];
      for (var i = line - 1; i >= 1; i--) {
        if (used[i] || headerAt[i]) break;
        empties.unshift(i);
      }
      var need = s.ch && s.ch.bismillah ? 2 : 1;
      var take = empties.slice(-need);
      if (take.length >= 1) headerAt[take[0]] = { ch: s.ch, kind: "header" };
      if (take.length >= 2) headerAt[take[1]] = { ch: s.ch, kind: "bismillah" };
    });
    return headerAt;
  }

  function lineByN(data, n) {
    for (var i = 0; i < (data.lines || []).length; i++) if (data.lines[i].n === n) return data.lines[i];
    return null;
  }

  function packSpecialTops(data, headers) {
    if (!data || data.page > 2) return null;
    var items = [];
    for (var n = 1; n <= LINE_N; n++) {
      if (headers[n] || lineByN(data, n)) items.push(n);
    }
    if (!items.length) return null;
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

  function surahNameTr(id) {
    return SURAH_TR[id] || "Sure " + id;
  }

  function syncChrome(data, verse) {
    data = data || paintedData;
    if (!data) return;
    var v = verse || chromeVerse || data.verses[0];
    if (!v) return;
    chromeVerse = { surah: v.surah, ayah: v.ayah };
    var title = surahNameTr(v.surah) + " Suresi " + v.ayah + ". Ayet";
    var sub = "Sayfa " + data.page + " Cüz " + (data.juz || 1);
    var nodes = document.querySelectorAll("div,span");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.closest && (el.closest("#hy-qcf-host") || el.closest("#hy-player-dock") || el.closest("#hy-timing-source"))) {
        continue;
      }
      if (el.children && el.children.length) continue;
      var t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (!t || t.length > 48) continue;
      if (/Suresi/.test(t) && t !== title) el.textContent = title;
      else if (/^Sayfa\s+\d+/.test(t) && t !== sub) el.textContent = sub;
    }
  }

  function alignReactTo(page) {
    var steps = 0;
    function step() {
      var cur = reactPageLabel();
      if (!cur || cur === page || steps++ > 24) {
        lastReactPage = page;
        syncChrome(paintedData, chromeVerse);
        return;
      }
      var sel = cur > page ? '[aria-label="Önceki sayfa"]' : '[aria-label="Sonraki sayfa"]';
      var btn = document.querySelector(sel);
      if (btn) btn.click();
      setTimeout(step, 140);
    }
    setTimeout(step, 200);
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
        '<div id="hy-qcf-ornament" aria-hidden="true"></div>' +
        '<div id="hy-qcf-special-frame" aria-hidden="true"></div>' +
        '<div id="hy-qcf-meta"></div>' +
        '<div id="hy-qcf-glyphs"></div>' +
        '<div id="hy-qcf-overlay"><div id="hy-qcf-hl"></div></div>' +
        '<div id="hy-qcf-pagenum"></div>' +
        '<div id="hy-qcf-wait">Sayfa hattı yükleniyor</div>' +
        "</div></div>";
      document.body.appendChild(host);
      injectTezhip();
    } else if (host.parentElement !== document.body) {
      document.body.appendChild(host);
    }
    return host;
  }

  function injectTezhip() {
    var orn = document.getElementById("hy-qcf-ornament");
    if (!orn || orn.getAttribute("data-hy-tezhip") === "1") return;
    orn.setAttribute("data-hy-tezhip", "1");
    fetch("/assets/mushaf/tezhip.svg?v=qcf7")
      .then(function (r) {
        return r.ok ? r.text() : "";
      })
      .then(function (svg) {
        if (!svg || !orn) return;
        orn.innerHTML = svg;
        orn.classList.add("hy-tezhip-on");
      })
      .catch(function () {});
  }

  function fitStage() {
    var fit = document.getElementById("hy-qcf-fit");
    var stage = document.getElementById("hy-qcf-stage");
    if (!fit || !stage || !host) return;
    var dock = document.getElementById("hy-player-dock");
    var dockH = dock ? dock.getBoundingClientRect().height : 56;
    var topChrome = window.innerWidth >= 860 ? 52 : 58;
    var availW = Math.max(120, window.innerWidth);
    var availH = Math.max(160, window.innerHeight - dockH - topChrome);
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

    paintedData = data;
    chromeVerse = data.verses && data.verses[0] ? { surah: data.verses[0].surah, ayah: data.verses[0].ayah } : null;
    var used = {};
    (data.lines || []).forEach(function (l) {
      used[l.n] = l;
    });
    var headers = headerAtMap(data);
    var tops = packSpecialTops(data, headers);
    var html = "";
    for (var n = 1; n <= LINE_N; n++) {
      var line = used[n];
      var header = headers[n];
      if (tops && !line && !header) continue;
      var top = tops ? tops[n] : (n - 1) * LINE_H;
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
            "',local('Hafizyol-QCF-Missing');font-synthesis:none\">" +
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
    loadFont(data.page, data.fontRemote || data.font, pageSample(data))
      .then(function () {
        if (paintedPage !== data.page) return;
        var applied = measureApplied(name, pageSample(data));
        if (!applied.ok && !(document.fonts && document.fonts.check('46px "' + name + '"'))) return;
        stage.classList.remove("hy-waiting");
        scheduleFit();
        placeHits(data);
        syncChrome(data, chromeVerse);
        if (data.page === 1) alignReactTo(1);
        prefetchNear(data.page);
      })
      .catch(function () {
        /* Keep hy-waiting — never paint fallback glyphs. */
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

  function voicedGlyphs(uth) {
    var hy = global.hyQuranTiming;
    var gs = hy && hy.glyphs ? hy.glyphs(uth) : [{ i: 0, skip: false, ch: uth || " " }];
    var out = [];
    for (var i = 0; i < gs.length; i++) {
      if (gs[i] && !gs[i].skip && String(gs[i].ch || "").replace(/\s/g, "")) out.push(gs[i]);
    }
    if (!out.length) out.push({ i: 0, skip: false, ch: " " });
    return out;
  }

  function placeHits(data) {
    var overlay = document.getElementById("hy-qcf-overlay");
    var stageEl = document.getElementById("hy-qcf-stage");
    if (!overlay || !stageEl) return;
    var hl = document.getElementById("hy-qcf-hl");
    overlay.querySelectorAll("[data-hy-qcf]").forEach(function (n) {
      n.parentNode.removeChild(n);
    });
    var verseIndex = {};
    (data.verses || []).forEach(function (v, i) {
      verseIndex[v.surah + ":" + v.ayah] = i;
    });
    var words = document.querySelectorAll("#hy-qcf-glyphs [data-hy-qcf-word]");
    var stage = stageEl.getBoundingClientRect();
    var scale = stage.width / DESIGN_W || 1;
    for (var w = 0; w < words.length; w++) {
      var el = words[w];
      var key = el.getAttribute("data-hy-qcf-word") || "";
      var parts = key.split(":");
      var surah = +parts[0];
      var ayah = +parts[1];
      var pos = +parts[2];
      var ayahIndex = verseIndex[surah + ":" + ayah];
      if (ayahIndex == null) ayahIndex = Math.max(0, ayah - 1);
      var wordIndex = Math.max(0, pos - 1);
      var verse = data.verses && data.verses[ayahIndex];
      if (verse) {
        var wi = 0;
        for (var k = 0; k < verse.words.length; k++) {
          if (verse.words[k].type === "end") continue;
          if (verse.words[k].pos === pos) {
            wordIndex = wi;
            break;
          }
          wi += 1;
        }
      }
      el.setAttribute("data-hy-local", ayahIndex + "-" + wordIndex);
      var voiced = voicedGlyphs(el.getAttribute("data-uth") || "");
      var count = voiced.length;
      var r = el.getBoundingClientRect();
      var top = (r.top - stage.top) / scale;
      var left0 = (r.left - stage.left) / scale;
      var width = r.width / scale;
      var height = r.height / scale;
      var slot = width / count;
      for (var vi = 0; vi < count; vi++) {
        var li = voiced[vi].i;
        var hit = document.createElement("span");
        hit.setAttribute("data-hy-qcf", ayahIndex + "-" + wordIndex + "-" + li);
        hit.setAttribute("data-hy-ayah", String(ayahIndex));
        hit.setAttribute("data-hy-word", String(wordIndex));
        hit.setAttribute("data-hy-letter", String(li));
        hit.style.position = "absolute";
        hit.style.pointerEvents = "none";
        hit.style.top = top + "px";
        hit.style.left = left0 + width - (vi + 1) * slot + "px";
        hit.style.width = slot + "px";
        hit.style.height = height + "px";
        overlay.appendChild(hit);
      }
    }
    if (hl && !hl.parentNode) overlay.appendChild(hl);
    if (global.hyQuranTiming && global.hyQuranTiming.placeArrow) global.hyQuranTiming.placeArrow();
  }

  function paint() {
    if (!onKuran()) {
      document.body.classList.remove("hy-kuran", "hy-qcf-on");
      if (host) host.style.display = "none";
      paintedPage = 0;
      paintedData = null;
      return;
    }
    if (host) host.style.display = "";
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
      link.href = "/assets/mushaf/qcf-mushaf.css?v=qcf7";
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
      else {
        syncChrome(paintedData, chromeVerse);
        if (Date.now() - last > 800) {
          last = Date.now();
          scheduleFit();
        }
      }
    }, 240);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  function toDesignRect(r) {
    var stage = document.getElementById("hy-qcf-stage");
    if (!stage || !r) return null;
    var sr = stage.getBoundingClientRect();
    var scale = sr.width / DESIGN_W || 1;
    return {
      left: (r.left - sr.left) / scale,
      top: (r.top - sr.top) / scale,
      width: r.width / scale,
      height: r.height / scale,
      scale: scale,
    };
  }

  global.hyQcfMushaf = {
    paint: paint,
    loadPage: loadPage,
    pageFromUi: pageFromUi,
    toDesignRect: toDesignRect,
    syncChrome: syncChrome,
    setChromeVerse: function (verse) {
      chromeVerse = verse;
      syncChrome(paintedData, verse);
    },
    paintedPage: function () {
      return paintedPage;
    },
    DESIGN_W: DESIGN_W,
    DESIGN_H: DESIGN_H,
  };
})(typeof window !== "undefined" ? window : globalThis);
