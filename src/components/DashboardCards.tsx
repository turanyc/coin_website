"use client"

import React, { useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, GitCommitVertical } from 'lucide-react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, Label, Pie, PieChart, CartesianGrid, Line, LineChart, XAxis } from 'recharts';
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
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  change,
  description1,
  description2,
  trend,
}) => {
  const isPositive = trend === 'up';
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const trendIcon = isPositive ? (
    <TrendingUp className="w-3 h-3" />
  ) : (
    <TrendingDown className="w-3 h-3" />
  );

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 relative flex flex-col">
      {/* Trend Badge */}
      <div className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-white ${changeColor}`}>
        {trendIcon}
        <span>{isPositive ? '+' : ''}{change}%</span>
      </div>

      {/* Title */}
      <div className="text-gray-600 text-xs mb-2">{title}</div>

      {/* Value */}
      <div className="text-gray-900 text-xl font-bold mb-1">{value}</div>

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
  const totalCoins = marketStats.totalCoins || 0;
  const marketCapChange = marketStats.marketCapChange24h || 0;

  // Generate last 6 months radar chart data
  const generateLast6MonthsData = useMemo(() => {
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const baseValue = marketCap || 2000000000000;
    const data = [];
    const today = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const monthName = monthNames[monthIndex];
      
      // Simulate monthly variation - positive trend
      const progress = (5 - i) / 5;
      const variation = Math.sin((5 - i) * 0.8) * 0.1;
      const value = baseValue * (0.85 + progress * 0.15 + variation);
      
      data.push({
        month: monthName,
        revenue: Math.round(value / 1e12 * 100) / 100, // Convert to trillions with 2 decimals
      });
    }
    return data;
  }, [marketCap]);

  const radarChartConfig = {
    revenue: {
      label: "Gelir",
      color: "hsl(217.2, 91.2%, 59.8%)",
    },
  } satisfies ChartConfig;

  // Generate last 5 days fear & greed data
  const generateLast5DaysData = useMemo(() => {
    const today = new Date();
    const data = [];
    const baseValue = fearGreedIndex || 50;
    
    // Generate last 5 days with variation
    for (let i = 4; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' });
      
      // Simulate daily variation
      const variation = Math.sin(i * 0.5) * 10;
      const value = Math.max(0, Math.min(100, baseValue + variation - (4 - i) * 2));
      
      // Mavinin farklı tonları - 5 dilim için
      const blueShades = [
        'hsl(217, 91%, 85%)', // Çok açık mavi (1. gün)
        'hsl(217, 91%, 70%)', // Açık mavi (2. gün)
        'hsl(217, 91%, 55%)', // Orta mavi (3. gün)
        'hsl(217, 91%, 40%)', // Koyu mavi (4. gün)
        'hsl(217, 91%, 25%)', // Çok koyu mavi (5. gün - bugün)
      ];
      
      data.push({
        day: dayName,
        value: Math.round(value),
        fill: blueShades[i],
      });
    }
    return data;
  }, [fearGreedIndex]);

  const pieChartConfig = {
    value: {
      label: "Değer",
    },
  } satisfies ChartConfig;

  // Generate last 6 months coin count data for line chart
  const generateLast6MonthsCoinData = useMemo(() => {
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    const baseValue = totalCoins || 10000;
    const data = [];
    const today = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthIndex = date.getMonth();
      const monthName = monthNames[monthIndex];
      
      // Simulate monthly variation - positive trend
      const progress = (5 - i) / 5;
      const variation = Math.sin((5 - i) * 0.8) * 0.05;
      const value = baseValue * (0.9 + progress * 0.1 + variation);
      
      data.push({
        month: monthName,
        coins: Math.round(value),
      });
    }
    return data;
  }, [totalCoins]);

  const lineChartConfig = {
    coins: {
      label: "Coin Sayısı",
      color: "hsl(217.2, 91.2%, 35%)",
    },
  } satisfies ChartConfig;

  return (
    <>
      {/* Toplam Gelir - Radar Chart */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 relative flex flex-col h-full">
        {/* Trend Badge */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-white text-black">
          <TrendingUp className="w-3 h-3" />
          <span>+{marketCapChange.toFixed(1)}%</span>
        </div>

        {/* Title */}
        <div className="text-gray-600 text-xs mb-0">Toplam Gelir</div>

        {/* Value */}
        <div className="text-gray-900 text-xl font-bold mb-0">{formatTrillion(marketCap)}</div>

        {/* Radar Chart */}
        <div className="flex-1 flex items-center justify-center min-h-[240px] -mx-2 -my-2">
          <ChartContainer
            config={radarChartConfig}
            className="w-full h-full max-h-[240px]"
          >
            <RadarChart data={generateLast6MonthsData}>
              <ChartTooltip 
                cursor={false} 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0];
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
                        <p className="text-xs font-semibold text-gray-900">{data.payload.month}</p>
                        <p className="text-xs text-gray-600">
                          Gelir: <span className="font-semibold">${data.value}T</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <PolarAngleAxis 
                dataKey="month" 
                tick={{ fontSize: 11, fill: '#6b7280' }}
              />
              <PolarGrid />
              <Radar
                dataKey="revenue"
                fill="hsl(217.2, 91.2%, 59.8%)"
                fillOpacity={0.6}
                dot={{
                  r: 5,
                  fillOpacity: 1,
                }}
              />
            </RadarChart>
          </ChartContainer>
        </div>
      </div>
      {/* Toplam Coin Sayısı - Line Chart */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 relative flex flex-col h-full">
        {/* Trend Badge */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-white text-black">
          <TrendingUp className="w-3 h-3" />
          <span>+0.8%</span>
        </div>

        {/* Title */}
        <div className="text-gray-600 text-xs mb-0.5">Toplam Coin Sayısı</div>

        {/* Value */}
        <div className="text-gray-900 text-xl font-bold mb-0.5">{formatNumber(totalCoins)}</div>

        {/* Line Chart */}
        <div className="flex-1 flex items-center justify-center min-h-[180px] -mx-1 -my-1">
          <ChartContainer
            config={lineChartConfig}
            className="w-full h-full max-h-[180px]"
          >
            <LineChart
              accessibilityLayer
              data={generateLast6MonthsCoinData}
              margin={{
                left: 12,
                right: 12,
                top: 12,
                bottom: 12,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Line
                dataKey="coins"
                type="natural"
                stroke="hsl(217.2, 91.2%, 35%)"
                strokeWidth={2}
                dot={({ cx, cy, payload }) => {
                  if (cx === undefined || cy === undefined) return null;
                  const r = 24;
                  return (
                    <GitCommitVertical
                      key={payload.month}
                      x={cx - r / 2}
                      y={cy - r / 2}
                      width={r}
                      height={r}
                      fill="hsl(var(--background))"
                      stroke="hsl(217.2, 91.2%, 35%)"
                    />
                  );
                }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </div>
      {/* Korku ve Açgözlülük Bloğu - Pie Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-2 relative flex flex-col h-full">
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-700">Korku ve Açgözlülük</span>
            <Link href="/fear-greed">
              <svg className="w-3 h-3 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
        
        {/* Pie Chart */}
        <div className="flex-1 flex items-center justify-center min-h-[240px] -mx-2 -my-2">
          <ChartContainer
            config={pieChartConfig}
            className="w-full h-full max-h-[240px]"
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
                        <p className="text-xs font-semibold text-gray-900">{data.day}</p>
                        <p className="text-xs text-gray-600">
                          Değer: <span className="font-semibold" style={{ color: data.fill }}>{data.value}</span>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={generateLast5DaysData}
                dataKey="value"
                nameKey="day"
                innerRadius={60}
                outerRadius={85}
                strokeWidth={3}
                stroke="#fff"
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      // Show today's value in center
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-gray-900 text-xl font-bold"
                          >
                            {fearGreedIndex}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 18}
                            className="fill-gray-600 text-xs"
                          >
                            {fearGreedClassification === 'Extreme Fear' ? 'Aşırı Korku' :
                             fearGreedClassification === 'Fear' ? 'Korku' :
                             fearGreedClassification === 'Neutral' ? 'Nötr' :
                             fearGreedClassification === 'Greed' ? 'Açgözlülük' :
                             fearGreedClassification === 'Extreme Greed' ? 'Aşırı Açgözlülük' :
                             'Nötr'}
                          </tspan>
                        </text>
                      );
                    }
                    return null;
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    </>
  );
};

export default DashboardCards;

