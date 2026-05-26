# Basket Spot — Handover

> **Drop this entire file at the start of your new Claude session.** It explains the architecture you're inheriting and exactly what needs to change to turn Goal Spot (football) into Basket Spot (basketball).

---

## What this is

A clone of **Goal Spot** — a 3D football goal-guessing game that's been validated and polished over many sessions. We're now adapting it for basketball.

The core mechanic stays identical:
1. User watches a famous play animate on a 3D court
2. Picks who scored from 4 names
3. Five plays per round, score tracking, streak indicator
4. Cinematic camera angles, audio, downloadable poster, settings drawer

**About 75% of the codebase ports directly.** The remaining 25% is sport-specific (court geometry, ball physics, camera positions, data).

---

## Architecture at a glance

```
src/
  App.tsx                   — top-level screen router (splash → howto → game)
  main.tsx                  — React entry

  game/                     — React UI components (all reusable)
    Splash.tsx              — 3-button splash (Start / Pick your club / StatsBomb)
    HowToPlay.tsx           — onboarding screen
    Game.tsx                — main shell: header, progress pips, stage, panel
    SceneCanvas.tsx         — bridges React → Three.js scene
    MatchIntro.tsx          — pre-play intro card with team crests
    PitchCountdown.tsx      — 3-2-1 countdown overlay (RENAME → CourtCountdown)
    EventLabel.tsx          — waypoint labels during animation
    ScorerOptions.tsx       — 4-option A/B/C/D + Don't know
    ResultReveal.tsx        — slide-up verdict modal
    Cinematic.tsx           — letterbox bars + GOAL stinger
    StreakToast.tsx         — streak indicator
    RoundComplete.tsx       — end-of-round screen
    GoalMenu.tsx            — browse all plays (RENAME → PlayMenu)
    Settings.tsx            — toggles drawer (sound, cinematic, etc.)
    PosterPreview.tsx       — poster generation modal
    StatsBombMode.tsx       — REMOVE (no equivalent for basketball)
    ClubMode.tsx            — REMOVE (or rewire to NBA team list)

  scene/                    — Three.js scene + game animation
    Scene.ts                — top-level scene + camera tick loop + atmosphere
    pitch.ts                — pitch builder (REPLACE with court.ts)
    stadium.ts              — backdrop + sponsor boards (RENAME → arena.ts)
    goal.ts                 — goal posts + net (REPLACE with hoop.ts)
    ball.ts                 — ball mesh + move(from, to, arc) — KEEP, tweak physics
    trail.ts                — pass/dribble visualisation — KEEP
    animator.ts             — plays waypoints through the scene — KEEP
    cameras.ts              — DYNAMIC_SHOTS dictionary — REWRITE for basketball
    textures/
      pitch-texture.ts      — REPLACE with court-texture.ts (parquet wood)
      stadium-texture.ts    — REPLACE with arena-texture.ts (arena crowd)

  data/
    types.ts                — Goal type, Waypoint type — KEEP STRUCTURE, rename
    goals.ts                — 20 hand-authored football goals — REPLACE with plays.ts
    assets.ts               — team crest + competition logo lookup — UPDATE for NBA

  store/
    gameStore.ts            — Zustand: phase, score, queue, etc. — KEEP, rename "goal" → "play"
    settingsStore.ts        — toggles (audio, cinematic, etc.) — KEEP
    collectionStore.ts      — saved plays from external data — KEEP

  lib/
    audio.ts                — synthesized Web Audio (whistle, kick, roar) — TWEAK sounds
    poster.ts               — canvas-based 1080×1920 PNG poster — REWRITE for court layout
    goal-stats.ts           — passes/time/distance auto-compute — KEEP, tweak labels
    statsbomb.ts            — StatsBomb API integration — DELETE or replace
```

---

## What you can keep almost verbatim

These files port without sport-specific changes:

- `src/main.tsx` — entry
- `src/styles/` — design tokens, resets
- `src/store/settingsStore.ts` — same settings (audio, cinematic, lighting, etc.)
- `src/store/collectionStore.ts` — generic saved-items store
- `src/lib/audio.ts` — Web Audio synth (just swap the "kick" sound for a "ball bounce" or "swish")
- `src/lib/goal-stats.ts` — passes / duration / distance maths is universal
- `src/game/Settings.tsx`, `Cinematic.tsx`, `StreakToast.tsx`, `HowToPlay.tsx` — UI chrome
- `src/game/SceneCanvas.tsx` — Three.js mount, event wiring
- `src/game/Game.tsx` — main shell (just rename "Goal" to "Play" throughout)
- `src/game/ScorerOptions.tsx` — the 4-option chooser
- `src/game/ResultReveal.tsx` — verdict modal
- `src/game/MatchIntro.tsx` — pre-play card
- `src/game/PosterPreview.tsx` — preview modal
- `src/scene/ball.ts` — ball mesh + move physics
- `src/scene/trail.ts` — point cloud trail
- `src/scene/animator.ts` — waypoint-by-waypoint playback

