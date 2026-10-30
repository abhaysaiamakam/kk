import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Loader2,
  Heart,
  ShieldCheck,
  Calendar,
  Phone,
  Droplet,
  Search,
  Check
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { translations } from '../data/translations';
import { authService } from '../services/authService';
import { UserProfileDocument, FirebaseUser } from '../services/firebase';
import { ImageUploader } from './ImageUploader';
import { PatientIdSuccessModal } from './PatientIdSuccessModal';

interface LoginViewProps {
  onLoginSuccess: (user: FirebaseUser, profile: UserProfileDocument) => void;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password' | 'google_setup';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export const LoginView: React.FC<LoginViewProps> = ({ 
  onLoginSuccess, 
  language, 
  onLanguageChange 
}) => {
  const t = translations[language];

  // Auth View Mode
  const [mode, setMode] = useState<AuthMode>('login');

  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Common Profile Fields
  const [registerRole, setRegisterRole] = useState<'patient' | 'caregiver'>('patient');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);

  // Patient-Specific Fields
  const [ageOrDob, setAgeOrDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');

  // Caregiver-Specific Fields
  const [targetPatientId, setTargetPatientId] = useState('');
  const [foundPatientName, setFoundPatientName] = useState<string | null>(null);
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [patientLookupError, setPatientLookupError] = useState<string | null>(null);

  // Pending Google User for Role Selection
  const [pendingGoogleUser, setPendingGoogleUser] = useState<FirebaseUser | null>(null);

  // Patient ID Generation Success Modal State
  const [createdPatientId, setCreatedPatientId] = useState<string | null>(null);
  const [pendingSuccessData, setPendingSuccessData] = useState<{ user: FirebaseUser; profile: UserProfileDocument } | null>(null);

  // Status & Feedback States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Friendly error formatter
  const formatAuthError = (err: any): string => {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      return 'The email or password does not match. Please verify your credentials.';
    }
    if (code === 'auth/user-not-found') {
      return 'No account was found with this email address. Please create an account.';
    }
    if (code === 'auth/email-already-in-use') {
      return 'An account with this email already exists. Please sign in instead.';
    }
    if (code === 'auth/weak-password') {
      return 'Password should be at least 6 characters long.';
    }
    if (code === 'auth/invalid-email') {
      return 'Please enter a valid email address (e.g. name@example.com).';
    }
    if (code === 'auth/popup-closed-by-user') {
      return 'Google sign-in was closed before completion. Please try again.';
    }
    if (code === 'auth/popup-blocked') {
      return 'Google sign-in popup was blocked by your browser. Please allow popups for KeenKeep.';
    }

    return message || 'An unexpected authentication error occurred. Please try again.';
  };

  // Validate Phone format
  const validatePhone = (phoneNumber: string): boolean => {
    const trimmed = phoneNumber.trim();
    return /^\+?[0-9\s\-]{8,15}$/.test(trimmed);
  };

  // Real-time lookup for Patient ID
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
        setPatientLookupError(`No patient found with ID "${targetPatientId.trim().toUpperCase()}". Please check with your patient.`);
      }
    } catch (err: any) {
      setPatientLookupError('Could not verify Patient ID. Please try again.');
    } finally {
      setIsSearchingPatient(false);
    }
  };

  // 1. Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.signInWithEmail(email, password, rememberMe);
      
      if (!result.profile) {
        // Prompt role selection if profile missing
        setPendingGoogleUser(result.user);
        setMode('google_setup');
      } else {
        onLoginSuccess(result.user, result.profile);
      }
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Google Sign-In
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await authService.signInWithGoogle(rememberMe);

      if (result.isNewUser || !result.profile) {
        setPendingGoogleUser(result.user);
        setFullName(result.user.displayName || '');
        setEmail(result.user.email || '');
        setMode('google_setup');
      } else {
        onLoginSuccess(result.user, result.profile);
      }
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. New Registration Form Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Common validations
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!validatePhone(phone)) {
      setErrorMessage('Please enter a valid phone number (e.g. +91 98765 43210).');
      return;
    }

    // Role-specific validations
    if (registerRole === 'patient') {
      if (!ageOrDob.trim()) {
        setErrorMessage('Please enter your age or date of birth.');
        return;
      }
      if (!caregiverName.trim()) {
        setErrorMessage("Please enter your caregiver's full name.");
        return;
      }
      if (!validatePhone(caregiverPhone)) {
        setErrorMessage("Please enter a valid caregiver's phone number.");
        return;
      }
    } else {
      if (!targetPatientId.trim()) {
        setErrorMessage("Please enter the unique Patient ID you wish to connect with.");
        return;
      }
      if (!foundPatientName) {
        setErrorMessage("Please verify the Patient ID before submitting.");
        return;
      }
    }

    // Auth Credentials validation if registering via email mode
    if (mode === 'register') {
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

      if (mode === 'google_setup' && pendingGoogleUser) {
        authUser = pendingGoogleUser;
      } else {
        authUser = await authService.createAuthAccount(email.trim(), password, fullName.trim());
      }

      if (registerRole === 'patient') {
        const profile = await authService.registerPatient({
          user: authUser,
          fullName: fullName.trim(),
          phone: phone.trim(),
          ageOrDob: ageOrDob.trim(),
          bloodGroup,
          caregiverName: caregiverName.trim(),
          caregiverPhone: caregiverPhone.trim(),
          preferredLanguage: selectedLanguage,
          photoURL: photoURL || undefined
        });

        if (onLanguageChange && selectedLanguage !== language) {
          onLanguageChange(selectedLanguage);
        }

        // Display Patient ID Prominent Success Modal
        setCreatedPatientId(profile.patientId || 'KK-PAT-REGISTERED');
        setPendingSuccessData({ user: authUser, profile });
      } else {
        // Caregiver Registration
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

        onLoginSuccess(authUser, profile);
      }
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Forgot Password Handler
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.sendPasswordReset(email.trim());
      setSuccessMessage(`A password reset link has been sent to ${email.trim()}. Please check your inbox.`);
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#F8F7F0] overflow-y-auto py-12">
      
      {/* Background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center transition-all duration-1000 scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80')`,
          filter: 'brightness(0.92) contrast(0.95)'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#F8F7F0]/40 via-transparent to-[#F8F7F0]/85" />
      </div>

      {/* Main Authentication Card */}
      <div className="relative z-10 w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/70 text-center transition-all my-auto">
        
        {/* KeenKeep Emblem */}
        <div className="mx-auto w-14 h-14 rounded-3xl bg-[#A8C9B0] flex items-center justify-center shadow-md mb-2 text-[#2D4F3B]">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.5,3 C17.5,3 15.2,5.3 14,8.5 C12.8,11.7 13.5,14 13.5,14 C13.5,14 11.2,13.3 8,14.5 C4.8,15.7 2.5,18 2.5,18 C2.5,18 4.8,20.3 8,19.1 C11.2,17.9 11.9,15.6 11.9,15.6 C11.9,15.6 14.2,16.3 17.4,15.1 C20.6,13.9 22.9,11.6 22.9,11.6 C22.9,11.6 20.6,9.3 17.4,10.5 C14.2,11.7 13.5,14 13.5,14 C13.5,14 14.2,11.7 15.4,8.5 C16.6,5.3 17.5,3 17.5,3 Z" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#263238] font-['Poppins']">
          {t.appName}
        </h1>
        <p className="text-xs font-semibold text-[#4B7358] mb-4">
          {t.tagline}
        </p>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs text-left flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs text-left flex items-start space-x-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: SIGN IN MODE */}
        {/* ============================================================== */}
        {mode === 'login' && (
          <div>
            <div className="mb-4 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-[#263238]">
                {t.welcomeBack}
              </h2>
              <p className="text-xs text-gray-500">
                {t.signInSubtitle}
              </p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t.password}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center space-x-2 cursor-pointer text-gray-600 select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3B664B] accent-[#3B664B]"
                  />
                  <span>{t.rememberMe}</span>
                </label>

                <button
                  type="button"
                  onClick={() => setMode('forgot_password')}
                  className="text-[#3B664B] font-medium hover:underline cursor-pointer"
                >
                  {t.forgotPassword}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:opacity-70 text-white font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>{t.signIn}</span>
                )}
              </button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400 uppercase">
                <span className="bg-white px-3 font-medium">{t.or}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-[#263238] font-medium text-sm flex items-center justify-center space-x-3 shadow-xs cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.46 7.35 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.1z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.28 2.54 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z" />
              </svg>
              <span>{t.signInGoogle}</span>
            </button>

            <div className="mt-4 text-xs text-gray-600">
              <span>Don't have an account? </span>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[#3B664B] font-semibold hover:underline cursor-pointer ml-1"
              >
                {t.createAccount}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: REGISTRATION FORM (PATIENT & CAREGIVER FLOWS) */}
        {/* ============================================================== */}
        {(mode === 'register' || mode === 'google_setup') && (
          <div className="text-left">
            <div className="mb-4 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-[#263238]">
                {mode === 'google_setup' ? 'Complete Your KeenKeep Profile' : t.registerTitle}
              </h2>
              <p className="text-xs text-gray-500">
                Select your account role to complete registration
              </p>
            </div>

            {/* Role Selection Switcher */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <button
                type="button"
                onClick={() => {
                  setRegisterRole('patient');
                  setFoundPatientName(null);
                  setPatientLookupError(null);
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  registerRole === 'patient'
                    ? 'border-[#3B664B] bg-[#EAF2EC] text-[#2D4F3B] shadow-xs'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <Heart className="w-5 h-5 mb-1 text-[#3B664B]" />
                <span className="text-xs font-bold">Patient</span>
                <span className="text-[10px] text-gray-500">Personal wellness</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRegisterRole('caregiver');
                  setFoundPatientName(null);
                  setPatientLookupError(null);
                }}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  registerRole === 'caregiver'
                    ? 'border-[#3B664B] bg-[#EAF2EC] text-[#2D4F3B] shadow-xs'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <ShieldCheck className="w-5 h-5 mb-1 text-[#3B664B]" />
                <span className="text-xs font-bold">Caregiver</span>
                <span className="text-[10px] text-gray-500">Care &amp; management</span>
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              
              {/* Optional Profile Picture Upload with Circular Preview */}
              <ImageUploader
                photoURL={photoURL}
                name={fullName || 'User'}
                onChangePhoto={(url) => setPhotoURL(url)}
                label="Profile Photo (Optional)"
              />

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-xs sm:text-sm focus:ring-2 focus:ring-[#A8C9B0]"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-xs sm:text-sm focus:ring-2 focus:ring-[#A8C9B0]"
                    required
                  />
                </div>
              </div>

              {/* PATIENT REGISTRATION SPECIFIC FIELDS */}
              {registerRole === 'patient' && (
                <>
                  {/* Age or DOB */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Age or Date of Birth <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={ageOrDob}
                        onChange={(e) => setAgeOrDob(e.target.value)}
                        placeholder="e.g. 68 or 15 Apr 1957"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-xs sm:text-sm focus:ring-2 focus:ring-[#A8C9B0]"
                        required
                      />
                    </div>
                  </div>

                  {/* Blood Group Selectable List */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Blood Group <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-red-500">
                        <Droplet className="w-4 h-4" />
                      </span>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#A8C9B0]"
                        required
                      >
                        {BLOOD_GROUPS.map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Caregiver Name */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Caregiver's Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={caregiverName}
                        onChange={(e) => setCaregiverName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-xs sm:text-sm focus:ring-2 focus:ring-[#A8C9B0]"
                        required
                      />
                    </div>
                  </div>

                  {/* Caregiver Phone */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Caregiver's Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="tel"
                        value={caregiverPhone}
                        onChange={(e) => setCaregiverPhone(e.target.value)}
                        placeholder="+91 91234 56789"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-xs sm:text-sm focus:ring-2 focus:ring-[#A8C9B0]"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              {/* CAREGIVER REGISTRATION SPECIFIC FIELDS */}
              {registerRole === 'caregiver' && (
                <div className="p-3.5 rounded-2xl bg-[#EEF6FB] border border-[#A0CDE8] space-y-2">
                  <label className="block text-xs font-bold text-[#1E4D6B]">
                    Connect to Patient via Unique Patient ID <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] text-gray-600">
                    Enter your patient's unique Patient ID (e.g. KK-PAT-8X92K) to send a connection request.
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
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs sm:text-sm uppercase font-mono font-bold text-[#263238]"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleVerifyPatientId}
                      disabled={!targetPatientId.trim() || isSearchingPatient}
                      className="px-3 py-2 rounded-xl bg-[#1E4D6B] hover:bg-[#163B52] disabled:opacity-50 text-white text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      {isSearchingPatient ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>Verify</span>
                    </button>
                  </div>

                  {/* Verification result badge */}
                  {foundPatientName && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Patient Found: {foundPatientName}</span>
                    </div>
                  )}

                  {patientLookupError && (
                    <p className="text-xs text-red-600 font-semibold mt-1">
                      {patientLookupError}
                    </p>
                  )}
                </div>
              )}

              {/* Email & Password Input if Email Auth Mode */}
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-xs sm:text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span> (min. 6 chars)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-xs sm:text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-xs sm:text-sm"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Preferred Language
                </label>
                <div className="flex space-x-2">
                  {(['en', 'kn', 'hi'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLanguage(lang)}
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        selectedLanguage === lang
                          ? 'border-[#3B664B] bg-[#3B664B] text-white'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {lang === 'en' ? 'English' : lang === 'kn' ? 'ಕನ್ನಡ' : 'हिन्दी'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Registration */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-3 py-3 px-6 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:opacity-70 text-white font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing Registration...</span>
                  </>
                ) : (
                  <span>Complete Registration</span>
                )}
              </button>
            </form>

            <div className="mt-4 text-xs text-gray-600 text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#3B664B] font-semibold hover:underline cursor-pointer"
              >
                {t.alreadyHaveAccount}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 3: FORGOT PASSWORD MODE */}
        {/* ============================================================== */}
        {mode === 'forgot_password' && (
          <div className="text-left">
            <div className="mb-4 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-[#263238]">
                {t.resetPassword}
              </h2>
              <p className="text-xs text-gray-500">
                Enter your registered email address and we will send you a reset link.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:opacity-70 text-white font-semibold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Sending email...</span>
                  </>
                ) : (
                  <span>{t.sendResetEmail}</span>
                )}
              </button>
            </form>

            <div className="mt-4 text-xs text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="inline-flex items-center space-x-1.5 text-gray-600 hover:text-[#3B664B] font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.backToSignIn}</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Motto */}
        <div className="mt-6 pt-3.5 border-t border-gray-100 flex items-center justify-center space-x-2 text-xs font-medium text-[#4B7358]/80">
          <Sparkles className="w-3.5 h-3.5 text-[#A8C9B0]" />
          <span>{t.kindnessMotto}</span>
        </div>

      </div>

      {/* Prominent Patient ID Generation Modal */}
      {createdPatientId && pendingSuccessData && (
        <PatientIdSuccessModal
          patientId={createdPatientId}
          patientName={pendingSuccessData.profile.fullName}
          isOpen={!!createdPatientId}
          onContinue={() => {
            const data = pendingSuccessData;
            setCreatedPatientId(null);
            setPendingSuccessData(null);
            onLoginSuccess(data.user, data.profile);
          }}
        />
      )}

    </div>
  );
};
