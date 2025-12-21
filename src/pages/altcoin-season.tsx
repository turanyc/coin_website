import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface AltcoinSeasonData {
  currentValue: number;
  currentClassification: string;
  historicalValues: {
    yesterday: { value: number; classification: string };
    lastWeek: { value: number; classification: string };
    lastMonth: { value: number; classification: string };
  };
  yearlyPerformance: {
    high: { value: number; classification: string; date: string };
    low: { value: number; classification: string; date: string };
  };
  chartData: Array<{
    date: string;
    altcoinSeasonIndex: number;
    altcoinMarketCap: number;
  }>;
  top100Performance: Array<{
    id: string;
    symbol: string;
    name: string;
    priceChange90d: number;
    isBitcoin: boolean;
  }>;
}

const AltcoinSeasonPage: React.FC = () => {
  const [data, setData] = useState<AltcoinSeasonData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1M');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>('what-is');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; value: number; date: string } | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/altcoin-season');
      const result = await response.json();
      if (response.ok && !result.error) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || 'Veri yüklenirken bir hata oluştu.');
        setData(null);
      }
    } catch (err) {
      setError('Veri yüklenirken bir hata oluştu.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getClassificationText = (classification: string): string => {
    if (classification === 'Bitcoin Season') return 'Bitcoin Sezonu';
    if (classification === 'Altcoin Season') return 'Altcoin Sezonu';
    return classification;
  };

  const getClassificationColor = (classification: string): string => {
    if (classification === 'Bitcoin Season') return '#F97316';
    if (classification === 'Altcoin Season') return '#3B82F6';
    return '#6B7280';
  };

  // Filter chart data based on timeframe
  const getFilteredChartData = () => {
    if (!data) return [];
    
    const now = Date.now();
    let days = 30;
    if (selectedTimeframe === '3M') days = 90;
    else if (selectedTimeframe === '6M') days = 180;
    else if (selectedTimeframe === 'YTD') {
      const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
      days = Math.floor((now - yearStart) / (24 * 60 * 60 * 1000));
    }
    else if (selectedTimeframe === '1Y') days = 365;
    else if (selectedTimeframe === 'All') days = 730;
    
    const cutoffDate = now - days * 24 * 60 * 60 * 1000;
    return data.chartData.filter(d => new Date(d.date).getTime() >= cutoffDate);
  };

  const chartData = getFilteredChartData();

  // Chart calculations
  const chartWidth = 1000;
  const chartHeight = 500;
  const paddingLeft = 80;
  const paddingRight = 100;
  const paddingTop = 40;
  const paddingBottom = 80;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Altcoin Season Index values (left Y-axis: 0-100)
  const indexValues = chartData.map(d => d.altcoinSeasonIndex);
  const indexMax = 100;
  const indexMin = 0;
  const indexRange = indexMax - indexMin;

  // Altcoin Market Cap values (right Y-axis)
  const marketCapValues = chartData.map(d => d.altcoinMarketCap);
  const marketCapMax = marketCapValues.length > 0 ? Math.max(...marketCapValues) : 2000000000000;
  const marketCapMin = marketCapValues.length > 0 ? Math.min(...marketCapValues) : 0;
  const marketCapRange = marketCapMax - marketCapMin || 1;

  const getX = (index: number) => paddingLeft + (index / (chartData.length - 1 || 1)) * plotWidth;
  const getIndexY = (value: number) => paddingTop + plotHeight - ((value - indexMin) / indexRange) * plotHeight;
  const getMarketCapY = (value: number) => paddingTop + plotHeight - ((value - marketCapMin) / marketCapRange) * plotHeight;

  const indexLinePoints = chartData.map((d, i) => `${getX(i)},${getIndexY(d.altcoinSeasonIndex)}`).join(' ');
  const marketCapLinePoints = chartData.map((d, i) => `${getX(i)},${getMarketCapY(d.altcoinMarketCap)}`).join(' ');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-600">{error || 'Veri yüklenirken bir hata oluştu.'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>DM Altcoin Sezonu Endeksi | Dijital Marketim</title>
        <meta name="description" content="DM Altcoin Sezonu Endeksi - Kripto para piyasasındaki altcoin sezonunu takip edin" />
      </Head>
      <Navbar />

      <div className="w-full">
        {/* Header */}
        <div className="w-full px-4 py-8 bg-white border-b border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">DM Altcoin Sezonu Endeksi</h1>
          <p className="text-gray-600 max-w-4xl">
            DM Altcoin Sezonu Endeksi sayfası, son 90 günde en iyi 100 altcoinin Bitcoin&apos;e göre performansına dayalı olarak 
            kripto para piyasasının şu anda Altcoin Sezonu&apos;nda olup olmadığına dair gerçek zamanlı bilgiler sağlar. 
            Piyasa trendlerini ve altcoin hakimiyetini takip etmek için detaylı grafikler ve metrikler içerir.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="w-full px-4 mb-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Current Index Status */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">DM Altcoin Sezonu Endeksi</h2>
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-gray-900 mb-2">{data.currentValue}</div>
                  <div className="text-lg font-semibold" style={{ color: getClassificationColor(data.currentClassification) }}>
                    {getClassificationText(data.currentClassification)}
                  </div>
                </div>
                {/* Horizontal Gauge */}
                <div className="relative mt-4">
                  <div className="relative h-10 rounded-full overflow-hidden">
                    <div className="absolute inset-0 flex">
                      <div className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400"></div>
                      <div className="flex-1 bg-gradient-to-r from-orange-400 to-blue-400"></div>
                      <div className="flex-1 bg-gradient-to-r from-blue-400 to-blue-500"></div>
                    </div>
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
                      style={{ left: `${data.currentValue}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>Bitcoin Sezonu</span>
                    <span>Altcoin Sezonu</span>
                  </div>
                </div>
              </div>

              {/* Historical Values */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Geçmiş Değerler</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Dün</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{getClassificationText(data.historicalValues.yesterday.classification)}</span>
                      <span className="text-gray-600 ml-2">- {data.historicalValues.yesterday.value}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Geçen Hafta</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{getClassificationText(data.historicalValues.lastWeek.classification)}</span>
                      <span className="text-gray-600 ml-2">- {data.historicalValues.lastWeek.value}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Geçen Ay</span>
                    <div className="text-right">
                      <span className="font-semibold text-gray-900">{getClassificationText(data.historicalValues.lastMonth.classification)}</span>
                      <span className="text-gray-600 ml-2">- {data.historicalValues.lastMonth.value}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yearly High and Low */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Yıllık Yüksek ve Düşük</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Yıllık Yüksek</div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {new Date(data.yearlyPerformance.high.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">{getClassificationText(data.yearlyPerformance.high.classification)}</span>
                        <span className="text-gray-600 ml-2">- {data.yearlyPerformance.high.value}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Yıllık Düşük</div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {new Date(data.yearlyPerformance.low.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">{getClassificationText(data.yearlyPerformance.low.classification)}</span>
                        <span className="text-gray-600 ml-2">- {data.yearlyPerformance.low.value}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Chart */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-xl p-6 relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Altcoin Sezonu Endeksi Grafiği</h2>
                  <div className="flex gap-1">
                    {[
                      { key: '1M', label: '1A' },
                      { key: '3M', label: '3A' },
                      { key: '6M', label: '6A' },
                      { key: 'YTD', label: 'YTD' },
                      { key: '1Y', label: '1Y' },
                      { key: 'All', label: 'Tümü' },
                    ].map((timeframe) => (
                      <button
                        key={timeframe.key}
                        onClick={() => setSelectedTimeframe(timeframe.key)}
                        className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                          selectedTimeframe === timeframe.key
                            ? 'bg-[#2563EB] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {timeframe.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="w-full overflow-x-auto relative">
                  <svg 
                    width={chartWidth} 
                    height={chartHeight} 
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                    className="w-full h-auto"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      
                      let closestIndex = 0;
                      let minDistance = Infinity;
                      chartData.forEach((d, i) => {
                        const dataX = getX(i);
                        const distance = Math.abs(x - dataX);
                        if (distance < minDistance) {
                          minDistance = distance;
                          closestIndex = i;
                        }
                      });
                      
                      const point = chartData[closestIndex];
                      const pointX = getX(closestIndex);
                      const pointY = getIndexY(point.altcoinSeasonIndex);
                      
                      setTooltipData({
                        x: pointX,
                        y: pointY,
                        value: point.altcoinSeasonIndex,
                        date: point.date,
                      });
                    }}
                    onMouseLeave={() => setTooltipData(null)}
                    onClick={(e) => {
                      if (!isFullscreen) {
                        setIsFullscreen(true);
                      }
                    }}
                  >
                    <defs>
                      {/* Glowing green line gradient */}
                      <linearGradient id="altcoinLineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
                      </linearGradient>
                      {/* Area gradient fill */}
                      <linearGradient id="altcoinAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                      </linearGradient>
                      {/* Glow filter */}
                      <filter id="altcoinGlow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    {/* White background */}
                    <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight} fill="#FFFFFF" />
                    
                    {/* Subtle grid lines */}
                    {[0, 25, 50, 75, 100].map((value) => {
                      const y = getIndexY(value);
                      return (
                        <g key={value}>
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={paddingLeft + plotWidth}
                            y2={y}
                            stroke="#E5E7EB"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                            opacity="0.5"
                          />
                          <text
                            x={paddingLeft - 10}
                            y={y + 4}
                            textAnchor="end"
                            className="text-xs fill-gray-600 font-medium"
                          >
                            {value}
                          </text>
                        </g>
                      );
                    })}

                    {/* X-axis line */}
                    <line
                      x1={paddingLeft}
                      y1={paddingTop + plotHeight}
                      x2={paddingLeft + plotWidth}
                      y2={paddingTop + plotHeight}
                      stroke="#E5E7EB"
                      strokeWidth="2"
                    />

                    {/* X-axis labels */}
                    {chartData.map((d, i) => {
                      const labelCount = 8;
                      if (i % Math.ceil(chartData.length / labelCount) !== 0 && i !== chartData.length - 1) return null;
                      const x = getX(i);
                      const date = new Date(d.date);
                      const dateStr = `${date.getDate()} ${date.toLocaleDateString('tr-TR', { month: 'short' })}${selectedTimeframe === 'All' || selectedTimeframe === '1Y' ? ' ' + date.getFullYear() : ''}`;
                      return (
                        <g key={i}>
                          <line
                            x1={x}
                            y1={paddingTop + plotHeight}
                            x2={x}
                            y2={paddingTop + plotHeight + 5}
                            stroke="#9CA3AF"
                            strokeWidth="1"
                          />
                          <text
                            x={x}
                            y={paddingTop + plotHeight + 20}
                            textAnchor="middle"
                            className="text-xs fill-gray-600 font-medium"
                          >
                            {dateStr}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area fill with gradient */}
                    <path
                      d={`M ${paddingLeft} ${paddingTop + plotHeight} ${chartData.map((d, i) => {
                        const x = getX(i);
                        const y = getIndexY(d.altcoinSeasonIndex);
                        return `L ${x} ${y}`;
                      }).join(' ')} L ${paddingLeft + plotWidth} ${paddingTop + plotHeight} Z`}
                      fill="url(#altcoinAreaGradient)"
                    />

                    {/* Glowing green line */}
                    <polyline
                      points={indexLinePoints}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#altcoinGlow)"
                    />

                    {/* Interactive point indicator */}
                    {tooltipData && (
                      <g>
                        <circle
                          cx={tooltipData.x}
                          cy={tooltipData.y}
                          r="6"
                          fill="#10B981"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                          filter="url(#altcoinGlow)"
                        />
                        <line
                          x1={tooltipData.x}
                          y1={paddingTop}
                          x2={tooltipData.x}
                          y2={paddingTop + plotHeight}
                          stroke="#10B981"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                          opacity="0.5"
                        />
                      </g>
                    )}

                    {/* Current value indicator */}
                    <circle
                      cx={getX(chartData.length - 1)}
                      cy={getIndexY(data.currentValue)}
                      r="6"
                      fill="#10B981"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      filter="url(#altcoinGlow)"
                    />
                  </svg>
                  
                  {/* Interactive Tooltip */}
                  {tooltipData && (
                    <div
                      className="absolute bg-white border border-gray-300 rounded-lg p-3 shadow-xl pointer-events-none z-10"
                      style={{
                        left: `${(tooltipData.x / chartWidth) * 100}%`,
                        top: `${((tooltipData.y - 30) / chartHeight) * 100}%`,
                        transform: 'translate(-50%, -100%)',
                      }}
                    >
                      <div className="text-xs text-gray-600 mb-1">
                        {new Date(tooltipData.date).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {tooltipData.value}
                      </div>
                    </div>
                  )}
                  
                  {/* Fullscreen button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullscreen(true);
                    }}
                    className="absolute bottom-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors z-10"
                    title="Tam Ekran"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-6 mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#10B981] rounded shadow-sm"></div>
                    <span className="text-gray-700 font-medium">Altcoin Sezonu Endeksi</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Fullscreen Modal */}
            {isFullscreen && (
              <div 
                className="fixed inset-0 bg-white z-50 flex items-center justify-center p-8"
                onClick={() => setIsFullscreen(false)}
              >
                <div className="w-full h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Altcoin Sezonu Endeksi Grafiği - Tam Ekran</h2>
                    <button
                      onClick={() => setIsFullscreen(false)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex-1 relative">
                    <svg 
                      width="100%" 
                      height="100%" 
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      preserveAspectRatio="xMidYMid meet"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        let closestIndex = 0;
                        let minDistance = Infinity;
                        chartData.forEach((d, i) => {
                          const dataX = getX(i);
                          const distance = Math.abs(x - dataX);
                          if (distance < minDistance) {
                            minDistance = distance;
                            closestIndex = i;
                          }
                        });
                        
                        const point = chartData[closestIndex];
                        const pointX = getX(closestIndex);
                        const pointY = getIndexY(point.altcoinSeasonIndex);
                        
                        setTooltipData({
                          x: pointX,
                          y: pointY,
                          value: point.altcoinSeasonIndex,
                          date: point.date,
                        });
                      }}
                      onMouseLeave={() => setTooltipData(null)}
                    >
                      <defs>
                        <linearGradient id="altcoinLineGradientFull" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
                        </linearGradient>
                        <linearGradient id="altcoinAreaGradientFull" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                        <filter id="altcoinGlowFull">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight} fill="#FFFFFF" />
                      
                      {[0, 25, 50, 75, 100].map((value) => {
                        const y = getIndexY(value);
                        return (
                          <g key={value}>
                            <line
                              x1={paddingLeft}
                              y1={y}
                              x2={paddingLeft + plotWidth}
                              y2={y}
                              stroke="#E5E7EB"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                              opacity="0.5"
                            />
                            <text
                              x={paddingLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="text-xs fill-gray-600 font-medium"
                            >
                              {value}
                            </text>
                          </g>
                        );
                      })}
                      
                      <line
                        x1={paddingLeft}
                        y1={paddingTop + plotHeight}
                        x2={paddingLeft + plotWidth}
                        y2={paddingTop + plotHeight}
                        stroke="#E5E7EB"
                        strokeWidth="2"
                      />
                      
                      {chartData.map((d, i) => {
                        const labelCount = 8;
                        if (i % Math.ceil(chartData.length / labelCount) !== 0 && i !== chartData.length - 1) return null;
                        const x = getX(i);
                        const date = new Date(d.date);
                        const dateStr = `${date.getDate()} ${date.toLocaleDateString('tr-TR', { month: 'short' })}${selectedTimeframe === 'All' || selectedTimeframe === '1Y' ? ' ' + date.getFullYear() : ''}`;
                        return (
                          <g key={i}>
                            <line
                              x1={x}
                              y1={paddingTop + plotHeight}
                              x2={x}
                              y2={paddingTop + plotHeight + 5}
                              stroke="#9CA3AF"
                              strokeWidth="1"
                            />
                            <text
                              x={x}
                              y={paddingTop + plotHeight + 20}
                              textAnchor="middle"
                              className="text-xs fill-gray-600 font-medium"
                            >
                              {dateStr}
                            </text>
                          </g>
                        );
                      })}
                      
                      <path
                        d={`M ${paddingLeft} ${paddingTop + plotHeight} ${chartData.map((d, i) => {
                          const x = getX(i);
                          const y = getIndexY(d.altcoinSeasonIndex);
                          return `L ${x} ${y}`;
                        }).join(' ')} L ${paddingLeft + plotWidth} ${paddingTop + plotHeight} Z`}
                        fill="url(#altcoinAreaGradientFull)"
                      />
                      
                      <polyline
                        points={indexLinePoints}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#altcoinGlowFull)"
                      />
                      
                      {tooltipData && (
                        <g>
                          <circle
                            cx={tooltipData.x}
                            cy={tooltipData.y}
                            r="6"
                            fill="#10B981"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                            filter="url(#altcoinGlowFull)"
                          />
                          <line
                            x1={tooltipData.x}
                            y1={paddingTop}
                            x2={tooltipData.x}
                            y2={paddingTop + plotHeight}
                            stroke="#10B981"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.5"
                          />
                        </g>
                      )}
                      
                      <circle
                        cx={getX(chartData.length - 1)}
                        cy={getIndexY(data.currentValue)}
                        r="6"
                        fill="#10B981"
                        stroke="#FFFFFF"
                        strokeWidth="2"
                        filter="url(#altcoinGlowFull)"
                      />
                    </svg>
                    
                    {tooltipData && (
                      <div
                        className="absolute bg-white border border-gray-300 rounded-lg p-3 shadow-xl pointer-events-none"
                        style={{
                          left: `${(tooltipData.x / chartWidth) * 100}%`,
                          top: `${((tooltipData.y - 30) / chartHeight) * 100}%`,
                          transform: 'translate(-50%, -100%)',
                        }}
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          {new Date(tooltipData.date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {tooltipData.value}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top 100 Performance Section */}
        <div className="w-full px-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Son 90 Günde En İyi 100 Coinin Performansı</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {data.top100Performance.map((coin, index) => {
                const isPositive = coin.priceChange90d >= 0;
                const barWidth = Math.min(100, Math.abs(coin.priceChange90d) / 10);
                return (
                  <div key={coin.id} className="flex items-center gap-4 py-2 border-b border-gray-100 last:border-0">
                    <div className="w-8 text-sm text-gray-500 font-medium">{index + 1}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900">{coin.symbol}</span>
                          {coin.isBitcoin && (
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-semibold rounded">
                              BTC
                            </span>
                          )}
                        </div>
                        <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{coin.priceChange90d.toFixed(2)}%
                        </span>
                      </div>
                      <div className="relative h-6 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`absolute left-0 top-0 h-full ${coin.isBitcoin ? 'bg-orange-500' : isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="w-full px-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">DM Altcoin Sezonu Endeksi Hakkında</h2>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'what-is' ? null : 'what-is')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">DM Altcoin Sezonu Endeksi Nedir?</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'what-is' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === 'what-is' && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">
                      DM Altcoin Sezonu Endeksi, son 90 günde en iyi 100 altcoinin Bitcoin&apos;e göre performansını ölçen bir göstergedir. 
                      Endeks, 0 ile 100 arasında değer alır. 50&apos;nin altı Bitcoin Sezonu, 50&apos;nin üstü Altcoin Sezonu olarak kabul edilir.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'how-tell' ? null : 'how-tell')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">Altcoin Sezonu Olduğunu Nasıl Anlarım?</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'how-tell' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === 'how-tell' && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">
                      Endeks değeri 50&apos;nin üzerine çıktığında Altcoin Sezonu başlamış demektir. Bu, altcoinlerin Bitcoin&apos;den daha iyi performans gösterdiği anlamına gelir. 
                      Endeks 75&apos;in üzerine çıktığında güçlü bir Altcoin Sezonu yaşanıyor demektir.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'which-altcoins' ? null : 'which-altcoins')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">Bu Endekste Hangi Altcoinler Kullanılıyor? Ethereum Bir Altcoin Mi?</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'which-altcoins' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === 'which-altcoins' && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">
                      Endeks, piyasa değerine göre en büyük 100 kripto parayı kullanır. Bitcoin hariç tüm coinler altcoin olarak kabul edilir, 
                      bu yüzden Ethereum, Binance Coin, Solana ve diğer tüm Bitcoin dışı coinler altcoin kategorisindedir.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'methodology' ? null : 'methodology')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">Endeks Metodolojisi Nedir?</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'methodology' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === 'methodology' && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">
                      Endeks, son 90 günde en iyi 100 coinin Bitcoin&apos;e göre performansını hesaplar. 
                      Bitcoin&apos;den daha iyi performans gösteren altcoinlerin yüzdesi hesaplanır ve 0-100 arası bir değere dönüştürülür.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'how-use' ? null : 'how-use')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">Bu Bilgiyi Nasıl Kullanabilirim?</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'how-use' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === 'how-use' && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">
                      Altcoin Sezonu sırasında altcoinlere yatırım yapmak daha karlı olabilir. Bitcoin Sezonu sırasında ise Bitcoin&apos;e odaklanmak mantıklı olabilir. 
                      Ancak bu endeks sadece bir göstergedir ve yatırım tavsiyesi değildir.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 py-12">
          <div className="w-full">
            {/* Üst Kısım - Logo ve Açıklama */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
              {/* Sol Taraf - Logo ve Açıklama */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Image 
                    src={logoImage}
                    alt="Dijital Market Logo" 
                    height={64}
                    width={250}
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Dijital Marketim, kripto piyasasına dair temel bir analiz sağlar. Dijital Marketim; fiyatı, hacmi ve piyasa değerini takip etmenin yanı sıra topluluk büyümesini, açık kaynak kod geliştirmeyi, önemli olayları ve zincir üstü metrikleri takip eder.
                </p>
              </div>

              {/* Sağ Taraf - Link Sütunları */}
              <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* Kaynaklar */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Kaynaklar</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto Haberleri</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto Para Hazine Rezervleri</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto Isı Haritası</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto API&apos;si</a>
                    </li>
                  </ul>
                </div>

                {/* Destek */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Destek</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">İletişim Formu</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Reklam</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Şeker Ödülleri Listelemesi</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Yardım Merkezi</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Hata Ödülü</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">SSS</a>
                    </li>
                  </ul>
                </div>

                {/* Cripto Hakkında */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Cripto Hakkında</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Hakkımızda</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-green-600 hover:text-green-700 transition-colors font-semibold">Kariyer <span className="text-xs">(Bize Katılın)</span></a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Markalama Rehberi</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Metodoloji</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Feragatname</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Hizmet Koşulları</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Gizlilik Politikası</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Reklam Politikası</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Çerez Tercihleri</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Güven Merkezi</a>
                    </li>
                  </ul>
                </div>

                {/* Topluluk */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Topluluk</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">X/Twitter</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Telegram Sohbeti</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Telegram Haberleri</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Instagram</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Reddit</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Discord</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Facebook</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">YouTube</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">TikTok</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bülten Aboneliği */}
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Kripto paralar hakkında devamlı güncel bilgiye sahip olmak ister misiniz?
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ücretsiz bültenimize abone olarak en son kripto para haberlerini, güncellemeleri ve raporları alın.
                  </p>
                </div>
                <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
                  Abone Ol
                </button>
              </div>
            </div>

            {/* Alt Kısım - Copyright ve App Store */}
            <div className="border-t border-gray-200 pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="text-sm text-gray-600">
                  © 2025 Cripto. All Rights Reserved.
                </div>
              </div>

              {/* Önemli Uyarı */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-bold text-gray-900 mb-2">ÖNEMLİ UYARI</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Bu web sitesinde, bağlantılı sitelerde, uygulamalarda, forumlarda, bloglarda, sosyal medya hesaplarında ve diğer platformlarda (birlikte &quot;Site&quot;) yer alan içerikler, yalnızca genel bilgilendirme amaçlıdır ve üçüncü taraflardan kaynaklanmaktadır. Bu içeriklerin doğruluğu, eksiksizliği, güncelliği veya güvenilirliği konusunda hiçbir garanti verilmemektedir. Herhangi bir yatırım kararı vermeden önce, kendi araştırmanızı yapmanız ve bağımsız profesyonel tavsiye almanız önerilir. Ticaret risklidir ve kayıplar meydana gelebilir. Bu sitede yer alan hiçbir içerik, teşvik, tavsiye veya teklif niteliği taşımamaktadır.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AltcoinSeasonPage;
