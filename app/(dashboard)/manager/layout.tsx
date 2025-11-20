// app/manager/layout.tsx (Updated with responsive design and active nav)
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [debugInfo, setDebugInfo] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Navigation items with their paths
  const navItems = [
    { href: '/manager', label: '📊 Dashboard', icon: '📊' },
    { href: '/manager/create-employee', label: '👥 Create Employee', icon: '👥' },
    { href: '/manager/team', label: '📋 My Team', icon: '📋' },
    { href: '/manager/contributors', label: '📋 Contributors', icon: '📋' },
    { href: '/manager/articles', label: '📋 Articles', icon: '📋' },
    { href: '/manager/performance', label: '📈 Performance', icon: '📈' },
  ];

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/manager') {
      return pathname === '/manager';
    }
    return pathname.startsWith(href);
  };

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
                <p className="text-sm text-gray-600 hidden sm:block">Team Management</p>
              </div>
            </div>
            
            {/* Desktop Navigation and User Info */}
            <div className="hidden md:flex items-center space-x-4">
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

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(item.href)
                      ? 'bg-green-50 text-green-600 border-r-2 border-green-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="px-3 py-2 text-sm text-gray-700">
                  Welcome, {user.name}
                </div>
                <button
                  onClick={() => {
                    console.log('Logging out manager...');
                    router.push('/login');
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Manager Sidebar and Main Content */}
      <div className="flex flex-col md:flex-row">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block w-64 bg-white min-h-screen shadow-sm">
          <nav className="mt-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-6 py-3 text-gray-700 hover:bg-green-50 hover:text-green-600 border-r-2 transition-colors ${
                  isActive(item.href)
                    ? 'border-green-600 bg-green-50 text-green-600'
                    : 'border-transparent'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}