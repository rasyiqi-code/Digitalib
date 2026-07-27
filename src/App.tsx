import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  seedInitialDataIfNeeded,
  getAllBooksFromDB,
  getAllTransactionsFromDB,
  getStudentTransactionsFromDB,
  createBorrowTransactionInDB,
  createReturnTransactionInDB,
  getPendingSyncQueue,
  getLibrarySettings,
} from './services/db';
import { syncPendingQueueToGAS, getConfig } from './services/api';
import { Book, User, Transaction, LibrarySettings } from './types';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { BookCatalog } from './components/BookCatalog';
import { AuthModal } from './components/AuthModal';
import { ScannerModal } from './components/ScannerModal';
import { StudentCardModal } from './components/StudentCardModal';
import { PDFReaderModal } from './components/PDFReaderModal';
import { AdminDashboard } from './components/AdminDashboard';
import { SettingsModal } from './components/SettingsModal';
import { UserProfileView } from './components/UserProfileView';
import { BookOpen, CheckCircle2, AlertCircle, Clock, RotateCcw } from 'lucide-react';

const INITIAL_BOOKS: Book[] = [
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

export const App: React.FC = () => {
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  
  // Persisted user session state
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('digitalib_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const updateUserSession = (user: User | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('digitalib_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('digitalib_current_user');
    }
  };

  // Tabs & Modals
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-loans' | 'profile' | 'admin'>('catalog');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isStudentCardOpen, setIsStudentCardOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPDFReaderOpen, setIsPDFReaderOpen] = useState(false);
  const [selectedPDFBook, setSelectedPDFBook] = useState<Book | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [libraryPolicy, setLibraryPolicy] = useState<LibrarySettings>({
    maxBorrowDays: 7,
    maxBorrowLimit: 3,
    finePerDay: 1000,
    enableOverdueNotifications: true,
  });

  // Network & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto Toast Helper
  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load Data from IndexedDB
  const refreshData = useCallback(async () => {
    try {
      await seedInitialDataIfNeeded();
      const allB = await getAllBooksFromDB();
      const allT = await getAllTransactionsFromDB();
      const pendingQ = await getPendingSyncQueue();
      const pol = await getLibrarySettings();

      setBooks(allB);
      setTransactions(allT);
      setPendingSyncCount(pendingQ.length);
      setLibraryPolicy(pol);

      if (currentUser) {
        const studentT = await getStudentTransactionsFromDB(currentUser.nis);
        setUserTransactions(studentT);
      }
    } catch (e) {
      console.error('[App] Error refreshing IndexedDB:', e);
    }
  }, [currentUser]);

  useEffect(() => {
    refreshData();

    const handleOnline = async () => {
      setIsOnline(true);
      showToast('Koneksi internet terhubung kembali! Memulai sinkronisasi...', 'info');
      await handleManualSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Perangkat masuk mode offline. Data tersimpan di memori lokal HP.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshData]);

  // Handle Book Borrowing
  const handleBorrowBook = async (book: Book) => {
    if (!currentUser) {
      setIsAuthOpen(true);
      showToast('Silakan masuk dengan NIS Anda terlebih dahulu untuk meminjam buku.', 'info');
      return;
    }

    // Check Max Borrow Limit
    const activeCount = userTransactions.filter((t) => t.status === 'DIPINJAM').length;
    if (activeCount >= libraryPolicy.maxBorrowLimit) {
      showToast(
        `Batas maksimal pinjam adalah ${libraryPolicy.maxBorrowLimit} buku secara bersamaan. Harap kembalikan buku sebelumnya!`,
        'error'
      );
      return;
    }

    if (book.tipe === 'Fisik' && book.stok <= 0) {
      showToast('Stok buku ini sedang habis.', 'error');
      return;
    }

    try {
      await createBorrowTransactionInDB(currentUser.nis, book, currentUser.nama);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      showToast(`Berhasil meminjam buku "${book.judul}"!`, 'success');
      refreshData();
    } catch (e) {
      showToast('Gagal memproses peminjaman.', 'error');
    }
  };

  // Handle Book Return
  const handleReturnTransaction = async (txId: string) => {
    try {
      await createReturnTransactionInDB(txId);
      showToast('Pengembalian buku berhasil diproses dan stok telah diperbarui!', 'success');
      refreshData();
    } catch (e) {
      showToast('Gagal memproses pengembalian.', 'error');
    }
  };

  // Handle Scanner Result
  const handleScanResult = async (code: string) => {
    // 1. Check if scanned code is an ISBN in catalog
    const matchedBook = books.find((b) => b.isbn === code || b.id === code);
    if (matchedBook) {
      if (currentUser) {
        handleBorrowBook(matchedBook);
      } else {
        showToast(`Buku terdeteksi: "${matchedBook.judul}". Silakan masuk untuk finalisasi peminjaman.`, 'info');
        setIsAuthOpen(true);
      }
      return;
    }

    // 2. Check if scanned code is a Student QR payload
    try {
      const parsed = JSON.parse(code);
      if (parsed.nis) {
        showToast(`QR Siswa Terdeteksi: ${parsed.nama} (NIS: ${parsed.nis})`, 'success');
        return;
      }
    } catch (e) {
      // Not JSON QR
    }

    showToast(`Kode terdeteksi: ${code}. Tidak cocok dengan katalog.`, 'info');
  };

  // Trigger Manual GAS Sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncPendingQueueToGAS();
      if (res.synced > 0) {
        showToast(res.message, 'success');
      } else {
        showToast(res.message, 'info');
      }
      refreshData();
    } catch (e) {
      showToast('Gagal terhubung ke Google Apps Script.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Open PDF E-Reader
  const handleOpenPDF = (book: Book) => {
    setSelectedPDFBook(book);
    setIsPDFReaderOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 selection:bg-emerald-500 selection:text-white flex justify-center items-start">
      {/* Responsive Shell: Mobile (max-w-md) & Tablet/Desktop (max-w-4xl / 5xl) */}
      <div className="w-full max-w-md md:max-w-4xl lg:max-w-5xl min-h-screen md:min-h-[94vh] bg-slate-50 md:border md:border-slate-200/90 md:shadow-2xl md:rounded-3xl flex flex-col relative pb-24 md:my-4 overflow-hidden">

        {/* Top Mobile Header */}
        <Navbar
          currentUser={currentUser}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingSyncCount={pendingSyncCount}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenStudentCard={() => setIsStudentCardOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setActiveTab('profile')}
          onSync={handleManualSync}
          onLogout={() => {
            updateUserSession(null);
            setActiveTab('catalog');
            showToast('Anda telah keluar dari sesi perpustakaan.', 'info');
          }}
          libraryPolicy={libraryPolicy}
        />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-3 text-xs font-bold ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 glow-emerald'
                : toastMessage.type === 'error'
                ? 'bg-red-950/90 text-red-300 border-red-500/40'
                : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40 glow-cyan'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            ) : (
              <BookOpen className="w-5 h-5 text-cyan-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Overdue Warning Banner Alert */}
        {currentUser && libraryPolicy.enableOverdueNotifications && (() => {
          const overdueTxs = userTransactions.filter((t) => {
            if (t.status !== 'DIPINJAM') return false;
            return new Date().getTime() > new Date(t.tglKembaliMax).getTime();
          });
          if (overdueTxs.length === 0) return null;

          const totalFine = overdueTxs.reduce((acc, t) => {
            const diff = new Date().getTime() - new Date(t.tglKembaliMax).getTime();
            const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
            return acc + days * libraryPolicy.finePerDay;
          }, 0);

          return (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <div className="font-extrabold text-amber-900">
                  ⚠️ Peringatan Keterlambatan ({overdueTxs.length} Buku Melewati Batas {libraryPolicy.maxBorrowDays} Hari)
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Batas waktu pengembalian telah terlewati. 
                  Estimasi Denda: <span className="font-extrabold text-red-700">Rp {totalFine.toLocaleString('id-ID')}</span> (Rp {libraryPolicy.finePerDay.toLocaleString('id-ID')}/hari). Harap segera kembalikan ke perpustakaan.
                </p>
              </div>
            </div>
          );
        })()}

        {/* Tab 1: Book Catalog */}
        {activeTab === 'catalog' && (
          <BookCatalog
            books={books}
            currentUser={currentUser}
            onBorrowBook={handleBorrowBook}
            onOpenPDFReader={handleOpenPDF}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {/* Tab 2: Pinjaman Saya */}
        {activeTab === 'my-loans' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900">Pinjaman Saya</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar sirkulasi peminjaman (Maks. {libraryPolicy.maxBorrowDays} hari • Tarif denda Rp {libraryPolicy.finePerDay.toLocaleString('id-ID')}/hari)
              </p>
            </div>

            {userTransactions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-900">Belum Ada Riwayat Peminjaman</h3>
                <p className="text-xs text-slate-500 mt-1">Pilih buku dari katalog untuk mengajukan peminjaman fisik atau membaca e-book.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {userTransactions.map((tx) => {
                  const maxDate = new Date(tx.tglKembaliMax);
                  const isOverdue = tx.status === 'DIPINJAM' && new Date() > maxDate;
                  const daysLate = isOverdue ? Math.ceil((new Date().getTime() - maxDate.getTime()) / (1000 * 3600 * 24)) : 0;
                  const fineAmount = daysLate * libraryPolicy.finePerDay;

                  return (
                    <div key={tx.id} className={`bg-white p-4 rounded-2xl border shadow-xs space-y-2.5 ${isOverdue ? 'border-red-300 bg-red-50/50' : 'border-slate-200'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-emerald-600 font-bold">{tx.id}</span>
                          <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">{tx.judulBuku}</h4>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            isOverdue
                              ? 'bg-red-100 text-red-700 border border-red-200 animate-pulse'
                              : tx.status === 'DIPINJAM'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {isOverdue ? 'TERLAMBAT' : tx.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 font-medium pt-1">
                        <div className="flex justify-between">
                          <span>Tgl Pinjam:</span>
                          <span className="font-bold text-slate-900">{new Date(tx.tglPinjam).toLocaleDateString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Batas Kembali:</span>
                          <span className="font-bold text-slate-900">{maxDate.toLocaleDateString('id-ID')}</span>
                        </div>
                        {isOverdue && (
                          <div className="text-red-600 font-bold pt-1 flex justify-between">
                            <span>Terlambat ({daysLate} Hari):</span>
                            <span>Denda Rp {fineAmount.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>

                      {tx.status === 'DIPINJAM' && (
                        <button
                          onClick={() => handleReturnTransaction(tx.id)}
                          className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Kembalikan Buku Ke Perpustakaan</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Profil Saya Page View */}
        {activeTab === 'profile' && currentUser && (
          <UserProfileView
            currentUser={currentUser}
            userTransactions={userTransactions}
            onOpenStudentCard={() => setIsStudentCardOpen(true)}
            onLogout={() => {
              updateUserSession(null);
              setActiveTab('catalog');
              showToast('Anda telah keluar dari sesi perpustakaan.', 'info');
            }}
            onShowToast={showToast}
            onUpdateUser={(u) => updateUserSession(u)}
          />
        )}

        {/* Tab 3: Admin Dashboard */}
        {activeTab === 'admin' && (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
          <AdminDashboard
            books={books}
            transactions={transactions}
            onRefreshData={refreshData}
            onReturnTransaction={handleReturnTransaction}
            onOpenScanner={() => setIsScannerOpen(true)}
            onSyncGAS={handleManualSync}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

      </main>

      {/* Footer */}
      {/* Native Mobile Bottom Navigation Bar */}
      <BottomNav
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenStudentCard={() => setIsStudentCardOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccessLogin={(u) => {
          updateUserSession(u);
          showToast(`Selamat datang kembali, ${u.nama}!`, 'success');
          refreshData();
        }}
      />

      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        books={books}
        onScanResult={handleScanResult}
      />

      <StudentCardModal
        isOpen={isStudentCardOpen}
        onClose={() => setIsStudentCardOpen(false)}
        user={currentUser}
        activeLoans={userTransactions}
        libraryPolicy={libraryPolicy}
      />

      <PDFReaderModal
        isOpen={isPDFReaderOpen}
        onClose={() => setIsPDFReaderOpen(false)}
        book={selectedPDFBook}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onConfigSaved={() => {
          showToast('Konfigurasi backend berhasil diperbarui!', 'success');
          refreshData();
        }}
      />

      </div>
    </div>
  );
};
