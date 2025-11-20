/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
// app/manager/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface ManagerStats {
  totalContributors: number;
  activeContributors: number;
  totalArticles: number;
  totalViews: number;
  totalEarnings: number;
  pendingApprovals: number;
  totalEmployees: number;
  activeEmployees: number;
}

interface Contributor {
  id: string;
  name: string;
  email: string;
  status: string;
  totalEarnings: number;
  articlesCount: number;
  totalViews: number;
  lastActive?: any;
  joinedAt: any;
  level?: string;
}

interface Employee {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  status: string;
  lastLogin?: any;
  createdAt: any;
  department?: string;
  managerId: string;
}

interface Article {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  status: string;
  views: number;
  earnings: number;
  publishedAt?: any;
  category?: string;
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ManagerStats>({
    totalContributors: 0,
    activeContributors: 0,
    totalArticles: 0,
    totalViews: 0,
    totalEarnings: 0,
    pendingApprovals: 0,
    totalEmployees: 0,
    activeEmployees: 0
  });
  const [topContributors, setTopContributors] = useState<Contributor[]>([]);
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchManagerData();
  }, [user]);

  // Helper function to get employee display name
  const getEmployeeName = (employee: Employee): string => {
    if (employee.firstName && employee.lastName) {
      return `${employee.firstName} ${employee.lastName}`;
    }
    return employee.name || 'Unknown Employee';
  };

  // Helper function to get employee initials
  const getEmployeeInitials = (employee: Employee): string => {
    if (employee.firstName && employee.lastName) {
      return `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();
    }
    if (employee.name) {
      return employee.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return 'EE';
  };

  const fetchManagerData = async () => {
    if (!user) return;

    try {
      console.log('🔄 Fetching manager data for:', user.id);

      // Fetch all contributors
      const contributorsQuery = query(collection(db, 'contributors'));
      const contributorsSnapshot = await getDocs(contributorsQuery);
      const contributorsData: Contributor[] = contributorsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Contributor[];

      console.log(`📊 Found ${contributorsData.length} contributors`);

      // Fetch all articles to calculate stats
      const articlesQuery = query(collection(db, 'articles'));
      const articlesSnapshot = await getDocs(articlesQuery);
      const articlesData: Article[] = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Article[];

      console.log(`📝 Found ${articlesData.length} articles`);

      // Fetch employees under this manager
      const employeesQuery = query(
        collection(db, 'users'), 
        where('managerId', '==', user.id)
      );
      const employeesSnapshot = await getDocs(employeesQuery);
      const employeesData: Employee[] = employeesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Unknown Employee'
        };
      }) as Employee[];

      console.log(`👥 Found ${employeesData.length} employees`);

      // Calculate contributor statistics
      const activeContributors = contributorsData.filter(c => c.status === 'active');
      const totalEarnings = contributorsData.reduce((sum, contributor) => sum + (contributor.totalEarnings || 0), 0);
      const totalViews = contributorsData.reduce((sum, contributor) => sum + (contributor.totalViews || 0), 0);
      const totalArticles = contributorsData.reduce((sum, contributor) => sum + (contributor.articlesCount || 0), 0);

      // Calculate pending approvals
      const pendingApprovals = articlesData.filter(article => article.status === 'pending').length;

      // Get top contributors (by earnings)
      const topEarners = [...contributorsData]
        .filter(c => c.totalEarnings > 0)
        .sort((a, b) => (b.totalEarnings || 0) - (a.totalEarnings || 0))
        .slice(0, 5);

      // Get recent employees
      const recentEmployeesData = [...employeesData]
        .sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0))
        .slice(0, 5);

      // Get recent articles
      const recentArticlesData = [...articlesData]
        .filter(article => article.status === 'approved')
        .sort((a, b) => (b.publishedAt?.toDate() || 0) - (a.publishedAt?.toDate() || 0))
        .slice(0, 5);

      setTopContributors(topEarners);
      setRecentEmployees(recentEmployeesData);
      setRecentArticles(recentArticlesData);

      setStats({
        totalContributors: contributorsData.length,
        activeContributors: activeContributors.length,
        totalArticles,
        totalViews,
        totalEarnings,
        pendingApprovals,
        totalEmployees: employeesData.length,
        activeEmployees: employeesData.filter(e => e.status === 'active').length
      });

    } catch (error) {
      console.error('❌ Error fetching manager data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLastLogin = (lastLogin: any) => {
    if (!lastLogin) return 'Never';
    
    const lastLoginDate = lastLogin.toDate();
    const now = new Date();
    const diffMs = now.getTime() - lastLoginDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return lastLoginDate.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading manager dashboard...</span>
      </div>
    );
  }

  return (
    <div className="px-2 sm:px-4 lg:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          Welcome back, {user?.name}. Monitor contributors and manage your team.
        </p>
      </div>

      {/* Stats Grid - Contributors Focus */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Total Contributors</h3>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.totalContributors}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {stats.activeContributors} active
              </p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-purple-100">
              <span className="text-xl sm:text-2xl">✍️</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Total Articles</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalArticles.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Published content</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-blue-100">
              <span className="text-xl sm:text-2xl">📝</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Total Views</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Content engagement</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-green-100">
              <span className="text-xl sm:text-2xl">👀</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Total Earnings</h3>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                ${stats.totalEarnings.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Contributor payouts</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-yellow-100">
              <span className="text-xl sm:text-2xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Team Employees</h3>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600">{stats.totalEmployees}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {stats.activeEmployees} active
              </p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-indigo-100">
              <span className="text-xl sm:text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Pending Approvals</h3>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Articles waiting review</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-orange-100">
              <span className="text-xl sm:text-2xl">⏳</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Top Contributors */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Top Contributors</h2>
            <Link 
              href="/manager/contributors"
              className="text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {topContributors.map((contributor, index) => (
              <div key={contributor.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center min-w-0 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' : 'bg-blue-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{contributor.name}</div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate">
                      {contributor.articlesCount || 0} articles • {contributor.totalViews?.toLocaleString() || 0} views
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="font-semibold text-green-600 text-sm sm:text-base">
                    ${(contributor.totalEarnings || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {contributor.status}
                  </div>
                </div>
              </div>
            ))}
            {topContributors.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <div className="text-3xl sm:text-4xl mb-2">💸</div>
                <p className="text-sm sm:text-base">No contributor earnings yet</p>
                <p className="text-xs sm:text-sm">Earnings will appear when contributors start publishing</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Employees */}
        <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Recent Employees</h2>
            <Link 
              href="/manager/team"
              className="text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm"
            >
              Manage Team →
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {recentEmployees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-xs sm:text-sm">
                      {getEmployeeInitials(employee)}
                    </span>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <div className="font-medium text-gray-900 truncate">{getEmployeeName(employee)}</div>
                    <div className="text-xs sm:text-sm text-gray-500 truncate">
                      {employee.role} • {employee.department || 'No department'}
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className={`text-xs sm:text-sm font-medium ${
                    employee.status === 'active' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {employee.status}
                  </div>
                  <div className="text-xs text-gray-500">
                    Last: {formatLastLogin(employee.lastLogin)}
                  </div>
                </div>
              </div>
            ))}
            {recentEmployees.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <div className="text-3xl sm:text-4xl mb-2">👥</div>
                <p className="text-sm sm:text-base">No employees in your team</p>
                <p className="text-xs sm:text-sm">Add employees to start building your team</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link 
            href="/manager/create-employee"
            className="p-3 sm:p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
          >
            <div className="text-base sm:text-lg font-semibold text-green-700">Add Employee</div>
            <div className="text-xs sm:text-sm text-green-600 mt-1">Create new team member</div>
          </Link>

          <Link 
            href="/manager/contributors"
            className="p-3 sm:p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left"
          >
            <div className="text-base sm:text-lg font-semibold text-blue-700">Manage Contributors</div>
            <div className="text-xs sm:text-sm text-blue-600 mt-1">View and manage contributors</div>
          </Link>

          <Link 
            href="/manager/articles"
            className="p-3 sm:p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
          >
            <div className="text-base sm:text-lg font-semibold text-purple-700">Review Articles</div>
            <div className="text-xs sm:text-sm text-purple-600 mt-1">{stats.pendingApprovals} pending</div>
          </Link>

          <Link 
            href="/manager/performance"
            className="p-3 sm:p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left"
          >
            <div className="text-base sm:text-lg font-semibold text-orange-700">View Analytics</div>
            <div className="text-xs sm:text-sm text-orange-600 mt-1">Performance reports</div>
          </Link>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Recent Articles</h2>
          <Link 
            href="/manager/articles"
            className="text-green-600 hover:text-green-700 font-medium text-xs sm:text-sm"
          >
            View All Articles →
          </Link>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {recentArticles.map((article) => (
            <div key={article.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-2 sm:gap-0">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base">{article.title}</h3>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-gray-500">
                  <span className="truncate">By: {article.authorName}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Views: {article.views.toLocaleString()}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>Earnings: ${(article.earnings || 0).toLocaleString()}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {article.category || 'General'}
                  </span>
                </div>
              </div>
              <div className="flex sm:justify-end mt-2 sm:mt-0">
                <Link 
                  href={`/articles/${article.id}`}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-xs sm:text-sm hover:bg-blue-700 whitespace-nowrap"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
          {recentArticles.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <div className="text-3xl sm:text-4xl mb-2">📝</div>
              <p className="text-sm sm:text-base">No articles published yet</p>
              <p className="text-xs sm:text-sm">Articles will appear here when contributors start publishing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}