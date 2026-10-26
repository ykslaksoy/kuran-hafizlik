#!/usr/bin/env python3
"""
Restore all PD mushaf tezhip families: symmetric crop, paper cleanup, ink-only inpaint.
Writes dist/assets/mushaf/restored/<id>/ + proof PNGs (blank + ink-removed; QCF via shot script).
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
from PIL import Image, ImageEnhance

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "pd-mushaf-sources.json")
RESTORED_ROOT = os.path.join(ROOT, "dist", "assets", "mushaf", "restored")
PD_ROOT = os.path.join(ROOT, "dist", "assets", "mushaf", "pd")
STORE_MEDIA = "/cursor/stores/bc-114252f7-dc62-4152-81a7-76cb5dd7da05/media"
CACHE_KEY = "pdhist5"
UA = "HafizyolBot/1.0 (PD restoration; ykslaksoy/kuran-hafizlik)"


def commons_url(title: str) -> str:
    api = (
        "https://commons.wikimedia.org/w/api.php?action=query&titles="
        + urllib.parse.quote(title)
        + "&prop=imageinfo&iiprop=url&format=json"
    )
    for attempt in range(6):
        try:
            req = urllib.request.Request(api, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = json.load(r)
            for p in data.get("query", {}).get("pages", {}).values():
                if p.get("missing"):
                    raise RuntimeError("Commons missing: " + title)
                return p["imageinfo"][0]["url"]
        except Exception:
            time.sleep(2 + attempt * 2)
    raise RuntimeError("Commons failed: " + title)


def download_url(url: str) -> Image.Image:
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=180) as r:
                return Image.open(BytesIO(r.read())).convert("RGB")
        except Exception:
            time.sleep(2 + attempt * 2)
    raise RuntimeError("download failed: " + url[:96])


def split_half(img: Image.Image, side: str) -> Image.Image:
    w, _h = img.size
    mid = w // 2
    return img.crop((0, 0, mid, _h)) if side == "left" else img.crop((mid, 0, w, _h))


def load_leaf(ed: dict, key: str) -> Image.Image:
    if ed.get("spread"):
        sp = ed["spread"]
        img = download_url(commons_url(sp["title"]))
        if key == "p1":
            return split_half(img, sp.get("p1Half", "right"))
        if key == "p2":
            return split_half(img, sp.get("p2Half", "left"))
        if key == "margin":
            if ed.get("marginFolio"):
                return download_url(commons_url(ed["marginFolio"]))
            return split_half(img, sp.get("p1Half", "right"))
    if ed.get("folio"):
        fol = ed["folio"]
        title = fol.get(key) or fol.get("margin")
        return download_url(commons_url(title))
    if ed.get("direct"):
        url = ed["direct"].get(key) or ed["direct"]["margin"]
        return download_url(url)
    raise RuntimeError(f"no source {ed['id']} {key}")


def extract_page_symmetric(img: Image.Image, pad_frac: float = 0.02) -> Image.Image:
    arr = np.array(img)
    gray = cv2.cvtColor(arr, cv2.COLOR_RGB2GRAY)
    mask = (gray > 28).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    coords = cv2.findNonZero(mask)
    if coords is None:
        return img
    x, y, w, h = cv2.boundingRect(coords)
    cx, cy = x + w / 2, y + h / 2
    side = max(w, h) * (1 + pad_frac * 2)
    x0 = int(max(0, cx - side / 2))
    y0 = int(max(0, cy - side / 2))
    x1 = int(min(arr.shape[1], cx + side / 2))
    y1 = int(min(arr.shape[0], cy + side / 2))
    return Image.fromarray(arr[y0:y1, x0:x1])


def reduce_stains(rgb: np.ndarray) -> np.ndarray:
    out = cv2.fastNlMeansDenoisingColored(rgb, None, 4, 4, 7, 21)
    lab = cv2.cvtColor(out, cv2.COLOR_RGB2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
    l = clahe.apply(l)
    out = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2RGB)
    h, w = out.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = w / 2, h / 2
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    rmax = max(np.sqrt(cx ** 2 + cy ** 2), 1.0)
    vig = 1.0 + 0.12 * (r / rmax) ** 2
    return np.clip(out.astype(np.float32) * vig[..., None], 0, 255).astype(np.uint8)


def warm_paper(img: Image.Image) -> Image.Image:
    pil = Image.fromarray(reduce_stains(np.array(img)))
    pil = ImageEnhance.Color(pil).enhance(1.06)
    return ImageEnhance.Contrast(pil).enhance(1.04)


def fit_stage(img: Image.Image, dw: int, dh: int) -> Image.Image:
    target_r = dw / dh
    w, h = img.size
    r = w / h
    if r > target_r:
        nw, nh = dw, int(dw / r)
    else:
        nh, nw = dh, int(dh * r)
    img = img.resize((nw, nh), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (dw, dh), (248, 241, 224))
    canvas.paste(img, ((dw - nw) // 2, (dh - nh) // 2))
    return canvas


def box_px(box: dict, dw: int, dh: int) -> tuple[int, int, int, int]:
    x0 = int(box["left"] * dw)
    y0 = int(box["top"] * dh)
    x1 = int((box["left"] + box["width"]) * dw)
    y1 = int((box["top"] + box["height"]) * dh)
    return x0, y0, x1, y1


def ink_mask_in_box(rgb: np.ndarray, edge_guard: int = 16) -> np.ndarray:
    gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, mask = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    h, w = mask.shape
    for g in (edge_guard,):
        mask[:g, :] = 0
        mask[-g:, :] = 0
        mask[:, :g] = 0
        mask[:, -g:] = 0
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask, connectivity=8)
    clean = np.zeros_like(mask)
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < 10 or area > int(w * h * 0.075):
            continue
        clean[labels == i] = 255
    if clean.sum() < 80:
        clean = ((blur < 138) & (blur > 0)).astype(np.uint8) * 255
        clean[:edge_guard, :] = 0
        clean[-edge_guard:, :] = 0
        clean[:, :edge_guard] = 0
        clean[:, -edge_guard:] = 0
    return clean


def inpaint_writing_box(folio: Image.Image, box: dict, dw: int, dh: int) -> Image.Image:
    x0, y0, x1, y1 = box_px(box, dw, dh)
    if x1 <= x0 + 4 or y1 <= y0 + 4:
        return folio
    region = np.array(folio.crop((x0, y0, x1, y1)))
    mask = ink_mask_in_box(region)
    if mask.max() == 0:
        return folio
    fixed = cv2.inpaint(region, mask, 5, cv2.INPAINT_TELEA)
    out = folio.copy()
    out.paste(Image.fromarray(fixed), (x0, y0))
    return out


def process_leaf(ed: dict, key: str, dw: int, dh: int) -> Image.Image:
    raw = load_leaf(ed, key)
    return fit_stage(warm_paper(extract_page_symmetric(raw)), dw, dh)


def p3_filename(prefix: str) -> str:
    if prefix == "w569":
        return f"{prefix}-restored-p3-sade2.png"
    return f"{prefix}-restored-p3.png"


def process_edition(ed: dict, margin_box: dict, dw: int, dh: int) -> dict:
    eid = ed["id"]
    prefix = ed.get("storePrefix", eid.replace("pd-", ""))
    out_dir = os.path.join(RESTORED_ROOT, eid)
    pd_dir = os.path.join(PD_ROOT, eid)
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(pd_dir, exist_ok=True)
    os.makedirs(STORE_MEDIA, exist_ok=True)

    serlevha = ed.get("writingBoxSerlevha", {})
    wb_p1 = serlevha.get("p1", margin_box)
    wb_p2 = serlevha.get("p2", margin_box)

    raw_p1 = process_leaf(ed, "p1", dw, dh)
    raw_p2 = process_leaf(ed, "p2", dw, dh)
    raw_margin = process_leaf(ed, "margin", dw, dh)

    folio_p1 = inpaint_writing_box(raw_p1, wb_p1, dw, dh)
    folio_p2 = inpaint_writing_box(raw_p2, wb_p2, dw, dh)
    folio_margin = inpaint_writing_box(raw_margin, margin_box, dw, dh)

    folio_p1.save(os.path.join(out_dir, "serlevha-p1.webp"), "WEBP", quality=88, method=6)
    folio_p2.save(os.path.join(out_dir, "serlevha-p2.webp"), "WEBP", quality=88, method=6)
    folio_margin.save(os.path.join(out_dir, "sade2.webp"), "WEBP", quality=88, method=6)

    surah_start_box = None
    if ed.get("folio", {}).get("surahStart"):
        surah_start_box = {
            "top": 0.412,
            "left": 0.142,
            "width": 0.708,
            "height": 0.318,
        }
        raw_ss = fit_stage(
            warm_paper(
                extract_page_symmetric(
                    download_url(commons_url(ed["folio"]["surahStart"]))
                )
            ),
            dw,
            dh,
        )
        folio_ss = inpaint_writing_box(raw_ss, surah_start_box, dw, dh)
        folio_ss.save(os.path.join(out_dir, "surah-start.webp"), "WEBP", quality=88, method=6)

    folio_p1.save(os.path.join(pd_dir, "folio-p1.webp"), "WEBP", quality=86, method=6)
    folio_p2.save(os.path.join(pd_dir, "folio-p2.webp"), "WEBP", quality=86, method=6)
    folio_margin.save(os.path.join(pd_dir, "folio-margin.webp"), "WEBP", quality=86, method=6)

    blank = inpaint_writing_box(raw_margin, margin_box, dw, dh)
    blank.save(os.path.join(STORE_MEDIA, f"{prefix}-restored-blank-template.png"), "PNG")
    folio_p1.save(os.path.join(STORE_MEDIA, f"{prefix}-restored-p1-fatiha.png"), "PNG")
    folio_p2.save(os.path.join(STORE_MEDIA, f"{prefix}-restored-p2-bakara.png"), "PNG")
    folio_margin.save(os.path.join(STORE_MEDIA, p3_filename(prefix)), "PNG")

    return {
        "id": eid,
        "storePrefix": prefix,
        "nameTr": ed.get("nameTr", eid),
        "folioMapTr": ed.get("folioMapTr") or ed.get("spread", {}).get("folioMapTr", ""),
        "sade2Edition": ed.get("sade2Edition", False),
        "assets": {
            "folio": {
                "p1": f"/assets/mushaf/restored/{eid}/serlevha-p1.webp",
                "p2": f"/assets/mushaf/restored/{eid}/serlevha-p2.webp",
                "margin": f"/assets/mushaf/restored/{eid}/sade2.webp",
                "sade2": f"/assets/mushaf/restored/{eid}/sade2.webp",
            },
            "surahStart": f"/assets/mushaf/restored/{eid}/surah-start.webp"
            if surah_start_box
            else None,
        },
        "writingBox": {
            "margin": margin_box,
            "serlevha": serlevha,
            "sade2": margin_box,
            "surahStart": surah_start_box,
        },
        "proofPng": {
            "blank": f"media/{prefix}-restored-blank-template.png",
            "p1": f"media/{prefix}-restored-p1-fatiha.png",
            "p2": f"media/{prefix}-restored-p2-bakara.png",
            "p3": f"media/{p3_filename(prefix)}",
        },
        "provenance": {
            "licenseUrl": ed.get("licenseUrl", ""),
            "shelfmark": ed.get("shelfmark", ""),
            "institutionTr": ed.get("institutionTr", ""),
        },
    }


def write_screenshot_index(editions: list) -> None:
    shots = []
    for ed in editions:
        p = ed["proofPng"]
        for kind, rel in p.items():
            shots.append(
                {
                    "editionId": ed["id"],
                    "storePrefix": ed["storePrefix"],
                    "kind": kind,
                    "path": f"/cursor/stores/bc-114252f7-dc62-4152-81a7-76cb5dd7da05/{rel}",
                }
            )
    index_path = os.path.join(STORE_MEDIA, "restored-pd-screenshots-index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(
            {"schema": 1, "cacheKey": CACHE_KEY, "count": len(shots), "shots": shots},
            f,
            ensure_ascii=False,
            indent=2,
        )
    print("wrote", index_path)


def main() -> int:
    with open(SRC, encoding="utf-8") as f:
        cfg = json.load(f)
    dw = cfg["design"]["stageW"]
    dh = cfg["design"]["stageH"]
    margin_box = cfg["writingBoxMargin"]
    editions_out = []
    for ed in cfg["editions"]:
        print("restore", ed["id"], "...")
        editions_out.append(process_edition(ed, margin_box, dw, dh))
        time.sleep(2)
    manifest = {
        "schema": 5,
        "cacheKey": CACHE_KEY,
        "verifiedOn": cfg["verifiedOn"],
        "design": cfg["design"],
        "writingBoxMargin": margin_box,
        "editions": editions_out,
        "w569Sade2Manifest": "/assets/mushaf/restored/pd-walters-w569/manifest.json",
    }
    for ed in editions_out:
        sub = {k: v for k, v in ed.items() if k != "proofPng"}
        with open(
            os.path.join(RESTORED_ROOT, ed["id"], "manifest.json"),
            "w",
            encoding="utf-8",
        ) as f:
            json.dump(sub, f, ensure_ascii=False, indent=2)
    with open(os.path.join(RESTORED_ROOT, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    # Update pd/manifest.json cache key + writing boxes from restored
    pd_manifest_path = os.path.join(PD_ROOT, "manifest.json")
    if os.path.isfile(pd_manifest_path):
        with open(pd_manifest_path, encoding="utf-8") as f:
            pd_m = json.load(f)
        pd_m["cacheKey"] = CACHE_KEY
        for re in editions_out:
            for pe in pd_m.get("editions", []):
                if pe["id"] == re["id"]:
                    pe["writingBox"] = re["writingBox"]
                    pe["assets"]["folio"] = {
                        "p1": f"/assets/mushaf/pd/{re['id']}/folio-p1.webp",
                        "p2": f"/assets/mushaf/pd/{re['id']}/folio-p2.webp",
                        "margin": f"/assets/mushaf/pd/{re['id']}/folio-margin.webp",
                    }
        with open(pd_manifest_path, "w", encoding="utf-8") as f:
            json.dump(pd_m, f, ensure_ascii=False, indent=2)
    write_screenshot_index(editions_out)
    print("wrote", os.path.join(RESTORED_ROOT, "manifest.json"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
