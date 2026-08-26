# Profile illustrations

The onboarding profile picker (`src/pages/Onboarding.tsx`) loads one image per
role from this folder. Drop the artwork in with these exact filenames:

| File            | Card         |
| --------------- | ------------ |
| `coach.png`     | Coach        |
| `manager.png`   | Manager      |
| `player.png`    | Player       |
| `fan.png`       | Fan          |
| `enthusiast.png`| Enthusiast   |

Specs:

- **Square** (1:1). They are rendered inside a circular, ink-bordered mask at
  92px (grid cards) and 76px (the wide Enthusiast card) — export at **256×256**
  or larger for retina.
- **Transparent or white background.** The mask sits on `--surface-high`
  (white), so a transparent PNG blends in on every card colour.
- Keep the head centred with a little headroom; the circular crop clips corners.

Any file that is missing or fails to load falls back to a neutral
head-and-shoulders glyph, so the screen never breaks — it just looks plain.
