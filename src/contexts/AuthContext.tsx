import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '../types';
import {
  getAuthUser,
  studentLogin as apiStudentLogin,
  adminLogin as apiAdminLogin,
  studentSignup as apiStudentSignup,
  logoutUser as apiLogout,
  fetchCsrfToken,
} from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  loginStudent: (creds: { email: string; password: string }) => Promise<User>;
  loginAdmin: (creds: { email: string; password: string }) => Promise<User>;
  signupStudent: (data: any) => Promise<{ user: User; registrationId: string; referralCode: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const u = await getAuthUser();
      setUser(u);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch of session and CSRF token
    fetchCsrfToken();
    refreshUser();
  }, [refreshUser]);

  const loginStudent = async (creds: { email: string; password: string }) => {
    const res = await apiStudentLogin(creds);
    setUser(res.user);
    return res.user;
  };

  const loginAdmin = async (creds: { email: string; password: string }) => {
    const res = await apiAdminLogin(creds);
    setUser(res.user);
    return res.user;
  };

  const signupStudent = async (data: any) => {
    const res = await apiStudentSignup(data);
    setUser(res.user);
    return res;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student',
        loginStudent,
        loginAdmin,
        signupStudent,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
