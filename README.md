# Hoop Spot

A 3D basket-guessing game. Watch a famous play animate on an NBA court, then pick who scored from four names. Built on the Goal Spot engine, retuned for basketball.

**Live:** https://hoop-spot.vercel.app *(once deployed)*

## What's in the box

- Five hand-authored famous baskets: Ray Allen 2013, Dame Time 2019, MJ The Shot 1989, Kawhi's bouncer 2019, Curry from the logo.
- NBA-accurate court geometry (28.65 × 15.24 m, hoops at ±12.75 m, real three-point arcs).
- Shot-type-driven physics: jump shots arc 4 m, threes arc 4.8 m, layups skim 1.4 m, dunks drive low.
- Cinematic camera shots (wide, follow, baseline, dribble chase, swish-cam under the rim, cable cam).
- Procedural basketball texture with seams + rolling spin.
- Downloadable Instagram-story-sized poster of every play.
- Real NBA team + league logos via ESPN CDN.

## Stack

- React + Vite + TypeScript
- three.js for the 3D scene
- Zustand for state
- Web Audio API for all sound (no asset files)
- Canvas API for procedural court/ball/poster textures

## Develop

```bash
npm install
npm run dev     # http://localhost:5173
npm run build
```

## Deploy

```bash
vercel          # link + preview deploy
vercel --prod   # production deploy
```

Vite is auto-detected — no `vercel.json` needed.

## Credits

Built on the Goal Spot engine. Sport-specific layers (court, hoop, ball physics, plays) ported for basketball. NBA team logos and league mark via ESPN's public CDN.
