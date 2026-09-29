import { Booking } from '../types';

/**
 * Service for operational synchronization to Google Sheets.
 * PostgreSQL / Firestore is the PRIMARY SOURCE OF TRUTH.
 * Google Sheets is only for operational sync, staff coordination, and daily summaries.
 */

export interface SheetsExportRow {
  bookingId: string;
  bookingDate: string;
  timeSlot: string;
  collectionType: string;
  patientName: string;
  ageGender: string;
  phone: string;
  tests: string;
  totalAmount: number;
  paymentMode: string;
  paymentStatus: string;
  currentStatus: string;
  address: string;
  createdAt: string;
}

export function formatBookingForSheets(booking: Booking): SheetsExportRow {
  const testNames = booking.tests.map(t => `${t.name} (₹${t.price})`).join('; ');
  const addressStr = booking.collectionType === 'Home Collection' && booking.address
    ? `${booking.address.street}, Landmark: ${booking.address.landmark || 'N/A'}, Pincode: ${booking.address.pincode}, ${booking.address.city}`
    : 'Center Visit (Near Post Office, Kumbha Marg, Pratap Nagar)';

  return {
    bookingId: booking.id,
    bookingDate: booking.bookingDate,
    timeSlot: booking.timeSlot,
    collectionType: booking.collectionType,
    patientName: booking.patient.fullName,
    ageGender: `${booking.patient.age} / ${booking.patient.gender}`,
    phone: booking.patient.phone,
    tests: testNames,
    totalAmount: booking.totalAmount,
    paymentMode: booking.paymentMode,
    paymentStatus: booking.paymentStatus,
    currentStatus: booking.status,
    address: addressStr,
    createdAt: booking.createdAt,
  };
}

export interface SheetsSyncResponse {
  success: boolean;
  syncStatus?: 'SUCCESS' | 'FAILED' | 'PENDING';
  attempts?: number;
  lastError?: string;
  userId?: string;
  message?: string;
}

export interface SheetsBackendStatus {
  spreadsheetId: string;
  scriptUrlConfigured: boolean;
  scriptUrlDomain: string;
  secretConfigured: boolean;
  metrics: {
    totalUsersTracked: number;
    syncedSuccess: number;
    failedSyncs: number;
    pendingSyncs: number;
  };
  syncTasks: Array<{
    userId: string;
    customerName: string;
    email: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    attempts: number;
    lastAttemptAt?: string;
    lastError?: string;
  }>;
  recentLogs: Array<{
    id: string;
    timestamp: string;
    action: string;
    userId: string;
    status: 'SUCCESS' | 'FAILED' | 'QUEUED';
    attempts: number;
    error?: string;
    details: string;
  }>;
}

/**
 * Synchronize user profile to Google Sheets via backend proxy.
 * PostgreSQL / Primary database is the source of truth.
 * Google Sheets failure does NOT fail or revert user registration.
 */
export async function syncUserToSheetsBackend(user: {
  userId: string;
  customerName?: string;
  mobileNumber?: string;
  mobileVerified?: boolean;
  email?: string;
  accountStatus?: string;
  registrationDate?: string;
  lastLogin?: string;
  totalBookings?: number;
  createdAt?: string;
}): Promise<SheetsSyncResponse> {
  try {
    const payload = {
      userId: user.userId,
      customerName: user.customerName || 'User',
      mobileNumber: user.mobileNumber || '',
      mobileVerified: user.mobileVerified ?? true,
      email: user.email || '',
      accountStatus: user.accountStatus || 'ACTIVE',
      registrationDate: user.registrationDate || new Date().toISOString().slice(0, 10),
      lastLogin: user.lastLogin || new Date().toISOString(),
      totalBookings: user.totalBookings ?? 0,
      createdAt: user.createdAt || new Date().toISOString()
    };

    const res = await fetch('/api/sheets/upsert-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        syncStatus: 'FAILED',
        lastError: `Backend HTTP ${res.status}: ${errText.slice(0, 100)}`
      };
    }

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.warn('[SheetsService] Background sync error (non-blocking):', err.message);
    return {
      success: false,
      syncStatus: 'FAILED',
      lastError: err.message
    };
  }
}

/**
 * Fetch server-side Google Sheets synchronization status
 */
export async function fetchBackendSheetsStatus(): Promise<SheetsBackendStatus | null> {
  try {
    const res = await fetch('/api/sheets/sync-status');
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('[SheetsService] Failed to load backend sync status:', err);
    return null;
  }
}

/**
 * Trigger retry for all pending / failed sync tasks on the backend
 */
export async function retryBackendSheetsSync(): Promise<{ success: boolean; message: string; retriedCount?: number }> {
  try {
    const res = await fetch('/api/sheets/retry', { method: 'POST' });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, message: err.message || 'Retry request failed.' };
  }
}

/**
 * Test synchronization using dedicated dummy account
 */
export async function testDummyUserSync(): Promise<any> {
  try {
    const res = await fetch('/api/sheets/test-sync', { method: 'POST' });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export function exportBookingsToCSV(bookings: Booking[]): void {
  const headers = [
    'Booking ID',
    'Appointment Date',
    'Time Slot',
    'Collection Type',
    'Patient Name',
    'Age / Gender',
    'Phone',
    'Tests Ordered',
    'Total Amount (INR)',
    'Payment Mode',
    'Payment Status',
    'Status',
    'Address / Center',
    'Created At'
  ];

  const rows = bookings.map(b => {
    const formatted = formatBookingForSheets(b);
    return [
      `"${formatted.bookingId}"`,
      `"${formatted.bookingDate}"`,
      `"${formatted.timeSlot}"`,
      `"${formatted.collectionType}"`,
      `"${formatted.patientName}"`,
      `"${formatted.ageGender}"`,
      `"${formatted.phone}"`,
      `"${formatted.tests.replace(/"/g, '""')}"`,
      formatted.totalAmount,
      `"${formatted.paymentMode}"`,
      `"${formatted.paymentStatus}"`,
      `"${formatted.currentStatus}"`,
      `"${formatted.address.replace(/"/g, '""')}"`,
      `"${formatted.createdAt}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BL_Diagnostic_GoogleSheets_Sync_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
