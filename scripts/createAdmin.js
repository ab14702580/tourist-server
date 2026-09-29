/**
 * Admin user seed script
 * Run once: node scripts/createAdmin.js
 *
 * Creates a default admin account in MongoDB.
 * If the email already exists, updates its role to 'admin'.
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { connect, dbCollection } = require('../mongodbConnect/mongodbConnect');

// ── Default admin credentials ──────────────────────────────────────────────
// Change these before running, or pass via env vars
const ADMIN_NAME     = process.env.SEED_ADMIN_NAME     || 'Super Admin';
const ADMIN_EMAIL    = process.env.SEED_ADMIN_EMAIL    || 'admin@wanderly.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin@wanderly2024';

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await connect();

    const users = dbCollection('users');
    const existing = await users.findOne({ email: ADMIN_EMAIL });

    if (existing) {
      // Already exists — just ensure role is admin
      await users.updateOne(
        { email: ADMIN_EMAIL },
        { $set: { role: 'admin', isBanned: false } }
      );
      console.log(`✅ Existing user "${ADMIN_EMAIL}" updated to admin role.`);
    } else {
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await users.insertOne({
        name:      ADMIN_NAME,
        email:     ADMIN_EMAIL,
        password:  hashedPassword,
        avatar:    null,
        role:      'admin',
        isBanned:  false,
        provider:  'email',
        createdAt: new Date(),
      });
      console.log(`✅ Admin user created successfully!`);
    }

    console.log('');
    console.log('─────────────────────────────────────');
    console.log(' Admin Login Credentials');
    console.log('─────────────────────────────────────');
    console.log(` Email   : ${ADMIN_EMAIL}`);
    console.log(` Password: ${ADMIN_PASSWORD}`);
    console.log(' URL     : http://localhost:5173/dashboard');
    console.log('─────────────────────────────────────');
    console.log('⚠️  Change the password after first login!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
