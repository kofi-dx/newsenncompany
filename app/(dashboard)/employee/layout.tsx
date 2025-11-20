// app/employee/layout.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'employee')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'employee') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Employee Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">Employee Dashboard</h1>
                <p className="text-sm text-gray-600">Content & Promotions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.name}</span>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Employee
              </span>
              <button
                onClick={() => router.push('/login')}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Employee Sidebar and Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white min-h-screen shadow-sm">
          <nav className="mt-8">
            <Link href="/employee" className="block px-6 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600 border-r-2 border-purple-600 bg-purple-50">
              📊 Dashboard
            </Link>
            <Link href="/employee/articles" className="block px-6 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600">
              📝 My Articles
            </Link>
            <Link href="/employee/promotions" className="block px-6 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600">
              🎯 Promotions
            </Link>
            <Link href="/employee/analytics" className="block px-6 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600">
              📈 Analytics
            </Link>
            <Link href="/employee/earnings" className="block px-6 py-3 text-gray-700 hover:bg-purple-50 hover:text-purple-600">
              💰 Earnings
            </Link>
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}