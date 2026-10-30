import React from 'react';
import { Users, HeartHandshake, ArrowRight } from 'lucide-react';
import { UserRole, Language } from '../types';
import { translations } from '../data/translations';

interface RoleSelectionViewProps {
  onSelectRole: (role: UserRole) => void;
  language: Language;
}

export const RoleSelectionView: React.FC<RoleSelectionViewProps> = ({ onSelectRole, language }) => {
  const t = translations[language];

  return (
    <div className="relative min-h-[calc(100vh-65px)] w-full flex items-center justify-center p-4 sm:p-6 bg-[#F8F7F0] overflow-hidden">
      
      {/* Botanical Decorative Leaves (Subtle watercolor art) */}
      <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-40">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-[#A8C9B0]">
          <path d="M190,10 C150,40 130,90 140,150 C110,110 80,70 120,20 Z" fill="currentColor" opacity="0.6"/>
          <path d="M170,50 C120,80 100,130 110,190 C90,140 60,110 100,60 Z" fill="currentColor" opacity="0.4"/>
          <path d="M140,100 C90,130 70,170 80,210 C60,170 40,140 70,100 Z" fill="currentColor" opacity="0.3"/>
        </svg>
      </div>
      
      <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none opacity-40">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full text-[#A8C9B0]">
          <path d="M10,190 C40,150 90,130 150,140 C110,110 70,80 20,120 Z" fill="currentColor" opacity="0.5"/>
          <path d="M50,170 C80,120 130,100 190,110 C140,90 110,60 60,100 Z" fill="currentColor" opacity="0.3"/>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-xl text-center">
        
        {/* MindCare Leaf Header */}
        <div className="mx-auto w-12 h-12 rounded-2xl bg-[#A8C9B0]/40 flex items-center justify-center text-[#2D4F3B] mb-5">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.5,3 C17.5,3 15.2,5.3 14,8.5 C12.8,11.7 13.5,14 13.5,14 C13.5,14 11.2,13.3 8,14.5 C4.8,15.7 2.5,18 2.5,18 C2.5,18 4.8,20.3 8,19.1 C11.2,17.9 11.9,15.6 11.9,15.6 C11.9,15.6 14.2,16.3 17.4,15.1 C20.6,13.9 22.9,11.6 22.9,11.6 C22.9,11.6 20.6,9.3 17.4,10.5 C14.2,11.7 13.5,14 13.5,14 C13.5,14 14.2,11.7 15.4,8.5 C16.6,5.3 17.5,3 17.5,3 Z" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#263238] font-['Poppins'] mb-2">
          {t.chooseRoleTitle}
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mb-8 max-w-md mx-auto">
          {t.chooseRoleSubtitle}
        </p>

        {/* The Two Choice Cards */}
        <div className="space-y-5">
          
          {/* Caregiver Card */}
          <button
            onClick={() => onSelectRole('caregiver')}
            className="group w-full bg-white hover:bg-[#F2F8F4] border-2 border-transparent hover:border-[#A8C9B0] rounded-3xl p-6 sm:p-7 flex items-center justify-between shadow-md hover:shadow-xl transition-all duration-300 text-left active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 rounded-2xl bg-[#A8C9B0]/30 text-[#2D4F3B] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#A8C9B0]/50 transition-all duration-300">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#263238] mb-1 font-['Poppins']">
                  {t.iAmCaregiver}
                </h3>
                <p className="text-sm text-gray-500">
                  {t.caregiverDesc}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F8F7F0] flex items-center justify-center text-gray-400 group-hover:text-[#2D4F3B] group-hover:bg-[#A8C9B0]/30 transition-all">
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

          {/* Patient Card */}
          <button
            onClick={() => onSelectRole('patient')}
            className="group w-full bg-white hover:bg-[#EEF6FB] border-2 border-transparent hover:border-[#A0CDE8] rounded-3xl p-6 sm:p-7 flex items-center justify-between shadow-md hover:shadow-xl transition-all duration-300 text-left active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center space-x-5">
              <div className="w-16 h-16 rounded-2xl bg-[#D8EAF5] text-[#1E4D6B] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#BEE0F5] transition-all duration-300">
                <HeartHandshake className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#263238] mb-1 font-['Poppins']">
                  {t.iAmPatient}
                </h3>
                <p className="text-sm text-gray-500">
                  {t.patientDesc}
                </p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F8F7F0] flex items-center justify-center text-gray-400 group-hover:text-[#1E4D6B] group-hover:bg-[#D8EAF5] transition-all">
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>

        </div>

      </div>
    </div>
  );
};
