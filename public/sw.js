/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'mcp-hub-v1';
const STATIC_CACHE = 'mcp-hub-static-v1';
const API_CACHE = 'mcp-hub-api-v1';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name.startsWith('mcp-hub-') &&
              name !== CACHE_NAME &&
              name !== STATIC_CACHE &&
              name !== API_CACHE
            );
          })
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Take control of all pages immediately
  self.clients.claim();
});

// Fetch event - network first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests - network first, cache fallback
  if (url.pathname.includes('/rest/') || url.pathname.includes('/auth/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - cache first, network fallback
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Navigation requests - network first with offline page fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Default - network first
  event.respondWith(networkFirstStrategy(request));
});

// Network first strategy
async function networkFirstStrategy(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Try to get from cache
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    
    // Return offline response for API calls
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'You are currently offline.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Cache first strategy
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cached = await caches.match(request);
  if (cached) {
    // Fetch and update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then((cache) => {
          cache.put(request, response);
        });
      }
    });
    return cached;
  }
  
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

// Navigation strategy
async function navigationStrategy(request: Request): Promise<Response> {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    // Return cached index.html for SPA routing
    const cached = await caches.match('/index.html');
    if (cached) {
      return cached;
    }
    
    // Ultimate fallback
    return new Response(
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - MCP Hub</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      background: #0a0e17;
      color: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    h1 { color: #00d4ff; }
    button {
      background: #00d4ff;
      color: #0a0e17;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div>
    <h1>You're Offline</h1>
    <p>Please check your internet connection and try again.</p>
    <button onclick="location.reload()">Retry</button>
  </div>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// Check if request is for a static asset
function isStaticAsset(pathname: string): boolean {
  const staticExtensions = [
    '.js',
    '.css',
    '.woff',
    '.woff2',
    '.ttf',
    '.otf',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.ico',
    '.webp',
  ];
  return staticExtensions.some((ext) => pathname.endsWith(ext));
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options: NotificationOptions = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'mcp-hub-notification',
    data: data.data,
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window if open
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});

export {};
