import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Calendar, 
  FileText, 
  User 
} from 'lucide-react';
import { CallLogItem, UserRole } from '../types';
import { callLogService } from '../services/callLogService';

interface CallLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientUidOrId?: string;
  caregiverUid?: string;
  currentUserId?: string;
  currentUserName?: string;
  userRole?: UserRole;
}

export const CallLogsModal: React.FC<CallLogsModalProps> = ({
  isOpen,
  onClose,
  patientUidOrId,
  caregiverUid,
  currentUserId,
  currentUserName,
  userRole
}) => {
  const [callLogs, setCallLogs] = useState<CallLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  // New call log form state
  const [callerName, setCallerName] = useState<string>(currentUserName || (userRole === 'caregiver' ? 'Caregiver' : 'Patient'));
  const [receiverName, setReceiverName] = useState<string>('');
  const [callType, setCallType] = useState<'incoming' | 'outgoing'>('outgoing');
  const [callStatus, setCallStatus] = useState<'completed' | 'missed' | 'declined'>('completed');
  const [callDate, setCallDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [callTime, setCallTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [duration, setDuration] = useState<string>('03:45');
  const [notes, setNotes] = useState<string>('');

  // Edit call log form state
  const [editNotes, setEditNotes] = useState<string>('');
  const [editDuration, setEditDuration] = useState<string>('');
  const [editStatus, setEditStatus] = useState<'completed' | 'missed' | 'declined'>('completed');

  // Real-time Firestore subscription
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const unsubscribe = callLogService.subscribeToCallLogs(
      patientUidOrId,
      caregiverUid,
      (logs) => {
        setCallLogs(logs);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Call logs listener notice:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isOpen, patientUidOrId, caregiverUid]);

  if (!isOpen) return null;

  const handleCreateCallLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callerName.trim() || !receiverName.trim()) {
      alert('Please fill in both caller and receiver names.');
      return;
    }

    try {
      await callLogService.createCallLog({
        callerUid: currentUserId || `user-${Date.now()}`,
        callerName: callerName.trim(),
        receiverName: receiverName.trim(),
        patientUid: patientUidOrId,
        caregiverUid: caregiverUid,
        callType,
        callStatus,
        callDate,
        callTime,
        duration: duration.trim() || '00:00',
        notes: notes.trim(),
        createdBy: currentUserId || 'system'
      });

      setShowAddForm(false);
      setReceiverName('');
      setNotes('');
    } catch (err) {
      alert('Failed to save call log to Firestore. Please check your network or permissions.');
    }
  };

  const handleStartEditing = (log: CallLogItem) => {
    setEditingLogId(log.id);
    setEditNotes(log.notes || '');
    setEditDuration(log.duration || '00:00');
    setEditStatus(log.callStatus || 'completed');
  };

  const handleSaveEdit = async (logId: string) => {
    try {
      await callLogService.updateCallLog(
        logId,
        {
          notes: editNotes.trim(),
          duration: editDuration.trim(),
          callStatus: editStatus
        },
        currentUserId || 'unknown-editor',
        currentUserName || 'User'
      );
      setEditingLogId(null);
    } catch (err) {
      alert('Could not update call log. Please try again.');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (confirm('Are you sure you want to delete this call record?')) {
      try {
        await callLogService.deleteCallLog(logId);
      } catch (err) {
        alert('Could not delete call record.');
      }
    }
  };

  const getCallTypeIcon = (type: 'incoming' | 'outgoing', status: 'completed' | 'missed' | 'declined') => {
    if (status === 'missed' || status === 'declined') {
      return <PhoneMissed className="w-4 h-4 text-red-500" />;
    }
    return type === 'incoming' ? (
      <PhoneIncoming className="w-4 h-4 text-[#3B664B]" />
    ) : (
      <PhoneOutgoing className="w-4 h-4 text-blue-600" />
    );
  };

  const getStatusBadge = (status: 'completed' | 'missed' | 'declined') => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">Completed</span>;
      case 'missed':
        return <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold border border-red-200">Missed Call</span>;
      case 'declined':
        return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200">Declined</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
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
              <h2 className="text-xl font-bold text-[#263238] font-['Poppins'] flex items-center space-x-2">
                <Phone className="w-5 h-5 text-[#3B664B]" />
                <span>Shared Call Logs &amp; History</span>
              </h2>
              <p className="text-xs text-gray-500">
                Real-time synchronized call records stored in Firebase Firestore
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 rounded-xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white text-xs font-semibold flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Log Manual Call'}</span>
          </button>
        </div>

        {/* Create Manual Call Form */}
        {showAddForm && (
          <form onSubmit={handleCreateCallLog} className="p-5 bg-[#EEF6FB] border-b border-gray-200 space-y-3">
            <h4 className="text-xs font-bold text-[#1E4D6B] uppercase tracking-wider">
              Log New Call Record
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Caller Name</label>
                <input
                  type="text"
                  value={callerName}
                  onChange={(e) => setCallerName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  placeholder="e.g. Daughter Meera"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Receiver Name</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  placeholder="e.g. Aarav Sharma"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Call Type</label>
                <select
                  value={callType}
                  onChange={(e) => setCallType(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                >
                  <option value="outgoing">Outgoing</option>
                  <option value="incoming">Incoming</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Status</label>
                <select
                  value={callStatus}
                  onChange={(e) => setCallStatus(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                >
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  placeholder="e.g. 04:15"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Date</label>
                <input
                  type="date"
                  value={callDate}
                  onChange={(e) => setCallDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Time</label>
                <input
                  type="text"
                  value={callTime}
                  onChange={(e) => setCallTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  placeholder="e.g. 02:30 PM"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Call Notes / Summary</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                placeholder="e.g. Discussed afternoon medication dosage and weekend visit."
              />
            </div>

            <div className="flex justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#3B664B] text-white hover:bg-[#2D4F3B]"
              >
                Save Call Record
              </button>
            </div>
          </form>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-gray-500 font-medium animate-pulse">
              Loading real-time call logs from Firestore...
            </div>
          ) : callLogs.length === 0 ? (
            /* Clean Empty State as required */
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Phone className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-[#263238]">No call history available yet.</p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Call records between caregiver, patient, and family contacts will automatically appear here.
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 rounded-xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white text-xs font-bold cursor-pointer inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Call Entry</span>
              </button>
            </div>
          ) : (
            callLogs.map((log) => {
              const isEditing = editingLogId === log.id;

              return (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs hover:border-[#A8C9B0] transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#F8F7F0] flex items-center justify-center shrink-0">
                        {getCallTypeIcon(log.callType, log.callStatus)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-[#263238] font-['Poppins']">
                            {log.callerName} ➔ {log.receiverName}
                          </h4>
                          {getStatusBadge(log.callStatus)}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-gray-500 mt-0.5">
                          <span className="capitalize font-semibold">{log.callType} call</span>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{log.duration}</span>
                          </span>
                          <span>•</span>
                          <span>{log.callDate} at {log.callTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      {!isEditing && (
                        <>
                          <button
                            onClick={() => handleStartEditing(log)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="Edit notes & duration"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete call record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Notes / Edit view */}
                  {isEditing ? (
                    <div className="p-3 bg-[#EEF6FB] rounded-xl border border-gray-200 space-y-2 mt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 block">Call Status</label>
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as any)}
                            className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg"
                          >
                            <option value="completed">Completed</option>
                            <option value="missed">Missed</option>
                            <option value="declined">Declined</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-600 block">Duration</label>
                          <input
                            type="text"
                            value={editDuration}
                            onChange={(e) => setEditDuration(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-600 block">Notes</label>
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          className="w-full text-xs p-2 bg-white border border-gray-300 rounded-lg"
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingLogId(null)}
                          className="px-3 py-1 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(log.id)}
                          className="px-3.5 py-1 rounded-lg text-xs font-bold bg-[#3B664B] text-white hover:bg-[#2D4F3B]"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    log.notes && (
                      <div className="p-2.5 bg-[#F8F7F0] rounded-xl text-xs text-gray-700 flex items-start space-x-2">
                        <FileText className="w-3.5 h-3.5 text-[#3B664B] shrink-0 mt-0.5" />
                        <span className="leading-relaxed">&ldquo;{log.notes}&rdquo;</span>
                      </div>
                    )
                  )}

                  {/* Metadata */}
                  {log.lastEditedByName && (
                    <p className="text-[10px] text-gray-400 italic text-right">
                      Last edited by {log.lastEditedByName}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
