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
  Download
} from 'lucide-react';
import { 
  GetAdminDashboard, 
  GetUsers, 
  CreateUser, 
  UpdateUser, 
  DeleteUser,
  ExportUsersCSV 
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
  email?: string;
  name: string;
  role: string;
  year?: string;
  created: string;
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
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    name: '',
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
  }, []);

  const loadUsers = async () => {
    try {
      const data = await GetUsers();
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
      let first_name = '';
      let middle_name = '';
      let last_name = '';
      let employee_id = '';
      let student_id = '';
      let email_to_pass = formData.email;
      let password_to_pass = formData.password;
      let username_to_pass = formData.username;

      if (formData.role === 'working_student') {
        student_id = formData.username;
        email_to_pass = '';
        password_to_pass = formData.username;
      } else if (formData.role === 'instructor') {
        employee_id = formData.username;
      } // for admin, username is username

      if (editingUser) {
        await UpdateUser(editingUser.id, username_to_pass, email_to_pass, password_to_pass, formData.name, first_name, middle_name, last_name, formData.role, employee_id, student_id);
      } else {
        await CreateUser(username_to_pass, email_to_pass, password_to_pass, formData.name, first_name, middle_name, last_name, formData.role, employee_id, student_id, formData.year);
      }
      
      setShowForm(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', name: '', role: 'instructor', year: '' });
      loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      name: user.name,
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

  const handleExport = async () => {
    try {
      const filename = await ExportUsersCSV();
      alert(`Users exported to ${filename}`);
    } catch (error) {
      console.error('Failed to export users:', error);
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
  const filteredUsers = users.filter((u) => {
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
        <div className="flex space-x-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </button>
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
                        email: newRole === 'working_student' ? '' : formData.email,
                        year: '' // Clear year field since it's not used for admin roles
                      });
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    disabled={!!editingUser} // Disable role change when editing
                  >
                    <option value="instructor">Instructor</option>
                    <option value="working_student">Working Student</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Note: Student registration is handled by Working Students
                  </p>
                </div>

                {/* Role-specific fields */}
                {formData.role === 'working_student' ? (
                  // Working Student Form: Only Student ID and Name
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
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    {!editingUser && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              Password will be automatically set to the Student ID
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : formData.role === 'instructor' ? (
                  // Instructor Form: Employee ID, Name, Email
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
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="instructor@university.edu"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                      </div>
                    )}
                  </>
                ) : (
                  // Admin Form: Username, Name, Email
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="admin username"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter full name"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="admin@university.edu"
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                        required
                      />
                    </div>
                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                          required
                        />
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingUser(null);
                      setFormData({ username: '', email: '', password: '', name: '', role: 'instructor', year: '' });
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
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">System Logs</h2>
      <p className="text-gray-600">Attendance and login logs will be displayed here.</p>
    </div>
  );
}

function Reports() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Reports</h2>
      <p className="text-gray-600">Export and generate reports will be available here.</p>
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

