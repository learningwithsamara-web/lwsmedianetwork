// LWS Media Network — Service Worker
// Version: lws-media-v1.0.3

var CACHE_NAME = 'lws-media-v1.0.1';

var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/article.html',
  '/archive.html',
  '/about.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/advertise.html',
  '/consent.html',
  '/content.json',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css'
];

// Install — cache all static assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activate — clean up old caches
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { return caches.delete(name); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — network first for content.json (always fresh articles)
// Cache first for everything else
self.addEventListener('fetch', function(event) {
  var url = event.request.url;

  // Always fetch content.json fresh from network
  if (url.indexOf('content.json') !== -1) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Cache first for all other assets
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
