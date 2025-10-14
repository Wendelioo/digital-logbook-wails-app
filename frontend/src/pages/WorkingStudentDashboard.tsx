import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Save,
  Plus,
  UserCheck,
  ArrowLeft,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  BookOpen,
  Clock,
  MapPin
} from 'lucide-react';
import { 
  GetWorkingStudentDashboard,
  CreateUser,
  GetSubjects,
  CreateSubject,
  GetAllTeachers,
  CreateClass,
  GetAllClasses,
  GetClassStudents,
  GetAllStudentsForEnrollment,
  EnrollMultipleStudents,
  UnenrollStudentFromClassByIDs
} from '../../wailsjs/go/main/App';
import { useAuth } from '../contexts/AuthContext';
import { main } from '../../wailsjs/go/models';

// Use generated types
type Subject = main.Subject;
type Class = main.CourseClass;
type ClasslistEntry = main.ClasslistEntry;
type ClassStudent = main.ClassStudent;
type User = main.User;

interface DashboardStats {
  students_registered: number;
  classlists_created: number;
}

function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    students_registered: 0,
    classlists_created: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await GetWorkingStudentDashboard();
        setStats(data);
      } catch (error) {
        console.error('Failed to load working student dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

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
        <h2 className="text-2xl font-bold text-gray-900">Working Student Dashboard</h2>
        <p className="text-gray-600">Quick summary of your activities and management tools</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Students Registered
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats.students_registered}
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
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Classes Created
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {stats.classlists_created}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="register-student"
          className="group flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Add Student</h3>
            <p className="text-xs text-gray-500">Add new student accounts</p>
          </div>
        </Link>

        <Link
          to="manage-classlists"
          className="group flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Manage Class Lists</h3>
            <p className="text-xs text-gray-500">Manage existing class lists</p>
          </div>
        </Link>

        <Link
          to="create-classlist"
          className="group flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Plus className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Create Class</h3>
            <p className="text-xs text-gray-500">Create new class instance</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function RegisterStudent() {
  const [formData, setFormData] = useState({
    studentID: '',
    username: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    year: '',
    section: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleStudentIDChange = (value: string) => {
    setFormData({ 
      ...formData, 
      studentID: value,
      password: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const fullName = `${formData.lastName}, ${formData.firstName}${formData.middleName ? ' ' + formData.middleName : ''}`;
      
      await CreateUser(
        formData.password, 
        fullName, 
        formData.firstName, 
        formData.middleName, 
        formData.lastName, 
        formData.gender,
        'student', 
        '',
        formData.studentID,
        formData.year,
        formData.section
      );
      setNotification({ type: 'success', message: 'Student added successfully! Default password is their Student ID.' });
      setMessage('Student added successfully! Default password is their Student ID.');
      setFormData({ 
        studentID: '',
        username: '', 
        password: '',
        firstName: '', 
        middleName: '', 
        lastName: '', 
        gender: '',
        year: '',
        section: ''
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (error) {
      setNotification({ type: 'error', message: 'Failed to add student. Please try again.' });
      setMessage('Failed to add student. Please try again.');
      console.error('Registration error:', error);
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
        className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            window.history.back();
          }
        }}
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 relative max-h-[90vh] flex flex-col">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors z-10"
          >
            ×
          </button>
          
          <div className="text-center p-8 pb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">Student Registration</h2>
            <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto px-8 pb-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="studentID" className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <input
                type="text"
                id="studentID"
                value={formData.studentID}
                onChange={(e) => handleStudentIDChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-2">
                Middle Name (Optional)
              </label>
              <input
                type="text"
                id="middleName"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year Level
              </label>
              <select
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Year Level</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <input
                type="text"
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Default password is the Student ID (automatically filled)
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Default Password Policy
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>The student's ID will be automatically set as their default password. Students can change this later after their first login.</p>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-md ${
              message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-xs mx-auto px-8 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'SUBMIT'}
            </button>
          </div>
          </form>
        </div>
      </div>
    </>
  );
}

function CreateClasslist() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    subjectCode: '',
    subjectName: '',
    teacherId: '',
    schedule: '',
    room: '',
    yearLevel: '',
    section: '',
    semester: '1st Semester',
    schoolYear: '2024-2025'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const teachersData = await GetAllTeachers();
        setTeachers(teachersData || []);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Validate required fields
      if (!formData.subjectCode || !formData.subjectName) {
        setMessage('Subject Code and Subject Name are required.');
        setLoading(false);
        return;
      }

      if (!formData.teacherId) {
        setMessage('Please select a teacher.');
        setLoading(false);
        return;
      }

      console.log('Step 1: Creating subject...', {
        code: formData.subjectCode,
        name: formData.subjectName,
        teacherId: formData.teacherId
      });

      // First, create the subject (or get existing subject ID)
      await CreateSubject(
        formData.subjectCode,
        formData.subjectName,
        parseInt(formData.teacherId),
        '' // description (optional)
      );

      console.log('Step 2: Fetching subjects to get ID...');

      // Then get the subject ID
      const subjects = await GetSubjects();
      console.log('All subjects:', subjects);
      
      const subject = subjects.find(s => s.code === formData.subjectCode);
      
      if (!subject) {
        console.error('Subject not found. Available subjects:', subjects.map(s => s.code));
        throw new Error(`Subject with code "${formData.subjectCode}" not found after creation`);
      }

      console.log('Step 3: Creating class with subject ID:', subject.id);

      await CreateClass(
        subject.id,
        parseInt(formData.teacherId),
        formData.schedule,
        formData.room,
        formData.yearLevel,
        formData.section,
        formData.semester,
        formData.schoolYear,
        user?.id || 0 // working student's ID
      );

      console.log('Step 4: Class created successfully!');
      setMessage('Class created successfully!');
      setFormData({
        subjectCode: '',
        subjectName: '',
        teacherId: '',
        schedule: '',
        room: '',
        yearLevel: '',
        section: '',
        semester: '1st Semester',
        schoolYear: '2024-2025'
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessage(`Failed to create class: ${errorMessage}`);
      console.error('Creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          window.history.back();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 relative max-h-[90vh] flex flex-col">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors z-10"
        >
          ×
        </button>
        
        <div className="text-center p-8 pb-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-blue-600 mb-2">Create New Class</h2>
          <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Create a new class instance with schedule and room assignment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto px-8 pb-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="subjectCode" className="block text-sm font-medium text-gray-700 mb-2">
                Subject Code
              </label>
              <input
                type="text"
                id="subjectCode"
                value={formData.subjectCode}
                onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                placeholder="e.g., IT301, CS101"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name
              </label>
              <input
                type="text"
                id="subjectName"
                value={formData.subjectName}
                onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                placeholder="e.g., Web Development"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-2">
                Teacher
              </label>
              <select
                id="teacher"
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.last_name}, {teacher.first_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-2">
                Schedule
              </label>
              <input
                type="text"
                id="schedule"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="e.g., MWF 1:00-2:00 PM"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
                Room
              </label>
              <input
                type="text"
                id="room"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                placeholder="e.g., Lab 2"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="yearLevel" className="block text-sm font-medium text-gray-700 mb-2">
                Year Level
              </label>
              <select
                id="yearLevel"
                value={formData.yearLevel}
                onChange={(e) => setFormData({ ...formData, yearLevel: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Year Level</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <div>
              <label htmlFor="section" className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <input
                type="text"
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                placeholder="e.g., A, B, C"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <select
                id="semester"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="1st Semester">1st Semester</option>
                <option value="2nd Semester">2nd Semester</option>
                <option value="Summer">Summer</option>
              </select>
            </div>

            <div>
              <label htmlFor="schoolYear" className="block text-sm font-medium text-gray-700 mb-2">
                School Year
              </label>
              <input
                type="text"
                id="schoolYear"
                value={formData.schoolYear}
                onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                placeholder="e.g., 2024-2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-md ${
              message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-xs mx-auto px-8 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'CREATE CLASS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ManageClasslists() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await GetAllClasses();
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
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredClasses(classes);
    } else {
      const filtered = classes.filter(cls =>
        cls.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.room && cls.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cls.section && cls.section.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredClasses(filtered);
    }
  }, [searchTerm, classes]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Classes</h2>
            <p className="text-gray-600">Manage class instances and student enrollments</p>
          </div>
          <Link
            to="/working-student/create-classlist"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Class
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex-shrink-0 mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="flex-shrink-0 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by code, name, teacher, room, or section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
            <span className="text-sm text-gray-500">
              {filteredClasses.length} of {classes.length} classes
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full overflow-y-auto">
            {filteredClasses.map((cls) => (
              <div key={cls.id} className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-200">
                <div className="p-4">
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-gray-900 truncate">{cls.subject_code}</h3>
                      <div className={`w-2 h-2 rounded-full ${cls.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{cls.subject_name}</p>
                    {cls.section && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        Section {cls.section}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-medium text-gray-500">Teacher</span>
                      <span className="text-xs font-semibold text-gray-900 truncate ml-2">{cls.teacher_name}</span>
                    </div>
                    {cls.schedule && (
                      <div className="flex items-center py-1.5 px-2 bg-gray-50 rounded-lg">
                        <Clock className="h-3 w-3 text-gray-400 mr-1.5" />
                        <span className="text-xs text-gray-700">{cls.schedule}</span>
                      </div>
                    )}
                    {cls.room && (
                      <div className="flex items-center py-1.5 px-2 bg-gray-50 rounded-lg">
                        <MapPin className="h-3 w-3 text-gray-400 mr-1.5" />
                        <span className="text-xs text-gray-700">{cls.room}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-medium text-gray-500">Students</span>
                      <span className="text-xs font-semibold text-gray-900">{cls.enrolled_count}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/working-student/classlist/${cls.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Manage
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden h-full overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Section
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teacher
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
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClasses.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${cls.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{cls.subject_code}</div>
                          <div className="text-sm text-gray-500">{cls.subject_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cls.section || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cls.teacher_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cls.schedule || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cls.room || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cls.enrolled_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/working-student/classlist/${cls.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Users className="h-4 w-4 inline mr-1" />
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredClasses.length === 0 && !error && (
        <div className="text-center py-12">
          {searchTerm ? (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No matching classes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or clear the search to see all classes.
              </p>
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
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first class.
              </p>
              <div className="mt-6">
                <Link
                  to="/working-student/create-classlist"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Class
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ClassListManagement() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [classInfo, setClassInfo] = useState<Class | null>(null);
  const [students, setStudents] = useState<ClasslistEntry[]>([]);
  const [availableStudents, setAvailableStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  const loadClassDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const classes = await GetAllClasses();
      const selectedClass = classes.find(c => c.id === parseInt(id));
      
      if (selectedClass) {
        setClassInfo(selectedClass);
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
  }, [id]);

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
      (student.middle_name && student.middle_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.year_level && student.year_level.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.section && student.section.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

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
            onClick={() => navigate('/working-student/manage-classlists')}
            className="mt-4 text-primary-600 hover:text-primary-900"
          >
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-6">
          <div className="mb-6 flex items-center">
            <button
              onClick={() => navigate('/working-student/manage-classlists')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Class List Management</h2>
              <p className="text-gray-600">Manage students enrolled in this class</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{classInfo.subject_code}</h3>
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${classInfo.is_active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="text-xs text-gray-500 font-medium">{classInfo.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
              </div>
              <p className="text-lg text-gray-700">{classInfo.subject_name}</p>
              {classInfo.section && (
                <span className="inline-block mt-2 px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded">
                  Section {classInfo.section}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Teacher</div>
                <div className="text-lg font-semibold text-gray-900">{classInfo.teacher_name}</div>
              </div>
              {classInfo.schedule && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">Schedule</div>
                  <div className="text-lg font-semibold text-gray-900">{classInfo.schedule}</div>
                </div>
              )}
              {classInfo.room && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">Room</div>
                  <div className="text-lg font-semibold text-gray-900">{classInfo.room}</div>
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Total Students</div>
                <div className="text-lg font-semibold text-gray-900">{students.length}</div>
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

      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Managing <span className="font-semibold">{students.length}</span> students in this class
        </div>
        <button
          onClick={handleAddStudent}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Students
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {students.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Year/Section
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
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
                    {student.last_name}, {student.first_name} {student.middle_name || ''}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleRemoveStudent(student.student_id, student.class_id)}
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
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding students to this class.
            </p>
            <div className="mt-6">
              <button
                onClick={handleAddStudent}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Students
              </button>
            </div>
          </div>
        )}
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
                    placeholder="Search by name, student ID, year level, or section..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Year Level
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Section
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.year_level || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.section || '-'}
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
    </div>
  );
}

function WorkingStudentDashboard() {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', href: '/working-student', icon: <LayoutDashboard className="h-5 w-5" />, current: location.pathname === '/working-student' },
    { name: 'Add Student', href: '/working-student/register-student', icon: <UserPlus className="h-5 w-5" />, current: location.pathname === '/working-student/register-student' },
    { name: 'Manage Classes', href: '/working-student/manage-classlists', icon: <BookOpen className="h-5 w-5" />, current: location.pathname === '/working-student/manage-classlists' },
  ];

  return (
    <Layout navigationItems={navigationItems} title="Working Student Dashboard">
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="register-student" element={<RegisterStudent />} />
        <Route path="manage-classlists" element={<ManageClasslists />} />
        <Route path="create-classlist" element={<CreateClasslist />} />
        <Route path="classlist/:id" element={<ClassListManagement />} />
      </Routes>
    </Layout>
  );
}

export default WorkingStudentDashboard;
