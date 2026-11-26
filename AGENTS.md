# Project Map — Shams Kabir Portfolio
- **URL**: https://shams.swe.bd/
- **Stack**: Vanilla HTML5, CSS3, ES2020+ (no npm/frameworks) | Local: `python3 -m http.server 8000` | Python stdlib helper script
- **Entry & Markup**: `index.html` (SEO, JSON-LD `ProfilePage` + `WebSite`; all Projects, Tech stack and Writing content lives here)
- **Styles**: `style.css` (Swiss Style, `--accent: #E4002B`, 12-col grid, sticky sections, self-hosted `@font-face`)
- **Logic**: `script.js` (nav/scroll UI, `ResizeObserver` for `--h`/`--hdr`, scroll reveals; no CMS or remote content)
- **Scripts**: `checks.py` (validation + `checks.py --bump` for SW version)
- **Offline Cache**: `sw.js` (network-first pages, stale-while-revalidate local assets, `/offline.html` fallback; currently `portfolio-cache-v46`)
- **Assets**: `fonts/` (self-hosted woff2 + OFL licences), `icons/` (self-hosted Devicon 2.18 SVGs plus a local PowerShell mark), `content_cache/` (SW fingerprint only)
- **Articles**: `posts/template.html`, `posts/*.html` (with `BlogPosting` JSON-LD)
- **Current focus**: Testing `#writing` section (`hidden` removed from `#writing` and its nav `<li>` in `index.html`; re-add both to hide)

## Critical Invariants (Do Not Break)
- **Service Worker**: After ANY change to a cached asset (`index.html`, `style.css`, `script.js`, fonts, icons, posts, etc.), run `python3 checks.py --bump` — it increments `CACHE_NAME`, updates this file, and records the asset fingerprint. `python3 checks.py` fails if the fingerprint is stale. Never precache `codeTrapStanding.jpg`.
- **Static content**: Projects, Tech stack and Writing are hand-maintained HTML in `index.html`. There are no generated blocks, CSV snapshots or Google Sheets endpoints; keep skill icons as self-hosted SVGs referenced directly from `index.html`.
- **Sticky Header**: Keep sticky rule scoped to `body > header`. NEVER use a bare `header` selector (it overlaps `.article-header` on article pages).
- **Sticky Sections**: Every `main > section` must have an opaque `background-color`. Keep `min-height` on `#projects .list` (`22rem`) and `#skills .skills` (`18rem`) to prevent CLS.
- **Design & Security**: Light mode only. No remote content is fetched; build the few dynamic nodes with `textContent`. Gate all animations behind `prefers-reduced-motion`.
- **SEO**: Keep JSON-LD valid (no trailing commas). Update `dateModified` in `index.html` and `<lastmod>` in `sitemap.xml` on content changes.

## Content Workflows
- **Projects / Tech stack (Static HTML)**:
  - Edit the `<article class="project">` rows or `.skill-row` groups directly in `index.html`.
  - Skill and project-stack chips use `<li class="has-icon" data-name="...">` with a local SVG from `icons/` (or `/icon-c.svg`); keep the `alt` text in sync with `data-name`.
  - After any edit: run `python3 checks.py --bump`, then `python3 checks.py`.
- **Writing (Static HTML)**:
  1. Copy `posts/template.html` -> `posts/<slug>.html` (keep `lang="en"` on `<html>` for `hyphens: auto`).
  2. Fill in the metadata, including `BlogPosting` JSON-LD and OG image dimensions.
  3. Add `<article class="entry writing-entry">` in `index.html` (sync title, date, read time, tags, description).
  4. Add the new post to `sw.js` precache list and `sitemap.xml`.
  5. Run `python3 checks.py --bump`, then `python3 checks.py --online`.
