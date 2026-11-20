import React, { useEffect, useState } from 'react';
import { BellRing, Mail, TrendingDown, X, ArrowUpRight } from 'lucide-react';
import { PhoneModel } from '../data/phones';

export interface PriceDropToastItem {
  id: string;
  phone: PhoneModel;
  previousPriceUsd: number;
  newPriceUsd: number;
  reasonLabel: string;
  notifiedEmail: string | null;
  createdAt: number;
}

interface PriceDropToastContainerProps {
  toasts: PriceDropToastItem[];
  onDismiss: (toastId: string) => void;
  onInspectPhone: (phone: PhoneModel) => void;
}

const AUTO_DISMISS_MS = 9000;

const PriceDropToastCard: React.FC<{
  toast: PriceDropToastItem;
  onDismiss: (toastId: string) => void;
  onInspectPhone: (phone: PhoneModel) => void;
}> = ({ toast, onDismiss, onInspectPhone }) => {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setTimeout(() => {
      onDismiss(toast.id);
    }, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast.id, isPaused, onDismiss]);

  const savingsUsd = Math.max(0, toast.previousPriceUsd - toast.newPriceUsd);

  return (
    <div
      role="status"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="pointer-events-auto w-full rounded-xl border border-[#D4D4CE] dark:border-[#27272A] bg-white/95 dark:bg-[#161618]/95 backdrop-blur-sm p-4 shadow-xl transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>Price Drop Alert</span>
          <span aria-hidden="true" className="text-[#9A9A93] dark:text-[#71717A] font-normal">
            ·
          </span>
          <span className="font-normal text-[#5C5C58] dark:text-[#A1A1AA]">
            {toast.reasonLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label={`Dismiss price drop alert for ${toast.phone.name}`}
          className="inline-flex h-6 w-6 items-center justify-center rounded text-[#5C5C58] dark:text-[#A1A1AA] hover:bg-[#F6F6F4] dark:hover:bg-[#222226] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-3">
        <div className="h-12 w-16 rounded-md overflow-hidden bg-[#EAEAE6] dark:bg-[#1E1E22] shrink-0">
          <img
            src={toast.phone.imageUrl}
            alt={toast.phone.imageAlt}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#111111] dark:text-[#F4F4F2] truncate">
            {toast.phone.brand} {toast.phone.name}
          </p>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-2 font-mono text-xs tabular-nums">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              ${toast.newPriceUsd.toLocaleString()}
            </span>
            <span className="text-[#8A8A82] dark:text-[#71717A] line-through">
              ${toast.previousPriceUsd.toLocaleString()}
            </span>
            {savingsUsd > 0 && (
              <span className="text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                Save ${savingsUsd.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#EAEAE6] dark:border-[#222226] flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] text-[#5C5C58] dark:text-[#A1A1AA] min-w-0">
          {toast.notifiedEmail ? (
            <>
              <Mail className="h-3 w-3 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" aria-hidden="true" />
              <span className="truncate">
                Email queued: <span className="font-mono">{toast.notifiedEmail}</span>
              </span>
            </>
          ) : (
            <>
              <BellRing className="h-3 w-3 text-[#5C5C58] dark:text-[#A1A1AA] shrink-0" aria-hidden="true" />
              <span className="truncate">Add email alert in Specs for inbox delivery</span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => {
            onInspectPhone(toast.phone);
            onDismiss(toast.id);
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
        >
          <span>Inspect</span>
          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export const PriceDropToastContainer: React.FC<PriceDropToastContainerProps> = ({
  toasts,
  onDismiss,
  onInspectPhone,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Price drop notifications"
      className="pointer-events-none fixed bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] z-[60] flex flex-col gap-2.5"
    >
      {toasts.slice(-2).map((toast) => (
        <PriceDropToastCard
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
          onInspectPhone={onInspectPhone}
        />
      ))}
    </div>
  );
};
