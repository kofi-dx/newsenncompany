// app/ceo/layout.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function CEOLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ceo')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ceo') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* CEO Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">CEO Dashboard</h1>
                <p className="text-sm text-gray-600">Newsenn Administration</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.name}</span>
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

      {/* CEO Sidebar and Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white min-h-screen shadow-sm">
<nav className="mt-8">
  <Link href="/ceo" className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-r-2 border-blue-600 bg-blue-50">
    📊 Dashboard
  </Link>
  <Link href="/ceo/approvals" className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
    ✅ Approvals
  </Link>
  <Link href="/ceo/users" className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
    👥 User Management
  </Link>
  <Link href="/ceo/create-manager" className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
  👔 Create Manager
</Link>
  <Link href="/ceo/articles" className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
    📝 Articles & Contributors
  </Link>
  <Link href="/ceo/earnings" className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
    💰 Earnings
  </Link>
  <Link href="/ceo/reports" className="block px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600">
    📈 Reports
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