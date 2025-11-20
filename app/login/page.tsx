/* eslint-disable @typescript-eslint/no-explicit-any */
// app/login/page.tsx (Add debug logging)
'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Attempting login for:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUserId = userCredential.user.uid;
      console.log('✅ Firebase auth successful. User ID:', firebaseUserId);

      // Method 1: Try direct document access
      console.log('📋 Checking Firestore document at /users/' + firebaseUserId);
      const userDoc = await getDoc(doc(db, 'users', firebaseUserId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ User document found:', userData);

        // Check if account is active
        if (userData.status !== 'active') {
          setError('Your account is not active. Please contact administrator.');
          await auth.signOut();
          return;
        }

        console.log('🎯 Login successful, redirecting based on role:', userData.role);
        
        // Redirect based on role
        switch (userData.role) {
          case 'ceo':
            router.push('/ceo');
            break;
          case 'manager':
            router.push('/manager');
            break;
          case 'employee':
            router.push('/employee');
            break;
          default:
            router.push('/admin');
        }
        
      } else {
        console.log('❌ User document not found in Firestore at /users/' + firebaseUserId);
        
        // Method 2: Try querying by email
        console.log('🔍 Searching for user by email:', email);
        const usersQuery = query(
          collection(db, 'users'), 
          where('email', '==', email.toLowerCase().trim())
        );
        const userSnapshot = await getDocs(usersQuery);
        
        if (!userSnapshot.empty) {
          console.log('✅ Found user by email query:', userSnapshot.docs[0].data());
          const userData = userSnapshot.docs[0].data();
          
          // Check if account is active
          if (userData.status !== 'active') {
            setError('Your account is not active. Please contact administrator.');
            await auth.signOut();
            return;
          }

          console.log('🎯 Login successful (via email query), redirecting based on role:', userData.role);
          
          // Redirect based on role
          switch (userData.role) {
            case 'ceo':
              router.push('/ceo');
              break;
            case 'manager':
              router.push('/manager');
              break;
            case 'employee':
              router.push('/employee');
              break;
            default:
              router.push('/admin');
          }
        } else {
          console.log('❌ No user found with email:', email);
          setError('User account not found in system. Please contact administrator.');
        }
      }
    } catch (error: any) {
      console.error('💥 Login error:', error);
      
      if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Newsenn Admin Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Secure Login - Invitation Only
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter your email"
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              🔒 Access by invitation only. Contact administrator for credentials.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}