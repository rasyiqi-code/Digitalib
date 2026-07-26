import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Book, User, Transaction, SyncQueueItem, LibrarySettings } from '../types';

interface DigiTalibDB extends DBSchema {
  books: {
    key: string; // book id
    value: Book;
    indexes: { 'by-isbn': string; 'by-tipe': string; 'by-kategori': string };
  };
  users: {
    key: string; // nis
    value: User;
  };
  transactions: {
    key: string; // transaction id
    value: Transaction;
    indexes: { 'by-nis': string; 'by-status': string };
  };
  sync_queue: {
    key: string; // queue item id
    value: SyncQueueItem;
    indexes: { 'by-status': string };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'digitalib_offline_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DigiTalibDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<DigiTalibDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DigiTalibDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Books Store
        if (!db.objectStoreNames.contains('books')) {
          const bookStore = db.createObjectStore('books', { keyPath: 'id' });
          bookStore.createIndex('by-isbn', 'isbn', { unique: false });
          bookStore.createIndex('by-tipe', 'tipe', { unique: false });
          bookStore.createIndex('by-kategori', 'kategori', { unique: false });
        }

        // Users Store
        if (!db.objectStoreNames.contains('users')) {
          db.createObjectStore('users', { keyPath: 'nis' });
        }

        // Transactions Store
        if (!db.objectStoreNames.contains('transactions')) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-nis', 'nis', { unique: false });
          txStore.createIndex('by-status', 'status', { unique: false });
        }

