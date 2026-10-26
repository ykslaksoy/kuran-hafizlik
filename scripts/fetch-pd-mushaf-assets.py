#!/usr/bin/env python3
"""
PD mushaf folios v4: single-leaf crops, manual writingBox, ink-only inpaint.
Forbidden: auto 78% bbox, margin tile paste, flat cream fills.
"""
from __future__ import annotations

import json
import os
import time
import urllib.parse
import urllib.request
from io import BytesIO

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "pd-mushaf-sources.json")
OUT = os.path.join(ROOT, "dist", "assets", "mushaf", "pd")
RESTORED_DIR = os.path.join(ROOT, "dist", "assets", "mushaf", "restored")
STORE_MEDIA = "/cursor/stores/bc-114252f7-dc62-4152-81a7-76cb5dd7da05/media"
UA = "HafizyolBot/1.0 (PD asset fetch; ykslaksoy/kuran-hafizlik)"
DESIGN_W = 1000
DESIGN_H = 1610


def commons_url(title: str) -> str:
    api = (
        "https://commons.wikimedia.org/w/api.php?action=query&titles="
        + urllib.parse.quote(title)
        + "&prop=imageinfo&iiprop=url|extmetadata&format=json"
    )
    for attempt in range(6):
        try:
            req = urllib.request.Request(api, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            for p in data.get("query", {}).get("pages", {}).values():
                if p.get("missing"):
                    raise RuntimeError("Commons file missing: " + title)
                return p["imageinfo"][0]["url"]
        except Exception:
            time.sleep(2 + attempt * 2)
    raise RuntimeError("Commons failed: " + title)


def download(url: str) -> Image.Image:
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=180) as r:
                return Image.open(BytesIO(r.read())).convert("RGB")
        except Exception:
            time.sleep(2 + attempt * 2)
    raise RuntimeError("download failed: " + url[:80])


def split_half(img: Image.Image, side: str) -> Image.Image:
    w, _h = img.size
    mid = w // 2
    return img.crop((0, 0, mid, _h)) if side == "left" else img.crop((mid, 0, w, _h))


