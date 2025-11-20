// app/ceo/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
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
          promotionsSnapshot
        ] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'employee'))),
          getDocs(query(collection(db, 'users'), where('role', '==', 'manager'))),
          getDocs(query(collection(db, 'contributors'), where('status', '==', 'active'))),
          getDocs(query(collection(db, 'authRequests'), where('status', '==', 'pending'))),
          getDocs(query(collection(db, 'articles'), where('status', '==', 'approved'))),
          getDocs(query(collection(db, 'promotions'), where('status', '==', 'active')))
        ]);

        // Calculate total views from approved articles
        let totalViews = 0;
        let totalEarnings = 0;
        
        articlesSnapshot.forEach(doc => {
          const articleData = doc.data();
          totalViews += articleData.views || 0;
          totalEarnings += articleData.earnings || 0;
        });

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
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">CEO Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user?.name}. Here&apos;s your system overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Total Employees</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalEmployees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <span className="text-2xl">👔</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Managers</h3>
              <p className="text-3xl font-bold text-green-600">{stats.totalManagers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <span className="text-2xl">✍️</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Contributors</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.totalContributors}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-orange-100">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Pending Approvals</h3>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-indigo-100">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Total Articles</h3>
              <p className="text-3xl font-bold text-indigo-600">{stats.totalArticles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-cyan-100">
              <span className="text-2xl">👀</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Total Views</h3>
              <p className="text-3xl font-bold text-cyan-600">{stats.totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Total Earnings</h3>
              <p className="text-3xl font-bold text-yellow-600">${stats.totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Active Promotions</h3>
              <p className="text-3xl font-bold text-red-600">{stats.activePromotions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/ceo/approvals"
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border-2 border-transparent hover:border-blue-200"
          >
            <div className="text-lg font-semibold text-blue-700">Review Approvals</div>
            <div className="text-sm text-blue-600 mt-1">{stats.pendingApprovals} pending requests</div>
          </Link>

          <Link 
            href="/ceo/users"
            className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors border-2 border-transparent hover:border-green-200"
          >
            <div className="text-lg font-semibold text-green-700">Manage Users</div>
            <div className="text-sm text-green-600 mt-1">{stats.totalEmployees + stats.totalManagers} total users</div>
          </Link>

          <Link 
            href="/ceo/articles"
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors border-2 border-transparent hover:border-purple-200"
          >
            <div className="text-lg font-semibold text-purple-700">View Content</div>
            <div className="text-sm text-purple-600 mt-1">{stats.totalArticles} articles, {stats.totalViews.toLocaleString()} views</div>
          </Link>

          <Link 
            href="/ceo/earnings"
            className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border-2 border-transparent hover:border-orange-200"
          >
            <div className="text-lg font-semibold text-orange-700">View Earnings</div>
            <div className="text-sm text-orange-600 mt-1">${stats.totalEarnings.toLocaleString()} revenue</div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent System Activity</h2>
        <div className="text-gray-500 text-center py-8">
          <p>System activity feed will appear here</p>
          <p className="text-sm mt-2">Recent user registrations, article submissions, etc.</p>
        </div>
      </div>
    </div>
  );
}