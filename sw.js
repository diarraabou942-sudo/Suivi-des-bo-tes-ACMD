const CACHE_NAME = "suivi-acmd-v4";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // On ne touche pas aux appels Supabase ou aux sites externes
  if (url.origin !== self.location.origin) return;

  // Pour les pages : réseau d'abord, cache en secours
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put("./index.html", copy);
          });

          return res;
        })
        .catch(() => caches.match("./index.html"))
    );

    return;
  }

  // Pour les fichiers locaux : cache puis réseau
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;

      return fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, copy);
          });
        }

        return res;
      });
    })
  );
});

self.addEventListener("push", event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (_) {
    data = {
      body: event.data
        ? event.data.text()
        : "Un rappel est disponible."
    };
  }

  const title =
    data.title ||
    "Suivi des boîtes ACMD";

  const options = {
    body:
      data.body ||
      "Des commerces sont à revoir.",

    icon: "./icon-192.png",
    badge: "./icon-192.png",

    tag:
      data.tag ||
      "acmd-reminder",

    renotify: true,

    data: {
      url:
        data.url ||
        "./"
    }
  };

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then(list => {
        for (const client of list) {
          if ("focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(
            event.notification?.data?.url ||
            "./"
          );
        }
      })
  );
});
