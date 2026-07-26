/**
 * ============================================================================
 * DIGITALIB - GOOGLE APPS SCRIPT REST API BACKEND
 * System Perpustakaan Hybrid Sekolah Berbasis Google Sheets
 * ============================================================================
 * 
 * CARA DEPLOYMENT:
 * 1. Buka Google Sheets baru.
 * 2. Buat 3 Sheet: DB_Users, DB_Buku, DB_Transaksi
 *    - Sheet DB_Users (Kolom A-D): NIS, Nama, Kelas, PIN, Role
 *    - Sheet DB_Buku (Kolom A-F): ID, ISBN, Judul, Pengarang, Stok, Tipe (Fisik/Ebook), PDF_URL
 *    - Sheet DB_Transaksi (Kolom A-G): ID, NIS, BookID, JudulBuku, Tipe, TglPinjam, Status (DIPINJAM/DIKEMBALIKAN)
 * 3. Ekstensi -> Apps Script -> Paste kode di bawah ini.
 * 4. Deploy -> New Deployment -> Select type: Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Salin URL Web App yang dihasilkan dan tempel di Pengaturan Aplikasi DigiTalib.
 */

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const SHEET_USERS = "DB_Users";
const SHEET_BUKU = "DB_Buku";
const SHEET_TRANSAKSI = "DB_Transaksi";

// Main GET Endpoint
function doGet(e) {
  const action = e.parameter.action;
  let responseData = { status: "error", message: "Action tidak dikenal" };

  try {
    if (action === "getInitialData") {
      responseData = {
        status: "success",
        books: getSheetData(SHEET_BUKU),
        users: getSheetData(SHEET_USERS),
        transactions: getSheetData(SHEET_TRANSAKSI)
      };
    } else if (action === "getBooks") {
      responseData = { status: "success", books: getSheetData(SHEET_BUKU) };
    } else if (action === "getTransactions") {
      responseData = { status: "success", transactions: getSheetData(SHEET_TRANSAKSI) };
    } else {
      responseData = { status: "success", message: "API DigiTalib Aktif" };
    }
  } catch (err) {
    responseData = { status: "error", message: err.toString() };
  }

  return createJsonResponse(responseData);
}

// Main POST Endpoint (with LockService for Race Conditions)
function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 10 seconds for lock
  if (!lock.tryLock(10000)) {
    return createJsonResponse({ status: "error", message: "Sistem sibuk, silakan coba beberapa saat lagi (Lock Timeout)." });
  }

  let responseData = { status: "error", message: "Gagal memproses request" };

  try {
    const contents = JSON.parse(e.postData.contents);
    const action = contents.action;

    if (action === "login") {
      responseData = handleLogin(contents.payload);
    } else if (action === "syncBatch") {
      responseData = handleSyncBatch(contents.payload);
    } else if (action === "borrowBook") {
      responseData = handleBorrowBook(contents.payload);
    } else if (action === "returnBook") {
      responseData = handleReturnBook(contents.payload);
    } else if (action === "addBook") {
      responseData = handleAddBook(contents.payload);
    }
  } catch (err) {
    responseData = { status: "error", message: err.toString() };
  } finally {
    lock.releaseLock();
  }

  return createJsonResponse(responseData);
}

// Helper: Convert Sheet to JSON Object Array
function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const result = [];
  for (let i = 1; i < data.length; i++) {
    let row = data[i];
    let obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    result.push(obj);
  }
  return result;
}

// Action: Login Handler
function handleLogin(payload) {
  const { nis, pin } = payload;
  const users = getSheetData(SHEET_USERS);
  const user = users.find(u => String(u.NIS) === String(nis) && String(u.PIN) === String(pin));

  if (user) {
    return {
      status: "success",
      token: "TOKEN_" + user.NIS + "_" + Date.now(),
      user: {
        nis: String(user.NIS),
        nama: user.Nama,
        kelas: user.Kelas,
        role: user.Role || "Siswa"
      }
    };
  } else {
    return { status: "error", message: "NIS atau PIN tidak valid!" };
  }
}

// Action: Borrow Book (Stock decrement + transaction logging)
function handleBorrowBook(payload) {
  const { nis, bookId, userNama } = payload;
  const sheetBuku = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUKU);
  const sheetTx = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSAKSI);

  const bukuData = sheetBuku.getDataRange().getValues();
  let foundRow = -1;
  let bookTitle = "";
  let bookType = "Fisik";
  let currentStock = 0;

  for (let i = 1; i < bukuData.length; i++) {
    if (String(bukuData[i][0]) === String(bookId)) {
      foundRow = i + 1;
      bookTitle = bukuData[i][2]; // Judul
      currentStock = Number(bukuData[i][4]); // Stok
      bookType = bukuData[i][5] || "Fisik"; // Tipe
      break;
    }
  }

  if (foundRow === -1) {
    return { status: "error", message: "Buku tidak ditemukan!" };
  }

  if (bookType === "Fisik" && currentStock <= 0) {
    return { status: "error", message: "Stok buku fisik habis!" };
  }

  // Update Stock if Physical
  if (bookType === "Fisik") {
    sheetBuku.getRange(foundRow, 5).setValue(currentStock - 1);
  }

  // Record Transaction
  const txId = "TX" + Date.now();
  const dateStr = new Date().toISOString();
  sheetTx.appendRow([txId, nis, bookId, bookTitle, bookType, dateStr, "DIPINJAM"]);

  return {
    status: "success",
    message: "Peminjaman berhasil dicatat!",
    transactionId: txId,
    newStock: currentStock - 1
  };
}

// Action: Return Book (Stock increment + transaction status update)
function handleReturnBook(payload) {
  const { transactionId, bookId } = payload;
  const sheetTx = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSAKSI);
  const sheetBuku = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUKU);

  const txData = sheetTx.getDataRange().getValues();
  let txRow = -1;
  let targetBookId = bookId;

  for (let i = 1; i < txData.length; i++) {
    if (String(txData[i][0]) === String(transactionId)) {
      txRow = i + 1;
      targetBookId = txData[i][2];
      break;
    }
  }

  if (txRow !== -1) {
    sheetTx.getRange(txRow, 7).setValue("DIKEMBALIKAN");
  }

  // Increase stock back if physical book
  if (targetBookId) {
    const bukuData = sheetBuku.getDataRange().getValues();
    for (let i = 1; i < bukuData.length; i++) {
      if (String(bukuData[i][0]) === String(targetBookId)) {
        const curStock = Number(bukuData[i][4]);
        sheetBuku.getRange(i + 1, 5).setValue(curStock + 1);
        break;
      }
    }
  }

  return { status: "success", message: "Pengembalian buku berhasil diproses!" };
}

// Action: Batch Sync Offline Queue
function handleSyncBatch(payload) {
  const items = payload.items || [];
  const results = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type === "borrow") {
      results.push(handleBorrowBook(item.data));
    } else if (item.type === "return") {
      results.push(handleReturnBook(item.data));
    }
  }

  return { status: "success", syncedCount: items.length, results: results };
}

// JSON Output Formatter
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
