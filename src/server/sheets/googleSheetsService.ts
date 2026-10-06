import {
  getGoogleSheetsAccessToken,
  getSpreadsheetId,
  getGoogleSheetsAuthStatus,
  setRuntimeSpreadsheetId,
  SPREADSHEET_TITLE,
} from './googleSheetsAuth';
import {
  CanonicalTabName,
  WorksheetTabName,
  OFFICIAL_CANONICAL_TABS,
  WORKSHEET_HEADERS,
  normalizeTabName,
  mapEntityToSheetRow,
} from './googleSheetsMapper';

/**
 * Core Google Sheets REST v4 Service (`googleSheetsService`)
 *
 * Implements:
 * - 9 Required Tabs creation & reuse:
 *   1. Users
 *   2. Patients
 *   3. Bookings
 *   4. Home Collection
 *   5. Leads
 *   6. Tests
 *   7. Packages
 *   8. Time Slots
 *   9. Sync Logs
 * - Strict duplicate prevention with unique ID lookup before insert
 * - In-place row updates when record already exists
 * - Never fails user registration, booking, or leads if Sheets is offline
 */

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';

/**
 * Cache of known sheet titles present in the active spreadsheet
 * to easily route between variants like "Home Collection" vs "Home_Collection".
 */
const activeSheetTitlesCache = new Map<string, string>();

/**
 * Find or create the spreadsheet "B.L. Diagnostic Center - Website Database"
 * if GOOGLE_SHEETS_SPREADSHEET_ID is not yet configured.
 */
