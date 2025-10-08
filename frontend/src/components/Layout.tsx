import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  User,
  Settings,
  LogOut,
  ChevronDown
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
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
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
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </button>
                    <button
                      type="button"
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
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
    </div>
  );
}

export default Layout;