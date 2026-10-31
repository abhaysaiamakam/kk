import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase';

export const locationService = {
  /**
   * Toggles permanent live location sharing for a patient
   */
  async setLocationSharingEnabled(patientId: string, enabled: boolean): Promise<void> {
    try {
      const patientRef = doc(firestore, 'patients', patientId.trim().toUpperCase());
      await updateDoc(patientRef, {
        liveLocationEnabled: enabled,
        updatedAt: new Date().toISOString()
      });
      console.log(`[LocationService] Location sharing set to: ${enabled} for patient: ${patientId}`);
    } catch (error) {
      console.error('[LocationService] Error setting location sharing:', error);
      throw error;
    }
  },

  /**
   * Update the patient's current live coordinates in Firestore
   */
  async updateLiveLocation(patientId: string, lat: number, lng: number): Promise<void> {
    try {
      const patientRef = doc(firestore, 'patients', patientId.trim().toUpperCase());
      await updateDoc(patientRef, {
        currentLatitude: lat,
        currentLongitude: lng,
        locationLastUpdated: new Date().toLocaleTimeString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('[LocationService] Error updating live location:', error);
    }
  }
};
