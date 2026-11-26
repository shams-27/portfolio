# Shams Kabir Portfolio - Documentation

## Overview
A minimalist, Swiss Style portfolio website for Shams Kabir (`https://shams.swe.bd/`), built with vanilla HTML5, CSS3, and ES2020+ JavaScript. No frameworks or npm dependencies; the only helper scripts use the Python standard library.

**Key Features:**
- Swiss Style typography and layout
- All section content lives directly in `index.html` — no external CMS or runtime data fetch
- Sticky section stacking with smooth scrolling
- Responsive design across all devices
- Accessible motion, skip link, focus-managed mobile menu, visible skill labels on touch
- Self-hosted fonts (Inter, JetBrains Mono, Instrument Serif, Mr Dafoe) and Devicon icons
- Network-first service worker with an offline fallback page
- Open Graph, sitemap, and JSON-LD for both the profile and articles
- Dependency-free checks (`checks.py`) and automated cache-version bumps

---

## File Structure

```text
.
├── index.html          # Semantic markup, SEO tags, JSON-LD, all section content
├── style.css           # Swiss Style tokens, 12-column grid, self-hosted @font-face, animations
├── script.js           # UI controls, sticky sections, scroll reveals (no remote content)
├── sw.js               # Network-first pages, stale-while-revalidate assets, offline fallback
├── checks.py           # Local/online validation; --bump increments the SW cache version
├── offline.html        # Page served when a navigation fails while offline
├── fonts/              # Self-hosted woff2 files and Open Font License texts
├── icons/              # Self-hosted Devicon 2.18 SVGs plus a local PowerShell mark
├── content_cache/      # Service-worker asset fingerprint only
├── robots.txt          # Crawler directives
├── favicon.svg         # Tab icon and SVG vector icon
├── favicon.ico         # Root multi-res ICO favicon (16/32/48) for Googlebot and search crawlers
├── favicon-48x48.png   # 48px square PNG favicon (Google Search standard)
├── favicon-96x96.png   # 96px square PNG favicon (high-DPI Google Search standard)
├── apple-touch-icon.png# 180px PNG icon for Apple devices
├── sitemap.xml         # Homepage + article URLs with image entries and lastmod dates
├── icon-c.svg          # Local C logo for skills section
├── Shams.jpg           # Hero portrait (800x1000)
├── Shams-square.jpg    # 1:1 crop of the portrait for profile image markup
├── Shams-wide.jpg      # 16:9 crop of the portrait for profile image markup
├── achievement.jpg     # DIU CodeTrap trophy photo
├── og-image.png        # Open Graph social preview card
└── posts/              # Articles and case studies
    ├── template.html   # Reusable article boilerplate
    └── diu-codetrap-2025.html # CodeTrap 4th-place retrospective with trophy photo
```

---

## Design Principles

### Swiss Style Implementation
- **Typography**: Single typeface hierarchy (Inter 400-800) with JetBrains Mono for small labels
- **Color**: Black text on white background with single red accent (`#E4002B`)
- **Grid**: 12-column layout (title in columns 1-4, content in 5-12)
- **Structure**: Rules and grid define layout, not decoration
- **Motion**: All animations are CSS-based with reduced motion support

### Key Visual Elements
1. **Signature Logo**: "Shams" in Mr Dafoe brush script with red swoosh underline
2. **Hero Section**: Name animation with portrait on the right (4:5 aspect ratio)
3. **Traits Strip**: Red band with scrolling text items
4. **Section Numbers**: Red mono numbers before each section title
5. **Skill Icons**: Full-color self-hosted Devicon SVGs; hover labels on pointer devices, visible labels on touch
6. **Project Index**: Ruled full-width rows with stack icons and links

---

## Technical Implementation

### Static Content
- **Single source of truth**: Projects, Tech stack and Writing are plain HTML in `index.html`; nothing is fetched at runtime and no build step regenerates them
- **Caching**: The service worker caches `index.html`, `style.css`, `script.js` and the self-hosted assets; no localStorage content cache remains
- **Skill / stack icons**: Local SVGs are referenced directly from `index.html`; the name stays as `alt` text and a touch/hover label
- **Validation**: `python3 checks.py` verifies JSON-LD, sitemap, links, precache assets, design invariants, and cache-version consistency

### JavaScript Features
- **Sticky Sections**: Custom stacking with `ResizeObserver`, batched reads/writes and one rAF-debounced measure loop
- **Active Navigation**: Tracks current section based on natural position with `aria-current="location"`
- **Scroll Animations**: `IntersectionObserver` for reveal effects, all gated behind reduced motion
- **Count-up Stats**: Smooth number animations with random jumps
- **Clipboard API**: Email copy with fallback for non-secure contexts
- **Mobile Navigation**: Hamburger menu with overlay, focus trap, `inert` background, and Escape handling; skip link on every page

### Responsive Design
- **Breakpoints**: 359px, 639px, 767px, 859px, 1024px, 1100px, 1200px
- **Layout Modes**:
  - Mobile (≤639px): Single column, compact sizes
  - Tablet (640-859px): Two-column about section
  - Desktop (≥860px): 12-column grid, expanded sizes

---

## Sections

### 1. Hero Section
- **Content**: Greeting, name animation, lead text, portrait, action buttons
- **Animation**: Name lines rise from mask, red dot pops, portrait wipes in
- **Responsive**: Portrait moves to right on desktop, below name on mobile

### 2. Traits Strip
- **Content**: Scrolling list of personal traits
- **Behavior**: Horizontal scroll on mobile, static on desktop
- **Animation**: Smooth marquee effect with reduced motion fallback

### 3. About Section
- **Content**:
  - Trophy photo with caption
  - Biography text
  - Stats (CGPA, students taught, contest placement)
