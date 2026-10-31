import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Mic, 
  Smile, 
  Clock, 
  Pill, 
  Check 
} from 'lucide-react';
import { AppNotification } from '../types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { firestore } from '../services/firebase';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'patient' | 'caregiver' | null;
  patientId: string;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  userRole,
  patientId
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'patient' | 'caregiver'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('keenkeep_read_notifications') || '[]'); } catch { return []; }
  });

  useEffect(() => {
    if (!isOpen || !patientId) return;
    const id = patientId.trim().toUpperCase();
    let tasks: AppNotification[] = [];
    let alerts: AppNotification[] = [];
    const publish = () => setNotifications([...tasks, ...alerts].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    const taskUnsubscribe = onSnapshot(query(collection(firestore, 'tasks'), where('patientId', '==', id)), (snapshot) => {
      tasks = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const done = data.completed === true || data.status === 'completed';
        const ts = data.updatedAt?.toDate?.() || data.createdAt?.toDate?.();
        return {
          id: `task-${docSnap.id}`,
          patientId: id,
          title: done ? 'Task completed' : 'Scheduled task',
          message: `${data.title || 'Care task'}${data.time ? ` • ${data.time}` : ''}`,
          type: done ? 'task_completed' : 'meeting',
          targetRole: done ? 'caregiver' : 'patient',
          urgency: 'gentle',
          timestamp: ts ? ts.toISOString() : (typeof data.updatedAt === 'string' ? data.updatedAt : typeof data.createdAt === 'string' ? data.createdAt : ''),
          timeAgo: '',
          read: readIds.includes(`task-${docSnap.id}`)
        } as AppNotification;
      });
      publish();
    }, (error) => console.error('[NotificationCenter] Task listener failed:', error));
    const alertUnsubscribe = onSnapshot(query(collection(firestore, 'alerts'), where('patientId', '==', id)), (snapshot) => {
      alerts = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const alertDate = data.timestamp?.toDate?.() || (typeof data.timestamp === 'string' ? new Date(data.timestamp) : null);
        return {
          id: `alert-${docSnap.id}`,
          patientId: id,
          title: data.status === 'resolved' ? 'SOS resolved' : 'Emergency SOS alert',
          message: `${data.patientName || 'Patient'}${data.location ? ` • ${data.location}` : ''}`,
          type: 'sos_alert',
          targetRole: 'caregiver',
          urgency: data.status === 'active' ? 'emergency' : 'gentle',
          timestamp: alertDate && !Number.isNaN(alertDate.getTime()) ? alertDate.toISOString() : '',
          timeAgo: '',
          read: readIds.includes(`alert-${docSnap.id}`),
          latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
          longitude: typeof data.longitude === 'number' ? data.longitude : undefined
        } as AppNotification;
      });
      publish();
    }, (error) => console.error('[NotificationCenter] SOS listener failed:', error));
    return () => { taskUnsubscribe(); alertUnsubscribe(); };
  }, [isOpen, patientId, readIds]);

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'patient') return n.targetRole === 'patient' || n.targetRole === 'both';
    if (activeFilter === 'caregiver') return n.targetRole === 'caregiver' || n.targetRole === 'both';
    return true;
  });

  const handleMarkAllRead = () => {
    const next = Array.from(new Set([...readIds, ...notifications.map((n) => n.id)]));
    setReadIds(next);
    localStorage.setItem('keenkeep_read_notifications', JSON.stringify(next));
  };

  const markRead = (id: string) => {
    const next = Array.from(new Set([...readIds, id]));
    setReadIds(next);
    localStorage.setItem('keenkeep_read_notifications', JSON.stringify(next));
  };

  const getNotifIcon = (type: string, urgency: string) => {
    if (urgency === 'emergency') {
      return (
        <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    }
    switch (type) {
      case 'task_completed':
        return (
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        );
      case 'missed_activity':
        return (
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        );
      case 'voice_note':
        return (
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5" />
          </div>
        );
      case 'mood_checkin':
        return (
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Smile className="w-5 h-5" />
          </div>
        );
      case 'refill_alert':
        return (
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <Pill className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        
        {/* Header matching Section 15 */}
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
                Notification Center
              </h2>
              <p className="text-xs text-gray-500">
                Gentle real-time updates &amp; alerts
              </p>
            </div>
          </div>

          <button
            onClick={handleMarkAllRead}
            className="text-xs text-[#3B664B] font-bold hover:underline flex items-center space-x-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        </div>

        {/* Filter Tabs matching Section 15: All, Patient, Caregiver */}
        <div className="px-6 pt-3 pb-2 bg-white border-b border-gray-100 flex space-x-2">
          {(['all', 'patient', 'caregiver'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                activeFilter === tab
                  ? 'bg-[#3B664B] text-white shadow-xs'
                  : 'bg-[#F8F7F0] text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {filteredNotifs.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              No task or emergency notifications for this patient yet.
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markRead(notif.id);
                  if (notif.latitude != null && notif.longitude != null) {
                    window.open(`https://www.google.com/maps/search/?api=1&query=${notif.latitude},${notif.longitude}`, '_blank');
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3.5 cursor-pointer hover:shadow-sm ${
                  notif.urgency === 'emergency'
                    ? 'bg-red-50/80 border-red-200 hover:bg-red-100'
                    : notif.read
                    ? 'bg-white border-gray-100 opacity-80'
                    : 'bg-[#F8F7F0] border-gray-200 shadow-xs'
                }`}
              >
                {getNotifIcon(notif.type, notif.urgency)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-[#263238] truncate font-['Poppins']">
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-medium shrink-0 ml-2">
                      {notif.timestamp ? new Date(notif.timestamp).toLocaleString() : 'Time unavailable'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
