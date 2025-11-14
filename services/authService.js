import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// Debug: Check if auth is defined
console.log('🔍 AuthService - auth object:', auth);
console.log('🔍 AuthService - db object:', db);

// Register new user
export const registerUser = async (email, password, name, role = 'citizen') => {
  try {
    if (!auth) {
      throw new Error('Auth is not initialized');
    }
    
    // Create user in Firebase Auth (auto-logs them in)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Save additional user info in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      userId: user.uid,
      name: name,
      email: email,
      role: role, // 'citizen' or 'admin'
      createdAt: Timestamp.now()
    });

    // IMPORTANT: Logout immediately after registration
    // This prevents auto-login and the auth state conflict
    await signOut(auth);

    return { success: true, user };
  } catch (error) {
    console.log('Registration error:', error);
    return { success: false, error: error.message };
  }
};

// Login existing user
export const loginUser = async (email, password) => {
  try {
    if (!auth) {
      throw new Error('Auth is not initialized');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    if (!auth) {
      throw new Error('Auth is not initialized');
    }
    
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get user data from Firestore
export const getUserData = async (userId) => {
  try {
    if (!db) {
      throw new Error('Database is not initialized');
    }
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Listen to auth state changes
export const onAuthChange = (callback) => {
  if (!auth) {
    console.error('❌ Auth is undefined in onAuthChange!');
    return () => {}; // Return empty unsubscribe function
  }
  
  console.log('✅ Setting up auth state listener');
  return onAuthStateChanged(auth, callback);
};