import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, TrendingUp, Sparkles, Smile } from 'lucide-react';
import confetti from 'canvas-confetti';
import { MoodType, Language } from '../types';
import { db } from '../services/db';
import { playChime } from '../utils/audio';

interface MoodTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  language: Language;
}

const MOODS: { type: MoodType; label: string; emoji: string; color: string; border: string; bg: string }[] = [
  { type: 'very_happy', label: 'Very Happy', emoji: '😄', color: 'text-emerald-700', border: 'border-emerald-300', bg: 'bg-emerald-50' },
  { type: 'happy', label: 'Happy', emoji: '🙂', color: 'text-green-700', border: 'border-green-300', bg: 'bg-green-50' },
  { type: 'okay', label: 'Okay', emoji: '😐', color: 'text-amber-700', border: 'border-amber-300', bg: 'bg-amber-50' },
  { type: 'sad', label: 'Sad', emoji: '🙁', color: 'text-blue-700', border: 'border-blue-300', bg: 'bg-blue-50' },
  { type: 'anxious', label: 'Anxious', emoji: '😰', color: 'text-purple-700', border: 'border-purple-300', bg: 'bg-purple-50' }
];

export const MoodTrackerModal: React.FC<MoodTrackerModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  language
}) => {
  const [selectedMood, setSelectedMood] = useState<MoodType | null>('very_happy');
  const [note, setNote] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const moodHistory = db.getMoods(patientId);

  const handleRecordMood = (mood: MoodType) => {
    setSelectedMood(mood);
    db.recordMood(patientId, mood, note.trim() || undefined);
    playChime();
    setSavedSuccess(true);
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.7 }
    });
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  const getDayValue = (mood: MoodType): number => {
    switch (mood) {
      case 'very_happy': return 5;
      case 'happy': return 4;
      case 'okay': return 3;
      case 'sad': return 2;
      case 'anxious': return 1;
    }
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header matching Section 3 */}
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
                Mood Tracker
              </h2>
              <p className="text-xs text-gray-500">
                Track emotional wellness &amp; share with caregivers
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#A8C9B0]/30 text-[#2D4F3B] font-bold">
            Daily Check-in
          </span>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Question matching Section 3 */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#263238] font-['Poppins']">
              How are you feeling today, {patientName.split(' ')[0]}?
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Tap the icon that best represents your state of mind
            </p>
          </div>

          {/* 5 Large Mood Options matching Section 3 */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {MOODS.map((m) => {
              const isSelected = selectedMood === m.type;
              return (
                <button
                  key={m.type}
                  onClick={() => handleRecordMood(m.type)}
                  className={`p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer group active:scale-95 ${
                    isSelected
                      ? `${m.bg} ${m.border} shadow-sm scale-105`
                      : 'bg-[#F8F7F0]/60 border-gray-200/80 hover:bg-[#F8F7F0] hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl mb-1.5 transition-transform group-hover:scale-110">
                    {m.emoji}
                  </span>
                  <span className={`text-[11px] font-bold text-center ${isSelected ? m.color : 'text-gray-600'}`}>
                    {m.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Success Banner */}
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mood recorded &amp; synchronized with Caregiver Priya!</span>
            </div>
          )}

          {/* Optional Note */}
          <div className="bg-[#F8F7F0] p-3.5 rounded-2xl border border-gray-200">
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Add a gentle note (optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Enjoyed morning sunlight and jasmine tea..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl text-[#263238] focus:outline-hidden focus:ring-1 focus:ring-[#A8C9B0]"
            />
          </div>

          {/* Mood History Graph matching Section 3 */}
          <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#263238] flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-[#3B664B]" />
                <span>Mood History (7-Day Trend)</span>
              </span>
              <span className="text-[10px] text-gray-400">Weekly Log</span>
            </div>

            {/* Visual Trend Chart */}
            <div className="h-32 bg-[#F8F7F0]/70 rounded-xl p-3 flex items-end justify-between gap-2 border border-gray-100">
              {daysOfWeek.map((day, idx) => {
                const record = moodHistory.find((m) => m.dayOfWeek === day);
                const val = record ? getDayValue(record.mood) : 4;
                const heightPercent = (val / 5) * 100;
                const emoji = record
                  ? MOODS.find((m) => m.type === record.mood)?.emoji || '🙂'
                  : '🙂';

                return (
                  <div key={day} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-sm mb-1 group-hover:scale-125 transition-transform">
                      {emoji}
                    </span>
                    <div className="w-full max-w-[20px] bg-gray-200 rounded-full h-full flex items-end overflow-hidden">
                      <div
                        className="w-full bg-[#3B664B] rounded-full transition-all duration-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 mt-1.5">
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Supportive feedback message matching Section 3 */}
            <div className="p-3 bg-[#EEF6FB] border border-[#A0CDE8] rounded-xl flex items-center space-x-2 text-xs font-semibold text-[#1E4D6B]">
              <Sparkles className="w-4 h-4 text-[#3B664B] shrink-0" />
              <span>Your mood is looking good this week! Regular calm breathing and connection with family keeps you happy.</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
