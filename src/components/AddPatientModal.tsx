import React, { useState } from 'react';
import { ArrowLeft, UserPlus, ShieldCheck, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { PatientProfile } from '../types';
import { authService } from '../services/authService';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patient: PatientProfile) => void;
  existingCount: number;
  caregiverUid?: string;
  caregiverName?: string;
  caregiverPhone?: string;
  caregiverEmail?: string;
  caregiverPhotoURL?: string;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onAddPatient,
  existingCount,
  caregiverUid = '',
  caregiverName = 'Caregiver',
  caregiverPhone = '',
  caregiverEmail = '',
  caregiverPhotoURL = ''
}) => {
  const [patientIdInput, setPatientIdInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedPatient, setVerifiedPatient] = useState<{
    uid: string;
    fullName: string;
    phone?: string;
    photoURL?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleVerifyId = async () => {
    const trimmed = patientIdInput.trim().toUpperCase();
    if (!trimmed) {
      setErrorMessage('Please enter a Patient Connection ID (e.g. KK-PAT-XXXXX)');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setSuccessMessage('');
    setVerifiedPatient(null);

    try {
      const found = await authService.findPatientById(trimmed);
      if (found) {
        setVerifiedPatient(found);
        setSuccessMessage(`Patient "${found.fullName}" verified successfully!`);
      } else {
        setErrorMessage(`Patient ID "${trimmed}" not found. Please check the ID with your patient.`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not verify patient ID.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedPatient) {
      setErrorMessage('Please verify the Patient Connection ID first.');
      return;
    }

    try {
      if (caregiverUid) {
        await authService.requestConnectAdditionalPatient({
          caregiverUid,
          caregiverName,
          caregiverPhone,
          caregiverEmail,
          caregiverPhotoURL,
          patientId: patientIdInput.trim().toUpperCase()
        });
        alert(`Connection request sent to ${verifiedPatient.fullName}! Once approved on the patient dashboard, they will appear in your connected patients list.`);
      } else {
        const newPatient: PatientProfile = {
          id: patientIdInput.trim().toUpperCase(),
          uid: verifiedPatient.uid,
          name: verifiedPatient.fullName,
          age: 70,
          gender: 'Not specified',
          bloodGroup: 'O+',
          homeLocation: 'Bengaluru',
          liveLocationEnabled: true,
          dateOfBirth: '1954',
          avatar: verifiedPatient.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
          status: 'all_good',
          streakDays: 1,
          overallCompletion: 90,
          caregiverId: caregiverName,
          phone: verifiedPatient.phone || ''
        };
        onAddPatient(newPatient);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not connect patient.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
              Connect Patient
            </h2>
          </div>
          <span className="text-xs font-mono font-bold bg-[#A8C9B0]/30 text-[#2D4F3B] px-2.5 py-1 rounded-lg">
            Patient ID
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleConnect} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Patient Connection ID
            </label>
            <p className="text-[11px] text-gray-400 mb-2">
              Enter the unique ID provided on the patient&apos;s KeenKeep dashboard (e.g. KK-PAT-59BRR).
            </p>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. KK-PAT-ABC12"
                value={patientIdInput}
                onChange={(e) => setPatientIdInput(e.target.value)}
                className="flex-1 text-sm p-3 bg-[#F8F7F0] border border-gray-200 rounded-2xl text-[#263238] uppercase font-mono tracking-wider font-bold"
                required
              />
              <button
                type="button"
                onClick={handleVerifyId}
                disabled={isVerifying || !patientIdInput.trim()}
                className="px-4 py-3 bg-[#3B664B] hover:bg-[#2D4F3B] text-white text-xs font-bold rounded-2xl shadow-xs disabled:opacity-50 cursor-pointer flex items-center space-x-1 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>{isVerifying ? 'Verifying...' : 'Verify ID'}</span>
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 flex items-center space-x-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center space-x-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {verifiedPatient && (
            <div className="p-4 bg-[#F8F7F0] border border-emerald-300 rounded-2xl space-y-2">
              <div className="flex items-center space-x-3">
                <img
                  src={verifiedPatient.photoURL || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'}
                  alt={verifiedPatient.fullName}
                  className="w-12 h-12 rounded-full object-cover border border-gray-300 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-sm text-[#263238] font-['Poppins']">
                    {verifiedPatient.fullName}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Phone: {verifiedPatient.phone || 'Registered in Firebase'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-green-50 rounded-2xl border border-green-200 flex items-center space-x-2 text-xs text-green-800">
            <ShieldCheck className="w-4 h-4 shrink-0 text-green-600" />
            <span>Secure connection requests require patient approval on their device.</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!verifiedPatient}
              className="w-full py-3.5 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] disabled:bg-gray-300 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Send Connection Request</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
