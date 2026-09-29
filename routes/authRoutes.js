const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { OAuth2Client } = require('google-auth-library');
const { dbCollection } = require('../mongodbConnect/mongodbConnect');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strip sensitive fields and expose safe user object */
const formatUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone || null,
  avatar: user.avatar || null,
  role: user.role || 'user',
  isBanned: user.isBanned || false,
  provider: user.provider || 'email',
  createdAt: user.createdAt,
});

/** Generate a signed JWT */
const generateToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

/** Determine role: first user with ADMIN_EMAIL becomes admin */
const determineRole = (email, existingRole) => {
  if (existingRole) return existingRole;
  if (process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL) return 'admin';
  return 'user';
};

// ─── Email / Password ─────────────────────────────────────────────────────────

/** POST /api/auth/register */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const users = dbCollection('users');
    const existing = await users.findOne({ email });

    if (existing) {
      // If the account was created via Google, don't allow email registration
      if (existing.provider === 'google') {
        return res.status(409).json({
          error: 'This email is registered via Google. Please sign in with Google.',
        });
      }
      if (existing.provider === 'facebook') {
        return res.status(409).json({
          error: 'This email is registered via Facebook. Please sign in with Facebook.',
        });
      }
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = determineRole(email, null);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      avatar: null,
      role,
      isBanned: false,
      provider: 'email',
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);
    newUser._id = result.insertedId;

    const token = generateToken(newUser);
    return res.status(201).json({ token, user: formatUser(newUser) });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** POST /api/auth/login */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const users = dbCollection('users');
    const user = await users.findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Block OAuth-only accounts from email login
    if (user.provider === 'google') {
      return res.status(401).json({
        error: 'This account uses Google Sign-In. Please log in with Google.',
      });
    }
    if (user.provider === 'facebook') {
      return res.status(401).json({
        error: 'This account uses Facebook Sign-In. Please log in with Facebook.',
      });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    const token = generateToken(user);
    return res.json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/** POST /api/auth/google  —  frontend sends Google ID token */
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    // Verify the ID token with Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    const users = dbCollection('users');

    // Check if a user with this email already exists
    let user = await users.findOne({ email });

    if (user) {
      // Email exists — was it registered with email/password?
      if (user.provider === 'email') {
        return res.status(409).json({
          error:
            'This email is already registered with a password. Please log in with email & password.',
        });
      }
      // Update googleId if missing (e.g. Facebook account with same email — edge case)
      if (!user.googleId) {
        await users.updateOne({ _id: user._id }, { $set: { googleId } });
        user.googleId = googleId;
      }
    } else {
      // New Google user — create account
      const role = determineRole(email, null);
      const newUser = {
        name,
        email,
        googleId,
        avatar: picture || null,
        role,
        isBanned: false,
        provider: 'google',
        createdAt: new Date(),
      };
      const result = await users.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    const token = generateToken(user);
    return res.json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('Google auth error:', err);
    return res.status(401).json({ error: 'Google authentication failed' });
  }
});

// ─── Facebook OAuth ───────────────────────────────────────────────────────────

/** POST /api/auth/facebook — frontend sends FB accessToken + userId */
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken, userId } = req.body;
    if (!accessToken || !userId) {
      return res.status(400).json({ error: 'Facebook accessToken and userId are required' });
    }

    // Verify the token by calling the Facebook Graph API
    const graphUrl = `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`;
    const fbRes = await fetch(graphUrl);
    const fbData = await fbRes.json();

    if (fbData.error || fbData.id !== userId) {
      return res.status(401).json({ error: 'Facebook authentication failed. Invalid token.' });
    }

    const { id: facebookId, name, email, picture } = fbData;
    const avatar = picture?.data?.url || null;

    // An email is not always provided by Facebook (user may have signed up with phone)
    if (!email) {
      return res.status(400).json({
        error: 'Facebook account has no email address. Please use a different sign-in method.',
      });
    }

    const users = dbCollection('users');
    let user = await users.findOne({ email });

    if (user) {
      // Email registered with a different provider
      if (user.provider === 'email') {
        return res.status(409).json({
          error: 'This email is already registered with a password. Please log in with email & password.',
        });
      }
      if (user.provider === 'google') {
        return res.status(409).json({
          error: 'This email is registered via Google. Please sign in with Google.',
        });
      }
      // Update facebookId if missing
      if (!user.facebookId) {
        await users.updateOne({ _id: user._id }, { $set: { facebookId } });
        user.facebookId = facebookId;
      }
    } else {
      // New Facebook user — create account
      const role = determineRole(email, null);
      const newUser = {
        name,
        email,
        facebookId,
        avatar,
        role,
        isBanned: false,
        provider: 'facebook',
        createdAt: new Date(),
      };
      const result = await users.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    if (user.isBanned) {
      return res.status(403).json({ error: 'Your account has been banned.' });
    }

    const token = generateToken(user);
    return res.json({ token, user: formatUser(user) });
  } catch (err) {
    console.error('Facebook auth error:', err);
    return res.status(401).json({ error: 'Facebook authentication failed' });
  }
});

// ─── Profile ─────────────────────────────────────────────────────────────────

/** GET /api/auth/me  (protected) */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const users = dbCollection('users');
    const user = await users.findOne({ _id: new ObjectId(req.user.userId) });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: formatUser(user) });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/** PATCH /api/auth/profile  (protected) — update name, phone, avatar */
router.patch('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const users = dbCollection('users');

    const existing = await users.findOne({ _id: new ObjectId(req.user.userId) });
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const updates = {};
    if (name  && name.trim())  updates.name  = name.trim();
    if (phone !== undefined)   updates.phone = phone.trim ? phone.trim() : phone;
    if (avatar !== undefined)  updates.avatar = avatar || null;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updatedAt = new Date();

    await users.updateOne({ _id: new ObjectId(req.user.userId) }, { $set: updates });

    const updated = await users.findOne({ _id: new ObjectId(req.user.userId) });
    return res.json({ user: { ...formatUser(updated), phone: updated.phone || null } });
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
