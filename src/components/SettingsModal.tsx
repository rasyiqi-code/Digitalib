import React, { useState, useEffect } from 'react';
import { X, Settings, Database, RefreshCw, Link as LinkIcon, Server, Trash2, CloudDownload, Clock, DollarSign, BookOpen, Bell } from 'lucide-react';
import { getConfig, saveConfig, fetchInitialDataFromGAS } from '../services/api';
import { clearAllLocalData, getLibrarySettings, saveLibrarySettings } from '../services/db';
import { AppConfig, LibrarySettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onConfigSaved }) => {
  const [config, setConfigState] = useState<AppConfig>({
    gasUrl: '',
    useLiveGas: false,
    autoSync: true,
  });

  const [policy, setPolicyState] = useState<LibrarySettings>({
    maxBorrowDays: 7,
    maxBorrowLimit: 3,
    finePerDay: 1000,
    enableOverdueNotifications: true,
  });

  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingGAS, setIsFetchingGAS] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentConfig();
    }
  }, [isOpen]);

  const loadCurrentConfig = async () => {
    const cfg = await getConfig();
    const pol = await getLibrarySettings();
    setConfigState(cfg);
    setPolicyState(pol);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveConfig(config);
    await saveLibrarySettings(policy);
    onConfigSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    if (!config.gasUrl) {
      setTestResult('Masukkan URL Web App GAS!');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(`${config.gasUrl}?action=getBooks`);
      const data = await res.json();
      if (data.status === 'success') {
        setTestResult('Koneksi REST API GAS Berhasil!');
      } else {
        setTestResult(`Respon GAS: ${data.message || 'Gagal'}`);
      }
    } catch (e: any) {
      setTestResult('Gagal terhubung. Pastikan akses set ke "Anyone".');
    } finally {
      setIsTesting(false);
    }
  };

  const handleFetchDataGAS = async () => {
    setIsFetchingGAS(true);
    setTestResult(null);
    const res = await fetchInitialDataFromGAS();
    setTestResult(res.message);
    setIsFetchingGAS(false);
    if (res.success) {
      onConfigSaved();
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan seluruh data lokal IndexedDB? (Data demo/lokal akan dihapus)')) {
      await clearAllLocalData();
      setTestResult('Database lokal berhasil dikosongkan.');
      onConfigSaved();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm glass-modal rounded-3xl p-6 shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pengaturan Backend & DB</h3>
              <p className="text-[10px] text-slate-500">Konfigurasi Google Apps Script & Reset Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Configuration Form */}
        <form onSubmit={handleSave} className="mt-4 space-y-3.5 text-xs">
          
          {/* Mode Switch Toggle */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold text-slate-800">Aktifkan Live GAS API</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.useLiveGas}
                  onChange={(e) => setConfigState({ ...config, useLiveGas: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>

          {/* GAS Web App URL Input */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-slate-400" />
              <span>URL Web App GAS</span>
            </label>
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={config.gasUrl}
              onChange={(e) => setConfigState({ ...config, gasUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-[11px] focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="py-2 px-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] hover:bg-slate-200 transition flex items-center justify-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 text-emerald-600 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Tes Koneksi</span>
            </button>

            <button
              type="button"
              onClick={handleFetchDataGAS}
              disabled={isFetchingGAS || !config.gasUrl}
              className="py-2 px-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] hover:bg-emerald-100 transition flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <CloudDownload className="w-3 h-3 text-emerald-600" />
              <span>Tarik Data GAS</span>
            </button>
          </div>

          {/* Library Policy & Fine Rate Settings Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-[11px] uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Kebijakan & Tarif Denda Telat</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Maks. Durasi (Hari)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={policy.maxBorrowDays}
                  onChange={(e) => setPolicyState({ ...policy, maxBorrowDays: parseInt(e.target.value) || 7 })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  Batas Pinjam (Buku)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={policy.maxBorrowLimit}
                  onChange={(e) => setPolicyState({ ...policy, maxBorrowLimit: parseInt(e.target.value) || 3 })}
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                Tarif Denda Telat (Rp / Hari)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs font-bold text-slate-400">Rp</span>
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={policy.finePerDay}
                  onChange={(e) => setPolicyState({ ...policy, finePerDay: parseInt(e.target.value) || 0 })}
                  className="w-full pl-9 pr-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-bold text-amber-900 text-[10px]">Notif Banner Keterlambatan</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.enableOverdueNotifications}
                  onChange={(e) => setPolicyState({ ...policy, enableOverdueNotifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-7 h-3.5 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-amber-300 after:border after:rounded-full after:h-2.5 after:w-2.5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          {/* Reset Storage Action */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleResetDatabase}
              className="w-full py-2 px-3 rounded-xl bg-red-50 border border-red-200 text-red-600 font-bold text-[11px] hover:bg-red-100 transition flex items-center justify-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Kosongkan / Reset Storage Lokal</span>
            </button>
          </div>

          {/* Test Result Alert */}
          {testResult && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
              {testResult}
            </div>
          )}

          {/* Storage Information Card */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 text-[10px] text-slate-500">
            <Database className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Penyimpanan lokal menggunakan IndexedDB luring.</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
          >
            Simpan Pengaturan
          </button>
        </form>

      </div>
    </div>
  );
};
