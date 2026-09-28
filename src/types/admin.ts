import { BookingWorkflowStatus, CollectionType } from './bookingSystem';
import { UserRole } from './auth';

export type AdminRoute =
  | 'dashboard'
  | 'users'
  | 'patients'
  | 'tests'
  | 'categories'
  | 'packages'
  | 'bookings'
  | 'home-collection'
  | 'reports'
  | 'leads'
  | 'contact-enquiries'
  | 'google-sheets'
  | 'audit-logs'
  | 'settings';

export interface AdminDashboardMetrics {
  totalUsers: number;
  totalBookings: number;
  todayBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  homeCollectionRequests: number;
  newLeads: number;
  contactEnquiries: number;
}

export interface AdminUserListItem {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  patientsCount?: number;
  bookingsCount?: number;
}

export interface AdminPatientListItem {
  patient_id: string;
  user_id: string;
  user_email?: string;
  user_name?: string;
  full_name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relation: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  bookingsCount?: number;
}

export interface AdminCategoryItem {
  id: string;
  name: string;
  description: string;
  totalTests: number;
  activeTests: number;
  iconName?: string;
}

export type LeadSource = 
  | 'CONTACT_FORM' 
  | 'HOME_COLLECTION' 
  | 'CALLBACK_REQUEST' 
  | 'WEBSITE' 
  | 'PHONE_CALL' 
  | 'WALK_IN';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'CLOSED';

export interface Lead {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  serviceType: string;
  preferredDate?: string;
  address?: string;
  notes?: string;
  status: LeadStatus;
  internalNotes?: string;
  source: LeadSource;
  createdAt: string;
  updatedAt: string;
}

export interface ContactEnquiry {
  id: string;
  name: string;
  phone: string;
  email?: string;
  message: string;
  status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED';
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralAuditLog {
  id: string;
  actorUid: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: 'USER' | 'TEST' | 'PACKAGE' | 'BOOKING' | 'REPORT' | 'LEAD' | 'ENQUIRY' | 'SETTINGS' | 'SHEETS';
  entityId: string;
  details: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface GoogleSheetsSyncState {
  lastSyncTimestamp?: string;
  syncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  totalSynced: number;
  failedCount: number;
  lastError?: string;
  webhookUrl?: string;
  syncHistory: {
    id: string;
    timestamp: string;
    status: 'SUCCESS' | 'FAILED';
    recordsProcessed: number;
    details: string;
  }[];
}

export interface CenterSettings {
  centerName: string;
  tagline: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  address: string;
  pincode: string;
  timingsWeekday: string;
  timingsSunday: string;
  homeCollectionPincodes: string;
  homeCollectionNoticeHours: number;
  enableHomeCollection: boolean;
  googleSheetsWebhookUrl?: string;
  operationalNotice?: string;
}
