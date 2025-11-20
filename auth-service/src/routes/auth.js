const router = require('express').Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Environment variables for service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:6001';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-change-in-production';

// Call user-service to verify credentials
async function verifyCredentials(email, password) {
  try {
    const response = await axios.post(`${USER_SERVICE_URL}/api/users/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

// POST /auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Call user-service to create user
    const userResponse = await axios.post(`${USER_SERVICE_URL}/api/users/register`, {
      email,
      password,
      name
    });

    if (!userResponse.data.ok) {
      return res.status(400).json({ ok: false, message: userResponse.data.message });
    }

    const user = userResponse.data.user;

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      ok: true,
      message: 'User registered successfully',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ ok: false, message: error.response?.data?.message || error.message });
  }
});

// POST /auth/login - Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Call user-service to verify credentials
    const userResponse = await axios.post(`${USER_SERVICE_URL}/api/users/login`, {
      email,
      password
    });

    if (!userResponse.data.ok) {
      return res.status(401).json({ ok: false, message: userResponse.data.message });
    }

    const user = userResponse.data.user;

    // Generate JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({ ok: false, message: error.response?.data?.message || 'Invalid credentials' });
  }
});

// POST /auth/refresh - Refresh access token
router.post('/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ ok: false, message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      ok: true,
      accessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error.message);
    res.status(401).json({ ok: false, message: 'Invalid or expired refresh token' });
  }
});

// POST /auth/verify - Verify access token
router.post('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(400).json({ ok: false, message: 'Token required' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    res.json({
      ok: true,
      message: 'Token valid',
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('Verify token error:', error.message);
    res.status(401).json({ ok: false, message: 'Invalid or expired token' });
  }
});

// GET /auth/validate - Middleware compatible validation
router.get('/validate', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ ok: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      ok: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({ ok: false, message: 'Invalid token' });
  }
});

module.exports = router;
