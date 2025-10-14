import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  FileText,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Calendar,
  MapPin
} from 'lucide-react';
import { 
  GetTeacherClasses,
  GetClassStudents,
  RecordAttendance,
  ExportAttendanceCSV
} from '../../wailsjs/go/main/App';
import { useAuth } from '../contexts/AuthContext';
import { main } from '../../wailsjs/go/models';

// Use the generated models from the backend
type Class = main.CourseClass;
type ClasslistEntry = main.ClasslistEntry;
type Attendance = main.Attendance;

function DashboardOverview() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.id) {
        console.log('No teacher ID available');
        return;
      }
      
      setLoading(true);
      try {
        // Note: user.id should be the teacher's database ID from teachers table
        console.log('Loading classes for teacher ID:', user.id);
        const classesData = await GetTeacherClasses(user.id);
        console.log('Classes data received:', classesData);
        
        if (classesData) {
          setClasses(classesData);
        }
        setError('');
      } catch (error) {
        console.error('Failed to load teacher classes:', error);
        setError('Unable to load your classes from server.');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(loadDashboard, 100);
    return () => clearTimeout(timer);
  }, [user?.id]);

  const totalStudents = classes.reduce((sum, cls) => sum + cls.enrolled_count, 0);
  const activeClasses = classes.filter(cls => cls.is_active).length;

  return (
    <div className="p-6">
      {/* Welcome Message */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.first_name || user?.name || 'Teacher'}!</h1>
        <p className="text-gray-600">Here's your teacher dashboard overview</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md">
          <p>Loading your dashboard data...</p>
        </div>
      )}

      {/* Quick Stats */}
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
                    Active Classes
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {activeClasses}
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
                    Total Students
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {totalStudents}
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
                    Subjects
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {new Set(classes.map(c => c.subject_id)).size}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classes List */}
      {!loading && classes.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Classes</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {classes.map((cls) => (
              <div key={cls.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {cls.subject_code} - {cls.subject_name}
                      </h4>
                      {cls.section && (
                        <span className="ml-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          Section {cls.section}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                      {cls.schedule && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {cls.schedule}
                        </div>
                      )}
                      {cls.room && (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {cls.room}
                        </div>
                      )}
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {cls.enrolled_count} students
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Classlists() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadClasses = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const data = await GetTeacherClasses(user.id);
        setClasses(data || []);
        setError('');
      } catch (error) {
        console.error('Failed to load classes:', error);
        setError('Unable to load classes from server.');
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [user?.id]);

  const handleViewClassList = (classId: number) => {
    navigate(`/teacher/classlists/${classId}`);
  };

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
      ) : classes.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Section
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{cls.subject_code}</div>
                    <div className="text-sm text-gray-500">{cls.subject_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cls.section || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cls.schedule || 'TBA'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cls.room || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {cls.enrolled_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button 
                      onClick={() => handleViewClassList(cls.id)}
                      className="text-primary-600 hover:text-primary-900 font-medium hover:underline transition-colors"
                    >
                      View Roster
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white shadow sm:rounded-lg p-6">
          <div className="text-center py-8">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No classes are assigned to you yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ViewClassList() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<ClasslistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadClassDetails = async () => {
      if (!id || !user?.id) return;
      
      setLoading(true);
      try {
        // Get all teacher's classes and find the selected one
        const classes = await GetTeacherClasses(user.id);
        const selectedClass = classes.find(c => c.id === parseInt(id));
        
        if (selectedClass) {
          setClassInfo(selectedClass);
        }

        // Get enrolled students in this class
        const studentsData = await GetClassStudents(parseInt(id));
        setStudents(studentsData || []);
        setError('');
      } catch (error) {
        console.error('Failed to load class details:', error);
        setError('Unable to load class details from server.');
      } finally {
        setLoading(false);
      }
    };

    loadClassDetails();
  }, [id, user?.id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Class not found</p>
          <button
            onClick={() => navigate('/teacher/classlists')}
            className="mt-4 text-primary-600 hover:text-primary-900"
          >
            Back to Class Lists
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with Back Button */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate('/teacher/classlists')}
          className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Roster</h2>
          <p className="text-gray-600">View students enrolled in this class</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Class Information Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Class Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex">
            <span className="font-medium text-gray-700 w-32">Subject Code:</span>
            <span className="text-gray-900">{classInfo.subject_code}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 w-32">Section:</span>
            <span className="text-gray-900">{classInfo.section || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 w-32">Subject Name:</span>
            <span className="text-gray-900">{classInfo.subject_name}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 w-32">Schedule:</span>
            <span className="text-gray-900">{classInfo.schedule || 'TBA'}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 w-32">Room:</span>
            <span className="text-gray-900">{classInfo.room || 'N/A'}</span>
          </div>
          <div className="flex">
            <span className="font-medium text-gray-700 w-32">Year Level:</span>
            <span className="text-gray-900">{classInfo.year_level || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Student Count */}
      <div className="mb-4">
        <div className="text-sm text-gray-600">
          Total Students: <span className="font-semibold">{students.length}</span>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {students.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Middle Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year/Section
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.student_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.first_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.middle_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.year_level || '-'} {student.section ? `/ ${student.section}` : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      student.status === 'active' ? 'bg-green-100 text-green-800' :
                      student.status === 'dropped' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
            <p className="mt-1 text-sm text-gray-500">
              No students are enrolled in this class yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function AttendanceManagement() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadClasses = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        const data = await GetTeacherClasses(user.id);
        setClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClass(data[0]);
        }
        setError('');
      } catch (error) {
        console.error('Failed to load classes:', error);
        setError('Unable to load classes from server.');
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [user?.id]);

  const handleExportAttendance = async () => {
    if (!selectedClass) return;
    
    try {
      const filename = await ExportAttendanceCSV(selectedClass.id);
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
        {selectedClass && (
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

      {/* Class Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Class
        </label>
        <select
          value={selectedClass?.id || ''}
          onChange={(e) => {
            const cls = classes.find(c => c.id === parseInt(e.target.value));
            setSelectedClass(cls || null);
          }}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Select a class</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.subject_code} - {cls.subject_name} {cls.section ? `(Section ${cls.section})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance Recording Info */}
      {selectedClass && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Record Attendance for {selectedClass.subject_code}
          </h3>
          <p className="text-gray-600 mb-4">
            Attendance recording will be implemented here. You'll be able to mark students as present, absent, late, or excused.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => {
                alert('Attendance recording feature - Coming soon!');
              }}
              className="flex items-center justify-center p-4 border-2 border-green-300 rounded-lg hover:bg-green-50 transition-colors"
            >
              <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-green-700 font-medium">Present</span>
            </button>
            <button
              onClick={() => {
                alert('Absent recording feature - Coming soon!');
              }}
              className="flex items-center justify-center p-4 border-2 border-red-300 rounded-lg hover:bg-red-50 transition-colors"
            >
              <XCircle className="h-6 w-6 text-red-600 mr-2" />
              <span className="text-red-700 font-medium">Absent</span>
            </button>
            <button
              onClick={() => {
                alert('Late recording feature - Coming soon!');
              }}
              className="flex items-center justify-center p-4 border-2 border-yellow-300 rounded-lg hover:bg-yellow-50 transition-colors"
            >
              <Clock className="h-6 w-6 text-yellow-600 mr-2" />
              <span className="text-yellow-700 font-medium">Late</span>
            </button>
          </div>
        </div>
      )}

      {/* Attendance Records Placeholder */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Attendance Records</h3>
        </div>
        <div className="px-6 py-4">
          <div className="text-center py-8">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
            <p className="mt-1 text-sm text-gray-500">
              Start recording attendance for your classes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherDashboard() {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', href: '/teacher', icon: <LayoutDashboard className="h-5 w-5" />, current: location.pathname === '/teacher' },
    { name: 'Class Lists', href: '/teacher/classlists', icon: <Users className="h-5 w-5" />, current: location.pathname === '/teacher/classlists' },
    { name: 'Attendance', href: '/teacher/attendance', icon: <ClipboardList className="h-5 w-5" />, current: location.pathname === '/teacher/attendance' },
  ];

  return (
    <Layout navigationItems={navigationItems} title="Teacher Dashboard">
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="classlists" element={<Classlists />} />
        <Route path="classlists/:id" element={<ViewClassList />} />
        <Route path="attendance" element={<AttendanceManagement />} />
      </Routes>
    </Layout>
  );
}

export default TeacherDashboard;
