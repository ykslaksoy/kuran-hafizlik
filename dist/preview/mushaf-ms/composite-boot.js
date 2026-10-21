(function () {
  var q = new URLSearchParams(location.search);
  var ms = q.get("ms") || "kadiasker-izzet-gart";
  var DESIGN_W = 1000;
  var DESIGN_H = 1610;
  var TEXT = { left: 56, top: 72, w: 888, h: 1470 };
  var FEATHER = 36;

  document.body.classList.add("hy-ms-preview", "hy-frame-preview", "hy-kuran");

  var meta = null;
  var imgUrl = "";
  var ready = false;

  function bgStyle() {
    return {
      backgroundImage: 'url("' + imgUrl + '")',
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
      backgroundPosition: (meta && meta.bgPosition) || "50% 50%",
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

  function buildTexture(dataUrl, cb) {
    if (!meta || !meta.sample) return cb(null);
    var img = new Image();
    img.onload = function () {
      var c = document.createElement("canvas");
      var ctx = c.getContext("2d");
      var sx = Math.floor(meta.sample.x * img.width);
      var sy = Math.floor(meta.sample.y * img.height);
      var sw = Math.max(8, Math.floor(meta.sample.w * img.width));
      var sh = Math.max(8, Math.floor(meta.sample.h * img.height));
      c.width = 160;
      c.height = 160;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 160, 160);
      cb(c.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = function () {
      cb(null);
    };
    img.src = dataUrl;
  }

  function applyMatte() {
    var matte = document.getElementById("hy-ms-matte");
    if (!matte) return;
    var blur = document.getElementById("hy-ms-matte-blur");
    var grain = document.getElementById("hy-ms-matte-grain");
    applyBg(blur);
    if (grain && grain.dataset.tex) {
      grain.style.backgroundImage = "url(" + grain.dataset.tex + ")";
    }
  }

  function ensureLayer() {
    var stage = document.getElementById("hy-qcf-stage");
    if (!stage || stage.classList.contains("hy-waiting") || !meta || !imgUrl) return false;

    if (!stage.querySelector("#hy-ms-layer")) {
      var layer = document.createElement("div");
      layer.id = "hy-ms-layer";
      layer.innerHTML =
        '<div id="hy-ms-bg"></div>' +
        '<div id="hy-ms-matte" style="left:' +
        TEXT.left +
        "px;top:" +
        TEXT.top +
        "px;width:" +
        TEXT.w +
        "px;height:" +
        TEXT.h +
        'px">' +
        '<div id="hy-ms-matte-blur"></div>' +
        '<div id="hy-ms-matte-grain"></div>' +
        "</div>";
      stage.insertBefore(layer, stage.firstChild);
      var orn = document.getElementById("hy-qcf-ornament");
      if (orn) orn.style.display = "none";
    }

    applyBg(document.getElementById("hy-ms-bg"));

    if (!ready) {
      buildTexture(imgUrl, function (tex) {
        var grain = document.getElementById("hy-ms-matte-grain");
        if (grain && tex) grain.dataset.tex = tex;
        applyMatte();
        ready = true;
        document.body.setAttribute("data-hy-ms-ready", "1");
      });
      return ready;
    }

    applyMatte();
    document.body.setAttribute("data-hy-ms-ready", "1");
    return true;
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
    });

  var tries = 0;
  var t = setInterval(function () {
    ensureLayer();
    if (document.body.getAttribute("data-hy-ms-ready") === "1" || tries++ > 200) clearInterval(t);
  }, 120);
})();
