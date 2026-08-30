importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

// Config Firebase Web (identique à environment.firebaseConfig).
// Un service worker ne peut pas importer environment.ts (pas de bundling ici),
// donc ces valeurs sont dupliquées volontairement. Si tu régénères une config
// Firebase un jour, pense à mettre à jour les DEUX endroits.
firebase.initializeApp({
  apiKey: 'AIzaSyCcSogGDcqoP1W30cHhYFSKzTtPEY-gL_8',
  authDomain: 'transito-6808c.firebaseapp.com',
  projectId: 'transito-6808c',
  storageBucket: 'transito-6808c.firebasestorage.app',
  messagingSenderId: '464724672027',
  appId: '1:464724672027:web:0b054ebb98ae89f91402be',
});

const messaging = firebase.messaging();

/**
 * Déclenché quand un message FCM arrive alors que l'onglet est fermé ou
 * en arrière-plan. Le SDK affiche en principe déjà la notification
 * automatiquement grâce au champ "notification" du message FCM (voir
 * FcmPushService::sendToTokens côté backend), mais on la reconstruit ici
 * pour :
 * - forcer le même "tag" que BrowserNotificationService.show() côté Pusher,
 *   afin d'éviter un doublon visuel si les deux canaux livrent la même
 *   notification quasi simultanément,
 * - garder le clic cohérent avec le comportement de l'app (voir plus bas).
 */
messaging.onBackgroundMessage((payload) => {
  const notificationId = payload.data && payload.data.notificationId;
  const title = (payload.notification && payload.notification.title) || 'Transito';
  const body = (payload.notification && payload.notification.body) || '';

  self.registration.showNotification(title, {
    body,
    icon: '/assets/images/logo-symbole-trans.png',
    tag: notificationId ? `notification-${notificationId}` : undefined,
    data: payload.data || {},
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});