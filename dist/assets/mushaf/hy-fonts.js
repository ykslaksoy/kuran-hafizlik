/**
 * Selectable mushaf script / typeface options.
 * QCF Medine keeps the locked page glyphs + original Sade/Altın/Tezhip decoration.
 * Unicode faces use the React mushaf lines with well-known Hafs typefaces.
 *
 * Badges (UI):
 *  - En popüler → QCF Medine (printed KFGQPC page font)
 *  - En kolay   → Amiri Kur'an (clearest digital naskh)
 */
(function (global) {
  var STORAGE = "hyMushafScript";
  var DEFAULT_ID = "qcf-medine";

  var SCRIPTS = [
    {
      id: "qcf-medine",
      nameTr: "QCF Medine",
      shortTr: "QCF",
      descriptionTr: "Basılı Medine mushafı (KFGQPC QCF V2) — sayfa hattı",
      mode: "qcf",
      fontFamily: null,
      popularity: 1,
      badge: "popular",
      badgeTr: "En popüler",
    },
    {
      id: "uthmanic-hafs",
      nameTr: "Medine Hafs",
      shortTr: "Hafs",
      descriptionTr: "KFGQPC Uthmanic Hafs — hafızlık standardı unicode",
      mode: "unicode",
      fontFamily: "UthmanicHafs, 'KFGQPC HAFS Uthmanic Script', serif",
      popularity: 2,
      badge: null,
      badgeTr: null,
    },
    {
      id: "uthman-taha",
      nameTr: "Uthman Taha",
      shortTr: "Taha",
      descriptionTr: "Osman Taha naskh — Medine mushaf hattı",
      mode: "unicode",
      fontFamily: "UthmanTaha, 'KFGQPC Uthman Taha Naskh', serif",
      popularity: 3,
      badge: null,
      badgeTr: null,
    },
    {
      id: "uthman-taha-bold",
      nameTr: "Uthman Taha Kalın",
      shortTr: "Taha+",
      descriptionTr: "Kalın Medine hattı — uzun okuma",
      mode: "unicode",
      fontFamily: "UthmanTahaBold, UthmanTaha, serif",
      popularity: 4,
      badge: null,
      badgeTr: null,
    },
    {
      id: "amiri-quran",
      nameTr: "Amiri Kur'an",
      shortTr: "Amiri",
      descriptionTr: "Dijital okumada en net naskh",
      mode: "unicode",
      fontFamily: "AmiriQuran_400Regular, 'Amiri Quran', Amiri, serif",
      popularity: 5,
      badge: "easy",
      badgeTr: "En kolay",
    },
    {
      id: "scheherazade",
      nameTr: "Scheherazade",
      shortTr: "Scheh.",
      descriptionTr: "Açık ve geniş naskh — tablet / yatay",
      mode: "unicode",
      fontFamily: "ScheherazadeNew_400Regular, 'Scheherazade New', serif",
      popularity: 6,
      badge: null,
      badgeTr: null,
    },
    {
      id: "diyanet-hafiz-kitabi",
      nameTr: "Diyanet Hafız Kitabı",
      shortTr: "Diyanet",
      descriptionTr: "Diyanet bilgisayar hattı",
      mode: "unicode",
      fontFamily: "DiyanetAbay, serif",
      popularity: 7,
      badge: null,
      badgeTr: null,
    },
  ];

  var currentId = DEFAULT_ID;
  var menuEl = null;
  var menuOpen = false;
  var facesReady = false;

  function byId(id) {
    for (var i = 0; i < SCRIPTS.length; i++) if (SCRIPTS[i].id === id) return SCRIPTS[i];
    return SCRIPTS[0];
  }

  function readStored() {
    try {
      var q = typeof location !== "undefined" && /[?&]script=([^&]+)/.exec(location.search);
      if (q) {
        var qid = decodeURIComponent(q[1]);
        if (byId(qid).id === qid) return qid;
      }
    } catch (e) {}
    try {
      var s = global.localStorage && localStorage.getItem(STORAGE);
      if (s && byId(s).id === s) return s;
    } catch (e2) {}
    return DEFAULT_ID;
  }

  function store(id) {
    try {
      global.localStorage && localStorage.setItem(STORAGE, id);
    } catch (e) {}
  }

  function ensureFaces() {
    if (facesReady || typeof document === "undefined") return;
    if (document.getElementById("hy-script-faces")) {
      facesReady = true;
      return;
    }
    var st = document.createElement("style");
    st.id = "hy-script-faces";
    st.textContent =
      '@font-face{font-family:"UthmanicHafs";src:url("/assets/assets/fonts/UthmanicHafs.43269f118299246de0cf264e04ae2680.otf") format("opentype");font-display:swap;}' +
      '@font-face{font-family:"UthmanTaha";src:url("/assets/assets/fonts/UthmanTaha.7c0c99d532f135f63633578347912421.otf") format("opentype");font-display:swap;}' +
      '@font-face{font-family:"UthmanTahaBold";src:url("/assets/assets/fonts/UthmanTahaBold.0f0454a0c20831da475eef7c68b05b9b.otf") format("opentype");font-display:swap;}' +
      '@font-face{font-family:"DiyanetAbay";src:url("/assets/assets/fonts/DiyanetAbay.adf2aa4bb6cedcc155a9b94320800742.ttf") format("truetype");font-display:swap;}' +
      '@font-face{font-family:"AmiriQuran_400Regular";src:url("/assets/vendor/@expo-google-fonts/amiri-quran/400Regular/AmiriQuran_400Regular.f294ac0b92a74fed1018c06af36af076.ttf") format("truetype");font-display:swap;}' +
      '@font-face{font-family:"ScheherazadeNew_400Regular";src:url("/assets/vendor/@expo-google-fonts/scheherazade-new/400Regular/ScheherazadeNew_400Regular.ff9314a3c6786c7df527c1c4df54a650.ttf") format("truetype");font-display:swap;}';
    document.head.appendChild(st);
    facesReady = true;
  }

  function revealNative() {
    var nodes = document.querySelectorAll(".hy-native-hide");
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.remove("hy-native-hide");
  }

  function applyDom(script) {
    ensureFaces();
    if (!document.body) return;
    document.body.setAttribute("data-hy-script", script.id);
    document.body.classList.toggle("hy-script-unicode", script.mode === "unicode");
    document.body.classList.toggle("hy-qcf-on", script.mode === "qcf");
    var host = document.getElementById("hy-qcf-host");
    if (host) {
      if (script.mode === "qcf") {
        host.style.display = "";
        host.removeAttribute("data-hy-script-off");
      } else {
        host.style.display = "none";
        host.setAttribute("data-hy-script-off", "1");
      }
    }
    if (script.mode === "unicode") {
      revealNative();
      document.documentElement.style.setProperty("--hy-mushaf-font", script.fontFamily);
    } else {
      document.documentElement.style.removeProperty("--hy-mushaf-font");
    }
    var btn = document.getElementById("hy-font-btn");
    if (btn) {
      btn.textContent = script.shortTr;
      btn.title = script.nameTr + (script.badgeTr ? " · " + script.badgeTr : "");
      btn.setAttribute("aria-label", "Mushaf hattı: " + script.nameTr);
    }
  }

  function setScript(id, opts) {
    var script = byId(id);
    currentId = script.id;
    store(script.id);
    applyDom(script);
    if (global.hyQcfMushaf && global.hyQcfMushaf.onScriptChange) {
      global.hyQcfMushaf.onScriptChange(script);
    } else if (global.hyQcfMushaf && global.hyQcfMushaf.paint && !(opts && opts.skipPaint)) {
      global.hyQcfMushaf.paint();
    }
    if (global.hyQuranTiming && global.hyQuranTiming.placeArrow) {
      try {
        global.hyQuranTiming.placeArrow();
      } catch (e) {}
    }
    paintMenu();
    return script;
  }

  function getScript() {
    return byId(currentId);
  }

  function isQcf() {
    return getScript().mode === "qcf";
  }

  function onKuran() {
    return /kuran/i.test(location.pathname + location.hash + location.search) || !!document.querySelector('[aria-label="Sonraki sayfa"]');
  }

  function paintMenu() {
    if (!menuEl) return;
    var cur = getScript();
    var html =
      '<button type="button" class="hy-font-toggle" data-hy-font-toggle="1" aria-expanded="' +
      (menuOpen ? "true" : "false") +
      '" aria-label="Mushaf hattı">' +
      (cur.shortTr || "Hat") +
      (menuOpen ? " ▴" : " ▾") +
      "</button>";
    if (menuOpen) {
      html += '<div class="hy-font-menu" role="menu">';
      html += '<div class="hy-font-title">Mushaf hattı / yazı tipi</div>';
      SCRIPTS.forEach(function (s) {
        var on = s.id === cur.id;
        html +=
          '<button type="button" data-hy-font="' +
          s.id +
          '" class="hy-font-btn' +
          (on ? " on" : "") +
          (s.badge ? " hy-font-" + s.badge : "") +
          '" role="menuitem">' +
          '<span class="hy-font-name">' +
          s.nameTr +
          (on ? " ✓" : "") +
          "</span>";
        if (s.badgeTr) html += '<span class="hy-font-badge hy-font-badge-' + s.badge + '">' + s.badgeTr + "</span>";
        html += '<span class="hy-font-desc">' + s.descriptionTr + "</span></button>";
      });
      html += "</div>";
    }
    menuEl.innerHTML = html;
    menuEl.className = menuOpen ? "hy-font-open" : "hy-font-collapsed";
    menuEl.style.display = onKuran() ? "flex" : "none";
  }

  function bindMenu() {
    if (!menuEl || menuEl.getAttribute("data-hy-bound")) return;
    menuEl.setAttribute("data-hy-bound", "1");
    menuEl.addEventListener("click", function (e) {
      e.stopPropagation();
      var t = e.target;
      if (t && t.closest && t.closest("[data-hy-font-toggle]")) {
        menuOpen = !menuOpen;
        paintMenu();
        return;
      }
      var btn = t && t.closest && t.closest("[data-hy-font]");
      var id = btn && btn.getAttribute("data-hy-font");
      if (id) {
        menuOpen = false;
        setScript(id);
      }
    });
  }

  function ensureMenu() {
    if (typeof document === "undefined") return null;
    var host = document.getElementById("hy-font-slot") || document.getElementById("hy-player-dock") || document.body;
    menuEl = document.getElementById("hy-font-source");
    if (!menuEl) {
      menuEl = document.createElement("div");
      menuEl.id = "hy-font-source";
    }
    if (menuEl.parentNode !== host) host.appendChild(menuEl);
    bindMenu();
    paintMenu();
    return menuEl;
  }

  function boot() {
    currentId = readStored();
    ensureFaces();
    applyDom(byId(currentId));
    ensureMenu();
  }

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();
    document.addEventListener("click", function (e) {
      if (!menuOpen || !menuEl) return;
      if (e.target && menuEl.contains(e.target)) return;
      menuOpen = false;
      paintMenu();
    });
    setInterval(function () {
      if (!onKuran()) {
        if (menuEl && menuEl.style.display !== "none") menuEl.style.display = "none";
        return;
      }
      ensureMenu();
      applyDom(byId(currentId));
    }, 900);
  }

  global.hyMushafFonts = {
    SCRIPTS: SCRIPTS,
    setScript: setScript,
    getScript: getScript,
    isQcf: isQcf,
    ensureMenu: ensureMenu,
    paintMenu: paintMenu,
  };
})(typeof window !== "undefined" ? window : globalThis);
