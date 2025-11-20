/* eslint-disable @typescript-eslint/no-explicit-any */
// scripts/setup-ceo.ts
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// 🔥 REPLACE THESE VALUES WITH YOUR ACTUAL FIREBASE CONFIG
// Get them from: Firebase Console → Project Settings → Your apps → Web app config
const firebaseConfig = {
  apiKey: "AIzaSyBJ_dQ0NsKG_ltZ9LuP349KIQcgMWEGwZw",
  authDomain: "newsenn-78129.firebaseapp.com",
  projectId: "newsenn-78129",
  storageBucket: "newsenn-78129.firebasestorage.app",
  messagingSenderId: "1056765483729",
  appId: "1:1056765483729:web:ccfa938ee82e1efb4903f0",
  measurementId: "G-2V6L0TJQ5K"
};

console.log('🔧 Using Firebase Project:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function setupCEOAccount() {
  const ceoEmail = 'ceo@newsenn.com';
  const ceoPassword = '862@A&Wens40Man!$987GoD';
  const ceoName = 'Newsenn CEO';

  try {
    console.log('🚀 Starting CEO account creation...');
    
    // Create Firebase auth user
    const userCredential = await createUserWithEmailAndPassword(auth, ceoEmail, ceoPassword);
    const userId = userCredential.user.uid;

    console.log('✅ Firebase auth user created:', userId);

    // Create user document with CEO privileges
    await setDoc(doc(db, 'users', userId), {
      id: userId,
      email: ceoEmail,
      name: ceoName,
      role: 'ceo',
      status: 'active',
      businessId: 'CEO-ADMIN-001',
      permissions: [
        'view_all_data',
        'manage_system',
        'approve_managers',
        'approve_deletions',
        'manage_earnings',
        'override_system',
        'approve_business_ids'
      ],
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isSuperAdmin: true,
      securityLevel: 'maximum'
    });

    console.log('🎉 CEO account created successfully!');
    console.log('====================================');
    console.log('📧 Email:', ceoEmail);
    console.log('🔑 Password:', ceoPassword);
    console.log('🆔 User ID:', userId);
    console.log('💼 Business ID: CEO-ADMIN-001');
    console.log('====================================');
    console.log('✅ You can now login at: http://localhost:3000/login');
    
  } catch (error: any) {
    console.error('❌ Error creating CEO account:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('💡 CEO account already exists. You can login directly.');
    } else if (error.code === 'auth/operation-not-allowed') {
      console.log('💡 Enable Email/Password in Firebase Console:');
      console.log('   Authentication → Sign-in method → Email/Password → Enable');
    }
  }
}

setupCEOAccount();