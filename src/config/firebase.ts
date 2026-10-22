import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Support optional untracked local config file if present
let localConfig: Record<string, string> = {};
try {
  // @ts-ignore
  localConfig = require('./firebaseConfig.local.json');
} catch (e) {
  // local untracked file is optional
}

const firebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY ||
    localConfig.apiKey ||
    'AIzaSyMockKeyForDevelopmentOnly1234567890',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    localConfig.authDomain ||
    'bookshelf-app-mock.firebaseapp.com',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    localConfig.projectId ||
    'bookshelf-app-mock',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    localConfig.storageBucket ||
    'bookshelf-app-mock.appspot.com',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    localConfig.messagingSenderId ||
    '123456789012',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID ||
    localConfig.appId ||
    '1:123456789012:web:abcdef1234567890',
};

export const isFirebaseConfigured = Boolean(
  (process.env.EXPO_PUBLIC_FIREBASE_API_KEY &&
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY !== 'your_api_key_here') ||
    localConfig.apiKey
);

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
