/**
 * ============================================================================
 * DIGITALIB - GOOGLE APPS SCRIPT REST API BACKEND (HYBRID SYSTEM)
 * System Perpustakaan Hybrid Sekolah Berbasis Google Sheets & Google Drive
 * ============================================================================
 * 
 * CARA DEPLOYMENT LENGKAP:
 * 1. Buka Google Sheets baru.
 * 2. Ekstensi -> Apps Script -> Paste seluruh kode di bawah ini.
 * 3. Jalankan fungsi "setupDatabaseSheets()" sekali untuk membuat sheet & header otomatis.
 * 4. Deploy -> New Deployment -> Select type: Web app.
 *    - Execute as: Me (email Anda)
 *    - Who has access: Anyone
 * 5. Salin URL Web App yang dihasilkan dan tempel di Pengaturan Aplikasi DigiTalib.
 */

const SHEET_USERS = "DB_Users";
const SHEET_BUKU = "DB_Buku";
const SHEET_TRANSAKSI = "DB_Transaksi";
const SHEET_SETTINGS = "DB_Settings";

// Target Google Drive Folder Name for Uploaded E-Books
const EBOOK_FOLDER_NAME = "DigiTalib_Ebooks_Storage";

/**
 * 🛠️ Inisialisasi Otomatis Sheet & Kolom Header
 * Jalankan fungsi ini sekali di Google Apps Script Editor untuk membuat sheet otomatis.
 */
function setupDatabaseSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. DB_Users Sheet
  let sUsers = ss.getSheetByName(SHEET_USERS);
  if (!sUsers) {
    sUsers = ss.insertSheet(SHEET_USERS);
    sUsers.appendRow(["nis", "nama", "kelas", "pin", "role", "email"]);
    sUsers.appendRow(["99999999", "Kepala Perpustakaan", "Super Admin", "888888", "super_admin", "admin@sch.id"]);
  }

  // 2. DB_Buku Sheet
  let sBuku = ss.getSheetByName(SHEET_BUKU);
  if (!sBuku) {
    sBuku = ss.insertSheet(SHEET_BUKU);
    sBuku.appendRow(["id", "isbn", "judul", "pengarang", "kategori", "stok", "tipe", "pdfUrl", "deskripsi", "tahunTerbit", "coverImage"]);
    sBuku.appendRow([
      "BK-001",
      "978602033176",
      "Fisika Kuantum & Algoritma Modern",
      "Dr. Ir. Hendra Wijaya",
      "Sains & Teknologi",
      10,
      "E-book",
      "https://drive.google.com/file/d/1234567890/view",
      "Panduan komprehensif tentang mekanika kuantum.",
      2024,
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400"
    ]);
  }

  // 3. DB_Transaksi Sheet
  let sTx = ss.getSheetByName(SHEET_TRANSAKSI);
  if (!sTx) {
    sTx = ss.insertSheet(SHEET_TRANSAKSI);
    sTx.appendRow(["id", "nis", "namaSiswa", "bookId", "judulBuku", "tipeBuku", "tglPinjam", "tglKembaliMax", "tglDikembalikan", "status"]);
  }

  // 4. DB_Settings Sheet
  let sSet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sSet) {
    sSet = ss.insertSheet(SHEET_SETTINGS);
    sSet.appendRow(["key", "value"]);
    sSet.appendRow(["library_policy_settings", JSON.stringify({ maxBorrowDays: 7, maxBorrowLimit: 3, finePerDay: 1000, enableOverdueNotifications: true })]);
  }

  return "Setup Database Sheets Berhasil!";
}

// Main GET Endpoint
function doGet(e) {
  const action = (e && e.parameter) ? e.parameter.action : "";
  let responseData = { status: "error", message: "Action tidak dikenal" };

  try {
    if (!action || action === "" || action === "test") {
      responseData = { status: "success", message: "API DigiTalib Hybrid Aktif & Siap Digunakan" };
    } else if (action === "getInitialData") {
      responseData = {
        status: "success",
        books: getSheetDataNormalized(SHEET_BUKU),
        users: getUsersSafe(),
        transactions: getSheetDataNormalized(SHEET_TRANSAKSI)
      };
    } else if (action === "getBooks") {
      responseData = { status: "success", books: getSheetDataNormalized(SHEET_BUKU) };
    } else if (action === "getUsers") {
      responseData = { status: "success", users: getUsersSafe() };
    } else if (action === "getTransactions") {
      responseData = { status: "success", transactions: getSheetDataNormalized(SHEET_TRANSAKSI) };
    } else {
      responseData = { status: "success", message: "API DigiTalib Hybrid Aktif" };
    }
  } catch (err) {
    responseData = { status: "error", message: err.toString() };
  }

  return createJsonResponse(responseData);
}

