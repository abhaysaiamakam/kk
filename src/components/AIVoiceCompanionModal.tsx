import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Square,
  RotateCcw,
  Sparkles,
  X,
  Minus,
  Maximize2,
  Send,
  Phone,
  AlertTriangle,
  Play,
  Heart,
  Calendar,
  Pill,
  Image as ImageIcon,
  Wind,
  Check,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  PatientProfile, 
  TaskItem, 
  Language, 
  VoiceCompanionMessage, 
  VoiceCompanionAction 
} from '../types';
import { db } from '../services/db';
import { playChime, speakText } from '../utils/audio';

interface AIVoiceCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  tasks: TaskItem[];
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenRoutine: () => void;
  onOpenMedicationTracker: () => void;
  onOpenCalling: (contactName?: string, phone?: string) => void;
  onOpenPhotos: () => void;
  onOpenBreathing: () => void;
  onOpenMusic: () => void;
  onTriggerSOS: () => void;
  onSnoozeTask: (taskId: string) => void;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'speaking';

export const AIVoiceCompanionModal: React.FC<AIVoiceCompanionModalProps> = ({
  isOpen,
  onClose,
  patient,
  tasks,
  language,
  onLanguageChange,
  onOpenRoutine,
  onOpenMedicationTracker,
  onOpenCalling,
  onOpenPhotos,
  onOpenBreathing,
  onOpenMusic,
  onTriggerSOS,
  onSnoozeTask
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [lastSpokenText, setLastSpokenText] = useState<string>('');

  // Initial welcome message per language
  const getGreeting = (lang: Language) => {
    const firstName = patient.name.split(' ')[0];
    if (lang === 'kn') {
      return `ನಮಸ್ಕಾರ ${firstName}! ನಾನು ನಿಮ್ಮ ಮೈಂಡ್‌ಕೇರ್ ಧ್ವನಿ ಸಹಾಯಕ. ನಾನು ಇಂದು ನಿಮಗೆ ಹೇಗೆ ನೆರವಾಗಲಿ?`;
    } else if (lang === 'hi') {
      return `नमस्ते ${firstName}! मैं आपका माइंडकेयर वॉयस साथी हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?`;
    }
    return `Hello ${firstName}! I am your MindCare voice companion. How can I help you feel peaceful and comfortable today?`;
  };

  const [messages, setMessages] = useState<VoiceCompanionMessage[]>(() => [
    {
      id: 'init-msg',
      sender: 'assistant',
      text: getGreeting(language),
      timestamp: 'Just now'
    }
  ]);

  // Caregiver voice recording state
  const [isRecordingCaregiverNote, setIsRecordingCaregiverNote] = useState(false);
  const [caregiverNoteText, setCaregiverNoteText] = useState('');
  const [caregiverNoteSent, setCaregiverNoteSent] = useState(false);

  // References
  const recognitionRef = useRef<any>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Stop speech playback
  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (assistantState === 'speaking') {
      setAssistantState('idle');
    }
  };

  // Stop speech recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (assistantState === 'listening') {
      setAssistantState('idle');
    }
  };

  // Update greeting when language changes if only 1 message
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'init-msg') {
      setMessages([
        {
          id: 'init-msg',
          sender: 'assistant',
          text: getGreeting(language),
          timestamp: 'Just now'
        }
      ]);
    }
  }, [language]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, assistantState]);

  // Clean up speech synthesis on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      stopListening();
    }
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [isOpen]);

  // Speak response out loud using elder-friendly speech synthesis
  const speakVoice = (text: string, lang: Language) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    setLastSpokenText(text);
    setAssistantState('speaking');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.88; // Comfortably paced for elderly patients
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const targetPrefix = lang === 'hi' ? 'hi' : lang === 'kn' ? 'kn' : 'en';
    const voice = voices.find(v => v.lang.toLowerCase().startsWith(targetPrefix));
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      setAssistantState('idle');
    };

    utterance.onerror = () => {
      setAssistantState('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Replay last spoken response
  const handleRepeatResponse = () => {
    if (lastSpokenText) {
      speakVoice(lastSpokenText, language);
    } else {
      const lastAsst = [...messages].reverse().find(m => m.sender === 'assistant');
      if (lastAsst) {
        speakVoice(lastAsst.text, language);
      }
    }
  };

  // Send message to server backend API
  const handleProcessUserCommand = async (userText: string) => {
    if (!userText.trim()) return;

    stopSpeaking();
    setTranscript('');
    setInputText('');
    setMicError(null);

    // Append user message
    const userMsg: VoiceCompanionMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: 'Just now'
    };

    setMessages(prev => [...prev, userMsg]);
    setAssistantState('processing');

    try {
      const response = await fetch('/api/voice-companion/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patient.id,
          message: userText,
          language
        })
      });

      const resData = await response.json();

      if (resData.success && resData.data) {
        const {
          spokenText,
          action,
          actionPayload,
          needsConfirmation,
          confirmationPrompt
        } = resData.data;

        const assistantMsg: VoiceCompanionMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: spokenText,
          timestamp: 'Just now',
          action: action as VoiceCompanionAction,
          actionPayload,
          needsConfirmation,
          confirmationPrompt
        };

        setMessages(prev => [...prev, assistantMsg]);
        speakVoice(spokenText, language);

        // Record assistant action log in realtime store
        db.recordAssistantAction(
          patient.id,
          `Answered "${userText.slice(0, 30)}..."`,
          `Spoken in ${language.toUpperCase()}: ${spokenText}`
        );

        // If action does not need confirmation and is non-intrusive, trigger directly
        if (!needsConfirmation && action) {
          if (action === 'open_photos') {
            setTimeout(() => onOpenPhotos(), 1400);
          } else if (action === 'open_breathing') {
            setTimeout(() => onOpenBreathing(), 1400);
          } else if (action === 'open_music') {
            setTimeout(() => onOpenMusic(), 1400);
          } else if (action === 'remind_task' && actionPayload?.taskId) {
            onSnoozeTask(actionPayload.taskId);
          } else if (action === 'record_caregiver_message') {
            setIsRecordingCaregiverNote(true);
          }
        }
      } else {
        throw new Error('Could not parse response');
      }
    } catch {
      // Robust client fallback
      const fallbackText = language === 'kn'
        ? `ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧನಾಗಿದ್ದೇನೆ. ನೀವು "ಮುಂದಿನ ಕೆಲಸ", "ಔಷಧಿಗಳು", ಅಥವಾ "ಮಗಳಿಗೆ ಕರೆ ಮಾಡು" ಎಂದು ಕೇಳಬಹುದು.`
        : language === 'hi'
        ? `मैं आपकी सहायता के लिए तैयार हूँ। आप "अगला काम", "दवाइयां" या "बेटी को कॉल" कह सकते हैं।`
        : `I am right here with you. You can ask me about your next task, medications, or to call family.`;

      const assistantMsg: VoiceCompanionMessage = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: 'Just now'
      };

      setMessages(prev => [...prev, assistantMsg]);
      speakVoice(fallbackText, language);
    }
  };

  // Speech Recognition (Microphone) handling
  const startListening = () => {
    stopSpeaking();
    setMicError(null);
    setTranscript('');

    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setMicError('Speech recognition is not supported in this browser. You can type below!');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.lang = language === 'hi' ? 'hi-IN' : language === 'kn' ? 'kn-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        playChime();
        setAssistantState('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const finalSpeech = event.results[i][0].transcript;
            setTranscript(finalSpeech);
            handleProcessUserCommand(finalSpeech);
            return;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setTranscript(interim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setMicError('Microphone permission was denied. Please allow microphone access or type below.');
        } else if (event.error !== 'no-speech') {
          setMicError(`Voice input error (${event.error}). You can tap a suggestion or type.`);
        }
        setAssistantState('idle');
      };

      recognition.onend = () => {
        if (assistantState === 'listening') {
          setAssistantState('idle');
        }
      };

      recognition.start();
    } catch (err: any) {
      setMicError(err?.message || 'Could not start microphone');
      setAssistantState('idle');
    }
  };

  const toggleMic = () => {
    if (assistantState === 'listening') {
      stopListening();
    } else {
      startListening();
    }
  };

  // Execute confirmed action
  const handleConfirmAction = (msgId: string, action?: VoiceCompanionAction, payload?: any) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, confirmed: true } : m));

    if (action === 'call_contact') {
      onOpenCalling(payload?.contactName, payload?.phone);
      db.recordAssistantAction(patient.id, `Called ${payload?.contactName || 'family member'}`);
    } else if (action === 'trigger_sos_confirmation') {
      onTriggerSOS();
      db.recordAssistantAction(patient.id, 'Initiated Emergency SOS alert with live location');
    } else if (action === 'open_photos') {
      onOpenPhotos();
    } else if (action === 'open_breathing') {
      onOpenBreathing();
    } else if (action === 'open_music') {
      onOpenMusic();
    } else if (action === 'remind_task' && payload?.taskId) {
      onSnoozeTask(payload.taskId);
    }
  };

  // Submit caregiver voice note
  const handleSendCaregiverNote = () => {
    if (!caregiverNoteText.trim()) return;

    db.sendVoiceNote({
      id: `vn-${Date.now()}`,
      senderName: patient.name,
      senderRole: 'patient',
      timestamp: 'Just now',
      duration: '0:15',
      transcription: caregiverNoteText.trim(),
      patientId: patient.id
    });

    setCaregiverNoteSent(true);
    db.recordAssistantAction(patient.id, 'Sent voice note to caregiver Priya', caregiverNoteText);

    setTimeout(() => {
      setIsRecordingCaregiverNote(false);
      setCaregiverNoteSent(false);
      setCaregiverNoteText('');

      const confirmMsg: VoiceCompanionMessage = {
        id: `asst-note-sent-${Date.now()}`,
        sender: 'assistant',
        text: language === 'kn'
          ? 'ನಿಮ್ಮ ಸಂದೇಶವನ್ನು ಆರೈಕೆದಾರ ಪ್ರಿಯಾಗೆ ಸುರಕ್ಷಿತವಾಗಿ ತಲುಪಿಸಲಾಗಿದೆ.'
          : language === 'hi'
          ? 'आपका संदेश देखभालकर्ता प्रिया को भेज दिया गया है।'
          : 'Your voice note has been safely delivered to your caregiver Priya.',
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, confirmMsg]);
      speakVoice(confirmMsg.text, language);
    }, 1500);
  };

  // -------------------------------------------------------------
  // Render Guard & Minimized Floating Pill UI
  // -------------------------------------------------------------
  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50 animate-bounce-short">
        <div className="bg-[#2D4F3B] text-white px-4 py-3 rounded-3xl shadow-xl flex items-center space-x-3 border border-[#A8C9B0]/50 backdrop-blur-md">
          <button
            onClick={toggleMic}
            className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${
              assistantState === 'listening'
                ? 'bg-red-500 text-white animate-pulse'
                : assistantState === 'speaking'
                ? 'bg-[#A8C9B0] text-[#2D4F3B]'
                : 'bg-white/20 hover:bg-white/30 text-white'
            }`}
            title="Toggle Voice Mic"
          >
            <Mic className="w-5 h-5" />
          </button>

          <div
            onClick={() => setIsMinimized(false)}
            className="cursor-pointer select-none"
          >
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#A8C9B0]" />
              <span className="text-xs font-bold font-['Poppins']">MindCare Voice</span>
            </div>
            <span className="text-[10px] text-[#A8C9B0] block">
              {assistantState === 'listening'
                ? 'Listening...'
                : assistantState === 'speaking'
                ? 'Speaking...'
                : 'Ready • Tap to expand'}
            </span>
          </div>

          <div className="flex items-center space-x-1 border-l border-white/20 pl-2">
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 hover:bg-white/20 rounded-xl cursor-pointer"
              title="Expand Companion"
            >
              <Maximize2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-xl cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // Full Calming Modal Interface for Elderly Patients
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3 sm:p-5">
      <div 
        className="w-full max-w-2xl bg-[#F8F7F0] rounded-3xl sm:rounded-[36px] shadow-2xl border-2 border-[#A8C9B0] flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="MindCare AI Voice Companion"
      >
        
        {/* Top Header */}
        <div className="px-5 py-4 bg-white border-b border-[#A8C9B0]/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-[#3B664B] text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-6 h-6 text-[#A8C9B0]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-[#263238] font-['Poppins']">
                  MindCare Voice Companion
                </h3>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-[#4B7358] font-medium">
                Gentle voice guidance for {patient.name.split(' ')[0]}
              </p>
            </div>
          </div>

          {/* Controls: Language Switcher, Minimize, Close */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-[#F8F7F0] p-1 rounded-2xl border border-[#A8C9B0]/40 text-xs font-bold text-[#263238]">
              {(['en', 'kn', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2 py-1 rounded-xl text-xs transition-all cursor-pointer ${
                    language === lang
                      ? 'bg-[#3B664B] text-white shadow-xs'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'kn' ? 'ಕನ್ನಡ' : 'हिंदी'}
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer transition-colors"
              title="Minimize to floating pill"
            >
              <Minus className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 cursor-pointer transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Conversation History */}
        <div 
          ref={chatScrollRef}
          className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-[#F8F7F0]/60 min-h-[160px]"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
              >
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-gray-500 px-1">
                  <span>{isUser ? patient.name.split(' ')[0] : 'MindCare Companion'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-3xl text-sm sm:text-base leading-relaxed font-medium shadow-xs ${
                    isUser
                      ? 'bg-[#3B664B] text-white rounded-br-xs'
                      : 'bg-white text-[#263238] border border-[#A8C9B0]/50 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Repeat Response Button on Assistant messages */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => speakVoice(msg.text, language)}
                        className="text-xs font-bold text-[#3B664B] hover:text-[#2D4F3B] flex items-center space-x-1 cursor-pointer bg-[#F8F7F0] px-2.5 py-1.5 rounded-xl border border-gray-200"
                        title="Listen to response again"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Repeat voice</span>
                      </button>

                      {msg.action && msg.action !== 'none' && (
                        <span className="text-[10px] font-semibold text-gray-400 capitalize bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                          {msg.action.replace(/_/g, ' ')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Safety Confirmation Card for Sensitive Actions */}
                  {!isUser && msg.needsConfirmation && !msg.confirmed && (
                    <div className="mt-3 p-3.5 bg-[#EEF6FB] border border-[#A0CDE8] rounded-2xl space-y-2">
                      <div className="flex items-center space-x-2 text-[#1E4D6B]">
                        <Info className="w-4 h-4 text-[#1E4D6B] shrink-0" />
                        <span className="text-xs font-bold">
                          {msg.confirmationPrompt || 'Please confirm to proceed:'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleConfirmAction(msg.id, msg.action, msg.actionPayload)}
                          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer flex items-center justify-center space-x-1.5 ${
                            msg.action === 'trigger_sos_confirmation'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-[#3B664B] hover:bg-[#2D4F3B]'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>
                            {msg.action === 'trigger_sos_confirmation'
                              ? 'Yes, send SOS'
                              : msg.action === 'call_contact'
                              ? `Call ${msg.actionPayload?.contactName || 'Now'}`
                              : 'Yes, proceed'}
                          </span>
                        </button>

                        <button
                          onClick={() => setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, needsConfirmation: false } : m))}
                          className="py-2.5 px-3 rounded-xl text-xs font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Confirmed Badge */}
                  {msg.confirmed && (
                    <div className="mt-2 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl inline-flex items-center space-x-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Action confirmed &amp; executed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Real-time Listening Transcript */}
          {assistantState === 'listening' && (
            <div className="flex flex-col items-start space-y-1">
              <span className="text-[11px] font-bold text-[#3B664B] animate-pulse">
                Hearing your voice...
              </span>
              <div className="p-3.5 bg-[#EEF6FB] border border-[#A0CDE8] rounded-2xl rounded-bl-xs text-sm italic text-gray-700">
                &ldquo;{transcript || 'Listening to your words...'}&rdquo;
              </div>
            </div>
          )}

          {/* Processing Thinking Dots */}
          {assistantState === 'processing' && (
            <div className="p-3.5 bg-white border border-[#A8C9B0]/50 rounded-2xl rounded-bl-xs flex items-center space-x-2 text-sm text-gray-500 w-fit">
              <Sparkles className="w-4 h-4 text-[#A8C9B0] animate-spin" />
              <span>Thinking gently...</span>
            </div>
          )}

          {/* Caregiver Voice Note Recording Box */}
          {isRecordingCaregiverNote && (
            <div className="p-4 bg-white border-2 border-[#A8C9B0] rounded-3xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#A8C9B0]/30 text-[#2D4F3B] flex items-center justify-center">
                    <Mic className="w-4 h-4 text-[#3B664B]" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#263238]">
                      Record Message for Caregiver Priya
                    </h4>
                    <span className="text-[10px] text-gray-400">
                      Will be delivered to caregiver dashboard
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsRecordingCaregiverNote(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={caregiverNoteText}
                onChange={(e) => setCaregiverNoteText(e.target.value)}
                placeholder="Speak or type what you'd like to tell Priya..."
                rows={2}
                className="w-full p-3 bg-[#F8F7F0] border border-gray-200 rounded-2xl text-xs sm:text-sm text-[#263238] focus:ring-2 focus:ring-[#A8C9B0] focus:outline-hidden"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">
                  {caregiverNoteSent ? '✅ Delivered to Priya!' : 'Private message for your caregiver'}
                </span>

                <button
                  onClick={handleSendCaregiverNote}
                  disabled={!caregiverNoteText.trim() || caregiverNoteSent}
                  className="px-4 py-2 rounded-xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Priya</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Microphone Error Banner */}
        {micError && (
          <div className="px-5 py-2.5 bg-amber-50 border-t border-b border-amber-200 text-xs text-amber-800 flex items-center justify-between">
            <span>{micError}</span>
            <button
              onClick={() => setMicError(null)}
              className="text-amber-900 font-bold ml-2 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Large Interactive Microphone Centerpiece & Waveform Display */}
        <div className="p-4 sm:p-5 bg-white border-t border-[#A8C9B0]/40 flex flex-col items-center justify-center space-y-4">
          
          {/* Animated Waveform Display */}
          <div className="h-10 flex items-center justify-center space-x-1 sm:space-x-1.5 w-full max-w-xs">
            {[35, 65, 45, 85, 100, 75, 90, 50, 60, 40, 80, 55, 70, 95, 30].map((h, i) => {
              const isActive = assistantState === 'listening' || assistantState === 'speaking';
              return (
                <div
                  key={i}
                  className={`w-1 sm:w-1.5 rounded-full transition-all duration-300 ${
                    assistantState === 'listening'
                      ? 'bg-red-500'
                      : assistantState === 'speaking'
                      ? 'bg-[#3B664B]'
                      : 'bg-gray-200'
                  }`}
                  style={{
                    height: isActive ? `${Math.max(15, (h * (0.4 + (i % 3) * 0.3)))}%` : '6px',
                    animation: isActive ? `pulse 1s infinite ${i * 0.08}s` : 'none'
                  }}
                />
              );
            })}
          </div>

          {/* Large Circular Microphone Button matching Section 1 */}
          <div className="flex items-center space-x-5">
            {/* Replay Last Speech */}
            <button
              onClick={handleRepeatResponse}
              className="w-12 h-12 rounded-full bg-[#F8F7F0] border border-gray-200 hover:border-[#A8C9B0] text-gray-700 flex items-center justify-center shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              title="Repeat Last Response"
            >
              <RotateCcw className="w-5 h-5 text-[#3B664B]" />
            </button>

            {/* Main Microphone Button */}
            <div className="relative">
              {/* Outer pulsing ring when listening */}
              {assistantState === 'listening' && (
                <div className="absolute -inset-3 rounded-full bg-red-400/30 animate-ping pointer-events-none" />
              )}
              {assistantState === 'speaking' && (
                <div className="absolute -inset-3 rounded-full bg-[#A8C9B0]/40 animate-pulse pointer-events-none" />
              )}

              <button
                onClick={toggleMic}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center transition-all transform active:scale-95 shadow-lg cursor-pointer ${
                  assistantState === 'listening'
                    ? 'bg-red-600 hover:bg-red-700 text-white ring-4 ring-red-200'
                    : assistantState === 'speaking'
                    ? 'bg-[#E7DFFA] text-[#3B2961] ring-4 ring-[#D5C6F5]'
                    : 'bg-[#3B664B] hover:bg-[#2D4F3B] text-white ring-4 ring-[#A8C9B0]/40'
                }`}
                title="Tap to speak with MindCare"
              >
                {assistantState === 'listening' ? (
                  <>
                    <Square className="w-7 h-7 sm:w-8 sm:h-8 fill-current" />
                    <span className="text-[10px] sm:text-xs font-bold mt-1">Stop</span>
                  </>
                ) : assistantState === 'speaking' ? (
                  <>
                    <Volume2 className="w-7 h-7 sm:w-8 sm:h-8 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-bold mt-1">Speaking</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-8 h-8 sm:w-9 sm:h-9" />
                    <span className="text-[10px] sm:text-xs font-bold mt-0.5">Tap to Speak</span>
                  </>
                )}
              </button>
            </div>

            {/* Stop Speaking / Mute */}
            <button
              onClick={stopSpeaking}
              disabled={assistantState !== 'speaking'}
              className="w-12 h-12 rounded-full bg-[#F8F7F0] border border-gray-200 hover:border-gray-300 disabled:opacity-40 text-gray-700 flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title="Stop Speaking"
            >
              <Square className="w-5 h-5 text-gray-600 fill-current" />
            </button>
          </div>

          {/* Quick Help & Reassurance Buttons for Elderly Dementia Care */}
          <div className="w-full space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {language === 'kn' ? 'ತ್ವರಿತ ನೆರವು ಮತ್ತು ಸಾಂತ್ವನ' : language === 'hi' ? 'त्वरित सहायता और सांत्वना' : 'Quick Help & Comfort'}
              </span>
              <span className="text-[10px] text-[#3B664B] font-semibold">
                {language === 'kn' ? 'ನಾವು ನಿಮ್ಮೊಂದಿಗೆ ಇದ್ದೇವೆ' : language === 'hi' ? 'हम आपके साथ हैं' : 'Always here with you'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { label: language === 'kn' ? 'ನನಗೆ ಗೊಂದಲವಾಗಿದೆ 🌿' : language === 'hi' ? 'मुझे भ्रम हो रहा है 🌿' : "I'm confused 🌿", query: "I'm confused, where am I?" },
                { label: language === 'kn' ? 'ನೆನಪಿಸಲು ಸಹಾಯ ಮಾಡಿ 💭' : language === 'hi' ? 'याद दिलाने में मदद करें 💭' : "Help me remember 💭", query: "Help me remember what day and time it is" },
                { label: language === 'kn' ? 'ಮುಂದೆ ಏನು ಮಾಡಬೇಕು? ⏰' : language === 'hi' ? 'मुझे आगे क्या करना चाहिए? ⏰' : "What should I do next? ⏰", query: "What should I do next?" },
                { label: language === 'kn' ? 'ಯಾರೊಂದಿಗಾದರೂ ಮಾತನಾಡಬೇಕು 💬' : language === 'hi' ? 'किसी से बात करनी है 💬' : "I want to talk to someone 💬", query: "I want to talk to someone" },
                { label: language === 'kn' ? 'ಒಂಟಿತನ ಅನಿಸುತ್ತಿದೆ 💛' : language === 'hi' ? 'अकेलापन महसूस हो रहा है 💛' : "I feel lonely 💛", query: "I feel lonely today" },
                { label: language === 'kn' ? 'ಆರೈಕೆದಾರರಿಗೆ ಕರೆ ಮಾಡಿ 📞' : language === 'hi' ? 'केयरगिवर को कॉल करें 📞' : "Call my caregiver 📞", query: "Call my caregiver Priya" }
              ].map((help, idx) => (
                <button
                  key={idx}
                  onClick={() => handleProcessUserCommand(help.query)}
                  className="px-3 py-1.5 rounded-xl bg-[#EBF3EE] hover:bg-[#DCEEE2] border border-[#A8C9B0] text-[#2D4F3B] text-xs font-bold whitespace-nowrap transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                >
                  {help.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Voice Command Suggestion Chips matching Section 2 */}
          <div className="w-full flex items-center justify-start sm:justify-center overflow-x-auto gap-2 pt-0.5 pb-1 scrollbar-none">
            {[
              { label: language === 'kn' ? 'ಮುಂದಿನ ಕೆಲಸ 🕒' : language === 'hi' ? 'अगला काम 🕒' : 'What is my next task? 🕒', query: 'What is my next task?' },
              { label: language === 'kn' ? 'ಔಷಧಗಳು 💊' : language === 'hi' ? 'दवाइयां 💊' : 'What medicines do I need to take? 💊', query: 'What medicines do I need to take?' },
              { label: language === 'kn' ? 'ಮಗಳಿಗೆ ಕರೆ 📞' : language === 'hi' ? 'बेटी को कॉल 📞' : 'Call my daughter 📞', query: 'Call my daughter' },
              { label: language === 'kn' ? 'ಸಂಗೀತ 🎵' : language === 'hi' ? 'संगीत 🎵' : 'Play relaxing music 🎵', query: 'Play relaxing music' },
              { label: language === 'kn' ? 'ಉಸಿರಾಟ 🧘' : language === 'hi' ? 'प्राणायाम 🧘' : 'Start breathing exercise 🧘', query: 'Start breathing exercise' },
              { label: language === 'kn' ? 'ದಿನ ಹೇಗಿದೆ ☀️' : language === 'hi' ? 'दिन कैसा है ☀️' : 'How is my day? ☀️', query: 'How is my day?' },
              { label: language === 'kn' ? 'ತುರ್ತು ಸಹಾಯ 🚨' : language === 'hi' ? 'मदद चाहिए 🚨' : 'I need help 🚨', query: 'I need help' }
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleProcessUserCommand(chip.query)}
                className="px-3 py-1.5 rounded-2xl bg-[#F8F7F0] hover:bg-[#EEF6FB] border border-[#A8C9B0]/40 text-[#263238] hover:text-[#1E4D6B] text-xs font-semibold whitespace-nowrap transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Fallback Text Input Alternative */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessUserCommand(inputText);
            }}
            className="w-full flex items-center space-x-2 pt-1"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                language === 'kn'
                  ? 'ಅಥವಾ ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...'
                  : language === 'hi'
                  ? 'या अपना सवाल यहाँ टाइप करें...'
                  : 'Or type your question here...'
              }
              className="flex-1 px-4 py-2.5 bg-[#F8F7F0] border border-gray-200 rounded-2xl text-xs sm:text-sm text-[#263238] focus:ring-2 focus:ring-[#A8C9B0] focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:opacity-40 text-white cursor-pointer shadow-xs transition-colors"
              title="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
