const express = require('express');
const { ObjectId } = require('mongodb');
const { dbCollection } = require('../mongodbConnect/mongodbConnect');

const router = express.Router();

// Helper: format package document
const formatDoc = (doc) => ({ ...doc, id: doc._id.toString(), _id: undefined });

// GET /api/packages
// Supports ?search=X
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { badge: { $regex: search, $options: 'i' } },
      ];
    }

    const packages = await dbCollection('packages');
    const docs = await packages.find(query).toArray();
    return res.json(docs.map(formatDoc));
  } catch (err) {
    console.error('Get packages error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/packages/:id — by MongoDB _id or numeric id field
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const packages = await dbCollection('packages');
    let doc = null;

    // Try ObjectId first
    if (ObjectId.isValid(id)) {
      doc = await packages.findOne({ _id: new ObjectId(id) });
    }

    // Fallback: numeric id field
    if (!doc) {
      const numericId = parseInt(id, 10);
      if (!isNaN(numericId)) {
        doc = await packages.findOne({ id: numericId });
      }
    }

    if (!doc) {
      return res.status(404).json({ error: 'Package not found' });
    }

    return res.json(formatDoc(doc));
  } catch (err) {
    console.error('Get package by id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
