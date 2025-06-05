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
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixTransactions() {
  try {
    console.log('Starting transaction fix script...');
    
    // Get all transactions
    const transactionsSnapshot = await db.collection('transactions').get();
    const batch = db.batch();
    let batchCount = 0;
    let fixedCount = 0;
    
    for (const doc of transactionsSnapshot.docs) {
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};
      
      // Check for participants array
      if (!data.participants || !Array.isArray(data.participants)) {
        needsUpdate = true;
        // If we have from/to fields, use those to create participants
        if (data.from && data.to) {
          updates.participants = [data.from, data.to].sort();
        } else if (data.from) {
          updates.participants = [data.from];
        } else if (data.to) {
          updates.participants = [data.to];
        } else {
          console.warn(`Transaction ${doc.id} has no from/to fields to create participants array`);
          continue;
        }
      }

      // Ensure createdAt exists
      if (!data.createdAt) {
        needsUpdate = true;
        updates.createdAt = admin.firestore.FieldValue.serverTimestamp();
      }

      // Ensure type field exists
      if (!data.type) {
        needsUpdate = true;
        updates.type = 'STAR_TRANSACTION';
      }

      // Fix amount if it's not a number
      if (typeof data.amount !== 'number') {
        needsUpdate = true;
        updates.amount = parseInt(data.amount) || 1;
      }

      if (needsUpdate) {
        batch.update(doc.ref, updates);
        fixedCount++;
        batchCount++;

        // Commit batch when it reaches 500 operations
        if (batchCount >= 500) {
          await batch.commit();
          console.log(`Committed batch of ${batchCount} updates`);
          batch = db.batch();
          batchCount = 0;
        }
      }
    }

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }

    console.log(`Fixed ${fixedCount} transactions`);
    console.log('Transaction fix script completed successfully');
  } catch (error) {
    console.error('Error fixing transactions:', error);
  } finally {
    process.exit();
  }
}

fixTransactions(); 