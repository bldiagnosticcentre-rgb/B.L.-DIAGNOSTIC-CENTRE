export type UserRole = 'USER' | 'STAFF' | 'ADMIN';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyPatient {
  id: string;
  userId: string; // foreign key to UserProfile.uid
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  relation: 'Self' | 'Father' | 'Mother' | 'Spouse' | 'Child' | 'Other';
  phone?: string;
  bloodGroup?: string;
  createdAt: string;
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'BOOKING' | 'REPORT' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export interface AuthSession {
  user: UserProfile | null;
  token: string | null;
  expiresAt: number | null; // epoch timestamp
}
