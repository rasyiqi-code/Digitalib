import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Bookmark, ShieldCheck, FileText, ArrowLeft } from 'lucide-react';
import { Book } from '../types';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface PDFReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: Book | null;
}

export const PDFReaderModal: React.FC<PDFReaderModalProps> = ({ isOpen, onClose, book }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 14; // Demo PDF page count
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !book) return null;

  const handleDownloadForOffline = async () => {
    setIsDownloading(true);
    try {
      // Use Capacitor Filesystem to download/save offline if on native mobile device
      if (book.pdfUrl) {
        try {
          await Filesystem.writeFile({
            path: `digitalib_ebook_${book.id}.pdf`,
            data: book.pdfUrl,
            directory: Directory.Data,
          });
        } catch (capErr) {
          console.log('[Filesystem] Fallback to browser download link:', capErr);
        }
      }
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen || !book) return null;

  // Helper to format PDF URLs for inline iframe previewing (prevents browser auto-download)
  const getEmbedUrl = (rawUrl?: string) => {
    if (!rawUrl) return null;
    let url = rawUrl.trim();

    // Handle Google Drive links
    if (url.includes('drive.google.com')) {
      let cleanUrl = url;
      if (cleanUrl.includes('/view')) {
        cleanUrl = cleanUrl.replace('/view', '/preview');
      }
      if (cleanUrl.includes('/edit')) {
        cleanUrl = cleanUrl.replace('/edit', '/preview');
      }
      if (cleanUrl.includes('/uc?') || cleanUrl.includes('export=download')) {
        const match = cleanUrl.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          cleanUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
      }
      if (!cleanUrl.includes('#toolbar=0')) {
        cleanUrl += '#toolbar=0';
      }
      return cleanUrl;
    }

    // Direct PDF URL fallback: Use Google Docs Embedded Viewer to force inline reading without auto-download
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }

    return url;
  };

  const embedPdfUrl = getEmbedUrl(book?.pdfUrl);

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col max-w-md md:max-w-3xl lg:max-w-5xl mx-auto animate-fade-in md:my-6 md:rounded-3xl md:border md:border-slate-200 md:shadow-2xl overflow-hidden">
      
      {/* Light-Theme Top Header Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between z-10 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-sm font-extrabold text-slate-900 line-clamp-1">{book.judul}</h2>
            <p className="text-[10px] text-cyan-700 font-bold line-clamp-1">{book.pengarang}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Download Button */}
          <button
            onClick={handleDownloadForOffline}
            disabled={isDownloading}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
              downloadSuccess
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 shadow-xs'
            }`}
            title="Unduh E-Book ke Penyimpanan HP"
          >
            {downloadSuccess ? (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <Download className="w-4 h-4 text-emerald-600" />
            )}
            <span className="hidden sm:inline">Unduh HP</span>
          </button>

          {/* Bookmark Toggle */}
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-2 rounded-xl border transition ${
              isBookmarked
                ? 'bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
            title="Tandai Halaman Ini"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Light-Theme Toolbar Controls (Zoom & Navigation) */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100/90 border-b border-slate-200 text-xs shrink-0">
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoomLevel(Math.max(60, zoomLevel - 15))}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-bold text-slate-700 text-xs w-9 text-center">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(180, zoomLevel + 15))}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Page Counter & Navigation */}
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 disabled:opacity-40 shadow-xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-slate-900 text-xs">
            Hal <span className="text-cyan-700 font-extrabold">{currentPage}</span> / {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 disabled:opacity-40 shadow-xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Embedded PDF Reading Screen */}
      <div className="flex-1 bg-slate-200/50 p-2 overflow-auto flex items-center justify-center relative">
        {embedPdfUrl ? (
          /* Real Embedded PDF Document Viewer (Supports Google Drive / Direct PDF) */
          <div className="w-full h-full rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm relative">
            {/* Seamless Top-Right Mask Overlay to hide Google Drive "Lepas / Open in New Window" button */}
            <div 
              className="absolute top-0 right-0 w-16 h-14 bg-white z-10 pointer-events-auto"
            />

            <iframe
              src={embedPdfUrl}
              className="w-full h-full border-0 bg-white"
              title={`E-Book Reader - ${book.judul}`}
              allow="autoplay"
            />
          </div>
        ) : (
          /* Structured Digital E-Book Reader View */
          <div
            className="transition-all duration-200 bg-white text-slate-900 shadow-xl rounded-2xl p-6 sm:p-10 w-full max-w-xl min-h-[500px] flex flex-col justify-between border border-slate-200"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
          >
            <div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-5">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-cyan-700">
                  PERPUSTAKAAN DIGITAL - MODUL UTAMA
                </span>
                <span className="text-[10px] text-slate-500 font-bold">HALAMAN {currentPage}</span>
              </div>

              <h2 className="text-lg font-extrabold text-slate-900 mb-2">{book.judul}</h2>
              <p className="text-xs font-semibold text-cyan-800 mb-4">Pengarang: {book.pengarang} • Kategori: {book.kategori}</p>

              <div className="space-y-3 text-xs text-slate-700 leading-relaxed font-serif">
                <p>{book.deskripsi || 'Dokumen e-book digital resmi dari koleksi perpustakaan sekolah.'}</p>
                <div className="p-3 bg-cyan-50 rounded-xl border border-cyan-200 text-cyan-900 text-[10px] font-mono space-y-1">
                  <div>KODE ISBN: {book.isbn}</div>
                  <div>TIPE ASET: E-Book PDF Digital</div>
                  <div>AKSES: Instan Offline Cache</div>
                </div>
              </div>
            </div>

            {/* Footer Page Branding */}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400">
              <span>Hak Cipta © Perpustakaan Sekolah DigiTalib</span>
              <span>Halaman {currentPage} / {totalPages}</span>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
