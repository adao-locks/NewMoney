import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: 'AIzaSyCqLzBnkLGitp1JfxKvTVnf178TJuOXuW0',
    authDomain: 'newmoney-cd735.firebaseapp.com',
    projectId: 'newmoney-cd735',
    storageBucket: 'newmoney-cd735.firebasestorage.app',
    messagingSenderId: '521348968955',
    appId: '1:521348968955:web:b80b1c182e7594da569b5e',
    measurementId: 'G-7168Y75PYM',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);

export const analyticsPromise =
    typeof window === 'undefined' ? Promise.resolve(null) : isSupported().then((supported) => supported ? getAnalytics(firebaseApp) : null);
