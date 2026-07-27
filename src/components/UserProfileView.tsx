import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  QrCode,
  KeyRound,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Camera,
  Upload,
  X,
  Sparkles,
} from 'lucide-react';
import { User, Transaction } from '../types';
import { saveUserToDB } from '../services/db';

interface UserProfileViewProps {
  currentUser: User | null;
  userTransactions: Transaction[];
  onOpenStudentCard: () => void;
  onLogout: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onUpdateUser?: (updatedUser: User) => void;
}

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=SiswaPelajar1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=SiswaPelajar2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=CendekiawanSekolah',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=PustakawanPro',
  'https://api.dicebear.com/7.x/bottts/svg?seed=DigiBotPerpus',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=SiswaJuara3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=SiswaKreatif4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=KepalaPerpusAdmin',
];

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  currentUser,
  userTransactions,
  onOpenStudentCard,
  onLogout,
  onShowToast,
  onUpdateUser,
}) => {
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Avatar Modal State
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!currentUser) return null;

  const activeLoans = userTransactions.filter((t) => t.status === 'DIPINJAM');
  const completedLoans = userTransactions.filter((t) => t.status === 'DIKEMBALIKAN');

  const handleAvatarUpdate = async (newAvatarUrl: string) => {
    try {
      const updatedUser: User = { ...currentUser, avatarUrl: newAvatarUrl };
      await saveUserToDB(updatedUser);
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      onShowToast('Foto profil berhasil diperbarui!', 'success');
      setIsAvatarModalOpen(false);
    } catch (e) {
      onShowToast('Gagal memperbarui foto profil.', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('Ukuran gambar maksimal 5MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleAvatarUpdate(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    if (currentPin !== currentUser.pin) {
      setPinError('PIN lama yang Anda masukkan tidak cocok!');
      return;
    }

    if (newPin.length < 4) {
      setPinError('PIN baru minimal harus 4 digit!');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('Konfirmasi PIN baru tidak sesuai!');
      return;
    }

    try {
      const updatedUser: User = { ...currentUser, pin: newPin };
      await saveUserToDB(updatedUser);
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      }
      onShowToast('PIN keamanan Anda berhasil diubah!', 'success');
      setIsChangingPin(false);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setPinError('Gagal menyimpan PIN baru.');
    }
  };

  return (
    <div className="space-y-4 pb-6">

      {/* Main Profile Header Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />

        {/* Profile Avatar with Interactive Camera Edit Badge */}
        <div className="relative mb-3 group cursor-pointer" onClick={() => setIsAvatarModalOpen(true)}>
          <img
            src={
              currentUser.avatarUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.nis}`
            }
            alt={currentUser.nama}
            className="w-22 h-22 rounded-full object-cover ring-4 ring-emerald-500/20 shadow-md border-2 border-white group-hover:opacity-90 transition"
          />
          <button
            type="button"
            className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md border-2 border-white transition transform group-hover:scale-110"
            title="Ubah Foto Profil"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-xl font-extrabold text-slate-900">{currentUser.nama}</h2>
        <p className="text-xs text-slate-500 font-semibold mt-0.5">
          NIS: {currentUser.nis} • Kelas: {currentUser.kelas}
        </p>

        {/* Role Badge */}
        <div className="mt-3">
          <span
            className={`px-3.5 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
              currentUser.role === 'super_admin'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : currentUser.role === 'admin'
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}
          >
            {currentUser.role === 'super_admin'
              ? '👑 Kepala Perpustakaan (Super Admin)'
              : currentUser.role === 'admin'
              ? '🛡️ Pustakawan (Admin)'
              : '🎓 Siswa Aktif Perpustakaan'}
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dipinjam</div>
          <div className="text-xl font-extrabold text-amber-700 mt-0.5">{activeLoans.length}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Selesai</div>
          <div className="text-xl font-extrabold text-emerald-700 mt-0.5">{completedLoans.length}</div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bebas Denda</div>
          <div className="text-xs font-extrabold text-cyan-800 mt-2 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-cyan-600" />
            <span>Aktif</span>
          </div>
        </div>
      </div>

      {/* Profile Features & Settings Section */}
      {!isChangingPin ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
          <div className="px-4 py-3 bg-slate-50/50">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
              Pengaturan Akun & Keamanan
            </h3>
          </div>

          {/* Action 1: QR Card */}
          <button
            onClick={onOpenStudentCard}
            className="w-full p-4 hover:bg-emerald-50/40 transition flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                  Kartu Anggota Digital (QR Code)
                </div>
                <div className="text-[10px] text-slate-500">Tunjukkan untuk peminjaman cepat di konter</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
          </button>

          {/* Action 2: Change PIN */}
          <button
            onClick={() => setIsChangingPin(true)}
            className="w-full p-4 hover:bg-amber-50/40 transition flex items-center justify-between text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition">
                  Ubah PIN Keamanan (Password)
                </div>
                <div className="text-[10px] text-slate-500">Perbarui PIN akses pribadi Anda</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
          </button>

          {/* Action 3: Logout */}
          <button
            onClick={onLogout}
            className="w-full p-4 hover:bg-red-50/60 text-red-600 transition flex items-center justify-between text-left font-bold text-xs"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-50 text-red-600">
                <LogOut className="w-5 h-5" />
              </div>
              <span>Keluar Dari Akun (Logout)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>
        </div>
      ) : (
        /* Change PIN Form View */
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Form Ubah PIN Keamanan</span>
            </h3>
            <button
              onClick={() => setIsChangingPin(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 underline"
            >
              Batal
            </button>
          </div>

          {pinError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <form onSubmit={handleChangePinSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">PIN Lama Saat Ini</label>
              <input
                type="password"
                required
                placeholder="••••"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">PIN Baru</label>
              <input
                type="password"
                required
                placeholder="••••"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Konfirmasi PIN Baru</label>
              <input
                type="password"
                required
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-md shadow-amber-600/20 transition mt-2"
            >
              Simpan PIN Baru
            </button>
          </form>
        </div>
      )}

      {/* Avatar Change Modal */}
      {isAvatarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Ubah Foto Profil</h3>
                  <p className="text-[10px] text-slate-500">Unggah foto atau pilih avatar preset</p>
                </div>
              </div>
              <button
                onClick={() => setIsAvatarModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option 1: File Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Unggah Foto Dari Galeri / Kamera</span>
              </button>
            </div>

            {/* Option 2: Preset Avatars */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Atau Pilih Avatar Preset:</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_PRESETS.map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAvatarUpdate(presetUrl)}
                    className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-emerald-500 hover:scale-105 transition shadow-xs focus:outline-none"
                  >
                    <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
