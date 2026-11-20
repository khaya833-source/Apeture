import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Box,
  Grid3x3,
  Pause,
  Play,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PhoneModel } from '../data/phones';

interface PhoneArViewerProps {
  phone: PhoneModel;
  selectedFinishName?: string;
  selectedFinishHex?: string;
  onBack: () => void;
}

type PresetAngle = {
  id: string;
  label: string;
  yaw: number;
  pitch: number;
};

const ANGLE_PRESETS: PresetAngle[] = [
  { id: 'three-quarter', label: '3/4 View', yaw: -28, pitch: 12 },
  { id: 'front', label: 'Front', yaw: 0, pitch: 0 },
  { id: 'back', label: 'Rear Optics', yaw: 180, pitch: 8 },
  { id: 'side', label: 'Profile', yaw: 78, pitch: 4 },
];

interface FinishPalette {
  backBg: string;
  frameColor: string;
  accentRing: string;
}

const getFinishPalette = (finish: string, fallbackHex?: string): FinishPalette => {
  const f = finish.toLowerCase();
  if (f.includes('ultramarine')) {
    return { backBg: '#3B56C8', frameColor: '#526CD6', accentRing: '#2A40A3' };
  }
  if (f.includes('desert')) {
    return { backBg: '#C5A48A', frameColor: '#B08C70', accentRing: '#8C6B50' };
  }
  if (f.includes('black') || f.includes('obsidian')) {
    return { backBg: '#1F2024', frameColor: '#3A3B40', accentRing: '#111214' };
  }
  if (f.includes('white') || f.includes('arctic') || f.includes('porcelain')) {
    return { backBg: '#EAEAE4', frameColor: '#C8CAC6', accentRing: '#B2B4AF' };
  }
  if (f.includes('silverblue') || f.includes('icyblue')) {
    return { backBg: '#8BA4BD', frameColor: '#708AA3', accentRing: '#5A738C' };
  }
  if (f.includes('titanium blue') || f.includes('midnight blue') || f.includes('navy') || f.includes('blue')) {
    return { backBg: '#233E63', frameColor: '#36557F', accentRing: '#172942' };
  }
  if (f.includes('midnight ocean')) {
    return { backBg: '#1D3557', frameColor: '#A8B2C1', accentRing: '#122238' };
  }
  if (f.includes('teal')) {
    return { backBg: '#4E8F8E', frameColor: '#3D7877', accentRing: '#2F5F5E' };
  }
  if (f.includes('mint') || f.includes('wintergreen') || f.includes('spring green')) {
    return { backBg: '#9AC6AE', frameColor: '#7CA890', accentRing: '#638F77' };
  }
  if (f.includes('hazel')) {
    return { backBg: '#6F776D', frameColor: '#5B6259', accentRing: '#494F48' };
  }
  if (f.includes('hot pink')) {
    return { backBg: '#D6427C', frameColor: '#B83065', accentRing: '#8F214C' };
  }
  if (f.includes('pink') || f.includes('peony') || f.includes('rose')) {
    return { backBg: '#E3AAB9', frameColor: '#C98F9E', accentRing: '#B07685' };
  }
  if (f.includes('peach')) {
    return { backBg: '#EDAC92', frameColor: '#D19177', accentRing: '#B5775E' };
  }
  if (f.includes('yellow')) {
    return { backBg: '#ECD888', frameColor: '#D0BC6C', accentRing: '#B39F52' };
  }
  if (f.includes('silver chrome')) {
    return { backBg: '#2A2B2E', frameColor: '#C7C9CE', accentRing: '#9FA3AB' };
  }
  if (f.includes('silver shadow')) {
    return { backBg: '#B4B7BC', frameColor: '#989CA3', accentRing: '#7F848C' };
  }
  if (f.includes('titanium gray') || f.includes('titanium grey')) {
    return { backBg: '#7C7A74', frameColor: '#66645F', accentRing: '#4F4D49' };
  }
  if (fallbackHex) {
    return { backBg: fallbackHex, frameColor: fallbackHex, accentRing: fallbackHex };
  }
  return { backBg: '#A6A299', frameColor: '#8B877E', accentRing: '#6F6B64' };
};

const parseDimensionsMm = (dimText: string): { height: number; width: number; depth: number } => {
  const nums = dimText.match(/\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 3) {
    return { height: 162, width: 77, depth: 8.3 };
  }
  return {
    height: Number.parseFloat(nums[0]),
    width: Number.parseFloat(nums[1]),
    depth: Number.parseFloat(nums[2]),
  };
};

