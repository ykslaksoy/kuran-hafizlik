(function () {
  var q = new URLSearchParams(location.search);
  var ms = q.get("ms") || "mehmed-sevki-gart";
  var mode = (q.get("mode") || "composite").toLowerCase();
  var font = q.get("font") || "qcf-v2";
  var page = parseInt(q.get("page") || "1", 10);
  if (page < 1 || page > 604) page = 1;

  var DESIGN_W = 1000;
  var DESIGN_H = 1610;
  var TEXT = { left: 56, top: 72, w: 888, h: 1470 };

  document.body.classList.add("hy-ms-preview", "hy-frame-preview", "hy-kuran");
  document.body.setAttribute("data-hy-sevki-mode", mode);
  document.body.setAttribute("data-hy-sevki-font", font);
  if (mode === "original") document.body.classList.add("hy-ms-original");

  var meta = null;
  var imgUrl = "";
  var matteReady = false;

  function bgStyle() {
    var sizeW = (meta && meta.bgSizeDesign && meta.bgSizeDesign.w) || DESIGN_W;
    var sizeH = (meta && meta.bgSizeDesign && meta.bgSizeDesign.h) || DESIGN_H;
    return {
      backgroundImage: 'url("' + imgUrl + '")',
      backgroundSize: sizeW + "px " + sizeH + "px",
      backgroundRepeat: "no-repeat",
      backgroundPosition: (meta && meta.bgPosition) || "50% 40%",
    };
  }

  function applyBg(el) {
    if (!el) return;
    var s = bgStyle();
    el.style.backgroundImage = s.backgroundImage;
    el.style.backgroundSize = s.backgroundSize;
    el.style.backgroundRepeat = s.backgroundRepeat;
    el.style.backgroundPosition = s.backgroundPosition;
  }

  function findFrame() {
    var row = document.getElementById("hy-row-0") || document.querySelector('[id="hy-row-0"]');
    if (!row) return null;
    return row.parentElement && row.parentElement.parentElement;
  }

  function buildPaperFill(dataUrl, cb) {
    if (!meta || !meta.sample) return cb(null);
    var img = new Image();
    img.onload = function () {
      var sx = Math.floor(meta.sample.x * img.width);
      var sy = Math.floor(meta.sample.y * img.height);
      var sw = Math.max(24, Math.floor(meta.sample.w * img.width));
      var sh = Math.max(24, Math.floor(meta.sample.h * img.height));
      var fill = document.createElement("canvas");
      fill.width = TEXT.w;
      fill.height = TEXT.h;
      var ctx = fill.getContext("2d");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TEXT.w, TEXT.h);
      cb(fill.toDataURL("image/jpeg", 0.93));
    };
    img.onerror = function () {
      cb(null);
    };
    img.src = dataUrl;
  }

  function buildGrain(dataUrl, cb) {
    if (!meta || !meta.sample) return cb(null);
    var img = new Image();
    img.onload = function () {
      var sx = Math.floor(meta.sample.x * img.width);
      var sy = Math.floor(meta.sample.y * img.height);
      var sw = Math.max(8, Math.floor(meta.sample.w * img.width));
      var sh = Math.max(8, Math.floor(meta.sample.h * img.height));
      var c = document.createElement("canvas");
      c.width = 256;
      c.height = 256;
      c.getContext("2d").drawImage(img, sx, sy, sw, sh, 0, 0, 256, 256);
      cb(c.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = function () {
      cb(null);
    };
    img.src = dataUrl;
  }

  function matteHtml() {
    return (
      '<div id="hy-ms-matte" style="left:' +
      TEXT.left +
      "px;top:" +
      TEXT.top +
      "px;width:" +
      TEXT.w +
      "px;height:" +
      TEXT.h +
      'px">' +
      '<div id="hy-ms-matte-veil"></div>' +
      '<div id="hy-ms-matte-paper"></div>' +
      '<div id="hy-ms-matte-grain"></div>' +
      "</div>"
    );
  }

  function applyMatte(paperUrl, grainUrl) {
    var veil = document.getElementById("hy-ms-matte-veil");
    var paper = document.getElementById("hy-ms-matte-paper");
    var grain = document.getElementById("hy-ms-matte-grain");
    if (veil) applyBg(veil);
    if (paper && paperUrl) paper.style.backgroundImage = "url(" + paperUrl + ")";
    if (grain && grainUrl) grain.style.backgroundImage = "url(" + grainUrl + ")";
  }

  function ensureMsLayer(stage) {
    if (!stage || stage.querySelector("#hy-ms-layer")) return;
    var layer = document.createElement("div");
    layer.id = "hy-ms-layer";
    if (mode === "original") {
      layer.innerHTML = '<div id="hy-ms-bg"></div>';
    } else {
      layer.innerHTML = '<div id="hy-ms-bg"></div>' + matteHtml();
    }
    stage.insertBefore(layer, stage.firstChild);
    applyBg(document.getElementById("hy-ms-bg"));
    var orn = document.getElementById("hy-qcf-ornament");
    if (orn) orn.style.display = "none";
  }

  function markReady() {
    matteReady = true;
    document.body.setAttribute("data-hy-ms-ready", "1");
  }

  function finishMatte() {
    if (mode === "original") {
      markReady();
      return;
    }
    buildPaperFill(imgUrl, function (paper) {
      buildGrain(imgUrl, function (grain) {
        applyMatte(paper, grain);
        markReady();
      });
    });
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
    var stage = document.getElementById("hy-qcf-stage");
    stage.classList.remove("hy-waiting");
    applyBg(document.getElementById("hy-ms-bg"));
    fitOriginal();
    if (!matteReady) markReady();
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
    if (!matteReady) finishMatte();
    return matteReady;
  }

  function bootCompositeAltFont() {
    if (!window.hyFontPreview || !window.hyFontPreview.renderIntoQcfStage) return false;
    window.hyFontPreview
      .loadPageData(page)
      .then(function () {
        return window.hyFontPreview.renderIntoQcfStage(font);
      })
      .then(function () {
        ensureCompositeLayer();
      })
      .catch(function () {
        document.body.setAttribute("data-hy-ms-ready", "error");
      });
    return true;
  }

  function loadScripts() {
    if (mode === "original") return;
    if (font === "qcf-v2") return;
    var s = document.createElement("script");
    s.src = "/preview/mushaf-fonts/font-preview.js?v=2";
    s.onload = function () {
      bootCompositeAltFont();
    };
    document.head.appendChild(s);
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
      if (font !== "qcf-v2") loadScripts();
    });

  var tries = 0;
  var t = setInterval(function () {
    if (mode === "original") {
      ensureOriginalStage();
    } else if (font === "qcf-v2") {
      ensureCompositeLayer();
    } else if (document.getElementById("hy-qcf-stage") && !document.getElementById("hy-qcf-stage").classList.contains("hy-waiting")) {
      ensureCompositeLayer();
    }
    if (document.body.getAttribute("data-hy-ms-ready") === "1" || tries++ > 250) clearInterval(t);
  }, 120);
})();
