import React, { createContext, useContext, useState, useEffect } from 'react';
import { Login } from '../../wailsjs/go/main/App';

interface User {
  id: number;
  name: string;
  role: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  gender?: string;
  employee_id?: string;
  student_id?: string;
  year?: string;
  photo_url?: string;
  created?: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  loginAsAdmin: (username: string, password: string) => Promise<User>;
  loginAsTeacher: (username: string, password: string) => Promise<User>;
  loginAsStudent: (username: string, password: string) => Promise<User>;
  loginAsWorkingStudent: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for saved user session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (username: string, password: string) => {
    try {
      // Call the backend Login function
      const userData = await Login(username, password);
      
      if (!userData) {
        throw new Error('Invalid credentials');
      }

      // Set user data
      setUser(userData);
      setIsAuthenticated(true);

      // Save to localStorage for persistence
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Role-specific login methods (all use the same Login function)
  const loginAsAdmin = async (username: string, password: string): Promise<User> => {
    const userData = await Login(username, password);
    if (!userData) {
      throw new Error('Invalid credentials');
    }
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const loginAsTeacher = async (username: string, password: string): Promise<User> => {
    const userData = await Login(username, password);
    if (!userData) {
      throw new Error('Invalid credentials');
    }
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const loginAsStudent = async (username: string, password: string): Promise<User> => {
    const userData = await Login(username, password);
    if (!userData) {
      throw new Error('Invalid credentials');
    }
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const loginAsWorkingStudent = async (username: string, password: string): Promise<User> => {
    const userData = await Login(username, password);
    if (!userData) {
      throw new Error('Invalid credentials');
    }
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      loginAsAdmin,
      loginAsTeacher,
      loginAsStudent,
      loginAsWorkingStudent,
      logout, 
      isAuthenticated 
    }}>
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

