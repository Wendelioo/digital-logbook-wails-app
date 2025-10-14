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
  AlertCircle
} from 'lucide-react';
import { 
  GetStudentDashboard,
  RecordAttendance,
  GetStudentFeedback
} from '../../wailsjs/go/main/App';
import { useAuth } from '../contexts/AuthContext';
import { main } from '../../wailsjs/go/models';

// Use the generated models from the backend
type Attendance = main.Attendance;
type StudentDashboardData = main.StudentDashboard;
type Feedback = main.Feedback;

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
        <h2 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}!</h2>
        <p className="text-gray-600">Here's your attendance overview and today's activity</p>
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
            <p className="text-gray-500">No log entry for today yet</p>
            <p className="text-sm text-gray-400">Your attendance will appear here once recorded</p>
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
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAttendance = async () => {
      if (!user) return;
      
      try {
        const data = await GetStudentDashboard(user.id);
        setAttendance(data.attendance || []);
      } catch (error) {
        console.error('Failed to load attendance:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Login History</h2>
        <p className="text-gray-600">View your complete login and attendance history</p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {attendance.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No login records found</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {attendance.map((record) => (
              <li key={record.id}>
                <div className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full mr-4 ${
                        record.status === 'Present' ? 'bg-green-500' :
                        record.status === 'Absent' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Class ID: {record.class_id}
                        </p>
                        <p className="text-sm text-gray-600">
                          Date: {record.date}
                        </p>
                        <p className="text-sm text-gray-500">
                          Time In: {record.time_in || '-'} | Time Out: {record.time_out || '-'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      record.status === 'Present' ? 'bg-green-100 text-green-800' :
                      record.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function FeedbackHistory() {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadFeedback = async () => {
      if (!user) return;
      
      try {
        const data = await GetStudentFeedback(user.id);
        setFeedbackList(data || []);
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
        <h2 className="text-2xl font-bold text-gray-900">My Feedback History</h2>
        <p className="text-gray-600">View all equipment feedback you've submitted during logout</p>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {feedbackList.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h3>
            <p className="text-gray-500 mb-4">
              You haven't submitted any equipment feedback yet.
            </p>
            <p className="text-sm text-gray-400">
              Feedback is automatically collected when you logout. It will appear here once you submit your first feedback.
            </p>
          </div>
        ) : (
          feedbackList.map((feedback, index) => (
            <div 
              key={feedback.id} 
              className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-3 border-b border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                      {feedbackList.length - index}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Feedback Session #{feedbackList.length - index}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(feedback.date_submitted).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    {feedback.pc_number}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Computer Status */}
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      feedback.equipment_condition === 'Good' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Computer</p>
                      <p className={`text-sm font-semibold ${
                        feedback.equipment_condition === 'Good' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {feedback.equipment_condition}
                      </p>
                    </div>
                  </div>

                  {/* Mouse Status */}
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      feedback.mouse_condition === 'Good' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Mouse</p>
                      <p className={`text-sm font-semibold ${
                        feedback.mouse_condition === 'Good' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {feedback.mouse_condition}
                      </p>
                    </div>
                  </div>

                  {/* Keyboard Status */}
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      feedback.keyboard_condition === 'Good' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Keyboard</p>
                      <p className={`text-sm font-semibold ${
                        feedback.keyboard_condition === 'Good' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {feedback.keyboard_condition}
                      </p>
                    </div>
                  </div>

                  {/* Monitor Status */}
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      feedback.monitor_condition === 'Good' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">Monitor</p>
                      <p className={`text-sm font-semibold ${
                        feedback.monitor_condition === 'Good' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {feedback.monitor_condition}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Comments */}
                {feedback.comments && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Additional Comments:</p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 italic">"{feedback.comments}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {feedbackList.length > 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                About Feedback
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>This is a compilation of all equipment feedback you've submitted when logging out. The system automatically records your feedback to help maintain equipment quality.</p>
              </div>
            </div>
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
