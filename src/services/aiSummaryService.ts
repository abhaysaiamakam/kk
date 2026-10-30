import { PatientProfile, TaskItem, ActivityLog, MoodRecord, EmergencyAlertItem } from '../types';

export const aiSummaryService = {
  /**
   * Synthesize real patient data into a grounded clinical summary
   */
  generateGroundedSummary(params: {
    patient: PatientProfile;
    tasks: TaskItem[];
    activities: ActivityLog[];
    moods: MoodRecord[];
    alerts: EmergencyAlertItem[];
    summaryType: 'daily' | 'weekly' | 'missed' | 'medication' | 'mood';
  }): string {
    const { patient, tasks, activities, moods, alerts, summaryType } = params;

    // Check if real database data is available
    const totalRecords = tasks.length + activities.length + moods.length + alerts.length;
    if (totalRecords === 0) {
      return "Not enough patient activity data to generate a summary.";
    }

    const completedTasks = tasks.filter(t => t.completed);
    const missedTasks = tasks.filter(t => t.missed || t.status === 'missed');
    const upcomingTasks = tasks.filter(t => !t.completed && !t.missed && t.status !== 'missed');
    const activeAlerts = alerts.filter(a => a.status === 'active');
    const recentMood = moods.length > 0 ? moods[moods.length - 1] : null;

    if (summaryType === 'daily') {
      let text = `Daily Summary for ${patient.name}: `;
      if (activeAlerts.length > 0) {
        text += `🚨 Active SOS emergency reported. Caregiver assistance requested. `;
      }
      if (completedTasks.length > 0) {
        text += `${completedTasks.length} task(s)/medication(s) completed today (${completedTasks.map(t => t.title).join(', ')}). `;
      } else {
        text += `No tasks completed so far today. `;
      }
      if (missedTasks.length > 0) {
        text += `Attention: ${missedTasks.length} task(s) missed (${missedTasks.map(t => t.title).join(', ')}). `;
      }
      if (recentMood) {
        text += `Latest logged mood: ${recentMood.mood.replace('_', ' ')}${recentMood.note ? ` ("${recentMood.note}")` : ''}. `;
      }
      return text.trim();
    }

    if (summaryType === 'medication') {
      const medTasks = tasks.filter(t => t.category === 'medicine');
      if (medTasks.length === 0) {
        return `No medication schedules recorded for ${patient.name}.`;
      }
      const takenMeds = medTasks.filter(t => t.completed);
      const pendingMeds = medTasks.filter(t => !t.completed && !t.missed);
      let text = `Medication Status for ${patient.name}: `;
      text += `${takenMeds.length} of ${medTasks.length} medications taken today. `;
      if (takenMeds.length > 0) {
        text += `Completed: ${takenMeds.map(m => m.title).join(', ')}. `;
      }
      if (pendingMeds.length > 0) {
        text += `Pending: ${pendingMeds.map(m => `${m.title} at ${m.time}`).join(', ')}. `;
      }
      return text.trim();
    }

    if (summaryType === 'missed') {
      if (missedTasks.length === 0) {
        return `Excellent compliance for ${patient.name}! No missed tasks or medications recorded.`;
      }
      return `Missed Tasks for ${patient.name}: ${missedTasks.map(t => `${t.title} (${t.time})`).join(', ')}. Please verify with patient.`;
    }

    if (summaryType === 'mood') {
      if (moods.length === 0) {
        return `No mood records logged yet for ${patient.name}.`;
      }
      const moodCounts: Record<string, number> = {};
      moods.forEach(m => {
        moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1;
      });
      const topMood = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a])[0];
      return `Mood Breakdown for ${patient.name}: Total ${moods.length} entries recorded. Predominant state: ${topMood.replace('_', ' ')}. Latest entry: ${recentMood?.mood.replace('_', ' ')} on ${recentMood?.date || 'today'}.`;
    }

    if (summaryType === 'weekly') {
      return `Weekly Summary for ${patient.name}: ${completedTasks.length} total activities completed and ${missedTasks.length} missed. ${moods.length} mood check-ins recorded.`;
    }

    return `Patient Summary for ${patient.name}: ${completedTasks.length} completed tasks out of ${tasks.length} total scheduled tasks.`;
  }
};
