import React, { useEffect, useMemo, useState } from 'react';
import { X, Trash2, Flame, Table2, TrendingUp, TrendingDown, Info, QrCode, Download, Check } from 'lucide-react';
import { PhoneModel } from '../data/phones';

interface CompareDrawerProps {
  isOpen: boolean;
  phones: PhoneModel[];
  onClose: () => void;
  onRemovePhone: (id: string) => void;
  onClearAll: () => void;
  onOpenQrScanner?: () => void;
}

type CompareViewMode = 'heatmap' | 'standard';
type HeatmapRating = 'superior' | 'middle' | 'trailing' | 'neutral';

interface ComparisonRow {
  label: string;
  getValue: (p: PhoneModel) => string;
  getScore?: (p: PhoneModel) => number | null;
  higherIsBetter?: boolean;
  bestLabel?: string;
  trailingLabel?: string;
}

const parseDisplayScore = (displayDetail: string): number | null => {
  const hzMatches = [...displayDetail.matchAll(/(\d{2,3})\s*Hz/gi)].map((m) =>
    Number.parseInt(m[1], 10)
  );
  const maxHz = hzMatches.length > 0 ? Math.max(...hzMatches) : 60;
  const nitMatch = displayDetail.replace(/,/g, '').match(/(\d{3,4})\s*nits/i);
  const nits = nitMatch ? Number.parseInt(nitMatch[1], 10) : 1500;
  return maxHz + nits / 10000;
};

const parseMaxRamGb = (ramText: string): number | null => {
  const matches = [...ramText.matchAll(/(\d+)\s*GB/gi)].map((m) => Number.parseInt(m[1], 10));
  return matches.length > 0 ? Math.max(...matches) : null;
};

const parseMaxStorageGb = (storageText: string): number | null => {
  const matches = [...storageText.matchAll(/(\d+)\s*(TB|GB)/gi)].map((m) => {
    const val = Number.parseInt(m[1], 10);
    return m[2].toUpperCase() === 'TB' ? val * 1024 : val;
  });
  return matches.length > 0 ? Math.max(...matches) : null;
};

const parseCameraScore = (rearCameraDetail: string): number | null => {
  const mpMatches = [...rearCameraDetail.matchAll(/(\d+)\s*MP/gi)].map((m) =>
    Number.parseInt(m[1], 10)
  );
  if (mpMatches.length === 0) return null;
  const maxMp = Math.max(...mpMatches);
  return maxMp * 10 + mpMatches.length;
};

const parseBatteryMah = (batteryText: string): number | null => {
  const match = batteryText.replace(/,/g, '').match(/(\d{4,5})\s*mAh/i);
  return match ? Number.parseInt(match[1], 10) : null;
};

const parseWeightGrams = (weightText: string): number | null => {
  const match = weightText.match(/(\d+(?:\.\d+)?)\s*g/i);
  return match ? Number.parseFloat(match[1]) : null;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: 'Starting Price',
    getValue: (p) => `$${p.priceUsd.toLocaleString()}`,
    getScore: (p) => p.priceUsd,
    higherIsBetter: false,
    bestLabel: 'Lowest MSRP',
    trailingLabel: 'Highest MSRP',
  },
  {
    label: 'Display',
    getValue: (p) => p.quickSpecs.display,
    getScore: (p) => parseDisplayScore(p.fullSpecs.displayDetail),
    higherIsBetter: true,
    bestLabel: 'Superior',
    trailingLabel: 'Lower spec',
  },
  { label: 'Chipset', getValue: (p) => p.quickSpecs.chipset },
  {
    label: 'Memory',
    getValue: (p) => p.fullSpecs.ram,
    getScore: (p) => parseMaxRamGb(p.fullSpecs.ram),
    higherIsBetter: true,
    bestLabel: 'Highest RAM',
    trailingLabel: 'Less RAM',
  },
  {
    label: 'Storage',
    getValue: (p) => p.quickSpecs.storage,
    getScore: (p) => parseMaxStorageGb(p.fullSpecs.storageOptions),
    higherIsBetter: true,
    bestLabel: 'Max Capacity',
    trailingLabel: 'Lower Cap',
  },
  {
    label: 'Primary Camera',
    getValue: (p) => p.quickSpecs.camera,
    getScore: (p) => parseCameraScore(p.fullSpecs.rearCameraDetail),
    higherIsBetter: true,
    bestLabel: 'Top Optics',
    trailingLabel: 'Lower MP',
  },
  {
    label: 'Battery & Charge',
    getValue: (p) => p.quickSpecs.battery,
    getScore: (p) => parseBatteryMah(p.fullSpecs.batteryDetail),
    higherIsBetter: true,
    bestLabel: 'Largest Cell',
    trailingLabel: 'Smaller Cell',
  },
  {
    label: 'Weight',
    getValue: (p) => p.fullSpecs.weight,
    getScore: (p) => parseWeightGrams(p.fullSpecs.weight),
    higherIsBetter: false,
    bestLabel: 'Lightest',
    trailingLabel: 'Heaviest',
  },
  { label: 'Chassis', getValue: (p) => p.fullSpecs.chassis },
];

