/**
 * Advanced Service Worker with Intelligent Caching
 * Implements stale-while-revalidate and cache-first strategies
 */

const CACHE_NAME = 'ibt2-v2.0.0';
const STATIC_CACHE = 'ibt2-static-v2.0.0';
const DYNAMIC_CACHE = 'ibt2-dynamic-v2.0.0';
const IMAGE_CACHE = 'ibt2-images-v2.0.0';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/ibt2/',
  '/ibt2/index.html',
  '/ibt2/assets/index-BCB2qpR9.js',
  '/ibt2/css/index-Bhnthg_A.css'
];

// Resources to cache on first access
const CACHE_PATTERNS = {
  static: /\.(js|css|woff2?|ttf|eot)$/,
  images: /\.(png|jpg|jpeg|gif|webp|svg|ico)$/,
  videos: /\.(mp4|webm|ogg)$/,
  audio: /\.(mp3|wav|ogg|m4a)$/
};

// Install event - cache critical resources
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache critical resources
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(CRITICAL_RESOURCES);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Strategy 1: Cache First for static assets
  if (CACHE_PATTERNS.static.test(pathname)) {
    return cacheFirst(request, STATIC_CACHE);
  }

  // Strategy 2: Cache First for images with long TTL
  if (CACHE_PATTERNS.images.test(pathname)) {
    return cacheFirst(request, IMAGE_CACHE);
  }

  // Strategy 3: Stale While Revalidate for videos/audio
  if (CACHE_PATTERNS.videos.test(pathname) || CACHE_PATTERNS.audio.test(pathname)) {
    return staleWhileRevalidate(request, DYNAMIC_CACHE);
  }

  // Strategy 4: Network First for HTML and API calls
  if (pathname.endsWith('.html') || pathname.startsWith('/api/')) {
    return networkFirst(request, DYNAMIC_CACHE);
  }

  // Strategy 5: Stale While Revalidate for everything else
  return staleWhileRevalidate(request, DYNAMIC_CACHE);
}

function canCacheResponse(response) {
  const hasPartialContent = response.status === 206 || response.headers.has('content-range');
  return response.ok && !hasPartialContent;
}

// Cache First Strategy
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (canCacheResponse(response)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return offline fallback if available
    return cache.match('/offline.html') || new Response('Offline', { status: 503 });
  }
}

// Network First Strategy
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const response = await fetch(request);
    if (canCacheResponse(response)) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(response => {
    if (canCacheResponse(response)) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Return cached version immediately if available
  if (cached) {
    return cached;
  }

  // Otherwise wait for network
  return fetchPromise || new Response('Offline', { status: 503 });
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Sync offline game saves, analytics, etc.
  const cache = await caches.open(DYNAMIC_CACHE);
  const requests = await cache.keys();
  
  for (const request of requests) {
    if (request.url.includes('/api/save')) {
      try {
        await fetch(request);
        await cache.delete(request);
      } catch (error) {
        // Keep in cache for next sync attempt
      }
    }
  }
}

// Push notifications for game updates
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: data.data,
      actions: [
        {
          action: 'open',
          title: 'Open Game'
        },
        {
          action: 'close',
          title: 'Close'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
