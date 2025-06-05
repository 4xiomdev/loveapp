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

// Collections to clean
const COLLECTIONS_TO_CLEAN = [
  'users',
  'transactions',
  'messages',
  'coupons',
  'accountability',
  'dailyStatus',
  'reminders',
  'moods',
  'admin'
];

async function deleteCollection(collectionName) {
  console.log(`\nDeleting collection: ${collectionName}`);
  const snapshot = await db.collection(collectionName).get();
  
  if (snapshot.empty) {
    console.log(`- Collection ${collectionName} is already empty`);
    return 0;
  }

  const batch = db.batch();
  let count = 0;
  let totalDeleted = 0;

  for (const doc of snapshot.docs) {
    batch.delete(doc.ref);
    count++;
    totalDeleted++;

    // Firestore batches are limited to 500 operations
    if (count >= 500) {
      await batch.commit();
      console.log(`- Deleted batch of ${count} documents`);
      count = 0;
    }
  }

  // Commit any remaining deletes
  if (count > 0) {
    await batch.commit();
    console.log(`- Deleted final batch of ${count} documents`);
  }

  return totalDeleted;
}

async function cleanDatabase() {
  try {
    console.log('Starting database cleanup...');
    console.log('WARNING: This will delete all data from the database!');
    console.log('Collections to clean:', COLLECTIONS_TO_CLEAN.join(', '));
    
    const stats = {};
    let totalDeleted = 0;

    for (const collection of COLLECTIONS_TO_CLEAN) {
      const deleted = await deleteCollection(collection);
      stats[collection] = deleted;
      totalDeleted += deleted;
    }

    console.log('\nCleanup Summary:');
    console.log('----------------------------------------');
    for (const [collection, count] of Object.entries(stats)) {
      console.log(`${collection}: ${count} documents deleted`);
    }
    console.log('----------------------------------------');
    console.log(`Total documents deleted: ${totalDeleted}`);
    console.log('\nDatabase cleanup completed successfully!');
    console.log('\nYou can now create new users and test the linking process.');

  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    process.exit();
  }
}

// Add a confirmation prompt
if (process.argv.includes('--confirm')) {
  cleanDatabase();
} else {
  console.log('\n⚠️  WARNING: This script will delete ALL data from your database!');
  console.log('To proceed, run the script with --confirm flag:');
  console.log('node scripts/clean-database.js --confirm');
  process.exit(1);
} 