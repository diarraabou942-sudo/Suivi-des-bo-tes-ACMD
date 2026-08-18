self.addEventListener("push", event => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: "Suivi des boîtes ACMD",
      body: event.data ? event.data.text() : "Vous avez un rappel."
    };
  }

  const title = data.title || "Suivi des boîtes ACMD";

  const options = {
    body: data.body || "Une fiche nécessite votre attention.",
    icon: data.icon || "./icon-192.png",
    badge: data.badge || "./icon-192.png",
    tag: data.tag || "acmd-rappel",
    data: {
      url: data.url || "./"
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url || "./";

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
          return clients.openWindow(targetUrl);
        }
      })
  );
});
