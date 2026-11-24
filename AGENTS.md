# Project Map — Shams Kabir Portfolio
- **URL**: https://shams.swe.bd/
- **Stack**: Vanilla HTML5, CSS3, ES2020+ (no build tools/npm) | Local: `python3 -m http.server 8000`
- **Entry & Markup**: `index.html` (SEO, JSON-LD `ProfilePage` + `WebSite`, static `#writing` entries)
- **Styles**: `style.css` (Swiss Style, `--accent: #E4002B`, 12-col grid, sticky sections)
- **Logic & CMS**: `script.js` (Google Sheets CSV parser/cache, `ResizeObserver` for `--h`/`--hdr`, Web Vitals)
- **Offline Cache**: `sw.js` (cache-first static, network fallback; currently `portfolio-cache-v20`)
- **Articles**: `posts/template.html`, `posts/*.html`
- **Current focus**: Testing `#writing` section (`hidden` removed from `#writing` and its nav `<li>` in `index.html`; re-add both to hide)

## Critical Invariants (Do Not Break)
- **Service Worker**: Bump `CACHE_NAME` in `sw.js` on ANY change to cached assets (`index.html`, `style.css`, `script.js`, etc.). Never precache `codeTrapStanding.jpg`.
- **Sticky Header**: Keep sticky rule scoped to `body > header`. NEVER use a bare `header` selector (it overlaps `.article-header` on article pages).
- **Sticky Sections**: Every `main > section` must have an opaque `background-color`. Keep `min-height` on `#projects .list` (`22rem`) and `#skills .skills` (`18rem`) to prevent CLS.
- **Design & Security**: Light mode only. Render dynamic DOM safely (`textContent`, `safeUrl()`). Gate all animations behind `prefers-reduced-motion`.
- **SEO**: Keep JSON-LD valid (no trailing commas). Update `dateModified` in `index.html` and `<lastmod>` in `sitemap.xml` on content changes.

## Content Workflows
- **Google Sheets CMS**:
  - Projects: `name*`, `description`, `stack` (comma-sep), `live_url`, `github_url`, `order`, `visible`
  - Skills: `category*`, `skill*`, `full_name`, `visible` (map icons in `SKILL_ICONS` or `SKILL_ICON_LOCAL`)
- **Writing (Static HTML, NOT Sheets)**:
  1. Copy `posts/template.html` -> `posts/<slug>.html` (keep `lang="en"` on `<html>` for `hyphens: auto`).
  2. Add `<article class="entry writing-entry">` in `index.html` (sync title, date, read time, tags, description).
  3. Add the new post to `sw.js` precache list and `sitemap.xml`.