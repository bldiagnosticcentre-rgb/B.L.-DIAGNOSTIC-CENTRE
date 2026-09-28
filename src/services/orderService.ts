import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  runTransaction 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  BookingRecord, 
  BookingItemSnapshot, 
  BookingWorkflowStatus,
  CollectionType 
} from '../types/bookingSystem';
import { getPatientById } from './patientService';
import { getTestByIdFromDB } from './catalogueService';
import { getPackageByIdFromDB } from './packageService';
import { createUserNotification } from './userService';

const BOOKINGS_COLLECTION = 'bookings';
const COUNTER_DOC = 'booking_counter';

/**
 * Generate human-readable booking ID in format: BL-YYYY-000001
 */
export async function generateBookingNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, 'system_metadata', `${COUNTER_DOC}_${currentYear}`);

  try {
    let nextNum = 1;
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);
      if (snap.exists()) {
        nextNum = (snap.data().last_seq || 0) + 1;
        transaction.update(counterRef, { last_seq: nextNum });
      } else {
        transaction.set(counterRef, { last_seq: 1, year: currentYear });
      }
    });

    const padded = String(nextNum).padStart(6, '0');
    return `BL-${currentYear}-${padded}`;
  } catch (e) {
    // Fallback pseudo-sequential ID if transaction is restricted
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    return `BL-${currentYear}-${randomSeq}`;
  }
}

/**
 * Submit Booking: Creates historic immutable snapshots of patient and test pricing
 */
export async function createBookingOrder(params: {
  userId: string;
  patientId: string;
  collectionType: CollectionType;
  bookingDate: string;
  timeSlot: string;
  homeAddress?: string;
  area?: string;
  pincode?: string;
  notes?: string;
  selectedTestIds: string[];
}): Promise<BookingRecord> {
  const {
    userId,
    patientId,
    collectionType,
    bookingDate,
    timeSlot,
    homeAddress,
    area,
    pincode,
    notes,
    selectedTestIds
  } = params;

  // Validation
  if (!selectedTestIds || selectedTestIds.length === 0) {
    throw new Error('Please select at least one diagnostic test or package.');
  }

  if (collectionType === 'HOME_COLLECTION') {
    if (!homeAddress || !homeAddress.trim()) {
      throw new Error('Home collection requires delivery address.');
    }
  }

  // IDOR check: verify patient belongs to user
  const patient = await getPatientById(patientId, userId);
  if (!patient) {
    throw new Error('Selected patient does not exist or unauthorized.');
  }

  // Build immutable historical item snapshots
  const items: BookingItemSnapshot[] = [];
  let totalAmount = 0;

  for (const tid of selectedTestIds) {
    // Check catalogue
    const test = await getTestByIdFromDB(tid);
    if (test) {
      const price = test.general_price ?? 0;
      totalAmount += price;
      items.push({
        booking_item_id: `item-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
        booking_id: '',
        test_id: test.test_id,
        test_name_snapshot: test.test_name,
        category_snapshot: test.category,
        price_snapshot: price
      });
    } else {
      // Check package
      const pkg = await getPackageByIdFromDB(tid);
      if (pkg) {
        totalAmount += pkg.price;
        items.push({
          booking_item_id: `item-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
          booking_id: '',
          test_id: pkg.package_id,
          test_name_snapshot: pkg.package_name,
          category_snapshot: 'Preventive Health Packages',
          price_snapshot: pkg.price
        });
      }
    }
  }

  const bookingId = await generateBookingNumber();
  items.forEach(it => { it.booking_id = bookingId; });

  const now = new Date().toISOString();
  const bookingRecord: BookingRecord = {
    booking_id: bookingId,
    user_id: userId,
    patient_id: patientId,
    patient_name_snapshot: patient.full_name,
    patient_age_snapshot: patient.age,
    patient_gender_snapshot: patient.gender,
    patient_phone_snapshot: patient.phone || '',
    collection_type: collectionType,
    home_address: homeAddress?.trim() || undefined,
    area: area?.trim() || undefined,
    pincode: pincode?.trim() || undefined,
    booking_date: bookingDate,
    time_slot: timeSlot,
    status: 'CONFIRMED',
    notes: notes?.trim() || undefined,
    items,
    total_amount: totalAmount,
    created_at: now,
    updated_at: now
  };

  // Write booking to database
  await setDoc(doc(db, BOOKINGS_COLLECTION, bookingId), bookingRecord);

  // Send in-app notification to user
  await createUserNotification({
    userId,
    title: `Booking Confirmed: ${bookingId}`,
    message: `Your booking for ${patient.full_name} (${items.length} tests) on ${bookingDate} at ${timeSlot} has been received.`,
    type: 'BOOKING',
    link: `/dashboard/bookings/${bookingId}`
  });

  return bookingRecord;
}

/**
 * Fetch all bookings for a user
 */
export async function getBookingsForUser(userId: string): Promise<BookingRecord[]> {
  try {
    const q = query(collection(db, BOOKINGS_COLLECTION), where('user_id', '==', userId));
    const snap = await getDocs(q);
    const list: BookingRecord[] = [];
    snap.forEach(d => list.push(d.data() as BookingRecord));
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (err) {
    console.error('Error fetching bookings for user:', err);
    return [];
  }
}

/**
 * Fetch booking by ID with ownership or staff authorization check
 */
export async function getBookingById(bookingId: string, userId?: string, isStaffOrAdmin = false): Promise<BookingRecord | null> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as BookingRecord;

    if (!isStaffOrAdmin && userId && data.user_id !== userId) {
      throw new Error('Unauthorized: cannot view another patient booking.');
    }
    return data;
  } catch (err) {
    console.error('Error fetching booking by ID:', err);
    return null;
  }
}

/**
 * Update workflow status (staff or admin only)
 */
export async function updateBookingWorkflowStatus(
  bookingId: string, 
  status: BookingWorkflowStatus,
  reportData?: { report_url: string; report_notes?: string }
): Promise<void> {
  const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  const now = new Date().toISOString();
  
  const updates: any = {
    status,
    updated_at: now
  };

  if (reportData) {
    updates.report_url = reportData.report_url;
    updates.report_notes = reportData.report_notes;
    updates.report_released_at = now;
  }

  await updateDoc(docRef, updates);

  // Notify user if report ready or status advanced
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    const booking = snap.data() as BookingRecord;
    if (status === 'COMPLETED' || reportData) {
      await createUserNotification({
        userId: booking.user_id,
        title: `Report Ready for ${booking.booking_id}`,
        message: `Certified laboratory report for ${booking.patient_name_snapshot} is now ready to download.`,
        type: 'REPORT',
        link: `/dashboard/reports`
      });
    }
  }
}
