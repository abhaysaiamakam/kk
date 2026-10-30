import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_PATIENTS,
  INITIAL_TASKS,
  INITIAL_TIMELINE,
  INITIAL_MOODS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ALERTS,
  INITIAL_ROUTINE_SUGGESTIONS
} from './src/data/initialData.ts';
import {
  TaskItem,
  ActivityTimelineItem,
  MoodRecord,
  EmergencyAlertItem,
  AppNotification,
  PatientProfile,
  RoutineSuggestion
} from './src/types.ts';
import {
  checkRateLimit,
  getAIProviderStatus,
  generateWithFallback,
  buildCompanionSystemPrompt,
  generateMemoryConversationPrompt,
  generateCognitiveHint,
  generateCaregiverSummaryReport
} from './src/server/aiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Real-time State Store (Permanent for application process)
let patients: PatientProfile[] = [...INITIAL_PATIENTS];
let tasks: TaskItem[] = [...INITIAL_TASKS];
let timeline: ActivityTimelineItem[] = [...INITIAL_TIMELINE];
let moods: MoodRecord[] = [...INITIAL_MOODS];
let notifications: AppNotification[] = [...INITIAL_NOTIFICATIONS];
let alerts: EmergencyAlertItem[] = [...INITIAL_ALERTS];
let suggestions: RoutineSuggestion[] = [...INITIAL_ROUTINE_SUGGESTIONS];

// SSE Clients Registry for Real-time Synchronization
const sseClients: Response[] = [];

function broadcastEvent(type: string, data: unknown) {
  const payload = `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.write(payload);
    } catch {
      // Ignore dead connection
    }
  });
}

// -------------------------------------------------------------
// Real-Time Server-Sent Events (SSE) Endpoint
// -------------------------------------------------------------
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'MindCare Real-time Channel Active' })}\n\n`);

  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// -------------------------------------------------------------
// Patients API
// -------------------------------------------------------------
app.get('/api/patients', (_req: Request, res: Response) => {
  res.json({ success: true, data: patients });
});

app.post('/api/patients', (req: Request, res: Response) => {
  const newPatient: PatientProfile = req.body;
  if (!newPatient.id || !newPatient.name) {
    return res.status(400).json({ success: false, error: 'Name and ID required' });
  }
  patients.unshift(newPatient);
  broadcastEvent('patient_added', newPatient);
  res.json({ success: true, data: newPatient });
});

app.put('/api/patients/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = req.body;
  patients = patients.map((p) => (p.id === id ? { ...p, ...updated } : p));
  const found = patients.find((p) => p.id === id);
  broadcastEvent('patient_updated', found);
  res.json({ success: true, data: found });
});

// -------------------------------------------------------------
// Tasks API (Real-Time Synchronization Workflow)
// -------------------------------------------------------------
app.get('/api/tasks', (req: Request, res: Response) => {
  const patientId = req.query.patientId as string;
  const filtered = patientId ? tasks.filter((t) => t.patientId === patientId) : tasks;
  res.json({ success: true, data: filtered });
});

// 1. Caregiver creates task -> saved against patient ID -> broadcasted
app.post('/api/tasks', (req: Request, res: Response) => {
  const newTask: TaskItem = {
    ...req.body,
    id: req.body.id || `task-${Date.now()}`,
    status: req.body.status || 'upcoming',
    completed: false,
    snoozed: false,
    patientConfirmation: false,
    createdBy: req.body.createdBy || 'caregiver'
  };

  tasks.unshift(newTask);

  // Add timeline entry
  const timelineItem: ActivityTimelineItem = {
    id: `time-${Date.now()}`,
    patientId: newTask.patientId,
    taskName: newTask.title,
    scheduledTime: newTask.time,
    status: 'upcoming',
    patientConfirmation: false,
    source: newTask.createdBy,
    category: newTask.category,
    timestamp: 'Just now'
  };
  timeline.unshift(timelineItem);

  // Add notification
  const notif: AppNotification = {
    id: `notif-${Date.now()}`,
    targetRole: 'patient',
    patientId: newTask.patientId,
    title: 'New Scheduled Task',
    message: `${newTask.title} scheduled for ${newTask.time}`,
    type: 'routine_change',
    timestamp: 'Just now',
    read: false,
    urgency: 'low'
  };
  notifications.unshift(notif);

  broadcastEvent('task_created', { task: newTask, timelineItem, notification: notif });
  res.json({ success: true, data: newTask });
});

