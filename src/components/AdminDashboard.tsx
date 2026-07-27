import React, { useState, useEffect } from 'react';
import {
  Shield,
  BookPlus,
  RefreshCw,
  CheckCircle2,
  RotateCcw,
  Plus,
  User,
  Search,
  Layers,
  FileSpreadsheet,
  Download,
  Settings,
  Pencil,
  Trash2,
  X,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { Book, Transaction, User as UserType } from '../types';
import { saveBookToDB, saveUserToDB, deleteBookFromDB, getAllUsersFromDB, deleteUserFromDB } from '../services/db';

interface AdminDashboardProps {
  books: Book[];
  transactions: Transaction[];
  onRefreshData: () => void;
  onReturnTransaction: (txId: string) => void;
  onOpenScanner: () => void;
  onSyncGAS: () => void;
  onOpenSettings?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  books,
  transactions,
  onRefreshData,
  onReturnTransaction,
  onOpenScanner,
  onSyncGAS,
  onOpenSettings,
}) => {
  // 3 Spacious Main Tabs
  const [activeTab, setActiveTab] = useState<'sirkulasi' | 'katalog' | 'anggota'>('sirkulasi');
  const [searchTx, setSearchTx] = useState('');
  const [searchBook, setSearchBook] = useState('');
  const [searchUser, setSearchUser] = useState('');

  // Modals visibility state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Editing state
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editingUserNIS, setEditingUserNIS] = useState<string | null>(null);

  // Registered Users list state
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // User Form fields
  const [userNis, setUserNis] = useState('');
  const [userNama, setUserNama] = useState('');
  const [userKelas, setUserKelas] = useState('');
  const [userPin, setUserPin] = useState('');
  const [userRole, setUserRole] = useState<'siswa' | 'admin' | 'super_admin'>('siswa');

  // Book Form fields
  const [newJudul, setNewJudul] = useState('');
  const [newPengarang, setNewPengarang] = useState('');
  const [newIsbn, setNewIsbn] = useState('');
  const [newKategori, setNewKategori] = useState('Novel / Sastra');
  const [newStok, setNewStok] = useState(5);
  const [newTipe, setNewTipe] = useState<'Fisik' | 'E-book'>('Fisik');
  const [newPdfUrl, setNewPdfUrl] = useState('');

  // Load Users List when switching to 'anggota' tab
  const refreshUsersList = async () => {
    const list = await getAllUsersFromDB();
    setUsersList(list);
  };

  useEffect(() => {
    if (activeTab === 'anggota') {
      refreshUsersList();
    }
  }, [activeTab]);

  // Helper: Sanitize CSV cell to prevent formula injection
  const sanitizeCsvCell = (val: string) => {
    if (!val) return '""';
    const dangerous = /^[=+\-@\t\r]/;
    const safe = dangerous.test(val) ? "'" + val : val;
    return `"${safe.replace(/"/g, '""')}"`;
  };

  // Helper: Export CSV Report
  const handleExportCSV = () => {
    const headers = ['ID Transaksi', 'NIS', 'Nama Siswa', 'Judul Buku', 'Tipe', 'Tanggal Pinjam', 'Batas Kembalikan', 'Status'];
    const rows = transactions.map((t) => [
      t.id,
      t.nis,
      sanitizeCsvCell(t.namaSiswa || 'Siswa'),
      sanitizeCsvCell(t.judulBuku),
      t.tipeBuku,
      new Date(t.tglPinjam).toLocaleDateString('id-ID'),
      new Date(t.tglKembaliMax).toLocaleDateString('id-ID'),
      t.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Perpustakaan_DigiTalib_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- USER HANDLERS ---
  const handleOpenAddUser = () => {
    setEditingUserNIS(null);
    setUserNis('');
    setUserNama('');
    setUserKelas('');
    setUserPin('');
    setUserRole('siswa');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user: UserType) => {
    setEditingUserNIS(user.nis);
    setUserNis(user.nis);
    setUserNama(user.nama);
    setUserKelas(user.kelas);
    setUserPin(user.pin);
    setUserRole(user.role);
    setIsUserModalOpen(true);
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNis || !userNama || !userPin) return;
    if (userPin.length < 4) {
      alert('PIN harus minimal 4 digit!');
      return;
    }

    await saveUserToDB({
      nis: userNis,
      nama: userNama,
      kelas: userKelas || 'Siswa Sekolah',
      pin: userPin,
      role: userRole,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userNis}`,
    });

    setSuccessMessage(`Akun "${userNama}" (NIS: ${userNis}) berhasil ${editingUserNIS ? 'diperbarui' : 'didaftarkan'}!`);
    setIsUserModalOpen(false);
    refreshUsersList();
    onRefreshData();

    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteUser = async (targetUser: UserType) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun "${targetUser.nama}" (NIS: ${targetUser.nis})?`)) {
      await deleteUserFromDB(targetUser.nis);
      refreshUsersList();
    }
  };

  // --- BOOK HANDLERS ---
  const handleOpenAddBook = () => {
    setEditingBookId(null);
    setNewJudul('');
    setNewPengarang('');
    setNewIsbn('');
    setNewKategori('Novel / Sastra');
    setNewStok(5);
    setNewTipe('Fisik');
    setNewPdfUrl('');
    setIsBookModalOpen(true);
  };

  const handleOpenEditBook = (book: Book) => {
    setEditingBookId(book.id);
    setNewJudul(book.judul);
    setNewPengarang(book.pengarang);
    setNewIsbn(book.isbn);
    setNewKategori(book.kategori);
    setNewStok(book.stok);
    setNewTipe(book.tipe);
    setNewPdfUrl(book.pdfUrl || '');
    setIsBookModalOpen(true);
  };

  const handleSaveBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJudul || !newIsbn) return;

    const bookToSave: Book = {
      id: editingBookId || 'B-' + Date.now().toString() + '-' + Math.random().toString(36).slice(2, 6),
      isbn: newIsbn,
      judul: newJudul,
      pengarang: newPengarang || 'Anonim',
      kategori: newKategori,
      stok: Number(newStok),
      tipe: newTipe,
      pdfUrl: newTipe === 'E-book' ? newPdfUrl || 'https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf' : undefined,
      tahunTerbit: 2025,
      coverImage: newTipe === 'E-book' 
        ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400' 
        : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
    };

    await saveBookToDB(bookToSave);
    setSuccessMessage(`Buku "${bookToSave.judul}" berhasil ${editingBookId ? 'diperbarui' : 'ditambahkan'}!`);
    setIsBookModalOpen(false);
    onRefreshData();

    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteBook = async (book: Book) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus buku "${book.judul}" dari katalog?`)) {
      await deleteBookFromDB(book.id);
      onRefreshData();
    }
  };

  const filteredTxs = transactions.filter(
    (t) =>
      t.judulBuku.toLowerCase().includes(searchTx.toLowerCase()) ||
      t.nis.includes(searchTx) ||
      (t.namaSiswa && t.namaSiswa.toLowerCase().includes(searchTx.toLowerCase()))
  );

  const filteredBooks = books.filter(
    (b) =>
      b.judul.toLowerCase().includes(searchBook.toLowerCase()) ||
      b.pengarang.toLowerCase().includes(searchBook.toLowerCase()) ||
      b.isbn.includes(searchBook)
  );

  const filteredUsers = usersList.filter(
    (u) =>
      u.nama.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.nis.includes(searchUser) ||
      u.kelas.toLowerCase().includes(searchUser.toLowerCase())
  );

  const totalPhysicalBooks = books.filter((b) => b.tipe === 'Fisik').length;
  const totalEbooks = books.filter((b) => b.tipe === 'E-book').length;
  const activeLoansCount = transactions.filter((t) => t.status === 'DIPINJAM').length;

  return (
    <div className="space-y-4 pb-6">

      {/* Admin Header Stats */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Panel Admin Pustakawan</h2>
              <p className="text-[11px] text-slate-500">Manajemen sirkulasi, buku & akun anggota</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1"
                title="Pengaturan URL Web App & Synchronizer"
              >
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pengaturan GAS</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Rekap CSV</span>
            </button>
            <button
              onClick={onOpenScanner}
              className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-1"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Scan Barcode</span>
            </button>
            <button
              onClick={onSyncGAS}
              className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100">
            <div className="text-[10px] text-slate-500 font-bold">Pinjam Aktif</div>
            <div className="text-sm font-extrabold text-amber-700 mt-0.5">{activeLoansCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="text-[10px] text-slate-500 font-bold">Buku Fisik</div>
            <div className="text-sm font-extrabold text-emerald-700 mt-0.5">{totalPhysicalBooks}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-50/60 border border-cyan-100">
            <div className="text-[10px] text-slate-500 font-bold">E-Book</div>
            <div className="text-sm font-extrabold text-cyan-700 mt-0.5">{totalEbooks}</div>
          </div>
        </div>
      </div>

      {/* Global Success Notification */}
      {successMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Spacious 3-Tab Bar Switcher */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs gap-1">
        <button
          onClick={() => setActiveTab('sirkulasi')}
          className={`flex-1 py-2 font-bold rounded-xl transition ${
            activeTab === 'sirkulasi' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Sirkulasi
        </button>
        <button
          onClick={() => setActiveTab('katalog')}
          className={`flex-1 py-2 font-bold rounded-xl transition ${
            activeTab === 'katalog' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Katalog ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('anggota')}
          className={`flex-1 py-2 font-bold rounded-xl transition ${
            activeTab === 'anggota' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Kelola Akun ({usersList.length})
        </button>
      </div>

      {/* TAB 1: SIRKULASI (TRANSAKSI PINJAM/KEMBALI) */}
      {activeTab === 'sirkulasi' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-amber-600" />
              <span>Log Sirkulasi Buku</span>
            </h3>

            <input
              type="text"
              placeholder="Cari transaksi..."
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-2">
            {filteredTxs.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Belum ada transaksi peminjaman.</div>
            ) : (
              filteredTxs.map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{t.judulBuku}</div>
                    <div className="text-[10px] text-slate-500">{t.namaSiswa || 'Siswa'} (NIS: {t.nis})</div>
                  </div>
                  <div className="text-right space-y-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${t.status === 'DIPINJAM' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {t.status}
                    </span>
                    {t.status === 'DIPINJAM' && (
                      <div>
                        <button
                          onClick={() => onReturnTransaction(t.id)}
                          className="text-[10px] text-amber-700 font-bold hover:underline"
                        >
                          Proses Kembali
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KATALOG & INVENTARIS BUKU */}
      {activeTab === 'katalog' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Inventaris Buku</span>
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari buku..."
                value={searchBook}
                onChange={(e) => setSearchBook(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleOpenAddBook}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buku Baru</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredBooks.map((b) => (
              <div key={b.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900">{b.judul}</div>
                  <div className="text-[10px] text-slate-500">ISBN: {b.isbn} • {b.tipe} ({b.kategori})</div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                    Stok: {b.stok}
                  </span>

                  <button
                    onClick={() => handleOpenEditBook(b)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-300 transition"
                    title="Edit Buku"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteBook(b)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 transition"
                    title="Hapus Buku"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: KELOLA AKUN ANGGOTA */}
      {activeTab === 'anggota' && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Kelola Akun Anggota</span>
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Cari anggota..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={handleOpenAddUser}
                className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Akun</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {filteredUsers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada data anggota di memori lokal. Silakan tekan "+ Tambah Akun" untuk mendaftarkan siswa/pustakawan baru.
              </div>
            ) : (
              filteredUsers.map((u) => (
                <div key={u.nis} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.nis}`}
                      alt={u.nama}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{u.nama}</div>
                      <div className="text-[10px] text-slate-500">NIS: {u.nis} • Kelas: {u.kelas}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                        u.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : u.role === 'admin'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Siswa'}
                    </span>

                    <button
                      onClick={() => handleOpenEditUser(u)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-300 transition"
                      title="Edit / Reset PIN Akun"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteUser(u)}
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 transition"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* USER MODAL (ADD / EDIT / RESET PIN USER) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              <span>{editingUserNIS ? 'Edit & Reset PIN Akun' : 'Pendaftaran Anggota Baru'}</span>
            </h3>

            <form onSubmit={handleSaveUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nomor Induk Siswa (NIS)</label>
                <input
                  type="text"
                  required
                  disabled={!!editingUserNIS}
                  placeholder="Contoh: 10239481"
                  value={userNis}
                  onChange={(e) => setUserNis(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Siswa/Admin"
                  value={userNama}
                  onChange={(e) => setUserNama(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas / Jabatan</label>
                  <input
                    type="text"
                    placeholder="Contoh: XII IPA 1"
                    value={userKelas}
                    onChange={(e) => setUserKelas(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIN Akses (Password)</label>
                  <input
                    type="password"
                    required
                    placeholder="Minimal 4 digit"
                    value={userPin}
                    onChange={(e) => setUserPin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role & Hak Akses Akun</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                >
                  <option value="siswa">🎓 Siswa (Anggota Biasa)</option>
                  <option value="admin">🛡️ Pustakawan (Admin Sirkulasi)</option>
                  <option value="super_admin">👑 Kepala Perpustakaan (Super Admin)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition mt-2"
              >
                {editingUserNIS ? 'Simpan Perubahan Akun' : 'Daftarkan Akun Baru'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BOOK MODAL (ADD / EDIT BOOK) */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <button
              onClick={() => setIsBookModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
              <BookPlus className="w-5 h-5 text-emerald-600" />
              <span>{editingBookId ? 'Edit Informasi Buku' : 'Tambah Buku Baru'}</span>
            </h3>

            <form onSubmit={handleSaveBookSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Buku</label>
                <input
                  type="text"
                  required
                  placeholder="Judul Buku"
                  value={newJudul}
                  onChange={(e) => setNewJudul(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pengarang / Penulis</label>
                <input
                  type="text"
                  placeholder="Nama Pengarang"
                  value={newPengarang}
                  onChange={(e) => setNewPengarang(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode ISBN</label>
                  <input
                    type="text"
                    required
                    placeholder="978xxxxxxx"
                    value={newIsbn}
                    onChange={(e) => setNewIsbn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newKategori}
                    onChange={(e) => setNewKategori(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  >
                    <option value="Novel / Sastra">Novel / Sastra</option>
                    <option value="Sains & Teknologi">Sains & Teknologi</option>
                    <option value="Sejarah / Sastra">Sejarah / Sastra</option>
                    <option value="Matematika">Matematika</option>
                    <option value="Self-Improvement">Self-Improvement</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tipe Buku</label>
                  <select
                    value={newTipe}
                    onChange={(e) => setNewTipe(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  >
                    <option value="Fisik">📚 Buku Fisik</option>
                    <option value="E-book">📄 E-Book Digital</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jumlah Stok</label>
                  <input
                    type="number"
                    min={1}
                    value={newStok}
                    onChange={(e) => setNewStok(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {newTipe === 'E-book' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Dokumen PDF</label>
                  <input
                    type="url"
                    placeholder="https://domain.com/buku.pdf"
                    value={newPdfUrl}
                    onChange={(e) => setNewPdfUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 transition mt-2"
              >
                {editingBookId ? 'Simpan Perubahan Buku' : 'Tambahkan Ke Katalog'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
