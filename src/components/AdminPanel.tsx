import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  FlaskConical, 
  Layers, 
  Package, 
  Calendar, 
  Home, 
  FileCheck2, 
  Inbox, 
  MessageSquare, 
  FileSpreadsheet, 
  ShieldAlert, 
  Settings, 
  Shield, 
  ShieldCheck, 
  Menu, 
  X, 
  ChevronRight,
  Database
} from 'lucide-react';
import { AdminRoute } from '../types/admin';
import { useAuth } from '../contexts/AuthContext';
import { BUSINESS_INFO } from '../types';

// Admin Views
import { AdminDashboardOverview } from './admin/AdminDashboardOverview';
import { AdminUsersManager } from './admin/AdminUsersManager';
import { AdminPatientsManager } from './admin/AdminPatientsManager';
import { AdminTestsManager } from './admin/AdminTestsManager';
import { AdminCategoriesManager } from './admin/AdminCategoriesManager';
import { AdminPackageEditor } from './admin/AdminPackageEditor';
import { AdminBookingsManager } from './admin/AdminBookingsManager';
import { AdminReportsManager } from './admin/AdminReportsManager';
import { AdminLeadsManager } from './admin/AdminLeadsManager';
import { AdminContactEnquiriesManager } from './admin/AdminContactEnquiriesManager';
import { AdminGoogleSheetsSyncManager } from './admin/AdminGoogleSheetsSyncManager';
import { AdminAuditLogsManager } from './admin/AdminAuditLogsManager';
import { AdminSettingsManager } from './admin/AdminSettingsManager';
import { ImportValidationManager } from './admin/ImportValidationManager';

