import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Home, 
  UserCheck, 
  MessageSquare, 
  AlertCircle, 
  TrendingUp, 
  ArrowUpRight, 
  FileSpreadsheet, 
  Plus, 
  FileUp, 
  RefreshCw,
  Package,
  Layers,
  Activity
} from 'lucide-react';
import { AdminDashboardMetrics, AdminRoute } from '../../types/admin';
import { fetchAdminMetrics, fetchAuditLogs } from '../../services/adminService';
import { GeneralAuditLog } from '../../types/admin';
import { BUSINESS_INFO } from '../../types';

interface AdminDashboardOverviewProps {
  onNavigateTab: (tab: AdminRoute) => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({ onNavigateTab }) => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [recentLogs, setRecentLogs] = useState<GeneralAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [m, logs] = await Promise.all([
        fetchAdminMetrics(),
        fetchAuditLogs()
      ]);
      setMetrics(m);
      setRecentLogs(logs.slice(0, 6));
    } catch (err) {
      console.error('Error loading dashboard overview:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-[#0F294A] animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Calculating real-time laboratory metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-linear-to-r from-[#0F294A] to-[#16365D] rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-lg font-bold">Diagnostic Operations Command Center</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Live database telemetry for {BUSINESS_INFO.name}. All counts are calculated directly from registered users, bookings, leads, and specimen workflows.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-white/20"
            title="Refresh database metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => onNavigateTab('bookings')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5" />
            Intake Queue
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <FileUp className="w-3.5 h-3.5" />
            Upload Report
          </button>
        </div>
      </div>

      {/* 9 Calculated Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        {/* Total Users */}
        <div 
          onClick={() => onNavigateTab('users')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-slate-900">{metrics?.totalUsers ?? 0}</span>
            <span className="text-[11px] font-semibold text-blue-600 flex items-center gap-0.5">
              Manage <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Verified patient & staff accounts</p>
        </div>

        {/* Total Bookings */}
        <div 
          onClick={() => onNavigateTab('bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0F294A] cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[#0F294A] group-hover:scale-110 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-[#0F294A]">{metrics?.totalBookings ?? 0}</span>
            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-0.5">
              View all <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">All-time diagnostic requests</p>
        </div>

        {/* Today's Bookings */}
        <div 
          onClick={() => onNavigateTab('bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Today&apos;s Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-indigo-700">{metrics?.todayBookings ?? 0}</span>
            <span className="text-[11px] font-semibold text-indigo-600 flex items-center gap-0.5">
              Today&apos;s slots <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Scheduled for {new Date().toLocaleDateString()}</p>
        </div>

        {/* Pending Bookings */}
        <div 
          onClick={() => onNavigateTab('bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-700">{metrics?.pendingBookings ?? 0}</span>
            <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-0.5">
              Awaiting confirm <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Requires staff review & confirmation</p>
        </div>

        {/* Confirmed Bookings */}
        <div 
          onClick={() => onNavigateTab('bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Confirmed Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-700">{metrics?.confirmedBookings ?? 0}</span>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
              In schedule <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed & ready for collection</p>
        </div>

        {/* Completed Bookings */}
        <div 
          onClick={() => onNavigateTab('bookings')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Completed Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-teal-700">{metrics?.completedBookings ?? 0}</span>
            <span className="text-[11px] font-semibold text-teal-600 flex items-center gap-0.5">
              Reports released <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Samples tested and reports signed</p>
        </div>

        {/* Home Collection Requests */}
        <div 
          onClick={() => onNavigateTab('home-collection')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Home Collections</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 group-hover:scale-110 transition-transform">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-emerald-900">{metrics?.homeCollectionRequests ?? 0}</span>
            <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-0.5">
              Dispatch <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Pratap Nagar doorstep pickups</p>
        </div>

        {/* New Leads */}
        <div 
          onClick={() => onNavigateTab('leads')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-400 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">New Leads</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-purple-700">{metrics?.newLeads ?? 0}</span>
            <span className="text-[11px] font-semibold text-purple-600 flex items-center gap-0.5">
              Follow-up <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Package & health check inquiries</p>
        </div>

        {/* Contact Enquiries */}
        <div 
          onClick={() => onNavigateTab('contact-enquiries')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Contact Enquiries</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-black text-amber-900">{metrics?.contactEnquiries ?? 0}</span>
            <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-0.5">
              Respond <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Public web & center inquiries</p>
        </div>
      </div>

      {/* Navigation Shortcuts & Recent Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Quick Access Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Administrative Operations Shortcuts
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <button
                onClick={() => onNavigateTab('tests')}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all group"
              >
                <span className="font-bold text-slate-800 block group-hover:text-emerald-800">Rate List & Tests</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Edit prices, methods, samples</span>
              </button>

              <button
                onClick={() => onNavigateTab('packages')}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all group"
              >
                <span className="font-bold text-slate-800 block group-hover:text-blue-800">Health Packages</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Configure preventive panels</span>
              </button>

              <button
                onClick={() => onNavigateTab('patients')}
                className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all group"
              >
                <span className="font-bold text-slate-800 block group-hover:text-indigo-800">Patients Directory</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">View registered profiles & history</span>
              </button>

              <button
                onClick={() => onNavigateTab('reports')}
                className="p-3 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 text-left transition-all group"
              >
                <span className="font-bold text-slate-800 block group-hover:text-purple-800">Reports Engine</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Upload certified lab PDFs</span>
              </button>

              <button
                onClick={() => onNavigateTab('google-sheets')}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 text-left transition-all group"
              >
                <span className="font-bold text-slate-800 block group-hover:text-emerald-800">Google Sheets Sync</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Export CSV & operational sync</span>
              </button>

              <button
                onClick={() => onNavigateTab('settings')}
                className="p-3 rounded-xl border border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-left transition-all group"
              >
                <span className="font-bold text-slate-800 block group-hover:text-slate-900">Center Settings</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Timings, pincodes, contacts</span>
              </button>
            </div>
          </div>

          {/* Operational Status Callout */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
            <Activity className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900">
              <span className="font-bold block">Laboratory Operating Parameters</span>
              <p className="mt-0.5 leading-relaxed text-emerald-800">
                Sample intake is operational at Pratap Nagar center. Home collection phlebotomist routes are active for Sector 11, Kumbha Marg, and Sanganer zones. Pay-at-collection cash & UPI direct collections remain enforced with zero payment gateway fees.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Live Audit Log Activity Stream (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              Live Security & Audit Trail
            </h3>
            <button
              onClick={() => onNavigateTab('audit-logs')}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
            >
              View Full Logs
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No recent administrative actions logged yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">{log.details}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span>By: {log.actorEmail}</span>
                    <span className="font-bold text-slate-600">{log.entityType}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
