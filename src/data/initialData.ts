import {
  PatientProfile,
  TaskItem,
  ContactItem,
  DayProgress,
  PhotoMemory,
  VoiceNoteRecord,
  RelativeMeeting,
  EmergencyAlertItem,
  MusicTrack,
  ActivityTimelineItem,
  MoodRecord,
  FamiliarFace,
  ImportantDate,
  RoutineSuggestion,
  AppNotification
} from '../types';

export const INITIAL_PATIENTS: PatientProfile[] = [
  {
    id: 'P-10482',
    name: 'Aarav Sharma',
    age: 68,
    gender: 'Male',
    bloodGroup: 'O+',
    homeLocation: 'Bengaluru, Karnataka',
    liveLocationEnabled: true,
    dateOfBirth: '15 Apr 1957',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    status: 'all_good',
    streakDays: 5,
    overallCompletion: 93,
    caregiverId: 'CG-101',
    adaptiveNotes: 'Wakes up at 6:45 AM. Enjoys bamboo flute in the morning. Completes routine best before 10 AM.'
  },
  {
    id: 'P-20345',
    name: 'Meera Nair',
    age: 72,
    gender: 'Female',
    bloodGroup: 'B+',
    homeLocation: 'Chennai, Tamil Nadu',
    liveLocationEnabled: true,
    dateOfBirth: '22 Aug 1953',
    avatar: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=400&q=80',
    status: 'meds_pending',
    streakDays: 3,
    overallCompletion: 81,
    caregiverId: 'CG-101',
    adaptiveNotes: 'Prefers Tamil or English voice reminders. Often needs a gentle 15-minute afternoon reminder.'
  },
  {
    id: 'P-30721',
    name: 'Ramesh Rao',
    age: 74,
    gender: 'Male',
    bloodGroup: 'A+',
    homeLocation: 'Mysuru, Karnataka',
    liveLocationEnabled: true,
    dateOfBirth: '03 Dec 1951',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    status: 'all_good',
    streakDays: 2,
    overallCompletion: 76,
    caregiverId: 'CG-101',
    adaptiveNotes: 'Blood pressure medication sensitive. Requires close monitoring during sudden weather changes.'
  }
];

export const INITIAL_TASKS: TaskItem[] = [];

export const INITIAL_TIMELINE: ActivityTimelineItem[] = [
  {
    id: 'time-1',
    patientId: 'P-10482',
    taskName: 'Medication',
    scheduledTime: '9:00 AM',
    actualCompletionTime: '9:05 AM',
    status: 'completed',
    patientConfirmation: true,
    source: 'caregiver',
    category: 'medicine',
    timestamp: 'Today, 9:05 AM'
  },
  {
    id: 'time-2',
    patientId: 'P-10482',
    taskName: 'Breathing Exercise',
    scheduledTime: '9:30 AM',
    actualCompletionTime: '9:32 AM',
    status: 'completed',
    patientConfirmation: true,
    source: 'system',
    category: 'calm',
    timestamp: 'Today, 9:32 AM'
  },
  {
    id: 'time-3',
    patientId: 'P-10482',
    taskName: 'Memory Game',
    scheduledTime: '10:00 AM',
    actualCompletionTime: '10:20 AM',
    status: 'completed',
    patientConfirmation: true,
    source: 'system',
    category: 'activity',
    timestamp: 'Today, 10:20 AM'
  },
  {
    id: 'time-4',
    patientId: 'P-10482',
    taskName: 'Afternoon Walk',
    scheduledTime: '11:00 AM',
    status: 'upcoming',
    patientConfirmation: false,
    source: 'caregiver',
    category: 'exercise',
    timestamp: 'Scheduled'
  }
];

export const INITIAL_MOODS: MoodRecord[] = [
  { id: 'm-1', patientId: 'P-10482', mood: 'happy', recordedAt: '2026-10-24T08:00:00Z', timeLabel: '8:00 AM', day: 'Mon', note: 'Feeling rested' },
  { id: 'm-2', patientId: 'P-10482', mood: 'very_happy', recordedAt: '2026-10-25T08:30:00Z', timeLabel: '8:30 AM', day: 'Tue', note: 'Granddaughter called' },
  { id: 'm-3', patientId: 'P-10482', mood: 'happy', recordedAt: '2026-10-26T08:15:00Z', timeLabel: '8:15 AM', day: 'Wed', note: 'Good morning walk' },
  { id: 'm-4', patientId: 'P-10482', mood: 'okay', recordedAt: '2026-10-27T08:00:00Z', timeLabel: '8:00 AM', day: 'Thu', note: 'A bit cloudy outside' },
  { id: 'm-5', patientId: 'P-10482', mood: 'very_happy', recordedAt: '2026-10-28T09:00:00Z', timeLabel: '9:00 AM', day: 'Fri', note: 'Listened to classical flute' },
  { id: 'm-6', patientId: 'P-10482', mood: 'happy', recordedAt: '2026-10-29T08:30:00Z', timeLabel: '8:30 AM', day: 'Sat', note: 'Enjoyed warm masala chai' },
  { id: 'm-7', patientId: 'P-10482', mood: 'very_happy', recordedAt: '2026-10-30T07:45:00Z', timeLabel: '7:45 AM', day: 'Sun', note: 'Feeling cheerful and calm' }
];

