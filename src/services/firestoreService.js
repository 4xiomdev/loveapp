import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

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

// Then use this in SchedulePage.jsx:
// import { addEvent } from '../services/firestoreService';
// ...
// In the event extraction logic:
// await addEvent(currentUser.uid, eventData); 