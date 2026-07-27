import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Lock, UserCheck, ShieldAlert, KeyRound, ArrowRight } from 'lucide-react';
import { loginUser } from '../services/api';
import { User } from '../types';

const loginSchema = z.object({
  nis: z
    .string()
    .min(5, 'NIS minimal 5 digit')
    .max(12, 'NIS maksimal 12 digit')
    .regex(/^[0-9]+$/, 'NIS hanya boleh berisi angka'),
  pin: z
    .string()
    .min(4, 'PIN minimal 4 digit')
    .max(8, 'PIN maksimal 8 digit')
    .regex(/^[0-9]+$/, 'PIN hanya boleh berisi angka'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccessLogin }) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      nis: '',
      pin: '',
    },
  });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const onSubmit = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await loginUser(data.nis, data.pin);
      if (result.success && result.user) {
        onSuccessLogin(result.user);
        onClose();
      } else {
        setErrorMessage(result.message || 'Login gagal');
      }
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan jaringan atau server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (nis: string, pin: string) => {
    setValue('nis', nis);
    setValue('pin', pin);
    onSubmit({ nis, pin });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm glass-modal rounded-3xl p-6 shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Autentikasi Siswa</h2>
          <p className="text-xs text-slate-500 mt-1">Masukkan Nomor Induk Siswa (NIS) dan PIN</p>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Induk Siswa (NIS)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UserCheck className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Contoh: 10239481"
                {...register('nis')}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
            {errors.nis && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.nis.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">PIN Akses</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="••••••"
                {...register('pin')}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white transition"
              />
            </div>
            {errors.pin && <p className="text-[10px] text-red-500 mt-1 font-medium">{errors.pin.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            {isLoading ? (
              <span>Memverifikasi...</span>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
