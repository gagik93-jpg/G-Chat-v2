const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const { prisma } = require('../index');

const router = express.Router();

// Register
router.post('/register', [
  body('username').isLength({ min: 3 }).trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('displayName').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, displayName } = req.body;

    // Check if exists
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existing) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // First user becomes admin
    const userCount = await prisma.user.count();
    const isAdmin = userCount === 0;

    // Generate E2EE keys (simplified)
    const keyPair = {
      publicKey: 'pk_' + Math.random().toString(36).substring(2),
      privateKeyEnc: 'sk_enc_' + Math.random().toString(36).substring(2)
    };

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        displayName: displayName || username,
        publicKey: keyPair.publicKey,
        privateKeyEnc: keyPair.privateKeyEnc,
        isAdmin
      },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        isAdmin: true,
        publicKey: true
      }
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password, totpCode } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check 2FA
    if (user.twoFactorEnabled) {
      if (!totpCode) {
        return res.status(403).json({ 
          error: '2FA required',
          requires2FA: true 
        });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: totpCode,
        window: 2
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }
    }

    // Update online status
    await prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() }
    });

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        publicKey: user.publicKey
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Setup 2FA
router.post('/2fa/setup', async (req, res) => {
  try {
    const { userId } = req.body;

    const secret = speakeasy.generateSecret({
      name: `G-Chat:${userId}`,
      issuer: process.env.TOTP_ISSUER || 'G-Chat'
    });

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret.base32 }
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode
    });
  } catch (error) {
    res.status(500).json({ error: '2FA setup failed' });
  }
});

// Enable 2FA
router.post('/2fa/enable', async (req, res) => {
  try {
    const { userId, code } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// Get me
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        avatar: true,
        isAdmin: true,
        isOnline: true,
        status: true,
        publicKey: true,
        twoFactorEnabled: true
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { displayName, avatar, status } = req.body;

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        displayName: displayName || undefined,
        avatar: avatar || undefined,
        status: status || undefined
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        status: true
      }
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { isOnline: false, lastSeen: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
