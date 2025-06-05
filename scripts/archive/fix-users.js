import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, '../service-account-key.json'), 'utf8')
);

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function validateAndFixPartnerLink(userId, partnerId, batch) {
  try {
    // Get both user documents
    const [userDoc, partnerDoc] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('users').doc(partnerId).get()
    ]);

    if (!userDoc.exists || !partnerDoc.exists) {
      console.warn(`One or both users not found: ${userId}, ${partnerId}`);
      return false;
    }

    const userData = userDoc.data();
    const partnerData = partnerDoc.data();

    // Check if the partner link is mutual and correct
    const userPartnerId = userData.partnerId?.replace(/['"]/g, '');
    const partnerPartnerId = partnerData.partnerId?.replace(/['"]/g, '');

    let needsUpdate = false;

    // Fix user's partnerId if needed
    if (userPartnerId !== partnerId) {
      console.log(`Fixing user ${userId}'s partnerId to ${partnerId}`);
      batch.update(userDoc.ref, {
        partnerId: partnerId,
        settings: {
          ...(userData.settings || {}),
          mode: 'PARTNER'
        }
      });
      needsUpdate = true;
    }

    // Fix partner's partnerId if needed
    if (partnerPartnerId !== userId) {
      console.log(`Fixing partner ${partnerId}'s partnerId to ${userId}`);
      batch.update(partnerDoc.ref, {
        partnerId: userId,
        settings: {
          ...(partnerData.settings || {}),
          mode: 'PARTNER'
        }
      });
      needsUpdate = true;
    }

    return needsUpdate;
  } catch (error) {
    console.error(`Error validating partner link for ${userId}:`, error);
    return false;
  }
}

async function fixUsers() {
  try {
    console.log('Starting user fix script...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    let batch = db.batch();
    let batchCount = 0;
    let fixedCount = 0;
    let partnerLinksFixed = 0;
    let orphanedLinksFixed = 0;
    
    // First pass: Fix basic fields and detect orphaned links
    const orphanedLinks = new Map(); // Track users with non-existent partner references
    const userDocs = new Map(); // Cache user docs for faster lookups
    
    for (const doc of usersSnapshot.docs) {
      userDocs.set(doc.id, doc);
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};
      
      // Ensure stars field exists and is a number
      if (typeof data.stars !== 'number') {
        needsUpdate = true;
        updates.stars = parseInt(data.stars) || 0;
      }

      // Clean up partnerId if it exists
      if (data.partnerId) {
        const cleanPartnerId = data.partnerId.replace(/['"]/g, '');
        // Check if partner exists
        if (!userDocs.has(cleanPartnerId)) {
          console.warn(`User ${doc.id} has non-existent partnerId: ${cleanPartnerId}`);
          orphanedLinks.set(doc.id, cleanPartnerId);
          updates.partnerId = null;
          updates['settings.mode'] = 'SOLO';
          needsUpdate = true;
        } else if (cleanPartnerId !== data.partnerId) {
          needsUpdate = true;
          updates.partnerId = cleanPartnerId;
        }
      }

      // Ensure settings exist and normalize mode case
      if (!data.settings) {
        needsUpdate = true;
        updates.settings = {
          mode: data.partnerId && !orphanedLinks.has(doc.id) ? 'PARTNER' : 'SOLO',
          notifications: true,
          emailNotifications: true,
          calendarSync: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
      } else {
        const settingsUpdates = {};
        let needsSettingsUpdate = false;

        // Normalize mode case and validate
        if (data.settings.mode) {
          const normalizedMode = data.settings.mode.toUpperCase();
          if (normalizedMode !== data.settings.mode || 
              !['SOLO', 'PARTNER'].includes(normalizedMode) ||
              (normalizedMode === 'PARTNER' && !data.partnerId) ||
              (normalizedMode === 'SOLO' && data.partnerId)) {
            settingsUpdates.mode = data.partnerId && !orphanedLinks.has(doc.id) ? 'PARTNER' : 'SOLO';
            needsSettingsUpdate = true;
          }
        } else {
          settingsUpdates.mode = data.partnerId && !orphanedLinks.has(doc.id) ? 'PARTNER' : 'SOLO';
          needsSettingsUpdate = true;
        }

        // Ensure other settings fields exist with defaults
        if (typeof data.settings.notifications !== 'boolean') {
          settingsUpdates.notifications = true;
          needsSettingsUpdate = true;
        }
        if (typeof data.settings.emailNotifications !== 'boolean') {
          settingsUpdates.emailNotifications = true;
          needsSettingsUpdate = true;
        }
        if (typeof data.settings.calendarSync !== 'boolean') {
          settingsUpdates.calendarSync = false;
          needsSettingsUpdate = true;
        }

        if (needsSettingsUpdate) {
          updates.settings = {
            ...data.settings,
            ...settingsUpdates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          needsUpdate = true;
        }
      }

      // Ensure invites array exists
      if (!Array.isArray(data.invites)) {
        needsUpdate = true;
        updates.invites = [];
      }

      if (needsUpdate) {
        batch.update(doc.ref, updates);
        fixedCount++;
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    // Log orphaned links that were fixed
    if (orphanedLinks.size > 0) {
      console.log('\nFixed orphaned partner links:');
      for (const [userId, partnerId] of orphanedLinks) {
        console.log(`- User ${userId} had invalid partnerId: ${partnerId}`);
      }
      orphanedLinksFixed = orphanedLinks.size;
    }

    // Commit any remaining updates from first pass
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
      batch = db.batch();
      batchCount = 0;
    }

    // Second pass: Fix partner links
    console.log('\nValidating partner links...');
    const processedPairs = new Set();

    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      const userId = doc.id;

      // Skip if no partnerId or already processed this pair
      if (!data.partnerId || processedPairs.has(userId) || orphanedLinks.has(userId)) {
        continue;
      }

      const cleanPartnerId = data.partnerId.replace(/['"]/g, '');
      processedPairs.add(userId);
      processedPairs.add(cleanPartnerId);

      const linkNeedsUpdate = await validateAndFixPartnerLink(userId, cleanPartnerId, batch);
      
      if (linkNeedsUpdate) {
        partnerLinksFixed++;
        batchCount += 2; // Two updates per link fix

        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} partner link updates`);
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    // Commit any remaining partner link updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} partner link updates`);
    }

    console.log(`\nFix Summary:`);
    console.log(`- Fixed ${fixedCount} user documents`);
    console.log(`- Fixed ${partnerLinksFixed} partner links`);
    console.log(`- Fixed ${orphanedLinksFixed} orphaned partner links`);
    console.log('User fix script completed successfully');
  } catch (error) {
    console.error('Error fixing users:', error);
  } finally {
    process.exit();
  }
}

fixUsers(); 