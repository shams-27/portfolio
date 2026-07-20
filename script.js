// Time-based hero greeting
const greetingElement = document.getElementById('greeting');
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
greetingElement.textContent = `${greeting}, I'm Shams Kabir.`;

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

// Scroll-triggered reveal animation
const revealElements = document.querySelectorAll('.reveal');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (revealElements.length) {
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealElements.forEach((el) => el.classList.add('revealed'));
    } else {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        revealElements.forEach((el) => revealObserver.observe(el));
    }
}

// Back-to-top button
const backToTopBtn = document.getElementById('backToTop');

if (backToTopBtn) {
    window.addEventListener('scroll', () => {
        backToTopBtn.classList.toggle('visible', window.scrollY > 400);
    });
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
}

// Contact form submission
const contactForm = document.querySelector('#contact-form');
const formStatus = document.querySelector('#form-status');

if (contactForm && formStatus) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(contactForm);

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    Accept: 'application/json'
                }
            });

            if (response.ok) {
                formStatus.textContent = 'Thank you! Your message has been sent.';
                formStatus.classList.remove('form-status-error');
                formStatus.classList.add('form-status-success');
                contactForm.reset();
            } else {
                throw new Error('Submission failed');
            }
        } catch (err) {
            console.error('Could not send message:', err);
            formStatus.textContent = 'Something went wrong. Please try again.';
            formStatus.classList.remove('form-status-success');
            formStatus.classList.add('form-status-error');
        }
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
