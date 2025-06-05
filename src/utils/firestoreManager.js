import { getFunctions, httpsCallable } from 'firebase/functions';

/**
 * Gets all collections and their document counts
 * @returns {Promise<Array>} Array of collection info objects
 */
export async function listAllCollections() {
  try {
    const functions = getFunctions();
    const listCollections = httpsCallable(functions, 'listCollections');
    const result = await listCollections();
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to list collections');
    }
    
    return result.data.collections;
  } catch (error) {
    console.error('Error listing collections:', error);
    throw new Error(`Failed to list collections: ${error.message}`);
  }
}

/**
 * Exports all documents from a collection
 * @param {string} collectionName - Name of collection to export
 * @returns {Promise<Array>} Array of document data
 */
export async function exportCollectionData(collectionName) {
  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  try {
    const functions = getFunctions();
    const exportCollection = httpsCallable(functions, 'exportCollection');
    const result = await exportCollection({ collectionName });
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to export collection');
    }
    
    return result.data.documents;
  } catch (error) {
    console.error(`Error exporting ${collectionName}:`, error);
    throw new Error(`Failed to export ${collectionName}: ${error.message}`);
  }
}

/**
 * Deletes all documents in a collection
 * @param {string} collectionName - Name of collection to clean
 * @returns {Promise<number>} Number of documents deleted
 */
export async function deleteCollectionData(collectionName) {
  if (!collectionName) {
    throw new Error('Collection name is required');
  }

  try {
    const functions = getFunctions();
    const deleteCollection = httpsCallable(functions, 'deleteCollection');
    const result = await deleteCollection({ collectionName });
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to delete collection');
    }
    
    return result.data.count;
  } catch (error) {
    console.error(`Error deleting ${collectionName}:`, error);
    throw new Error(`Failed to delete ${collectionName}: ${error.message}`);
  }
}

/**
 * Resets all Firestore data by deleting documents from all collections
 * @returns {Promise<Object>} Object containing counts of deleted documents per collection
 */
export async function resetAllData() {
  try {
    const functions = getFunctions();
    const resetData = httpsCallable(functions, 'resetAllData');
    const result = await resetData();
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to reset data');
    }
    
    return result.data.counts;
  } catch (error) {
    console.error('Error resetting all data:', error);
    throw new Error(`Failed to reset all data: ${error.message}`);
  }
}

/**
 * Soft deletes user data by marking documents as deleted instead of removing them
 * @param {string} userId - ID of user whose data to soft delete
 * @returns {Promise<Object>} Counts of affected documents
 */
export async function softDeleteUserData(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    const functions = getFunctions();
    const softDeleteUser = httpsCallable(functions, 'softDeleteUser');
    const result = await softDeleteUser({ userId });
    
    if (!result.data.success) {
      throw new Error(result.data.error || 'Failed to soft delete user data');
    }
    
    return result.data.counts;
  } catch (error) {
    console.error('Error soft deleting user data:', error);
    throw new Error(`Failed to soft delete user data: ${error.message}`);
  }
} 