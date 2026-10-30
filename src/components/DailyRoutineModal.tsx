import React from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Pill, 
  Activity, 
  Coffee, 
  Volume2, 
  Sparkles 
} from 'lucide-react';
import { TaskItem, Language } from '../types';
import { translations } from '../data/translations';
import { speakText, playChime } from '../utils/audio';

interface DailyRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  onToggleTask: (taskId: string) => void;
  onSnoozeTask: (taskId: string) => void;
  language: Language;
}

export const DailyRoutineModal: React.FC<DailyRoutineModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onToggleTask,
  onSnoozeTask,
  language
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / (tasks.length || 1)) * 100);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medicine':
        return <Pill className="w-5 h-5 text-red-500" />;
      case 'exercise':
        return <Activity className="w-5 h-5 text-green-600" />;
      case 'meal':
        return <Coffee className="w-5 h-5 text-amber-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const handleSpeakTask = (task: TaskItem) => {
    speakText(`${task.title} scheduled for ${task.time}. ${task.notes || ''}`);
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
              Daily Routine &amp; Meds
            </h2>
          </div>
          <span className="text-xs bg-[#A8C9B0]/30 text-[#2D4F3B] font-bold px-3 py-1 rounded-full">
            {completedCount}/{tasks.length} Completed
          </span>
        </div>

        {/* Today's Progress Bar */}
        <div className="p-5 bg-gradient-to-r from-[#F2F8F4] to-[#EEF6FB] border-b border-gray-100">
          <div className="flex items-center justify-between text-xs font-bold text-[#263238] mb-1.5">
            <span>Today&apos;s Wellness Progress</span>
            <span className="text-[#2D4F3B]">{progressPercent}%</span>
          </div>
          <div className="w-full bg-white h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="bg-[#3B664B] h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Routine Schedule List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3.5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-2xl border transition-all ${
                task.completed
                  ? 'bg-gray-50/70 border-gray-200 opacity-80'
                  : 'bg-white border-gray-200 shadow-xs hover:border-[#A8C9B0]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-2xl bg-[#F8F7F0] shrink-0 mt-0.5">
                    {getCategoryIcon(task.category)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#F8F7F0] text-gray-600 border border-gray-200">
                        {task.time}
                      </span>
                      {task.completed && (
                        <span className="text-xs font-bold text-green-700 flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Done</span>
                        </span>
                      )}
                    </div>
                    <h4 className={`text-base font-bold mt-1 font-['Poppins'] ${
                      task.completed ? 'line-through text-gray-400' : 'text-[#263238]'
                    }`}>
                      {task.title}
                    </h4>
                    {task.dosage && (
                      <p className="text-xs font-medium text-[#4B7358] mt-0.5">
                        {task.dosage}
                      </p>
                    )}
                    {task.notes && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Voice Reminder Audio Speaker Button */}
                <button
                  onClick={() => handleSpeakTask(task)}
                  className="p-2 rounded-xl text-gray-400 hover:text-[#2D4F3B] hover:bg-gray-100 transition-colors"
                  title="Speak task aloud"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => onSnoozeTask(task.id)}
                  className="text-xs text-gray-500 hover:text-gray-800 font-medium px-2 py-1"
                >
                  {t.snooze}
                </button>
                <button
                  onClick={() => {
                    onToggleTask(task.id);
                    if (!task.completed) playChime();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    task.completed
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-[#3B664B] hover:bg-[#2D4F3B] text-white shadow-xs'
                  }`}
                >
                  {task.completed ? 'Mark Incomplete' : t.markCompleted}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
