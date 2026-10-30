import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Wind, 
  Trees, 
  Moon, 
  Music, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { Language } from '../types';
import { ambientPlayer, speakText } from '../utils/audio';

interface CalmCornerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

type CalmExperience = 'breathing' | 'sounds' | 'meditation' | 'music';

export const CalmCornerModal: React.FC<CalmCornerModalProps> = ({
  isOpen,
  onClose,
  language
}) => {
  const [selectedExperience, setSelectedExperience] = useState<CalmExperience>('breathing');
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [activeSound, setActiveSound] = useState<'rain' | 'forest' | 'ocean' | 'bells' | 'flute' | null>(null);

  // Meditation timer state
  const [meditationMinutes, setMeditationMinutes] = useState(5);
  const [meditationSecondsLeft, setMeditationSecondsLeft] = useState(300);
  const [isMeditationActive, setIsMeditationActive] = useState(false);

  // Breathing interval
  useEffect(() => {
    let timer: number;
    if (isBreathingActive && isOpen && selectedExperience === 'breathing') {
      timer = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (breathPhase === 'inhale') {
              setBreathPhase('hold');
              return 4;
            } else if (breathPhase === 'hold') {
              setBreathPhase('exhale');
              return 4;
            } else if (breathPhase === 'exhale') {
              setBreathPhase('rest');
              return 4;
            } else {
              setBreathPhase('inhale');
              setCyclesCompleted((c) => c + 1);
              return 4;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isBreathingActive, breathPhase, isOpen, selectedExperience]);

  // Meditation interval
  useEffect(() => {
    let timer: number;
    if (isMeditationActive && isOpen && selectedExperience === 'meditation' && meditationSecondsLeft > 0) {
      timer = window.setInterval(() => {
        setMeditationSecondsLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isMeditationActive, isOpen, selectedExperience, meditationSecondsLeft]);

  if (!isOpen) return null;

  const handleStartBreathing = () => {
    if (!isBreathingActive) {
      setIsBreathingActive(true);
      ambientPlayer.start('flute');
      setActiveSound('flute');
      speakText('Breathe in fresh, calm air', language);
    } else {
      setIsBreathingActive(false);
      ambientPlayer.stop();
      setActiveSound(null);
    }
  };

  const handleToggleSound = (type: 'rain' | 'forest' | 'ocean' | 'bells') => {
    if (activeSound === type) {
      ambientPlayer.stop();
      setActiveSound(null);
    } else {
      ambientPlayer.start(type);
      setActiveSound(type);
    }
  };

  const handleClose = () => {
    ambientPlayer.stop();
    setIsBreathingActive(false);
    setIsMeditationActive(false);
    onClose();
  };

  const formatMeditationTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header matching Section 4 */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
                Calm Corner
              </h2>
              <p className="text-xs text-gray-500">
                Gentle relaxation, breathing &amp; nature sounds
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#E7DFFA] text-[#4A3B69] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Relaxation</span>
          </div>
        </div>

        {/* 4 Choices Grid matching Section 4 */}
        <div className="p-5 overflow-y-auto space-y-5">
          
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#263238] font-['Poppins']">
              Take a deep breath
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose your calm experience
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* 1. Guided Breathing */}
            <button
              onClick={() => setSelectedExperience('breathing')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                selectedExperience === 'breathing'
                  ? 'bg-[#EEF6FB] border-[#A0CDE8] shadow-xs scale-102'
                  : 'bg-[#F8F7F0]/60 border-gray-200 hover:bg-[#F8F7F0]'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-[#D8EAF5] text-[#1E4D6B] flex items-center justify-center mb-2">
                <Wind className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#263238]">Guided Breathing</span>
              <span className="text-[10px] text-gray-400 mt-0.5">5 min – 10 min</span>
            </button>

            {/* 2. Nature Sounds */}
            <button
              onClick={() => setSelectedExperience('sounds')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                selectedExperience === 'sounds'
                  ? 'bg-[#F2F8F4] border-[#A8C9B0] shadow-xs scale-102'
                  : 'bg-[#F8F7F0]/60 border-gray-200 hover:bg-[#F8F7F0]'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-[#A8C9B0]/30 text-[#2D4F3B] flex items-center justify-center mb-2">
                <Trees className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#263238]">Nature Sounds</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Rain, Forest, Ocean</span>
            </button>

            {/* 3. Meditation */}
            <button
              onClick={() => setSelectedExperience('meditation')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                selectedExperience === 'meditation'
                  ? 'bg-[#F8F5FE] border-[#D5C6F5] shadow-xs scale-102'
                  : 'bg-[#F8F7F0]/60 border-gray-200 hover:bg-[#F8F7F0]'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-[#E7DFFA] text-[#4A3B69] flex items-center justify-center mb-2">
                <Moon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#263238]">Meditation</span>
              <span className="text-[10px] text-gray-400 mt-0.5">5 min – 15 min</span>
            </button>

            {/* 4. Relaxing Music */}
            <button
              onClick={() => setSelectedExperience('music')}
              className={`p-3.5 rounded-2xl border-2 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                selectedExperience === 'music'
                  ? 'bg-[#EFFBF9] border-[#86DCD0] shadow-xs scale-102'
                  : 'bg-[#F8F7F0]/60 border-gray-200 hover:bg-[#F8F7F0]'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-[#D4F4EE] text-[#1B675B] flex items-center justify-center mb-2">
                <Music className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-[#263238]">Relaxing Music</span>
              <span className="text-[10px] text-gray-400 mt-0.5">Spotify Integration</span>
            </button>

          </div>

          {/* Experience View Area */}
          <div className="bg-[#F8F7F0] rounded-3xl p-6 border border-gray-200 min-h-[220px] flex flex-col items-center justify-center text-center">
            
            {/* Experience 1: Breathing Visualizer */}
            {selectedExperience === 'breathing' && (
              <div className="space-y-4">
                <div className="relative inline-flex items-center justify-center">
                  <div
                    className={`w-36 h-36 rounded-full transition-all duration-1000 flex items-center justify-center ${
                      breathPhase === 'inhale'
                        ? 'scale-115 bg-[#A8C9B0]/50 border-4 border-[#3B664B]'
                        : breathPhase === 'hold'
                        ? 'scale-115 bg-[#D8EAF5]/70 border-4 border-[#1E4D6B]'
                        : breathPhase === 'exhale'
                        ? 'scale-90 bg-[#E7DFFA]/50 border-4 border-[#765CA7]'
                        : 'scale-95 bg-white border-2 border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <span className="text-2xl font-black font-['Poppins'] text-[#263238]">
                        {secondsLeft}s
                      </span>
                      <span className="text-[11px] font-bold block uppercase tracking-wider text-[#3B664B]">
                        {breathPhase === 'inhale' ? 'Breathe In' : breathPhase === 'hold' ? 'Hold' : breathPhase === 'exhale' ? 'Exhale' : 'Rest'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-[#263238]">
                    {breathPhase === 'inhale' ? 'Inhale deeply and gently...' : breathPhase === 'hold' ? 'Hold peace inside...' : breathPhase === 'exhale' ? 'Release tension slowly...' : 'Rest and relax shoulders...'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Completed cycles: {cyclesCompleted} of 5
                  </p>
                </div>

                <button
                  onClick={handleStartBreathing}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 mx-auto cursor-pointer ${
                    isBreathingActive
                      ? 'bg-[#E7DFFA] text-[#4A3B69] hover:bg-[#D5C6F5]'
                      : 'bg-[#3B664B] hover:bg-[#2D4F3B] text-white'
                  }`}
                >
                  {isBreathingActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isBreathingActive ? 'Pause Breathing' : 'Start 4-4-4-4 Breathing'}</span>
                </button>
              </div>
            )}

            {/* Experience 2: Nature Sounds */}
            {selectedExperience === 'sounds' && (
              <div className="w-full space-y-4">
                <h4 className="text-sm font-bold text-[#263238]">
                  Play Real Ambient Nature Acoustics
                </h4>
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                  {[
                    { id: 'rain', label: 'Monsoon Rain 🌧️', desc: 'Warm gentle shower' },
                    { id: 'forest', label: 'Nilgiris Forest 🌲', desc: 'Songbirds & leaves' },
                    { id: 'ocean', label: 'Coastal Swell 🌊', desc: 'Rhythmic waves' },
                    { id: 'bells', label: 'Temple Chimes 🔔', desc: 'Singing brass bells' }
                  ].map((s) => {
                    const isPlayingThis = activeSound === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleToggleSound(s.id as any)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isPlayingThis
                            ? 'bg-[#3B664B] text-white shadow-md'
                            : 'bg-white border-gray-200 hover:border-gray-300 text-[#263238]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{s.label}</span>
                          {isPlayingThis ? <Volume2 className="w-4 h-4 animate-pulse" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
                        </div>
                        <span className={`text-[10px] ${isPlayingThis ? 'text-white/80' : 'text-gray-400'}`}>
                          {isPlayingThis ? 'Playing peaceful audio' : s.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Experience 3: Gentle Meditation */}
            {selectedExperience === 'meditation' && (
              <div className="space-y-4">
                <span className="text-3xl font-black font-['Poppins'] text-[#263238]">
                  {formatMeditationTime(meditationSecondsLeft)}
                </span>
                <p className="text-xs text-gray-500">
                  Focus on the gentle flow of breath. A soft chime rings at intervals.
                </p>
                <div className="flex space-x-2 justify-center">
                  {[5, 10, 15].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMeditationMinutes(m);
                        setMeditationSecondsLeft(m * 60);
                        setIsMeditationActive(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        meditationMinutes === m
                          ? 'bg-[#3B664B] text-white'
                          : 'bg-white text-gray-600 border border-gray-200'
                      }`}
                    >
                      {m} Min
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsMeditationActive(!isMeditationActive)}
                  className="px-6 py-3 rounded-2xl bg-[#3B664B] text-white font-bold text-sm shadow-md hover:bg-[#2D4F3B]"
                >
                  {isMeditationActive ? 'Pause Meditation' : 'Start Meditation'}
                </button>
              </div>
            )}

            {/* Experience 4: Relaxing Music */}
            {selectedExperience === 'music' && (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1DB954]/20 text-[#1DB954] flex items-center justify-center mx-auto">
                  <Music className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-[#263238]">
                  Spotify Calm &amp; Instrumental Collection
                </h4>
                <p className="text-xs text-gray-500 max-w-sm">
                  Bamboo flute ragas, sitar harmonics, and gentle ambient melodies curated for memory and emotional peace.
                </p>
                <button
                  onClick={() => {
                    ambientPlayer.start('flute');
                    setActiveSound('flute');
                  }}
                  className="px-6 py-2.5 rounded-2xl bg-[#1DB954] hover:bg-[#1aa34a] text-white font-bold text-xs shadow-md flex items-center space-x-2 mx-auto"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play Serene Ragas</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
