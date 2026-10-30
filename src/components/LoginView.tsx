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
  Droplet
} from 'lucide-react';
import { Language, UserRole } from '../types';
import { translations } from '../data/translations';
import { authService } from '../services/authService';
import { UserProfileDocument, FirebaseUser } from '../services/firebase';

interface LoginViewProps {
  onLoginSuccess: (user: FirebaseUser, profile: UserProfileDocument) => void;
  language: Language;
  onLanguageChange?: (lang: Language) => void;
}

type AuthMode = 'login' | 'register' | 'forgot_password' | 'google_setup';

export const LoginView: React.FC<LoginViewProps> = ({ 
  onLoginSuccess, 
  language, 
  onLanguageChange 
}) => {
  const t = translations[language];

  // Auth View Mode
  const [mode, setMode] = useState<AuthMode>('login');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [registerRole, setRegisterRole] = useState<'patient' | 'caregiver'>('patient');
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [rememberMe, setRememberMe] = useState(true);

  // Role-Specific Fields
  const [ageOrDob, setAgeOrDob] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  // Pending Google User for Role Selection
  const [pendingGoogleUser, setPendingGoogleUser] = useState<FirebaseUser | null>(null);

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
    if (code === 'auth/too-many-requests') {
      return 'Too many unsuccessful attempts. Please wait a few moments or reset your password.';
    }
    if (code === 'auth/network-request-failed') {
      return 'Network connection error. Please check your internet connection.';
    }

    return message || 'An unexpected authentication error occurred. Please try again.';
  };

  // 1. Email / Password Login Handler
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
        // Fallback profile if Firestore user doc missing
        const fallbackProfile: UserProfileDocument = {
          uid: result.user.uid,
          fullName: result.user.displayName || email.split('@')[0],
          email: result.user.email || email,
          role: 'patient',
          preferredLanguage: selectedLanguage,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        };
        onLoginSuccess(result.user, fallbackProfile);
      } else {
        onLoginSuccess(result.user, result.profile);
      }
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Real Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const result = await authService.signInWithGoogle(rememberMe);

      if (result.isNewUser || !result.profile) {
        // Prompt new Google user to select role and enter required profile details
        setPendingGoogleUser(result.user);
        setFullName(result.user.displayName || '');
        setMode('google_setup');
      } else {
        // Existing user: proceed straight to their dashboard
        onLoginSuccess(result.user, result.profile);
      }
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. New User Registration Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password.');
      return;
    }

    if (registerRole === 'patient' && !ageOrDob.trim()) {
      setErrorMessage('Please enter your age or date of birth.');
      return;
    }

    setIsLoading(true);
    try {
      const { user, profile } = await authService.registerWithEmail({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        role: registerRole,
        preferredLanguage: selectedLanguage,
        ageOrDob: ageOrDob.trim() || undefined,
        phone: phoneNumber.trim() || undefined,
        bloodGroup: bloodGroup.trim() || undefined
      });

      if (onLanguageChange && selectedLanguage !== language) {
        onLanguageChange(selectedLanguage);
      }

      onLoginSuccess(user, profile);
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Finish New Google User Profile Setup
  const handleCompleteGoogleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;

    if (registerRole === 'patient' && !ageOrDob.trim()) {
      setErrorMessage('Please enter your age or date of birth.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    try {
      const profile = await authService.createGoogleUserProfile(
        pendingGoogleUser,
        registerRole,
        selectedLanguage,
        {
          fullName: fullName.trim() || pendingGoogleUser.displayName || undefined,
          ageOrDob: ageOrDob.trim() || undefined,
          phone: phoneNumber.trim() || undefined,
          bloodGroup: bloodGroup.trim() || undefined
        }
      );

      if (onLanguageChange && selectedLanguage !== language) {
        onLanguageChange(selectedLanguage);
      }

      onLoginSuccess(pendingGoogleUser, profile);
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Forgot Password Handler
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
      setSuccessMessage(
        `A password reset link has been sent to ${email.trim()}. Please check your inbox.`
      );
    } catch (err: any) {
      setErrorMessage(formatAuthError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#F8F7F0] overflow-y-auto py-12">
      
      {/* Scenic Nature Background matching KeenKeep Design */}
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
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-7 sm:p-9 border border-white/70 text-center transition-all my-auto">
        
        {/* KeenKeep Emblem */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-[#A8C9B0] flex items-center justify-center shadow-md mb-3 text-[#2D4F3B]">
          <svg className="w-9 h-9" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.5,3 C17.5,3 15.2,5.3 14,8.5 C12.8,11.7 13.5,14 13.5,14 C13.5,14 11.2,13.3 8,14.5 C4.8,15.7 2.5,18 2.5,18 C2.5,18 4.8,20.3 8,19.1 C11.2,17.9 11.9,15.6 11.9,15.6 C11.9,15.6 14.2,16.3 17.4,15.1 C20.6,13.9 22.9,11.6 22.9,11.6 C22.9,11.6 20.6,9.3 17.4,10.5 C14.2,11.7 13.5,14 13.5,14 C13.5,14 14.2,11.7 15.4,8.5 C16.6,5.3 17.5,3 17.5,3 Z" />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#263238] font-['Poppins']">
          {t.appName}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-[#4B7358] mb-5">
          {t.tagline}
        </p>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm text-left flex items-start space-x-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-xs sm:text-sm text-left flex items-start space-x-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 1: SIGN IN MODE */}
        {/* ============================================================== */}
        {mode === 'login' && (
          <div>
            <div className="mb-5 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-[#263238] mb-0.5">
                {t.welcomeBack}
              </h2>
              <p className="text-xs text-gray-500">
                {t.signInSubtitle}
              </p>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3.5 text-left">
              {/* Email Input */}
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
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Input with Show/Hide */}
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
                    autoComplete="current-password"
                    className="w-full pl-10 pr-11 py-3 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password Row */}
              <div className="flex items-center justify-between pt-0.5 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer select-none text-gray-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#3B664B] focus:ring-[#A8C9B0] border-gray-300 accent-[#3B664B] cursor-pointer"
                  />
                  <span>{t.rememberMe}</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setMode('forgot_password');
                  }}
                  className="text-[#3B664B] font-medium hover:underline cursor-pointer"
                >
                  {t.forgotPassword}
                </button>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:opacity-70 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] cursor-pointer flex items-center justify-center space-x-2"
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

            {/* OR Divider */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs text-gray-400 uppercase">
                <span className="bg-white px-3 font-medium">{t.or}</span>
              </div>
            </div>

            {/* Real Google Sign-in Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
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

            {/* Create Account Link */}
            <div className="mt-5 text-xs text-gray-600">
              <span>Don't have an account? </span>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('register');
                }}
                className="text-[#3B664B] font-semibold hover:underline cursor-pointer ml-1"
              >
                {t.createAccount}
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: REGISTRATION MODE */}
        {/* ============================================================== */}
        {mode === 'register' && (
          <div>
            <div className="mb-4 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-[#263238] mb-0.5">
                {t.registerTitle}
              </h2>
              <p className="text-xs text-gray-500">
                Choose your role to get started with KeenKeep
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 text-left">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  I am registering as:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('patient')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      registerRole === 'patient'
                        ? 'border-[#3B664B] bg-[#EAF2EC] text-[#2D4F3B] shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Heart className="w-5 h-5 mb-1 text-[#3B664B]" />
                    <span className="text-xs font-bold">Patient</span>
                    <span className="text-[10px] text-gray-500">Personal care</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterRole('caregiver')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      registerRole === 'caregiver'
                        ? 'border-[#3B664B] bg-[#EAF2EC] text-[#2D4F3B] shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 mb-1 text-[#3B664B]" />
                    <span className="text-xs font-bold">Caregiver</span>
                    <span className="text-[10px] text-gray-500">Manage care</span>
                  </button>
                </div>
              </div>

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
                    placeholder="Your full name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Patient-Specific Fields */}
              {registerRole === 'patient' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date of Birth or Age <span className="text-red-500">*</span>
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Caregiver-Specific Fields */}
              {registerRole === 'caregiver' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
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
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password */}
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
                    autoComplete="new-password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
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

              {/* Confirm Password */}
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
                    autoComplete="new-password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
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

              {/* Language Choice */}
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
                className="w-full mt-3 py-3 px-6 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:opacity-70 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-4 text-xs text-gray-600">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
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
          <div>
            <div className="mb-5 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-[#263238] mb-0.5">
                {t.resetPassword}
              </h2>
              <p className="text-xs text-gray-500">
                Enter your registered email address and we will send you a password reset link.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4 text-left">
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
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:opacity-70 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2"
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

            <div className="mt-5 text-xs">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setMode('login');
                }}
                className="inline-flex items-center space-x-1.5 text-gray-600 hover:text-[#3B664B] font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.backToSignIn}</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 4: GOOGLE NEW USER ONBOARDING (Role & Language Setup) */}
        {/* ============================================================== */}
        {mode === 'google_setup' && pendingGoogleUser && (
          <div>
            <div className="mb-4 text-center">
              <h2 className="text-lg sm:text-xl font-bold text-[#263238] mb-0.5">
                Welcome to KeenKeep!
              </h2>
              <p className="text-xs text-gray-500">
                Hi {pendingGoogleUser.displayName || 'there'}! Please select your fixed role to setup your profile.
              </p>
            </div>

            <form onSubmit={handleCompleteGoogleSetup} className="space-y-4 text-left">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Select Your Account Role
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegisterRole('patient')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      registerRole === 'patient'
                        ? 'border-[#3B664B] bg-[#EAF2EC] text-[#2D4F3B] shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <Heart className="w-5 h-5 mb-1 text-[#3B664B]" />
                    <span className="text-xs font-bold">Patient</span>
                    <span className="text-[10px] text-gray-500">Personal wellness</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterRole('caregiver')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      registerRole === 'caregiver'
                        ? 'border-[#3B664B] bg-[#EAF2EC] text-[#2D4F3B] shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5 mb-1 text-[#3B664B]" />
                    <span className="text-xs font-bold">Caregiver</span>
                    <span className="text-[10px] text-gray-500">Support loved ones</span>
                  </button>
                </div>
              </div>

              {/* Patient-Specific Fields */}
              {registerRole === 'patient' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Date of Birth or Age <span className="text-red-500">*</span>
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#A8C9B0] transition-all"
                      required
                    />
                  </div>
                </div>
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
                      {lang === 'en' ? 'English' : lang === 'kn' ? 'ಕನ್ನಡ' : 'ಹಿಂ ದೀ'}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:opacity-70 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Configuring profile...</span>
                  </>
                ) : (
                  <span>Continue to Dashboard</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer Motto */}
        <div className="mt-6 pt-3.5 border-t border-gray-100 flex items-center justify-center space-x-2 text-xs font-medium text-[#4B7358]/80">
          <Sparkles className="w-3.5 h-3.5 text-[#A8C9B0]" />
          <span>{t.kindnessMotto}</span>
        </div>

      </div>
    </div>
  );
};
