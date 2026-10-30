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
import { TaskItem, TaskStatus } from '../types';

export const taskService = {
  /**
   * Real-time listener for tasks/medications onSnapshot
   */
  subscribeToTasks(
    patientId: string,
    onUpdate: (tasks: TaskItem[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!patientId) {
      onUpdate([]);
      return () => {};
    }

    const formattedId = patientId.trim().toUpperCase();
    console.log(`[TaskService] Subscribing to real-time tasks/medications for patientId: "${formattedId}"`);

    const q = query(
      collection(firestore, 'tasks'),
      where('patientId', '==', formattedId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: TaskItem[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: data.id || docSnap.id,
            patientId: data.patientId || formattedId,
            title: data.title || 'Scheduled Task',
            time: data.time || 'Today',
            category: data.category || 'medicine',
            completed: data.completed ?? false,
            snoozed: data.snoozed ?? false,
            missed: data.missed ?? false,
            completedAt: data.completedAt,
            completedTime: data.completedTime,
            patientConfirmation: data.patientConfirmation ?? false,
            patientConfirmed: data.patientConfirmed ?? false,
            status: data.status || (data.completed ? 'completed' : 'upcoming'),
            voiceReminderText: data.voiceReminderText,
            dosage: data.dosage,
            notes: data.notes,
            source: data.source || 'caregiver'
          });
        });

        console.log(`[TaskService] Received ${list.length} real task/medication record(s) from Firestore.`);
        onUpdate(list);
      },
      (error) => {
        console.error('[TaskService] Tasks snapshot error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  },

  /**
   * Save new task to Firestore
   */
  async createTask(task: TaskItem): Promise<void> {
    const taskId = task.id || `task-${Date.now()}`;
    const path = `tasks/${taskId}`;

    const payload: TaskItem = {
      ...task,
      id: taskId,
      patientId: task.patientId.toUpperCase(),
      status: task.status || 'upcoming'
    };

    try {
      await setDoc(doc(firestore, 'tasks', taskId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Update task status in Firestore
   */
  async updateTaskStatus(taskId: string, status: TaskStatus, completed: boolean): Promise<void> {
    const path = `tasks/${taskId}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      await updateDoc(doc(firestore, 'tasks', taskId), {
        status,
        completed,
        snoozed: status === 'snoozed',
        patientConfirmed: completed,
        patientConfirmation: completed,
        ...(completed ? { completedAt: new Date().toISOString(), completedTime: nowTime } : {})
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
