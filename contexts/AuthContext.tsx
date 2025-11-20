// contexts/AuthContext.tsx (ENHANCED VERSION)
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/user';
import { auth, db } from '@/lib/firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 Auth state changed:', firebaseUser ? firebaseUser.uid : 'No user');
      
      if (firebaseUser) {
        console.log('🔍 Firebase user detected:', firebaseUser.uid);
        
        try {
          // Method 1: Try direct document access first
          console.log('📋 Checking Firestore document at /users/' + firebaseUser.uid);
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('✅ User document found by UID:', userData);
            
            if (userData.role && userData.status === 'active') {
              const userWithId = { 
                ...userData, 
                id: firebaseUser.uid 
              } as User;
              console.log('✅ Setting user (from UID lookup):', userWithId);
              setUser(userWithId);
            } else {
              console.log('❌ User missing required fields or not active');
              setUser(null);
            }
          } else {
            // Method 2: Try querying by email as fallback
            console.log('❌ No user document found by UID, trying email query...');
            const usersQuery = query(
              collection(db, 'users'), 
              where('email', '==', firebaseUser.email?.toLowerCase().trim())
            );
            const userSnapshot = await getDocs(usersQuery);
            
            if (!userSnapshot.empty) {
              console.log('✅ Found user by email query:', userSnapshot.docs[0].data());
              const userData = userSnapshot.docs[0].data();
              
              if (userData.role && userData.status === 'active') {
                const userWithId = { 
                  ...userData, 
                  id: userSnapshot.docs[0].id // Use the document ID from the query
                } as User;
                console.log('✅ Setting user (from email lookup):', userWithId);
                setUser(userWithId);
              } else {
                console.log('❌ User from email query missing required fields');
                setUser(null);
              }
            } else {
              console.log('❌ No user found with email:', firebaseUser.email);
              setUser(null);
            }
          }
        } catch (error) {
          console.error('💥 Error fetching user data:', error);
          setUser(null);
        }
      } else {
        console.log('👋 No Firebase user - signed out');
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = async () => {
    console.log('🚪 Logging out...');
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}