import * as React from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { getToken, setToken, clearToken, loginUser, registerUser, guestLogin } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  grade: string;
  language: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, grade: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists on mount
    const token = getToken();
    const cachedUser = localStorage.getItem('engiplay_user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        // Fallback
      }
    } else if (token) {
      try {
        if (token.includes('.')) {
          // Simple base64 JWT payload decode
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            window
              .atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const parsed = JSON.parse(jsonPayload);
          setUser({
            id: parsed.id,
            name: parsed.name,
            email: parsed.email,
            grade: parsed.grade || '8',
            language: parsed.language || 'en',
            isGuest: parsed.isGuest
          });
        } else {
          // Guest token fallback
          setUser({
            id: 'guest_local',
            name: 'Guest Explorer',
            email: 'guest@engiplay.local',
            grade: '9',
            language: 'en',
            isGuest: true
          });
        }
      } catch (err) {
        console.error('Error decoding token:', err);
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await loginUser({ email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('engiplay_user', JSON.stringify(data.user));
  };

  const register = async (name: string, email: string, password: string, grade: string) => {
    const data = await registerUser({ name, email, password, grade });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('engiplay_user', JSON.stringify(data.user));
  };

  const loginAsGuest = async () => {
    const data = await guestLogin();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('engiplay_user', JSON.stringify(data.user));
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem('engiplay_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        loginAsGuest,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
