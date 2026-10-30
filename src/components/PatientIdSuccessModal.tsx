import React, { useState } from 'react';
import { Copy, Check, Share2, ShieldCheck, Heart } from 'lucide-react';

interface PatientIdSuccessModalProps {
  patientId: string;
  patientName: string;
  isOpen: boolean;
  onContinue: () => void;
}

export const PatientIdSuccessModal: React.FC<PatientIdSuccessModalProps> = ({
  patientId,
  patientName,
  isOpen,
  onContinue
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(patientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareText = `Hi, my KeenKeep Patient ID is ${patientId}. You can use this ID to connect with me in KeenKeep!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'KeenKeep Patient ID',
          text: shareText
        });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (err) {
        handleCopy();
      }
    } else {
      navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 text-center border border-gray-100 my-auto">
        
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <ShieldCheck className="w-9 h-9 text-[#3B664B]" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-[#263238] font-['Poppins']">
          Welcome to KeenKeep, {patientName.split(' ')[0]}!
        </h2>
        <p className="text-xs text-gray-500 mt-1 mb-5">
          Your permanent unique Patient ID has been generated securely. Share this ID with your caregiver to connect accounts.
        </p>

        {/* Patient ID Banner */}
        <div className="p-4 rounded-2xl bg-[#EBF3EE] border-2 border-[#A8C9B0] my-4 space-y-1">
          <span className="text-[11px] font-bold text-[#4B7358] uppercase tracking-wider block">
            Your Permanent Patient ID
          </span>
          <div className="text-2xl sm:text-3xl font-mono font-black text-[#2D4F3B] tracking-wider select-all py-1">
            {patientId}
          </div>
          <p className="text-[10px] text-gray-500">
            Keep this ID safe. Your caregiver requires this ID to send a connection request.
          </p>
        </div>

        {/* Action Buttons: Copy & Share */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={handleCopy}
            className="py-3 px-4 rounded-2xl bg-white border border-gray-300 hover:border-[#3B664B] text-[#263238] font-bold text-xs flex items-center justify-center space-x-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[#3B664B]" />
                <span>Copy Patient ID</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="py-3 px-4 rounded-2xl bg-[#D8EAF5] hover:bg-[#BEE0F5] text-[#1E4D6B] font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            {shared ? (
              <>
                <Check className="w-4 h-4 text-[#1E4D6B]" />
                <span>Shared!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-[#1E4D6B]" />
                <span>Share ID</span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="w-full py-3.5 px-6 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center space-x-2"
        >
          <Heart className="w-4 h-4" />
          <span>Continue to Patient Dashboard</span>
        </button>

      </div>
    </div>
  );
};
