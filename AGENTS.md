# Project Map — Shams Kabir Portfolio
- **URL**: https://shams.swe.bd/
- **Stack**: Vanilla HTML5, CSS3, ES2020+ (no npm/frameworks) | Local: `python3 -m http.server 8000` | Python stdlib helper scripts
- **Entry & Markup**: `index.html` (SEO, JSON-LD `ProfilePage` + `WebSite`, static `#writing` entries, generated fallbacks for Projects/Tech stack)
- **Styles**: `style.css` (Swiss Style, `--accent: #E4002B`, 12-col grid, sticky sections, self-hosted `@font-face`)
- **Logic & CMS**: `script.js` (Sheets CSV parser/cache, `ResizeObserver` for `--h`/`--hdr`, nav/scroll UI, local-first Devicon icons)
- **Scripts**: `build_content.py` (regenerates static section fallbacks), `checks.py` (validation + `checks.py --bump` for SW version)
- **Offline Cache**: `sw.js` (network-first pages, stale-while-revalidate local assets, `/offline.html` fallback; currently `portfolio-cache-v38`)
- **Assets**: `fonts/` (self-hosted woff2 + OFL licences), `icons/` (self-hosted Devicon 2.18 SVGs), `content_cache/` (CSV snapshot + SW fingerprint)
- **Articles**: `posts/template.html`, `posts/*.html` (with `BlogPosting` JSON-LD)
- **Current focus**: Testing `#writing` section (`hidden` removed from `#writing` and its nav `<li>` in `index.html`; re-add both to hide)

## Critical Invariants (Do Not Break)
- **Service Worker**: After ANY change to a cached asset (`index.html`, `style.css`, `script.js`, fonts, icons, posts, etc.), run `python3 checks.py --bump` — it increments `CACHE_NAME`, updates this file, and records the asset fingerprint. `python3 checks.py` fails if the fingerprint is stale. Never precache `codeTrapStanding.jpg`.
- **Generated blocks**: Keep `<!-- CONTENT:projects:start/end -->` and `<!-- CONTENT:skills:start/end -->` markers in `index.html`; regenerate with `python3 build_content.py` (or `--offline` from `content_cache/`). Never hand-edit the generated markup.
- **Sticky Header**: Keep sticky rule scoped to `body > header`. NEVER use a bare `header` selector (it overlaps `.article-header` on article pages).
- **Sticky Sections**: Every `main > section` must have an opaque `background-color`. Keep `min-height` on `#projects .list` (`22rem`) and `#skills .skills` (`18rem`) to prevent CLS.
- **Design & Security**: Light mode only. Render dynamic DOM safely (`textContent`, `safeUrl()`). Gate all animations behind `prefers-reduced-motion`.
- **SEO**: Keep JSON-LD valid (no trailing commas). Update `dateModified` in `index.html` and `<lastmod>` in `sitemap.xml` on content changes.

## Content Workflows
- **Google Sheets CMS**:
  - Projects: `name*`, `description`, `stack` (comma-sep), `live_url`, `github_url`, `order`, `visible`
  - Skills: `category*`, `skill*`, `full_name`, `visible` (map icons in `SKILL_ICONS` or `SKILL_ICON_LOCAL`; download new icons into `icons/`)
  - After sheet edits: `python3 build_content.py` to refresh the static fallbacks, then `python3 checks.py --bump` (the refreshed HTML is a cached asset).
- **Writing (Static HTML, NOT Sheets)**:
  1. Copy `posts/template.html` -> `posts/<slug>.html` (keep `lang="en"` on `<html>` for `hyphens: auto`).
  2. Fill in the metadata, including `BlogPosting` JSON-LD and OG image dimensions.
  3. Add `<article class="entry writing-entry">` in `index.html` (sync title, date, read time, tags, description).
  4. Add the new post to `sw.js` precache list and `sitemap.xml`.
  5. Run `python3 checks.py --bump`, then `python3 checks.py --online`.
