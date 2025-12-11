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
  MapPin,
  Calculator,
  Globe,
  FlaskConical,
  GraduationCap,
  Eye,
  Edit,
  Trash2,
  Plus,
  Library,
  CalendarPlus
} from 'lucide-react';
import { 
  GetTeacherClassesByUserID,
  GetClassStudents,
  GetClassAttendance,
  InitializeAttendanceForClass,
  UpdateAttendanceRecord,
  RecordAttendance,
  ExportAttendanceCSV,
  GetTeacherClassesCreatedByWorkingStudents,
  UpdateClass,
  DeleteClass,
  GetAllStudentsForEnrollment,
  EnrollMultipleStudents,
  UnenrollStudentFromClassByIDs,
  GetAllClasses,
  CreateClass,
  CreateSubject,
  GetSubjects,
  GetAllTeachers
} from '../../wailsjs/go/main/App';
import { useAuth } from '../contexts/AuthContext';
import { main } from '../../wailsjs/go/models';

// Use the generated models from the backend
type Class = main.CourseClass;
type ClasslistEntry = main.ClasslistEntry;
type Attendance = main.Attendance;
type ClassStudent = main.ClassStudent;
type User = main.User;
type Subject = main.Subject;

// Helper function to get subject icon and color
function getSubjectIconAndColor(subjectCode: string, subjectName: string) {
  const code = subjectCode.toLowerCase();
  const name = subjectName.toLowerCase();
  
  if (code.includes('math') || name.includes('math')) {
    return {
      icon: <Calculator className="h-6 w-6" />,
      headerColor: 'bg-blue-600',
      iconColor: 'text-blue-200'
    };
  }
  if (code.includes('hist') || name.includes('history') || name.includes('civics')) {
    return {
      icon: <Globe className="h-6 w-6" />,
      headerColor: 'bg-green-600',
      iconColor: 'text-green-200'
    };
  }
  if (code.includes('sci') || name.includes('science') || name.includes('lab')) {
    return {
      icon: <FlaskConical className="h-6 w-6" />,
      headerColor: 'bg-green-600',
      iconColor: 'text-green-200'
    };
  }
  if (code.includes('eng') || name.includes('english') || name.includes('literature')) {
    return {
      icon: <BookOpen className="h-6 w-6" />,
      headerColor: 'bg-purple-600',
      iconColor: 'text-purple-200'
    };
  }
  // Default
  return {
    icon: <GraduationCap className="h-6 w-6" />,
    headerColor: 'bg-indigo-600',
    iconColor: 'text-indigo-200'
  };
}

function DashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
        const classesData = await GetTeacherClassesByUserID(user.id);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Library className="h-8 w-8 text-blue-600" />
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
      </div>

      {/* Classes List - Card Grid */}
      {!loading && classes.length > 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => {
              const { icon, headerColor, iconColor } = getSubjectIconAndColor(cls.subject_code, cls.subject_name);
              return (
                <div 
                  key={cls.class_id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/teacher/class-management/${cls.class_id}`)}
                >
                  {/* Card Header */}
                  <div className={`${headerColor} px-4 py-3 flex items-center justify-between`}>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">{cls.subject_name}</h3>
                      <p className="text-white text-sm opacity-90">{cls.subject_code}</p>
                    </div>
                    <div className={iconColor}>
                      {icon}
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="px-4 py-4 bg-white">
                    <div className="flex items-center mb-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
                        <Users className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cls.teacher_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{cls.enrolled_count} students</span>
                    </div>
                    {cls.schedule && (
                      <div className="flex items-center text-sm text-gray-600 mt-2">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{cls.schedule}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {!loading && classes.length === 0 && (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No classes found</h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have any assigned classes yet.
          </p>
        </div>
      )}
    </div>
  );
}

function ClassManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const loadClasses = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Get all classes for this teacher (not just those created by working students)
        const data = await GetTeacherClassesByUserID(user.id);
        setClasses(data || []);
        setFilteredClasses(data || []);
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

  useEffect(() => {
    let filtered = classes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.school_year && cls.school_year.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cls.year_level && cls.year_level.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cls.section && cls.section.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredClasses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, classes]);

  const handleViewClassList = (classId: number) => {
    navigate(`/teacher/class-management/${classId}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredClasses.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentClasses = filteredClasses.slice(startIndex, endIndex);
  const startEntry = filteredClasses.length > 0 ? startIndex + 1 : 0;
  const endEntry = Math.min(endIndex, filteredClasses.length);

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Class Management</h2>
          <button
            onClick={() => navigate('/teacher/create-classlist')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            ADD NEW
          </button>
        </div>
      </div>

      {error && (
        <div className="flex-shrink-0 mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {/* Controls Section */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-700">entries</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder=""
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 bg-white shadow rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                #
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                School Year
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Semester
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Offering Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Subject Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Schedule
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Room
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Teacher
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Students
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentClasses.map((cls, index) => (
              <tr key={cls.class_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {startIndex + index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cls.school_year || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cls.semester || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cls.offering_code || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cls.subject_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cls.schedule || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cls.room || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cls.teacher_name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {cls.enrolled_count}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewClassList(cls.class_id)}
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="View"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/class-management/${cls.class_id}`)}
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Edit"
                    >
                      <Edit className="h-3 w-3" />
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('Are you sure you want to delete this class?')) {
                          try {
                            await DeleteClass(cls.class_id);
                            // Reload classes
                            const data = await GetTeacherClassesCreatedByWorkingStudents(user?.id || 0);
                            setClasses(data || []);
                            setFilteredClasses(data || []);
                            alert('Class deleted successfully!');
                          } catch (error) {
                            console.error('Failed to delete class:', error);
                            alert('Failed to delete class. Please try again.');
                          }
                        }
                      }}
                      className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      {filteredClasses.length > 0 && (
        <div className="flex-shrink-0 mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startEntry} to {endEntry} of {filteredClasses.length} entries
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700"
            >
              {currentPage}
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {filteredClasses.length === 0 && !error && (
        <div className="text-center py-12">
          {searchTerm ? (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No matching classes found</h3>
              <div className="mt-6">
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Search
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't created any classes yet.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/teacher/create-classlist')}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Class
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CreateClasslist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    schoolYear: '2024-2025',
    semester: '1st Semester',
    offeringCode: '',
    subjectCode: '',
    subjectName: '',
    schedule: '',
    room: '',
    selectedDays: [] as string[],
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const newDays = prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day];
      return { ...prev, selectedDays: newDays };
    });
  };

  const formatSchedule = (days: string[], startTime: string, endTime: string): string => {
    if (!days.length || !startTime || !endTime) return '';
    
    // Sort days in order
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const sortedDays = [...days].sort((a, b) => {
      return dayOrder.indexOf(a) - dayOrder.indexOf(b);
    });
    
    // Format days (Mon, Tue -> MW or Mon, Wed, Fri -> MWF)
    const dayAbbrs: Record<string, string> = {
      'Mon': 'M',
      'Tue': 'T',
      'Wed': 'W',
      'Thu': 'Th',
      'Fri': 'F',
      'Sat': 'S',
      'Sun': 'Su'
    };
    
    let dayString = '';
    if (sortedDays.length === 2 && sortedDays.includes('Tue') && sortedDays.includes('Thu')) {
      dayString = 'TTh';
    } else {
      dayString = sortedDays.map(d => dayAbbrs[d] || d).join('');
    }
    
    // Format time range
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    
    return `${dayString} ${formatTime(startTime)}-${formatTime(endTime)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate required fields
      if (!formData.subjectCode) {
        setMessage('Subject Code is required.');
        setLoading(false);
        return;
      }

      if (!formData.subjectName) {
        setMessage('Subject Name is required.');
        setLoading(false);
        return;
      }

      if (formData.selectedDays.length === 0) {
        setMessage('Please select at least one day of the week.');
        setLoading(false);
        return;
      }

      if (!formData.startTime || !formData.endTime) {
        setMessage('Please select both start and end time.');
        setLoading(false);
        return;
      }

      // Format schedule from selected days and time
      const formattedSchedule = formatSchedule(formData.selectedDays, formData.startTime, formData.endTime);

      // Use the manually entered subject code
      const subjectCode = formData.subjectCode.toUpperCase().trim();

      // Create the subject (teacher_user_id is not needed for subjects table)
      await CreateSubject(
        subjectCode,
        formData.subjectName,
        user?.id || 0,
        ''
      );

      // Create the class (teacher creates it for themselves)
      await CreateClass(
        subjectCode,
        user?.id || 0,
        formData.offeringCode,
        formattedSchedule,
        formData.room,
        '',
        '',
        formData.semester,
        formData.schoolYear,
        user?.id || 0  // Teacher creates the class themselves
      );

      setNotification({ type: 'success', message: 'Class created successfully!' });
      setMessage('Class created successfully!');
      
      setTimeout(() => {
        navigate('/teacher/class-management');
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Failed to create class: ${errorMessage}`);
      setNotification({ type: 'error', message: `Failed to create class: ${errorMessage}` });
      setTimeout(() => setNotification(null), 5000);
      console.error('Creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        input[type="time"]::-webkit-datetime-edit-hour-field:empty,
        input[type="time"]::-webkit-datetime-edit-minute-field:empty {
          color: transparent;
        }
        input[type="time"]::-webkit-datetime-edit-hour-field:not(:empty),
        input[type="time"]::-webkit-datetime-edit-minute-field:not(:empty) {
          color: inherit;
        }
      `}</style>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out ${
          notification.type === 'success' ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'
        }`}>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="ml-3 w-0 flex-1 pt-0.5">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  onClick={() => setNotification(null)}
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div 
        className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate('/teacher/class-management');
          }
        }}
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl mx-4 relative max-h-[90vh] flex flex-col">
          <button
            type="button"
            onClick={() => navigate('/teacher/class-management')}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors z-10"
          >
            ×
          </button>
          
          <div className="p-3 pb-2 flex-shrink-0 border-b">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add class
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-3">
              <div className="max-w-5xl mx-auto">
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  
                  {/* Left Block: Basic Information */}
                  <div className="bg-gray-50 p-3 rounded-lg border space-y-2.5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Basic Information</h3>
                    
                    <div>
                      <label htmlFor="schoolYear" className="block text-xs font-medium text-gray-700 mb-1">
                        School Year
                      </label>
                      <select
                        id="schoolYear"
                        value={formData.schoolYear}
                        onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="2023-2024">2023-2024</option>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2025-2026">2025-2026</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="semester" className="block text-xs font-medium text-gray-700 mb-1">
                        Semester
                      </label>
                      <select
                        id="semester"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="offeringCode" className="block text-xs font-medium text-gray-700 mb-1">
                        Offering Code
                      </label>
                      <input
                        type="text"
                        id="offeringCode"
                        value={formData.offeringCode}
                        onChange={(e) => setFormData({ ...formData, offeringCode: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="subjectCode" className="block text-xs font-medium text-gray-700 mb-1">
                        Subject Code
                      </label>
                      <input
                        type="text"
                        id="subjectCode"
                        value={formData.subjectCode}
                        onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value.toUpperCase() })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="subjectName" className="block text-xs font-medium text-gray-700 mb-1">
                        Subject Name
                      </label>
                      <input
                        type="text"
                        id="subjectName"
                        value={formData.subjectName}
                        onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Right Block: Schedule & Location */}
                  <div className="bg-gray-50 p-3 rounded-lg border space-y-2.5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Schedule & Location</h3>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Schedule
                      </label>
                      
                      {/* Days of the week selection */}
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Days of the Week
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { value: 'Mon', label: 'Mon' },
                            { value: 'Tue', label: 'Tue' },
                            { value: 'Wed', label: 'Wed' },
                            { value: 'Thu', label: 'Thu' },
                            { value: 'Fri', label: 'Fri' },
                            { value: 'Sat', label: 'Sat' },
                            { value: 'Sun', label: 'Sun' }
                          ].map((day) => (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => toggleDay(day.value)}
                              className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                                formData.selectedDays.includes(day.value)
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {day.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Time range */}
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Time Range
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="time"
                            id="startTime"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                          <span className="text-xs text-gray-500 font-medium">to</span>
                          <input
                            type="time"
                            id="endTime"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>

                      {/* Preview of formatted schedule */}
                      {formData.selectedDays.length > 0 && formData.startTime && formData.endTime && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-xs text-gray-600 mb-0.5">Schedule Preview:</p>
                          <p className="text-xs font-medium text-blue-700">
                            {formatSchedule(formData.selectedDays, formData.startTime, formData.endTime)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="room" className="block text-xs font-medium text-gray-700 mb-1">
                        Room
                      </label>
                      <input
                        type="text"
                        id="room"
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {message && (
                <div className={`mt-4 p-4 rounded-md ${
                  message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex-shrink-0 border-t bg-gray-50 px-3 py-2.5 flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/teacher/class-management')}
                className="px-4 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'SAVE'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function ClassManagementDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<ClasslistEntry[]>([]);
  const [availableStudents, setAvailableStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [editFormData, setEditFormData] = useState({
    schedule: '',
    room: '',
    yearLevel: '',
    section: '',
    semester: '',
    schoolYear: ''
  });
  const [saving, setSaving] = useState(false);

  const loadClassDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const classes = await GetTeacherClassesCreatedByWorkingStudents(user?.id || 0);
      const selectedClass = classes.find(c => c.class_id === parseInt(id));
      
      if (selectedClass) {
        setClassInfo(selectedClass);
        setEditFormData({
          schedule: selectedClass.schedule || '',
          room: selectedClass.room || '',
          yearLevel: selectedClass.year_level || '',
          section: selectedClass.section || '',
          semester: selectedClass.semester || '',
          schoolYear: selectedClass.school_year || ''
        });
      }

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

  useEffect(() => {
    loadClassDetails();
  }, [id, user?.id]);

  const handleRemoveStudent = async (studentId: number, classId: number) => {
    if (!confirm('Are you sure you want to remove this student from the class?')) {
      return;
    }

    try {
      await UnenrollStudentFromClassByIDs(studentId, classId);
      await loadClassDetails();
      alert('Student removed successfully!');
    } catch (error) {
      console.error('Failed to remove student:', error);
      alert('Failed to remove student. Please try again.');
    }
  };

  const handleAddStudent = async () => {
    if (!id) return;
    
    try {
      const available = await GetAllStudentsForEnrollment(parseInt(id));
      setAvailableStudents(available || []);
      setShowAddModal(true);
      setSelectedStudents(new Set());
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to load available students:', error);
      alert('Failed to load students. Please try again.');
    }
  };

  const handleEnrollStudents = async () => {
    if (!id || selectedStudents.size === 0) return;

    setEnrolling(true);
    try {
      const studentIds = Array.from(selectedStudents);
      await EnrollMultipleStudents(studentIds, parseInt(id), user?.id || 0);
      
      setShowAddModal(false);
      await loadClassDetails();
      alert(`Successfully enrolled ${selectedStudents.size} student(s)!`);
    } catch (error) {
      console.error('Failed to enroll students:', error);
      alert('Failed to enroll some students. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleEditClass = () => {
    if (!classInfo) return;
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!id || !classInfo) return;

    setSaving(true);
    try {
      await UpdateClass(
        parseInt(id),
        editFormData.schedule,
        editFormData.room,
        editFormData.yearLevel,
        editFormData.section,
        editFormData.semester,
        editFormData.schoolYear,
        classInfo.is_active
      );
      setShowEditModal(false);
      await loadClassDetails();
      alert('Class updated successfully!');
    } catch (error) {
      console.error('Failed to update class:', error);
      alert('Failed to update class. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }

    try {
      await DeleteClass(parseInt(id));
      alert('Class deleted successfully!');
      navigate('/teacher/class-management');
    } catch (error) {
      console.error('Failed to delete class:', error);
      alert('Failed to delete class. Please try again.');
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const filteredAvailableStudents = availableStudents.filter(student =>
    !student.is_enrolled && (
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.middle_name && student.middle_name.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  const filteredStudents = students.filter(student => {
    const searchLower = studentSearchTerm.toLowerCase();
    return (
      student.student_code.toLowerCase().includes(searchLower) ||
      student.first_name.toLowerCase().includes(searchLower) ||
      student.last_name.toLowerCase().includes(searchLower) ||
      (student.middle_name && student.middle_name.toLowerCase().includes(searchLower))
    );
  });

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
            onClick={() => navigate('/teacher/class-management')}
            className="mt-4 text-primary-600 hover:text-primary-900"
          >
            Back to Class Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/teacher/class-management')}
                className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Class Information</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDeleteClass}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 inline mr-2" />
                DELETE CLASS
              </button>
              <button
                onClick={handleEditClass}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 inline mr-2" />
                EDIT CLASS
              </button>
              <button
                onClick={handleAddStudent}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                ADD STUDENT
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Class Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">School Year:</span>
                <span className="text-gray-900">{classInfo.school_year || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Semester:</span>
                <span className="text-gray-900">{classInfo.semester || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Subject Name:</span>
                <span className="text-gray-900">{classInfo.subject_name || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Schedule:</span>
                <span className="text-gray-900">{classInfo.schedule || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Room:</span>
                <span className="text-gray-900">{classInfo.room || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Teacher:</span>
                <span className="text-gray-900">{classInfo.teacher_name || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700">Class Student List</h3>
        </div>
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Show <select className="border border-gray-300 rounded px-2 py-1 mx-1">
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select> entries
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={studentSearchTerm}
              onChange={(e) => setStudentSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredStudents.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student, index) => (
                  <tr key={student.student_user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {student.student_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.last_name}, {student.first_name} {student.middle_name || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleRemoveStudent(student.student_user_id, student.class_id)}
                        className="text-red-600 hover:text-red-900 font-medium hover:underline transition-colors"
                      >
                        <Trash2 className="h-4 w-4 inline mr-1" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No data available.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 relative max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors z-10"
            >
              ×
            </button>
            
            <div className="text-center p-8 pb-4 flex-shrink-0">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">Add Students to Class</h2>
              <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Select students to enroll in {classInfo?.subject_code}</p>
            </div>

            <div className="px-8 pb-8 flex-1 overflow-hidden flex flex-col">
              <div className="mb-4 flex-shrink-0">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Search students..."
                  />
                </div>
              </div>

              <div className="mb-2 text-sm text-gray-600 flex-shrink-0">
                {selectedStudents.size > 0 ? (
                  <span className="font-semibold text-blue-600">
                    {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                  </span>
                ) : (
                  <span>Select students to enroll</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredAvailableStudents.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={filteredAvailableStudents.length > 0 && filteredAvailableStudents.every(s => selectedStudents.has(s.id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents(new Set(filteredAvailableStudents.map(s => s.id)));
                              } else {
                                setSelectedStudents(new Set());
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAvailableStudents.map((student) => (
                        <tr 
                          key={student.id} 
                          className={`hover:bg-gray-50 cursor-pointer ${selectedStudents.has(student.id) ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleStudentSelection(student.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedStudents.has(student.id)}
                              onChange={() => toggleStudentSelection(student.id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {student.student_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.last_name}, {student.first_name} {student.middle_name || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No students available</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? 'No students match your search criteria.' : 'All students are already enrolled or there are no students in the system.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEnrollStudents}
                  disabled={selectedStudents.size === 0 || enrolling}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Enrolling...' : `Enroll ${selectedStudents.size > 0 ? selectedStudents.size : ''} Student${selectedStudents.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {showEditModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 relative max-h-[90vh] flex flex-col">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors z-10"
            >
              ×
            </button>
            
            <div className="text-center p-8 pb-4 flex-shrink-0">
              <h2 className="text-2xl font-bold text-blue-600 mb-2">Edit Class</h2>
              <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
            </div>

            <div className="px-8 pb-8 flex-1 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Year</label>
                  <input
                    type="text"
                    value={editFormData.schoolYear}
                    onChange={(e) => setEditFormData({ ...editFormData, schoolYear: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                  <select
                    value={editFormData.semester}
                    onChange={(e) => setEditFormData({ ...editFormData, semester: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Semester</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule</label>
                  <input
                    type="text"
                    value={editFormData.schedule}
                    onChange={(e) => setEditFormData({ ...editFormData, schedule: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                  <input
                    type="text"
                    value={editFormData.room}
                    onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                  <input
                    type="text"
                    value={editFormData.yearLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, yearLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={editFormData.section}
                    onChange={(e) => setEditFormData({ ...editFormData, section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceClassSelection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  

  useEffect(() => {
    const loadClasses = async () => {
      if (!user?.id) return;

      setLoading(true);
      try {
        // Get all classes for this teacher (not just those created by working students)
        const data = await GetTeacherClassesByUserID(user.id);
        setClasses(data || []);
        setFilteredClasses(data || []);
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

  useEffect(() => {
    let filtered = classes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.school_year && cls.school_year.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cls.year_level && cls.year_level.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredClasses(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, classes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'excused':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredClasses.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentClasses = filteredClasses.slice(startIndex, endIndex);
  const startEntry = filteredClasses.length > 0 ? startIndex + 1 : 0;
  const endEntry = Math.min(endIndex, filteredClasses.length);

  return (
    <div className="flex flex-col">
      {/* Header Section */}
      <div className="flex-shrink-0 mb-2">
        <h2 className="text-xl font-bold text-gray-900">Select Class to Manage</h2>
      </div>

      {error && (
        <div className="flex-shrink-0 mb-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-md text-sm">
          <p>{error}</p>
        </div>
      )}

      {/* Controls Section */}
      <div className="flex-shrink-0 mb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700">Show</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value={10}>10 entries</option>
              <option value={25}>25 entries</option>
              <option value={50}>50 entries</option>
              <option value={100}>100 entries</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-700">Search</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder=""
            />
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-600">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                #
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                School Year
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                Semester
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                Offering Code
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                Subject Name
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                Schedule
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                Room
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                Teacher
              </th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentClasses.map((cls, index) => (
              <tr key={cls.class_id} className="hover:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {startIndex + index + 1}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {cls.school_year || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {cls.semester || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {cls.offering_code || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {cls.subject_name || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {cls.schedule || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {cls.room || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                  {cls.teacher_name || '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs font-medium">
                  <button
                    onClick={() => navigate(`/teacher/attendance/${cls.class_id}`)}
                    className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    SELECT
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      {filteredClasses.length > 0 && (
        <div className="flex-shrink-0 mt-2 flex items-center justify-between">
          <div className="text-xs text-gray-700">
            Showing {startEntry} to {endEntry} of {filteredClasses.length} entries
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              className="px-2 py-1 text-xs font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700"
            >
              {currentPage}
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-xs text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {filteredClasses.length === 0 && !error && (
        <div className="text-center py-6">
          {searchTerm ? (
            <>
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-xs font-medium text-gray-900">No matching classes found</h3>
              <div className="mt-4">
                <button
                  onClick={() => setSearchTerm('')}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear Search
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-2 text-xs font-medium text-gray-900">No classes found</h3>
              <p className="mt-1 text-xs text-gray-500">
                You don't have any assigned classes yet.
              </p>
            </>
          )}
        </div>
      )}

    </div>
  );
}

function StoredAttendance() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [allAttendanceRecords, setAllAttendanceRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const data = await GetTeacherClassesCreatedByWorkingStudents(user.id);
        setClasses(data || []);
      } catch (error) {
        console.error('Failed to load classes:', error);
      } finally {
        setLoading(false);
      }
    };
    loadClasses();
  }, [user?.id]);

  useEffect(() => {
    if (classes.length > 0) {
      loadAllStoredAttendance();
    }
  }, [classes.length]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'excused':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const loadAllStoredAttendance = async () => {
    if (!user?.id || classes.length === 0) return;
    setLoadingAttendance(true);
    try {
      const allRecords: (Attendance & { classSubjectName?: string })[] = [];
      const today = new Date();
      const datesToCheck: string[] = [];
      
      for (let i = 0; i < 90; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        datesToCheck.push(date.toISOString().split('T')[0]);
      }

      for (const cls of classes) {
        for (const date of datesToCheck) {
          try {
            const records = await GetClassAttendance(cls.class_id, date);
            const savedRecords = records || [];
            savedRecords.forEach(record => {
              allRecords.push({
                ...record,
                classSubjectName: cls.subject_name
              });
            });
          } catch (err) {
            continue;
          }
        }
      }

      allRecords.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });

      setAllAttendanceRecords(allRecords as Attendance[]);
    } catch (error) {
      console.error('Failed to load all attendance:', error);
      setAllAttendanceRecords([]);
    } finally {
      setLoadingAttendance(false);
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
      <h2 className="text-xl font-bold text-gray-900 mb-4">Stored Attendance</h2>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {loadingAttendance ? (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : allAttendanceRecords.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PC Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allAttendanceRecords.map((record) => (
                  <tr key={`${record.class_id}-${record.student_user_id}-${record.date}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(record as any).classSubjectName || record.subject_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.student_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.last_name}, {record.first_name} {record.middle_name || ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.pc_number || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.time_in ? (
                        <span className="text-green-600 font-medium">{record.time_in}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {record.status ? (
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status === 'present' ? 'Present' : record.status === 'absent' ? 'Absent' : record.status}
                        </span>
                      ) : (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          No Status
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No saved attendance records found</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendanceManagementDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<Attendance[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasSelectedDate, setHasSelectedDate] = useState(false);

  useEffect(() => {
    const loadClass = async () => {
      if (!id || !user?.id) return;

      setLoading(true);
      try {
        const classes = await GetTeacherClassesCreatedByWorkingStudents(user.id);
        const foundClass = classes.find(c => c.class_id === parseInt(id));
        setSelectedClass(foundClass || null);
        setError('');
      } catch (error) {
        console.error('Failed to load class:', error);
        setError('Unable to load class from server.');
      } finally {
        setLoading(false);
      }
    };

    loadClass();
  }, [id, user?.id]);

  useEffect(() => {
    if (selectedClass && selectedDate && hasSelectedDate) {
      loadAttendance();
    } else if (!selectedDate) {
      setAttendanceRecords([]);
      setHasSelectedDate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass?.class_id, selectedDate, hasSelectedDate]);

  const loadAttendance = async () => {
    if (!selectedClass || !selectedDate) return;

    setLoadingAttendance(true);
    setError('');
    try {
      const records = await GetClassAttendance(selectedClass.class_id, selectedDate);
      console.log('Loaded attendance records:', records?.length || 0);
      setAttendanceRecords(records || []);
      // If no records found but we have a class, it might mean no students are enrolled
      if ((!records || records.length === 0) && selectedClass) {
        console.log('No attendance records found. This might mean no students are enrolled.');
      }
    } catch (error) {
      console.error('Failed to load attendance:', error);
      setError('Unable to load attendance records. Please try again.');
      setAttendanceRecords([]);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    if (date) {
      setHasSelectedDate(true);
      setAttendanceRecords([]); // Clear previous records
      // The useEffect will automatically trigger loadAttendance
    } else {
      setHasSelectedDate(false);
      setAttendanceRecords([]);
    }
  };



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'excused':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !selectedClass) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!selectedClass) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Class not found</p>
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="mt-4 text-primary-600 hover:text-primary-900"
          >
            Back to Class Selection
          </button>
        </div>
      </div>
    );
  }

  const handleSaveAll = async () => {
    // Save all attendance records
    if (!selectedClass || !selectedDate) return;
    
    try {
      // Initialize attendance if not already done
      if (attendanceRecords.length === 0) {
        await InitializeAttendanceForClass(selectedClass.class_id, selectedDate, user?.id || 0);
        await loadAttendance();
      }
      
      // Small delay to ensure save completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate to stored attendance page
      navigate('/teacher/stored-attendance', { replace: true });
    } catch (error) {
      console.error('Failed to save attendance:', error);
      alert('Failed to save attendance. Please try again.');
    }
  };

  return (
    <div className="p-6">
      {/* 
        ATTENDANCE MANAGEMENT LAYOUT:
        The attendance section is placed in the following order:
        1. Header with back button
        2. Class Details Section - Shows class information
        3. Date of Class Section - Date picker to select the class date
        4. Attendance List Section - Shows all enrolled students with their attendance status
           (Only appears after a date is selected)
        5. Save Button - Appears when date is selected
      */}
      
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            onClick={() => navigate('/teacher/attendance')}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h2 className="text-2xl font-bold text-gray-900">Class Attendance Management</h2>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Class Details Section */}
      {selectedClass && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">School Year:</span>
                <span className="text-gray-900">{selectedClass.school_year || '-'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Semester:</span>
                <span className="text-gray-900">{selectedClass.semester || '-'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Offering Code:</span>
                <span className="text-gray-900">{selectedClass.offering_code || '-'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Subject Name:</span>
                <span className="text-gray-900">{selectedClass.subject_name || '-'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Schedule:</span>
                <span className="text-gray-900">{selectedClass.schedule || '-'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Room:</span>
                <span className="text-gray-900">{selectedClass.room || '-'}</span>
              </div>
              <div className="flex">
                <span className="font-medium text-gray-700 w-32">Teacher:</span>
                <span className="text-gray-900">{selectedClass.teacher_name || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date of Class Section */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Date of Class</h3>
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-xs">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="block w-full px-4 py-2 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              style={{ zIndex: 1 }}
            />
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" style={{ zIndex: 0 }} />
          </div>
          {selectedDate && (
            <button
              onClick={() => {
                setSelectedDate('');
                setHasSelectedDate(false);
                setAttendanceRecords([]);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Clear Date
            </button>
          )}
        </div>
        {!hasSelectedDate && (
          <p className="mt-2 text-sm text-gray-500">Please select a date to view the attendance list.</p>
        )}
        {hasSelectedDate && (
          <p className="mt-2 text-sm text-green-600 font-medium">Date selected: {new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        )}
      </div>

      {/* Attendance List Section - Only show after date is selected */}
      {selectedClass && hasSelectedDate && (
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Attendance List</h3>
            {attendanceRecords.length > 0 && (
              <span className="text-sm text-gray-600">
                Total Students: {attendanceRecords.length}
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            {loadingAttendance ? (
              <div className="px-6 py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading attendance records...</p>
              </div>
            ) : attendanceRecords.length > 0 ? (
              <div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Full Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PC Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Login Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.map((record, index) => (
                      <tr key={`${record.class_id}-${record.student_user_id}-${record.date}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.student_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.last_name}, {record.first_name} {record.middle_name || ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.pc_number || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {record.time_in ? (
                            <span className="text-green-600 font-medium">{record.time_in}</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {record.status ? (
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                              {record.status === 'present' ? 'Present' : record.status === 'absent' ? 'Absent' : record.status}
                            </span>
                          ) : (
                            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                              No Status
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-center text-sm">
                    <div className="text-gray-600">
                      <span className="font-medium text-green-600">
                        Present: {attendanceRecords.filter(r => r.status === 'present').length}
                      </span>
                      {' | '}
                      <span className="font-medium text-red-600">
                        Absent: {attendanceRecords.filter(r => r.status === 'absent').length}
                      </span>
                      {' | '}
                      <span className="font-medium text-gray-600">
                        No Status: {attendanceRecords.filter(r => !r.status || r.status === '').length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No enrolled students found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {error ? error : 'This class has no enrolled students. Please add students to the class first.'}
                </p>
                {!error && selectedClass && (
                  <button
                    onClick={() => navigate(`/teacher/class-management/${selectedClass.class_id}`)}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Go to Class Management
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button - Only show when date is selected */}
      {selectedClass && hasSelectedDate && (
        <div className="flex justify-center">
          <button
            onClick={handleSaveAll}
            className="inline-flex items-center px-8 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

function TeacherDashboard() {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', href: '/teacher', icon: <LayoutDashboard className="h-5 w-5" />, current: location.pathname === '/teacher' },
    { name: 'Class Management', href: '/teacher/class-management', icon: <Library className="h-5 w-5" />, current: location.pathname.startsWith('/teacher/class-management') },
    { name: 'Attendance', href: '/teacher/attendance', icon: <CalendarPlus className="h-5 w-5" />, current: location.pathname.startsWith('/teacher/attendance') && !location.pathname.includes('/stored') },
    { name: 'Stored Attendance', href: '/teacher/stored-attendance', icon: <ClipboardList className="h-5 w-5" />, current: location.pathname === '/teacher/stored-attendance' },
  ];

  return (
    <Layout navigationItems={navigationItems} title="Teacher Dashboard">
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="class-management" element={<ClassManagement />} />
        <Route path="create-classlist" element={<CreateClasslist />} />
        <Route path="class-management/:id" element={<ClassManagementDetail />} />
        <Route path="attendance/:id" element={<AttendanceManagementDetail />} />
        <Route path="attendance" element={<AttendanceClassSelection />} />
        <Route path="stored-attendance" element={<StoredAttendance />} />
      </Routes>
    </Layout>
  );
}

export default TeacherDashboard;
