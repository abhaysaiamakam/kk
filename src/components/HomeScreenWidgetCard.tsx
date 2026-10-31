import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Calendar, Clock, CheckCircle2, Smartphone, ShieldCheck, RefreshCw } from 'lucide-react';
import { TaskItem, Language } from '../types';
import { notificationService } from '../services/notificationService';
import { translations } from '../data/translations';

interface HomeScreenWidgetCardProps {
  tasks: TaskItem[];
  language: Language;
}

export const HomeScreenWidgetCard: React.FC<HomeScreenWidgetCardProps> = ({ tasks, language }) => {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    notificationService.getPermissionStatus()
  );
  const [showRebootInfo, setShowRebootInfo] = useState(false);
  const t = translations[language];

  const pendingTasks = tasks.filter(t => t.status === 'pending').slice(0, 3);

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission();
    setPermissionStatus(notificationService.getPermissionStatus());
    if (granted) {
      notificationService.showLocalNotification(
        'KeenKeep Reminders Active',
        'Background task alarms & WorkManager notifications are now enabled.'
      );
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-[#F8F7F0] rounded-3xl p-5 border border-[#A8C9B0]/40 shadow-sm relative overflow-hidden">
      
      {/* Widget Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2D4F3B] text-white flex items-center justify-center shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-base text-[#263238] font-['Poppins']">
              Home Screen Task Widget
            </h3>
            <p className="text-xs text-gray-500">
              Android Background Alarms & WorkManager
            </p>
          </div>
        </div>
        
        {/* Notification Permission Toggle */}
        <button
          onClick={handleEnableNotifications}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer ${
            permissionStatus === 'granted'
              ? 'bg-[#A8C9B0]/30 text-[#2D4F3B] border border-[#A8C9B0]/50'
              : 'bg-[#F16F6F]/10 text-red-700 hover:bg-[#F16F6F]/20 border border-red-200'
          }`}
        >
          {permissionStatus === 'granted' ? (
            <>
              <Bell className="w-3.5 h-3.5 text-[#2D4F3B]" />
              <span>Alarms Active</span>
            </>
          ) : (
            <>
              <BellOff className="w-3.5 h-3.5 text-red-600" />
              <span>Enable Alarms</span>
            </>
          )}
        </button>
      </div>

      {/* Upcoming Tasks Widget Preview */}
      <div className="space-y-2.5 mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
          <span>Upcoming Schedule ({pendingTasks.length})</span>
          <span className="text-[#2D4F3B] flex items-center space-x-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Auto-Reschedule on Reboot</span>
          </span>
        </div>

        {pendingTasks.length > 0 ? (
          pendingTasks.map((task) => (
            <div 
              key={task.id}
              className="p-3 bg-white rounded-2xl border border-gray-100 shadow-2xs flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-2.5 h-2.5 rounded-full bg-[#A8C9B0] shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-[#263238]">{task.title}</h4>
                  <p className="text-[11px] text-gray-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{task.time} • {task.patientName || 'Patient'}</span>
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#1E4D6B] bg-[#D8EAF5] px-2 py-0.5 rounded-full">
                Pending
              </span>
            </div>
          ))
        ) : (
          <div className="p-4 text-center bg-white/60 rounded-2xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-500 font-medium">No pending tasks for today. All routines completed!</p>
          </div>
        )}
      </div>

      {/* Reboot & Power Note */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
        <span className="flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#2D4F3B]" />
          <span>WorkManager & AlarmManager background sync</span>
        </span>
        <button
          onClick={() => setShowRebootInfo(!showRebootInfo)}
          className="text-[#2D4F3B] font-semibold hover:underline cursor-pointer"
        >
          {showRebootInfo ? 'Hide Info' : 'Power/Reboot Policy'}
        </button>
      </div>

      {showRebootInfo && (
        <div className="mt-3 p-3 bg-[#A8C9B0]/15 rounded-2xl text-[11px] text-[#2D4F3B] space-y-1 animate-in fade-in">
          <p className="font-semibold">💡 Background Notification Policy:</p>
          <p>• Reminders run in the background via WorkManager/AlarmManager even when the app is closed.</p>
          <p>• Alarms automatically reschedule themselves after a device reboot.</p>
          <p className="font-medium text-red-700">⚠️ Note: No app or service can send notifications while the phone is fully powered off.</p>
        </div>
      )}

    </div>
  );
};
