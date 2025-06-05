import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Deletes all documents in a specified collection.
 * Only accessible to admin users (enforced by Cloud Functions).
 * 
 * @param {string} collectionName - The name of the collection to clean up
 * @returns {Promise<void>}
 */
export async function cleanupFirestoreData(collectionName) {
  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  try {
    const functions = getFunctions();
    const cleanupCollection = httpsCallable(functions, 'cleanupCollection');
    const result = await cleanupCollection({ collectionName });
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to clean up collection');
    }
    
    console.log(`Successfully cleaned up ${result.data.count} documents from ${collectionName}`);
  } catch (error) {
    console.error(`Error cleaning up ${collectionName}:`, error);
    throw new Error(`Failed to clean up ${collectionName}: ${error.message}`);
  }
} 