// 2. Patient completes, snoozes, or misses task -> updates status -> reflects on caregiver dashboard
app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates: Partial<TaskItem> = req.body;

  let updatedTask: TaskItem | null = null;
  tasks = tasks.map((t) => {
    if (t.id === id) {
      updatedTask = { ...t, ...updates };
      return updatedTask;
    }
    return t;
  });

  if (!updatedTask) {
    return res.status(404).json({ success: false, error: 'Task not found' });
  }

  // Reflect in activity timeline
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timelineIdx = timeline.findIndex((item) => item.taskName === (updatedTask as TaskItem).title && item.patientId === (updatedTask as TaskItem).patientId);
  
  if (timelineIdx !== -1) {
    timeline[timelineIdx] = {
      ...timeline[timelineIdx],
      status: (updatedTask as TaskItem).status || ((updatedTask as TaskItem).completed ? 'completed' : 'upcoming'),
      actualCompletionTime: (updatedTask as TaskItem).completed ? nowTime : undefined,
      patientConfirmation: (updatedTask as TaskItem).completed
    };
  } else {
    timeline.unshift({
      id: `time-${Date.now()}`,
      patientId: (updatedTask as TaskItem).patientId,
      taskName: (updatedTask as TaskItem).title,
      scheduledTime: (updatedTask as TaskItem).time,
      actualCompletionTime: (updatedTask as TaskItem).completed ? nowTime : undefined,
      status: (updatedTask as TaskItem).status || ((updatedTask as TaskItem).completed ? 'completed' : 'upcoming'),
      patientConfirmation: !!(updatedTask as TaskItem).completed,
      source: (updatedTask as TaskItem).createdBy || 'patient_logged',
      category: (updatedTask as TaskItem).category,
      timestamp: 'Today, ' + nowTime
    });
  }

  // Create notification for caregiver
  const notif: AppNotification = {
    id: `notif-${Date.now()}`,
    targetRole: 'caregiver',
    patientId: (updatedTask as TaskItem).patientId,
    title: (updatedTask as TaskItem).completed ? 'Task Completed' : (updatedTask as TaskItem).snoozed ? 'Task Snoozed' : 'Task Status Updated',
    message: `${(updatedTask as TaskItem).title} marked as ${(updatedTask as TaskItem).status} by patient`,
    type: (updatedTask as TaskItem).completed ? 'task_completed' : 'missed_activity',
    timestamp: 'Just now',
    read: false,
    urgency: (updatedTask as TaskItem).status === 'missed' ? 'medium' : 'low'
  };
  notifications.unshift(notif);

  broadcastEvent('task_updated', {
    task: updatedTask,
    timeline,
    notification: notif
  });

  res.json({ success: true, data: updatedTask });
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  tasks = tasks.filter((t) => t.id !== id);
  broadcastEvent('task_deleted', { id });
  res.json({ success: true, id });
});

// -------------------------------------------------------------
// Timeline API
// -------------------------------------------------------------
app.get('/api/timeline/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const patientTimeline = timeline.filter((t) => t.patientId === patientId);
  res.json({ success: true, data: patientTimeline });
});

// -------------------------------------------------------------
// Moods API
// -------------------------------------------------------------
app.get('/api/moods/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const patientMoods = moods.filter((m) => m.patientId === patientId);
  res.json({ success: true, data: patientMoods });
});

app.post('/api/moods', (req: Request, res: Response) => {
  const newMood: MoodRecord = {
    id: `m-${Date.now()}`,
    ...req.body,
    recordedAt: new Date().toISOString()
  };
  moods.push(newMood);

  const notif: AppNotification = {
    id: `notif-${Date.now()}`,
    targetRole: 'caregiver',
    patientId: newMood.patientId,
    title: 'Patient Mood Check-in',
    message: `Patient checked in feeling "${newMood.mood.replace('_', ' ')}"`,
    type: 'mood_checkin',
    timestamp: 'Just now',
    read: false,
    urgency: 'low'
  };
  notifications.unshift(notif);

  broadcastEvent('mood_recorded', { mood: newMood, notification: notif });
  res.json({ success: true, data: newMood });
});

// -------------------------------------------------------------
// Notifications API
// -------------------------------------------------------------
app.get('/api/notifications', (req: Request, res: Response) => {
  const role = req.query.role as string;
  const filtered = role
    ? notifications.filter((n) => n.targetRole === 'all' || n.targetRole === role)
    : notifications;
  res.json({ success: true, data: filtered });
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  res.json({ success: true });
});

// -------------------------------------------------------------
// Emergency SOS & Live Location API
// -------------------------------------------------------------
app.get('/api/sos', (_req: Request, res: Response) => {
  res.json({ success: true, data: alerts });
});

