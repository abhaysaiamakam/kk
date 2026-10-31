import React, { useState, useEffect } from 'react';
import { MapPin, ShieldCheck, ShieldAlert } from 'lucide-react';
import { locationService } from '../services/locationService';
import { PatientProfile } from '../types';

interface LocationSharingToggleProps {
  patient: PatientProfile;
}

export const LocationSharingToggle: React.FC<LocationSharingToggleProps> = ({ patient }) => {
  const [isEnabled, setIsEnabled] = useState(patient.liveLocationEnabled || false);

  const handleToggle = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    await locationService.setLocationSharingEnabled(patient.id, newState);
  };

  // Background watcher for location
  useEffect(() => {
    if (!isEnabled) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        locationService.updateLiveLocation(patient.id, pos.coords.latitude, pos.coords.longitude);
      },
      (err) => console.error('Background location error:', err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isEnabled, patient.id]);

  return (
    <div className={`p-4 rounded-2xl border ${isEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-200'} flex items-center justify-between`}>
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
    </div>
  );
};
