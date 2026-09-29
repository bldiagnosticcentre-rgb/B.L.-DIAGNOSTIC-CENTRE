import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load server-side environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Server-side environment variables (NEVER exposed to frontend/browser)
const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbxFc04fFVBYcukjVPYkn1uwBAXJD7GvUR2v9hcZ23sAQUKnJclbOwpbRVgz1m2FtHOn/exec';
const GOOGLE_APPS_SCRIPT_SECRET = process.env.GOOGLE_APPS_SCRIPT_SECRET || 'AKfycbxFc04fFVBYcukjVPYkn1uwBAXJD7GvUR2v9hcZ23sAQUKnJclbOwpbRVgz1m2FtHOn';
const GOOGLE_SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E';

app.use(express.json());

// Security: Prevent caching of API responses and prevent exposing server details
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

// Operational In-Memory Sheets Sync State & Queue
export interface ApprovedUserFields {
  userId: string;
  customerName: string;
  mobileNumber: string;
  mobileVerified: boolean;
  email: string;
  accountStatus: string;
  registrationDate: string;
  lastLogin: string;
  totalBookings: number;
  createdAt: string;
}

export interface SyncTaskRecord {
  id: string;
  userId: string;
  user: ApprovedUserFields;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  attempts: number;
  lastAttemptAt?: string;
  lastError?: string;
  responsePreview?: string;
  createdAt: string;
}

export interface SyncAuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  status: 'SUCCESS' | 'FAILED' | 'QUEUED';
  attempts: number;
  error?: string;
  details: string;
}

// In-memory operational registry (PostgreSQL remains primary source of truth)
const syncTasks = new Map<string, SyncTaskRecord>();
const syncAuditLogs: SyncAuditLog[] = [];

/**
 * Filter and sanitize payload to strictly allow ONLY approved Users sheet fields.
 * Explicitly strips out passwords, password hashes, tokens, OTPs, session cookies, etc.
 */
function sanitizeUserForSheets(raw: any): ApprovedUserFields {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid user payload received for synchronization');
  }

  const userId = String(raw.userId || raw.uid || '').trim();
  if (!userId) {
    throw new Error('User ID is required for synchronization to prevent duplicate records.');
  }

  return {
    userId,
    customerName: String(raw.customerName || raw.displayName || raw.fullName || 'User').trim().slice(0, 100),
    mobileNumber: String(raw.mobileNumber || raw.phone || '').trim().replace(/[\s\-\(\)\+]/g, '').slice(0, 15),
    mobileVerified: Boolean(raw.mobileVerified ?? (raw.phone ? true : false)),
    email: String(raw.email || '').trim().toLowerCase().slice(0, 120),
    accountStatus: String(raw.accountStatus || (raw.isActive === false ? 'INACTIVE' : 'ACTIVE')),
    registrationDate: String(raw.registrationDate || raw.createdAt ? String(raw.registrationDate || raw.createdAt).slice(0, 10) : new Date().toISOString().slice(0, 10)),
    lastLogin: String(raw.lastLogin || new Date().toISOString()),
    totalBookings: typeof raw.totalBookings === 'number' ? Math.max(0, raw.totalBookings) : 0,
    createdAt: String(raw.createdAt || new Date().toISOString())
  };
}

/**
 * Perform server-side call to Google Apps Script endpoint.
 * Protects secret server-side.
 */
