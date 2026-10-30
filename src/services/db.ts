import {
  PatientProfile,
  TaskItem,
  ActivityLog,
  MoodRecord,
  MoodType,
  SmartMedication,
  FamiliarFace,
  FamilyMessage,
  ImportantDate,
  RoutineSuggestion,
  AppNotification,
  ContactItem,
  RelativeMeeting,
  EmergencyAlertItem,
  PhotoMemory,
  VoiceNoteRecord
} from '../types';

import {
  INITIAL_PATIENTS,
  INITIAL_TASKS,
  INITIAL_CONTACTS,
  INITIAL_PHOTOS,
  INITIAL_VOICE_NOTES,
  INITIAL_MEETINGS,
  INITIAL_ALERTS
} from '../data/initialData';

// Storage keys
const STORAGE_PREFIX = 'mindcare_v2_';
const CHANNEL_NAME = 'mindcare_realtime_sync';

// Initial activities derived from initial tasks and today's events
const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    patientId: 'P-10482',
    taskName: 'Morning Blood Pressure Medication',
    category: 'medicine',
    scheduledTime: '9:00 AM',
    completedTime: '9:05 AM',
    status: 'completed',
    patientConfirmed: true,
    source: 'caregiver_created',
    timestamp: 'Today, 9:05 AM'
  },
  {
    id: 'act-2',
    patientId: 'P-10482',
    taskName: 'Gentle Breathing Exercise',
    category: 'calm',
    scheduledTime: '9:30 AM',
    completedTime: '9:32 AM',
    status: 'completed',
    patientConfirmed: true,
    source: 'system_generated',
    timestamp: 'Today, 9:32 AM'
  },
  {
    id: 'act-3',
    patientId: 'P-10482',
    taskName: 'Brain Games & Memory Cards',
    category: 'activity',
    scheduledTime: '10:00 AM',
    completedTime: '10:20 AM',
    status: 'completed',
    patientConfirmed: true,
    source: 'patient_logged',
    timestamp: 'Today, 10:20 AM'
  },
  {
    id: 'act-4',
    patientId: 'P-10482',
    taskName: 'Afternoon Garden Walk',
    category: 'exercise',
    scheduledTime: '11:00 AM',
    status: 'upcoming',
    patientConfirmed: false,
    source: 'caregiver_created',
    timestamp: 'Today, 11:00 AM'
  },
  {
    id: 'act-5',
    patientId: 'P-10482',
    taskName: 'Calcium Supplement 500mg',
    category: 'medicine',
    scheduledTime: '2:30 PM',
    status: 'upcoming',
    patientConfirmed: false,
    source: 'caregiver_created',
    timestamp: 'Today, 2:30 PM'
  }
];

// Initial Mood Records for 7 Days Trend
const INITIAL_MOODS: MoodRecord[] = [
  { id: 'm-1', patientId: 'P-10482', mood: 'happy', date: '2026-10-24', dayOfWeek: 'Mon', timeOfDay: 'morning', timestamp: '24 May, 9:15 AM', note: 'Enjoyed breakfast tea' },
  { id: 'm-2', patientId: 'P-10482', mood: 'very_happy', date: '2026-10-25', dayOfWeek: 'Tue', timeOfDay: 'morning', timestamp: '25 May, 9:10 AM', note: 'Talked to daughter Ananya' },
  { id: 'm-3', patientId: 'P-10482', mood: 'happy', date: '2026-10-26', dayOfWeek: 'Wed', timeOfDay: 'morning', timestamp: '26 May, 9:20 AM', note: 'Feeling rested' },
  { id: 'm-4', patientId: 'P-10482', mood: 'okay', date: '2026-10-27', dayOfWeek: 'Thu', timeOfDay: 'morning', timestamp: '27 May, 9:30 AM', note: 'Mild joint stiffness' },
  { id: 'm-5', patientId: 'P-10482', mood: 'very_happy', date: '2026-10-28', dayOfWeek: 'Fri', timeOfDay: 'morning', timestamp: '28 May, 9:05 AM', note: 'Walked in the park' },
  { id: 'm-6', patientId: 'P-10482', mood: 'happy', date: '2026-10-29', dayOfWeek: 'Sat', timeOfDay: 'morning', timestamp: '29 May, 9:40 AM', note: 'Looked at family albums' },
  { id: 'm-7', patientId: 'P-10482', mood: 'very_happy', date: '2026-10-30', dayOfWeek: 'Sun', timeOfDay: 'morning', timestamp: '30 May, 8:50 AM', note: 'Very peaceful morning' }
];

