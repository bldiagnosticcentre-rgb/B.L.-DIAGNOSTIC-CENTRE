import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PublicPage } from '../layout/Header';
import { BookingRecord, BookingWorkflowStatus } from '../../types/bookingSystem';
import { getBookingsForUser, getBookingById } from '../../services/orderService';
import { PatientManager } from './PatientManager';
import { UserReportsView } from '../reports/UserReportsView';
import { getNotificationsForUser, markNotificationAsRead } from '../../services/userService';
import { UserNotification } from '../../types/auth';
import { 
  Calendar, 
  FileText, 
  Users, 
  Bell, 
  User as UserIcon, 
  Clock, 
  MapPin, 
  Download, 
  ChevronRight, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  LogOut, 
  Home, 
  Building2,
  RefreshCw
} from 'lucide-react';
import { Button, Badge, LoadingState, EmptyState } from '../ui/DesignSystem';

interface UserDashboardViewProps {
  onNavigate: (page: PublicPage, param?: string) => void;
  initialTab?: 'dashboard' | 'profile' | 'patients' | 'bookings' | 'reports' | 'notifications';
  initialBookingId?: string;
}

export const UserDashboardView: React.FC<UserDashboardViewProps> = ({
  onNavigate,
  initialTab = 'dashboard',
  initialBookingId
}) => {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState(initialTab);
  const [selectedBookingDetailId, setSelectedBookingDetailId] = useState<string | null>(initialBookingId || null);

  // Data States
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [singleBooking, setSingleBooking] = useState<BookingRecord | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Bookings & Notifications
  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    const [bList, nList] = await Promise.all([
      getBookingsForUser(user.uid),
      getNotificationsForUser(user.uid)
    ]);
    setBookings(bList);
    setNotifications(nList);
    setLoading(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // Load single booking detail if view requested
  useEffect(() => {
    if (selectedBookingDetailId && user) {
      getBookingById(selectedBookingDetailId, user.uid).then(setSingleBooking);
    } else {
      setSingleBooking(null);
    }
  }, [selectedBookingDetailId, user]);

  const handleNotificationClick = async (notif: UserNotification) => {
    await markNotificationAsRead(notif.id);
    setNotifications(notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    if (notif.link?.includes('bookings')) {
      const parts = notif.link.split('/');
      const id = parts[parts.length - 1];
      setSelectedBookingDetailId(id);
      setCurrentTab('bookings');
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to Patient Dashboard</h2>
        <Button variant="primary" size="md" onClick={() => onNavigate('login')}>
          Sign In
        </Button>
      </div>
    );
  }

  // BOOKING DETAIL VIEW (/dashboard/bookings/[id])
  if (selectedBookingDetailId && singleBooking) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-24">
        <button
          onClick={() => setSelectedBookingDetailId(null)}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bookings
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4 flex flex-wrap justify-between items-start gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Booking Reference
              </span>
              <h2 className="text-2xl font-mono font-black text-[#0F294A]">
                {singleBooking.booking_id}
              </h2>
              <span className="text-xs text-slate-400">Created: {new Date(singleBooking.created_at).toLocaleString()}</span>
            </div>

            <Badge variant={singleBooking.status === 'COMPLETED' ? 'green' : 'amber'}>
              {singleBooking.status}
            </Badge>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold block">Patient Information</span>
              <h4 className="font-bold text-slate-900 text-sm">{singleBooking.patient_name_snapshot}</h4>
              <p className="text-slate-600">{singleBooking.patient_age_snapshot} Yrs • {singleBooking.patient_gender_snapshot}</p>
              {singleBooking.patient_phone_snapshot && <p className="text-slate-500">+91 {singleBooking.patient_phone_snapshot}</p>}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <span className="text-slate-400 font-semibold block">Collection & Timing</span>
              <p className="font-bold text-slate-900">{singleBooking.booking_date} ({singleBooking.time_slot})</p>
              <p className="text-emerald-800 font-semibold">
                {singleBooking.collection_type === 'HOME_COLLECTION' ? 'Doorstep Home Collection' : 'Center Visit'}
              </p>
              {singleBooking.home_address && (
                <p className="text-slate-600 mt-1">{singleBooking.home_address}, {singleBooking.area} - {singleBooking.pincode}</p>
              )}
            </div>
          </div>

          {/* Items Table Snapshot */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Diagnostic Tests & Packages ({singleBooking.items.length})
            </h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
              {singleBooking.items.map(it => (
                <div key={it.booking_item_id} className="p-3 flex justify-between items-center bg-white">
                  <div>
                    <span className="font-bold text-slate-900">{it.test_name_snapshot}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">{it.test_id}</span>
                  </div>
                  <span className="font-black text-[#0F294A]">₹{it.price_snapshot}</span>
                </div>
              ))}
              <div className="p-3 bg-slate-50 flex justify-between items-center font-bold text-sm">
                <span>Total Amount:</span>
                <span className="text-lg font-black text-[#0F294A]">₹{singleBooking.total_amount}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Payment mode: Pay in cash or direct at sample collection or center visit.
            </p>
          </div>

          {/* Certified Report Section if ready */}
          {singleBooking.report_url && (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-emerald-950">Certified Diagnostic Report Ready</h4>
                <p className="text-[11px] text-emerald-800">Released on {singleBooking.report_released_at ? new Date(singleBooking.report_released_at).toLocaleString() : 'Recently'}</p>
              </div>
              <a
                href={singleBooking.report_url}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Report
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0F294A] text-white flex items-center justify-center font-black text-xl">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{user.displayName}</h1>
              <Badge variant="navy">{user.role}</Badge>
            </div>
            <p className="text-xs text-slate-500">{user.email} {user.phone && `• +91 ${user.phone}`}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('book')}
          >
            <Calendar className="w-3.5 h-3.5" />
            Book Test
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('home-collection')}
          >
            <Home className="w-3.5 h-3.5" />
            Home Collection
          </Button>

          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-600 rounded-lg text-xs font-semibold"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dashboard Sub-Nav Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-2 text-xs">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            currentTab === 'dashboard' ? 'bg-[#0F294A] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overview
        </button>

        <button
          onClick={() => setCurrentTab('bookings')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            currentTab === 'bookings' ? 'bg-[#0F294A] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          My Bookings ({bookings.length})
        </button>

        <button
          onClick={() => setCurrentTab('reports')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            currentTab === 'reports' ? 'bg-[#0F294A] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Diagnostic Reports
        </button>

        <button
          onClick={() => setCurrentTab('patients')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            currentTab === 'patients' ? 'bg-[#0F294A] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Family Patients
        </button>

        <button
          onClick={() => setCurrentTab('notifications')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors relative ${
            currentTab === 'notifications' ? 'bg-[#0F294A] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Notifications
          {notifications.some(n => !n.isRead) && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
          )}
        </button>

        <button
          onClick={() => setCurrentTab('profile')}
          className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            currentTab === 'profile' ? 'bg-[#0F294A] text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          Profile
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {currentTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Bookings</span>
              <span className="text-2xl font-black text-slate-900">{bookings.length}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Confirmed / Active</span>
              <span className="text-2xl font-black text-emerald-700">
                {bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COLLECTION_ASSIGNED').length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Reports Ready</span>
              <span className="text-2xl font-black text-blue-700">
                {bookings.filter(b => b.report_url).length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Unread Alerts</span>
              <span className="text-2xl font-black text-amber-700">
                {notifications.filter(n => !n.isRead).length}
              </span>
            </div>
          </div>

          {/* Recent Bookings preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900">Recent Appointments</h3>
              <button onClick={() => setCurrentTab('bookings')} className="text-xs font-semibold text-emerald-700 hover:underline">
                View All
              </button>
            </div>

            {bookings.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No bookings placed yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {bookings.slice(0, 3).map(b => (
                  <div key={b.booking_id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{b.booking_id}</span>
                      <p className="text-slate-500">{b.patient_name_snapshot} • {b.booking_date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={b.status === 'COMPLETED' ? 'green' : 'amber'}>{b.status}</Badge>
                      <button
                        onClick={() => setSelectedBookingDetailId(b.booking_id)}
                        className="text-xs font-semibold text-emerald-700 hover:underline"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: MY BOOKINGS */}
      {currentTab === 'bookings' && (
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <EmptyState
              title="No Appointments Scheduled"
              description="Schedule diagnostic tests or preventive packages for yourself or family members."
              actionText="Book A Test"
              onAction={() => onNavigate('book')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bookings.map(b => (
                <div key={b.booking_id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-sm text-[#0F294A]">{b.booking_id}</span>
                    <Badge variant={b.status === 'COMPLETED' ? 'green' : 'amber'}>{b.status}</Badge>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{b.patient_name_snapshot}</h4>
                    <p className="text-xs text-slate-500">
                      {b.items.length} tests • {b.booking_date} ({b.time_slot})
                    </p>
                    <p className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                      {b.collection_type === 'HOME_COLLECTION' ? 'Doorstep Home Collection' : 'Center Visit'}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                    <span className="font-black text-[#0F294A]">₹{b.total_amount}</span>
                    <button
                      onClick={() => setSelectedBookingDetailId(b.booking_id)}
                      className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                    >
                      View Full Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: REPORTS */}
      {currentTab === 'reports' && (
        <UserReportsView
          onNavigateToBooking={(bId) => {
            setSelectedBookingDetailId(bId);
            setCurrentTab('bookings');
          }}
        />
      )}

      {/* TAB: FAMILY PATIENTS */}
      {currentTab === 'patients' && (
        <PatientManager />
      )}

      {/* TAB: NOTIFICATIONS */}
      {currentTab === 'notifications' && (
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <EmptyState title="No Notifications" description="You have no unread updates." />
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 rounded-xl border text-xs cursor-pointer transition-colors ${
                  n.isRead ? 'bg-white border-slate-200' : 'bg-emerald-50/70 border-emerald-300'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{n.title}</h4>
                    <p className="text-slate-600 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB: PROFILE */}
      {currentTab === 'profile' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-lg space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">Patient Account Information</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Account ID:</span>
              <span className="font-mono text-slate-800">{user.uid}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-bold text-slate-900">{user.displayName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Email:</span>
              <span className="font-bold text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Mobile:</span>
              <span className="font-bold text-slate-900">+91 {user.phone || 'Not configured'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-500">Role:</span>
              <Badge variant="navy">{user.role}</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
