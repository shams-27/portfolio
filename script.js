const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Time-based hero greeting
const greetingElement = document.getElementById('greeting');
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
greetingElement.textContent = `${greeting}, I'm`;

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close the menu once a link is tapped
    navLinks.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
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

// Copy-email button
const copyEmailBtn = document.getElementById('copyEmailBtn');

if (copyEmailBtn) {
    const originalLabel = copyEmailBtn.textContent.trim();
    copyEmailBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(copyEmailBtn.dataset.email);
        } catch (err) {
            console.error('Could not copy email:', err);
            return;
        }
        copyEmailBtn.textContent = 'Copied!';
        copyEmailBtn.classList.add('copied');
        setTimeout(() => {
            copyEmailBtn.textContent = originalLabel;
            copyEmailBtn.classList.remove('copied');
        }, 2000);
    });
}
