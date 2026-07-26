import React from 'react';
import { BookOpen, RefreshCw, Wifi, WifiOff, Settings, LogOut } from 'lucide-react';
import { User } from '../types';

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
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3 shadow-xs">
      <div className="max-w-md md:max-w-4xl lg:max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Brand Mobile App Logo */}
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('catalog')}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900">
              DigiTalib
            </span>
            <div className="text-[9px] font-bold text-emerald-600">Mobile Library</div>
          </div>
        </div>

        {/* Right Status Actions & Settings */}
        <div className="flex items-center space-x-2">

          {/* Network Pill */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {isOnline ? <Wifi className="w-2.5 h-2.5" /> : <WifiOff className="w-2.5 h-2.5" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Manual Sync Trigger */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="relative p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition"
            title="Sync GAS"
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
              title="Pengaturan Backend API"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}

          {/* User Avatar / Auth & Logout */}
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenProfile}
                className="p-0.5 rounded-full ring-2 ring-emerald-500/40 hover:ring-emerald-600 transition"
                title="Profil Saya"
              >
                <img
                  src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.nis}`}
                  alt={currentUser.nama}
                  className="w-7 h-7 rounded-full object-cover"
                />
              </button>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition"
                title="Keluar (Logout)"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-md shadow-emerald-600/20 transition"
            >
              Masuk
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