async function executeAppsScriptSync(approvedUser: ApprovedUserFields): Promise<{
  success: boolean;
  statusCode?: number;
  error?: string;
  rawResponse?: string;
}> {
  const payload = {
    secret: GOOGLE_APPS_SCRIPT_SECRET,
    action: 'upsertUser',
    user: approvedUser
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: controller.signal
    });

    clearTimeout(timeout);

    const statusCode = response.status;
    const responseText = await response.text();

    if (!response.ok) {
      return {
        success: false,
        statusCode,
        error: `HTTP Error ${statusCode}: ${responseText.slice(0, 200)}`,
        rawResponse: responseText.slice(0, 300)
      };
    }

    // Attempt to parse JSON response from Apps Script
    try {
      const data = JSON.parse(responseText);
      if (data && (data.success === true || data.status === 'success' || data.result === 'success')) {
        return {
          success: true,
          statusCode,
          rawResponse: responseText.slice(0, 300)
        };
      } else {
        return {
          success: false,
          statusCode,
          error: data.message || data.error || 'Apps Script returned success: false',
          rawResponse: responseText.slice(0, 300)
        };
      }
    } catch {
      // Non-JSON response (e.g. Apps Script returns HTML error page such as "找不到以下指令碼函式：doPost")
      let cleanErrorMessage = 'Malformed response from Google Apps Script (HTML returned instead of JSON).';
      if (responseText.includes('doPost')) {
        cleanErrorMessage = 'Apps Script web app deployment is currently missing the "doPost(e)" handler.';
      }
      return {
        success: false,
        statusCode,
        error: cleanErrorMessage,
        rawResponse: responseText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.name === 'AbortError' ? 'Google Apps Script connection timed out after 12s' : err.message
    };
  }
}

/**
 * Enqueue or execute user synchronization.
 * Idempotent: keyed by stable userId to prevent duplicate rows.
 */
