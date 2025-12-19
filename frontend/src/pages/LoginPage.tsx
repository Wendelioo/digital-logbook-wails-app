import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import backgroundImage from '../../../assets/background/background.jpg';

const roleRoutes: { [key: string]: string } = {
  student: '/student',
  working_student: '/working-student',
  teacher: '/teacher',
  admin: '/admin'
};

function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string>('teacher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { login } = useAuth();
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
      const userData = await login(username, password);
      
      if (userData) {
        if (userData.role !== selectedRole) {
          setError(`Please select the correct login type: ${userData.role}`);
          return;
        }
        
        navigate(roleRoutes[userData.role]);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getLabelText = () => {
    switch (selectedRole) {
      case 'student':
      case 'working_student':
        return 'Student ID';
      case 'teacher':
        return 'Teacher ID';
      case 'admin':
        return 'Admin ID';
      default:
        return 'Username';
    }
  };

  const getPlaceholderText = () => {
    switch (selectedRole) {
      case 'student':
        return 'e.g., 2024-12345';
      case 'working_student':
        return 'e.g., 2024-12345';
      case 'teacher':
        return 'e.g., T-2024-001';
      case 'admin':
        return 'e.g., A-2024-001';
      default:
        return 'Enter your ID';
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Section - Background Image with Title and Text */}
      <div className="w-1/2 relative flex flex-col justify-center items-start p-16 overflow-hidden">
        {/* Blurred Background Image */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(4px)',
            transform: 'scale(1.1)'
          }}
        ></div>
        {/* Gradient Overlay for better contrast and visual appeal */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-teal-900/40"></div>
        
        {/* Decorative Accent Line */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-400 via-teal-500 to-teal-600"></div>
        
        {/* Content Container */}
        <div className="relative z-10 max-w-2xl">
          {/* Text Content */}
          <div className="space-y-8">
            {/* Decorative element before heading */}
            <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-1 bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"></div>
              <div className="w-2 h-2 bg-teal-400 rounded-full"></div>
            </div>
            
            <h2 className="text-5xl font-extrabold text-white leading-[1.1] tracking-[-0.02em] drop-shadow-2xl mb-4">
              Track Your Lab Attendance
            </h2>
            
            <p className="text-white/95 text-xl leading-[1.7] font-normal max-w-xl drop-shadow-lg pl-1">
              Log in with your account to view your records and monitor your computer lab history.
            </p>
            
            {/* Decorative dots */}
            <div className="flex items-center gap-2 pt-2">
              <div className="w-2 h-2 bg-teal-400/80 rounded-full"></div>
              <div className="w-2 h-2 bg-teal-400/60 rounded-full"></div>
              <div className="w-2 h-2 bg-teal-400/40 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - White Background with Login Form */}
      <div className="w-1/2 bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-gray-500 text-sm">
              Sign in to continue and access your account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label htmlFor="role" className="block text-sm font-semibold text-gray-800 mb-2.5">
                Account Type
              </label>
              <select
                id="role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              >
                <option value="student">Student</option>
                <option value="working_student">Working Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {/* Username/ID Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-gray-800 mb-2.5">
                {getLabelText()}
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                />
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-600 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 cursor-pointer" 
                />
                <span className="ml-2.5 text-sm text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                  Remember me
                </span>
              </label>
              <a href="#" className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedRole}
              className="w-full bg-teal-600 text-white py-3.5 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-base shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
