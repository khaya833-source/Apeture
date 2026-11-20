import React, { useId } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { TrendingDown } from 'lucide-react';
import { PricePoint } from '../data/phones';

interface PriceHistoryChartProps {
  modelName: string;
  priceHistory: PricePoint[];
  isDark?: boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

const CustomPriceTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border border-[#D4D4CE] dark:border-[#27272A] bg-white dark:bg-[#161618] px-3 py-2 shadow-md">
      <p className="text-[11px] font-medium text-[#5C5C58] dark:text-[#A1A1AA]">{label} 2026</p>
      <p className="font-mono text-xs font-semibold tabular-nums text-[#111111] dark:text-[#F4F4F2]">
        ${payload[0].value.toLocaleString()}
      </p>
    </div>
  );
};

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  modelName,
  priceHistory,
  isDark = false,
}) => {
  const gradientId = useId().replace(/:/g, '');
  const prices = priceHistory.map((item) => item.priceUsd);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const yMin = Math.max(0, Math.floor((minPrice - 60) / 50) * 50);
  const yMax = Math.ceil((maxPrice + 60) / 50) * 50;

  const strokeColor = isDark ? '#60A5FA' : '#1D4ED8';
  const gridColor = isDark ? '#27272A' : '#EAEAE6';
  const tickColor = isDark ? '#A1A1AA' : '#5C5C58';
  const dotStrokeColor = isDark ? '#161618' : '#FFFFFF';

  return (
    <div className="pb-6 mb-6 border-b border-[#EAEAE6] dark:border-[#222226]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-[#1D4ED8] dark:text-[#60A5FA]" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-[#111111] dark:text-[#F4F4F2]">
            Price History
          </h3>
        </div>
        <span className="font-mono text-xs tabular-nums text-[#5C5C58] dark:text-[#A1A1AA]">
          6M Range: ${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}
        </span>
      </div>

      <div
        className="h-40 w-full"
        role="img"
        aria-label={`6-month MSRP trend for ${modelName} ranging from $${minPrice.toLocaleString()} to $${maxPrice.toLocaleString()}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={priceHistory}
            margin={{ top: 6, right: 8, left: -12, bottom: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={isDark ? 0.24 : 0.16} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: tickColor, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              dy={4}
            />
            <YAxis
              domain={[yMin, yMax]}
              axisLine={false}
              tickLine={false}
              width={56}
              tickFormatter={(value: number) => `$${value.toLocaleString()}`}
              tick={{ fill: tickColor, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
            />
            <Tooltip content={<CustomPriceTooltip />} />
            <Area
              type="monotone"
              dataKey="priceUsd"
              stroke={strokeColor}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              activeDot={{ r: 4, fill: strokeColor, stroke: dotStrokeColor, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-2.5 text-[11px] leading-relaxed text-[#5C5C58] dark:text-[#A1A1AA]">
        Quick tip: Watch for seasonal retail dips near the 6-month low (
        <span className="font-mono tabular-nums text-[#111111] dark:text-[#F4F4F2]">
          ${minPrice.toLocaleString()}
        </span>
        ) before buying from an official store.
      </p>
    </div>
  );
};
