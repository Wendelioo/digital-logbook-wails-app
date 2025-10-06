import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  FileText,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { 
  GetInstructorDashboard,
  GetSubjects,
  RecordAttendance,
  ExportAttendanceCSV
} from '../../wailsjs/go/main/App';
import { useAuth } from '../contexts/AuthContext';

interface Subject {
  id: number;
  code: string;
  name: string;
  instructor: string;
  room: string;
}

interface Attendance {
  id: number;
  student_id: number;
  subject_id: number;
  date: string;
  status: string;
  time_in: string;
  time_out: string;
}

interface InstructorDashboardData {
  subjects: Subject[];
  attendance: Attendance[];
}

function DashboardOverview() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<InstructorDashboardData>({
    subjects: [],
    attendance: []
  });
  const [loading, setLoading] = useState(false); // Start with false to show content immediately
  const [error, setError] = useState<string>('');

  // Always show the basic UI first, then load data
  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.name) {
        console.log('No user name available, skipping dashboard load');
        return;
      }
      
      setLoading(true);
      try {
        console.log('Loading dashboard for instructor:', user.name);
        const data = await GetInstructorDashboard(user.name);
        console.log('Dashboard data received:', data);
        
        if (data) {
          setDashboardData(data);
        }
        setError('');
      } catch (error) {
        console.error('Failed to load instructor dashboard:', error);
        setError('Unable to load dashboard data from server.');
        // Keep empty data as fallback
      } finally {
        setLoading(false);
      }
    };

    // Delay the API call slightly to ensure UI renders first
    const timer = setTimeout(loadDashboard, 100);
    return () => clearTimeout(timer);
  }, [user?.name]);

  return (
    <div className="p-6">
      {/* Welcome Message - Always visible */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name || 'Instructor'}!</h1>
        <p className="text-gray-600">Here's your instructor dashboard overview</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <p className="text-sm mt-1">Showing offline mode with sample data.</p>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
          <p>Loading your dashboard data...</p>
        </div>
      )}

      {/* Quick Stats - Always visible with real or fallback data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    My Subjects
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {dashboardData.subjects.length || (error ? '2' : '0')}
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
                <ClipboardList className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Attendance
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {dashboardData.attendance.length || (error ? '5' : '0')}
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
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Present Today
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {dashboardData.attendance.filter(a => a.status === 'Present').length || (error ? '4' : '0')}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Subjects Section */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">My Subjects</h3>
        {dashboardData.subjects.length === 0 && !error ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects assigned</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any subjects assigned yet. Contact the administrator to get subjects assigned.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData.subjects.length > 0 ? (
              dashboardData.subjects.map((subject) => (
                <div key={subject.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">{subject.code}</h3>
                        <p className="text-sm text-gray-600">{subject.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{subject.room}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : error ? (
              // Show sample data when there's an error
              <>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">IT101</h3>
                        <p className="text-sm text-gray-600">Programming Fundamentals</p>
                        <p className="text-sm text-gray-500 mt-1">Lab A</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-lg font-medium text-gray-900">IT202</h3>
                        <p className="text-sm text-gray-600">Database Management</p>
                        <p className="text-sm text-gray-500 mt-1">Lab B</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Today's Attendance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Today's Attendance</h3>
        </div>
        <div className="px-6 py-4">
          {dashboardData.attendance.length === 0 && !error ? (
            <div className="text-center py-8">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
              <p className="mt-1 text-sm text-gray-500">
                No attendance has been recorded for today yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dashboardData.attendance.length > 0 ? (
                dashboardData.attendance.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        record.status === 'Present' ? 'bg-green-500' :
                        record.status === 'Absent' ? 'bg-red-500' : 'bg-yellow-500'
                      }`}></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Student ID: {record.student_id}</p>
                        <p className="text-sm text-gray-500">{record.time_in} - {record.time_out}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      record.status === 'Present' ? 'bg-green-100 text-green-800' :
                      record.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status}
                    </span>
                  </div>
                ))
              ) : error ? (
                // Show sample attendance when there's an error
                <>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3 bg-green-500"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Student ID: 2025-1234</p>
                        <p className="text-sm text-gray-500">08:00 - 17:00</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Present
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3 bg-green-500"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Student ID: 2025-5678</p>
                        <p className="text-sm text-gray-500">08:15 - 17:00</p>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Present
                    </span>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Classlists() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadSubjects = async () => {
      setLoading(true);
      try {
        const data = await GetSubjects();
        setSubjects(data || []);
        setError('');
      } catch (error) {
        console.error('Failed to load subjects:', error);
        setError('Unable to load subjects from server.');
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Class Lists</h2>
        <p className="text-gray-600">View and manage your assigned class lists</p>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {subjects.length > 0 ? (
              subjects.map((subject) => (
                <li key={subject.id}>
                  <div className="px-4 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <BookOpen className="h-6 w-6 text-primary-600 mr-3" />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{subject.code}</h3>
                          <p className="text-sm text-gray-600">{subject.name}</p>
                          <p className="text-sm text-gray-500">{subject.room}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 text-sm">
                          View Students
                        </button>
                        <button className="text-primary-600 hover:text-primary-900 text-sm">
                          Export List
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <div className="px-4 py-8 text-center">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No subjects are assigned to you yet.
                  </p>
                </div>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function AttendanceManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadSubjects = async () => {
      setLoading(true);
      try {
        const data = await GetSubjects();
        setSubjects(data || []);
        if (data && data.length > 0) {
          setSelectedSubject(data[0]);
        }
        setError('');
      } catch (error) {
        console.error('Failed to load subjects:', error);
        setError('Unable to load subjects from server.');
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  const handleExportAttendance = async () => {
    if (!selectedSubject) return;
    
    try {
      const filename = await ExportAttendanceCSV(selectedSubject.id);
      alert(`Attendance exported to ${filename}`);
    } catch (error) {
      console.error('Failed to export attendance:', error);
      alert('Failed to export attendance. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
          <p className="text-gray-600">Record and manage daily attendance logs</p>
        </div>
        {selectedSubject && (
          <button
            onClick={handleExportAttendance}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Attendance
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Subject Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Subject
        </label>
        <select
          value={selectedSubject?.id || ''}
          onChange={(e) => {
            const subject = subjects.find(s => s.id === parseInt(e.target.value));
            setSelectedSubject(subject || null);
          }}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Select a subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.code} - {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Recording */}
      {selectedSubject && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Record Attendance for {selectedSubject.code}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                alert('Attendance recording feature would be implemented here');
              }}
              className="flex items-center justify-center p-4 border-2 border-green-300 rounded-lg hover:bg-green-50 transition-colors"
            >
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-green-700 font-medium">Present</span>
            </button>
            <button
              onClick={() => {
                alert('Absent recording feature would be implemented here');
              }}
              className="flex items-center justify-center p-4 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <XCircle className="h-6 w-6 text-red-600 mr-2" />
              <span className="text-red-700 font-medium">Absent</span>
            </button>
            <button
              onClick={() => {
                alert('Seat-in recording feature would be implemented here');
              }}
              className="flex items-center justify-center p-4 border-2 border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors"
            >
              <Clock className="h-6 w-6 text-yellow-600 mr-2" />
              <span className="text-yellow-700 font-medium">Seat-in</span>
            </button>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Attendance Records</h3>
        </div>
        <div className="px-6 py-4">
          {attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
              <p className="mt-1 text-sm text-gray-500">
                No attendance records found for the selected subject.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      record.status === 'Present' ? 'bg-green-500' :
                      record.status === 'Absent' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Student ID: {record.student_id}</p>
                      <p className="text-sm text-gray-500">{record.date} • {record.time_in} - {record.time_out}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    record.status === 'Present' ? 'bg-green-100 text-green-800' :
                    record.status === 'Absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InstructorDashboard() {
  const location = useLocation();
  
  console.log('InstructorDashboard component rendering');
  console.log('Current location:', location.pathname);
  
  const navigationItems = [
    { name: 'Dashboard', href: '/instructor', icon: <LayoutDashboard className="h-5 w-5" />, current: location.pathname === '/instructor' },
    { name: 'Class Lists', href: '/instructor/classlists', icon: <Users className="h-5 w-5" />, current: location.pathname === '/instructor/classlists' },
    { name: 'Attendance', href: '/instructor/attendance', icon: <ClipboardList className="h-5 w-5" />, current: location.pathname === '/instructor/attendance' },
  ];

  return (
    <Layout navigationItems={navigationItems} title="Instructor Dashboard">
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="classlists" element={<Classlists />} />
        <Route path="attendance" element={<AttendanceManagement />} />
      </Routes>
    </Layout>
  );
}

export default InstructorDashboard;