export const INITIAL_FAMILIAR_FACES: FamiliarFace[] = [
  {
    id: 'ff-1',
    name: 'Meera (Daughter)',
    relationship: 'Eldest Daughter',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    description: 'Lives in Indiranagar. Visits every Saturday afternoon with warm homemade sweets.',
    lastVisited: '3 days ago'
  },
  {
    id: 'ff-2',
    name: 'Rohit (Son)',
    relationship: 'Son',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    description: 'Senior Software Architect. Loves playing chess with you on Sunday mornings.',
    lastVisited: 'Last Sunday'
  },
  {
    id: 'ff-3',
    name: 'Sita (Wife)',
    relationship: 'Loving Partner of 42 years',
    photoUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=400&q=80',
    description: 'Enjoys tending the garden jasmine and evening temple prayers together.',
    lastVisited: 'Lives together'
  },
  {
    id: 'ff-4',
    name: 'Diya (Granddaughter)',
    relationship: 'Granddaughter, Age 6',
    photoUrl: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=400&q=80',
    description: 'Always asks Grandpa to draw peacocks and tell tales of Malgudi.',
    lastVisited: 'Yesterday on Video Call'
  }
];

export const INITIAL_IMPORTANT_DATES: ImportantDate[] = [
  { id: 'id-1', title: 'Diya\'s 6th Birthday Party', date: 'Sunday, 15 Nov', relation: 'Granddaughter', badge: 'Upcoming Birthday' },
  { id: 'id-2', title: 'Wedding Anniversary (43rd Year)', date: 'Thursday, 22 Dec', relation: 'Sita & Aarav', badge: 'Anniversary' },
  { id: 'id-3', title: 'Diwali Deepavali Celebration', date: 'Saturday, 12 Nov', relation: 'Family Festival', badge: 'Festival' }
];

export const INITIAL_ROUTINE_SUGGESTIONS: RoutineSuggestion[] = [
  {
    id: 'sug-1',
    patientId: 'P-10482',
    title: 'Add evening walk at 5:30 PM',
    suggestedTime: '5:30 PM',
    category: 'exercise',
    reason: 'Aarav\'s mood is consistently highest (Very Happy) after mild outdoor strolls before sunset.',
    status: 'pending',
    personalizationInsights: [
      'Prefers morning and pre-sunset activities',
      'Enjoys music (classical flute during walks)',
      'Best activity window: 9:00 AM – 11:00 AM & 5:00 PM – 6:30 PM'
    ]
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    targetRole: 'all',
    patientId: 'P-10482',
    title: 'Task Completed',
    message: 'Medication taken at 9:05 AM by Aarav Sharma',
    type: 'task_completed',
    timestamp: '2 min ago',
    read: false,
    urgency: 'low'
  },
  {
    id: 'notif-2',
    targetRole: 'caregiver',
    patientId: 'P-20345',
    title: 'Missed Activity Reminder',
    message: 'Meera Nair: Morning walk not completed. Snoozed for 15 mins.',
    type: 'missed_activity',
    timestamp: '1 hr ago',
    read: false,
    urgency: 'medium'
  },
  {
    id: 'notif-3',
    targetRole: 'caregiver',
    patientId: 'P-30721',
    title: 'SOS Alert Active',
    message: 'Ramesh Rao activated SOS from Mysuru. Location shared with caregivers.',
    type: 'sos_alert',
    timestamp: '2 hr ago',
    read: false,
    urgency: 'emergency'
  },
  {
    id: 'notif-4',
    targetRole: 'all',
    patientId: 'P-10482',
    title: 'Voice Note Received',
    message: 'New warm voice message from Daughter Meera',
    type: 'voice_note',
    timestamp: '3 hr ago',
    read: true,
    urgency: 'low'
  },
  {
    id: 'notif-5',
    targetRole: 'caregiver',
    patientId: 'P-10482',
    title: 'Mood Check-in',
    message: 'Aarav is feeling happy today (masala chai & morning walk)',
    type: 'mood_checkin',
    timestamp: '5 hr ago',
    read: true,
    urgency: 'low'
  }
];

export const INITIAL_CONTACTS: ContactItem[] = [];

