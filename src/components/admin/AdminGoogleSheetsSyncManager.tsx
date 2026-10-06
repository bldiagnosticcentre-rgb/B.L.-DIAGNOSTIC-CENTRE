import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Database,
  Link2,
  Layers,
  Copy,
  Code2,
  Check,
  Send,
} from 'lucide-react';
import { GoogleSheetsSyncState } from '../../types/admin';
import {
  fetchSheetsSyncState,
  retrySheetsSync,
  triggerFullDatabaseSyncToSheets,
  fetchAdminBookings,
} from '../../services/adminService';
import {
  exportBookingsToCSV,
  fetchBackendSheetsStatus,
  connectGoogleSheetsWithOAuthPopup,
  OFFICIAL_WORKSHEET_TABS,
} from '../../services/sheetsService';
import { useAuth } from '../../contexts/AuthContext';

const APPS_SCRIPT_CODE_SNIPPET = `/**
 * B.L. DIAGNOSTIC CENTER — OFFICIAL GOOGLE APPS SCRIPT WEB APP
 * Spreadsheet ID: 18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E
 *
 * HOW TO DEPLOY:
 * 1. Open Google Sheets: https://docs.google.com/spreadsheets/d/18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E
 * 2. Click Extensions > Apps Script
 * 3. Replace all code in Code.gs with this entire script
 * 4. Click Save
 * 5. Click Deploy > New Deployment > Web app
 * 6. Set "Execute as: Me" and "Who has access: Anyone"
 * 7. Click Deploy, grant permissions, and copy the Web App URL!
 */

var SPREADSHEET_ID = "18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E";
var EXPECTED_SECRET = "bl-diagnostic-secret-2024";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Empty request payload" });
    }
    var body = JSON.parse(e.postData.contents);
    if (body.secret !== EXPECTED_SECRET) {
      return jsonResponse({ success: false, error: "Unauthorized: Invalid secret" });
    }
    var action = body.action || "upsertUser";
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === "ping") {
      return jsonResponse({
        success: true,
        status: "ok",
        message: "Pong! B.L. Diagnostic Sheets Web App connected.",
        spreadsheetTitle: ss.getName()
      });
    }

    if (action === "upsertUser") {
      return handleUpsertUser(ss, body.user || body);
    }
    if (action === "syncBooking") {
      return handleSyncBooking(ss, body.record || body.booking || body);
    }
    if (action === "syncPatient") {
      return handleSyncPatient(ss, body.record || body.patient || body);
    }
    if (action === "syncLead") {
      return handleSyncLead(ss, body.record || body.lead || body);
    }
    return jsonResponse({ success: true, message: "Action accepted: " + action });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

function doGet(e) {
  return jsonResponse({
    status: "ok",
    service: "B.L. Diagnostic Center Google Sheets Sync API",
    spreadsheetId: SPREADSHEET_ID,
    timestamp: new Date().toISOString()
  });
}

function handleUpsertUser(ss, user) {
  var sheet = getOrCreateWorksheet(ss, "Users", [
    "User ID", "Customer Name", "Mobile Number", "Mobile Verified",
    "Email", "Account Status", "Registration Date", "Last Login",
    "Total Bookings", "Created At", "Updated At"
  ]);

  var rawMobile = String(user.mobileNumber || user.mobile || user.phone || "").replace(/\\D/g, '');
  var cleanMobile = rawMobile.slice(-10);
  var formattedMobile = cleanMobile ? "+91" + cleanMobile : "";
  var userId = user.userId || user.user_id || (cleanMobile ? ("USER-" + cleanMobile) : ("USER-" + new Date().getTime()));
  var customerName = user.customerName || user.fullName || user.name || "Valued Patient";
  var email = user.email || "";
  var accountStatus = user.accountStatus || "ACTIVE";
  var now = new Date().toISOString();
  var regDate = user.registrationDate || user.createdAt || now;
  var lastLogin = user.lastLogin || now;
  var totalBookings = Number(user.totalBookings || 0);
  var createdAt = user.createdAt || now;
  var updatedAt = now;

  var values = sheet.getDataRange().getValues();
  var existingRowIndex = -1;

  for (var i = 1; i < values.length; i++) {
    var rowUserId = String(values[i][0] || "").trim();
    var rowMobile = String(values[i][2] || "").replace(/\\D/g, '').slice(-10);
    if ((rowUserId && rowUserId === userId) || (cleanMobile && rowMobile && rowMobile === cleanMobile)) {
      existingRowIndex = i + 1;
      break;
    }
  }

  var rowData = [
    userId, customerName, formattedMobile, true,
    email, accountStatus, regDate, lastLogin,
    totalBookings, createdAt, updatedAt
  ];

  if (existingRowIndex > 0) {
    sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
    return jsonResponse({ success: true, action: "updated", userId: userId, row: existingRowIndex });
  } else {
    sheet.appendRow(rowData);
    return jsonResponse({ success: true, action: "inserted", userId: userId, row: sheet.getLastRow() });
  }
}

function handleSyncBooking(ss, booking) {
  var sheet = getOrCreateWorksheet(ss, "Bookings", [
    "Booking ID", "Booking Date", "Booking Time", "Customer Name", "Mobile Number",
    "Patient Name", "Relationship", "Test / Package", "Test ID", "Collection Method",
    "Appointment Date", "Time Slot", "House / Flat", "Street / Area", "Landmark",
    "City", "Pincode", "Contact Number", "Test Charges", "Home Collection Fee",
    "Total Amount", "Payment Method", "Booking Status", "Created At", "Updated At",
    "Sheet Sync Status", "Sync Last Attempt"
  ]);
  var bookingId = booking.bookingId || booking.booking_id || ("BK-" + new Date().getTime());
  var now = new Date().toISOString();
  var values = sheet.getDataRange().getValues();
  var existingRowIndex = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0] || "").trim() === String(bookingId).trim()) {
      existingRowIndex = i + 1;
      break;
    }
  }
  var rowData = [
    bookingId, booking.bookingDate || now.split('T')[0], booking.bookingTime || "",
    booking.customerName || booking.name || "", booking.mobileNumber || booking.phone || "",
    booking.patientName || "", booking.relationship || "", booking.testName || "",
    booking.testId || "", booking.collectionType || "CENTER_VISIT",
    booking.appointmentDate || "", booking.timeSlot || "", booking.houseFlat || "",
    booking.streetArea || "", booking.landmark || "", booking.city || "Jaipur",
    booking.pincode || "302033", booking.contactNumber || "", booking.testCharges || 0,
    booking.homeCollectionFee || 0, booking.totalAmount || 0, booking.paymentMethod || "CASH_ON_COLLECTION",
    booking.status || "CONFIRMED", booking.createdAt || now, now, "SYNCED", now
  ];
  if (existingRowIndex > 0) {
    sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return jsonResponse({ success: true, bookingId: bookingId });
}

function handleSyncPatient(ss, patient) {
  var sheet = getOrCreateWorksheet(ss, "Patients", [
    "Patient ID", "User ID", "Patient Name", "Relationship", "Gender",
    "Date of Birth / Age", "Mobile Number", "Address", "Created At", "Updated At", "Status"
  ]);
  var patientId = patient.patientId || patient.patient_id || ("PAT-" + new Date().getTime());
  var now = new Date().toISOString();
  sheet.appendRow([
    patientId, patient.userId || "", patient.fullName || patient.name || "",
    patient.relationship || "Self", patient.gender || "", patient.age || "",
    patient.phone || "", patient.address || "", now, now, "ACTIVE"
  ]);
  return jsonResponse({ success: true, patientId: patientId });
}

function handleSyncLead(ss, lead) {
  var sheet = getOrCreateWorksheet(ss, "Leads", [
    "Lead ID", "Lead Date", "Lead Time", "Name", "Mobile Number", "Email",
    "Lead Source", "Lead Type", "Message", "Interested Service", "Preferred Date",
    "Preferred Time", "City", "Pincode", "Status", "Assigned To", "Admin Remarks",
    "Created At", "Updated At"
  ]);
  var leadId = lead.leadId || ("LEAD-" + new Date().getTime());
  var now = new Date().toISOString();
  sheet.appendRow([
    leadId, now.split('T')[0], "", lead.name || "", lead.mobile || lead.phone || "",
    lead.email || "", "WEBSITE", lead.type || "ENQUIRY", lead.message || "",
    lead.service || "", "", "", "Jaipur", "302033", "NEW", "", "", now, now
  ]);
  return jsonResponse({ success: true, leadId: leadId });
}

function getOrCreateWorksheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.setFrozenRows(1);
    }
  } else if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

export const AdminGoogleSheetsSyncManager: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [syncState, setSyncState] = useState<GoogleSheetsSyncState | null>(null);
  const [backendStatus, setBackendStatus] = useState<{
    configured: boolean;
    authMode: 'SERVICE_ACCOUNT' | 'OAUTH_TOKEN' | 'NONE';
    spreadsheetIdMasked: string | null;
    spreadsheetUrl?: string | null;
    spreadsheetTitle: string;
    reason?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [testingAppsScript, setTestingAppsScript] = useState(false);
  const [appsScriptStatus, setAppsScriptStatus] = useState<{
    tested: boolean;
    success: boolean;
    message: string;
    isMissingDoPost?: boolean;
  } | null>(null);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleTestAppsScript = async () => {
    setTestingAppsScript(true);
    setAppsScriptStatus(null);
    try {
      const res = await fetch('/api/sheets/test-apps-script', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAppsScriptStatus({
          tested: true,
          success: true,
          message: 'Google Apps Script is active and responded successfully with action "ping"!',
        });
      } else {
        const isMissingDoPost = data.status === 'MISSING_DOPOST';
        setAppsScriptStatus({
          tested: true,
          success: false,
          message: data.error || 'Apps Script returned an error.',
          isMissingDoPost,
        });
        if (isMissingDoPost) {
          setShowScriptModal(true);
        }
      }
    } catch (err: any) {
      setAppsScriptStatus({
        tested: true,
        success: false,
        message: err.message || 'Failed to ping Google Apps Script.',
      });
    } finally {
      setTestingAppsScript(false);
    }
  };

  const loadSyncData = async () => {
    setLoading(true);
    try {
      const [data, status] = await Promise.all([
        fetchSheetsSyncState(),
        fetchBackendSheetsStatus(),
      ]);
      setSyncState(data);
      setBackendStatus(status);
    } catch (err) {
      console.error('Failed to load sync state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyncData();
  }, []);

  const handleConnectOAuth = async () => {
    setConnectingOAuth(true);
    setStatusBanner(null);
    try {
      const result = await connectGoogleSheetsWithOAuthPopup();
      if (result.success) {
        setStatusBanner({
          type: 'success',
          message: result.message,
        });
        await loadSyncData();
      } else {
        setStatusBanner({
          type: 'error',
          message: result.message,
        });
      }
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: err.message || 'Failed to connect Google Sheets OAuth.',
      });
    } finally {
      setConnectingOAuth(false);
    }
  };

  const handleFullSyncNow = async () => {
    if (!currentUser) return;
    setSyncingAll(true);
    setStatusBanner(null);
    try {
      const result = await triggerFullDatabaseSyncToSheets({
        uid: currentUser.uid,
        email: currentUser.email,
        role: currentUser.role,
      });
      setStatusBanner({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
      await loadSyncData();
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: `Full sync error: ${err.message}`,
      });
    } finally {
      setSyncingAll(false);
    }
  };

  const handleRetrySync = async () => {
    if (!currentUser) return;
    setRetrying(true);
    setStatusBanner(null);
    try {
      const result = await retrySheetsSync({
        uid: currentUser.uid,
        email: currentUser.email,
        role: currentUser.role,
      });
      setStatusBanner({
        type: result.success ? 'success' : 'error',
        message: result.message,
      });
      await loadSyncData();
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: `Retry sync error: ${err.message}`,
      });
    } finally {
      setRetrying(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const bookings = await fetchAdminBookings();
      exportBookingsToCSV(bookings.map((b) => b.raw || b));
    } catch (err: any) {
      setStatusBanner({
        type: 'error',
        message: `Export error: ${err.message}`,
      });
    } finally {
      setExporting(false);
    }
  };

  const isConnected = Boolean(backendStatus?.configured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            Google Sheets Database Synchronization
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Spreadsheet:{' '}
            <span className="font-semibold text-slate-700">
              {backendStatus?.spreadsheetTitle || 'B.L. Diagnostic Center - Website Database'}
            </span>
            {backendStatus?.spreadsheetIdMasked && (
              <span className="ml-2 font-mono text-[11px] text-slate-500">
                (ID: {backendStatus.spreadsheetIdMasked})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadSyncData}
            disabled={loading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            type="button"
            onClick={handleConnectOAuth}
            disabled={connectingOAuth}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Link2 className="w-3.5 h-3.5" />
            {connectingOAuth
              ? 'Connecting Google Sheets...'
              : isConnected
              ? 'Reconnect Google Sheets'
              : 'Connect Google Sheets'}
          </button>

          <button
            type="button"
            onClick={handleFullSyncNow}
            disabled={syncingAll}
            className="bg-[#0F294A] hover:bg-[#16365D] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Layers className={`w-3.5 h-3.5 ${syncingAll ? 'animate-spin' : ''}`} />
            {syncingAll ? 'Syncing All Tables...' : 'Sync Now'}
          </button>

          <button
            type="button"
            onClick={handleRetrySync}
            disabled={retrying}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
            {retrying ? 'Retrying...' : 'Retry Failed Syncs'}
          </button>

          {backendStatus?.spreadsheetUrl && (
            <a
              href={backendStatus.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Sheet
            </a>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {statusBanner && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
            statusBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {statusBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{statusBanner.message}</div>
        </div>
      )}

      {/* Sync Health Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Connection Status
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-xl font-black ${
                isConnected ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isConnected
                ? `Connected (${backendStatus?.authMode === 'SERVICE_ACCOUNT' ? 'Service Account' : 'Google OAuth'})`
                : 'Not Connected'}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              {isConnected
                ? 'Auto-syncing Users, Bookings, Patients, Reports & Leads'
                : backendStatus?.reason ||
                  'Click "Connect Google Sheets" or configure Service Account in .env'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Processed Records
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-900">
              {syncState?.totalSynced ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Last Sync:{' '}
              {syncState?.lastSyncTimestamp
                ? new Date(syncState.lastSyncTimestamp).toLocaleString()
                : 'None yet'}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Failed Syncs
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                (syncState?.failedCount ?? 0) > 0
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span
              className={`text-2xl font-black ${
                (syncState?.failedCount ?? 0) > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {syncState?.failedCount ?? 0}
            </span>
            <p className="text-[11px] text-slate-400 mt-1">
              Logged in Sync_Log with retry support
            </p>
          </div>
        </div>
      </div>

      {/* Official Worksheets List */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Configured Database Worksheets ({OFFICIAL_WORKSHEET_TABS.length} Tabs)
        </h3>
        <div className="flex flex-wrap gap-2">
          {OFFICIAL_WORKSHEET_TABS.map((tab) => (
            <span
              key={tab}
              className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-mono text-[11px] font-semibold"
            >
              {tab}
            </span>
          ))}
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
            Download a formatted CSV matching official laboratory column headers (Booking ID, Patient, Phone, Tests Ordered, Amount, Status, and Home Address).
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={exporting}
          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap cursor-pointer"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {exporting ? 'Generating...' : 'Download Formatted CSV'}
        </button>
      </div>

      {/* Google Apps Script Webhook Manager & Test Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-700" />
              Google Apps Script Webhook Integration
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Target Spreadsheet: <strong>18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestAppsScript}
              disabled={testingAppsScript}
              className="bg-[#0F294A] hover:bg-[#16365D] text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingAppsScript ? 'animate-spin' : ''}`} />
              {testingAppsScript ? 'Testing Webhook...' : 'Test Apps Script Connection'}
            </button>

            <button
              type="button"
              onClick={() => setShowScriptModal(true)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-600" />
              View / Copy Apps Script Code
            </button>
          </div>
        </div>

        {appsScriptStatus && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              appsScriptStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            {appsScriptStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 flex-1">
              <span className="font-bold block">
                {appsScriptStatus.success ? 'Webhook Connected' : 'Webhook Notice'}
              </span>
              <p className="text-[11px] leading-relaxed">{appsScriptStatus.message}</p>
              {appsScriptStatus.isMissingDoPost && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowScriptModal(true)}
                    className="inline-flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Code2 className="w-3 h-3" />
                    Open Script Code & Setup Steps ↗
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Script Code Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-emerald-700" />
                  Google Apps Script (Code.gs)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Paste this into Google Apps Script to enable instant two-way writing to spreadsheet 18ar...6-2E.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800 block">Quick 3-Step Setup:</span>
              <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                <li>
                  Open your Google Sheet:{' '}
                  <a
                    href="https://docs.google.com/spreadsheets/d/18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline font-bold"
                  >
                    Open Sheet ↗
                  </a>
                </li>
                <li>In Google Sheets menu, click <strong>Extensions → Apps Script</strong>.</li>
                <li>Replace all content with the code below and click <strong>Deploy → New Deployment → Web app</strong> (Execute as: <strong>Me</strong>, Access: <strong>Anyone</strong>).</li>
              </ol>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[11px] leading-relaxed">
              <pre>{APPS_SCRIPT_CODE_SNIPPET}</pre>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500">
                File: <code>google-apps-script/Code.gs</code>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(APPS_SCRIPT_CODE_SNIPPET);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedScript ? 'Copied to Clipboard!' : 'Copy Entire Script'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowScriptModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync Log History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Sync_Log Audit History
          </h3>
          <span className="text-[11px] text-slate-400">Latest operations</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Entity / Tab</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Sync Event Details</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Retry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Checking sync logs...
                  </td>
                </tr>
              ) : !syncState || syncState.syncHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No sync log records found. Automatic sync runs on user registration, login, booking, patient creation, and report metadata updates.
                  </td>
                </tr>
              ) : (
                syncState.syncHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700">
                      {item.entityType || 'Bookings'}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {item.operation || 'SYNC'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      <div>{item.details}</div>
                      {item.errorMessage && (
                        <div className="text-[11px] text-rose-600 mt-0.5">
                          Error: {item.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          item.status === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === 'FAILED' && (
                        <button
                          type="button"
                          onClick={handleRetrySync}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                        >
                          Retry
                        </button>
                      )}
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