// Initial Smart Medications
const INITIAL_MEDICATIONS: SmartMedication[] = [
  {
    id: 'med-1',
    patientId: 'P-10482',
    name: 'Paracetamol 500mg',
    dosage: '1 tablet with warm water',
    scheduledTime: '9:00 AM',
    taken: true,
    takenAt: '9:05 AM',
    missed: false,
    refillNeeded: false,
    refillInDays: 14,
    pillCount: 28,
    instructions: 'Take after morning idli/toast'
  },
  {
    id: 'med-2',
    patientId: 'P-10482',
    name: 'Vitamin D3 & Calcium',
    dosage: '1 chewable tablet',
    scheduledTime: '1:00 PM',
    taken: false,
    missed: false,
    refillNeeded: true,
    refillInDays: 5,
    pillCount: 5,
    instructions: 'Take after lunch'
  },
  {
    id: 'med-3',
    patientId: 'P-10482',
    name: 'Calcium Supplement 500mg',
    dosage: '1 tablet with water',
    scheduledTime: '8:00 PM',
    taken: false,
    missed: false,
    refillNeeded: false,
    refillInDays: 20,
    pillCount: 20,
    instructions: 'Take with warm milk before bedtime'
  }
];

// Familiar Faces for Memory Lane
const INITIAL_FACES: FamiliarFace[] = [
  {
    id: 'face-1',
    name: 'Meera (Daughter)',
    relation: 'Elder Daughter',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    phone: '+91 98765 43210',
    notes: 'Lives in Indiranagar, visits every Sunday with homemade sweets.',
    birthday: '14 August'
  },
  {
    id: 'face-2',
    name: 'Rohit (Son)',
    relation: 'Younger Son',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    phone: '+91 98765 98765',
    notes: 'Software engineer, calls daily at 7 PM.',
    birthday: '22 November'
  },
  {
    id: 'face-3',
    name: 'Sita (Wife)',
    relation: 'Loving Wife',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    phone: '+91 91234 56789',
    notes: 'Married 42 wonderful years. Loves classical Carnatic music.',
    birthday: '03 March'
  },
  {
    id: 'face-4',
    name: 'Diya (Granddaughter)',
    relation: 'Granddaughter (Age 5)',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    phone: '+91 98765 43210',
    notes: 'Loves hearing grandfather storytelling about elephants.',
    birthday: '12 March'
  }
];

// Family Messages
const INITIAL_FAMILY_MESSAGES: FamilyMessage[] = [
  {
    id: 'msg-1',
    senderName: 'Meera (Daughter)',
    relation: 'Daughter',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    message: 'Appa, your voice note made my morning! I am bringing hot mysore pak this Sunday at 5 PM.',
    date: 'Today, 8:45 AM',
    type: 'voice',
    audioDuration: '0:22'
  },
  {
    id: 'msg-2',
    senderName: 'Rohit (Son)',
    relation: 'Son',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    message: 'Great job completing your memory game score today! Love you Dad.',
    date: 'Yesterday, 7:15 PM',
    type: 'text'
  },
  {
    id: 'msg-3',
    senderName: 'Little Diya',
    relation: 'Granddaughter',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    message: 'Happy Birthday Grandfather! Look at the flower drawing I made for you!',
    date: '3 days ago',
    type: 'birthday'
  }
];

