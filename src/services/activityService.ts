import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  setDoc, 
  updateDoc 
} from 'firebase/firestore';
import { firestore, handleFirestoreError, OperationType } from './firebase';
import { ActivityLog, TaskStatus } from '../types';

export const activityService = {
  /**
   * Real-time listener for patient activities onSnapshot
   */
  subscribeToActivities(
    patientId: string,
    onUpdate: (activities: ActivityLog[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!patientId) {
      onUpdate([]);
      return () => {};
    }

    const formattedId = patientId.trim().toUpperCase();
    console.log(`[ActivityService] Subscribing to real-time activities for patientId: "${formattedId}"`);

    const q = query(
      collection(firestore, 'activities'),
      where('patientId', '==', formattedId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: ActivityLog[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: data.id || docSnap.id,
            patientId: data.patientId || formattedId,
            taskName: data.taskName || 'Activity',
            category: data.category || 'activity',
            scheduledTime: data.scheduledTime || 'Today',
            completedTime: data.completedTime,
            status: data.status || 'upcoming',
            patientConfirmed: data.patientConfirmed ?? false,
            source: data.source || 'system',
            timestamp: data.timestamp || new Date().toISOString()
          });
        });

        console.log(`[ActivityService] Received ${list.length} real activity record(s) from Firestore.`);
        onUpdate(list);
      },
      (error) => {
        console.error('[ActivityService] Activities snapshot error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  },

  /**
   * Add a new activity record to Firestore
   */
  async addActivity(activity: Omit<ActivityLog, 'id'> & { id?: string }): Promise<void> {
    const actId = activity.id || `act-${Date.now()}`;
    const path = `activities/${actId}`;

    const payload: ActivityLog = {
      ...activity,
      id: actId,
      patientId: activity.patientId.toUpperCase(),
      timestamp: activity.timestamp || new Date().toISOString()
    };

    try {
      await setDoc(doc(firestore, 'activities', actId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Update activity status in Firestore
   */
  async updateActivityStatus(activityId: string, status: TaskStatus, completedTime?: string): Promise<void> {
    const path = `activities/${activityId}`;
    try {
      await updateDoc(doc(firestore, 'activities', activityId), {
        status,
        patientConfirmed: status === 'completed',
        ...(completedTime ? { completedTime } : {})
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