const getRowRatings = (row: ComparisonRow, phones: PhoneModel[]): HeatmapRating[] => {
  if (phones.length < 2 || !row.getScore) {
    return phones.map(() => 'neutral');
  }

  const scores = phones.map((phone) => row.getScore!(phone));
  if (scores.some((score) => score === null)) {
    return phones.map(() => 'neutral');
  }

  const numericScores = scores as number[];
  const maxVal = Math.max(...numericScores);
  const minVal = Math.min(...numericScores);

  if (Math.abs(maxVal - minVal) < 0.0001) {
    return phones.map(() => 'neutral');
  }

  const superiorVal = row.higherIsBetter ? maxVal : minVal;
  const trailingVal = row.higherIsBetter ? minVal : maxVal;

  return numericScores.map((score) => {
    if (Math.abs(score - superiorVal) < 0.0001) return 'superior';
    if (Math.abs(score - trailingVal) < 0.0001) return 'trailing';
    return 'middle';
  });
};

interface SpecTooltipTerm {
  term: string;
  explanation: string;
}

interface SpecTooltipContent {
  summary: string;
  terms: SpecTooltipTerm[];
}

interface ActiveTooltipState {
  label: string;
  top: number;
  left: number;
  placeAbove: boolean;
}

const getRowTooltipContent = (rowLabel: string, phones: PhoneModel[]): SpecTooltipContent => {
  const combinedText = (picker: (p: PhoneModel) => string) =>
    phones.map(picker).join(' ').toLowerCase();

  switch (rowLabel) {
    case 'Memory': {
      const text = combinedText((p) => p.fullSpecs.ram);
      const terms: SpecTooltipTerm[] = [];
      if (text.includes('lpddr5x')) {
        terms.push({
          term: 'LPDDR5X',
          explanation:
            'High-speed, low-power mobile RAM that keeps apps open in the background without reloading and accelerates on-device AI tasks.',
        });
      }
      if (text.includes('unified memory')) {
        terms.push({
          term: 'Unified Memory',
          explanation:
            'Shared high-bandwidth memory pool accessed directly by CPU, GPU, and Neural Engine cores to avoid slow data copying.',
        });
      }
      return {
        summary:
          'RAM determines how many apps, browser tabs, and camera processes stay active at once without refreshing.',
        terms,
      };
    }

    case 'Storage': {
      const text = combinedText((p) => `${p.quickSpecs.storage} ${p.fullSpecs.storageOptions}`);
      const terms: SpecTooltipTerm[] = [];
      if (text.includes('ufs 4.1')) {
        terms.push({
          term: 'UFS 4.1',
          explanation:
            'Latest Universal Flash Storage generation offering faster app loading, smoother 4K/8K video writes, and lower power draw.',
        });
      }
      if (text.includes('ufs 4.0')) {
        terms.push({
          term: 'UFS 4.0',
          explanation:
            'Universal Flash Storage 4.0 roughly doubles app-install and large file transfer speeds over UFS 3.1 while conserving battery.',
        });
      }
      if (text.includes('ufs 3.1')) {
        terms.push({
          term: 'UFS 3.1',
          explanation:
            'Fast flash storage for everyday photos and apps, though slower than UFS 4.0 when copying multi-gigabyte games or videos.',
        });
      }
      if (text.includes('nvme')) {
        terms.push({
          term: 'NVMe',
          explanation:
            'PCIe-based solid-state controller architecture tuned for quick random reads, snappy app launches, and 4K ProRes capture.',
        });
      }
      return {
        summary:
          'Storage type controls how quickly large apps install, games load, and high-bitrate photos or videos save.',
        terms,
      };
    }

    case 'Display': {
      const text = combinedText((p) => `${p.quickSpecs.display} ${p.fullSpecs.displayDetail}`);
      const terms: SpecTooltipTerm[] = [];
      if (text.includes('ltpo')) {
        terms.push({
          term: 'LTPO',
          explanation:
            'Adaptive display backplane that scales down to 1Hz on static screens to save battery, then jumps to 120Hz while scrolling.',
        });
      }
      if (text.includes('120hz') || text.includes('165hz')) {
        terms.push({
          term: '120Hz / 165Hz',
          explanation:
            'Refreshes the image 120–165 times per second for noticeably smoother scrolling and motion than a standard 60Hz panel.',
        });
      }
      if (text.includes('60hz')) {
        terms.push({
          term: '60Hz',
          explanation:
            'Standard 60-frames-per-second refresh rate—consistent and efficient, though less fluid during fast scrolling.',
        });
      }
      if (text.includes('amoled') || text.includes('oled') || text.includes('poled')) {
        terms.push({
          term: 'OLED / AMOLED',
          explanation:
            'Self-emissive pixels turn completely off for true blacks, strong HDR contrast, and clear outdoor readability.',
        });
      }
      return {
        summary:
          'Refresh rate (Hz) governs motion smoothness, while peak brightness (nits) determines visibility in direct sunlight.',
        terms,
      };
    }

    case 'Chipset': {
      const text = combinedText((p) => `${p.quickSpecs.chipset} ${p.fullSpecs.processorDetail}`);
      const terms: SpecTooltipTerm[] = [];
      if (text.includes('3nm')) {
        terms.push({
          term: '3nm Process',
          explanation:
            '3-nanometer transistor lithography packs circuits tighter for higher speed with less heat and better battery efficiency.',
        });
      }
      if (text.includes('4nm')) {
        terms.push({
          term: '4nm Process',
          explanation:
            '4-nanometer fabrication balancing flagship performance and steady thermal behavior during gaming and AI tasks.',
        });
      }
      return {
        summary:
          'The processor (SoC) integrates CPU, graphics, and AI cores that power gaming, photo processing, and long-term responsiveness.',
        terms,
      };
    }

    case 'Primary Camera': {
      const text = combinedText((p) => `${p.quickSpecs.camera} ${p.fullSpecs.rearCameraDetail}`);
      const terms: SpecTooltipTerm[] = [];
      if (text.includes('periscope') || text.includes('tetraprism')) {
        terms.push({
          term: 'Periscope / Tetraprism',
          explanation:
            'Folded lens optics bend light inside the body to deliver true 3x–5x optical zoom without blurry digital cropping.',
        });
      }
      if (text.includes('200mp')) {
        terms.push({
          term: '200MP Sensor',
          explanation:
            'Ultra-dense sensor merges multiple pixels together in dim light for cleaner night shots and sharp cropped zoom.',
        });
      }
      if (text.includes('hasselblad') || text.includes('leica') || text.includes('zeiss')) {
        terms.push({
          term: 'Optical Co-Engineering',
          explanation:
            'Specialized lens coatings and color tuning reduce glare and preserve natural skin tones and contrast.',
        });
      }
      return {
        summary:
          'Sensor size and optical zoom lenses matter more for crisp portraits and low-light photos than megapixel count alone.',
        terms,
      };
    }

    case 'Battery & Charge': {
      const text = combinedText(
        (p) => `${p.quickSpecs.battery} ${p.fullSpecs.batteryDetail} ${p.fullSpecs.charging}`
      );
      const terms: SpecTooltipTerm[] = [];
      if (text.includes('silicon-carbon') || text.includes('silicon-anode')) {
        terms.push({
          term: 'Silicon-Carbon Battery',
          explanation:
            'Higher-density battery chemistry packs 5,400–6,000 mAh capacity into a standard-thickness phone.',
        });
      }
      if (text.includes('magsafe') || text.includes('qi2')) {
        terms.push({
          term: 'MagSafe / Qi2',
          explanation:
            'Magnetic ring alignment centers the charging coil automatically to cut wasted heat during wireless charging.',
        });
      }
      if (text.includes('supervooc') || text.includes('hypercharge') || text.includes('flashcharge')) {
        terms.push({
          term: '80W–100W Fast Charge',
          explanation:
            'High-wattage wired charging protocols replenish a battery from near empty in roughly 30–40 minutes.',
        });
      }
      return {
        summary:
          'Capacity (mAh) estimates how long a phone lasts between charges, while wattage (W) sets how quickly it refills.',
        terms,
      };
    }

    case 'Starting Price':
      return {
        summary:
          'Manufacturer suggested retail price (USD) for the base storage tier before carrier promos or trade-in credits.',
        terms: [],
      };

    case 'Weight':
      return {
        summary:
          'Total mass in grams. Phones under 185 g feel noticeably lighter in one hand, while 220 g+ models house larger batteries or foldables.',
        terms: [],
      };

    case 'Chassis': {
      const text = combinedText((p) => p.fullSpecs.chassis);
      const terms: SpecTooltipTerm[] = [];
      if (text.includes('titanium')) {
        terms.push({
          term: 'Titanium Frame',
          explanation:
            'Higher strength-to-weight ratio than stainless steel, resisting frame dents while keeping large devices lighter.',
        });
      }
      if (text.includes('ip68') || text.includes('ip69') || text.includes('ip48')) {
        terms.push({
          term: 'IP Protection Rating',
          explanation:
            'IP68 protects against dust and water submersion; IP69 adds hot high-pressure water resistance; IP48 shields foldables from water and particles over 1mm.',
        });
      }
      return {
        summary:
          'Frame alloys, cover glass, and IP seals determine drop durability and resistance to water or dust.',
        terms,
      };
    }

    default:
      return {
        summary: 'Published manufacturer hardware specification.',
        terms: [],
      };
  }
};

