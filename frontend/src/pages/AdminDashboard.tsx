import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  FileText,
  UserPlus,
  Edit,
  Trash2,
  Download,
  Search,
  Filter,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  GetAdminDashboard, 
  GetUsers,
  GetUsersByType,
  SearchUsers,
  CreateUser, 
  UpdateUser, 
  DeleteUser,
  GetAllLogs,
  GetFeedback,
  ExportLogsCSV,
  ExportLogsPDF,
  ExportFeedbackCSV,
  ExportFeedbackPDF
} from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';

interface DashboardStats {
  total_students: number;
  total_teachers: number;
  working_students: number;
  recent_logins: number;
}

interface User {
  id: number;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  gender?: string;
  role: string;
  employee_id?: string;
  student_id?: string;
  year?: string;
  section?: string;
  photo_url?: string;
  created: string;
}

interface LoginLog {
  id: number;
  user_id: number;
  user_name: string;
  user_type: string;
  pc_number?: string;
  login_time: string;
  logout_time?: string;
}

// Use the generated Feedback model from main
type Feedback = main.Feedback;

function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    total_students: 0,
    total_teachers: 0,
    working_students: 0,
    recent_logins: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await GetAdminDashboard();
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    {
      title: 'Total Students',
      value: stats.total_students,
      color: 'bg-blue-500',
      icon: <Users className="h-8 w-8" />
    },
    {
      title: 'Teachers',
      value: stats.total_teachers,
      color: 'bg-green-500',
      icon: <Users className="h-8 w-8" />
    },
    {
      title: 'Working Students',
      value: stats.working_students,
      color: 'bg-purple-500',
      icon: <Users className="h-8 w-8" />
    },
    {
      title: 'Recent Logins',
      value: stats.recent_logins,
      color: 'bg-orange-500',
      icon: <ClipboardList className="h-8 w-8" />
    }
  ];

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
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">System statistics and recent activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${card.color} rounded-md p-3 text-white`}>
                    {card.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.title}
                    </dt>
                    <dd className="text-3xl font-bold text-gray-900">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-gray-900">Manage Users</span>
          </Link>
          <Link
            to="logs"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ClipboardList className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-gray-900">View Logs</span>
          </Link>
          <Link
            to="reports"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-6 w-6 text-primary-600 mr-3" />
            <span className="text-gray-900">Export Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [formData, setFormData] = useState({
    password: '',
    name: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    role: 'teacher',
    employeeId: '',
    studentId: '',
    year: '',
    section: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  // Excel-like table state: sorting, filtering, selection, pagination
  type SortKey = 'name' | 'role' | 'year' | 'created';
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<SortKey, string>>({
    name: '',
    role: '',
    year: '',
    created: ''
  });
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const toggleSort = (key: SortKey) => {
    setSortKey((prevKey) => {
      if (prevKey === key) {
        setSortDir((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
        return prevKey;
      }
      setSortDir('asc');
      return key;
    });
  };

  const onFilterChange = (key: SortKey, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ name: '', role: '', year: '', created: '' });
    setPage(1);
  };

  const toggleSelectRow = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000); // Hide notification after 5 seconds
  };

  const copySelected = async (rows: User[]) => {
    try {
      const header = ['Name', 'ID', 'Role', 'Year', 'Created'];
      const lines = rows.map((u) => {
        const fullName = u.first_name && u.last_name 
          ? `${u.last_name}, ${u.first_name}${u.middle_name ? ' ' + u.middle_name : ''}`
          : u.name;
        return [fullName, u.employee_id || u.student_id || '-', u.role.replace('_', ' '), u.year || '', u.created].join('\t');
      });
      const text = [header.join('\t'), ...lines].join('\n');
      await navigator.clipboard.writeText(text);
      alert(`Copied ${rows.length} row(s) to clipboard`);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Copy to clipboard failed.');
    }
  };

  const deleteSelected = async (ids: number[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected user(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(ids.map((id) => DeleteUser(id)));
      setSelectedIds(new Set());
      showNotification('success', `${ids.length} user(s) deleted successfully!`);
      loadUsers();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete users. Please try again.';
      showNotification('error', errorMessage);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [userTypeFilter, searchTerm]); // Reload when filters change

  const loadUsers = async () => {
    try {
      let data;
      
      // Use server-side filtering for better performance
      if (searchTerm && userTypeFilter) {
        // Search with user type filter
        data = await SearchUsers(searchTerm, userTypeFilter);
      } else if (searchTerm) {
        // Search all users
        data = await SearchUsers(searchTerm, '');
      } else if (userTypeFilter) {
        // Filter by user type only
        data = await GetUsersByType(userTypeFilter);
      } else {
        // Get all users
        data = await GetUsers();
      }
      
      // Ensure data is always an array, even if API returns null/undefined
      setUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Set empty array on error to prevent blank screen
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate required fields based on role
      if (!formData.firstName || !formData.lastName) {
        showNotification('error', 'First Name and Last Name are required');
        return;
      }

      if (formData.role === 'working_student') {
        if (!formData.studentId) {
          showNotification('error', 'Student ID is required for Working Students');
          return;
        }
        if (!formData.year) {
          showNotification('error', 'Year Level is required for Working Students');
          return;
        }
        if (!formData.section) {
          showNotification('error', 'Section is required for Working Students');
          return;
        }
        if (!formData.gender) {
          showNotification('error', 'Gender is required for Working Students');
          return;
        }
      } else if (formData.role === 'teacher') {
        if (!formData.employeeId) {
          showNotification('error', 'Employee ID is required for Teachers');
          return;
        }
      }

      // Build name from lastName, firstName, middleName
      const fullName = `${formData.lastName}, ${formData.firstName}${formData.middleName ? ' ' + formData.middleName : ''}`;
      
      // For new users, password is required
      // For editing, if password is empty, we keep the old password (backend handles this)
      let password_to_pass = formData.password;
      
      // If creating a new user and no password provided, show error
      if (!editingUser && !password_to_pass) {
        showNotification('error', 'Password is required for new users');
        return;
      }

      console.log('Submitting user with data:', {
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        gender: formData.gender,
        employeeId: formData.employeeId,
        studentId: formData.studentId,
        year: formData.year,
        section: formData.section
      });

      if (editingUser) {
        await UpdateUser(editingUser.id, fullName, formData.firstName, formData.middleName, formData.lastName, formData.gender, formData.role, formData.employeeId, formData.studentId, formData.year, formData.section);
        showNotification('success', 'User updated successfully!');
      } else {
        await CreateUser(password_to_pass, fullName, formData.firstName, formData.middleName, formData.lastName, formData.gender, formData.role, formData.employeeId, formData.studentId, formData.year, formData.section);
        showNotification('success', 'User created successfully!');
      }
      
      setShowForm(false);
      setEditingUser(null);
      setFormData({ password: '', name: '', firstName: '', middleName: '', lastName: '', gender: '', role: 'teacher', employeeId: '', studentId: '', year: '', section: '' });
      loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save user. Please try again.';
      showNotification('error', errorMessage);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      password: '',
      name: user.name,
      firstName: user.first_name || '',
      middleName: user.middle_name || '',
      lastName: user.last_name || '',
      gender: user.gender || '',
      role: user.role,
      employeeId: user.employee_id || '',
      studentId: user.student_id || '',
      year: user.year || '',
      section: user.section || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await DeleteUser(id);
        showNotification('success', 'User deleted successfully!');
        loadUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete user. Please try again.';
        showNotification('error', errorMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Derived table data (filters, sort, pagination)
  // Note: userTypeFilter and searchTerm are now handled server-side
  // Only column-specific filters are applied here
  const filteredUsers = users.filter((u) => {
    // Column-specific filters (for Excel-like filtering)
    const inName = u.name.toLowerCase().includes(filters.name.toLowerCase());
    const inRole = u.role.toLowerCase().includes(filters.role.toLowerCase());
    const inYear = (u.year || '').toLowerCase().includes(filters.year.toLowerCase());
    const inCreated = (u.created || '').toLowerCase().includes(filters.created.toLowerCase());
    return inName && inRole && inYear && inCreated;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let va: string;
    let vb: string;
    switch (sortKey) {
      case 'name':
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
        break;
      case 'role':
        va = a.role.toLowerCase();
        vb = b.role.toLowerCase();
        break;
      case 'year':
        va = (a.year || '').toLowerCase();
        vb = (b.year || '').toLowerCase();
        break;
      case 'created':
        va = a.created.toLowerCase();
        vb = b.created.toLowerCase();
        break;
      default:
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
        break;
    }
    if (va < vb) return sortDir === 'asc' ? -1 : 1;
    if (va > vb) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const total = sortedUsers.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const pagedUsers = sortedUsers.slice(startIndex, endIndex);

  const allSelectedOnPage = pagedUsers.length > 0 && pagedUsers.every((u) => selectedIds.has(u.id));
  const selectedRows = sortedUsers.filter((u) => selectedIds.has(u.id));
  const sortIndicator = (key: SortKey) => (sortKey === key ? (sortDir === 'asc' ? '▲' : '▼') : '');

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage system users and their roles</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </button>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by User Type
            </label>
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
              <option value="working_student">Working Student</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search (Name, Student ID, Employee ID, Gender, Date)
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
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

      {/* User Form Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowForm(false);
              setEditingUser(null);
              setFormData({ password: '', name: '', firstName: '', middleName: '', lastName: '', gender: '', role: 'teacher', employeeId: '', studentId: '', year: '', section: '' });
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 relative max-h-[90vh] flex flex-col">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingUser(null);
                setFormData({ password: '', name: '', firstName: '', middleName: '', lastName: '', gender: '', role: 'teacher', employeeId: '', studentId: '', year: '', section: '' });
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold transition-colors z-10"
            >
              ×
            </button>
            
            {/* Header */}
            <div className="text-center p-8 pb-4 flex-shrink-0">
              <h3 className="text-2xl font-bold text-blue-600 mb-2">
                {editingUser ? 'Edit User' : 'Registration'}
              </h3>
              <div className="w-24 h-0.5 bg-blue-600 mx-auto"></div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto px-8 pb-8 flex-1">
                {/* Role Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData({ 
                          ...formData, 
                          role: newRole,
                          year: '',
                          section: ''
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!!editingUser}
                    >
                      <option value="teacher">Teacher</option>
                      <option value="working_student">Working Student</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Note: Student registration is handled by Working Students
                    </p>
                  </div>
                  <div></div>
                </div>

                {/* Role-specific fields */}
                {formData.role === 'working_student' ? (
                  // Working Student Form: Student ID, Password, First/Middle/Last Name, Gender
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This will be used as the username
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={!editingUser}
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
                        {editingUser ? 'Leave blank to keep current password' : 'Required for new users'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year Level</label>
                      <select
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                      <input
                        type="text"
                        value={formData.section}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div></div>
                  </div>
                ) : formData.role === 'teacher' ? (
                  // Teacher Form: Teacher ID, Password, First/Middle/Last Name, Gender
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Teacher ID</label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This will be used as the username
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={!editingUser}
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
                        {editingUser ? 'Leave blank to keep current password' : 'Required for new users'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="e.g., Reyes"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
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
                    <div></div>
                  </div>
                ) : null}
                {/* Submit Button */}
                <div className="text-center">
                  <button
                    type="submit"
                    className="w-full max-w-xs mx-auto px-8 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  >
                    {editingUser ? 'UPDATE' : 'SUBMIT'}
                  </button>
                </div>
              </form>
          </div>
        </div>
      )}

      {/* Users Table - Excel-like features: sorting, filters, selection, pagination */}
      <div className="bg-white shadow rounded-lg">
        <div className="overflow-x-auto">
          <div className="max-h-[70vh] overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2 w-10">
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('role')}>
                    Role <span className="ml-1">{sortIndicator('role')}</span>
                  </th>
                  {(userTypeFilter === 'student' || userTypeFilter === 'working_student') && (
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('year')}>
                      Year <span className="ml-1">{sortIndicator('year')}</span>
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('created')}>
                    Created <span className="ml-1">{sortIndicator('created')}</span>
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagedUsers.map((user) => (
                  <tr key={user.id} className={selectedIds.has(user.id) ? 'bg-primary-50' : ''}>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleSelectRow(user.id)}
                    />
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">
                    {user.first_name && user.last_name 
                      ? `${user.last_name}, ${user.first_name}${user.middle_name ? ' ' + user.middle_name : ''}`
                      : user.name}
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-900">{user.employee_id || user.student_id || '-'}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{user.role.replace('_', ' ')}</td>
                    {(userTypeFilter === 'student' || userTypeFilter === 'working_student') && (
                      <td className="px-3 py-2 text-sm text-gray-900">{user.year || ''}</td>
                    )}
                    <td className="px-3 py-2 text-sm text-gray-900">{user.created}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center space-x-2 justify-end">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {pagedUsers.length === 0 && (
                  <tr>
                    <td colSpan={(userTypeFilter === 'student' || userTypeFilter === 'working_student') ? 7 : 6} className="px-3 py-6 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="p-3 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            {selectedRows.length} selected • Showing {total === 0 ? 0 : startIndex + 1}-{endIndex} of {total}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copySelected(selectedRows)}
              disabled={selectedRows.length === 0}
              className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm ${
                selectedRows.length === 0
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              title="Copy selected to clipboard"
            >
              <ClipboardList className="h-4 w-4 mr-1.5" /> Copy
            </button>
            <button
              onClick={() => deleteSelected(selectedRows.map((u) => u.id))}
              disabled={selectedRows.length === 0}
              className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm ${
                selectedRows.length === 0
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-red-700 border-red-300 hover:bg-red-50'
              }`}
              title="Delete selected"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete Selected
            </button>
            <div className="hidden sm:block w-px h-6 bg-gray-200 mx-2" />
            <label className="text-sm text-gray-600">Rows per page:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setPageSize(v);
                setPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 border rounded-md text-sm ${
                currentPage === 1
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 border rounded-md text-sm ${
                currentPage === totalPages
                  ? 'text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewLogs() {
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // General search
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Date filter only
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await GetAllLogs();
      if (data && Array.isArray(data)) {
        setLogs(data);
      } else {
        setLogs([]);
      }
      setError('');
    } catch (error) {
      console.error('Failed to load logs:', error);
      setError('Failed to load logs. Please check your database connection.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
  };

  const handleExportLogs = async () => {
    try {
      const filename = await ExportLogsCSV();
      alert(`Logs exported to ${filename}`);
    } catch (error) {
      console.error('Failed to export logs:', error);
      alert('Failed to export logs');
    }
  };

  const handleExportLogsPDF = async () => {
    try {
      const filename = await ExportLogsPDF();
      alert(`Logs exported to ${filename}`);
    } catch (error) {
      console.error('Failed to export logs:', error);
      alert('Failed to export logs');
    }
  };

  // Apply filters to logs
  const filteredLogs = logs.filter((log) => {
    // General search - searches across all fields
    const searchLower = searchQuery.toLowerCase();
    const logDate = log.login_time ? new Date(log.login_time).toISOString().split('T')[0] : '';
    const timeIn = log.login_time ? new Date(log.login_time).toLocaleTimeString() : '';
    const timeOut = log.logout_time ? new Date(log.logout_time).toLocaleTimeString() : '';
    
    const matchesSearch = searchQuery === '' || 
      log.user_name.toLowerCase().includes(searchLower) ||
      log.user_type.toLowerCase().includes(searchLower) ||
      (log.pc_number || '').toLowerCase().includes(searchLower) ||
      logDate.includes(searchLower) ||
      timeIn.toLowerCase().includes(searchLower) ||
      timeOut.toLowerCase().includes(searchLower);
    
    // Date filter
    const matchesDate = dateFilter === '' || logDate === dateFilter;
    
    return matchesSearch && matchesDate;
  });

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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">View Logs</h2>
            <p className="text-gray-600">Monitor user login and logout activities</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportLogs}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={handleExportLogsPDF}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Search Bar and Filter Button */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-5 w-5" />
            Filters
            {dateFilter && (
              <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white rounded-full text-xs">
                1
              </span>
            )}
          </button>
          {(searchQuery || dateFilter) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Clear date filter
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[70vh] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PC Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time-In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time-Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {log.user_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                          {log.user_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {log.pc_number || <span className="text-gray-400">N/A</span>}
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
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {log.login_time ? new Date(log.login_time).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <svg className="w-12 h-12 mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium">No logs found</p>
                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{filteredLogs.length}</span> of <span className="font-medium">{logs.length}</span> logs
          </div>
          {(searchQuery || dateFilter) && (
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Search className="h-4 w-4" />
              <span>Search/Filters active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const [reports, setReports] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // General search
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Date filter only
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const data = await GetFeedback();
      if (data && Array.isArray(data)) {
        setReports(data);
      } else {
        setReports([]);
      }
      setError('');
    } catch (error) {
      console.error('Failed to load reports:', error);
      setError('Failed to load reports. Please check your database connection.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
  };

  const handleExportReports = async () => {
    try {
      const filename = await ExportFeedbackCSV();
      alert(`Reports exported to ${filename}`);
    } catch (error) {
      console.error('Failed to export reports:', error);
      alert('Failed to export reports');
    }
  };

  const handleExportReportsPDF = async () => {
    try {
      const filename = await ExportFeedbackPDF();
      alert(`Reports exported to ${filename}`);
    } catch (error) {
      console.error('Failed to export reports:', error);
      alert('Failed to export reports');
    }
  };

  // Apply filters to reports
  const filteredReports = reports.filter((report) => {
    // General search - searches across all fields
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      report.student_name.toLowerCase().includes(searchLower) ||
      report.student_id_str.toLowerCase().includes(searchLower) ||
      report.pc_number.toLowerCase().includes(searchLower) ||
      report.equipment_condition.toLowerCase().includes(searchLower) ||
      report.monitor_condition.toLowerCase().includes(searchLower) ||
      report.keyboard_condition.toLowerCase().includes(searchLower) ||
      report.mouse_condition.toLowerCase().includes(searchLower) ||
      (report.comments && report.comments.toLowerCase().includes(searchLower)) ||
      (report.date_submitted && report.date_submitted.toLowerCase().includes(searchLower));
    
    // Date filter
    const matchesDate = dateFilter === '' || (report.date_submitted && report.date_submitted.startsWith(dateFilter));

    return matchesSearch && matchesDate;
  });

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
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Equipment Reports</h2>
            <p className="text-gray-600">View student-submitted equipment condition reports</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportReports}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
            <button
              onClick={handleExportReportsPDF}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Search Bar and Filter Button */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
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
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
              showFilters
                ? 'bg-primary-50 border-primary-500 text-primary-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-5 w-5" />
            Filters
            {dateFilter && (
              <span className="ml-1 px-2 py-0.5 bg-primary-500 text-white rounded-full text-xs">
                1
              </span>
            )}
          </button>
          {(searchQuery || dateFilter) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by Date:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter('')}
                  className="text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Clear date filter
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student ID
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
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.student_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.student_id_str}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.pc_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.equipment_condition === 'Good' 
                        ? 'bg-green-100 text-green-800' 
                        : report.equipment_condition === 'Minor Issue' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {report.equipment_condition}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.monitor_condition}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.keyboard_condition}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.mouse_condition}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {report.comments || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.date_submitted ? new Date(report.date_submitted).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No reports found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredReports.length}</span> of <span className="font-medium">{reports.length}</span> reports
          </div>
          {(searchQuery || dateFilter) && (
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Search className="h-4 w-4" />
              <span>Search/Filters active</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" />, current: location.pathname === '/admin' },
    { name: 'Manage Users', href: '/admin/users', icon: <Users className="h-5 w-5" />, current: location.pathname === '/admin/users' },
    { name: 'View Logs', href: '/admin/logs', icon: <ClipboardList className="h-5 w-5" />, current: location.pathname === '/admin/logs' },
    { name: 'Reports', href: '/admin/reports', icon: <FileText className="h-5 w-5" />, current: location.pathname === '/admin/reports' },
  ];

  return (
    <Layout navigationItems={navigationItems} title="Admin Dashboard">
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="logs" element={<ViewLogs />} />
        <Route path="reports" element={<Reports />} />
      </Routes>
    </Layout>
  );
}

export default AdminDashboard;

