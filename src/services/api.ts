import { User, Book, Transaction, AppConfig } from '../types';
import {
  getUserByNIS,
  getPendingSyncQueue,
  markSyncItemCompleted,
  getAppSetting,
  setAppSetting,
  createBorrowTransactionInDB,
  createReturnTransactionInDB,
  populateFromGAS,
} from './db';

const DEFAULT_CONFIG: AppConfig = {
  gasUrl: '',
  useLiveGas: false,
  autoSync: true,
};

export async function getConfig(): Promise<AppConfig> {
  const config = await getAppSetting('app_config', DEFAULT_CONFIG);
  return config;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await setAppSetting('app_config', config);
}

// Authentication Service
export async function loginUser(nis: string, pin: string): Promise<{ success: boolean; user?: User; message?: string }> {
  const config = await getConfig();

  // If live GAS API configured
  if (config.useLiveGas && config.gasUrl) {
    try {
      const response = await fetch(config.gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          payload: { nis, pin },
        }),
      });
      const data = await response.json();
      if (data.status === 'success' && data.user) {
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Login ke GAS Gagal' };
      }
    } catch (e: any) {
      console.warn('[API] Live GAS request failed, falling back to IndexedDB local auth:', e);
    }
  }

  // Default System Master Super Admin Account Fallback
  if (nis === '99999999' && pin === '888888') {
    const masterAdmin: User = {
      nis: '99999999',
      nama: 'Kepala Perpustakaan (Super Admin)',
      kelas: 'Staf Utama Perpustakaan',
      pin: '888888',
      role: 'super_admin',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
    };
    return { success: true, user: masterAdmin };
  }

  // Local Offline IndexedDB Fallback
  const user = await getUserByNIS(nis);
  if (user) {
    if (user.pin === pin) {
      return { success: true, user };
    } else {
      return { success: false, message: 'PIN yang Anda masukkan salah!' };
    }
  } else {
    return { success: false, message: 'NIS tidak terdaftar dalam database sekolah!' };
  }
}

// Batch Sync Service (Sync IndexedDB pending offline queue to GAS)
export async function syncPendingQueueToGAS(): Promise<{ synced: number; failed: number; message: string }> {
  const config = await getConfig();
  if (!config.useLiveGas || !config.gasUrl) {
    return { synced: 0, failed: 0, message: 'Mode Offline (GAS API belum diaktifkan).' };
  }

  const pendingItems = await getPendingSyncQueue();
  if (pendingItems.length === 0) {
    return { synced: 0, failed: 0, message: 'Semua data telah tersinkronisasi.' };
  }

  try {
    const response = await fetch(config.gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncBatch',
        payload: { items: pendingItems },
      }),
    });

    const result = await response.json();
    if (result.status === 'success') {
      for (const item of pendingItems) {
        await markSyncItemCompleted(item.id);
      }
      return { synced: pendingItems.length, failed: 0, message: `Berhasil sinkronisasi ${pendingItems.length} transaksi ke Google Sheets.` };
    } else {
      return { synced: 0, failed: pendingItems.length, message: result.message || 'Gagal sinkron ke GAS.' };
    }
  } catch (err: any) {
    return { synced: 0, failed: pendingItems.length, message: 'Koneksi jaringan terputus. Data tersimpan di HP/Device.' };
  }
}

// Fetch Real Data from Live Google Apps Script (DB_Buku, DB_Users, DB_Transaksi)
export async function fetchInitialDataFromGAS(): Promise<{ success: boolean; message: string }> {
  const config = await getConfig();
  if (!config.gasUrl) {
    return { success: false, message: 'URL Web App Google Apps Script belum dikonfigurasi!' };
  }

  try {
    const res = await fetch(`${config.gasUrl}?action=getInitialData`);
    const data = await res.json();

    if (data.status === 'success') {
      await populateFromGAS(data.books, data.users, data.transactions);
      return { success: true, message: 'Berhasil menarik data asli dari Google Sheets!' };
    } else {
      return { success: false, message: data.message || 'Gagal mengambil data dari Google Apps Script.' };
    }
  } catch (err: any) {
    return { success: false, message: 'Gagal terhubung ke Google Apps Script API.' };
  }
}
