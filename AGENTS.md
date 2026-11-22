# Portfolio Project Documentation

## Overview

**Project Name:** Shams Kabir Portfolio
**URL:** https://shams.swe.bd/
**Description:** A static single-page personal portfolio built with vanilla HTML5, CSS3, and ES2020+ JavaScript. Uses zero build tools, frameworks, or npm dependencies.

### Key Features
- **Visual Style:** Swiss Style (International Typographic Style)
- **Dynamic Content:** Google Sheets as CMS for projects and skills
- **Fonts:** Google Fonts (Inter 400-800, JetBrains Mono 500/700, Mr Dafoe brush script)
- **Responsive Design:** Adapts to all device sizes
- **Accessibility:** Follows WCAG guidelines and supports reduced motion
- **Offline Capable:** Service Worker (`sw.js`) caching core assets and Google Fonts
- **SEO & Performance:** Rich JSON-LD ProfilePage + WebSite schema, Open Graph, Core Web Vitals monitoring

---

## Project Structure

```text
.
├── index.html          # Semantic markup, SEO/OG tags, JSON-LD ProfilePage + WebSite data, inline SVGs
├── style.css           # Swiss Style tokens, spacing/type scales, 12-column grid, sticky stacking, animations
├── script.js           # Google Sheets CSV parser/cache, sticky height observer, UI controls, Core Web Vitals, error tracking
├── sw.js               # Service Worker caching core assets and Google Fonts for offline support
├── robots.txt          # Crawler directives
├── favicon.svg         # SVG vector tab icon
├── favicon.ico         # Root multi-res favicon (16x16, 32x32, 48x48) for Googlebot and older browsers
├── favicon-48x48.png   # 48px square PNG favicon (Google Search standard)
├── favicon-96x96.png   # 96px square PNG favicon (high-DPI Google Search standard)
├── apple-touch-icon.png# 180px PNG icon for Apple iOS homescreen / bookmarks
├── sitemap.xml         # Single-URL sitemap with portrait image entry, changefreq, priority, and caption
├── icon-c.svg          # Local C logo for skills section
├── Shams.jpg           # Hero portrait (800x1000, 4:5 crop)
├── achievement.jpg     # DIU CodeTrap trophy photo
├── og-image.png        # Open Graph social preview card
└── Shams.jpeg          # Unused portrait asset
```

---

## Development Commands

### Local Server
Run a local HTTP server for testing clipboard API and fetch behavior:

```bash
python3 -m http.server 8000
```

---

## Design Conventions

