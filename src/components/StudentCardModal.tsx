import React from 'react';
import QRCode from 'react-qr-code';
import { X, ShieldCheck, CreditCard, Sparkles, BookOpenCheck } from 'lucide-react';
import { User, Transaction } from '../types';

interface StudentCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  activeLoans: Transaction[];
}

export const StudentCardModal: React.FC<StudentCardModalProps> = ({
  isOpen,
  onClose,
  user,
  activeLoans,
}) => {
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
  const maxBorrowLimit = 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm glass-modal rounded-3xl p-6 shadow-2xl border border-slate-700/80 overflow-hidden">
        
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Digital Student Card Container */}
        <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 p-5 border border-emerald-500/30 shadow-xl overflow-hidden">
          
          {/* Card Header & Branding */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-wide">KARTU ANGGOTA PERPUS</div>
                <div className="text-[9px] text-emerald-400 font-semibold uppercase tracking-wider">SMA NEGERI DIGITALIB</div>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-emerald-400 opacity-60" />
          </div>

          {/* Student Details & Photo */}
          <div className="mt-4 flex items-center space-x-4">
            <img
              src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
              alt={user.nama}
              className="w-16 h-16 rounded-xl object-cover ring-2 ring-emerald-500/40 shadow-lg"
            />
            <div>
              <h4 className="text-sm font-extrabold text-white leading-snug">{user.nama}</h4>
              <p className="text-xs text-slate-300 font-medium">Kelas: {user.kelas}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  NIS: {user.nis}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="mt-5 p-4 rounded-xl bg-white flex flex-col items-center justify-center shadow-inner">
            <QRCode
              value={qrPayload}
              size={140}
              bgColor="#ffffff"
              fgColor="#090d16"
              level="M"
            />
            <span className="text-[10px] font-bold text-slate-800 mt-2 tracking-widest font-mono">
              * NIS-{user.nis} *
            </span>
          </div>

          {/* Borrowing Limit Meter */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <BookOpenCheck className="w-4 h-4 text-emerald-400" />
              <span>Buku Dipinjam:</span>
            </div>
            <span className="font-bold text-white">
              {activeLoansCount} / {maxBorrowLimit} Buku
            </span>
          </div>

          {/* Verification Badge */}
          <div className="mt-3 flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/40 py-1.5 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kartu Sah & Didukung Validasi Luring (Offline)</span>
          </div>

        </div>

      </div>
    </div>
  );
};
