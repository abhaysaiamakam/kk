import React, { useState } from 'react';
import { 
  Globe, 
  Settings, 
  Bell, 
  Volume2, 
  VolumeX, 
  ArrowLeftRight, 
  CheckCircle2, 
  AlertTriangle,
  Mic 
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { translations } from '../data/translations';
import { ambientPlayer } from '../utils/audio';

interface NavbarProps {
  currentRole: UserRole;
  onRoleSwitch: (role: UserRole) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenSettings: () => void;
  unreadAlertCount: number;
  onViewAlerts?: () => void;
  onOpenVoiceNotes?: () => void;
  onLogout: () => void;
  activePatientName?: string;
  activePatientId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleSwitch,
  language,
  onLanguageChange,
  onOpenSettings,
  unreadAlertCount,
  onViewAlerts,
  onOpenVoiceNotes,
  onLogout,
  activePatientName,
  activePatientId
}) => {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(!!ambientPlayer.getPlayingType());

  const t = translations[language];

  const toggleSound = () => {
    if (ambientPlayer.getPlayingType()) {
      ambientPlayer.stop();
      setIsAudioPlaying(false);
    } else {
      ambientPlayer.start('flute');
      setIsAudioPlaying(true);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-[#F8F7F0]/90 backdrop-blur-md border-b border-[#A8C9B0]/20 px-4 sm:px-6 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* MindCare Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#A8C9B0] flex items-center justify-center shadow-sm text-white">
            <svg className="w-6 h-6 text-[#2D4F3B]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.5,3 C17.5,3 15.2,5.3 14,8.5 C12.8,11.7 13.5,14 13.5,14 C13.5,14 11.2,13.3 8,14.5 C4.8,15.7 2.5,18 2.5,18 C2.5,18 4.8,20.3 8,19.1 C11.2,17.9 11.9,15.6 11.9,15.6 C11.9,15.6 14.2,16.3 17.4,15.1 C20.6,13.9 22.9,11.6 22.9,11.6 C22.9,11.6 20.6,9.3 17.4,10.5 C14.2,11.7 13.5,14 13.5,14 C13.5,14 14.2,11.7 15.4,8.5 C16.6,5.3 17.5,3 17.5,3 Z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-[#263238] font-['Poppins']">
                {t.appName}
              </span>
              {currentRole && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  currentRole === 'patient' 
                    ? 'bg-[#D8EAF5] text-[#1E4D6B]' 
                    : 'bg-[#A8C9B0]/40 text-[#2D4F3B]'
                }`}>
                  {currentRole === 'patient' ? 'Patient App' : 'Caregiver Portal'}
                </span>
              )}
            </div>
            <p className="text-xs text-[#263238]/60 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Right Action Icons & Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Quick Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isAudioPlaying ? "Mute calming sound" : "Play calming sound"}
            className={`p-2 rounded-xl transition-colors border ${
              isAudioPlaying 
                ? 'bg-[#A8C9B0] text-white border-[#A8C9B0] animate-pulse' 
                : 'bg-white text-[#263238]/70 border-gray-200 hover:bg-gray-50'
            }`}
          >
            {isAudioPlaying ? <Volume2 className="w-5 h-5 text-[#2D4F3B]" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Voice Audio Messages (Patient & Caregiver) */}
          {onOpenVoiceNotes && (
            <button
              onClick={onOpenVoiceNotes}
              title="Voice Audio Messages"
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#A8C9B0]/20 hover:bg-[#A8C9B0]/30 border border-[#A8C9B0]/40 text-sm font-semibold text-[#2D4F3B] transition-colors shadow-xs active:scale-95"
            >
              <Mic className="w-4 h-4 text-[#2D4F3B]" />
              <span className="hidden md:inline">Voice Audio</span>
            </button>
          )}

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-[#263238] hover:bg-gray-50 shadow-xs"
              title="Change Language"
            >
              <Globe className="w-4 h-4 text-[#4B7358]" />
              <span className="hidden sm:inline">
                {language === 'en' ? 'English' : language === 'kn' ? 'ಕನ್ನಡ' : 'हिन्दी'}
              </span>
            </button>

            {langMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => { onLanguageChange('en'); setLangMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-[#F8F7F0] ${
                    language === 'en' ? 'font-bold text-[#2D4F3B] bg-[#A8C9B0]/20' : 'text-[#263238]'
                  }`}
                >
                  <span>English</span>
                  {language === 'en' && <CheckCircle2 className="w-4 h-4 text-[#2D4F3B]" />}
                </button>
                <button
                  onClick={() => { onLanguageChange('kn'); setLangMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-[#F8F7F0] ${
                    language === 'kn' ? 'font-bold text-[#2D4F3B] bg-[#A8C9B0]/20' : 'text-[#263238]'
                  }`}
                >
                  <span>ಕನ್ನಡ (Kannada)</span>
                  {language === 'kn' && <CheckCircle2 className="w-4 h-4 text-[#2D4F3B]" />}
                </button>
                <button
                  onClick={() => { onLanguageChange('hi'); setLangMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-[#F8F7F0] ${
                    language === 'hi' ? 'font-bold text-[#2D4F3B] bg-[#A8C9B0]/20' : 'text-[#263238]'
                  }`}
                >
                  <span>हिन्दी (Hindi)</span>
                  {language === 'hi' && <CheckCircle2 className="w-4 h-4 text-[#2D4F3B]" />}
                </button>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setNotifMenuOpen(!notifMenuOpen);
                if (onViewAlerts && unreadAlertCount > 0) onViewAlerts();
              }}
              className="relative p-2 rounded-xl bg-white border border-gray-200 text-[#263238] hover:bg-gray-50 shadow-xs"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-[#263238]/70" />
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F16F6F] text-white text-[11px] font-bold flex items-center justify-center animate-bounce">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            {notifMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-2">
                  <h4 className="font-semibold text-sm text-[#263238]">{t.notifications}</h4>
                  <span className="text-xs text-gray-400">Recent</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  {unreadAlertCount > 0 ? (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-[#F16F6F] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800">SOS Alert Flagged</p>
                        <p className="text-red-700">Ramesh Rao (P-10484) pressed emergency button.</p>
                      </div>
                    </div>
                  ) : null}
                  <div className="p-2.5 bg-[#D8EAF5]/40 rounded-xl">
                    <p className="font-medium text-[#1E4D6B]">Routine Update</p>
                    <p className="text-gray-600">Morning medicine is due at 9:00 AM.</p>
                  </div>
                  <div className="p-2.5 bg-[#A8C9B0]/20 rounded-xl">
                    <p className="font-medium text-[#2D4F3B]">Voice Note</p>
                    <p className="text-gray-600">Daughter Ananya sent a warm voice greeting.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-white border border-gray-200 text-[#263238] hover:bg-gray-50 shadow-xs"
            title="Settings & Profile"
          >
            <Settings className="w-5 h-5 text-[#263238]/70" />
          </button>

          {/* Logout / Exit */}
          <button
            onClick={onLogout}
            className="text-xs font-semibold text-[#3B664B] hover:text-red-600 px-2.5 py-1.5 rounded-xl hover:bg-red-50 border border-gray-200 transition-colors cursor-pointer"
            title="Sign Out"
          >
            Sign Out
          </button>
        </div>

      </div>
    </header>
  );
};
