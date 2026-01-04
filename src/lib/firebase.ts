import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  type Auth,
  signInAnonymously,
  type User,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
} from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Validate environment variables at build time
const requiredEnvVars = {
  VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check for missing env vars
const missingVars = Object.entries(requiredEnvVars)
  .filter(([, value]) => !value || value === 'undefined')
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Missing Firebase environment variables: ${missingVars.join(', ')}. ` +
    `Please set them in Vercel environment variables.`
  );
}

const firebaseConfig = {
  apiKey: requiredEnvVars.VITE_FIREBASE_API_KEY,
  authDomain: requiredEnvVars.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: requiredEnvVars.VITE_FIREBASE_PROJECT_ID,
  storageBucket: requiredEnvVars.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: requiredEnvVars.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: requiredEnvVars.VITE_FIREBASE_APP_ID,
};

// Log Firebase config in development (without sensitive data)
if (import.meta.env.DEV) {
  console.log('[Firebase] Config loaded:', {
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: !!firebaseConfig.apiKey,
    hasAppId: !!firebaseConfig.appId,
  });
}

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

export const auth: Auth = getAuth(app);

// Explicitly bind storage bucket with gs:// prefix
const storageBucket = firebaseConfig.storageBucket.startsWith('gs://')
  ? firebaseConfig.storageBucket
  : `gs://${firebaseConfig.storageBucket}`;

export const storage: FirebaseStorage = getStorage(app, storageBucket);

// Anonymous auth promise cache
let anonAuthPromise: Promise<User> | null = null;

/**
 * Set auth persistence with fallback for Telegram Mini App iframe context
 */
async function setupAuthPersistence(): Promise<void> {
  const persistenceOptions = [
    browserLocalPersistence,
    browserSessionPersistence,
    inMemoryPersistence,
  ];

  for (const persistence of persistenceOptions) {
    try {
      await setPersistence(auth, persistence);
      if (import.meta.env.DEV) {
        console.log('[Firebase Auth] Persistence set:', persistence.type);
      }
      return;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[Firebase Auth] Failed to set persistence:', persistence.type, error);
      }
      // Continue to next option
    }
  }
}

export async function ensureAnonAuth(): Promise<User> {
  // Log auth state before
  if (import.meta.env.DEV) {
    console.log('[Firebase Auth] Before ensureAnonAuth:', {
      currentUser: auth.currentUser?.uid || 'null',
    });
  }

  if (anonAuthPromise) {
    const user = await anonAuthPromise;
    if (import.meta.env.DEV) {
      console.log('[Firebase Auth] Using cached auth promise:', user.uid);
    }
    return user;
  }

  // Check if already signed in
  if (auth.currentUser) {
    if (import.meta.env.DEV) {
      console.log('[Firebase Auth] Already signed in:', auth.currentUser.uid);
    }
    return Promise.resolve(auth.currentUser);
  }

  // Setup persistence first
  await setupAuthPersistence();

  // Sign in anonymously
  anonAuthPromise = signInAnonymously(auth)
    .then((userCredential) => {
      const user = userCredential.user;
      if (import.meta.env.DEV) {
        console.log('[Firebase Auth] Signed in anonymously:', user.uid);
      }
      return user;
    })
    .catch((error) => {
      anonAuthPromise = null; // Reset on error
      console.error('[Firebase Auth] Failed to sign in anonymously:', error);
      throw error;
    });

  const user = await anonAuthPromise;

  // Verify token can be retrieved
  try {
    const token = await user.getIdToken(true);
    if (import.meta.env.DEV) {
      console.log('[Firebase Auth] Token retrieved, length:', token.length);
      console.log('[Firebase Auth] User UID:', user.uid);
    }
  } catch (error) {
    console.error('[Firebase Auth] Failed to get ID token:', error);
    throw error;
  }

  if (import.meta.env.DEV) {
    const uid = user.uid;
    console.log('[Firebase Auth] After ensureAnonAuth:', {
      currentUser: uid,
    });
  }

  return user;
}
