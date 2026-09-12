#!/usr/bin/env python3
"""Regenerate dist/assets/audio/amentu-hoca-v1.mp3 (Amentü hoca reading)."""
from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist" / "assets" / "audio" / "amentu-hoca-v1.mp3"
ALSO = ROOT / "assets" / "audio" / "amentu-hoca-v1.mp3"
HUSARY = "https://everyayah.com/data/Husary_Muallim_128kbps/003008.mp3"

PHRASES = [
    "آمَنْتُ بِاللهِ",
    "وَمَلَائِكَتِهِ",
    "وَكُتُبِهِ",
    "وَرُسُلِهِ",
    "وَالْيَوْمِ الْآخِرِ",
    "وَبِالْقَدَرِ خَيْرِهِ وَشَرِّهِ مِنَ اللهِ تَعَالَى",
    "وَالْبَعْثِ بَعْدَ الْمَوْتِ",
]


def run(cmd: list[str]) -> None:
    subprocess.check_call(cmd)


async def synth(work: Path) -> None:
    import edge_tts

    voice = "ar-SA-HamedNeural"
    for i, phrase in enumerate(PHRASES):
        dest = work / f"p{i:02d}.mp3"
        await edge_tts.Communicate(phrase, voice, rate="-18%", pitch="-2Hz").save(str(dest))


def main() -> None:
    work = Path(tempfile.mkdtemp(prefix="amentu-"))
    try:
        asyncio.run(synth(work))
        run(["curl", "-fsSL", "--retry", "3", "-o", str(work / "003008.mp3"), HUSARY])
        wavs = []
        for i in range(len(PHRASES)):
            wav = work / f"p{i:02d}.wav"
            run(
                [
                    "ffmpeg",
                    "-y",
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
        sil85 = work / "sil85.wav"
        run(
            [
                "ffmpeg",
                "-y",
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
                "-f",
                "lavfi",
                "-i",
                "anullsrc=r=44100:cl=stereo",
                "-t",
                "0.85",
                str(sil85),
            ]
        )
        rabbena = work / "rabbena.wav"
        run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(work / "003008.mp3"),
                "-ar",
                "44100",
                "-ac",
                "2",
                "-af",
                "loudnorm=I=-16:LRA=11:TP=-1.5,afade=t=in:st=0:d=0.12",
                str(rabbena),
            ]
        )
        concat = work / "concat.txt"
        lines = []
        for wav in wavs:
            lines.append(f"file '{wav}'")
            lines.append(f"file '{sil42}'")
        lines.append(f"file '{sil85}'")
        lines.append(f"file '{rabbena}'")
        concat.write_text("\n".join(lines) + "\n")
        OUT.parent.mkdir(parents=True, exist_ok=True)
        run(
            [
                "ffmpeg",
                "-y",
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
