import { updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Updates a document with the provided updates object.
 * Logs an error and throws if update fails.
 * @param {DocumentReference} docRef - The Firestore document reference to update
 * @param {Object} updates - The update object
 * @param {String} errorMessage - Custom error message to log
 */
export async function updateDocument(docRef, updates, errorMessage = 'Failed to update document') {
  try {
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
}

/**
 * Returns a Firestore server timestamp
 */
export function getTimestamp() {
  return serverTimestamp();
} 