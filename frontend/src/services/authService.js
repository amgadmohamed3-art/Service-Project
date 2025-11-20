class AuthService {
  constructor() {
    this.isRefreshing = false;
    this.refreshSubscribers = [];

    // Token refresh URL from environment variable
    this.refreshTokenUrl = `${process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:6002'}/api/auth/refresh`;
  }

  // Get current access token
  getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  // Get current refresh token
  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  // Check if token is expired (basic check - could be enhanced with JWT decoding)
  isTokenExpired(token) {
    if (!token) return true;

    try {
      // Decode JWT payload (without verification for just expiration check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;

      // Consider expired if less than 30 seconds remaining
      return payload.exp < currentTime + 30;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true; // Assume expired if can't decode
    }
  }

  // Store tokens
  setTokens(accessToken, refreshToken, user) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  // Remove all auth data
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }

  // Get user data
  getUser() {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Add request to queue that's waiting for token refresh
  addRefreshSubscriber(callback) {
    this.refreshSubscribers.push(callback);
  }

  // Notify all subscribers that token has been refreshed
  notifyRefreshSubscribers(token) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  // Refresh access token
  async refreshAccessToken() {
    // If already refreshing, return promise from existing refresh
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.addRefreshSubscriber((newToken) => {
          resolve(newToken);
        });
      });
    }

    this.isRefreshing = true;
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      this.isRefreshing = false;
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(this.refreshTokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();

      if (data.ok && data.accessToken) {
        // Store new access token
        localStorage.setItem('accessToken', data.accessToken);

        // Update user data if provided
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // Notify all waiting requests
        this.notifyRefreshSubscribers(data.accessToken);

        this.isRefreshing = false;
        return data.accessToken;
      } else {
        throw new Error('Invalid refresh response');
      }
    } catch (error) {
      // Refresh failed, clear all tokens
      this.clearTokens();
      this.isRefreshing = false;

      // Redirect to login page
      window.location.href = '/login';

      throw error;
    }
  }

  // Get valid access token, refreshing if necessary
  async getValidAccessToken() {
    const currentToken = this.getAccessToken();

    if (!currentToken || this.isTokenExpired(currentToken)) {
      return await this.refreshAccessToken();
    }

    return currentToken;
  }

  // Make authenticated API request with automatic token refresh
  async makeAuthenticatedRequest(url, options = {}) {
    try {
      // Get valid token (refresh if needed)
      const token = await this.getValidAccessToken();

      // Add authorization header
      const authenticatedOptions = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...options.headers
        }
      };

      // Make the request
      const response = await fetch(url, authenticatedOptions);

      // If token expired during request (shouldn't happen with our preemptive refresh)
      if (response.status === 401) {
        try {
          // Force refresh and retry once
          const newToken = await this.refreshAccessToken();

          const retryOptions = {
            ...options,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`,
              ...options.headers
            }
          };

          return await fetch(url, retryOptions);
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect
          this.clearTokens();
          window.location.href = '/login';
          throw refreshError;
        }
      }

      return response;
    } catch (error) {
      // Handle network errors and other issues
      console.error('Authenticated request failed:', error);
      throw error;
    }
  }

  // Login method
  async login(email, password) {
    const authBaseUrl = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:6002';
    const response = await fetch(`${authBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    if (data.ok && data.accessToken && data.refreshToken) {
      this.setTokens(data.accessToken, data.refreshToken, data.user);
      return data;
    } else {
      throw new Error('Invalid login response');
    }
  }

  // Register method
  async register(name, email, password) {
    const authBaseUrl = process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:6002';
    const response = await fetch(`${authBaseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();

    if (data.ok && data.accessToken && data.refreshToken) {
      this.setTokens(data.accessToken, data.refreshToken, data.user);
      return data;
    } else {
      throw new Error('Invalid registration response');
    }
  }

  // Logout method
  logout() {
    this.clearTokens();
    window.location.href = '/login';
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getAccessToken();
    return token && !this.isTokenExpired(token);
  }

  // Setup periodic token refresh check (optional)
  setupPeriodicRefresh() {
    // Check token validity every 5 minutes
    setInterval(async () => {
      if (this.isAuthenticated()) {
        try {
          await this.getValidAccessToken();
        } catch (error) {
          console.log('Periodic token refresh failed:', error);
        }
      }
    }, 5 * 60 * 1000);
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;