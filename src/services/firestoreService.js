import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, where, getDocs, writeBatch } from 'firebase/firestore';

export const addEvent = async (userId, eventData) => {
  try {
    // Format the data properly
    const formattedData = {
      ...eventData,
      start: eventData.start instanceof Date ? eventData.start.toISOString() : eventData.start,
      end: eventData.end instanceof Date ? eventData.end.toISOString() : eventData.end,
      createdAt: serverTimestamp()
    };
    
    // Use addDoc to add to the events collection
    const eventsRef = collection(db, 'users', userId, 'events');
    return await addDoc(eventsRef, formattedData);
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
};

export const upsertCalendarEventsByGoogleId = async (userId, events) => {
  if (!userId || !Array.isArray(events)) return { upserted: 0, deleted: 0 };
  const eventsRef = collection(db, 'calendar_events');

  // Fetch existing events for user
  const existingSnap = await getDocs(query(eventsRef, where('owner', '==', userId)));
  const googleIdToRef = new Map();
  existingSnap.forEach((d) => {
    const data = d.data();
    if (data.googleId) googleIdToRef.set(data.googleId, d.ref);
  });

  const batch = writeBatch(db);
  const seen = new Set();
  let upserted = 0;

  events.forEach((e) => {
    const gid = e.googleId;
    if (!gid) return;
    seen.add(gid);
    const payload = {
      ...e,
      owner: userId,
      updatedAt: serverTimestamp(),
    };
    const existingRef = googleIdToRef.get(gid);
    if (existingRef) {
      batch.update(existingRef, payload);
    } else {
      batch.set(doc(eventsRef), payload);
    }
    upserted += 1;
  });

  // Delete events not present anymore
  let deleted = 0;
  existingSnap.forEach((d) => {
    const data = d.data();
    if (data.googleId && !seen.has(data.googleId)) {
      batch.delete(d.ref);
      deleted += 1;
    }
  });

  await batch.commit();
  return { upserted, deleted };
};

// Then use this in SchedulePage.jsx:
// import { addEvent } from '../services/firestoreService';
// ...
// In the event extraction logic:
// await addEvent(currentUser.uid, eventData); 