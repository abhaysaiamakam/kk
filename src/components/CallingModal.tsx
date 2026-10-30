import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  UserPlus, 
  Check, 
  Clock, 
  Trash2, 
  Edit3, 
  Plus, 
  History 
} from 'lucide-react';
import { ContactItem, Language, CallLog, PatientProfile } from '../types';
import { translations } from '../data/translations';
import { callLogService } from '../services/callLogService';

interface CallingModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: ContactItem[];
  language: Language;
  onAddContact?: (newContact: ContactItem) => void;
  currentUserUid?: string;
  currentUserName?: string;
  currentUserRole?: 'patient' | 'caregiver' | null;
  activePatient?: PatientProfile;
}

export const CallingModal: React.FC<CallingModalProps> = ({
  isOpen,
  onClose,
  contacts,
  language,
  onAddContact,
  currentUserUid = '',
  currentUserName = 'User',
  currentUserRole = 'patient',
  activePatient
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'contacts' | 'history'>('quick');
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(contacts[0] || null);
  const [callState, setCallState] = useState<'idle' | 'dialing' | 'connected'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Call Logs real-time state from Firestore
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editNotesText, setEditNotesText] = useState('');
  const [showAddManualLog, setShowAddManualLog] = useState(false);
  const [manualContactName, setManualContactName] = useState('');
  const [manualCallType, setManualCallType] = useState<'incoming' | 'outgoing'>('outgoing');
  const [manualDuration, setManualDuration] = useState('02:15');
  const [manualNotes, setManualNotes] = useState('');

  const t = translations[language];

  // Subscribe to real-time shared call logs from Firestore
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = callLogService.subscribeToCallLogs(
      currentUserUid,
      activePatient?.id,
      (logs) => {
        setCallLogs(logs);
      },
      (err) => console.warn('[CallingModal] Call logs subscription notice:', err)
    );

    return () => unsubscribe();
  }, [isOpen, currentUserUid, activePatient?.id]);

  // Call timer simulation
  useEffect(() => {
    let interval: number;
    if (callState === 'connected') {
      interval = window.setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [callState]);

  if (!isOpen) return null;

  const startCall = (contact: ContactItem) => {
    setSelectedContact(contact);
    setCallState('dialing');
    setTimeout(() => {
      setCallState('connected');
    }, 2400);
  };

  const formatSeconds = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const endCall = async () => {
    // Save call log record to Firestore automatically
    if (selectedContact) {
      await callLogService.createCallLog({
        patientUid: activePatient?.uid,
        patientId: activePatient?.id || 'P-UNKNOWN',
        caregiverUid: currentUserRole === 'caregiver' ? currentUserUid : undefined,
        callerUid: currentUserUid || 'anonymous',
        callerName: currentUserName || (currentUserRole === 'caregiver' ? 'Caregiver' : 'Patient'),
        callerRole: currentUserRole || 'patient',
        receiverUid: selectedContact.id,
        receiverName: selectedContact.name,
        receiverRole: 'patient',
        callType: 'outgoing',
        callStatus: callDuration > 0 ? 'completed' : 'missed',
        callDate: new Date().toLocaleDateString(),
        callTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: formatSeconds(callDuration),
        notes: `Call with ${selectedContact.name}`,
        createdBy: currentUserUid || 'anonymous',
        createdByName: currentUserName || 'User',
        createdAt: new Date().toISOString()
      });
    }

    setCallState('idle');
    setCallDuration(0);
  };

  const handleAddNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newPhone.trim() && onAddContact) {
      const created: ContactItem = {
        id: `c-${Date.now()}`,
        name: newName,
        relationship: newRelation || 'Family',
        phone: newPhone,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        isQuickCall: true
      };
      onAddContact(created);
      setShowAddContact(false);
      setNewName('');
      setNewRelation('');
      setNewPhone('');
    }
  };

  const handleCreateManualLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualContactName.trim()) return;

    await callLogService.createCallLog({
      patientUid: activePatient?.uid,
      patientId: activePatient?.id || 'P-UNKNOWN',
      caregiverUid: currentUserRole === 'caregiver' ? currentUserUid : undefined,
      callerUid: currentUserUid || 'manual',
      callerName: manualCallType === 'outgoing' ? currentUserName : manualContactName,
      callerRole: currentUserRole || 'patient',
      receiverUid: 'manual',
      receiverName: manualCallType === 'outgoing' ? manualContactName : currentUserName,
      receiverRole: 'patient',
      callType: manualCallType,
      callStatus: 'completed',
      callDate: new Date().toLocaleDateString(),
      callTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      duration: manualDuration || '01:30',
      notes: manualNotes.trim() || `Manual entry for ${manualContactName}`,
      createdBy: currentUserUid || 'manual',
      createdByName: currentUserName,
      createdAt: new Date().toISOString()
    });

    setShowAddManualLog(false);
    setManualContactName('');
    setManualNotes('');
  };

  const handleSaveEditedNotes = async (logId: string) => {
    await callLogService.updateCallLog(logId, {
      notes: editNotesText,
      lastEditedBy: currentUserUid,
      lastEditedByName: currentUserName
    });
    setEditingLogId(null);
    setEditNotesText('');
  };

  const handleDeleteLog = async (logId: string) => {
    await callLogService.deleteCallLog(logId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header matching Image Screen 8 */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
              {t.calling}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddContact(!showAddContact)}
              className="p-2 rounded-xl bg-white border border-gray-200 text-[#2D4F3B] hover:bg-[#A8C9B0]/20 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
              title="Add Contact"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
          </div>
        </div>

        {/* Call Simulator Overlay */}
        {callState !== 'idle' && selectedContact ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-between bg-gradient-to-b from-[#EBF3EE] to-white min-h-[420px] text-center">
            
            {/* Caller Info */}
            <div className="pt-6">
              <div className="relative inline-block mb-4">
                <img
                  src={selectedContact.avatar}
                  alt={selectedContact.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg mx-auto"
                />
                {callState === 'dialing' && (
                  <div className="absolute inset-0 rounded-full border-4 border-[#3B664B] animate-ping opacity-60" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-[#263238] font-['Poppins']">
                {selectedContact.name}
              </h3>
              <p className="text-sm font-medium text-gray-500">
                {selectedContact.relationship} • {selectedContact.phone}
              </p>
              <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 shadow-xs">
                {callState === 'dialing' ? (
                  <span className="text-[#3B664B] animate-pulse">Calling family member...</span>
                ) : (
                  <span className="text-green-700">Connected • {formatSeconds(callDuration)}</span>
                )}
              </div>
            </div>

            {/* Audio Voice Simulation Waveform */}
            {callState === 'connected' && (
              <div className="my-6 flex items-center justify-center space-x-1.5 h-12">
                {[40, 70, 30, 90, 60, 80, 45, 95, 50, 65].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-[#3B664B] rounded-full animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.12}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
            )}

            {/* In-Call Controls */}
            <div className="w-full space-y-4">
              <div className="flex items-center justify-center space-x-6">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-4 rounded-full transition-colors cursor-pointer ${
                    isMuted ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </button>

                <button
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`p-4 rounded-full transition-colors cursor-pointer ${
                    isSpeakerOn ? 'bg-[#3B664B] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title="Speaker"
                >
                  <Volume2 className="w-6 h-6" />
                </button>

                <button
                  onClick={endCall}
                  className="p-5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
                  title="End Call"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Encrypted family call via MindCare voice network
              </p>
            </div>

          </div>
        ) : (
          /* Normal Contacts Selection & Call Logs View matching Screen 8 */
          <div className="p-5 flex-1 overflow-y-auto space-y-5">
            
            {/* Quick Call vs Contacts vs History Tabs matching Screen 8 */}
            <div className="grid grid-cols-3 p-1 bg-[#F8F7F0] rounded-2xl border border-gray-200">
              <button
                onClick={() => setActiveTab('quick')}
                className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'quick' 
                    ? 'bg-white text-[#263238] shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.quickCall}
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  activeTab === 'contacts' 
                    ? 'bg-white text-[#263238] shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.contacts}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                  activeTab === 'history' 
                    ? 'bg-white text-[#263238] shadow-xs' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Call Logs</span>
              </button>
            </div>

            {/* TAB 1 & 2: QUICK CALL / CONTACTS */}
            {(activeTab === 'quick' || activeTab === 'contacts') && (
              <>
                {/* Quick Call Top Row Icons */}
                <div className="flex items-center justify-around py-3 px-2 bg-[#F8F7F0]/60 rounded-2xl border border-gray-100">
                  {contacts.slice(0, 3).map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className="flex flex-col items-center group cursor-pointer"
                    >
                      <div className={`relative w-14 h-14 rounded-full overflow-hidden p-0.5 border-2 transition-all ${
                        selectedContact?.id === contact.id ? 'border-[#3B664B] scale-105 shadow-sm' : 'border-transparent'
                      }`}>
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <span className="text-xs font-bold text-[#263238] mt-1.5 truncate max-w-[70px]">
                        {contact.relationship}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {contact.phone.slice(-5)}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Full Contacts List */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Approved Family &amp; Care Team
                  </h4>

                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      onClick={() => setSelectedContact(contact)}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                        selectedContact?.id === contact.id
                          ? 'bg-[#EEF6FB] border-[#A0CDE8] shadow-xs'
                          : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/80'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-[#263238]">
                            {contact.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {contact.relationship} • {contact.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {selectedContact?.id === contact.id && (
                          <span className="w-6 h-6 rounded-full bg-[#3B664B] text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startCall(contact);
                          }}
                          className="p-2.5 rounded-xl bg-[#A8C9B0]/30 hover:bg-[#A8C9B0] text-[#2D4F3B] hover:text-white transition-colors cursor-pointer"
                          title="Direct Call"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* TAB 3: SHARED CALL LOGS WITH REAL-TIME FIRESTORE SYNC */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Shared Call History
                  </h4>
                  <button
                    onClick={() => setShowAddManualLog(!showAddManualLog)}
                    className="px-2.5 py-1 rounded-xl bg-[#EEF6FB] hover:bg-[#D8EAF5] text-[#1E4D6B] text-xs font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Call</span>
                  </button>
                </div>

                {/* Add Manual Log Form */}
                {showAddManualLog && (
                  <form onSubmit={handleCreateManualLog} className="p-4 bg-[#F8F7F0] rounded-2xl border border-gray-200 space-y-3">
                    <h5 className="text-xs font-bold text-[#263238]">Record Call Details</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={manualContactName}
                        onChange={(e) => setManualContactName(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                        required
                      />
                      <select
                        value={manualCallType}
                        onChange={(e) => setManualCallType(e.target.value as any)}
                        className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl font-medium"
                      >
                        <option value="outgoing">Outgoing Call</option>
                        <option value="incoming">Incoming Call</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Duration (e.g. 03:45)"
                        value={manualDuration}
                        onChange={(e) => setManualDuration(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                      />
                      <input
                        type="text"
                        placeholder="Notes / Summary"
                        value={manualNotes}
                        onChange={(e) => setManualNotes(e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddManualLog(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#3B664B] text-white hover:bg-[#2D4F3B]"
                      >
                        Save Call Log
                      </button>
                    </div>
                  </form>
                )}

                {/* Call Logs List */}
                {callLogs.length === 0 ? (
                  <div className="p-8 text-center bg-[#F8F7F0] rounded-2xl border border-gray-200/80 my-4">
                    <History className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-600">
                      No call history available yet.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Calls made or logged between caregiver and patient will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {callLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs space-y-2 hover:border-[#A8C9B0] transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                              log.callType === 'incoming' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              <Phone className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-[#263238]">
                                {log.callerName} ➔ {log.receiverName}
                              </h5>
                              <p className="text-[10px] text-gray-500">
                                {log.callDate} at {log.callTime} • Duration: {log.duration}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setEditingLogId(log.id);
                                setEditNotesText(log.notes || '');
                              }}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 cursor-pointer"
                              title="Edit Log Notes"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              title="Delete Call Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Edit Form */}
                        {editingLogId === log.id ? (
                          <div className="pt-2 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editNotesText}
                              onChange={(e) => setEditNotesText(e.target.value)}
                              placeholder="Updated notes..."
                              className="flex-1 text-xs p-1.5 bg-gray-50 border border-gray-300 rounded-lg"
                            />
                            <button
                              onClick={() => handleSaveEditedNotes(log.id)}
                              className="px-2.5 py-1 rounded-lg bg-[#3B664B] text-white text-xs font-bold"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingLogId(null)}
                              className="px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          log.notes && (
                            <p className="text-xs text-gray-600 bg-[#F8F7F0] p-2 rounded-xl font-medium">
                              &ldquo;{log.notes}&rdquo;
                              {log.lastEditedByName && (
                                <span className="text-[10px] text-gray-400 block mt-0.5">
                                  Last edited by {log.lastEditedByName}
                                </span>
                              )}
                            </p>
                          )
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add Contact Inline Form */}
            {showAddContact && (
              <form onSubmit={handleAddNewContact} className="p-4 bg-[#F8F7F0] rounded-2xl border border-gray-200 space-y-3">
                <h4 className="text-xs font-bold text-[#263238]">Add New Family Contact</h4>
                <input
                  type="text"
                  placeholder="Full Name (e.g. Brother Mohan)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Relation (e.g. Brother)"
                    value={newRelation}
                    onChange={(e) => setNewRelation(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                  <input
                    type="tel"
                    placeholder="Phone (+91...)"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddContact(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#3B664B] text-white hover:bg-[#2D4F3B]"
                  >
                    Save Contact
                  </button>
                </div>
              </form>
            )}

            {/* Big "Call Now" Button matching Screen 8 bottom */}
            {selectedContact && activeTab !== 'history' && (
              <div className="pt-2">
                <button
                  onClick={() => startCall(selectedContact)}
                  className="w-full py-4 rounded-2xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-[0.99] cursor-pointer"
                >
                  <Phone className="w-5 h-5" />
                  <span>{t.callNow} ({selectedContact.name})</span>
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