app.post('/api/sos', (req: Request, res: Response) => {
  const { patientId, location, latitude, longitude, accuracyMeters, hasVoiceNote, notes } = req.body;
  const patient = patients.find((p) => p.id === patientId);

  // Update patient status to 'sos_alert' and update coordinates
  patients = patients.map((p) =>
    p.id === patientId
      ? {
          ...p,
          status: 'sos_alert',
          currentLatitude: latitude || p.currentLatitude || 12.9716,
          currentLongitude: longitude || p.currentLongitude || 77.5946,
          locationAccuracy: accuracyMeters || 5,
          locationLastUpdated: 'Just now'
        }
      : p
  );

  const newAlert: EmergencyAlertItem = {
    id: `alt-${Date.now()}`,
    patientId,
    patientName: patient?.name || 'Aarav Sharma',
    timestamp: 'Just now',
    location: location || patient?.homeLocation || 'Bengaluru, Karnataka',
    latitude: latitude || 12.9716,
    longitude: longitude || 77.5946,
    accuracyMeters: accuracyMeters || 5,
    lastUpdatedText: 'Just now • 5m accuracy',
    status: 'active',
    hasVoiceNote: !!hasVoiceNote,
    notes: notes || 'Emergency SOS triggered from patient mobile app.',
    historyLogs: [
      { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), message: 'SOS button activated. Live GPS location shared with authorized caregivers.' }
    ]
  };

  alerts.unshift(newAlert);

  const notif: AppNotification = {
    id: `notif-${Date.now()}`,
    targetRole: 'caregiver',
    patientId,
    title: 'EMERGENCY SOS ALERT',
    message: `${newAlert.patientName} activated SOS. Live GPS coordinates received.`,
    type: 'sos_alert',
    timestamp: 'Just now',
    read: false,
    urgency: 'emergency'
  };
  notifications.unshift(notif);

  broadcastEvent('sos_alert', { alert: newAlert, patient: patients.find((p) => p.id === patientId), notification: notif });
  res.json({ success: true, data: newAlert });
});

app.put('/api/sos/:id/resolve', (req: Request, res: Response) => {
  const { id } = req.params;
  const alert = alerts.find((a) => a.id === id);
  if (alert) {
    alert.status = 'resolved';
    alert.resolvedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    alert.historyLogs?.push({
      time: alert.resolvedAt,
      message: 'Caregiver acknowledged and marked emergency resolved.'
    });

    patients = patients.map((p) =>
      p.id === alert.patientId ? { ...p, status: 'all_good' } : p
    );

    broadcastEvent('sos_resolved', { alert, patientId: alert.patientId });
  }
  res.json({ success: true, data: alert });
});

// -------------------------------------------------------------
// Routine Suggestions API
// -------------------------------------------------------------
app.get('/api/suggestions/:patientId', (req: Request, res: Response) => {
  const { patientId } = req.params;
  const filtered = suggestions.filter((s) => s.patientId === patientId);
  res.json({ success: true, data: filtered });
});

app.post('/api/suggestions/:id/approve', (req: Request, res: Response) => {
  const { id } = req.params;
  const sug = suggestions.find((s) => s.id === id);
  if (sug) {
    sug.status = 'approved';
    // Create actual task
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      patientId: sug.patientId,
      title: sug.title,
      time: sug.suggestedTime,
      category: sug.category,
      completed: false,
      snoozed: false,
      status: 'upcoming',
      voiceReminderText: `Hi, it's time for ${sug.title}.`,
      createdBy: 'system'
    };
    tasks.push(newTask);
    broadcastEvent('task_created', { task: newTask });
  }
  res.json({ success: true, data: sug });
});

// -------------------------------------------------------------
// AI Provider Status Endpoint
// -------------------------------------------------------------
app.get('/api/ai/status', (_req: Request, res: Response) => {
  res.json({ success: true, data: getAIProviderStatus() });
});

