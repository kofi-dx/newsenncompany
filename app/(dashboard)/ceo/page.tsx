/* eslint-disable @typescript-eslint/no-explicit-any */
// app/ceo/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

interface CEOStats {
  totalEmployees: number;
  totalManagers: number;
  totalContributors: number;
  pendingApprovals: number;
  totalArticles: number;
  totalViews: number;
  totalEarnings: number;
  activePromotions: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: any;
  user?: string;
}

export default function CEODashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CEOStats>({
    totalEmployees: 0,
    totalManagers: 0,
    totalContributors: 0,
    pendingApprovals: 0,
    totalArticles: 0,
    totalViews: 0,
    totalEarnings: 0,
    activePromotions: 0
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const [
          employeesSnapshot,
          managersSnapshot,
          contributorsSnapshot,
          approvalsSnapshot,
          articlesSnapshot,
          promotionsSnapshot,
          activitySnapshot
        ] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'employee'))),
          getDocs(query(collection(db, 'users'), where('role', '==', 'manager'))),
          getDocs(query(collection(db, 'contributors'), where('status', '==', 'active'))),
          getDocs(query(collection(db, 'authRequests'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'articles'), where('status', '==', 'approved'))),
          getDocs(query(collection(db, 'promotions'), where('status', '==', 'active'))),
          getDocs(query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(5)))
        ]);

        // Calculate total views from approved articles
        let totalViews = 0;
        let totalEarnings = 0;
        
        articlesSnapshot.forEach(doc => {
          const articleData = doc.data();
          totalViews += articleData.views || 0;
          totalEarnings += articleData.earnings || 0;
        });

        // Process recent activity
        const activityData: Activity[] = activitySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Activity[];

        setStats({
          totalEmployees: employeesSnapshot.size,
          totalManagers: managersSnapshot.size,
          totalContributors: contributorsSnapshot.size,
          pendingApprovals: approvalsSnapshot.size,
          totalArticles: articlesSnapshot.size,
          totalViews,
          totalEarnings,
          activePromotions: promotionsSnapshot.size
        });

        setRecentActivity(activityData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered': return '👤';
      case 'article_published': return '📝';
      case 'approval_pending': return '✅';
      case 'earnings_generated': return '💰';
      case 'manager_created': return '👔';
      default: return '📢';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CEO dashboard...</p>
          <p className="text-sm text-gray-500 mt-1">Compiling system statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">CEO Dashboard</h1>
            <p className="text-blue-100 mt-2 text-sm sm:text-base">
              Welcome back, {user?.name}. Here&apos;s your complete system overview.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-sm">
              <div className="font-semibold">System Status</div>
              <div className="text-blue-100">All Systems Operational</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Total Employees</h3>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">{stats.totalEmployees}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Active workforce</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-blue-100">
              <span className="text-xl sm:text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Managers</h3>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-1">{stats.totalManagers}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Team leaders</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-green-100">
              <span className="text-xl sm:text-2xl">👔</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Contributors</h3>
              <p className="text-2xl sm:text-3xl font-bold text-purple-600 mt-1">{stats.totalContributors}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Content creators</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-purple-100">
              <span className="text-xl sm:text-2xl">✍️</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Pending Approvals</h3>
              <p className="text-2xl sm:text-3xl font-bold text-orange-600 mt-1">{stats.pendingApprovals}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Awaiting review</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-orange-100">
              <span className="text-xl sm:text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Total Articles</h3>
              <p className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-1">{stats.totalArticles}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Published content</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-indigo-100">
              <span className="text-xl sm:text-2xl">📝</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Total Views</h3>
              <p className="text-2xl sm:text-3xl font-bold text-cyan-600 mt-1">{stats.totalViews.toLocaleString()}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Content engagement</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-cyan-100">
              <span className="text-xl sm:text-2xl">👀</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Total Earnings</h3>
              <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-1">
                ${stats.totalEarnings.toLocaleString()}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Platform revenue</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-yellow-100">
              <span className="text-xl sm:text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Active Promotions</h3>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">{stats.activePromotions}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Marketing campaigns</p>
            </div>
            <div className="p-2 sm:p-3 rounded-lg bg-red-100">
              <span className="text-xl sm:text-2xl">🎯</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Link 
              href="/ceo/approvals"
              className="p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200 hover:border-blue-300 group"
            >
              <div className="text-base sm:text-lg font-semibold text-blue-700 flex items-center">
                <span className="mr-2 group-hover:scale-110 transition-transform">✅</span>
                Review Approvals
              </div>
              <div className="text-xs sm:text-sm text-blue-600 mt-1">
                {stats.pendingApprovals} pending requests
              </div>
            </Link>

            <Link 
              href="/ceo/users"
              className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all duration-200 border border-green-200 hover:border-green-300 group"
            >
              <div className="text-base sm:text-lg font-semibold text-green-700 flex items-center">
                <span className="mr-2 group-hover:scale-110 transition-transform">👥</span>
                Manage Users
              </div>
              <div className="text-xs sm:text-sm text-green-600 mt-1">
                {stats.totalEmployees + stats.totalManagers} total users
              </div>
            </Link>

            <Link 
              href="/ceo/articles"
              className="p-3 sm:p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all duration-200 border border-purple-200 hover:border-purple-300 group"
            >
              <div className="text-base sm:text-lg font-semibold text-purple-700 flex items-center">
                <span className="mr-2 group-hover:scale-110 transition-transform">📝</span>
                View Content
              </div>
              <div className="text-xs sm:text-sm text-purple-600 mt-1">
                {stats.totalArticles} articles
              </div>
            </Link>

            <Link 
              href="/ceo/earnings"
              className="p-3 sm:p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg hover:from-orange-100 hover:to-orange-200 transition-all duration-200 border border-orange-200 hover:border-orange-300 group"
            >
              <div className="text-base sm:text-lg font-semibold text-orange-700 flex items-center">
                <span className="mr-2 group-hover:scale-110 transition-transform">💰</span>
                View Earnings
              </div>
              <div className="text-xs sm:text-sm text-orange-600 mt-1">
                ${stats.totalEarnings.toLocaleString()} revenue
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Recent Activity</h2>
            <Link 
              href="/ceo/reports"
              className="text-blue-600 hover:text-blue-700 font-medium text-xs sm:text-sm"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-3">📊</div>
                <p className="text-sm sm:text-base">No recent activity</p>
                <p className="text-xs sm:text-sm mt-1">System activity will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 sm:mb-6">Performance Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalArticles}</div>
            <div className="text-sm text-blue-700 font-medium mt-1">Articles Published</div>
            <div className="text-xs text-blue-600 mt-1">Content Performance</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {stats.totalViews > 0 ? Math.round(stats.totalViews / stats.totalArticles) : 0}
            </div>
            <div className="text-sm text-green-700 font-medium mt-1">Avg. Views/Article</div>
            <div className="text-xs text-green-600 mt-1">Engagement Rate</div>
          </div>
          <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              ${stats.totalEarnings > 0 ? (stats.totalEarnings / stats.totalArticles).toFixed(2) : '0.00'}
            </div>
            <div className="text-sm text-purple-700 font-medium mt-1">Avg. Earnings/Article</div>
            <div className="text-xs text-purple-600 mt-1">Revenue Efficiency</div>
          </div>
        </div>
      </div>
    </div>
  );
}