/**
 * Admin-only routes
 * All routes here require: authMiddleware + adminMiddleware
 */
const express = require('express');
const { ObjectId } = require('mongodb');
const { dbCollection } = require('../mongodbConnect/mongodbConnect');
const authMiddleware = require('../middleware/auth');
const { adminMiddleware } = authMiddleware;

const router = express.Router();

// Apply auth + admin check to ALL routes in this file
router.use(authMiddleware, adminMiddleware);

const formatUser = (u) => ({
  id: u._id.toString(),
  name: u.name,
  email: u.email,
  avatar: u.avatar || null,
  role: u.role || 'user',
  isBanned: u.isBanned || false,
  provider: u.provider || 'email',
  createdAt: u.createdAt,
});

// ── Users ────────────────────────────────────────────────────────────────────

/** GET /api/admin/users — list all users */
router.get('/users', async (req, res) => {
  try {
    const users = await dbCollection('users');
    const docs = await users.find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 }).toArray();
    return res.json(docs.map(formatUser));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** PATCH /api/admin/users/:id/ban — ban a user */
router.patch('/users/:id/ban', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    // Admin cannot ban themselves
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'You cannot ban yourself' });
    }

    const users = await dbCollection('users');
    await users.updateOne({ _id: new ObjectId(id) }, { $set: { isBanned: true } });
    return res.json({ success: true, message: 'User banned' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** PATCH /api/admin/users/:id/unban — unban a user */
router.patch('/users/:id/unban', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });
    const users = await dbCollection('users');
    await users.updateOne({ _id: new ObjectId(id) }, { $set: { isBanned: false } });
    return res.json({ success: true, message: 'User unbanned' });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /api/admin/users/:id — delete a user */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });
    if (id === req.user.userId) return res.status(400).json({ error: 'Cannot delete yourself' });
    const users = await dbCollection('users');
    await users.deleteOne({ _id: new ObjectId(id) });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Analytics ────────────────────────────────────────────────────────────────

/** GET /api/admin/analytics — dashboard stats */
router.get('/analytics', async (req, res) => {
  try {
    const bookings   = await dbCollection('bookings');
    const users      = await dbCollection('users');
    const packages   = await dbCollection('packages');
    const destinations = await dbCollection('destinations');

    const [
      totalBookings,
      totalUsers,
      totalPackages,
      totalDestinations,
      allBookings,
    ] = await Promise.all([
      bookings.countDocuments(),
      users.countDocuments(),
      packages.countDocuments(),
      destinations.countDocuments(),
      bookings.find({}).sort({ createdAt: -1 }).toArray(),
    ]);

    // Total revenue from bookings
    const totalRevenue = allBookings.reduce((sum, b) => sum + (b.total || b.totalPrice || b.price || 0), 0);

    // Monthly revenue for chart (last 6 months)
    const now = new Date();
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const revenue = allBookings
        .filter(b => {
          const bDate = new Date(b.createdAt);
          return bDate.getMonth() === d.getMonth() && bDate.getFullYear() === d.getFullYear();
        })
        .reduce((sum, b) => sum + (b.total || b.totalPrice || b.price || 0), 0);
      monthlyRevenue.push({ month: label, revenue });
    }

    // Recent 5 bookings
    const recentBookings = allBookings.slice(0, 5).map(b => ({
      id: b._id.toString(),
      bookingRef: b.bookingRef,
      userId: b.userId,
      packageTitle: b.itemTitle || b.packageTitle || b.title || 'N/A',
      amount: b.total || b.totalPrice || b.price || 0,
      status: b.status || 'confirmed',
      createdAt: b.createdAt,
    }));

    return res.json({
      stats: { totalBookings, totalUsers, totalPackages, totalDestinations, totalRevenue },
      monthlyRevenue,
      recentBookings,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Bookings (admin: list all + update status) ───────────────────────────────

/** GET /api/admin/bookings — all bookings */
router.get('/bookings', async (req, res) => {
  try {
    const bookings = await dbCollection('bookings');
    const docs = await bookings.find({}).sort({ createdAt: -1 }).toArray();
    return res.json(docs.map(b => ({
      id:           b._id.toString(),
      bookingRef:   b.bookingRef,
      userId:       b.userId,
      name:         b.name,
      email:        b.email,
      itemTitle:    b.itemTitle || b.packageTitle || 'N/A',
      location:     b.location || '',
      date:         b.date,
      guests:       b.guests,
      total:        b.total || b.totalPrice || 0,
      paymentMethod: b.paymentMethod,
      status:       b.status || 'confirmed',
      createdAt:    b.createdAt,
    })));
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** PATCH /api/admin/bookings/:id/status — confirm or cancel a booking */
router.patch('/bookings/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['confirmed', 'cancelled', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    if (!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid ID' });

    const bookings = await dbCollection('bookings');
    await bookings.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    return res.json({ success: true, status });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Packages (add/remove) ────────────────────────────────────────────────────

/** POST /api/admin/packages — add new package */
router.post('/packages', async (req, res) => {
  try {
    const packages = await dbCollection('packages');
    const count = await packages.countDocuments();
    const pkg = {
      ...req.body,
      id: count + 1,
      createdAt: new Date(),
    };
    const result = await packages.insertOne(pkg);
    return res.status(201).json({ success: true, id: result.insertedId.toString() });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /api/admin/packages/:id — remove a package */
router.delete('/packages/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const packages = await dbCollection('packages');
    let result;
    if (ObjectId.isValid(id)) {
      result = await packages.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await packages.deleteOne({ id: parseInt(id, 10) });
    }
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Package not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /api/admin/destinations — add new destination */
router.post('/destinations', async (req, res) => {
  try {
    const destinations = await dbCollection('destinations');
    const count = await destinations.countDocuments();
    const destination = {
      ...req.body,
      id: count + 1,
      createdAt: new Date(),
    };
    const result = await destinations.insertOne(destination);
    return res.status(201).json({ success: true, id: result.insertedId.toString() });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** DELETE /api/admin/destinations/:id — remove a destination */
router.delete('/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const destinations = await dbCollection('destinations');
    let result;
    if (ObjectId.isValid(id)) {
      result = await destinations.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await destinations.deleteOne({ id: parseInt(id, 10) });
    }
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Destination not found' });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
