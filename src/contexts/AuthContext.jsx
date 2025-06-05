// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db
} from '../firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  getDoc,
  query,
  collection,
  where,
  getDocs,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { CircularProgress, Box } from '@mui/material';
import { DEFAULT_USER_SETTINGS } from '../config/userConfig';
import { updateDocument } from '../utils/firebaseHelpers';
import { 
  linkPartnerByEmail,
  unlinkPartner as unlinkPartnerHelper,
  debugPartnerState as debugPartnerStateHelper 
} from '../utils/partnerHelpers';
import { cleanQuotedString } from '../utils/stringHelpers';

/**
 * AuthContext.jsx
 *
 * This context provides authentication and user data (from Firestore) to the app.
 * Partner operations are now handled directly through Firestore since this is a two-user app.
 */

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [partnerData, setPartnerData] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Helper to format error messages
  const formatError = (error) => {
    const errorMap = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account already exists with this email',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Please enter a valid email address',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'auth/popup-closed-by-user': 'Sign in was cancelled',
    };
    return errorMap[error.code] || error.message;
  };

  // Effect to watch user and partner data
  useEffect(() => {
    let unsubUser = null;
    let unsubPartner = null;
    let isMounted = true;

    const setupWatchers = async () => {
      if (!user?.uid) {
        if (isMounted) {
          setDataLoading(false);
          setUserData(null);
          setPartnerData(null);
        }
        return;
      }

      try {
        // Cleanup any existing subscriptions
        if (unsubUser) {
          unsubUser();
          unsubUser = null;
        }
        if (unsubPartner) {
          unsubPartner();
          unsubPartner = null;
        }

        // Watch the user's document
        const userRef = doc(db, 'users', user.uid);
        unsubUser = onSnapshot(userRef, 
          (docSnapshot) => {
            if (!isMounted) return;
            
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              setUserData({
                ...data,
                uid: user.uid
              });

              // Setup partner watcher only if partner ID changed
              if (data.partnerId && (!partnerData || partnerData.uid !== data.partnerId)) {
                console.log('Setting up partner document listener for:', data.partnerId);
                
                // Cleanup existing partner listener if exists
                if (unsubPartner) {
                  console.log('Cleaning up previous partner listener');
                  unsubPartner();
                  unsubPartner = null;
                }

                const partnerRef = doc(db, 'users', data.partnerId);
                unsubPartner = onSnapshot(partnerRef,
                  (partnerDoc) => {
                    if (!isMounted) return;
                    
                    if (partnerDoc.exists()) {
                      const partnerData = {
                        ...partnerDoc.data(),
                        uid: data.partnerId
                      };
                      console.log('Partner document updated:', {
                        partnerId: data.partnerId,
                        hasData: true,
                        mode: 'PARTNER'
                      });
                      setPartnerData(partnerData);
                    } else {
                      console.warn('Partner document does not exist');
                      setPartnerData(null);
                    }
                  },
                  (err) => {
                    console.error('Error watching partner document:', err);
                    if (isMounted) {
                      setError('Failed to watch partner updates');
                    }
                  }
                );
              } else if (!data.partnerId && partnerData) {
                // Clear partner data if no partner ID
                console.log('Clearing partner data');
                setPartnerData(null);
                if (unsubPartner) {
                  console.log('Cleaning up partner listener');
                  unsubPartner();
                  unsubPartner = null;
                }
              }
            } else {
              setUserData(null);
              setPartnerData(null);
              console.warn('User document does not exist');
            }
            
            if (isMounted) {
              setDataLoading(false);
            }
          },
          (err) => {
            console.error('Error watching user document:', err);
            if (isMounted) {
              setError('Failed to watch user updates');
              setDataLoading(false);
            }
          }
        );
      } catch (err) {
        console.error('Error setting up watchers:', err);
        if (isMounted) {
          setError('Failed to setup data watchers');
          setDataLoading(false);
        }
      }
    };

    setupWatchers();

    // Cleanup function
    return () => {
      console.log('Cleaning up watchers');
      isMounted = false;
      if (unsubUser) unsubUser();
      if (unsubPartner) unsubPartner();
    };
  }, [user?.uid]);

  // Create or update user document in Firestore
  const createUserDocument = async (user, additionalData = {}) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      // If document doesn't exist, create it
      if (!snapshot.exists()) {
        const { email, displayName, photoURL } = user;
        const defaultData = {
          email,
          displayName: displayName || additionalData.displayName || email.split('@')[0],
          photoURL,
          partnerId: null,
          stars: 0,
          settings: DEFAULT_USER_SETTINGS,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(userRef, defaultData);
        console.info('Created new user document for user:', user.uid);
        return defaultData;
      }

      return snapshot.data();
    } catch (error) {
      console.error('Error creating user document:', error);
      return {
        email: user.email,
        displayName: user.displayName || additionalData.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        partnerId: null,
        stars: 0,
        settings: DEFAULT_USER_SETTINGS
      };
    }
  };

  // Link with partner by email
  const handlePartnerLink = async (partnerEmail) => {
    if (!user) throw new Error('Please sign in to link with a partner');
    if (!partnerEmail) throw new Error('Please enter a partner email');

    try {
      await linkPartnerByEmail(db, user.uid, partnerEmail);
      console.log('Successfully linked with partner:', partnerEmail);
      return true;
    } catch (error) {
      console.error('Error linking partner:', error);
      throw error;
    }
  };

  // Unlink from partner
  const unlinkPartner = async () => {
    if (!user) throw new Error('Please sign in to unlink partner');
    if (!userData?.partnerId) throw new Error('No partner to unlink');

    try {
      await unlinkPartnerHelper(db, user, userData);
      console.log('Successfully unlinked from partner');
      return true;
    } catch (error) {
      console.error('Error unlinking partner:', error);
      throw error;
    }
  };

  // Award stars to partner (direct write)
  const awardPartnerStars = async (partnerId, starAmount) => {
    if (!user) throw new Error('Please sign in to award stars');
    if (!partnerId) throw new Error('No partner to award stars to');

    try {
      const partnerRef = doc(db, 'users', partnerId);
      await updateDoc(partnerRef, {
        stars: (partnerData?.stars || 0) + starAmount,
        updatedAt: serverTimestamp()
      });
      console.log('Successfully awarded stars to partner:', starAmount);
      return true;
    } catch (error) {
      console.error('Error awarding stars:', error);
      throw error;
    }
  };

  // Debug partner state
  const debugPartnerState = async (partnerEmail) => {
    return debugPartnerStateHelper(db, user.uid, partnerEmail);
  };

  // Update user settings
  const updateUserSettings = async (newSettings) => {
    if (!user) throw new Error('Please sign in to update settings');
    
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        settings: { ...userData.settings, ...newSettings },
        updatedAt: serverTimestamp()
      });
      console.log('Successfully updated user settings');
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // Sign in with email/password
  const signIn = async (email, password) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.info('User signed in:', result.user.uid);
      await createUserDocument(result.user);
      return result;
    } catch (error) {
      const message = formatError(error);
      console.error('Error in signIn:', error);
      setError(message);
      throw new Error(message);
    }
  };

  // Sign up with email/password
  const signUp = async (email, password, displayName) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.info('User signed up:', result.user.uid);
      await createUserDocument(result.user, { displayName });
      return result;
    } catch (error) {
      const message = formatError(error);
      console.error('Error in signUp:', error);
      setError(message);
      throw new Error(message);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setError(null);
      const result = await signInWithPopup(auth, provider);
      console.info('User signed in with Google:', result.user.uid);
      await createUserDocument(result.user);
      return result;
    } catch (error) {
      const message = formatError(error);
      console.error('Error in signInWithGoogle:', error);
      setError(message);
      throw new Error(message);
    }
  };

  // Auth state change listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Auth state changed:', user.uid);
        setUser(user);
      } else {
        console.log('User signed out');
        // Clear Google Calendar token on logout
        localStorage.removeItem('google_calendar_data');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Clear error state
  const clearError = () => setError(null);

  const value = {
    user,
    userData,
    partnerData,
    loading: loading || dataLoading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    handlePartnerLink,
    unlinkPartner,
    debugPartnerState,
    updateUserSettings,
    awardPartnerStars,
    clearError
  };

  if (loading || dataLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}