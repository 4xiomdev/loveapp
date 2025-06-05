# Maintenance Scripts

This directory contains utility scripts for maintaining and managing the LoveApp database.

## Active Scripts

- `maintenance.js` - General maintenance script for fixing user data
  - Ensures stars field exists and is a number
  - Sets up default settings if missing
  - Runs in batches to handle large datasets safely

- `check-user.js` - Utility to inspect a specific user's data
- `clean-database.js` - Cleans up test data and unused documents
- `inspect-users.js` - Lists all users and their basic information
- `setup-test-users.js` - Creates test users for development
- `fix-transactions.js` - Fixes transaction data format issues

## Archived Scripts

Old scripts that are no longer needed have been moved to the `archive` directory:

- `fix-users.js` - (Archived) Old script for fixing partner links and user modes
- `fix-settings.js` - (Archived) Old script for normalizing user settings

## Usage

Most scripts can be run directly with Node.js:

```bash
node maintenance.js
```

For scripts that require specific user IDs or other parameters, you can pass them as arguments:

```bash
node check-user.js <userId>
```

## Shell Scripts

- `clean-database.sh` - Wrapper script for database cleanup
- `fix-database.sh` - Legacy wrapper script (archived)

## Notes

- All scripts use Firebase Admin SDK and require a service account key
- Scripts are designed to run in batches to handle large datasets
- Always backup data before running maintenance scripts
- Check the console output for operation summaries and any errors 