# Shams Kabir Portfolio - Documentation

## Overview
A minimalist, Swiss Style portfolio website for Shams Kabir (`https://shams.swe.bd/`), built with vanilla HTML5, CSS3, and ES2020+ JavaScript. Zero build tools, frameworks, or npm dependencies.

**Key Features:**
- Swiss Style typography and layout
- Google Sheets as CMS for dynamic content
- Sticky section stacking with smooth scrolling
- Responsive design across all devices
- Accessible motion and animations
- Google Fonts integration (Inter, JetBrains Mono, Mr Dafoe)
- Open Graph and social media optimization

---

## File Structure

```text
.
├── index.html          # Semantic markup, SEO tags, JSON-LD ProfilePage + WebSite data
├── style.css           # Swiss Style tokens, spacing/type scales, 12-column grid, animations
├── script.js           # Google Sheets CSV parser, UI controls, Core Web Vitals, error tracking
├── sw.js               # Service Worker caching core assets and Google Fonts for offline support
├── robots.txt          # Crawler directives
├── favicon.svg         # Tab icon and search result icon
├── sitemap.xml         # Single-URL sitemap with portrait image entry, changefreq, priority, and caption
├── icon-c.svg          # Local C logo for skills section
├── Shams.jpg           # Hero portrait (800x1000)
├── achievement.jpg     # DIU CodeTrap trophy photo
└── og-image.png        # Open Graph social preview card
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
5. **Skill Icons**: Full-color Devicon SVGs with hover labels
6. **Project Cards**: Indexed cards with stack chips and links

---

## Technical Implementation

### Dynamic Content
- **Google Sheets Integration**: Projects and skills loaded from CSV endpoints
- **Caching**: Stale-while-revalidate with localStorage
- **CSV Parsing**: Custom parser handling quoted fields and escaped quotes

### JavaScript Features
- **Sticky Sections**: Custom stacking with `ResizeObserver`
- **Active Navigation**: Tracks current section based on natural position
- **Scroll Animations**: `IntersectionObserver` for reveal effects
- **Count-up Stats**: Smooth number animations with random jumps
- **Clipboard API**: Email copy with fallback for non-secure contexts
- **Mobile Navigation**: Hamburger menu with overlay

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
  - Facts (daily driver, current focus, future goals)
- **Animation**: Count-up numbers, scroll reveal

### 4. Experience Section
- **Content**: Timeline of roles with red markers and connecting rails
- **Features**: Scroll-triggered rail drawing animation

### 5. Education Section
- **Content**: Academic history with degrees and institutions
- **Features**: Clean ruled entries with year markers

### 6. Skills Section
- **Content**: Categorized skills with icon chips
- **Features**:
  - Devicon icons with hover labels
  - Fallback to text chips if icon fails to load
  - Rounded corners for square logos

### 7. Projects Section
- **Content**: Dynamic project cards from Google Sheets
- **Features**:
  - Indexed cards (01, 02...)
  - Stack technology chips
  - Live demo and GitHub links
  - Scroll reveal animation

### 8. Contact Section
- **Content**: Email address, copy button, Gmail link
- **Features**: Full-screen layout to prevent projects from showing above

---

## Technical Details

### Google Sheets Integration
```javascript
const SHEETS = {
  projects: 'https://docs.google.com/spreadsheets/.../output=csv',
  skills: 'https://docs.google.com/spreadsheets/.../output=csv'
};

// CSV Schema:
// Projects: name, description, stack, live_url, github_url, order, visible
// Skills: category, skill, full_name, visible
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
- Google Sheets as headless CMS

### Maintenance
1. Edit content in Google Sheets
2. Update images when needed
3. Regenerate `og-image.png` when visual elements change
4. Bump version in Open Graph tags when image changes

---

## Customization Guide

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

## Performance & SEO Optimization

- **Service Worker (`sw.js`)**:
  - Pre-caches core assets (`index.html`, `style.css`, `script.js`, portraits, achievement photo, SVG icons, Google Fonts)
  - Enables offline support and near-instant repeat visits

- **Core Web Vitals & Diagnostics**:
  - Non-blocking `PerformanceObserver` tracking LCP and CLS
  - Global error and unhandled rejection tracking

- **Image Optimization**:
  - Pre-resized images with `srcset`
  - Lazy loading for non-critical images
  - Proper aspect ratios maintained

- **Resource Loading**:
  - Google Fonts loaded with `display=swap`
  - Non-critical JS deferred

- **Structured Data & SEO**:
  - Full Schema.org JSON-LD `ProfilePage` and `WebSite` hierarchy
  - Search engine keywords, hreflang tags, Open Graph and Twitter image alt tags
  - Sitemap with image caption, changefreq, and priority

- **Caching**:
  - LocalStorage caching for Google Sheets data (stale-while-revalidate)

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