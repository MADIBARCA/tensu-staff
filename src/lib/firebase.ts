import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, signInAnonymously, type User } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Anonymous auth promise cache
let anonAuthPromise: Promise<User> | null = null;

export async function ensureAnonAuth(): Promise<User> {
  if (anonAuthPromise) {
    return anonAuthPromise;
  }

  // Check if already signed in
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  // Sign in anonymously
  anonAuthPromise = signInAnonymously(auth).then((userCredential) => {
    return userCredential.user;
  });

  return anonAuthPromise;
}
