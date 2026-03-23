// ============================================================
// SERVICE WORKER — Dojo Ponce MMA PWA
// Versión: 1.0
// ============================================================

const CACHE_NAME = 'dojo-ponce-v1';
const CACHE_URLS = [
  './SistemaDojoPonceMMA_FINAL-9.html',
  './logo.png',
  './logo-sm.png',
  './dragon.png',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap'
];

// ── Instalación — cachear recursos esenciales ──
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cachear recursos locales (críticos)
      return cache.addAll([
        './SistemaDojoPonceMMA_FINAL-9.html',
        './logo.png',
        './logo-sm.png',
        './dragon.png'
      ]).catch(err => console.log('[SW] Error cacheando:', err));
    })
  );
  self.skipWaiting();
});

// ── Activación — limpiar caches viejos ──
self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Eliminando cache viejo:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ── Fetch — Network first, cache fallback ──
self.addEventListener('fetch', event => {
  // Solo interceptar GET
  if (event.request.method !== 'GET') return;
  
  // Firebase y APIs → siempre red (no cachear)
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('firebase') ||
    event.request.url.includes('googleapis.com/identitytoolkit')
  ) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la red responde bien, actualizar cache
        if (response && response.status === 200) {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, resClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin red → usar cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Si no hay cache y es la página principal → mostrar app igual
          if (event.request.destination === 'document') {
            return caches.match('./SistemaDojoPonceMMA_FINAL-9.html');
          }
        });
      })
  );
});
