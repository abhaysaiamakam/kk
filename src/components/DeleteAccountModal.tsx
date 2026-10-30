import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  Loader2, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';
import { authService } from '../services/authService';
import { auth } from '../services/firebase';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountDeleted: () => void;
  userRole?: 'patient' | 'caregiver' | null;
  userName?: string;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountDeleted,
  userRole,
  userName
}) => {
  const currentUser = auth.currentUser;
  const isGoogleUser = currentUser?.providerData.some(p => p.providerId === 'google.com') ?? false;

  // Form State
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [understandChecked, setUnderstandChecked] = useState(false);

  // Status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConfirmValid = understandChecked && confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!understandChecked) {
      setErrorMessage('Please confirm that you understand this action is permanent.');
      return;
    }

    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setErrorMessage('Please type "DELETE" in the text field to confirm.');
      return;
    }

    if (!isGoogleUser && !password) {
      setErrorMessage('Please enter your current account password to re-authenticate.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.deleteAccount({
        password: isGoogleUser ? undefined : password,
        isGoogleUser
      });

      onClose();
      onAccountDeleted();
    } catch (err: any) {
      console.error('Account deletion error:', err);
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        setErrorMessage('Incorrect password. Please enter your correct current password.');
      } else {
        setErrorMessage(err?.message || 'Failed to delete account. Re-authentication may be required.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-red-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-red-100 flex items-center justify-between bg-red-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center font-bold shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-950 font-['Poppins']">
                Delete Account
              </h2>
              <span className="text-[11px] font-semibold text-red-700 block">
                Permanent Data Removal
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-red-100 transition-colors text-gray-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleDelete} className="p-6 space-y-4 overflow-y-auto">
          
          {/* Danger Warning Box */}
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs space-y-2">
            <div className="flex items-center space-x-2 font-bold text-red-800 text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Warning: This action cannot be undone</span>
            </div>
            <p className="leading-relaxed">
              Deleting your account will permanently remove your profile, health records, login credentials, and personal settings from KeenKeep.
            </p>
            {userRole === 'patient' && (
              <p className="font-semibold text-red-800 pt-1">
                Linked caregivers will no longer be able to monitor your daily tasks or receive emergency SOS alerts from this account.
              </p>
            )}
            {userRole === 'caregiver' && (
              <p className="font-semibold text-red-800 pt-1">
                Your linked patient connections and pending care requests will be safely unlinked.
              </p>
            )}
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-red-100 border border-red-300 text-red-800 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* Re-Authentication Field */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-gray-800">
              Step 1: Re-authenticate Account Ownership <span className="text-red-500">*</span>
            </label>

            {isGoogleUser ? (
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 space-y-2">
                <p className="font-semibold">
                  You are signed in using Google Authentication. Clicking Delete will prompt Google re-authentication.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Enter Current Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-[#263238] text-xs sm:text-sm focus:ring-2 focus:ring-red-400"
                    required={!isGoogleUser}
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
            )}
          </div>

          {/* Confirmation Checkbox */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <label className="block text-xs font-bold text-gray-800">
              Step 2: Confirm Account Deletion <span className="text-red-500">*</span>
            </label>

            <label className="flex items-start space-x-2.5 cursor-pointer text-xs text-gray-700 select-none">
              <input
                type="checkbox"
                checked={understandChecked}
                onChange={(e) => setUnderstandChecked(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-red-600 accent-red-600"
              />
              <span>I understand that my KeenKeep profile data will be permanently deleted.</span>
            </label>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                Type <strong className="text-red-600 uppercase">DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F8F7F0] border border-gray-200 text-xs sm:text-sm font-mono font-bold uppercase text-red-600"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={!isConfirmValid || isLoading}
              className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Deleting Account &amp; Records...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Permanently Delete My Account</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
