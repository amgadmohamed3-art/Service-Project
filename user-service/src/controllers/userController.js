// User controller - ONLY handles user data, NOT tokens
// Auth service handles JWT generation/validation
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Register - Create user with hashed password
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ ok: false, message: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ ok: false, message: 'User already exists with this email' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Create user (NO JWT here - Auth service will do that)
    const user = await User.create({
      email,
      passwordHash: hash,
      name
      // roles will default to ['User'] from the schema
    });

    res.status(201).json({
      ok: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.roles[0] // Get first role from roles array
      }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// Login - Verify credentials only (Auth service generates JWT)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ ok: false, message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ ok: false, message: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ ok: false, message: 'Invalid email or password' });
    }

    // Return user data - Auth service will generate JWT
    res.json({
      ok: true,
      message: 'Credentials verified',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (e) {
    res.status(500).json({ ok: false, message: e.message });
  }
};
