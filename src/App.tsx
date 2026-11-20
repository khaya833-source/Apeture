import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown, ArrowUpRight, X, Check, Mail, Instagram, Twitter, Youtube, ChevronDown, RotateCcw, Info, Sun, Moon, History, QrCode, Megaphone, BellRing, Heart, Store, ShoppingBag, BookOpen, Tag } from 'lucide-react';
import { PHONE_MODELS, PhoneCategory, PhoneModel } from './data/phones';
import { PhoneImageGrid } from './components/PhoneImageGrid';
import { PhoneDetailModal } from './components/PhoneDetailModal';
import { CompareDrawer } from './components/CompareDrawer';
import { QrCompareModal } from './components/QrCompareModal';
import { AdvertBuilderModal } from './components/AdvertBuilderModal';
import { PriceDropToastContainer, PriceDropToastItem } from './components/PriceDropToastContainer';
import { PWAInstallButton, OfflineIndicator } from './components/PWAInstallControl';
import { ImagePreloader } from './components/ImagePreloader';
import {
  PriceAlertRecord,
  PRICE_ALERTS_EVENT,
  loadFavoritePhoneIds,
  loadPriceAlerts,
  persistFavoritePhoneIds,
} from './utils/priceAlerts';

type FilterOption = 'all' | 'trending' | PhoneCategory | 'battery-life';
type SortOption = 'featured' | 'battery-desc' | 'price-asc' | 'price-desc';

const LONG_BATTERY_THRESHOLD_MAH = 5000;
const TRENDING_CURATED_LIMIT = 6;
const CLICK_COUNTS_STORAGE_KEY = 'aperture-phone-clicks';

const parseBatteryCapacityMah = (phone: PhoneModel): number => {
  const match = phone.fullSpecs.batteryDetail.replace(/,/g, '').match(/(\d{4,5})\s*mAh/i);
  return match ? Number.parseInt(match[1], 10) : 0;
};

const loadPhoneClickCounts = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CLICK_COUNTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return {};
    const validIds = new Set(PHONE_MODELS.map((phone) => phone.id));
    const result: Record<string, number> = {};
    Object.entries(parsed).forEach(([id, count]) => {
      if (validIds.has(id) && typeof count === 'number' && Number.isFinite(count) && count > 0) {
        result[id] = Math.floor(count);
      }
    });
    return result;
  } catch {
    return {};
  }
};

const RECENTLY_VIEWED_STORAGE_KEY = 'aperture-recently-viewed';
const MAX_RECENTLY_VIEWED = 5;

const loadRecentPhoneIds = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const validIds = new Set(PHONE_MODELS.map((phone) => phone.id));
    return parsed
      .filter((id): id is string => typeof id === 'string' && validIds.has(id))
      .slice(0, MAX_RECENTLY_VIEWED);
  } catch {
    return [];
  }
};

const FILTER_OPTIONS: Array<{ id: FilterOption; label: string }> = [
  { id: 'all', label: 'All Models' },
  { id: 'trending', label: 'Trending' },
  { id: 'flagship', label: 'Flagships' },
  { id: 'camera-pro', label: 'Camera Pro' },
  { id: 'foldable', label: 'Foldables' },
  { id: 'battery-life', label: 'Battery Life' },
];

const FAQ_ITEMS: Array<{ id: string; topic: string; question: string; answer: string }> = [
  {
    id: 'specs-verification',
    topic: 'Hardware Specifications',
    question: 'How are displayed hardware specifications and base prices sourced?',
    answer:
      'All display metrics, chipset architectures, camera focal arrays, battery capacities, and starting MSRP figures reflect manufacturer-published base retail configurations. Selecting any model opens its complete specification sheet, and up to three devices can be evaluated side by side in the comparison matrix.',
  },
  {
    id: 'regional-availability',
    topic: 'Regional Availability',
    question: 'Do cellular bands, charging speeds, and chipsets vary by region?',
    answer:
      'Yes. Certain models ship with region-specific 5G mmWave or sub-6 GHz modem bands, dual-SIM or eSIM-only trays, and slightly different wired charging wattages depending on local electrical standards. Always verify exact SKU band compatibility via the official manufacturer page linked on each card.',
  },
  {
    id: 'studio-photography',
    topic: 'Studio Photography',
    question: 'What photography and aspect-ratio standards are used across the image grid?',
    answer:
      'Every product frame is rendered in a uniform 4:3 studio composition against neutral stone surfaces with diffused directional lighting to preserve accurate material finishes—such as brushed Grade 5 titanium, matte glass, and textured vegan leather—without exaggerated lens distortion.',
  },
  {
    id: 'memory-storage',
    topic: 'Storage & Memory',
    question: 'Why do storage tiers and RAM configurations differ across listings?',
    answer:
      'Flagship manufacturers frequently pair higher-capacity UFS 4.0/4.1 or NVMe storage tiers with expanded LPDDR5X memory configurations. The hover overlay summarizes the full available storage range, while the specification modal details exact memory pairing and dimensions.',
  },
];

const HARDWARE_TIPS: Array<{
  category: string;
  subtitle: string;
  tips: Array<{ index: string; title: string; detail: string }>;
}> = [
  {
    category: 'Mobile Photography',
    subtitle: 'Optics, Exposure & Sensor Capture',
    tips: [
      {
        index: '01.',
        title: 'Shoot at Native Optical Focal Lengths',
        detail:
          'Use dedicated 1x, 3x, or 5x optical lens stops rather than intermediate digital zoom crops to retain full sensor sharpness and clean edge contrast.',
      },
      {
        index: '02.',
        title: 'Lock AE/AF & Protect Highlights',
        detail:
          'Press and hold on your subject to lock focus and exposure, then dial exposure down slightly (-0.3 EV) in bright daylight to prevent blown-out skies.',
      },
      {
        index: '03.',
        title: 'Enable RAW for High-Contrast Scenes',
        detail:
          'Switch to ProRAW or DNG capture in demanding indoor or backlit lighting to preserve highlight roll-off and clean shadow recovery.',
      },
    ],
  },
  {
    category: 'Battery Health',
    subtitle: 'Charge Cycles & Thermal Care',
    tips: [
      {
        index: '01.',
        title: 'Use an 80%–85% Daily Charge Limit',
        detail:
          'Enabling built-in charge optimization caps overnight top-ups and lowers high-voltage stress on lithium-ion and silicon-carbon cells.',
      },
      {
        index: '02.',
        title: 'Minimize Heat During Fast Charging',
        detail:
          'Avoid running heavy 3D games or 4K video exports while plugged into 45W–100W fast chargers; lower operating temperatures slow chemical aging.',
      },
      {
        index: '03.',
        title: 'Store Spare Devices Around 50%',
        detail:
          'If a phone will remain powered off for weeks, leave the battery near 50% rather than fully depleted or topped up to 100%.',
      },
    ],
  },
  {
    category: 'Buying & Value',
    subtitle: 'MSRP Timing & Seasonal Dips',
    tips: [
      {
        index: '01.',
        title: 'Check the 6-Month Low Before Buying',
        detail:
          'Open any phone detail modal to review its 6-month MSRP chart and spot recurring seasonal markdowns before ordering.',
      },
      {
        index: '02.',
        title: 'Sort Low to High to Weigh Upgrades',
        detail:
          'Use Price: Low to High alongside the Comparison Matrix to check whether telephoto or battery upgrades justify a higher price tier.',
      },
      {
        index: '03.',
        title: 'Watch Late-Summer & Autumn Drops',
        detail:
          'Current-generation flagships and foldables commonly see $100–$200 official retail discounts ahead of annual successor launches.',
      },
    ],
  },
];

