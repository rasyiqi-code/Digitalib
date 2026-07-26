# DigiTalib - Sistem Perpustakaan Hybrid Sekolah

Sistem Perpustakaan Hybrid berbasis Web & Android yang dirancang khusus untuk operasional perpustakaan sekolah internal dengan biaya infrastruktur server Rp 0.

## 🚀 Fitur Utama

1. **Autentikasi (NIS / PIN)**: Controlled forms menggunakan `React Hook Form` + `Zod` dengan fallback penyimpanan luring.
2. **Katalog "Offline-First"**: Menggunakan `IndexedDB` (`idb` v8) untuk pencarian katalog kilat (< 0.5s) tanpa tergantung jaringan internet.
3. **Scanner ISBN & Peminjaman**: Kamera barcode scanner terintegrasi (`@zxing/browser` + `@capacitor/camera`) untuk pemindaian ISBN dan QR Siswa.
4. **Kartu QR Siswa Digital**: Generasi Kartu Anggota Perpustakaan QR Code (`react-qr-code`) dengan data NIS terenkripsi.
5. **E-Reader (PDF)**: Modal pembaca PDF digital interaktif dengan zoom, navigasi halaman, dan opsi unduh offline via `@capacitor/filesystem`.
6. **Backend Google Apps Script**: REST API terintegrasi ke Google Sheets (`DB_Users`, `DB_Buku`, `DB_Transaksi`) dengan `LockService` untuk integritas data simultan.

---

## 🛠️ Langkah Pengoperasian & Deployment

### 1. Jalankan Mode Lokal (Vite Dev Server)
```bash
npm run dev
```

### 2. Jalankan Production Build & Type Checking
```bash
npm run build
```

### 3. Sinkronisasi ke Android (Capacitor)
```bash
npm run build
npx cap sync
npx cap open android
```

### 4. Deploy Backend Google Apps Script (GAS)
1. Salin kode dari file `gas/Code.gs`.
2. Buka Google Sheets baru -> Ekstensi -> Apps Script.
3. Tempel kode `Code.gs` lalu klik **Deploy** -> **New Deployment** -> Pilih **Web app**.
4. Set *Execute as*: **Me**, *Who has access*: **Anyone**.
5. Salin URL Web App dan masukkan pada **Pengaturan (Settings)** di aplikasi.
