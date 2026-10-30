import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  Navigation, 
  MessageSquare, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Compass, 
  X, 
  AlertTriangle 
} from 'lucide-react';
import { EmergencyAlertItem, PatientProfile, Language } from '../types';

interface LiveSosTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: EmergencyAlertItem;
  patient: PatientProfile;
  isCaregiver: boolean;
  onResolveAlert?: (alertId: string) => void;
  onCallPatient?: () => void;
}

export const LiveSosTrackingModal: React.FC<LiveSosTrackingModalProps> = ({
  isOpen,
  onClose,
  alert,
  patient,
  isCaregiver,
  onResolveAlert,
  onCallPatient
}) => {
  const [liveMinutesAgo, setLiveMinutesAgo] = useState(2);
  const [isResolved, setIsResolved] = useState(alert.status === 'resolved');

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveMinutesAgo((m) => m + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  const handleResolve = () => {
    setIsResolved(true);
    if (onResolveAlert) {
      onResolveAlert(alert.id);
    }
  };

  const openNavigation = () => {
    const lat = alert.latitude || 12.9716;
    const lng = alert.longitude || 77.5946;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-red-200 flex flex-col max-h-[92vh]">
        
        {/* Header matching Screen 10 */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-red-50/70">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-black animate-pulse">
                SOS
              </span>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-red-950 font-['Poppins']">
                  {isResolved ? 'Emergency Resolved' : 'SOS Alert Active'}
                </h2>
                <p className="text-[11px] text-red-800">
                  {patient.name} • {liveMinutesAgo} min ago • Live location shared with 2 caregivers
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Map Visualizer matching Screen 5 & Screen 10 */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-100 overflow-hidden">
          
          {/* Simulated Cartographic Map Roads & Parks */}
          <svg className="w-full h-full object-cover opacity-85" viewBox="0 0 600 350">
            {/* Background terrain */}
            <rect width="600" height="350" fill="#E8F0E8" />
            
            {/* Water body */}
            <path d="M0,80 Q150,120 300,90 T600,100 L600,0 L0,0 Z" fill="#D3E6F5" opacity="0.8" />
            
            {/* Main roads */}
            <path d="M0,180 Q300,160 600,220" stroke="#FFFFFF" strokeWidth="18" fill="none" />
            <path d="M0,180 Q300,160 600,220" stroke="#CBD5E1" strokeWidth="14" fill="none" />
            
            <path d="M220,0 L380,350" stroke="#FFFFFF" strokeWidth="16" fill="none" />
            <path d="M220,0 L380,350" stroke="#CBD5E1" strokeWidth="12" fill="none" />
            
            <path d="M100,350 L450,50" stroke="#FFFFFF" strokeWidth="12" fill="none" />
            <path d="M100,350 L450,50" stroke="#CBD5E1" strokeWidth="8" fill="none" />

            {/* City blocks & parks */}
            <rect x="60" y="220" width="120" height="90" rx="8" fill="#CDE7D5" opacity="0.7" />
            <rect x="420" y="160" width="140" height="120" rx="8" fill="#CDE7D5" opacity="0.7" />
            <rect x="250" y="240" width="90" height="70" rx="6" fill="#F1EFE6" opacity="0.9" />

            {/* Pulse Radius around Patient Location */}
            <circle cx="300" cy="180" r="50" fill="#F16F6F" fillOpacity="0.15">
              <animate attributeName="r" values="30;65;30" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="300" cy="180" r="28" fill="#F16F6F" fillOpacity="0.25" />

            {/* Location Pin */}
            <g transform="translate(300, 180)">
              <circle cx="0" cy="0" r="14" fill="#E11D48" stroke="#FFFFFF" strokeWidth="3" />
              <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
            </g>
          </svg>

          {/* Compass / Zoom overlay */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-xs p-2 rounded-xl shadow-xs border border-gray-200 text-gray-700">
            <Compass className="w-5 h-5 animate-spin" style={{ animationDuration: '20s' }} />
          </div>

          {/* Location Badge Indicator matching Screen 10 */}
          <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-xs p-3 rounded-2xl shadow-md border border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#263238] truncate">
                  {alert.location}
                </p>
                <p className="text-[10px] text-gray-500">
                  Last updated {liveMinutesAgo} min ago • {alert.accuracyMeters || 5}m accuracy
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
              Live GPS Beacon
            </span>
          </div>

        </div>

        {/* Action Buttons matching Screen 10 */}
        <div className="p-4 bg-white space-y-3">
          <div className="grid grid-cols-3 gap-2">
            
            {/* Call */}
            <button
              onClick={onCallPatient}
              className="py-3 px-3 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Phone className="w-4 h-4" />
              <span>Call</span>
            </button>

            {/* Navigate */}
            <button
              onClick={openNavigation}
              className="py-3 px-3 rounded-2xl bg-[#D8EAF5] hover:bg-[#BEE0F5] text-[#1E4D6B] text-xs font-bold shadow-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Navigation className="w-4 h-4" />
              <span>Navigate</span>
            </button>

            {/* Message */}
            <button
              onClick={onClose}
              className="py-3 px-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Message</span>
            </button>

          </div>

          {/* Emergency History Section matching Screen 10 */}
          <div className="p-3.5 bg-[#F8F7F0] rounded-2xl border border-gray-200 text-xs space-y-2">
            <div className="flex items-center space-x-1.5 font-bold text-[#263238]">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>Emergency History &amp; Event Logs</span>
            </div>
            <div className="space-y-1 text-gray-600 text-[11px]">
              <div className="flex items-center justify-between">
                <span>26 May 2025 • 10:24 AM</span>
                <span className="text-green-700 font-semibold">SOS Alert — Resolved</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Today • Just now</span>
                <span className={isResolved ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold animate-pulse'}>
                  {isResolved ? 'Resolved by Priya Sharma' : 'Live Broadcast Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Caregiver Acknowledge / Resolve Button */}
          {isCaregiver && !isResolved && (
            <button
              onClick={handleResolve}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Acknowledge &amp; Mark Emergency Resolved</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