def fit_folio(img: Image.Image) -> Image.Image:
    target_r = DESIGN_W / DESIGN_H
    w, h = img.size
    r = w / h
    if r > target_r:
        nw, nh = DESIGN_W, int(DESIGN_W / r)
    else:
        nh, nw = DESIGN_H, int(DESIGN_H * r)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (DESIGN_W, DESIGN_H), (245, 238, 220))
    canvas.paste(img, ((DESIGN_W - nw) // 2, (DESIGN_H - nh) // 2))
    return canvas


def box_px(box: dict) -> tuple[int, int, int, int]:
    x0 = int(box["left"] * DESIGN_W)
    y0 = int(box["top"] * DESIGN_H)
    x1 = int((box["left"] + box["width"]) * DESIGN_W)
    y1 = int((box["top"] + box["height"]) * DESIGN_H)
    return x0, y0, x1, y1


def try_restored_master(eid: str, slot: str) -> Image.Image | None:
    """Restorer branch: dist/assets/mushaf/restored/<id>/p1|p2|p3|blank.png (1000×1610)."""
    names = {"p1": ("p1.png",), "p2": ("p2.png",), "margin": ("p3.png", "margin.png")}
    for fn in names.get(slot, ()):
        path = os.path.join(RESTORED_DIR, eid, fn)
        if os.path.isfile(path):
            return fit_folio(Image.open(path).convert("RGB"))
    return None


def ink_mask_in_box(rgb: np.ndarray, edge_guard: int = 14) -> np.ndarray:
    """Mask dark ink/diacritics only — not gold/blue border at box edges."""
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    # Otsu within box; ink darker than local paper
    _, mask = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    h, w = mask.shape
    mask[:edge_guard, :] = 0
    mask[-edge_guard:, :] = 0
    mask[:, :edge_guard] = 0
    mask[:, -edge_guard:] = 0
    # drop large decorative blobs (keep stroke-sized ink)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    clean = np.zeros_like(mask)
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < 12 or area > int(w * h * 0.08):
            continue
        clean[labels == i] = 255
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    clean = cv2.morphologyEx(clean, cv2.MORPH_OPEN, kernel, iterations=1)
    if clean.sum() < 50:
        clean = ((blur < 128) & (blur > 72)).astype(np.uint8) * 255
        clean[:edge_guard, :] = 0
        clean[-edge_guard:, :] = 0
        clean[:, :edge_guard] = 0
        clean[:, -edge_guard:] = 0
    return clean


def inpaint_writing_box(folio: Image.Image, box: dict) -> Image.Image:
    x0, y0, x1, y1 = box_px(box)
    if x1 <= x0 or y1 <= y0:
        return folio
    region = np.array(folio.crop((x0, y0, x1, y1)))
    mask = ink_mask_in_box(region)
    if mask.max() == 0:
        return folio
    fixed = cv2.inpaint(region, mask, 3, cv2.INPAINT_NS)
    out = folio.copy()
    out.paste(Image.fromarray(fixed), (x0, y0))
    return out


def load_leaf(ed: dict, key: str) -> Image.Image:
    if ed.get("spread"):
        sp = ed["spread"]
        img = download(commons_url(sp["title"]))
        if key == "p1":
            return split_half(img, sp.get("p1Half", "right"))
        if key == "p2":
            return split_half(img, sp.get("p2Half", "left"))
        if key == "margin":
            if ed.get("marginFolio"):
                return download(commons_url(ed["marginFolio"]))
            return split_half(img, sp.get("p1Half", "right"))
    if ed.get("folio"):
        title = ed["folio"].get(key) or ed["folio"]["margin"]
        return download(commons_url(title))
    if ed.get("direct"):
        url = ed["direct"].get(key) or ed["direct"]["margin"]
        return download(url)
    raise RuntimeError(f"no source {ed['id']} {key}")


def load_scan(ed: dict, page: int) -> Image.Image:
    if ed.get("scan"):
        key = "p1" if page == 1 else "p2"
        return download(commons_url(ed["scan"][key]))
    if ed.get("folio") and ed["folio"].get("scanP1") and page == 1:
        return download(commons_url(ed["folio"]["scanP1"]))
    return load_leaf(ed, "p1" if page == 1 else "p2")


def process_edition(ed: dict, margin_box: dict) -> dict:
    eid = ed["id"]
    edir = os.path.join(OUT, eid)
    os.makedirs(edir, exist_ok=True)

    serlevha = ed.get("writingBoxSerlevha", {})
    wb_p1 = serlevha.get("p1", margin_box)
    wb_p2 = serlevha.get("p2", margin_box)

    raw_p1 = fit_folio(load_leaf(ed, "p1"))
    raw_p2 = fit_folio(load_leaf(ed, "p2"))
    raw_margin = fit_folio(load_leaf(ed, "margin"))

    restored_meta: dict[str, str] = {}
    folio_p1 = try_restored_master(eid, "p1")
    if folio_p1:
        restored_meta["p1"] = f"/assets/mushaf/restored/{eid}/p1.png"
    else:
        folio_p1 = inpaint_writing_box(raw_p1, wb_p1)
    folio_p2 = try_restored_master(eid, "p2")
    if folio_p2:
        restored_meta["p2"] = f"/assets/mushaf/restored/{eid}/p2.png"
    else:
        folio_p2 = inpaint_writing_box(raw_p2, wb_p2)
    folio_margin = try_restored_master(eid, "margin")
    if folio_margin:
        restored_meta["margin"] = f"/assets/mushaf/restored/{eid}/p3.png"
    else:
        folio_margin = inpaint_writing_box(raw_margin, margin_box)

    scan_p1 = fit_folio(load_scan(ed, 1))
    scan_p2 = fit_folio(load_scan(ed, 2))

    folio_p1.save(os.path.join(edir, "folio-p1.webp"), "WEBP", quality=86, method=6)
    folio_p2.save(os.path.join(edir, "folio-p2.webp"), "WEBP", quality=86, method=6)
    folio_margin.save(os.path.join(edir, "folio-margin.webp"), "WEBP", quality=86, method=6)
    scan_p1.save(os.path.join(edir, "scan-p1.webp"), "WEBP", quality=86, method=6)
    scan_p2.save(os.path.join(edir, "scan-p2.webp"), "WEBP", quality=86, method=6)

    if eid == "pd-mehmed-sevki-ssm":
        os.makedirs(STORE_MEDIA, exist_ok=True)
        from PIL import ImageDraw

        for label, before, after, box in [
            ("p1", raw_p1, folio_p1, wb_p1),
            ("p2", raw_p2, folio_p2, wb_p2),
            ("p3", raw_margin, folio_margin, margin_box),
        ]:
            base = f"pd-mehmed-sevki-ssm-{label}-compare"
            before.save(os.path.join(STORE_MEDIA, f"{base}-before.png"), "PNG")
            after.save(os.path.join(STORE_MEDIA, f"{base}-after.png"), "PNG")
            x0, y0, x1, y1 = box_px(box)
            before.crop((x0, y0, x1, y1)).save(
                os.path.join(STORE_MEDIA, f"{base}-writing-before.png"), "PNG"
            )
            after.crop((x0, y0, x1, y1)).save(
                os.path.join(STORE_MEDIA, f"{base}-writing-after.png"), "PNG"
            )
            pair = Image.new("RGB", (DESIGN_W * 2, DESIGN_H), (32, 32, 32))
            pair.paste(before, (0, 0))
            pair.paste(after, (DESIGN_W, 0))
            d = ImageDraw.Draw(pair)
            d.rectangle([x0, y0, x1, y1], outline=(0, 220, 80), width=3)
            d.rectangle([DESIGN_W + x0, y0, DESIGN_W + x1, y1], outline=(0, 220, 80), width=3)
            pair.save(os.path.join(STORE_MEDIA, f"{base}-side-by-side.png"), "PNG")

    return {
        "id": eid,
        "folioMapTr": ed.get("spread", {}).get("folioMapTr") or ed.get("folioMapTr", ""),
        "assets": {
            "folio": {
                "p1": f"/assets/mushaf/pd/{eid}/folio-p1.webp",
                "p2": f"/assets/mushaf/pd/{eid}/folio-p2.webp",
                "margin": f"/assets/mushaf/pd/{eid}/folio-margin.webp",
            },
            "scan": {
                "p1": f"/assets/mushaf/pd/{eid}/scan-p1.webp",
                "p2": f"/assets/mushaf/pd/{eid}/scan-p2.webp",
            },
        },
        "writingBox": {
            "margin": margin_box,
            "serlevha": serlevha,
        },
        "restored": restored_meta if restored_meta else None,
        "provenance": {
            "nameTr": ed.get("nameTr", eid),
            "institutionTr": ed.get("institutionTr", ""),
            "shelfmark": ed.get("shelfmark", ""),
            "licenseTr": ed.get("licenseTr", "Public Domain"),
            "licenseUrl": ed.get("licenseUrl", ""),
            "verifiedOn": "2026-10-26",
        },
    }


def main() -> int:
    with open(SRC, encoding="utf-8") as f:
        cfg = json.load(f)
    margin_box = cfg["writingBoxMargin"]
    manifest = {
        "schema": 4,
        "verifiedOn": cfg["verifiedOn"],
        "cacheKey": "pdhist5",
        "design": cfg.get("design"),
        "writingBoxMargin": margin_box,
        "editions": [],
    }
    for ed in cfg["editions"]:
        print("fetch", ed["id"], "...")
        manifest["editions"].append(process_edition(ed, margin_box))
        time.sleep(3)
    path = os.path.join(OUT, "manifest.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("wrote", path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
