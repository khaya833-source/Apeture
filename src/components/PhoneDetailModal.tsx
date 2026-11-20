import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Check, Plus, ArrowUpRight, Share2, BatteryCharging, ArrowLeftRight, Bell, Mail, Box, MapPin, Store, Clock, Loader2, Navigation, Heart, TrendingDown, Info } from 'lucide-react';
import { PHONE_MODELS, PhoneModel } from '../data/phones';
import { PriceHistoryChart } from './PriceHistoryChart';
import { PhoneArViewer } from './PhoneArViewer';
import {
  PriceAlertRecord,
  PRICE_ALERTS_EVENT,
  loadPriceAlerts,
  persistPriceAlerts,
} from '../utils/priceAlerts';

type TradeInCondition = 'excellent' | 'good' | 'fair';

const BRAND_RETENTION_RATES: Record<string, number> = {
  Apple: 0.55,
  Samsung: 0.5,
  Google: 0.46,
  OnePlus: 0.44,
  Xiaomi: 0.42,
  vivo: 0.42,
  Motorola: 0.4,
};

const CONDITION_OPTIONS: Array<{
  id: TradeInCondition;
  label: string;
  multiplier: number;
  note: string;
}> = [
  { id: 'excellent', label: 'Excellent', multiplier: 1.0, note: 'Flawless glass & chassis' },
  { id: 'good', label: 'Good', multiplier: 0.82, note: 'Light wear, no cracks' },
  { id: 'fair', label: 'Fair', multiplier: 0.58, note: 'Visible wear, fully working' },
];

const getTradeInQuoteUrl = (phone: PhoneModel): string => {
  switch (phone.brand) {
    case 'Apple':
      return 'https://www.apple.com/shop/trade-in';
    case 'Samsung':
      return 'https://www.samsung.com/us/trade-in/';
    case 'Google':
      return 'https://store.google.com/magazine/trade_in';
    case 'OnePlus':
      return 'https://www.oneplus.com/trade-in';
    case 'Motorola':
      return 'https://www.motorola.com/us/trade-in';
    default:
      return phone.officialUrl;
  }
};

const parseBatteryMah = (batteryText: string): number => {
  const match = batteryText.replace(/,/g, '').match(/(\d{4,5})\s*mAh/i);
  return match ? Number.parseInt(match[1], 10) : 4500;
};

const MAX_CATALOG_MAH = Math.max(
  ...PHONE_MODELS.map((model) => parseBatteryMah(model.fullSpecs.batteryDetail)),
  6000
);

const formatReleaseInfo = (releaseDate: string): { formattedDate: string; ageLabel: string } => {
  const parsed = new Date(`${releaseDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { formattedDate: releaseDate, ageLabel: '' };
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);

  const now = new Date();
  let months =
    (now.getFullYear() - parsed.getFullYear()) * 12 + (now.getMonth() - parsed.getMonth());
  if (now.getDate() < parsed.getDate()) {
    months -= 1;
  }
  const safeMonths = Math.max(0, months);

  let ageLabel: string;
  if (safeMonths === 0) {
    ageLabel = 'Current month release';
  } else if (safeMonths < 12) {
    ageLabel = `${safeMonths} mo since launch`;
  } else {
    const years = Math.floor(safeMonths / 12);
    const remMonths = safeMonths % 12;
    ageLabel =
      remMonths === 0
        ? `${years} ${years === 1 ? 'yr' : 'yrs'} since launch`
        : `${years} yr ${remMonths} mo since launch`;
  }

  return { formattedDate, ageLabel };
};

const isLightHex = (hex: string): boolean => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = Number.parseInt(clean.slice(0, 2), 16);
  const g = Number.parseInt(clean.slice(2, 4), 16);
  const b = Number.parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62;
};

interface SimulatedRetailer {
  id: string;
  name: string;
  retailerType: string;
  address: string;
  distanceMiles: number;
  stockStatus: 'in-stock' | 'low-stock' | 'next-day';
  unitsAvailable: number;
  pickupWindow: string;
  hours: string;
}

interface GeoLocationPoint {
  lat: number;
  lng: number;
  sourceLabel: string;
}

const hashSeed = (input: string): number => {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const generateNearbyRetailers = (
  phone: PhoneModel,
  finishId: string,
  coords: GeoLocationPoint
): SimulatedRetailer[] => {
  const geoTag = `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
  const seed = hashSeed(`${phone.id}:${finishId}:${geoTag}`);

  const brandStoreName =
    phone.brand === 'Apple'
      ? 'Apple Flagship Store'
      : phone.brand === 'Samsung'
        ? 'Samsung Experience Store'
        : phone.brand === 'Google'
          ? 'Google Hardware Studio'
          : `${phone.brand} Authorized Boutique`;

  const streetSeeds = [
    '420 Market Plaza',
    '1185 Union Square Ave',
    '760 Westside Commons',
    '2410 Grand Central Blvd',
  ];

  const baseStores = [
    {
      id: 'brand-flagship',
      name: brandStoreName,
      retailerType: 'Official Brand Store',
      address: streetSeeds[seed % streetSeeds.length],
      distanceBase: 0.6,
      hours: 'Open until 8:00 PM',
    },
    {
      id: 'best-buy-mobile',
      name: 'Best Buy Mobile & Computing',
      retailerType: 'Authorized Electronics',
      address: streetSeeds[(seed + 1) % streetSeeds.length],
      distanceBase: 1.5,
      hours: 'Open until 9:00 PM',
    },
    {
      id: 'carrier-flagship',
      name: 'Metro Carrier Flagship Hub',
      retailerType: 'Unlocked & Carrier Stock',
      address: streetSeeds[(seed + 2) % streetSeeds.length],
      distanceBase: 2.7,
      hours: 'Open until 7:30 PM',
    },
    {
      id: 'atelier-tech',
      name: 'Northgate Tech Exchange',
      retailerType: 'Authorized Reseller',
      address: streetSeeds[(seed + 3) % streetSeeds.length],
      distanceBase: 4.1,
      hours: 'Open until 8:00 PM',
    },
  ];

  return baseStores.map((store, idx) => {
    const itemSeed = hashSeed(`${phone.id}:${finishId}:${store.id}:${geoTag}`);
    const distanceOffset = ((itemSeed % 9) / 10);
    const distanceMiles = Number((store.distanceBase + distanceOffset).toFixed(1));
    const stockRoll = (itemSeed + idx) % 10;

    let stockStatus: SimulatedRetailer['stockStatus'];
    let unitsAvailable: number;
    let pickupWindow: string;

    if (stockRoll <= 5) {
      stockStatus = 'in-stock';
      unitsAvailable = 2 + (itemSeed % 5);
      pickupWindow = 'Ready in 1 hr';
    } else if (stockRoll <= 8) {
      stockStatus = 'low-stock';
      unitsAvailable = 1;
      pickupWindow = 'Ready today · Last unit';
    } else {
      stockStatus = 'next-day';
      unitsAvailable = 0;
      pickupWindow = 'Pickup tomorrow 10 AM';
    }

    return {
      id: store.id,
      name: store.name,
      retailerType: store.retailerType,
      address: store.address,
      distanceMiles,
      stockStatus,
      unitsAvailable,
      pickupWindow,
      hours: store.hours,
    };
  });
};

type DisplayGlossaryKey = 'ltpo' | 'oled' | 'vrr' | 'refresh-60' | 'nits' | 'resolution' | 'overview';

interface DisplayGlossaryEntry {
  key: DisplayGlossaryKey;
  title: string;
  plainSummary: string;
  everydayImpact: string;
}

interface ActiveDisplayTooltip {
  triggerId: string;
  key: DisplayGlossaryKey;
  matchedPhrase?: string;
  top: number;
  left: number;
  placeAbove: boolean;
  pinned: boolean;
}

const DISPLAY_GLOSSARY: Record<DisplayGlossaryKey, DisplayGlossaryEntry> = {
  ltpo: {
    key: 'ltpo',
    title: 'LTPO (Adaptive Power-Saving Backplane)',
    plainSummary:
      'Low-Temperature Polycrystalline Oxide is a smart screen layer that automatically slows screen updates down to 1Hz (or 0.1Hz) when nothing is moving—like reading text or checking the always-on lock screen.',
    everydayImpact:
      'Saves noticeable battery life without sacrificing smooth motion when you touch or scroll.',
  },
  oled: {
    key: 'oled',
    title: 'OLED / AMOLED (Self-Lit Pixel Panel)',
    plainSummary:
      'Unlike older LCD screens that shine a backlight behind everything, each OLED (or AMOLED / plastic-backed pOLED) pixel creates its own light and switches completely off to show pure black.',
    everydayImpact:
      'Produces deep, inky blacks, rich contrast, slim screen borders, and cleaner dark-mode efficiency.',
  },
  vrr: {
    key: 'vrr',
    title: 'Variable Refresh Rate (Up to 120Hz–165Hz)',
    plainSummary:
      'Refresh rate (Hz) counts how many times per second the picture updates. Variable Refresh Rate—also called ProMotion on iPhone—ramps up to 120Hz+ during fast swiping or gaming, then drops low on still images.',
    everydayImpact:
      'Makes scrolling and animations look effortlessly fluid while keeping battery drain in check.',
  },
  'refresh-60': {
    key: 'refresh-60',
    title: 'Standard 60Hz Refresh Rate',
    plainSummary:
      'Updates the picture 60 times every second at a steady pace rather than boosting to 120Hz like Variable Refresh Rate panels.',
    everydayImpact:
      'Reliable for video and everyday apps, though fast scrolling looks less fluid than 120Hz screens.',
  },
  nits: {
    key: 'nits',
    title: 'Peak Brightness (Nits)',
    plainSummary:
      'A "nit" measures light output. Everyday indoor viewing uses roughly 300–600 nits, while 2,000+ nits peak lets HDR highlights and outdoor screens surge dramatically brighter.',
    everydayImpact:
      'Higher peak nits keep maps, camera previews, and messages readable in bright midday sun.',
  },
  resolution: {
    key: 'resolution',
    title: 'Resolution Tier (FHD+ / QHD+ / 2K)',
    plainSummary:
      'Indicates how densely pixels are packed across the glass. FHD+ (1080p-class) already looks crisp at normal viewing distance, while 2K, QHD+, WQHD+, and QXGA+ squeeze in extra detail.',
    everydayImpact:
      'Sharper small text and zoomed-in photos on QHD+ panels; slightly better battery efficiency on FHD+.',
  },
  overview: {
    key: 'overview',
    title: 'Display Hardware Guide',
    plainSummary:
      'A phone screen combines panel technology (OLED for contrast), refresh control (LTPO + Variable Refresh Rate for smoothness and battery), and brightness (nits for outdoor clarity).',
    everydayImpact:
      'Hover, focus, or tap any underlined term in the Display line to inspect what it means on this device.',
  },
};

const DISPLAY_TERM_REGEX =
  /(LTPO 4\.1|8T LTPO|LTPO|Super Retina XDR OLED|Super Actua OLED|Actua OLED|Dynamic AMOLED 2X|Super AMOLED|AMOLED 2X|AMOLED|pOLED|OLED|1–120Hz ProMotion|0\.1–120Hz|1–120Hz|60–120Hz|165Hz|120Hz|60Hz|\d[\d,]*\s*nits(?:\s+local)?\s+peak|WQHD\+|QXGA\+|QHD\+|FHD\+|2K)/g;

const classifyDisplayPhrase = (phrase: string): DisplayGlossaryKey => {
  const lower = phrase.toLowerCase();
  if (lower.includes('ltpo')) return 'ltpo';
  if (lower.includes('oled')) return 'oled';
  if (lower === '60hz') return 'refresh-60';
  if (lower.includes('hz') || lower.includes('promotion')) return 'vrr';
  if (lower.includes('nits')) return 'nits';
  return 'resolution';
};

interface DisplaySpecSegment {
  text: string;
  glossaryKey?: DisplayGlossaryKey;
}

const tokenizeDisplaySpec = (displayDetail: string): DisplaySpecSegment[] => {
  const regex = new RegExp(DISPLAY_TERM_REGEX.source, 'g');
  const segments: DisplaySpecSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = regex.exec(displayDetail)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: displayDetail.slice(lastIndex, match.index) });
    }
    const matchedText = match[0];
    segments.push({
      text: matchedText,
      glossaryKey: classifyDisplayPhrase(matchedText),
    });
    lastIndex = match.index + matchedText.length;
  }

  if (lastIndex < displayDetail.length) {
    segments.push({ text: displayDetail.slice(lastIndex) });
  }

  return segments;
};

interface PhoneDetailModalProps {
  phone: PhoneModel | null;
  isCompared: boolean;
  compareLimitReached: boolean;
  isFavorited?: boolean;
  effectivePriceUsd?: number;
  isDark?: boolean;
  onClose: () => void;
  onToggleCompare: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  onTriggerPriceDrop?: (phoneId: string, newPriceUsd: number, reasonLabel?: string) => void;
}

