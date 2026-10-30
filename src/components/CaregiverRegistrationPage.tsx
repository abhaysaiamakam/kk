import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  ArrowLeft, 
  Loader2, 
  ShieldCheck, 
  Search, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';
import { authService } from '../services/authService';
import { UserProfileDocument, FirebaseUser } from '../services/firebase';
import { ImageUploader } from './ImageUploader';

interface CaregiverRegistrationPageProps {
  currentUser?: FirebaseUser | null;
  language: Language;
  onRegistrationSuccess: (user: FirebaseUser, profile: UserProfileDocument) => void;
  onBack: () => void;
  onLanguageChange?: (lang: Language) => void;
}

export const CaregiverRegistrationPage: React.FC<CaregiverRegistrationPageProps> = ({
  currentUser,
  language,
  onRegistrationSuccess,
  onBack,
  onLanguageChange
}) => {
  const t = translations[language];

  // Form State
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [phone, setPhone] = useState('');
  const [targetPatientId, setTargetPatientId] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(currentUser?.photoURL || null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  // Email & Password if not already authenticated
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification & Feedback State
  const [foundPatientName, setFoundPatientName] = useState<string | null>(null);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [patientLookupError, setPatientLookupError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validatePhone = (num: string): boolean => {
    return /^\+?[0-9\s\-]{8,15}$/.test(num.trim());
  };

  const handleVerifyPatientId = async () => {
    if (!targetPatientId.trim()) return;

    setPatientLookupError(null);
    setFoundPatientName(null);
    setIsSearchingPatient(true);

    try {
      const patientData = await authService.findPatientById(targetPatientId.trim());
      if (patientData) {
        setFoundPatientName(patientData.fullName);
      } else {
        setPatientLookupError(`No patient found with ID "${targetPatientId.trim().toUpperCase()}". Please verify the Patient ID with your patient.`);
      }
    } catch (err: any) {
      setPatientLookupError('Could not verify Patient ID. Please check network connection.');
    } finally {
      setIsSearchingPatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validations
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!validatePhone(phone)) {
      setErrorMessage('Please enter a valid phone number (e.g. +91 98765 43210).');
      return;
    }
    if (!targetPatientId.trim()) {
      setErrorMessage('Please enter the unique Patient ID to connect.');
      return;
    }
    if (!foundPatientName) {
      setErrorMessage('Please verify the Patient ID before submitting registration.');
      return;
    }

    if (!currentUser) {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      let authUser: FirebaseUser;
      if (currentUser) {
        authUser = currentUser;
      } else {
        authUser = await authService.createAuthAccount(email.trim(), password, fullName.trim());
      }

      const { profile } = await authService.registerCaregiver({
        user: authUser,
        fullName: fullName.trim(),
        phone: phone.trim(),
        patientId: targetPatientId.trim().toUpperCase(),
        preferredLanguage: selectedLanguage,
        photoURL: photoURL || undefined
      });

      if (onLanguageChange && selectedLanguage !== language) {
        onLanguageChange(selectedLanguage);
      }

      onRegistrationSuccess(authUser, profile);
    } catch (err: any) {
      console.error('Caregiver registration error:', err);
      setErrorMessage(err?.message || 'Failed to complete caregiver registration. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8F7F0] flex items-center justify-center p-4 sm:p-6 overflow-y-auto py-12">
      
      {/* Container Card */}
      <div className="relative z-10 w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 space-y-6 my-auto">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer flex items-center space-x-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#A8C9B0]/40 text-[#2D4F3B] flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4 text-[#3B664B]" />
            </div>
            <span className="text-xs font-bold text-[#2D4F3B] bg-[#EAF2EC] px-2.5 py-1 rounded-full border border-[#A8C9B0]">
              Caregiver Registration
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-[#263238] font-['Poppins']">
            Caregiver Account Setup
          </h1>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Connect to your patient's device using their unique Patient ID to manage care routines, medications, and emergency alerts.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <ImageUploader
            photoURL={photoURL}
            name={fullName || 'Caregiver'}
            onChangePhoto={(url) => setPhotoURL(url)}
            label="Upload Profile Photo (Optional)"
          />

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Caregiver's Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:ring-2 focus:ring-[#A8C9B0]"
                required
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Caregiver's Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 91234 56789"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:ring-2 focus:ring-[#A8C9B0]"
                required
              />
            </div>
          </div>

          {/* Patient Link Verification Box */}
          <div className="p-4 rounded-2xl bg-[#EEF6FB] border border-[#A0CDE8] space-y-2">
            <label className="block text-xs font-bold text-[#1E4D6B]">
              Patient Connection ID <span className="text-red-500">*</span>
            </label>
            <p className="text-[11px] text-gray-600">
              Enter your patient's unique Patient ID (e.g. KK-PAT-8X92K) to verify connection.
            </p>

            <div className="flex space-x-2">
              <input
                type="text"
                value={targetPatientId}
                onChange={(e) => {
                  setTargetPatientId(e.target.value.toUpperCase());
                  setFoundPatientName(null);
                  setPatientLookupError(null);
                }}
                placeholder="e.g. KK-PAT-8X92K"
                className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-gray-300 text-sm uppercase font-mono font-bold text-[#263238]"
                required
              />
              <button
                type="button"
                onClick={handleVerifyPatientId}
                disabled={!targetPatientId.trim() || isSearchingPatient}
                className="px-4 py-2.5 rounded-xl bg-[#1E4D6B] hover:bg-[#163B52] disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                {isSearchingPatient ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                <span>Verify ID</span>
              </button>
            </div>

            {/* Verification Result */}
            {foundPatientName && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified Patient: {foundPatientName}</span>
              </div>
            )}

            {patientLookupError && (
              <p className="text-xs text-red-600 font-semibold mt-1">
                {patientLookupError}
              </p>
            )}
          </div>

          {/* Email & Password if creating new Auth account */}
          {!currentUser && (
            <div className="p-4 bg-[#F8F7F0] rounded-2xl border border-gray-200 space-y-3">
              <span className="text-xs font-bold text-[#263238] block">Login Account Credentials</span>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="caregiver@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferred Language */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Preferred Language
            </label>
            <div className="flex space-x-2">
              {(['en', 'kn', 'hi'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLanguage(lang)}
                  className={`flex-1 py-2 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer ${
                    selectedLanguage === lang
                      ? 'border-[#3B664B] bg-[#3B664B] text-white shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {lang === 'en' ? 'English' : lang === 'kn' ? 'ಕನ್ನಡ' : 'हिन्दी'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:opacity-70 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Connecting to Patient...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Send Connection Request</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
