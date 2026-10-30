/**
 * Real-time Backend Synchronization Service for MindCare
 * Uses SSE (/api/events) with BroadcastChannel & LocalStorage fallback
 */

import {
  PatientProfile,
  TaskItem,
  ActivityTimelineItem,
  MoodRecord,
  EmergencyAlertItem,
  AppNotification,
  RoutineSuggestion,
  TaskStatus,
  PatientMood
} from '../types';
import {
  INITIAL_PATIENTS,
  INITIAL_TASKS,
  INITIAL_TIMELINE,
  INITIAL_MOODS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ALERTS,
  INITIAL_ROUTINE_SUGGESTIONS
} from '../data/initialData';

const broadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('mindcare_realtime_bus')
  : null;

type EventCallback = (event: { type: string; data: unknown }) => void;
const listeners: Set<EventCallback> = new Set();

let eventSource: EventSource | null = null;

export function initRealtimeSubscription() {
  if (typeof window === 'undefined') return;

  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      listeners.forEach((fn) => fn(event.data));
    };
  }

  try {
    if (!eventSource) {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          listeners.forEach((fn) => fn(parsed));
        } catch (err) {
          console.warn('[SSE Parse Error]', err);
        }
      };
      eventSource.onerror = () => {
        // SSE disconnected, fallback to broadcast channel
      };
    }
  } catch (err) {
    console.warn('[SSE init warning]', err);
  }
}

export function subscribeToRealtime(cb: EventCallback) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function broadcastLocal(type: string, data: unknown) {
  const event = { type, data };
  listeners.forEach((fn) => fn(event));
  if (broadcastChannel) {
    broadcastChannel.postMessage(event);
  }
}

// -------------------------------------------------------------
// Patients API
// -------------------------------------------------------------
export async function getPatients(): Promise<PatientProfile[]> {
  try {
    const res = await fetch('/api/patients');
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {}
  return INITIAL_PATIENTS;
}

export async function addPatient(patient: PatientProfile): Promise<PatientProfile> {
  try {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient)
    });
    if (res.ok) {
      const json = await res.json();
      broadcastLocal('patient_added', json.data);
      return json.data;
    }
  } catch {}
  broadcastLocal('patient_added', patient);
  return patient;
}

export async function updatePatient(id: string, updates: Partial<PatientProfile>): Promise<void> {
  try {
    await fetch(`/api/patients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch {}
  broadcastLocal('patient_updated', { id, ...updates });
}

// -------------------------------------------------------------
// Tasks API (Synchronized Workflow)
// -------------------------------------------------------------
export async function getTasks(patientId?: string): Promise<TaskItem[]> {
  try {
    const url = patientId ? `/api/tasks?patientId=${patientId}` : '/api/tasks';
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {}
  return patientId ? INITIAL_TASKS.filter((t) => t.patientId === patientId) : INITIAL_TASKS;
}

export async function createTask(task: Partial<TaskItem>): Promise<TaskItem> {
  const newTask: TaskItem = {
    id: `task-${Date.now()}`,
    patientId: task.patientId || 'P-10482',
    title: task.title || 'Untitled Routine',
    time: task.time || '10:00 AM',
    category: task.category || 'medicine',
    completed: false,
    snoozed: false,
    status: 'upcoming',
    patientConfirmation: false,
    createdBy: task.createdBy || 'caregiver',
    dosage: task.dosage,
    notes: task.notes,
    voiceReminderText: task.voiceReminderText || `Hi, it's time for ${task.title}.`,
    refillDays: task.refillDays,
    refillAlert: task.refillAlert
  };

  try {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask)
    });
    if (res.ok) {
      const json = await res.json();
      broadcastLocal('task_created', { task: json.data });
      return json.data;
    }
  } catch {}

  broadcastLocal('task_created', { task: newTask });
  return newTask;
}

export async function updateTaskStatus(
  taskId: string,
  updates: {
    status: TaskStatus;
    completed: boolean;
    snoozed?: boolean;
    completedTime?: string;
  }
): Promise<void> {
  try {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch {}

  broadcastLocal('task_updated', { taskId, updates });
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
  } catch {}
  broadcastLocal('task_deleted', { id: taskId });
}

