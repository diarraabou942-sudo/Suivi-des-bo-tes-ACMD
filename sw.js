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
    renotify: Boolean(data.renotify),
    data: {
      url: data.url || "./",
      type: data.type || "reminder",
      conversation_id: data.conversation_id || null
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const notificationData = event.notification?.data || {};

  const targetUrl = new URL(
    notificationData.url || "./",
    self.registration.scope
  ).href;

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true
      })
      .then(async list => {
        for (const client of list) {
          try {
            if ("navigate" in client) {
              const navigatedClient =
                await client.navigate(targetUrl);

              if (
                navigatedClient &&
                "focus" in navigatedClient
              ) {
                await navigatedClient.focus();
              }

              if (
                navigatedClient &&
                notificationData.type === "chat" &&
                notificationData.conversation_id
              ) {
                navigatedClient.postMessage({
                  type: "OPEN_CHAT",
                  conversation_id:
                    notificationData.conversation_id
                });
              }

              return;
            }
          } catch (e) {
            // Si la navigation échoue,
            // on essaie simplement de remettre
            // l'application au premier plan.
          }

          if ("focus" in client) {
            await client.focus();

            if (
              notificationData.type === "chat" &&
              notificationData.conversation_id
            ) {
              client.postMessage({
                type: "OPEN_CHAT",
                conversation_id:
                  notificationData.conversation_id
              });
            }

            return;
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
