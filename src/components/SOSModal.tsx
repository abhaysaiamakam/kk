import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  MapPin, 
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
import { db } from '../services/db';
import { playSosBeep } from '../utils/audio';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  language: Language;
  onTriggerCaregiverAlert?: (location: string, voiceNote: boolean) => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  patient,
  language,
  onTriggerCaregiverAlert
}) => {
  const [step, setStep] = useState<'confirm' | 'active_live_tracking' | 'resolved'>('confirm');
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9716, lng: 77.5946 });
  const [accuracy, setAccuracy] = useState<number>(5);
  const [locationStatus, setLocationStatus] = useState<string>('Requesting GPS beacon...');
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [showHistory, setShowHistory] = useState(false);

  const t = translations[language];

  // Request actual Geolocation if available
  useEffect(() => {
    if (isOpen && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLiveCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setAccuracy(Math.round(pos.coords.accuracy) || 5);
          setLocationStatus('GPS signal locked');
          setLastUpdated('Just now');
        },
        (err) => {
          console.warn('Geolocation fallback notice:', err.message);
          setLocationStatus('Using verified home address GPS fallback');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartEmergency = () => {
    playSosBeep();
    setStep('active_live_tracking');
    db.triggerSOS(patient.id, liveCoords, accuracy);
    if (onTriggerCaregiverAlert) {
      onTriggerCaregiverAlert(patient.homeLocation, false);
    }
  };

  const handleResolveEmergency = () => {
    db.resolveSOS(patient.id);
    setStep('resolved');
    setTimeout(() => {
      setStep('confirm');
      onClose();
    }, 1500);
  };

  const emergencyHistory = db.getEmergencyAlerts();

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
                    <p className="text-[11px] text-red-800">Live location shared with 2 caregivers</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-red-700 bg-white px-2 py-0.5 rounded-full border border-red-200">
                  Active
                </span>
              </div>

              {/* Interactive Visual Map Card matching Sections 5 & 10 */}
              <div className="relative w-full h-52 bg-[#E5ECE5] rounded-3xl overflow-hidden border border-gray-300 shadow-inner flex flex-col justify-between p-3">
                
                {/* Simulated Street Grid Lines */}
                <div className="absolute inset-0 opacity-25 pointer-events-none">
                  <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#263238" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                {/* Map Landmarks */}
                <div className="relative z-10 flex justify-between text-[10px] text-gray-500 font-bold">
                  <span className="bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-md">Bengaluru City Center</span>
                  <span className="bg-white/80 backdrop-blur-xs px-2 py-0.5 rounded-md">{locationStatus}</span>
                </div>

                {/* Center Patient Pinpoint Marker with Pulsing Beacon */}
                <div className="relative z-10 flex flex-col items-center justify-center my-auto">
                  <div className="relative flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-red-500/25 animate-ping absolute" />
                    <div className="w-10 h-10 rounded-full bg-red-500/40 animate-pulse absolute" />
                    <div className="w-7 h-7 rounded-full bg-red-600 border-2 border-white text-white flex items-center justify-center shadow-lg relative z-10">
                      <MapPin className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-red-950 bg-white/95 px-2.5 py-0.5 rounded-md shadow-xs mt-1">
                    {patient.name}
                  </span>
                </div>

                {/* Bottom Map Status Strip matching Section 5 */}
                <div className="relative z-10 bg-white/95 backdrop-blur-xs p-2.5 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <div>
                      <span className="font-bold text-[#263238] block text-[11px]">Live Location Shared</span>
                      <span className="text-[10px] text-gray-500">Updated {lastUpdated} • ±{accuracy}m accuracy</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-gray-400">
                    {liveCoords.lat.toFixed(4)}, {liveCoords.lng.toFixed(4)}
                  </span>
                </div>

              </div>

              {/* Action Buttons: Call Caregiver & Call Ambulance (108) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <a
                  href={`tel:${patient.caregiverPhone || '+919876543210'}`}
                  className="py-3 px-3 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call Caregiver</span>
                </a>

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
                  <p className="text-[10px] text-gray-400">{hist.timestamp}</p>
                </div>
              ))}
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
