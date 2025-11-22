import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  initializeAuth, 
  getReactNativePersistence,
  getAuth // Add getAuth for Web support
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native'; // Import Platform to detect Web vs Mobile

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

// Initialize Auth based on Platform
let auth;

if (Platform.OS === 'web') {
  // On Web, use the default browser persistence (cookies/localStorage)
  auth = getAuth(app);
} else {
  // On Mobile (iOS/Android), use AsyncStorage persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

const db = getFirestore(app);

export { auth, db };