import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertTriangle, 
  PhoneCall, 
  X, 
  ShieldAlert, 
  CheckCircle2, 
  Ambulance, 
  RotateCcw, 
  Navigation, 
  Phone, 
  Clock, 
  History 
} from 'lucide-react';
import { PatientProfile, Language, EmergencyAlertItem } from '../types';
import { translations } from '../data/translations';
import { emergencyService } from '../services/emergencyService';
import { playSosBeep } from '../utils/audio';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  language: Language;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  patient,
  language,
}) => {
  const [step, setStep] = useState<'confirm' | 'active_live_tracking' | 'resolved'>('confirm');
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>("Waiting for patient's GPS location");
  const [lastUpdated, setLastUpdated] = useState<string>('Waiting for GPS');
  const [showHistory, setShowHistory] = useState(false);
  const [actionError, setActionError] = useState('');
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyAlertItem[]>([]);
  const lastLocationWriteRef = useRef(0);

  const t = translations[language];

  // Continuous real-time movement tracking via watchPosition while SOS is active
  useEffect(() => {
    let watchId: number | null = null;
    if (step === 'active_live_tracking' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const acc = Math.round(pos.coords.accuracy) || 5;
          setLiveCoords({ lat, lng });
          setAccuracy(acc);
          setLocationStatus('GPS active • Tracking movement');
          setLastUpdated(new Date().toLocaleTimeString());

          // Real-time Firestore update
          if (Date.now() - lastLocationWriteRef.current >= 5000) {
            lastLocationWriteRef.current = Date.now();
            emergencyService.updateSOSLocation(patient.id, lat, lng, acc);
          }
        },
        (err) => {
          console.warn('watchPosition error:', err.message);
          setLocationStatus('Location unavailable');
        },
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    }
    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [step, patient.id]);

  useEffect(() => emergencyService.subscribeToEmergencyAlerts(
    patient.id,
    setEmergencyHistory,
    (err) => console.error('Could not load SOS history:', err),
    true
  ), [patient.id]);

  if (!isOpen) return null;

  const handleStartEmergency = async () => {
    playSosBeep();
    setActionError('');
    let location: { latitude: number; longitude: number; accuracy: number } | undefined;
    if (window.isSecureContext && 'geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          });
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy)
        };
        setLiveCoords({ lat: location.latitude, lng: location.longitude });
        setAccuracy(location.accuracy);
        setLocationStatus('GPS active • Tracking movement');
      } catch (error) {
        const geoError = error as GeolocationPositionError;
        setLocationStatus(geoError.code === 1 ? 'Location permission denied' : 'Location unavailable');
      }
    } else {
      setLocationStatus('Location requires HTTPS and browser geolocation support');
    }
    try {
      await emergencyService.triggerSOS({
        patientId: patient.id,
        patientUid: patient.uid,
        patientName: patient.name,
        location
      });
      setStep('active_live_tracking');
    } catch (e) {
      console.warn('triggerSOS error:', e);
      setActionError('Could not send the emergency alert. Check your connection and try again.');
      return;
    }
  };

  const handleResolveEmergency = async () => {
    try {
      await emergencyService.resolveSOS(patient.id, 'Patient');
      setStep('resolved');
      setTimeout(() => {
        setStep('confirm');
        onClose();
      }, 1500);
    } catch (e) {
      console.warn('resolveSOS error:', e);
      setActionError('Could not resolve the alert. Check your connection and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-red-950/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-red-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-red-100 flex items-center justify-between bg-red-50/70">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-red-100 transition-colors text-red-800"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-red-900 font-['Poppins']">
                Emergency SOS &amp; Live Tracking
              </h2>
              <p className="text-xs text-red-700">
                Patient: {patient.name} ({patient.id})
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-2.5 py-1.5 rounded-xl bg-white border border-red-200 text-red-800 text-xs font-bold flex items-center space-x-1"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* STEP 1: CONFIRMATION matching Section 5 */}
          {step === 'confirm' && !showHistory && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-[#F16F6F] text-white flex items-center justify-center shadow-lg animate-sos-pulse">
                <span className="text-2xl font-black tracking-widest font-['Poppins']">
                  SOS
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-[#263238] font-['Poppins']">
                  Are you sure you need help?
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                  This will immediately notify your caregivers and share your live GPS location.
                </p>
              </div>

              {/* Action Buttons matching Section 5 */}
              <div className="pt-2 space-y-2.5">
                {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
                <button
                  onClick={handleStartEmergency}
                  className="w-full py-4 rounded-2xl bg-[#F16F6F] hover:bg-red-600 text-white font-bold text-base shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-2"
                >
                  <ShieldAlert className="w-5 h-5" />
                  <span>Yes, I need help</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-[#F8F7F0] hover:bg-gray-200 text-[#263238] font-bold text-sm border border-gray-200 transition-all cursor-pointer"
                >
                  No, cancel
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ACTIVE LIVE TRACKING matching Sections 5 & 10 */}
          {step === 'active_live_tracking' && !showHistory && (
            <div className="space-y-4">
              
              {/* Emergency Banner matching Section 10 */}
              <div className="p-3.5 bg-red-100 border border-red-300 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs animate-pulse">
                    SOS
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-red-900">SOS Alert Active</h4>
                  <p className="text-[11px] text-red-800">Emergency alert sent to connected caregivers</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-red-700 bg-white px-2 py-0.5 rounded-full border border-red-200">
                  Active
                </span>
              </div>

              <div className="relative w-full h-52 bg-slate-100 rounded-3xl overflow-hidden border border-gray-300 shadow-inner flex items-center justify-center">
                {liveCoords ? (
                  <iframe title="Patient GPS location" className="absolute inset-0 w-full h-full border-0" loading="lazy"
                    src={`https://maps.google.com/maps?q=${liveCoords.lat},${liveCoords.lng}&z=16&output=embed`} />
                ) : (
                  <p className="px-6 text-center text-sm text-gray-600">{locationStatus}. The SOS alert was sent without coordinates.</p>
                )}

                {/* Bottom Map Status Strip matching Section 5 */}
                <div className="relative z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${liveCoords ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <div>
                      <span className="font-bold text-[#263238] block text-[11px]">{liveCoords ? 'Live GPS location' : 'GPS location unavailable'}</span>
                      <span className="text-[10px] text-gray-500">Updated {lastUpdated}{accuracy ? ` • ±${accuracy}m accuracy` : ''}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    {liveCoords ? `${liveCoords.lat.toFixed(4)}, ${liveCoords.lng.toFixed(4)}` : 'No coordinates'}
                  </span>
                </div>

              </div>

              {/* Action Buttons: Call Caregiver & Call Ambulance (108) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {patient.caregiverPhone && patient.caregiverPhone !== 'Not added yet' ? (
                  <a
                    href={`tel:${patient.caregiverPhone}`}
                    className="py-3 px-3 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Caregiver</span>
                  </a>
                ) : (
                  <div className="py-3 px-3 rounded-2xl bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center space-x-2">
                    <span>Phone number unavailable</span>
                  </div>
                )}

                <a
                  href="tel:108"
                  className="py-3 px-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                >
                  <Ambulance className="w-4 h-4" />
                  <span>Call Ambulance (108)</span>
                </a>
              </div>

              {/* Resolution button for caregiver / patient */}
              <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                {actionError && <p role="alert" className="text-sm text-red-700">{actionError}</p>}
                <button
                  onClick={handleResolveEmergency}
                  className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Resolve &amp; Stop Location Sharing</span>
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: RESOLVED STATE */}
          {step === 'resolved' && (
            <div className="text-center py-6 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-bold text-[#263238]">SOS Alert Resolved</h3>
              <p className="text-xs text-gray-500">
                Location sharing turned off and emergency logs updated safely.
              </p>
            </div>
          )}

          {/* EMERGENCY ALERT HISTORY matching Section 10 */}
          {showHistory && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Emergency Alert History
                </h4>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-xs text-[#3B664B] font-bold hover:underline"
                >
                  Back to SOS
                </button>
              </div>

              {emergencyHistory.map((hist) => (
                <div
                  key={hist.id}
                  className="p-3.5 bg-[#F8F7F0] rounded-2xl border border-gray-200 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#263238]">{hist.patientName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      hist.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {hist.status === 'active' ? 'Active' : 'Resolved'}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600">{hist.location}</p>
                  <p className="text-[10px] text-gray-400">{new Date(hist.timestamp).toLocaleString()}</p>
                </div>
              ))}
              {emergencyHistory.length === 0 && <p className="text-xs text-gray-500">No SOS alerts recorded for this patient.</p>}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

// Mini internal helper icon
function ArrowLeftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
