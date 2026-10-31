importScripts('https://www.gstatic.com/firebasejs/13.1.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/13.1.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCBM3LGpLj9KVMpEJItQfik8suG85SDEe8',
  authDomain: 'keenkeep-live-2026.firebaseapp.com',
  projectId: 'keenkeep-live-2026',
  storageBucket: 'keenkeep-live-2026.firebasestorage.app',
  messagingSenderId: '504448463283',
  appId: '1:504448463283:web:2172803b0fb737ee9ddbc6'
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || payload.notification?.title || 'KeenKeep alert';
  const body = data.body || payload.notification?.body || 'Open KeenKeep to view the latest update.';
  return self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'keenkeep-' + Date.now(),
    data: { url: data.url || '/' }
  });
});

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
