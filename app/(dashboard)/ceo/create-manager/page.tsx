/* eslint-disable @typescript-eslint/no-explicit-any */
// app/ceo/create-manager/page.tsx (FIXED VERSION)
'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore'; // CHANGED: Added setDoc and doc
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateManager() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const router = useRouter();

  const generateBusinessId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'MGR-';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
      if (i === 3) result += '-';
    }
    return result;
  };

  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // Check if user already exists
      const usersQuery = query(collection(db, 'users'), where('email', '==', formData.email.toLowerCase().trim()));
      const userSnapshot = await getDocs(usersQuery);
      
      if (!userSnapshot.empty) {
        setError('A manager with this email already exists.');
        setLoading(false);
        return;
      }

      // Create Firebase auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email.toLowerCase().trim(), 
        formData.password
      );

      const businessId = generateBusinessId();

      // FIX: Create user document with Firebase UID as document ID
      await setDoc(doc(db, 'users', userCredential.user.uid), { // CHANGED: Using setDoc with specific document ID
        id: userCredential.user.uid, // Keep this for reference
        email: formData.email.toLowerCase().trim(),
        name: formData.name,
        role: 'manager',
        status: 'active',
        businessId,
        permissions: [
          'view_articles',
          'manage_employees', 
          'view_team_data',
          'manage_contributors',
          'create_employees'
        ],
        emailVerified: true,
        createdBy: user?.id,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      setSuccess(`Manager created successfully! Business ID: ${businessId}`);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

    } catch (error: any) {
      console.error('Error creating manager:', error);
      setError(error.message || 'Failed to create manager account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create Manager</h1>
        <p className="text-gray-600 mt-2">Create a new manager account</p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleCreateManager} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter manager's full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter manager's email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Create a password"
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm password"
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating Manager...' : 'Create Manager'}
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/ceo/users')}
                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
              >
                Back to Users
              </button>
            </div>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Manager will receive their Business ID upon creation</li>
            <li>• Manager can then create employee accounts</li>
            <li>• All employee accounts created by managers require CEO approval</li>
            <li>• Share the email and password with the manager securely</li>
          </ul>
        </div>
      </div>
    </div>
  );
}