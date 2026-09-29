const express = require('express');
const { ObjectId } = require('mongodb');
const { dbCollection } = require('../mongodbConnect/mongodbConnect');

const router = express.Router();
const formatDoc = (doc) => ({ ...doc, id: doc._id.toString(), _id: undefined });

// GET /api/blogs
router.get('/', async (req, res) => {
  try {
    const blogs = await dbCollection('blogs');
    const docs = await blogs.find({}).sort({ id: 1 }).toArray();
    return res.json(docs.map(formatDoc));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/blogs/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const blogs = await dbCollection('blogs');
    let doc = null;
    if (ObjectId.isValid(id)) doc = await blogs.findOne({ _id: new ObjectId(id) });
    if (!doc) { const n = parseInt(id, 10); if (!isNaN(n)) doc = await blogs.findOne({ id: n }); }
    if (!doc) return res.status(404).json({ error: 'Blog not found' });
    return res.json(formatDoc(doc));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
