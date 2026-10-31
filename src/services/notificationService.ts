import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { app, auth, firestore } from './firebase';

const deviceIdKey = 'keenkeep_notification_device_id';

function getDeviceId(): string {
  let id = localStorage.getItem(deviceIdKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(deviceIdKey, id);
  }
  return id;
}

export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (!window.isSecureContext) return false;
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop/Android notifications.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  },

  isSupported(): boolean {
    return 'Notification' in window;
  },

  getPermissionStatus(): NotificationPermission | 'unsupported' {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
  },

  async enablePushForUser(input: { uid: string; patientId: string; role: 'patient' | 'caregiver' }): Promise<void> {
    if (!window.isSecureContext || !('Notification' in window) || !('serviceWorker' in navigator)) {
      throw new Error('Push notifications are not supported by this browser. On iPhone, install KeenKeep to the Home Screen and open it there.');
    }
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
    if (!vapidKey) throw new Error('Push notifications are not configured yet. Add the Firebase Web Push certificate key to VITE_FIREBASE_VAPID_KEY and redeploy.');

    const granted = await this.requestPermission();
    if (!granted) throw new Error('Notification permission was not granted. Allow KeenKeep notifications in your browser or phone settings.');
    if (!(await isSupported())) throw new Error('This browser cannot receive Firebase push notifications. On iPhone, install KeenKeep to the Home Screen and open it there.');
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(getMessaging(app), { vapidKey, serviceWorkerRegistration: registration });
    if (!token) throw new Error('Firebase did not return a push token. Please try again.');

    const uid = auth.currentUser?.uid;
    if (!uid || uid !== input.uid) throw new Error('Your sign-in session changed. Sign in again, then enable notifications.');
    const patientId = input.patientId.trim().toUpperCase();
    if (!patientId) throw new Error('Select a patient before enabling task and SOS notifications.');

    await setDoc(doc(firestore, 'notificationDevices', `${uid}_${getDeviceId()}`), {
      uid,
      patientId,
      role: input.role,
      token,
      updatedAt: serverTimestamp(),
      userAgent: navigator.userAgent.slice(0, 300)
    });
  },

  async disablePushForUser(uid: string): Promise<void> {
    const id = localStorage.getItem(deviceIdKey);
    if (!id) return;
    await deleteDoc(doc(firestore, 'notificationDevices', `${uid}_${id}`));
  },

  async listenForForegroundPush(onNotification: (title: string, body: string, url?: string) => void): Promise<() => void> {
    if (!(await isSupported())) return () => {};
    return onMessage(getMessaging(app), (payload) => {
      const data = payload.data || {};
      if (data.title || data.body) onNotification(data.title || 'KeenKeep', data.body || '', data.url || '/');
    });
  },

  showLocalNotification(title: string, body: string, url = '/') {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              data: { url }
            });
          }).catch((err) => console.warn('Service worker notification failed:', err));
        } else {
          new Notification(title, {
            body,
            icon: '/icon-192.png'
          });
        }
      } catch (err) {
        console.warn('Failed to show notification:', err);
      }
    }
  },

};
