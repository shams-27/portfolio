// Xiaomi/Redmi browser: hand the page over to Chrome (Android intent). Runs once per session;
// if Chrome isn't installed or the intent is blocked, the page just stays where it is.
(function openInChrome() {
    if (!/Android/i.test(navigator.userAgent) || !/MiuiBrowser|XiaoMi/i.test(navigator.userAgent)) return;
    try {
        if (sessionStorage.getItem('chromeRedirect')) return;
        sessionStorage.setItem('chromeRedirect', '1');
    } catch { return; }
    const { host, pathname, search } = window.location;
    window.location.replace('intent://' + host + pathname + search + '#Intent;scheme=https;package=com.android.chrome;end');
})();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Theme toggle: light by default, the choice is remembered (the saved theme is applied in <head> before paint)
const themeToggle = document.getElementById('themeToggle');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const rootEl = document.documentElement;

function applyTheme(dark) {
    if (dark) rootEl.setAttribute('data-theme', 'dark');
    else rootEl.removeAttribute('data-theme');
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(dark));
    if (themeColorMeta) themeColorMeta.setAttribute('content', dark ? '#131118' : '#FAEEE7');
}

applyTheme(rootEl.getAttribute('data-theme') === 'dark');

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const dark = rootEl.getAttribute('data-theme') !== 'dark';
        if (!prefersReducedMotion) {
            rootEl.classList.add('theme-anim');
            setTimeout(() => rootEl.classList.remove('theme-anim'), 350);
        }
        applyTheme(dark);
        try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch { /* storage unavailable */ }
    });
}

// Time-based hero greeting
const greetingElement = document.getElementById('greeting');
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
greetingElement.textContent = `${greeting}, I'm`;

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');

function setMenu(open) {
    navLinks.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    if (navOverlay) navOverlay.classList.toggle('show', open);
}

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        setMenu(!navLinks.classList.contains('open'));
    });

    // Close the menu once a link is tapped
    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenu(false));
    });

    // Close when tapping the dimmed area or pressing Escape
    if (navOverlay) navOverlay.addEventListener('click', () => setMenu(false));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('open')) {
            setMenu(false);
            navToggle.focus();
        }
    });

    // Reset if the viewport grows past the mobile breakpoint
    window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
        if (e.matches) setMenu(false);
    });
}

// Back-to-top button
const backToTopBtn = document.getElementById('backToTop');
let scrollQueued = false;

function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
        scrollQueued = false;
        if (backToTopBtn) backToTopBtn.classList.toggle('visible', window.scrollY > 400);
    });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
}


// Traits strip: duplicate the list so it can loop seamlessly on small screens
const stripTrack = document.querySelector('.strip .track');
if (stripTrack && stripTrack.firstElementChild) {
    const copy = stripTrack.firstElementChild.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    stripTrack.appendChild(copy);
}

// ---------------------------------------------------------------
// Google Sheets content: Projects and Skills
// ---------------------------------------------------------------
// In Google Sheets: File > Share > Publish to web > pick the tab > "Comma-separated
// values (.csv)" > Publish, then paste each tab's link below. Leave a value as ''
// to keep whatever is already written in index.html for that section.
const SHEETS = {
    projects: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXXuVB514-q76YWrnec50cXnoXEU24bUA6PvUFhc7UltmmnEWVFdWD3_GiwPnYXTp8EiRnTktvKeGb/pub?gid=0&single=true&output=csv',
    skills: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRXXuVB514-q76YWrnec50cXnoXEU24bUA6PvUFhc7UltmmnEWVFdWD3_GiwPnYXTp8EiRnTktvKeGb/pub?gid=1426459479&single=true&output=csv',
};

// Minimal CSV parser (quoted fields, escaped quotes, line breaks inside quotes)
function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { field += '"'; i++; }
                else inQuotes = false;
            } else {
                field += ch;
            }
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ',') {
            row.push(field);
            field = '';
        } else if (ch === '\n' || ch === '\r') {
            if (ch === '\r' && text[i + 1] === '\n') i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += ch;
        }
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    return rows;
}

// First row = headers (case/space-insensitive), every other row becomes an object
function csvToObjects(text) {
    const rows = parseCSV(text).filter((r) => r.some((c) => c.trim() !== ''));
    if (rows.length < 2) return [];
    const keys = rows[0].map((h) => h.trim().toLowerCase().replace(/[\s-]+/g, '_'));
    return rows.slice(1).map((r) => {
        const obj = {};
        keys.forEach((k, i) => { if (k) obj[k] = (r[i] || '').trim(); });
        return obj;
    });
}

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

function isVisible(value) {
    return !['false', 'no', '0', 'hidden'].includes((value || '').toLowerCase());
}

// Only http(s) links are allowed; a missing scheme is treated as https
function safeUrl(value) {
    if (!value) return '';
    try {
        const url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
        return '';
    }
}

// Project cards fade and rise into view as they scroll on screen (skipped for reduced motion).
// Only the first render animates, so the sheet refresh after the cached copy doesn't replay it.
let cardsAnimated = false;

