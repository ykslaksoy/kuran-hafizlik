/** Orijinal köşe / bordür SVG katmanları — temaya göre enjekte edilir. */
(function (global) {
  var RUMI =
    '<svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><linearGradient id="gA" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#e8c547"/><stop offset="100%" stop-color="#8b6914"/></linearGradient></defs>' +
    '<path fill="none" stroke="url(#gA)" stroke-width="1.8" d="M4 44 C4 12 28 4 44 4 C60 4 84 12 84 44"/>' +
    '<path fill="none" stroke="#0f2848" stroke-width="1.2" d="M10 40 C14 18 32 10 44 10 C56 10 74 18 78 40"/>' +
    '<path fill="#c9a227" opacity="0.85" d="M6 6 C18 8 24 16 20 24 C14 20 8 12 6 6Z"/>' +
    '<path fill="none" stroke="#f5e6a8" stroke-width="0.8" d="M12 28 Q22 14 38 12 Q28 22 12 28"/>' +
    "</svg>";

  var HATAYI =
    '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path fill="none" stroke="#b8963e" stroke-width="1.2" d="M8 32 C8 14 22 6 32 6 C42 6 56 14 56 32"/>' +
    '<circle cx="12" cy="12" r="3" fill="none" stroke="#c9a227" stroke-width="1"/>' +
    '<path fill="#1b5e3a" opacity="0.35" d="M10 10 Q16 8 14 14 Q8 16 10 10Z"/>' +
    "</svg>";

  var FLOWER =
    '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<circle cx="12" cy="12" r="2.2" fill="#d4af37"/>' +
    '<ellipse cx="12" cy="6" rx="2.5" ry="4" fill="#e8c547" opacity="0.9"/>' +
    '<ellipse cx="12" cy="18" rx="2.5" ry="4" fill="#e8c547" opacity="0.9"/>' +
    '<ellipse cx="6" cy="12" rx="4" ry="2.5" fill="#e8c547" opacity="0.9"/>' +
    '<ellipse cx="18" cy="12" rx="4" ry="2.5" fill="#e8c547" opacity="0.9"/>' +
    "</svg>";

  var BORDER_A =
    '<svg class="hy-frame-border-svg" viewBox="0 0 1000 1610" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="20" y="20" width="960" height="1570" fill="none" stroke="#c9a227" stroke-width="2"/>' +
    '<rect x="28" y="28" width="944" height="1554" fill="none" stroke="#0f2848" stroke-width="4" opacity="0.9"/>' +
    '<rect x="36" y="36" width="928" height="1538" fill="none" stroke="#f0d878" stroke-width="1"/>' +
    "</svg>";

  var BORDER_D =
    '<svg class="hy-frame-border-svg" viewBox="0 0 1000 1610" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<rect x="18" y="18" width="964" height="1574" fill="none" stroke="#e3e0da" stroke-width="1"/>' +
    "</svg>";

  var BORDER_C =
    '<svg class="hy-frame-border-svg" viewBox="0 0 1000 1610" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><pattern id="fl" width="48" height="48" patternUnits="userSpaceOnUse">' +
    '<circle cx="24" cy="24" r="1.5" fill="#d4af37" opacity="0.35"/>' +
    "</pattern></defs>" +
    '<rect x="12" y="12" width="976" height="1586" fill="url(#fl)" opacity="0.4"/>' +
    '<rect x="16" y="16" width="968" height="1578" fill="none" stroke="#d4af37" stroke-width="3"/>' +
    '<rect x="24" y="24" width="952" height="1562" fill="none" stroke="#8b7355" stroke-width="1" stroke-dasharray="4 6"/>' +
    "</svg>";

  function cornerSet(svgInner, size) {
    var s = size || 88;
    return (
      '<div class="hy-frame-corners">' +
      '<div class="hy-corner-tl" style="width:' + s + "px;height:" + s + 'px">' + svgInner + "</div>" +
      '<div class="hy-corner-tr" style="width:' + s + "px;height:" + s + 'px">' + svgInner + "</div>" +
      '<div class="hy-corner-bl" style="width:' + s + "px;height:" + s + 'px">' + svgInner + "</div>" +
      '<div class="hy-corner-br" style="width:' + s + "px;height:" + s + 'px">' + svgInner + "</div>" +
      "</div>"
    );
  }

  function ayetGulRow() {
    var html = '<div class="hy-frame-deco hy-ayet-guls" style="left:48px;right:48px;top:68px;bottom:56px;pointer-events:none">';
    for (var i = 0; i < 6; i++) {
      var top = 120 + i * 220;
      html +=
        '<div style="position:absolute;right:18px;top:' +
        top +
        'px;width:20px;height:20px;opacity:0.55">' +
        FLOWER +
        "</div>";
    }
    html += "</div>";
    return html;
  }

  function inject(alt) {
    var orn = document.getElementById("hy-qcf-ornament");
    if (!orn || orn.getAttribute("data-hy-frame") === alt) return false;
    var stage = document.getElementById("hy-qcf-stage");
    if (!stage || stage.classList.contains("hy-waiting")) return false;

    var inner = "";
    if (alt === "A") {
      inner = BORDER_A + cornerSet(RUMI, 88);
    } else if (alt === "B") {
      inner = cornerSet(HATAYI.replace('viewBox="0 0 64 64"', 'viewBox="0 0 64 64" width="56" height="56"'), 56);
    } else if (alt === "C") {
      inner = BORDER_C + cornerSet(RUMI.replace(/#0f2848/g, "#162a52").replace(/#c9a227/g, "#d4af37"), 72) + ayetGulRow();
    } else if (alt === "D") {
      inner = BORDER_D;
    }
    orn.innerHTML = '<div class="hy-frame-deco hy-frame-inner">' + inner + "</div>";
    orn.setAttribute("data-hy-frame", alt);
    return true;
  }

  global.hyFrameDeco = { inject: inject };
})(typeof window !== "undefined" ? window : globalThis);
