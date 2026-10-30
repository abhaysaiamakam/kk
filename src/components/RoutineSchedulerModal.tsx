import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Clock, 
  Pill, 
  Activity, 
  Coffee, 
  Volume2, 
  Check 
} from 'lucide-react';
import { TaskItem, PatientProfile } from '../types';

interface RoutineSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  activePatient: PatientProfile;
  onAddTask: (newTask: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
}

export const RoutineSchedulerModal: React.FC<RoutineSchedulerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  activePatient,
  onAddTask,
  onDeleteTask
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [category, setCategory] = useState<'medicine' | 'exercise' | 'calm' | 'meal' | 'activity'>('medicine');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [enableVoice, setEnableVoice] = useState(true);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        patientId: activePatient.id,
        title: title.trim(),
        time,
        category,
        dosage: dosage.trim() || undefined,
        notes: notes.trim() || undefined,
        voiceReminderText: enableVoice
          ? `Hi ${activePatient.name}, it's time for ${title}.`
          : '',
        completed: false,
        snoozed: false
      };
      onAddTask(newTask);
      setShowAddForm(false);
      setTitle('');
      setDosage('');
      setNotes('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
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
                Routine Scheduler
              </h2>
              <p className="text-xs text-gray-500">
                Managing schedule for {activePatient.name} ({activePatient.id})
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 rounded-xl bg-[#3B664B] hover:bg-[#2D4F3B] text-white text-xs font-semibold flex items-center space-x-1 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Routine</span>
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleSave} className="p-5 bg-[#EEF6FB] border-b border-gray-200 space-y-3">
            <h4 className="text-xs font-bold text-[#1E4D6B] uppercase tracking-wider">
              Create New Routine Task
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon BP Tablet"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Time</label>
                <input
                  type="text"
                  placeholder="e.g. 2:30 PM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                >
                  <option value="medicine">Medicine / Supplement</option>
                  <option value="exercise">Exercise / Walk</option>
                  <option value="calm">Calm / Breathing</option>
                  <option value="meal">Nutritious Meal</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Dosage / Details</label>
                <input
                  type="text"
                  placeholder="e.g. 1 capsule with water"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-600 block mb-1">Doctor / Caregiver Notes</label>
              <input
                type="text"
                placeholder="e.g. Take 30 mins after food"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableVoice}
                  onChange={(e) => setEnableVoice(e.target.checked)}
                  className="rounded text-[#3B664B] focus:ring-[#A8C9B0]"
                />
                <Volume2 className="w-3.5 h-3.5 text-[#3B664B]" />
                <span>Speak reminder aloud automatically</span>
              </label>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#3B664B] text-white hover:bg-[#2D4F3B]"
                >
                  Save Task
                </button>
              </div>
            </div>

          </form>
        )}

        {/* Existing Tasks List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-between hover:border-[#A8C9B0] transition-colors"
            >
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F8F7F0] flex items-center justify-center text-gray-700 shrink-0">
                  {task.category === 'medicine' ? (
                    <Pill className="w-5 h-5 text-red-500" />
                  ) : task.category === 'exercise' ? (
                    <Activity className="w-5 h-5 text-green-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {task.time}
                    </span>
                    <span className="text-xs font-bold text-[#263238]">
                      {task.title}
                    </span>
                  </div>
                  {task.dosage && (
                    <p className="text-xs text-[#4B7358] font-medium mt-0.5">
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

              <button
                onClick={() => onDeleteTask(task.id)}
                className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};
