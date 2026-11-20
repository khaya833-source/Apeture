export interface PriceAlertRecord {
  email: string;
  targetPrice: number;
}

export const PRICE_ALERTS_STORAGE_KEY = 'aperture-price-alerts';
export const FAVORITES_STORAGE_KEY = 'aperture-favorites';
export const PRICE_ALERTS_EVENT = 'aperture-price-alerts-updated';

export const loadPriceAlerts = (): Record<string, PriceAlertRecord> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PRICE_ALERTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, PriceAlertRecord>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const persistPriceAlerts = (alerts: Record<string, PriceAlertRecord>) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PRICE_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    window.dispatchEvent(new CustomEvent(PRICE_ALERTS_EVENT, { detail: alerts }));
  } catch {
    // Storage unavailable
  }
};

export const loadFavoritePhoneIds = (validIds: Set<string>): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string' && validIds.has(id));
  } catch {
    return [];
  }
};

export const persistFavoritePhoneIds = (ids: string[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable
  }
};
