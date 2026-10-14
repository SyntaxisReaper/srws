/**
 * Firebase Configuration & Realtime Database Credentials
 * Loads from environment variables or local uncommitted configuration.
 */

let localConfig = {};
try {
  localConfig = require("./firebaseConfig.local").localFirebaseConfig || {};
} catch (e) {
  // Local config optional - fallback to env vars or placeholders
}

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || localConfig.apiKey || "YOUR_FIREBASE_API_KEY",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || localConfig.authDomain || "your-project-id.firebaseapp.com",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || localConfig.databaseURL || "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || localConfig.projectId || "your-project-id",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket || "your-project-id.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId || "000000000000",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || localConfig.appId || "1:000000000000:android:0000000000000000000000",
};

// Target device identifier as defined in software-plan.md
export const DEFAULT_DEVICE_ID = "device_001";

// Checks if valid project keys are present
export const isFirebaseConfigured = () => {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.includes("YOUR_FIREBASE_API_KEY") &&
    firebaseConfig.databaseURL &&
    !firebaseConfig.databaseURL.includes("your-project-id")
  );
};