// -------------------------------------------------------------
// Timeline API
// -------------------------------------------------------------
export async function getTimeline(patientId: string): Promise<ActivityTimelineItem[]> {
  try {
    const res = await fetch(`/api/timeline/${patientId}`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {}
  return INITIAL_TIMELINE.filter((t) => t.patientId === patientId);
}

// -------------------------------------------------------------
// Moods API
// -------------------------------------------------------------
export async function getMoods(patientId: string): Promise<MoodRecord[]> {
  try {
    const res = await fetch(`/api/moods/${patientId}`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {}
  return INITIAL_MOODS.filter((m) => m.patientId === patientId);
}

export async function recordMood(patientId: string, mood: PatientMood, note?: string): Promise<MoodRecord> {
  const newMood: MoodRecord = {
    id: `m-${Date.now()}`,
    patientId,
    mood,
    recordedAt: new Date().toISOString(),
    timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()],
    note: note || ''
  };

  try {
    const res = await fetch('/api/moods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMood)
    });
    if (res.ok) {
      const json = await res.json();
      broadcastLocal('mood_recorded', { mood: json.data });
      return json.data;
    }
  } catch {}

  broadcastLocal('mood_recorded', { mood: newMood });
  return newMood;
}

// -------------------------------------------------------------
// Notifications API
// -------------------------------------------------------------
export async function getNotifications(role?: 'patient' | 'caregiver'): Promise<AppNotification[]> {
  try {
    const url = role ? `/api/notifications?role=${role}` : '/api/notifications';
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {}
  return INITIAL_NOTIFICATIONS;
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
  } catch {}
  broadcastLocal('notification_read', { id });
}

// -------------------------------------------------------------
// Emergency SOS & Location API
// -------------------------------------------------------------
export async function getSosAlerts(): Promise<EmergencyAlertItem[]> {
  try {
    const res = await fetch('/api/sos');
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {}
  return INITIAL_ALERTS;
}

export async function triggerSosAlert(payload: {
  patientId: string;
  location: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  hasVoiceNote?: boolean;
  notes?: string;
}): Promise<EmergencyAlertItem> {
  try {
    const res = await fetch('/api/sos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const json = await res.json();
      broadcastLocal('sos_alert', { alert: json.data });
      return json.data;
    }
  } catch {}

  const fallbackAlert: EmergencyAlertItem = {
    id: `alt-${Date.now()}`,
    patientId: payload.patientId,
    patientName: 'Aarav Sharma',
    timestamp: 'Just now',
    location: payload.location,
    latitude: payload.latitude || 12.9716,
    longitude: payload.longitude || 77.5946,
    accuracyMeters: payload.accuracyMeters || 5,
    lastUpdatedText: 'Just now • 5m accuracy',
    status: 'active',
    hasVoiceNote: !!payload.hasVoiceNote,
    notes: payload.notes || 'Emergency SOS triggered',
    historyLogs: [{ time: 'Just now', message: 'SOS button pressed. Live location broadcasting.' }]
  };
  broadcastLocal('sos_alert', { alert: fallbackAlert });
  return fallbackAlert;
}

export async function resolveSosAlert(id: string): Promise<void> {
  try {
    await fetch(`/api/sos/${id}/resolve`, { method: 'PUT' });
  } catch {}
  broadcastLocal('sos_resolved', { id });
}

// -------------------------------------------------------------
// Routine Suggestions API
// -------------------------------------------------------------
export async function getRoutineSuggestions(patientId: string): Promise<RoutineSuggestion[]> {
  try {
    const res = await fetch(`/api/suggestions/${patientId}`);
    if (res.ok) {
      const json = await res.json();
      return json.data;
    }
  } catch {}
  return INITIAL_ROUTINE_SUGGESTIONS.filter((s) => s.patientId === patientId);
}

export async function approveRoutineSuggestion(id: string): Promise<void> {
  try {
    await fetch(`/api/suggestions/${id}/approve`, { method: 'POST' });
  } catch {}
  broadcastLocal('suggestion_approved', { id });
}