---

## What needs full replacement

### 1. The court (was the pitch)

**Football pitch**: 110×60 metres rectangle, two goals at x ±55.
**Basketball court**: 28.7×15.2 metres (FIBA) or 28.65×15.24 (NBA). Two hoops on the baselines.

Replace `src/scene/pitch.ts` with `src/scene/court.ts`:
- Wooden parquet texture (Lakers, Celtics, Bulls patterns are great references)
- Three-point arc (6.75m FIBA, 7.24m NBA)
- Key/paint (4.9×5.8m, includes the no-charge semicircle)
- Free-throw line + circle
- Half-court line + centre circle
- Sideline + baseline

Update coordinate system in `data/types.ts`:
- Old: `x ∈ [-55, 55]`, `z ∈ [-30, 30]`
- New: `x ∈ [-14.35, 14.35]`, `z ∈ [-7.62, 7.62]` (using NBA in metres)

Update mapping everywhere from football's 110/60 to basketball's 28.7/15.24.

### 2. Hoops instead of goals

Replace `src/scene/goal.ts` with `src/scene/hoop.ts`:
- Backboard (1.8m wide × 1.05m tall, ~3.0m off the ground centre)
- Rim (0.45m diameter, 3.05m off the ground)
- Net (cylinder of strings)
- Stand/post behind backboard
- Position at x = ±14.35

### 3. Ball physics for basketball

