import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { ambientPlayer, speakText } from '../utils/audio';

interface CalmBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale' | 'rest';

export const CalmBreathingModal: React.FC<CalmBreathingModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);

  useEffect(() => {
    let timer: number;
    if (isActive && isOpen) {
      timer = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            // Transition phases
            if (phase === 'inhale') {
              setPhase('hold');
              speakGuidance('Hold gently');
              return 4;
            } else if (phase === 'hold') {
              setPhase('exhale');
              speakGuidance('Exhale slowly and let go');
              return 4;
            } else if (phase === 'exhale') {
              setPhase('rest');
              speakGuidance('Rest and relax');
              return 4;
            } else {
              setPhase('inhale');
              setCyclesCompleted((c) => c + 1);
              speakGuidance('Breathe in fresh calm air');
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phase, isOpen]);

  const speakGuidance = (text: string) => {
    if (language === 'kn') {
      const knText = phase === 'inhale' ? 'ನಿಧಾನವಾಗಿ ಉಸಿರೆಳೆದುಕೊಳ್ಳಿ' : phase === 'hold' ? 'ಉಸಿರನ್ನು ಹಿಡಿದಿಟ್ಟುಕೊಳ್ಳಿ' : 'ನಿಧಾನವಾಗಿ ಉಸಿರು ಬಿಡಿ';
      speakText(knText, 'kn');
    } else if (language === 'hi') {
      const hiText = phase === 'inhale' ? 'धीमी गहरी सांस अंदर लें' : phase === 'hold' ? 'सांस को रोकें' : 'धीरे-धीरे सांस बाहर छोड़ें';
      speakText(hiText, 'hi');
    } else {
      speakText(text, 'en');
    }
  };

  const toggleBreathing = () => {
    if (!isActive) {
      setIsActive(true);
      ambientPlayer.start('flute');
      speakGuidance('Breathe in gently');
    } else {
      setIsActive(false);
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('inhale');
    setSecondsLeft(4);
    setCyclesCompleted(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col p-6 text-center">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-1.5 text-[#2D4F3B]">
            <Sparkles className="w-4 h-4 text-[#A8C9B0]" />
            <h2 className="text-lg font-bold font-['Poppins']">Calm &amp; Breathe</h2>
          </div>
          <button
            onClick={handleReset}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Breathing Animation Canvas */}
        <div className="my-8 flex flex-col items-center justify-center min-h-[260px]">
          
          <div className="relative flex items-center justify-center">
            {/* Outer soft glow ring */}
            <div
              className={`w-56 h-56 rounded-full transition-all duration-1000 flex items-center justify-center ${
                phase === 'inhale'
                  ? 'scale-110 bg-[#E7DFFA]/50 border-4 border-[#A8C9B0]'
                  : phase === 'hold'
                  ? 'scale-110 bg-[#D8EAF5]/60 border-4 border-[#8EBED6]'
                  : phase === 'exhale'
                  ? 'scale-90 bg-[#F2F8F4] border-4 border-[#A8C9B0]/40'
                  : 'scale-95 bg-[#F8F7F0] border-2 border-gray-200'
              }`}
            >
              {/* Inner animated Lotus core */}
              <div
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-1000 shadow-inner ${
                  phase === 'inhale' ? 'bg-[#A8C9B0] text-[#2D4F3B]' : 'bg-[#D8EAF5] text-[#1E4D6B]'
                }`}
              >
                <span className="text-3xl font-extrabold font-['Poppins'] mb-0.5">
                  {secondsLeft}s
                </span>
                <span className="text-xs font-bold uppercase tracking-wider">
                  {phase === 'inhale'
                    ? 'Breathe In'
                    : phase === 'hold'
                    ? 'Hold'
                    : phase === 'exhale'
                    ? 'Exhale'
                    : 'Rest'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-[#263238]">
              {phase === 'inhale'
                ? 'Fill your lungs with fresh, calm air...'
                : phase === 'hold'
                ? 'Feel the stillness within...'
                : phase === 'exhale'
                ? 'Release all tension with ease...'
                : 'Relax your shoulders gently...'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Completed cycles: {cyclesCompleted} of 5
            </p>
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={toggleBreathing}
            className={`w-full py-4 rounded-2xl font-bold text-base shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer ${
              isActive
                ? 'bg-[#E7DFFA] text-[#4A3B69] hover:bg-[#D5C6F5]'
                : 'bg-[#3B664B] hover:bg-[#2D4F3B] text-white'
            }`}
          >
            {isActive ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause Session</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Start Gentle Breathing</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