### Swiss Style Visual System
- **Typography:** Single typeface hierarchy using Inter (400-800) with JetBrains Mono for small labels
- **Color Palette:** White background, black text, paper-grey bars, red accent (#E4002B)
- **Grid:** 12-column layout (title in columns 1-4, content in 5-12)
- **Structure:** Rules and grid define layout, not decoration
- **Photos:** Full color with 2px solid black borders

### Layout Rules
- **Section Structure:** Title in columns 1-4, content in 5-12 (except Projects section)
- **Light Mode Only:** Single light theme with no dark mode toggle
- **Section Numbers:** Red mono numbers before each section title
- **Google Sheets CMS:** Dynamic content for projects and skills

### Accessibility
- **XSS Protection:** Safe DOM rendering using `textContent` and `safeUrl()`
- **Motion:** All animations gated behind `prefers-reduced-motion`
- **Keyboard Navigation:** Full support

---

## Implementation Details

### Sticky Section Stacking
- Every `main > section` uses `position: sticky`
- Custom properties `--h` and `--hdr` updated via `ResizeObserver`
- New sections must declare opaque `background-color`

### Navigation
- Active nav link marked with `aria-current="true"`
- Custom anchor scrolling for sticky sections
- Section becomes current when natural top passes 30% of viewport

### Google Sheets Integration

#### CSV Schema

**Projects Table:**
- `name` (required)
- `description`
- `stack` (comma-separated for chips)
- `live_url`
- `github_url`
- `order` (optional numeric)
- `visible` (false/no/0/hidden hides row)

**Skills Table:**
- `category` (required)
- `skill` (required)
- `full_name` (optional `<abbr title>`)
- `visible`

### Skill Icons
- Devicon SVGs from jsDelivr
- Local overrides for specific icons (e.g., `c` → `icon-c.svg`)
- Fallback to text chips if icon fails to load
- Icon sizes: 28px base, 24px at ≤639px, 32px from 860px

### Animation System
- CSS-based animations only
- Respects `prefers-reduced-motion`
- Uses `translate`, `scale`, `clip-path`, and `background-size`
- Entrance animations, scroll-triggered reveals, and hover effects

---

## Technical Components

### Hero Section
- Name animation with portrait on right (4:5 aspect ratio)
- Icon-only buttons with text in visually hidden labels
- Responsive layout: portrait moves to right on desktop, below name on mobile

### Traits Strip
- Red band with scrolling text items
- Horizontal scroll on mobile, static on desktop
- Smooth marquee effect with reduced motion fallback

### About Section
- Trophy photo with caption
- Biography text
- Count-up stats (CGPA, students taught, contest placement)
- Facts about daily driver, current focus, future goals

### Experience Section
- Timeline with red markers and connecting rails
- Scroll-triggered rail drawing animation

### Skills Section
- Categorized skills with icon chips
- Devicon icons with hover labels
- Fallback to text chips if icon fails to load

### Projects Section
- Dynamic project cards from Google Sheets
- Indexed cards (01, 02...)
- Stack technology chips
- Live demo and GitHub links
- Scroll reveal animation

### Contact Section
- Email address with copy button
- Full-screen layout to prevent projects from showing above

---

## Critical Implementation Notes

### Layout Stability
- `min-height` on `#projects .list` (`22rem`) and `#skills .skills` (`18rem`)
- Prevents sticky sections from jumping when CSV rows load

### Social Media Optimization
- Open Graph image caching considerations
- Version query parameter (`?v=N`) for cache busting
- LinkedIn Post Inspector for cache refresh

### Structured Data & SEO
- JSON-LD `ProfilePage` in `<head>` linked to `WebSite` schema (`#website`) via `isPartOf`
- `mainEntity` is `Person` (`#person`) with `name`, `alternateName` (`["Shams", "shams-27"]`), `email`, `nationality`, `alumniOf`, `knowsAbout`, and `sameAs`
- Must stay valid JSON; no trailing commas
- Keep in sync with page content: update `dateModified` (and `<lastmod>` in `sitemap.xml`) when content changes
- Meta tags include `keywords`, `author`, `canonical`, `hreflang` (`x-default`, `en`), Open Graph (`og:site_name`, `og:locale`), and Twitter Card with `twitter:image:alt`
- `sitemap.xml` provides `<changefreq>monthly</changefreq>`, `<priority>1.0</priority>`, and `<image:caption>` for the portrait entry

### Hero Section
- Fills first screen on every device
- Portrait capped at `58vh` on desktop
- Icon-only buttons with text in visually hidden labels

### Image Handling
- Pre-resized images with `srcset` and `sizes`
- Never let browser shrink large originals
- Maintain proper aspect ratios

### Font Usage
- `--display` and `--sans`: Inter (headings, body, buttons)
- `--mono`: JetBrains Mono (small labels only)
- `--logo`: Mr Dafoe (signature logo only)

### Logo Implementation & Favicons
- Signature logo with red swoosh underline
- SVG data-URI background for underline
- Favicon with muted red circle and black "S":
  - `favicon.svg`: Vector icon for modern browser tabs
  - `favicon.ico`: Multi-resolution (16, 32, 48) at domain root; required by Googlebot which automatically probes `/favicon.ico`
  - `favicon-48x48.png` & `favicon-96x96.png`: Multiples of 48px square PNGs explicitly required by Google Search guidelines to display custom favicons in search results instead of the default globe
  - `apple-touch-icon.png`: 180x180 PNG for Apple devices

---

## Customization Guidelines

### Adding New Skills
1. Add to Google Sheets under "Skills" tab
2. Map to Devicon icon in `SKILL_ICONS` object
3. Add to `SKILL_ICON_LOCAL` if using custom SVG

### Adding New Projects
1. Add to Google Sheets under "Projects" tab
2. Set `visible` to "true" (default)
3. Optionally set `order` for custom sorting

### Modifying Layout
- Edit CSS variables in `:root` selector
- Adjust grid columns in `.section-grid` media queries
- Modify breakpoints in media queries

### Changing Colors
- Update `--accent` variable (currently `#E4002B`)
- Update SVG color references (like in favicon.svg)
- Update Open Graph image colors

---

## Performance Considerations

### Offline Support & Service Worker
- `sw.js` caches critical assets (`/`, `index.html`, `style.css`, `script.js`, portraits, achievement photo, SVG icons, and Google Fonts)
- Cache-first strategy for static assets, network fallback with dynamic cache population
- Clean activation handler to evict outdated cache versions

### Core Web Vitals & Error Monitoring
- Non-blocking `PerformanceObserver` in `script.js` monitoring Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS)
- Window listeners for `error` and `unhandledrejection` events for diagnostics

### Image Optimization
- Pre-resized images with `srcset` and `sizes`
- Lazy loading for non-critical images
- Proper aspect ratios maintained

### Resource Loading
- Google Fonts loaded with `display=swap`
- Non-critical JS deferred

### Caching
- LocalStorage caching for Google Sheets data
- Stale-while-revalidate strategy

---

## Maintenance Instructions

### Content Updates
1. Edit content in Google Sheets
2. Update images when needed
3. Regenerate `og-image.png` when visual elements change
4. Bump version in Open Graph tags when image changes

### Version Control
- All changes should be committed with clear messages
- Follow semantic versioning for major visual changes

---

## Contact Information

For questions or contributions:
- Email: kabir.shams.2002@gmail.com
- GitHub: [shams-27](https://github.com/shams-27)
- LinkedIn: [shams-kbr](https://www.linkedin.com/in/shams-kbr/)