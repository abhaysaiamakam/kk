import React, { useState } from 'react';
import { ArrowLeft, UserPlus, ShieldCheck } from 'lucide-react';
import { PatientProfile } from '../types';

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patient: PatientProfile) => void;
  existingCount: number;
}

export const AddPatientModal: React.FC<AddPatientModalProps> = ({
  isOpen,
  onClose,
  onAddPatient,
  existingCount
}) => {
  const generatedId = `P-1048${5 + existingCount}`;
  const [name, setName] = useState('');
  const [age, setAge] = useState('70');
  const [gender, setGender] = useState('Female');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [homeLocation, setHomeLocation] = useState('Bengaluru, Karnataka');
  const [dateOfBirth, setDateOfBirth] = useState('10 May 1954');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const newPatient: PatientProfile = {
        id: generatedId,
        name: name.trim(),
        age: parseInt(age) || 70,
        gender,
        bloodGroup,
        homeLocation,
        liveLocationEnabled: true,
        dateOfBirth,
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
        status: 'all_good',
        streakDays: 1,
        overallCompletion: 90,
        caregiverId: 'CG-101',
        adaptiveNotes: 'New patient enrolled. Observing morning activity patterns.'
      };
      onAddPatient(newPatient);
      onClose();
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
              Enroll New Patient
            </h2>
          </div>
          <span className="text-xs font-mono font-bold bg-[#A8C9B0]/30 text-[#2D4F3B] px-2.5 py-1 rounded-lg">
            {generatedId}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Full Patient Name</label>
            <input
              type="text"
              placeholder="e.g. Kamala Devi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm p-3 bg-[#F8F7F0] border border-gray-200 rounded-2xl text-[#263238]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Age</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full text-sm p-3 bg-[#F8F7F0] border border-gray-200 rounded-2xl text-[#263238]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Blood Group</label>
              <input
                type="text"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full text-sm p-3 bg-[#F8F7F0] border border-gray-200 rounded-2xl text-[#263238]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full text-sm p-3 bg-[#F8F7F0] border border-gray-200 rounded-2xl text-[#263238]"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Date of Birth</label>
              <input
                type="text"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full text-sm p-3 bg-[#F8F7F0] border border-gray-200 rounded-2xl text-[#263238]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Home Location (For SOS Escalation)</label>
            <input
              type="text"
              value={homeLocation}
              onChange={(e) => setHomeLocation(e.target.value)}
              className="w-full text-sm p-3 bg-[#F8F7F0] border border-gray-200 rounded-2xl text-[#263238]"
              required
            />
          </div>

          <div className="p-3 bg-green-50 rounded-2xl border border-green-200 flex items-center space-x-2 text-xs text-green-800">
            <ShieldCheck className="w-4 h-4 shrink-0 text-green-600" />
            <span>Unique ID {generatedId} will be generated for encrypted caregiver monitoring.</span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Complete Enrollment</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
