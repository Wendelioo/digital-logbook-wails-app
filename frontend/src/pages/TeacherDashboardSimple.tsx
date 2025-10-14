import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  BookOpen
} from 'lucide-react';
import { 
  GetTeacherDashboard,
  GetSubjects
} from '../../wailsjs/go/main/App';
import { useAuth } from '../contexts/AuthContext';

// Simple version without the new backend functions
type Subject = {
  id: number;
  code: string;
  name: string;
  teacher: string;
  room: string;
  schedule?: string;
};

function SimpleDashboardOverview() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        console.log('Loading dashboard for teacher:', user?.name);
        
        // Try to get subjects
        try {
          const subjectsData = await GetSubjects();
          console.log('Subjects data:', subjectsData);
          setSubjects(subjectsData || []);
        } catch (subjectsError) {
          console.error('Failed to load subjects:', subjectsError);
          // Use mock data as fallback
          setSubjects([
            {
              id: 1,
              code: "IT101",
              name: "Programming Fundamentals",
              teacher: "Maria C. Santos",
              room: "Lab 1",
              schedule: "MWF 8-9AM"
            },
            {
              id: 2,
              code: "IT102",
              name: "Database Management",
              teacher: "Maria C. Santos",
              room: "Lab 2",
              schedule: "TTh 1-2PM"
            }
          ]);
        }
        
        setError('');
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        setError('Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.name]);

  return (
    <div className="p-6">
      {/* Welcome Message */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name || 'Teacher'}!</h1>
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
                    My Subjects
                  </dt>
                  <dd className="text-3xl font-bold text-gray-900">
                    {subjects.length}
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
                    0
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
                    0
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
        {subjects.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects assigned</h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have any subjects assigned yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => (
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
                      {subject.schedule && (
                        <p className="text-sm text-gray-500">{subject.schedule}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simple Class Lists Link */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <Users className="h-5 w-5 text-primary-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">View Class Lists</p>
              <p className="text-sm text-gray-500">Manage your class rosters</p>
            </div>
            <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
              View →
            </button>
          </div>
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <ClipboardList className="h-5 w-5 text-primary-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Record Attendance</p>
              <p className="text-sm text-gray-500">Mark student attendance</p>
            </div>
            <button className="text-primary-600 hover:text-primary-900 text-sm font-medium">
              Record →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimpleTeacherDashboard() {
  const location = useLocation();
  
  const navigationItems = [
    { name: 'Dashboard', href: '/teacher', icon: <LayoutDashboard className="h-5 w-5" />, current: location.pathname === '/teacher' },
    { name: 'Class Lists', href: '/teacher/classlists', icon: <Users className="h-5 w-5" />, current: location.pathname === '/teacher/classlists' },
    { name: 'Attendance', href: '/teacher/attendance', icon: <ClipboardList className="h-5 w-5" />, current: location.pathname === '/teacher/attendance' },
  ];

  return (
    <Layout navigationItems={navigationItems} title="Teacher Dashboard">
      <Routes>
        <Route index element={<SimpleDashboardOverview />} />
        <Route path="classlists" element={<div className="p-6"><h2>Class Lists - Coming Soon</h2></div>} />
        <Route path="attendance" element={<div className="p-6"><h2>Attendance - Coming Soon</h2></div>} />
      </Routes>
    </Layout>
  );
}

export default SimpleTeacherDashboard;
