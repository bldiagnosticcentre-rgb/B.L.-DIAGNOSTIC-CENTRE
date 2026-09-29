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
  ShieldCheck,
  Send,
  HelpCircle,
  Code
} from 'lucide-react';
import { GoogleSheetsSyncState } from '../../types/admin';
import { fetchSheetsSyncState, retrySheetsSync, fetchAdminBookings } from '../../services/adminService';
import { 
  exportBookingsToCSV, 
  fetchBackendSheetsStatus, 
  retryBackendSheetsSync, 
  testDummyUserSync, 
  SheetsBackendStatus 
} from '../../services/sheetsService';
import { useAuth } from '../../contexts/AuthContext';

export const AdminGoogleSheetsSyncManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [syncState, setSyncState] = useState<GoogleSheetsSyncState | null>(null);
  const [backendStatus, setBackendStatus] = useState<SheetsBackendStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [testingDummy, setTestingDummy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showCodeHelp, setShowCodeHelp] = useState(false);

  const loadAllSyncData = async () => {
    setLoading(true);
    try {
      const [data, beStatus] = await Promise.all([
        fetchSheetsSyncState(),
        fetchBackendSheetsStatus()
      ]);
      setSyncState(data);
      setBackendStatus(beStatus);
    } catch (err) {
      console.error('Failed to load sync state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllSyncData();
  }, []);

  const handleRetrySync = async () => {
    setRetrying(true);
    setActionNotice(null);
    try {
      const beResult = await retryBackendSheetsSync();
      if (currentUser) {
        await retrySheetsSync({
          uid: currentUser.uid,
          email: currentUser.email,
          role: currentUser.role
        });
      }
      setActionNotice({
        type: beResult.success ? 'success' : 'error',
        text: beResult.message || 'Retry executed.'
      });
      await loadAllSyncData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: `Retry sync error: ${err.message}`
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleTestDummySync = async () => {
    setTestingDummy(true);
    setActionNotice(null);
    try {
      const result = await testDummyUserSync();
      if (result.success) {
        setActionNotice({
          type: result.task?.status === 'SUCCESS' ? 'success' : 'info',
          text: result.message
        });
      } else {
        setActionNotice({
          type: 'error',
          text: result.error || 'Test sync failed.'
        });
      }
      await loadAllSyncData();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: `Dummy test failed: ${err.message}`
      });
    } finally {
      setTestingDummy(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const bookings = await fetchAdminBookings();
      exportBookingsToCSV(bookings.map(b => b.raw || b));
      setActionNotice({
        type: 'success',
        text: 'Google Sheets formatted CSV downloaded successfully.'
      });
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: `Export error: ${err.message}`
      });
    } finally {
      setExporting(false);
    }
  };

  const spreadsheetId = backendStatus?.spreadsheetId || '18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E';
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              Google Sheets Operational Integration
            </h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
              Apps Script Web App
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Server-side synchronization to Google Spreadsheet tab <code className="text-emerald-700 font-mono">Users</code>.
            PostgreSQL is the primary source of truth.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadAllSyncData}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={handleTestDummySync}
            disabled={testingDummy}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            title="Send clearly marked dummy audit account TEST-AUDIT-DUMMY-001"
          >
            <Send className={`w-3.5 h-3.5 ${testingDummy ? 'animate-spin' : ''}`} />
            {testingDummy ? 'Testing...' : 'Test Sync (Dummy)'}
          </button>

          <button
            onClick={handleRetrySync}
            disabled={retrying}
            className="bg-[#0F294A] hover:bg-[#16365D] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry Failed Syncs'}
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionNotice && (
        <div className={`p-4 rounded-xl text-xs font-medium flex items-center justify-between border ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : actionNotice.type === 'info'
            ? 'bg-blue-50 text-blue-800 border-blue-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.text}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)} 
            className="text-slate-400 hover:text-slate-600 text-[11px] underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Architecture & Credentials Security Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Server-Side Security Protected
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Target Spreadsheet ID: <code className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-amber-300">{spreadsheetId}</code>
            </p>
            <p className="text-[11px] text-slate-400">
              Apps Script shared secret is stored exclusively in Node.js server environment variables (<code className="text-slate-300 font-mono">GOOGLE_APPS_SCRIPT_SECRET</code>) and is never transmitted to the browser.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Open Google Sheet
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
            <button
              onClick={() => setShowCodeHelp(!showCodeHelp)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
            >
              <Code className="w-3.5 h-3.5" />
              {showCodeHelp ? 'Hide Script' : 'Apps Script Spec'}
            </button>
          </div>
        </div>

        {/* Optional Expandable Apps Script Code Snippet */}
        {showCodeHelp && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase">
                Apps Script doPost Handler (Users Tab Schema)
              </span>
              <span className="text-[10px] text-slate-400">Action: "upsertUser"</span>
            </div>
            <pre className="bg-slate-950 p-3 rounded-lg text-[10px] text-emerald-400 font-mono overflow-x-auto border border-slate-800 leading-relaxed">
{`function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.secret !== "AKfycbxFc04fFVBYcukjVPYkn1uwBAXJD7GvUR2v9hcZ23sAQUKnJclbOwpbRVgz1m2FtHOn") {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unauthorized" })).setMimeType(ContentService.MimeType.JSON);
    }
    if (data.action === "upsertUser") {
      var ss = SpreadsheetApp.openById("18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E");
      var sheet = ss.getSheetByName("Users") || ss.insertSheet("Users");
      // Header check: userId, customerName, mobileNumber, mobileVerified, email, accountStatus, registrationDate, lastLogin, totalBookings, createdAt
      var u = data.user;
      var rows = sheet.getDataRange().getValues();
      var foundIndex = -1;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][0] == u.userId) { foundIndex = i + 1; break; }
      }
      var rowData = [u.userId, u.customerName, u.mobileNumber, u.mobileVerified, u.email, u.accountStatus, u.registrationDate, u.lastLogin, u.totalBookings, u.createdAt];
      if (foundIndex > 0) {
        sheet.getRange(foundIndex, 1, 1, rowData.length).setValues([rowData]);
      } else {
        sheet.appendRow(rowData);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, userId: u.userId })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Unknown action" })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
  }
}`}
            </pre>
          </div>
        )}
      </div>

      {/* Sync Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sync Architecture</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-lg font-black text-slate-900">PostgreSQL → Sheets</span>
            <p className="text-[11px] text-slate-400 mt-1">DB is source of truth</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Synced</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {backendStatus?.metrics.syncedSuccess ?? syncState?.totalSynced ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Confirmed in Google Sheets</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending / Queued</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-700">
              {backendStatus?.metrics.pendingSyncs ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Non-blocking background queue</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Failed Syncs</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              (backendStatus?.metrics.failedSyncs ?? syncState?.failedCount ?? 0) > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black ${
              (backendStatus?.metrics.failedSyncs ?? syncState?.failedCount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {backendStatus?.metrics.failedSyncs ?? syncState?.failedCount ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">Safely logged for retry</p>
          </div>
        </div>
      </div>

      {/* Manual CSV Export Action */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-700" />
            Direct CSV Export for Operational Tabs
          </h3>
          <p className="text-xs text-emerald-800 mt-1 max-w-xl">
            Download a pre-formatted laboratory CSV matching Google Sheets column headers (Booking ID, Patient, Phone, Tests Ordered, Amount, Status, and Home Address).
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

      {/* Live User Synchronization Tasks Queue */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Google Sheets "Users" Tab Sync Queue
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Deduplicated by stable PostgreSQL / Auth User ID
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            {backendStatus?.syncTasks.length || 0} tasks tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Stable User ID</th>
                <th className="px-4 py-3">Customer Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3 text-center">Attempts</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Sync Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-600" />
                    Checking live sync queue...
                  </td>
                </tr>
              ) : !backendStatus || backendStatus.syncTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No sync tasks recorded yet. Click "Test Sync (Dummy)" above to verify integration.
                  </td>
                </tr>
              ) : (
                backendStatus.syncTasks.map((t) => (
                  <tr key={t.userId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] font-bold text-slate-800">
                      {t.userId}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {t.customerName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.email}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700">
                      {t.attempts}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        t.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-500 max-w-xs truncate" title={t.lastError || 'Synced'}>
                      {t.lastError ? (
                        <span className="text-rose-600 font-mono text-[10px]">{t.lastError}</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Synchronized</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Backend Audit Log History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Server-Side Operational Audit Stream
          </h3>
          <span className="text-[11px] text-slate-400">Strictly sanitized (no secrets or passwords)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User Target</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Loading logs...
                  </td>
                </tr>
              ) : !backendStatus || backendStatus.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No backend audit logs yet.
                  </td>
                </tr>
              ) : (
                backendStatus.recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">
                      {log.action}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-[11px]">
                      {log.userId}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 text-[11px]">
                      {log.details}
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
