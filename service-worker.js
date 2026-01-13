
const CACHE_NAME = 'tarifas-app-cache-v11';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json'
];

// Instalación: Cachear recursos estáticos
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Forzar activación inmediata
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activación: Limpieza agresiva de versiones antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('💥 Service Worker: Eliminando caché obsoleta:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Tomar control de los clientes inmediatamente
});

// Intercepción de peticiones
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean http (como chrome-extension://)
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Estrategia: Cache First, falling back to Network
      // Pero si estamos en desarrollo/preview, podríamos preferir Network First, 
      // sin embargo, mantendremos la lógica estándar pero asegurando que la versión v11 invalide lo anterior.
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
         // Fallback offline si falla la red
      });
      return cachedResponse || fetchPromise;
    })
  );
});