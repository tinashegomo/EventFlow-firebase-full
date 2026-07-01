/* eslint-disable */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAK0wP3wqBvmfSpv4sfp5alIzKvU7_TdSc',
  authDomain: 'eventflow-8da1b.firebaseapp.com',
  projectId: 'eventflow-8da1b',
  storageBucket: 'eventflow-8da1b.appspot.com',
  messagingSenderId: '643178551147',
  appId: '1:643178551147:web:59c4f82d83866f4f33de2e',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(({ notification }) => {
  if (!notification) return;

  self.registration.showNotification(notification.title || 'EventFlow', {
    body: notification.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [200, 100, 200],
    ...(notification.data?.click_action && {
      data: { url: notification.data.click_action },
    }),
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const matching = windowClients.find((c) => c.url.includes(url));
      if (matching) {
        matching.focus();
      } else {
        clients.openWindow(url);
      }
    })
  );
});
