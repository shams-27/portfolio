// Xiaomi/Redmi browser: offer to open the page in Chrome (Android intent) instead of forcing it.
// If Chrome isn't installed the intent falls back to this same page, so nobody is stranded.
(function offerChrome() {
    const prompt = document.getElementById('chromePrompt');
    const open = document.getElementById('chromeOpen');
    const close = document.getElementById('chromeClose');
    if (!prompt || !open || !close) return;
    if (!/Android/i.test(navigator.userAgent) || !/MiuiBrowser|XiaoMi/i.test(navigator.userAgent)) return;
    try { if (sessionStorage.getItem('chromePromptDismissed')) return; } catch { /* storage unavailable */ }

    const { host, pathname, search, href } = window.location;
    open.href = 'intent://' + host + pathname + search + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(href) + ';end';
    prompt.hidden = false;

    close.addEventListener('click', () => {
        prompt.hidden = true;
        try { sessionStorage.setItem('chromePromptDismissed', '1'); } catch { /* storage unavailable */ }
    });
})();

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Dark mode was removed; clear any theme choice saved by an earlier visit
try { localStorage.removeItem('theme'); } catch { /* storage unavailable */ }

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

// Contact: copy the email address (clipboard API, with a fallback for older or non-secure contexts)
const copyBtn = document.getElementById('copyEmail');
if (copyBtn) {
    const copyLabel = document.getElementById('copyEmailLabel');
    const copyStatus = document.getElementById('copyStatus');
    let copyTimer;

    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if (!ok) throw new Error('copy failed');
    }

    function flash(message, ok) {
        copyBtn.classList.toggle('copied', Boolean(ok));
        copyLabel.textContent = message;
        if (copyStatus) copyStatus.textContent = message;
        clearTimeout(copyTimer);
        copyTimer = setTimeout(() => {
            copyLabel.textContent = 'Copy address';
            copyBtn.classList.remove('copied');
            if (copyStatus) copyStatus.textContent = '';
        }, 2000);
    }

    copyBtn.addEventListener('click', () => {
        copyText(copyBtn.dataset.email).then(() => flash('Copied', true), () => flash('Copy failed'));
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

// Cards fade and rise into view as they scroll on screen (skipped for reduced motion).
function revealOnScroll(cards) {
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

let projectCardsAnimated = false;

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

    const cards = items.map((p, i) => {
        const card = el('article', 'project');

        const head = el('div', 'project-head');
        head.appendChild(el('span', 'project-index', String(i + 1).padStart(2, '0')));
        head.appendChild(el('h3', '', p.name));
        card.appendChild(head);

        const info = el('div', 'project-info');
        if (p.description) info.appendChild(el('p', 'project-desc', p.description));
        if (p.stack) {
            // "HTML, CSS, JS" becomes one chip per technology
            const chips = el('ul', 'stack');
            p.stack.split(/[,;|\u00B7\u2022]+/).map((s) => s.trim()).filter(Boolean)
                .forEach((s) => chips.appendChild(el('li', '', s)));
            info.appendChild(chips);
        }

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

    // Only the first render animates, so the sheet refresh after the cached copy doesn't replay it
    if (!projectCardsAnimated) {
        projectCardsAnimated = true;
        revealOnScroll(cards);
    }
}

// Skill name -> Devicon folder name. The icons are full-colour SVGs from the Devicon package on jsDelivr (the one place the site shows colours other than the red accent).
// Names are matched lowercase with everything except letters, digits, + and # removed ("Node.js" -> "nodejs"). A skill with no match, or an icon that fails to load, keeps its text chip.
const SKILL_ICON_BASE = 'https://cdn.jsdelivr.net/npm/devicon@2.18.0/icons/';
// Devicon ships most icons as <slug>/<slug>-original.svg (full colour); these have no -original, so they use another variant
const SKILL_ICON_VARIANT = { django: 'plain' };
// Local override: Devicon's C is a washed-out grey-blue, so C uses icon-c.svg in the site root (Simple Icons' C path filled #00599C, the same blue as the C++ icon)
const SKILL_ICON_LOCAL = { c: 'icon-c.svg' };
// Logos that are a plain square (sharp corners) get .icon-round so their corners clear the circular chip
const SKILL_ICON_ROUND = new Set(['javascript', 'typescript']);
function skillIconUrl(slug) {
    if (SKILL_ICON_LOCAL[slug]) return SKILL_ICON_LOCAL[slug];
    return SKILL_ICON_BASE + slug + '/' + slug + '-' + (SKILL_ICON_VARIANT[slug] || 'original') + '.svg';
}
const SKILL_ICONS = {
    python: 'python', javascript: 'javascript', js: 'javascript', typescript: 'typescript', ts: 'typescript',
    html: 'html5', html5: 'html5', css: 'css3', css3: 'css3',
    c: 'c', 'c++': 'cplusplus', cpp: 'cplusplus', 'c#': 'csharp', java: 'java', kotlin: 'kotlin', dart: 'dart',
    go: 'go', golang: 'go', rust: 'rust', php: 'php',
    mysql: 'mysql', postgresql: 'postgresql', postgres: 'postgresql', sqlite: 'sqlite', mongodb: 'mongodb', firebase: 'firebase',
    bash: 'bash', shell: 'bash', shellscripting: 'bash', zsh: 'zsh',
    linux: 'linux', archlinux: 'archlinux', arch: 'archlinux', ubuntu: 'ubuntu', debian: 'debian', fedora: 'fedora', kali: 'kalilinux', kalilinux: 'kalilinux',
    git: 'git', github: 'github', gitlab: 'gitlab', docker: 'docker',
    nodejs: 'nodejs', node: 'nodejs', react: 'react', nextjs: 'nextjs', vue: 'vuejs', vuejs: 'vuejs', angular: 'angular', svelte: 'svelte',
    tailwind: 'tailwindcss', tailwindcss: 'tailwindcss', bootstrap: 'bootstrap', express: 'express', django: 'django', flask: 'flask', fastapi: 'fastapi',
    flutter: 'flutter', npm: 'npm', vite: 'vite', vim: 'vim', neovim: 'neovim', nvim: 'neovim',
    vscode: 'vscode', visualstudiocode: 'vscode', figma: 'figma', postman: 'postman',
    jupyter: 'jupyter', numpy: 'numpy', pandas: 'pandas', latex: 'latex', markdown: 'markdown', cmake: 'cmake', gcc: 'gcc', nginx: 'nginx',
    wordpress: 'wordpress', selenium: 'selenium',
    intellij: 'intellij', intellijidea: 'intellij', idea: 'intellij', canva: 'canva', mariadb: 'mariadb',
    antigravity: 'antigravity', googleantigravity: 'antigravity',
};

function skillIconSlug(name) {
    return SKILL_ICONS[(name || '').toLowerCase().replace(/[^a-z0-9+#]/g, '')] || '';
}

// The text version of a skill: an <abbr> with the full name as tooltip when the sheet has one
function skillText(s) {
    if (!s.full_name) return document.createTextNode(s.skill);
    const abbr = el('abbr', '', s.skill);
    abbr.title = s.full_name;
    return abbr;
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
            const slug = skillIconSlug(s.skill) || skillIconSlug(s.full_name);
            if (slug) {
                // Icon only; the name stays available as alt text and as the hover tooltip
                const label = s.full_name || s.skill;
                const img = el('img');
                img.src = skillIconUrl(slug);
                if (SKILL_ICON_ROUND.has(slug)) img.classList.add('icon-round');
                img.alt = label;
                li.dataset.name = label;   // shown as a pop-out label on hover (CSS .has-icon::after)
                img.width = 28;
                img.height = 28;
                img.decoding = 'async';
                img.addEventListener('error', () => {
                    li.classList.remove('has-icon');
                    delete li.dataset.name;
                    img.replaceWith(skillText(s));
                }, { once: true });
                li.classList.add('has-icon');
                li.appendChild(img);
            } else {
                li.appendChild(skillText(s));
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

// Education entries, About stats and facts, and the trophy photo (the project cards are handled in renderProjects)
revealOnScroll([...document.querySelectorAll('.entry, .stat, .fact, .trophy')]);

loadSheet('projects', renderProjects);
loadSheet('skills', renderSkills);

// About stats: count-up on first reveal. The number ascends from zero to its value (3.90 runs 0.00 → 3.90, 100+ runs 000 → 100, 4th runs 0th → 4th) with an ease-out,
// zero-padded to the final width so the mono font never shifts the suffix. The real text stays in a visually hidden span for screen readers.
function shuffleStats() {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) return;
    const DURATION = 1400;

    const items = new Map();
    document.querySelectorAll('.stat dd').forEach((dd) => {
        const final = dd.textContent.trim();
        const m = final.match(/^(\d+)(?:\.(\d+))?(.*)$/);   // number, optional decimals, suffix ("+", "th")
        if (!m) return;
        const intLen = m[1].length;
        const decimals = m[2] ? m[2].length : 0;
        const target = parseFloat(m[1] + (m[2] ? '.' + m[2] : ''));
        // Counting unit: the smallest unit the number is written in (3.90 in hundredths, 100 and 4 in ones). The jumps themselves are random multiples of it (see frame())
        const step = Math.pow(10, -decimals);
        const suffix = m[3];
        const format = (v) => {
            const [i, d] = v.toFixed(decimals).split('.');
            return i.padStart(intLen, '0') + (d !== undefined ? '.' + d : '') + suffix;
        };
        const vis = el('span');
        vis.setAttribute('aria-hidden', 'true');
        vis.textContent = format(0);
        dd.replaceChildren(el('span', 'visually-hidden', final), vis);
        items.set(dd, { final, target, step, format, vis });
    });

    const io = new IntersectionObserver((entries) => {
        entries.filter((e) => e.isIntersecting).forEach((entry) => {
            io.unobserve(entry.target);
            const { final, target, step, format, vis } = items.get(entry.target);
            const start = performance.now();
            // Random ascending jumps: every 60ms the value leaps forward by a random amount, never past the eased ceiling, so it
            // always climbs, bigger numbers skip further, and it lands exactly on the final text when the time is up
            let shown = 0;
            let last = 0;
            const frame = (now) => {
                const p = Math.min(1, (now - start) / DURATION);
                if (p >= 1) { vis.textContent = final; return; }
                if (now - last >= 60) {
                    last = now;
                    const eased = 1 - Math.pow(1 - p, 3);   // ease-out cubic
                    const ceiling = Math.floor(target * eased / step + 1e-9);
                    if (ceiling > shown) shown += 1 + Math.floor(Math.random() * (ceiling - shown));
                    vis.textContent = format(shown * step);
                }
                requestAnimationFrame(frame);
            };
            requestAnimationFrame(frame);
        });
    }, { threshold: 0.6 });
    items.forEach((_, dd) => io.observe(dd));
}
shuffleStats();

// ---------------------------------------------------------------
// Stacked sections
// ---------------------------------------------------------------
// CSS pins every section (position: sticky) so the next one slides over it. It needs each section's
// height (--h) and the header height (--hdr) to work out where a tall section should pin.
const mainEl = document.querySelector('main');
const headerEl = document.querySelector('header');
const stackItems = mainEl ? [...mainEl.children].filter((el) => el.matches('section, .strip')) : [];

stackItems.forEach((el, i) => { el.style.zIndex = i + 1; });

// Active nav link. Sections are sticky, so their on-screen position is not their natural one; the
// natural top of each section is the sum of the heights above it (the same maths the anchor links use).
// A section counts as current once its natural top has risen into the upper part of the screen,
// which is about when it has slid over the previous one. Only sections that have a nav link are tracked.
const navAnchors = navLinks ? [...navLinks.querySelectorAll('a[href^="#"]')] : [];
const navById = new Map(navAnchors.map((a) => [a.getAttribute('href').slice(1), a]));
let sectionTops = [];   // [{ id, top }] in document order, only for sections with a nav link
let activeNavId = null;

function computeSectionTops() {
    sectionTops = [];
    if (!mainEl) return;
    let y = mainEl.offsetTop;
    stackItems.forEach((item) => {
        if (item.id && navById.has(item.id)) sectionTops.push({ id: item.id, top: y });
        y += item.offsetHeight;
    });
}

function updateActiveNav() {
    if (!sectionTops.length) return;
    const hdr = headerEl ? headerEl.offsetHeight : 0;
    const vh = window.innerHeight;
    const line = window.scrollY + hdr + (vh - hdr) * 0.3;   // the reading line, in document coordinates
    let current = null;
    for (const s of sectionTops) {
        if (s.top <= line) current = s.id;
    }
    // At the very bottom the last section is current, even if it is shorter than the reading line allows
    if (window.scrollY + vh >= document.documentElement.scrollHeight - 2) {
        current = sectionTops[sectionTops.length - 1].id;
    }
    if (current === activeNavId) return;
    activeNavId = current;
    navAnchors.forEach((a) => {
        if (a === navById.get(current)) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
    });
}

let navQueued = false;
window.addEventListener('scroll', () => {
    if (navQueued) return;
    navQueued = true;
    requestAnimationFrame(() => {
        navQueued = false;
        updateActiveNav();
    });
}, { passive: true });

function measureStack() {
    if (headerEl) document.documentElement.style.setProperty('--hdr', headerEl.offsetHeight + 'px');
    stackItems.forEach((el) => el.style.setProperty('--h', el.offsetHeight + 'px'));
    computeSectionTops();
    updateActiveNav();
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