- **Animation**: Count-up numbers, scroll reveal

### 4. Experience Section
- **Content**: Timeline of roles with red markers and connecting rails
- **Features**: Scroll-triggered rail drawing animation

### 5. Education Section
- **Content**: Academic history with degrees and institutions
- **Features**: Clean ruled entries with year markers

### 6. Tech Stack Section
- **Content**: Categorized technologies and tools with icon chips
- **Features**:
  - Devicon icons with hover labels
  - Names kept as `alt` text and visible labels on touch
  - Rounded corners for square logos

### 7. Projects Section
- **Content**: Static project rows in `index.html`
- **Features**:
  - Ruled index rows (01, 02...) with aligned columns on desktop
  - Stack technology icons
  - Live demo and GitHub links
  - Scroll reveal animation

### 8. Writing Section
- **Content**: Technical essays, contest retrospectives, and engineering breakdowns
- **Features**:
  - Ruled Swiss layout with mono dates and tag chips
  - Plain HTML entries in `index.html`
  - Standalone article support with images, captions, and code blocks

### 9. Contact Section
- **Content**: Email address, copy button, Gmail link
- **Features**: Full-screen layout to prevent prior sections from showing above

---

## Technical Details

### Static Content
```html
<!-- Projects: one article per row, renumber the project-index spans by hand -->
<article class="project">
  <div class="project-head"><span class="project-index">01</span><h3>Auto GCC</h3></div>
  <div class="project-info">
    <p class="project-desc">...</p>
    <ul class="stack"><li>PowerShell</li></ul>
    <div class="project-links"><a href="..." target="_blank" rel="noopener">View on GitHub</a></div>
  </div>
</article>

<!-- Skills: local SVG icons, with the name in alt and data-name -->
<li class="has-icon" data-name="Git"><img src="/icons/git/git-original.svg" alt="Git" width="28" height="28" decoding="async"></li>
```

### Animation System
- **Motion Preferences**: Respects `prefers-reduced-motion`
- **Animation Types**:
  - Entrance animations (hero, strip)
  - Scroll-triggered reveals (cards, section titles)
  - Hover effects (button fills, skill labels)
  - Count-up numbers (stats)
- **Performance**: Uses `requestAnimationFrame` and `IntersectionObserver`

### Accessibility Features
- **Keyboard Navigation**: Full support
- **Screen Reader**: Proper ARIA attributes and hidden spans
- **Color Contrast**: Meets WCAG standards
- **Reduced Motion**: All animations respect user preference

---

## Development Workflow

### Local Testing
```bash
python3 -m http.server 8000
```

### Deployment
- Hosted on GitHub Pages or similar static hosting
- Static files only; no CMS or runtime data fetch

### Maintenance
1. Edit the relevant markup directly in `index.html`
2. Update images when needed
3. `og:image`, `twitter:image`, `link rel=image_src`, `primaryImageOfPage`, and the first sitemap homepage `image:loc` use the portrait `Shams.jpg`; `Person.image` and the sitemap also list square and wide crops so Google can pick a suitable profile thumbnail. `checks.py` enforces this so Google shows the profile photo rather than the portfolio card
4. Article pages keep their own article image; `og-image.png` remains the default in `posts/template.html`
5. After any cached asset edit, run `python3 checks.py --bump`

---

## Customization Guide

### Adding New Skills
1. Add a `<li>` to the right `.skill-row` group in `index.html`
2. Download the matching Devicon SVG into `icons/` and reference it from `<img src="...">`
3. Set `alt` and `data-name` to the name shown on touch/hover

### Adding New Projects
1. Add an `<article class="project">` in `index.html`
2. Keep index numbers sequential and add stack chips / links as needed
3. Remove the whole article to hide a project

### Modifying Layout
- Edit CSS variables in `:root` selector
- Adjust grid columns in `.section-grid` media queries
- Modify breakpoints in media queries

### Changing Colors
- Update `--accent` variable (currently `#E4002B`)
- Update SVG color references (like in favicon.svg)
- Update Open Graph image colors

---

## Performance & SEO Optimization

- **Service Worker (`sw.js`)**:
  - Pre-caches core assets (`index.html`, `style.css`, `script.js`, portraits, achievement photo, SVG icons, self-hosted fonts)
  - Enables offline support and near-instant repeat visits

- **Core Web Vitals & Diagnostics**:
  - Non-blocking `PerformanceObserver` tracking LCP and CLS
  - Global error and unhandled rejection tracking

- **Image Optimization**:
  - Pre-resized images with `srcset`
  - Lazy loading for non-critical images
  - Proper aspect ratios maintained

- **Resource Loading**:
  - Fonts are self-hosted woff2 with `display=swap`
  - Non-critical JS deferred

- **Structured Data & SEO**:
  - Full Schema.org JSON-LD `ProfilePage` and `WebSite` hierarchy
  - Search engine keywords, hreflang tags, Open Graph and Twitter image alt tags
  - Sitemap with image caption, changefreq, and priority

- **Caching**:
  - Service-worker asset cache only; no localStorage content cache remains

---

## Future Enhancements

1. **Dark Mode**: Could be added while maintaining Swiss Style
2. **Project Filtering**: Add category filters for projects
3. **Analytics**: Lightweight tracking without affecting performance
4. **Blog Section**: Add static blog posts
5. **More Animations**: Additional scroll-triggered effects

---

## License

MIT License - Free to use, modify, and distribute.

---

## Contact

For questions or contributions:
- Email: kabir.shams.2002@gmail.com
- GitHub: [shams-27](https://github.com/shams-27)
- LinkedIn: [shams-kbr](https://www.linkedin.com/in/shams-kbr/)