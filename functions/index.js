const { createHash } = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { defineSecret } = require('firebase-functions/params');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { logger } = require('firebase-functions');

initializeApp();
const db = getFirestore();
const REGION = 'asia-south1';
const oneSignalApiKey = defineSecret('ONESIGNAL_REST_API_KEY');

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.slice(0, 300) : fallback;
}

async function claimEvent(eventId) {
  const id = createHash('sha256').update(eventId).digest('hex');
  const ref = db.collection('pushEvents').doc(id);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) return false;
    tx.create(ref, { createdAt: FieldValue.serverTimestamp() });
    return true;
  });
}

async function sendToPatientDevices(patientId, message, caregiverOnly = false) {
  if (!patientId) return 0;
  const appId = process.env.ONESIGNAL_APP_ID;
  const apiKey = oneSignalApiKey.value();
  if (!appId || !apiKey) throw new Error('OneSignal is not configured. Set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY before deploying push functions.');
  const normalizedId = String(patientId).trim().toUpperCase();
  const snapshot = await db.collection('notificationDevices').where('patientId', '==', normalizedId).get();
  const externalIds = [...new Set(snapshot.docs.filter((device) => {
    const data = device.data();
    return typeof data.uid === 'string' && data.uid.length > 0 &&
      data.onesignalExternalId === data.uid && (!caregiverOnly || data.role === 'caregiver');
  }).map((device) => device.data().onesignalExternalId))];

  if (externalIds.length === 0) {
    logger.info('No registered KeenKeep devices for push event', { patientId: normalizedId });
    return 0;
  }

  let accepted = 0;
  for (let start = 0; start < externalIds.length; start += 20000) {
    const batch = externalIds.slice(start, start + 20000);
    const response = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `Key ${apiKey}`
      },
      body: JSON.stringify({
        app_id: appId,
        target_channel: 'push',
        include_aliases: { external_id: batch },
        headings: { en: toText(message.title, 'KeenKeep alert') },
        contents: { en: toText(message.body, 'Open KeenKeep to view the latest update.') },
        url: toText(message.url, 'https://kk-nine-beta.vercel.app/')
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.error('OneSignal rejected KeenKeep push', { patientId: normalizedId, status: response.status, result });
      throw new Error(`OneSignal request failed with HTTP ${response.status}`);
    }
    if (result.errors?.length) {
      logger.error('OneSignal reported push errors', { patientId: normalizedId, errors: result.errors });
      throw new Error('OneSignal reported delivery request errors.');
    }
    // OneSignal accepts the send request asynchronously; a returned message ID
    // means accepted for processing, not a guarantee that the OS displayed it.
    if (result.id) accepted += batch.length;
    logger.info('KeenKeep OneSignal push accepted', { patientId: normalizedId, recipientCount: batch.length, messageId: result.id || null, recipients: result.recipients ?? null });
  }
  return accepted;
}

