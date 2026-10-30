import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  Calendar, 
  Clock, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Plus 
} from 'lucide-react';
import { ContactItem, RelativeMeeting } from '../types';
import { db } from '../services/db';
import { INITIAL_CONTACTS } from '../data/initialData';

interface FamilyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCall: (contact: ContactItem) => void;
}

export const FamilyConnectModal: React.FC<FamilyConnectModalProps> = ({
  isOpen,
  onClose,
  onStartCall
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'video' | 'meetings'>('contacts');
  const [activeVideoContact, setActiveVideoContact] = useState<ContactItem | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isVideoCameraOff, setIsVideoCameraOff] = useState(false);
  const [videoTimer, setVideoTimer] = useState(0);

  if (!isOpen) return null;

  const contacts = INITIAL_CONTACTS;

  const startVideoCall = (contact: ContactItem) => {
    setActiveVideoContact(contact);
    setVideoTimer(0);
    const interval = window.setInterval(() => {
      setVideoTimer((prev) => prev + 1);
    }, 1000);
    (window as any)._videoInterval = interval;
  };

  const endVideoCall = () => {
    clearInterval((window as any)._videoInterval);
    setActiveVideoContact(null);
    setVideoTimer(0);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header matching Section 12 */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
                Family Connect
              </h2>
              <p className="text-xs text-gray-500">
                Calls, video conversations &amp; scheduled visits
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#A8C9B0]/30 text-[#2D4F3B] font-bold">
            Family Network
          </span>
        </div>

        {/* Video Call Simulation Active Screen */}
        {activeVideoContact ? (
          <div className="p-6 flex-1 bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-between min-h-[380px] rounded-b-3xl">
            <div className="text-center pt-2">
              <h3 className="text-xl font-bold font-['Poppins']">
                {activeVideoContact.name}
              </h3>
              <p className="text-xs text-green-400 font-semibold mt-0.5">
                Encrypted Video Call • {formatTimer(videoTimer)}
              </p>
            </div>

            {/* Simulated Two-Way Video Windows */}
            <div className="relative w-full max-w-sm h-52 bg-gray-700 rounded-3xl overflow-hidden shadow-2xl border border-gray-600 flex items-center justify-center">
              <img
                src={activeVideoContact.avatar}
                alt={activeVideoContact.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold">
                {activeVideoContact.relationship}
              </div>

              {/* Self Preview Inset */}
              <div className="absolute bottom-3 right-3 w-20 h-28 bg-gray-900 rounded-xl overflow-hidden border-2 border-white/80 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80"
                  alt="Aarav"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Video Call Controls */}
            <div className="flex items-center space-x-6 pb-2">
              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`p-3.5 rounded-full transition-colors ${
                  isVideoMuted ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {isVideoMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsVideoCameraOff(!isVideoCameraOff)}
                className={`p-3.5 rounded-full transition-colors ${
                  isVideoCameraOff ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {isVideoCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                onClick={endVideoCall}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-transform"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Family Connect Tabs */
          <div className="p-5 overflow-y-auto space-y-4">
            
            {/* Tabs matching Section 12: Contacts, Video Calls, Meetings */}
            <div className="grid grid-cols-3 p-1 bg-[#F8F7F0] rounded-2xl border border-gray-200">
              {(['contacts', 'video', 'meetings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-white text-[#263238] shadow-xs'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab === 'video' ? 'Video Calls' : tab}
                </button>
              ))}
            </div>

            {/* Contacts & Video List matching Section 12 */}
            {(activeTab === 'contacts' || activeTab === 'video') && (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between hover:border-[#A8C9B0] transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <img
                        src={contact.avatar}
                        alt={contact.name}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-[#263238] font-['Poppins']">
                          {contact.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {contact.phone}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onStartCall(contact)}
                        className="p-2.5 rounded-xl bg-[#A8C9B0]/30 hover:bg-[#A8C9B0] text-[#2D4F3B] hover:text-white transition-colors"
                        title="Voice Call"
                      >
                        <Phone className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => startVideoCall(contact)}
                        className="p-2.5 rounded-xl bg-[#D8EAF5] hover:bg-[#A0CDE8] text-[#1E4D6B] transition-colors"
                        title="Start Video Call"
                      >
                        <Video className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Family Meetings matching Section 12 bottom */}
            {activeTab === 'meetings' && (
              <div className="space-y-3">
                <div className="p-4 bg-gradient-to-r from-[#FEF9ED] to-white border border-amber-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-amber-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#263238] font-['Poppins']">
                        Family Sunday Gathering
                      </h4>
                      <p className="text-xs text-gray-500">
                        Every Sunday • 5:00 PM • Home visit with sweets
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-amber-200/70 text-amber-900 rounded-xl">
                    Weekly
                  </span>
                </div>

                <div className="p-4 bg-white border border-gray-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#263238] font-['Poppins']">
                        Doctor Follow-up Review
                      </h4>
                      <p className="text-xs text-gray-500">
                        Tuesday, 4 Nov • 11:30 AM • Dr. Suresh
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-xl">
                    Confirmed
                  </span>
                </div>
              </div>
            )}

            {/* Scheduled Family Meeting Banner matching Section 12 bottom */}
            <div className="p-4 bg-[#EEF6FB] border border-[#A0CDE8] rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#D8EAF5] flex items-center justify-center text-[#1E4D6B]">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-[#1E4D6B]">Family Meeting</h5>
                  <p className="text-[11px] text-gray-600">Every Sunday • 5:00 PM</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('meetings')}
                className="px-3 py-1.5 rounded-xl bg-[#1E4D6B] text-white text-xs font-bold hover:bg-[#14354b] transition-colors"
              >
                Schedule
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
