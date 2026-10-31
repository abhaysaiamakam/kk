import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';

type OneSignalNotification = {
  title?: string;
  body?: string;
  launchURL?: string;
};

type OneSignalClient = {
  init(options: { appId: string; serviceWorkerPath: string; serviceWorkerParam: { scope: string }; welcomeNotification: { disable: boolean } }): Promise<void>;
  login(externalId: string): Promise<void>;
  logout(): Promise<void>;
  Notifications: {
    permission: boolean;
    requestPermission(): Promise<void>;
    isPushSupported(): boolean;
    addEventListener(event: 'foregroundWillDisplay', listener: (event: { notification: OneSignalNotification }) => void): void;
    removeEventListener(event: 'foregroundWillDisplay', listener: (event: { notification: OneSignalNotification }) => void): void;
  };
  User: {
    PushSubscription: { optIn(): Promise<void>; optOut(): Promise<void>; optedIn: boolean };
  };
};

declare global {
  interface Window {
    OneSignalDeferred?: Array<(oneSignal: OneSignalClient) => void | Promise<void>>;
  }
}

const deviceIdKey = 'keenkeep_notification_device_id';
let oneSignalPromise: Promise<OneSignalClient> | undefined;

function getDeviceId(): string {
  let id = localStorage.getItem(deviceIdKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(deviceIdKey, id);
  }
  return id;
}

function getOneSignal(): Promise<OneSignalClient> {
  if (oneSignalPromise) return oneSignalPromise;
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
  if (!appId) return Promise.reject(new Error('Push notifications are not configured. Add the OneSignal App ID to VITE_ONESIGNAL_APP_ID and redeploy.'));
  if (!window.isSecureContext || !('serviceWorker' in navigator)) {
    return Promise.reject(new Error('Push notifications require HTTPS and a browser that supports service workers.'));
  }

  oneSignalPromise = new Promise<OneSignalClient>((resolve, reject) => {
    const queue = window.OneSignalDeferred ?? [];
    window.OneSignalDeferred = queue;
    queue.push(async (oneSignal) => {
      try {
        await oneSignal.init({
          appId,
          serviceWorkerPath: 'sw.js',
          serviceWorkerParam: { scope: '/' },
          welcomeNotification: { disable: true }
        });
        resolve(oneSignal);
      } catch (error) {
        oneSignalPromise = undefined;
        reject(error);
      }
    });

    if (!document.querySelector('script[data-onesignal-sdk]')) {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      script.dataset.onesignalSdk = 'true';
      script.onerror = () => {
        oneSignalPromise = undefined;
        reject(new Error('Could not load the OneSignal Web SDK. Check your network connection and content security policy.'));
      };
      document.head.appendChild(script);
    }
  });

  return oneSignalPromise;
}

export const notificationService = {
  async initialize(): Promise<void> {
    await getOneSignal();
  },

  async requestPermission(): Promise<boolean> {
    if (!window.isSecureContext || !('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const oneSignal = await getOneSignal();
    if (!oneSignal.Notifications.isPushSupported()) return false;
    await oneSignal.Notifications.requestPermission();
    return oneSignal.Notifications.permission;
  },

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator;
  },

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  async identifyUser(uid: string): Promise<void> {
    if (!uid) return;
    const oneSignal = await getOneSignal();
    await oneSignal.login(uid);
  },

  async enablePushForUser(input: { uid: string; patientId: string; role: 'patient' | 'caregiver' }): Promise<void> {
    if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator)) {
      throw new Error('Push notifications are not supported by this browser. On iPhone, install KeenKeep to the Home Screen and open it there.');
    }
    const uid = auth.currentUser?.uid;
    if (!uid || uid !== input.uid) throw new Error('Your sign-in session changed. Sign in again, then enable notifications.');
    const patientId = input.patientId.trim().toUpperCase();
    if (!patientId) throw new Error('Select a patient before enabling task and SOS notifications.');

    const oneSignal = await getOneSignal();
    if (!oneSignal.Notifications.isPushSupported()) throw new Error('This browser cannot receive web push notifications. On iPhone, install KeenKeep to the Home Screen and open it there.');
    if (!oneSignal.Notifications.permission) await oneSignal.Notifications.requestPermission();
    if (!oneSignal.Notifications.permission) throw new Error('Notification permission was not granted. Allow KeenKeep notifications in your browser or phone settings.');

    await oneSignal.login(uid);
    await oneSignal.User.PushSubscription.optIn();
    if (!oneSignal.User.PushSubscription.optedIn) throw new Error('OneSignal has not subscribed this browser yet. Check the browser notification permission and try again.');

    await setDoc(doc(firestore, 'notificationDevices', `${uid}_${getDeviceId()}`), {
      uid,
      onesignalExternalId: uid,
      patientId,
      role: input.role,
      updatedAt: serverTimestamp(),
      userAgent: navigator.userAgent.slice(0, 300)
    });
  },

  async disablePushForUser(uid: string): Promise<void> {
    const id = localStorage.getItem(deviceIdKey);
    if (id) await deleteDoc(doc(firestore, 'notificationDevices', `${uid}_${id}`));
    try {
      const oneSignal = await getOneSignal();
      await oneSignal.User.PushSubscription.optOut();
    } catch (error) {
      console.warn('[NotificationService] Could not opt out of OneSignal push:', error);
    }
  },

  async logoutUser(): Promise<void> {
    try {
      const oneSignal = await getOneSignal();
      await oneSignal.logout();
    } catch (error) {
      // OneSignal is optional until the app ID is configured.
      console.warn('[NotificationService] Could not clear OneSignal identity:', error);
    }
  },

  async listenForForegroundPush(onNotification: (title: string, body: string, url?: string) => void): Promise<() => void> {
    const oneSignal = await getOneSignal();
    const listener = ({ notification }: { notification: OneSignalNotification }) => {
      // The OneSignal SDK displays the foreground notification itself. This callback
      // only forwards the event for app UI/logging and must not create a duplicate OS alert.
      onNotification(notification.title || 'KeenKeep', notification.body || '', notification.launchURL || '/');
    };
    oneSignal.Notifications.addEventListener('foregroundWillDisplay', listener);
    return () => oneSignal.Notifications.removeEventListener('foregroundWillDisplay', listener);
  },

  showLocalNotification(title: string, body: string, url = '/') {
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: { url }
      })).catch((err) => console.warn('Service worker notification failed:', err));
    }
  }
};
