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
  X
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

interface DashboardStats {
  total_students: number;
  total_instructors: number;
  working_students: number;
  recent_logins: number;
}

interface User {
  id: number;
  username: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  gender?: string;
  role: string;
  employee_id?: string;
  student_id?: string;
  year?: string;
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

interface Feedback {
  id: number;
  student_id: number;
  student_name: string;
  student_id_str: string;
  pc_number: string;
  time_in: string;
  time_out: string;
  equipment: string;
  condition: string;
  comment: string;
  date: string;
}

function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    total_students: 0,
    total_instructors: 0,
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
      title: 'Instructors',
      value: stats.total_instructors,
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
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    role: 'instructor',
    year: ''
  });

  // Excel-like table state: sorting, filtering, selection, pagination
  type SortKey = 'name' | 'username' | 'role' | 'year' | 'created';
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<SortKey, string>>({
    name: '',
    username: '',
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
    setFilters({ name: '', username: '', role: '', year: '', created: '' });
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

  const copySelected = async (rows: User[]) => {
    try {
      const header = ['Name', 'Username', 'Role', 'Year', 'Created'];
      const lines = rows.map((u) =>
        [u.name, u.username, u.role.replace('_', ' '), u.year || '', u.created].join('\t')
      );
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
      loadUsers();
    } catch (err) {
      console.error('Bulk delete failed:', err);
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
      
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Build name from lastName, firstName, middleName
      const fullName = `${formData.lastName}, ${formData.firstName}${formData.middleName ? ' ' + formData.middleName : ''}`;
      
      let employee_id = '';
      let student_id = '';
      let password_to_pass = formData.password;
      let username_to_pass = formData.username;

      if (formData.role === 'working_student') {
        student_id = formData.username;
        password_to_pass = formData.username; // Default password is student ID
      } else if (formData.role === 'instructor') {
        employee_id = formData.username;
        password_to_pass = formData.username; // Default password is employee ID
      } // for admin, username is username and password must be provided

      if (editingUser) {
        await UpdateUser(editingUser.id, username_to_pass, fullName, formData.firstName, formData.middleName, formData.lastName, formData.gender, formData.role, employee_id, student_id, formData.year);
      } else {
        await CreateUser(username_to_pass, password_to_pass, fullName, formData.firstName, formData.middleName, formData.lastName, formData.gender, formData.role, employee_id, student_id, formData.year);
      }
      
      setShowForm(false);
      setEditingUser(null);
      setFormData({ username: '', password: '', name: '', firstName: '', middleName: '', lastName: '', gender: '', role: 'instructor', year: '' });
      loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user. Please check the console for errors.');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      firstName: user.first_name || '',
      middleName: user.middle_name || '',
      lastName: user.last_name || '',
      gender: user.gender || '',
      role: user.role,
      year: user.year || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await DeleteUser(id);
        loadUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
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
    const inUsername = u.username.toLowerCase().includes(filters.username.toLowerCase());
    const inRole = u.role.toLowerCase().includes(filters.role.toLowerCase());
    const inYear = (u.year || '').toLowerCase().includes(filters.year.toLowerCase());
    const inCreated = (u.created || '').toLowerCase().includes(filters.created.toLowerCase());
    return inName && inUsername && inRole && inYear && inCreated;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let va: string;
    let vb: string;
    switch (sortKey) {
      case 'name':
        va = a.name.toLowerCase();
        vb = b.name.toLowerCase();
        break;
      case 'username':
        va = a.username.toLowerCase();
        vb = b.username.toLowerCase();
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by User Type
            </label>
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All</option>
              <option value="instructor">Instructor</option>
              <option value="student">Student</option>
              <option value="working_student">Working Student</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search (Name, Student ID, Employee ID, Gender, Date)
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* User Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Role Selection - First field to determine form layout */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value;
                      setFormData({ 
                        ...formData, 
                        role: newRole,
                        // Clear fields that might not be relevant for the new role
                        year: ''
                      });
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={!!editingUser} // Disable role change when editing
                  >
                    <option value="instructor">Instructor</option>
                    <option value="working_student">Working Student</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Note: Student registration is handled by Working Students
                  </p>
                </div>

                {/* Role-specific fields */}
                {formData.role === 'working_student' ? (
                  // Working Student Form: Student ID, First/Middle/Last Name, Gender
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Student ID</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="e.g., 2025-1234"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This will also be used as the default password
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="e.g., Santos"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="e.g., Juan"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Middle Name (Optional)</label>
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                        placeholder="e.g., Miguel"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </>
                ) : formData.role === 'instructor' ? (
                  // Instructor Form: Employee ID, First/Middle/Last Name, Gender (No Email)
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="e.g., instructor1"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        This will also be used as the default password
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="e.g., Reyes"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="e.g., Juan"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Middle Name (Optional)</label>
                      <input
                        type="text"
                        value={formData.middleName}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                        placeholder="e.g., Miguel"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </>
                ) : null}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingUser(null);
                      setFormData({ username: '', password: '', name: '', firstName: '', middleName: '', lastName: '', gender: '', role: 'instructor', year: '' });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
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
                    <input
                      type="checkbox"
                      checked={allSelectedOnPage}
                      onChange={() => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev);
                          if (allSelectedOnPage) {
                            pagedUsers.forEach((u) => next.delete(u.id));
                          } else {
                            pagedUsers.forEach((u) => next.add(u.id));
                          }
                          return next;
                        });
                      }}
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('name')}>
                    Name <span className="ml-1">{sortIndicator('name')}</span>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('username')}>
                    Username <span className="ml-1">{sortIndicator('username')}</span>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('role')}>
                    Role <span className="ml-1">{sortIndicator('role')}</span>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('year')}>
                    Year <span className="ml-1">{sortIndicator('year')}</span>
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none" onClick={() => toggleSort('created')}>
                    Created <span className="ml-1">{sortIndicator('created')}</span>
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
                <tr>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">
                    <input
                      type="text"
                      value={filters.name}
                      onChange={(e) => onFilterChange('name', e.target.value)}
                      placeholder="Filter name"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </th>
                  <th className="px-3 py-2">
                    <input
                      type="text"
                      value={filters.username}
                      onChange={(e) => onFilterChange('username', e.target.value)}
                      placeholder="Filter username"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </th>
                  <th className="px-3 py-2">
                    <input
                      type="text"
                      value={filters.role}
                      onChange={(e) => onFilterChange('role', e.target.value)}
                      placeholder="Filter role"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </th>
                  <th className="px-3 py-2">
                    <input
                      type="text"
                      value={filters.year}
                      onChange={(e) => onFilterChange('year', e.target.value)}
                      placeholder="Filter year"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </th>
                  <th className="px-3 py-2">
                    <input
                      type="text"
                      value={filters.created}
                      onChange={(e) => onFilterChange('created', e.target.value)}
                      placeholder="Filter created"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </th>
                  <th className="px-3 py-2 text-right">
                    <button onClick={clearFilters} className="text-sm text-gray-600 hover:text-gray-900 underline">
                      Clear filters
                    </button>
                  </th>
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
                    <td className="px-3 py-2 text-sm text-gray-900">{user.name}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{user.username}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{user.role.replace('_', ' ')}</td>
                    <td className="px-3 py-2 text-sm text-gray-900">{user.year || ''}</td>
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
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
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
      report.time_in.toLowerCase().includes(searchLower) ||
      report.time_out.toLowerCase().includes(searchLower) ||
      report.equipment.toLowerCase().includes(searchLower) ||
      report.condition.toLowerCase().includes(searchLower) ||
      report.comment.toLowerCase().includes(searchLower) ||
      (report.date && report.date.toLowerCase().includes(searchLower));
    
    // Date filter
    const matchesDate = dateFilter === '' || (report.date && report.date.startsWith(dateFilter));

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
                  Time In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Condition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Report
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.time_in}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.time_out}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.equipment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.condition === 'Good' 
                        ? 'bg-green-100 text-green-800' 
                        : report.condition === 'Fair' 
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {report.condition}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {report.comment}
                  </td>
                </tr>
              ))}
              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
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

