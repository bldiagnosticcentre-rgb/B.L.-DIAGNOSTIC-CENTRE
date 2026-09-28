import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Booking, BookingStatus, DiagnosticTest } from '../types';
import { OFFICIAL_RATE_LIST } from '../data/rateList';

const BOOKINGS_COLLECTION = 'bookings';
const TESTS_COLLECTION = 'tests';

// Seed default rate list into Firestore if not present
export async function initializeDatabaseSeed() {
  try {
    const testSnap = await getDocs(collection(db, TESTS_COLLECTION));
    if (testSnap.empty) {
      console.log('Seeding official B.L. Diagnostic Center rate list into database...');
      for (const test of OFFICIAL_RATE_LIST) {
        await setDoc(doc(db, TESTS_COLLECTION, test.id), test);
      }
    }
  } catch (error) {
    console.warn('Database seed notice:', error);
  }
}

// Generate human-readable booking ID: BLD-YYYY-XXXX
export function generateBookingId(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BLD-${year}-${randomNum}`;
}

// Save a new booking (NO online payment, Pay at collection/visit)
export async function createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'status' | 'statusHistory' | 'paymentStatus' | 'paymentMode'>): Promise<Booking> {
  const id = generateBookingId();
  const now = new Date().toISOString();

  const newBooking: Booking = {
    ...bookingData,
    id,
    createdAt: now,
    status: 'Requested',
    paymentMode: 'Pay at Collection / Visit',
    paymentStatus: 'Pending',
    statusHistory: [
      {
        status: 'Requested',
        timestamp: now,
        note: `Booking created via portal for ${bookingData.collectionType}.`
      }
    ],
    syncedToSheets: false
  };

  await setDoc(doc(db, BOOKINGS_COLLECTION, id), newBooking);

  // Trigger Google Sheets sync simulation / sync queue record
  try {
    const syncLogRef = doc(collection(db, 'sync_logs'));
    await setDoc(syncLogRef, {
      bookingId: id,
      action: 'BOOKING_CREATED',
      timestamp: now,
      patientName: bookingData.patient.fullName,
      totalAmount: bookingData.totalAmount,
      status: 'ReadyForSync'
    });
  } catch (e) {
    console.warn('Sync log error:', e);
  }

  return newBooking;
}

// Fetch single booking by ID
export async function getBookingById(bookingId: string): Promise<Booking | null> {
  try {
    const cleanId = bookingId.trim().toUpperCase();
    const docSnap = await getDoc(doc(db, BOOKINGS_COLLECTION, cleanId));
    if (docSnap.exists()) {
      return docSnap.data() as Booking;
    }
    return null;
  } catch (error) {
    console.error('Error fetching booking by ID:', error);
    return null;
  }
}

// Subscribe to all bookings for Admin Dashboard
export function subscribeToBookings(callback: (bookings: Booking[]) => void) {
  const q = query(collection(db, BOOKINGS_COLLECTION), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: Booking[] = [];
    snapshot.forEach((doc) => {
      items.push(doc.data() as Booking);
    });
    callback(items);
  }, (err) => {
    console.warn('Bookings listener notice (fallback to local if offline):', err);
  });
}

// Update booking status with history
export async function updateBookingStatus(
  bookingId: string, 
  newStatus: BookingStatus, 
  note?: string,
  extraUpdates?: Partial<Booking>
): Promise<void> {
  const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    throw new Error('Booking not found: ' + bookingId);
  }

  const currentData = snap.data() as Booking;
  const now = new Date().toISOString();

  const updatedHistory = [
    ...(currentData.statusHistory || []),
    {
      status: newStatus,
      timestamp: now,
      note: note || `Status updated to ${newStatus}`
    }
  ];

  await updateDoc(docRef, {
    status: newStatus,
    statusHistory: updatedHistory,
    ...(extraUpdates || {})
  });
}

// Update payment status (Cash/Direct collected at visit or center)
export async function updatePaymentStatus(
  bookingId: string,
  paymentStatus: Booking['paymentStatus']
): Promise<void> {
  const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  await updateDoc(docRef, { paymentStatus });
}

// Attach simulated laboratory report
export async function attachReportToBooking(
  bookingId: string,
  reportUrl: string,
  doctorRemarks?: string
): Promise<void> {
  const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const now = new Date().toISOString();
  await updateDoc(docRef, {
    reportUrl,
    reportUploadedAt: now,
    status: 'Report Ready',
    statusHistory: [
      {
        status: 'Report Ready',
        timestamp: now,
        note: doctorRemarks ? `Report generated: ${doctorRemarks}` : 'Laboratory diagnostic report verified and attached.'
      }
    ]
  });
}
