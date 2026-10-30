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
  Check, 
  AlertCircle, 
  Calendar 
} from 'lucide-react';
import { TaskItem, PatientProfile } from '../types';
import { taskService } from '../services/taskService';

interface RoutineSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskItem[];
  activePatient: PatientProfile;
  onAddTask: (newTask: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  caregiverUid?: string;
  caregiverName?: string;
}

export const RoutineSchedulerModal: React.FC<RoutineSchedulerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  activePatient,
  onAddTask,
  onDeleteTask,
  caregiverUid,
  caregiverName
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('10:00 AM');
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [category, setCategory] = useState<'medicine' | 'exercise' | 'calm' | 'meal' | 'activity'>('medicine');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [enableVoice, setEnableVoice] = useState(true);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const taskId = `task-${Date.now()}`;
      const newTask: TaskItem = {
        id: taskId,
        patientId: activePatient.id,
        patientUid: activePatient.uid,
        caregiverUid: caregiverUid,
        assignedBy: caregiverUid,
        assignedByName: caregiverName,
        title: title.trim(),
        time,
        dueDate,
        dueTime: time,
        priority,
        category,
        dosage: dosage.trim() || undefined,
        notes: notes.trim() || undefined,
        voiceReminderText: enableVoice
          ? `Hi ${activePatient.name}, it's time for ${title}.`
          : '',
        completed: false,
        snoozed: false,
        status: 'upcoming',
        createdBy: 'caregiver',
        source: 'caregiver_created'
      };

      onAddTask(newTask);
      await taskService.createTask(newTask);

      setShowAddForm(false);
      setTitle('');
      setDosage('');
      setNotes('');
    }
  };

  const handleDelete = async (taskId: string) => {
    onDeleteTask(taskId);
    await taskService.deleteTask(taskId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
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
                Routine Scheduler &amp; Task Assignment
              </h2>
              <p className="text-xs text-gray-500">
                Assigning schedule for {activePatient.name} ({activePatient.id})
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
              Assign New Task to Patient
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
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Scheduled Time</label>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl font-medium"
                >
                  <option value="medicine">Medicine / Supplement</option>
                  <option value="exercise">Exercise / Walk</option>
                  <option value="calm">Calm / Breathing</option>
                  <option value="meal">Nutritious Meal</option>
                  <option value="activity">Social / Mind Activity</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl font-medium"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <div>
                <label className="text-[11px] font-bold text-gray-600 block mb-1">Caregiver Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Take 30 mins after food"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>
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
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#3B664B] text-white hover:bg-[#2D4F3B] shadow-xs cursor-pointer"
                >
                  Save Task
                </button>
              </div>
            </div>

          </form>
        )}

        {/* Existing Tasks List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {tasks.length === 0 ? (
            <div className="p-8 text-center bg-[#F8F7F0] rounded-2xl border border-gray-200">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-600">No scheduled tasks for this patient.</p>
              <p className="text-xs text-gray-400 mt-1">Click &ldquo;Add Routine&rdquo; above to assign tasks to {activePatient.name}.</p>
            </div>
          ) : (
            tasks.map((task) => (
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
                      {task.priority && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${
                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          task.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {task.priority}
                        </span>
                      )}
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
                  onClick={() => handleDelete(task.id)}
                  className="p-2 rounded-xl text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
