import React, { useState } from 'react';
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
import { db } from '../services/db';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: 'patient' | 'caregiver' | null;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  userRole
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'patient' | 'caregiver'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>(() => db.getNotifications());

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'patient') return n.targetRole === 'patient' || n.targetRole === 'both';
    if (activeFilter === 'caregiver') return n.targetRole === 'caregiver' || n.targetRole === 'both';
    return true;
  });

  const handleMarkAllRead = () => {
    notifications.forEach((n) => db.markNotificationRead(n.id));
    setNotifications(db.getNotifications());
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
              No new notifications
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-start space-x-3.5 ${
                  notif.urgency === 'emergency'
                    ? 'bg-red-50/80 border-red-200'
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
                      {notif.timeAgo}
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
