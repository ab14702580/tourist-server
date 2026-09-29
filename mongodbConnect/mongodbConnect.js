const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB Client Setup
const client = new MongoClient(process.env.DB_URL);

let db;

// ১. ডাটাবেস কানেক্ট করার ফাংশন
const connect = async () => {
  try {
    await client.connect();
    db = client.db(process.env.DB_NAME);
    console.log("You successfully connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// ২. কালেকশন পাওয়ার ফাংশন
const dbCollection = (collectionName) => {
  if (!db) {
    throw new Error("Database not initialized. Call connect() first!");
  }
  return db.collection(collectionName);
};

module.exports = { connect, dbCollection };