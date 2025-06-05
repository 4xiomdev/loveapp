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

async function checkUser(userId) {
  try {
    console.log(`\nChecking user: ${userId}`);
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('User document does not exist');
      return;
    }

    const userData = userDoc.data();
    console.log('\nUser Data:');
    console.log(JSON.stringify(userData, null, 2));

    // Check invites array
    if (!userData.invites) {
      console.log('\nNo invites array found - Adding empty invites array');
      await db.collection('users').doc(userId).update({
        invites: []
      });
      console.log('Added empty invites array');
    }

    // Check settings
    if (!userData.settings) {
      console.log('\nNo settings object found - Adding default settings');
      await db.collection('users').doc(userId).update({
        settings: {
          mode: userData.partnerId ? 'PARTNER' : 'SOLO',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      });
      console.log('Added default settings');
    }

  } catch (error) {
    console.error('Error checking user:', error);
  }
}

// Check both users
const userIds = [
  'jrcvSNBqM7heB5QUm8XnUZ61SZ72',
  'cg1G0ZjTbta5zrmKFqe6x1gB0B63'
];

Promise.all(userIds.map(checkUser)).then(() => {
  console.log('\nCheck completed');
  process.exit();
}); 