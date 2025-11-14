import { initializeApp, getApps, getApp } from 'firebase/app';
// UPDATED: Import the functions we need for persistence
import { 
  initializeAuth, 
  getReactNativePersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// ADDED: Import AsyncStorage
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBFte_VfLzXYhnxTk4r5Eg93fRKDO8dMuE",
  authDomain: "community-help-app-3ebb1.firebaseapp.com",
  projectId: "community-help-app-3ebb1",
  storageBucket: "community-help-app-3ebb1.firebasestorage.app",
  messagingSenderId: "830956976181",
  appId: "1:830956976181:web:7cc07e8c87913a7906d97c"
};

// Initialize Firebase App
let app;
if (getApps().length === 0) { 
  app = initializeApp(firebaseConfig); 
} else {
  app = getApp();
}

// CHANGED: Initialize Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// This stays the same
const db = getFirestore(app);

export { auth, db };