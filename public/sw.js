// FicNation Service Worker — Caching & Offline Support
const CACHE_NAME = "ficnation-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/manifest.json",
  "/icon.png",
];

// 1. Instalación del Service Worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// 2. Activación y limpieza de cachés antiguas
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 3. Estrategia de red con fallback a caché (Network First with Cache Fallback)
self.addEventListener("fetch", (event) => {
  // Ignorar peticiones que no sean GET o APIs dinámicas de terceros
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Ignorar WebSocket y endpoints específicos de supabase en tiempo real
  if (url.protocol === "ws:" || url.protocol === "wss:") return;
  if (url.pathname.startsWith("/api/auth") || url.pathname.startsWith("/api/feedback")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es válida y no es una API, clonamos a la caché
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        // Si no hay conexión, intentar responder desde la caché
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        // Si es una navegación HTML y no está en caché, devolver fallback
        if (event.request.headers.get("accept")?.includes("text/html")) {
          const fallback = await caches.match("/");
          if (fallback) return fallback;
        }
        return new Response("Sin conexión a internet. FicNation Offline Activo.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: new Headers({ "Content-Type": "text/plain" }),
        });
      })
  );
});
