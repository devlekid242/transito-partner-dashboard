// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // apiUrl: 'http://localhost:8000/api',
  // baseApiUrl: 'http://localhost:8000',

  apiUrl: 'http://192.168.100.5:8000/api',
  baseApiUrl: 'http://192.168.100.5:8000',
  apiTimeout: 30000,
  // ⚠️ TODO : cette clé est identique à celle d'environment.prod.ts.
  // Un dev connecté en local reçoit/peut interférer avec les événements
  // Pusher de production sur le même compte. Créez une app Pusher dédiée
  // au dev (ou utilisez un cluster/app "staging") et remplacez la valeur
  // ci-dessous, par ex. via une variable d'environnement locale.
  pusherKey: '9fd9732315c0fe4be887', // <-- à remplacer par une clé DEV distincte
  pusherCluster: 'mt1',
  pusherUseTLS: true,
  pusherAuthEndpoint: 'http://192.168.100.5:8000/api/pusher/auth',

  firebaseConfig: {
    apiKey: 'AIzaSyCcSogGDcqoP1W30cHhYFSKzTtPEY-gL_8',
    authDomain: 'transito-6808c.firebaseapp.com',
    projectId: 'transito-6808c',
    storageBucket: 'transito-6808c.firebasestorage.app',
    messagingSenderId: '464724672027',
    appId: '1:464724672027:web:0b054ebb98ae89f91402be',
  },
  fcmVapidKey:
    'BBYvzPl1NgBLL2LSUGacZGwwwJrznGAR2aEdcRBQL08qHgmXahnFkJQKkyAvE7d-dr-H-mhZ4A5BRYhW27gWdOY',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