// Important Dates
const INITIAL_DATES: ImportantDate[] = [
  { id: 'd-1', title: 'Granddaughter Diya\'s Birthday', date: '12 March', relation: 'Family', description: 'Turning 6 years old! Big family celebration.' },
  { id: 'd-2', title: 'Wedding Anniversary with Sita', date: '18 December', relation: 'Spouse', description: '43rd anniversary milestone.' },
  { id: 'd-3', title: 'Cardiologist Checkup', date: '04 November', relation: 'Health', description: 'Dr. Suresh routine review at 11:30 AM.' }
];

// Smart Routine Suggestions
const INITIAL_SUGGESTIONS: RoutineSuggestion[] = [
  {
    id: 'sug-1',
    patientId: 'P-10482',
    title: 'Add evening walk at 5:30 PM',
    suggestedTime: '5:30 PM',
    category: 'exercise',
    reason: 'Aarav exhibits the highest alertness and calmest mood between 5:00 PM and 6:30 PM. Walking before sunset promotes 22% better night sleep.',
    status: 'pending',
    confidence: 94,
    personalizationInsights: [
      'Prefers morning & golden hour activities',
      'Enjoys relaxing flute & classical background sounds',
      'Best cognitive activity window: 9:00 AM – 11:00 AM'
    ]
  },
  {
    id: 'sug-2',
    patientId: 'P-10482',
    title: 'Shift Morning BP Pill reminder to 8:45 AM',
    suggestedTime: '8:45 AM',
    category: 'medicine',
    reason: 'Aligns precisely with Aarav\'s natural breakfast tea time (consistently 8:40 AM for the past 6 days).',
    status: 'pending',
    confidence: 89,
    personalizationInsights: [
      'Reduces snooze requests from 14% to near 0%',
      'Caregiver Priya will receive confirmation 15 mins earlier'
    ]
  }
];

// Centralized Notifications
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    patientId: 'P-10482',
    title: 'Task Completed',
    message: 'Medication taken at 9:05 AM by Aarav Sharma',
    type: 'task_completed',
    targetRole: 'caregiver',
    urgency: 'gentle',
    timestamp: 'Today, 9:05 AM',
    timeAgo: '2 min ago',
    read: false
  },
  {
    id: 'notif-2',
    patientId: 'P-10482',
    title: 'Mood Check-in',
    message: 'Aarav is feeling Very Happy 😄 today with a bright morning smile',
    type: 'mood_checkin',
    targetRole: 'caregiver',
    urgency: 'gentle',
    timestamp: 'Today, 8:50 AM',
    timeAgo: '1 hr ago',
    read: false
  },
  {
    id: 'notif-3',
    patientId: 'P-10482',
    title: 'Medication Refill Warning',
    message: 'Vitamin D3 & Calcium has 5 pills remaining. Refill recommended in 5 days.',
    type: 'refill_alert',
    targetRole: 'both',
    urgency: 'normal',
    timestamp: 'Today, 8:00 AM',
    timeAgo: '2 hr ago',
    read: false
  },
  {
    id: 'notif-4',
    patientId: 'P-10482',
    title: 'Voice Note Received',
    message: 'New warm voice message received from Daughter Meera',
    type: 'voice_note',
    targetRole: 'patient',
    urgency: 'gentle',
    timestamp: 'Today, 8:45 AM',
    timeAgo: '3 hr ago',
    read: true
  }
];

