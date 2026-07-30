import React, { useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import { toPng } from 'html-to-image';
import { X, ShieldCheck, CreditCard, BookOpenCheck, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { User, Transaction, LibrarySettings } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface StudentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  activeLoans: Transaction[];
  libraryPolicy?: LibrarySettings;
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({
  isOpen,
  onClose,
  user,
  activeLoans,
  libraryPolicy,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen || !user) return null;

  // Format QR Code JSON payload for offline admin validation
  const qrPayload = JSON.stringify({
    nis: user.nis,
    nama: user.nama,
    kelas: user.kelas,
    role: user.role,
    issued: 'DIGITALIB-OFFLINE-VALIDATED',
  });

  const activeLoansCount = activeLoans.filter((t) => t.status === 'DIPINJAM').length;
  const maxBorrowLimit = libraryPolicy?.maxBorrowLimit || 3;

  const handleDownloadPng = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.98,
        cacheBust: true,
        pixelRatio: 2, // High resolution crisp image export
        skipFonts: true,
      });

      const fileName = `Kartu_Anggota_${user.nis}_${user.nama.replace(/\s+/g, '_')}.png`;

      // Save natively via Capacitor Filesystem if running on mobile device
      if (Capacitor.isNativePlatform()) {
        const base64Data = dataUrl.split(',')[1] || dataUrl;
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });
      } else {
        // Standard Web browser download
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Gagal mengunduh gambar kartu:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Top Header Control Bar */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Kartu Anggota Perpustakaan</h3>
              <p className="text-[10px] text-slate-500">Format Gambar HD Siap Simpan / Cetak (PNG)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* PRINTABLE / DOWNLOADABLE PHYSICAL ID CARD FRAME */}
        {/* ========================================================================= */}
        <div 
          ref={cardRef}
          className="id-card-printable w-full bg-white rounded-2xl border-2 border-slate-300 shadow-md overflow-hidden font-sans text-slate-900"
        >
          
          {/* Card Header Accent Bar */}
          <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs border border-white/40 flex items-center justify-center font-black text-sm">
                📚
              </div>
              <div>
                <h4 className="text-xs font-black tracking-wider uppercase leading-none">
                  {libraryPolicy?.libraryName || 'PERPUSTAKAAN DIGITASCHOOL'}
                </h4>
                <p className="text-[9px] text-emerald-100 font-bold tracking-widest uppercase mt-0.5">
                  {libraryPolicy?.schoolName || 'SMA NEGERI DIGITALIB'}
                </p>
              </div>
            </div>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-white/20 border border-white/30 tracking-wider">OFFICIAL</span>
          </div>

          {/* Card Body Content */}
          <div className="p-4 space-y-3">
            
            {/* Student Profile Info & QR Layout */}
            <div className="flex items-center gap-3.5">
              
              {/* Photo Frame */}
              <div className="relative shrink-0">
                <img
                  src={
                    user.avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.nis}`
                  }
                  alt={user.nama}
                  className="w-[4.5rem] h-[5.5rem] rounded-xl object-cover border-2 border-emerald-600 shadow-xs bg-slate-100"
                />
                <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-600 text-white shadow-xs">
                  <ShieldCheck className="w-3 h-3" />
                </div>
              </div>

              {/* Student Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-black text-slate-900 leading-snug line-clamp-1">{user.nama}</h3>
                <div className="space-y-0.5 mt-1 text-xs">
                  <div className="flex items-center gap-1 text-slate-700 font-bold">
                    <span className="text-slate-400 font-medium text-[10px]">NIS:</span>
                    <span className="font-mono text-emerald-800 font-extrabold text-xs">{user.nis}</span>
                  </div>
                  <div className="flex items-center gap-1 text-slate-700 font-bold">
                    <span className="text-slate-400 font-medium text-[10px]">Kelas:</span>
                    <span className="text-slate-900 text-xs">{user.kelas}</span>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold uppercase">
                    {user.role === 'super_admin' ? 'SUPER ADMIN' : user.role === 'admin' ? 'PUSTAKAWAN' : 'SISWA AKTIF'}
                  </span>
                </div>
              </div>

              {/* High Contrast QR Code */}
              <div className="shrink-0 p-1.5 rounded-xl bg-white border border-slate-300 shadow-xs flex flex-col items-center">
                <QRCode
                  value={qrPayload}
                  size={75}
                  bgColor="#ffffff"
                  fgColor="#090d16"
                  level="M"
                />
                <span className="text-[8px] font-bold text-slate-700 mt-1 font-mono tracking-tighter">
                  {user.nis}
                </span>
              </div>

            </div>

            {/* Card Footer Line & Security Validation */}
            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500 font-medium">
              <span className="flex items-center gap-1">
                <BookOpenCheck className="w-3 h-3 text-emerald-600" />
                <span>Batas Pinjam: <strong>{activeLoansCount}/{maxBorrowLimit} Buku</strong></span>
              </span>
              <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                VALIDATED • ONLINE/OFFLINE
              </span>
            </div>

          </div>

          {/* Bottom Card Strip */}
          <div className="bg-slate-100 border-t border-slate-200 px-4 py-1.5 flex justify-between items-center text-[8px] text-slate-500 font-semibold">
            <span>Diterbitkan oleh Perpustakaan Resmi Sekolah</span>
            <span>Berlaku Selama Menjadi Anggota</span>
          </div>

        </div>

        {/* Action Button: Download PNG Image */}
        <div className="mt-4">
          <button
            onClick={handleDownloadPng}
            disabled={isDownloading}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 ${
              downloadSuccess
                ? 'bg-emerald-700 text-white shadow-emerald-700/20'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 disabled:opacity-50'
            }`}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengunduh Berkas PNG...</span>
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300 animate-bounce" />
                <span>Kartu Berhasil Disimpan ke HP / Peramban!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh Kartu Anggota (PNG Image)</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
