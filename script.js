// Dark mode and the old sheet cache were removed; clear values saved by earlier visits
try {
    localStorage.removeItem('theme');
    ['writing', 'projects', 'skills'].forEach((name) => localStorage.removeItem('sheet:' + name));
} catch { /* storage unavailable */ }

// Time-based hero greeting
const greetingText = document.getElementById('greetingText');
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
if (greetingText) greetingText.textContent = `${greeting}, I'm`;

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navOverlay = document.getElementById('navOverlay');

function setMenu(open) {
    navLinks.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    // Stop the page behind the menu from scrolling on touch devices.
    document.documentElement.classList.toggle('menu-open', open);
    if (navOverlay) {
        navOverlay.classList.toggle('show', open);
        navOverlay.setAttribute('aria-hidden', String(!open));
    }
    // Keep the page behind the menu out of the tab order and the accessibility tree.
    for (const background of [document.querySelector('main'), document.querySelector('footer')]) {
        if (background) background.inert = open;
    }
    if (open && document.activeElement === navToggle) {
        const firstLink = navLinks.querySelector('a');
        if (firstLink) firstLink.focus();
    }
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
    if (navOverlay) navOverlay.addEventListener('click', () => { setMenu(false); navToggle.focus(); });
    document.addEventListener('keydown', (e) => {
        if (!navLinks.classList.contains('open')) return;
        if (e.key === 'Escape') {
            setMenu(false);
            navToggle.focus();
        } else if (e.key === 'Tab') {
            // Cycle focus between the toggle and the links while the menu is open.
            const focusables = [...navLinks.querySelectorAll('a[href]'), navToggle];
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });

    // Reset if the viewport grows past the mobile breakpoint
    window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => {
        if (e.matches) {
            setMenu(false);
            (navLinks.querySelector('a') || navToggle).focus();
        }
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
        // Fallback value for the header progress line in browsers without scroll timelines.
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        document.documentElement.style.setProperty(
            '--scroll-progress', maxScroll > 0 ? Math.min(1, window.scrollY / maxScroll) : 0
        );
        updateActiveNav();
    });
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    });
}


// Traits strip: duplicate the list so it can loop seamlessly on small screens
const stripTrack = document.querySelector('.strip .track');
if (stripTrack && stripTrack.firstElementChild) {
    const copy = stripTrack.firstElementChild.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    stripTrack.appendChild(copy);
}

// Cards fade and rise into view as they scroll on screen (skipped for reduced motion).
function revealOnScroll(cards) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;

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

// All section content is static HTML in index.html. Reveal the ruled entries, stats and project rows on scroll.
revealOnScroll([...document.querySelectorAll('.entry, .stat, .project')]);

function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
}

// About stats: count-up on first reveal. The number ascends from zero to its value (3.90 runs 0.00 → 3.90, 100+ runs 000 → 100, 4th runs 0th → 4th) with an ease-out,
// zero-padded to the final width so the mono font never shifts the suffix. The real text stays in a visually hidden span for screen readers.
function shuffleStats() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
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
        if (a === navById.get(current)) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
    });
}

function measureStack() {
    // Read all geometry first, then write, to avoid interleaved layout work.
    const headerHeight = headerEl ? headerEl.offsetHeight : 0;
    const heights = stackItems.map((el) => el.offsetHeight);
    document.documentElement.style.setProperty('--hdr', headerHeight + 'px');
    stackItems.forEach((el, i) => el.style.setProperty('--h', heights[i] + 'px'));
    computeSectionTops();
    updateActiveNav();
}

let measureQueued = false;
function scheduleMeasure() {
    if (measureQueued) return;
    measureQueued = true;
    requestAnimationFrame(() => {
        measureQueued = false;
        measureStack();
    });
}

measureStack();
window.addEventListener('resize', scheduleMeasure);
window.addEventListener('load', scheduleMeasure);
if ('ResizeObserver' in window) {
    // Sections change height when the layout changes.
    // Debouncing to one frame keeps the observer from reacting to its own writes.
    const ro = new ResizeObserver(scheduleMeasure);
    stackItems.forEach((el) => ro.observe(el));
    if (headerEl) ro.observe(headerEl);
}

// Pinned sections report their pinned position, so in-page links can't rely on the browser's own jump.
// A section's natural position is the sum of the heights of everything above it.
function scrollToId(id) {
    const target = id ? document.getElementById(id) : null;
    if (!target || !mainEl) return false;

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
        return false;
    }

    window.scrollTo({ top: Math.max(0, y), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
    // Move focus with the jump so keyboard and screen-reader users land on the section.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    return true;
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
        if (scrollToId(link.getAttribute('href').slice(1))) e.preventDefault();
    });
});

if (location.hash) {
    window.addEventListener('load', () => scrollToId(location.hash.slice(1)));
}
