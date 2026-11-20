import React, { useEffect, useMemo, useState } from 'react';
import { X, Download, Check, Copy, Megaphone } from 'lucide-react';
import { PHONE_MODELS, PhoneModel } from '../data/phones';

interface AdvertBuilderModalProps {
  isOpen: boolean;
  initialPhoneId?: string;
  onClose: () => void;
}

type AdvertFormat = '16:9' | '1:1' | '4:5';
type AdvertTheme = 'obsidian' | 'travertine' | 'cobalt';

const FORMAT_SPECS: Record<
  AdvertFormat,
  { label: string; width: number; height: number; aspectClass: string }
> = {
  '16:9': { label: '16:9 Banner', width: 1600, height: 900, aspectClass: 'aspect-[16/9]' },
  '1:1': { label: '1:1 Square', width: 1200, height: 1200, aspectClass: 'aspect-square' },
  '4:5': { label: '4:5 Portrait', width: 1080, height: 1350, aspectClass: 'aspect-[4/5]' },
};

const THEME_STYLES: Record<
  AdvertTheme,
  {
    label: string;
    bg: string;
    cardBg: string;
    text: string;
    muted: string;
    accent: string;
    ctaBg: string;
    ctaText: string;
    border: string;
  }
> = {
  obsidian: {
    label: 'Obsidian',
    bg: '#111113',
    cardBg: '#18181B',
    text: '#F4F4F2',
    muted: '#A1A1AA',
    accent: '#60A5FA',
    ctaBg: '#F4F4F2',
    ctaText: '#111111',
    border: '#27272A',
  },
  travertine: {
    label: 'Travertine',
    bg: '#F6F6F4',
    cardBg: '#FFFFFF',
    text: '#111111',
    muted: '#5C5C58',
    accent: '#1D4ED8',
    ctaBg: '#111111',
    ctaText: '#FFFFFF',
    border: '#D4D4CE',
  },
  cobalt: {
    label: 'Cobalt',
    bg: '#0F1B3D',
    cardBg: '#162552',
    text: '#F8FAFC',
    muted: '#CBD5E1',
    accent: '#93C5FD',
    ctaBg: '#FFFFFF',
    ctaText: '#0F1B3D',
    border: '#283D7A',
  },
};

const getDefaultHeadline = (phone: PhoneModel): string => {
  if (phone.category === 'camera-pro') {
    return `${phone.name}. Engineered for Optical Precision.`;
  }
  if (phone.category === 'foldable') {
    return `${phone.name}. Pocket Form, Expansive Canvas.`;
  }
  return `${phone.name}. Flagship Hardware, Refined.`;
};

const getDefaultSubcopy = (phone: PhoneModel): string =>
  `${phone.quickSpecs.chipset} paired with ${phone.quickSpecs.camera} and ${phone.quickSpecs.battery}. Starting at $${phone.priceUsd.toLocaleString()}.`;

