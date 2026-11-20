import React, { useEffect } from 'react';

interface ImagePreloaderProps {
  urls: string[];
  onAllReady?: () => void;
}

/**
 * Silently preloads and asynchronously decodes high-resolution studio assets
 * in the background so hover transitions, category switches, and modal previews
 * render without decode stutter.
 */
export const ImagePreloader: React.FC<ImagePreloaderProps> = ({ urls, onAllReady }) => {
  useEffect(() => {
    if (urls.length === 0) {
      onAllReady?.();
      return;
    }

    let cancelled = false;
    const uniqueUrls = Array.from(new Set(urls));
    let settledCount = 0;

    const handleSettled = () => {
      settledCount += 1;
      if (!cancelled && settledCount >= uniqueUrls.length) {
        onAllReady?.();
      }
    };

    const images = uniqueUrls.map((url) => {
      const img = new Image();
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';

      img.onload = () => {
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {}).finally(handleSettled);
        } else {
          handleSettled();
        }
      };

      img.onerror = () => {
        handleSettled();
      };

      img.src = url;
      return img;
    });

    return () => {
      cancelled = true;
      images.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [urls, onAllReady]);

  return null;
};
