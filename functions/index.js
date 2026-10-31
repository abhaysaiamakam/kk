const { createHash } = require('node:crypto');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { logger } = require('firebase-functions');

initializeApp();
const db = getFirestore();
const REGION = 'asia-south1';

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
  if (!patientId) return;
  const normalizedId = String(patientId).trim().toUpperCase();
  const snapshot = await db.collection('notificationDevices').where('patientId', '==', normalizedId).get();
  const recipients = snapshot.docs.filter((device) => {
    const data = device.data();
    return typeof data.token === 'string' && data.token.length > 0 && (!caregiverOnly || data.role === 'caregiver');
  });

  for (let start = 0; start < recipients.length; start += 500) {
    const batch = recipients.slice(start, start + 500);
    const response = await getMessaging().sendEachForMulticast({
      tokens: batch.map((device) => device.data().token),
      data: {
        title: toText(message.title, 'KeenKeep alert'),
        body: toText(message.body, 'Open KeenKeep to view the latest update.'),
        url: toText(message.url, '/'),
        tag: toText(message.tag, `keenkeep-${Date.now()}`)
      }
    });
    const stale = [];
    response.responses.forEach((result, index) => {
      if (!result.success && ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token'].includes(result.error?.code)) {
        stale.push(batch[index].ref);
      }
    });
    await Promise.all(stale.map((ref) => ref.delete()));
    logger.info('KeenKeep push batch sent', { patientId: normalizedId, successCount: response.successCount, failureCount: response.failureCount });
  }
}

exports.notifyOnTaskChange = onDocumentWritten({ document: 'tasks/{taskId}', region: REGION }, async (event) => {
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

exports.notifyOnSosChange = onDocumentWritten({ document: 'alerts/{alertId}', region: REGION }, async (event) => {
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
