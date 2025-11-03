import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UpdateUserPhoto, ChangePassword, SaveEquipmentFeedback } from '../../wailsjs/go/main/App';
import { 
  LayoutDashboard, 
  User,
  Settings,
  LogOut,
  ChevronDown,
  Lock,
  UserCircle
} from 'lucide-react';
import LogoutFeedbackModal from './LogoutFeedbackModal';

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
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
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

  const handleLogout = async () => {
    // Show confirmation modal for students
    if (user?.role === 'student') {
      setShowLogoutConfirmModal(true);
    } else {
      // For non-students, logout directly
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
        // Even if logout fails, navigate to login
        navigate('/login');
      }
    }
  };

  const handleLogoutConfirm = () => {
    // User confirmed logout, now show feedback modal
    setShowLogoutConfirmModal(false);
    setShowFeedbackModal(true);
  };

  const handleLogoutCancel = () => {
    // User cancelled logout
    setShowLogoutConfirmModal(false);
  };

  const handleFeedbackSubmit = async (feedbackData: any) => {
    try {
      if (!user) return;
      
      // Call the backend function to save feedback
      // Parameters: userID, userName, computerStatus, computerIssue, mouseStatus, mouseIssue, 
      //             keyboardStatus, keyboardIssue, monitorStatus, monitorIssue, additionalComments
      await SaveEquipmentFeedback(
        user.id,
        user.name,
        feedbackData.computer.status,
        feedbackData.computer.issue || '',
        feedbackData.mouse.status,
        feedbackData.mouse.issue || '',
        feedbackData.keyboard.status,
        feedbackData.keyboard.issue || '',
        feedbackData.monitor.status,
        feedbackData.monitor.issue || '',
        feedbackData.additionalComments || ''
      );
      
      console.log('✓ Feedback saved successfully');
    } catch (error) {
      console.error('Failed to save feedback:', error);
      alert('Failed to save feedback. You will still be logged out.');
    }
    
    setShowFeedbackModal(false);
    await logout();
    navigate('/login');
  };

  const handleFeedbackCancel = () => {
    setShowFeedbackModal(false);
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
      await UpdateUserPhoto(user.id, user.role, photoPreview);
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
      await ChangePassword(user.name, oldPassword, newPassword);
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

  const handleModalBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseAccountModal();
    }
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

  // Close dropdown and modal on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setProfileDropdownOpen(false);
        if (showAccountModal) {
          handleCloseAccountModal();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showAccountModal]);

  // Safety mechanism: Force close modal on component unmount
  useEffect(() => {
    return () => {
      setShowAccountModal(false);
      setProfileDropdownOpen(false);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Static sidebar - always visible */}
      <div className="flex flex-shrink-0">
        <div className="flex flex-col w-56 lg:w-64">
          <div className="flex flex-col h-screen bg-gradient-to-b from-gray-800 to-gray-900 shadow-2xl border-r border-gray-300">
            {/* Header Section with Border */}
            <div className="flex-shrink-0 pt-6 pb-4 border-b border-gray-300">
              <div className="flex items-center flex-shrink-0 px-3 lg:px-4">
                <div className="text-center w-full">
                  <h1 className="text-xl font-extrabold text-white tracking-wide">DIGITAL LOGBOOK</h1>
                  <p className="text-sm font-extrabold text-gray-300 tracking-wide">MONITORING SYSTEM</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Section with Border */}
            <div className="flex-1 pt-4 pb-6 overflow-y-auto">
              <nav className="flex-1 px-2 lg:px-3 space-y-2">
                {navigationItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      item.current
                        ? 'bg-gray-700 text-white shadow-lg border-l-4 border-blue-500'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white hover:border-l-4 hover:border-gray-400'
                    } group flex items-center px-3 py-3 text-sm font-medium transition-all duration-200 ease-in-out border-l-4 border-transparent`}
                  >
                    <div className={`${item.current ? 'text-white' : 'text-gray-400 group-hover:text-white'} mr-3 transition-colors duration-200`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
            
            {/* Footer Section with Border */}
            <div className="flex-shrink-0 border-t border-gray-300 p-4">
              <div className="text-xs text-gray-400 text-center">
                © 2024 Digital Logbook
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 bg-gray-50">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-md border-b border-gray-300">
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
                        <span className="text-sm font-medium text-gray-700">{user?.first_name || user?.name || 'User'}</span>
                        <span className="text-xs text-gray-500 capitalize block">{user?.role?.replace('_', ' ') || 'Role'}</span>
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
        <main className="flex-1 overflow-hidden bg-gray-50">
          <div className="py-6 h-full">
            <div className="max-w-full mx-auto px-4 sm:px-6 md:px-8 h-full">
              <div className="bg-white rounded-lg shadow-sm border border-gray-300 min-h-full p-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-40 flex items-center justify-center p-4"
          onClick={handleModalBackdropClick}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Account Settings</h3>
              <button
                type="button"
                onClick={handleCloseAccountModal}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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
                  {/* Basic Information Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h4>
                    
                    {/* Profile Picture and Student ID Row */}
                    <div className="flex items-center gap-8 mb-6">
                      {/* Profile Picture */}
                      <div className="flex flex-col items-center">
                        {photoPreview ? (
                          <img 
                            src={photoPreview} 
                            alt="Profile" 
                            className="h-24 w-24 rounded-full object-cover border-2 border-gray-300"
                          />
                        ) : (
                          <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-300">
                            <User className="h-14 w-14 text-gray-600" />
                          </div>
                        )}
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
                          className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          Change Photo
                        </button>
                        {photoFile && (
                          <button
                            type="button"
                            onClick={handlePhotoSave}
                            className="mt-1 text-sm text-green-600 hover:text-green-800 underline font-medium"
                          >
                            Save Photo
                          </button>
                        )}
                      </div>
                      
                      {/* ID - positioned next to profile picture */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {user?.role === 'admin' ? 'Admin ID' : 
                           user?.role === 'teacher' ? 'Teacher ID' : 'Student ID'}
                        </label>
                        <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                          <span className="text-gray-900">
                            {user?.role === 'admin' ? (user?.employee_id || 'N/A') :
                             user?.role === 'teacher' ? (user?.employee_id || 'N/A') :
                             user?.student_id || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Student/Working Student specific fields */}
                    {(user?.role === 'student' || user?.role === 'working_student') ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Last Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                          <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                            <span className="text-gray-900">{user?.last_name || 'N/A'}</span>
                          </div>
                        </div>

                        {/* First Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                          <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                            <span className="text-gray-900">{user?.first_name || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Middle Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                          <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                            <span className="text-gray-900">{user?.middle_name || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Year Level */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
                          <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                            <span className="text-gray-900">{user?.year || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Section */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                          <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                            <span className="text-gray-900">{user?.section || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* For admins */}
                        {user?.role === 'admin' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Admin ID */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Admin ID</label>
                              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                                <span className="text-gray-900">{user?.employee_id || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Last Name */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                                <span className="text-gray-900">{user?.last_name || 'N/A'}</span>
                              </div>
                            </div>

                            {/* First Name */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                                <span className="text-gray-900">{user?.first_name || 'N/A'}</span>
                              </div>
                            </div>

                            {/* Middle Name */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                              <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                                <span className="text-gray-900">{user?.middle_name || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* For teachers */
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                              <span className="text-gray-900">{user?.name || 'N/A'}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Contact Details Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Contact Number - only show for students, working students, and teachers */}
                      {(user?.role === 'student' || user?.role === 'working_student' || user?.role === 'teacher') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Contact No.</label>
                          <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                            <span className="text-gray-900">{user?.contact_number || 'N/A'}</span>
                          </div>
                        </div>
                      )}

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                          <span className="text-gray-900">{user?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Account Created Section */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Created</h4>
                    <div>
                      <div className="px-3 py-2 bg-gray-50 rounded-md border border-gray-200">
                        <span className="text-gray-900">
                          {user?.created ? new Date(user.created).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </span>
                      </div>
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

          </div>
        </div>
      )}

      {/* Logout Confirmation Modal (for students only) */}
      {showLogoutConfirmModal && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleLogoutCancel();
            }
          }}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* Modal Content */}
            <div className="p-6">
              {/* Icon */}
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                Are you sure you want to logout?
              </h3>
              
              {/* Description */}
              <p className="text-sm text-gray-600 text-center mb-6">
                You'll be asked to provide equipment feedback before logging out.
              </p>
              
              {/* Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleLogoutCancel}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  No, Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLogoutConfirm}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm shadow-md"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Feedback Modal (for students only) */}
      {showFeedbackModal && (
        <LogoutFeedbackModal
          onClose={handleFeedbackCancel}
          onSubmit={handleFeedbackSubmit}
        />
      )}
    </div>
  );
}

export default Layout;