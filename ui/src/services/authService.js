import { DEMO_USER } from '../data/mockAuth';

const AUTH_KEY = 'entitymatch_auth_session';

export const authService = {
  login: async (email, password, remember = false) => {
    // Simulate network delay
    await new Promise(res => setTimeout(res, 600));

    if (email.toLowerCase().trim() === 'demo@entitymatch.ai' && password === 'Demo@1234') {
      const session = {
        token: 'mock_jwt_token_entitymatch_2026',
        user: DEMO_USER,
        remember
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return { success: true, user: DEMO_USER };
    } else {
      throw new Error('Invalid email or password. Please use the demo credentials provided.');
    }
  },

  getCurrentSession: () => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  logout: async () => {
    await new Promise(res => setTimeout(res, 300));
    localStorage.removeItem(AUTH_KEY);
    return true;
  },

  requestPasswordReset: async (email) => {
    await new Promise(res => setTimeout(res, 800));
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    return { success: true, message: `Password reset instructions simulated for ${email}.` };
  }
};
