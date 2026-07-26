import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { ArrowLeft, Camera, ScanLine, AlertCircle, Keyboard, CheckCircle, SwitchCamera } from 'lucide-react';
import { Book } from '../types';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  books: Book[];
  onScanResult: (code: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  books,
  onScanResult,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScannedFeedback(null);
      setCameraError(null);
      return;
    }

    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    // List cameras
    codeReader
      .listVideoInputDevices()
      .then((devices) => {
        setVideoDevices(devices);
        if (devices.length > 0 && !selectedDeviceId) {
          // Prefer back camera if available
          const backCam = devices.find(
            (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment')
          );
          setSelectedDeviceId(backCam ? backCam.deviceId : devices[0].deviceId);
        }
      })
      .catch((err) => console.warn('[Scanner] Failed to list devices:', err));

    startCamera(selectedDeviceId);

    return () => {
      stopCamera();
    };
  }, [isOpen, selectedDeviceId]);

  const startCamera = async (deviceId: string | null) => {
    try {
      setIsScanning(true);
      setCameraError(null);
      const codeReader = codeReaderRef.current || new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      const videoElement = videoRef.current;
      if (!videoElement) return;

      await codeReader.decodeFromVideoDevice(
        deviceId,
        videoElement,
        (result: Result | undefined, err: any) => {
          if (result) {
            const text = result.getText();
            handleDetectedCode(text);
          }
        }
      );
    } catch (err: any) {
      console.warn('[Scanner] Camera error or permission denied:', err);
      setCameraError('Kamera tidak terdeteksi atau izin kamera ditolak. Silakan gunakan opsi input manual ISBN di bawah.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const handleSwitchCamera = () => {
    if (videoDevices.length <= 1) {
      // Toggle device or re-trigger list
      return;
    }
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setSelectedDeviceId(videoDevices[nextIndex].deviceId);
  };

  const playBeepSound = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context fallback
    }
  };

  const handleDetectedCode = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    playBeepSound();
    setScannedFeedback(`Terdeteksi: ${cleanCode}`);
    onScanResult(cleanCode);

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleDetectedCode(manualCode);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 text-slate-900 flex flex-col max-w-md md:max-w-2xl lg:max-w-3xl mx-auto animate-fade-in md:my-6 md:rounded-3xl md:border md:border-slate-200 md:shadow-2xl overflow-hidden">
      
      {/* Light-Theme Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between z-10 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">Pemindai Barcode / QR</h2>
            <p className="text-[10px] text-emerald-600 font-bold">Kamera Pustakawan & Siswa</p>
          </div>
        </div>

        {/* Balik Kamera / Switch Camera Button */}
        <button
          onClick={handleSwitchCamera}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 font-bold text-xs shadow-xs transition"
          title="Balik Kamera (Depan / Belakang)"
        >
          <SwitchCamera className="w-4 h-4 text-emerald-600" />
          <span>Balik Kamera</span>
        </button>
      </div>

      {/* Full-Screen Camera Viewport */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
        
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Laser Scanner Reticle Frame Overlay */}
        {isScanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
            <div className="relative w-72 h-52 border-2 border-emerald-400 rounded-3xl shadow-[0_0_30px_rgba(16,185,129,0.4)] overflow-hidden">
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute animate-laser" />
            </div>
            <p className="mt-4 text-xs font-extrabold text-emerald-300 bg-slate-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-500/40 shadow-lg">
              Arahkan Kamera Ke Barcode Buku / QR Siswa
            </p>
          </div>
        )}

        {/* Camera Error View */}
        {cameraError && (
          <div className="p-6 text-center text-slate-400 max-w-xs bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800">
            <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <p className="text-xs text-slate-300">{cameraError}</p>
          </div>
        )}

        {/* Scanned Feedback Overlay */}
        {scannedFeedback && (
          <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 z-20">
            <CheckCircle className="w-14 h-14 text-emerald-400 mb-3 animate-bounce" />
            <div className="text-base font-extrabold text-white">{scannedFeedback}</div>
            <div className="text-xs text-emerald-300 mt-1.5">Memproses Hasil Pemindaian...</div>
          </div>
        )}
      </div>

      {/* Light-Theme Manual Input Footer Bar */}
      <div className="bg-white border-t border-slate-200 p-4 pb-8 shrink-0 shadow-xs">
        <form onSubmit={handleManualSubmit} className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Keyboard className="w-4 h-4 text-emerald-600" />
            <span>Atau Ketik Kode ISBN / NIS Siswa Secara Manual:</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Contoh: 9786020332949 atau 10239481"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 font-mono font-bold"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition shrink-0"
            >
              Proses
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
