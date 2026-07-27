import React from 'react';
import { BookOpen, RefreshCw, Wifi, WifiOff, Settings, LogOut } from 'lucide-react';
import { User, LibrarySettings } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeTab: 'catalog' | 'my-loans' | 'profile' | 'admin';
  setActiveTab: (tab: 'catalog' | 'my-loans' | 'profile' | 'admin') => void;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  onOpenAuth: () => void;
  onOpenStudentCard: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onSync: () => void;
  onLogout: () => void;
  libraryPolicy?: LibrarySettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  isOnline,
  isSyncing,
  pendingSyncCount,
  onOpenAuth,
  onOpenStudentCard,
  onOpenSettings,
  onOpenProfile,
  onSync,
  onLogout,
  libraryPolicy,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 shadow-xs">
      <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Brand Mobile App Logo */}
        <div className="flex items-center space-x-2 cursor-pointer max-w-[130px] min-[380px]:max-w-[170px] sm:max-w-[260px] shrink-0" onClick={() => setActiveTab('catalog')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-extrabold tracking-tight text-slate-900 block truncate">
              {libraryPolicy?.libraryName || 'DigiTalib'}
            </span>
            <div className="text-[9px] font-bold text-emerald-600 truncate">
              {libraryPolicy?.schoolName || 'Mobile Library'}
            </div>
          </div>
        </div>

        {/* Right Status Actions & Settings */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">

          {/* Network Pill */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
            title={isOnline ? 'Sistem Terhubung (Online)' : 'Sistem Mode HP (Offline)'}
          >
            {isOnline ? <Wifi className="w-3 h-3 text-emerald-600" /> : <WifiOff className="w-3 h-3 text-amber-600" />}
            <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Manual Sync Trigger */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="relative p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition"
            title="Sync Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : ''}`} />
            {pendingSyncCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-white">
                {pendingSyncCount}
              </span>
            )}
          </button>

          {/* Settings Button (Admin & Super Admin only) */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin') && (
            <button
              onClick={onOpenSettings}
              className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition"
              title="Pengaturan Aplikasi"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {/* User Avatar / Auth */}
          {currentUser ? (
            <button
              onClick={onOpenProfile}
              className="p-0.5 rounded-full ring-2 ring-emerald-500/40 hover:ring-emerald-600 transition shrink-0 ml-0.5"
              title="Profil Saya & Card"
            >
              <img
                src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.nis}`}
                alt={currentUser.nama}
                className="w-7 h-7 rounded-full object-cover"
              />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-md shadow-emerald-600/20 transition"
            >
              Masuk
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
