// BlipVibe Service Worker — offline caching for static assets
var CACHE_NAME = 'blipvibe-v2';
var ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/js/supabase.js',
    '/images/blipvibe-logo.png',
    '/images/blipvibe-logo.webp',
    '/images/default-avatar.svg'
];

// Install — cache static assets
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(function() {
            return self.skipWaiting();
        })
    );
});

// Activate — clean old caches
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(names) {
            return Promise.all(
                names.filter(function(name) { return name !== CACHE_NAME; })
                    .map(function(name) { return caches.delete(name); })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Fetch — network first, fall back to cache for static assets
self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);

    // Skip non-GET, Supabase API calls, and external URLs
    if (event.request.method !== 'GET') return;
    if (url.hostname.includes('supabase')) return;
    if (url.hostname.includes('googleapis') || url.hostname.includes('cdnjs') || url.hostname.includes('jsdelivr')) {
        // CDN resources — cache first, network fallback
        event.respondWith(
            caches.match(event.request).then(function(cached) {
                if (cached) return cached;
                return fetch(event.request).then(function(response) {
                    if (response.ok) {
                        var clone = response.clone();
                        caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
                    }
                    return response;
                });
            })
        );
        return;
    }

    // Same-origin assets — network first, cache fallback
    if (url.origin === self.location.origin) {
        event.respondWith(
            fetch(event.request).then(function(response) {
                if (response.ok) {
                    var clone = response.clone();
                    caches.open(CACHE_NAME).then(function(cache) { cache.put(event.request, clone); });
                }
                return response;
            }).catch(function() {
                return caches.match(event.request);
            })
        );
    }
});
