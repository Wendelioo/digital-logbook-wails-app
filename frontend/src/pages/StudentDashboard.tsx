import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  LayoutDashboard, 
  ClipboardList, 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  SlidersHorizontal,
  X,
  Search
} from 'lucide-react';
import { 
  GetStudentDashboard,
  RecordAttendance,
  GetStudentFeedback,
  GetStudentLoginLogs
} from '../../wailsjs/go/main/App';
import { useAuth } from '../contexts/AuthContext';
import { main } from '../../wailsjs/go/models';

// Use the generated models from the backend
type Attendance = main.Attendance;
type StudentDashboardData = main.StudentDashboard;
type Feedback = main.Feedback;

// LoginLog interface matching the JSON structure from backend
interface LoginLog {
  id: number;
  user_id: number;
  user_name: string;
  user_type: string;
  pc_number?: string;
  login_time: string;
  logout_time?: string;
}

function DashboardOverview() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData>(new main.StudentDashboard({
    attendance: [],
    today_log: undefined
  }));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user) return;
      
      try {
        const data = await GetStudentDashboard(user.id);
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to load student dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.first_name || user?.name}!</h2>
      </div>

      {/* Today's Log */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Log</h3>
        {dashboardData.today_log ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full mr-3 ${
                  dashboardData.today_log.status === 'Present' ? 'bg-green-500' :
                  dashboardData.today_log.status === 'Absent' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Status: {dashboardData.today_log.status}
                  </p>
                  <p className="text-sm text-gray-600">
                    Time In: {dashboardData.today_log.time_in || '-'} | Time Out: {dashboardData.today_log.time_out || '-'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                dashboardData.today_log.status === 'Present' ? 'bg-green-100 text-green-800' :
                dashboardData.today_log.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {dashboardData.today_log.status}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          </div>
        )}
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Present
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {(dashboardData.attendance || []).filter(a => a.status === 'Present').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Absent
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {(dashboardData.attendance || []).filter(a => a.status === 'Absent').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Seat-in
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {(dashboardData.attendance || []).filter(a => a.status === 'Seat-in').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="attendance"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ClipboardList className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-gray-900">View Login History</span>
          </Link>
          <Link
            to="feedback"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-gray-900">View Feedback History</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoginHistory() {
  const { user } = useAuth();
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const loadLoginLogs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        console.log('Loading login logs for user ID:', user.id);
        const data = await GetStudentLoginLogs(user.id);
        console.log('Received login logs data:', data);
        console.log('Number of logs:', data?.length || 0);
        
        if (data && Array.isArray(data)) {
          setLoginLogs(data);
          setFilteredLogs(data);
          setError('');
        } else {
          setLoginLogs([]);
          setFilteredLogs([]);
          setError('');
        }
      } catch (error) {
        console.error('Failed to load login logs:', error);
        setError(`Unable to load login history: ${error}`);
        setLoginLogs([]);
        setFilteredLogs([]);
      } finally {
        setLoading(false);
      }
    };

    loadLoginLogs();
  }, [user]);

  // Filter logs based on date and search
  useEffect(() => {
    let filtered = loginLogs;

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(log => {
        if (!log.login_time) return false;
        
        const logDate = new Date(log.login_time);
        const selected = new Date(selectedDate);
        
        // Compare only the date part (ignore time)
        return logDate.toDateString() === selected.toDateString();
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        (log.pc_number && log.pc_number.toLowerCase().includes(query)) ||
        (log.login_time && new Date(log.login_time).toLocaleString().toLowerCase().includes(query))
      );
    }
    
    setFilteredLogs(filtered);
  }, [loginLogs, selectedDate, searchQuery]);

  const clearFilters = () => {
    setSelectedDate(null);
    setSearchQuery('');
  };

  const activeFilterCount = selectedDate ? 1 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Login History</h2>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white rounded-full text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            {/* Dropdown with Date Picker */}
            {showFilters && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Select Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    {selectedDate && (
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="w-full text-xs text-gray-600 hover:text-gray-900 underline text-left"
                      >
                        Clear Date Filter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {(searchQuery || selectedDate) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PC Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Login Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Logout Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {log.pc_number || <span className="text-gray-400 italic">Unknown</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.login_time ? new Date(log.login_time).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: true 
                      }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.logout_time ? (
                        new Date(log.logout_time).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true 
                        })
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {log.login_time ? new Date(log.login_time).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.logout_time ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-2 h-2 mr-1.5 bg-green-600 rounded-full animate-pulse"></span>
                          Active Session
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FeedbackHistory() {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [filteredFeedback, setFilteredFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const loadFeedback = async () => {
      if (!user) return;
      
      try {
        const data = await GetStudentFeedback(user.id);
        setFeedbackList(data || []);
        setFilteredFeedback(data || []);
        setError('');
      } catch (error) {
        console.error('Failed to load feedback:', error);
        setError('Unable to load feedback history. Make sure you are connected to the database.');
      } finally {
        setLoading(false);
      }
    };

    loadFeedback();
  }, [user]);

  // Filter feedback based on date and search
  useEffect(() => {
    let filtered = feedbackList;

    // Apply date filter
    if (selectedDate) {
      filtered = filtered.filter(feedback => {
        if (!feedback.date_submitted) return false;
        
        const feedbackDate = new Date(feedback.date_submitted);
        const selected = new Date(selectedDate);
        
        // Compare only the date part (ignore time)
        return feedbackDate.toDateString() === selected.toDateString();
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(feedback =>
        (feedback.pc_number && feedback.pc_number.toLowerCase().includes(query)) ||
        (feedback.comments && feedback.comments.toLowerCase().includes(query)) ||
        (feedback.date_submitted && new Date(feedback.date_submitted).toLocaleString().toLowerCase().includes(query))
      );
    }
    
    setFilteredFeedback(filtered);
  }, [feedbackList, selectedDate, searchQuery]);

  const clearFilters = () => {
    setSelectedDate(null);
    setSearchQuery('');
  };

  const activeFilterCount = selectedDate ? 1 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Feedback History</h2>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 bg-white shadow rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-primary-50 border-primary-500 text-primary-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <SlidersHorizontal className="h-5 w-5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white rounded-full text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>
            
            {/* Dropdown with Date Picker */}
            {showFilters && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Select Date</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                          onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                          max={new Date().toISOString().split('T')[0]}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                    {selectedDate && (
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="w-full text-xs text-gray-600 hover:text-gray-900 underline text-left"
                      >
                        Clear Date Filter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          {(searchQuery || selectedDate) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {filteredFeedback.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <p className="text-gray-500">No reports available</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PC Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Computer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyboard
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                    Comments
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFeedback.map((feedback, index) => (
                  <tr key={feedback.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {filteredFeedback.length - index}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {new Date(feedback.date_submitted).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(feedback.date_submitted).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                        {feedback.pc_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        feedback.equipment_condition === 'Good'
                          ? 'bg-green-100 text-green-800'
                          : feedback.equipment_condition === 'Minor Issue'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {feedback.equipment_condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        feedback.mouse_condition === 'Good'
                          ? 'bg-green-100 text-green-800'
                          : feedback.mouse_condition === 'Minor Issue'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {feedback.mouse_condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        feedback.keyboard_condition === 'Good'
                          ? 'bg-green-100 text-green-800'
                          : feedback.keyboard_condition === 'Minor Issue'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {feedback.keyboard_condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        feedback.monitor_condition === 'Good'
                          ? 'bg-green-100 text-green-800'
                          : feedback.monitor_condition === 'Minor Issue'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {feedback.monitor_condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <div className="max-w-xs overflow-hidden">
                        {feedback.comments ? (
                          <span className="text-gray-600">{feedback.comments}</span>
                        ) : (
                          <span className="text-gray-400 italic">No comments</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentDashboard() {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', href: '/student', icon: <LayoutDashboard className="h-5 w-5" />, current: location.pathname === '/student' },
    { name: 'Login History', href: '/student/attendance', icon: <ClipboardList className="h-5 w-5" />, current: location.pathname === '/student/attendance' },
    { name: 'Feedback History', href: '/student/feedback', icon: <MessageSquare className="h-5 w-5" />, current: location.pathname === '/student/feedback' },
  ];

  return (
    <Layout navigationItems={navigationItems} title="Student Dashboard">
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="attendance" element={<LoginHistory />} />
        <Route path="feedback" element={<FeedbackHistory />} />
      </Routes>
    </Layout>
  );
}

export default StudentDashboard;
