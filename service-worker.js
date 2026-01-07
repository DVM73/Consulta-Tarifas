
const CACHE_NAME = 'tarifas-app-cache-v7';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

// Instalación: Cachear recursos estáticos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación: Limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Borrando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepción de peticiones (Estrategia: Stale-While-Revalidate para archivos, Network First para API)
self.addEventListener('fetch', (event) => {
  // No cachear peticiones a APIs externas o extensiones
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si hay caché, la devolvemos, pero actualizamos en segundo plano
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Solo cacheamos respuestas válidas y de nuestro propio origen (o CDNs fiables)
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });

      // Devolver lo que llegue primero (normalmente caché) o esperar red si no hay caché
      return cachedResponse || fetchPromise;
    })
  );
});