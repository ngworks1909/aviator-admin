import { create } from 'zustand';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  role: string;
  // Add other properties from your JWT token here
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  userRole: string | null;
  setToken: (token: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = sessionStorage.getItem('authToken');

  const decodeRole = (token: string | null): string | null => {
    if (!token) return null;

    try {
      const decoded = jwtDecode(token) as DecodedToken;
      if (['admin', 'superadmin', 'employee'].includes(decoded.role)) {
        return decoded.role;
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }

    return null;
  };

  return {
    token: storedToken,
    isAuthenticated: !!storedToken,
    userRole: decodeRole(storedToken),
    setToken: (token: string | null) => {
      if (token) {
        sessionStorage.setItem('authToken', token);
      } else {
        sessionStorage.removeItem('authToken');
      }

      set({
        token,
        isAuthenticated: !!token,
        userRole: decodeRole(token),
      });
    },
  };
});
