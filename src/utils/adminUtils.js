import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';

/**
 * Sets up the first admin user in the system
 * @returns {Promise<Object>} Result of the operation
 */
export const setupFirstAdmin = async () => {
  try {
    const auth = getAuth();
    if (!auth.currentUser) {
      throw new Error('You must be signed in to perform this action');
    }

    const functions = getFunctions(undefined, 'us-central1');
    const setupFirstAdminFunction = httpsCallable(functions, 'setupFirstAdmin');
    const result = await setupFirstAdminFunction();
    
    return result.data;
  } catch (error) {
    console.error('Error setting up admin:', error);
    
    // Handle Firebase errors
    if (error.code === 'functions/unauthenticated') {
      throw new Error('You must be signed in to perform this action');
    }
    if (error.code === 'functions/permission-denied') {
      throw new Error('You do not have permission to perform this action');
    }
    if (error.code === 'functions/not-found') {
      throw new Error('User document not found. Please ensure the user exists');
    }
    
    // For all other errors, use the error message if available
    throw new Error(error.message || 'An unknown error occurred while setting up admin');
  }
};

/**
 * Sets or removes admin privileges for a user
 * @param {string} uid - The user ID to modify
 * @param {boolean} isAdmin - Whether to grant or remove admin privileges
 * @returns {Promise<Object>} Result of the operation
 */
export async function setUserAdmin(uid, isAdmin) {
  try {
    const functions = getFunctions(undefined, 'us-central1');
    const setAdminFn = httpsCallable(functions, 'setAdmin');
    const result = await setAdminFn({ uid, isAdmin });
    return result.data;
  } catch (error) {
    console.error('Error setting admin status:', error);
    throw new Error(error.message || 'An unknown error occurred while setting admin status');
  }
} 