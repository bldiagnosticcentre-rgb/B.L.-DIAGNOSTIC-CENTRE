import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Download, 
  Clock, 
  Database,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { GoogleSheetsSyncState } from '../../types/admin';
import { fetchSheetsSyncState, retrySheetsSync, fetchAdminBookings } from '../../services/adminService';
import { exportBookingsToCSV } from '../../services/sheetsService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminGoogleSheetsSyncManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [syncState, setSyncState] = useState<GoogleSheetsSyncState | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [exporting, setExporting] = useState(false);

  const loadSyncData = async () => {
    setLoading(true);
    try {
      const data = await fetchSheetsSyncState();
      setSyncState(data);
    } catch (err) {
      console.error('Failed to load sync state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyncData();
  }, []);

  const handleRetrySync = async () => {
    if (!currentUser) return;
    setRetrying(true);
    try {
      const result = await retrySheetsSync({
        uid: currentUser.uid,
        email: currentUser.email,
        role: currentUser.role
      });
      alert(result.message);
      await loadSyncData();
    } catch (err: any) {
      alert(`Retry sync error: ${err.message}`);
    } finally {
      setRetrying(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const bookings = await fetchAdminBookings();
      exportBookingsToCSV(bookings.map(b => b.raw || b));
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            Google Sheets Operational Telemetry & Sync
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time synchronization status, retry sync queue, and Google Sheets compatible CSV export.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSyncData}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
          <button
            onClick={handleRetrySync}
            disabled={retrying}
            className="bg-[#0F294A] hover:bg-[#16365D] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            Retry Sync Now
          </button>
        </div>
      </div>

      {/* Sync Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sync State</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-700">Connected & Synced</span>
            <p className="text-[11px] text-slate-400 mt-1">Primary database is Firestore / PostgreSQL</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Processed Records</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">{syncState?.totalSynced ?? 0}</span>
            <p className="text-[11px] text-slate-400 mt-1">Live queue transactions synchronized</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed Syncs</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              (syncState?.failedCount ?? 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black ${
              (syncState?.failedCount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {syncState?.failedCount ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Retry available with automatic failover</p>
          </div>
        </div>
      </div>

      {/* Manual CSV Export Action */}
      <div className="bg-linear-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-700" />
            Manual Google Sheets Intake Export
          </h3>
          <p className="text-xs text-emerald-800 mt-1 max-w-xl">
            Download a 100% formatted CSV matching official laboratory column headers (Booking ID, Patient, Phone, Tests Ordered, Amount, Status, and Home Address).
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {exporting ? 'Generating...' : 'Download Formatted CSV'}
        </button>
      </div>

      {/* Sync Log History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sync Log Audit History</h3>
          <span className="text-[11px] text-slate-400">Past 20 operations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Sync Event</th>
                <th className="px-4 py-3 text-center">Records</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Checking sync logs...
                  </td>
                </tr>
              ) : !syncState || syncState.syncHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No sync log records found. Automatic sync initiates upon each booking.
                  </td>
                </tr>
              ) : (
                syncState.syncHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.details}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {item.recordsProcessed}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        item.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={handleRetrySync}
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
                      >
                        Re-queue
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
