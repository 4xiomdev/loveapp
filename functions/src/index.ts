import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

const corsHandler = cors({ origin: true });

export const toggleDailyStatus = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated to toggle status');
  }

  try {
    const { habitId, date, done } = data;
    
    // Validate input
    if (!habitId || !date) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Get the habit document
    const habitRef = admin.firestore().collection('accountability').doc(habitId);
    const habitDoc = await habitRef.get();
    
    if (!habitDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Habit not found');
    }

    const habitData = habitDoc.data();
    if (!habitData) {
      throw new functions.https.HttpsError('internal', 'Invalid habit data');
    }

    // Check if user owns this habit
    if (habitData.owner !== context.auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'Not authorized to update this habit');
    }

    // Get or create daily status document
    const statusRef = admin.firestore().collection('dailyStatus').doc(`${habitId}_${date}_${context.auth.uid}`);
    const statusDoc = await statusRef.get();

    const batch = admin.firestore().batch();

    if (statusDoc.exists) {
      // Update existing status
      batch.update(statusRef, {
        done: done,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Create new status
      batch.set(statusRef, {
        habitId,
        date,
        done,
        owner: context.auth.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

    return { success: true };
  } catch (error) {
    console.error('Error toggling daily status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to toggle status');
  }
}); 