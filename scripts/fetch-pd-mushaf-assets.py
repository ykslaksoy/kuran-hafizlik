#!/usr/bin/env python3
"""Download PD-verified mushaf scans; build frame + paper + scan WebP assets."""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.parse
import urllib.request

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "pd-mushaf-sources.json")
OUT = os.path.join(ROOT, "dist", "assets", "mushaf", "pd")
UA = "HafizyolBot/1.0 (PD asset fetch; ykslaksoy/kuran-hafizlik)"


def commons_url(title: str) -> str:
    api = (
        "https://commons.wikimedia.org/w/api.php?action=query&titles="
        + urllib.parse.quote(title)
        + "&prop=imageinfo&iiprop=url|extmetadata&format=json"
    )
    req = urllib.request.Request(api, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = json.load(r)
    pages = data.get("query", {}).get("pages", {})
    for p in pages.values():
        if p.get("missing"):
            raise RuntimeError("Commons file missing: " + title)
        ii = p["imageinfo"][0]
        lic = ii.get("extmetadata", {}).get("LicenseShortName", {}).get("value", "")
        if "public domain" not in lic.lower() and "pd" not in lic.lower():
            raise RuntimeError(f"License not PD for {title}: {lic}")
        return ii["url"]
    raise RuntimeError("No imageinfo for " + title)


def download(url: str, dest: str) -> None:
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=180) as r:
        raw = r.read()
    with open(dest, "wb") as f:
        f.write(raw)


def fit_width(img: Image.Image, w: int) -> Image.Image:
    if img.width <= w:
        return img
    h = int(img.height * (w / img.width))
    return img.resize((w, h), Image.Resampling.LANCZOS)


def center_crop_fraction(img: Image.Image, fx: float, fy: float) -> Image.Image:
    """Crop central fraction (fx, fy) of image size."""
    cw = int(img.width * fx)
    ch = int(img.height * fy)
    left = (img.width - cw) // 2
    top = (img.height - ch) // 2
    return img.crop((left, top, left + cw, top + ch))


def process_edition(ed: dict) -> dict:
    eid = ed["id"]
    edir = os.path.join(OUT, eid)
    os.makedirs(edir, exist_ok=True)

    frame_title = ed.get("frameCommonsTitle") or ed.get("commonsTitle")
    scan_title = ed.get("scanCommonsTitle") or ed.get("commonsTitle")

    if ed.get("directUrl") and not ed.get("commonsTitle"):
        frame_url = ed["directUrl"]
        scan_url = ed.get("scanDirectUrl") or frame_url
    elif ed.get("directUrl"):
        frame_url = ed["directUrl"]
        scan_url = ed.get("scanDirectUrl") or (commons_url(scan_title) if scan_title else frame_url)
    else:
        frame_url = commons_url(frame_title)
        scan_url = commons_url(scan_title) if scan_title else frame_url

    raw_frame = os.path.join(edir, "_frame_src.jpg")
    raw_scan = os.path.join(edir, "_scan_src.jpg")
    download(frame_url, raw_frame)
    if scan_url != frame_url:
        download(scan_url, raw_scan)
    else:
        raw_scan = raw_frame

    frame_img = Image.open(raw_frame).convert("RGB")
    scan_img = Image.open(raw_scan).convert("RGB")

    frame_full = fit_width(frame_img, 1000)
    scan_full = fit_width(scan_img, 1000)
    paper = center_crop_fraction(frame_img, 0.52, 0.58)
    paper = fit_width(paper, 888)

    frame_full.save(os.path.join(edir, "frame-full.webp"), "WEBP", quality=82, method=6)
    paper.save(os.path.join(edir, "paper-infill.webp"), "WEBP", quality=80, method=6)
    scan_full.save(os.path.join(edir, "scan-folio.webp"), "WEBP", quality=82, method=6)

    for p in (raw_frame, raw_scan):
        if os.path.basename(p).startswith("_") and os.path.exists(p):
            try:
                os.remove(p)
            except OSError:
                pass

    return {
        "id": eid,
        "assets": {
            "frame": f"/assets/mushaf/pd/{eid}/frame-full.webp",
            "paper": f"/assets/mushaf/pd/{eid}/paper-infill.webp",
            "scan": f"/assets/mushaf/pd/{eid}/scan-folio.webp",
        },
        "provenance": {
            "nameTr": ed["nameTr"],
            "institutionTr": ed["institutionTr"],
            "shelfmark": ed["shelfmark"],
            "licenseTr": ed["licenseTr"],
            "licenseUrl": ed.get("licenseUrl", ""),
            "frameSource": frame_url,
            "scanSource": scan_url,
            "verifiedOn": "2026-10-26",
        },
    }


def main() -> int:
    with open(SRC, encoding="utf-8") as f:
        cfg = json.load(f)
    manifest = {"schema": 2, "verifiedOn": cfg["verifiedOn"], "editions": []}
    for ed in cfg["editions"]:
        print("fetch", ed["id"], "...")
        manifest["editions"].append(process_edition(ed))
    out_manifest = os.path.join(OUT, "manifest.json")
    with open(out_manifest, "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print("wrote", out_manifest)
    return 0


if __name__ == "__main__":
    sys.exit(main())
