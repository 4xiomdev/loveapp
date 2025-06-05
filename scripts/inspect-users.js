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

async function inspectUsers() {
  try {
    console.log('\n=== User Documents Inspection ===\n');
    
    const usersSnapshot = await db.collection('users').get();
    const userDocs = new Map();
    
    // First pass: collect all user documents
    for (const doc of usersSnapshot.docs) {
      userDocs.set(doc.id, {
        id: doc.id,
        ...doc.data()
      });
    }

    // Second pass: analyze relationships
    for (const [userId, userData] of userDocs) {
      console.log(`\nUser: ${userId}`);
      console.log('----------------------------------------');
      console.log(`Display Name: ${userData.displayName || 'Not set'}`);
      console.log(`Stars: ${userData.stars !== undefined ? userData.stars : 'Not set'} (type: ${typeof userData.stars})`);
      console.log(`Settings: ${JSON.stringify(userData.settings || {}, null, 2)}`);
      
      if (userData.partnerId) {
        console.log('\nPartner Relationship:');
        console.log(`- Has partnerId: ${userData.partnerId}`);
        
        const partnerData = userDocs.get(userData.partnerId);
        if (partnerData) {
          console.log(`- Partner exists: Yes`);
          console.log(`- Partner's partnerId: ${partnerData.partnerId || 'Not set'}`);
          console.log(`- Mutual link: ${partnerData.partnerId === userId ? 'Yes ✅' : 'No ❌'}`);
          console.log(`- Partner's settings: ${JSON.stringify(partnerData.settings || {}, null, 2)}`);
        } else {
          console.log(`- Partner exists: No ❌ (Referenced partner document not found)`);
        }
      } else {
        console.log('\nNo partner linked');
      }
      
      // Check for any users linking to this user
      const linkedBy = Array.from(userDocs.values())
        .filter(doc => doc.partnerId === userId && doc.id !== userId);
      
      if (linkedBy.length > 0) {
        console.log('\nLinked by other users:');
        for (const doc of linkedBy) {
          console.log(`- User ${doc.id} (${doc.displayName || 'No name'})`);
        }
      }
      
      console.log('\nPotential Issues:');
      const issues = [];
      
      if (typeof userData.stars !== 'number') {
        issues.push('⚠️ stars field is not a number');
      }
      
      if (userData.partnerId && userData.partnerId.includes('"')) {
        issues.push('⚠️ partnerId contains quotes');
      }
      
      if (userData.partnerId && !userDocs.get(userData.partnerId)) {
        issues.push('⚠️ partnerId references non-existent user');
      }
      
      if (userData.partnerId && userDocs.get(userData.partnerId)?.partnerId !== userId) {
        issues.push('⚠️ partner link is not mutual');
      }
      
      if (!userData.settings) {
        issues.push('⚠️ missing settings object');
      } else if (userData.partnerId && userData.settings.mode !== 'PARTNER') {
        issues.push('⚠️ has partner but mode is not PARTNER');
      }
      
      if (issues.length === 0) {
        console.log('✅ No issues found');
      } else {
        issues.forEach(issue => console.log(issue));
      }
    }

  } catch (error) {
    console.error('Error inspecting users:', error);
  } finally {
    process.exit();
  }
}

inspectUsers(); 