const express = require('express');
const { ObjectId } = require('mongodb');
const { dbCollection } = require('../mongodbConnect/mongodbConnect');

const router = express.Router();

// Helper: format destination document
const formatDoc = (doc) => ({ ...doc, id: doc._id.toString(), _id: undefined });

// GET /api/destinations
// Supports ?category=X and ?search=X
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const query = {};

    if (category) {
      query.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const destinations = await dbCollection('destinations');
    const docs = await destinations.find(query).toArray();
    return res.json(docs.map(formatDoc));
  } catch (err) {
    console.error('Get destinations error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/destinations/featured — items where badge field exists
router.get('/featured', async (req, res) => {
  try {
    const destinations = await dbCollection('destinations');
    const docs = await destinations.find({ badge: { $exists: true } }).toArray();
    return res.json(docs.map(formatDoc));
  } catch (err) {
    console.error('Get featured destinations error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/destinations/:id — by MongoDB _id, fallback to numeric id field
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const destinations = await dbCollection('destinations');
    let doc = null;

    // Try ObjectId first
    if (ObjectId.isValid(id)) {
      doc = await destinations.findOne({ _id: new ObjectId(id) });
    }

    // Fallback: numeric id field
    if (!doc) {
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        doc = await destinations.findOne({ id: numericId });
      }
    }

    if (!doc) {
      return res.status(404).json({ error: 'Destination not found' });
    }

    return res.json(formatDoc(doc));
  } catch (err) {
    console.error('Get destination by id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
