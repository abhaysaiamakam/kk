import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Pill, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Check, 
  Calendar 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SmartMedication } from '../types';
import { db } from '../services/db';
import { playChime } from '../utils/audio';

interface SmartMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
}

export const SmartMedicationModal: React.FC<SmartMedicationModalProps> = ({
  isOpen,
  onClose,
  patientId
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'refill'>('today');
  const [meds, setMeds] = useState<SmartMedication[]>(() => db.getMedications(patientId));
  const [refillRequested, setRefillRequested] = useState(false);

  if (!isOpen) return null;

  const handleTakeMedication = (id: string) => {
    db.markMedicationTaken(id);
    playChime();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 }
    });
    setMeds(db.getMedications(patientId));
  };

  const handleRequestRefill = () => {
    setRefillRequested(true);
    playChime();
    db.addNotification({
      id: `notif-${Date.now()}`,
      patientId,
      title: 'Medication Refill Request Sent',
      message: 'Caregiver Priya received your refill order request for Vitamin D3 & Calcium.',
      type: 'refill_alert',
      targetRole: 'caregiver',
      urgency: 'normal',
      timestamp: 'Just now',
      timeAgo: 'Just now',
      read: false
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header matching Section 13 */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
                Smart Medication Tracker
              </h2>
              <p className="text-xs text-gray-500">
                Authorized prescriptions, taken logs &amp; refill alerts
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#A8C9B0]/30 text-[#2D4F3B] font-bold">
            Doctor Prescribed
          </span>
        </div>

        {/* 3 Tabs matching Section 13: Today, History, Refill */}
        <div className="px-6 pt-3 pb-2 bg-white border-b border-gray-100 flex space-x-2">
          {(['today', 'history', 'refill'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-[#3B664B] text-white shadow-xs'
                  : 'bg-[#F8F7F0] text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: TODAY MEDS matching Section 13 */}
          {activeTab === 'today' && (
            <div className="space-y-3.5">
              {meds.map((med) => (
                <div
                  key={med.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    med.taken
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-white border-gray-200 shadow-xs hover:border-[#A8C9B0]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3.5">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        med.taken ? 'bg-emerald-100 text-emerald-800' : 'bg-[#F8F7F0] text-red-500'
                      }`}>
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#263238] font-['Poppins']">
                          {med.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {med.dosage} • {med.scheduledTime}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          {med.instructions}
                        </p>
                      </div>
                    </div>

                    <div>
                      {med.taken ? (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl flex items-center space-x-1 border border-emerald-200">
                          <Check className="w-3.5 h-3.5" />
                          <span>Taken ({med.takenAt || '9:05 AM'})</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleTakeMedication(med.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                          Mark Taken
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Refill Reminder Alert Card matching Section 13 bottom */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-amber-900">Refill Reminder</h5>
                    <p className="text-[11px] text-amber-800">Vitamin D3 has 5 pills remaining (Refill in 5 days)</p>
                  </div>
                </div>
                <button
                  onClick={handleRequestRefill}
                  disabled={refillRequested}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    refillRequested
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  {refillRequested ? 'Requested ✓' : 'Refill Now'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {[
                { date: 'Today, 9:05 AM', name: 'Paracetamol 500mg', status: 'Taken on time', onTime: true },
                { date: 'Yesterday, 8:00 PM', name: 'Calcium Supplement 500mg', status: 'Taken with milk', onTime: true },
                { date: 'Yesterday, 1:15 PM', name: 'Vitamin D3 & Calcium', status: 'Taken with lunch', onTime: true },
                { date: 'Yesterday, 9:02 AM', name: 'Paracetamol 500mg', status: 'Taken on time', onTime: true },
                { date: '28 May, 8:45 PM', name: 'Calcium Supplement 500mg', status: 'Taken on time', onTime: true }
              ].map((hist, idx) => (
                <div key={idx} className="p-3 bg-white border border-gray-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#263238] block">{hist.name}</span>
                    <span className="text-[10px] text-gray-400">{hist.date}</span>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {hist.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: REFILL */}
          {activeTab === 'refill' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#263238]">Vitamin D3 &amp; Calcium</h4>
                    <p className="text-xs text-gray-500">Remaining pills: 5 tablets</p>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                    Low Stock
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full w-[20%]" />
                </div>
                <p className="text-[11px] text-gray-500">
                  Estimated to run out in 5 days based on 1 tablet/day schedule.
                </p>
                <button
                  onClick={handleRequestRefill}
                  disabled={refillRequested}
                  className="w-full py-2.5 rounded-xl bg-[#3B664B] text-white font-bold text-xs hover:bg-[#2D4F3B]"
                >
                  {refillRequested ? 'Caregiver Notified for Refill ✓' : 'Notify Caregiver for Pharmacy Refill'}
                </button>
              </div>

              <div className="p-4 bg-white border border-gray-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#263238]">Paracetamol 500mg</h4>
                    <p className="text-xs text-gray-500">Remaining pills: 28 tablets</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    Sufficient
                  </span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full w-[80%]" />
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
