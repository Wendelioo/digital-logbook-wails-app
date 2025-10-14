import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import illustration from '../../../assets/illustrations/welcome.png';
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
  
  const { loginAsAdmin, loginAsTeacher, loginAsStudent, loginAsWorkingStudent } = useAuth();
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
      
      // Use role-specific login method
      switch (selectedRole) {
        case 'admin':
          userData = await loginAsAdmin(username, password);
          break;
        case 'teacher':
          userData = await loginAsTeacher(username, password);
          break;
        case 'student':
          userData = await loginAsStudent(username, password);
          break;
        case 'working_student':
          userData = await loginAsWorkingStudent(username, password);
          break;
        default:
          setError('Invalid role selected');
          setLoading(false);
          return;
      }
      
      if (userData) {
        navigate(roleRoutes[userData.role]);
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
        return 'Enter your Student ID';
      case 'working_student':
        return 'Enter your Student ID';
      case 'teacher':
        return 'Enter your Teacher ID';
      case 'admin':
        return 'Enter your Admin ID';
      default:
        return 'Enter your credentials';
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center relative"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Gradient Overlay for better readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-teal-900/70 via-teal-800/50 to-teal-900/70"></div>


      {/* Main Content - Central Card */}
      <div className="relative z-10 w-full max-w-4xl mx-4">
        <div className="flex bg-white bg-opacity-10 backdrop-blur-xl rounded-lg shadow-2xl overflow-hidden min-h-[450px] border border-white border-opacity-20">
          {/* Left Section - Dark Gray with Illustration */}
          <div className="w-1/2 bg-gradient-to-br from-gray-900/40 via-gray-800/40 to-gray-900/40 backdrop-blur-lg flex flex-col items-center justify-center p-10 border-r border-white border-opacity-10">
            <div className="text-center space-y-6">
              <div className="mb-8">
                <img 
                  src={illustration} 
                  alt="Welcome Illustration" 
                  className="w-44 h-auto mx-auto opacity-90"
                />
              </div>
              
              <div className="space-y-4 px-4">
                <h2 className="text-3xl font-semibold text-white tracking-wide drop-shadow-lg">
                  Welcome
                </h2>
                <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent mx-auto"></div>
                <p className="text-white text-sm leading-relaxed max-w-md mx-auto font-light drop-shadow-md">
                  Easily record your computer lab attendance and activity with our digital monitoring system.
                </p>
                <p className="text-white text-sm leading-relaxed max-w-md mx-auto font-light drop-shadow-md">
                  Log in using your assigned ID to begin your session.
                </p>
                <p className="text-gray-200 text-xs leading-relaxed max-w-md mx-auto font-light italic pt-2 drop-shadow-md">
                  This helps us maintain secure, accurate, and paperless records for all users in the IT Department.
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - White with Login Form */}
          <div className="w-1/2 bg-white bg-opacity-30 backdrop-blur-lg flex items-center justify-center p-8">
            <div className="w-full max-w-sm">
              <div className="text-center mb-8">
                {/* Professional Logo Design */}
                <div className="inline-block">
                  <div className="relative">
                    {/* Brand Name */}
                    <h2 className="text-3xl font-bold mb-3 tracking-tight drop-shadow-sm">
                      <span className="bg-gradient-to-r from-teal-600 via-teal-700 to-teal-600 bg-clip-text text-transparent">
                        DIGITAL
                      </span>
                      <span className="text-gray-900 ml-2">LOGBOOK</span>
                    </h2>
                    
                    {/* Decorative Line */}
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <div className="h-px w-8 bg-gradient-to-r from-transparent to-teal-400"></div>
                      <div className="w-1 h-1 bg-teal-500 rounded-full"></div>
                      <div className="h-px w-8 bg-gradient-to-l from-transparent to-teal-400"></div>
                    </div>
                    
                    {/* Tagline */}
                    <p className="text-gray-700 text-xs font-semibold tracking-widest uppercase drop-shadow-sm">User Login Portal</p>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="role" className="block text-xs font-semibold text-gray-900 mb-1 drop-shadow-sm">
                    Select Login Type
                  </label>
                  <select
                    id="role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white bg-opacity-70 border-b-2 border-gray-300 rounded-md focus:outline-none focus:border-teal-500 transition-all duration-200 text-sm text-gray-900 font-medium"
                    required
                  >
                    <option value="student">Student</option>
                    <option value="working_student">Working Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="username" className="block text-xs font-semibold text-gray-900 mb-1 drop-shadow-sm">
                    {getLabelText()}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder={getPlaceholderText()}
                      className="w-full pl-10 pr-3 py-2 bg-white bg-opacity-70 border-b-2 border-gray-300 rounded-md focus:outline-none focus:border-teal-500 transition-all duration-200 text-sm text-gray-900 font-medium placeholder-gray-500"
                      required
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold text-gray-900 mb-1 drop-shadow-sm">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2 bg-white bg-opacity-70 border-b-2 border-gray-300 rounded-md focus:outline-none focus:border-teal-500 transition-all duration-200 text-sm text-gray-900 font-medium placeholder-gray-500"
                      required
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-teal-600 focus:outline-none transition-colors duration-200"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-2 py-1 rounded-md flex items-start">
                    <svg className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium">{error}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <label className="flex items-center">
                    <input type="checkbox" className="w-3 h-3 text-teal-600 border-gray-300 rounded focus:ring-teal-500" />
                    <span className="ml-1 text-xs text-gray-800 font-medium">Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !selectedRole}
                  className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : 'Login'}
                </button>

                <div className="text-center">
                  <a href="#" className="text-teal-600 text-xs font-semibold hover:text-teal-700 transition-colors duration-200 drop-shadow-sm">
                    Forgot Password?
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
