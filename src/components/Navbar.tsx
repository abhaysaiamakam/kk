import React, { useState, useRef, useEffect } from 'react';
import { 
  Globe, 
  Settings, 
  Bell, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle,
  Mic,
  Menu,
  LogOut,
  Sliders,
  ChevronRight
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
  onOpenCallLogs?: () => void;
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(!!ambientPlayer.getPlayingType());
  const menuRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-sm bg-[#A9CBB4] flex items-center justify-center">
            <img src="/assets/aistudio/image_ff1a441e.png" alt="KeenKeep Logo" className="w-full h-full object-cover" />
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

        {/* Top-Right Corner: Exactly TWO buttons per user request */}
        <div className="flex items-center space-x-2 relative" ref={menuRef}>
          
          {/* Button 2: Voice Audio Button */}
          {onOpenVoiceNotes && (
            <button
              onClick={onOpenVoiceNotes}
              title="Voice Audio Messages"
              className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-[#A8C9B0]/25 hover:bg-[#A8C9B0]/40 border border-[#A8C9B0]/50 text-sm font-semibold text-[#2D4F3B] transition-colors shadow-xs active:scale-95 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-[#2D4F3B]" />
              <span className="hidden sm:inline">Voice Audio</span>
            </button>
          )}

          {/* Button 1: Dropdown Menu Button containing all extra actions */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="relative flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-[#263238] hover:bg-gray-50 shadow-xs transition-colors cursor-pointer"
              title="Menu & Actions"
            >
              <Menu className="w-5 h-5 text-[#263238]/80" />
              <span className="text-sm font-medium hidden md:inline">Menu</span>
              {unreadAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#F16F6F] text-white text-[11px] font-bold flex items-center justify-center animate-pulse">
                  {unreadAlertCount}
                </span>
              )}
            </button>

            {/* Dropdown Menu Content */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-3 px-2 z-50 animate-in fade-in zoom-in-95">
                
                {/* Header in dropdown */}
                <div className="px-3 pb-2 mb-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Quick Actions & Settings</span>
                  {unreadAlertCount > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                      {unreadAlertCount} Alerts
                    </span>
                  )}
                </div>

                {/* 1. Calming Sound Toggle */}
                <button
                  onClick={() => {
                    toggleSound();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#263238] hover:bg-[#F8F7F0] transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className={`p-1.5 rounded-lg ${isAudioPlaying ? 'bg-[#A8C9B0] text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {isAudioPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </div>
                    <span>{isAudioPlaying ? 'Mute Calming Sound' : 'Play Calming Sound'}</span>
                  </div>
                  <span className="text-xs text-gray-400">{isAudioPlaying ? 'Playing' : 'Off'}</span>
                </button>

                {/* 2. Language Switcher */}
                <div className="my-1.5 px-3 py-2 bg-gray-50/80 rounded-xl">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#4B7358]" />
                    <span>Language / ಭಾಷೆ / भाषा</span>
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => { onLanguageChange('en'); }}
                      className={`py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        language === 'en' ? 'bg-[#2D4F3B] text-white shadow-xs' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      English
                    </button>
                    <button
                      onClick={() => { onLanguageChange('kn'); }}
                      className={`py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        language === 'kn' ? 'bg-[#2D4F3B] text-white shadow-xs' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      ಕನ್ನಡ
                    </button>
                    <button
                      onClick={() => { onLanguageChange('hi'); }}
                      className={`py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        language === 'hi' ? 'bg-[#2D4F3B] text-white shadow-xs' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      हिन्दी
                    </button>
                  </div>
                </div>

                {/* 3. Notifications Summary / View */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    if (onViewAlerts) onViewAlerts();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#263238] hover:bg-[#F8F7F0] transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 relative">
                      <Bell className="w-4 h-4" />
                      {unreadAlertCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      )}
                    </div>
                    <span>{t.notifications}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    {unreadAlertCount > 0 && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">{unreadAlertCount}</span>}
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                {/* 4. Settings & Profile */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-[#263238] hover:bg-[#F8F7F0] transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                      <Settings className="w-4 h-4" />
                    </div>
                    <span>Settings & Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>

                <div className="my-1 border-t border-gray-100" />

                {/* 5. Sign Out */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <div className="p-1.5 rounded-lg bg-red-100 text-red-600">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <span>Sign Out</span>
                  </div>
                </button>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
