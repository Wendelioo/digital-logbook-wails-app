import React, { createContext, useContext, useState, useEffect } from 'react';
import { Login, Logout } from '../../wailsjs/go/main/App';

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
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
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

  const login = async (username: string, password: string): Promise<User> => {
    try {
      // Clear any existing user data first
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');

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
      
      return userData;
    } catch (error) {
      console.error('Login failed:', error);
      // Ensure state is cleared on login failure
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout if user exists
      if (user) {
        await Logout(user.id);
      }
    } catch (error) {
      console.error('Backend logout failed:', error);
      // Continue with frontend logout even if backend fails
    } finally {
      // Always clear frontend state
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      
      // Clear any other potential state
      sessionStorage.clear();
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
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

