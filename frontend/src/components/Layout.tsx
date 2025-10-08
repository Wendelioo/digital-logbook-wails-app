import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UpdateUserPhoto, ChangePassword } from '../../wailsjs/go/main/App';
import { 
  LayoutDashboard, 
  User,
  Settings,
  LogOut,
  ChevronDown,
  Lock,
  UserCircle
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  navigationItems: NavigationItem[];
  title: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current?: boolean;
}

function Layout({ children, navigationItems, title }: LayoutProps) {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(user?.photo_url || '');
  
  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSave = async () => {
    if (!photoFile || !user) return;
    
    try {
      // In a real app, you would upload the file to a server
      // For now, we'll just save the data URL
      await UpdateUserPhoto(user.id, photoPreview);
      alert('Photo updated successfully!');
      setPhotoFile(null);
    } catch (error) {
      console.error('Failed to update photo:', error);
      alert('Failed to update photo. Make sure you are connected to the database.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate inputs
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    if (!user) return;

    try {
      await ChangePassword(user.id, oldPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setShowAccountModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      console.error('Failed to change password:', error);
      setPasswordError('Failed to change password. Please check your old password.');
    }
  };

  const handleCloseAccountModal = () => {
    setShowAccountModal(false);
    setActiveTab('profile');
    setPhotoFile(null);
    setPhotoPreview(user?.photo_url || '');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setPasswordSuccess('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Static sidebar - always visible */}
      <div className="flex flex-shrink-0">
        <div className="flex flex-col w-64 lg:w-72">
          <div className="flex flex-col h-screen bg-gradient-to-b from-blue-900 to-blue-800 shadow-xl">
            <div className="flex-1 pt-6 pb-6 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 lg:px-6 mb-8">
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="h-10 lg:h-12 w-10 lg:w-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <LayoutDashboard className="h-6 lg:h-7 w-6 lg:w-7 text-blue-600" />
                  </div>
                  <div>
                    <h1 className="text-lg lg:text-xl font-bold text-white">Digital Logbook</h1>
                    <p className="text-blue-200 text-xs lg:text-sm">Monitoring System</p>
                  </div>
                </div>
              </div>
              <nav className="flex-1 px-3 lg:px-4 space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-blue-700 text-white shadow-lg transform scale-105'
                        : 'text-blue-100 hover:bg-blue-700 hover:text-white hover:transform hover:scale-105'
                    } group flex items-center px-3 lg:px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out`}
                  >
                    <div className={`${item.current ? 'text-white' : 'text-blue-300 group-hover:text-white'} mr-3 lg:mr-4 transition-colors duration-200`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <span className="text-xl lg:text-2xl font-semibold text-gray-900">{title}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              {/* Profile dropdown */}
              <div className="ml-3 relative" ref={dropdownRef}>
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    aria-expanded={profileDropdownOpen}
                    aria-haspopup="true"
                  >
                    <div className="flex items-center space-x-3">
                      {user?.photo_url || photoPreview ? (
                        <img 
                          src={photoPreview || user?.photo_url} 
                          alt="Profile" 
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-700">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ') || 'Role'}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </button>
                </div>
                
                {profileDropdownOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <button
                      type="button"
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                      onClick={() => {
                        setShowAccountModal(true);
                        setProfileDropdownOpen(false);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Account
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-semibold text-gray-900">Account Settings</h3>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
              <div className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'profile'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <UserCircle className="h-5 w-5" />
                    <span>Profile</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'password'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Change Password</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Avatar Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Avatar</label>
                    <div className="flex items-center space-x-6">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Profile" 
                          className="h-24 w-24 rounded-full object-cover border-4 border-blue-200"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center border-4 border-blue-200">
                          <User className="h-12 w-12 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Change Photo
                        </button>
                        {photoFile && (
                          <button
                            type="button"
                            onClick={handlePhotoSave}
                            className="ml-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                          >
                            Save Photo
                          </button>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          JPG, PNG or GIF (max. 5MB)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Name Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-gray-900">{user?.name || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Created At Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Created</label>
                    <div className="px-4 py-3 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-gray-900">
                        {user?.created ? new Date(user.created).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'password' && (
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {passwordError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                      {passwordError}
                    </div>
                  )}
                  
                  {passwordSuccess && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                      {passwordSuccess}
                    </div>
                  )}

                  {/* Old Password */}
                  <div>
                    <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Old Password
                    </label>
                    <input
                      type="password"
                      id="oldPassword"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your current password"
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your new password"
                    />
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm your new password"
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                    >
                      Change Password
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                type="button"
                onClick={handleCloseAccountModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;