export async function findOrCreateDatabaseSpreadsheet(overrideToken?: string): Promise<string> {
  const existingId = getSpreadsheetId();
  if (existingId) {
    return existingId;
  }

  const token = await getGoogleSheetsAccessToken(overrideToken);

  // 1. Search Google Drive for an existing spreadsheet with the official title
  try {
    const queryStr = `name = '${SPREADSHEET_TITLE.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`;
    const driveRes = await fetch(
      `${DRIVE_API_BASE}?q=${encodeURIComponent(queryStr)}&fields=files(id,name)&pageSize=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (driveRes.ok) {
      const driveData = (await driveRes.json()) as { files?: { id: string; name: string }[] };
      if (driveData.files && driveData.files.length > 0 && driveData.files[0].id) {
        const foundId = driveData.files[0].id;
        setRuntimeSpreadsheetId(foundId);
        return foundId;
      }
    }
  } catch (e) {
    console.warn('Could not search Drive for existing spreadsheet, creating new spreadsheet:', e);
  }

  // 2. Create a new Google Spreadsheet with all official 9 tabs, frozen row 1
  const createRes = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SPREADSHEET_TITLE,
      },
      sheets: OFFICIAL_CANONICAL_TABS.map((tabTitle) => ({
        properties: {
          title: tabTitle,
          gridProperties: {
            frozenRowCount: 1,
            rowCount: 1000,
            columnCount: Math.max(WORKSHEET_HEADERS[tabTitle].length + 2, 14),
          },
        },
      })),
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => '');
    throw new Error(`Failed to create Google Spreadsheet (${createRes.status}): ${errText.slice(0, 200)}`);
  }

  const createdData = (await createRes.json()) as { spreadsheetId: string };
  if (!createdData.spreadsheetId) {
    throw new Error('Google Sheets API did not return a spreadsheetId.');
  }

  setRuntimeSpreadsheetId(createdData.spreadsheetId);
  return createdData.spreadsheetId;
}

/**
 * Resolves the actual tab name in the spreadsheet for a requested tab.
 * If the user's sheet already has "Home_Collection" or "Home Collection",
 * it reuses that exact tab name instead of creating a duplicate.
 */
export async function resolveExistingTabTitle(
  spreadsheetId: string,
  rawTab: WorksheetTabName,
  token: string
): Promise<string> {
  const canonical = normalizeTabName(rawTab) as CanonicalTabName;
  const cacheKey = `${spreadsheetId}:${canonical}`;
  if (activeSheetTitlesCache.has(cacheKey)) {
    return activeSheetTitlesCache.get(cacheKey)!;
  }

  try {
    const metaRes = await fetch(
      `${SHEETS_API_BASE}/${spreadsheetId}?fields=sheets.properties(sheetId,title)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (metaRes.ok) {
      const meta = (await metaRes.json()) as { sheets?: { properties?: { title?: string } }[] };
      const titles = (meta.sheets || []).map((s) => s.properties?.title || '').filter(Boolean);

      for (const t of titles) {
        const norm = normalizeTabName(t);
        activeSheetTitlesCache.set(`${spreadsheetId}:${norm}`, t);
      }

      if (activeSheetTitlesCache.has(cacheKey)) {
        return activeSheetTitlesCache.get(cacheKey)!;
      }
    }
  } catch {}

  return canonical;
}

/**
 * Initialize Google Sheets: ensures the spreadsheet and the official 9 worksheet tabs exist,
 * writes Row 1 column headers, freezes Row 1, bolds the header cells, and sets readable column widths.
 * If a tab already exists (e.g. "Home Collection" or "Home_Collection"), it REUSES it.
 */
export async function initializeGoogleSheets(overrideToken?: string): Promise<{
  success: boolean;
  spreadsheetId?: string;
  spreadsheetTitle: string;
  ensuredTabs: string[];
  error?: string;
}> {
  const spreadsheetId = getSpreadsheetId() || (await findOrCreateDatabaseSpreadsheet(overrideToken));
  const token = await getGoogleSheetsAccessToken(overrideToken);

  // 1. Fetch spreadsheet metadata to inspect existing sheets and their numeric sheetIds
  const metaRes = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}?fields=sheets.properties(sheetId,title,gridProperties.frozenRowCount)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!metaRes.ok) {
    const errText = await metaRes.text().catch(() => '');
    throw new Error(`Failed to read spreadsheet metadata (${metaRes.status}): ${errText.slice(0, 200)}`);
  }

  const metaJson = (await metaRes.json()) as {
    sheets?: { properties?: { sheetId?: number; title?: string; gridProperties?: { frozenRowCount?: number } } }[];
  };

  const existingTitleToId = new Map<string, number>();
  const normalizedExisting = new Map<string, string>(); // normalized -> actual sheet title

  for (const s of metaJson.sheets || []) {
    if (s.properties?.title && typeof s.properties?.sheetId === 'number') {
      const title = s.properties.title;
      existingTitleToId.set(title, s.properties.sheetId);
      const norm = normalizeTabName(title);
      normalizedExisting.set(norm, title);
      activeSheetTitlesCache.set(`${spreadsheetId}:${norm}`, title);
    }
  }

  // Determine missing tabs from the 9 official canonical tabs
  const missingTabs: CanonicalTabName[] = [];
  for (const canonicalTab of OFFICIAL_CANONICAL_TABS) {
    if (!normalizedExisting.has(canonicalTab)) {
      missingTabs.push(canonicalTab);
    }
  }

  // 2. Batch create any missing tabs with frozenRowCount: 1
  if (missingTabs.length > 0) {
    const batchRes = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: missingTabs.map((title) => ({
          addSheet: {
            properties: {
              title,
              gridProperties: { frozenRowCount: 1 },
            },
          },
        })),
      }),
    });

    if (!batchRes.ok) {
      const errText = await batchRes.text().catch(() => '');
      throw new Error(`Failed to create worksheet tabs (${batchRes.status}): ${errText.slice(0, 200)}`);
    }

    const batchJson = (await batchRes.json()) as {
      replies?: { addSheet?: { properties?: { sheetId?: number; title?: string } } }[];
    };
    for (const reply of batchJson.replies || []) {
      const p = reply.addSheet?.properties;
      if (p?.title && typeof p?.sheetId === 'number') {
        existingTitleToId.set(p.title, p.sheetId);
        const norm = normalizeTabName(p.title);
        normalizedExisting.set(norm, p.title);
        activeSheetTitlesCache.set(`${spreadsheetId}:${norm}`, p.title);
      }
    }
  }

  // 3. Ensure Row 1 headers on all 9 official tabs via values:batchUpdate
  const headerData = OFFICIAL_CANONICAL_TABS.map((canonicalTab) => {
    const actualTitle = normalizedExisting.get(canonicalTab) || canonicalTab;
    return {
      range: `${actualTitle}!A1`,
      majorDimension: 'ROWS',
      values: [WORKSHEET_HEADERS[canonicalTab]],
    };
  });

  await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: headerData,
    }),
  });

  // 4. Format headers (Freeze Row 1, Bold header text, Navy background #0F294A with white text, readable column width 165px)
  const formatRequests: any[] = [];
  for (const canonicalTab of OFFICIAL_CANONICAL_TABS) {
    const actualTitle = normalizedExisting.get(canonicalTab) || canonicalTab;
    const sheetId = existingTitleToId.get(actualTitle);
    if (typeof sheetId !== 'number') continue;
    const colCount = WORKSHEET_HEADERS[canonicalTab].length;

    formatRequests.push(
      {
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: { frozenRowCount: 1 },
          },
          fields: 'gridProperties.frozenRowCount',
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 0,
            endRowIndex: 1,
            startColumnIndex: 0,
            endColumnIndex: colCount,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.06, green: 0.16, blue: 0.29 }, // Brand Navy #0F294A
              textFormat: {
                bold: true,
                foregroundColor: { red: 1, green: 1, blue: 1 },
              },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
      {
        updateDimensionProperties: {
          range: {
            sheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: colCount,
          },
          properties: {
            pixelSize: 165,
          },
          fields: 'pixelSize',
        },
      }
    );
  }

  if (formatRequests.length > 0) {
    await fetch(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: formatRequests }),
    }).catch(() => {});
  }

  return {
    success: true,
    spreadsheetId,
    spreadsheetTitle: SPREADSHEET_TITLE,
    ensuredTabs: OFFICIAL_CANONICAL_TABS,
  };
}

