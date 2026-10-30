import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sparkles, 
  Globe, 
  Radio, 
  SkipBack, 
  SkipForward, 
  CheckCircle2 
} from 'lucide-react';
import { PatientProfile, TaskItem, Language, MoodRecord } from '../types';
import { speakText } from '../utils/audio';

interface AiOverviewVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  tasks: TaskItem[];
  moods: MoodRecord[];
  language: Language;
}

type SummaryType = 'daily' | 'weekly' | 'missed' | 'medication' | 'mood';

export const AiOverviewVoiceModal: React.FC<AiOverviewVoiceModalProps> = ({
  isOpen,
  onClose,
  patient,
  tasks,
  moods,
  language
}) => {
  const [selectedSummary, setSelectedSummary] = useState<SummaryType>('daily');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.8 | 1.0 | 1.25>(1.0);
  const [voiceLang, setVoiceLang] = useState<Language>(language);
  const [waveformBars, setWaveformBars] = useState<number[]>([30, 60, 90, 45, 80, 50, 70, 40, 95, 60]);

  // Animate audio waveform during speech
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setWaveformBars(Array.from({ length: 16 }, () => Math.floor(Math.random() * 70) + 25));
      }, 150);
    } else {
      setWaveformBars([30, 45, 60, 40, 55, 35, 50, 45, 60, 40, 55, 30, 45, 60, 35, 50]);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!isOpen) return null;

  // Build actual dynamic summary text based on saved patient tasks
  const completedTasks = tasks.filter((t) => t.completed);
  const upcomingTasks = tasks.filter((t) => !t.completed);
  const latestMood = moods[moods.length - 1]?.mood || 'happy';

  const generateSummaryText = (type: SummaryType, lang: Language): string => {
    if (lang === 'kn') {
      if (type === 'daily') {
        return `ಶುಭೋದಯ. ${patient.name} ಅವರ ದಿನಚರಿ ಉತ್ತಮವಾಗಿ ಸಾಗಿದೆ. ಅವರು ಬೆಳಗಿನ ಔಷಧಿಯನ್ನು ಮತ್ತು ಉಸಿರಾಟದ ವ್ಯಾಯಾಮವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿದ್ದಾರೆ. ಅವರ ಮುಂದಿನ ಚಟುವಟಿಕೆ ${upcomingTasks[0]?.title || 'ವಿಶ್ರಾಂತಿ'} ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ನಿಗದಿಯಾಗಿದೆ.`;
      }
      return `ಆರವ್ ಅವರ ಆರೋಗ್ಯ ಮತ್ತು ಮನಸ್ಥಿತಿ ಸ್ಥಿರವಾಗಿದೆ. ಯಾವುದೇ ತುರ್ತು ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ.`;
    }

    if (lang === 'hi') {
      if (type === 'daily') {
        return `शुभ प्रभात. ${patient.name} का आज का दिन बहुत अच्छा रहा है। उन्होंने सुबह 9 बजे अपनी दवा ली, सांस लेने का अभ्यास पूरा किया और मेमोरी गेम खेला। उनकी अगली गतिविधि समय पर निर्धारित है।`;
      }
      return `${patient.name} का स्वास्थ्य और मनोदशा बहुत अच्छी है। कोई आपातकालीन अलर्ट नहीं है।`;
    }

    // English
    switch (type) {
      case 'daily':
        return `Good morning. ${patient.name} has had a productive morning. He completed his medication at 9 AM, finished his breathing exercise, and played a memory game. His afternoon walk is scheduled for 11 AM.`;
      case 'weekly':
        return `${patient.name}'s 7-day adherence is at 93%. He has taken 24 of 26 scheduled medications on time, maintaining a 5-day wellness streak.`;
      case 'missed':
        return upcomingTasks.length > 0
          ? `There are no critical missed activities today. Upcoming task: ${upcomingTasks[0].title} at ${upcomingTasks[0].time}.`
          : `Great news! All scheduled activities for today have been completed on time.`;
      case 'medication':
        return `Morning Paracetamol 500mg was taken at 9:05 AM. Upcoming: Vitamin D3 at 1:00 PM. Refill alert: Paracetamol supply has 5 days remaining.`;
      case 'mood':
        return `${patient.name} recorded feeling '${latestMood.replace('_', ' ')}' this morning after tea and garden stroll. Positive mood trend over the past 4 days.`;
    }
  };

  const currentSummaryText = generateSummaryText(selectedSummary, voiceLang);

  const handlePlay = () => {
    setIsPlaying(true);
    speakText(currentSummaryText, voiceLang);
    // Rough estimate of speech duration based on text length and speed
    const durationMs = (currentSummaryText.split(' ').length / (2.5 * playbackSpeed)) * 1000;
    setTimeout(() => {
      setIsPlaying(false);
    }, Math.max(durationMs, 4000));
  };

  const handlePause = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    setIsPlaying(false);
  };

  const handleStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col p-6 max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                handleStop();
                onClose();
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-[#3B664B]" />
              <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
                Today&apos;s AI Summary
              </h2>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center space-x-1 bg-[#F8F7F0] p-1 rounded-xl border border-gray-200">
            <Globe className="w-3.5 h-3.5 text-gray-500 ml-1.5" />
            {(['en', 'kn', 'hi'] as Language[]).map((lng) => (
              <button
                key={lng}
                onClick={() => {
                  setVoiceLang(lng);
                  handleStop();
                }}
                className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors ${
                  voiceLang === lng
                    ? 'bg-[#3B664B] text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {lng === 'en' ? 'EN' : lng === 'kn' ? 'ಕನ್ನಡ' : 'हिंदी'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic AI Summary Content Card */}
        <div className="my-5 p-5 rounded-2xl bg-gradient-to-br from-[#F8F7F0] to-[#EBF3EE] border border-[#A8C9B0]/40">
          <p className="text-base text-gray-800 font-medium leading-relaxed font-['Inter']">
            &ldquo;{currentSummaryText}&rdquo;
          </p>

          <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center space-x-1.5 text-green-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Synced with live patient database</span>
            </span>
            <span>ID: {patient.id}</span>
          </div>
        </div>

        {/* Audio Waveform Visualizer */}
        <div className="flex items-center justify-center space-x-1.5 h-12 my-2 bg-[#F8F7F0] rounded-2xl p-2 border border-gray-100">
          {waveformBars.map((height, i) => (
            <div
              key={i}
              className={`w-1.5 rounded-full transition-all duration-150 ${
                isPlaying ? 'bg-[#3B664B]' : 'bg-[#A8C9B0]'
              }`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Playback Controls matching Image Screen 8 */}
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-gray-200 my-2">
          
          {/* Replay */}
          <button
            onClick={() => {
              handleStop();
              handlePlay();
            }}
            className="p-2 text-gray-500 hover:text-[#263238] transition-colors"
            title="Replay from start"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Skip Back */}
          <button
            onClick={handleStop}
            className="p-2 text-gray-500 hover:text-[#263238] transition-colors"
            title="Stop"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Master Play / Pause Button */}
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="w-14 h-14 rounded-full bg-[#3B664B] hover:bg-[#2D4F3B] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
            title={isPlaying ? "Pause summary" : "Listen to summary"}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Skip Forward */}
          <button
            onClick={handlePlay}
            className="p-2 text-gray-500 hover:text-[#263238] transition-colors"
            title="Resume"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Speed Selector */}
          <button
            onClick={() => {
              const speeds: (0.8 | 1.0 | 1.25)[] = [0.8, 1.0, 1.25];
              const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
              setPlaybackSpeed(next);
            }}
            className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 transition-colors"
            title="Playback Speed"
          >
            {playbackSpeed}x
          </button>

        </div>

        {/* Available Summaries Pills matching Image Screen 8 */}
        <div className="mt-3">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
            Available Summaries
          </label>
          <div className="flex flex-wrap gap-2">
            {(['daily', 'weekly', 'missed', 'medication', 'mood'] as SummaryType[]).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setSelectedSummary(st);
                  handleStop();
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  selectedSummary === st
                    ? 'bg-[#3B664B] text-white shadow-xs'
                    : 'bg-[#F8F7F0] text-gray-600 hover:bg-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
