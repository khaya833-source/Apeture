import React, { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  Check,
  QrCode,
  RefreshCw,
  Upload,
  X,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { PHONE_MODELS, PhoneModel } from '../data/phones';

interface QrCompareModalProps {
  isOpen: boolean;
  compareIds: string[];
  onClose: () => void;
  onAddToCompare: (id: string) => void;
  onOpenComparison: () => void;
}

type ScannerMode = 'camera' | 'upload';

interface ScanOutcome {
  rawPayload: string;
  phone: PhoneModel | null;
  status: 'added' | 'already-added' | 'limit-reached' | 'unrecognized';
}

const matchPhoneFromQrPayload = (rawText: string): PhoneModel | null => {
  const trimmed = rawText.trim();
  if (!trimmed) return null;

  // 1. Check URL ?phone=<id> parameter
  try {
    const parsedUrl = new URL(trimmed);
    const paramId = parsedUrl.searchParams.get('phone');
    if (paramId) {
      const byParam = PHONE_MODELS.find(
        (phone) => phone.id.toLowerCase() === paramId.trim().toLowerCase()
      );
      if (byParam) return byParam;
    }
  } catch {
    // Not a full URL; check query pattern directly
    const queryMatch = trimmed.match(/[?&]phone=([a-z0-9-]+)/i);
    if (queryMatch) {
      const byQuery = PHONE_MODELS.find(
        (phone) => phone.id.toLowerCase() === queryMatch[1].toLowerCase()
      );
      if (byQuery) return byQuery;
    }
  }

  // 2. Check JSON payload { phoneId / id / model }
  if (trimmed.startsWith('{')) {
    try {
      const json = JSON.parse(trimmed) as Record<string, unknown>;
      const candidate =
        (typeof json.phoneId === 'string' && json.phoneId) ||
        (typeof json.id === 'string' && json.id) ||
        (typeof json.model === 'string' && json.model) ||
        '';
      if (candidate) {
        const matched = matchPhoneFromQrPayload(candidate);
        if (matched) return matched;
      }
    } catch {
      // Ignore malformed JSON
    }
  }

  const normalized = trimmed.toLowerCase();

  // 3. Exact ID or official URL match
  const exactMatch = PHONE_MODELS.find(
    (phone) =>
      phone.id.toLowerCase() === normalized ||
      phone.officialUrl.toLowerCase() === normalized ||
      normalized.includes(phone.officialUrl.toLowerCase())
  );
  if (exactMatch) return exactMatch;

  // 4. Longest-name-first match so "iPhone 16 Pro Max" matches before "iPhone 16"
  const sortedByNameLength = [...PHONE_MODELS].sort((a, b) => b.name.length - a.name.length);
  for (const phone of sortedByNameLength) {
    const fullName = `${phone.brand} ${phone.name}`.toLowerCase();
    if (
      normalized.includes(phone.id.toLowerCase()) ||
      normalized.includes(fullName) ||
      normalized.includes(phone.name.toLowerCase())
    ) {
      return phone;
    }
  }

  return null;
};

export const QrCompareModal: React.FC<QrCompareModalProps> = ({
  isOpen,
  compareIds,
  onClose,
  onAddToCompare,
  onOpenComparison,
}) => {
  const [mode, setMode] = useState<ScannerMode>('camera');
  const [cameraState, setCameraState] = useState<'starting' | 'active' | 'error'>('starting');
  const [cameraError, setCameraError] = useState('');
  const [scanOutcome, setScanOutcome] = useState<ScanOutcome | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [uploadError, setUploadError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const compareIdsRef = useRef<string[]>(compareIds);
  compareIdsRef.current = compareIds;

  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const handleDecodedPayload = useCallback(
    (rawPayload: string) => {
      const matched = matchPhoneFromQrPayload(rawPayload);
      if (!matched) {
        setScanOutcome({
          rawPayload,
          phone: null,
          status: 'unrecognized',
        });
        return;
      }

      const currentIds = compareIdsRef.current;
      if (currentIds.includes(matched.id)) {
        setScanOutcome({
          rawPayload,
          phone: matched,
          status: 'already-added',
        });
        return;
      }

      if (currentIds.length >= 3) {
        setScanOutcome({
          rawPayload,
          phone: matched,
          status: 'limit-reached',
        });
        return;
      }

      onAddToCompare(matched.id);
      setScanOutcome({
        rawPayload,
        phone: matched,
        status: 'added',
      });
    },
    [onAddToCompare]
  );

  // Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset modal state on open/close
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setScanOutcome(null);
      setUploadError('');
      setManualInput('');
      return;
    }
    setMode('camera');
    setScanOutcome(null);
    setUploadError('');
  }, [isOpen, stopCameraStream]);

  // Start/stop camera & QR frame scanning loop
  useEffect(() => {
    if (!isOpen || mode !== 'camera' || scanOutcome !== null) {
      stopCameraStream();
      return;
    }

    let cancelled = false;
    let rafId = 0;
    let lastDecodeMs = 0;

    const startCamera = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraState('error');
        setCameraError(
          'Live camera access is not supported in this browser. Upload a QR code image or paste a product code below.'
        );
        return;
      }

      setCameraState('starting');
      setCameraError('');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraState('active');

        const scanFrame = (timestamp: number) => {
          if (cancelled) return;
          const videoEl = videoRef.current;
          const canvasEl = canvasRef.current;

          if (
            videoEl &&
            canvasEl &&
            videoEl.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA &&
            videoEl.videoWidth > 0 &&
            timestamp - lastDecodeMs >= 110
          ) {
            lastDecodeMs = timestamp;
            canvasEl.width = videoEl.videoWidth;
            canvasEl.height = videoEl.videoHeight;
            const ctx = canvasEl.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
              const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height);
              const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });
              if (decoded && decoded.data) {
                stopCameraStream();
                handleDecodedPayload(decoded.data);
                return;
              }
            }
          }

          rafId = window.requestAnimationFrame(scanFrame);
        };

        rafId = window.requestAnimationFrame(scanFrame);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof DOMException && err.name === 'NotAllowedError'
            ? 'Camera permission was denied. Allow camera access in your browser, or upload a QR image / enter a product code below.'
            : err instanceof DOMException && err.name === 'NotFoundError'
              ? 'No camera device was detected. Upload a QR code image or enter a product code below.'
              : 'Unable to start the camera feed. You can still upload a QR code image or enter a product code below.';
        setCameraState('error');
        setCameraError(message);
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      stopCameraStream();
    };
  }, [isOpen, mode, scanOutcome, stopCameraStream, handleDecodedPayload]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setUploadError('Unable to read image pixels in this browser.');
          URL.revokeObjectURL(objectUrl);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });
        URL.revokeObjectURL(objectUrl);

        if (!decoded || !decoded.data) {
          setUploadError('No QR code detected in the selected image. Try a clearer crop.');
          return;
        }
        handleDecodedPayload(decoded.data);
      } catch {
        URL.revokeObjectURL(objectUrl);
        setUploadError('Failed to decode the uploaded image.');
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setUploadError('Could not load the selected image file.');
    };
    img.src = objectUrl;
    e.target.value = '';
  };

  const handleManualSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecodedPayload(manualInput);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4 sm:p-6 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-compare-title"
    >
      <div
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white/95 dark:bg-[#161618]/95 backdrop-blur-xs border-b border-[#EAEAE6] dark:border-[#222226] px-6 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <QrCode className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2
                id="qr-compare-title"
                className="text-base font-semibold text-[#111111] dark:text-[#F4F4F2] truncate"
              >
                Scan QR to Compare
              </h2>
              <p className="text-xs text-[#5C5C58] dark:text-[#A1A1AA] font-mono tabular-nums">
                {compareIds.length} / 3 models in comparison
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close QR scanner"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#5C5C58] dark:text-[#A1A1AA] hover:bg-[#F6F6F4] dark:hover:bg-[#222226] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="QR input method"
              className="inline-flex items-center gap-1 p-1 bg-[#EAEAE6] dark:bg-[#1C1C1F] rounded-lg"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'camera'}
                onClick={() => {
                  setScanOutcome(null);
                  setMode('camera');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                  mode === 'camera'
                    ? 'bg-white dark:bg-[#27272A] text-[#111111] dark:text-[#F4F4F2] shadow-xs'
                    : 'text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                }`}
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Live Camera</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'upload'}
                onClick={() => {
                  setScanOutcome(null);
                  setMode('upload');
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                  mode === 'upload'
                    ? 'bg-white dark:bg-[#27272A] text-[#111111] dark:text-[#F4F4F2] shadow-xs'
                    : 'text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                }`}
              >
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Upload Image</span>
              </button>
            </div>

            {compareIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenComparison();
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>View Matrix ({compareIds.length})</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Scan Result Feedback */}
          {scanOutcome ? (
            <div className="rounded-xl border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] p-5 space-y-4">
              {scanOutcome.phone ? (
                <div className="flex items-center gap-4">
                  <div className="w-20 aspect-[4/3] rounded-lg overflow-hidden bg-[#EAEAE6] dark:bg-[#27272A] shrink-0">
                    <img
                      src={scanOutcome.phone.imageUrl}
                      alt={scanOutcome.phone.imageAlt}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-[#1D4ED8] dark:text-[#60A5FA] mb-1">
                      {scanOutcome.status === 'limit-reached' ? (
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                      ) : (
                        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span
                        className={
                          scanOutcome.status === 'limit-reached'
                            ? 'text-amber-700 dark:text-amber-400'
                            : ''
                        }
                      >
                        {scanOutcome.status === 'added'
                          ? 'Added to comparison list'
                          : scanOutcome.status === 'already-added'
                            ? 'Already in comparison list'
                            : 'Comparison limit reached (max 3)'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2] truncate">
                      {scanOutcome.phone.brand} {scanOutcome.phone.name}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-[#5C5C58] dark:text-[#A1A1AA]">
                      ${scanOutcome.phone.priceUsd.toLocaleString()} · {scanOutcome.phone.finish}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                    <p className="font-semibold text-[#111111] dark:text-[#F4F4F2]">
                      Unrecognized product QR code
                    </p>
                    <p className="mt-1">
                      Decoded <span className="font-mono break-all">"{scanOutcome.rawPayload}"</span>, which does not match a phone model in the catalog.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setScanOutcome(null);
                  }}
                  className="inline-flex h-9 items-center gap-1.5 px-4 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Scan Another</span>
                </button>
                {compareIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenComparison();
                    }}
                    className="inline-flex h-9 items-center gap-1.5 px-4 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Open Comparison ({compareIds.length})</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ) : mode === 'camera' ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#D4D4CE] dark:border-[#27272A] bg-[#111113]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${
                  cameraState === 'active' ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <canvas ref={canvasRef} className="hidden" />

              {cameraState === 'active' && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center p-8"
                >
                  <div className="relative h-44 w-44">
                    <span className="absolute top-0 left-0 h-5 w-5 border-t-2 border-l-2 border-white/90" />
                    <span className="absolute top-0 right-0 h-5 w-5 border-t-2 border-r-2 border-white/90" />
                    <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-white/90" />
                    <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-white/90" />
                  </div>
                  <p className="mt-4 rounded-md bg-black/70 px-3 py-1 text-[11px] font-medium text-white">
                    Align a product QR code inside the frame
                  </p>
                </div>
              )}

              {cameraState === 'starting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center text-xs text-neutral-300">
                  <Camera className="h-7 w-7 text-neutral-400" aria-hidden="true" />
                  <span>Requesting camera access...</span>
                </div>
              )}

              {cameraState === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-[#F6F6F4] dark:bg-[#1E1E22]">
                  <AlertCircle className="h-7 w-7 text-[#5C5C58] dark:text-[#A1A1AA]" aria-hidden="true" />
                  <p className="max-w-sm text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                    {cameraError}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('upload')}
                    className="inline-flex h-9 items-center gap-1.5 px-4 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Upload QR Image</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-[#D4D4CE] dark:border-[#3F3F46] bg-[#F6F6F4] dark:bg-[#1E1E22] p-8 text-center">
              <Upload className="mx-auto h-7 w-7 text-[#5C5C58] dark:text-[#A1A1AA] mb-2.5" aria-hidden="true" />
              <p className="text-xs font-medium text-[#111111] dark:text-[#F4F4F2]">
                Select a QR code image file (PNG, JPG, WebP)
              </p>
              <p className="mt-1 text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                Decodes share links (<span className="font-mono">?phone=model-id</span>), product URLs, or model identifiers locally.
              </p>
              <label className="mt-4 inline-flex h-9 items-center gap-1.5 px-4 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer">
                <span>Choose Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                />
              </label>
              {uploadError && (
                <p role="alert" className="mt-3 text-xs text-red-700 dark:text-red-400">
                  {uploadError}
                </p>
              )}
            </div>
          )}

          {/* Direct Code / Share Link Lookup Fallback */}
          <div className="pt-4 border-t border-[#EAEAE6] dark:border-[#222226] space-y-2.5">
            <form onSubmit={handleManualSubmit} className="flex items-center gap-2">
              <label htmlFor="qr-manual-code" className="sr-only">
                Product QR URL or model code
              </label>
              <input
                id="qr-manual-code"
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste product QR URL or model ID (e.g. galaxy-s25-ultra)..."
                className="flex-1 h-9 px-3 bg-[#F6F6F4] dark:bg-[#1E1E22] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs text-[#111111] dark:text-[#F4F4F2] placeholder:text-[#8A8A82] dark:placeholder:text-[#71717A] focus:outline-none focus:bg-white dark:focus:bg-[#161618] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
              />
              <button
                type="submit"
                className="h-9 px-4 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Match &amp; Add
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
              <span>Quick scan test:</span>
              {PHONE_MODELS.slice(0, 3).map((sample, idx) => (
                <React.Fragment key={sample.id}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <button
                    type="button"
                    onClick={() => handleDecodedPayload(`?phone=${sample.id}`)}
                    className="font-mono text-[#111111] dark:text-[#F4F4F2] underline underline-offset-2 hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] cursor-pointer whitespace-nowrap"
                  >
                    {sample.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
