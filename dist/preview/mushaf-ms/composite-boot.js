(function () {
  var q = new URLSearchParams(location.search);
  var ms = q.get("ms") || "walters-w6722";

  document.body.classList.add("hy-ms-preview", "hy-frame-preview", "hy-kuran");

  var meta = null;

  function applyMs() {
    if (!meta) return;
    var bg = document.getElementById("hy-ms-bg");
    var clr = document.getElementById("hy-ms-clear");
    if (!bg) return;
    bg.style.backgroundImage = 'url("/preview/mushaf-ms/cache/' + meta.id + '.jpg")';
    bg.style.backgroundPosition = meta.bgPosition || "50% 50%";
    if (clr) clr.style.background = meta.paper || "#f4ead8";
  }

  function ensureLayer() {
    var stage = document.getElementById("hy-qcf-stage");
    if (!stage || stage.classList.contains("hy-waiting")) return false;
    if (!stage.querySelector("#hy-ms-layer")) {
      var layer = document.createElement("div");
      layer.id = "hy-ms-layer";
      layer.innerHTML = '<div id="hy-ms-bg"></div><div id="hy-ms-clear"></div>';
      stage.insertBefore(layer, stage.firstChild);
      var orn = document.getElementById("hy-qcf-ornament");
      if (orn) orn.style.display = "none";
    }
    applyMs();
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
    });

  var tries = 0;
  var t = setInterval(function () {
    ensureLayer();
    if (document.body.getAttribute("data-hy-ms-ready") === "1" || tries++ > 160) clearInterval(t);
  }, 150);
})();