function revealCards(cards) {
    if (cardsAnimated) return;
    cardsAnimated = true;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) return;

    cards.forEach((card) => card.classList.add('will-reveal'));
    const io = new IntersectionObserver((entries) => {
        // Cards entering together (one row) are staggered slightly
        entries.filter((e) => e.isIntersecting).forEach((entry, i) => {
            const card = entry.target;
            io.unobserve(card);
            card.style.setProperty('--reveal-delay', i * 90 + 'ms');
            card.classList.add('revealed');
            card.addEventListener('animationend', () => {
                card.classList.remove('will-reveal', 'revealed');
                card.style.removeProperty('--reveal-delay');
            }, { once: true });
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    cards.forEach((card) => io.observe(card));
}

function renderProjects(rows) {
    const list = document.querySelector('#projects .list');
    if (!list) return;

    const items = rows.filter((r) => r.name && isVisible(r.visible));
    if (!items.length) return;

    // Alphabetical by default; fill the optional "order" column to set your own order
    const hasOrder = items.some((r) => r.order !== '' && !isNaN(Number(r.order)));
    const rank = (r) => (r.order !== '' && !isNaN(Number(r.order)) ? Number(r.order) : Infinity);
    items.sort((a, b) => {
        if (hasOrder) {
            const diff = rank(a) - rank(b);
            if (diff) return diff;
        }
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    const cards = items.map((p) => {
        const card = el('article', 'project');

        const head = el('div', 'project-head');
        head.appendChild(el('h3', '', p.name));
        card.appendChild(head);

        const info = el('div', 'project-info');
        if (p.description) info.appendChild(el('p', 'project-desc', p.description));
        if (p.stack) info.appendChild(el('p', 'stack', p.stack));

        const links = el('div', 'project-links');
        [['Live demo', p.live_url], ['View on GitHub', p.github_url]].forEach(([label, href]) => {
            const safe = safeUrl(href);
            if (!safe) return;
            const a = el('a', '', label);
            a.href = safe;
            a.target = '_blank';
            a.rel = 'noopener';
            links.appendChild(a);
        });
        if (links.children.length) info.appendChild(links);

        card.appendChild(info);
        return card;
    });

    list.replaceChildren(...cards);
    revealCards(cards);
}

function renderSkills(rows) {
    const dl = document.querySelector('#skills .skills');
    if (!dl) return;

    // One sheet row per skill; categories appear in the order they first show up
    const groups = new Map();
    rows.filter((r) => r.category && r.skill && isVisible(r.visible)).forEach((r) => {
        if (!groups.has(r.category)) groups.set(r.category, []);
        groups.get(r.category).push(r);
    });
    if (!groups.size) return;

    const rowsEls = [...groups].map(([category, skills]) => {
        const row = el('div', 'skill-row');
        row.appendChild(el('dt', 'wrap', category));

        const ul = el('ul', 'group');
        skills.forEach((s) => {
            const li = el('li');
            if (s.full_name) {
                const abbr = el('abbr', '', s.skill);
                abbr.title = s.full_name;
                li.appendChild(abbr);
            } else {
                li.textContent = s.skill;
            }
            ul.appendChild(li);
        });

        const track = el('div', 'track');
        track.appendChild(ul);
        const dd = el('dd');
        dd.appendChild(track);
        row.appendChild(dd);
        return row;
    });

    dl.replaceChildren(...rowsEls);
}

// Show the last good copy instantly, then refresh from the sheet.
// If the sheet can't be reached, the content already on the page stays.
async function loadSheet(name, render) {
    const url = SHEETS[name];
    if (!url) return;

    const key = 'sheet:' + name;
    let cached = null;
    try { cached = localStorage.getItem(key); } catch { /* storage unavailable */ }
    if (cached) render(csvToObjects(cached));

    try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const text = await res.text();
        if (/^\s*</.test(text)) throw new Error('Not a CSV; is the tab published to the web?');
        if (text !== cached) {
            render(csvToObjects(text));
            try { localStorage.setItem(key, text); } catch { /* storage unavailable */ }
        }
    } catch (err) {
        console.warn('Could not load "' + name + '" from Google Sheets:', err.message);
    }
}

loadSheet('projects', renderProjects);
loadSheet('skills', renderSkills);

// ---------------------------------------------------------------
// Stacked sections
// ---------------------------------------------------------------
// CSS pins every section (position: sticky) so the next one slides over it. It needs each section's
// height (--h) and the header height (--hdr) to work out where a tall section should pin.
const mainEl = document.querySelector('main');
const headerEl = document.querySelector('header');
const stackItems = mainEl ? [...mainEl.children].filter((el) => el.matches('section, .strip')) : [];

stackItems.forEach((el, i) => { el.style.zIndex = i + 1; });

function measureStack() {
    if (headerEl) document.documentElement.style.setProperty('--hdr', headerEl.offsetHeight + 'px');
    stackItems.forEach((el) => el.style.setProperty('--h', el.offsetHeight + 'px'));
}

measureStack();
window.addEventListener('resize', measureStack);
window.addEventListener('load', measureStack);
if ('ResizeObserver' in window) {
    // Sections change height when the Google Sheets content loads or the layout changes
    const ro = new ResizeObserver(measureStack);
    stackItems.forEach((el) => ro.observe(el));
    if (headerEl) ro.observe(headerEl);
}

// Pinned sections report their pinned position, so in-page links can't rely on the browser's own jump.
// A section's natural position is the sum of the heights of everything above it.
document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
        const id = link.getAttribute('href').slice(1);
        const target = id ? document.getElementById(id) : null;
        if (!target || !mainEl) return;

        let y;
        if (target === mainEl) {
            y = 0;
        } else if (stackItems.includes(target)) {
            y = mainEl.offsetTop;
            for (const el of stackItems) {
                if (el === target) break;
                y += el.offsetHeight;
            }
            y -= headerEl ? headerEl.offsetHeight : 0;
        } else {
            return;
        }

        e.preventDefault();
        window.scrollTo({ top: Math.max(0, y), behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        history.replaceState(null, '', '#' + id);
    });
});
