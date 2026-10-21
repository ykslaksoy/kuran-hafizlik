(function () {
  var q = new URLSearchParams(location.search);
  var alt = (q.get("alt") || "A").toUpperCase();
  if (alt !== "A" && alt !== "B" && alt !== "C" && alt !== "D") alt = "A";
  var page = q.get("page") || "1";

  document.body.classList.add("hy-frame-preview", "hy-frame-alt-" + alt.toLowerCase());

  var need =
    "kuran=1&page=" +
    encodeURIComponent(page) +
    "&alt=" +
    encodeURIComponent(alt);
  if (!/kuran/i.test(location.search)) {
    var base = location.pathname + "?" + need;
    history.replaceState(null, "", base);
  }

  function waitReady() {
    if (window.hyFrameDeco && window.hyFrameDeco.inject(alt)) {
      document.body.setAttribute("data-hy-preview-ready", "1");
      return;
    }
    var stage = document.getElementById("hy-qcf-stage");
    if (stage && !stage.classList.contains("hy-waiting") && window.hyFrameDeco) {
      window.hyFrameDeco.inject(alt);
      document.body.setAttribute("data-hy-preview-ready", "1");
    }
  }

  var tries = 0;
  var t = setInterval(function () {
    waitReady();
    if (document.body.getAttribute("data-hy-preview-ready") === "1" || tries++ > 120) {
      clearInterval(t);
    }
  }, 150);
})();
