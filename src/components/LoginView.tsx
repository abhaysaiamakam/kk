import React, { useState } from 'react';
import { User, Sparkles } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface LoginViewProps {
  onLogin: (userName: string) => void;
  language: Language;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, language }) => {
  const [name, setName] = useState('Aarav Sharma');
  const t = translations[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  const handleGoogleSignIn = () => {
    onLogin('Aarav Sharma');
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#F8F7F0] overflow-hidden">
      
      {/* Scenic Nature Background matching Reference Image Screen 1 */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80')`,
          filter: 'brightness(0.92) contrast(0.95)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F7F0]/40 via-transparent to-[#F8F7F0]/85" />
      </div>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/60 text-center transition-all">
        
        {/* MindCare Emblem */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-[#A8C9B0] flex items-center justify-center shadow-md mb-4 text-[#2D4F3B]">
          <svg className="w-9 h-9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.5,3 C17.5,3 15.2,5.3 14,8.5 C12.8,11.7 13.5,14 13.5,14 C13.5,14 11.2,13.3 8,14.5 C4.8,15.7 2.5,18 2.5,18 C2.5,18 4.8,20.3 8,19.1 C11.2,17.9 11.9,15.6 11.9,15.6 C11.9,15.6 14.2,16.3 17.4,15.1 C20.6,13.9 22.9,11.6 22.9,11.6 C22.9,11.6 20.6,9.3 17.4,10.5 C14.2,11.7 13.5,14 13.5,14 C13.5,14 14.2,11.7 15.4,8.5 C16.6,5.3 17.5,3 17.5,3 Z" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-[#263238] font-['Poppins']">
          {t.appName}
        </h1>
        <p className="text-sm font-medium text-[#4B7358] mb-6">
          {t.tagline}
        </p>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#263238] mb-1">
            {t.welcomeBack}
          </h2>
          <p className="text-sm text-gray-500">
            {t.signInSubtitle}
          </p>
        </div>

        {/* Form Input */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="w-5 h-5" />
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.yourNamePlaceholder}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-base focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-6 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] cursor-pointer"
          >
            {t.continueBtn}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400 uppercase">
            <span className="bg-white px-3 font-medium">{t.or}</span>
          </div>
        </div>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-[#263238] font-medium text-sm flex items-center justify-center space-x-3 shadow-xs transition-all hover:border-gray-300 active:scale-[0.99] cursor-pointer"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.46 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.1z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.28 2.54 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
            />
          </svg>
          <span>{t.signInGoogle}</span>
        </button>

        {/* Footer Motto */}
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-center space-x-2 text-xs font-medium text-[#4B7358]/80">
          <Sparkles className="w-3.5 h-3.5 text-[#A8C9B0]" />
          <span>{t.kindnessMotto}</span>
        </div>

      </div>
    </div>
  );
};