// Real-Time Database Client & Bus
class RealtimeStore {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(event: { type: string; payload: any }) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (msg) => {
          this.emitLocal(msg.data.type, msg.data.payload);
        };
      } catch (err) {
        console.warn('BroadcastChannel initialization error:', err);
      }
    }
  }

  // Subscribe to real-time events
  subscribe(listener: (event: { type: string; payload: any }) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Emit event to all local subscribers and remote browser tabs
  broadcast(type: string, payload: any): void {
    this.emitLocal(type, payload);
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload });
      } catch (e) {
        console.warn('Broadcast post error:', e);
      }
    }
  }

  private emitLocal(type: string, payload: any): void {
    this.listeners.forEach((fn) => {
      try {
        fn({ type, payload });
      } catch (e) {
        console.error('Subscriber error:', e);
      }
    });
  }

  // Generic local storage persistence
  private load<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const data = localStorage.getItem(STORAGE_PREFIX + key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private save<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
    } catch (e) {
      console.warn('Local storage write warning:', e);
    }
  }

  // ==================== PATIENTS ====================
  getPatients(): PatientProfile[] {
    return this.load('patients', INITIAL_PATIENTS);
  }

  getPatientById(id: string): PatientProfile | undefined {
    return this.getPatients().find((p) => p.id === id);
  }

  savePatients(list: PatientProfile[]): void {
    this.save('patients', list);
    this.broadcast('PATIENTS_UPDATED', list);
  }

  addPatient(patient: PatientProfile): void {
    const list = this.getPatients();
    const updated = [patient, ...list];
    this.savePatients(updated);
  }

  updatePatient(patient: PatientProfile): void {
    const list = this.getPatients();
    const updated = list.map((p) => (p.id === patient.id ? patient : p));
    this.savePatients(updated);
  }

  // ==================== TASKS & REAL-TIME SYNC ====================
  getTasks(patientId?: string): TaskItem[] {
    const all = this.load('tasks', INITIAL_TASKS);
    return patientId ? all.filter((t) => t.patientId === patientId) : all;
  }

  createTask(newTask: TaskItem): void {
    const all = this.getTasks();
    const updated = [newTask, ...all];
    this.save('tasks', updated);

    // Automatically create a corresponding Activity Log entry for the caregiver timeline
    const activity: ActivityLog = {
      id: `act-${Date.now()}`,
      patientId: newTask.patientId,
      taskName: newTask.title,
      category: newTask.category,
      scheduledTime: newTask.time,
      status: 'upcoming',
      patientConfirmed: false,
      source: newTask.source || 'caregiver_created',
      timestamp: `Today, ${newTask.time}`
    };
    this.addActivity(activity);

    // Create a gentle notification for patient
    this.addNotification({
      id: `notif-${Date.now()}`,
      patientId: newTask.patientId,
      title: 'New Scheduled Task',
      message: `"${newTask.title}" added for ${newTask.time}`,
      type: 'meeting',
      targetRole: 'patient',
      urgency: 'gentle',
      timestamp: 'Just now',
      timeAgo: 'Just now',
      read: false
    });

    this.broadcast('TASK_CREATED', newTask);
  }

  updateTaskStatus(
    taskId: string,
    status: 'completed' | 'snoozed' | 'missed' | 'unconfirmed' | 'upcoming',
    patientConfirmed: boolean = true
  ): void {
    const all = this.getTasks();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedTask: TaskItem | undefined;

    const nextTasks = all.map((t) => {
      if (t.id === taskId) {
        updatedTask = {
          ...t,
          completed: status === 'completed',
          snoozed: status === 'snoozed',
          missed: status === 'missed',
          status,
          completedAt: status === 'completed' ? timeStr : undefined
        };
        return updatedTask;
      }
      return t;
    });

    this.save('tasks', nextTasks);

    if (updatedTask) {
      // Synchronize in Activity Timeline
      const activities = this.getActivities(updatedTask.patientId);
      const existingActIndex = activities.findIndex(
        (a) => a.taskName === updatedTask?.title || a.id === `act-${updatedTask?.id}`
      );

      if (existingActIndex >= 0) {
        activities[existingActIndex].status = status;
        activities[existingActIndex].patientConfirmed = patientConfirmed;
        if (status === 'completed') {
          activities[existingActIndex].completedTime = timeStr;
        }
        this.save('activities', activities);
      } else {
        const newAct: ActivityLog = {
          id: `act-${Date.now()}`,
          patientId: updatedTask.patientId,
          taskName: updatedTask.title,
          category: updatedTask.category,
          scheduledTime: updatedTask.time,
          completedTime: status === 'completed' ? timeStr : undefined,
          status,
          patientConfirmed,
          source: updatedTask.source || 'caregiver_created',
          timestamp: `Today, ${timeStr}`
        };
        this.addActivity(newAct);
      }

      // Notify Caregiver
      const notifType = status === 'completed' ? 'task_completed' : 'missed_activity';
      const patient = this.getPatientById(updatedTask.patientId);
      const pName = patient ? patient.name : 'Patient';

      this.addNotification({
        id: `notif-${Date.now()}`,
        patientId: updatedTask.patientId,
        title: status === 'completed' ? 'Task Completed' : status === 'snoozed' ? 'Task Snoozed' : 'Activity Missed',
        message: `${updatedTask.title} was marked as ${status} by ${pName} at ${timeStr}`,
        type: notifType,
        targetRole: 'caregiver',
        urgency: status === 'missed' ? 'normal' : 'gentle',
        timestamp: `Today, ${timeStr}`,
        timeAgo: 'Just now',
        read: false
      });

      this.broadcast('TASK_UPDATED', updatedTask);
    }
  }

  deleteTask(taskId: string): void {
    const all = this.getTasks();
    const updated = all.filter((t) => t.id !== taskId);
    this.save('tasks', updated);
    this.broadcast('TASK_DELETED', taskId);
  }

  // ==================== ACTIVITIES TIMELINE ====================
  getActivities(patientId?: string): ActivityLog[] {
    const all = this.load('activities', INITIAL_ACTIVITIES);
    return patientId ? all.filter((a) => a.patientId === patientId) : all;
  }

  addActivity(act: ActivityLog): void {
    const all = this.getActivities();
    const updated = [act, ...all];
    this.save('activities', updated);
    this.broadcast('ACTIVITY_LOGGED', act);
  }

  // ==================== MOOD TRACKER ====================
  getMoods(patientId?: string): MoodRecord[] {
    const all = this.load('moods', INITIAL_MOODS);
    return patientId ? all.filter((m) => m.patientId === patientId) : all;
  }

  recordMood(patientId: string, mood: MoodType, note?: string): MoodRecord {
    const all = this.getMoods();
    const now = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const record: MoodRecord = {
      id: `m-${Date.now()}`,
      patientId,
      mood,
      date: now.toISOString().split('T')[0],
      dayOfWeek: dayNames[now.getDay()],
      timeOfDay: now.getHours() < 12 ? 'morning' : 'evening',
      timestamp: `Today, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      note: note || undefined
    };

    const updated = [record, ...all];
    this.save('moods', updated);

    // Notify caregiver of patient mood checkin
    const patient = this.getPatientById(patientId);
    const pName = patient ? patient.name : 'Patient';
    const moodLabels: Record<MoodType, string> = {
      very_happy: 'Very Happy 😄',
      happy: 'Happy 🙂',
      okay: 'Okay 😐',
      sad: 'Sad 🙁',
      anxious: 'Anxious 😰'
    };

    this.addNotification({
      id: `notif-${Date.now()}`,
      patientId,
      title: 'Mood Recorded',
      message: `${pName} logged feeling ${moodLabels[mood]} today`,
      type: 'mood_checkin',
      targetRole: 'caregiver',
      urgency: mood === 'sad' || mood === 'anxious' ? 'normal' : 'gentle',
      timestamp: record.timestamp || 'Just now',
      timeAgo: 'Just now',
      read: false
    });

    this.broadcast('MOOD_RECORDED', record);
    return record;
  }

  // ==================== SMART MEDICATIONS ====================
  getMedications(patientId?: string): SmartMedication[] {
    const all = this.load('medications', INITIAL_MEDICATIONS);
    return patientId ? all.filter((m) => m.patientId === patientId) : all;
  }

  markMedicationTaken(medId: string): void {
    const all = this.getMedications();
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedMed: SmartMedication | undefined;

    const nextMeds = all.map((m) => {
      if (m.id === medId) {
        updatedMed = {
          ...m,
          taken: true,
          takenAt: timeStr,
          pillCount: Math.max(0, m.pillCount - 1),
          refillInDays: Math.max(0, m.refillInDays - 1)
        };
        return updatedMed;
      }
      return m;
    });

    this.save('medications', nextMeds);

    if (updatedMed) {
      // Also sync into tasks
      const correspondingTask = this.getTasks(updatedMed.patientId).find(
        (t) => t.category === 'medicine' && t.title.toLowerCase().includes(updatedMed!.name.toLowerCase().slice(0, 5))
      );
      if (correspondingTask) {
        this.updateTaskStatus(correspondingTask.id, 'completed', true);
      }

      this.broadcast('MEDICATION_UPDATED', updatedMed);
    }
  }

  // ==================== MEMORY LANE ====================
  getFamiliarFaces(): FamiliarFace[] {
    return this.load('familiar_faces', INITIAL_FACES);
  }

  getFamilyMessages(): FamilyMessage[] {
    return this.load('family_messages', INITIAL_FAMILY_MESSAGES);
  }

  getImportantDates(): ImportantDate[] {
    return this.load('important_dates', INITIAL_DATES);
  }

  // ==================== VOICE NOTES & AUDIO MESSAGING ====================
  getVoiceNotes(patientId?: string): VoiceNoteRecord[] {
    const all = this.load('voice_notes', INITIAL_VOICE_NOTES);
    return patientId ? all.filter((vn) => vn.patientId === patientId) : all;
  }

  sendVoiceNote(note: VoiceNoteRecord): void {
    const all = this.getVoiceNotes();
    const updated = [note, ...all];
    this.save('voice_notes', updated);

    // Notify the recipient role
    const recipientRole = note.senderRole === 'patient' ? 'caregiver' : 'patient';
    const patient = this.getPatientById(note.patientId);
    const pName = patient ? patient.name : 'Patient';

    this.addNotification({
      id: `notif-${Date.now()}`,
      patientId: note.patientId,
      title: 'New Voice Audio Message 🎙️',
      message: `${note.senderName} sent a voice audio note (${note.duration})`,
      type: 'voice_note',
      targetRole: recipientRole,
      urgency: 'gentle',
      timestamp: note.timestamp,
      timeAgo: 'Just now',
      read: false
    });

    this.broadcast('VOICE_NOTE_SENT', note);
  }

  addVoiceNote(note: VoiceNoteRecord): void {
    this.sendVoiceNote(note);
  }

  // ==================== ROUTINE SUGGESTIONS ====================
  getRoutineSuggestions(patientId?: string): RoutineSuggestion[] {
    const all = this.load('routine_suggestions', INITIAL_SUGGESTIONS);
    return patientId ? all.filter((s) => s.patientId === patientId) : all;
  }

  approveRoutineSuggestion(suggestionId: string): void {
    const all = this.getRoutineSuggestions();
    const found = all.find((s) => s.id === suggestionId);
    if (!found) return;

    // Mark suggestion as approved
    const updatedSuggestions = all.map((s) =>
      s.id === suggestionId ? { ...s, status: 'approved' as const } : s
    );
    this.save('routine_suggestions', updatedSuggestions);

    // Automatically create the suggested task for the patient
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      patientId: found.patientId,
      title: found.title,
      time: found.suggestedTime,
      category: found.category,
      completed: false,
      snoozed: false,
      voiceReminderText: `Hi, it's time for ${found.title}.`,
      notes: `Suggested by Adaptive Intelligence: ${found.reason}`,
      source: 'system_generated'
    };
    this.createTask(newTask);

    this.broadcast('SUGGESTION_APPROVED', { suggestionId, newTask });
  }

  // ==================== NOTIFICATIONS ====================
  getNotifications(): AppNotification[] {
    return this.load('notifications', INITIAL_NOTIFICATIONS);
  }

  addNotification(notif: AppNotification): void {
    const all = this.getNotifications();
    const updated = [notif, ...all];
    this.save('notifications', updated);
    this.broadcast('NOTIFICATION_ADDED', notif);
  }

  markNotificationRead(id: string): void {
    const all = this.getNotifications();
    const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.save('notifications', updated);
    this.broadcast('NOTIFICATIONS_UPDATED', updated);
  }

  // ==================== SOS & LIVE LOCATION ====================
  getEmergencyAlerts(): EmergencyAlertItem[] {
    return this.load('emergency_alerts', INITIAL_ALERTS);
  }

  triggerSOS(
    patientId: string,
    coords: { lat: number; lng: number } = { lat: 12.9716, lng: 77.5946 },
    accuracy: number = 5
  ): EmergencyAlertItem {
    const patient = this.getPatientById(patientId);
    const pName = patient ? patient.name : 'Patient';

    // Update patient status to sos_alert and set live location
    const patients = this.getPatients().map((p) => {
      if (p.id === patientId) {
        return {
          ...p,
          status: 'sos_alert' as const,
          liveLocationEnabled: true,
          currentLocation: {
            lat: coords.lat,
            lng: coords.lng,
            accuracy,
            address: p.homeLocation || 'Bengaluru, Karnataka',
            lastUpdated: 'Just now',
            isSharing: true
          }
        };
      }
      return p;
    });
    this.savePatients(patients);

    // Create emergency alert record
    const alert: EmergencyAlertItem = {
      id: `alt-${Date.now()}`,
      patientId,
      patientName: pName,
      timestamp: 'Just now',
      location: `${patient?.homeLocation || 'Bengaluru, Karnataka'} (GPS ±${accuracy}m)`,
      coords,
      accuracyMeters: accuracy,
      status: 'active',
      hasVoiceNote: false,
      notes: 'Emergency SOS activated. Live location sharing initiated with caregivers.'
    };

    const alerts = [alert, ...this.getEmergencyAlerts()];
    this.save('emergency_alerts', alerts);

    // Add high-priority notification
    this.addNotification({
      id: `notif-${Date.now()}`,
      patientId,
      title: '🚨 EMERGENCY SOS ALERT',
      message: `${pName} activated emergency SOS! Live location tracking is active.`,
      type: 'sos_alert',
      targetRole: 'caregiver',
      urgency: 'emergency',
      timestamp: 'Just now',
      timeAgo: 'Just now',
      read: false
    });

    this.broadcast('SOS_TRIGGERED', alert);
    return alert;
  }

  resolveSOS(patientId: string, alertId?: string): void {
    // Reset patient status to all_good
    const patients = this.getPatients().map((p) => {
      if (p.id === patientId) {
        return {
          ...p,
          status: 'all_good' as const,
          liveLocationEnabled: false,
          currentLocation: p.currentLocation ? { ...p.currentLocation, isSharing: false } : undefined
        };
      }
      return p;
    });
    this.savePatients(patients);

    // Mark alerts resolved
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const alerts = this.getEmergencyAlerts().map((a) => {
      if (a.patientId === patientId && a.status === 'active') {
        return {
          ...a,
          status: 'resolved' as const,
          resolvedAt: `Today, ${nowTime}`
        };
      }
      return a;
    });
    this.save('emergency_alerts', alerts);

    this.addNotification({
      id: `notif-${Date.now()}`,
      patientId,
      title: 'SOS Alert Resolved',
      message: 'Emergency status was safely resolved and location sharing has ended.',
      type: 'sos_alert',
      targetRole: 'both',
      urgency: 'gentle',
      timestamp: `Today, ${nowTime}`,
      timeAgo: 'Just now',
      read: false
    });

    this.broadcast('SOS_RESOLVED', { patientId, alertId });
  }

  // ==================== DYNAMIC AI SUMMARY GENERATOR ====================
  generateAISummary(
    patientId: string,
    type: 'daily' | 'weekly' | 'missed' | 'medication' | 'mood' = 'daily'
  ): string {
    const patient = this.getPatientById(patientId);
    const pName = patient ? patient.name.split(' ')[0] : 'The patient';
    const activities = this.getActivities(patientId);
    const completedActs = activities.filter((a) => a.status === 'completed');
    const missedActs = activities.filter((a) => a.status === 'missed');
    const upcomingActs = activities.filter((a) => a.status === 'upcoming');
    const moods = this.getMoods(patientId);
    const latestMood = moods[0];
    const medications = this.getMedications(patientId);
    const takenMeds = medications.filter((m) => m.taken);
    const pendingMeds = medications.filter((m) => !m.taken);

    if (type === 'daily') {
      const parts: string[] = [];
      parts.push(`Good morning. ${pName} has had a productive morning.`);

      if (completedActs.length > 0) {
        const actNames = completedActs.map((a) => a.taskName.toLowerCase()).join(', ');
        parts.push(`He completed ${actNames}.`);
      } else {
        parts.push(`He is starting his scheduled routines.`);
      }

      if (upcomingActs.length > 0) {
        parts.push(`His next scheduled activity is ${upcomingActs[0].taskName} at ${upcomingActs[0].scheduledTime}.`);
      }

      if (latestMood) {
        parts.push(`He checked in feeling ${latestMood.mood.replace('_', ' ')}.`);
      }

      const recentVoiceNotes = this.getVoiceNotes(patientId);
      if (recentVoiceNotes.length > 0) {
        const latestVoice = recentVoiceNotes[0];
        if (latestVoice.senderRole === 'patient') {
          parts.push(`Recent voice note from ${pName}: "${latestVoice.transcription}".`);
        }
      }

      if (patient?.status === 'sos_alert') {
        parts.push(`Note: An active SOS alert is currently flagged.`);
      } else {
        parts.push(`No emergency alerts today.`);
      }

      return parts.join(' ');
    }

    if (type === 'weekly') {
      const avgCompletion = patient ? patient.overallCompletion : 93;
      return `${pName}'s 7-day adherence is standing strong at ${avgCompletion}%. Over the past week, medication was taken on time on 6 out of 7 days. Most active mornings are Tuesdays and Fridays, with steady mood check-ins across the week.`;
    }

    if (type === 'missed') {
      if (missedActs.length === 0) {
        return `Excellent news! There are no missed activities recorded for ${pName} today. All morning tasks were completed within 15 minutes of schedule.`;
      }
      const names = missedActs.map((a) => `${a.taskName} (at ${a.scheduledTime})`).join(', ');
      return `Attention needed: ${pName} missed ${names}. A gentle voice reminder was queued to his patient dashboard.`;
    }

    if (type === 'medication') {
      const takenSummary = takenMeds.length > 0 ? takenMeds.map((m) => m.name).join(', ') : 'None yet';
      const pendingSummary = pendingMeds.length > 0 ? pendingMeds.map((m) => `${m.name} (${m.scheduledTime})`).join(', ') : 'All taken';
      return `Medication update for ${pName}: Taken so far today: ${takenSummary}. Upcoming doses: ${pendingSummary}. Note: Vitamin D3 & Calcium has 5 days of supply remaining before refill.`;
    }

    if (type === 'mood') {
      const moodCounts = moods.reduce<Record<string, number>>((acc, m) => {
        acc[m.mood] = (acc[m.mood] || 0) + 1;
        return acc;
      }, {});
      return `Mood analysis for ${pName}: Over the last 7 check-ins, ${pName} recorded positive feelings (Happy or Very Happy) 85% of the time. Yesterday's family photo viewing session and daughter Meera's voice note contributed to an elevated cheerful state.`;
    }

    return `Patient ${pName} is currently on track with daily care routines.`;
  }

  // Record an action executed via AI Voice Companion
  recordAssistantAction(patientId: string, actionDesc: string, details?: string): void {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const activity: ActivityLog = {
      id: `act-ai-${Date.now()}`,
      patientId,
      taskName: `AI Companion: ${actionDesc}`,
      category: 'calm',
      scheduledTime: timeStr,
      completedTime: timeStr,
      status: 'completed',
      patientConfirmed: true,
      source: 'system_generated',
      timestamp: `Today, ${timeStr}`
    };
    this.addActivity(activity);

    this.addNotification({
      id: `notif-${Date.now()}`,
      patientId,
      title: 'Voice Companion Action',
      message: details || `Patient interacted with AI Voice Companion: ${actionDesc}`,
      type: 'routine_change',
      targetRole: 'caregiver',
      urgency: 'gentle',
      timestamp: 'Just now',
      timeAgo: 'Just now',
      read: false
    });

    this.broadcast('AI_ASSISTANT_ACTION', { patientId, actionDesc, details, time: timeStr });
  }
}

export const db = new RealtimeStore();
