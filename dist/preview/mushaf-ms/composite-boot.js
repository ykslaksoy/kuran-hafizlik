(function () {
  var q = new URLSearchParams(location.search);
  var ms = q.get("ms") || "mehmed-sevki-gart";
  var mode = (q.get("mode") || "composite").toLowerCase();
  var font = q.get("font") || "qcf-v2";
  var page = parseInt(q.get("page") || "1", 10);
  if (page < 1 || page > 604) page = 1;

  var DESIGN_W = 1000;
  var DESIGN_H = 1610;

  document.body.classList.add("hy-ms-preview", "hy-frame-preview", "hy-kuran");
  document.body.setAttribute("data-hy-sevki-mode", mode);
  document.body.setAttribute("data-hy-sevki-font", font);
  if (mode === "original") document.body.classList.add("hy-ms-original");
  else document.body.classList.add("hy-ms-composite");

  var meta = null;
  var imgUrl = "";
  var frameReady = false;
  var glyphsReady = false;

  function bgStyleOriginal() {
    var sizeW = (meta && meta.bgSizeDesign && meta.bgSizeDesign.w) || DESIGN_W;
    var sizeH = (meta && meta.bgSizeDesign && meta.bgSizeDesign.h) || DESIGN_H;
    return {
      backgroundImage: 'url("' + imgUrl + '")',
      backgroundSize: sizeW + "px " + sizeH + "px",
      backgroundRepeat: "no-repeat",
      backgroundPosition: (meta && meta.bgPosition) || "50% 40%",
    };
  }

  function applyBg(el, style) {
    if (!el) return;
    el.style.backgroundImage = style.backgroundImage;
    el.style.backgroundSize = style.backgroundSize;
    el.style.backgroundRepeat = style.backgroundRepeat;
    el.style.backgroundPosition = style.backgroundPosition;
  }

  function findFrame() {
    var row = document.getElementById("hy-row-0") || document.querySelector('[id="hy-row-0"]');
    if (!row) return null;
    return row.parentElement && row.parentElement.parentElement;
  }

  function ensureMsLayer(stage) {
    if (!stage || stage.querySelector("#hy-ms-layer")) return;
    var layer = document.createElement("div");
    layer.id = "hy-ms-layer";
    layer.innerHTML = '<div id="hy-ms-bg"></div>';
    stage.insertBefore(layer, stage.firstChild);
    var orn = document.getElementById("hy-qcf-ornament");
    if (orn) orn.style.display = "none";
  }

  function buildCompositeFrame(stage) {
    if (frameReady || !meta || !window.hySevkiComposite) return;
    var cfg = meta.compositePages && meta.compositePages[String(page)];
    if (!cfg) return;
    var img = new Image();
    img.onload = function () {
      var dataUrl = window.hySevkiComposite.buildFrame(img, cfg);
      var bg = document.getElementById("hy-ms-bg");
      if (bg) {
        bg.style.backgroundImage = "url(" + dataUrl + ")";
        bg.style.backgroundSize = DESIGN_W + "px " + DESIGN_H + "px";
        bg.style.backgroundRepeat = "no-repeat";
        bg.style.backgroundPosition = "0 0";
      }
      frameReady = true;
      tryMarkReady();
    };
    img.onerror = function () {
      document.body.setAttribute("data-hy-ms-ready", "error");
    };
    img.src = imgUrl;
  }

  function glyphsPresent() {
    var g = document.querySelector("#hy-qcf-glyphs");
    if (!g) return false;
    return g.querySelector(".hy-qcf-linebox, .hy-qcf-word, .hy-qcf-header");
  }

  function tryMarkReady() {
    if (mode === "original") {
      document.body.setAttribute("data-hy-ms-ready", "1");
      return;
    }
    if (!frameReady) return;
    if (!glyphsReady && !glyphsPresent()) return;
    glyphsReady = true;
    document.body.setAttribute("data-hy-ms-ready", "1");
  }

  function ensureOriginalStage() {
    var frame = findFrame();
    if (!frame || !meta || !imgUrl) return false;
    frame.style.position = frame.style.position || "relative";
    var walk = frame;
    for (var i = 0; i < 6 && walk; i++) {
      walk.classList.add("hy-book-frame");
      walk = walk.parentElement;
    }
    if (!document.getElementById("hy-qcf-host")) {
      var host = document.createElement("div");
      host.id = "hy-qcf-host";
      host.innerHTML =
        '<div id="hy-qcf-fit"><div id="hy-qcf-stage" class="hy-ms-original-stage">' +
        '<div id="hy-ms-layer"><div id="hy-ms-bg"></div></div>' +
        "</div></div>";
      frame.appendChild(host);
    }
    applyBg(document.getElementById("hy-ms-bg"), bgStyleOriginal());
    fitOriginal();
    tryMarkReady();
    return true;
  }

  function fitOriginal() {
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

  function ensureCompositeLayer() {
    var stage = document.getElementById("hy-qcf-stage");
    if (!stage || stage.classList.contains("hy-waiting") || !meta || !imgUrl) return false;
    ensureMsLayer(stage);
    buildCompositeFrame(stage);
    tryMarkReady();
    return frameReady;
  }

  function bootCompositeAltFont() {
    if (!window.hyFontPreview || !window.hyFontPreview.renderIntoQcfStage) return;
    window.hyFontPreview
      .loadPageData(page)
      .then(function () {
        return window.hyFontPreview.renderIntoQcfStage(font);
      })
      .then(function () {
        ensureCompositeLayer();
        glyphsReady = true;
        tryMarkReady();
      })
      .catch(function () {
        document.body.setAttribute("data-hy-ms-ready", "error");
      });
  }

  fetch("/preview/mushaf-ms/manuscripts.json")
    .then(function (r) {
      return r.json();
    })
    .then(function (list) {
      meta = list.find(function (x) {
        return x.id === ms;
      });
      if (!meta) return;
      imgUrl = "/preview/mushaf-ms/cache/" + meta.id + ".jpg";
      if (mode === "original") {
        window.addEventListener("resize", fitOriginal);
        return;
      }
    });

  var tries = 0;
  var t = setInterval(function () {
    if (mode === "original") {
      ensureOriginalStage();
    } else if (font === "qcf-v2") {
      ensureCompositeLayer();
      if (glyphsPresent()) {
        glyphsReady = true;
        tryMarkReady();
      }
    } else if (window.hyFontPreview && !glyphsReady) {
      if (!document.getElementById("hy-qcf-stage")) bootCompositeAltFont();
      else ensureCompositeLayer();
      if (glyphsPresent()) {
        glyphsReady = true;
        tryMarkReady();
      }
    }
    if (document.body.getAttribute("data-hy-ms-ready") === "1" || tries++ > 300) clearInterval(t);
  }, 120);
})();
