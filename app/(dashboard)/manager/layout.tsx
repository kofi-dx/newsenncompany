// app/manager/layout.tsx (Updated with better debugging)
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    console.log('🔄 ManagerLayout - Auth state:', { 
      loading, 
      user: user ? { id: user.id, role: user.role, status: user.status } : 'null' 
    });

    if (!loading) {
      if (!user) {
        console.log('❌ No user - redirecting to login');
        setDebugInfo('No user found');
        router.push('/login');
      } else if (user.role !== 'manager') {
        console.log(`❌ Wrong role: ${user.role} - redirecting to login`);
        setDebugInfo(`Wrong role: ${user.role}`);
        router.push('/login');
      } else if (user.status !== 'active') {
        console.log(`❌ User not active: ${user.status} - redirecting to login`);
        setDebugInfo(`User not active: ${user.status}`);
        router.push('/login');
      } else {
        console.log('✅ Manager access granted');
        setDebugInfo('Access granted');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading manager dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'manager' || user.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to access the manager dashboard.</p>
          <p className="text-sm text-gray-500">Debug: {debugInfo}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Manager Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">Manager Dashboard</h1>
                <p className="text-sm text-gray-600">Team Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.name}</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Manager
              </span>
              <button
                onClick={() => {
                  console.log('Logging out manager...');
                  router.push('/login');
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Manager Sidebar and Main Content */}
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white min-h-screen shadow-sm">
          <nav className="mt-8">
            <Link 
              href="/manager" 
              className="block px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 border-r-2 border-green-600 bg-green-50"
            >
              📊 Dashboard
            </Link>
            <Link 
              href="/manager/create-employee" 
              className="block px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600"
            >
              👥 Create Employee
            </Link>
            <Link 
              href="/manager/team" 
              className="block px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600"
            >
              📋  My Team
            </Link>
            <Link 
              href="/manager/contributors" 
              className="block px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600"
            >
              📋 Contributors
            </Link>
            <Link 
              href="/manager/articles" 
              className="block px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600"
            >
              📋 Articles
            </Link>
            <Link 
              href="/manager/performance" 
              className="block px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600"
            >
              📈 Performance
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