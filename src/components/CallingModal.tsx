import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  UserPlus, 
  Check, 
  Trash2, 
  Edit3, 
  Plus, 
  History,
  PhoneCall
} from 'lucide-react';
import { ContactItem, Language, CallLog, PatientProfile } from '../types';
import { translations } from '../data/translations';
import { callLogService } from '../services/callLogService';
import { contactService } from '../services/contactService';

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
  contacts: initialContacts,
  language,
  onAddContact,
  currentUserUid = '',
  currentUserName = 'User',
  currentUserRole = 'patient',
  activePatient
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'contacts' | 'history'>('quick');
  const [contactsList, setContactsList] = useState<ContactItem[]>(initialContacts);
  const [selectedContact, setSelectedContact] = useState<ContactItem | null>(null);

  // Add/Edit Contact Form State
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
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

  // Subscribe to real-time contacts from Firestore
  useEffect(() => {
    if (!isOpen) return;

    const targetKey = activePatient?.id || activePatient?.uid || currentUserUid;
    const unsubscribeContacts = contactService.subscribeToContacts(
      targetKey,
      (fetched) => {
        if (fetched.length > 0) {
          setContactsList(fetched);
          if (!selectedContact && fetched[0]) {
            setSelectedContact(fetched[0]);
          }
        } else {
          setContactsList(initialContacts);
          if (!selectedContact && initialContacts[0]) {
            setSelectedContact(initialContacts[0]);
          }
        }
      },
      (err) => console.warn('[CallingModal] Contacts subscription notice:', err)
    );

    const unsubscribeLogs = callLogService.subscribeToCallLogs(
      currentUserUid,
      activePatient?.id,
      (logs) => {
        setCallLogs(logs);
      },
      (err) => console.warn('[CallingModal] Call logs subscription notice:', err)
    );

    return () => {
      unsubscribeContacts();
      unsubscribeLogs();
    };
  }, [isOpen, currentUserUid, activePatient?.id]);

  if (!isOpen) return null;

  const handleStartCall = async (contact: ContactItem) => {
    setSelectedContact(contact);

    // 1. Log outgoing call to Firestore
    try {
      await callLogService.createCallLog({
        patientUid: activePatient?.uid,
        patientId: activePatient?.id || 'P-UNKNOWN',
        caregiverUid: currentUserRole === 'caregiver' ? currentUserUid : undefined,
        callerUid: currentUserUid || 'anonymous',
        callerName: currentUserName || (currentUserRole === 'caregiver' ? 'Caregiver' : 'Patient'),
        callerRole: currentUserRole || 'patient',
        receiverUid: contact.id,
        receiverName: contact.name,
        receiverRole: 'patient',
        callType: 'outgoing',
        callStatus: 'completed',
        callDate: new Date().toLocaleDateString(),
        callTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: '01:30',
        notes: `Native dialer call to ${contact.name} (${contact.phone})`,
        createdBy: currentUserUid || 'anonymous',
        createdByName: currentUserName || 'User',
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not log call:', e);
    }

    // 2. Open device native phone dialer using tel: link
    window.location.href = `tel:${contact.phone}`;
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    if (editingContactId) {
      await contactService.updateContact(editingContactId, {
        name: newName.trim(),
        relationship: newRelation.trim() || 'Family',
        phone: newPhone.trim()
      });
      setEditingContactId(null);
    } else {
      const newContactItem: ContactItem = {
        id: `contact-${Date.now()}`,
        patientId: activePatient?.id,
        patientUid: activePatient?.uid,
        caregiverUid: currentUserRole === 'caregiver' ? currentUserUid : undefined,
        name: newName.trim(),
        relationship: newRelation.trim() || 'Family',
        phone: newPhone.trim(),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
        isQuickCall: true,
        videoEnabled: true
      };
      await contactService.createContact(newContactItem);
      if (onAddContact) onAddContact(newContactItem);
    }

    setShowAddContact(false);
    setNewName('');
    setNewRelation('');
    setNewPhone('');
  };

  const handleEditContactClick = (contact: ContactItem) => {
    setEditingContactId(contact.id);
    setNewName(contact.name);
    setNewRelation(contact.relationship || contact.relation || '');
    setNewPhone(contact.phone);
    setShowAddContact(true);
  };

  const handleDeleteContact = async (contactId: string) => {
    await contactService.deleteContact(contactId);
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
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8F7F0]">
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-700 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-[#263238] font-['Poppins']">
              {t.calling} &amp; Family Contacts
            </h2>
          </div>
          <button
            onClick={() => {
              setEditingContactId(null);
              setNewName('');
              setNewRelation('');
              setNewPhone('');
              setShowAddContact(!showAddContact);
            }}
            className="p-2 rounded-xl bg-white border border-gray-200 text-[#2D4F3B] hover:bg-[#A8C9B0]/20 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            title="Add Contact"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Contact</span>
          </button>
        </div>

        {/* Normal Contacts Selection & Call Logs View */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          
          {/* Quick Call vs Contacts vs History Tabs */}
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
              {t.contacts} ({contactsList.length})
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
              {contactsList.length > 0 && (
                <div className="flex items-center justify-around py-3 px-2 bg-[#F8F7F0]/60 rounded-2xl border border-gray-100">
                  {contactsList.slice(0, 3).map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleStartCall(contact)}
                      className="flex flex-col items-center group cursor-pointer"
                      title={`Call ${contact.name}`}
                    >
                      <div className="relative w-14 h-14 rounded-full overflow-hidden p-0.5 border-2 border-[#3B664B] shadow-sm group-hover:scale-105 transition-transform">
                        <img
                          src={contact.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                          alt={contact.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <span className="text-xs font-bold text-[#263238] mt-1.5 truncate max-w-[70px]">
                        {contact.relationship || contact.name}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center space-x-0.5">
                        <PhoneCall className="w-2.5 h-2.5" />
                        <span>Dial</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Full Contacts List with Edit & Delete */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Family &amp; Care Team Contacts (Firebase Real-Time)
                  </h4>
                </div>

                {contactsList.length === 0 ? (
                  <div className="p-8 text-center bg-[#F8F7F0] rounded-2xl border border-gray-200">
                    <p className="text-sm font-semibold text-gray-600">No family contacts added yet.</p>
                    <p className="text-xs text-gray-400 mt-1">Click &ldquo;Add Contact&rdquo; above to add real names, relationships, and phone numbers.</p>
                  </div>
                ) : (
                  contactsList.map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between hover:border-[#A8C9B0] transition-colors"
                    >
                      <div className="flex items-center space-x-3.5">
                        <img
                          src={contact.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200"
                        />
                        <div>
                          <h4 className="font-bold text-sm text-[#263238]">
                            {contact.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {contact.relationship} • <a href={`tel:${contact.phone}`} className="text-[#3B664B] font-bold hover:underline">{contact.phone}</a>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleEditContactClick(contact)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                          title="Edit Contact"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteContact(contact.id)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 cursor-pointer"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`tel:${contact.phone}`}
                          onClick={() => handleStartCall(contact)}
                          className="p-2.5 rounded-xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white transition-colors flex items-center space-x-1 cursor-pointer shadow-xs"
                          title="Open Native Phone Dialer"
                        >
                          <Phone className="w-4 h-4" />
                          <span className="text-xs font-bold hidden sm:inline">Call</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* TAB 3: SHARED CALL LOGS */}
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

          {/* Add / Edit Contact Form Modal or Inline Form */}
          {showAddContact && (
            <form onSubmit={handleSaveContact} className="p-4 bg-[#F8F7F0] rounded-2xl border border-gray-200 space-y-3">
              <h4 className="text-xs font-bold text-[#263238]">
                {editingContactId ? 'Edit Family Contact' : 'Add New Family Contact'}
              </h4>
              <input
                type="text"
                placeholder="Full Name (e.g. Daughter Meera)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                required
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Relation (e.g. Daughter)"
                  value={newRelation}
                  onChange={(e) => setNewRelation(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
                <input
                  type="tel"
                  placeholder="Phone (+91 98765...)"
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
                  {editingContactId ? 'Update Contact' : 'Save Contact'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
