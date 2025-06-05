#!/bin/bash

# Check if service account key exists
if [ ! -f "service-account-key.json" ]; then
    echo "Error: service-account-key.json not found in root directory"
    echo "Please follow the instructions in scripts/README.md to set up your service account key"
    exit 1
fi

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules/firebase-admin" ]; then
    echo "Installing dependencies..."
    npm install firebase-admin
fi

echo "Starting database fix process..."
echo "================================"

echo "Step 1: Fixing transactions..."
node scripts/fix-transactions.js
echo "--------------------------------"

echo "Step 2: Fixing user documents..."
node scripts/fix-users.js
echo "--------------------------------"

echo "Database fix process completed!" 