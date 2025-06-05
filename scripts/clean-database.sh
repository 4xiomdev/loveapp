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

# Show warning and ask for confirmation
echo "⚠️  WARNING: This will delete ALL data from your database!"
echo "This includes:"
echo "- All user accounts"
echo "- All transactions"
echo "- All messages"
echo "- All coupons"
echo "- All accountability tasks"
echo "- All mood entries"
echo "- All reminders"
echo "- All admin settings"
echo ""
read -p "Are you sure you want to proceed? (yes/no) " answer

if [ "$answer" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

echo "Starting database cleanup..."
node scripts/clean-database.js --confirm 