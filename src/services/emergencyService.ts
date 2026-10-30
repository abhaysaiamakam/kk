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
import { EmergencyAlertItem } from '../types';

export const emergencyService = {
  /**
   * Real-time listener for emergency / SOS alerts onSnapshot
   */
  subscribeToEmergencyAlerts(
    patientId: string,
    onUpdate: (alerts: EmergencyAlertItem[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!patientId) {
      onUpdate([]);
      return () => {};
    }

    const formattedId = patientId.trim().toUpperCase();
    console.log(`[EmergencyService] Subscribing to real-time SOS alerts for patientId: "${formattedId}"`);

    const q = query(
      collection(firestore, 'alerts'),
      where('patientId', '==', formattedId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: EmergencyAlertItem[] = [];
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: data.id || docSnap.id,
            patientId: data.patientId || formattedId,
            patientName: data.patientName || 'Patient',
            time: data.time || 'Just now',
            timestamp: data.timestamp || new Date().toISOString(),
            status: data.status || 'active',
            location: data.location || 'Home Location',
            hasVoiceNote: data.hasVoiceNote ?? false,
            resolvedAt: data.resolvedAt
          });
        });

        console.log(`[EmergencyService] Received ${list.length} real alert record(s) from Firestore.`);
        onUpdate(list);
      },
      (error) => {
        console.error('[EmergencyService] Alerts snapshot error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  },

  /**
   * Trigger SOS alert in Firestore
   */
  async triggerSOS(params: {
    patientId: string;
    patientUid?: string;
    patientName: string;
    location?: string;
  }): Promise<string> {
    const alertId = `sos-${params.patientId.toUpperCase()}-${Date.now()}`;
    const path = `alerts/${alertId}`;
    const nowIso = new Date().toISOString();

    const alertDoc: EmergencyAlertItem = {
      id: alertId,
      patientId: params.patientId.toUpperCase(),
      patientName: params.patientName,
      time: 'Just now',
      timestamp: nowIso,
      status: 'active',
      hasVoiceNote: false,
      location: params.location || 'Bengaluru, Karnataka (Live ±5m Accuracy)'
    };

    try {
      console.log('[EmergencyService] Triggering real SOS Alert in Firestore:', alertDoc);
      await setDoc(doc(firestore, 'alerts', alertId), alertDoc);

      // Also update patient document status to 'sos_alert'
      try {
        await updateDoc(doc(firestore, 'patients', params.patientId.toUpperCase()), {
          status: 'sos_alert',
          updatedAt: nowIso
        });
      } catch (e) {
        console.warn('Patient index status update note:', e);
      }

      if (params.patientUid) {
        try {
          await updateDoc(doc(firestore, 'users', params.patientUid), {
            status: 'sos_alert',
            updatedAt: nowIso
          });
        } catch (e) {
          console.warn('Patient user status update note:', e);
        }
      }

      return alertId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  /**
   * Resolve active SOS alert in Firestore
   */
  async resolveSOS(patientId: string, resolvedBy: string = 'Caregiver'): Promise<void> {
    const formattedId = patientId.trim().toUpperCase();
    const nowIso = new Date().toISOString();

    try {
      // 1. Update patient index status to 'all_good'
      try {
        await updateDoc(doc(firestore, 'patients', formattedId), {
          status: 'all_good',
          updatedAt: nowIso
        });
      } catch (e) {
        console.warn('Patient index status resolution note:', e);
      }

      // 2. Find and update active alerts in 'alerts' collection
      const q = query(
        collection(firestore, 'alerts'),
        where('patientId', '==', formattedId),
        where('status', '==', 'active')
      );
      const snap = await onSnapshot(q, (snapshot) => {
        snapshot.docs.forEach(async (docSnap) => {
          await updateDoc(doc(firestore, 'alerts', docSnap.id), {
            status: 'resolved',
            resolvedBy,
            resolvedAt: nowIso
          });
        });
      });
      // Unsubscribe query listener after resolve
      setTimeout(() => snap(), 2000);

      console.log(`[EmergencyService] SOS emergency resolved for patient ${formattedId} by ${resolvedBy}.`);
    } catch (error) {
      console.warn('resolveSOS error:', error);
    }
  }
};
