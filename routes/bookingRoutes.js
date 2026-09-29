const express = require('express');
const { ObjectId } = require('mongodb');
const { dbCollection } = require('../mongodbConnect/mongodbConnect');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All booking routes require authentication
router.use(authMiddleware);

// Helper: format booking document
const formatDoc = (doc) => ({ ...doc, id: doc._id.toString(), _id: undefined });

// Helper: generate booking reference
const generateBookingRef = () => `WB${Date.now()}`;

// POST /api/bookings — create a new booking + send confirmation email
router.post('/', async (req, res) => {
  try {
    const bookingData = req.body;
    const bookings = await dbCollection('bookings');

    const booking = {
      ...bookingData,
      userId:     req.user.userId,
      bookingRef: generateBookingRef(),
      status:     bookingData.status || 'confirmed',
      createdAt:  new Date(),
    };

    const result = await bookings.insertOne(booking);
    const savedBooking = await bookings.findOne({ _id: result.insertedId });
    const formatted = formatDoc(savedBooking);

    // Email sending disabled
    // sendBookingConfirmation(savedBooking).catch(...);

    return res.status(201).json({ success: true, booking: formatted });
  } catch (err) {
    console.error('Create booking error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/my-bookings — all bookings for the current user
router.get('/my-bookings', async (req, res) => {
  try {
    const bookings = await dbCollection('bookings');
    const docs = await bookings
      .find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .toArray();
    return res.json(docs.map(formatDoc));
  } catch (err) {
    console.error('Get my-bookings error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/bookings/:id — single booking by _id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookings = await dbCollection('bookings');

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const doc = await bookings.findOne({ _id: new ObjectId(id) });
    if (!doc) return res.status(404).json({ error: 'Booking not found' });

    return res.json(formatDoc(doc));
  } catch (err) {
    console.error('Get booking by id error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin: PATCH /api/bookings/:id/status — update booking status (confirm/cancel)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['confirmed', 'cancelled', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const bookings = await dbCollection('bookings');
    await bookings.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );

    const updated = await bookings.findOne({ _id: new ObjectId(id) });
    return res.json({ success: true, booking: formatDoc(updated) });
  } catch (err) {
    console.error('Update booking status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
