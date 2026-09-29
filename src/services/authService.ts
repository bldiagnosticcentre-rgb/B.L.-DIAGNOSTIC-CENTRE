import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  getIdTokenResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types/auth';
import { syncUserToSheetsBackend } from './sheetsService';

const USERS_COLLECTION = 'users';

// Admin bootstrap email from metadata
const ADMIN_EMAILS = ['bldiagnosticcentre@gmail.com'];

/**
 * Maps Firebase user + Firestore document to verified UserProfile
 */
export async function fetchUserProfile(uid: string, email?: string | null): Promise<UserProfile | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as UserProfile;
    }

    // Auto-bootstrap profile if missing (e.g. initial login)
    const isAdmin = email && ADMIN_EMAILS.includes(email.toLowerCase());
    const newProfile: UserProfile = {
      uid,
      email: email || '',
      displayName: email ? email.split('@')[0] : 'Patient User',
      phone: '',
      role: isAdmin ? 'ADMIN' : 'USER',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(docRef, newProfile);
    return newProfile;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Register with email, password, full name, and phone.
 * Passwords are automatically hashed and salted by the authentication engine using bcrypt/scrypt.
 */
export async function registerUser(params: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}): Promise<UserProfile> {
  const { email, password, fullName, phone } = params;

  // Input validation
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }
  if (!fullName.trim()) {
    throw new Error('Full name is required.');
  }

  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = credential.user.uid;

  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase().trim());
  const profile: UserProfile = {
    uid,
    email: email.trim().toLowerCase(),
    displayName: fullName.trim(),
    phone: phone.trim(),
    role: isAdmin ? 'ADMIN' : 'USER',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(doc(db, USERS_COLLECTION, uid), profile);

  // Synchronize approved user profile to Google Sheets Users tab via server-side proxy
  // Primary database is source of truth; Sheets failure will NOT fail registration.
  syncUserToSheetsBackend({
    userId: profile.uid,
    customerName: profile.displayName,
    mobileNumber: profile.phone,
    email: profile.email,
    accountStatus: 'ACTIVE',
    registrationDate: profile.createdAt.slice(0, 10),
    lastLogin: new Date().toISOString(),
    totalBookings: 0,
    createdAt: profile.createdAt
  }).catch(err => {
    console.warn('[AuthService] Non-critical sheets sync delay:', err);
  });

  return profile;
}

/**
 * Login with email and password
 */
export async function loginUser(email: string, password: string): Promise<UserProfile> {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  try {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const profile = await fetchUserProfile(credential.user.uid, credential.user.email);
    if (!profile) {
      throw new Error('User profile record could not be loaded.');
    }
    if (!profile.isActive) {
      await fbSignOut(auth);
      throw new Error('Account has been deactivated. Please contact B.L. Diagnostic Center.');
    }

    // Update lastLogin operational sync asynchronously
    syncUserToSheetsBackend({
      userId: profile.uid,
      customerName: profile.displayName,
      mobileNumber: profile.phone,
      email: profile.email,
      accountStatus: profile.isActive ? 'ACTIVE' : 'INACTIVE',
      lastLogin: new Date().toISOString(),
      createdAt: profile.createdAt
    }).catch(console.warn);

    return profile;
  } catch (err: any) {
    // Return safe, sanitized error messages
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
      throw new Error('Invalid email or password combination.');
    }
    if (err.code === 'auth/too-many-requests') {
      throw new Error('Access temporarily blocked due to repeated attempts. Please try again later.');
    }
    throw new Error(err.message || 'Authentication failed.');
  }
}

/**
 * Sign out session
 */
export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Update user profile details (Name, Phone)
 */
export async function updateUserProfile(uid: string, updates: Partial<Pick<UserProfile, 'displayName' | 'phone'>>): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });

  // Sync updated allowed fields to Google Sheets Users tab
  getDoc(docRef).then(snap => {
    if (snap.exists()) {
      const u = snap.data() as UserProfile;
      syncUserToSheetsBackend({
        userId: uid,
        customerName: u.displayName,
        mobileNumber: u.phone,
        email: u.email,
        accountStatus: u.isActive ? 'ACTIVE' : 'INACTIVE',
        createdAt: u.createdAt
      }).catch(console.warn);
    }
  }).catch(console.warn);
}
