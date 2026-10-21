(function (global) {
  var DESIGN_W = 1000;
  var DESIGN_H = 1610;
  var TEXT = { left: 56, top: 72, w: 888, h: 1470 };
  var BORDER = { top: 72, bottom: 52, left: 56, right: 56 };
  var EDGE_FRAC = { top: 0.13, bottom: 0.075, left: 0.1, right: 0.1 };

  function pagePx(pageRect, iw, ih) {
    return {
      x: pageRect.x * iw,
      y: pageRect.y * ih,
      w: pageRect.w * iw,
      h: pageRect.h * ih,
    };
  }

  function drawFullPaper(ctx, img, iw, ih, paperAbs) {
    var sx = paperAbs.x * iw;
    var sy = paperAbs.y * ih;
    var sw = paperAbs.w * iw;
    var sh = paperAbs.h * ih;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#e6dcc8";
    ctx.fillRect(0, 0, DESIGN_W, DESIGN_H);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, DESIGN_W, DESIGN_H);
    ctx.restore();
  }

  function drawEdge(ctx, img, p, edge, dest) {
    var sx, sy, sw, sh;
    if (edge === "top") {
      sh = p.h * EDGE_FRAC.top;
      sx = p.x;
      sy = p.y;
      sw = p.w;
    } else if (edge === "bottom") {
      sh = p.h * EDGE_FRAC.bottom;
      sx = p.x;
      sy = p.y + p.h - sh;
      sw = p.w;
    } else if (edge === "left") {
      sw = p.w * EDGE_FRAC.left;
      sx = p.x;
      sy = p.y;
      sh = p.h;
    } else {
      sw = p.w * EDGE_FRAC.right;
      sx = p.x + p.w - sw;
      sy = p.y;
      sh = p.h;
    }
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sw, sh, dest.x, dest.y, dest.w, dest.h);
    ctx.restore();
  }

  function drawGoldRule(ctx) {
    ctx.save();
    ctx.strokeStyle = "rgba(184, 146, 42, 0.95)";
    ctx.lineWidth = 1.25;
    ctx.strokeRect(TEXT.left + 0.6, TEXT.top + 0.6, TEXT.w - 1.2, TEXT.h - 1.2);
    ctx.restore();
  }

  function drawHeaderBand(ctx, img, iw, ih, pageRect, band) {
    if (!band || !band.src || !band.dest) return;
    var pr = pageRect;
    var s = {
      x: (pr.x + band.src.x * pr.w) * iw,
      y: (pr.y + band.src.y * pr.h) * ih,
      w: band.src.w * pr.w * iw,
      h: band.src.h * pr.h * ih,
    };
    var d = band.dest;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, s.x, s.y, s.w, s.h, d.x, d.y, d.w, d.h);
    ctx.restore();
  }

  function buildFrame(img, pageConfig) {
    var canvas = document.createElement("canvas");
    canvas.width = DESIGN_W;
    canvas.height = DESIGN_H;
    var ctx = canvas.getContext("2d");
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var p = pagePx(pageConfig.pageRect, iw, ih);
    var paperAbs = pageConfig.paperAbs || { x: 0.02, y: 0.45, w: 0.03, h: 0.08 };

    drawFullPaper(ctx, img, iw, ih, paperAbs);

    drawEdge(ctx, img, p, "top", { x: 0, y: 0, w: DESIGN_W, h: BORDER.top });
    drawEdge(ctx, img, p, "bottom", { x: 0, y: DESIGN_H - BORDER.bottom, w: DESIGN_W, h: BORDER.bottom });
    drawEdge(ctx, img, p, "left", { x: 0, y: 0, w: BORDER.left, h: DESIGN_H });
    drawEdge(ctx, img, p, "right", { x: DESIGN_W - BORDER.right, y: 0, w: BORDER.right, h: DESIGN_H });

    drawHeaderBand(ctx, img, iw, ih, pageConfig.pageRect, pageConfig.headerBand);
    drawGoldRule(ctx);

    return canvas.toDataURL("image/jpeg", 0.94);
  }

  global.hySevkiComposite = {
    DESIGN_W: DESIGN_W,
    DESIGN_H: DESIGN_H,
    TEXT: TEXT,
    buildFrame: buildFrame,
  };
})(typeof window !== "undefined" ? window : globalThis);
