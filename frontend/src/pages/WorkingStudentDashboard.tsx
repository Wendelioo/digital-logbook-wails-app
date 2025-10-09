import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  UserCheck,
  Save,
  Plus
} from 'lucide-react';
import { 
  GetWorkingStudentDashboard,
  CreateUser,
  GetSubjects,
  CreateSubject
} from '../../wailsjs/go/main/App';

interface DashboardStats {
  students_registered: number;
  classlists_created: number;
}

interface Subject {
  id: number;
  code: string;
  name: string;
  instructor: string;
  room: string;
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
                    Class Lists Created
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="register-student"
          className="flex items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <UserPlus className="h-8 w-8 text-primary-600 mr-4" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Register Student</h3>
            <p className="text-sm text-gray-500">Add new student accounts</p>
          </div>
        </Link>

        <Link
          to="create-classlist"
          className="flex items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Users className="h-8 w-8 text-primary-600 mr-4" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Create Class List</h3>
            <p className="text-sm text-gray-500">Manage subject class lists</p>
          </div>
        </Link>

        <Link
          to="assist-seatin"
          className="flex items-center p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <UserCheck className="h-8 w-8 text-primary-600 mr-4" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Assist Seat-in</h3>
            <p className="text-sm text-gray-500">Help with seat-in students</p>
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
    gender: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Auto-set password to student ID when student ID changes
  const handleStudentIDChange = (value: string) => {
    setFormData({ 
      ...formData, 
      studentID: value,
      password: value // Default password is student ID
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Build full name from lastName, firstName, middleName
      const fullName = `${formData.lastName}, ${formData.firstName}${formData.middleName ? ' ' + formData.middleName : ''}`;
      
      await CreateUser(
        formData.username, 
        '', // email - not required
        formData.password, 
        fullName, 
        formData.firstName, 
        formData.middleName, 
        formData.lastName, 
        formData.gender,
        'student', 
        '', // employeeID - empty for students
        formData.studentID, // studentID
        '' // year - not required
      );
      setMessage('Student registered successfully! Default password is their Student ID.');
      setFormData({ 
        studentID: '',
        username: '', 
        password: '',
        firstName: '', 
        middleName: '', 
        lastName: '', 
        gender: ''
      });
    } catch (error) {
      setMessage('Failed to register student. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Register Student</h2>
        <p className="text-gray-600">Create new student accounts for the system</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student ID */}
            <div>
              <label htmlFor="studentID" className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <input
                type="text"
                id="studentID"
                value={formData.studentID}
                onChange={(e) => handleStudentIDChange(e.target.value)}
                placeholder="e.g., 2025-1234"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="e.g., Santos"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="e.g., Juan"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Middle Name */}
            <div>
              <label htmlFor="middleName" className="block text-sm font-medium text-gray-700 mb-2">
                Middle Name (Optional)
              </label>
              <input
                type="text"
                id="middleName"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                placeholder="e.g., Miguel"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="e.g., jsantos"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {/* Password */}
            <div className="md:col-span-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="text"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Default: Student ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Default password is the Student ID (automatically filled)
              </p>
            </div>
          </div>

          {/* Password Info Box */}
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

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateClasslist() {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    instructor: '',
    room: ''
  });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await GetSubjects();
        setSubjects(data);
      } catch (error) {
        console.error('Failed to load subjects:', error);
      }
    };

    loadSubjects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await CreateSubject(formData.code, formData.name, formData.instructor, formData.room);
      setMessage('Class list created successfully!');
      setFormData({ code: '', name: '', instructor: '', room: '' });
      // Reload subjects
      const data = await GetSubjects();
      setSubjects(data);
    } catch (error) {
      setMessage('Failed to create class list. Please try again.');
      console.error('Creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Class List</h2>
        <p className="text-gray-600">Create new subject class lists and assign instructors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Subject</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Subject Code
              </label>
              <input
                type="text"
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., IT101"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Subject Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Programming Fundamentals"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-2">
                Instructor
              </label>
              <input
                type="text"
                id="instructor"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                placeholder="e.g., Mr. Reyes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                placeholder="e.g., Lab A"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>

            {message && (
              <div className={`p-4 rounded-md ${
                message.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Class List'}
            </button>
          </form>
        </div>

        {/* Existing Subjects */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Existing Subjects</h3>
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{subject.code}</h4>
                    <p className="text-sm text-gray-600">{subject.name}</p>
                    <p className="text-sm text-gray-500">{subject.instructor} • {subject.room}</p>
                  </div>
                  <button className="text-primary-600 hover:text-primary-900 text-sm">
                    Manage Students
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssistSeatin() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assist Seat-in Students</h2>
        <p className="text-gray-600">Help students who are logging in outside of their assigned class lists</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-12">
          <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Seat-in Assistance</h3>
          <p className="text-gray-600 mb-6">
            This feature allows you to help students who need to log in for subjects they're not officially enrolled in.
          </p>
          <div className="space-y-3">
            <button className="w-full md:w-auto px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">
              Register Seat-in Student
            </button>
            <button className="w-full md:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 ml-3">
              View Seat-in Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkingStudentDashboard() {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', href: '/working-student', icon: <LayoutDashboard className="h-5 w-5" />, current: location.pathname === '/working-student' },
    { name: 'Register Student', href: '/working-student/register-student', icon: <UserPlus className="h-5 w-5" />, current: location.pathname === '/working-student/register-student' },
    { name: 'Create Class List', href: '/working-student/create-classlist', icon: <Users className="h-5 w-5" />, current: location.pathname === '/working-student/create-classlist' },
    { name: 'Assist Seat-in', href: '/working-student/assist-seatin', icon: <UserCheck className="h-5 w-5" />, current: location.pathname === '/working-student/assist-seatin' },
  ];

  return (
    <Layout navigationItems={navigationItems} title="Working Student Dashboard">
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="register-student" element={<RegisterStudent />} />
        <Route path="create-classlist" element={<CreateClasslist />} />
        <Route path="assist-seatin" element={<AssistSeatin />} />
      </Routes>
    </Layout>
  );
}

export default WorkingStudentDashboard;
