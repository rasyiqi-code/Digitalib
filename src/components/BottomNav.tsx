import React from 'react';
import { BookOpen, QrCode, Shield, Clock, ScanBarcode } from 'lucide-react';
import { User } from '../types';

interface BottomNavProps {
  currentUser: User | null;
  activeTab: 'catalog' | 'my-loans' | 'profile' | 'admin';
  setActiveTab: (tab: 'catalog' | 'my-loans' | 'profile' | 'admin') => void;
  onOpenScanner: () => void;
  onOpenStudentCard: () => void;
  onOpenAuth: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  onOpenScanner,
  onOpenStudentCard,
  onOpenAuth,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 max-w-md md:max-w-4xl lg:max-w-5xl mx-auto sm:rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        
        {/* Tab 1: Katalog */}
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all ${
            activeTab === 'catalog'
              ? 'text-emerald-600 scale-105 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Katalog</span>
        </button>

        {/* Tab 2: Pinjaman Saya */}
        <button
          onClick={() => {
            if (currentUser) {
              setActiveTab('my-loans');
            } else {
              onOpenAuth();
            }
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all ${
            activeTab === 'my-loans'
              ? 'text-emerald-600 scale-105 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Clock className={`w-5 h-5 mb-0.5 ${activeTab === 'my-loans' ? 'text-emerald-600' : ''}`} />
          <span className="text-[10px]">Pinjaman</span>
        </button>

        {/* Tab 3: FAB Scanner Barcode */}
        <button
          onClick={onOpenScanner}
          className="flex flex-col items-center justify-center relative -top-3 cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-105 transition-transform border-2 border-white">
            <ScanBarcode className="w-6 h-6" />
          </div>
          <span className="text-[9px] font-bold text-emerald-700 mt-0.5">Scan</span>
        </button>

        {/* Tab 4: Kartu QR Siswa */}
        <button
          onClick={() => {
            if (currentUser) {
              onOpenStudentCard();
            } else {
              onOpenAuth();
            }
          }}
          className="flex flex-col items-center justify-center flex-1 py-1.5 text-slate-500 hover:text-emerald-600 transition-all"
        >
          <QrCode className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Kartu QR</span>
        </button>

        {/* Tab 5: Admin Panel (if admin or super_admin) or Dedicated Profile Tab */}
        {currentUser?.role === 'admin' || currentUser?.role === 'super_admin' ? (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all ${
              activeTab === 'admin'
                ? 'text-amber-600 scale-105 font-bold'
                : 'text-amber-600/80 hover:text-amber-700'
            }`}
          >
            <Shield className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (currentUser) {
                setActiveTab('profile');
              } else {
                onOpenAuth();
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-all ${
              activeTab === 'profile'
                ? 'text-emerald-600 scale-105 font-bold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <img
              src={currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'}
              alt="Profil"
              className="w-5 h-5 rounded-full object-cover ring-1 ring-emerald-500/50 mb-0.5"
            />
            <span className="text-[10px]">{currentUser ? 'Saya' : 'Profil'}</span>
          </button>
        )}

      </div>
    </nav>
  );
};