        // Sync Queue Store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('by-status', 'status', { unique: false });
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// Initial Data Seeding Check
export async function seedInitialDataIfNeeded() {
  const db = await getDB();
  const existingBooks = await db.getAll('books');
  if (existingBooks.length === 0) {
    const defaultBooks: Book[] = [
      {
        id: 'BK-001',
        judul: 'Fisika Kuantum & Algoritma Modern',
        pengarang: 'Dr. Ir. Hendra Wijaya',
        kategori: 'Sains & Teknologi',
        tipe: 'E-book',
        stok: 10,
        deskripsi: 'Panduan komprehensif tentang mekanika kuantum dan dasar algoritma pemrograman kuantum untuk tingkat lanjut.',
        tahunTerbit: 2024,
        isbn: '978602033176',
        coverImage: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400',
        pdfUrl: 'https://drive.google.com/file/d/1234567890/view',
      },
      {
        id: 'BK-002',
        judul: 'Sejarah Peradaban Nusantara',
        pengarang: 'Prof. Anom Setyawan',
        kategori: 'Sejarah',
        tipe: 'Fisik',
        stok: 5,
        deskripsi: 'Buku referensi lengkap mengenai dinamika kerajaan purba dan pembentukan identitas kebudayaan Nusantara.',
        tahunTerbit: 2023,
        isbn: '978602033294',
        coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'BK-003',
        judul: 'Laskar Pelangi (Edisi Spesial)',
        pengarang: 'Andrea Hirata',
        kategori: 'Fiksi & Sastra',
        tipe: 'Fisik',
        stok: 3,
        deskripsi: 'Kisah inspiratif tentang perjuangan 10 anak Belitung dalam menggapai mimpi di tengah keterbatasan fasilitas sekolah.',
        tahunTerbit: 2022,
        isbn: '978979306279',
        coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'BK-004',
        judul: 'Pemrograman Web React & TypeScript',
        pengarang: 'Rasyiqi A.',
        kategori: 'Sains & Teknologi',
        tipe: 'E-book',
        stok: 20,
        deskripsi: 'Modul praktis membuat aplikasi web dan mobile hybrid modern dengan React 19, TypeScript, dan TailwindCSS.',
        tahunTerbit: 2025,
        isbn: '978602033555',
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'BK-005',
        judul: 'Filosofi Teras & Ketenangan Jiwa',
        pengarang: 'Henry Manampiring',
        kategori: 'Self-Improvement',
        tipe: 'Fisik',
        stok: 4,
        deskripsi: 'Penerapan filsafat Stoisisme kuno untuk mental tangguh dalam menghadapi stres dan kecemasan generasi modern.',
        tahunTerbit: 2024,
        isbn: '978602424841',
        coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=400',
      },
    ];

    const tx = db.transaction('books', 'readwrite');
    for (const b of defaultBooks) {
      await tx.store.put(b);
    }
    await tx.done;
  }

  // Seed default super admin user if empty
  const existingUsers = await db.getAll('users');
  if (existingUsers.length === 0) {
    const defaultSuperAdmin: User = {
      nis: '99999999',
      nama: 'Kepala Perpustakaan',
      kelas: 'Super Admin',
      pin: '888888',
      role: 'super_admin',
    };
    await db.put('users', defaultSuperAdmin);
  }
}

// Book operations
export async function getAllBooksFromDB(): Promise<Book[]> {
  const db = await getDB();
  return db.getAll('books');
}

export async function searchBooksInDB(query: string, tipe?: string, kategori?: string): Promise<Book[]> {
  const books = await getAllBooksFromDB();
  const q = query.toLowerCase().trim();

  return books.filter((b) => {
    const matchesQuery =
      !q ||
      b.judul.toLowerCase().includes(q) ||
      b.pengarang.toLowerCase().includes(q) ||
      b.isbn.includes(q) ||
      b.id.toLowerCase().includes(q);

    const matchesTipe = !tipe || tipe === 'All' || b.tipe === tipe;
    const matchesKategori = !kategori || kategori === 'Semua' || b.kategori === kategori;

    return matchesQuery && matchesTipe && matchesKategori;
  });
}

export async function saveBookToDB(book: Book): Promise<void> {
  const db = await getDB();
  await db.put('books', book);
}

export async function deleteBookFromDB(bookId: string): Promise<void> {
  const db = await getDB();
  await db.delete('books', bookId);
}

// User operations
export async function getUserByNIS(nis: string): Promise<User | undefined> {
  const db = await getDB();
  return db.get('users', nis);
}

export async function getAppSetting(key: string, defaultValue?: any): Promise<any> {
  const db = await getDB();
  const val = await db.get('settings', key);
  return val !== undefined ? val : defaultValue;
}

export async function setAppSetting(key: string, val: any): Promise<void> {
  const db = await getDB();
  await db.put('settings', val, key);
}

const DEFAULT_LIBRARY_SETTINGS: LibrarySettings = {
  maxBorrowDays: 7,
  maxBorrowLimit: 3,
  finePerDay: 1000,
  enableOverdueNotifications: true,
};

export async function getLibrarySettings(): Promise<LibrarySettings> {
  const settings = await getAppSetting('library_policy_settings');
  return settings ? { ...DEFAULT_LIBRARY_SETTINGS, ...settings } : DEFAULT_LIBRARY_SETTINGS;
}

export async function saveLibrarySettings(settings: LibrarySettings): Promise<void> {
  await setAppSetting('library_policy_settings', settings);
}

export async function getAllUsersFromDB(): Promise<User[]> {
  const db = await getDB();
  return db.getAll('users');
}

export async function saveUserToDB(user: User): Promise<void> {
  const db = await getDB();
  await db.put('users', user);
}

export async function deleteUserFromDB(nis: string): Promise<void> {
  const db = await getDB();
  await db.delete('users', nis);
}

// Transaction operations
export async function getAllTransactionsFromDB(): Promise<Transaction[]> {
  const db = await getDB();
  const txs = await db.getAll('transactions');
  return txs.sort((a, b) => new Date(b.tglPinjam).getTime() - new Date(a.tglPinjam).getTime());
}

export async function getStudentTransactionsFromDB(nis: string): Promise<Transaction[]> {
  const db = await getDB();
  const txs = await db.getAllFromIndex('transactions', 'by-nis', nis);
  return txs.sort((a, b) => new Date(b.tglPinjam).getTime() - new Date(a.tglPinjam).getTime());
}

export async function createBorrowTransactionInDB(nis: string, book: Book, userNama: string): Promise<Transaction> {
  const db = await getDB();
  const settings = await getLibrarySettings();
  const txId = 'TX-' + Date.now();
  const datePinjam = new Date().toISOString();
  const maxDaysMs = (settings.maxBorrowDays || 7) * 24 * 60 * 60 * 1000;
  const dateKembaliMax = new Date(Date.now() + maxDaysMs).toISOString();

  const newTx: Transaction = {
    id: txId,
    nis,
    namaSiswa: userNama,
    bookId: book.id,
    judulBuku: book.judul,
    tipeBuku: book.tipe,
    tglPinjam: datePinjam,
    tglKembaliMax: dateKembaliMax,
    status: 'DIPINJAM',
    syncedToGAS: false,
  };

  // 1. Save Transaction
  await db.put('transactions', newTx);

  // 2. Decrement physical stock
  if (book.tipe === 'Fisik' && book.stok > 0) {
    const updatedBook = { ...book, stok: book.stok - 1 };
    await db.put('books', updatedBook);
  }

  // 3. Add to sync queue
  const queueItem: SyncQueueItem = {
    id: 'SYNC-' + Date.now(),
    type: 'borrow',
    data: { nis, bookId: book.id, userNama },
    timestamp: new Date().toISOString(),
    status: 'pending',
  };
  await db.put('sync_queue', queueItem);

  return newTx;
}

export async function createReturnTransactionInDB(transactionId: string): Promise<void> {
  const db = await getDB();
  const tx = await db.get('transactions', transactionId);
  if (!tx) return;

  tx.status = 'DIKEMBALIKAN';
  tx.tglDikembalikan = new Date().toISOString();
  tx.syncedToGAS = false;

  await db.put('transactions', tx);

  // Re-increment stock if physical
  const book = await db.get('books', tx.bookId);
  if (book && book.tipe === 'Fisik') {
    book.stok += 1;
    await db.put('books', book);
  }

  // Add to sync queue
  const queueItem: SyncQueueItem = {
    id: 'SYNC-' + Date.now(),
    type: 'return',
    data: { transactionId: tx.id, bookId: tx.bookId },
    timestamp: new Date().toISOString(),
    status: 'pending',
  };
  await db.put('sync_queue', queueItem);
}

// Sync Queue operations
export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return db.getAllFromIndex('sync_queue', 'by-status', 'pending');
}

export async function markSyncItemCompleted(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sync_queue', id);
}

// Clear all local stored IndexedDB data (Production Reset)
export async function clearAllLocalData(): Promise<void> {
  const db = await getDB();
  await db.clear('books');
  await db.clear('users');
  await db.clear('transactions');
  await db.clear('sync_queue');
}

// Populate local IndexedDB from live GAS REST API
export async function populateFromGAS(books?: Book[], users?: User[], transactions?: Transaction[]): Promise<void> {
  const db = await getDB();
  if (books && Array.isArray(books) && books.length > 0) {
    await db.clear('books');
    const txB = db.transaction('books', 'readwrite');
    for (const b of books) {
      await txB.store.put(b);
    }
    await txB.done;
  }

  if (users && Array.isArray(users) && users.length > 0) {
    await db.clear('users');
    const txU = db.transaction('users', 'readwrite');
    for (const u of users) {
      await txU.store.put(u);
    }
    await txU.done;
  }

  if (transactions && Array.isArray(transactions) && transactions.length > 0) {
    await db.clear('transactions');
    const txT = db.transaction('transactions', 'readwrite');
    for (const t of transactions) {
      await txT.store.put(t);
    }
    await txT.done;
  }
}
