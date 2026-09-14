#!/usr/bin/env python3
"""Amentü kaydı: doğru iman metni + Alafasy Âl-i İmrân 8. Bakara 285 yok."""
from __future__ import annotations

import asyncio
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "assets" / "audio" / "amentu-v2.mp3"
ALSO = ROOT / "assets" / "audio" / "amentu-v2.mp3"
RABBENA = "https://everyayah.com/data/Alafasy_128kbps/003008.mp3"

PHRASES = [
    "آمَنْتُ بِاللهِ",
    "وَمَلَائِكَتِهِ",
    "وَكُتُبِهِ",
    "وَرُسُلِهِ",
    "وَالْيَوْمِ الْآخِرِ",
    "وَبِالْقَدَرِ خَيْرِهِ وَشَرِّهِ مِنَ اللهِ تَعَالَى",
    "وَالْبَعْثِ بَعْدَ الْمَوْتِ",
]

# 32 kelime (metindeki ۖ ayrı token). playHocaReadingWithFollow bu saniyeleri kullanır.
# İlk 16: HamedNeural cümleleri (enerji analizi). Son 16: Alafasy 3:8 + 23.73s ofset.
# Ses yeniden üretilirse bu zamanlar ve dist entry içindeki W dizisi güncellenmeli.
WORD_STARTS_SEC = [
    0.24, 0.68, 3.12, 6.06, 8.67, 11.27, 12.00, 14.36,
    14.85, 15.30, 16.08, 16.40, 17.30, 19.71, 20.00, 20.28,
    23.86, 24.87, 25.23, 25.89, 27.25, 27.89, 28.26, 29.63,
    30.34, 31.04, 31.21, 33.25, 34.56, 34.56, 36.06, 37.44,
]


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd)


async def synth(work: Path) -> None:
    import edge_tts

    for i, phrase in enumerate(PHRASES):
        dest = work / f"p{i:02d}.mp3"
        await edge_tts.Communicate(phrase, "ar-SA-HamedNeural", rate="-18%", pitch="-2Hz").save(
            str(dest)
        )


def main() -> None:
    work = Path(tempfile.mkdtemp(prefix="amentu-v2-"))
    try:
        asyncio.run(synth(work))
        run(["curl", "-fsSL", "--retry", "3", "-o", str(work / "003008.mp3"), RABBENA])
        wavs = []
        for i in range(len(PHRASES)):
            wav = work / f"p{i:02d}.wav"
            run(
                [
                    "ffmpeg",
                    "-y",
                    "-hide_banner",
                    "-loglevel",
                    "error",
                    "-i",
                    str(work / f"p{i:02d}.mp3"),
                    "-ar",
                    "44100",
                    "-ac",
                    "2",
                    "-af",
                    "loudnorm=I=-16:LRA=11:TP=-1.5",
                    str(wav),
                ]
            )
            wavs.append(wav)
        sil42 = work / "sil42.wav"
        sil75 = work / "sil75.wav"
        run(
            [
                "ffmpeg",
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=44100:cl=stereo",
                "-t",
                "0.42",
                str(sil42),
            ]
        )
        run(
            [
                "ffmpeg",
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=44100:cl=stereo",
                "-t",
                "0.75",
                str(sil75),
            ]
        )
        rabbena = work / "rabbena.wav"
        run(
            [
                "ffmpeg",
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-i",
                str(work / "003008.mp3"),
                "-ar",
                "44100",
                "-ac",
                "2",
                "-af",
                "loudnorm=I=-16:LRA=11:TP=-1.5,afade=t=in:st=0:d=0.1",
                str(rabbena),
            ]
        )
        concat = work / "concat.txt"
        lines = []
        for wav in wavs:
            lines.append(f"file '{wav}'")
            lines.append(f"file '{sil42}'")
        lines.append(f"file '{sil75}'")
        lines.append(f"file '{rabbena}'")
        concat.write_text("\n".join(lines) + "\n")
        OUT.parent.mkdir(parents=True, exist_ok=True)
        run(
            [
                "ffmpeg",
                "-y",
                "-hide_banner",
                "-loglevel",
                "error",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat),
                "-c:a",
                "libmp3lame",
                "-b:a",
                "128k",
                "-ar",
                "44100",
                "-ac",
                "2",
                str(OUT),
            ]
        )
        ALSO.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(OUT, ALSO)
        print("wrote", OUT, OUT.stat().st_size)
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
