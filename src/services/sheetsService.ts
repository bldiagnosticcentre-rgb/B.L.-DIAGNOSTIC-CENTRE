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
