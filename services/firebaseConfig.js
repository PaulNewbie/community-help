import * as firebase from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBFte_VfLzXYhnxTk4r5Eg93fRKDO8dMuE",
  authDomain: "community-help-app-3ebb1.firebaseapp.com",
  projectId: "community-help-app-3ebb1",
  storageBucket: "community-help-app-3ebb1.firebasestorage.app",
  messagingSenderId: "830956976181",
  appId: "1:830956976181:web:7cc07e8c87913a7906d97c"
};

// Initialize Firebase only once
let app;
if (!firebase.getApps || firebase.getApps().length === 0) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.getApp();
}

// Get auth and db instances
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };