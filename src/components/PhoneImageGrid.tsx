import React, { useEffect, useRef, useState } from 'react';
import { Smartphone, ArrowUpRight, Check, Plus, Eye, Heart, TrendingDown } from 'lucide-react';
import { PhoneModel } from '../data/phones';

interface PhoneImageGridProps {
  phones: PhoneModel[];
  selectedCompareIds: string[];
  favoriteIds?: string[];
  priceOverrides?: Record<string, number>;
  onToggleCompare: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onSelectPhone: (phone: PhoneModel) => void;
  isLoading?: boolean;
}

interface PhoneCardProps {
  phone: PhoneModel;
  isCompared: boolean;
  isFavorited: boolean;
  effectivePriceUsd: number;
  compareLimitReached: boolean;
  onToggleCompare: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onSelectPhone: (phone: PhoneModel) => void;
}

const PhoneCard: React.FC<PhoneCardProps> = ({
  phone,
  isCompared,
  isFavorited,
  effectivePriceUsd,
  compareLimitReached,
  onToggleCompare,
  onToggleFavorite,
  onSelectPhone,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [touchSpecsOpen, setTouchSpecsOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const hasPriceDrop = effectivePriceUsd < phone.priceUsd;

  useEffect(() => {
    setImgError(false);
    const imgEl = imgRef.current;
    if (imgEl && imgEl.complete) {
      if (imgEl.naturalWidth > 0) {
        setImgLoaded(true);
      } else {
        setImgError(true);
      }
    } else {
      setImgLoaded(false);
    }
  }, [phone.imageUrl]);

  return (
    <article className="group flex flex-col bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(17,17,17,0.12)] dark:hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]">
      {/* Studio Image Stage (4:3 uniform aspect ratio) */}
      <div className="relative aspect-[4/3] w-full bg-[#EAEAE6] dark:bg-[#1E1E22] overflow-hidden">
        {/* Skeleton placeholder while image asset is initializing in the browser */}
        {!imgLoaded && !imgError && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 flex flex-col items-center justify-center gap-3 bg-[#EAEAE6] dark:bg-[#1E1E22] p-6"
          >
            <div className="h-full w-full rounded-lg bg-[#DFDFD8] dark:bg-[#27272A] animate-pulse flex flex-col items-center justify-center gap-2.5">
              <div className="h-10 w-10 rounded-lg bg-[#D4D4CE] dark:bg-[#323236]" />
              <div className="h-2.5 w-24 rounded bg-[#D4D4CE] dark:bg-[#323236]" />
            </div>
          </div>
        )}

        {!imgError ? (
          <img
            ref={imgRef}
            src={phone.imageUrl}
            alt={phone.imageAlt}
            referrerPolicy="no-referrer"
            onLoad={() => setImgLoaded(true)}
            onError={() => {
              setImgError(true);
              setImgLoaded(false);
            }}
            className={`relative z-0 h-full w-full object-cover transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03] ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#EAEAE6] via-[#DFDFD8] to-[#D4D4CE] dark:from-[#1E1E22] dark:via-[#18181B] dark:to-[#111113] p-6 text-center">
            <Smartphone className="h-10 w-10 text-[#5C5C58] dark:text-[#A1A1AA]" strokeWidth={1.5} />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">{phone.name}</p>
              <p className="text-xs text-[#5C5C58] dark:text-[#A1A1AA]">{phone.finish}</p>
            </div>
          </div>
        )}

        {/* Clickable backdrop trigger to inspect full hardware sheet */}
        <button
          type="button"
          onClick={() => onSelectPhone(phone)}
          aria-label={`Inspect ${phone.brand} ${phone.name} specifications`}
          className="absolute inset-0 z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D4ED8]"
        />

        {/* Hover / Focus / Touch-toggle Specification Overlay */}
        <div
          className={`pointer-events-none absolute inset-0 z-20 flex flex-col justify-between bg-gradient-to-t from-neutral-950/95 via-neutral-950/75 to-neutral-950/25 p-5 text-white transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            touchSpecsOpen
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
          }`}
        >
          {/* Top-right Quick View affordance on desktop hover/focus */}
          <div className="hidden md:flex justify-end">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md bg-white/95 px-2.5 py-1 text-xs font-medium text-[#111111] shadow-sm transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                touchSpecsOpen
                  ? 'translate-y-0'
                  : '-translate-y-1 group-hover:translate-y-0 group-focus-within:translate-y-0'
              }`}
            >
              <Eye className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
              <span>Quick View</span>
            </span>
          </div>

          <div
            className={`mt-auto space-y-2.5 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              touchSpecsOpen
                ? 'translate-y-0'
                : 'translate-y-2 group-hover:translate-y-0 group-focus-within:translate-y-0'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-2">
              <span className="text-xs font-medium tracking-wide text-neutral-300">
                Key Specifications
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-white">
                Full Sheet
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>

            <dl className="grid grid-cols-1 gap-1.5 text-xs">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-neutral-400 shrink-0">Display</dt>
                <dd className="font-mono tabular-nums text-right text-neutral-100 truncate">
                  {phone.quickSpecs.display}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-neutral-400 shrink-0">Processor</dt>
                <dd className="font-mono tabular-nums text-right text-neutral-100 truncate">
                  {phone.quickSpecs.chipset}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-neutral-400 shrink-0">Camera</dt>
                <dd className="font-mono tabular-nums text-right text-neutral-100 truncate">
                  {phone.quickSpecs.camera}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-neutral-400 shrink-0">Battery</dt>
                <dd className="font-mono tabular-nums text-right text-neutral-100 truncate">
                  {phone.quickSpecs.battery}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-neutral-400 shrink-0">Storage</dt>
                <dd className="font-mono tabular-nums text-right text-neutral-100 truncate">
                  {phone.quickSpecs.storage}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Touch/Mobile Quick Spec Overlay Toggle (visible on mobile/touch or keyboard) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTouchSpecsOpen((prev) => !prev);
          }}
          aria-pressed={touchSpecsOpen}
          aria-label={touchSpecsOpen ? `Hide quick specs for ${phone.name}` : `Show quick specs for ${phone.name}`}
          className="md:hidden absolute top-3 right-3 z-30 inline-flex items-center gap-1.5 rounded-md bg-neutral-950/80 px-2.5 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{touchSpecsOpen ? 'Hide' : 'Specs'}</span>
        </button>
      </div>

      {/* Card Body: Clean Unboxed Metadata & Baseline-Aligned Price */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#5C5C58] dark:text-[#A1A1AA] mb-1.5">
            <span className="font-medium text-[#111111] dark:text-[#F4F4F2]">{phone.brand}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{phone.finish}</span>
            <span aria-hidden="true">·</span>
            <span>{phone.categoryLabel}</span>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight text-[#111111] dark:text-[#F4F4F2] truncate">
              {phone.name}
            </h2>
            {hasPriceDrop ? (
              <div className="flex flex-col items-end shrink-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[15px] font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                    ${effectivePriceUsd.toLocaleString()}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[#8A8A82] dark:text-[#71717A] line-through">
                    ${phone.priceUsd.toLocaleString()}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <TrendingDown className="h-3 w-3 shrink-0" aria-hidden="true" />
                  <span>Price Drop</span>
                </span>
              </div>
            ) : (
              <span className="font-mono text-[15px] font-medium tabular-nums text-[#111111] dark:text-[#F4F4F2] shrink-0">
                ${phone.priceUsd.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Hairline Action Footer */}
        <div className="mt-4 pt-3.5 border-t border-[#EAEAE6] dark:border-[#222226] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectPhone(phone)}
              className="inline-flex items-center gap-1 text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] transition-colors cursor-pointer py-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
            >
              <span>Specs</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="h-3 w-px bg-[#D4D4CE] dark:bg-[#27272A]" aria-hidden="true" />
            <a
              href={phone.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors py-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
            >
              <span>Official</span>
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(phone.id)}
                aria-pressed={isFavorited}
                aria-label={
                  isFavorited
                    ? `Remove ${phone.brand} ${phone.name} from favorites`
                    : `Save ${phone.brand} ${phone.name} to favorites`
                }
                title={isFavorited ? 'Saved to favorites' : 'Save to favorites'}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                  isFavorited
                    ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                    : 'border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-[#5C5C58] dark:text-[#A1A1AA] hover:border-[#111111] dark:hover:border-[#52525B] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${isFavorited ? 'fill-current' : ''}`} aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onToggleCompare(phone.id)}
              disabled={!isCompared && compareLimitReached}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                isCompared
                  ? 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer'
                  : compareLimitReached
                    ? 'bg-[#F6F6F4] dark:bg-[#1A1A1D] text-[#9A9A93] dark:text-[#52525B] cursor-not-allowed'
                    : 'bg-[#F6F6F4] dark:bg-[#222226] text-[#111111] dark:text-[#F4F4F2] hover:bg-[#EAEAE6] dark:hover:bg-[#2E2E34] cursor-pointer'
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>In Compare</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Compare</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

const PhoneCardSkeleton: React.FC = () => (
  <div
    aria-hidden="true"
    className="flex flex-col bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl overflow-hidden"
  >
    <div className="aspect-[4/3] w-full bg-[#EAEAE6] dark:bg-[#1E1E22] p-6">
      <div className="h-full w-full rounded-lg bg-[#DFDFD8] dark:bg-[#27272A] animate-pulse" />
    </div>
    <div className="p-5 space-y-4">
      <div className="space-y-2">
        <div className="h-3 w-36 rounded bg-[#EAEAE6] dark:bg-[#27272A] animate-pulse" />
        <div className="flex items-center justify-between gap-4">
          <div className="h-4 w-40 rounded bg-[#DFDFD8] dark:bg-[#323236] animate-pulse" />
          <div className="h-4 w-14 rounded bg-[#EAEAE6] dark:bg-[#27272A] animate-pulse" />
        </div>
      </div>
      <div className="pt-3.5 border-t border-[#EAEAE6] dark:border-[#222226] flex items-center justify-between gap-3">
        <div className="h-4 w-24 rounded bg-[#EAEAE6] dark:bg-[#27272A] animate-pulse" />
        <div className="h-7 w-20 rounded-md bg-[#EAEAE6] dark:bg-[#27272A] animate-pulse" />
      </div>
    </div>
  </div>
);

export const PhoneImageGrid: React.FC<PhoneImageGridProps> = ({
  phones,
  selectedCompareIds,
  favoriteIds = [],
  priceOverrides = {},
  onToggleCompare,
  onToggleFavorite,
  onSelectPhone,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Loading mobile phone studio gallery"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <PhoneCardSkeleton key={idx} />
        ))}
      </div>
    );
  }

  if (phones.length === 0) {
    return (
      <div className="border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] rounded-xl py-16 px-6 text-center">
        <Smartphone className="mx-auto h-8 w-8 text-[#5C5C58] dark:text-[#A1A1AA] mb-3" strokeWidth={1.5} />
        <p className="text-base font-medium text-[#111111] dark:text-[#F4F4F2]">No matching phone models</p>
        <p className="mt-1 text-sm text-[#5C5C58] dark:text-[#A1A1AA]">
          Try clearing your search query or switching to All Models.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
      {phones.map((phone) => (
        <PhoneCard
          key={phone.id}
          phone={phone}
          isCompared={selectedCompareIds.includes(phone.id)}
          isFavorited={favoriteIds.includes(phone.id)}
          effectivePriceUsd={priceOverrides[phone.id] ?? phone.priceUsd}
          compareLimitReached={selectedCompareIds.length >= 3}
          onToggleCompare={onToggleCompare}
          onToggleFavorite={onToggleFavorite}
          onSelectPhone={onSelectPhone}
        />
      ))}
    </div>
  );
};
