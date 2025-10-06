import React, { createContext, useContext, useState, useEffect } from 'react';
import { Login, LoginByEmail, LoginByStudentID } from '../../wailsjs/go/main/App';

interface User {
  id: number;
  username: string;
  email?: string;
  name: string;
  role: string;
  year?: string;
  created: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<User | null>;
  loginByEmail: (email: string, password: string) => Promise<User | null>;
  loginByStudentID: (studentID: string, password: string) => Promise<User | null>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<User | null> => {
    try {
      const userData = await Login(username, password);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      return null;
    }
  };

  const loginByEmail = async (email: string, password: string): Promise<User | null> => {
    try {
      const userData = await LoginByEmail(email, password);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Login by email failed:', error);
      return null;
    }
  };

  const loginByStudentID = async (studentID: string, password: string): Promise<User | null> => {
    try {
      const userData = await LoginByStudentID(studentID, password);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Login by student ID failed:', error);
      return null;
    }
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    loginByEmail,
    loginByStudentID,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
