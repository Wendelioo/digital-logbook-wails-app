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
  Eye
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
  teacher: string;
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
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Register Student</h3>
            <p className="text-xs text-gray-500">Add new student accounts</p>
          </div>
        </Link>

        <Link
          to="view-classlists"
          className="group flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">View Class Lists</h3>
            <p className="text-xs text-gray-500">Manage existing subject class lists</p>
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
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Create Class List</h3>
            <p className="text-xs text-gray-500">Create new subject class lists</p>
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
    teacher: '',
    room: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await CreateSubject(formData.code, formData.name, formData.teacher, formData.room);
      setMessage('Class list created successfully!');
      setFormData({ code: '', name: '', teacher: '', room: '' });
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
        <p className="text-gray-600">Create new subject class lists and assign teachers</p>
      </div>

        {/* Create Form */}
      <div className="max-w-2xl">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Subject</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-2">
                  Teacher
                </label>
                <input
                  type="text"
                  id="teacher"
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  placeholder="e.g., Mr. Reyes"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
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

            <div className="flex justify-between items-center pt-4">
              <Link
                to="/working-student/view-classlists"
                className="text-primary-600 hover:text-primary-900 text-sm font-medium"
              >
                ← View All Class Lists
              </Link>
            <button
              type="submit"
              disabled={loading}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              {loading ? 'Creating...' : 'Create Class List'}
            </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ViewClasslists() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const data = await GetSubjects();
        setSubjects(data || []);
        setFilteredSubjects(data || []);
        setError('');
      } catch (error) {
        console.error('Failed to load subjects:', error);
        setError('Unable to load class lists from server.');
        // Use mock data as fallback
        const mockData = [
          {
            id: 1,
            code: "IT101",
            name: "Programming Fundamentals",
            teacher: "Maria C. Santos",
            room: "Lab 1"
          },
          {
            id: 2,
            code: "IT102",
            name: "Database Management",
            teacher: "Maria C. Santos",
            room: "Lab 2"
          },
          {
            id: 3,
            code: "IT103",
            name: "Web Development",
            teacher: "Maria C. Santos",
            room: "Lab 1"
          }
        ];
        setSubjects(mockData);
        setFilteredSubjects(mockData);
      } finally {
        setLoading(false);
      }
    };

    loadSubjects();
  }, []);

  // Filter subjects based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredSubjects(subjects);
    } else {
      const filtered = subjects.filter(subject =>
        subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.room.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSubjects(filtered);
    }
  }, [searchTerm, subjects]);

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
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">View Class Lists</h2>
            <p className="text-gray-600">Manage existing subject class lists and student enrollments</p>
          </div>
          <Link
            to="/working-student/create-classlist"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex-shrink-0 mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>{error}</p>
          <p className="text-sm mt-1">Showing sample data for demonstration.</p>
        </div>
      )}

      {/* Search and Filter Bar */}
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
                placeholder="Search by code, name, teacher, or room..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
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
              {filteredSubjects.length} of {subjects.length} class lists
            </span>
          </div>
        </div>
      </div>

      {/* Class Lists Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full overflow-y-auto">
            {filteredSubjects.map((subject) => (
              <div key={subject.id} className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-200">
                <div className="p-4">
                  {/* Header with Subject Info */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-bold text-gray-900 truncate">{subject.code}</h3>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">{subject.name}</p>
                  </div>
                  
                  {/* Subject Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-medium text-gray-500">Teacher</span>
                      <span className="text-xs font-semibold text-gray-900 truncate ml-2">{subject.teacher}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                      <span className="text-xs font-medium text-gray-500">Room</span>
                      <span className="text-xs font-semibold text-gray-900">{subject.room}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Link
                      to={`/working-student/classlist/${subject.id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Users className="h-3 w-3 mr-1" />
                      Manage
                    </Link>
                    <button className="inline-flex items-center justify-center px-2 py-2 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-sm hover:shadow-md">
                      <Edit className="h-3 w-3" />
                    </button>
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
                    Teacher
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubjects.map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subject.code}</div>
                          <div className="text-sm text-gray-500">{subject.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {subject.teacher}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {subject.room}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        to={`/working-student/classlist/${subject.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Users className="h-4 w-4 inline mr-1" />
                        Manage
                      </Link>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredSubjects.length === 0 && !error && (
        <div className="text-center py-12">
          {searchTerm ? (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No matching class lists found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search terms or clear the search to see all class lists.
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No class lists found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first class list.
              </p>
              <div className="mt-6">
                <Link
                  to="/working-student/create-classlist"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Class List
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
  const [subject, setSubject] = useState<Subject | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadClassDetails = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Get all subjects and find the selected one
        const subjects = await GetSubjects();
        const selectedSubject = subjects.find(s => s.id === parseInt(id));
        
        if (selectedSubject) {
          setSubject(selectedSubject);
        }

        // Mock students data for now - in real implementation, you'd fetch from backend
        setStudents([
          { id: 1, student_id: "2025-001", first_name: "Juan", last_name: "Santos", middle_name: "Miguel" },
          { id: 2, student_id: "2025-002", first_name: "Maria", last_name: "Reyes", middle_name: "Cruz" },
          { id: 3, student_id: "2025-003", first_name: "Pedro", last_name: "Garcia", middle_name: "Luis" }
        ]);
        
        setError('');
      } catch (error) {
        console.error('Failed to load class details:', error);
        setError('Unable to load class details from server.');
      } finally {
        setLoading(false);
      }
    };

    loadClassDetails();
  }, [id]);

  const handleRemoveStudent = (studentId: number) => {
    if (confirm('Are you sure you want to remove this student from the class?')) {
      setStudents(students.filter(s => s.id !== studentId));
      alert('Student removed successfully!');
    }
  };

  const handleAddStudent = () => {
    alert('Add student functionality would be implemented here');
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

  if (!subject) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-gray-500">Class not found</p>
          <button
            onClick={() => navigate('/working-student/create-classlist')}
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
      {/* Class Header (Top Section) */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-6">
          {/* Header with Back Button */}
          <div className="mb-6 flex items-center">
            <button
              onClick={() => navigate('/working-student/create-classlist')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
                  </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Class List Management</h2>
              <p className="text-gray-600">Manage students enrolled in this class</p>
            </div>
          </div>

          {/* Class Information */}
          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{subject.code}</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-500 font-medium">ACTIVE</span>
                </div>
              </div>
              <p className="text-lg text-gray-700">{subject.name}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Teacher</div>
                <div className="text-lg font-semibold text-gray-900">{subject.teacher}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Room</div>
                <div className="text-lg font-semibold text-gray-900">{subject.room}</div>
              </div>
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

      {/* Action Buttons */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Managing <span className="font-semibold">{students.length}</span> students in this class
        </div>
        <button
          onClick={handleAddStudent}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 transition-colors"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </button>
      </div>

      {/* Student List */}
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
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.student_id}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 font-medium hover:underline transition-colors">
                      <Eye className="h-4 w-4 inline mr-1" />
                      View
                    </button>
                    <button className="text-yellow-600 hover:text-yellow-900 font-medium hover:underline transition-colors">
                      <Edit className="h-4 w-4 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleRemoveStudent(student.id)}
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
              Get started by adding a student to this class.
            </p>
            <div className="mt-6">
              <button
                onClick={handleAddStudent}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Student
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WorkingStudentDashboard() {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', href: '/working-student', icon: <LayoutDashboard className="h-5 w-5" />, current: location.pathname === '/working-student' },
    { name: 'Register Student', href: '/working-student/register-student', icon: <UserPlus className="h-5 w-5" />, current: location.pathname === '/working-student/register-student' },
    { name: 'View Class Lists', href: '/working-student/view-classlists', icon: <BookOpen className="h-5 w-5" />, current: location.pathname === '/working-student/view-classlists' },
    { name: 'Create Class List', href: '/working-student/create-classlist', icon: <Plus className="h-5 w-5" />, current: location.pathname === '/working-student/create-classlist' },
  ];

  return (
    <Layout navigationItems={navigationItems} title="Working Student Dashboard">
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="register-student" element={<RegisterStudent />} />
        <Route path="view-classlists" element={<ViewClasslists />} />
        <Route path="create-classlist" element={<CreateClasslist />} />
        <Route path="classlist/:id" element={<ClassListManagement />} />
      </Routes>
    </Layout>
  );
}

export default WorkingStudentDashboard;
