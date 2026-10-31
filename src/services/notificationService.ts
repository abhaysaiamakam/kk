import { TaskItem } from '../types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from './firebase';

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

  subscribeToRealtimeEvents(patientId: string): () => void {
    if (!patientId) return () => {};
    const formattedId = patientId.trim().toUpperCase();
    let tasksReady = false;
    let alertsReady = false;
    const taskQuery = query(collection(firestore, 'tasks'), where('patientId', '==', formattedId));
    const alertQuery = query(collection(firestore, 'alerts'), where('patientId', '==', formattedId));
    const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => {
      if (!tasksReady) {
        tasksReady = true;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        const task = change.doc.data();
        if (change.type === 'added') {
          this.showLocalNotification('New care task', `${task.title || 'A task'} is scheduled for ${task.time || task.dueTime || 'today'}.`);
        } else if (change.type === 'modified' && (task.completed === true || task.status === 'completed')) {
          this.showLocalNotification('Task completed', `${task.title || 'A care task'} was marked complete.`);
        }
      });
    }, (error) => console.error('[NotificationService] Task listener failed:', error));
    const unsubscribeAlerts = onSnapshot(alertQuery, (snapshot) => {
      if (!alertsReady) {
        alertsReady = true;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        const alert = change.doc.data();
        if (change.type === 'added' && alert.status === 'active') {
          this.showLocalNotification('Emergency SOS', `${alert.patientName || 'A patient'} needs help. Open KeenKeep to view their location.`, '/');
        } else if (change.type === 'modified' && alert.status === 'resolved') {
          this.showLocalNotification('SOS resolved', `${alert.patientName || 'The patient'}’s emergency was marked resolved.`);
        }
      });
    }, (error) => console.error('[NotificationService] SOS listener failed:', error));
    return () => {
      unsubscribeTasks();
      unsubscribeAlerts();
    };
  },

  scheduleTaskReminder(task: TaskItem) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // Calculate time until task
    try {
      const now = new Date();
      // Parse task time (e.g. "09:00 AM")
      const [timeStr, modifier] = task.time.split(' ');
      let [hours, minutes] = timeStr.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;

      const taskDate = new Date();
      taskDate.setHours(hours, minutes, 0, 0);

      const delay = taskDate.getTime() - now.getTime();
      if (delay > 0) {
        setTimeout(() => {
          this.showLocalNotification(
            `Reminder: ${task.title}`,
            `Scheduled for ${task.time} (${task.patientName || 'Patient'})`
          );
        }, delay);
      }
    } catch (e) {
      console.warn('Error scheduling task reminder:', e);
    }
  }
};
