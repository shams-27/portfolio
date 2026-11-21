# AGENTS.md

## Overview

Static single-page personal portfolio for Shams Kabir (`https://shams.swe.bd/`), built with vanilla HTML5, CSS3, and ES2020+ JavaScript. Uses zero build tools, frameworks, or npm dependencies; loads one Google Font (`Inter` 400–800) and fetches dynamic content from published Google Sheets CSV endpoints. Visual style: Swiss Style (International Typographic Style).

## Structure

```text
.
├── index.html       # Semantic single-page markup, SEO/OG tags, inline SVGs, and section shells
├── style.css        # Swiss Style tokens, 12-column grid, sticky stacking, and animations
├── script.js        # Google Sheets CSV parser/cache, sticky height observer, anchor scroll, UI controls
├── Shams.jpg        # Hero portrait (800x1000, 4:5 crop) in .hero-photo; Shams-400.jpg is the 400px srcset variant
├── achievement.jpg  # DIU CodeTrap Spring 2025 4th-place trophy photo (960x1310, cropped to the trophy) in #detailed-about; achievement-480.jpg is the 480px srcset variant
├── og-image.png     # 1200x630 Open Graph / Twitter social preview card (still the old dark neo-brutalist design; regenerate in Swiss Style)
└── Shams.jpeg       # Unused portrait asset in root; do not delete unless asked
```

## Commands

Serve locally over HTTP (required for `navigator.clipboard` secure-context testing and clean `fetch()` behavior):

```bash
python3 -m http.server 8000
```

## Conventions

* **Swiss Style visual system**: One typeface (`Inter`, weights 400–800) set flush-left, ragged-right, with tight negative tracking on large headings. Structure comes from rules and the grid, not decoration: `2px solid var(--black)` rules (`--rule`) between sections and cards, `1px` hairlines (`--hair`, `--soft`) between items inside a card, zero `border-radius` (including `rx="0"` on SVG rects), no box shadows, no rotation, no gradients or background patterns. Colour is white `--bg`, paper-grey `--bar`, black `--ink`/`--black`, grey `--muted`, and one accent, red `--accent`, used for the strip band, section numbers, the logo square, hover states and focus rings. Do not add a second accent colour. Photos (`.hero-photo img`, `.trophy img`) are shown in full colour with no filters; every photo has a `2px solid var(--black)` border (`--rule`); give any new `<img>` the same.
* **12-column grid**: Sections place the title in columns 1–4 and content in columns 5–12 (`.section-grid` at ≥860px). Projects is the exception: its title and card list span all 12 columns. The hero uses the same 12 columns (text 1–8, portrait 9–12). Align new content to these columns.
* **Light mode only**: The site is a single light theme (`color-scheme: only light`, `darkreader-lock`, `localStorage.removeItem('theme')`). Never add theme toggles or `@media (prefers-color-scheme: ...)` rules. The only inverted surface is the `.strip` band (red, white text), which resets `--ink` to white locally. Style new sections with `--bg`, `--bar`, `--black` and `--accent`.
* **Section numbers**: `.sec-title::before` shows a CSS counter (`01`–`06`) in red. It follows DOM order of `.sec-title` elements, so reordering or adding sections renumbers them automatically; keep nav order and section order the same.
* **Google Sheets as CMS**: `#projects` and `#skills` render dynamically from CSV URLs in `SHEETS` (`script.js`) using stale-while-revalidate `localStorage` caching (`sheet:projects`, `sheet:skills`). Edit the source spreadsheet instead of hardcoding items in `index.html`.
* **XSS-safe DOM rendering**: Never assign CSV values to `innerHTML`; create elements via `el()` (`textContent`) and sanitize links with `safeUrl()`.
* **Accessible motion**: Gate all CSS animations and transitions behind `@media (prefers-reduced-motion: no-preference)` (or neutralise them in the `reduce` block at the end of `style.css`) and check `prefersReducedMotion` in `script.js` before smooth scrolling or reveal observers. Motion is limited to the hero entrance, card scroll-in, and the mobile traits-strip loop; do not add hover lifts or other scattered effects.

## Quirks

