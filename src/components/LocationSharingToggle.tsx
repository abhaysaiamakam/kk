import React, { useState, useEffect } from 'react';
import { MapPin, ShieldCheck, ShieldAlert } from 'lucide-react';
import { locationService } from '../services/locationService';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { PatientProfile } from '../types';

interface LocationSharingToggleProps {
  patient: PatientProfile;
}

export const LocationSharingToggle: React.FC<LocationSharingToggleProps> = ({ patient }) => {
  const [isEnabled, setIsEnabled] = useState(patient.liveLocationEnabled || false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!patient.id) return;
    const unsubscribe = onSnapshot(doc(firestore, 'patients', patient.id.trim().toUpperCase()), (snapshot) => {
      if (snapshot.exists()) setIsEnabled(snapshot.data().liveLocationEnabled === true);
      else setIsEnabled(patient.liveLocationEnabled || false);
    }, (err) => {
      console.error('Could not read location sharing state:', err);
      setError('Could not sync location sharing status.');
    });
    return unsubscribe;
  }, [patient.id]);

  const handleToggle = async () => {
    const newState = !isEnabled;
    setError('');
    if (newState) {
      if (!window.isSecureContext || !('geolocation' in navigator)) {
        setError('Location requires a supported browser on HTTPS.');
        return;
      }
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          });
        });
        await locationService.updateLiveLocation(patient.id, position.coords.latitude, position.coords.longitude);
        await locationService.setLocationSharingEnabled(patient.id, true);
        setIsEnabled(true);
      } catch (err) {
        const geoError = err as GeolocationPositionError;
        setError(geoError.code === 1
          ? 'Allow location access in your browser settings, then try again.'
          : 'Could not get your current location. Check GPS and try again.');
      }
      return;
    }

    try {
      await locationService.setLocationSharingEnabled(patient.id, false);
      setIsEnabled(false);
    } catch {
      setError('Could not update location sharing. Check your connection and try again.');
    }
  };

  // Background watcher for location
  useEffect(() => {
    if (!isEnabled || !window.isSecureContext || !('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        locationService.updateLiveLocation(patient.id, pos.coords.latitude, pos.coords.longitude)
          .catch((err) => console.error('Could not sync live location:', err));
      },
      (err) => setError(err.code === 1
        ? 'Location permission is required to keep sharing.'
        : 'Location updates are temporarily unavailable.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isEnabled, patient.id]);

  return (
    <div className={`p-4 rounded-2xl border ${isEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'} flex items-center justify-between flex-wrap gap-2`}>
      <div className="flex items-center space-x-3">
        {isEnabled ? <ShieldCheck className="w-6 h-6 text-emerald-600" /> : <ShieldAlert className="w-6 h-6 text-gray-400" />}
        <div>
          <h3 className="font-bold text-sm text-[#263238]">Live Location Sharing</h3>
          <p className="text-xs text-gray-500">{isEnabled ? 'Sharing with caregivers' : 'Sharing paused'}</p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        className={`px-4 py-2 rounded-xl text-xs font-bold ${isEnabled ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}
      >
        {isEnabled ? 'Disable' : 'Enable'}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
};
