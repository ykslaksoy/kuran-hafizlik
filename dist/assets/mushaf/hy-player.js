/**
 * Always-visible mushaf player dock.
 * Does not cover the page; sits in a reserved bottom strip.
 */
(function (global) {
  var RECITERS = [
    { id: "alafasy", label: "Mişari" },
    { id: "abdulbasit", label: "Abdülbasit" },
    { id: "minshawi", label: "Minşevi" },
    { id: "abdulbasit-murattal", label: "Basit Mur." },
    { id: "husary", label: "Husary" },
    { id: "sudais", label: "Sudais" },
    { id: "hoca-tts", label: "Hoca" },
  ];
  var dock = null;
  var playing = false;

  function onKuran() {
    return /kuran/i.test(location.pathname + location.hash + location.search) || !!document.querySelector('[aria-label="Sonraki sayfa"]');
  }

  function click(sel) {
    var el = document.querySelector(sel);
    if (el) {
      el.click();
      return true;
    }
    return false;
  }

  function clickLabel(label) {
    return click('[aria-label="' + label + '"]');
  }

  function nativePlay() {
    var bar = document.getElementById("hy-player-bar");
    if (bar) {
      var btns = bar.querySelectorAll('[role="button"], div[tabindex], span');
      /* prefer the React play control if tagged */
    }
    return clickLabel("Oynat veya duraklat") || clickLabel("Dinle");
  }

  function ensureDock() {
    if (dock && dock.parentNode) return dock;
    dock = document.getElementById("hy-player-dock");
    if (!dock) {
      dock = document.createElement("div");
      dock.id = "hy-player-dock";
      dock.setAttribute("role", "toolbar");
      dock.setAttribute("aria-label", "Mushaf oynatıcı");
      document.body.appendChild(dock);
    }
    dock.innerHTML =
      '<div class="hy-player-row">' +
      '<button type="button" data-act="prev-page" title="Önceki sayfa" aria-label="Önceki sayfa">⟨⟨</button>' +
      '<button type="button" data-act="prev-ayah" title="Önceki ayet" aria-label="Önceki ayet">⟨</button>' +
      '<button type="button" data-act="play" class="hy-play" title="Oynat / duraklat" aria-label="Oynat veya duraklat">▶</button>' +
      '<button type="button" data-act="next-ayah" title="Sonraki ayet" aria-label="Sonraki ayet">⟩</button>' +
      '<button type="button" data-act="next-page" title="Sonraki sayfa" aria-label="Sonraki sayfa">⟩⟩</button>' +
      '<button type="button" data-act="reciter" title="Kâri" aria-label="Kâri seç">Mişari</button>' +
      '<button type="button" data-act="loop" title="Tekrar" aria-label="Tekrar">↺</button>' +
      '<button type="button" data-act="speed" title="Hız" aria-label="Hız">1.0x</button>' +
      '<span class="hy-player-label" id="hy-player-now">Fatiha</span>' +
      '<button type="button" data-act="style" id="hy-style-btn" title="Sayfa stili" aria-label="Sayfa stili">Sade</button>' +
      '<span class="hy-src-slot" id="hy-src-slot"></span>' +
      "</div>";
    dock.addEventListener("click", onClick);
    return dock;
  }

  function reciterBtn() {
    return dock && dock.querySelector('[data-act="reciter"]');
  }

  function currentReciterIndex() {
    var id = "alafasy";
    try {
      id = localStorage.getItem("hyReciterId") || id;
    } catch (e) {}
    for (var i = 0; i < RECITERS.length; i++) if (RECITERS[i].id === id) return i;
    return 0;
  }

  function setReciter(i) {
    var r = RECITERS[i % RECITERS.length];
    try {
      localStorage.setItem("hyReciterId", r.id);
    } catch (e) {}
    if (reciterBtn()) reciterBtn().textContent = r.label;
    var rows = document.querySelectorAll("div,span");
    for (var k = 0; k < rows.length; k++) {
      if ((rows[k].textContent || "").trim() === r.label || (rows[k].textContent || "").indexOf(r.label) === 0) {
        var clickable = rows[k].closest("[tabindex], [role='button']") || rows[k].parentElement;
        if (clickable && clickable.click && r.label !== "Mişari") {
          /* settings list may not be open; cycling is stored for next play */
        }
      }
    }
  }

  function onClick(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.getAttribute("data-act");
    if (act === "prev-page") clickLabel("Önceki sayfa");
    else if (act === "next-page") clickLabel("Sonraki sayfa");
    else if (act === "play") {
      var cont = global.hyContinuous;
      if (cont) {
        cont.toggle().then(function (state) {
          playing = state === "playing";
          btn.textContent = playing ? "❚❚" : "▶";
          btn.classList.toggle("on", playing);
        });
        return;
      }
      if (!nativePlay()) {
        playing = !playing;
        btn.textContent = playing ? "❚❚" : "▶";
        btn.classList.toggle("on", playing);
        dispatchPlay(playing);
      } else {
        playing = !playing;
        btn.textContent = playing ? "❚❚" : "▶";
        btn.classList.toggle("on", playing);
      }
    } else if (act === "prev-ayah") {
      if (global.hyContinuous) global.hyContinuous.jump(-1);
      else stepAyah(-1);
    } else if (act === "next-ayah") {
      if (global.hyContinuous) global.hyContinuous.jump(1);
      else stepAyah(1);
    } else if (act === "speed") cycleSpeed(btn);
    else if (act === "loop") {
      btn.classList.toggle("on");
      var on = btn.classList.contains("on");
      try {
        localStorage.setItem("hyLoop", on ? "1" : "0");
      } catch (e2) {}
      if (global.hyContinuous) global.hyContinuous.setLoop(on);
    } else if (act === "reciter") {
      var i = (currentReciterIndex() + 1) % RECITERS.length;
      setReciter(i);
      if (global.hyContinuous) global.hyContinuous.setReciter(RECITERS[i].id);
    } else if (act === "style") {
      var cur = (global.hyQcfMushaf && global.hyQcfMushaf.getStyle && global.hyQcfMushaf.getStyle()) || "sade";
      var next = cur === "sade" ? "tezhip" : "sade";
      if (global.hyQcfMushaf && global.hyQcfMushaf.setStyle) global.hyQcfMushaf.setStyle(next);
      btn.textContent = next === "sade" ? "Sade" : "Tezhip";
    }
  }

  function cycleSpeed(btn) {
    var speeds = [0.75, 1, 1.25, 1.5];
    var cur = parseFloat(btn.textContent) || 1;
    var i = speeds.indexOf(cur);
    var next = speeds[(i + 1) % speeds.length];
    btn.textContent = next.toFixed(1) + "x";
    try {
      localStorage.setItem("hySpeed", String(next));
    } catch (e) {}
    if (global.hyContinuous) global.hyContinuous.setRate(next);
    var native = document.getElementById("hy-player-bar");
    if (native) {
      var cand = native.querySelectorAll("div,span");
      for (var k = 0; k < cand.length; k++) {
        if (/^\d+(\.\d+)?x$/.test((cand[k].textContent || "").trim())) {
          cand[k].click();
          return;
        }
      }
    }
  }

  function stepAyah(dir) {
    var now = document.getElementById("hy-player-now");
    var page = (global.hyQcfMushaf && global.hyQcfMushaf.pageFromUi && global.hyQcfMushaf.pageFromUi()) || 1;
    var dataP = global.hyQcfMushaf && global.hyQcfMushaf.loadPage && global.hyQcfMushaf.loadPage(page);
    Promise.resolve(dataP).then(function (data) {
      if (!data || !data.verses || !data.verses.length) {
        if (dir > 0) clickLabel("Sonraki sayfa");
        else clickLabel("Önceki sayfa");
        return;
      }
      var cur = (now && now.getAttribute("data-key")) || data.verses[0].key;
      var idx = 0;
      for (var i = 0; i < data.verses.length; i++) if (data.verses[i].key === cur) idx = i;
      var next = idx + dir;
      if (next < 0) {
        clickLabel("Önceki sayfa");
        return;
      }
      if (next >= data.verses.length) {
        clickLabel("Sonraki sayfa");
        return;
      }
      var v = data.verses[next];
      if (now) {
        now.textContent = v.key;
        now.setAttribute("data-key", v.key);
      }
      if (global.hyQuranTiming) {
        var locals = document.querySelectorAll('[data-hy-qcf^=""]');
        var hit = document.querySelector('[data-hy-qcf-word="' + v.surah + ":" + v.ayah + ':1"]');
        if (hit) {
          var letter = hit.querySelector("[data-hy-qcf]");
          var parts = letter && (letter.getAttribute("data-hy-qcf") || "").split("-");
          if (parts && parts.length === 3) {
            global.hyQuranTiming.setActive({
              ayahIndex: +parts[0],
              wordIndex: +parts[1],
              letterIndex: 0,
            });
          }
        }
      }
      if (playing) dispatchPlay(true);
    });
  }

  function dispatchPlay(on) {
    var ev = new CustomEvent("hy-player-play", { detail: { on: on } });
    document.dispatchEvent(ev);
    if (!on) return;
    /* Trigger the in-app recitation if the React play control exists. */
    clickLabel("Oynat veya duraklat");
  }

  function paint() {
    if (!onKuran()) {
      if (dock) dock.style.display = "none";
      return;
    }
    ensureDock();
    dock.style.display = "flex";
    document.body.classList.add("hy-kuran");
    var page = (global.hyQcfMushaf && global.hyQcfMushaf.pageFromUi && global.hyQcfMushaf.pageFromUi()) || 1;
    var now = document.getElementById("hy-player-now");
    if (now && !now.getAttribute("data-key")) now.textContent = "Sayfa " + page;
    var rb = reciterBtn();
    if (rb) rb.textContent = RECITERS[currentReciterIndex()].label;
    var sb = document.getElementById("hy-style-btn");
    if (sb && global.hyQcfMushaf && global.hyQcfMushaf.getStyle) {
      sb.textContent = global.hyQcfMushaf.getStyle() === "tezhip" ? "Tezhip" : "Sade";
    }
    var lb = dock.querySelector('[data-act="loop"]');
    if (lb) {
      var on = false;
      try {
        on = localStorage.getItem("hyLoop") === "1";
      } catch (e3) {}
      lb.classList.toggle("on", on);
      if (global.hyContinuous) global.hyContinuous.setLoop(on);
    }
  }

  function boot() {
    paint();
    setInterval(paint, 700);
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('[aria-label="Oynat veya duraklat"]') || t.closest('[aria-label="Dinle"]')) {
        playing = !playing;
        var b = dock && dock.querySelector('[data-act="play"]');
        if (b) {
          b.textContent = playing ? "❚❚" : "▶";
          b.classList.toggle("on", playing);
        }
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(typeof window !== "undefined" ? window : globalThis);