/**
 * 🧪 Test Runner untuk Editor Google Apps Script
 * Pilih fungsi ini di dropdown editor GAS lalu klik 'Jalankan' untuk menguji tanpa error.
 */
function testDoGet() {
  const res = doGet({ parameter: { action: "getInitialData" } });
  Logger.log(res.getContent());
}

// Main POST Endpoint (with LockService for Concurrency Safety)
function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    return createJsonResponse({ status: "error", message: "Sistem sibuk, silakan coba beberapa saat lagi (Lock Timeout)." });
  }

  let responseData = { status: "error", message: "Gagal memproses request" };

  try {
    if (!e.postData || !e.postData.contents) {
      return createJsonResponse({ status: "error", message: "Request body kosong." });
    }
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
    } else if (action === "editBook") {
      responseData = handleEditBook(contents.payload);
    } else if (action === "deleteBook") {
      responseData = handleDeleteBook(contents.payload);
    } else if (action === "uploadPdfToDrive") {
      responseData = handleUploadPdfToDrive(contents.payload);
    }
  } catch (err) {
    responseData = { status: "error", message: err.toString() };
  } finally {
    lock.releaseLock();
  }

  return createJsonResponse(responseData);
}

/**
 * 📂 Upload File E-Book PDF Langsung ke Google Drive & Buat Akses Publik
 */
function handleUploadPdfToDrive(payload) {
  try {
    const { fileName, base64Data } = payload;
    if (!fileName || !base64Data) {
      return { status: "error", message: "Parameter fileName dan base64Data wajib diisi." };
    }

    // Validate file name has .pdf extension
    if (!fileName.toLowerCase().endsWith('.pdf')) {
      return { status: "error", message: "Hanya file PDF yang diizinkan." };
    }

    // Validate file size (max 50MB)
    const estimatedSize = (base64Data.length * 3) / 4;
    if (estimatedSize > 50 * 1024 * 1024) {
      return { status: "error", message: "Ukuran file melebihi batas maksimum 50MB." };
    }

    // Find or create Google Drive target folder
    let folder;
    const folders = DriveApp.getFoldersByName(EBOOK_FOLDER_NAME);
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(EBOOK_FOLDER_NAME);
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }

    // Clean base64 prefix if present
    let cleanBase64 = base64Data;
    if (cleanBase64.includes(",")) {
      cleanBase64 = cleanBase64.split(",")[1];
    }

    // Decode and create file in Drive
    const blob = Utilities.newBlob(Utilities.base64Decode(cleanBase64), "application/pdf", fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const previewUrl = "https://drive.google.com/file/d/" + fileId + "/preview";
    const downloadUrl = file.getDownloadUrl();

    return {
      status: "success",
      message: "File E-Book PDF berhasil diunggah ke Google Drive!",
      fileId: fileId,
      pdfUrl: previewUrl,
      downloadUrl: downloadUrl
    };
  } catch (err) {
    return { status: "error", message: "Gagal mengunggah file ke Google Drive: " + err.toString() };
  }
}

// Action: Add New Book to DB_Buku
function handleAddBook(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_BUKU);
  if (!sheet) {
    setupDatabaseSheets();
    sheet = ss.getSheetByName(SHEET_BUKU);
  }

  const { id, isbn, judul, pengarang, kategori, stok, tipe, pdfUrl, deskripsi, tahunTerbit, coverImage } = payload;
  const bookId = id || "BK-" + Date.now();

  sheet.appendRow([
    bookId,
    isbn || "",
    judul || "Buku Tanpa Judul",
    pengarang || "Pengarang Tidak Diketahui",
    kategori || "Umum",
    Number(stok) || 1,
    tipe || "Fisik",
    pdfUrl || "",
    deskripsi || "",
    Number(tahunTerbit) || new Date().getFullYear(),
    coverImage || ""
  ]);

  return { status: "success", message: "Buku berhasil ditambahkan ke catalog database!", bookId: bookId };
}

