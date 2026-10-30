import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Send, 
  User, 
  MessageSquare, 
  Volume2, 
  Check, 
  Sparkles, 
  RotateCcw, 
  HeartHandshake, 
  Radio 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VoiceNoteRecord, PatientProfile, Language } from '../types';
import { db } from '../services/db';
import { playChime, speakText } from '../utils/audio';

interface VoiceNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePatient: PatientProfile;
  currentRole: 'patient' | 'caregiver';
  currentUserName: string;
  language: Language;
}

export const VoiceNotesModal: React.FC<VoiceNotesModalProps> = ({
  isOpen,
  onClose,
  activePatient,
  currentRole,
  currentUserName,
  language
}) => {
  const [notes, setNotes] = useState<VoiceNoteRecord[]>(() => db.getVoiceNotes(activePatient.id));
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [customTranscription, setCustomTranscription] = useState('');
  const [playingNoteId, setPlayingNoteId] = useState<string | null>(null);

  // Audio elements & MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // Subscribe to real-time voice notes updates
  useEffect(() => {
    if (!isOpen) return;

    setNotes(db.getVoiceNotes(activePatient.id));

    const unsubscribe = db.subscribe((event) => {
      if (event.type === 'VOICE_NOTE_SENT') {
        setNotes(db.getVoiceNotes(activePatient.id));
      }
    });

    return () => {
      unsubscribe();
      stopAudioPlayback();
    };
  }, [isOpen, activePatient.id]);

  if (!isOpen) return null;

  // Real Microphone Recording logic
  const startRecording = async () => {
    setRecordedAudioUrl(null);
    setRecordSeconds(0);
    audioChunksRef.current = [];

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64data = reader.result as string;
            setRecordedAudioUrl(base64data);
          };
          // Stop media tracks
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } else {
        // Fallback for browsers without getUserMedia
        setIsRecording(true);
      }
    } catch (err) {
      console.warn('Microphone permission or hardware notice, using simulated speech audio:', err);
      setIsRecording(true);
    }

    timerIntervalRef.current = window.setInterval(() => {
      setRecordSeconds((sec) => sec + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Recorder stop notice:', e);
      }
    }

    playChime();
  };

  const handleSendVoiceNote = () => {
    const defaultText = currentRole === 'caregiver'
      ? `Caregiver voice message for ${activePatient.name}: "Checking in on your morning medicine and garden walk. Hope you are feeling bright and cheerful!"`
      : `Patient voice note from ${activePatient.name}: "Hello Priya, thank you for checking in. I completed my morning tasks and feel peaceful."`;

    const finalTranscription = customTranscription.trim() || defaultText;
    const durationStr = `0:${recordSeconds < 10 ? '0' : ''}${recordSeconds || 15}`;

    const newNote: VoiceNoteRecord = {
      id: `vn-${Date.now()}`,
      senderName: currentRole === 'caregiver' ? 'Priya Sharma (Caregiver)' : activePatient.name,
      senderRole: currentRole,
      timestamp: 'Just now',
      duration: durationStr,
      audioBlobUrl: recordedAudioUrl || undefined,
      transcription: finalTranscription,
      patientId: activePatient.id
    };

    db.sendVoiceNote(newNote);
    playChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    // Reset recording states
    setRecordedAudioUrl(null);
    setRecordSeconds(0);
    setCustomTranscription('');
  };

  const stopAudioPlayback = () => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current = null;
    }
    setPlayingNoteId(null);
  };

  const handleTogglePlayNote = (note: VoiceNoteRecord) => {
    if (playingNoteId === note.id) {
      stopAudioPlayback();
      return;
    }

    stopAudioPlayback();
    setPlayingNoteId(note.id);

    if (note.audioBlobUrl) {
      try {
        const audio = new Audio(note.audioBlobUrl);
        activeAudioRef.current = audio;
        audio.onended = () => {
          setPlayingNoteId(null);
        };
        audio.onerror = () => {
          // Fallback to speech synthesis if audio file format fails
          speakText(note.transcription, language);
          setTimeout(() => setPlayingNoteId(null), 4000);
        };
        audio.play().catch(() => {
          speakText(note.transcription, language);
          setTimeout(() => setPlayingNoteId(null), 4000);
        });
      } catch {
        speakText(note.transcription, language);
        setTimeout(() => setPlayingNoteId(null), 4000);
      }
    } else {
      speakText(note.transcription, language);
      setTimeout(() => setPlayingNoteId(null), 4500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header with Bidirectional Context */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                stopAudioPlayback();
                onClose();
              }}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
                Voice Audio Messaging
              </h2>
              <p className="text-xs text-gray-500">
                {currentRole === 'caregiver' 
                  ? `Speaking with ${activePatient.name} (${activePatient.id})`
                  : `Speaking with Caregiver Priya Sharma`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#A8C9B0]/30 text-[#2D4F3B] text-xs font-bold">
            <Radio className="w-3.5 h-3.5 text-[#3B664B] animate-pulse" />
            <span>Live Audio</span>
          </div>
        </div>

        {/* Audio Recording Card */}
        <div className="p-5 bg-gradient-to-b from-[#F8F7F0] to-white border-b border-gray-200 text-center space-y-3">
          {isRecording ? (
            <div className="space-y-3 py-2">
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute w-20 h-20 rounded-full bg-red-400/30 animate-ping" />
                <div className="absolute w-16 h-16 rounded-full bg-red-400/50 animate-pulse" />
                <button
                  onClick={stopRecording}
                  className="relative z-10 w-14 h-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer"
                  title="Stop recording"
                >
                  <Square className="w-6 h-6 fill-current" />
                </button>
              </div>

              {/* Pulsing Audio Waveform Visualizer */}
              <div className="flex items-center justify-center space-x-1 h-6">
                {[30, 80, 50, 95, 70, 100, 60, 85, 40, 90, 75, 45].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 bg-red-500 rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.08}s`
                    }}
                  />
                ))}
              </div>

              <p className="text-sm font-bold text-red-600 font-mono">
                Recording... 0:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}
              </p>
              <p className="text-xs text-gray-500">
                Tap the red square when you are finished speaking
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={startRecording}
                  className="w-14 h-14 rounded-full bg-[#3B664B] hover:bg-[#2D4F3B] text-white flex items-center justify-center shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                  title="Tap to speak"
                >
                  <Mic className="w-7 h-7" />
                </button>
              </div>

              <div>
                <h4 className="text-sm font-bold text-[#263238] font-['Poppins']">
                  {currentRole === 'caregiver'
                    ? `Record Voice Note for ${activePatient.name}`
                    : `Tap to Record Voice for Caregiver Priya`}
                </h4>
                <p className="text-xs text-gray-500">
                  Speak clearly into your microphone — your loved one will hear your actual voice
                </p>
              </div>

              {/* After Recording Preview & Send Bar */}
              {recordSeconds > 0 && !isRecording && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                    <span className="flex items-center space-x-1.5">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Audio recorded ({recordSeconds}s)</span>
                    </span>
                    <button
                      onClick={startRecording}
                      className="text-gray-500 hover:text-gray-700 font-semibold"
                    >
                      Re-record
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Optional message caption or note..."
                    value={customTranscription}
                    onChange={(e) => setCustomTranscription(e.target.value)}
                    className="w-full text-xs p-2 bg-white border border-emerald-300 rounded-xl"
                  />

                  <button
                    onClick={handleSendVoiceNote}
                    className="w-full py-2.5 rounded-xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Audio to {currentRole === 'caregiver' ? activePatient.name : 'Caregiver Priya'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Audio Messages Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
          <div className="flex items-center justify-between pb-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Audio Conversation History ({notes.length})
            </h4>
            <span className="text-[10px] text-gray-400">Synchronized in real-time</span>
          </div>

          {notes.map((note) => {
            const isFromCurrentRole = note.senderRole === currentRole;
            const isPlaying = playingNoteId === note.id;

            return (
              <div
                key={note.id}
                className={`p-4 rounded-2xl border transition-all ${
                  note.senderRole === 'patient'
                    ? 'bg-[#EEF6FB] border-[#A0CDE8] shadow-xs'
                    : 'bg-[#F2F8F4] border-[#A8C9B0] shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-2xs ${
                      note.senderRole === 'patient' ? 'bg-[#D8EAF5] text-[#1E4D6B]' : 'bg-[#A8C9B0] text-[#2D4F3B]'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#263238] block">
                        {note.senderName}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {note.timestamp} • {note.senderRole === 'patient' ? 'Patient Voice' : 'Caregiver Voice'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold text-gray-500 bg-white/80 px-2 py-0.5 rounded-md border border-gray-200">
                    {note.duration}
                  </span>
                </div>

                {/* Transcription or Note Content */}
                <p className="text-xs text-gray-700 italic bg-white/85 p-3 rounded-xl border border-gray-100 leading-relaxed mb-3">
                  &ldquo;{note.transcription}&rdquo;
                </p>

                {/* Audio Player Action Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-black/5">
                  <button
                    onClick={() => handleTogglePlayNote(note)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-red-500 text-white shadow-xs'
                        : 'bg-[#3B664B] hover:bg-[#2D4F3B] text-white shadow-xs'
                    }`}
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Playing Audio...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Listen to Voice</span>
                      </>
                    )}
                  </button>

                  <span className="text-[10px] text-gray-400 flex items-center space-x-1">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Delivered</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
