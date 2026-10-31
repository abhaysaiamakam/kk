import { TaskItem } from '../types';

export const notificationService = {
  async requestPermission(): Promise<boolean> {
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
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              data: { url }
            });
          });
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
