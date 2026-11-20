# CLAUDE.md

## Overview

Static single-page personal portfolio for Shams Kabir (`https://shams.swe.bd/`), built with vanilla HTML5, CSS3, and ES2020+ JavaScript. Uses zero build tools, frameworks, or npm dependencies; loads Google Fonts (`Archivo`, `IBM Plex Sans`) and fetches dynamic content from published Google Sheets CSV endpoints.

## Structure

```
.
├── index.html       # Semantic single-page markup, SEO/OG tags, inline SVGs, and section shells
├── style.css        # Neo-brutalist tokens, responsive grids, sticky stacking, and animations
├── script.js        # Google Sheets CSV parser/cache, sticky height observer, anchor scroll, UI controls
├── achievement.jpg  # DIU CodeTrap Spring 2025 4th-place trophy photo (800x1091) in #detailed-about
├── og-image.png     # 1200x630 Open Graph / Twitter social preview card
└── Shams.jpeg       # Unused portrait asset in root; do not delete or swap into .hero-photo unless asked
```

## Commands

Serve locally over HTTP (required for `navigator.clipboard` secure-context testing and `fetch()`):

```bash
python3 -m http.server 8000
```

## Conventions

- **Neo-brutalist visual system**: Maintain flat surfaces (`--bg`, `--card`, `--c1`, `--c2`, `--c3`), `3px solid var(--ink)` borders (`--bw`), hard offset shadows (`4px`–`8px`), and zero `border-radius` (including `rx="0"` on SVG rects) so components match the tactile aesthetic. Cycle card accents with `:nth-child(3n + 1/2/0)`.
- **Light-mode only**: Dark mode was intentionally removed (`color-scheme: only light`, `darkreader-lock`, `localStorage.removeItem('theme')`). Never add dark-mode toggles or `@media (prefers-color-scheme: dark)` rules; style new sections using `--bg`, `--card`, and `--c1`–`--c3` with `--ink` text.
- **Google Sheets as CMS**: `#projects` and `#skills` render dynamically from CSV URLs in `SHEETS` (`script.js`) using stale-while-revalidate `localStorage` caching (`sheet:projects`, `sheet:skills`). Edit the source spreadsheet instead of hardcoding items in `index.html`.
- **XSS-safe DOM rendering**: Never assign CSV values to `innerHTML`; create elements via `el()` (`textContent`) and sanitize links with `safeUrl()`.
- **Accessible motion**: Gate all CSS animations and transitions behind `@media (prefers-reduced-motion: no-preference)` and check `prefersReducedMotion` in `script.js` before smooth scrolling or reveal observers.

## Quirks

- **Sticky-section stacking**: Every `main > section` uses `position: sticky` driven by `--h` and `--hdr` custom properties updated via `ResizeObserver` in `script.js`. Any new section in `<main>` **must** declare an opaque `background-color` so lower sections do not bleed through.
- **Custom `#anchor` scrolling**: Native browser hash jumps fail on sticky sections; preserve the `a[href^="#"]` offset calculator in `script.js` that sums preceding `stackItems` heights.
- **Google Sheets CSV schemas**: Expected lowercase headers:
  - `projects`: `name`, `description`, `stack`, `live_url`, `github_url`, `order` (optional numeric), `visible` (`false`/`no`/`0`/`hidden` hides row).
  - `skills`: `category`, `skill`, `full_name` (optional `<abbr title>`), `visible`.
- **Async layout stability**: Keep `min-height` on `#projects .list` (`22rem`) and `#skills .skills` (`18rem`) so sticky sections do not jump when CSV rows load.
- **Hero animation pause**: `onScroll()` toggles `.hero.is-covered` once scrolled past the hero height to pause infinite background grid and SVG drone keyframes (`animation-play-state: paused`).