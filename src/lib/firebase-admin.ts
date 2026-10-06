import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;

try {
  if (!getApps().length) {
    adminApp = initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } else {
    adminApp = getApps()[0];
  }
  adminAuthInstance = getAuth(adminApp);
  adminDbInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(adminApp, firebaseConfig.firestoreDatabaseId)
    : getFirestore(adminApp);
} catch (err: any) {
  console.warn('[FirebaseAdmin] Admin SDK initialized in fallback mode:', err.message);
}

export const adminAuth = adminAuthInstance;
export const adminDb = adminDbInstance;
export default adminApp;
