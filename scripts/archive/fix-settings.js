import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, '../service-account-key.json'), 'utf8')
);

// Initialize Firebase Admin
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixUserSettings(userId) {
  try {
    console.log(`\nFixing settings for user: ${userId}`);
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('User document does not exist');
      return;
    }

    const userData = userDoc.data();
    
    // Fix settings mode case
    if (userData.settings?.mode) {
      const newMode = userData.settings.mode.toUpperCase();
      if (newMode !== userData.settings.mode) {
        console.log(`Updating mode from ${userData.settings.mode} to ${newMode}`);
        await db.collection('users').doc(userId).update({
          'settings.mode': newMode,
          'settings.updatedAt': admin.firestore.FieldValue.serverTimestamp()
        });
        console.log('Settings updated successfully');
      } else {
        console.log('Settings mode already in correct case');
      }
    } else {
      console.log('Adding default settings');
      await db.collection('users').doc(userId).update({
        settings: {
          mode: userData.partnerId ? 'PARTNER' : 'SOLO',
          notifications: true,
          emailNotifications: true,
          calendarSync: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
      console.log('Default settings added');
    }

  } catch (error) {
    console.error('Error fixing user settings:', error);
  }
}

// Fix both users
const userIds = [
  'jrcvSNBqM7heB5QUm8XnUZ61SZ72',
  'cg1G0ZjTbta5zrmKFqe6x1gB0B63'
];

Promise.all(userIds.map(fixUserSettings)).then(() => {
  console.log('\nSettings fix completed');
  process.exit();
}); 