// Action: Edit Existing Book in DB_Buku
function handleEditBook(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUKU);
  if (!sheet) return { status: "error", message: "Sheet DB_Buku tidak ditemukan." };

  const data = sheet.getDataRange().getValues();
  const { id, isbn, judul, pengarang, kategori, stok, tipe, pdfUrl, deskripsi, tahunTerbit, coverImage } = payload;

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      const row = i + 1;
      sheet.getRange(row, 2).setValue(isbn || data[i][1]);
      sheet.getRange(row, 3).setValue(judul || data[i][2]);
      sheet.getRange(row, 4).setValue(pengarang || data[i][3]);
      sheet.getRange(row, 5).setValue(kategori || data[i][4]);
      sheet.getRange(row, 6).setValue(Number(stok) >= 0 ? Number(stok) : data[i][5]);
      sheet.getRange(row, 7).setValue(tipe || data[i][6]);
      sheet.getRange(row, 8).setValue(pdfUrl !== undefined ? pdfUrl : data[i][7]);
      sheet.getRange(row, 9).setValue(deskripsi !== undefined ? deskripsi : data[i][8]);
      sheet.getRange(row, 10).setValue(tahunTerbit !== undefined ? Number(tahunTerbit) : data[i][9]);
      sheet.getRange(row, 11).setValue(coverImage !== undefined ? coverImage : data[i][10]);
      return { status: "success", message: "Buku berhasil diperbarui!" };
    }
  }

  return { status: "error", message: "ID Buku tidak ditemukan." };
}

// Action: Delete Book from DB_Buku (with active borrow check)
function handleDeleteBook(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUKU);
  if (!sheet) return { status: "error", message: "Sheet DB_Buku tidak ditemukan." };

  const data = sheet.getDataRange().getValues();
  const bookId = payload.id;

  // Check for active borrows of this book
  const sheetTx = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSAKSI);
  if (sheetTx) {
    const txData = sheetTx.getDataRange().getValues();
    for (let i = 1; i < txData.length; i++) {
      if (String(txData[i][3]) === String(bookId) && String(txData[i][9]).trim() === "DIPINJAM") {
        return { status: "error", message: "Buku tidak dapat dihapus karena masih ada transaksi peminjaman aktif!" };
      }
    }
  }

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(bookId)) {
      sheet.deleteRow(i + 1);
      return { status: "success", message: "Buku berhasil dihapus dari database!" };
    }
  }

  return { status: "error", message: "Buku tidak ditemukan." };
}

// Helper: Normalize Sheet Rows to Normalized JSON Objects
function getSheetDataNormalized(sheetName) {
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
      let key = String(headers[j]).trim();
      obj[key] = row[j];
    }
    result.push(obj);
  }
  return result;
}

// Helper: Get users with PINs stripped for safe external consumption
function getUsersSafe() {
  const users = getSheetDataNormalized(SHEET_USERS);
  return users.map(function(u) {
    var safe = Object.assign({}, u);
    delete safe.pin;
    delete safe.PIN;
    return safe;
  });
}

// Action: Login Handler
function handleLogin(payload) {
  const { nis, pin } = payload;
  if (!nis || !pin) {
    return { status: "error", message: "NIS dan PIN wajib diisi!" };
  }

  // Rate limiting: max 5 login attempts per minute per NIS
  const cache = CacheService.getScriptCache();
  const attemptKey = "login_attempts_" + String(nis);
  const attempts = parseInt(cache.get(attemptKey) || "0", 10);
  if (attempts >= 5) {
    return { status: "error", message: "Terlalu banyak percobaan login. Coba lagi dalam 1 menit." };
  }
  cache.put(attemptKey, String(attempts + 1), 60); // 60 second TTL

  const users = getSheetDataNormalized(SHEET_USERS);
  const user = users.find(u => String(u.nis || u.NIS) === String(nis) && String(u.pin || u.PIN) === String(pin));

  // Reset attempts on successful login
  if (user) {
    cache.remove(attemptKey);
    return {
      status: "success",
      user: {
        nis: String(user.nis || user.NIS),
        nama: user.nama || user.Nama,
        kelas: user.kelas || user.Kelas,
        role: user.role || user.Role || "siswa"
      }
    };
  } else {
    return { status: "error", message: "NIS atau PIN tidak valid!" };
  }
}

// Action: Borrow Book
function handleBorrowBook(payload) {
  const { nis, bookId, userNama } = payload;
  const sheetBuku = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUKU);
  const sheetTx = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSAKSI);

  if (!sheetBuku || !sheetTx) {
    return { status: "error", message: "Sheet database tidak ditemukan. Jalankan setupDatabaseSheets()." };
  }

  // Read library settings for maxBorrowDays and maxBorrowLimit
  var maxBorrowDays = 7;
  var maxBorrowLimit = 3;
  var sheetSettings = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_SETTINGS);
  if (sheetSettings) {
    var settingsData = sheetSettings.getDataRange().getValues();
    for (var s = 1; s < settingsData.length; s++) {
      if (String(settingsData[s][0]) === "library_policy_settings") {
        try {
          var policy = JSON.parse(String(settingsData[s][1]));
          if (policy.maxBorrowDays) maxBorrowDays = Number(policy.maxBorrowDays);
          if (policy.maxBorrowLimit) maxBorrowLimit = Number(policy.maxBorrowLimit);
        } catch(e) {}
        break;
      }
    }
  }

  // Enforce maxBorrowLimit in backend
  var activeBorrowCount = 0;
  var txDataAll = sheetTx.getDataRange().getValues();
  for (var t = 1; t < txDataAll.length; t++) {
    if (String(txDataAll[t][1]) === String(nis) && String(txDataAll[t][9]).trim() === "DIPINJAM") {
      activeBorrowCount++;
    }
  }
  if (activeBorrowCount >= maxBorrowLimit) {
    return { status: "error", message: "Batas maksimal pinjam " + maxBorrowLimit + " buku tercapai!" };
  }

  const bukuData = sheetBuku.getDataRange().getValues();
  let foundRow = -1;
  let bookTitle = "";
  let bookType = "Fisik";
  let currentStock = 0;

  for (let i = 1; i < bukuData.length; i++) {
    if (String(bukuData[i][0]) === String(bookId)) {
      foundRow = i + 1;
      bookTitle = bukuData[i][2]; // Judul
      currentStock = Number(bukuData[i][5]); // Stok
      bookType = bukuData[i][6] || "Fisik"; // Tipe
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
    sheetBuku.getRange(foundRow, 6).setValue(currentStock - 1);
  }

  // Record Transaction
  const txId = "TX-" + Date.now() + "-" + Math.random().toString(36).substring(2, 8);
  const datePinjam = new Date().toISOString();
  const dateMax = new Date(Date.now() + maxBorrowDays * 24 * 60 * 60 * 1000).toISOString();
  sheetTx.appendRow([txId, nis, userNama, bookId, bookTitle, bookType, datePinjam, dateMax, "", "DIPINJAM"]);

  return {
    status: "success",
    message: "Peminjaman berhasil dicatat!",
    transactionId: txId,
    newStock: currentStock - 1
  };
}

// Action: Return Book
function handleReturnBook(payload) {
  const { transactionId, bookId } = payload;
  const sheetTx = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_TRANSAKSI);
  const sheetBuku = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_BUKU);

  if (!sheetTx || !sheetBuku) return { status: "error", message: "Database tidak ditemukan." };

  const txData = sheetTx.getDataRange().getValues();
  let txRow = -1;
  let targetBookId = bookId;
  let bookType = "Fisik";

  for (let i = 1; i < txData.length; i++) {
    if (dataMatch(txData[i][0], transactionId)) {
      txRow = i + 1;
      targetBookId = txData[i][3];
      bookType = String(txData[i][5] || "Fisik").trim();
      break;
    }
  }

  if (txRow === -1) {
    return { status: "error", message: "Transaksi peminjaman tidak ditemukan!" };
  }

  // Check if already returned
  const currentStatus = String(txData[txRow - 1][9] || "").trim();
  if (currentStatus === "DIKEMBALIKAN") {
    return { status: "error", message: "Buku ini sudah dikembalikan sebelumnya!" };
  }

  sheetTx.getRange(txRow, 9).setValue(new Date().toISOString()); // tglDikembalikan
  sheetTx.getRange(txRow, 10).setValue("DIKEMBALIKAN"); // status

  // Increase stock back ONLY if physical book
  if (targetBookId && bookType === "Fisik") {
    const bukuData = sheetBuku.getDataRange().getValues();
    for (let i = 1; i < bukuData.length; i++) {
      if (String(bukuData[i][0]) === String(targetBookId)) {
        const curStock = Number(bukuData[i][5]);
        sheetBuku.getRange(i + 1, 6).setValue(curStock + 1);
        break;
      }
    }
  }

  return { status: "success", message: "Pengembalian buku berhasil diproses!" };
}

function dataMatch(val1, val2) {
  return String(val1).trim() === String(val2).trim();
}

// Action: Batch Sync Offline Queue
function handleSyncBatch(payload) {
  const items = payload.items || [];
  const results = [];
  let successCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let res = { status: "error", message: "Tipe aksi antrean tidak dikenal" };

    if (item.type === "borrow" || item.action === "BORROW") {
      res = handleBorrowBook(item.data || item.payload);
    } else if (item.type === "return" || item.action === "RETURN") {
      res = handleReturnBook(item.data || item.payload);
    } else if (item.action === "ADD_BOOK") {
      res = handleAddBook(item.payload);
    }

    if (res && res.status === "success") {
      successCount++;
    }
    results.push(res);
  }

  return { status: "success", syncedCount: successCount, totalCount: items.length, results: results };
}

// JSON Output Formatter
function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
