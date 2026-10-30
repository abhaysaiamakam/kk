import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  setDoc 
} from 'firebase/firestore';
import { firestore, handleFirestoreError, OperationType } from './firebase';
import { MoodRecord, MoodType } from '../types';

export const moodService = {
  /**
   * Real-time listener for patient mood entries onSnapshot
   */
  subscribeToMoodRecords(
    patientId: string,
    onUpdate: (moods: MoodRecord[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!patientId) {
      onUpdate([]);
      return () => {};
    }

    const formattedId = patientId.trim().toUpperCase();
    console.log(`[MoodService] Subscribing to real-time mood entries for patientId: "${formattedId}"`);

    const q = query(
      collection(firestore, 'moods'),
      where('patientId', '==', formattedId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: MoodRecord[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: data.id || docSnap.id,
            patientId: data.patientId || formattedId,
            mood: data.mood as MoodType,
            date: data.date || new Date().toISOString().split('T')[0],
            dayOfWeek: data.dayOfWeek,
            day: data.day,
            timeOfDay: data.timeOfDay,
            timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            note: data.note
          });
        });

        console.log(`[MoodService] Received ${list.length} real mood record(s) from Firestore.`);
        onUpdate(list);
      },
      (error) => {
        console.error('[MoodService] Moods snapshot error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  },

  /**
   * Log new mood record in Firestore
   */
  async addMoodRecord(mood: Omit<MoodRecord, 'id'> & { id?: string }): Promise<void> {
    const moodId = mood.id || `m-${Date.now()}`;
    const path = `moods/${moodId}`;

    const payload: MoodRecord = {
      ...mood,
      id: moodId,
      patientId: mood.patientId.toUpperCase(),
      date: mood.date || new Date().toISOString().split('T')[0],
      timestamp: mood.timestamp || new Date().toISOString()
    };

    try {
      await setDoc(doc(firestore, 'moods', moodId), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
