const express = require('express');
const { dbCollection } = require('../mongodbConnect/mongodbConnect');

const router = express.Router();

// POST /api/contact — save contact form submission
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const contacts = await dbCollection('contacts');
    await contacts.insertOne({
      name,
      email,
      subject: subject || '',
      message,
      createdAt: new Date(),
    });

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('Contact form error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/newsletter/subscribe — save newsletter subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const newsletter = await dbCollection('newsletter');

    // Prevent duplicate subscriptions
    const existing = await newsletter.findOne({ email });
    if (existing) {
      return res.json({ success: true, message: 'Already subscribed' });
    }

    await newsletter.insertOne({ email, subscribedAt: new Date() });
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('Newsletter subscribe error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
