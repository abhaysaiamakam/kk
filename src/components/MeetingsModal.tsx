import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Plus, 
  User, 
  Check, 
  Video 
} from 'lucide-react';
import { RelativeMeeting, PatientProfile } from '../types';
import { INITIAL_MEETINGS } from '../data/initialData';

interface MeetingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePatient: PatientProfile;
}

export const MeetingsModal: React.FC<MeetingsModalProps> = ({
  isOpen,
  onClose,
  activePatient
}) => {
  const [meetings, setMeetings] = useState<RelativeMeeting[]>(INITIAL_MEETINGS);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [date, setDate] = useState('Tomorrow');
  const [time, setTime] = useState('4:00 PM');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleAddMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      const created: RelativeMeeting = {
        id: `meet-${Date.now()}`,
        patientId: activePatient.id,
        relativeName: name,
        relationship: relationship || 'Family',
        date,
        time,
        note: note || 'Family connection visit',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80'
      };
      setMeetings([...meetings, created]);
      setShowScheduleForm(false);
      setName('');
      setRelationship('');
      setNote('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
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
              Family Meetings &amp; Visits
            </h2>
          </div>
          <button
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="px-3.5 py-1.5 rounded-xl bg-[#3B664B] text-white text-xs font-semibold hover:bg-[#2D4F3B] flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule</span>
          </button>
        </div>

        {/* Schedule Form */}
        {showScheduleForm && (
          <form onSubmit={handleAddMeeting} className="p-5 bg-[#FEF9ED] border-b border-amber-200 space-y-3">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Schedule Relative Meeting
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Relative or Doctor Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                required
              />
              <input
                type="text"
                placeholder="Relation (e.g. Daughter)"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Date (e.g. Friday, 7 Nov)"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                required
              />
              <input
                type="text"
                placeholder="Time (e.g. 5:00 PM)"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                required
              />
            </div>
            <input
              type="text"
              placeholder="Topic or note (e.g. Afternoon tea &amp; photo album review)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
            />
            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowScheduleForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#3B664B] text-white hover:bg-[#2D4F3B]"
              >
                Confirm Schedule
              </button>
            </div>
          </form>
        )}

        {/* Meetings List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
          {meetings.map((meet) => (
            <div
              key={meet.id}
              className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between"
            >
              <div className="flex items-center space-x-3.5">
                <img
                  src={meet.avatar}
                  alt={meet.relativeName}
                  className="w-12 h-12 rounded-full object-cover border border-gray-200"
                />
                <div>
                  <h4 className="font-bold text-sm text-[#263238] font-['Poppins']">
                    {meet.relativeName}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-[#3B664B]" />
                      <span>{meet.date}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span>{meet.time}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {meet.note}
                  </p>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-[#A8C9B0]/25 text-[#2D4F3B] text-xs font-bold flex items-center space-x-1 shrink-0">
                <Check className="w-3.5 h-3.5" />
                <span>Confirmed</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