`src/scene/ball.ts` — the `move()` arc logic mostly works, but:
- Add a **bounce dribble** mode: ball oscillates 0 → 0.8m → 0 over short segments
- Jump shots arc higher (peak 4-5m instead of football's 3.5m)
- Free throws are a fixed parabolic arc
- Three-pointers arc heavily

Add a new arc-mode field to Waypoint:
```ts
type ShotType = 'pass' | 'dribble' | 'jumpShot' | 'layup' | 'dunk' | 'three' | 'freeThrow';
```

The animator can pick arc height + sound based on `shotType` instead of just `dribble: boolean`.

### 4. Cameras

`src/scene/cameras.ts` — keep the DYNAMIC_SHOTS dictionary pattern, replace contents:
- `wide` → mid-court elevated, similar
- `follow` → courtside camera following the player carrying
- `side` → baseline cam
- `behind-goal` → BECOMES `behind-baseline` — behind the hoop looking out
- `close` → courtside at the basket
- `dribble` → low chase, knee-height
- `keeper-pov` → REMOVE (no keeper); replace with `swish-cam` — inside the hoop looking up at the rim as ball passes through
- `crowd-pan` → courtside crowd reaction
- `cable-cam` → high overhead sweep (works the same)

### 5. Arena instead of stadium

Rename `stadium.ts` → `arena.ts`. Key differences:
- **Indoor** — no sky, no weather (drop the rain system entirely)
- **Ceiling** — replace the top of the cylinder with a solid roof or fade-to-black
- **Lower roof line** — basketball arenas feel enclosed
- **Sponsor boards on the floor** (around the court markings)
- **Jumbotron** — square hanging in the centre showing scores/replays (could be a fun touch)
- **Tighter crowd** — closer to the court than football

### 6. Plays data (`data/plays.ts`)

This is the big content task. Famous baskets you'd want to author:

| Play | Who | When |
|---|---|---|
| The Block | LeBron James | 2016 NBA Finals Game 7 |
| Ray Allen's three | Ray Allen | 2013 NBA Finals Game 6 |
| Dame Time | Damian Lillard | 2019 R1 vs OKC |
| Kawhi's bouncer | Kawhi Leonard | 2019 R2 vs Sixers |
| Shot heard | Robert Horry | 2002 vs Kings |
| Flu game | Michael Jordan | 1997 Finals Game 5 |
| The Shot | Michael Jordan | 1989 vs Cavs |
| Curry from logo | Steph Curry | various 30+ ft threes |
| Tracy McGrady 13 in 33 | T-Mac | 2004 vs Spurs (closing run) |
| Kobe last game | Kobe Bryant | 2016 vs Jazz (60 points) |
| Magic's skyhook | Magic Johnson | 1987 Finals Game 4 |
| Bird steal + Henderson | Larry Bird | 1987 ECF Game 5 |
| Allen Iverson stepover | AI | 2001 Finals Game 1 |
| Mutombo block | Dikembe Mutombo | 1994 playoff finger wag |

Waypoint format stays the same:
```ts
{
  x, z, label, camera,
  shotType?: 'pass' | 'dribble' | 'three' | 'layup' | etc,
  arc?, endY?, isBasket?,    // was isGoal
  duration?
}
```

### 7. Data sources for the "StatsBomb" equivalent

There's no exact equivalent of StatsBomb's free open data for basketball, but options:

- **BallDontLie.io** — free NBA API, has games + box scores + player stats but **not play-by-play coordinates**
- **NBA.com/stats** — unofficial API, has shot charts with x/y coordinates per shot. Court is 50×47 feet, hoop at (25, 5.25).
- **NBA Stats Player Tracking** — Second Spectrum data, paid
- **Kaggle datasets** — several with NBA shot charts going back decades

For a "Pick Your Team" mode similar to football's club drill-down, BallDontLie can list all 30 NBA franchises + their seasons. For actual play reconstruction you'd need shot-chart x/y at minimum. Shot location alone won't give you a build-up — you'd need a different data source (e.g. scraping play-by-play descriptions to derive passers/assists).

**Recommendation for v1**: stick with the curated hand-authored set (20-30 famous plays). Add an external data integration in v2 when you've validated the experience.

### 8. Hand-authored content reset

`data/goals.ts` has all the football plays — delete that file and write `data/plays.ts` from scratch with the basketball list above.

`data/assets.ts` — replace football crests with NBA team logos. NBA logos are largely public-domain via Wikimedia / nba.com (with attribution). Map team names → SVG paths the same way.

---

## Naming refactor checklist

Throughout the codebase, mass rename:

| Football term | Basketball term |
|---|---|
| `goal` (the data object) | `play` or `basket` |
| `Goal Spot` | `Basket Spot` |
| `pitch` | `court` |
| `stadium` | `arena` |
| `meta.scorer` | keep as `scorer` |
| `isGoal: true` (waypoint flag) | `isBasket: true` |
| `goal-scored` (event) | `basket-scored` |
| `goal-stinger` | `basket-stinger` |
| `GOAL!` (stinger text) | `BUCKET!` or `SCORES!` |

Use a sed-style mass rename carefully — `goal` appears in lots of contexts. Better to do it module-by-module.

---

## Things to drop entirely

- `src/lib/statsbomb.ts` — no equivalent
- `src/game/StatsBombMode.tsx` + module.css
- `src/game/ClubMode.tsx` (or rewire if you connect to BallDontLie for NBA teams)
- Rain particle system in `Scene.ts` — basketball is indoor
- Weather field in `Goal.meta`
- Per-stadium weather tagging in plays data
- Lighting palettes can be simplified — basketball arenas are uniformly lit (no day/night/golden/dusk variety)

---

## Build commands

```bash
cd ~/projects/basket-spot
npm install            # fresh install (node_modules was excluded from the clone)
npm run dev            # dev server at http://localhost:5173
npm run build          # production build
```

---

## Starting your new Claude session — script

When you start the new session, open `~/projects/basket-spot` and tell Claude:

> "I'm building Basket Spot, a basketball version of a football game called Goal Spot that I've already shipped. The codebase has been cloned to this folder. Please read HANDOVER.md — it explains the architecture, what to keep, and what to rebuild for basketball. Then let's start by [replacing the pitch with a court / rewriting the data file / etc.]"

Suggested order of work:

1. **Foundation rename** (30 mins) — Mass rename `Goal Spot` → `Basket Spot`, `pitch` → `court`, etc.
2. **Court geometry** (1 hr) — Replace `pitch.ts` with `court.ts`, update coordinate system, replace court texture
3. **Hoops** (45 mins) — Replace `goal.ts` with `hoop.ts`, position at baselines
4. **Camera shots** (1 hr) — Rewrite `cameras.ts` for basketball-appropriate angles
5. **Ball physics** (30 mins) — Add bounce-dribble + arc-shot modes
6. **Arena** (1 hr) — Indoor backdrop, ceiling, jumbotron, courtside boards
7. **Data** (2+ hrs) — Write 10-20 hand-authored famous plays
8. **Poster generator** (1 hr) — Rewrite `lib/poster.ts` for court layout instead of pitch
9. **Polish + audio tweaks** (30 mins) — Swap kick sound for ball-bounce, swish, etc.

Total: ~7-8 hours of focused work to a playable basketball version.

---

## Reference: the football engine

The working Goal Spot is at `~/projects/ai-goalspot/`. When you get stuck, check how a feature works in the football version — copy the pattern, swap the sport.

Football live demo: **https://ai-goalspot.vercel.app**

---

## Save points (in case you want to revert)

Once you `git init` this folder and start committing, you'll have your own history. The Goal Spot reference has these checkpoints:

```
b9e2aac splash final polish
fcacb1f result modal + splash buttons
de2db19 pick your club
c5a9b89 stinger off + match intro
622fc19 cinematic specials
```

---

**Good luck — you've already done the hard part once. The basketball version is mostly content + court geometry on top of a proven engine.** 🏀
