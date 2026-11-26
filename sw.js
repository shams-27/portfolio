// Service worker: network-first for pages, stale-while-revalidate for same-origin assets.
// Bump CACHE_NAME whenever a cached asset changes (see AGENTS.md). Cross-origin requests
// are left to the browser, never cached here.
const CACHE_NAME = 'portfolio-cache-v51';
const OFFLINE_URL = '/offline.html';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/offline.html',
    '/style.css',
    '/script.js',
    '/sitemap.xml',
    '/robots.txt',
    '/Shams.jpg',
    '/Shams-400.jpg',
    '/achievement.jpg',
    '/achievement-480.jpg',
    '/favicon.svg',
    '/favicon.ico',
    '/favicon-48x48.png',
    '/favicon-96x96.png',
    '/apple-touch-icon.png',
    '/icon-c.svg',
    '/og-image.png',
    '/posts/diu-codetrap-2025.html',
    '/fonts/inter-latin-variable.woff2',
    '/fonts/jetbrains-mono-latin-variable.woff2',
    '/fonts/instrument-serif-italic-latin.woff2',
    '/fonts/mr-dafoe-latin.woff2',
    // Icons for the skills and project stacks listed in index.html; new icons are cached on first use.
    '/icons/git/git-original.svg',
    '/icons/github/github-original.svg',
    '/icons/vscode/vscode-original.svg',
    '/icons/intellij/intellij-original.svg',
    '/icons/linux/linux-original.svg',
    '/icons/canva/canva-original.svg',
    '/icons/cplusplus/cplusplus-original.svg',
    '/icons/java/java-original.svg',
    '/icons/bash/bash-original.svg',
    '/icons/html5/html5-original.svg',
    '/icons/css3/css3-original.svg',
    '/icons/javascript/javascript-original.svg',
    '/icons/mysql/mysql-original.svg',
    '/icons/mariadb/mariadb-original.svg',
    '/icons/antigravity/antigravity-original.svg',
    '/icons/powershell/powershell-original.svg',
    '/icons/python/python-original.svg'
];

self.addEventListener('install', (event) => {
    // One missing file must not prevent the whole worker from installing.
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => Promise.allSettled(
                ASSETS_TO_CACHE.map((url) => cache.add(new Request(url, { cache: 'reload' })))
            ))
            .then((results) => {
                const failed = ASSETS_TO_CACHE.filter((_, i) => results[i].status === 'rejected');
                if (failed.length) console.warn('[sw] could not precache', failed.length, 'asset(s)');
                if (['/', '/offline.html', '/style.css', '/script.js'].some((url) => failed.includes(url))) {
                    throw new Error('[sw] core assets missing; install failed');
                }
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((names) => Promise.all(names
                .filter((name) => name.startsWith('portfolio-cache-') && name !== CACHE_NAME)
                .map((name) => caches.delete(name))))
            .then(() => self.clients.claim())
    );
});

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
    } catch {
        return (await cache.match(request)) || (await cache.match(OFFLINE_URL)) || Response.error();
    }
}

function staleWhileRevalidate(request, event) {
    const cachePromise = caches.open(CACHE_NAME);
    const cachedPromise = cachePromise.then((cache) => cache.match(request));
    const networkPromise = cachePromise.then((cache) => fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
    }));
    // waitUntil must be called synchronously, before the fetch handler returns.
    event.waitUntil(networkPromise.catch(() => {}));
    return cachedPromise.then((cached) => cached || networkPromise.catch(() => Response.error()));
}

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;
    const url = new URL(request.url);

    if (request.mode === 'navigate' && url.origin === self.location.origin) {
        event.respondWith(networkFirst(request));
    } else if (url.origin === self.location.origin) {
        event.respondWith(staleWhileRevalidate(request, event));
    }
});
