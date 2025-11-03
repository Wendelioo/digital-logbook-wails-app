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
  MapPin,
  AlertCircle,
  Send,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  GetWorkingStudentDashboard,
  CreateUser,
  GetSubjects,
  CreateSubject,
  GetAllTeachers,
  CreateClass,
  GetAllClasses,
  GetClassesByCreator,
  GetClassStudents,
  GetAllStudentsForEnrollment,
  EnrollMultipleStudents,
  UnenrollStudentFromClassByIDs,
  GetAllRegisteredStudents,
  GetPendingFeedback,
  ForwardFeedbackToAdmin
} from '../../wailsjs/go/main/App';
import { useAuth } from '../contexts/AuthContext';
import { main } from '../../wailsjs/go/models';

// Use generated types
type Subject = main.Subject;
type Class = main.CourseClass;
type ClasslistEntry = main.ClasslistEntry;
type ClassStudent = main.ClassStudent;
type User = main.User;
type Feedback = main.Feedback;

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
          to="manage-users"
          className="group flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <Users className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Manage Students</h3>
          </div>
        </Link>

        <Link
          to="manage-classlists"
          className="group flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Manage Class Lists</h3>
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
            <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Add New Class</h3>
          </div>
        </Link>
      </div>
    </div>
  );
}

interface RegisterStudentModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function RegisterStudentModal({ onClose, onSuccess }: RegisterStudentModalProps) {
  const [formData, setFormData] = useState({
    studentID: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    email: '',
    contactNumber: '',
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
        formData.section,
        formData.email,
        formData.contactNumber
      );
      setNotification({ type: 'success', message: 'Student added successfully! Default password is their Student ID.' });
      setMessage('Student added successfully! Default password is their Student ID.');
      
      // Wait a bit to show the success message, then call onSuccess
      setTimeout(() => {
        setNotification(null);
        onSuccess();
      }, 2000);
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
            onClose();
          }
        }}
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 relative max-h-[90vh] flex flex-col">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors z-10"
          >
            ×
          </button>
          
          <div className="text-center p-8 pb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">Add Student</h2>
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number
              </label>
              <input
                type="tel"
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="09XX-XXX-XXXX"
              />
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
              className="w-full max-w-sm mx-auto px-6 py-3 bg-red-600 text-white text-base font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
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

interface StudentRow {
  id: string;
  ctrlNo: number;
  studentId: string;
  fullName: string;
  yearLevel: string;
}

