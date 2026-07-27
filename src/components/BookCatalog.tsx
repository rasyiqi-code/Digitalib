import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Filter,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  ScanBarcode,
  ArrowUpRight,
  Star,
  Bookmark,
  X,
  Sparkles,
  ChevronRight,
  Compass,
  Zap,
} from 'lucide-react';
import { Book, User } from '../types';

interface BookCatalogProps {
  books: Book[];
  currentUser: User | null;
  onBorrowBook: (book: Book) => void;
  onOpenPDFReader: (book: Book) => void;
  onOpenScanner: () => void;
}

export const BookCatalog: React.FC<BookCatalogProps> = ({
  books,
  currentUser,
  onBorrowBook,
  onOpenPDFReader,
  onOpenScanner,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Fisik' | 'E-book'>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [selectedBookDetail, setSelectedBookDetail] = useState<Book | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Close book detail on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedBookDetail) {
        setSelectedBookDetail(null);
      }
    };
    if (selectedBookDetail) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedBookDetail]);

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.kategori) set.add(b.kategori);
    });
    return ['Semua', ...Array.from(set)];
  }, [books]);

  // Filtered books with instant < 0.5s local IndexedDB performance
  const filteredBooks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return books.filter((book) => {
      const matchesSearch =
        !q ||
        book.judul.toLowerCase().includes(q) ||
        book.pengarang.toLowerCase().includes(q) ||
        book.isbn.includes(q) ||
        book.id.toLowerCase().includes(q);

      const matchesType = typeFilter === 'All' || book.tipe === typeFilter;
      const matchesCategory = categoryFilter === 'Semua' || book.kategori === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [books, searchQuery, typeFilter, categoryFilter]);

  // Featured books for top carousel
  const featuredBooks = useMemo(() => {
    return books.slice(0, 5);
  }, [books]);

  return (
    <div className="space-y-6 pb-6">
      
      {/* User Greeting & Header Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <img
            src={
              currentUser?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'
            }
            alt={currentUser?.nama || 'Tamu'}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/40 shadow-sm"
          />
          <div>
            <div className="text-xs font-semibold text-slate-500">
              Halo, {currentUser ? currentUser.nama.split(' ')[0] : 'Siswa Sekolah'}! 👋
            </div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
              Mau Baca Buku Apa Hari Ini?
            </h1>
          </div>
        </div>

        <button
          onClick={onOpenScanner}
          className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition shadow-xs"
          title="Scan ISBN / Barcode"
        >
          <ScanBarcode className="w-5 h-5" />
        </button>
      </div>

      {/* Floating Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Cari judul buku, pengarang, ISBN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs shadow-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
        />
      </div>

      {/* Section 1: "Top Available for You!" Carousel */}
      {featuredBooks.length > 0 && !searchQuery && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h2 className="text-sm font-extrabold text-slate-900">Rekomendasi Utama</h2>
            </div>
            <span className="text-[11px] font-bold text-slate-400 cursor-default opacity-60">Lihat Semua</span>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x">
            {featuredBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => setSelectedBookDetail(book)}
                className="snap-start shrink-0 w-32 cursor-pointer group"
              >
                <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-300 bg-slate-100 border border-slate-200/80">
                  <img
                    src={
                      book.coverImage ||
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'
                    }
                    alt={book.judul}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-90" />
                  
                  {/* Stock pill overlay */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <span
                      className={`block px-1.5 py-0.5 rounded-md text-[9px] font-bold text-center text-white backdrop-blur-md ${
                        book.tipe === 'Fisik'
                          ? book.stok > 0
                            ? 'bg-emerald-600/90'
                            : 'bg-red-500/90'
                          : 'bg-cyan-600/90'
                      }`}
                    >
                      {book.tipe === 'Fisik' ? `${book.stok} Tersedia` : 'E-Book'}
                    </span>
                  </div>
                </div>
                <h3 className="mt-2 text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition">
                  {book.judul}
                </h3>
                <p className="text-[10px] text-slate-500 line-clamp-1">{book.pengarang}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section 2: Genre & Filter Chips */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-extrabold text-slate-900">Kategori Populers</h2>
          </div>

          {/* Type Switcher */}
          <div className="flex bg-slate-200/70 p-0.5 rounded-xl border border-slate-200">
            {(['All', 'Fisik', 'E-book'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg transition ${
                  typeFilter === t ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                {t === 'All' ? 'Semua' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Category Scrollable Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                categoryFilter === c
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Section 3: All Books Grid / List */}
      <div className="space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900">Katalog Perpustakaan</h2>

        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-xs p-6">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">Buku tidak ditemukan</h3>
            <p className="text-xs text-slate-500 mt-1">Coba kata kunci pencarian atau kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => setSelectedBookDetail(book)}
                className="group bg-white p-3 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex gap-3 cursor-pointer"
              >
                {/* Book Thumbnail */}
                <div className="relative aspect-[3/4] w-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80">
                  <img
                    src={
                      book.coverImage ||
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'
                    }
                    alt={book.judul}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-1 left-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase text-white ${
                        book.tipe === 'Fisik' ? 'bg-amber-500' : 'bg-cyan-600'
                      }`}
                    >
                      {book.tipe}
                    </span>
                  </div>
                </div>

                {/* Content Info */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                        {book.kategori}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>4.8</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-900 line-clamp-1 group-hover:text-emerald-600 transition">
                      {book.judul}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Oleh: {book.pengarang}</p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    {book.tipe === 'Fisik' ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          book.stok > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {book.stok > 0 ? `${book.stok} Stok Buku` : 'Stok Habis'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200">
                        Akses Instan
                      </span>
                    )}

                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
                      <span>Detail</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Book Details Mobile Sheet Modal */}
      {selectedBookDetail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedBookDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition z-10"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Book Hero Showcase Backdrop */}
            <div className="relative flex flex-col items-center pt-2 pb-4 text-center">
              <div className="relative aspect-[3/4] w-36 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 mb-4">
                <img
                  src={
                    selectedBookDetail.coverImage ||
                    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'
                  }
                  alt={selectedBookDetail.judul}
                  className="w-full h-full object-cover"
                />
              </div>

              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase mb-2">
                {selectedBookDetail.kategori}
              </span>

              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                {selectedBookDetail.judul}
              </h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Oleh: {selectedBookDetail.pengarang}
              </p>

              {/* Ratings & Stock Badge */}
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 text-amber-700 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>4.8 (22 ulasan)</span>
                </div>

                <div className="bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold">
                  {selectedBookDetail.tipe === 'Fisik'
                    ? `${selectedBookDetail.stok} Buku Tersedia`
                    : 'Aset Digital PDF'}
                </div>
              </div>

              {/* Action Buttons: Borrow / Read & Bookmark */}
              <div className="flex items-center gap-2 w-full mt-5">
                {selectedBookDetail.tipe === 'E-book' ? (
                  <button
                    onClick={() => {
                      const b = selectedBookDetail;
                      setSelectedBookDetail(null);
                      onOpenPDFReader(b);
                    }}
                    className="flex-1 py-3 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 transition"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Baca E-Book Sekarang</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const b = selectedBookDetail;
                      setSelectedBookDetail(null);
                      onBorrowBook(b);
                    }}
                    disabled={selectedBookDetail.stok <= 0}
                    className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition ${
                      selectedBookDetail.stok > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{selectedBookDetail.stok > 0 ? 'Pinjam Buku Fisik' : 'Stok Habis'}</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const newSet = new Set(bookmarkedIds);
                    if (newSet.has(selectedBookDetail.id)) {
                      newSet.delete(selectedBookDetail.id);
                    } else {
                      newSet.add(selectedBookDetail.id);
                    }
                    setBookmarkedIds(newSet);
                  }}
                  className={`p-3 rounded-2xl border transition ${
                    bookmarkedIds.has(selectedBookDetail.id)
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                  title="Simpan Favorit"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Synopsis Section */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Sinopsis Buku
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {selectedBookDetail.deskripsi ||
                  'Buku ini merupakan salah satu koleksi terlaris di perpustakaan sekolah yang menyajikan ilmu dan wawasan mendalam untuk siswa.'}
              </p>
              <div className="pt-2 flex justify-between text-[10px] text-slate-400 font-medium">
                <span>ISBN: {selectedBookDetail.isbn}</span>
                <span>Tahun Terbit: {selectedBookDetail.tahunTerbit || '2024'}</span>
              </div>
            </div>

            {/* Similar Books Section */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5 mt-4">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Buku Serupa
              </h4>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {books
                  .filter((b) => b.id !== selectedBookDetail.id)
                  .slice(0, 4)
                  .map((simBook) => (
                    <div
                      key={simBook.id}
                      onClick={() => setSelectedBookDetail(simBook)}
                      className="shrink-0 w-20 cursor-pointer"
                    >
                      <div className="aspect-[3/4] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={
                            simBook.coverImage ||
                            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400'
                          }
                          alt={simBook.judul}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-900 line-clamp-1 mt-1">
                        {simBook.judul}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
