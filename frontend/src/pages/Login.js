import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import './Auth.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Handle authentication via Auth Service
  const handleAuthBackend = async (isSignup) => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (isSignup && !name) {
      setError('Name is required for signup');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await authService.register(name, email, password);
      } else {
        await authService.login(email, password);
      }

      // Setup periodic token refresh
      authService.setupPeriodicRefresh();

      setError('');
      setEmail('');
      setPassword('');
      setName('');
      navigate('/');
    } catch (err) {
      console.error('Backend auth failed:', err);
      setError(err.message || `${isSignup ? 'Signup' : 'Login'} failed`);
    } finally {
      setLoading(false);
    }
  };

  // Fallback: Local authentication using localStorage
  const handleLocalAuth = (isSignup) => {
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (isSignup && !name) {
      setError('Name is required for signup');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (isSignup) {
      // Check if user already exists
      if (users.find(u => u.email === email)) {
        setError('User already exists with this email');
        return;
      }

      // Create new user
      const newUser = { id: Date.now(), name, email, password };
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      setError('');
      setIsLogin(true);
      setName('');
      setEmail('');
      setPassword('');
      alert('Signup successful! Please login now.');
      return;
    }

    // Login
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      setError('Invalid email or password');
      return;
    }

    // Generate a mock token
    const token = `token_${user.id}_${Date.now()}`;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify({ id: user.id, email: user.email, name: user.name }));
    setError('');
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await handleAuthBackend(!isLogin);
    } catch (err) {
      const errorMsg = err.message || 'Authentication failed';
      setError(errorMsg);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🎬 MovieReview</h1>
        
        <div className="auth-toggle">
          <button
            className={`toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(true);
              setError('');
              setEmail('');
              setPassword('');
              setName('');
            }}
          >
            Login
          </button>
          <button
            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => {
              setIsLogin(false);
              setError('');
              setEmail('');
              setPassword('');
              setName('');
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="form-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-info">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            className="link-btn"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
