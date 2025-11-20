/* eslint-disable @typescript-eslint/no-explicit-any */
// app/ceo/users/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ceo' | 'manager' | 'employee';
  status: 'active' | 'pending' | 'suspended';
  businessId?: string;
  createdAt: Date;
  lastLogin?: Date;
  department?: string;
}

export default function CEOUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'ceo' | 'manager' | 'employee'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: 'active' | 'suspended') => {
    setProcessing(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    } finally {
      setProcessing(null);
    }
  };

  const filteredUsers = users.filter(user => {
    // Status filter
    if (filter !== 'all' && user.status !== filter) return false;
    
    // Role filter
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.businessId?.toLowerCase().includes(term) ||
        user.department?.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ceo': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'manager': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ceo': return '👑';
      case 'manager': return '👔';
      case 'employee': return '👤';
      default: return '❓';
    }
  };

  const formatLastLogin = (lastLogin?: Date) => {
    if (!lastLogin) return 'Never';
    
    const now = new Date();
    const lastLoginDate = new Date(lastLogin);
    const diffMs = now.getTime() - lastLoginDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    
    return lastLoginDate.toLocaleDateString();
  };

const getUserInitials = (name?: string) => {
  if (!name || typeof name !== 'string') return 'NA';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
          <p className="text-sm text-gray-500 mt-1">Fetching user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Manage all users across the platform
          </p>
        </div>
        <div className="mt-4 lg:mt-0">
          <div className="flex flex-wrap gap-2">
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              {users.length} Total Users
            </span>
            <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
              {users.filter(u => u.status === 'active').length} Active
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-sm text-blue-800 font-medium">Total Users</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'active').length}
          </div>
          <div className="text-sm text-green-800 font-medium">Active</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === 'manager').length}
          </div>
          <div className="text-sm text-purple-800 font-medium">Managers</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
          <div className="text-2xl font-bold text-orange-600">
            {users.filter(u => u.role === 'employee').length}
          </div>
          <div className="text-sm text-orange-800 font-medium">Employees</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="ceo">CEO</option>
              <option value="manager">Managers</option>
              <option value="employee">Employees</option>
            </select>

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg font-semibold text-gray-900">No users found</p>
            <p className="text-gray-600 mt-2">
              {searchTerm ? 'Try adjusting your search terms' : 'No users match the current filters'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {getUserInitials(user.name)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`capitalize px-2 py-1 rounded-full text-xs border ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        {getRoleIcon(user.role)} {user.role}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Business ID</p>
                      <p className="font-mono text-xs">{user.businessId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Last Login</p>
                      <p className="font-medium">{formatLastLogin(user.lastLogin)}</p>
                    </div>
                  </div>

                  {user.role !== 'ceo' && (
                    <div className="flex space-x-2 pt-2">
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(user.id, 'suspended')}
                          disabled={processing === user.id}
                          className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {processing === user.id ? '...' : 'Suspend'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(user.id, 'active')}
                          disabled={processing === user.id}
                          className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          {processing === user.id ? '...' : 'Activate'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-4 font-semibold text-gray-700">User</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Role</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Business ID</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Last Login</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Joined</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {getUserInitials(user.name)}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            {user.department && (
                              <div className="text-xs text-gray-400">{user.department}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getRoleIcon(user.role)}</span>
                          <span className={`capitalize px-3 py-1 rounded-full text-sm border ${getRoleColor(user.role)}`}>
                            {user.role}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`capitalize px-3 py-1 rounded-full text-sm border ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <code className="text-gray-600 text-sm bg-gray-100 px-2 py-1 rounded">
                          {user.businessId || 'N/A'}
                        </code>
                      </td>
                      <td className="p-4 text-gray-600">
                        {formatLastLogin(user.lastLogin)}
                      </td>
                      <td className="p-4 text-gray-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {user.role !== 'ceo' && (
                          <div className="flex space-x-2">
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleStatusChange(user.id, 'suspended')}
                                disabled={processing === user.id}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
                              >
                                {processing === user.id ? '...' : 'Suspend'}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(user.id, 'active')}
                                disabled={processing === user.id}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
                              >
                                {processing === user.id ? '...' : 'Activate'}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">User Management Summary</h3>
            <p className="text-blue-700 text-sm mt-1">
              {filteredUsers.length} users found • {users.filter(u => u.status === 'active').length} active users
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex flex-wrap gap-2">
              <span className="bg-white text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200">
                👑 {users.filter(u => u.role === 'ceo').length} CEO
              </span>
              <span className="bg-white text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200">
                👔 {users.filter(u => u.role === 'manager').length} Managers
              </span>
              <span className="bg-white text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200">
                👤 {users.filter(u => u.role === 'employee').length} Employees
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}