export const INITIAL_PROGRESS_7_DAYS: DayProgress[] = [
  { day: 'Mon', fullDate: '24 Oct', completionRate: 75, medsTaken: 3, medsTotal: 4, mood: 'good', sleepHours: 7.2, activitiesMinutes: 25 },
  { day: 'Tue', fullDate: '25 Oct', completionRate: 85, medsTaken: 4, medsTotal: 4, mood: 'great', sleepHours: 8.0, activitiesMinutes: 35 },
  { day: 'Wed', fullDate: '26 Oct', completionRate: 90, medsTaken: 4, medsTotal: 4, mood: 'great', sleepHours: 7.5, activitiesMinutes: 30 },
  { day: 'Thu', fullDate: '27 Oct', completionRate: 80, medsTaken: 3, medsTotal: 4, mood: 'okay', sleepHours: 6.8, activitiesMinutes: 20 },
  { day: 'Fri', fullDate: '28 Oct', completionRate: 95, medsTaken: 4, medsTotal: 4, mood: 'great', sleepHours: 8.2, activitiesMinutes: 40 },
  { day: 'Sat', fullDate: '29 Oct', completionRate: 70, medsTaken: 3, medsTotal: 4, mood: 'okay', sleepHours: 6.5, activitiesMinutes: 15 },
  { day: 'Sun', fullDate: '30 Oct', completionRate: 85, medsTaken: 4, medsTotal: 4, mood: 'good', sleepHours: 7.8, activitiesMinutes: 30 }
];

export const INITIAL_PHOTOS: PhotoMemory[] = [
  {
    id: 'photo-1',
    album: 'Family Trips',
    title: 'Visit to Mysore Palace Gardens',
    date: 'October 2022',
    caption: 'Walking through the fragrant jasmine flowerbeds with Rohit and little Diya.',
    imageUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
    tags: ['Family', 'Mysore', 'Garden']
  },
  {
    id: 'photo-2',
    album: 'Celebrations',
    title: 'Granddaughter Diya\'s 5th Birthday',
    date: 'March 2023',
    caption: 'Diya gave you the biggest slice of strawberry cake and made you laugh all afternoon.',
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80',
    tags: ['Diya', 'Birthday', 'Cake']
  },
  {
    id: 'photo-3',
    album: 'Family Trips',
    title: 'Morning Walk at Cubbon Park',
    date: 'January 2024',
    caption: 'Fresh morning breeze under the giant bamboo trees with Sita.',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    tags: ['Sita', 'Park', 'Morning']
  },
  {
    id: 'photo-4',
    album: 'Celebrations',
    title: 'Diwali Festival of Lights',
    date: 'November 2023',
    caption: 'Lighting traditional terracotta lamps together on the courtyard veranda.',
    imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
    tags: ['Diwali', 'Lights', 'Home']
  }
];

export const INITIAL_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'm-1',
    title: 'Peaceful Mind',
    subtitle: 'Bamboo Flute & Warm Drone',
    duration: '15:00',
    soundType: 'flute',
    category: 'Relaxation'
  },
  {
    id: 'm-2',
    title: 'Monsoon Whispers',
    subtitle: 'Gentle Rain & Soft Breeze',
    duration: '20:00',
    soundType: 'rain',
    category: 'Deep Rest'
  },
  {
    id: 'm-3',
    title: 'Serene Temple Bells',
    subtitle: 'Harmonic Chimes & Silence',
    duration: '12:00',
    soundType: 'bells',
    category: 'Meditation'
  },
  {
    id: 'm-4',
    title: 'Coastal Horizon',
    subtitle: 'Rhythmic Ocean Waves',
    duration: '25:00',
    soundType: 'ocean',
    category: 'Sleep'
  },
  {
    id: 'm-5',
    title: 'Dawn in Nilgiris',
    subtitle: 'Forest Canopy & Songbirds',
    duration: '18:00',
    soundType: 'forest',
    category: 'Morning Energy'
  }
];

export const INITIAL_VOICE_NOTES: VoiceNoteRecord[] = [
  {
    id: 'vn-1',
    senderName: 'Meera (Daughter)',
    senderRole: 'caregiver',
    timestamp: 'Today, 8:15 AM',
    duration: '0:24',
    transcription: 'Good morning Appa! Just checking in. I will visit you this Saturday evening with your favorite hot jalebis. Love you!',
    patientId: 'P-10482'
  },
  {
    id: 'vn-2',
    senderName: 'Aarav Sharma',
    senderRole: 'patient',
    timestamp: 'Yesterday, 4:30 PM',
    duration: '0:18',
    transcription: 'Priya, I finished my walk in the garden today. Feeling fresh. The jasmine bush has blossomed.',
    patientId: 'P-10482'
  }
];

export const INITIAL_MEETINGS: RelativeMeeting[] = [
  {
    id: 'meet-1',
    patientId: 'P-10482',
    relativeName: 'Family Meeting (Meera & Rohit)',
    relationship: 'Family Connect',
    date: 'Every Sunday',
    time: '5:00 PM',
    note: 'Weekly video catch-up with grandchildren',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    isRecurring: true
  },
  {
    id: 'meet-2',
    patientId: 'P-10482',
    relativeName: 'Dr. Suresh (Cardiologist)',
    relationship: 'Physician Review',
    date: 'Tuesday, 4 Nov',
    time: '11:30 AM',
    note: 'Routine blood pressure review & checkup',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=300&q=80'
  }
];

export const INITIAL_ALERTS: EmergencyAlertItem[] = [];