function CreateClasslist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    schoolYear: '2024-2025',
    semester: '1st Semester',
    offeringCode: '',
    subjectCode: '',
    subjectName: '',
    teacherId: '',
    schedule: '',
    room: '',
    yearLevel: '',
    section: ''
  });
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [nextCtrlNo, setNextCtrlNo] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

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

  const handleAddStudentRow = () => {
    const newStudent: StudentRow = {
      id: `student-${Date.now()}`,
      ctrlNo: nextCtrlNo,
      studentId: '',
      fullName: '',
      yearLevel: ''
    };
    setStudents([...students, newStudent]);
    setNextCtrlNo(nextCtrlNo + 1);
  };

  const handleRemoveStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
  };

  const handleStudentChange = (id: string, field: keyof StudentRow, value: string) => {
    setStudents(students.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleImportFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if present
        const startIndex = lines[0].toLowerCase().includes('student') ? 1 : 0;
        
        const importedStudents: StudentRow[] = [];
        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(/[,\t]/).map(p => p.trim());
          if (parts.length >= 2) {
            importedStudents.push({
              id: `student-${Date.now()}-${i}`,
              ctrlNo: nextCtrlNo + importedStudents.length,
              studentId: parts[0],
              fullName: parts[1] || '',
              yearLevel: parts[2] || ''
            });
          }
        }
        
        setStudents([...students, ...importedStudents]);
        setNextCtrlNo(nextCtrlNo + importedStudents.length);
        setNotification({ type: 'success', message: `Imported ${importedStudents.length} students successfully!` });
        setTimeout(() => setNotification(null), 3000);
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearForm = () => {
    if (confirm('Are you sure you want to clear the entire form?')) {
      setFormData({
        schoolYear: '2024-2025',
        semester: '1st Semester',
        offeringCode: '',
        subjectCode: '',
        subjectName: '',
        teacherId: '',
        schedule: '',
        room: '',
        yearLevel: '',
        section: ''
      });
      setStudents([]);
      setNextCtrlNo(1);
      setMessage('');
    }
  };

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

      // Create the subject
      await CreateSubject(
        formData.subjectCode,
        formData.subjectName,
        parseInt(formData.teacherId),
        ''
      );

      // Get the subject ID
      const subjects = await GetSubjects();
      const subject = subjects.find(s => s.code === formData.subjectCode);
      
      if (!subject) {
        throw new Error(`Subject with code "${formData.subjectCode}" not found after creation`);
      }

      // Create the class
      await CreateClass(
        subject.id,
        parseInt(formData.teacherId),
        formData.schedule,
        formData.room,
        formData.yearLevel,
        formData.section,
        formData.semester,
        formData.schoolYear,
        user?.id || 0  // Use user ID, backend will handle working student ID conversion
      );

      // Get the newly created class ID
      let classes;
      try {
        classes = await GetAllClasses();
      } catch (error) {
        console.error('Failed to get classes:', error);
        throw new Error('Failed to retrieve classes after creation');
      }
      
      if (!classes || !Array.isArray(classes)) {
        throw new Error('Failed to retrieve classes after creation');
      }
      const newClass = classes.find(c => 
        c.subject_code === formData.subjectCode && 
        c.teacher_id === parseInt(formData.teacherId) &&
        c.school_year === formData.schoolYear &&
        c.semester === formData.semester
      );

      // Enroll students if any were added
      if (students.length > 0 && newClass) {
        // First, get all students from the system
        const allStudents = await GetAllStudentsForEnrollment(newClass.id);
        
        // Match imported students with system students by student ID
        const studentIdsToEnroll: number[] = [];
        for (const studentRow of students) {
          if (studentRow.studentId) {
            const matchedStudent = allStudents.find(s => s.student_id === studentRow.studentId);
            if (matchedStudent) {
              studentIdsToEnroll.push(matchedStudent.id);
            }
          }
        }

        if (studentIdsToEnroll.length > 0) {
          await EnrollMultipleStudents(studentIdsToEnroll, newClass.id, user?.id || 0);
        }
      }

      setNotification({ type: 'success', message: `Class created successfully${students.length > 0 ? ` with ${students.length} students enrolled!` : '!'}` });
      setMessage(`Class created successfully${students.length > 0 ? ` with ${students.length} students enrolled!` : '!'}`);
      
      setTimeout(() => {
        navigate('/working-student/manage-classlists');
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
            window.history.back();
          }
        }}
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-7xl relative max-h-[95vh] flex flex-col">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors z-10"
          >
            ×
          </button>
          
          <div className="text-center p-6 pb-4 flex-shrink-0 border-b">
            <h2 className="text-2xl font-bold text-gray-800 uppercase">Add New Classlist</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto">
                {/* Class Details */}
                <div className="space-y-6 bg-gray-50 p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold text-gray-700 mb-6">Class Details</h3>
                  
                  {/* Row 1: School Year and Semester */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="schoolYear" className="block text-sm font-medium text-gray-700 mb-2">
                        School Year
                      </label>
                      <select
                        id="schoolYear"
                        value={formData.schoolYear}
                        onChange={(e) => setFormData({ ...formData, schoolYear: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="2023-2024">2023-2024</option>
                        <option value="2024-2025">2024-2025</option>
                        <option value="2025-2026">2025-2026</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="semester" className="block text-sm font-medium text-gray-700 mb-2">
                        Semester
                      </label>
                      <select
                        id="semester"
                        value={formData.semester}
                        onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Offering Code and Subject Code */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="offeringCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Offering Code
                      </label>
                      <input
                        type="text"
                        id="offeringCode"
                        value={formData.offeringCode}
                        onChange={(e) => setFormData({ ...formData, offeringCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="subjectCode" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Code
                      </label>
                      <input
                        type="text"
                        id="subjectCode"
                        value={formData.subjectCode}
                        onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 3: Subject Name and Schedule */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="subjectName" className="block text-sm font-medium text-gray-700 mb-2">
                        Subject Name
                      </label>
                      <input
                        type="text"
                        id="subjectName"
                        value={formData.subjectName}
                        onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Row 4: Room and Teacher */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="room" className="block text-sm font-medium text-gray-700 mb-2">
                        Room
                      </label>
                      <input
                        type="text"
                        id="room"
                        value={formData.room}
                        onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  </div>
                </div>

                {/* Student List */}
                <div className="mt-8 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Student List</h3>
                  
                  <div className="border border-gray-300 rounded-md overflow-hidden">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-900 text-white sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Ctrl No.</th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">ID Number</th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Full Name</th>
                            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Year Level</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {students.map((student, index) => (
                            <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                {String(student.ctrlNo).padStart(3, '0')}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={student.studentId}
                                  onChange={(e) => handleStudentChange(student.id, 'studentId', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Student ID"
                                />
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={student.fullName}
                                  onChange={(e) => handleStudentChange(student.id, 'fullName', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Full Name"
                                />
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                <input
                                  type="text"
                                  value={student.yearLevel}
                                  onChange={(e) => handleStudentChange(student.id, 'yearLevel', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Year"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddStudentRow}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Add Student Row
                    </button>
                    <button
                      type="button"
                      onClick={() => students.length > 0 && handleRemoveStudent(students[students.length - 1].id)}
                      disabled={students.length === 0}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={handleImportFromFile}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      Import From File
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="font-medium mb-1">Import Instructions:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>CSV or TXT file with comma or tab separated values</li>
                      <li>Format: StudentID, FullName, YearLevel</li>
                      <li>Example: 2022-0101, John Doe, 3rd Year</li>
                    </ul>
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
            <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-4 flex justify-between">
              <button
                type="button"
                onClick={handleClearForm}
                className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Clear Form
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save Class'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

function ManageClasslists() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Get all classes for working student to manage
        const [classesData, teachersData] = await Promise.all([
          GetAllClasses(), // Show all classes for working student to manage
          GetAllTeachers()
        ]);
        setClasses(classesData || []);
        setFilteredClasses(classesData || []);
        setTeachers(teachersData || []);
        setError('');
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Unable to load data from server.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  useEffect(() => {
    let filtered = classes;

    // Filter by teacher
    if (selectedTeacher !== 'all') {
      filtered = filtered.filter(cls => cls.teacher_id === parseInt(selectedTeacher));
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.subject_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.room && cls.room.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (cls.section && cls.section.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredClasses(filtered);
  }, [searchTerm, selectedTeacher, classes]);

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
          </div>
          <Link
            to="/working-student/create-classlist"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Class
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex-shrink-0 mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="flex-shrink-0 mb-4">
        <div className="flex flex-col gap-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 max-w-md">
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
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <label htmlFor="teacherFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Teacher:
              </label>
              <select
                id="teacherFilter"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">All Teachers</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.last_name}, {teacher.first_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode and Count Row */}
          <div className="flex items-center justify-between">
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
            
            {selectedTeacher !== 'all' && (
              <button
                onClick={() => {
                  setSelectedTeacher('all');
                  setSearchTerm('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear Filters
              </button>
            )}
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
          {searchTerm || selectedTeacher !== 'all' ? (
            <>
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No matching classes found</h3>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedTeacher('all');
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Clear All Filters
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
              <div className="mt-6">
                <Link
                  to="/working-student/create-classlist"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Class
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ManageUsers() {
  const [students, setStudents] = useState<ClassStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<ClassStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [yearLevelFilter, setYearLevelFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const loadStudents = async () => {
    try {
      const data = await GetAllRegisteredStudents(yearLevelFilter);
      setStudents(data || []);
      setFilteredStudents(data || []);
      setError('');
    } catch (error) {
      console.error('Failed to load students:', error);
      setError('Unable to load students from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [yearLevelFilter]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.middle_name && student.middle_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.section && student.section.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Manage Registered Students</h2>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Student
          </button>
        </div>
      </div>

      {error && (
        <div className="flex-shrink-0 mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="flex-shrink-0 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 max-w-md">
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
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="yearLevel" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Year Level:
              </label>
              <select
                id="yearLevel"
                value={yearLevelFilter}
                onChange={(e) => setYearLevelFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="All">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <span className="text-sm text-gray-500">
              {filteredStudents.length} of {students.length} students
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="bg-white shadow rounded-lg overflow-hidden h-full overflow-y-auto">
          {filteredStudents.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
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
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
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
              {searchTerm || yearLevelFilter !== 'All' ? (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No matching students found</h3>
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setYearLevelFilter('All');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Clear Filters
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                  <div className="mt-6">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Student
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <RegisterStudentModal 
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadStudents();
          }}
        />
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

function EquipmentReports() {
  const { user } = useAuth();
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardNotes, setForwardNotes] = useState('');
  const [forwarding, setForwarding] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    loadPendingFeedback();
  }, []);

  const loadPendingFeedback = async () => {
    try {
      const data = await GetPendingFeedback();
      setFeedbackList(data || []);
      setError('');
    } catch (error) {
      console.error('Failed to load pending feedback:', error);
      setError('Unable to load pending feedback. Make sure you are connected to the database.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleForwardClick = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setForwardNotes('');
    setShowForwardModal(true);
  };

  const handleForwardSubmit = async () => {
    if (!selectedFeedback || !user) return;

    setForwarding(true);
    try {
      await ForwardFeedbackToAdmin(selectedFeedback.id, user.id, forwardNotes);
      showNotification('success', 'Feedback forwarded to admin successfully!');
      setShowForwardModal(false);
      setSelectedFeedback(null);
      setForwardNotes('');
      await loadPendingFeedback(); // Refresh the list
    } catch (error) {
      console.error('Failed to forward feedback:', error);
      showNotification('error', 'Failed to forward feedback. Please try again.');
    } finally {
      setForwarding(false);
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
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Equipment Reports</h2>
        <p className="text-gray-600">Review student-submitted equipment feedback and forward to admin</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out ${
          notification.type === 'success' ? 'border-l-4 border-green-400' : 'border-l-4 border-red-400'
        }`}>
          <div className="p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-400" />
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
                  className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
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

      {error && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {feedbackList.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Reports</h3>
          <p className="text-gray-500 mb-4">
            There are no pending equipment reports at the moment.
          </p>
          <p className="text-sm text-gray-400">
            Student-submitted equipment feedback will appear here for your review.
          </p>
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
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PC Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Keyboard
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {feedbackList.map((feedback, index) => (
                  <tr key={feedback.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {feedbackList.length - index}
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
                      <div className="flex flex-col">
                        <span className="font-medium">{feedback.student_name}</span>
                        <span className="text-xs text-gray-500">{feedback.student_id_str}</span>
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
                        feedback.monitor_condition === 'Good'
                          ? 'bg-green-100 text-green-800'
                          : feedback.monitor_condition === 'Minor Issue'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {feedback.monitor_condition}
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
                        feedback.mouse_condition === 'Good'
                          ? 'bg-green-100 text-green-800'
                          : feedback.mouse_condition === 'Minor Issue'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {feedback.mouse_condition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                      {feedback.comments ? (
                        <span className="text-gray-600">{feedback.comments}</span>
                      ) : (
                        <span className="text-gray-400 italic">No comments</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleForwardClick(feedback)}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Forward
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{feedbackList.length}</span> pending report{feedbackList.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Forward Modal */}
      {showForwardModal && selectedFeedback && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForwardModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 relative">
            <button
              type="button"
              onClick={() => setShowForwardModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors"
            >
              ×
            </button>
            
            <div className="text-center p-8 pb-4">
              <Send className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Forward to Admin
              </h3>
              <p className="text-gray-600">
                Review the equipment report and add notes before forwarding to admin
              </p>
            </div>

            <div className="px-8 pb-8">
              {/* Feedback Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Report Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Student:</span>
                    <p className="font-medium text-gray-900">{selectedFeedback.student_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">PC Number:</span>
                    <p className="font-medium text-gray-900">{selectedFeedback.pc_number}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedFeedback.date_submitted).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Time:</span>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedFeedback.date_submitted).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div>
                    <span className="text-xs text-gray-600">Equipment</span>
                    <p className={`text-xs font-semibold mt-1 ${
                      selectedFeedback.equipment_condition === 'Good' ? 'text-green-700' :
                      selectedFeedback.equipment_condition === 'Minor Issue' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {selectedFeedback.equipment_condition}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Monitor</span>
                    <p className={`text-xs font-semibold mt-1 ${
                      selectedFeedback.monitor_condition === 'Good' ? 'text-green-700' :
                      selectedFeedback.monitor_condition === 'Minor Issue' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {selectedFeedback.monitor_condition}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Keyboard</span>
                    <p className={`text-xs font-semibold mt-1 ${
                      selectedFeedback.keyboard_condition === 'Good' ? 'text-green-700' :
                      selectedFeedback.keyboard_condition === 'Minor Issue' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {selectedFeedback.keyboard_condition}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600">Mouse</span>
                    <p className={`text-xs font-semibold mt-1 ${
                      selectedFeedback.mouse_condition === 'Good' ? 'text-green-700' :
                      selectedFeedback.mouse_condition === 'Minor Issue' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {selectedFeedback.mouse_condition}
                    </p>
                  </div>
                </div>
                {selectedFeedback.comments && (
                  <div className="mt-4">
                    <span className="text-xs text-gray-600">Student Comments:</span>
                    <p className="text-sm text-gray-900 mt-1">{selectedFeedback.comments}</p>
                  </div>
                )}
              </div>

              {/* Notes Input */}
              <div className="mb-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Add Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  rows={4}
                  value={forwardNotes}
                  onChange={(e) => setForwardNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any observations or recommendations for the admin..."
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForwardModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  disabled={forwarding}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleForwardSubmit}
                  disabled={forwarding}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forwarding ? 'Forwarding...' : 'Forward to Admin'}
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
    { name: 'Manage Students', href: '/working-student/manage-users', icon: <Users className="h-5 w-5" />, current: location.pathname === '/working-student/manage-users' },
    { name: 'Manage Classes', href: '/working-student/manage-classlists', icon: <BookOpen className="h-5 w-5" />, current: location.pathname === '/working-student/manage-classlists' },
    { name: 'Equipment Reports', href: '/working-student/equipment-reports', icon: <AlertCircle className="h-5 w-5" />, current: location.pathname === '/working-student/equipment-reports' },
  ];

  return (
    <Layout navigationItems={navigationItems} title="Working Student Dashboard">
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="manage-users" element={<ManageUsers />} />
        <Route path="manage-classlists" element={<ManageClasslists />} />
        <Route path="create-classlist" element={<CreateClasslist />} />
        <Route path="classlist/:id" element={<ClassListManagement />} />
        <Route path="equipment-reports" element={<EquipmentReports />} />
      </Routes>
    </Layout>
  );
}

export default WorkingStudentDashboard;