const escapeCsvCell = (rawValue: string): string => {
  const safe = /^[=+\-@\t\r]/.test(rawValue) ? `'${rawValue}` : rawValue;
  if (/[",\n\r]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
};

const buildComparisonCsv = (
  phones: PhoneModel[],
  superiorCounts: Record<string, number>,
  includeHeatmapSummary: boolean
): string => {
  const header = ['Specification', ...phones.map((phone) => `${phone.brand} ${phone.name}`)];
  const rows: string[][] = [
    ['Brand', ...phones.map((p) => p.brand)],
    ['Finish', ...phones.map((p) => p.finish)],
    ['Category', ...phones.map((p) => p.categoryLabel)],
    ['Release Date', ...phones.map((p) => p.releaseDate)],
    ...COMPARISON_ROWS.map((row) => [row.label, ...phones.map((phone) => row.getValue(phone))]),
    ['Dimensions', ...phones.map((p) => p.fullSpecs.dimensions)],
    ['Charging', ...phones.map((p) => p.fullSpecs.charging)],
    ['Connectivity', ...phones.map((p) => p.fullSpecs.connectivity)],
    ['Operating System', ...phones.map((p) => p.fullSpecs.os)],
    ['Official URL', ...phones.map((p) => p.officialUrl)],
  ];

  if (includeHeatmapSummary && phones.length >= 2) {
    rows.push([
      'Superior Metrics Count',
      ...phones.map((p) => String(superiorCounts[p.id] ?? 0)),
    ]);
  }

  return [header, ...rows]
    .map((line) => line.map(escapeCsvCell).join(','))
    .join('\r\n');
};

export const CompareDrawer: React.FC<CompareDrawerProps> = ({
  isOpen,
  phones,
  onClose,
  onRemovePhone,
  onClearAll,
  onOpenQrScanner,
}) => {
  const [viewMode, setViewMode] = useState<CompareViewMode>('heatmap');
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltipState | null>(null);
  const [exportStatus, setExportStatus] = useState<'idle' | 'exported'>('idle');

  useEffect(() => {
    if (!isOpen) {
      setActiveTooltip(null);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeTooltip) {
          setActiveTooltip(null);
          return;
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeTooltip]);

  const superiorCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    phones.forEach((p) => {
      counts[p.id] = 0;
    });
    if (phones.length < 2) return counts;

    COMPARISON_ROWS.forEach((row) => {
      const ratings = getRowRatings(row, phones);
      ratings.forEach((rating, idx) => {
        if (rating === 'superior') {
          counts[phones[idx].id] += 1;
        }
      });
    });
    return counts;
  }, [phones]);

  if (!isOpen) return null;

  const isHeatmapActive = viewMode === 'heatmap';

  const handleExportCsv = () => {
    if (phones.length === 0) return;

    const csvContent = buildComparisonCsv(phones, superiorCounts, isHeatmapActive);
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const slug = phones.map((p) => p.id).join('-vs-');
    link.href = downloadUrl;
    link.download = slug ? `aperture-compare-${slug}.csv` : 'aperture-comparison.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);

    setExportStatus('exported');
    window.setTimeout(() => setExportStatus('idle'), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-neutral-950/50 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-drawer-title"
    >
      <div
        className="w-full max-w-3xl h-full bg-white dark:bg-[#161618] border-l border-[#D4D4CE] dark:border-[#27272A] shadow-2xl flex flex-col"
        onClick={(e) => {
          e.stopPropagation();
          if (activeTooltip) setActiveTooltip(null);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-[#EAEAE6] dark:border-[#222226]">
          <div className="min-w-0">
            <h2 id="compare-drawer-title" className="text-lg font-semibold text-[#111111] dark:text-[#F4F4F2]">
              Hardware Comparison
            </h2>
            <p className="text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
              Compare up to 3 models side by side
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {phones.length > 0 && (
              <button
                type="button"
                onClick={handleExportCsv}
                aria-label="Export current comparison matrix as CSV"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#1D4ED8] dark:hover:border-[#60A5FA] hover:text-[#1D4ED8] dark:hover:text-[#60A5FA] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                {exportStatus === 'exported' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
                    <span>CSV Exported</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Export as CSV</span>
                  </>
                )}
              </button>
            )}
            {onOpenQrScanner && phones.length < 3 && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQrScanner();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-[#F6F6F4] dark:bg-[#1E1E22] text-xs font-medium text-[#111111] dark:text-[#F4F4F2] hover:border-[#111111] dark:hover:border-[#52525B] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Scan QR</span>
              </button>
            )}
            {phones.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Clear</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison drawer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#5C5C58] dark:text-[#A1A1AA] hover:bg-[#F6F6F4] dark:hover:bg-[#222226] hover:text-[#111111] dark:hover:text-[#F4F4F2] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto p-6"
          onScroll={() => {
            if (activeTooltip) setActiveTooltip(null);
          }}
        >
          {phones.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <p className="text-base font-medium text-[#111111] dark:text-[#F4F4F2]">
                No models selected for comparison
              </p>
              <p className="mt-1.5 max-w-sm text-sm text-[#5C5C58] dark:text-[#A1A1AA]">
                Click the Compare button on any smartphone card in the grid or scan a product QR code to evaluate hardware specifications side by side.
              </p>
              {onOpenQrScanner && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQrScanner();
                  }}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#111111] dark:bg-[#F4F4F2] text-xs font-medium text-white dark:text-[#111111] hover:bg-[#27272A] dark:hover:bg-[#D4D4CE] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  <span>Scan QR to Compare</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              {/* View Switcher & Heatmap Legend */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EAEAE6] dark:border-[#222226]">
                <div
                  role="tablist"
                  aria-label="Comparison view mode"
                  className="inline-flex items-center gap-1 p-1 bg-[#EAEAE6] dark:bg-[#1C1C1F] rounded-lg"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'heatmap'}
                    onClick={() => setViewMode('heatmap')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                      viewMode === 'heatmap'
                        ? 'bg-white dark:bg-[#27272A] text-[#111111] dark:text-[#F4F4F2] shadow-xs'
                        : 'text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Spec Heatmap</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'standard'}
                    onClick={() => setViewMode('standard')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                      viewMode === 'standard'
                        ? 'bg-white dark:bg-[#27272A] text-[#111111] dark:text-[#F4F4F2] shadow-xs'
                        : 'text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                    }`}
                  >
                    <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Standard Table</span>
                  </button>
                </div>

                {isHeatmapActive && (
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#5C5C58] dark:text-[#A1A1AA]">
                    {phones.length < 2 ? (
                      <span>Select at least 2 phones to activate heatmap highlights.</span>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 rounded-xs bg-emerald-500/80 dark:bg-emerald-400/80"
                          />
                          <span>Superior metric</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 rounded-xs bg-rose-500/80 dark:bg-rose-400/80"
                          />
                          <span>Trailing metric</span>
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[#D4D4CE] dark:border-[#27272A]">
                      <th className="py-3 pr-4 text-xs font-medium text-[#5C5C58] dark:text-[#A1A1AA] w-32 align-bottom">
                        Specification
                      </th>
                      {phones.map((phone) => (
                        <th key={phone.id} className="py-3 px-3 min-w-[170px] align-top">
                          <div className="aspect-[4/3] w-full rounded-md overflow-hidden bg-[#EAEAE6] dark:bg-[#1E1E22] mb-2.5">
                            <img
                              src={phone.imageUrl}
                              alt={phone.imageAlt}
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-normal text-[#5C5C58] dark:text-[#A1A1AA]">
                                {phone.brand}
                              </p>
                              <p className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
                                {phone.name}
                              </p>
                              {isHeatmapActive && phones.length >= 2 && (
                                <p className="mt-1 font-mono text-[11px] font-medium tabular-nums text-emerald-700 dark:text-emerald-400">
                                  {superiorCounts[phone.id]} superior{' '}
                                  {superiorCounts[phone.id] === 1 ? 'metric' : 'metrics'}
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemovePhone(phone.id)}
                              aria-label={`Remove ${phone.name} from comparison`}
                              className="text-xs text-[#5C5C58] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F2] p-1 cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAEAE6] dark:divide-[#222226]">
                    {COMPARISON_ROWS.map((row) => {
                      const ratings = isHeatmapActive
                        ? getRowRatings(row, phones)
                        : phones.map((): HeatmapRating => 'neutral');
                      const isTooltipOpen = activeTooltip?.label === row.label;

                      const openTooltipFromTrigger = (target: HTMLButtonElement) => {
                        const rect = target.getBoundingClientRect();
                        const placeAbove = rect.bottom + 240 > window.innerHeight;
                        const left = Math.min(window.innerWidth - 316, Math.max(16, rect.left));
                        const top = placeAbove ? rect.top - 8 : rect.bottom + 8;
                        setActiveTooltip({ label: row.label, top, left, placeAbove });
                      };

                      return (
                        <tr key={row.label}>
                          <th
                            scope="row"
                            className="py-3.5 pr-4 text-xs text-[#5C5C58] dark:text-[#A1A1AA] align-top font-normal"
                          >
                            <div className="inline-flex items-center gap-1.5">
                              <span className="font-medium">{row.label}</span>
                              <button
                                type="button"
                                aria-expanded={isTooltipOpen}
                                aria-controls={isTooltipOpen ? 'compare-spec-tooltip' : undefined}
                                aria-label={`Explain ${row.label} specification metrics`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isTooltipOpen) {
                                    setActiveTooltip(null);
                                  } else {
                                    openTooltipFromTrigger(e.currentTarget);
                                  }
                                }}
                                onMouseEnter={(e) => openTooltipFromTrigger(e.currentTarget)}
                                onMouseLeave={() => setActiveTooltip(null)}
                                className={`inline-flex h-5 w-5 items-center justify-center rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] ${
                                  isTooltipOpen
                                    ? 'text-[#1D4ED8] dark:text-[#60A5FA] bg-[#EAEAE6] dark:bg-[#27272A]'
                                    : 'text-[#8A8A82] dark:text-[#71717A] hover:text-[#111111] dark:hover:text-[#F4F4F2]'
                                }`}
                              >
                                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </th>
                          {phones.map((phone, idx) => {
                            const rating = ratings[idx];
                            const cellBgClass =
                              rating === 'superior'
                                ? 'bg-emerald-50/90 dark:bg-emerald-950/35 text-emerald-950 dark:text-emerald-100'
                                : rating === 'trailing'
                                  ? 'bg-rose-50/90 dark:bg-rose-950/35 text-rose-950 dark:text-rose-100'
                                  : 'text-[#111111] dark:text-[#F4F4F2]';

                            return (
                              <td
                                key={phone.id}
                                className={`py-3.5 px-3 text-xs font-mono tabular-nums align-top leading-relaxed transition-colors ${cellBgClass}`}
                              >
                                <div>{row.getValue(phone)}</div>
                                {rating === 'superior' && (
                                  <div className="mt-1 inline-flex items-center gap-1 font-sans text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                    <TrendingUp className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    <span>{row.bestLabel ?? 'Superior'}</span>
                                  </div>
                                )}
                                {rating === 'trailing' && (
                                  <div className="mt-1 inline-flex items-center gap-1 font-sans text-[11px] font-medium text-rose-700 dark:text-rose-400">
                                    <TrendingDown className="h-3 w-3 shrink-0" aria-hidden="true" />
                                    <span>{row.trailingLabel ?? 'Lower'}</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Context-Aware Specification Tooltip (rendered outside table overflow to prevent clipping) */}
      {activeTooltip && (() => {
        const tooltipData = getRowTooltipContent(activeTooltip.label, phones);
        return (
          <div
            id="compare-spec-tooltip"
            role="tooltip"
            onClick={(e) => e.stopPropagation()}
            style={{
              top: `${activeTooltip.top}px`,
              left: `${activeTooltip.left}px`,
            }}
            className={`fixed z-[60] w-[300px] rounded-xl border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] p-3.5 shadow-xl text-xs leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA] ${
              activeTooltip.placeAbove ? '-translate-y-full' : ''
            }`}
          >
            <p className="font-semibold text-[#111111] dark:text-[#F4F4F2] mb-1">
              {activeTooltip.label}
            </p>
            <p>{tooltipData.summary}</p>
            {tooltipData.terms.length > 0 && (
              <dl className="mt-2.5 pt-2.5 border-t border-[#EAEAE6] dark:border-[#222226] space-y-2">
                {tooltipData.terms.map((item) => (
                  <div key={item.term}>
                    <dt className="font-mono text-[11px] font-medium text-[#1D4ED8] dark:text-[#60A5FA]">
                      {item.term}
                    </dt>
                    <dd className="mt-0.5 text-[11px] leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
                      {item.explanation}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        );
      })()}
    </div>
  );
};

