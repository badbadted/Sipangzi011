import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAQdE5o0BpHIx_-R42W4l0oWuf3DG1zHBQ",
  authDomain: "sipangzi000-d0239.firebaseapp.com",
  databaseURL: "https://sipangzi000-d0239-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sipangzi000-d0239",
  storageBucket: "sipangzi000-d0239.firebasestorage.app",
  messagingSenderId: "548367852884",
  appId: "1:548367852884:web:4a207d522f250d813ed4c1",
  measurementId: "G-L7MM6YQPFL"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
