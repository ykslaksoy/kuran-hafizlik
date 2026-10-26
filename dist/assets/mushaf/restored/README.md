# PD mushaf restored masters (KHY-17)

Hand-restored **1000×1610** PNG templates per PD edition. Consumed by `scripts/fetch-pd-mushaf-assets.py` when present; **no margin-tile patching**.

## Layout per edition (`<edition-id>/`)

| File | Use |
|------|-----|
| `blank.png` | Store / QA template (optional in fetch) |
| `p1.png` | Serlevha p1 folio → `folio-p1.webp` |
| `p2.png` | Serlevha p2 folio → `folio-p2.webp` |
| `p3.png` | Margin page p3+ → `folio-margin.webp` |

Edition ids match `scripts/pd-mushaf-sources.json` (`pd-mehmed-sevki-ssm`, `pd-ruzbihan-cbl-1558`, …).

## Project store copies (Restorer deliverable)

Parallel agent **bc-b5304c32** ships **24 PNG** (6 families × blank+p1+p2+p3) under the project agent store `media/` — not duplicated here until merged.

After merge: copy or symlink into this directory, then run `npm run fetch:pd-mushaf`.
