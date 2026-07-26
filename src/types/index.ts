export type UserRole = 'siswa' | 'admin' | 'super_admin';

export interface User {
  nis: string;
  nama: string;
  kelas: string;
  pin: string;
  role: UserRole;
  email?: string;
  avatarUrl?: string;
}

export type BookType = 'Fisik' | 'E-book';

export interface Book {
  id: string;
  isbn: string;
  judul: string;
  pengarang: string;
  kategori: string;
  stok: number;
  tipe: BookType;
  pdfUrl?: string;
  deskripsi?: string;
  tahunTerbit?: number;
  coverImage?: string;
}

export type TransactionStatus = 'DIPINJAM' | 'DIKEMBALIKAN';

export interface Transaction {
  id: string;
  nis: string;
  namaSiswa?: string;
  bookId: string;
  judulBuku: string;
  tipeBuku: BookType;
  tglPinjam: string;
  tglKembaliMax: string;
  tglDikembalikan?: string;
  status: TransactionStatus;
  syncedToGAS: boolean;
}

export interface LibrarySettings {
  maxBorrowDays: number;
  maxBorrowLimit: number;
  finePerDay: number;
  enableOverdueNotifications: boolean;
}

export interface SyncQueueItem {
  id: string;
  type: 'borrow' | 'return';
  data: Record<string, any>;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
}

export interface AppConfig {
  gasUrl: string;
  useLiveGas: boolean;
  autoSync: boolean;
}
