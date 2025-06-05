import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { USER_MODES } from '../config/userConfig';

/**
 * Removes double quotes and escaped quotes from a string.
 * Returns null if the input is null or undefined.
 * Returns the original value if it's not a string.
 * 
 * @param {any} str - The value to clean
 * @returns {any} The cleaned string or original value
 */
function cleanQuotedString(str) {
  if (str == null) return null;
  if (typeof str !== 'string') return str;
  return str.replace(/^["']|["']$/g, '').replace(/\\["']/g, '');
}

/**
 * usePartnerData.js
 * 
 * A custom hook that provides real-time updates for partner data.
 * This hook:
 * 1. Listens to the partner's user document when userData.partnerId exists
 * 2. Provides loading and error states for better UX
 * 3. Cleans up listeners when unmounting or when partnerId changes
 * 4. Only reads data, never writes directly to partner document
 * 
 * @returns {Object} { partnerData, loading, error }
 */
export function usePartnerData() {
  const { userData } = useAuth();
  const [partnerData, setPartnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let unsubscribe = null;
    let isMounted = true;

    const setupPartnerListener = async () => {
      // Reset states when partnerId changes
      setPartnerData(null);
      setError(null);
      setLoading(true);

      if (!userData?.partnerId) {
        setLoading(false);
        return;
      }

      try {
        console.log('Setting up partner document listener for:', userData.partnerId);
        
        const partnerDocRef = doc(db, 'users', userData.partnerId);
        unsubscribe = onSnapshot(
          partnerDocRef,
          {
            // Include metadata to detect local writes vs server updates
            includeMetadataChanges: true
          },
          (docSnap) => {
            if (!isMounted) return;

            if (docSnap.exists()) {
              // Only process if this is a server update or first load
              if (!docSnap.metadata.hasPendingWrites) {
                const data = docSnap.data();
                
                // Only expose necessary partner fields
                const sanitizedData = {
                  uid: userData.partnerId,
                  displayName: data.displayName,
                  email: data.email,
                  photoURL: data.photoURL,
                  settings: {
                    mode: data.settings?.mode
                  },
                  // Add any other fields needed for UI
                };

                console.log('Partner document updated:', {
                  partnerId: userData.partnerId,
                  hasData: true,
                  mode: sanitizedData.settings?.mode
                });

                setPartnerData(sanitizedData);
                setError(null);
              }
            } else {
              console.log('No partner document found for:', userData.partnerId);
              setPartnerData(null);
              setError('Partner document not found');
            }
            setLoading(false);
          },
          (error) => {
            console.error('Error in partner document listener:', error);
            setError('Failed to fetch partner data');
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up partner listener:', error);
        setError('Failed to setup partner listener');
        setLoading(false);
      }
    };

    setupPartnerListener();

    return () => {
      console.log('Cleaning up partner listener');
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [userData?.partnerId]); // Only re-run if partnerId changes

  return { partnerData, loading, error };
} 