export const PhoneArViewer: React.FC<PhoneArViewerProps> = ({
  phone,
  selectedFinishName,
  selectedFinishHex,
  onBack,
}) => {
  const activeFinish = selectedFinishName || phone.finish;
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const [yaw, setYaw] = useState(-28);
  const [pitch, setPitch] = useState(12);
  const [zoom, setZoom] = useState(1);
  const [autoRotate, setAutoRotate] = useState(!prefersReducedMotion);
  const [showArGrid, setShowArGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const dragOriginRef = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);

  useEffect(() => {
    setYaw(-28);
    setPitch(12);
    setZoom(1);
    setAutoRotate(!prefersReducedMotion);
  }, [phone.id, prefersReducedMotion]);

  useEffect(() => {
    if (!autoRotate || isDragging) return;
    let frameId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const deltaSec = (now - lastTime) / 1000;
      lastTime = now;
      setYaw((prev) => {
        const next = prev + deltaSec * 22;
        return next > 180 ? next - 360 : next;
      });
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [autoRotate, isDragging]);

  const palette = useMemo(
    () => getFinishPalette(activeFinish, selectedFinishHex),
    [activeFinish, selectedFinishHex]
  );
  const dims = useMemo(() => parseDimensionsMm(phone.fullSpecs.dimensions), [phone.fullSpecs.dimensions]);

  // Scale pixel dimensions proportionally to real millimeter size (clamped for modal viewport)
  const scaleFactor = 1.85;
  const modelWidthPx = Math.min(240, Math.max(126, Math.round(dims.width * scaleFactor)));
  const modelHeightPx = Math.min(315, Math.max(255, Math.round(dims.height * scaleFactor)));
  const isUnfoldedFoldable = phone.id === 'galaxy-z-fold6';
  const isCircularCamera =
    phone.id === 'xiaomi-15-ultra' || phone.id === 'vivo-x200-pro' || phone.id === 'oneplus-13';
  const isVisorCamera = phone.id === 'pixel-9-pro-xl' || phone.id === 'pixel-9';
  const isClamshell = phone.id === 'galaxy-z-flip6' || phone.id === 'motorola-razr-plus-2024';

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setAutoRotate(false);
    dragOriginRef.current = { x: e.clientX, y: e.clientY, yaw, pitch };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragOriginRef.current) return;
    const dx = e.clientX - dragOriginRef.current.x;
    const dy = e.clientY - dragOriginRef.current.y;
    setYaw(dragOriginRef.current.yaw + dx * 0.55);
    setPitch(Math.max(-45, Math.min(45, dragOriginRef.current.pitch - dy * 0.35)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    dragOriginRef.current = null;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setAutoRotate(false);
      setYaw((prev) => prev - 15);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setAutoRotate(false);
      setYaw((prev) => prev + 15);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutoRotate(false);
      setPitch((prev) => Math.min(45, prev + 10));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutoRotate(false);
      setPitch((prev) => Math.max(-45, prev - 10));
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => Number(Math.max(0.75, Math.min(1.4, prev + delta)).toFixed(2)));
  };

  const handleResetView = () => {
    setYaw(-28);
    setPitch(12);
    setZoom(1);
    setAutoRotate(!prefersReducedMotion);
  };

  const normalizedYaw = Math.round(((yaw % 360) + 540) % 360 - 180);

  return (
    <div className="p-6 space-y-5">
      {/* Viewer Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAEAE6] dark:border-[#222226]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to Specs</span>
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
              <Box className="h-3.5 w-3.5 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" aria-hidden="true" />
              <span className="font-medium text-[#111111] dark:text-[#F4F4F2] truncate">
                Augmented Reality 3D Preview
              </span>
            </div>
            <p className="text-[11px] text-[#5C5C58] dark:text-[#A1A1AA] truncate">
              {phone.brand} {phone.name} · {activeFinish}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-[#5C5C58] dark:text-[#A1A1AA] shrink-0">
          <span>{phone.fullSpecs.dimensions}</span>
          <span aria-hidden="true">·</span>
          <span>{phone.fullSpecs.weight}</span>
        </div>
      </div>

      {/* Interactive 3D Viewport */}
      <div
        role="application"
        tabIndex={0}
        aria-label={`Interactive simulated 3D model viewer for ${phone.brand} ${phone.name}. Drag or use arrow keys to rotate.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        className={`relative h-[380px] sm:h-[420px] w-full overflow-hidden rounded-xl border border-[#D4D4CE] dark:border-[#27272A] bg-gradient-to-b from-[#EAEAE6] via-[#F6F6F4] to-[#E2E2DC] dark:from-[#18181B] dark:via-[#111113] dark:to-[#09090B] touch-none select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Simulated AR Surface Reference Grid */}
        {showArGrid && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-52 flex items-end justify-center overflow-hidden"
          >
            <div
              className="w-[150%] h-72 origin-bottom opacity-45 dark:opacity-35"
              style={{
                transform: 'perspective(520px) rotateX(68deg)',
                backgroundImage:
                  'linear-gradient(to right, rgba(29,78,216,0.28) 1px, transparent 1px), linear-gradient(to bottom, rgba(29,78,216,0.28) 1px, transparent 1px)',
                backgroundSize: '36px 36px',
              }}
            />
          </div>
        )}

        {/* AR Spatial Corner Reticles */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-4 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="h-4 w-4 border-t-2 border-l-2 border-[#1D4ED8]/50 dark:border-[#60A5FA]/50" />
            <div className="h-4 w-4 border-t-2 border-r-2 border-[#1D4ED8]/50 dark:border-[#60A5FA]/50" />
          </div>
          <div className="flex items-end justify-between">
            <div className="h-4 w-4 border-b-2 border-l-2 border-[#1D4ED8]/50 dark:border-[#60A5FA]/50" />
            <div className="h-4 w-4 border-b-2 border-r-2 border-[#1D4ED8]/50 dark:border-[#60A5FA]/50" />
          </div>
        </div>

        {/* Live Telemetry Overlay Readout */}
        <div className="pointer-events-none absolute top-4 left-6 right-6 flex items-center justify-between gap-4 text-[11px] font-mono tabular-nums text-[#5C5C58] dark:text-[#A1A1AA]">
          <span>Drag to orbit · Arrow keys supported</span>
          <span>
            Yaw {normalizedYaw}° · Pitch {Math.round(pitch)}° · {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* 3D Phone Object Stage */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: '1200px' }}
        >
          <div
            className="relative transition-transform duration-75 ease-out"
            style={{
              width: `${modelWidthPx}px`,
              height: `${modelHeightPx}px`,
              transformStyle: 'preserve-3d',
              transform: `scale(${zoom}) rotateX(${pitch}deg) rotateY(${yaw}deg)`,
            }}
          >
            {/* Soft Drop Shadow */}
            <div
              aria-hidden="true"
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[84%] h-7 rounded-full bg-black/25 dark:bg-black/65 blur-md"
              style={{ transform: 'rotateX(90deg) translateZ(-12px)' }}
            />

            {/* Mid Chassis Depth Layers for Realistic Edge Thickness */}
            {[-4, -2, 0, 2, 4].map((zOffset) => (
              <div
                key={zOffset}
                aria-hidden="true"
                className="absolute inset-0 rounded-[24px] border"
                style={{
                  transform: `translateZ(${zOffset}px)`,
                  backgroundColor: palette.frameColor,
                  borderColor: palette.accentRing,
                }}
              />
            ))}

            {/* Front OLED Display Face */}
            <div
              className="absolute inset-0 rounded-[24px] p-[5px] flex flex-col overflow-hidden border"
              style={{
                transform: 'translateZ(6px)',
                backfaceVisibility: 'hidden',
                backgroundColor: '#0A0A0C',
                borderColor: palette.frameColor,
              }}
            >
              <div
                className="relative flex-1 rounded-[19px] overflow-hidden flex flex-col justify-between p-4 text-white"
                style={{
                  background: `radial-gradient(circle at 25% 20%, ${palette.backBg}cc 0%, #101116 58%, #070709 100%)`,
                }}
              >
                {/* Top Cutout / Island */}
                <div className="flex justify-center pt-0.5">
                  {phone.brand === 'Apple' && phone.id === 'iphone-16-pro-max' ||
                  phone.id === 'iphone-16' ? (
                    <div className="h-3.5 w-14 rounded-full bg-black border border-white/10" />
                  ) : (
                    <div className="h-2.5 w-2.5 rounded-full bg-black border border-white/15" />
                  )}
                </div>

                {/* Minimalist Clock & Brand Readout */}
                <div className="my-auto text-center space-y-1">
                  <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums text-white/95">
                    09:41
                  </p>
                  <p className="text-[10px] font-medium text-white/70 truncate px-2">
                    {phone.name}
                  </p>
                  <p className="font-mono text-[9px] tabular-nums text-white/50">
                    {dims.height} × {dims.width} mm
                  </p>
                </div>

                {/* Foldable Hinge Seam Indicator */}
                {(isUnfoldedFoldable || isClamshell) && (
                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute bg-white/10 ${
                      isUnfoldedFoldable
                        ? 'inset-y-0 left-1/2 w-px -translate-x-1/2'
                        : 'inset-x-0 top-1/2 h-px -translate-y-1/2'
                    }`}
                  />
                )}

                {/* Bottom Gesture Pill */}
                <div className="flex justify-center pb-0.5">
                  <div className="h-1 w-14 rounded-full bg-white/45" />
                </div>
              </div>
            </div>

            {/* Rear Chassis & Optical Array Face */}
            <div
              className="absolute inset-0 rounded-[24px] p-4 flex flex-col justify-between border overflow-hidden"
              style={{
                transform: 'rotateY(180deg) translateZ(6px)',
                backfaceVisibility: 'hidden',
                backgroundColor: palette.backBg,
                borderColor: palette.frameColor,
              }}
            >
              {/* Camera Module Variations by Hardware Design */}
              {isCircularCamera ? (
                <div className="mx-auto mt-2 h-20 w-20 rounded-full bg-[#141518] border-2 border-[#7C808A] flex items-center justify-center shadow-lg">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="h-4 w-4 rounded-full bg-[#242833] border border-white/15" />
                    <div className="h-4 w-4 rounded-full bg-[#242833] border border-white/15" />
                    <div className="h-4 w-4 rounded-full bg-[#242833] border border-white/15" />
                    <div className="h-4 w-4 rounded-full bg-[#1C1F26] border border-white/10" />
                  </div>
                </div>
              ) : isVisorCamera ? (
                <div className="mt-4 mx-1 h-10 rounded-full bg-[#141518] border border-white/20 px-3 flex items-center gap-2.5 shadow-md">
                  <div className="h-5 w-5 rounded-full bg-[#252830] border border-white/15" />
                  <div className="h-5 w-5 rounded-full bg-[#252830] border border-white/15" />
                  <div className="ml-auto h-2.5 w-2.5 rounded-full bg-amber-100/80" />
                </div>
              ) : isClamshell ? (
                <div className="h-[44%] rounded-xl bg-[#111216] border border-white/15 p-2.5 flex items-start gap-2 shadow-md">
                  <div className="h-5 w-5 rounded-full bg-[#242833] border border-white/20" />
                  <div className="h-5 w-5 rounded-full bg-[#242833] border border-white/20" />
                </div>
              ) : phone.brand === 'Apple' ? (
                <div
                  className="w-16 h-16 rounded-2xl p-2 grid grid-cols-2 gap-1.5 border shadow-md"
                  style={{
                    backgroundColor: palette.accentRing,
                    borderColor: 'rgba(255,255,255,0.18)',
                  }}
                >
                  <div className="h-5 w-5 rounded-full bg-[#141518] border border-white/20" />
                  <div className="h-5 w-5 rounded-full bg-[#141518] border border-white/20" />
                  {phone.id === 'iphone-16-pro-max' && (
                    <div className="h-5 w-5 rounded-full bg-[#141518] border border-white/20" />
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2 w-7">
                  <div className="h-6 w-6 rounded-full bg-[#141518] border border-white/25 shadow-sm" />
                  <div className="h-6 w-6 rounded-full bg-[#141518] border border-white/25 shadow-sm" />
                  <div className="h-6 w-6 rounded-full bg-[#141518] border border-white/25 shadow-sm" />
                </div>
              )}

              <div className="mt-auto text-center">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-white/75 drop-shadow-xs">
                  {phone.brand}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Viewer Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Preset Camera Angles */}
        <div className="flex flex-wrap items-center gap-1.5">
          {ANGLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setAutoRotate(false);
                setYaw(preset.yaw);
                setPitch(preset.pitch);
              }}
              className="px-3 py-1.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Simulation Toggles & Zoom */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            aria-pressed={autoRotate}
            className={`inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
              autoRotate
                ? 'bg-[#1D4ED8] border-[#1D4ED8] text-white'
                : 'border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B]'
            }`}
          >
            {autoRotate ? (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{autoRotate ? 'Pause Spin' : 'Auto-Spin'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowArGrid((prev) => !prev)}
            aria-pressed={showArGrid}
            className={`inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
              showArGrid
                ? 'bg-[#111111] dark:bg-[#F4F4F2] border-[#111111] dark:border-[#F4F4F2] text-white dark:text-[#111111]'
                : 'border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B]'
            }`}
          >
            <Grid3x3 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>AR Grid</span>
          </button>

          <div className="inline-flex items-center rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22]">
            <button
              type="button"
              onClick={() => setZoom((prev) => Number(Math.max(0.75, prev - 0.1).toFixed(2)))}
              aria-label="Zoom out 3D model"
              className="inline-flex h-9 w-9 items-center justify-center text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded-l-lg"
            >
              <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="px-2 font-mono text-xs tabular-nums text-[#111111] dark:text-[#F4F4F2]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((prev) => Number(Math.min(1.4, prev + 0.1).toFixed(2)))}
              aria-label="Zoom in 3D model"
              className="inline-flex h-9 w-9 items-center justify-center text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded-r-lg"
            >
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetView}
            aria-label="Reset 3D camera angle"
            className="inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
        Simulated 3D chassis proportions rendered from published millimeter dimensions ({phone.fullSpecs.dimensions}) and {phone.finish} finish tones for spatial scale inspection.
      </p>
    </div>
  );
};
