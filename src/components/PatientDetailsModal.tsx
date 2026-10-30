import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  MapPin, 
  Droplet, 
  Calendar, 
  User, 
  Globe, 
  Bell, 
  ShieldCheck,
  Phone
} from 'lucide-react';
import { PatientProfile, Language } from '../types';
import { translations } from '../data/translations';
import { UserAvatar } from './UserAvatar';
import { ImageUploader } from './ImageUploader';

interface PatientDetailsModalProps {
  patient: PatientProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePatient: (updated: PatientProfile) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout?: () => void;
}

export const PatientDetailsModal: React.FC<PatientDetailsModalProps> = ({
  patient,
  isOpen,
  onClose,
  onUpdatePatient,
  language,
  onLanguageChange,
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<PatientProfile>(patient);
  const [notificationsOn, setNotificationsOn] = useState(true);

  if (!isOpen) return null;

  const t = translations[language];

  const handleCopyId = () => {
    navigator.clipboard.writeText(patient.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    onUpdatePatient(formData);
    setIsEditing(false);
  };

  const toggleLiveLocation = () => {
    const updated = { ...formData, liveLocationEnabled: !formData.liveLocationEnabled };
    setFormData(updated);
    onUpdatePatient(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header matching Image Screen 4 */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
              {t.settings}
            </h2>
          </div>
          <span className="text-xs bg-[#A8C9B0]/30 text-[#2D4F3B] font-semibold px-2.5 py-1 rounded-full flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified</span>
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Avatar & Patient ID Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-[#D8EAF5]/50 to-[#A8C9B0]/20 border border-[#A8C9B0]/30">
            {isEditing ? (
              <div className="shrink-0">
                <ImageUploader
                  photoURL={formData.avatar}
                  name={formData.name}
                  onChangePhoto={(newAvatar: string | null) => setFormData({ ...formData, avatar: newAvatar || '' })}
                />
              </div>
            ) : (
              <UserAvatar
                src={formData.avatar}
                name={formData.name}
                className="w-16 h-16 shrink-0"
              />
            )}
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <h3 className="text-lg font-bold text-[#263238] truncate font-['Poppins']">
                {formData.name}
              </h3>
              <div className="flex items-center justify-center sm:justify-start space-x-2 mt-0.5">
                <span className="text-xs font-medium text-gray-600 bg-white/80 px-2.5 py-0.5 rounded-md border border-gray-200 font-mono">
                  Patient ID: {formData.id}
                </span>
                <button
                  onClick={handleCopyId}
                  className="p-1 rounded-md text-gray-500 hover:text-[#2D4F3B] hover:bg-white transition-colors cursor-pointer"
                  title="Copy Patient ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Patient Details List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Personal Information
            </h4>

            <div className="bg-[#F8F7F0] rounded-2xl p-4 divide-y divide-gray-200/70 text-sm">
              
              {/* Name */}
              <div className="py-2.5 flex items-center justify-between first:pt-0">
                <div className="flex items-center space-x-3 text-gray-600">
                  <User className="w-4 h-4 text-[#4B7358]" />
                  <span>Name</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="text-right text-sm font-semibold bg-white px-2 py-1 rounded-lg border border-gray-300"
                  />
                ) : (
                  <span className="font-semibold text-[#263238]">{formData.name}</span>
                )}
              </div>

              {/* Gender */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-gray-600">
                  <User className="w-4 h-4 text-[#4B7358]" />
                  <span>Gender</span>
                </div>
                {isEditing ? (
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="text-right text-sm font-semibold bg-white px-2 py-1 rounded-lg border border-gray-300"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                ) : (
                  <span className="font-semibold text-[#263238]">{formData.gender}</span>
                )}
              </div>

              {/* Blood Group */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-gray-600">
                  <Droplet className="w-4 h-4 text-red-500" />
                  <span>Blood Group</span>
                </div>
                {isEditing ? (
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="text-right text-sm font-semibold bg-white px-2 py-1 rounded-lg border border-gray-300"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                ) : (
                  <span className="font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                    {formData.bloodGroup}
                  </span>
                )}
              </div>

              {/* Home Location */}
              <div className="py-2.5 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-gray-600">
                  <MapPin className="w-4 h-4 text-[#4B7358]" />
                  <span>Home Location</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.homeLocation}
                    onChange={(e) => setFormData({ ...formData, homeLocation: e.target.value })}
                    className="text-right text-sm font-semibold bg-white px-2 py-1 rounded-lg border border-gray-300"
                  />
                ) : (
                  <span className="font-semibold text-[#263238]">{formData.homeLocation}</span>
                )}
              </div>

              {/* Live Location Toggle */}
              <div className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span>Live Location</span>
                  </div>
                  <p className="text-[11px] text-gray-400 pl-7">Share with authorized caregiver</p>
                </div>
                <button
                  type="button"
                  onClick={toggleLiveLocation}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formData.liveLocationEnabled ? 'bg-[#3B664B]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.liveLocationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Date of Birth */}
              <div className="py-2.5 flex items-center justify-between last:pb-0">
                <div className="flex items-center space-x-3 text-gray-600">
                  <Calendar className="w-4 h-4 text-[#4B7358]" />
                  <span>Date of Birth</span>
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="text-right text-sm font-semibold bg-white px-2 py-1 rounded-lg border border-gray-300"
                  />
                ) : (
                  <span className="font-semibold text-[#263238]">{formData.dateOfBirth}</span>
                )}
              </div>

            </div>
          </div>

          {/* App Preferences */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t.appPreferences}
            </h4>

            <div className="bg-[#F8F7F0] rounded-2xl p-4 divide-y divide-gray-200/70 text-sm">
              {/* Language */}
              <div className="py-2.5 flex items-center justify-between first:pt-0">
                <div className="flex items-center space-x-3 text-gray-600">
                  <Globe className="w-4 h-4 text-[#4B7358]" />
                  <span>{t.language}</span>
                </div>
                <div className="flex space-x-1">
                  {(['en', 'kn', 'hi'] as Language[]).map((lng) => (
                    <button
                      key={lng}
                      onClick={() => onLanguageChange(lng)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        language === lng 
                          ? 'bg-[#3B664B] text-white shadow-xs' 
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {lng === 'en' ? 'English' : lng === 'kn' ? 'ಕನ್ನಡ' : 'हिन्दी'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div className="py-2.5 flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center space-x-3 text-gray-600">
                  <Bell className="w-4 h-4 text-[#4B7358]" />
                  <span>{t.notifications}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsOn(!notificationsOn)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    notificationsOn ? 'bg-[#3B664B]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationsOn ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Logout Option */}
              {onLogout && (
                <div className="pt-2.5 flex items-center justify-between">
                  <span className="text-xs text-gray-500">MindCare Account</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 bg-white flex items-center justify-between">
          {isEditing ? (
            <>
              <button
                onClick={() => { setFormData(patient); setIsEditing(false); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-[#3B664B] text-white text-sm font-semibold hover:bg-[#2D4F3B] shadow-xs"
              >
                Save Details
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 rounded-2xl bg-[#D8EAF5] text-[#1E4D6B] font-bold text-sm hover:bg-[#BEE0F5] transition-colors"
            >
              {t.editDetails}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
