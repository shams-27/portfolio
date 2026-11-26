# Project Map — Shams Kabir Portfolio
- **Stack**: static HTML/CSS/ES2020+, no npm, build step, or CMS. `vercel.json` deploys `.` as-is with no install/build.
- **Dev**: `python3 -m http.server 8000`.
- **Checks**: `python3 checks.py` (local), `python3 checks.py --online` (also HEAD-checks every sitemap URL, needs network). `checks.py` is the source of truth over `DOCUMENTATION.md`.
- **Markup**: `index.html` holds all Projects, Tech stack, and Writing content plus `ProfilePage`/`WebSite` JSON-LD. `posts/*.html` are standalone articles (`BlogPosting` JSON-LD); `posts/template.html` is boilerplate.
- **Logic/Styles**: `script.js` (nav/scroll UI; `ResizeObserver` sets `--h`/`--hdr`), `style.css` (Swiss style, `--accent: #E4002B`, 12-col grid).
- **Offline cache**: `sw.js` — network-first navigations with `/offline.html` fallback, stale-while-revalidate same-origin assets, `skipWaiting`; cross-origin untouched; currently `portfolio-cache-v52`. `content_cache/sw-fingerprint.json` is generated — never hand-edit.

## Invariants
- **Cache bump**: after ANY change to a precached asset (listed in `sw.js` `ASSETS_TO_CACHE`), run `python3 checks.py --bump`. It increments `CACHE_NAME`, rewrites the version line in this file, and records the new fingerprint; it then runs the local checks. Stale fingerprint or sw.js/AGENTS.md version drift fails `checks.py`.
- **Never precache** `codeTrapStanding.jpg`.
- **Sticky header**: scope the sticky rule to `body > header`; a bare `header` selector breaks `.article-header` on article pages.
- **Sticky sections**: every `main > section` needs an opaque `background-color`. Keep `#projects .list` min-height `22rem` and `#tech-stack .skills` min-height `18rem` to prevent layout shift.
- **Homepage image**: `og:image`, `twitter:image`, JSON-LD `primaryImageOfPage`/`Person.image`, and sitemap `image:loc` must all be `https://shams.swe.bd/Shams.jpg` (not `og-image.png`); article pages keep their own images.
- **No remote content**: self-hosted fonts/SVGs only, `textContent` for dynamic nodes, light mode only, all animations behind `prefers-reduced-motion`.
- **SEO**: valid JSON-LD (no trailing commas); update `dateModified` in `index.html` and `<lastmod>` in `sitemap.xml` on content changes.

## Content workflows
- **Projects / Tech stack**: edit `<article class="project">` rows and `.skill-row` groups in `index.html` directly; renumber `.project-index` by hand. Chips are `<li class="has-icon" data-name="...">` with a local `/icons/...` SVG (or `/icon-c.svg` for C); keep `alt` in sync with `data-name`. Then run `python3 checks.py --bump`.
- **New post**: copy `posts/template.html` to `posts/<slug>.html` (keep `lang="en"` for `hyphens: auto`); fill BlogPosting fields (`headline`, `datePublished`, `dateModified`, `author`, `image`, `mainEntityOfPage`) and OG image dimensions; add an `<article class="entry writing-entry">` in `index.html`; add the URL plus `<lastmod>` to `sitemap.xml` (it must match homepage + every non-template post exactly) and the post to `sw.js` `ASSETS_TO_CACHE`; then run `python3 checks.py --bump` and `python3 checks.py --online`.