export const PhoneDetailModal: React.FC<PhoneDetailModalProps> = ({
  phone,
  isCompared,
  compareLimitReached,
  isFavorited = false,
  effectivePriceUsd,
  isDark = false,
  onClose,
  onToggleCompare,
  onToggleFavorite,
  onTriggerPriceDrop,
}) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared' | 'copied' | 'error'>('idle');
  const [tradeInCondition, setTradeInCondition] = useState<TradeInCondition>('excellent');
  const [priceAlerts, setPriceAlerts] = useState<Record<string, PriceAlertRecord>>(loadPriceAlerts);
  const [alertEmail, setAlertEmail] = useState('');
  const [alertTargetInput, setAlertTargetInput] = useState('');
  const [alertError, setAlertError] = useState('');
  const [isEditingAlert, setIsEditingAlert] = useState(false);
  const [isArViewerOpen, setIsArViewerOpen] = useState(false);
  const [selectedColorwayId, setSelectedColorwayId] = useState('');
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const [retailerPanelOpen, setRetailerPanelOpen] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'ready' | 'error'>('idle');
  const [geoPoint, setGeoPoint] = useState<GeoLocationPoint | null>(null);
  const [geoError, setGeoError] = useState('');
  const [manualAreaInput, setManualAreaInput] = useState('');
  const [heldRetailerIds, setHeldRetailerIds] = useState<Record<string, string>>({});
  const [activeDisplayTooltip, setActiveDisplayTooltip] = useState<ActiveDisplayTooltip | null>(null);
  const retailersSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setShareStatus('idle');
    setTradeInCondition('excellent');
    setAlertError('');
    setIsEditingAlert(false);
    setIsArViewerOpen(false);
    setHeroImageFailed(false);
    setRetailerPanelOpen(false);
    setGeoStatus('idle');
    setGeoError('');
    setHeldRetailerIds({});
    setActiveDisplayTooltip(null);

    if (!phone) {
      setSelectedColorwayId('');
      return;
    }

    setSelectedColorwayId(phone.colorways[0]?.id ?? '');

    // Preload any dedicated alternate colorway studio photographs for instant switching
    phone.colorways.forEach((colorway) => {
      if (colorway.imageUrl && colorway.imageUrl !== phone.imageUrl) {
        const img = new Image();
        img.decoding = 'async';
        img.referrerPolicy = 'no-referrer';
        img.src = colorway.imageUrl;
      }
    });

    const existing = priceAlerts[phone.id];
    const sixMonthLow = Math.min(...phone.priceHistory.map((point) => point.priceUsd));
    const fallbackTarget =
      sixMonthLow < phone.priceUsd ? sixMonthLow : Math.round((phone.priceUsd * 0.9) / 10) * 10;
    const knownEmail =
      existing?.email ??
      Object.values(priceAlerts).find((entry) => entry.email.trim().length > 0)?.email ??
      '';

    setAlertEmail(knownEmail);
    setAlertTargetInput(String(existing?.targetPrice ?? fallbackTarget));
  }, [phone?.id]);

  useEffect(() => {
    const syncAlerts = () => setPriceAlerts(loadPriceAlerts());
    window.addEventListener(PRICE_ALERTS_EVENT, syncAlerts);
    window.addEventListener('storage', syncAlerts);
    return () => {
      window.removeEventListener(PRICE_ALERTS_EVENT, syncAlerts);
      window.removeEventListener('storage', syncAlerts);
    };
  }, []);

  useEffect(() => {
    if (!phone) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeDisplayTooltip) {
          setActiveDisplayTooltip(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phone, onClose, activeDisplayTooltip]);

  if (!phone) return null;

  const activeColorway =
    phone.colorways.find((colorway) => colorway.id === selectedColorwayId) ?? phone.colorways[0];
  const activeFinishName = activeColorway?.name ?? phone.finish;
  const heroImageUrl = activeColorway?.imageUrl ?? phone.imageUrl;
  const heroImageAlt =
    activeColorway?.imageAlt ??
    `${phone.brand} ${phone.name} in ${activeFinishName} finish on a neutral stone surface`;

  const nearbyRetailers = useMemo(() => {
    if (!geoPoint) return [];
    return generateNearbyRetailers(phone, activeColorway?.id ?? phone.finish, geoPoint);
  }, [phone, activeColorway?.id, geoPoint]);

  const scrollToRetailers = () => {
    window.requestAnimationFrame(() => {
      retailersSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const handleFindNearbyRetailers = () => {
    setRetailerPanelOpen(true);
    setGeoError('');

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setGeoStatus('error');
      setGeoError('Browser Geolocation API is unavailable in this environment. Enter a ZIP/city or use sample metro coordinates below.');
      scrollToRetailers();
      return;
    }

    setGeoStatus('locating');
    scrollToRetailers();

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          sourceLabel: 'Current GPS Location',
        });
        setGeoStatus('ready');
        setGeoError('');
      },
      (err) => {
        setGeoStatus('error');
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location access was denied. Enable browser location permission or check local inventory using a ZIP/city below.');
        } else if (err.code === err.TIMEOUT) {
          setGeoError('Location request timed out. Retry geolocation or enter a ZIP/city below.');
        } else {
          setGeoError('Unable to determine current coordinates. Retry geolocation or enter a ZIP/city below.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 120000,
      }
    );
  };

  const handleUseDemoLocation = () => {
    setGeoPoint({
      lat: 37.7749,
      lng: -122.4194,
      sourceLabel: 'San Francisco, CA (Sample Metro)',
    });
    setGeoStatus('ready');
    setGeoError('');
  };

  const handleManualAreaLookup = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleaned = manualAreaInput.trim();
    if (!cleaned) return;
    const h = hashSeed(cleaned.toLowerCase());
    const pseudoLat = 33 + (h % 1400) / 100;
    const pseudoLng = -(73 + ((h >> 8) % 4900) / 100);
    setGeoPoint({
      lat: pseudoLat,
      lng: pseudoLng,
      sourceLabel: cleaned,
    });
    setGeoStatus('ready');
    setGeoError('');
  };

  const handleToggleRetailerHold = (retailerId: string) => {
    setHeldRetailerIds((prev) => {
      if (prev[retailerId]) {
        const next = { ...prev };
        delete next[retailerId];
        return next;
      }
      const codeNum = (hashSeed(`${phone.id}:${retailerId}:${activeFinishName}`) % 9000) + 1000;
      return { ...prev, [retailerId]: `AP-${codeNum}` };
    });
  };

  const getShareUrl = (modelId: string): string => {
    if (typeof window === 'undefined') return `?phone=${encodeURIComponent(modelId)}`;
    const url = new URL(window.location.href);
    url.searchParams.set('phone', modelId);
    return url.toString();
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl(phone.id);

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareStatus('copied');
        window.setTimeout(() => setShareStatus('idle'), 2500);
        return;
      }
    } catch {
      // Clipboard API blocked; attempt execCommand fallback below
    }

    try {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      if (copied) {
        setShareStatus('copied');
        window.setTimeout(() => setShareStatus('idle'), 2500);
        return;
      }
    } catch {
      // execCommand fallback unavailable
    }

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: `${phone.brand} ${phone.name}`,
          text: `${phone.brand} ${phone.name} (${activeFinishName}) — ${phone.quickSpecs.display}`,
          url: shareUrl,
        });
        setShareStatus('shared');
        window.setTimeout(() => setShareStatus('idle'), 2500);
        return;
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
    }

    setShareStatus('error');
    window.setTimeout(() => setShareStatus('idle'), 2500);
  };

  const releaseInfo = formatReleaseInfo(phone.releaseDate);

  const specRows = [
    {
      label: 'Release Date',
      value: releaseInfo.ageLabel
        ? `${releaseInfo.formattedDate} (${releaseInfo.ageLabel})`
        : releaseInfo.formattedDate,
    },
    { label: 'Display', value: phone.fullSpecs.displayDetail },
    { label: 'Processor', value: phone.fullSpecs.processorDetail },
    { label: 'Memory', value: phone.fullSpecs.ram },
    { label: 'Storage', value: phone.fullSpecs.storageOptions },
    { label: 'Rear Camera', value: phone.fullSpecs.rearCameraDetail },
    { label: 'Front Camera', value: phone.fullSpecs.frontCameraDetail },
    { label: 'Battery', value: phone.fullSpecs.batteryDetail },
    { label: 'Charging', value: phone.fullSpecs.charging },
    { label: 'Materials', value: phone.fullSpecs.chassis },
    { label: 'Dimensions', value: `${phone.fullSpecs.dimensions} · ${phone.fullSpecs.weight}` },
    { label: 'Connectivity', value: phone.fullSpecs.connectivity },
    { label: 'Operating System', value: phone.fullSpecs.os },
  ];

  const batteryMah = parseBatteryMah(phone.fullSpecs.batteryDetail);
  const endurancePercent = Math.min(100, Math.round((batteryMah / MAX_CATALOG_MAH) * 100));
  const estimatedHours = ((batteryMah / 1000) * 3.1).toFixed(1);
  const enduranceTier =
    batteryMah >= 5400 ? 'Multi-Day Endurance' : batteryMah >= 4600 ? 'Extended Full-Day' : 'All-Day Standard';

  const brandRetentionRate = BRAND_RETENTION_RATES[phone.brand] ?? 0.45;
  const activeCondition =
    CONDITION_OPTIONS.find((option) => option.id === tradeInCondition) ?? CONDITION_OPTIONS[0];
  const currentPrice = effectivePriceUsd ?? phone.priceUsd;
  const hasPriceDrop = currentPrice < phone.priceUsd;
  const estimatedTradeIn =
    Math.round((phone.priceUsd * brandRetentionRate * activeCondition.multiplier) / 10) * 10;
  const retentionPercent = Math.round((estimatedTradeIn / phone.priceUsd) * 100);
  const netUpgradePrice = Math.max(0, currentPrice - estimatedTradeIn);
  const tradeInQuoteUrl = getTradeInQuoteUrl(phone);

  const sixMonthLow = Math.min(...phone.priceHistory.map((point) => point.priceUsd));
  const tenPercentTarget = Math.round((phone.priceUsd * 0.9) / 10) * 10;
  const activePriceAlert = priceAlerts[phone.id];

  const handlePriceAlertSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmedEmail = alertEmail.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
    if (!isValidEmail) {
      setAlertError('Enter a valid email address to receive price drop notifications.');
      return;
    }

    const parsedTarget = Math.round(Number(alertTargetInput));
    if (!Number.isFinite(parsedTarget) || parsedTarget < 100) {
      setAlertError('Enter a target threshold of at least $100.');
      return;
    }

    const updatedAlerts: Record<string, PriceAlertRecord> = {
      ...priceAlerts,
      [phone.id]: {
        email: trimmedEmail,
        targetPrice: parsedTarget,
      },
    };

    setPriceAlerts(updatedAlerts);
    persistPriceAlerts(updatedAlerts);
    setAlertError('');
    setIsEditingAlert(false);

    if (hasPriceDrop && currentPrice <= parsedTarget && onTriggerPriceDrop) {
      onTriggerPriceDrop(phone.id, currentPrice, 'Email Alert Match');
    }
  };

  const handleSimulateDeviceDrop = () => {
    if (!onTriggerPriceDrop) return;
    const baselineDrop =
      sixMonthLow < currentPrice ? sixMonthLow : Math.max(100, Math.round((currentPrice * 0.9) / 10) * 10);
    const nextPrice = activePriceAlert
      ? Math.min(activePriceAlert.targetPrice, baselineDrop)
      : baselineDrop;
    const finalPrice = nextPrice < currentPrice ? nextPrice : Math.max(100, currentPrice - 80);
    const reason = activePriceAlert
      ? 'Email Alert Match'
      : isFavorited
        ? 'Favorited'
        : 'Recently Viewed';
    onTriggerPriceDrop(phone.id, finalPrice, reason);
  };

  const handleRemovePriceAlert = () => {
    const updatedAlerts = { ...priceAlerts };
    delete updatedAlerts[phone.id];
    setPriceAlerts(updatedAlerts);
    persistPriceAlerts(updatedAlerts);
    setAlertError('');
    setIsEditingAlert(false);
    setAlertTargetInput(String(sixMonthLow < phone.priceUsd ? sixMonthLow : tenPercentTarget));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4 sm:p-6 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-detail-title"
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl shadow-2xl"
        onClick={(e) => {
          e.stopPropagation();
          if (activeDisplayTooltip) setActiveDisplayTooltip(null);
        }}
        onScroll={() => {
          if (activeDisplayTooltip) setActiveDisplayTooltip(null);
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-white/95 dark:bg-[#161618]/95 backdrop-blur-xs border-b border-[#EAEAE6] dark:border-[#222226] px-6 py-4">
          <div className="flex items-center gap-2 text-xs text-[#5C5C58] dark:text-[#A1A1AA] min-w-0">
            <span className="font-medium text-[#111111] dark:text-[#F4F4F2] shrink-0">{phone.brand}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{activeFinishName}</span>
            <span aria-hidden="true" className="hidden sm:inline">·</span>
            <span className="hidden sm:inline shrink-0">{phone.categoryLabel}</span>
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
                className={`inline-flex h-9 items-center gap-1.5 px-3 rounded-md border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                  isFavorited
                    ? 'border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                    : 'border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B]'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${isFavorited ? 'fill-current' : ''}`} aria-hidden="true" />
                <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleShare}
              title={getShareUrl(phone.id)}
              aria-label={`Copy shareable link for ${phone.brand} ${phone.name}`}
              className="inline-flex h-9 items-center gap-1.5 px-3 rounded-md border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              {shareStatus === 'shared' || shareStatus === 'copied' ? (
                <>
                  <Check className="h-3.5 w-3.5 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                  <span>{shareStatus === 'copied' ? 'Link Copied' : 'Shared'}</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{shareStatus === 'error' ? 'Unavailable' : 'Share'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close specifications modal"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#5C5C58] dark:text-[#A1A1AA] hover:bg-[#F6F6F4] dark:hover:bg-[#222226] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isArViewerOpen ? (
          <PhoneArViewer
            phone={phone}
            selectedFinishName={activeFinishName}
            selectedFinishHex={activeColorway?.hex}
            onBack={() => setIsArViewerOpen(false)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Studio Preview */}
            <div className="lg:col-span-5 bg-[#F6F6F4] dark:bg-[#111113] p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#EAEAE6] dark:border-[#222226]">
            <div>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#EAEAE6] dark:bg-[#1E1E22]">
                {heroImageFailed ? (
                  <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#EAEAE6] to-[#D4D4CE] dark:from-[#1E1E22] dark:to-[#111113]">
                    <span
                      aria-hidden="true"
                      className="h-10 w-10 rounded-full border border-black/15 dark:border-white/20 mb-3"
                      style={{ backgroundColor: activeColorway?.hex ?? '#8C8A83' }}
                    />
                    <p className="text-sm font-medium text-[#111111] dark:text-[#F4F4F2]">
                      {phone.brand} {phone.name}
                    </p>
                    <p className="mt-1 text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
                      {activeFinishName}
                    </p>
                  </div>
                ) : (
                  <>
                    <img
                      src={heroImageUrl}
                      alt={heroImageAlt}
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImageFailed(true)}
                      style={
                        activeColorway?.studioGrade?.imgFilter
                          ? { filter: activeColorway.studioGrade.imgFilter }
                          : undefined
                      }
                      className="h-full w-full object-cover transition-[filter,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    />
                    {activeColorway?.studioGrade?.tintGradient && (
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 transition-opacity duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{
                          background: activeColorway.studioGrade.tintGradient,
                          mixBlendMode: activeColorway.studioGrade.blendMode ?? 'color',
                        }}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Official Colorway Picker */}
              {phone.colorways.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#EAEAE6] dark:border-[#222226]">
                  <div className="flex items-baseline justify-between gap-2 mb-2.5">
                    <span className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA]">
                      Finish
                    </span>
                    <span className="text-xs font-medium text-[#111111] dark:text-[#F4F4F2] text-right truncate">
                      {activeFinishName}
                    </span>
                  </div>

                  <div
                    role="radiogroup"
                    aria-label={`Select official colorway for ${phone.brand} ${phone.name}`}
                    className="flex flex-wrap items-center gap-2"
                  >
                    {phone.colorways.map((colorway) => {
                      const isSelected = activeColorway?.id === colorway.id;
                      const lightSwatch = isLightHex(colorway.hex);
                      return (
                        <button
                          key={colorway.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`${colorway.name} (${colorway.material})`}
                          title={colorway.name}
                          onClick={() => {
                            setHeroImageFailed(false);
                            setSelectedColorwayId(colorway.id);
                          }}
                          className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full p-1 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                            isSelected
                              ? 'ring-2 ring-[#111111] dark:ring-[#F4F4F2] bg-white dark:bg-[#1E1E22]'
                              : 'ring-1 ring-transparent hover:ring-[#9A9A93] dark:hover:ring-[#52525B]'
                          }`}
                        >
                          <span
                            className="flex h-full w-full items-center justify-center rounded-full border border-black/15 dark:border-white/20 shadow-inner"
                            style={{
                              background: colorway.secondaryHex
                                ? `linear-gradient(135deg, ${colorway.hex} 52%, ${colorway.secondaryHex} 100%)`
                                : colorway.hex,
                            }}
                          >
                            {isSelected && (
                              <Check
                                className={`h-3.5 w-3.5 ${
                                  lightSwatch ? 'text-[#111111]' : 'text-white'
                                }`}
                                strokeWidth={2.5}
                                aria-hidden="true"
                              />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {activeColorway?.material && (
                    <p className="mt-2 text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                      {activeColorway.material} ·{' '}
                      <span className="font-mono tabular-nums">
                        {phone.colorways.length} official {phone.colorways.length === 1 ? 'finish' : 'finishes'}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <h2
                  id="phone-detail-title"
                  className="text-2xl font-semibold tracking-tight text-[#111111] dark:text-[#F4F4F2]"
                >
                  {phone.name}
                </h2>
                {hasPriceDrop ? (
                  <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
                    <span className="font-mono text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      From ${currentPrice.toLocaleString()}
                    </span>
                    <span className="font-mono text-sm tabular-nums text-[#8A8A82] dark:text-[#71717A] line-through">
                      ${phone.priceUsd.toLocaleString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                      <TrendingDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Save ${(phone.priceUsd - currentPrice).toLocaleString()}</span>
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 font-mono text-lg font-medium tabular-nums text-[#111111] dark:text-[#F4F4F2]">
                    From ${phone.priceUsd.toLocaleString()}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
                  <span className="font-mono tabular-nums">Released {releaseInfo.formattedDate}</span>
                  {releaseInfo.ageLabel && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">{releaseInfo.ageLabel}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => onToggleCompare(phone.id)}
                  disabled={!isCompared && compareLimitReached}
                  className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                    isCompared
                      ? 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] cursor-pointer'
                      : compareLimitReached
                        ? 'bg-[#EAEAE6] dark:bg-[#1E1E22] text-[#9A9A93] dark:text-[#52525B] cursor-not-allowed'
                        : 'bg-[#111111] dark:bg-[#F4F4F2] text-white dark:text-[#111111] hover:bg-[#2A2A28] dark:hover:bg-[#E4E4E7] cursor-pointer'
                  }`}
                >
                  {isCompared ? (
                    <>
                      <Check className="h-4 w-4" aria-hidden="true" />
                      <span>Added to Comparison</span>
                    </>
                  ) : compareLimitReached ? (
                    <span>Comparison Limit Reached (Max 3)</span>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>Add to Compare</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsArViewerOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-sm font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#1D4ED8] dark:hover:border-[#60A5FA] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                >
                  <Box className="h-4 w-4" aria-hidden="true" />
                  <span>Augmented Reality</span>
                </button>

                <button
                  type="button"
                  onClick={handleFindNearbyRetailers}
                  disabled={geoStatus === 'locating'}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-sm font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#1D4ED8] dark:hover:border-[#60A5FA] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] disabled:opacity-60 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                >
                  {geoStatus === 'locating' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>Locating Retailers...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4" aria-hidden="true" />
                      <span>Find Nearby Retailers</span>
                    </>
                  )}
                </button>

                <a
                  href={phone.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-sm font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                >
                  <span>Visit {phone.brand} Official Page</span>
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Specification Table & Interactive Modules */}
          <div className="lg:col-span-7 p-6">
            {/* Nearby Retailers & Simulated Local Inventory Panel */}
            {retailerPanelOpen && (
              <div
                ref={retailersSectionRef}
                aria-live="polite"
                className="pb-6 mb-6 border-b border-[#EAEAE6] dark:border-[#222226]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                      Nearby Retailers
                    </h3>
                    <span className="text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
                      · {activeFinishName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {geoPoint && (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-[#5C5C58] dark:text-[#A1A1AA]">
                        <Navigation className="h-3 w-3" aria-hidden="true" />
                        <span>
                          {geoPoint.sourceLabel} ({geoPoint.lat.toFixed(2)}°, {geoPoint.lng.toFixed(2)}°)
                        </span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setRetailerPanelOpen(false)}
                      className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
                    >
                      Hide
                    </button>
                  </div>
                </div>

                {geoStatus === 'locating' && (
                  <div className="flex items-center gap-3 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] px-4 py-4 text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" aria-hidden="true" />
                    <span>Requesting current location via browser Geolocation API and checking local inventory...</span>
                  </div>
                )}

                {geoStatus === 'error' && (
                  <div className="space-y-3 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] p-4">
                    <p role="alert" className="text-xs text-[#111111] dark:text-[#F4F4F2] leading-relaxed">
                      {geoError}
                    </p>
                    <form onSubmit={handleManualAreaLookup} className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={manualAreaInput}
                        onChange={(e) => setManualAreaInput(e.target.value)}
                        placeholder="Enter city or ZIP (e.g., 94103 or Austin, TX)"
                        aria-label="Enter city or ZIP code for local inventory"
                        className="flex-1 h-9 px-3 bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs text-[#111111] dark:text-[#F4F4F2] placeholder:text-[#8A8A82] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                      />
                      <button
                        type="submit"
                        className="h-9 px-3.5 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                      >
                        Check Area
                      </button>
                      <button
                        type="button"
                        onClick={handleUseDemoLocation}
                        className="h-9 px-3.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                      >
                        Use Sample Metro
                      </button>
                    </form>
                  </div>
                )}

                {geoStatus === 'ready' && nearbyRetailers.length > 0 && (
                  <div className="space-y-2.5">
                    {nearbyRetailers.map((retailer) => {
                      const holdCode = heldRetailerIds[retailer.id];
                      return (
                        <div
                          key={retailer.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] px-4 py-3"
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-xs font-semibold text-[#111111] dark:text-[#F4F4F2]">
                                {retailer.name}
                              </span>
                              <span className="text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                                {retailer.retailerType}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                              <span className="font-mono tabular-nums font-medium text-[#111111] dark:text-[#F4F4F2]">
                                {retailer.distanceMiles} mi
                              </span>
                              <span aria-hidden="true"> · </span>
                              <span>{retailer.address}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{retailer.hours}</span>
                            </p>

                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                              {retailer.stockStatus === 'in-stock' && (
                                <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
                                  <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                                  <span className="font-mono tabular-nums">
                                    In Stock ({retailer.unitsAvailable} units)
                                  </span>
                                </span>
                              )}
                              {retailer.stockStatus === 'low-stock' && (
                                <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                                  <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                                  <span className="font-mono tabular-nums">
                                    Low Stock (1 unit left)
                                  </span>
                                </span>
                              )}
                              {retailer.stockStatus === 'next-day' && (
                                <span className="inline-flex items-center gap-1 font-medium text-[#5C5C58] dark:text-[#A1A1AA]">
                                  <Clock className="h-3 w-3 shrink-0" aria-hidden="true" />
                                  <span>Ship-to-Store</span>
                                </span>
                              )}
                              <span aria-hidden="true" className="text-[#9A9A93]">·</span>
                              <span className="text-[#5C5C58] dark:text-[#A1A1AA]">
                                {retailer.pickupWindow}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-end shrink-0">
                            {holdCode ? (
                              <button
                                type="button"
                                onClick={() => handleToggleRetailerHold(retailer.id)}
                                className="inline-flex h-8 items-center gap-1.5 px-3 rounded-md border border-[#1D4ED8] dark:border-[#60A5FA] bg-white dark:bg-[#161618] text-[11px] font-medium text-[#1D4ED8] dark:text-[#60A5FA] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                              >
                                <Check className="h-3 w-3" aria-hidden="true" />
                                <span className="font-mono tabular-nums">Hold {holdCode}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleRetailerHold(retailer.id)}
                                className="inline-flex h-8 items-center px-3 rounded-md border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-[11px] font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                              >
                                {retailer.stockStatus === 'next-day' ? 'Schedule Pickup' : 'Reserve Hold'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                      Simulated retail availability for {phone.brand} {phone.name} ({activeFinishName}). Switching finish swatches updates store stock in real time.
                    </p>
                  </div>
                )}
              </div>
            )}
            {/* Battery Life Estimate Widget */}
            <div className="pb-6 mb-6 border-b border-[#EAEAE6] dark:border-[#222226]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <BatteryCharging className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                    Battery Life Estimate
                  </h3>
                </div>
                <span className="font-mono text-xs font-medium tabular-nums text-[#111111] dark:text-[#F4F4F2]">
                  {batteryMah.toLocaleString()} mAh · {enduranceTier}
                </span>
              </div>

              <div
                role="progressbar"
                aria-valuenow={endurancePercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Relative battery endurance for ${phone.name}: ${endurancePercent}% of ${MAX_CATALOG_MAH.toLocaleString()} mAh catalog peak`}
                className="h-2.5 w-full rounded-full bg-[#EAEAE6] dark:bg-[#27272A] overflow-hidden"
              >
                <div
                  className="h-full rounded-full bg-[#1D4ED8] dark:bg-[#3B82F6] transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{ width: `${endurancePercent}%` }}
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                <span className="font-mono tabular-nums">
                  ~{estimatedHours} hrs est. mixed active use ({endurancePercent}% of lineup peak)
                </span>
                <span className="font-mono tabular-nums">
                  Peak ref: {MAX_CATALOG_MAH.toLocaleString()} mAh
                </span>
              </div>
            </div>

            {/* 6-Month MSRP Price History Chart */}
            <PriceHistoryChart
              modelName={phone.name}
              priceHistory={phone.priceHistory}
              isDark={isDark}
            />

            {/* Set Price Alert Widget */}
            <div className="pb-6 mb-6 border-b border-[#EAEAE6] dark:border-[#222226]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                    Set Price Alert
                  </h3>
                </div>
                <span className="font-mono text-xs tabular-nums text-[#5C5C58] dark:text-[#A1A1AA]">
                  Current: ${currentPrice.toLocaleString()} · 6M Low: ${sixMonthLow.toLocaleString()}
                </span>
              </div>

              {activePriceAlert && !isEditingAlert ? (
                <div
                  role="status"
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] px-4 py-3"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Check
                      className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#111111] dark:text-[#F4F4F2]">
                        Alert set at{' '}
                        <span className="font-mono tabular-nums">
                          ${activePriceAlert.targetPrice.toLocaleString()}
                        </span>{' '}
                        or below for{' '}
                        <span className="font-mono break-all">{activePriceAlert.email}</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                        {currentPrice <= activePriceAlert.targetPrice ? (
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">
                            Target met — current price (${currentPrice.toLocaleString()}) is at or below your threshold.
                          </span>
                        ) : (
                          <span className="font-mono tabular-nums">
                            Triggers if price drops ${(currentPrice - activePriceAlert.targetPrice).toLocaleString()} from current price.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 shrink-0 self-end sm:self-center">
                    {onTriggerPriceDrop && (
                      <>
                        <button
                          type="button"
                          onClick={handleSimulateDeviceDrop}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
                        >
                          <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Simulate Drop</span>
                        </button>
                        <span className="h-3 w-px bg-[#D4D4CE] dark:bg-[#27272A]" aria-hidden="true" />
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAlertEmail(activePriceAlert.email);
                        setAlertTargetInput(String(activePriceAlert.targetPrice));
                        setAlertError('');
                        setIsEditingAlert(true);
                      }}
                      className="text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
                    >
                      Edit
                    </button>
                    <span className="h-3 w-px bg-[#D4D4CE] dark:bg-[#27272A]" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={handleRemovePriceAlert}
                      className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handlePriceAlertSubmit} noValidate className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-6">
                      <label
                        htmlFor="price-alert-email"
                        className="block text-[11px] font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-1"
                      >
                        Notification email
                      </label>
                      <div className="relative">
                        <Mail
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5C5C58] dark:text-[#A1A1AA]"
                          aria-hidden="true"
                        />
                        <input
                          id="price-alert-email"
                          type="email"
                          value={alertEmail}
                          onChange={(e) => {
                            setAlertEmail(e.target.value);
                            if (alertError) setAlertError('');
                          }}
                          placeholder="you@example.com"
                          aria-invalid={alertError.length > 0}
                          className="w-full h-9 pl-8 pr-3 bg-[#F6F6F4] dark:bg-[#1E1E22] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs text-[#111111] dark:text-[#F4F4F2] placeholder:text-[#8A8A82] dark:placeholder:text-[#71717A] focus:outline-none focus:bg-white dark:focus:bg-[#161618] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3">
                      <label
                        htmlFor="price-alert-target"
                        className="block text-[11px] font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-1"
                      >
                        Target price
                      </label>
                      <div className="relative">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-[#5C5C58] dark:text-[#A1A1AA]"
                        >
                          $
                        </span>
                        <input
                          id="price-alert-target"
                          type="number"
                          min={100}
                          step={10}
                          value={alertTargetInput}
                          onChange={(e) => {
                            setAlertTargetInput(e.target.value);
                            if (alertError) setAlertError('');
                          }}
                          aria-invalid={alertError.length > 0}
                          className="w-full h-9 pl-6 pr-3 bg-[#F6F6F4] dark:bg-[#1E1E22] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg font-mono text-xs tabular-nums text-[#111111] dark:text-[#F4F4F2] focus:outline-none focus:bg-white dark:focus:bg-[#161618] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex items-center gap-2">
                      <button
                        type="submit"
                        className="flex-1 h-9 px-4 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                      >
                        {activePriceAlert ? 'Save Alert' : 'Set Alert'}
                      </button>
                      {isEditingAlert && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingAlert(false);
                            setAlertError('');
                          }}
                          className="h-9 px-3 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>Suggested threshold:</span>
                      <button
                        type="button"
                        onClick={() => setAlertTargetInput(String(sixMonthLow))}
                        className="font-mono tabular-nums text-[#111111] dark:text-[#F4F4F2] underline underline-offset-2 hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] cursor-pointer whitespace-nowrap"
                      >
                        6M low (${sixMonthLow.toLocaleString()})
                      </button>
                      <span aria-hidden="true">·</span>
                      <button
                        type="button"
                        onClick={() => setAlertTargetInput(String(tenPercentTarget))}
                        className="font-mono tabular-nums text-[#111111] dark:text-[#F4F4F2] underline underline-offset-2 hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] cursor-pointer whitespace-nowrap"
                      >
                        10% off (${tenPercentTarget.toLocaleString()})
                      </button>
                    </div>
                    {onTriggerPriceDrop && (
                      <button
                        type="button"
                        onClick={handleSimulateDeviceDrop}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-2 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
                      >
                        <TrendingDown className="h-3 w-3" aria-hidden="true" />
                        <span>Simulate Price Drop</span>
                      </button>
                    )}
                  </div>

                  {alertError && (
                    <p role="alert" className="text-xs text-red-700 dark:text-red-400">
                      {alertError}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Trade-in Estimate Calculator */}
            <div className="pb-6 mb-6 border-b border-[#EAEAE6] dark:border-[#222226]">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                    Trade-in Estimate
                  </h3>
                </div>
                <span className="font-mono text-xs tabular-nums text-[#5C5C58] dark:text-[#A1A1AA]">
                  {phone.brand} · {retentionPercent}% of ${phone.priceUsd.toLocaleString()} MSRP
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div
                    role="radiogroup"
                    aria-label={`Select condition for ${phone.name} trade-in estimate`}
                    className="inline-flex items-center gap-1 p-1 bg-[#EAEAE6] dark:bg-[#1C1C1F] rounded-lg"
                  >
                    {CONDITION_OPTIONS.map((option) => {
                      const isSelected = tradeInCondition === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          role="radio"
                          aria-checked={isSelected}
                          onClick={() => setTradeInCondition(option.id)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                            isSelected
                              ? 'bg-white dark:bg-[#27272A] text-[#111111] dark:text-[#F4F4F2] shadow-xs'
                              : 'text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                    {activeCondition.note} ·{' '}
                    <span className="font-mono tabular-nums">
                      Est. net upgrade ${netUpgradePrice.toLocaleString()}
                    </span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="sm:text-right">
                    <span className="block text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                      Estimated Credit
                    </span>
                    <span className="font-mono text-xl font-semibold tabular-nums text-[#111111] dark:text-[#F4F4F2]">
                      ${estimatedTradeIn.toLocaleString()}
                    </span>
                  </div>

                  <a
                    href={tradeInQuoteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 px-4 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                  >
                    <span>Get Quote</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2] mb-4">
              Technical Specifications
            </h3>
            <dl className="divide-y divide-[#EAEAE6] dark:divide-[#222226]">
              {specRows.map((row) => {
                if (row.label !== 'Display') {
                  return (
                    <div key={row.label} className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                      <dt className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA]">{row.label}</dt>
                      <dd className="sm:col-span-2 text-xs font-mono tabular-nums text-[#111111] dark:text-[#F4F4F2] leading-relaxed">
                        {row.value}
                      </dd>
                    </div>
                  );
                }

                const displaySegments = tokenizeDisplaySpec(row.value);
                const lowerDisplay = row.value.toLowerCase();
                const hasLtpo = lowerDisplay.includes('ltpo');
                const hasOled = lowerDisplay.includes('oled');
                const hasVrr =
                  lowerDisplay.includes('1–120hz') ||
                  lowerDisplay.includes('0.1–120hz') ||
                  lowerDisplay.includes('60–120hz') ||
                  lowerDisplay.includes('promotion');

                const computeTooltipCoords = (target: HTMLElement) => {
                  const rect = target.getBoundingClientRect();
                  const tooltipWidth = Math.min(312, window.innerWidth - 32);
                  const placeAbove = rect.bottom + 220 > window.innerHeight;
                  const left = Math.min(window.innerWidth - tooltipWidth - 16, Math.max(16, rect.left));
                  const top = placeAbove ? rect.top - 8 : rect.bottom + 8;
                  return { top, left, placeAbove };
                };

                const openTooltip = (
                  target: HTMLElement,
                  triggerId: string,
                  key: DisplayGlossaryKey,
                  pinned: boolean,
                  matchedPhrase?: string
                ) => {
                  const coords = computeTooltipCoords(target);
                  setActiveDisplayTooltip({
                    triggerId,
                    key,
                    matchedPhrase,
                    pinned,
                    ...coords,
                  });
                };

                const guideTerms: Array<{
                  id: string;
                  label: string;
                  key: DisplayGlossaryKey;
                  included: boolean;
                }> = [
                  { id: 'guide-ltpo', label: 'LTPO', key: 'ltpo', included: hasLtpo },
                  { id: 'guide-oled', label: 'OLED', key: 'oled', included: hasOled },
                  { id: 'guide-vrr', label: 'Variable Refresh Rate', key: 'vrr', included: hasVrr },
                  {
                    id: 'guide-nits',
                    label: 'Peak Brightness',
                    key: 'nits',
                    included: lowerDisplay.includes('nits'),
                  },
                ];

                const isOverviewOpen = activeDisplayTooltip?.triggerId === 'display-overview';

                return (
                  <div key={row.label} className="py-3 grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4">
                    <dt className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA]">
                      <div className="inline-flex items-center gap-1.5">
                        <span>{row.label}</span>
                        <button
                          type="button"
                          aria-expanded={isOverviewOpen}
                          aria-controls={isOverviewOpen ? 'display-spec-tooltip' : undefined}
                          aria-label="Explain Display hardware terms"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isOverviewOpen && activeDisplayTooltip?.pinned) {
                              setActiveDisplayTooltip(null);
                            } else {
                              openTooltip(e.currentTarget, 'display-overview', 'overview', true);
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (!activeDisplayTooltip?.pinned) {
                              openTooltip(e.currentTarget, 'display-overview', 'overview', false);
                            }
                          }}
                          onMouseLeave={() => {
                            setActiveDisplayTooltip((prev) =>
                              prev && prev.triggerId === 'display-overview' && !prev.pinned ? null : prev
                            );
                          }}
                          onFocus={(e) => {
                            if (!activeDisplayTooltip?.pinned) {
                              openTooltip(e.currentTarget, 'display-overview', 'overview', false);
                            }
                          }}
                          onBlur={() => {
                            setActiveDisplayTooltip((prev) =>
                              prev && prev.triggerId === 'display-overview' && !prev.pinned ? null : prev
                            );
                          }}
                          className={`inline-flex h-5 w-5 items-center justify-center rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                            isOverviewOpen
                              ? 'text-[#1D4ED8] dark:text-[#60A5FA] bg-[#EAEAE6] dark:bg-[#27272A]'
                              : 'text-[#8A8A82] dark:text-[#71717A] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                          }`}
                        >
                          <Info className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </dt>
                    <dd className="sm:col-span-2 text-xs font-mono tabular-nums text-[#111111] dark:text-[#F4F4F2] leading-relaxed">
                      <div>
                        {displaySegments.map((segment, index) => {
                          if (!segment.glossaryKey) {
                            return <React.Fragment key={`${index}-text`}>{segment.text}</React.Fragment>;
                          }
                          const triggerId = `inline-${index}-${segment.glossaryKey}`;
                          const isOpen = activeDisplayTooltip?.triggerId === triggerId;
                          const glossaryKey = segment.glossaryKey;

                          return (
                            <button
                              key={triggerId}
                              type="button"
                              aria-expanded={isOpen}
                              aria-controls={isOpen ? 'display-spec-tooltip' : undefined}
                              aria-label={`Explain ${segment.text}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isOpen && activeDisplayTooltip?.pinned) {
                                  setActiveDisplayTooltip(null);
                                } else {
                                  openTooltip(e.currentTarget, triggerId, glossaryKey, true, segment.text);
                                }
                              }}
                              onMouseEnter={(e) => {
                                if (!activeDisplayTooltip?.pinned) {
                                  openTooltip(e.currentTarget, triggerId, glossaryKey, false, segment.text);
                                }
                              }}
                              onMouseLeave={() => {
                                setActiveDisplayTooltip((prev) =>
                                  prev && prev.triggerId === triggerId && !prev.pinned ? null : prev
                                );
                              }}
                              onFocus={(e) => {
                                if (!activeDisplayTooltip?.pinned) {
                                  openTooltip(e.currentTarget, triggerId, glossaryKey, false, segment.text);
                                }
                              }}
                              onBlur={() => {
                                setActiveDisplayTooltip((prev) =>
                                  prev && prev.triggerId === triggerId && !prev.pinned ? null : prev
                                );
                              }}
                              className={`inline text-left font-mono underline decoration-dotted underline-offset-4 transition-colors cursor-pointer rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                                isOpen
                                  ? 'text-[#1D4ED8] dark:text-[#60A5FA] decoration-[#1D4ED8] dark:decoration-[#60A5FA]'
                                  : 'decoration-[#1D4ED8]/60 dark:decoration-[#60A5FA]/60 hover:text-[#1D4ED8] dark:hover:text-[#60A5FA]'
                              }`}
                            >
                              {segment.text}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-sans text-[11px] text-[#5C5C58] dark:text-[#A1A1AA]">
                        <span>Term guide:</span>
                        {guideTerms.map((term, idx) => {
                          const isOpen = activeDisplayTooltip?.triggerId === term.id;
                          return (
                            <React.Fragment key={term.id}>
                              {idx > 0 && <span aria-hidden="true">·</span>}
                              <button
                                type="button"
                                aria-expanded={isOpen}
                                aria-controls={isOpen ? 'display-spec-tooltip' : undefined}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isOpen && activeDisplayTooltip?.pinned) {
                                    setActiveDisplayTooltip(null);
                                  } else {
                                    openTooltip(
                                      e.currentTarget,
                                      term.id,
                                      term.key,
                                      true,
                                      term.included ? undefined : 'Not equipped on this model'
                                    );
                                  }
                                }}
                                onMouseEnter={(e) => {
                                  if (!activeDisplayTooltip?.pinned) {
                                    openTooltip(
                                      e.currentTarget,
                                      term.id,
                                      term.key,
                                      false,
                                      term.included ? undefined : 'Not equipped on this model'
                                    );
                                  }
                                }}
                                onMouseLeave={() => {
                                  setActiveDisplayTooltip((prev) =>
                                    prev && prev.triggerId === term.id && !prev.pinned ? null : prev
                                  );
                                }}
                                onFocus={(e) => {
                                  if (!activeDisplayTooltip?.pinned) {
                                    openTooltip(
                                      e.currentTarget,
                                      term.id,
                                      term.key,
                                      false,
                                      term.included ? undefined : 'Not equipped on this model'
                                    );
                                  }
                                }}
                                onBlur={() => {
                                  setActiveDisplayTooltip((prev) =>
                                    prev && prev.triggerId === term.id && !prev.pinned ? null : prev
                                  );
                                }}
                                className={`underline decoration-dotted underline-offset-3 transition-colors cursor-pointer rounded-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                                  isOpen
                                    ? 'text-[#1D4ED8] dark:text-[#60A5FA] font-medium'
                                    : 'text-[#111111] dark:text-[#D4D4D8] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA]'
                                }`}
                              >
                                {term.label}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
        )}
      </div>

      {activeDisplayTooltip && (() => {
        const entry = DISPLAY_GLOSSARY[activeDisplayTooltip.key];
        const statusNote =
          activeDisplayTooltip.matchedPhrase === 'Not equipped on this model'
            ? `Not equipped on ${phone.name}`
            : activeDisplayTooltip.matchedPhrase
              ? `On this phone: ${activeDisplayTooltip.matchedPhrase}`
              : null;

        return (
          <div
            id="display-spec-tooltip"
            role="tooltip"
            onClick={(e) => e.stopPropagation()}
            style={{
              top: `${activeDisplayTooltip.top}px`,
              left: `${activeDisplayTooltip.left}px`,
            }}
            className={`fixed z-[70] w-[312px] max-w-[calc(100vw-32px)] rounded-xl border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] p-3.5 shadow-xl text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA] ${
              activeDisplayTooltip.placeAbove ? '-translate-y-full' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold text-[#111111] dark:text-[#F4F4F2]">
                {entry.title}
              </p>
              {activeDisplayTooltip.pinned && (
                <button
                  type="button"
                  onClick={() => setActiveDisplayTooltip(null)}
                  aria-label="Close display term tooltip"
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-[#5C5C58] dark:text-[#A1A1AA] hover:bg-[#F6F6F4] dark:hover:bg-[#222226] hover:text-[#111111] dark:hover:text-[#F4F4F2] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
            {statusNote && (
              <p className="mt-1 font-mono text-[11px] text-[#1D4ED8] dark:text-[#60A5FA]">
                {statusNote}
              </p>
            )}
            <p className="mt-1.5">{entry.plainSummary}</p>
            <p className="mt-2 pt-2 border-t border-[#EAEAE6] dark:border-[#222226] text-[11px] text-[#111111] dark:text-[#E4E4E7]">
              <span className="font-medium text-[#5C5C58] dark:text-[#A1A1AA]">Why it matters: </span>
              {entry.everydayImpact}
            </p>
          </div>
        );
      })()}
    </div>
  );
};
