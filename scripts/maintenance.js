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

async function fixUserData() {
  try {
    console.log('Starting maintenance script...');
    
    const usersSnapshot = await db.collection('users').get();
    let batch = db.batch();
    let batchCount = 0;
    let fixedCount = 0;
    
    for (const doc of usersSnapshot.docs) {
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};
      
      // Ensure stars field exists and is a number
      if (typeof data.stars !== 'number') {
        needsUpdate = true;
        updates.stars = parseInt(data.stars) || 0;
      }

      // Ensure settings exist with defaults
      if (!data.settings) {
        needsUpdate = true;
        updates.settings = {
          notifications: true,
          emailNotifications: true,
          calendarSync: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
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

    // Commit any remaining updates
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} updates`);
    }

    console.log(`\nMaintenance Summary:`);
    console.log(`- Fixed ${fixedCount} user documents`);

  } catch (error) {
    console.error('Error in maintenance script:', error);
  }
}

// Run the maintenance script
fixUserData().then(() => {
  console.log('\nMaintenance completed');
  process.exit();
});

const fs = require('fs');
const path = require('path');

// Path to your index.html file
const indexPath = path.join(__dirname, '../build/index.html');
// Path to backup the original index.html
const backupPath = path.join(__dirname, '../build/index.original.html');
// Path to the maintenance page
const maintenancePath = path.join(__dirname, '../build/maintenance.html');

// Create a simple maintenance HTML
const maintenanceHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>404 - Page Not Found</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #121212;
      color: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 2rem;
    }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.2rem;
      opacity: 0.8;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>404 - Page Not Found</h1>
    <p>The page you are looking for is currently unavailable.</p>
  </div>
</body>
</html>
`;

// Check if we're enabling or disabling maintenance mode
const enableMaintenance = process.argv[2] === 'enable';

if (enableMaintenance) {
  console.log('Enabling maintenance mode...');
  
  // Backup the original index.html if it doesn't exist
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(indexPath, backupPath);
    console.log('Original index.html backed up.');
  }
  
  // Write the maintenance HTML to index.html
  fs.writeFileSync(indexPath, maintenanceHTML);
  console.log('Maintenance mode enabled. Deploy your site to apply changes.');
} else {
  console.log('Disabling maintenance mode...');
  
  // Restore the original index.html if backup exists
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, indexPath);
    console.log('Original index.html restored.');
  } else {
    console.error('Error: Backup file not found. Cannot restore original index.html.');
  }
  
  console.log('Maintenance mode disabled. Deploy your site to apply changes.');
} 