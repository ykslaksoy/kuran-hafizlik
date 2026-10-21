(function (global) {
  var DESIGN_W = 1000;
  var DESIGN_H = 1610;
  var TEXT = { left: 56, top: 72, w: 888, h: 1470 };
  var LINE_H = 98;
  var LINE_N = 15;

  function pagePx(pageRect, iw, ih) {
    return {
      x: pageRect.x * iw,
      y: pageRect.y * ih,
      w: pageRect.w * iw,
      h: pageRect.h * ih,
    };
  }

  function mulberry32(seed) {
    return function () {
      var t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function sampleMarginColor(img, iw, ih, patch) {
    var c = document.createElement("canvas");
    c.width = 24;
    c.height = 24;
    var cx = c.getContext("2d");
    cx.drawImage(img, patch.x * iw, patch.y * ih, patch.w * iw, patch.h * ih, 0, 0, 24, 24);
    var d = cx.getImageData(0, 0, 24, 24).data;
    var r = 0;
    var g = 0;
    var b = 0;
    var n = 0;
    for (var i = 0; i < d.length; i += 4) {
      var pr = d[i];
      var pg = d[i + 1];
      var pb = d[i + 2];
      if (pr + pg + pb < 40 || pr + pg + pb > 720) continue;
      r += pr;
      g += pg;
      b += pb;
      n++;
    }
    if (!n) return { r: 241, g: 233, b: 215 };
    var c = { r: (r / n) | 0, g: (g / n) | 0, b: (b / n) | 0 };
    var target = { r: 241, g: 233, b: 215 };
    return {
      r: Math.round(c.r * 0.22 + target.r * 0.78),
      g: Math.round(c.g * 0.22 + target.g * 0.78),
      b: Math.round(c.b * 0.22 + target.b * 0.78),
    };
  }

  function fillProceduralPaper(ctx, x, y, w, h, base, seed) {
    var rand = mulberry32(seed | 0);
    var img = ctx.createImageData(w, h);
    var d = img.data;
    for (var py = 0; py < h; py++) {
      for (var px = 0; px < w; px++) {
        var i = (py * w + px) * 4;
        var n = (rand() - 0.5) * 7;
        var fiber = Math.sin(px * 0.21 + py * 0.13) * 1.1 + Math.sin(px * 0.47 + py * 0.09) * 0.7;
        var r = Math.min(252, Math.max(0, base.r + n + fiber));
        var g = Math.min(250, Math.max(0, base.g + n * 0.98 + fiber * 0.92));
        var b = Math.min(245, Math.max(0, base.b + n * 0.95 + fiber * 0.85));
        d[i] = r;
        d[i + 1] = g;
        d[i + 2] = b;
        d[i + 3] = 255;
      }
    }
    ctx.putImageData(img, x, y);
  }

  function tileEdge(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (sw < 2 || sh < 2 || dw < 1 || dh < 1) return;
    var scale = Math.min(1, dh / sh);
    var th = sh * scale;
    var tw = sw * scale;
    var y = dy;
    var x0 = dx;
    while (x0 < dx + dw - 0.5) {
      var rw = Math.min(tw, dx + dw - x0);
      var cropW = sw * (rw / tw);
      ctx.drawImage(img, sx, sy, cropW, sh, x0, y, rw, th);
      x0 += tw;
    }
  }

  function tileEdgeV(ctx, img, sx, sy, sw, sh, dx, dy, dw, dh) {
    if (sw < 2 || sh < 2) return;
    var scale = Math.min(1, dw / sw);
    var tw = sw * scale;
    var th = sh * scale;
    var x = dx;
    var y0 = dy;
    while (y0 < dy + dh - 0.5) {
      var rh = Math.min(th, dy + dh - y0);
      var cropH = sh * (rh / th);
      ctx.drawImage(img, sx, sy, sw, cropH, x, y0, tw, rh);
      y0 += th;
    }
  }

  function drawBorders(ctx, img, p, borders) {
    var topH = borders.top;
    var botH = borders.bottom;
    var leftW = borders.left;
    var rightW = borders.right;
    var topSrcH = p.h * borders.topFrac;
    var botSrcH = p.h * borders.bottomFrac;
    var leftSrcW = p.w * borders.leftFrac;
    var rightSrcW = p.w * borders.rightFrac;

    ctx.drawImage(img, p.x, p.y, p.w, topSrcH, 0, 0, DESIGN_W, topH);
    ctx.drawImage(img, p.x, p.y + p.h - botSrcH, p.w, botSrcH, 0, DESIGN_H - botH, DESIGN_W, botH);
    tileEdgeV(ctx, img, p.x, p.y + topSrcH * 0.35, leftSrcW, p.h * 0.14, 0, topH, leftW, DESIGN_H - topH - botH);
    tileEdgeV(
      ctx,
      img,
      p.x + p.w - rightSrcW,
      p.y + topSrcH * 0.35,
      rightSrcW,
      p.h * 0.14,
      DESIGN_W - rightW,
      topH,
      rightW,
      DESIGN_H - topH - botH
    );
  }

  function headerLineTop(pageNum) {
    var items;
    var headers = {};
    if (pageNum === 1) {
      items = [3, 9, 10, 11, 12, 13, 14, 15];
      headers[3] = 1;
    } else if (pageNum === 2) {
      items = [3, 5, 10, 11, 12, 13, 14, 15];
      headers[3] = 1;
      headers[5] = 1;
    } else {
      return 334;
    }
    var extra = 0;
    for (var i = 0; i < items.length; i++) if (headers[items[i]]) extra += 18;
    var block = items.length * LINE_H + extra;
    var start = Math.round((1470 - block) / 2);
    if (start < 36) start = 36;
    var y = start;
    var headerTop = null;
    for (var j = 0; j < items.length; j++) {
      if (items[j] === 3) headerTop = y;
      y += LINE_H;
      if (headers[items[j]]) y += 18;
    }
    return headerTop == null ? 334 : headerTop;
  }

  function drawHeaderBand(ctx, img, iw, ih, pageRect, band, pageNum) {
    if (!band || !band.src) return null;
    var pr = pageRect;
    var s = {
      x: (pr.x + band.src.x * pr.w) * iw,
      y: (pr.y + band.src.y * pr.h) * ih,
      w: band.src.w * pr.w * iw,
      h: band.src.h * pr.h * ih,
    };
    var lineTop = headerLineTop(pageNum);
    var destY = 72 + lineTop - 14;
    var destH = band.destH || 102;
    var destW = band.destW || 820;
    var destX = TEXT.left + (TEXT.w - destW) / 2;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, s.x, s.y, s.w, s.h, destX, destY, destW, destH);
    ctx.restore();
    return { x: destX, y: destY, w: destW, h: destH, lineTop: lineTop };
  }

  function drawGoldRule(ctx) {
    ctx.save();
    ctx.strokeStyle = "rgba(168, 128, 38, 0.9)";
    ctx.lineWidth = 1.2;
    ctx.strokeRect(TEXT.left + 0.5, TEXT.top + 0.5, TEXT.w - 1, TEXT.h - 1);
    ctx.restore();
  }

  function buildFrame(img, pageConfig, pageNum) {
    var canvas = document.createElement("canvas");
    canvas.width = DESIGN_W;
    canvas.height = DESIGN_H;
    var ctx = canvas.getContext("2d");
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var p = pagePx(pageConfig.pageRect, iw, ih);
    var margin = pageConfig.marginSample || { x: 0.011, y: 0.58, w: 0.022, h: 0.012 };
    var base = sampleMarginColor(img, iw, ih, margin);
    var seed = (pageNum * 7919) ^ 0x5f3759df;

    fillProceduralPaper(ctx, 0, 0, DESIGN_W, DESIGN_H, base, seed);
    fillProceduralPaper(ctx, TEXT.left, TEXT.top, TEXT.w, TEXT.h, base, seed + 17);

    var borders = pageConfig.borders || {
      top: 64,
      bottom: 48,
      left: 52,
      right: 52,
      topFrac: 0.062,
      bottomFrac: 0.055,
      leftFrac: 0.088,
      rightFrac: 0.088,
    };
    drawBorders(ctx, img, p, borders);

    fillProceduralPaper(ctx, TEXT.left, TEXT.top, TEXT.w, TEXT.h, base, seed + 31);

    var bandMeta = drawHeaderBand(ctx, img, iw, ih, pageConfig.pageRect, pageConfig.headerBand, pageNum);
    drawGoldRule(ctx);

    return {
      dataUrl: canvas.toDataURL("image/png"),
      headerBand: bandMeta,
      paperRgb: base,
    };
  }

  global.hySevkiComposite = {
    DESIGN_W: DESIGN_W,
    DESIGN_H: DESIGN_H,
    TEXT: TEXT,
    buildFrame: buildFrame,
    headerLineTop: headerLineTop,
  };
})(typeof window !== "undefined" ? window : globalThis);
