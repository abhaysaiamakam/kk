import React, { useState, useEffect } from 'react';
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
  Plus,
  Trash2,
  Edit3,
  Check,
  UserPlus
} from 'lucide-react';
import { ContactItem } from '../types';
import { contactService } from '../services/contactService';

interface FamilyConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCall: (contact: ContactItem) => void;
  patientIdOrUid?: string;
  currentUserUid?: string;
  currentUserName?: string;
  currentUserRole?: 'patient' | 'caregiver' | null;
  activePatient?: any;
}

export const FamilyConnectModal: React.FC<FamilyConnectModalProps> = ({
  isOpen,
  onClose,
  onStartCall,
  patientIdOrUid,
  currentUserUid = '',
  currentUserName = 'User',
  currentUserRole = 'patient',
  activePatient
}) => {
  const [activeTab, setActiveTab] = useState<'contacts' | 'video' | 'meetings'>('contacts');
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [activeVideoContact, setActiveVideoContact] = useState<ContactItem | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isVideoCameraOff, setIsVideoCameraOff] = useState(false);
  const [videoTimer, setVideoTimer] = useState(0);

  // Add / Edit Contact Form State
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const targetKey = patientIdOrUid || activePatient?.id || activePatient?.uid || currentUserUid || '';

  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = contactService.subscribeToContacts(
      targetKey,
      (fetched) => {
        setContacts(fetched);
      },
      (err) => console.warn('[FamilyConnectModal] Contacts subscription notice:', err)
    );

    return () => unsubscribe();
  }, [isOpen, targetKey]);

  if (!isOpen) return null;

  const handlePhoneCall = (contact: ContactItem) => {
    onStartCall(contact);
    window.location.href = `tel:${contact.phone}`;
  };

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

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    try {
      if (editingContactId) {
        await contactService.updateContact(editingContactId, {
          name: newName.trim(),
          relationship: newRelationship.trim() || 'Family',
          phone: newPhone.trim()
        });
        setEditingContactId(null);
      } else {
        const newContactItem: ContactItem = {
          id: `contact-${Date.now()}`,
          patientId: activePatient?.id || targetKey,
          patientUid: activePatient?.uid || currentUserUid,
          caregiverUid: currentUserRole === 'caregiver' ? currentUserUid : undefined,
          name: newName.trim(),
          relationship: newRelationship.trim() || 'Family',
          phone: newPhone.trim(),
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
          isQuickCall: true,
          videoEnabled: true
        };
        await contactService.createContact(newContactItem);
      }
      setNewName('');
      setNewRelationship('');
      setNewPhone('');
      setShowAddContact(false);
    } catch (err) {
      alert('Could not save contact. Please try again.');
    }
  };

  const handleStartEdit = (contact: ContactItem) => {
    setEditingContactId(contact.id);
    setNewName(contact.name);
    setNewRelationship(contact.relationship || '');
    setNewPhone(contact.phone);
    setShowAddContact(true);
  };

  const handleDeleteContact = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await contactService.deleteContact(id);
      } catch (err) {
        alert('Could not delete contact.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
                Family Connect
              </h2>
              <p className="text-xs text-gray-500">
                Calls, video conversations &amp; family contacts (Firebase Real-Time)
              </p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setEditingContactId(null);
              setNewName('');
              setNewRelationship('');
              setNewPhone('');
              setShowAddContact(!showAddContact);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-[#3B664B] text-white text-xs font-bold hover:bg-[#2D4F3B] transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
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
                src={activeVideoContact.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
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
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Video Call Controls */}
            <div className="flex items-center space-x-6 pb-2">
              <button
                onClick={() => setIsVideoMuted(!isVideoMuted)}
                className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                  isVideoMuted ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {isVideoMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsVideoCameraOff(!isVideoCameraOff)}
                className={`p-3.5 rounded-full transition-colors cursor-pointer ${
                  isVideoCameraOff ? 'bg-red-500 text-white' : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                {isVideoCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>

              <button
                onClick={endVideoCall}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Family Connect Tabs */
          <div className="p-5 overflow-y-auto space-y-4">
            
            {/* Add / Edit Contact Form Modal Inline */}
            {showAddContact && (
              <form onSubmit={handleSaveContact} className="p-4 bg-[#F8F7F0] border border-gray-200 rounded-2xl space-y-3">
                <h3 className="text-sm font-bold text-[#263238]">
                  {editingContactId ? 'Edit Family Contact' : 'Add New Family Contact'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Full Name (e.g. Meera)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#3B664B]"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Daughter)"
                    value={newRelationship}
                    onChange={(e) => setNewRelationship(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#3B664B]"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (e.g. +91 98765 43210)"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="px-3 py-2 bg-white rounded-xl border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#3B664B]"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddContact(false);
                      setEditingContactId(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#3B664B] text-white text-xs font-bold hover:bg-[#2D4F3B] cursor-pointer"
                  >
                    {editingContactId ? 'Update Contact' : 'Save Contact'}
                  </button>
                </div>
              </form>
            )}

            {/* Tabs */}
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

            {/* Contacts & Video List */}
            {(activeTab === 'contacts' || activeTab === 'video') && (
              <div className="space-y-3">
                {contacts.length === 0 ? (
                  <div className="p-8 text-center bg-[#F8F7F0] rounded-2xl border border-gray-200 space-y-2">
                    <p className="text-sm font-semibold text-gray-600">No family contacts added yet.</p>
                    <p className="text-xs text-gray-400">Click &quot;Add Contact&quot; above to add family members and phone numbers.</p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between hover:border-[#A8C9B0] transition-colors"
                    >
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={contact.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-[#263238] font-['Poppins']">
                            {contact.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {contact.relationship} • <a href={`tel:${contact.phone}`} className="text-[#3B664B] font-bold hover:underline">{contact.phone}</a>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleStartEdit(contact)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                          title="Edit Contact"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`tel:${contact.phone}`}
                          onClick={() => handlePhoneCall(contact)}
                          className="p-2.5 rounded-xl bg-[#A8C9B0]/30 hover:bg-[#A8C9B0] text-[#2D4F3B] hover:text-white transition-colors cursor-pointer"
                          title="Open Native Phone Dialer"
                        >
                          <Phone className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => startVideoCall(contact)}
                          className="p-2.5 rounded-xl bg-[#D8EAF5] hover:bg-[#A0CDE8] text-[#1E4D6B] transition-colors cursor-pointer"
                          title="Start Video Call"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Family Meetings */}
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
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
