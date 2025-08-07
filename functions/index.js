const admin = require('firebase-admin');
const { onCall, HttpsError } = require('firebase-functions/v2/https');

// Initialize Admin SDK once
try {
  admin.app();
} catch (e) {
  admin.initializeApp();
}

// Region selection to reduce latency and cold starts
const regionOption = { region: 'us-central1' };

// Callable: Toggle reminder completed status with ownership enforcement
exports.toggleReminder = onCall(regionOption, async (request) => {
  const { auth, data } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const { reminderId, completed } = data || {};
  if (!reminderId || typeof completed !== 'boolean') {
    throw new HttpsError('invalid-argument', 'reminderId and completed are required');
  }

  try {
    const reminderRef = admin.firestore().collection('reminders').doc(reminderId);
    const snap = await reminderRef.get();
    if (!snap.exists) {
      throw new HttpsError('not-found', 'Reminder not found');
    }

    const reminder = snap.data();
    if (reminder.owner !== auth.uid) {
      throw new HttpsError('permission-denied', 'Not authorized to modify this reminder');
    }

    await reminderRef.update({
      completed,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (err) {
    console.error('toggleReminder error:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', 'Failed to toggle reminder');
  }
});

// Callable: Create, update, delete reminders with ownership checks
exports.createReminder = onCall(regionOption, async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Auth required');
  const { title, description = '', category = 'personal', date } = data || {};
  if (!title || !date) throw new HttpsError('invalid-argument', 'title and date are required');
  const ref = admin.firestore().collection('reminders').doc();
  await ref.set({
    title: String(title).trim(),
    description: String(description).trim(),
    category,
    date,
    owner: auth.uid,
    participants: [auth.uid],
    completed: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true, id: ref.id };
});

exports.updateReminder = onCall(regionOption, async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Auth required');
  const { id, title, description, category, date } = data || {};
  if (!id) throw new HttpsError('invalid-argument', 'id is required');
  const ref = admin.firestore().collection('reminders').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Reminder not found');
  if (snap.data().owner !== auth.uid) throw new HttpsError('permission-denied', 'Not allowed');
  const updates = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  if (title != null) updates.title = String(title).trim();
  if (description != null) updates.description = String(description).trim();
  if (category != null) updates.category = category;
  if (date != null) updates.date = date;
  await ref.update(updates);
  return { success: true };
});

exports.deleteReminder = onCall(regionOption, async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Auth required');
  const { id } = data || {};
  if (!id) throw new HttpsError('invalid-argument', 'id is required');
  const ref = admin.firestore().collection('reminders').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Reminder not found');
  if (snap.data().owner !== auth.uid) throw new HttpsError('permission-denied', 'Not allowed');
  await ref.delete();
  return { success: true };
});

// Callable: Stars and ledger atomic operations
exports.awardStars = onCall(regionOption, async (request) => {
  const { auth, data } = request;
  if (!auth) throw new HttpsError('unauthenticated', 'Auth required');
  const { toUserId, amount, reason, category } = data || {};
  if (!toUserId || typeof amount !== 'number') {
    throw new HttpsError('invalid-argument', 'toUserId and amount are required');
  }
  const db = admin.firestore();
  const partnerRef = db.collection('users').doc(toUserId);
  const txRef = db.collection('transactions').doc();

  await db.runTransaction(async (t) => {
    const partnerSnap = await t.get(partnerRef);
    if (!partnerSnap.exists) throw new HttpsError('not-found', 'Recipient not found');
    const currentStars = Number(partnerSnap.data()?.stars || 0);
    t.update(partnerRef, {
      stars: currentStars + amount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    t.set(txRef, {
      from: auth.uid,
      to: toUserId,
      amount,
      reason: reason || null,
      category: category || null,
      type: 'AWARD',
      participants: [auth.uid, toUserId],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  return { success: true };
});

// Callable: Toggle daily habit status (ported from TS implementation)
exports.toggleDailyStatus = onCall(regionOption, async (request) => {
  const { auth, data } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated to toggle status');
  }

  try {
    const { habitId, date, done } = data || {};
    if (!habitId || !date || typeof done !== 'boolean') {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }

    const habitRef = admin.firestore().collection('accountability').doc(habitId);
    const habitDoc = await habitRef.get();
    if (!habitDoc.exists) {
      throw new HttpsError('not-found', 'Habit not found');
    }

    const habitData = habitDoc.data();
    if (!habitData || habitData.owner !== auth.uid) {
      throw new HttpsError('permission-denied', 'Not authorized to update this habit');
    }

    const statusRef = admin.firestore().collection('dailyStatus').doc(`${habitId}_${date}_${auth.uid}`);
    const statusDoc = await statusRef.get();
    const batch = admin.firestore().batch();

    if (statusDoc.exists) {
      batch.update(statusRef, {
        done,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      batch.set(statusRef, {
        habitId,
        date,
        done,
        owner: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    return { success: true };
  } catch (err) {
    console.error('toggleDailyStatus error:', err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', 'Failed to toggle status');
  }
});