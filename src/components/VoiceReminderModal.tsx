import React, { useEffect, useState } from 'react';
import { Mic, Volume2, X, Check, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskItem, Language } from '../types';
import { speakText, playChime } from '../utils/audio';

interface VoiceReminderModalProps {
  task: TaskItem;
  isOpen: boolean;
  onClose: () => void;
  onConfirmTask: (taskId: string) => void;
  onSnoozeTask: (taskId: string) => void;
  patientName: string;
  language: Language;
}

export const VoiceReminderModal: React.FC<VoiceReminderModalProps> = ({
  task,
  isOpen,
  onClose,
  onConfirmTask,
  onSnoozeTask,
  patientName,
  language
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handlePlayVoice();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePlayVoice = () => {
    setIsSpeaking(true);
    const textToSpeak = language === 'kn' 
      ? `ನಮಸ್ಕಾರ ${patientName}, ನಿಮ್ಮ ಬೆಳಗಿನ ಔಷಧಿ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯವಾಗಿದೆ. ದೃಢೀಕರಿಸಲು ಬಯಸುವಿರಾ?`
      : language === 'hi'
      ? `नमस्ते ${patientName}, यह आपकी सुबह की दवा लेने का समय है। क्या आप पुष्टि करना चाहते हैं?`
      : `Hi ${patientName}, it's time for your morning medicine. Would you like to confirm?`;
    
    speakText(textToSpeak, language);
    setTimeout(() => setIsSpeaking(false), 3800);
  };

  const handleYes = () => {
    playChime();
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#A8C9B0', '#4B7358', '#D8EAF5', '#E7DFFA']
    });
    onConfirmTask(task.id);
    onClose();
  };

  const handleNo = () => {
    onSnoozeTask(task.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 sm:p-7">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Simulated Lockscreen Push Notification Pill */}
        <div className="mb-6 p-3.5 bg-[#F8F7F0] border border-gray-200/80 rounded-2xl flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-[#A8C9B0] flex items-center justify-center text-[#2D4F3B] shrink-0">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.5,3 C17.5,3 15.2,5.3 14,8.5 C12.8,11.7 13.5,14 13.5,14 C13.5,14 11.2,13.3 8,14.5 C4.8,15.7 2.5,18 2.5,18 C2.5,18 4.8,20.3 8,19.1 C11.2,17.9 11.9,15.6 11.9,15.6 C11.9,15.6 14.2,16.3 17.4,15.1 C20.6,13.9 22.9,11.6 22.9,11.6 C22.9,11.6 20.6,9.3 17.4,10.5 C14.2,11.7 13.5,14 13.5,14 C13.5,14 14.2,11.7 15.4,8.5 C16.6,5.3 17.5,3 17.5,3 Z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#263238]">MindCare</span>
              <span className="text-[10px] text-gray-400">now</span>
            </div>
            <p className="text-xs font-semibold text-[#2D4F3B] truncate">
              It&apos;s time for your morning medicine 💊
            </p>
            <p className="text-[11px] text-gray-500">
              Tap to view or say &apos;Okay&apos;
            </p>
          </div>
        </div>

        {/* Center Animated Voice Waveform & Microphone */}
        <div className="my-6 text-center">
          <div className="relative inline-flex items-center justify-center mb-4">
            {/* Pulsing Ripples */}
            <div className={`absolute w-24 h-24 rounded-full bg-[#A8C9B0]/20 transition-all ${isSpeaking ? 'animate-ping' : ''}`} />
            <div className="absolute w-20 h-20 rounded-full bg-[#A8C9B0]/30 animate-pulse" />
            
            {/* Mic button */}
            <button
              onClick={handlePlayVoice}
              className="relative z-10 w-16 h-16 rounded-full bg-[#3B664B] text-white flex items-center justify-center shadow-lg hover:bg-[#2D4F3B] transition-transform active:scale-95"
              title="Click to speak aloud again"
            >
              <Mic className="w-7 h-7 text-white" />
            </button>
          </div>

          <button 
            onClick={handlePlayVoice}
            className="flex items-center justify-center space-x-1.5 text-xs text-[#3B664B] font-semibold mx-auto hover:underline mb-2"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isSpeaking ? 'Speaking reminder...' : 'Tap to hear voice again'}</span>
          </button>

          <h3 className="text-lg font-bold text-[#263238] font-['Poppins'] mb-1">
            Hi {patientName}, it&apos;s time for your morning medicine.
          </h3>
          <p className="text-sm text-gray-500">
            Would you like to confirm?
          </p>
        </div>

        {/* Action Buttons: Yes / No matching Image Screen 5 */}
        <div className="grid grid-cols-2 gap-3.5 pt-2">
          <button
            onClick={handleYes}
            className="py-3.5 px-4 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white font-bold text-base shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Check className="w-5 h-5" />
            <span>Yes</span>
          </button>
          <button
            onClick={handleNo}
            className="py-3.5 px-4 rounded-2xl bg-[#F0EFEB] hover:bg-gray-200 text-[#263238] font-semibold text-base transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Clock className="w-4 h-4 text-gray-500" />
            <span>No, Snooze</span>
          </button>
        </div>

      </div>
    </div>
  );
};
