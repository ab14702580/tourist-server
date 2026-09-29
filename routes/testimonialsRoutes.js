const express = require('express');
const { dbCollection } = require('../mongodbConnect/mongodbConnect');

const router = express.Router();
const formatDoc = (doc) => ({ ...doc, id: doc._id.toString(), _id: undefined });

// GET /api/testimonials
router.get('/', async (req, res) => {
  try {
    const col = dbCollection('testimonials');
    const docs = await col.find({}).sort({ id: 1 }).toArray();
    return res.json(docs.map(formatDoc));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