// -------------------------------------------------------------
// Unified AI Voice Companion Handler
// -------------------------------------------------------------
async function handleVoiceCompanionRequest(req: Request, res: Response) {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(clientIp, 80)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please wait a moment before asking again.'
      });
    }

    const { patientId, message, language = 'en' } = req.body;
    const patient = patients.find((p) => p.id === patientId) || patients[0];
    const patientTasks = tasks.filter((t) => t.patientId === patient.id);
    const uncompletedTasks = patientTasks.filter((t) => !t.completed);
    const completedTasks = patientTasks.filter((t) => t.completed);
    const nextTask = uncompletedTasks[0];
    const patientMeds = patientTasks.filter((t) => t.category === 'medicine');
    const firstName = patient.name.split(' ')[0];

    const msgLower = (message || '').toLowerCase().trim();

    let intent: string = 'general';
    let action: string = 'none';
    let actionPayload: any = null;
    let needsConfirmation: boolean = false;
    let confirmationPrompt: string = '';
    let spokenText: string = '';

    // 1. Emergency / SOS / Help command
    if (
      msgLower.includes('help') ||
      msgLower.includes('emergency') ||
      msgLower.includes('sos') ||
      msgLower.includes('ಸಹಾಯ') ||
      msgLower.includes('ತುರ್ತು') ||
      msgLower.includes('मदद') ||
      msgLower.includes('इमरजेंसी') ||
      msgLower.includes('बचाओ')
    ) {
      intent = 'sos_emergency';
      action = 'trigger_sos_confirmation';
      needsConfirmation = true;
      if (language === 'kn') {
        spokenText = `ನಾನು ನಿಮ್ಮೊಂದಿಗೆ ಇಲ್ಲೇ ಇದ್ದೇನೆ, ${firstName}. ನಾನು ತುರ್ತು ಸಹಾಯಕ್ಕಾಗಿ ನಿಮ್ಮ ಆರೈಕೆದಾರ ಪ್ರಿಯಾಗೆ ಎಚ್ಚರಿಕೆ ಕಳುಹಿಸಿ ಲೈವ್ ಲೊಕೇಶನ್ ಹಂಚಿಕೊಳ್ಳಲೇ?`;
        confirmationPrompt = 'ತುರ್ತು SOS ಎಚ್ಚರಿಕೆಯನ್ನು ಕಳುಹಿಸಬೇಕೆ?';
      } else if (language === 'hi') {
        spokenText = `मैं आपके साथ हूँ, ${firstName}। क्या आप चाहते हैं कि मैं आपकी देखभालकर्ता प्रिया को इमरजेंसी अलर्ट भेजूं और आपकी लाइव लोकेशन शेयर करूँ?`;
        confirmationPrompt = 'क्या इमरजेंसी SOS अलर्ट भेजना है?';
      } else {
        spokenText = `I am right here with you, ${firstName}. Would you like me to send an emergency SOS alert to your caregiver Priya and share your live location?`;
        confirmationPrompt = 'Would you like to trigger an emergency SOS alert?';
      }
    }
    // 2. "I'm confused" / Disorientation grounding
    else if (
      msgLower.includes('confused') ||
      msgLower.includes('where am i') ||
      msgLower.includes('who are you') ||
      msgLower.includes('ಗೊಂದಲ') ||
      msgLower.includes('ನಾನು ಎಲ್ಲಿದ್ದೇನೆ') ||
      msgLower.includes('भ्रम') ||
      msgLower.includes('मैं कहाँ हूँ')
    ) {
      intent = 'confusion_reassurance';
      if (language === 'kn') {
        spokenText = `ನೀವು ನಿಮ್ಮ ಮನೆಯಲ್ಲೇ ಸುರಕ್ಷಿತವಾಗಿದ್ದೀರಿ, ${firstName}. ಎಲ್ಲವೂ ಶಾಂತವಾಗಿದೆ. ನಾನು ನಿಮ್ಮ ಮೈಂಡ್‌ಕೇರ್ ಧ್ವನಿ ಸಹಾಯಕ.`;
      } else if (language === 'hi') {
        spokenText = `आप अपने घर में बिल्कुल सुरक्षित हैं, ${firstName} जी। सब कुछ ठीक है। मैं आपका माइंडकेयर साथी हूँ।`;
      } else {
        spokenText = `You are safe in your comfortable home, ${firstName}. Everything is okay, and I am right here with you.`;
      }
    }
    // 3. "Help me remember" / Reminiscence support
    else if (
      msgLower.includes('help me remember') ||
      msgLower.includes('remember') ||
      msgLower.includes('ನೆನಪಿಸು') ||
      msgLower.includes('ನೆನಪಾಗುತ್ತಿಲ್ಲ') ||
      msgLower.includes('याद दिलाओ') ||
      msgLower.includes('याद नहीं')
    ) {
      intent = 'memory_support';
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (language === 'kn') {
        spokenText = `ಈಗ ಸಮಯ ${timeStr}. ನೀವು ಬೆಳಗಿನ ದಿನಚರಿಯನ್ನು ಶಾಂತವಾಗಿ ಪೂರೈಸಿದ್ದೀರಿ. ನಿಮ್ಮ ಕುಟುಂಬ ನಿಮ್ಮನ್ನು ತುಂಬಾ ಪ್ರೀತಿಸುತ್ತದೆ.`;
      } else if (language === 'hi') {
        spokenText = `अभी समय ${timeStr} है। आपने सुबह की दिनचर्या शांति से पूरी की है। आपका परिवार आपसे बहुत प्यार करता है।`;
      } else {
        spokenText = `It is currently ${timeStr}. You have completed your morning routine peacefully. Your loved ones cherish you dearly.`;
      }
    }
    // 4. "I feel lonely" / "I want to talk to someone"
    else if (
      msgLower.includes('lonely') ||
      msgLower.includes('alone') ||
      msgLower.includes('talk to someone') ||
      msgLower.includes('ಏಕಾಂಗಿ') ||
      msgLower.includes('ಒಂಟಿ') ||
      msgLower.includes('ಮಾತನಾಡಬೇಕು') ||
      msgLower.includes('अकेला') ||
      msgLower.includes('अकेलापन') ||
      msgLower.includes('बात करनी है')
    ) {
      intent = 'loneliness_support';
      action = 'call_contact';
      actionPayload = { contactName: 'Meera (Daughter)', phone: '+91 98765 43210' };
      needsConfirmation = true;
      if (language === 'kn') {
        spokenText = `ನಾನು ನಿಮ್ಮೊಂದಿಗೆ ಇಲ್ಲೇ ಇದ್ದೇನೆ, ${firstName}. ನಿಮ್ಮ ಮಗಳು ಮೀರಾ ಅವರಿಗೆ ನಾವು ಕರೆ ಮಾಡಲೇ?`;
        confirmationPrompt = 'ಮಗಳು ಮೀರಾ ಅವರಿಗೆ ಕರೆ ಮಾಡಬೇಕೆ?';
      } else if (language === 'hi') {
        spokenText = `मैं आपके साथ हूँ, ${firstName} जी। क्या आप अपनी बेटी मीरा से बात करना चाहेंगे?`;
        confirmationPrompt = 'क्या बेटी मीरा को कॉल करना है?';
      } else {
        spokenText = `I am right here by your side, ${firstName}. Would you like to call your daughter Meera to have a sweet chat?`;
        confirmationPrompt = 'Would you like to call your daughter Meera?';
      }
    }
    // 5. Next task command
    else if (
      msgLower.includes('next task') ||
      msgLower.includes('what next') ||
      msgLower.includes("what's next") ||
      msgLower.includes('what should i do') ||
      msgLower.includes('ಮುಂದಿನ ಕೆಲಸ') ||
      msgLower.includes('ಮುಂದಿನ ಕಾರ್ಯ') ||
      msgLower.includes('अगला काम') ||
      msgLower.includes('अगला कार्य')
    ) {
      intent = 'next_task';
      if (nextTask) {
        action = 'remind_task';
        actionPayload = { taskId: nextTask.id, taskTitle: nextTask.title, scheduledTime: nextTask.time };
        if (language === 'kn') {
          spokenText = `ನಿಮ್ಮ ಮುಂದಿನ ಕಾರ್ಯ: ${nextTask.time} ಗೆ "${nextTask.title}". ನಾನು ನಿಮಗೆ ನೆನಪಿಸಬೇಕೆ?`;
        } else if (language === 'hi') {
          spokenText = `आपका अगला काम ${nextTask.time} पर "${nextTask.title}" है। क्या मैं आपको याद दिलाऊं?`;
        } else {
          spokenText = `Your next task is ${nextTask.title} at ${nextTask.time}. Would you like me to remind you?`;
        }
      } else {
        if (language === 'kn') {
          spokenText = `ನೀವು ಇಂದಿನ ಎಲ್ಲಾ ನಿಗದಿತ ಕಾರ್ಯಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ! ಆರಾಮವಾಗಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.`;
        } else if (language === 'hi') {
          spokenText = `आपने आज के अपने सभी निर्धारित कार्य पूरे कर लिए हैं! आराम से विश्राम कीजिए।`;
        } else {
          spokenText = `You have completed all your scheduled tasks for today! Take some gentle rest.`;
        }
      }
    }
    // 6. Medication command
    else if (
      msgLower.includes('medicine') ||
      msgLower.includes('medicines') ||
      msgLower.includes('pills') ||
      msgLower.includes('tablet') ||
      msgLower.includes('dose') ||
      msgLower.includes('ಔಷಧ') ||
      msgLower.includes('ಮಾತ್ರೆ') ||
      msgLower.includes('दवा') ||
      msgLower.includes('दवाई') ||
      msgLower.includes('गोलियां')
    ) {
      intent = 'medications';
      const pendingMeds = patientMeds.filter((m) => !m.completed);
      const takenMeds = patientMeds.filter((m) => m.completed);
      if (language === 'kn') {
        const takenNames = takenMeds.map((m) => m.title).join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ';
        const pendingNames = pendingMeds.map((m) => `${m.title} (${m.time})`).join(', ') || 'ಎಲ್ಲವೂ ಪೂರ್ಣಗೊಂಡಿದೆ';
        spokenText = `ಇಂದು ತೆಗೆದುಕೊಂಡ ಔಷಧಗಳು: ${takenNames}. ಮುಂದಿನ ಬಾಕಿ ಔಷಧಗಳು: ${pendingNames}.`;
      } else if (language === 'hi') {
        const takenNames = takenMeds.map((m) => m.title).join(', ') || 'कोई नहीं';
        const pendingNames = pendingMeds.map((m) => `${m.title} (${m.time})`).join(', ') || 'सभी खुराक ले ली गई हैं';
        spokenText = `आज ली गई दवाइयां: ${takenNames}। अगली खुराक: ${pendingNames}।`;
      } else {
        const takenNames = takenMeds.map((m) => m.title).join(', ') || 'None yet';
        const pendingNames = pendingMeds.map((m) => `${m.title} at ${m.time}`).join(', ') || 'All taken';
        spokenText = `You have taken: ${takenNames}. Upcoming medicines: ${pendingNames}.`;
      }
    }
    // 7. Calling family / daughter / son / caregiver
    else if (
      msgLower.includes('call') ||
      msgLower.includes('phone') ||
      msgLower.includes('daughter') ||
      msgLower.includes('caregiver') ||
      msgLower.includes('ಕರೆ') ||
      msgLower.includes('ಫೋನ್') ||
      msgLower.includes('कॉल') ||
      msgLower.includes('फोन')
    ) {
      intent = 'call_contact';
      let contactName = 'Meera (Daughter)';
      let phone = '+91 98765 43210';

      if (msgLower.includes('caregiver') || msgLower.includes('priya') || msgLower.includes('ಆರೈಕೆದಾರ') || msgLower.includes('केयरगिवर')) {
        contactName = 'Priya Sharma (Caregiver)';
        phone = '+91 98450 12345';
      } else if (msgLower.includes('son') || msgLower.includes('rohit') || msgLower.includes('ಮಗ') || msgLower.includes('बेटा')) {
        contactName = 'Rohit (Son)';
        phone = '+91 98765 98765';
      } else if (msgLower.includes('wife') || msgLower.includes('sita') || msgLower.includes('ಹೆಂಡತಿ') || msgLower.includes('पत्नी')) {
        contactName = 'Sita (Wife)';
        phone = '+91 91234 56789';
      }

      action = 'call_contact';
      actionPayload = { contactName, phone };
      needsConfirmation = true;

      if (language === 'kn') {
        spokenText = `ಖಂಡಿತ. ನಿಮ್ಮ ${contactName} ಗೆ ನಾನು ಕರೆ ಮಾಡಬೇಕೆ?`;
        confirmationPrompt = `${contactName} ಗೆ ಕರೆ ಮಾಡಬೇಕೆ?`;
      } else if (language === 'hi') {
        spokenText = `बिल्कुल। क्या आप अपनी ${contactName} को कॉल करना चाहते हैं?`;
        confirmationPrompt = `क्या ${contactName} को कॉल करना है?`;
      } else {
        spokenText = `Of course. Would you like me to call your ${contactName}?`;
        confirmationPrompt = `Would you like to call ${contactName}?`;
      }
    }
    // 8. Relaxing music
    else if (
      msgLower.includes('music') ||
      msgLower.includes('song') ||
      msgLower.includes('play') ||
      msgLower.includes('ಸಂಗೀತ') ||
      msgLower.includes('ಹಾಡು') ||
      msgLower.includes('संगीत') ||
      msgLower.includes('गाना')
    ) {
      intent = 'play_music';
      action = 'open_music';
      actionPayload = { trackTitle: 'Peaceful Mind (Bamboo Flute)' };
      if (language === 'kn') {
        spokenText = `ಶಾಂತಿಯುತ ಬಿದಿರಿನ ಕೊಳಲಿನ ಸಂಗೀತವನ್ನು ಪ್ಲೇ ಮಾಡಲಾಗುತ್ತಿದೆ. ಆರಾಮವಾಗಿ ಆಲಿಸಿ.`;
      } else if (language === 'hi') {
        spokenText = `आपके लिए शांतिदायक बांसुरी का संगीत शुरू किया जा रहा है।`;
      } else {
        spokenText = `Playing peaceful flute melodies for you to relax.`;
      }
    }
    // 9. Breathing / Calm exercise
    else if (
      msgLower.includes('breath') ||
      msgLower.includes('breathing') ||
      msgLower.includes('calm') ||
      msgLower.includes('relax') ||
      msgLower.includes('ಉಸಿರಾಟ') ||
      msgLower.includes('ಶಾಂತ') ||
      msgLower.includes('सांस') ||
      msgLower.includes('प्राणायाम') ||
      msgLower.includes('शांत')
    ) {
      intent = 'breathing';
      action = 'open_breathing';
      if (language === 'kn') {
        spokenText = `ಮಾರ್ಗದರ್ಶಿತ ಉಸಿರಾಟದ ವ್ಯಾಯಾಮವನ್ನು ಪ್ರಾರಂಭಿಸಲಾಗುತ್ತಿದೆ. ದೀರ್ಘವಾಗಿ ಉಸಿರಾಡಿ.`;
      } else if (language === 'hi') {
        spokenText = `प्राणायाम और गहरी सांस लेने का अभ्यास शुरू किया जा रहा है।`;
      } else {
        spokenText = `Starting your gentle guided breathing exercise. Inhale calm, exhale tension.`;
      }
    }
    // 10. Photos / Memories
    else if (
      msgLower.includes('photo') ||
      msgLower.includes('photos') ||
      msgLower.includes('album') ||
      msgLower.includes('picture') ||
      msgLower.includes('memory') ||
      msgLower.includes('memories') ||
      msgLower.includes('ಫೋಟೋ') ||
      msgLower.includes('ನೆನಪುಗಳು') ||
      msgLower.includes('तस्वीर') ||
      msgLower.includes('फोटो') ||
      msgLower.includes('यादें')
    ) {
      intent = 'photos';
      action = 'open_photos';
      if (language === 'kn') {
        spokenText = `ನಿಮ್ಮ ಕುಟುಂಬದ ಫೋಟೋ ಆಲ್ಬಮ್ ಮತ್ತು ನೆನಪುಗಳನ್ನು ತೆರೆಯಲಾಗುತ್ತಿದೆ.`;
      } else if (language === 'hi') {
        spokenText = `आपके परिवार की तस्वीरें और खूबसूरत यादें खोली जा रही हैं।`;
      } else {
        spokenText = `Opening your family photo album and memories.`;
      }
    }
    // 11. Remind later / Snooze
    else if (
      msgLower.includes('remind me later') ||
      msgLower.includes('snooze') ||
      msgLower.includes('later') ||
      msgLower.includes('delay') ||
      msgLower.includes('ನಂತರ ನೆನಪಿಸು') ||
      msgLower.includes('बाद में याद दिलाना')
    ) {
      intent = 'remind_later';
      action = 'remind_task';
      if (nextTask) {
        actionPayload = { taskId: nextTask.id, taskTitle: nextTask.title };
      }
      if (language === 'kn') {
        spokenText = `ಖಂಡಿತ, ನಾನು ನಿಮಗೆ 15 ನಿಮಿಷಗಳ ನಂತರ ಮತ್ತೊಮ್ಮೆ ನೆನಪಿಸುತ್ತೇನೆ.`;
      } else if (language === 'hi') {
        spokenText = `ठीक है, मैं आपको 15 मिनट बाद दोबारा याद दिलाऊंगा।`;
      } else {
        spokenText = `Alright, I will remind you again in 15 minutes. Rest easy.`;
      }
    }
    // 12. How is my day / summary
    else if (
      msgLower.includes('how is my day') ||
      msgLower.includes('my day') ||
      msgLower.includes('summary') ||
      msgLower.includes('routine') ||
      msgLower.includes('ದಿನ ಹೇಗಿದೆ') ||
      msgLower.includes('दिन कैसा है')
    ) {
      intent = 'day_summary';
      const completedList = completedTasks.map((t) => t.title).join(', ');
      const nextTitle = nextTask ? `${nextTask.title} at ${nextTask.time}` : 'all completed';
      if (language === 'kn') {
        spokenText = `ನೀವು ಈಗಾಗಲೇ ${completedList || 'ಬೆಳಗಿನ ದಿನಚರಿ'} ಪೂರ್ಣಗೊಳಿಸಿದ್ದೀರಿ. ಮುಂದಿನ ಚಟುವಟಿಕೆ: ${nextTitle}. ನಿಮ್ಮ ದಿನ ಶಾಂತಿಯುತವಾಗಿದೆ!`;
      } else if (language === 'hi') {
        spokenText = `आपने सुबह ${completedList || 'की दिनचर्या'} पूरी कर ली है। अगली गतिविधि ${nextTitle} है। आपका दिन बहुत अच्छा जा रहा है!`;
      } else {
        spokenText = `You have completed your morning routine and breathing exercise. Your next activity is scheduled for ${nextTitle}. You are doing wonderful today!`;
      }
    }
    // 13. Dynamic Dual-Provider AI Reasoning (Gemini primary -> OpenRouter secondary)
    else {
      try {
        const systemPrompt = buildCompanionSystemPrompt({
          patient,
          tasks,
          activities: timeline.filter((t) => t.patientId === patient.id),
          moods: moods.filter((m) => m.patientId === patient.id),
          language
        });

        const { text } = await generateWithFallback(systemPrompt, message, 150);
        spokenText = text;
      } catch (err) {
        console.warn('[AI Companion Warning]', err);
      }
    }

    // Friendly fallback if still empty
    if (!spokenText) {
      if (language === 'kn') {
        spokenText = `ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ, ${firstName}. ನೀವು "ಮುಂದಿನ ಕೆಲಸವೇನು?", "ಔಷಧಿಗಳು", ಅಥವಾ "ಮಗಳಿಗೆ ಕರೆ ಮಾಡು" ಎಂದು ಕೇಳಬಹುದು.`;
      } else if (language === 'hi') {
        spokenText = `मैं आपकी मदद के लिए यहाँ हूँ, ${firstName} जी। आप मुझसे "अगला काम क्या है?", "मेरी दवाइयां", या "बेटी को कॉल करो" पूछ सकते हैं।`;
      } else {
        spokenText = `I am right here to help you, ${firstName}. You can ask me "What is my next task?", "What medicines do I take?", or "Call my daughter".`;
      }
    }

    res.json({
      success: true,
      data: {
        spokenText,
        detectedIntent: intent,
        action,
        actionPayload,
        needsConfirmation,
        confirmationPrompt,
        quickFollowUps: [
          language === 'kn' ? 'ಮುಂದಿನ ಕೆಲಸವೇನು? 🕒' : language === 'hi' ? 'अगला काम क्या है? 🕒' : 'What is my next task? 🕒',
          language === 'kn' ? 'ನನ್ನ ಔಷಧಗಳು 💊' : language === 'hi' ? 'मेरी दवाइयां 💊' : 'What medicines do I take? 💊',
          language === 'kn' ? 'ನನಗೆ ಗೊಂದಲವಾಗಿದೆ 🌿' : language === 'hi' ? 'मुझे भ्रम हो रहा है 🌿' : "I'm confused 🌿",
          language === 'kn' ? 'ಮಗಳಿಗೆ ಕರೆ ಮಾಡು 📞' : language === 'hi' ? 'बेटी को कॉल करो 📞' : 'Call my daughter 📞',
          language === 'kn' ? 'ಸಂಗೀತ ಪ್ಲೇ ಮಾಡು 🎵' : language === 'hi' ? 'संगीत बजाओ 🎵' : 'Play relaxing music 🎵',
          language === 'kn' ? 'ಉಸಿರಾಟದ ವ್ಯಾಯಾಮ 🧘' : language === 'hi' ? 'प्राणायाम शुरू करो 🧘' : 'Start breathing exercise 🧘'
        ]
      }
    });
  } catch (error: any) {
    console.error('[Voice Companion API Error]', error);
    res.status(500).json({ success: false, error: error.message || 'Internal error' });
  }
}

