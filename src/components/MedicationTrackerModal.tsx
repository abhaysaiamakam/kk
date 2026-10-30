import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Pill, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';
import { TaskItem } from '../types';
import { playChime } from '../utils/audio';

interface MedicationTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onSnoozeTask: (taskId: string) => void;
}

export const MedicationTrackerModal: React.FC<MedicationTrackerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onToggleTask,
  onSnoozeTask
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'refill'>('today');

  if (!isOpen) return null;

  const medTasks = tasks.filter((t) => t.category === 'medicine');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
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
                Prescription adherence &amp; caregiver-verified doses
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-green-50 text-green-700 font-bold px-2.5 py-1 rounded-full border border-green-200 flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Doctor Verified</span>
          </span>
        </div>

        {/* 3 Tabs matching Screen 13: Today, History, Refill */}
        <div className="grid grid-cols-3 p-1.5 bg-[#F8F7F0] border-b border-gray-200">
          {(['today', 'history', 'refill'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-white text-[#263238] shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* TAB 1: Today */}
          {activeTab === 'today' && (
            <div className="space-y-3.5">
              {medTasks.map((med) => (
                <div
                  key={med.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    med.completed
                      ? 'bg-[#F2F8F4] border-[#A8C9B0]'
                      : 'bg-white border-gray-200 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#D8EAF5] text-[#1E4D6B] flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#263238]">
                          {med.title}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {med.dosage || '1 tablet'} • {med.time}
                        </p>
                      </div>
                    </div>

                    <div>
                      {med.completed ? (
                        <span className="px-3 py-1 rounded-xl bg-green-100 text-green-800 text-xs font-bold flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-700" />
                          <span>Taken</span>
                        </span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onSnoozeTask(med.id)}
                            className="px-2.5 py-1 text-xs text-gray-500 hover:text-gray-800"
                          >
                            Snooze
                          </button>
                          <button
                            onClick={() => {
                              onToggleTask(med.id);
                              playChime();
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white text-xs font-bold shadow-xs cursor-pointer"
                          >
                            Mark Taken
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Refill Reminder Alert matching Screen 13 bottom */}
              <div className="p-4 bg-[#FEF9ED] rounded-2xl border border-amber-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FFF1D0] text-[#916508] flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-[#263238]">Refill Reminder</h5>
                    <p className="text-[11px] text-gray-600">Paracetamol 500mg • Supply in 5 days</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('refill')}
                  className="px-3 py-1 text-xs font-bold text-amber-800 bg-white border border-amber-300 rounded-lg hover:bg-amber-50"
                >
                  View Refill
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="p-3 bg-[#F8F7F0] rounded-xl flex items-center justify-between text-xs font-bold text-gray-700">
                <span>7-Day Medication Adherence</span>
                <span className="text-green-700">92.8% on time</span>
              </div>
              <div className="space-y-2">
                {[
                  { date: 'Today (30 Oct)', taken: '1 of 3 taken (morning dose confirmed)', status: 'On track' },
                  { date: 'Yesterday (29 Oct)', taken: '3 of 3 taken on time', status: 'Completed' },
                  { date: '28 Oct', taken: '3 of 3 taken on time', status: 'Completed' },
                  { date: '27 Oct', taken: '2 of 3 taken, 1 snoozed 15m', status: 'Snoozed' },
                  { date: '26 Oct', taken: '3 of 3 taken on time', status: 'Completed' }
                ].map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-gray-200 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[#263238]">{item.date}</p>
                      <p className="text-gray-500 text-[11px]">{item.taken}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-md border border-green-200">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Refill */}
          {activeTab === 'refill' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#263238]">Paracetamol 500mg</h4>
                    <p className="text-xs text-gray-500">Apollo Pharmacy Indiranagar • Rx #88412</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200">
                    5 Days Left
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full w-[25%]" />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Remaining: 10 tablets</span>
                  <button className="px-3 py-1.5 rounded-xl bg-[#3B664B] text-white font-bold hover:bg-[#2D4F3B]">
                    Send Refill Request to Caregiver
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#263238]">Vitamin D3 1000 IU</h4>
                    <p className="text-xs text-gray-500">18 Days Remaining</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold text-green-700 bg-green-50 border border-green-200">
                    Sufficient
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
