import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  setDoc, 
  updateDoc,
  serverTimestamp 
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
      collection(firestore, 'tasks')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: TaskItem[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const docPatientId = (data.patientId || '').toString().trim().toUpperCase();
          const docPatientUid = (data.patientUid || '').toString().trim();

          // Check if matches patientId or patientUid
          if (docPatientId === formattedId || docPatientUid === patientId || docPatientId === patientId.toUpperCase()) {
            list.push({
              id: data.id || docSnap.id,
              patientId: data.patientId || formattedId,
              patientUid: data.patientUid,
              caregiverUid: data.caregiverUid,
              assignedBy: data.assignedBy,
              assignedByName: data.assignedByName,
              title: data.title || 'Scheduled Task',
              description: data.description,
              time: data.time || 'Today',
              dueDate: data.dueDate,
              dueTime: data.dueTime,
              priority: data.priority || 'medium',
              category: data.category || 'medicine',
              completed: data.completed ?? false,
              snoozed: data.snoozed ?? false,
              missed: data.missed ?? false,
              completedAt: data.completedAt,
              completedTime: data.completedTime,
              patientConfirmation: data.patientConfirmation ?? false,
              patientConfirmed: data.patientConfirmed ?? false,
              status: data.status || (data.completed ? 'completed' : 'pending'),
              voiceReminderText: data.voiceReminderText,
              dosage: data.dosage,
              notes: data.notes,
              source: data.source || 'caregiver',
              createdBy: data.createdBy || 'caregiver',
              refillDays: data.refillDays,
              refillAlert: data.refillAlert
            });
          }
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
   * Save new task to Firestore with serverTimestamp
   */
  async createTask(task: TaskItem): Promise<void> {
    const taskId = task.id || `task-${Date.now()}`;
    const path = `tasks/${taskId}`;

    const rawPayload: any = {
      ...task,
      id: taskId,
      patientId: (task.patientId || '').toUpperCase(),
      patientUid: task.patientUid || '',
      caregiverUid: task.caregiverUid || '',
      status: task.status || 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const payload: any = {};
    for (const [key, value] of Object.entries(rawPayload)) {
      if (value !== undefined) {
        payload[key] = value;
      }
    }

    try {
      await setDoc(doc(firestore, 'tasks', taskId), payload);
      console.log(`[TaskService] Successfully created task ${taskId} in Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  /**
   * Update full task details in Firestore (for editing / reassigning)
   */
  async updateTask(taskId: string, updates: Partial<TaskItem>): Promise<void> {
    const path = `tasks/${taskId}`;

    try {
      const rawPayload: any = { 
        ...updates,
        updatedAt: serverTimestamp()
      };
      if (updates.patientId) {
        rawPayload.patientId = updates.patientId.toUpperCase();
      }
      const payload: any = {};
      for (const [key, value] of Object.entries(rawPayload)) {
        if (value !== undefined) {
          payload[key] = value;
        }
      }
      await updateDoc(doc(firestore, 'tasks', taskId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
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
        updatedAt: serverTimestamp(),
        ...(completed ? { completedAt: new Date().toISOString(), completedTime: nowTime } : {})
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  /**
   * Delete task from Firestore
   */
  async deleteTask(taskId: string): Promise<void> {
    const path = `tasks/${taskId}`;

    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(firestore, 'tasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  },

  /**
   * Helper to calculate display status from task properties
   */
  getCalculatedStatus(task: TaskItem): 'Pending' | 'In Progress' | 'Completed' | 'Overdue' {
    if (task.completed || task.status === 'completed') {
      return 'Completed';
    }
    if (task.status === 'in_progress' || task.snoozed) {
      return 'In Progress';
    }
    if (task.status === 'missed') {
      return 'Overdue';
    }
    // Check due date if available
    if (task.dueDate) {
      const today = new Date().toISOString().split('T')[0];
      if (task.dueDate < today) {
        return 'Overdue';
      }
    }
    return 'Pending';
  }
};
