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
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'loveapp-16d8b'
  });
}

const db = admin.firestore();

async function setupTestUsers() {
  try {
    console.log('Setting up test users...');
    
    // Create user4 document
    await db.collection('users').doc('9unQKdjyGRahFN2qdBqwgwQOnxsL').set({
      email: 'user4@loveapp.com',
      displayName: 'user4',
      invites: [],
      settings: {
        mode: 'SOLO',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      stars: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created user4 document');

    // Create user3 document
    await db.collection('users').doc('y38023E0weVCcdNjM6RdKs6HeF5v').set({
      email: 'user3@loveapp.com',
      displayName: 'user3',
      invites: [],
      settings: {
        mode: 'SOLO',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      stars: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('Created user3 document');

    console.log('Test users setup completed successfully');
  } catch (error) {
    console.error('Error setting up test users:', error);
  } finally {
    process.exit();
  }
}

setupTestUsers(); 