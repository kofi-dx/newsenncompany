// app/ceo/layout.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CEOLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ceo')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Navigation items with their paths
  const navItems = [
    { href: '/ceo', label: '📊 Dashboard', icon: '📊' },
    { href: '/ceo/approvals', label: '✅ Approvals', icon: '✅' },
    { href: '/ceo/users', label: '👥 User Management', icon: '👥' },
    { href: '/ceo/create-manager', label: '👔 Create Manager', icon: '👔' },
    { href: '/ceo/articles', label: '📝 Articles & Contributors', icon: '📝' },
    { href: '/ceo/earnings', label: '💰 Earnings', icon: '💰' },
    { href: '/ceo/reports', label: '📈 Reports', icon: '📈' },
  ];

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/ceo') {
      return pathname === '/ceo';
    }
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading CEO dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ceo') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don&apos;t have permission to access the CEO dashboard.</p>
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
      {/* CEO Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold text-gray-900">CEO Dashboard</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Newsenn Administration</p>
              </div>
            </div>
            
            {/* Desktop Navigation and User Info */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">Welcome, {user.name}</p>
                <p className="text-xs text-blue-600 font-semibold">CEO</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">
                  {user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
              <button
                onClick={() => {
                  console.log('Logging out CEO...');
                  router.push('/login');
                }}
                className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 text-sm font-medium shadow-sm transition-all duration-200"
              >
                Logout
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
                  className={`block px-3 py-3 rounded-md text-base font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t pt-3 mt-3">
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-gray-700">Welcome, {user.name}</div>
                  <div className="text-xs text-blue-600 font-semibold">CEO</div>
                </div>
                <button
                  onClick={() => {
                    console.log('Logging out CEO...');
                    router.push('/login');
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* CEO Sidebar and Main Content */}
      <div className="flex flex-col md:flex-row">
        {/* Sidebar - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block w-64 bg-white min-h-[calc(100vh-4rem)] shadow-sm">
          <nav className="mt-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-6 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-r-2 transition-all duration-200 group ${
                  isActive(item.href)
                    ? 'border-blue-600 bg-blue-50 text-blue-600 font-semibold'
                    : 'border-transparent'
                }`}
              >
                <span className="text-lg mr-3 group-hover:scale-110 transition-transform">{item.icon}</span>
                <span>{item.label.replace(/^[^\s]+\s/, '')}</span>
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 w-64 p-6 border-t bg-white">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                <span className="text-white font-bold">N</span>
              </div>
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-blue-600 font-semibold">CEO</p>
              <p className="text-xs text-gray-500 mt-1">Newsenn Administration</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}