app.post('/api/voice-companion/chat', handleVoiceCompanionRequest);
app.post('/api/ai/companion', handleVoiceCompanionRequest);

// -------------------------------------------------------------
// AI Memory Lane Conversation Suggestion Endpoint
// -------------------------------------------------------------
app.post('/api/ai/memory-suggest', async (req: Request, res: Response) => {
  try {
    const { photoTitle = 'Family Photo', caption = '', date = '', tags = [], language = 'en' } = req.body;
    const prompts = await generateMemoryConversationPrompt(photoTitle, caption, date, tags, language);
    res.json({ success: true, data: { prompts } });
  } catch (error: any) {
    console.error('[AI Memory Suggest Error]', error);
    res.status(500).json({ success: false, error: error.message || 'Internal error' });
  }
});

// -------------------------------------------------------------
// AI Cognitive Game Adaptive Clue & Encouragement Endpoint
// -------------------------------------------------------------
app.post('/api/ai/cognitive-activity', async (req: Request, res: Response) => {
  try {
    const { gameType = 'memory', questionContext = '', userChoice = '', isCorrect = false, language = 'en' } = req.body;
    const hint = await generateCognitiveHint(gameType, questionContext, userChoice, isCorrect, language);
    res.json({ success: true, data: { hint } });
  } catch (error: any) {
    console.error('[AI Cognitive Activity Error]', error);
    res.status(500).json({ success: false, error: error.message || 'Internal error' });
  }
});

// -------------------------------------------------------------
// AI Grounded Caregiver Summary Endpoint
// -------------------------------------------------------------
app.post('/api/ai/caregiver-summary', async (req: Request, res: Response) => {
  try {
    const { patientId, reportType = 'daily', language = 'en' } = req.body;
    const patient = patients.find((p) => p.id === patientId) || patients[0];
    const patientTasks = tasks.filter((t) => t.patientId === patient.id);
    const patientTimeline = timeline.filter((t) => t.patientId === patient.id);
    const patientMoods = moods.filter((m) => m.patientId === patient.id);

    const summary = await generateCaregiverSummaryReport(
      patient,
      patientTasks,
      patientTimeline,
      patientMoods,
      reportType,
      language
    );

    res.json({ success: true, data: { summary, reportType, patientId: patient.id } });
  } catch (error: any) {
    console.error('[AI Caregiver Summary Error]', error);
    res.status(500).json({ success: false, error: error.message || 'Internal error' });
  }
});

// -------------------------------------------------------------
// Vite Middleware / Static Serving
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MindCare Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
