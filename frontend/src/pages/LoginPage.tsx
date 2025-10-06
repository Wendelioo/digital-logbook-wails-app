import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, User, Lock, Mail, CreditCard } from 'lucide-react';
import illustration from '../../../assets/illustrations/welcome-illustration.png';

const roleRoutes: { [key: string]: string } = {
  student: '/student',
  working_student: '/working-student',
  instructor: '/instructor',
  admin: '/admin'
};

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginByEmail, loginByStudentID } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole || !username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let userData = null;
      
      // Use appropriate login method based on selected role
      switch (selectedRole) {
        case 'admin':
        case 'instructor':
          // For admin and instructor, try email login first, then username login
          if (username.includes('@')) {
            userData = await loginByEmail(username, password);
          } else {
            userData = await login(username, password);
          }
          break;
        case 'student':
        case 'working_student':
          // For students and working students, use student ID login
          userData = await loginByStudentID(username, password);
          break;
        default:
          setError('Invalid role selected');
          setLoading(false);
          return;
      }
      
      if (userData) {
        // Verify the user's actual role matches the selected role
        if (userData.role === selectedRole) {
          navigate(roleRoutes[userData.role]);
        } else {
          setError(`Invalid credentials for ${selectedRole} role`);
        }
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLabelText = () => {
    switch (selectedRole) {
      case 'student':
      case 'working_student':
        return 'Student ID';
      case 'instructor':
      case 'admin':
        return 'Email / Username';
      default:
        return 'Username / Email';
    }
  };

  const getPlaceholderText = () => {
    switch (selectedRole) {
      case 'student':
        return 'Enter your Student ID (e.g., 2025-1234)';
      case 'working_student':
        return 'Enter your Working Student ID';
      case 'instructor':
        return 'Enter your Email or Username';
      case 'admin':
        return 'Enter your Email or Username';
      default:
        return 'Enter your Student ID or Email';
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Section */}
        <div className="w-1/2 bg-white flex items-center justify-center p-8">
          <img src={illustration} alt="Welcome Illustration" className="max-w-full h-auto" />
        </div>

        {/* Right Section */}
        <div className="w-1/2 bg-blue-50 flex items-center justify-center p-8">
          <div className="w-full max-w-sm">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-[#1F2937]">Digital Logbook</h1>
              <p className="text-[#6B7280] text-lg">Monitoring System</p>
            </div>
            <h2 className="text-2xl font-semibold text-[#1F2937] mb-6 text-center flex items-center justify-center gap-2">
              <LogIn className="w-6 h-6" />
              Login
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Select Login Type
                </label>
                <select
                  id="role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F3F4F6] border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  required
                >
                  <option value="student">Student</option>
                  <option value="working_student">Working Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="relative">
                <label htmlFor="username" className="block text-sm font-medium text-[#1F2937] mb-1">
                  {getLabelText()}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={getPlaceholderText()}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    required
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="relative">
                <label htmlFor="password" className="block text-sm font-medium text-[#1F2937] mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-3 py-2 bg-white border border-[#D1D5DB] rounded-md focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !selectedRole}
                className="w-full bg-[#2563EB] text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
