// Client-side utilities for Better Auth integration
// This will be included in HTML pages that need authentication

class AuthClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  async signIn(email, password) {
    const response = await fetch(`${this.baseURL}/api/auth/sign-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Sign in failed');
    }

    return response.json();
  }

  async signOut() {
    const response = await fetch(`${this.baseURL}/api/auth/sign-out`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Sign out failed');
    }

    return response.json();
  }

  async getSession() {
    const response = await fetch(`${this.baseURL}/api/auth/session`, {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  }
  makeAuthenticatedRequest(url, options = {}) {
    const defaultOptions = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    return fetch(url, { ...defaultOptions, ...options });
  }
}

// Global instance
globalThis.authClient = new AuthClient();
