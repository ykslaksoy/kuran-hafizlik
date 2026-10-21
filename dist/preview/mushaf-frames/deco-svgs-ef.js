/** E/F — el yazması mushaf tezhibi (özgün SVG, kamu malı referans oranlarına yakın). */
(function (global) {
  function uid() {
    return "hy" + Math.random().toString(36).slice(2, 9);
  }

  function rumiCorner(id) {
    return (
      '<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      "<defs>" +
      '<linearGradient id="' + id + '-cg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#faf0c8"/><stop offset="45%" stop-color="#d4af37"/><stop offset="100%" stop-color="#7a5c12"/>' +
      "</linearGradient>" +
      '<linearGradient id="' + id + '-cl" x1="0" y1="1" x2="1" y2="0">' +
      '<stop offset="0%" stop-color="#142a52"/><stop offset="100%" stop-color="#0a1428"/>' +
      "</linearGradient>" +
      "</defs>" +
      '<path fill="url(#' + id + '-cl)" d="M0 0h140v42c-28-2-52-14-70-32C52 54 28 42 0 40V0z"/>' +
      '<path fill="none" stroke="url(#' + id + '-cg)" stroke-width="1.4" d="M8 8 C42 10 72 28 88 58 C98 76 104 98 108 128"/>' +
      '<path fill="none" stroke="url(#' + id + '-cg)" stroke-width="0.9" d="M14 22 C38 24 58 38 70 58 C78 72 82 90 84 108"/>' +
      '<path fill="none" stroke="#1a0a00" stroke-width="0.35" d="M6 6 C40 8 68 26 82 52 C90 68 94 86 96 104"/>' +
      '<path fill="url(#' + id + '-cg)" opacity="0.92" d="M10 10c8 4 14 12 12 20-6-2-12-8-14-16-2 2-4 0-8-4z"/>' +
      '<path fill="none" stroke="#f5e6a8" stroke-width="0.5" d="M22 18 Q34 12 48 16 T72 28 Q82 36 88 48"/>' +
      '<path fill="none" stroke="url(#' + id + '-cg)" stroke-width="0.7" d="M18 34 C28 30 40 32 48 40 S62 52 68 64 S74 78 76 92"/>' +
      '<circle cx="24" cy="24" r="2.2" fill="#e8c547" stroke="#5c4010" stroke-width="0.4"/>' +
      '<circle cx="52" cy="38" r="1.6" fill="#c9a227" opacity="0.85"/>' +
      "</svg>"
    );
  }

  function hatayiMini(id) {
    return (
      '<svg viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<path fill="none" stroke="#c9a227" stroke-width="0.8" d="M6 24 C6 12 16 6 24 6 32 6 42 12 42 24"/>' +
      '<path fill="none" stroke="#8b6914" stroke-width="0.5" d="M10 20 C16 14 26 12 34 16"/>' +
      '<circle cx="12" cy="12" r="1.2" fill="#d4af37"/>' +
      "</svg>"
    );
  }

  function ayetGul(id, cx, cy, r) {
    r = r || 9;
    var p = "";
    for (var i = 0; i < 8; i++) {
      var a = (i * Math.PI) / 4;
      p +=
        '<ellipse cx="' +
        (cx + Math.cos(a) * r * 0.1) +
        '" cy="' +
        (cy + Math.sin(a) * r * 0.1) +
        '" rx="' +
        (r * 0.55) +
        '" ry="' +
        (r * 0.9) +
        '" fill="url(#' +
        id +
        '-gg)" transform="rotate(' +
        (i * 45) +
        " " +
        cx +
        " " +
        cy +
        ')"/>';
    }
    return (
      '<g transform="translate(' + (cx - r) + "," + (cy - r) + ')">' +
      '<svg width="' + r * 2 + '" height="' + r * 2 + '" viewBox="0 0 ' + r * 2 + " " + r * 2 + '">' +
      "<defs><radialGradient id=\"" + id + '-gg"><stop offset="0%" stop-color="#fff8dc"/><stop offset="55%" stop-color="#d4af37"/><stop offset="100%" stop-color="#8b6914"/></radialGradient></defs>' +
      p +
      '<circle cx="' + r + '" cy="' + r + '" r="' + (r * 0.22) + '" fill="#f7e6a8" stroke="#5c4010" stroke-width="0.3"/>' +
      "</svg></g>"
    );
  }

  function borderClassicE(id) {
    var guls = "";
    var ys = [280, 520, 760, 1000, 1240, 1480];
    for (var i = 0; i < ys.length; i++) {
      guls += ayetGul(id + "g" + i, 934, ys[i], 8);
    }
    return (
      '<svg class="hy-frame-border-svg" viewBox="0 0 1000 1610" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      "<defs>" +
      '<linearGradient id="' + id + '-gold" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#faf0c8"/><stop offset="30%" stop-color="#e8c547"/><stop offset="55%" stop-color="#b8860b"/><stop offset="78%" stop-color="#d4af37"/><stop offset="100%" stop-color="#7a5c12"/>' +
      "</linearGradient>" +
      '<linearGradient id="' + id + '-lapis" x1="0.2" y1="0" x2="0.8" y2="1">' +
      '<stop offset="0%" stop-color="#243d6e"/><stop offset="50%" stop-color="#142a52"/><stop offset="100%" stop-color="#060d18"/>' +
      "</linearGradient>" +
      '<filter id="' + id + '-grain" x="0" y="0" width="100%" height="100%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" result="t"/>' +
      '<feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.035 0"/>' +
      "</filter>" +
      '<pattern id="' + id + '-scroll" width="120" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(0)">' +
      '<path d="M0 12 C20 4 40 20 60 12 S100 4 120 12" fill="none" stroke="url(#' + id + '-gold)" stroke-width="0.6" opacity="0.7"/>' +
      '<path d="M0 16 C25 10 45 22 65 14" fill="none" stroke="#1a0a00" stroke-width="0.2" opacity="0.5"/>' +
      "</pattern>" +
      "</defs>" +
      '<rect width="1000" height="1610" fill="url(#' + id + '-lapis)"/>' +
      '<rect x="38" y="38" width="924" height="1534" fill="none" stroke="url(#' + id + '-gold)" stroke-width="5"/>' +
      '<rect x="46" y="46" width="908" height="1518" fill="none" stroke="#0a0a0a" stroke-width="0.6" opacity="0.65"/>' +
      '<rect x="54" y="54" width="892" height="1502" fill="#f2e8d4"/>' +
      '<rect x="54" y="54" width="892" height="1502" fill="url(#' + id + '-grain)"/>' +
      '<rect x="62" y="62" width="876" height="1486" fill="none" stroke="url(#' + id + '-gold)" stroke-width="1.2"/>' +
      '<rect x="68" y="68" width="864" height="1474" fill="none" stroke="#0a0a0a" stroke-width="0.45"/>' +
      '<rect x="76" y="76" width="848" height="1458" fill="none" stroke="url(#' + id + '-scroll)" opacity="0.55"/>' +
      guls +
      "</svg>"
    );
  }

  function borderSimpleF(id) {
    return (
      '<svg class="hy-frame-border-svg" viewBox="0 0 1000 1610" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      "<defs>" +
      '<linearGradient id="' + id + '-fg" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#f5e6b8"/><stop offset="50%" stop-color="#c9a227"/><stop offset="100%" stop-color="#9a7b1a"/>' +
      "</linearGradient>" +
      '<filter id="' + id + '-pf"><feTurbulence baseFrequency="0.8" numOctaves="2" result="n"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.03 0"/></filter>' +
      "</defs>" +
      '<rect width="1000" height="1610" fill="#ebe6dc"/>' +
      '<rect x="28" y="28" width="944" height="1554" fill="#faf6ee"/>' +
      '<rect x="28" y="28" width="944" height="1554" fill="url(#' + id + '-pf)"/>' +
      '<rect x="36" y="36" width="928" height="1538" fill="none" stroke="url(#' + id + '-fg)" stroke-width="1.1"/>' +
      '<rect x="42" y="42" width="916" height="1526" fill="none" stroke="#f8f0d8" stroke-width="2.5"/>' +
      '<rect x="44" y="44" width="912" height="1522" fill="none" stroke="url(#' + id + '-fg)" stroke-width="0.9"/>' +
      '<rect x="46" y="46" width="908" height="1518" fill="none" stroke="#2a2218" stroke-width="0.35" opacity="0.5"/>' +
      ayetGul(id + "f1", 928, 420, 7) +
      ayetGul(id + "f2", 928, 880, 7) +
      ayetGul(id + "f3", 928, 1340, 7) +
      "</svg>"
    );
  }

  function corners(html, size) {
    return (
      '<div class="hy-frame-corners" style="inset:0">' +
      '<div class="hy-corner-tl" style="width:' + size + "px;height:" + size + 'px">' + html + "</div>" +
      '<div class="hy-corner-tr" style="width:' + size + "px;height:" + size + 'px">' + html + "</div>" +
      '<div class="hy-corner-bl" style="width:' + size + "px;height:" + size + 'px">' + html + "</div>" +
      '<div class="hy-corner-br" style="width:' + size + "px;height:" + size + 'px">' + html + "</div>" +
      "</div>"
    );
  }

  function inject(alt) {
    var orn = document.getElementById("hy-qcf-ornament");
    if (!orn) return false;
    var stage = document.getElementById("hy-qcf-stage");
    if (!stage || stage.classList.contains("hy-waiting")) return false;
    if (orn.getAttribute("data-hy-frame") === alt) return true;

    var id = uid();
    var inner = "";
    if (alt === "E") {
      inner =
        borderClassicE(id) +
        corners(rumiCorner(id + "r"), 132) +
        '<div class="hy-serlevha-ribbon" aria-hidden="true"></div>';
    } else if (alt === "F") {
      inner = borderSimpleF(id) + corners(hatayiMini(id + "h"), 40);
    } else {
      return false;
    }
    orn.innerHTML = '<div class="hy-frame-deco hy-frame-inner">' + inner + "</div>";
    orn.setAttribute("data-hy-frame", alt);
    return true;
  }

  global.hyFrameDeco = { inject: inject };
})(typeof window !== "undefined" ? window : globalThis);
