import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { firestore, handleFirestoreError, OperationType } from './firebase';
import { authService } from './authService';
import { PatientProfile } from '../types';
import { calculateAgeFromDob } from '../utils/ageUtils';

export const patientService = {
  /**
   * Fetch connected patient profiles for a caregiver from Firestore
   */
  async getConnectedPatientsForCaregiver(caregiverUid: string): Promise<PatientProfile[]> {
    return authService.getPatientsForCaregiver(caregiverUid);
  },

  /**
   * Real-time listener for connected patients for a caregiver (onSnapshot)
   */
  subscribeToConnectedPatients(
    caregiverUid: string,
    onUpdate: (patients: PatientProfile[]) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!caregiverUid) {
      onUpdate([]);
      return () => {};
    }

    console.log(`[PatientService] Setting up real-time listener for caregiver: ${caregiverUid}`);

    // Listen to caregiver user doc to get connectedPatientIds in real time
    const caregiverRef = doc(firestore, 'users', caregiverUid);
    const unsubscribeCaregiver = onSnapshot(
      caregiverRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          const cData = docSnap.data();
          const connectedIds: string[] = cData.connectedPatientIds || [];
          console.log(`[PatientService] Caregiver connectedPatientIds updated:`, connectedIds);

          if (connectedIds.length === 0) {
            onUpdate([]);
            return;
          }

          // Fetch patient documents
          try {
            const patientsList = await authService.getPatientsForCaregiver(caregiverUid, connectedIds);
            onUpdate(patientsList);
          } catch (err) {
            console.warn('[PatientService] Error fetching connected patient details:', err);
          }
        } else {
          onUpdate([]);
        }
      },
      (error) => {
        console.error('[PatientService] Caregiver snapshot error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribeCaregiver;
  },

  /**
   * Real-time listener for a single patient profile document
   */
  subscribeToPatientProfile(
    patientId: string,
    onUpdate: (profile: PatientProfile | null) => void,
    onError?: (err: any) => void
  ): () => void {
    if (!patientId) {
      onUpdate(null);
      return () => {};
    }

    const formattedId = patientId.trim().toUpperCase();
    console.log(`[PatientService] Listening to patient profile: ${formattedId}`);

    // Check patients collection index document
    const patientRef = doc(firestore, 'patients', formattedId);
    const unsubscribePatientDoc = onSnapshot(
      patientRef,
      async (snap) => {
        if (snap.exists()) {
          const pData = snap.data();
          const pUid = pData.patientUid || pData.uid;

          let fullName = pData.name || pData.fullName || 'Patient';
          let ageVal = pData.age;
          let dobVal = pData.dateOfBirth;
          let bloodVal = pData.bloodGroup || 'Not added yet';
          let avatarVal = pData.avatar || pData.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80';
          let caregiverName = pData.caregiverName;
          let caregiverPhone = pData.caregiverPhone;
          let currentStatus = pData.status || 'all_good';

          if (pUid) {
            try {
              const uProfile = await authService.getUserProfile(pUid);
              if (uProfile) {
                fullName = uProfile.fullName || fullName;
                dobVal = uProfile.dateOfBirth || dobVal || String(uProfile.age || '');
                bloodVal = uProfile.bloodGroup || bloodVal;
                avatarVal = uProfile.photoURL || avatarVal;
                caregiverName = uProfile.caregiverName || caregiverName;
                caregiverPhone = uProfile.caregiverPhone || caregiverPhone;
              }
            } catch (e) {
              // Fallback to pData
            }
          }

          const dobStr = typeof dobVal === 'string' ? dobVal : String(dobVal || '');
          const calculatedAge = calculateAgeFromDob(dobStr || ageVal);

          const profile: PatientProfile = {
            id: formattedId,
            uid: pUid,
            name: fullName,
            age: calculatedAge,
            gender: 'Not added yet',
            bloodGroup: bloodVal,
            homeLocation: 'Not added yet',
            liveLocationEnabled: false,
            dateOfBirth: dobStr || 'Not added yet',
            avatar: avatarVal,
            status: currentStatus as any,
            streakDays: 0,
            overallCompletion: 0,
            caregiverId: caregiverName ? `${caregiverName} (${caregiverPhone || 'No phone'})` : 'Not added yet',
            caregiverName: caregiverName,
            caregiverPhone: caregiverPhone
          };

          onUpdate(profile);
        } else {
          // Query users collection by patientId
          const qUsers = query(
            collection(firestore, 'users'),
            where('patientId', '==', formattedId)
          );
          const uSnap = await getDocs(qUsers);
          if (!uSnap.empty) {
            const uData = uSnap.docs[0].data();
            const dobStr = uData.dateOfBirth || String(uData.age || '');
            const calculatedAge = calculateAgeFromDob(dobStr);

            onUpdate({
              id: formattedId,
              uid: uData.uid,
              name: uData.fullName,
              age: calculatedAge,
              gender: 'Not added yet',
              bloodGroup: uData.bloodGroup || 'Not added yet',
              homeLocation: 'Not added yet',
              liveLocationEnabled: false,
              dateOfBirth: dobStr || 'Not added yet',
              avatar: uData.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
              status: 'all_good',
              streakDays: 0,
              overallCompletion: 0,
              caregiverId: uData.caregiverName ? `${uData.caregiverName} (${uData.caregiverPhone || 'No phone'})` : 'Not added yet',
              caregiverName: uData.caregiverName,
              caregiverPhone: uData.caregiverPhone
            });
          } else {
            onUpdate(null);
          }
        }
      },
      (error) => {
        console.error('[PatientService] Patient profile snapshot error:', error);
        if (onError) onError(error);
      }
    );

    return unsubscribePatientDoc;
  }
};
