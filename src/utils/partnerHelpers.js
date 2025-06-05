import { doc, getDoc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';

/**
 * partnerHelpers.js
 *
 * This module contains helper functions for handling partner linking operations directly through Firestore.
 * Partner linking is now a one-time operation that immediately links all collections.
 */

/**
 * Links two users as partners by directly updating their documents and collections
 * @param {Firestore} db - Firestore database instance
 * @param {string} userId - Current user's ID
 * @param {string} partnerEmail - Partner's email
 */
export async function linkPartnerByEmail(db, userId, partnerEmail) {
  if (!userId || !partnerEmail) throw new Error('User ID and partner email are required');
  
  // Find partner by email
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', partnerEmail.trim()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    throw new Error('No user found with that email. Make sure your partner has created an account first.');
  }

  const partnerDoc = querySnapshot.docs[0];
  const partnerId = partnerDoc.id;
  const partnerData = partnerDoc.data();
  
  if (partnerId === userId) {
    throw new Error('You cannot link with yourself');
  }

  if (partnerData.partnerId) {
    throw new Error('This user is already linked with someone else');
  }

  const batch = writeBatch(db);
  
  // Update current user's document
  const userRef = doc(db, 'users', userId);
  batch.update(userRef, {
    partnerId: partnerId,
    settings: {
      mode: 'PARTNER',
      updatedAt: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  });
  
  // Update partner's document
  const partnerRef = doc(db, 'users', partnerId);
  batch.update(partnerRef, {
    partnerId: userId,
    settings: {
      mode: 'PARTNER',
      updatedAt: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  });

  await batch.commit();
  console.log('Successfully linked partners:', { userId, partnerId });
  return { partnerId, partnerData };
}

/**
 * Unlinks partners by directly updating their documents
 * @param {Firestore} db - Firestore database instance
 * @param {Object} user - Current user object
 * @param {Object} userData - Current user's data from Firestore
 */
export async function unlinkPartner(db, user, userData) {
  if (!user) throw new Error('Please sign in to unlink partner');
  if (!userData?.partnerId) throw new Error('No partner to unlink');
  
  const batch = writeBatch(db);
  
  // Update current user's document
  const userRef = doc(db, 'users', user.uid);
  batch.update(userRef, {
    partnerId: null,
    settings: {
      mode: 'SOLO',
      updatedAt: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  });
  
  // Update partner's document
  const partnerRef = doc(db, 'users', userData.partnerId);
  batch.update(partnerRef, {
    partnerId: null,
    settings: {
      mode: 'SOLO',
      updatedAt: serverTimestamp()
    },
    updatedAt: serverTimestamp()
  });
  
  await batch.commit();
  console.log('Successfully unlinked partners');
  return true;
}

/**
 * Checks if a user has a partner
 * @param {Firestore} db - Firestore database instance
 * @param {string} userId - User's ID to check
 * @returns {Promise<boolean>} - True if user has a partner
 */
export async function hasPartner(db, userId) {
  if (!userId) return false;
  
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) return false;
  
  return !!userDoc.data().partnerId;
}

/**
 * Logs the current state of the user and their partner for debugging purposes
 */
export async function debugPartnerState(db, userId, partnerEmail) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  const currentUserData = userDoc.data();

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('email', '==', partnerEmail.trim()));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    throw new Error('Partner email not found');
  }

  const partnerDoc = querySnapshot.docs[0];
  const partnerData = partnerDoc.data();

  console.log('Current User State:', {
    userId,
    partnerId: currentUserData.partnerId,
    mode: currentUserData.settings?.mode
  });

  console.log('Partner State:', {
    partnerId: partnerDoc.id,
    theirPartnerId: partnerData.partnerId,
    mode: partnerData.settings?.mode
  });

  return {
    currentUser: currentUserData,
    partner: { ...partnerData, uid: partnerDoc.id }
  };
} 