const wrapCanvasLines = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] => {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

export const AdvertBuilderModal: React.FC<AdvertBuilderModalProps> = ({
  isOpen,
  initialPhoneId,
  onClose,
}) => {
  const defaultPhone =
    PHONE_MODELS.find((p) => p.id === initialPhoneId) ?? PHONE_MODELS[0];

  const [selectedPhoneId, setSelectedPhoneId] = useState(defaultPhone.id);
  const [selectedColorwayId, setSelectedColorwayId] = useState(
    defaultPhone.colorways[0]?.id ?? ''
  );
  const [format, setFormat] = useState<AdvertFormat>('16:9');
  const [theme, setTheme] = useState<AdvertTheme>('obsidian');
  const [headline, setHeadline] = useState(getDefaultHeadline(defaultPhone));
  const [subcopy, setSubcopy] = useState(getDefaultSubcopy(defaultPhone));
  const [ctaLabel, setCtaLabel] = useState('Inspect Full Specs');
  const [showSpecsBar, setShowSpecsBar] = useState(true);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const phone = useMemo(
    () => PHONE_MODELS.find((p) => p.id === selectedPhoneId) ?? PHONE_MODELS[0],
    [selectedPhoneId]
  );

  const activeColorway = useMemo(
    () =>
      phone.colorways.find((c) => c.id === selectedColorwayId) ?? phone.colorways[0],
    [phone, selectedColorwayId]
  );

  const handleSelectPhone = (nextId: string) => {
    const nextPhone = PHONE_MODELS.find((p) => p.id === nextId);
    if (!nextPhone) return;
    setSelectedPhoneId(nextPhone.id);
    setSelectedColorwayId(nextPhone.colorways[0]?.id ?? '');
    setHeadline(getDefaultHeadline(nextPhone));
    setSubcopy(getDefaultSubcopy(nextPhone));
  };

  if (!isOpen) return null;

  const themeTokens = THEME_STYLES[theme];
  const formatSpec = FORMAT_SPECS[format];
  const previewImageUrl = activeColorway?.imageUrl ?? phone.imageUrl;
  const finishName = activeColorway?.name ?? phone.finish;

  const handleCopyAdText = async () => {
    const adText = `${phone.brand} ${phone.name} (${finishName})\n${headline}\n${subcopy}\n[${ctaLabel}]`;
    try {
      await navigator.clipboard.writeText(adText);
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus('idle'), 2200);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleDownloadPng = async () => {
    setDownloadStatus('downloading');
    try {
      const { width, height } = formatSpec;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Canvas background
      ctx.fillStyle = themeTokens.bg;
      ctx.fillRect(0, 0, width, height);

      const padding = Math.round(width * 0.055);
      const img = new Image();
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = previewImageUrl;
      });

      const isLandscape = format === '16:9';
      const innerW = width - padding * 2;
      const innerH = height - padding * 2;

      if (isLandscape) {
        const textColW = Math.round(innerW * 0.44);
        const gap = Math.round(innerW * 0.045);
        const mediaX = padding + textColW + gap;
        const mediaW = innerW - textColW - gap;
        const mediaH = innerH;

        // Draw studio photo card on right
        ctx.save();
        drawRoundedRect(ctx, mediaX, padding, mediaW, mediaH, 24);
        ctx.clip();
        if (img.naturalWidth > 0) {
          const scale = Math.max(mediaW / img.naturalWidth, mediaH / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const dx = mediaX + (mediaW - drawW) / 2;
          const dy = padding + (mediaH - drawH) / 2;
          if (activeColorway?.studioGrade?.imgFilter) {
            ctx.filter = activeColorway.studioGrade.imgFilter;
          }
          ctx.drawImage(img, dx, dy, drawW, drawH);
          ctx.filter = 'none';
        } else {
          ctx.fillStyle = themeTokens.cardBg;
          ctx.fillRect(mediaX, padding, mediaW, mediaH);
        }
        ctx.restore();

        // Subtle border around photo
        ctx.strokeStyle = themeTokens.border;
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, mediaX, padding, mediaW, mediaH, 24);
        ctx.stroke();

        // Kicker
        ctx.fillStyle = themeTokens.muted;
        ctx.font = '600 22px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Aperture Mobile · ${phone.brand} · ${finishName}`, padding, padding + 32);

        // Headline
        ctx.fillStyle = themeTokens.text;
        ctx.font = '700 58px system-ui, -apple-system, sans-serif';
        const headlineLines = wrapCanvasLines(ctx, headline, textColW).slice(0, 3);
        let cursorY = padding + 125;
        headlineLines.forEach((line) => {
          ctx.fillText(line, padding, cursorY);
          cursorY += 68;
        });

        // Subcopy
        ctx.fillStyle = themeTokens.muted;
        ctx.font = '400 26px system-ui, -apple-system, sans-serif';
        const subLines = wrapCanvasLines(ctx, subcopy, textColW).slice(0, 4);
        cursorY += 16;
        subLines.forEach((line) => {
          ctx.fillText(line, padding, cursorY);
          cursorY += 38;
        });

        // Optional specs bar
        if (showSpecsBar) {
          const specY = height - padding - 126;
          ctx.fillStyle = themeTokens.muted;
          ctx.font = '500 21px ui-monospace, SFMono-Regular, Menlo, monospace';
          ctx.fillText(
            `${phone.quickSpecs.display}  ·  From $${phone.priceUsd.toLocaleString()}`,
            padding,
            specY
          );
        }

        // CTA button
        const ctaY = height - padding - 76;
        ctx.font = '600 24px system-ui, -apple-system, sans-serif';
        const ctaTextW = ctx.measureText(ctaLabel || 'Inspect Full Specs').width;
        const ctaW = Math.min(textColW, ctaTextW + 72);
        ctx.fillStyle = themeTokens.ctaBg;
        drawRoundedRect(ctx, padding, ctaY, ctaW, 64, 14);
        ctx.fill();
        ctx.fillStyle = themeTokens.ctaText;
        ctx.fillText(ctaLabel || 'Inspect Full Specs', padding + 36, ctaY + 40);
      } else {
        // Vertical / Square layout: Photo on top, copy below
        const mediaH = Math.round(innerH * (format === '1:1' ? 0.54 : 0.56));

        ctx.save();
        drawRoundedRect(ctx, padding, padding, innerW, mediaH, 24);
        ctx.clip();
        if (img.naturalWidth > 0) {
          const scale = Math.max(innerW / img.naturalWidth, mediaH / img.naturalHeight);
          const drawW = img.naturalWidth * scale;
          const drawH = img.naturalHeight * scale;
          const dx = padding + (innerW - drawW) / 2;
          const dy = padding + (mediaH - drawH) / 2;
          if (activeColorway?.studioGrade?.imgFilter) {
            ctx.filter = activeColorway.studioGrade.imgFilter;
          }
          ctx.drawImage(img, dx, dy, drawW, drawH);
          ctx.filter = 'none';
        } else {
          ctx.fillStyle = themeTokens.cardBg;
          ctx.fillRect(padding, padding, innerW, mediaH);
        }
        ctx.restore();

        ctx.strokeStyle = themeTokens.border;
        ctx.lineWidth = 2;
        drawRoundedRect(ctx, padding, padding, innerW, mediaH, 24);
        ctx.stroke();

        let cursorY = padding + mediaH + 54;
        ctx.fillStyle = themeTokens.muted;
        ctx.font = '600 21px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Aperture Mobile · ${phone.brand} · ${finishName}`, padding, cursorY);

        cursorY += 58;
        ctx.fillStyle = themeTokens.text;
        ctx.font = '700 48px system-ui, -apple-system, sans-serif';
        const headlineLines = wrapCanvasLines(ctx, headline, innerW).slice(0, 2);
        headlineLines.forEach((line) => {
          ctx.fillText(line, padding, cursorY);
          cursorY += 56;
        });

        cursorY += 10;
        ctx.fillStyle = themeTokens.muted;
        ctx.font = '400 24px system-ui, -apple-system, sans-serif';
        const subLines = wrapCanvasLines(ctx, subcopy, innerW).slice(0, 3);
        subLines.forEach((line) => {
          ctx.fillText(line, padding, cursorY);
          cursorY += 34;
        });

        const footerY = height - padding - 68;
        ctx.font = '600 22px system-ui, -apple-system, sans-serif';
        const ctaTextW = ctx.measureText(ctaLabel || 'Inspect Full Specs').width;
        const ctaW = Math.min(innerW * 0.55, ctaTextW + 64);
        ctx.fillStyle = themeTokens.ctaBg;
        drawRoundedRect(ctx, padding, footerY, ctaW, 60, 14);
        ctx.fill();
        ctx.fillStyle = themeTokens.ctaText;
        ctx.fillText(ctaLabel || 'Inspect Full Specs', padding + 32, footerY + 38);

        if (showSpecsBar) {
          ctx.fillStyle = themeTokens.muted;
          ctx.font = '600 24px ui-monospace, SFMono-Regular, Menlo, monospace';
          const priceLabel = `From $${phone.priceUsd.toLocaleString()}`;
          const priceW = ctx.measureText(priceLabel).width;
          ctx.fillText(priceLabel, width - padding - priceW, footerY + 38);
        }
      }

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `aperture-advert-${phone.id}-${format.replace(':', 'x')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadStatus('done');
      window.setTimeout(() => setDownloadStatus('idle'), 2400);
    } finally {
      setDownloadStatus((prev) => (prev === 'downloading' ? 'idle' : prev));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4 sm:p-6 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="advert-builder-title"
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white/95 dark:bg-[#161618]/95 backdrop-blur-xs border-b border-[#EAEAE6] dark:border-[#222226] px-6 py-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <Megaphone className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <h2
                id="advert-builder-title"
                className="text-base font-semibold text-[#111111] dark:text-[#F4F4F2] truncate"
              >
                Flagship Advert Studio
              </h2>
              <p className="text-xs text-[#5C5C58] dark:text-[#A1A1AA] truncate">
                Compose and export a promotional campaign banner for any catalog model
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close advert studio"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#5C5C58] dark:text-[#A1A1AA] hover:bg-[#F6F6F4] dark:hover:bg-[#222226] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Controls Column */}
          <div className="lg:col-span-5 p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-[#EAEAE6] dark:border-[#222226]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="advert-phone-select"
                  className="block text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-1.5"
                >
                  Featured Device
                </label>
                <select
                  id="advert-phone-select"
                  value={phone.id}
                  onChange={(e) => handleSelectPhone(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F6F6F4] dark:bg-[#1E1E22] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs font-medium text-[#111111] dark:text-[#F4F4F2] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                >
                  {PHONE_MODELS.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.brand} {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="advert-finish-select"
                  className="block text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-1.5"
                >
                  Finish
                </label>
                <select
                  id="advert-finish-select"
                  value={activeColorway?.id ?? ''}
                  onChange={(e) => setSelectedColorwayId(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F6F6F4] dark:bg-[#1E1E22] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs font-medium text-[#111111] dark:text-[#F4F4F2] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                >
                  {phone.colorways.map((colorway) => (
                    <option key={colorway.id} value={colorway.id}>
                      {colorway.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-1.5">
                Format
              </span>
              <div
                role="radiogroup"
                aria-label="Advert aspect ratio format"
                className="inline-flex w-full items-center gap-1 p-1 bg-[#EAEAE6] dark:bg-[#1C1C1F] rounded-lg"
              >
                {(Object.keys(FORMAT_SPECS) as AdvertFormat[]).map((key) => {
                  const isActive = format === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setFormat(key)}
                      className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-[#27272A] text-[#111111] dark:text-[#F4F4F2] shadow-xs'
                          : 'text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                      }`}
                    >
                      {FORMAT_SPECS[key].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-1.5">
                Backdrop Theme
              </span>
              <div
                role="radiogroup"
                aria-label="Advert backdrop color theme"
                className="inline-flex w-full items-center gap-1 p-1 bg-[#EAEAE6] dark:bg-[#1C1C1F] rounded-lg"
              >
                {(Object.keys(THEME_STYLES) as AdvertTheme[]).map((key) => {
                  const isActive = theme === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => setTheme(key)}
                      className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-[#27272A] text-[#111111] dark:text-[#F4F4F2] shadow-xs'
                          : 'text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                      }`}
                    >
                      {THEME_STYLES[key].label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="advert-headline-input"
                className="block text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-1.5"
              >
                Campaign Headline
              </label>
              <input
                id="advert-headline-input"
                type="text"
                maxLength={72}
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full h-9 px-3 bg-[#F6F6F4] dark:bg-[#1E1E22] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs text-[#111111] dark:text-[#F4F4F2] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
              />
            </div>

            <div>
              <label
                htmlFor="advert-subcopy-input"
                className="block text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-1.5"
              >
                Supporting Copy
              </label>
              <textarea
                id="advert-subcopy-input"
                rows={2}
                maxLength={140}
                value={subcopy}
                onChange={(e) => setSubcopy(e.target.value)}
                className="w-full px-3 py-2 bg-[#F6F6F4] dark:bg-[#1E1E22] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs text-[#111111] dark:text-[#F4F4F2] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label
                  htmlFor="advert-cta-input"
                  className="block text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-1.5"
                >
                  CTA Label
                </label>
                <input
                  id="advert-cta-input"
                  type="text"
                  maxLength={28}
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  className="w-full h-9 px-3 bg-[#F6F6F4] dark:bg-[#1E1E22] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs text-[#111111] dark:text-[#F4F4F2] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                />
              </div>

              <label className="inline-flex h-9 items-center gap-2 text-xs text-[#111111] dark:text-[#F4F4F2] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSpecsBar}
                  onChange={(e) => setShowSpecsBar(e.target.checked)}
                  className="h-4 w-4 rounded border-[#D4D4CE] text-[#1D4ED8] focus:ring-[#1D4ED8]"
                />
                <span>Include MSRP &amp; display spec</span>
              </label>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={downloadStatus === 'downloading'}
                className="flex-1 inline-flex h-10 items-center justify-center gap-2 px-4 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                {downloadStatus === 'done' ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>PNG Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" aria-hidden="true" />
                    <span>Download PNG Advert</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyAdText}
                className="inline-flex h-10 items-center justify-center gap-1.5 px-3.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                {copyStatus === 'copied' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy Copywriting</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Preview Stage */}
          <div className="lg:col-span-7 bg-[#F6F6F4] dark:bg-[#111113] p-6 flex flex-col items-center justify-center">
            <div className="w-full flex items-center justify-between text-[11px] font-mono tabular-nums text-[#5C5C58] dark:text-[#A1A1AA] mb-3">
              <span>Live Campaign Preview</span>
              <span>
                {formatSpec.width} × {formatSpec.height} px
              </span>
            </div>

            <div
              className={`w-full ${
                format === '4:5' ? 'max-w-[340px]' : format === '1:1' ? 'max-w-[400px]' : 'max-w-full'
              } ${formatSpec.aspectClass} rounded-xl border p-5 sm:p-6 flex ${
                format === '16:9' ? 'flex-row items-stretch gap-5' : 'flex-col justify-between gap-4'
              } overflow-hidden shadow-lg transition-colors`}
              style={{
                backgroundColor: themeTokens.bg,
                borderColor: themeTokens.border,
                color: themeTokens.text,
              }}
            >
              {format === '16:9' ? (
                <>
                  <div className="w-[46%] flex flex-col justify-between min-w-0 py-1">
                    <div>
                      <p
                        className="text-xs font-medium truncate"
                        style={{ color: themeTokens.muted }}
                      >
                        Aperture Mobile · {phone.brand} · {finishName}
                      </p>
                      <h3 className="mt-2 font-display text-lg sm:text-xl font-bold leading-tight text-balance">
                        {headline || `${phone.name}`}
                      </h3>
                      <p
                        className="mt-2 text-xs leading-relaxed line-clamp-3"
                        style={{ color: themeTokens.muted }}
                      >
                        {subcopy}
                      </p>
                    </div>

                    <div className="space-y-2.5">
                      {showSpecsBar && (
                        <p
                          className="font-mono text-[10px] tabular-nums truncate"
                          style={{ color: themeTokens.muted }}
                        >
                          {phone.quickSpecs.display} · From ${phone.priceUsd.toLocaleString()}
                        </p>
                      )}
                      <span
                        className="inline-flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: themeTokens.ctaBg,
                          color: themeTokens.ctaText,
                        }}
                      >
                        {ctaLabel || 'Inspect Full Specs'}
                      </span>
                    </div>
                  </div>

                  <div
                    className="relative flex-1 rounded-lg overflow-hidden border"
                    style={{ borderColor: themeTokens.border, backgroundColor: themeTokens.cardBg }}
                  >
                    <img
                      src={previewImageUrl}
                      alt={`${phone.brand} ${phone.name} in ${finishName}`}
                      referrerPolicy="no-referrer"
                      style={
                        activeColorway?.studioGrade?.imgFilter
                          ? { filter: activeColorway.studioGrade.imgFilter }
                          : undefined
                      }
                      className="h-full w-full object-cover"
                    />
                    {activeColorway?.studioGrade?.tintGradient && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: activeColorway.studioGrade.tintGradient,
                          mixBlendMode: activeColorway.studioGrade.blendMode ?? 'color',
                        }}
                      />
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="relative w-full flex-1 min-h-0 rounded-lg overflow-hidden border"
                    style={{ borderColor: themeTokens.border, backgroundColor: themeTokens.cardBg }}
                  >
                    <img
                      src={previewImageUrl}
                      alt={`${phone.brand} ${phone.name} in ${finishName}`}
                      referrerPolicy="no-referrer"
                      style={
                        activeColorway?.studioGrade?.imgFilter
                          ? { filter: activeColorway.studioGrade.imgFilter }
                          : undefined
                      }
                      className="h-full w-full object-cover"
                    />
                    {activeColorway?.studioGrade?.tintGradient && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background: activeColorway.studioGrade.tintGradient,
                          mixBlendMode: activeColorway.studioGrade.blendMode ?? 'color',
                        }}
                      />
                    )}
                  </div>

                  <div className="space-y-2.5 shrink-0">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: themeTokens.muted }}
                    >
                      Aperture Mobile · {phone.brand} · {finishName}
                    </p>
                    <h3 className="font-display text-lg font-bold leading-tight text-balance">
                      {headline || `${phone.name}`}
                    </h3>
                    <p
                      className="text-xs leading-relaxed line-clamp-2"
                      style={{ color: themeTokens.muted }}
                    >
                      {subcopy}
                    </p>
                    <div className="pt-1 flex items-center justify-between gap-3">
                      <span
                        className="inline-flex items-center px-3.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: themeTokens.ctaBg,
                          color: themeTokens.ctaText,
                        }}
                      >
                        {ctaLabel || 'Inspect Full Specs'}
                      </span>
                      {showSpecsBar && (
                        <span
                          className="font-mono text-xs font-medium tabular-nums"
                          style={{ color: themeTokens.muted }}
                        >
                          From ${phone.priceUsd.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
