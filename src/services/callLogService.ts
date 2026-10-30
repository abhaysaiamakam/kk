import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { firestore, handleFirestoreError, OperationType } from './firebase';
import { CallLog } from '../types';

export const callLogService = {
  /**
   * Real-time listener for call logs onSnapshot
   * Subscribes to all documents in 'callLogs' collection and filters by user authorization client-side
   */
  subscribeToCallLogs(
    userUid: string,
    patientId: string | undefined,
    onUpdate: (logs: CallLog[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!userUid && !patientId) {
      onUpdate([]);
      return () => {};
    }

    const formattedPatientId = patientId ? patientId.trim().toUpperCase() : '';
    console.log(`[CallLogService] Subscribing to callLogs for userUid: "${userUid}", patientId: "${formattedPatientId}"`);

    const q = query(collection(firestore, 'callLogs'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: CallLog[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const logItem: CallLog = {
            id: data.id || docSnap.id,
            callLogId: data.callLogId || docSnap.id,
            patientUid: data.patientUid,
            patientId: data.patientId || 'P-UNKNOWN',
            caregiverUid: data.caregiverUid,
            callerUid: data.callerUid || '',
            callerName: data.callerName || 'Unknown Caller',
            callerRole: data.callerRole,
            receiverUid: data.receiverUid,
            receiverName: data.receiverName || 'Unknown Receiver',
            receiverRole: data.receiverRole,
            callType: data.callType || 'outgoing',
            callStatus: data.callStatus || 'completed',
            callDate: data.callDate || new Date().toLocaleDateString(),
            callTime: data.callTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: data.duration || '00:00',
            notes: data.notes || '',
            createdBy: data.createdBy || data.callerUid || '',
            createdByName: data.createdByName || data.callerName || '',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt,
            lastEditedBy: data.lastEditedBy,
            lastEditedByName: data.lastEditedByName
          };

          // Filter: include if userUid matches caller, receiver, patientUid, caregiverUid, createdBy OR patientId matches
          const matchesUid = (
            userUid &&
            (logItem.callerUid === userUid ||
             logItem.receiverUid === userUid ||
             logItem.patientUid === userUid ||
             logItem.caregiverUid === userUid ||
             logItem.createdBy === userUid)
          );
          const matchesPatientId = (
            formattedPatientId &&
            logItem.patientId &&
            logItem.patientId.toUpperCase() === formattedPatientId
          );

          if (matchesUid || matchesPatientId || (!userUid && !formattedPatientId)) {
            list.push(logItem);
          }
        });

        // Sort descending by createdAt
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        console.log(`[CallLogService] Received ${list.length} real call log(s) from Firestore.`);
        onUpdate(list);
      },
      (error) => {
        console.error('[CallLogService] CallLogs snapshot error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  },

  /**
   * Create a new call log in Firestore
   */
  async createCallLog(log: Omit<CallLog, 'id' | 'callLogId'> & { id?: string; callLogId?: string }): Promise<void> {
    const id = log.id || log.callLogId || `call-${Date.now()}`;
    const path = `callLogs/${id}`;

    const payload: CallLog = {
      ...log,
      id,
      callLogId: id,
      patientId: (log.patientId || 'P-UNKNOWN').toUpperCase(),
      createdAt: log.createdAt || new Date().toISOString()
    };

    try {
      await setDoc(doc(firestore, 'callLogs', id), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Update an existing call log in Firestore (e.g., adding notes, editing duration or timestamp)
   */
  async updateCallLog(callLogId: string, updates: Partial<CallLog>): Promise<void> {
    const path = `callLogs/${callLogId}`;

    try {
      await updateDoc(doc(firestore, 'callLogs', callLogId), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Delete a call log from Firestore
   */
  async deleteCallLog(callLogId: string): Promise<void> {
    const path = `callLogs/${callLogId}`;

    try {
      await deleteDoc(doc(firestore, 'callLogs', callLogId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
};
