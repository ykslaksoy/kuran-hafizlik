#!/usr/bin/env python3
"""Regenerate Amentü Mishari clip from EveryAyah Alafasy ayahs."""
from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "assets" / "audio" / "amentu-mishari-v1.mp3"
ALSO = ROOT / "assets" / "audio" / "amentu-mishari-v1.mp3"
BASE = "https://everyayah.com/data/Alafasy_128kbps"
AYAH = ("002285.mp3", "003008.mp3")


def main() -> None:
    work = Path(tempfile.mkdtemp(prefix="amentu-mishari-"))
    try:
        for name in AYAH:
            dest = work / name
            subprocess.check_call(["curl", "-fsSL", "--retry", "3", "-o", str(dest), f"{BASE}/{name}"])
        out = work / "out.mp3"
        subprocess.check_call(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(work / AYAH[0]),
                "-i",
                str(work / AYAH[1]),
                "-filter_complex",
                "[0:a]loudnorm=I=-16:LRA=11:TP=-1.5,afade=t=in:st=0:d=0.08[a0];"
                "[1:a]loudnorm=I=-16:LRA=11:TP=-1.5,afade=t=in:st=0:d=0.08[a1];"
                "anullsrc=r=44100:cl=stereo:d=0.7[s];"
                "[a0][s][a1]concat=n=3:v=0:a=1[out]",
                "-map",
                "[out]",
                "-c:a",
                "libmp3lame",
                "-b:a",
                "128k",
                "-ar",
                "44100",
                "-ac",
                "2",
                str(out),
            ]
        )
        OUT.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(out, OUT)
        ALSO.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(out, ALSO)
        print("wrote", OUT, OUT.stat().st_size)
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
