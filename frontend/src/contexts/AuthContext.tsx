import React, { createContext, useContext, useState, useEffect } from 'react';
import { Login, LoginByEmployeeID, LoginByStudentID } from '../../wailsjs/go/main/App';

interface User {
  id: number;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  gender?: string;
  role: string;
  employee_id?: string;
  student_id?: string;
  year?: string;
  photo_url?: string;
  created: string;
}

interface AuthContextType {
  user: User | null;
  loginAsAdmin: (employeeID: string, password: string) => Promise<User | null>;
  loginAsTeacher: (employeeID: string, password: string) => Promise<User | null>;
  loginAsStudent: (studentID: string, password: string) => Promise<User | null>;
  loginAsWorkingStudent: (studentID: string, password: string) => Promise<User | null>;
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

  const loginAsAdmin = async (employeeID: string, password: string): Promise<User | null> => {
    try {
      const userData = await LoginByEmployeeID(employeeID, password);
      if (userData && userData.role === 'admin') {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
      console.error('Login failed: User is not an admin');
      return null;
    } catch (error) {
      console.error('Admin login failed:', error);
      return null;
    }
  };

  const loginAsTeacher = async (employeeID: string, password: string): Promise<User | null> => {
    try {
      const userData = await LoginByEmployeeID(employeeID, password);
      if (userData && userData.role === 'teacher') {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
      console.error('Login failed: User is not a teacher');
      return null;
    } catch (error) {
      console.error('Teacher login failed:', error);
      return null;
    }
  };

  const loginAsStudent = async (studentID: string, password: string): Promise<User | null> => {
    try {
      const userData = await LoginByStudentID(studentID, password);
      if (userData && userData.role === 'student') {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
      console.error('Login failed: User is not a student');
      return null;
    } catch (error) {
      console.error('Student login failed:', error);
      return null;
    }
  };

  const loginAsWorkingStudent = async (studentID: string, password: string): Promise<User | null> => {
    try {
      const userData = await LoginByStudentID(studentID, password);
      if (userData && userData.role === 'working_student') {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
      console.error('Login failed: User is not a working student');
      return null;
    } catch (error) {
      console.error('Working student login failed:', error);
      return null;
    }
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    loginAsAdmin,
    loginAsTeacher,
    loginAsStudent,
    loginAsWorkingStudent,
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