const DEVICE_CHOICE_GUIDE: Array<{
  index: string;
  title: string;
  summary: string;
  filter: FilterOption;
  sort?: SortOption;
  actionLabel: string;
}> = [
  {
    index: '01.',
    title: 'Prioritize Camera Optics & Optical Zoom Reach',
    summary:
      'Choose phones with large main sensors, dedicated 3x–5x periscope telephoto glass, and ProRAW or Log capture instead of relying on headline megapixel marketing.',
    filter: 'camera-pro',
    sort: 'featured',
    actionLabel: 'Filter Camera Pro',
  },
  {
    index: '02.',
    title: 'Look for 5,000 mAh+ Cells for Multi-Day Endurance',
    summary:
      'High-density 5,000–6,000 mAh batteries paired with LTPO 1–120Hz panels deliver reliable two-day runtime without carrying a power bank.',
    filter: 'battery-life',
    sort: 'battery-desc',
    actionLabel: 'Filter Battery Life',
  },
  {
    index: '03.',
    title: 'Buy Foldables Only for Split-Screen Workflows',
    summary:
      'Book-style and flip foldables maximize portable screen space, whereas standard glass-and-titanium flagships cost hundreds less with higher dust protection.',
    filter: 'foldable',
    sort: 'featured',
    actionLabel: 'Filter Foldables',
  },
  {
    index: '04.',
    title: 'Compare Base Flagships Sorted Low to High',
    summary:
      'Aim for 256GB UFS 4.0 or NVMe storage and 7-year software support—sorting base models from lowest MSRP reveals strong everyday value.',
    filter: 'flagship',
    sort: 'price-asc',
    actionLabel: 'Sort Flagships Low–High',
  },
];

const CHEAP_BUYING_PLAYBOOK: Array<{
  index: string;
  title: string;
  detail: string;
}> = [
  {
    index: '01.',
    title: 'Benchmark Against the 6-Month MSRP Low',
    detail:
      'Open any device specification modal to review its 6-month price chart before buying so you never overpay during peak launch pricing.',
  },
  {
    index: '02.',
    title: 'Turn On Favorites & Email Price Alerts',
    detail:
      'Favorite shortlisted phones and enter your email alert target—you will get notified immediately when prices drop below threshold.',
  },
  {
    index: '03.',
    title: 'Stack Official Trade-In Credit & Unlocked Offers',
    detail:
      'Check your trade-in condition value first, then buy unlocked directly from an official brand store to avoid locked carrier installment fees.',
  },
  {
    index: '04.',
    title: 'Shop Clothes & Everyday Accessories on SHEIN',
    detail:
      'Save phone budgets for verified official hardware stores, and use SHEIN when shopping for outfits, bags, phone cases, and affordable lifestyle items.',
  },
];

const OFFICIAL_BRAND_STORES: Array<{
  brand: string;
  note: string;
  url: string;
}> = [
  { brand: 'Apple Official Store', note: 'iPhone 16 Pro Max · iPhone 16', url: 'https://www.apple.com/iphone/' },
  { brand: 'Samsung Official Store', note: 'Galaxy S25 Ultra · Z Fold6 · Z Flip6', url: 'https://www.samsung.com/global/galaxy/' },
  { brand: 'Google Store', note: 'Pixel 9 Pro XL · Pixel 9', url: 'https://store.google.com/category/phones' },
  { brand: 'OnePlus Store', note: 'OnePlus 13 · Unlocked Deals', url: 'https://www.oneplus.com/oneplus-13' },
  { brand: 'Xiaomi Global', note: 'Xiaomi 15 Ultra · Leica Optics', url: 'https://www.mi.com/global/product/xiaomi-15-ultra/' },
  { brand: 'vivo & Motorola', note: 'X200 Pro · Razr 50 Ultra', url: 'https://www.motorola.com/us/smartphones-razr-plus-gen-2/p' },
];