// Runs independently of the browser, so reminders still fire when KeenKeep is closed.
exports.sendDueTaskReminders = onSchedule({
  schedule: 'every 1 minutes',
  timeZone: 'Asia/Kolkata',
  region: REGION,
  memory: '256MiB',
  secrets: [oneSignalApiKey]
}, async () => {
  const now = new Date();
  const nowIso = now.toISOString();
  const earliestOnTime = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const dueTasks = await db.collection('tasks')
    .where('reminderStatus', '==', 'pending')
    .where('dueAt', '<=', nowIso)
    .orderBy('dueAt')
    .limit(100)
    .get();

  for (const taskDoc of dueTasks.docs) {
    const task = taskDoc.data();
    const dueAt = task.dueAt;
    const taskRef = taskDoc.ref;

    if (typeof dueAt !== 'string' || dueAt < earliestOnTime) {
      await db.runTransaction(async (tx) => {
        const current = await tx.get(taskRef);
        if (current.exists && current.data().reminderStatus === 'pending' && current.data().dueAt === dueAt) {
          tx.update(taskRef, { reminderStatus: 'expired', reminderUpdatedAt: FieldValue.serverTimestamp() });
        }
      });
      continue;
    }

    const claimed = await db.runTransaction(async (tx) => {
      const current = await tx.get(taskRef);
      if (!current.exists) return false;
      const latest = current.data();
      if (latest.reminderStatus !== 'pending' || latest.dueAt !== dueAt || latest.completed === true || latest.status === 'completed') return false;
      tx.update(taskRef, { reminderStatus: 'sending', reminderClaimedAt: FieldValue.serverTimestamp() });
      return true;
    });
    if (!claimed) continue;

    try {
      const delivered = await sendToPatientDevices(task.patientId, {
        title: 'Task reminder',
        body: `${toText(task.title, 'Your care task')} is scheduled now.`,
        tag: `task-reminder-${taskDoc.id}`
      });
      await db.runTransaction(async (tx) => {
        const current = await tx.get(taskRef);
        if (!current.exists) return;
        const latest = current.data();
        // Preserve a new pending reminder if a caregiver rescheduled during delivery.
        if (latest.reminderStatus === 'sending' && latest.dueAt === dueAt) {
          tx.update(taskRef, {
            reminderStatus: delivered > 0 ? 'sent' : 'no_devices',
            reminderSentAt: FieldValue.serverTimestamp(),
            reminderUpdatedAt: FieldValue.serverTimestamp()
          });
        }
      });
    } catch (error) {
      logger.error('Due task push failed; it will be retried', { taskId: taskDoc.id, error });
      await db.runTransaction(async (tx) => {
        const current = await tx.get(taskRef);
        if (current.exists && current.data().reminderStatus === 'sending' && current.data().dueAt === dueAt) {
          tx.update(taskRef, { reminderStatus: 'pending', reminderUpdatedAt: FieldValue.serverTimestamp() });
        }
      });
    }
  }
});

exports.notifyOnTaskChange = onDocumentWritten({ document: 'tasks/{taskId}', region: REGION, secrets: [oneSignalApiKey] }, async (event) => {
  const before = event.data?.before.exists ? event.data.before.data() : null;
  const after = event.data?.after.exists ? event.data.after.data() : null;
  const task = after || before;
  if (!task?.patientId || !(await claimEvent(event.id))) return;

  const title = toText(task.title, 'Care task');
  let notification;
  if (!before && after) {
    notification = { title: 'New care task', body: `${title} is scheduled for ${toText(after.time || after.dueTime, 'the care plan')}.` };
  } else if (before && !after) {
    notification = { title: 'Task removed', body: `${title} was removed from the care schedule.` };
  } else if ((before.status !== after.status || before.completed !== after.completed) && (after.status === 'completed' || after.completed === true)) {
    notification = { title: 'Task completed', body: `${title} was marked complete.` };
  } else if (before.time !== after.time || before.dueTime !== after.dueTime || before.dueDate !== after.dueDate) {
    notification = { title: 'Task schedule changed', body: `${title} is now scheduled for ${toText(after.time || after.dueTime, 'an updated time')}${after.dueDate ? ` on ${toText(after.dueDate)}` : ''}.` };
  } else if (before.title !== after.title || before.description !== after.description || before.status !== after.status || before.priority !== after.priority) {
    notification = { title: 'Task updated', body: `There is an update to ${title}.` };
  }
  if (notification) await sendToPatientDevices(task.patientId, { ...notification, tag: `task-${event.params.taskId}` });
});

exports.notifyOnSosChange = onDocumentWritten({ document: 'alerts/{alertId}', region: REGION, secrets: [oneSignalApiKey] }, async (event) => {
  const before = event.data?.before.exists ? event.data.before.data() : null;
  const after = event.data?.after.exists ? event.data.after.data() : null;
  const alert = after || before;
  if (!alert?.patientId || !(await claimEvent(event.id))) return;

  if (!before && after?.status === 'active') {
    const name = toText(after.patientName, 'A patient');
    await sendToPatientDevices(alert.patientId, {
      title: 'Emergency SOS',
      body: `${name} needs help. Open KeenKeep to view the alert and location.`,
      tag: `sos-${event.params.alertId}`
    }, true);
  } else if (before?.status !== 'resolved' && after?.status === 'resolved') {
    await sendToPatientDevices(alert.patientId, {
      title: 'SOS resolved',
      body: `${toText(after.patientName, 'The patient')}’s emergency was marked resolved.`,
      tag: `sos-${event.params.alertId}`
    }, true);
  }
});
