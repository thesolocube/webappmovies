import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBiLx11fF4zGrhDdakGqCs1-tv70ZeUYfk',
  authDomain: 'movieee12-8049c.firebaseapp.com',
  projectId: 'movieee12-8049c',
  storageBucket: 'movieee12-8049c.firebasestorage.app',
  messagingSenderId: '44360336230',
  appId: '1:44360336230:web:0000000000000000'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