export async function ensureAllWorksheetsExist(): Promise<{
  success: boolean;
  ensuredTabs: string[];
  spreadsheetId?: string;
  error?: string;
}> {
  const authStatus = getGoogleSheetsAuthStatus();
  if (!authStatus.configured && !authStatus.oauthConnected) {
    return {
      success: false,
      ensuredTabs: [],
      error:
        'Google Sheets credentials are not configured. Configure GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY in .env or connect via Google OAuth in /admin/google-sheets.',
    };
  }

  return initializeGoogleSheets();
}

/**
 * Upsert (Update if ID exists, Append if new) records into a Google Sheet tab.
 *
 * DUPLICATE PROTECTION:
 * - For `Users`: inspects Column A (`User ID`) and Column C (`Mobile Number`).
 *   If user exists by User ID or Mobile Number -> UPDATE in place.
 * - For all other tabs (`Patients`, `Bookings`, `Home Collection`, `Leads`, `Tests`, `Packages`, `Time Slots`, `Sync Logs`):
 *   inspects Column A (Primary ID). If exists -> UPDATE in place; if not -> APPEND new row.
 * - Never creates duplicate rows upon retry.
 */
export async function upsertRecordsToWorksheet(
  rawTab: WorksheetTabName,
  records: Record<string, any>[],
  overrideToken?: string
): Promise<{
  syncedCount: number;
  updatedCount: number;
  appendedCount: number;
}> {
  if (!records || records.length === 0) {
    return { syncedCount: 0, updatedCount: 0, appendedCount: 0 };
  }

  let spreadsheetId = getSpreadsheetId();
  const token = await getGoogleSheetsAccessToken(overrideToken);
  if (!spreadsheetId) {
    spreadsheetId = await findOrCreateDatabaseSpreadsheet(token);
  }

  const canonicalTab = normalizeTabName(rawTab) as CanonicalTabName;
  const actualTab = await resolveExistingTabTitle(spreadsheetId, rawTab, token);

  // Read Column A (and Column C for Users) to check existing IDs
  const keyRange = canonicalTab === 'Users' ? `${actualTab}!A:C` : `${actualTab}!A:A`;
  let keyRes = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(keyRange)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  let existingRows: string[][] = [];
  if (keyRes.ok) {
    const keyJson = (await keyRes.json()) as { values?: string[][] };
    existingRows = keyJson.values || [];
  } else {
    // Tab might not exist yet; initialize sheets and retry
    await initializeGoogleSheets(token);
    const retryRes = await fetch(
      `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(keyRange)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (retryRes.ok) {
      const keyJson = (await retryRes.json()) as { values?: string[][] };
      existingRows = keyJson.values || [];
    }
  }

  // Ensure Header Row exists if sheet is completely empty
  if (existingRows.length === 0) {
    const headers = WORKSHEET_HEADERS[canonicalTab] || [];
    if (headers.length > 0) {
      await fetch(
        `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(
          `${actualTab}!A1`
        )}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            range: `${actualTab}!A1`,
            majorDimension: 'ROWS',
            values: [headers],
          }),
        }
      );
      existingRows = [headers];
    }
  }

  const keyToRowNumber = new Map<string, number>();
  existingRows.forEach((r, idx) => {
    if (idx === 0 || !r) return;
    const rowNumber = idx + 1; // 1-indexed sheet row
    const colA = r[0] ? String(r[0]).trim() : '';
    const colC = r[2] ? String(r[2]).trim() : '';
    if (colA) keyToRowNumber.set(colA, rowNumber);
    if (canonicalTab === 'Users' && colC) keyToRowNumber.set(colC, rowNumber);
  });

  const rowsToAppend: (string | number)[][] = [];
  const rowsToUpdate: { range: string; values: (string | number)[][] }[] = [];

  for (const record of records) {
    const mappedRow = mapEntityToSheetRow(canonicalTab, record);
    const primaryId = String(mappedRow[0] || '').trim();
    const mobileId = canonicalTab === 'Users' ? String(mappedRow[2] || '').trim() : '';
    if (!primaryId && !mobileId) continue;

    const existingRowIndex =
      (mobileId ? keyToRowNumber.get(mobileId) : undefined) ??
      (primaryId ? keyToRowNumber.get(primaryId) : undefined);

    if (existingRowIndex) {
      rowsToUpdate.push({
        range: `${actualTab}!A${existingRowIndex}`,
        values: [mappedRow],
      });
    } else {
      rowsToAppend.push(mappedRow);
      const newRowNum = existingRows.length + rowsToAppend.length;
      if (primaryId) keyToRowNumber.set(primaryId, newRowNum);
      if (mobileId) keyToRowNumber.set(mobileId, newRowNum);
    }
  }

  // Execute in-place updates via values:batchUpdate
  if (rowsToUpdate.length > 0) {
    const updateRes = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: rowsToUpdate,
      }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text().catch(() => '');
      throw new Error(`Google Sheets batchUpdate failed on ${actualTab} (${updateRes.status}): ${errText.slice(0, 200)}`);
    }
  }

  // Execute appends for new records
  if (rowsToAppend.length > 0) {
    const appendRes = await fetch(
      `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(
        `${actualTab}!A1`
      )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `${actualTab}!A1`,
          majorDimension: 'ROWS',
          values: rowsToAppend,
        }),
      }
    );

    if (!appendRes.ok) {
      const errText = await appendRes.text().catch(() => '');
      throw new Error(`Google Sheets append failed on ${actualTab} (${appendRes.status}): ${errText.slice(0, 200)}`);
    }
  }

  return {
    syncedCount: rowsToUpdate.length + rowsToAppend.length,
    updatedCount: rowsToUpdate.length,
    appendedCount: rowsToAppend.length,
  };
}

/**
 * Dispatches sync payloads to Google Apps Script Web App (GOOGLE_APPS_SCRIPT_URL).
 * Provides a lightweight serverless connection to Google Sheets without requiring
 * Google Cloud service account keys.
 */
export async function syncToAppsScriptWebHook(params: {
  action: 'upsertUser' | 'syncBooking' | 'syncPatient' | 'syncLead' | 'ping';
  data?: Record<string, any>;
}): Promise<{ success: boolean; action?: string; error?: string; rawResponse?: string }> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET?.trim() || 'bl-diagnostic-secret-2024';

  if (!url || url.includes('placeholder')) {
    return { success: false, error: 'GOOGLE_APPS_SCRIPT_URL not configured' };
  }

  try {
    const payload = {
      secret,
      action: params.action,
      ...(params.data || {}),
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = JSON.parse(text);
    } catch {
      if (text.includes('doPost') || text.includes('指令碼函式')) {
        return {
          success: false,
          error:
            'Google Apps Script deployment is missing function "doPost(e)". Please paste our Code.gs script in your Google Apps Script editor and click Deploy > New Deployment > Web app > Anyone.',
          rawResponse: text.slice(0, 300),
        };
      }
      return {
        success: false,
        error: `Apps Script returned non-JSON response (${res.status}): ${text.slice(0, 150)}`,
        rawResponse: text.slice(0, 300),
      };
    }

    if (json && (json.success === true || json.status === 'ok')) {
      return { success: true, action: json.action || params.action };
    }
    return {
      success: false,
      error: json?.error || json?.message || 'Apps Script sync failed',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to reach Google Apps Script endpoint',
    };
  }
}

/**
 * Synchronize user registration to Google Sheets Users tab.
 * Uses a resilient multi-tier strategy:
 * 1. Apps Script Webhook (if GOOGLE_APPS_SCRIPT_URL is configured)
 * 2. Direct Google Sheets API v4 (if Service Account or OAuth token is available)
 */
export async function syncUserRegistrationToUsersSheet(
  userRecord: Record<string, any>,
  token?: string
) {
  const cleanMobile = String(
    userRecord.phone || userRecord.mobile_number || userRecord.mobileNumber || ''
  )
    .replace(/\D/g, '')
    .slice(-10);
  const userId =
    userRecord.userId || userRecord.user_id || (cleanMobile ? `USER-${cleanMobile}` : `USER-${Date.now()}`);
  const name =
    userRecord.fullName || userRecord.name || userRecord.displayName || userRecord.customerName || 'Valued Patient';
  const now = new Date().toISOString();

  let appsScriptSuccess = false;
  let directApiSuccess = false;
  let lastError: string | null = null;

  // 1. Dispatch to Apps Script Webhook if URL is configured
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    try {
      const asResult = await syncToAppsScriptWebHook({
        action: 'upsertUser',
        data: {
          user: {
            userId,
            customerName: name,
            mobileNumber: cleanMobile ? `+91${cleanMobile}` : (userRecord.phone || ''),
            mobileVerified: userRecord.is_verified ?? userRecord.isVerified ?? true,
            email: userRecord.email || '',
            accountStatus: userRecord.accountStatus || (userRecord.is_active === false ? 'DEACTIVATED' : 'ACTIVE'),
            registrationDate: userRecord.registrationDate || userRecord.created_at || userRecord.createdAt || now,
            lastLogin: userRecord.last_login_at || userRecord.lastLogin || now,
            totalBookings: userRecord.totalBookings || 0,
            createdAt: userRecord.created_at || userRecord.createdAt || now,
            updatedAt: now,
          },
        },
      });

      if (asResult.success) {
        appsScriptSuccess = true;
        console.log(`[Google Sheets] User synced to sheet via Apps Script: ${userId} (${name})`);
      } else {
        lastError = asResult.error || 'Apps Script sync returned error';
        console.warn(`[Google Sheets] Apps Script sync note:`, asResult.error);
      }
    } catch (err: any) {
      lastError = err?.message || 'Apps script exception';
      console.warn(`[Google Sheets] Apps Script dispatch error:`, err?.message);
    }
  }

  // 2. Dispatch to Direct Google Sheets API if credentials or OAuth token available
  const authStatus = getGoogleSheetsAuthStatus();
  if (authStatus.configured || authStatus.oauthConnected || token) {
    try {
      const apiResult = await upsertRecordsToWorksheet('Users', [userRecord], token);
      directApiSuccess = true;
      console.log(`[Google Sheets] User synced via direct Google Sheets API: ${userId}`);
      return { success: true, method: 'DIRECT_API', apiResult, appsScriptSuccess };
    } catch (apiErr: any) {
      console.warn(`[Google Sheets] Direct Sheets API sync notice:`, apiErr?.message);
      lastError = apiErr?.message || lastError;
    }
  }

  return {
    success: appsScriptSuccess || directApiSuccess,
    appsScriptSuccess,
    directApiSuccess,
    error: (appsScriptSuccess || directApiSuccess) ? null : lastError,
  };
}

/**
 * Synchronize a patient to Google Sheets Patients tab
 */
export async function syncPatientToPatientsSheet(
  patientRecord: Record<string, any>,
  token?: string
) {
  return upsertRecordsToWorksheet('Patients', [patientRecord], token);
}

/**
 * Synchronize a booking to Google Sheets Bookings tab,
 * and if home collection, also to Home Collection tab.
 */
export async function syncBookingToBookingsSheet(
  bookingRecord: Record<string, any>,
  token?: string
) {
  const bookingResult = await upsertRecordsToWorksheet('Bookings', [bookingRecord], token);

  const colType = String(
    bookingRecord.collection_type || bookingRecord.collectionType || ''
  ).toUpperCase();

  if (colType.includes('HOME')) {
    const bookingId = bookingRecord.id || bookingRecord.booking_id || bookingRecord.booking_number;
    await upsertRecordsToWorksheet(
      'Home Collection',
      [
        {
          booking_id: bookingId,
          customer_name:
            bookingRecord.customer_name ||
            bookingRecord.patient_name ||
            bookingRecord.patient?.fullName ||
            '',
          patient_name:
            bookingRecord.patient_name ||
            bookingRecord.patient?.fullName ||
            bookingRecord.customer_name ||
            '',
          mobile_number:
            bookingRecord.mobile_number ||
            bookingRecord.phone ||
            bookingRecord.patient?.phone ||
            '',
          contact_number:
            bookingRecord.contact_number ||
            bookingRecord.phone ||
            bookingRecord.patient?.phone ||
            '',
          collection_date:
            bookingRecord.collection_date ||
            bookingRecord.appointment_date ||
            bookingRecord.booking_date ||
            '',
          time_slot: bookingRecord.time_slot || bookingRecord.timeSlot || '',
          house_flat:
            bookingRecord.house_flat ||
            bookingRecord.address?.house ||
            bookingRecord.address?.street ||
            '',
          street_area:
            bookingRecord.street_area ||
            bookingRecord.address?.area ||
            bookingRecord.address?.street ||
            'Sector 11, Pratap Nagar',
          landmark:
            bookingRecord.landmark ||
            bookingRecord.address?.landmark ||
            'Near Post Office',
          city: bookingRecord.city || bookingRecord.address?.city || 'Jaipur',
          pincode: bookingRecord.pincode || bookingRecord.address?.pincode || '302033',
          collection_status:
            bookingRecord.collection_status || bookingRecord.status || 'REQUESTED',
          assigned_to:
            bookingRecord.assigned_to ||
            bookingRecord.assigned_phlebotomist ||
            'Unassigned',
          remarks: bookingRecord.remarks || bookingRecord.notes || '',
          created_at: bookingRecord.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
      token
    ).catch(() => {});
  }

  return bookingResult;
}

/**
 * Synchronize a Lead to Google Sheets Leads tab
 */
export async function syncLeadToLeadsSheet(
  leadRecord: Record<string, any>,
  token?: string
) {
  return upsertRecordsToWorksheet('Leads', [leadRecord], token);
}

/**
 * Synchronize Time Slots to Google Sheets Time Slots tab
 */
export async function syncTimeSlotsToSheet(
  slots: Record<string, any>[],
  token?: string
) {
  return upsertRecordsToWorksheet('Time Slots', slots, token);
}

/**
 * Synchronize Tests to Google Sheets Tests tab
 */
export async function syncTests(tests: Record<string, any>[], token?: string) {
  return upsertRecordsToWorksheet('Tests', tests, token);
}

/**
 * Synchronize Packages to Google Sheets Packages tab
 */
export async function syncPackages(packages: Record<string, any>[], token?: string) {
  return upsertRecordsToWorksheet('Packages', packages, token);
}

/**
 * Fetch rows from a Google Sheet tab
 */
export async function fetchWorksheetObjects(
  tab: WorksheetTabName,
  overrideToken?: string
): Promise<Record<string, any>[]> {
  const spreadsheetId = getSpreadsheetId();
  if (!spreadsheetId) {
    throw new Error(
      'Google Sheets spreadsheet ID is not configured. Connect Google Sheets in /admin/google-sheets or set GOOGLE_SHEETS_SPREADSHEET_ID in .env.'
    );
  }

  const token = await getGoogleSheetsAccessToken(overrideToken);
  const actualTab = await resolveExistingTabTitle(spreadsheetId, tab, token);

  const res = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(`${actualTab}!A1:Z2000`)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to fetch rows from ${actualTab} (${res.status}): ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as { values?: string[][] };
  const rows = data.values || [];
  if (rows.length <= 1) return [];

  const headers = rows[0].map((h) => String(h).trim());
  const objects: Record<string, any>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => !String(cell || '').trim())) continue;
    const obj: Record<string, any> = {};
    headers.forEach((h, colIdx) => {
      if (h) {
        obj[h] = row[colIdx] !== undefined ? row[colIdx] : '';
      }
    });
    objects.push(obj);
  }

  return objects;
}
