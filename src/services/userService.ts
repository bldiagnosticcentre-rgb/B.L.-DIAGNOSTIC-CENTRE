import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FamilyPatient, UserNotification } from '../types/auth';

const PATIENTS_COLLECTION = 'patients';
const NOTIFICATIONS_COLLECTION = 'notifications';

// --- PATIENT MANAGEMENT ---
export async function getPatientsForUser(userId: string): Promise<FamilyPatient[]> {
  try {
    const q = query(collection(db, PATIENTS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: FamilyPatient[] = [];
    snap.forEach(d => list.push(d.data() as FamilyPatient));
    return list;
  } catch (err) {
    console.error('Error fetching patients for user:', err);
    return [];
  }
}

export async function addPatientForUser(patient: Omit<FamilyPatient, 'id' | 'createdAt'>): Promise<FamilyPatient> {
  const id = `PAT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const fullPatient: FamilyPatient = {
    ...patient,
    id,
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, PATIENTS_COLLECTION, id), fullPatient);
  return fullPatient;
}

export async function deletePatientForUser(patientId: string): Promise<void> {
  await deleteDoc(doc(db, PATIENTS_COLLECTION, patientId));
}

// --- NOTIFICATIONS ---
export async function getNotificationsForUser(userId: string): Promise<UserNotification[]> {
  try {
    const q = query(collection(db, NOTIFICATIONS_COLLECTION), where('userId', '==', userId));
    const snap = await getDocs(q);
    const list: UserNotification[] = [];
    snap.forEach(d => list.push(d.data() as UserNotification));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), { isRead: true });
}

export async function createUserNotification(notification: Omit<UserNotification, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
  const id = `NOTIF-${Date.now()}`;
  await setDoc(doc(db, NOTIFICATIONS_COLLECTION, id), {
    ...notification,
    id,
    isRead: false,
    createdAt: new Date().toISOString()
  });
}
