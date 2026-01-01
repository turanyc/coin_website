"use client"

import React, { useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface DashboardCardProps {
  title: string;
  value: string;
  change: number;
  description1: string;
  description2: string;
  trend: 'up' | 'down';
  chartData?: Array<{ date: string; value: number }>;
  chartColor?: string;
  showChart?: boolean;
}

const chartConfig = {
  value: {
    label: "Değer",
  },
} satisfies ChartConfig

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  change,
  description1,
  description2,
  trend,
  chartData = [],
  chartColor = "hsl(217.2, 91.2%, 59.8%)",
  showChart = true,
}) => {
  const isPositive = trend === 'up';
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const trendIcon = isPositive ? (
    <TrendingUp className="w-3 h-3" />
  ) : (
    <TrendingDown className="w-3 h-3" />
  );

  // Generate chart data if not provided
  const defaultChartData = useMemo(() => {
    if (chartData.length > 0) return chartData;
    
    // Generate last 30 days of data
    const data = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate some variation based on trend
      const baseValue = isPositive ? 100 + (29 - i) * 2 : 150 - (29 - i) * 2;
      const variation = Math.sin(i * 0.5) * 20 + Math.random() * 30;
      const value = Math.max(50, baseValue + variation);
      
      data.push({ date: dateStr, value: Math.round(value) });
    }
    return data;
  }, [chartData, isPositive]);

  const total = useMemo(
    () => defaultChartData.reduce((acc, curr) => acc + curr.value, 0),
    [defaultChartData]
  );

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 relative flex flex-col">
      {/* Trend Badge */}
      <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white ${changeColor}`}>
        {trendIcon}
        <span>{isPositive ? '+' : ''}{change}%</span>
      </div>

      {/* Title */}
      <div className="text-gray-600 text-xs mb-3">{title}</div>

      {/* Value */}
      <div className="text-gray-900 text-2xl font-bold mb-1">{value}</div>

      {/* Description 1 */}
      <div className="flex items-center gap-2 text-gray-600 text-xs mb-1">
        {trendIcon}
        <span>{description1}</span>
      </div>

      {/* Description 2 */}
      {description2 && <div className="text-gray-500 text-xs mb-1">{description2}</div>}
    </div>
  );
};

interface DashboardCardsProps {
  marketStats?: {
    marketCap?: number;
    volume24h?: number;
    totalCoins?: number;
    marketCapChange24h?: number;
  };
  fearGreedIndex?: number;
  fearGreedClassification?: string;
}

const DashboardCards: React.FC<DashboardCardsProps> = ({ marketStats = {}, fearGreedIndex = 50, fearGreedClassification = 'Neutral' }) => {
  const formatTrillion = (num: number) => {
    if (num >= 1e12) {
      return '$' + (num / 1e12).toFixed(2) + 'T';
    } else if (num >= 1e9) {
      return '$' + (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
      return '$' + (num / 1e6).toFixed(2) + 'M';
    }
    return '$' + num.toFixed(2);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toLocaleString();
  };

  const marketCap = marketStats.marketCap || 0;
  const volume24h = marketStats.volume24h || 0;
  const totalCoins = marketStats.totalCoins || 0;
  const marketCapChange = marketStats.marketCapChange24h || 0;

  // Generate chart data based on market stats
  const generateMarketCapChartData = () => {
    const data = [];
    const today = new Date();
    const baseValue = marketCap || 2000000000000;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Positive trend simulation
      const progress = (29 - i) / 29;
      const variation = Math.sin(i * 0.5) * 0.05 + Math.random() * 0.03;
      const value = baseValue * (0.85 + progress * 0.15 + variation);
      
      data.push({ date: dateStr, value: Math.round(value) });
    }
    return data;
  };

  const generateCoinsChartData = () => {
    const data = [];
    const today = new Date();
    const baseValue = totalCoins || 10000;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Negative trend simulation
      const progress = (29 - i) / 29;
      const variation = Math.sin(i * 0.5) * 0.1 + Math.random() * 0.05;
      const value = baseValue * (1.2 - progress * 0.2 - variation);
      
      data.push({ date: dateStr, value: Math.round(value) });
    }
    return data;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 px-6">
      <DashboardCard
        title="Toplam Gelir"
        value={formatTrillion(marketCap)}
        change={12.5}
        description1=""
        description2=""
        trend="up"
        chartData={generateMarketCapChartData()}
        chartColor="hsl(217.2, 91.2%, 59.8%)"
        showChart={false}
      />
      <DashboardCard
        title="Toplam Coin Sayısı"
        value={formatNumber(totalCoins)}
        change={0.8}
        description1=""
        description2=""
        trend="up"
        chartData={generateCoinsChartData()}
        chartColor="hsl(47.9, 95.8%, 53.1%)"
        showChart={false}
      />
      {/* Korku ve Açgözlülük Bloğu - index.tsx'den alınan tasarım */}
      <Link href="/fear-greed" className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer flex flex-col h-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Korku ve Açgözlülük</span>
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        <div className="mb-2">
          <div className="text-2xl font-bold text-gray-900 mb-1">{fearGreedIndex}</div>
          <div className="text-xs font-semibold" style={{
            color: fearGreedIndex <= 25 ? '#ef4444' : fearGreedIndex <= 45 ? '#f59e0b' : fearGreedIndex <= 55 ? '#eab308' : fearGreedIndex <= 75 ? '#10b981' : '#059669'
          }}>
            {fearGreedClassification === 'Extreme Fear' ? 'Aşırı Korku' :
             fearGreedClassification === 'Fear' ? 'Korku' :
             fearGreedClassification === 'Neutral' ? 'Nötr' :
             fearGreedClassification === 'Greed' ? 'Açgözlülük' :
             fearGreedClassification === 'Extreme Greed' ? 'Aşırı Açgözlülük' :
             'Nötr'}
          </div>
        </div>
        {/* Horizontal Bar */}
        <div className="relative h-6 rounded-full mt-2 overflow-hidden">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-red-500"></div>
            <div className="flex-1 bg-orange-500"></div>
            <div className="flex-1 bg-yellow-400"></div>
            <div className="flex-1 bg-green-500"></div>
            <div className="flex-1 bg-emerald-600"></div>
          </div>
          <div 
            className="absolute top-0 bottom-0 w-0.1 bg-white shadow-lg"
            style={{ left: `${fearGreedIndex}%` }}
          ></div>
        </div>
      </Link>
    </div>
  );
};

export default DashboardCards;

