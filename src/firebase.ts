import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Initialize Firestore with the named database if it's provided
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Functions
// Lazy initialize Functions via a getter to prevent crashes during module load
let functionsInstance: any = null;
let functionsInitialized = false;

export const cloudFunctions = {
  get instance() {
    if (!functionsInitialized) {
      try {
        functionsInstance = getFunctions(app, 'us-central1');
        functionsInitialized = true;
      } catch (error) {
        console.error("Error initializing Firebase Functions:", error);
      }
    }
    return functionsInstance;
  }
};

// Lazy initialize Storage via a getter to prevent crashes during module load
let storageInstance: any = null;
let storageInitialized = false;

export const storage = {
  get current() {
    if (!storageInitialized) {
      storageInitialized = true;
      try {
        if (firebaseConfig.storageBucket) {
          storageInstance = getStorage(app);
        }
      } catch (error) {
        console.warn("Firebase Storage service is not available. Please ensure it's enabled in the Firebase Console.", error);
        storageInstance = null;
      }
    }
    return storageInstance;
  }
};

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

export { firebaseConfig };
