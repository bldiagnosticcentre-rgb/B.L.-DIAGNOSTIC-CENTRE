/**
 * ==============================================================================
 * B.L. DIAGNOSTIC CENTER — OFFICIAL GOOGLE APPS SCRIPT WEB APP ENDPOINT
 * Spreadsheet ID: 18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E
 * ==============================================================================
 *
 * HOW TO DEPLOY:
 * 1. Open Google Sheets: https://docs.google.com/spreadsheets/d/18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E
 * 2. Click Extensions > Apps Script
 * 3. Replace all contents of Code.gs with this entire script.
 * 4. Click the "Save" (disk) icon.
 * 5. Click "Deploy" > "New Deployment"
 * 6. Click the gear icon next to "Select type" and choose "Web app"
 * 7. Set:
 *    - Description: "B.L. Diagnostic Sheets Sync v2"
 *    - Execute as: "Me (your email)"
 *    - Who has access: "Anyone" (CRITICAL: Must be "Anyone" so the app backend can post data)
 * 8. Click "Deploy". Grant permissions if prompted.
 * 9. Copy the Web App URL (starts with https://script.google.com/macros/s/...)
 *    and ensure it matches GOOGLE_APPS_SCRIPT_URL in your .env.
 */

var SPREADSHEET_ID = "18arurV9li6noxYN1mrJ9KsUO24tZn0YejBdMNgR6-2E";
var EXPECTED_SECRET = "bl-diagnostic-secret-2024";

/**
 * Handle incoming POST requests from the website backend.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: "Empty request payload" });
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ success: false, error: "Malformed JSON payload" });
    }

    // Verify authentication secret
    if (body.secret !== EXPECTED_SECRET) {
      return jsonResponse({ success: false, error: "Unauthorized: Invalid secret" });
    }

    var action = body.action || "upsertUser";
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    // 1. Health Ping
    if (action === "ping") {
      return jsonResponse({
        success: true,
        status: "ok",
        message: "Pong! B.L. Diagnostic Center Google Sheets Web App is connected and active.",
        spreadsheetTitle: ss.getName(),
        sheets: ss.getSheets().map(function(s) { return s.getName(); })
      });
    }

    // 2. Upsert User Registration (Users Tab)
    if (action === "upsertUser") {
      return handleUpsertUser(ss, body.user || body);
    }

    // 3. Sync Booking / Home Collection
    if (action === "syncBooking") {
      return handleSyncBooking(ss, body.record || body.booking || body);
    }

    // 4. Sync Patient
    if (action === "syncPatient") {
      return handleSyncPatient(ss, body.record || body.patient || body);
    }

    // 5. Sync Lead
    if (action === "syncLead") {
      return handleSyncLead(ss, body.record || body.lead || body);
    }

    return jsonResponse({ success: true, message: "Action accepted: " + action });

  } catch (globalErr) {
    return jsonResponse({ success: false, error: globalErr.toString() });
  }
}

/**
 * Handle GET requests for browser verification.
 */
function doGet(e) {
  return jsonResponse({
    status: "ok",
    service: "B.L. Diagnostic Center Google Sheets Sync API",
    spreadsheetId: SPREADSHEET_ID,
    timestamp: new Date().toISOString()
  });
}

/**
 * Upserts a user registration into the "Users" sheet.
 * Prevents duplicates by matching User ID (Col A) or 10-digit Mobile Number (Col C).
 */
function handleUpsertUser(ss, user) {
  var sheet = getOrCreateWorksheet(ss, "Users", [
    "User ID", "Customer Name", "Mobile Number", "Mobile Verified",
    "Email", "Account Status", "Registration Date", "Last Login",
    "Total Bookings", "Created At", "Updated At"
  ]);

  var rawMobile = String(user.mobileNumber || user.mobile || user.phone || "").replace(/\D/g, '');
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
    var rowMobile = String(values[i][2] || "").replace(/\D/g, '').slice(-10);

    if ((rowUserId && rowUserId === userId) || (cleanMobile && rowMobile && rowMobile === cleanMobile)) {
      existingRowIndex = i + 1; // 1-indexed sheet row
      break;
    }
  }

  var rowData = [
    userId,
    customerName,
    formattedMobile,
    true,
    email,
    accountStatus,
    regDate,
    lastLogin,
    totalBookings,
    createdAt,
    updatedAt
  ];

  if (existingRowIndex > 0) {
    sheet.getRange(existingRowIndex, 1, 1, rowData.length).setValues([rowData]);
    return jsonResponse({
      success: true,
      action: "updated",
      userId: userId,
      row: existingRowIndex
    });
  } else {
    sheet.appendRow(rowData);
    return jsonResponse({
      success: true,
      action: "inserted",
      userId: userId,
      row: sheet.getLastRow()
    });
  }
}

/**
 * Upserts a diagnostic booking into the "Bookings" (and "Home Collection") sheet.
 */
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
    bookingId,
    booking.bookingDate || booking.booking_date || now.split('T')[0],
    booking.bookingTime || booking.booking_time || "",
    booking.customerName || booking.name || "",
    booking.mobileNumber || booking.phone || "",
    booking.patientName || booking.patient_name || "",
    booking.relationship || booking.relation || "",
    booking.testName || booking.test_name || "",
    booking.testId || booking.test_id || "",
    booking.collectionType || booking.collection_type || "CENTER_VISIT",
    booking.appointmentDate || booking.bookingDate || "",
    booking.timeSlot || booking.time_slot || "",
    booking.houseFlat || "",
    booking.streetArea || "",
    booking.landmark || "",
    booking.city || "Jaipur",
    booking.pincode || "302033",
    booking.contactNumber || booking.phone || "",
    booking.testCharges || 0,
    booking.homeCollectionFee || 0,
    booking.totalAmount || booking.total_amount || 0,
    booking.paymentMethod || "CASH_ON_COLLECTION",
    booking.status || "CONFIRMED",
    booking.createdAt || now,
    now,
    "SYNCED",
    now
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
    patientId,
    patient.userId || patient.user_id || "",
    patient.fullName || patient.name || "",
    patient.relationship || patient.relation || "Self",
    patient.gender || "",
    patient.age || "",
    patient.phone || "",
    patient.address || "",
    now,
    now,
    "ACTIVE"
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
    leadId,
    now.split('T')[0],
    "",
    lead.name || "",
    lead.mobile || lead.phone || "",
    lead.email || "",
    "WEBSITE",
    lead.type || "ENQUIRY",
    lead.message || "",
    lead.service || "",
    "",
    "",
    "Jaipur",
    "302033",
    "NEW",
    "",
    "",
    now,
    now
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
