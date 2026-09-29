const { MongoClient } = require('mongodb');
require('dotenv').config();

const client = new MongoClient(process.env.DB_URL);

let db;
let isConnected = false;

// Connect — reuses existing connection (important for Vercel serverless)
const connect = async () => {
  if (isConnected && db) return db;
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    isConnected = true;
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    throw error;
  }
};

// Get a collection — auto-connects if not yet connected
const dbCollection = async (collectionName) => {
  if (!db || !isConnected) await connect();
  return db.collection(collectionName);
};

module.exports = { connect, dbCollection };