export default function App() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('q') ?? '';
  });
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [selectedPhone, setSelectedPhone] = useState<PhoneModel | null>(() => {
    if (typeof window === 'undefined') return null;
    const phoneParam = new URLSearchParams(window.location.search).get('phone');
    if (!phoneParam) return null;
    return PHONE_MODELS.find((phone) => phone.id === phoneParam) ?? null;
  });
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isAdvertBuilderOpen, setIsAdvertBuilderOpen] = useState(false);
  const [advertHeroError, setAdvertHeroError] = useState(false);
  const [showSponsorBanner, setShowSponsorBanner] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'error' | 'subscribed'>('idle');
  const [newsletterError, setNewsletterError] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);
  const [showSortInfo, setShowSortInfo] = useState(false);
  const [galleryScrollProgress, setGalleryScrollProgress] = useState(0);
  const [recentPhoneIds, setRecentPhoneIds] = useState<string[]>(loadRecentPhoneIds);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>(loadPhoneClickCounts);
  const validPhoneIds = useMemo(() => new Set(PHONE_MODELS.map((phone) => phone.id)), []);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoritePhoneIds(validPhoneIds));
  const [priceAlerts, setPriceAlerts] = useState<Record<string, PriceAlertRecord>>(loadPriceAlerts);
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({});
  const [toasts, setToasts] = useState<PriceDropToastItem[]>([]);
  const notifiedDropKeysRef = useRef<Set<string>>(new Set());
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = window.localStorage.getItem('aperture-theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      window.localStorage.setItem('aperture-theme', isDark ? 'dark' : 'light');
    } catch {
      // Storage unavailable
    }
  }, [isDark]);

  useEffect(() => {
    const syncAlerts = () => setPriceAlerts(loadPriceAlerts());
    window.addEventListener(PRICE_ALERTS_EVENT, syncAlerts);
    window.addEventListener('storage', syncAlerts);
    return () => {
      window.removeEventListener(PRICE_ALERTS_EVENT, syncAlerts);
      window.removeEventListener('storage', syncAlerts);
    };
  }, []);

  const filteredPhones = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const baseList =
      activeFilter === 'trending'
        ? [...PHONE_MODELS]
            .sort((a, b) => (clickCounts[b.id] ?? 0) - (clickCounts[a.id] ?? 0))
            .slice(0, TRENDING_CURATED_LIMIT)
        : PHONE_MODELS.filter((phone) => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'battery-life') {
              return parseBatteryCapacityMah(phone) >= LONG_BATTERY_THRESHOLD_MAH;
            }
            return phone.category === activeFilter;
          });

    const list = baseList.filter((phone) => {
      if (query === '') return true;
      return (
        phone.name.toLowerCase().includes(query) ||
        phone.brand.toLowerCase().includes(query) ||
        phone.quickSpecs.chipset.toLowerCase().includes(query) ||
        phone.finish.toLowerCase().includes(query)
      );
    });

    if (sortBy === 'battery-desc' || (activeFilter === 'battery-life' && sortBy === 'featured')) {
      return [...list].sort((a, b) => parseBatteryCapacityMah(b) - parseBatteryCapacityMah(a));
    }
    if (sortBy === 'price-asc') {
      return [...list].sort(
        (a, b) => (priceOverrides[a.id] ?? a.priceUsd) - (priceOverrides[b.id] ?? b.priceUsd)
      );
    }
    if (sortBy === 'price-desc') {
      return [...list].sort(
        (a, b) => (priceOverrides[b.id] ?? b.priceUsd) - (priceOverrides[a.id] ?? a.priceUsd)
      );
    }
    return list;
  }, [activeFilter, searchQuery, sortBy, priceOverrides, clickCounts]);

  const comparePhones = useMemo(
    () => PHONE_MODELS.filter((p) => compareIds.includes(p.id)),
    [compareIds]
  );

  const recentPhones = useMemo(
    () =>
      recentPhoneIds
        .map((id) => PHONE_MODELS.find((phone) => phone.id === id))
        .filter((phone): phone is PhoneModel => Boolean(phone)),
    [recentPhoneIds]
  );

  const studioImageUrls = useMemo(
    () => [
      '/src/assets/images/advert_flagship_hero_1795211044280.jpg',
      ...PHONE_MODELS.flatMap((phone) => [
        phone.imageUrl,
        ...phone.colorways.map((colorway) => colorway.imageUrl).filter((url): url is string => Boolean(url)),
      ]),
    ],
    []
  );

  useEffect(() => {
    let rafId = 0;

    const updateProgress = () => {
      rafId = 0;
      const galleryEl = galleryRef.current;
      if (!galleryEl || filteredPhones.length === 0) {
        setGalleryScrollProgress(0);
        return;
      }

      const rect = galleryEl.getBoundingClientRect();
      const scrollY = window.scrollY;
      const viewportH = window.innerHeight;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewportH);
      const headerOffset = 64;

      const galleryTop = rect.top + scrollY;
      const galleryBottom = rect.bottom + scrollY;
      const startY = Math.min(maxScroll, Math.max(0, galleryTop - headerOffset - 40));
      const endOffset = Math.min(viewportH * 0.4, rect.height * 0.35);
      const endY = Math.min(maxScroll, Math.max(startY + 1, galleryBottom - endOffset));

      const rawProgress = (scrollY - startY) / Math.max(1, endY - startY);
      const clamped = Math.max(0, Math.min(1, rawProgress));
      setGalleryScrollProgress(clamped);
    };

    const scheduleUpdate = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(updateProgress);
    };

    updateProgress();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [filteredPhones.length, showSponsorBanner]);

  const resolveNotificationEmail = useCallback(
    (phoneId: string): string | null => {
      const directEmail = priceAlerts[phoneId]?.email?.trim();
      if (directEmail) return directEmail;
      const anySavedEmail = Object.values(priceAlerts)
        .find((entry) => entry.email.trim().length > 0)
        ?.email.trim();
      if (anySavedEmail) return anySavedEmail;
      if (newsletterStatus === 'subscribed' && newsletterEmail.trim().length > 0) {
        return newsletterEmail.trim();
      }
      return null;
    },
    [priceAlerts, newsletterStatus, newsletterEmail]
  );

  const pushPriceDropToast = useCallback(
    (
      phone: PhoneModel,
      previousPriceUsd: number,
      newPriceUsd: number,
      reasonLabel: string,
      force = false
    ) => {
      const dedupeKey = `${phone.id}:${newPriceUsd}`;
      if (!force && notifiedDropKeysRef.current.has(dedupeKey)) {
        return;
      }
      notifiedDropKeysRef.current.add(dedupeKey);
      const notifiedEmail = resolveNotificationEmail(phone.id);

      setToasts((prev) => {
        const filtered = prev.filter((item) => item.phone.id !== phone.id);
        return [
          ...filtered,
          {
            id: `${phone.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            phone,
            previousPriceUsd,
            newPriceUsd,
            reasonLabel,
            notifiedEmail,
            createdAt: Date.now(),
          },
        ].slice(-4);
      });
    },
    [resolveNotificationEmail]
  );

  const handleDismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== toastId));
  }, []);

  const handleToggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const isRemoving = prev.includes(id);
      const next = isRemoving ? prev.filter((item) => item !== id) : [id, ...prev];
      persistFavoritePhoneIds(next);

      if (!isRemoving) {
        const phone = PHONE_MODELS.find((item) => item.id === id);
        const override = priceOverrides[id];
        if (phone && override !== undefined && override < phone.priceUsd) {
          pushPriceDropToast(phone, phone.priceUsd, override, 'Favorited');
        }
      }
      return next;
    });
  };

  const handleTriggerPriceDrop = (phoneId: string, newPriceUsd: number, reasonLabel?: string) => {
    const phone = PHONE_MODELS.find((item) => item.id === phoneId);
    if (!phone) return;
    const clampedNewPrice = Math.max(100, Math.min(phone.priceUsd - 10, Math.round(newPriceUsd)));
    setPriceOverrides((prev) => ({
      ...prev,
      [phoneId]: clampedNewPrice,
    }));
    const resolvedReason =
      reasonLabel ??
      (priceAlerts[phoneId]
        ? 'Email Alert Match'
        : favoriteIds.includes(phoneId)
          ? 'Favorited'
          : recentPhoneIds.includes(phoneId)
            ? 'Recently Viewed'
            : 'Price Drop');
    pushPriceDropToast(phone, phone.priceUsd, clampedNewPrice, resolvedReason, true);
  };

  const handleCheckWatchedPriceDrops = () => {
    const watchedIds = Array.from(
      new Set([...favoriteIds, ...recentPhoneIds, ...Object.keys(priceAlerts)])
    );
    const targetIds =
      watchedIds.length > 0
        ? watchedIds
        : [filteredPhones[0]?.id ?? PHONE_MODELS[0].id];

    const primaryId =
      targetIds.find((id) => priceOverrides[id] === undefined) ?? targetIds[0];
    const primaryPhone = PHONE_MODELS.find((item) => item.id === primaryId);
    if (!primaryPhone) return;

    const currentEffective = priceOverrides[primaryPhone.id] ?? primaryPhone.priceUsd;
    const sixMonthLow = Math.min(...primaryPhone.priceHistory.map((point) => point.priceUsd));
    const savedAlert = priceAlerts[primaryPhone.id];

    let nextDropPrice =
      sixMonthLow < currentEffective
        ? sixMonthLow
        : Math.max(100, Math.round((currentEffective * 0.9) / 10) * 10);
    if (savedAlert && savedAlert.targetPrice < nextDropPrice) {
      nextDropPrice = savedAlert.targetPrice;
    }
    if (nextDropPrice >= currentEffective) {
      nextDropPrice = Math.max(100, currentEffective - 80);
    }

    const reasonLabel = favoriteIds.includes(primaryPhone.id)
      ? 'Favorited'
      : recentPhoneIds.includes(primaryPhone.id)
        ? 'Recently Viewed'
        : savedAlert
          ? 'Email Alert Match'
          : 'Featured Watch';

    setPriceOverrides((prev) => ({
      ...prev,
      [primaryPhone.id]: nextDropPrice,
    }));
    pushPriceDropToast(primaryPhone, primaryPhone.priceUsd, nextDropPrice, reasonLabel, true);
  };

  useEffect(() => {
    const watchedSet = new Set([
      ...favoriteIds,
      ...recentPhoneIds,
      ...Object.keys(priceAlerts),
    ]);

    watchedSet.forEach((phoneId) => {
      const phone = PHONE_MODELS.find((item) => item.id === phoneId);
      if (!phone) return;
      const effectivePrice = priceOverrides[phoneId] ?? phone.priceUsd;
      if (effectivePrice >= phone.priceUsd) return;

      const alert = priceAlerts[phoneId];
      if (alert && effectivePrice <= alert.targetPrice) {
        pushPriceDropToast(phone, phone.priceUsd, effectivePrice, 'Email Alert Match');
      } else if (favoriteIds.includes(phoneId)) {
        pushPriceDropToast(phone, phone.priceUsd, effectivePrice, 'Favorited');
      } else if (recentPhoneIds.includes(phoneId)) {
        pushPriceDropToast(phone, phone.priceUsd, effectivePrice, 'Recently Viewed');
      }
    });
  }, [favoriteIds, recentPhoneIds, priceAlerts, priceOverrides, pushPriceDropToast]);

  const handleToggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleAddToCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id) || prev.length >= 3) {
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleSelectPhone = (phone: PhoneModel) => {
    setSelectedPhone(phone);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('phone', phone.id);
      window.history.replaceState(null, '', url.toString());
    } catch {
      // History API unavailable
    }
    setClickCounts((prev) => {
      const next = {
        ...prev,
        [phone.id]: (prev[phone.id] ?? 0) + 1,
      };
      try {
        window.localStorage.setItem(CLICK_COUNTS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable
      }
      return next;
    });
    setRecentPhoneIds((prev) => {
      const next = [phone.id, ...prev.filter((id) => id !== phone.id)].slice(
        0,
        MAX_RECENTLY_VIEWED
      );
      try {
        window.localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Storage unavailable
      }
      return next;
    });
  };

  const handleClosePhoneModal = () => {
    setSelectedPhone(null);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('phone')) {
        url.searchParams.delete('phone');
        window.history.replaceState(null, '', url.toString());
      }
    } catch {
      // History API unavailable
    }
  };

  const handleClearRecent = () => {
    setRecentPhoneIds([]);
    try {
      window.localStorage.removeItem(RECENTLY_VIEWED_STORAGE_KEY);
    } catch {
      // Storage unavailable
    }
  };

  const handleNavFilter = (filter: FilterOption) => {
    setActiveFilter(filter);
    const gridEl = document.getElementById('phone-gallery');
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleApplyGuideFilter = (filter: FilterOption, nextSort: SortOption = 'featured') => {
    setActiveFilter(filter);
    setSortBy(nextSort);
    const gridEl = document.getElementById('phone-gallery');
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isFiltered = activeFilter !== 'all' || searchQuery.trim() !== '' || sortBy !== 'featured';

  const handleResetFilters = () => {
    setActiveFilter('all');
    setSearchQuery('');
    setSortBy('featured');
  };

  const handleNewsletterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isValidEmail) {
      setNewsletterStatus('error');
      setNewsletterError('Enter a valid email address.');
      return;
    }
    setNewsletterError('');
    setNewsletterStatus('subscribed');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F4] dark:bg-[#0D0D0E] text-[#111111] dark:text-[#F4F4F2]">
      {/* Slim Top-Window Phone Gallery Scroll Depth Bar */}
      <div
        role="progressbar"
        aria-label="Phone gallery scroll depth"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(galleryScrollProgress * 100)}
        className="pointer-events-none fixed top-0 inset-x-0 z-[45] h-[3px] bg-[#D4D4CE]/40 dark:bg-[#27272A]/60"
      >
        <div
          className="h-full w-full origin-left bg-[#1D4ED8] dark:bg-[#3B82F6] transition-transform duration-100 ease-out motion-reduce:transition-none"
          style={{ transform: `scaleX(${galleryScrollProgress})` }}
        />
      </div>

      <ImagePreloader urls={studioImageUrls} />
      {/* Slim Dismissible Sponsored Partner Banner */}
      {showSponsorBanner && (
        <aside
          aria-label="Sponsored partner promotion"
          className="bg-[#111111] dark:bg-[#18181B] text-white border-b border-neutral-800"
        >
          <div className="max-w-[1200px] mx-auto px-6 min-h-10 py-1.5 flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-neutral-300 whitespace-nowrap shrink-0">
                Sponsored Partner
              </span>
              <span aria-hidden="true" className="text-neutral-500">
                ·
              </span>
              <span className="text-neutral-100 truncate">
                Looking for clothes or lifestyle items? Shop SHEIN · Compare phones &amp; visit official stores below
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="#buying-guide"
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-neutral-300 hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
              >
                <span>Free Guide</span>
              </a>
              <a
                href="https://za.shein.com/"
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1 rounded bg-white text-[#111111] font-medium hover:bg-[#EAEAE6] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <span>Visit SHEIN</span>
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
              <button
                type="button"
                onClick={() => setShowSponsorBanner(false)}
                aria-label="Dismiss sponsored banner"
                className="inline-flex h-7 w-7 items-center justify-center rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#F6F6F4]/95 dark:bg-[#0D0D0E]/95 backdrop-blur-xs border-b border-[#D4D4CE] dark:border-[#27272A]">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element brand wordmark */}
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-[#111111] dark:text-[#F4F4F2] whitespace-nowrap shrink-0"
          >
            Aperture Mobile
          </a>

          {/* Zone 2: 5 concise single-line website navigation links */}
          <nav
            aria-label="Primary website navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5C5C58] dark:text-[#A1A1AA]"
          >
            <a
              href="#phone-gallery"
              onClick={() => setActiveFilter('all')}
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
            >
              Phones
            </a>
            <button
              type="button"
              onClick={() => handleNavFilter('trending')}
              className={`whitespace-nowrap shrink-0 cursor-pointer transition-colors hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 ${
                activeFilter === 'trending' ? 'text-[#111111] dark:text-[#F4F4F2] underline' : ''
              }`}
            >
              Trending
            </button>
            <a
              href="#buying-guide"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
            >
              Buying Guide
            </a>
            <a
              href="#stores"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
            >
              Stores &amp; SHEIN
            </a>
            <a
              href="#faq"
              className="whitespace-nowrap shrink-0 transition-colors hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
            >
              FAQ &amp; Tips
            </a>
          </nav>

          {/* Zone 3: Theme Switch & Primary Compare Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsDark((prev) => !prev)}
              aria-pressed={isDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex h-9 items-center gap-1.5 px-3 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              {isDark ? (
                <>
                  <Sun className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Light</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="inline-flex h-9 items-center gap-2 px-4 text-xs font-medium text-white dark:text-[#111111] bg-[#111111] dark:bg-[#F4F4F2] rounded-lg hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
            >
              <span>Compare</span>
              <span className="font-mono tabular-nums">({compareIds.length})</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Compact Editorial Header + Grid Toolbar */}
        <section className="max-w-[1200px] mx-auto px-6 pt-10 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#D4D4CE] dark:border-[#27272A]">
            <div className="max-w-2xl">
              <p className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-2">
                2025 Hardware Studio Index
              </p>
              <h1 className="font-display text-[clamp(2rem,3.6vw,3.125rem)] font-bold leading-[1.08] tracking-tight text-[#111111] dark:text-[#F4F4F2] text-balance">
                Current Flagship Mobile Phones
              </h1>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA] max-w-xl">
                Hover or focus any studio frame to inspect display, processor, camera, and battery specifications. Select any model for its complete technical sheet.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium">
                <a
                  href="#buying-guide"
                  className="inline-flex items-center gap-1.5 text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
                >
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Free Guide: Choose Best Device &amp; Buy Cheap</span>
                </a>
                <span aria-hidden="true" className="text-[#D4D4CE] dark:text-[#27272A]">·</span>
                <a
                  href="https://za.shein.com/"
                  target="_blank"
                  rel="sponsored noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
                >
                  <span>Shop Clothes &amp; Items on SHEIN</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <PWAInstallButton variant="inline" />
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-[#5C5C58] dark:text-[#A1A1AA] shrink-0">
              <div>
                <span className="block font-mono text-base font-medium tabular-nums text-[#111111] dark:text-[#F4F4F2]">
                  {PHONE_MODELS.length}
                </span>
                <span>Curated Models</span>
              </div>
              <div className="h-7 w-px bg-[#D4D4CE] dark:bg-[#27272A]" aria-hidden="true" />
              <div>
                <span className="block font-mono text-base font-medium tabular-nums text-[#111111] dark:text-[#F4F4F2]">
                  4:3
                </span>
                <span>Studio Frames</span>
              </div>
              <div className="h-7 w-px bg-[#D4D4CE] dark:bg-[#27272A]" aria-hidden="true" />
              <div>
                <span className="block font-mono text-base font-medium tabular-nums text-[#111111] dark:text-[#F4F4F2]">
                  Up to 3
                </span>
                <span>Side-by-Side</span>
              </div>
            </div>
          </div>

          {/* Interactive Filter & Search Controls */}
          <div
            id="phone-gallery"
            className="scroll-mt-20 pt-6 pb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4"
          >
            {/* Segmented Category Filter Tabs + Reset All */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="tablist"
                aria-label="Filter models by category or battery endurance"
                className="inline-flex items-center gap-1 p-1 bg-[#EAEAE6] dark:bg-[#1C1C1F] rounded-lg overflow-x-auto max-w-full"
              >
                {FILTER_OPTIONS.map((option) => {
                  const isActive = activeFilter === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setActiveFilter(option.id)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                        isActive
                          ? 'bg-white dark:bg-[#27272A] text-[#111111] dark:text-[#F4F4F2] shadow-xs'
                          : 'text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!isFiltered}
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                  isFiltered
                    ? 'bg-white dark:bg-[#161618] border-[#D4D4CE] dark:border-[#27272A] text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] cursor-pointer'
                    : 'bg-[#F6F6F4] dark:bg-[#111113] border-[#EAEAE6] dark:border-[#222226] text-[#9A9A93] dark:text-[#52525B] cursor-not-allowed'
                }`}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Reset All</span>
              </button>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
              <div className="relative flex-1 sm:w-52">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5C5C58] dark:text-[#A1A1AA]"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search model or chip..."
                  aria-label="Search phone models or processors"
                  className="w-full h-9 pl-8 pr-3 bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs text-[#111111] dark:text-[#F4F4F2] placeholder:text-[#8A8A82] dark:placeholder:text-[#71717A] focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                />
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <div className="relative">
                  <ArrowUpDown
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5C5C58] dark:text-[#A1A1AA]"
                    aria-hidden="true"
                  />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Sort phone models"
                    className="h-9 pl-8 pr-7 bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs font-medium text-[#111111] dark:text-[#F4F4F2] cursor-pointer focus:outline-none focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                  >
                    <option value="featured">Featured Order</option>
                    <option value="battery-desc">Battery Life: High to Low</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                  </select>
                </div>

                <div
                  className="relative"
                  onMouseEnter={() => setShowSortInfo(true)}
                  onMouseLeave={() => setShowSortInfo(false)}
                >
                  <button
                    type="button"
                    onClick={() => setShowSortInfo((prev) => !prev)}
                    aria-expanded={showSortInfo}
                    aria-controls="sort-method-info"
                    aria-label="Explain sorting methods"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-[#5C5C58] dark:text-[#A1A1AA] hover:border-[#111111] dark:hover:border-[#52525B] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                  >
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>

                  {showSortInfo && (
                    <div
                      id="sort-method-info"
                      role="tooltip"
                      className="absolute right-0 top-full mt-2 z-30 w-72 rounded-xl border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] p-3.5 shadow-lg text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]"
                    >
                      <p className="font-semibold text-[#111111] dark:text-[#F4F4F2] mb-1.5">Sorting Methods</p>
                      <p className="mb-1.5">
                        <span className="font-medium text-[#111111] dark:text-[#F4F4F2]">Featured Order:</span>{' '}
                        Curated sequence grouped by flagship prominence and hardware category.
                      </p>
                      <p className="mb-1.5">
                        <span className="font-medium text-[#111111] dark:text-[#F4F4F2]">Battery Life:</span>{' '}
                        Ranks devices from highest battery capacity (6,000 mAh) downward for maximum endurance.
                      </p>
                      <p>
                        <span className="font-medium text-[#111111] dark:text-[#F4F4F2]">Price Sorting:</span>{' '}
                        Ranks models strictly by base retail MSRP (USD) from lowest to highest or highest to lowest.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQrScannerOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Scan QR to Compare</span>
              </button>
            </div>
          </div>

          {/* Responsive Image Grid Component */}
          <div ref={galleryRef}>
            <PhoneImageGrid
              phones={filteredPhones}
              selectedCompareIds={compareIds}
              favoriteIds={favoriteIds}
              priceOverrides={priceOverrides}
              onToggleCompare={handleToggleCompare}
              onToggleFavorite={handleToggleFavorite}
              onSelectPhone={handleSelectPhone}
            />
          </div>
        </section>

        {/* Concise Spec Legend / Summary Band */}
        <section className="max-w-[1200px] mx-auto px-6 py-10">
          <div className="border-t border-[#D4D4CE] dark:border-[#27272A] pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-3 max-w-xl">
              <SlidersHorizontal className="h-4 w-4 text-[#5C5C58] dark:text-[#A1A1AA] mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                All studio frames use a uniform 4:3 aspect ratio across breakpoints (1 column on mobile, 2 columns on tablet, 3 columns on desktop). Specifications reflect base retail configurations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCompareOpen(true)}
              className="self-start md:self-auto px-4 py-2 border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] rounded-lg text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Open Specification Matrix
            </button>
          </div>
        </section>

        {/* Featured Flagship Advert Showcase */}
        <section
          aria-labelledby="featured-advert-heading"
          className="max-w-[1200px] mx-auto px-6 pb-14"
        >
          <div className="bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 bg-[#EAEAE6] dark:bg-[#1E1E22] aspect-[16/9] lg:aspect-auto">
              {advertHeroError ? (
                <div className="h-full min-h-[260px] w-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#27272A] to-[#111113] text-[#F4F4F2]">
                  <Megaphone className="h-7 w-7 mb-3 text-[#60A5FA]" aria-hidden="true" />
                  <p className="font-display text-lg font-semibold">iPhone 16 Pro Max Campaign</p>
                  <p className="mt-1 text-xs text-[#A1A1AA]">Grade 5 Brushed Titanium Studio Spotlight</p>
                </div>
              ) : (
                <img
                  src="/src/assets/images/advert_flagship_hero_1795211044280.jpg"
                  alt="Grade 5 brushed titanium flagship smartphone resting on basalt and travertine stone blocks in directional studio lighting"
                  referrerPolicy="no-referrer"
                  onError={() => setAdvertHeroError(true)}
                  className="h-full w-full object-cover"
                />
              )}
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA]">
                  Featured Campaign · Apple Flagship Spotlight
                </p>
                <h2
                  id="featured-advert-heading"
                  className="mt-2 font-display text-2xl sm:text-[28px] font-bold leading-[1.15] tracking-tight text-[#111111] dark:text-[#F4F4F2] text-balance"
                >
                  Grade 5 Titanium. Built for Pro Optics.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                  Micro-blasted titanium architecture housing the 48MP Fusion camera system, 5x Tetraprism telephoto reach, and all-day A18 Pro silicon efficiency.
                </p>

                <div className="mt-5 pt-5 border-t border-[#EAEAE6] dark:border-[#222226] grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="block text-[#5C5C58] dark:text-[#A1A1AA]">Display</span>
                    <span className="mt-0.5 block font-mono font-semibold tabular-nums text-[#111111] dark:text-[#F4F4F2]">
                      6.9&quot; 120Hz
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#5C5C58] dark:text-[#A1A1AA]">Silicon</span>
                    <span className="mt-0.5 block font-mono font-semibold tabular-nums text-[#111111] dark:text-[#F4F4F2]">
                      A18 Pro 3nm
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#5C5C58] dark:text-[#A1A1AA]">MSRP</span>
                    <span className="mt-0.5 block font-mono font-semibold tabular-nums text-[#111111] dark:text-[#F4F4F2]">
                      From $1,199
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const featured = PHONE_MODELS.find((p) => p.id === 'iphone-16-pro-max');
                    if (featured) handleSelectPhone(featured);
                  }}
                  className="inline-flex h-10 items-center gap-2 px-4 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                >
                  <span>Inspect iPhone 16 Pro Max</span>
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsAdvertBuilderOpen(true)}
                  className="inline-flex h-10 items-center gap-2 px-4 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                >
                  <Megaphone className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Create Custom Advert</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Free Device Buying & Shopping Guide */}
        <section
          id="buying-guide"
          aria-labelledby="buying-guide-heading"
          className="scroll-mt-20 max-w-[1200px] mx-auto px-6 pb-14"
        >
          <div className="border-t border-[#D4D4CE] dark:border-[#27272A] pt-10">
            <div className="max-w-2xl mb-8">
              <p className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-2">
                Free Buyer&apos;s Guide · Devices &amp; Everyday Shopping
              </p>
              <h2
                id="buying-guide-heading"
                className="font-display text-2xl sm:text-[28px] font-bold tracking-tight text-[#111111] dark:text-[#F4F4F2] text-balance"
              >
                How to Choose the Best Device &amp; Buy It Cheap
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                Follow this free guide to match phone hardware to how you actually use it, pay less than retail MSRP, and head directly to official stores for phones—or SHEIN if you are shopping for clothes and everyday items.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              {/* Left: How to Choose the Best Device */}
              <div className="lg:col-span-7 bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#EAEAE6] dark:border-[#222226]">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                      <h3 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                        How to Choose the Best Device
                      </h3>
                    </div>
                    <span className="text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
                      Click any step to filter
                    </span>
                  </div>

                  <ol className="divide-y divide-[#EAEAE6] dark:divide-[#222226]">
                    {DEVICE_CHOICE_GUIDE.map((step) => (
                      <li
                        key={step.index}
                        className="py-4 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                            <span className="font-mono tabular-nums text-[#5C5C58] dark:text-[#A1A1AA] mr-2">
                              {step.index}
                            </span>
                            {step.title}
                          </h4>
                          <p className="mt-1 text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                            {step.summary}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyGuideFilter(step.filter, step.sort ?? 'featured')}
                          className="self-start sm:self-center inline-flex h-8 items-center gap-1.5 px-3 rounded-md border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                        >
                          <span>{step.actionLabel}</span>
                          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Right: How to Buy It Cheap */}
              <div className="lg:col-span-5 bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl p-6 flex flex-col justify-between gap-6">
                <div>
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#EAEAE6] dark:border-[#222226]">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                      <h3 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                        How to Buy Your Device Cheap
                      </h3>
                    </div>
                    <span className="text-xs text-[#5C5C58] dark:text-[#A1A1AA]">Free Playbook</span>
                  </div>

                  <ol className="divide-y divide-[#EAEAE6] dark:divide-[#222226]">
                    {CHEAP_BUYING_PLAYBOOK.map((tip) => (
                      <li key={tip.index} className="py-3.5 last:pb-0">
                        <h4 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                          <span className="font-mono tabular-nums text-[#5C5C58] dark:text-[#A1A1AA] mr-2">
                            {tip.index}
                          </span>
                          {tip.title}
                        </h4>
                        <p className="mt-1 text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                          {tip.detail}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-4 border-t border-[#EAEAE6] dark:border-[#222226] flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCheckWatchedPriceDrops}
                    className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                  >
                    <BellRing className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Check Price Drops</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyGuideFilter('all', 'price-asc')}
                    className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                  >
                    <span>Sort All Low to High</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Direct Shopping Destinations: Official Phone Stores vs. SHEIN Apparel & Items */}
            <div id="stores" className="scroll-mt-20 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Official Phone Stores */}
              <div className="bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl p-6 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#5C5C58] dark:text-[#A1A1AA] mb-1.5">
                    <Store className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                    <span className="font-medium text-[#111111] dark:text-[#F4F4F2]">
                      Buying a Smartphone?
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Official Manufacturer Stores</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#111111] dark:text-[#F4F4F2]">
                    Go to an Official Store for Verified Devices &amp; Trade-Ins
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                    Once you pick a model from the gallery, order unlocked directly from the brand&apos;s official store for full warranty coverage, seasonal markdowns, and trade-in credits.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {OFFICIAL_BRAND_STORES.map((store) => (
                    <a
                      key={store.brand}
                      href={store.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[#F6F6F4] dark:bg-[#1E1E22] hover:bg-[#EAEAE6] dark:hover:bg-[#27272A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-[#111111] dark:text-[#F4F4F2] truncate">
                          {store.brand}
                        </span>
                        <span className="block text-[11px] text-[#5C5C58] dark:text-[#A1A1AA] truncate">
                          {store.note}
                        </span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[#5C5C58] dark:text-[#A1A1AA] group-hover:text-[#111111] dark:group-hover:text-[#F4F4F2] shrink-0" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>

              {/* SHEIN Apparel & Other Items */}
              <div className="bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl p-6 flex flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 text-xs text-[#5C5C58] dark:text-[#A1A1AA] mb-1.5">
                    <ShoppingBag className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                    <span className="font-medium text-[#111111] dark:text-[#F4F4F2]">
                      Interested in Clothes or Other Items?
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>SHEIN Partner Storefront</span>
                  </div>
                  <h3 className="text-base font-semibold text-[#111111] dark:text-[#F4F4F2]">
                    Press the SHEIN Link for Apparel, Accessories &amp; Everyday Finds
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                    Looking for clothing, shoes, bags, home items, or affordable phone cases and straps instead of a new handset? Jump straight to SHEIN to browse seasonal deals and bundles.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
                    <li className="flex items-baseline gap-2">
                      <span className="font-mono text-[#111111] dark:text-[#F4F4F2]">01.</span>
                      <span>Seasonal fashion, streetwear, footwear, and everyday wardrobe essentials</span>
                    </li>
                    <li className="flex items-baseline gap-2">
                      <span className="font-mono text-[#111111] dark:text-[#F4F4F2]">02.</span>
                      <span>Budget-friendly phone cases, MagSafe grips, screen protectors, and travel pouches</span>
                    </li>
                    <li className="flex items-baseline gap-2">
                      <span className="font-mono text-[#111111] dark:text-[#F4F4F2]">03.</span>
                      <span>Home organization, desk accessories, and flash markdown offers</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-[#EAEAE6] dark:border-[#222226] flex flex-wrap items-center justify-between gap-3">
                  <a
                    href="https://za.shein.com/"
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 px-4 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Shop Clothes &amp; Items on SHEIN</span>
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleApplyGuideFilter('all', 'featured')}
                    className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
                  >
                    Back to Phone Gallery
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Hardware Insights FAQ */}
        <section
          id="faq"
          aria-labelledby="hardware-faq-heading"
          className="scroll-mt-20 max-w-[1200px] mx-auto px-6 pb-14"
        >
          <div className="border-t border-[#D4D4CE] dark:border-[#27272A] pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-2">
                Reference &amp; Methodology
              </p>
              <h2
                id="hardware-faq-heading"
                className="font-display text-2xl font-bold tracking-tight text-[#111111] dark:text-[#F4F4F2] text-balance"
              >
                Hardware Insights FAQ
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                Clarifications on specification sourcing, regional radio and charging variants, and our 4:3 studio photography standards.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl divide-y divide-[#EAEAE6] dark:divide-[#222226]">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openFaqId === item.id;
                const panelId = `faq-panel-${item.id}`;
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                      className="w-full px-6 py-4 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-[#F6F6F4]/60 dark:hover:bg-[#1E1E22]/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1D4ED8]"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-0.5">
                          {item.topic}
                        </span>
                        <span className="block text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                          {item.question}
                        </span>
                      </div>
                      <ChevronDown
                        className={`h-4 w-4 text-[#5C5C58] dark:text-[#A1A1AA] shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                          isOpen ? 'rotate-180 text-[#111111] dark:text-[#F4F4F2]' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                    {isOpen && (
                      <div
                        id={panelId}
                        className="px-6 pb-5 pt-1 text-sm leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]"
                      >
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Hardware Tips */}
        <section
          aria-labelledby="hardware-tips-heading"
          className="max-w-[1200px] mx-auto px-6 pb-14"
        >
          <div className="border-t border-[#D4D4CE] dark:border-[#27272A] pt-10">
            <div className="max-w-2xl mb-8">
              <p className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] mb-2">
                Practical Ownership Guide
              </p>
              <h2
                id="hardware-tips-heading"
                className="font-display text-2xl font-bold tracking-tight text-[#111111] dark:text-[#F4F4F2] text-balance"
              >
                Hardware Tips
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                Quick, actionable practices for sharper optical results, long-term battery longevity, and timing purchases when prices dip.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {HARDWARE_TIPS.map((group) => (
                <div
                  key={group.category}
                  className="bg-white dark:bg-[#161618] border border-[#D4D4CE] dark:border-[#27272A] rounded-xl p-6"
                >
                  <div className="pb-4 border-b border-[#EAEAE6] dark:border-[#222226]">
                    <div className="flex items-center gap-2 text-xs text-[#5C5C58] dark:text-[#A1A1AA] mb-1">
                      <span className="font-medium text-[#111111] dark:text-[#F4F4F2]">{group.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{group.subtitle}</span>
                    </div>
                  </div>

                  <ol className="divide-y divide-[#EAEAE6] dark:divide-[#222226]">
                    {group.tips.map((tip) => (
                      <li key={tip.index} className="py-4 last:pb-0">
                        <h3 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                          <span className="font-mono tabular-nums text-[#5C5C58] dark:text-[#A1A1AA] mr-2">
                            {tip.index}
                          </span>
                          {tip.title}
                        </h3>
                        <p className="mt-1.5 text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                          {tip.detail}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Recently Viewed, Hardware Release Updates Newsletter & Quiet Metadata */}
      <footer className="border-t border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618]">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          {/* Recently Viewed Hardware Models */}
          <section
            aria-labelledby="recently-viewed-heading"
            className="pb-8 mb-8 border-b border-[#EAEAE6] dark:border-[#222226]"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-2">
                <History className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                <h2
                  id="recently-viewed-heading"
                  className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]"
                >
                  Recently Viewed
                </h2>
                <span className="text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
                  <span aria-hidden="true">·</span>{' '}
                  <span className="font-mono tabular-nums">
                    {recentPhones.length} / {MAX_RECENTLY_VIEWED}
                  </span>
                </span>
                {favoriteIds.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
                    <span aria-hidden="true">·</span>
                    <Heart className="h-3 w-3 text-rose-600 dark:text-rose-400 fill-current" aria-hidden="true" />
                    <span className="font-mono tabular-nums">{favoriteIds.length} Favorited</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCheckWatchedPriceDrops}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                >
                  <BellRing className="h-3.5 w-3.5 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                  <span>Check Price Drops</span>
                </button>

                {recentPhones.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearRecent}
                    className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
                  >
                    Clear History
                  </button>
                )}
              </div>
            </div>

            {recentPhones.length === 0 ? (
              <p className="text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
                No devices inspected yet. Select or favorite any smartphone in the gallery above to track price drops and keep your last {MAX_RECENTLY_VIEWED} viewed models ready here.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {recentPhones.map((phone) => {
                  const effectivePrice = priceOverrides[phone.id] ?? phone.priceUsd;
                  const hasDrop = effectivePrice < phone.priceUsd;
                  return (
                    <button
                      key={phone.id}
                      type="button"
                      onClick={() => handleSelectPhone(phone)}
                      className="group flex items-center gap-3 p-2.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] hover:border-[#111111] dark:hover:border-[#52525B] text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                    >
                      <div className="w-16 aspect-[4/3] rounded overflow-hidden bg-[#EAEAE6] dark:bg-[#27272A] shrink-0">
                        <img
                          src={phone.imageUrl}
                          alt={phone.imageAlt}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-[#5C5C58] dark:text-[#A1A1AA] truncate">
                          {phone.brand}
                        </p>
                        <p className="text-xs font-semibold text-[#111111] dark:text-[#F4F4F2] truncate">
                          {phone.name}
                        </p>
                        {hasDrop ? (
                          <p className="mt-0.5 flex items-baseline gap-1.5 font-mono text-[11px] tabular-nums">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              ${effectivePrice.toLocaleString()}
                            </span>
                            <span className="text-[#8A8A82] dark:text-[#71717A] line-through">
                              ${phone.priceUsd.toLocaleString()}
                            </span>
                          </p>
                        ) : (
                          <p className="mt-0.5 font-mono text-[11px] tabular-nums text-[#5C5C58] dark:text-[#A1A1AA]">
                            ${phone.priceUsd.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-[#EAEAE6] dark:border-[#222226]">
            <div className="max-w-md">
              <h2 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                Hardware Release Updates
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                Receive concise notifications when new flagship specifications and studio frames are added to the index.
              </p>
            </div>

            {newsletterStatus === 'subscribed' ? (
              <div
                role="status"
                className="flex items-center justify-between gap-4 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] px-4 py-2.5 text-xs text-[#111111] dark:text-[#F4F4F2]"
              >
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA] shrink-0" aria-hidden="true" />
                  <span>
                    Subscribed <span className="font-mono">{newsletterEmail.trim()}</span> for hardware updates.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewsletterStatus('idle');
                    setNewsletterEmail('');
                  }}
                  className="text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] rounded"
                >
                  Change
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleNewsletterSubmit}
                noValidate
                className="w-full md:w-auto flex flex-col gap-1.5"
              >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address for Hardware Release Updates
                  </label>
                  <div className="relative flex-1 sm:w-64">
                    <Mail
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5C5C58] dark:text-[#A1A1AA]"
                      aria-hidden="true"
                    />
                    <input
                      id="newsletter-email"
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => {
                        setNewsletterEmail(e.target.value);
                        if (newsletterStatus === 'error') {
                          setNewsletterStatus('idle');
                          setNewsletterError('');
                        }
                      }}
                      placeholder="you@example.com"
                      aria-invalid={newsletterStatus === 'error'}
                      aria-describedby={newsletterStatus === 'error' ? 'newsletter-error' : undefined}
                      className="w-full h-9 pl-8 pr-3 bg-[#F6F6F4] dark:bg-[#1E1E22] border border-[#D4D4CE] dark:border-[#27272A] rounded-lg text-xs text-[#111111] dark:text-[#F4F4F2] placeholder:text-[#8A8A82] dark:placeholder:text-[#71717A] focus:outline-none focus:bg-white dark:focus:bg-[#161618] focus:border-[#1D4ED8] focus:ring-1 focus:ring-[#1D4ED8]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#1D4ED8] dark:hover:bg-[#3B82F6] dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                  >
                    Subscribe
                  </button>
                </div>
                {newsletterStatus === 'error' && newsletterError && (
                  <p id="newsletter-error" role="alert" className="text-xs text-red-700 dark:text-red-400">
                    {newsletterError}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Website Sitemap Directory */}
          <nav
            aria-label="Website directory"
            className="py-8 border-b border-[#EAEAE6] dark:border-[#222226] grid grid-cols-2 sm:grid-cols-4 gap-8 text-xs"
          >
            <div>
              <h3 className="font-semibold text-[#111111] dark:text-[#F4F4F2] mb-3">
                Browse Phones
              </h3>
              <ul className="space-y-2 text-[#5C5C58] dark:text-[#A1A1AA]">
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavFilter('all')}
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 cursor-pointer"
                  >
                    All Models
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavFilter('trending')}
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 cursor-pointer"
                  >
                    Trending Phones
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavFilter('camera-pro')}
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 cursor-pointer"
                  >
                    Camera Pro
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => handleNavFilter('battery-life')}
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 cursor-pointer"
                  >
                    Battery Life (5,000 mAh+)
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#111111] dark:text-[#F4F4F2] mb-3">
                Free Guides
              </h3>
              <ul className="space-y-2 text-[#5C5C58] dark:text-[#A1A1AA]">
                <li>
                  <a
                    href="#buying-guide"
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
                  >
                    How to Choose the Best Device
                  </a>
                </li>
                <li>
                  <a
                    href="#buying-guide"
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
                  >
                    How to Buy Devices Cheap
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
                  >
                    Hardware Insights FAQ
                  </a>
                </li>
                <li>
                  <a
                    href="#hardware-tips-heading"
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
                  >
                    Photography &amp; Battery Tips
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#111111] dark:text-[#F4F4F2] mb-3">
                Tools &amp; Compare
              </h3>
              <ul className="space-y-2 text-[#5C5C58] dark:text-[#A1A1AA]">
                <li>
                  <button
                    type="button"
                    onClick={() => setIsCompareOpen(true)}
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 cursor-pointer"
                  >
                    Specification Matrix
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsQrScannerOpen(true)}
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 cursor-pointer"
                  >
                    Scan QR to Compare
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setIsAdvertBuilderOpen(true)}
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 cursor-pointer"
                  >
                    Flagship Advert Studio
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={handleCheckWatchedPriceDrops}
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4 cursor-pointer"
                  >
                    Check Price Drops
                  </button>
                </li>
                <li>
                  <PWAInstallButton variant="footer-link" />
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#111111] dark:text-[#F4F4F2] mb-3">
                Stores &amp; Partner
              </h3>
              <ul className="space-y-2 text-[#5C5C58] dark:text-[#A1A1AA]">
                <li>
                  <a
                    href="#stores"
                    className="hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
                  >
                    Official Phone Stores
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.apple.com/iphone/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
                  >
                    <span>Apple Official Store</span>
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.samsung.com/global/galaxy/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-[#111111] dark:hover:text-[#F4F4F2] hover:underline underline-offset-4"
                  >
                    <span>Samsung Official Store</span>
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://za.shein.com/"
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#1D4ED8] dark:text-[#60A5FA] hover:underline underline-offset-4"
                  >
                    <span>SHEIN (Clothes &amp; Items)</span>
                    <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          </nav>

          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
              <span className="font-medium text-[#111111] dark:text-[#F4F4F2]">© 2025 Aperture Mobile</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span>Flagship Hardware Website · Pricing in USD · Specifications subject to regional carrier bands</span>
            </div>

            <nav aria-label="Tech content social channels" className="flex items-center gap-2">
              <a
                href="https://www.instagram.com/theverge/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram tech hardware channel"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] text-[#5C5C58] dark:text-[#A1A1AA] hover:border-[#111111] dark:hover:border-[#52525B] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://twitter.com/verge"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter tech news channel"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] text-[#5C5C58] dark:text-[#A1A1AA] hover:border-[#111111] dark:hover:border-[#52525B] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <Twitter className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href="https://www.youtube.com/@mkbhd"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube smartphone review channel"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] text-[#5C5C58] dark:text-[#A1A1AA] hover:border-[#111111] dark:hover:border-[#52525B] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <Youtube className="h-4 w-4" aria-hidden="true" />
              </a>
            </nav>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <PhoneDetailModal
        phone={selectedPhone}
        isCompared={selectedPhone ? compareIds.includes(selectedPhone.id) : false}
        compareLimitReached={compareIds.length >= 3}
        isFavorited={selectedPhone ? favoriteIds.includes(selectedPhone.id) : false}
        effectivePriceUsd={selectedPhone ? (priceOverrides[selectedPhone.id] ?? selectedPhone.priceUsd) : undefined}
        isDark={isDark}
        onClose={handleClosePhoneModal}
        onToggleCompare={handleToggleCompare}
        onToggleFavorite={handleToggleFavorite}
        onTriggerPriceDrop={handleTriggerPriceDrop}
      />

      <CompareDrawer
        isOpen={isCompareOpen}
        phones={comparePhones}
        onClose={() => setIsCompareOpen(false)}
        onRemovePhone={handleToggleCompare}
        onClearAll={() => setCompareIds([])}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
      />

      <QrCompareModal
        isOpen={isQrScannerOpen}
        compareIds={compareIds}
        onClose={() => setIsQrScannerOpen(false)}
        onAddToCompare={handleAddToCompare}
        onOpenComparison={() => setIsCompareOpen(true)}
      />

      <AdvertBuilderModal
        isOpen={isAdvertBuilderOpen}
        initialPhoneId={selectedPhone?.id ?? 'iphone-16-pro-max'}
        onClose={() => setIsAdvertBuilderOpen(false)}
      />

      <PriceDropToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onInspectPhone={handleSelectPhone}
      />

      <OfflineIndicator />
    </div>
  );
}
