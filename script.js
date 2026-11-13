const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