interface AdminPanelProps {
  initialTab?: AdminRoute;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ initialTab }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminRoute>(() => {
    if (initialTab) return initialTab;
    // Check URL hash e.g. #admin/users
    const hash = window.location.hash.replace('#', '').trim();
    if (hash.startsWith('admin/')) {
      const sub = hash.replace('admin/', '') as AdminRoute;
      const valid: AdminRoute[] = [
        'dashboard', 'users', 'patients', 'tests', 'categories', 'packages', 
        'bookings', 'home-collection', 'reports', 'leads', 'contact-enquiries', 
        'google-sheets', 'audit-logs', 'settings'
      ];
      if (valid.includes(sub)) return sub;
    }
    return 'dashboard';
  });

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showImportTool, setShowImportTool] = useState(false);

  // Sync hash on tab change
  const handleSelectTab = (tab: AdminRoute) => {
    setActiveTab(tab);
    setShowImportTool(false);
    setMobileSidebarOpen(false);
    window.location.hash = `admin/${tab}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').trim();
      if (hash.startsWith('admin/')) {
        const sub = hash.replace('admin/', '') as AdminRoute;
        setActiveTab(sub);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navGroups = [
    {
      group: 'OVERVIEW',
      items: [
        { id: 'dashboard' as AdminRoute, label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' }
      ]
    },
    {
      group: 'INTAKE & LOGISTICS',
      items: [
        { id: 'bookings' as AdminRoute, label: 'Bookings Queue', icon: Calendar, path: '/admin/bookings' },
        { id: 'home-collection' as AdminRoute, label: 'Home Collections', icon: Home, path: '/admin/home-collection' },
        { id: 'reports' as AdminRoute, label: 'Diagnostic Reports', icon: FileCheck2, path: '/admin/reports' }
      ]
    },
    {
      group: 'CLINICAL DIRECTORY',
      items: [
        { id: 'tests' as AdminRoute, label: 'Rate List & Tests', icon: FlaskConical, path: '/admin/tests' },
        { id: 'categories' as AdminRoute, label: 'Test Categories', icon: Layers, path: '/admin/categories' },
        { id: 'packages' as AdminRoute, label: 'Health Packages', icon: Package, path: '/admin/packages' }
      ]
    },
    {
      group: 'ACCOUNTS & PATIENTS',
      items: [
        { id: 'users' as AdminRoute, label: 'User Accounts', icon: Users, path: '/admin/users' },
        { id: 'patients' as AdminRoute, label: 'Patients Directory', icon: UserCheck, path: '/admin/patients' }
      ]
    },
    {
      group: 'CRM & INQUIRIES',
      items: [
        { id: 'leads' as AdminRoute, label: 'Leads Pipeline', icon: Inbox, path: '/admin/leads' },
        { id: 'contact-enquiries' as AdminRoute, label: 'Contact Enquiries', icon: MessageSquare, path: '/admin/contact-enquiries' }
      ]
    },
    {
      group: 'SYSTEM & SETTINGS',
      items: [
        { id: 'google-sheets' as AdminRoute, label: 'Google Sheets Sync', icon: FileSpreadsheet, path: '/admin/google-sheets' },
        { id: 'audit-logs' as AdminRoute, label: 'Audit Trail Logs', icon: ShieldAlert, path: '/admin/audit-logs' },
        { id: 'settings' as AdminRoute, label: 'Center Settings', icon: Settings, path: '/admin/settings' }
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Admin Top Navigation & Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Mobile sidebar toggle button */}
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {BUSINESS_INFO.name} Admin Panel
              </h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-mono text-emerald-800 font-semibold">
                /admin/{activeTab}
              </span>
              <span>•</span>
              <span className="hidden sm:inline">PostgreSQL / Firestore Production Engine</span>
            </div>
          </div>
        </div>

        {/* Current Admin User Profile Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-bold text-slate-900 block leading-tight">
              {currentUser?.displayName || 'Administrator'}
            </span>
            <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
              {currentUser?.email}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F294A] text-white text-xs font-bold shadow-xs">
            {currentUser?.role === 'ADMIN' ? (
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{currentUser?.role || 'STAFF'}</span>
          </div>
        </div>
      </div>

      {/* Main Admin Body Grid: Sidebar (3 cols) + Content Area (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <aside className={`
          lg:col-span-3 lg:block
          ${mobileSidebarOpen ? 'block' : 'hidden'}
        `}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-5 sticky top-24">
            {navGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block">
                  {group.group}
                </span>

                <div className="space-y-0.5 pt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id && !showImportTool;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          isActive
                            ? 'bg-[#0F294A] text-white shadow-xs font-bold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Advanced Utilities Section */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 block mb-1">
                DEVELOPER / ADVANCED
              </span>
              <button
                onClick={() => {
                  setShowImportTool(true);
                  setMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  showImportTool
                    ? 'bg-[#0F294A] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Database className={`w-4 h-4 ${showImportTool ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>Rate List JSON Import</span>
                </div>
                {showImportTool && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          </div>
        </aside>

        {/* Content Area (9 cols) */}
        <div className="lg:col-span-9">
          {showImportTool ? (
            <ImportValidationManager />
          ) : activeTab === 'dashboard' ? (
            <AdminDashboardOverview onNavigateTab={handleSelectTab} />
          ) : activeTab === 'users' ? (
            <AdminUsersManager />
          ) : activeTab === 'patients' ? (
            <AdminPatientsManager />
          ) : activeTab === 'tests' ? (
            <AdminTestsManager />
          ) : activeTab === 'categories' ? (
            <AdminCategoriesManager onNavigateTab={handleSelectTab} />
          ) : activeTab === 'packages' ? (
            <AdminPackageEditor />
          ) : activeTab === 'bookings' ? (
            <AdminBookingsManager filterMode="all" onNavigateTab={handleSelectTab} />
          ) : activeTab === 'home-collection' ? (
            <AdminBookingsManager filterMode="home-collection" onNavigateTab={handleSelectTab} />
          ) : activeTab === 'reports' ? (
            <AdminReportsManager />
          ) : activeTab === 'leads' ? (
            <AdminLeadsManager />
          ) : activeTab === 'contact-enquiries' ? (
            <AdminContactEnquiriesManager />
          ) : activeTab === 'google-sheets' ? (
            <AdminGoogleSheetsSyncManager />
          ) : activeTab === 'audit-logs' ? (
            <AdminAuditLogsManager />
          ) : activeTab === 'settings' ? (
            <AdminSettingsManager />
          ) : (
            <AdminDashboardOverview onNavigateTab={handleSelectTab} />
          )}
        </div>
      </div>
    </div>
  );
};
