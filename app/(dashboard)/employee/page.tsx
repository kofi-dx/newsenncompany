// app/employee/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

interface EmployeeStats {
  myArticles: number;
  activePromotions: number;
  totalEarnings: number;
  totalViews: number;
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EmployeeStats>({
    myArticles: 0,
    activePromotions: 0,
    totalEarnings: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch employee-specific data
        const articlesQuery = query(
          collection(db, 'articles'), 
          where('authorId', '==', user.id)
        );
        
        const articlesSnapshot = await getDocs(articlesQuery);
        
        setStats({
          myArticles: articlesSnapshot.size,
          activePromotions: 0, // Implement based on your data structure
          totalEarnings: 0, // Implement based on your data structure
          totalViews: 0 // Implement based on your data structure
        });
      } catch (error) {
        console.error('Error fetching employee stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Employee Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your content and track performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100">
              <span className="text-2xl">📝</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">My Articles</h3>
              <p className="text-3xl font-bold text-purple-600">{stats.myArticles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Active Promotions</h3>
              <p className="text-3xl font-bold text-green-600">{stats.activePromotions}</p>
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
              <p className="text-3xl font-bold text-yellow-600">${stats.totalEarnings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <span className="text-2xl">👀</span>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Total Views</h3>
              <p className="text-3xl font-bold text-blue-600">{stats.totalViews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
            <div className="text-lg font-semibold text-purple-700">Write New Article</div>
            <div className="text-sm text-purple-600 mt-1">Create and publish content</div>
          </button>

          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
            <div className="text-lg font-semibold text-green-700">Manage Promotions</div>
            <div className="text-sm text-green-600 mt-1">Run promotional campaigns</div>
          </button>

          <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
            <div className="text-lg font-semibold text-blue-700">View Analytics</div>
            <div className="text-sm text-blue-600 mt-1">Performance insights</div>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">My Recent Activity</h2>
        <div className="text-gray-500 text-center py-8">
          <p>Your recent articles and promotions will appear here</p>
          <p className="text-sm mt-2">Start creating content to see your activity</p>
        </div>
      </div>
    </div>
  );
}