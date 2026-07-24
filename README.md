# ◈ NEXUS — Where Web3 projects meet capital

An immersive, animation-heavy discovery platform for the Web3 space. Projects post their pitch and blurb; investors explore, filter, and connect with the teams behind them.

**The experience:**
- 🌌 WebGL hero — a 9,000-particle spiral galaxy (Three.js custom shaders) that reacts to your cursor and scroll
- 🎞️ GSAP + ScrollTrigger scroll choreography, Lenis smooth scrolling, staggered reveals
- 🧲 Magnetic buttons, 3D-tilt project cards with pointer-tracked glare, custom glowing cursor
- 📡 Live project ticker, animated counters, page-transition wipe, glitch 404
- ♿ Full `prefers-reduced-motion` fallback (also covers missing WebGL)

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Landing — hero, stats, how-it-works story, trending projects |
| `explore.html` | Directory — filter by category/chain, search, sort, animated re-layout |
| `project.html?id=<slug>` | Full pitch, raise snapshot, team, links, **Connect** modal |
| `submit.html` | 3-step animated wizard to post a project (live instantly) |
| `404.html` | Glitch not-found page |
| `portfolio.html` | Silas's original portfolio (preserved) |

## Run it locally

The site fetches `data/projects.json`, so serve over HTTP (not `file://`):

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

No build step. All libraries (Three.js, GSAP, ScrollTrigger, Lenis) and fonts are vendored in `assets/vendor` and `assets/fonts` — the site is fully self-contained.

## Architecture

```
assets/js/
├── store.js       Data layer: seed JSON + localStorage overlay  ← swap for a real API here
├── animations.js  Shared runtime: nav/footer injection, Lenis, reveals, tilt, cursor, modals
├── webgl.js       Three.js galaxy hero
├── home.js        Landing choreography, ticker, featured grid
├── explore.js     Filters, search, sort, FLIP-style re-layout
├── project.js     Detail renderer + Connect modal
└── submit.js      Wizard, validation, confetti
data/projects.json Seed dataset (10 demo projects — illustrative only)
```

**Data model:** this is a static deployment (GitHub Pages), so there is no server. Seed projects ship in `data/projects.json`; projects submitted through the wizard persist to `localStorage` and appear instantly in the directory *in that browser*. Every UI component talks only to `window.NexusStore` — to go multi-user, reimplement `getAll` / `getBySlug` / `saveSubmission` in `store.js` against a real backend (Supabase, Firebase, or your own API) and nothing else needs to change.

## Deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which publishes the repo root to GitHub Pages.

One-time setup: in the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
