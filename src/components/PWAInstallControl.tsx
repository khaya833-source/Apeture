import React, { useEffect, useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'inline' | 'footer-link';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'inline' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    if (!showGuideModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowGuideModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showGuideModal]);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      {variant === 'footer-link' ? (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 text-left hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
        >
          <Download className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{isIOS ? 'Add to Home Screen' : 'Install Website App'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex h-8 items-center gap-1.5 px-3 rounded-md border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          <Download className="h-3.5 w-3.5 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
          <span>{isIOS ? 'Add to Home Screen' : 'Install App'}</span>
        </button>
      )}

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-xs"
          onClick={() => setShowGuideModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-guide-title"
        >
          <div
            className="w-full max-w-md rounded-xl border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EAEAE6] dark:border-[#222226]">
              <div className="flex items-center gap-2.5">
                <Smartphone className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" aria-hidden="true" />
                <h3
                  id="pwa-install-guide-title"
                  className="text-base font-semibold text-[#111111] dark:text-[#F4F4F2]"
                >
                  Install Aperture Mobile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                aria-label="Close install instructions"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#5C5C58] dark:text-[#A1A1AA] hover:bg-[#F6F6F4] dark:hover:bg-[#222226] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-3 text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[#111111] dark:text-[#F4F4F2] shrink-0">01.</span>
                  <span>
                    Tap the <strong className="text-[#111111] dark:text-[#F4F4F2]">Share</strong> icon{' '}
                    <Share className="inline h-3.5 w-3.5 align-text-bottom text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />{' '}
                    in the Safari toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[#111111] dark:text-[#F4F4F2] shrink-0">02.</span>
                  <span>
                    Scroll down and select{' '}
                    <strong className="text-[#111111] dark:text-[#F4F4F2]">Add to Home Screen</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[#111111] dark:text-[#F4F4F2] shrink-0">03.</span>
                  <span>
                    Tap <strong className="text-[#111111] dark:text-[#F4F4F2]">Add</strong> to launch Aperture Mobile as a standalone full-screen app.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-3 text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[#111111] dark:text-[#F4F4F2] shrink-0">01.</span>
                  <span>
                    Open the shared website URL directly in Chrome, Edge, or Android Chrome (outside embedded preview frames).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[#111111] dark:text-[#F4F4F2] shrink-0">02.</span>
                  <span>
                    Click the <strong className="text-[#111111] dark:text-[#F4F4F2]">Install</strong> icon in the address bar or open browser menu{' '}
                    <span className="font-mono">&rarr;</span>{' '}
                    <strong className="text-[#111111] dark:text-[#F4F4F2]">Add to Home Screen / Install Aperture Mobile</strong>.
                  </span>
                </li>
              </ol>
            )}

            <div className="mt-5 pt-4 border-t border-[#EAEAE6] dark:border-[#222226] flex justify-end">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="h-9 px-4 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/90 px-3.5 py-2 text-xs font-medium text-amber-900 dark:text-amber-200 shadow-lg"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Offline Mode · Cached data active</span>
    </div>
  );
};
