const { initDatabase } = require('../config/db');

async function run() {
    console.log('--- Initializing Hotel Management Database ---');
    const success = await initDatabase();
    if (success) {
        console.log('✓ Database setup completed successfully!');
        process.exit(0);
    } else {
        console.error('✗ Database setup encountered errors. Check your MySQL configuration.');
        process.exit(1);
    }
}

run();