* **Sticky-section stacking**: Every `main > section` uses `position: sticky` driven by `--h` and `--hdr` custom properties updated via `ResizeObserver` in `script.js`. Any new section in `<main>` **must** declare an opaque `background-color` so lower sections do not bleed through (`main > section` sets `--bg`; `#skills` and `#contact` use `--bar`).
* **Custom `#anchor` scrolling**: Native browser hash jumps fail on sticky sections; preserve the `a[href^="#"]` offset calculator in `script.js` that sums preceding `stackItems` heights.
* **Google Sheets CSV schemas**: Expected lowercase headers:
  * `projects`: `name`, `description`, `stack`, `live_url`, `github_url`, `order` (optional numeric), `visible` (`false`/`no`/`0`/`hidden` hides row).
  * `skills`: `category`, `skill`, `full_name` (optional `<abbr title>`), `visible`.
* **Skills markup**: `script.js` renders each category `<dt>` with class `wrap`; `style.css` neutralises its max-width and padding (`.skill-row dt.wrap`) so it sits on the grid. Keep that override if the class is touched.
* **Async layout stability**: Keep `min-height` on `#projects .list` (`22rem`) and `#skills .skills` (`18rem`) so sticky sections do not jump when CSV rows load.
* **Hero fills the first screen on every device**: `.hero` has `min-height: calc(100svh - var(--hdr) - var(--strip-h))` so hero + traits strip equal one viewport. `--strip-h` (strip height) is defined per breakpoint: ≥860px in the desktop block, ≤859px in the "one tidy column" block, and overridden at ≤639px (the strip's padding is smaller there). If the strip's padding, font-size or border changes, update all three `--strip-h` values. On ≤859px `.hero` is `display: flex` and `.hero-grid` uses `justify-content: center`, so the content sits centred in the spare height; on tall phones the extra space is split above and below.
* **Hero**: The animated background grid and the `.hero.is-covered` scroll toggle were removed with the neo-brutalist theme; the hero is static apart from the entrance animation. `.hero-photo img` is a 4:5 crop with `object-fit: cover`; keep the 4:5 ratio when swapping the image. On desktop it sits in columns 9–12 and is capped at `56vh` wide so it fits the first screen.
* **Hero on phones (≤639px)**: the lead text and the portrait sit side by side in a two-column grid; the lead is vertically centred (`align-self: center`) against the portrait. Keep that alignment when editing.
* **Image sizing**: Photos are pre-resized (Lanczos, light sharpening, quality 82) and served with `srcset`/`sizes`. Never let the browser shrink a large original to a small slot: a glittery or detailed photo (the trophy) turns noisy. When swapping a photo, export it at about 2x its largest display width, plus a half-size variant, and update `width`/`height` and the CSS `aspect-ratio` to match.
* **Traits strip**: On desktop the items are spaced evenly with absolutely positioned square separators; below 860px `script.js` duplicates the list and CSS loops it as a marquee (swipeable under reduced motion). The strip is outside the sticky stack (`position: relative`) and scrolls over the hero.
* **About on small screens**: Below 860px the trophy photo floats right and text wraps around it; from 860px it is the second column of `.about-top`. Keep the `figure` before the text in the markup.
* **Contact fills the screen**: `#contact` has `min-height` of one viewport minus the header so Projects never shows above it; keep it when editing.
* **Small devices**: The viewport meta uses `viewport-fit=cover`, so `--gutter`, the footer and the back-to-top button add `env(safe-area-inset-*)`. Tap targets are at least 44px (nav toggle, back-to-top, hero icon buttons); project links have vertical padding. Hover colour changes are wrapped in `@media (hover: hover)` so they do not stick on touch screens. The open mobile menu scrolls (`max-height` minus `--hdr`) on short screens. Breakpoints: 859px (single column, marquee strip), 767px (hamburger nav), 639px (compact phone UI), 359px (very small phones), plus a short-landscape rule. Test at 320px, 375px, 768px and landscape.
* **Font**: `--display` and `--sans` are both `Inter` (headings, body, labels, buttons). No monospace face is used. Headings rely on weight 800 with negative letter-spacing; do not go above weight 800.