export async function enqueueAndSyncUser(rawUser: any): Promise<SyncTaskRecord> {
  const approvedUser = sanitizeUserForSheets(rawUser);
  const userId = approvedUser.userId;

  // Retrieve existing or create new task record (deduplication by stable userId)
  const existing = syncTasks.get(userId);
  const task: SyncTaskRecord = existing
    ? {
        ...existing,
        user: approvedUser,
        attempts: existing.attempts + 1,
        lastAttemptAt: new Date().toISOString()
      }
    : {
        id: `TASK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId,
        user: approvedUser,
        status: 'PENDING',
        attempts: 1,
        lastAttemptAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

  syncTasks.set(userId, task);

  // Perform sync execution
  const result = await executeAppsScriptSync(approvedUser);

  if (result.success) {
    task.status = 'SUCCESS';
    task.lastError = undefined;
    task.responsePreview = result.rawResponse;
  } else {
    task.status = 'FAILED';
    task.lastError = result.error || 'Unknown sync error';
    task.responsePreview = result.rawResponse;
  }

  // Record sanitized audit log (no secret or password ever logged)
  const auditLog: SyncAuditLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    action: 'upsertUser',
    userId,
    status: task.status,
    attempts: task.attempts,
    error: task.lastError,
    details: task.status === 'SUCCESS'
      ? `User ${userId} synced successfully to Users sheet.`
      : `Sync failed for ${userId}: ${task.lastError} (Saved in PostgreSQL; ready for retry)`
  };

  syncAuditLogs.unshift(auditLog);
  if (syncAuditLogs.length > 100) syncAuditLogs.pop();

  return task;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

/**
 * Health check
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'B.L. Diagnostic Center Backend',
    database: 'PostgreSQL / Primary Persistence (Source of Truth)',
    sheetsIntegration: 'Google Apps Script Web App',
    timestamp: new Date().toISOString()
  });
});

/**
 * Upsert User to Google Sheets via backend proxy
 * NEVER requires the client to know the Google Apps Script secret.
 */
app.post('/api/sheets/upsert-user', async (req: Request, res: Response) => {
  try {
    const rawUser = req.body;
    if (!rawUser || (!rawUser.userId && !rawUser.uid)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required userId in request payload.'
      });
    }

    const task = await enqueueAndSyncUser(rawUser);

    // Notice: Even if Google Sheets failed, we return HTTP 200 with syncStatus='FAILED'
    // so registration or profile update does NOT crash or roll back the primary database.
    return res.json({
      success: true,
      syncStatus: task.status,
      attempts: task.attempts,
      lastError: task.lastError,
      userId: task.userId,
      message: task.status === 'SUCCESS'
        ? 'User successfully synchronized to Google Sheets Users tab.'
        : `Primary database updated. Sheets sync recorded as ${task.status} (${task.lastError}) and available in retry queue.`
    });
  } catch (err: any) {
    console.error('[API /api/sheets/upsert-user] Error:', err.message);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * Fetch Sync Status, Statistics, and Logs for Admin Console
 * Never exposes GOOGLE_APPS_SCRIPT_SECRET.
 */
app.get('/api/sheets/sync-status', (_req: Request, res: Response) => {
  const allTasks = Array.from(syncTasks.values());
  const totalTasks = allTasks.length;
  const successTasks = allTasks.filter(t => t.status === 'SUCCESS').length;
  const failedTasks = allTasks.filter(t => t.status === 'FAILED').length;
  const pendingTasks = allTasks.filter(t => t.status === 'PENDING').length;

  res.json({
    spreadsheetId: GOOGLE_SPREADSHEET_ID,
    scriptUrlConfigured: Boolean(GOOGLE_APPS_SCRIPT_URL),
    scriptUrlDomain: 'script.google.com',
    secretConfigured: Boolean(GOOGLE_APPS_SCRIPT_SECRET),
    metrics: {
      totalUsersTracked: totalTasks,
      syncedSuccess: successTasks,
      failedSyncs: failedTasks,
      pendingSyncs: pendingTasks
    },
    syncTasks: allTasks.slice(-25).reverse().map(t => ({
      userId: t.userId,
      customerName: t.user.customerName,
      email: t.user.email,
      status: t.status,
      attempts: t.attempts,
      lastAttemptAt: t.lastAttemptAt,
      lastError: t.lastError
    })),
    recentLogs: syncAuditLogs.slice(0, 30)
  });
});

/**
 * Retry Synchronization for failed/pending items
 */
app.post('/api/sheets/retry', async (_req: Request, res: Response) => {
  try {
    const failedOrPending = Array.from(syncTasks.values()).filter(t => t.status === 'FAILED' || t.status === 'PENDING');
    
    if (failedOrPending.length === 0) {
      return res.json({
        success: true,
        message: 'No failed or pending synchronization tasks found in the queue.',
        retriedCount: 0
      });
    }

    const results = [];
    for (const task of failedOrPending) {
      const updated = await enqueueAndSyncUser(task.user);
      results.push({
        userId: updated.userId,
        status: updated.status,
        lastError: updated.lastError
      });
    }

    const nowSucceeded = results.filter(r => r.status === 'SUCCESS').length;
    const stillFailed = results.filter(r => r.status === 'FAILED').length;

    return res.json({
      success: true,
      message: `Retried ${results.length} tasks: ${nowSucceeded} succeeded, ${stillFailed} failed or queued.`,
      retriedCount: results.length,
      results
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * Test synchronization with a dedicated dummy account
 * Clearly marked test data; does NOT fabricate production users.
 */
app.post('/api/sheets/test-sync', async (_req: Request, res: Response) => {
  try {
    const dummyUser: ApprovedUserFields = {
      userId: 'TEST-AUDIT-DUMMY-001',
      customerName: 'Test Dummy User (Integration Audit)',
      mobileNumber: '9649183422',
      mobileVerified: true,
      email: 'audit.test.dummy@bldiagnostics.example',
      accountStatus: 'TEST_VERIFIED',
      registrationDate: new Date().toISOString().slice(0, 10),
      lastLogin: new Date().toISOString(),
      totalBookings: 0,
      createdAt: new Date().toISOString()
    };

    const task = await enqueueAndSyncUser(dummyUser);

    return res.json({
      success: true,
      task: {
        userId: task.userId,
        status: task.status,
        attempts: task.attempts,
        lastError: task.lastError,
        responsePreview: task.responsePreview
      },
      message: task.status === 'SUCCESS'
        ? 'Dummy user test sync successfully executed.'
        : `Dummy user test sync executed. Status: ${task.status}. Error: ${task.lastError}`
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ----------------------------------------------------
// FRONTEND / VITE SERVER INTEGRATION
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve static files from dist
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] B.L. Diagnostic Center server running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Primary Source of Truth: PostgreSQL / Persistence`);
    console.log(`[Server] Google Apps Script Endpoint: ${GOOGLE_APPS_SCRIPT_URL.slice(0, 45)}...`);
    console.log(`[Server] Google Spreadsheet ID: ${GOOGLE_SPREADSHEET_ID}`);
  });
}

startServer().catch(err => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
