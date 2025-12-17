import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface TopCoin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface MarketOverviewData {
  topCoins: TopCoin[];
  fearGreedIndex: number;
  fearGreedLabel: string;
  altcoinSeasonIndex: number;
  altcoinSeasonLabel: string;
  cmc20Index: number;
  cmc20Change: number;
  totalMarketCap: number;
  totalVolume: number;
  marketCapHistory: Array<{ date: string; value: number }>;
  volumeHistory: Array<{ date: string; value: number }>;
  etfNetFlow: Array<{ date: string; value: number }>;
  bitcoinDominance: number;
  ethereumDominance: number;
  othersDominance: number;
  openInterestPerpetuals: number;
  openInterestFutures: number;
  btcImpliedVolatility: number;
  ethImpliedVolatility: number;
  ethGasSlow: number;
  ethGasStandard: number;
  ethGasFast: number;
  ethGasChange: number;
}

const MarketOverview: React.FC = () => {
  const [data, setData] = useState<MarketOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');
  const [selectedTab, setSelectedTab] = useState<string>('Overview');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/market-overview');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching market overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPercentageColor = (value: number): string => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPercentageArrow = (value: number): string => {
    return value >= 0 ? '▲' : '▼';
  };

  // Fear & Greed Index Gauge
  const getFearGreedColor = (index: number): string => {
    if (index < 20) return '#EF4444'; // Extreme Fear
    if (index < 40) return '#F97316'; // Fear
    if (index < 60) return '#FBBF24'; // Neutral
    if (index < 80) return '#10B981'; // Greed
    return '#059669'; // Extreme Greed
  };

  const getFearGreedAngle = (index: number): number => {
    return (index / 100) * 360 - 90; // -90 to start from top
  };

  // Chart calculations
  const getFilteredHistory = () => {
    if (!data) return { marketCap: [], volume: [], etf: [] };
    
    const all = data.marketCapHistory.length;
    let count = 30;
    if (selectedTimeframe === '1y') count = Math.min(365, all);
    else if (selectedTimeframe === 'All') count = all;
    
    const start = all - count;
    return {
      marketCap: data.marketCapHistory.slice(start),
      volume: data.volumeHistory.slice(start),
      etf: data.etfNetFlow.slice(start),
    };
  };

  const history = getFilteredHistory();

  // Market Cap Chart
  const marketCapChartWidth = 1200;
  const marketCapChartHeight = 400;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 40;
  const paddingBottom = 80;
  const plotWidth = marketCapChartWidth - paddingLeft - paddingRight;
  const plotHeight = marketCapChartHeight - paddingTop - paddingBottom;

  const marketCapValues = history.marketCap.map(d => d.value);
  const marketCapMax = Math.max(...marketCapValues, 1);
  const marketCapMin = Math.min(...marketCapValues, marketCapMax * 0.8);
  const marketCapRange = marketCapMax - marketCapMin || 1;

  const getMarketCapX = (index: number) => paddingLeft + (index / (history.marketCap.length - 1 || 1)) * plotWidth;
  const getMarketCapY = (value: number) => paddingTop + plotHeight - ((value - marketCapMin) / marketCapRange) * plotHeight;

  const marketCapLinePoints = history.marketCap.map((d, i) => `${getMarketCapX(i)},${getMarketCapY(d.value)}`).join(' ');

  // Volume bars
  const volumeValues = history.volume.map(d => d.value);
  const volumeMax = Math.max(...volumeValues, 1);
  const getVolumeHeight = (value: number) => (value / volumeMax) * plotHeight * 0.3;

  // ETF Chart
  const etfChartWidth = 1200;
  const etfChartHeight = 300;
  const etfPaddingLeft = 60;
  const etfPaddingRight = 20;
  const etfPaddingTop = 40;
  const etfPaddingBottom = 80;
  const etfPlotWidth = etfChartWidth - etfPaddingLeft - etfPaddingRight;
  const etfPlotHeight = etfChartHeight - etfPaddingTop - etfPaddingBottom;

  const etfValues = history.etf.map(d => d.value);
  const etfMax = Math.max(...etfValues.map(Math.abs), 1);
  const etfMin = -etfMax;
  const etfRange = etfMax - etfMin || 1;
  const etfZeroY = etfPaddingTop + etfPlotHeight - ((0 - etfMin) / etfRange) * etfPlotHeight;

  const getEtfX = (index: number) => etfPaddingLeft + (index / (history.etf.length - 1 || 1)) * etfPlotWidth;
  const getEtfY = (value: number) => {
    if (value >= 0) {
      return etfZeroY - ((value / etfMax) * (etfPlotHeight - (etfZeroY - etfPaddingTop)));
    } else {
      return etfZeroY + ((Math.abs(value) / etfMax) * (etfZeroY - etfPaddingTop));
    }
  };

  // Bitcoin Dominance Pie Chart
  const pieRadius = 100;
  const pieCenterX = 150;
  const pieCenterY = 150;

  const createPiePath = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): string => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + radius * Math.cos(startAngleRad);
    const y1 = centerY + radius * Math.sin(startAngleRad);
    const x2 = centerX + radius * Math.cos(endAngleRad);
    const y2 = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  let currentAngle = -90;
  const pieSegments = data ? [
    { name: 'Bitcoin', value: data.bitcoinDominance, color: '#F7931A' },
    { name: 'Ethereum', value: data.ethereumDominance, color: '#627EEA' },
    { name: 'Others', value: data.othersDominance, color: '#9CA3AF' },
  ].map((segment) => {
    const angle = (segment.value / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const path = createPiePath(pieCenterX, pieCenterY, pieRadius, startAngle, endAngle);
    currentAngle = endAngle;
    return { ...segment, path };
  }) : [];

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

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-600">Veri yüklenirken bir hata oluştu.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Kripto Piyasa Genel Bakış | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full py-8">
        {/* Header */}
        <div className="w-full px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Kripto Piyasa Genel Bakış</h1>
            <button className="px-4 py-2 bg-[#2563EB] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition-colors">
              API Detaylarını Gör
            </button>
          </div>
          <p className="text-gray-600 text-base">
            En son kripto para piyasası trendlerini, Bitcoin hakimiyetini, altcoin sezonunu, ETF net akışlarını ve 
            gerçek zamanlı piyasa hissiyatını tek bir yerde takip edin - Dijital Marketim&apos;de.
          </p>
        </div>

        {/* Top 5 Cryptocurrencies */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {data.topCoins.map((coin) => {
              const sparkline = coin.sparkline_in_7d?.price || [];
              const sparklinePoints = sparkline.map((price, i) => {
                const x = (i / (sparkline.length - 1 || 1)) * 100;
                const minPrice = Math.min(...sparkline);
                const maxPrice = Math.max(...sparkline);
                const range = maxPrice - minPrice || 1;
                const y = 40 - ((price - minPrice) / range) * 30;
                return `${x},${y}`;
              }).join(' ');

              return (
                <div key={coin.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-2 mb-3">
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span className="font-semibold text-gray-900">{coin.symbol.toUpperCase()}</span>
                  </div>
                  <div className="mb-3">
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(coin.current_price)}</div>
                    <div className={`text-sm font-semibold flex items-center gap-1 ${getPercentageColor(coin.price_change_percentage_24h)}`}>
                      <span>{getPercentageArrow(coin.price_change_percentage_24h)}</span>
                      {formatPercentage(coin.price_change_percentage_24h)}
                    </div>
                  </div>
                  <div className="h-12 w-full">
                    <svg viewBox="0 0 100 40" className="w-full h-full">
                      <polyline
                        points={sparklinePoints}
                        fill="none"
                        stroke={coin.price_change_percentage_24h >= 0 ? '#10B981' : '#EF4444'}
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Indicators Grid */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Fear & Greed Index */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Korku ve Açgözlülük Endeksi</h3>
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-40 h-40">
                  <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                    {[0, 20, 40, 60, 80, 100].map((val, i) => {
                      if (i === 0) return null;
                      const startAngle = ((i - 1) * 20 / 100) * 360 - 90;
                      const endAngle = (i * 20 / 100) * 360 - 90;
                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      const x1 = 80 + 70 * Math.cos(startRad);
                      const y1 = 80 + 70 * Math.sin(startRad);
                      const x2 = 80 + 70 * Math.cos(endRad);
                      const y2 = 80 + 70 * Math.sin(endRad);
                      const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                      const color = getFearGreedColor(val);
                      const isActive = data.fearGreedIndex >= val - 20 && data.fearGreedIndex < val;
                      return (
                        <path
                          key={i}
                          d={`M 80 80 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`}
                          fill={color}
                          opacity={isActive ? 1 : 0.2}
                        />
                      );
                    })}
                    <line
                      x1="80"
                      y1="80"
                      x2={80 + 60 * Math.cos((getFearGreedAngle(data.fearGreedIndex) * Math.PI) / 180)}
                      y2={80 + 60 * Math.sin((getFearGreedAngle(data.fearGreedIndex) * Math.PI) / 180)}
                      stroke="#000"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center transform rotate-90">
                      <div className="text-3xl font-bold" style={{ color: getFearGreedColor(data.fearGreedIndex) }}>
                        {data.fearGreedIndex}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{data.fearGreedLabel}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Altcoin Season Index */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Altcoin Sezonu Endeksi</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-3">{data.altcoinSeasonIndex}/100</div>
                <div className="text-sm font-semibold text-orange-600">
                  {data.altcoinSeasonIndex < 50 ? 'Bitcoin Sezonu' : 'Altcoin Sezonu'}
                </div>
              </div>
            </div>

            {/* CMC20 Index */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Dijital Market 20 Endeksi</h3>
              <div className="mb-2">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.cmc20Index)}</div>
                <div className={`text-sm font-semibold flex items-center gap-1 ${getPercentageColor(data.cmc20Change)}`}>
                  <span>{getPercentageArrow(data.cmc20Change)}</span>
                  {formatPercentage(data.cmc20Change)}
                </div>
              </div>
              <div className="h-12 w-full mt-3">
                <svg viewBox="0 0 100 40" className="w-full h-full">
                  <polyline
                    points="0,30 10,25 20,20 30,18 40,15 50,12 60,10 70,8 80,10 90,12 100,10"
                    fill="none"
                    stroke={data.cmc20Change >= 0 ? '#10B981' : '#EF4444'}
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* Open Interest */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Açık Pozisyon</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Perpetuals</div>
                  <div className="text-xl font-bold text-gray-900">{formatCurrency(data.openInterestPerpetuals)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Futures</div>
                  <div className="text-xl font-bold text-gray-900">{formatCurrency(data.openInterestFutures)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid - Market Cap and ETF */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Cap Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Kripto Piyasa Değeri</h2>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedTab('Overview')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      selectedTab === 'Overview'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Genel Bakış
                  </button>
                  <button
                    onClick={() => setSelectedTab('Breakdown')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      selectedTab === 'Breakdown'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Dağılım
                  </button>
                  {['30d', '1y', 'All'].map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        selectedTimeframe === timeframe
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4 flex gap-6">
                <div>
                  <div className="text-sm text-gray-600">Piyasa Değeri</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalMarketCap)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Hacim</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalVolume)}</div>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <svg width={marketCapChartWidth} height={marketCapChartHeight} viewBox={`0 0 ${marketCapChartWidth} ${marketCapChartHeight}`} className="w-full h-auto">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = paddingTop + plotHeight - (ratio * plotHeight);
                    const value = marketCapMin + marketCapRange * (1 - ratio);
                    return (
                      <g key={ratio}>
                        <line
                          x1={paddingLeft}
                          y1={y}
                          x2={paddingLeft + plotWidth}
                          y2={y}
                          stroke="#E5E7EB"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={paddingLeft - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="text-xs fill-gray-600 font-medium"
                        >
                          {formatCurrency(value)}
                        </text>
                      </g>
                    );
                  })}
                  
                  <line
                    x1={paddingLeft}
                    y1={paddingTop + plotHeight}
                    x2={paddingLeft + plotWidth}
                    y2={paddingTop + plotHeight}
                    stroke="#D1D5DB"
                    strokeWidth="2"
                  />
                  
                  {history.marketCap.map((d, i) => {
                    if (i % Math.ceil(history.marketCap.length / 6) !== 0 && i !== history.marketCap.length - 1) return null;
                    const x = getMarketCapX(i);
                    const date = new Date(d.date);
                    const dateStr = `${date.getDate()} ${date.toLocaleDateString('tr-TR', { month: 'short' })}`;
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
                  
                  <polyline
                    points={marketCapLinePoints}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {history.volume.map((d, i) => {
                    const x = getMarketCapX(i);
                    const barWidth = plotWidth / history.volume.length;
                    const height = getVolumeHeight(d.value);
                    return (
                      <rect
                        key={i}
                        x={x - barWidth / 2}
                        y={paddingTop + plotHeight - height}
                        width={barWidth * 0.8}
                        height={height}
                        fill="#9CA3AF"
                        opacity="0.3"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* ETF Net Flow Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Kripto ETF Net Akışı</h2>
                <div className="flex gap-2 flex-wrap">
                  <button className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    30d
                  </button>
                  <button className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    1y
                  </button>
                  <button className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    Daha Fazla
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <div className={`text-2xl font-bold ${getPercentageColor(history.etf[history.etf.length - 1]?.value || 0)}`}>
                  {formatCurrency(history.etf[history.etf.length - 1]?.value || 0)}
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(history.etf[history.etf.length - 1]?.date || '').toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <svg width={etfChartWidth} height={etfChartHeight} viewBox={`0 0 ${etfChartWidth} ${etfChartHeight}`} className="w-full h-auto">
                  {[-1, -0.5, 0, 0.5, 1].map((ratio) => {
                    const y = etfPaddingTop + etfPlotHeight - ((ratio + 1) / 2) * etfPlotHeight;
                    const value = etfMin + etfRange * ((ratio + 1) / 2);
                    return (
                      <g key={ratio}>
                        <line
                          x1={etfPaddingLeft}
                          y1={y}
                          x2={etfPaddingLeft + etfPlotWidth}
                          y2={y}
                          stroke="#E5E7EB"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={etfPaddingLeft - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="text-xs fill-gray-600 font-medium"
                        >
                          {formatCurrency(value)}
                        </text>
                      </g>
                    );
                  })}
                  
                  <line
                    x1={etfPaddingLeft}
                    y1={etfZeroY}
                    x2={etfPaddingLeft + etfPlotWidth}
                    y2={etfZeroY}
                    stroke="#D1D5DB"
                    strokeWidth="2"
                  />
                  
                  {history.etf.map((d, i) => {
                    if (i % Math.ceil(history.etf.length / 6) !== 0 && i !== history.etf.length - 1) return null;
                    const x = getEtfX(i);
                    const date = new Date(d.date);
                    const dateStr = `${date.getDate()} ${date.toLocaleDateString('tr-TR', { month: 'short' })}`;
                    return (
                      <g key={i}>
                        <line
                          x1={x}
                          y1={etfPaddingTop + etfPlotHeight}
                          x2={x}
                          y2={etfPaddingTop + etfPlotHeight + 5}
                          stroke="#9CA3AF"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={etfPaddingTop + etfPlotHeight + 20}
                          textAnchor="middle"
                          className="text-xs fill-gray-600 font-medium"
                        >
                          {dateStr}
                        </text>
                      </g>
                    );
                  })}
                  
                  {history.etf.map((d, i) => {
                    const x = getEtfX(i);
                    const barWidth = etfPlotWidth / history.etf.length;
                    const y = getEtfY(d.value);
                    const height = Math.abs(y - etfZeroY);
                    return (
                      <rect
                        key={i}
                        x={x - barWidth / 2}
                        y={d.value >= 0 ? etfZeroY - height : etfZeroY}
                        width={barWidth * 0.8}
                        height={height}
                        fill={d.value >= 0 ? '#F97316' : '#2563EB'}
                        opacity="0.7"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Bitcoin Dominance & Other Widgets */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Bitcoin Dominance */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Bitcoin Hakimiyeti</h3>
              <div className="flex items-center justify-center mb-4">
                <svg width="200" height="200" viewBox="0 0 300 300">
                  {pieSegments.map((segment, index) => (
                    <path
                      key={index}
                      d={segment.path}
                      fill={segment.color}
                      stroke="#fff"
                      strokeWidth="2"
                      className="hover:opacity-80 transition-opacity cursor-pointer"
                    />
                  ))}
                </svg>
              </div>
              <div className="space-y-2">
                {pieSegments.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-sm text-gray-700">{segment.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{segment.value.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Volmex Implied Volatility */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Volmex Örtük Volatilite</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Bitcoin</div>
                  <div className="text-2xl font-bold text-gray-900">{data.btcImpliedVolatility.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Ethereum</div>
                  <div className="text-2xl font-bold text-gray-900">{data.ethImpliedVolatility.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* ETH Gas */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">ETH Gas</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Düşük</div>
                  <div className="text-lg font-bold text-gray-900">{data.ethGasSlow.toFixed(2)} Gwei</div>
                  <div className="text-xs text-gray-500">(~43 sn)</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Standart</div>
                  <div className="text-lg font-bold text-gray-900">{data.ethGasStandard.toFixed(2)} Gwei</div>
                  <div className="text-xs text-gray-500">(~45 sn)</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Hızlı</div>
                  <div className="text-lg font-bold text-gray-900">{data.ethGasFast.toFixed(2)} Gwei</div>
                  <div className="text-xs text-gray-500">(~49 sn)</div>
                </div>
              </div>
            </div>

            {/* Placeholder */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Piyasa Metrikleri</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Toplam Piyasa Değeri</div>
                  <div className="text-xl font-bold text-gray-900">{formatCurrency(data.totalMarketCap)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">24s Hacim</div>
                  <div className="text-xl font-bold text-gray-900">{formatCurrency(data.totalVolume)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full px-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sık Sorulan Sorular</h2>
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 0 ? null : 0)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  Canlı piyasa verilerine API üzerinden erişebilir miyim?
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedFAQ === 0 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFAQ === 0 && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 mb-4">
                    Evet, Dijital Marketim API&apos;si ile canlı piyasa verilerine erişebilirsiniz. API endpoint&apos;imiz:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <code className="text-sm text-gray-800">
                      GET https://pro-api.dijitalmarketim.com/v1/global-metrics/quotes/latest
                    </code>
                  </div>
                  <p className="text-gray-600 mb-2 font-semibold">Parametreler:</p>
                  <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
                    <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">convert</code> (opsiyonel): Para birimi (örn: USD, EUR)</li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded text-sm">convert_id</code> (opsiyonel): Para birimi ID&apos;si</li>
                  </ul>
                  <p className="text-gray-600 mb-2 font-semibold">Mevcut API Planları:</p>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {['Basic', 'Hobbyist', 'Standard', 'Professional', 'Enterprise'].map((plan) => (
                      <div key={plan} className="bg-[#2563EB] text-white rounded-lg p-3 text-center text-sm font-semibold">
                        {plan}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 1 ? null : 1)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  Geçmiş piyasa verilerine API üzerinden erişebilir miyim?
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedFAQ === 1 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFAQ === 1 && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600">
                    Evet, Dijital Marketim API&apos;si ile geçmiş piyasa verilerine de erişebilirsiniz. 
                    Tarih aralığı belirterek istediğiniz dönemin verilerini çekebilirsiniz.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Research Articles */}
        <div className="w-full px-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Dijital Marketim Araştırma Makaleleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Dijital Marketim Q3 2024 Raporu',
                subtitle: 'Dijital Marketim 2024 Q3',
                description: '2024 yılının üçüncü çeyreğinde kripto para piyasasının detaylı analizi, önemli anlatılar ve kullanıcı trendleri, dünya standartlarında kripto verileri ve Dijital Marketim kullanıcı içgörüleriyle bilgilendirilmiş.',
                author: 'Dijital Marketim Araştırma',
                time: '12 dk önce',
              },
              {
                title: 'Dijital Marketim H1 2024 Raporu',
                subtitle: 'Dijital Marketim 2024 H1',
                description: '2024 yılının ilk yarısında kripto para piyasasının detaylı analizi, önemli anlatılar ve kullanıcı trendleri, dünya standartlarında kripto verileri ve Dijital Marketim kullanıcı içgörüleriyle bilgilendirilmiş.',
                author: 'Dijital Marketim Araştırma',
                time: '16 dk önce',
              },
              {
                title: '2024 Yeni Token Listeleme Analizi: Trendler, Zorluklar ve Altcoin Sezonu Endeksi',
                subtitle: '2024 Yeni Token Listeleme Analizi: Trendler, Zorluklar ve Altcoin Sezonu Endeksi',
                description: '2024 yılında büyük 4 borsada yeni listelenen projelerin performansını analiz ediyoruz ve mevcut piyasa hakkında ne söylediğini inceliyoruz.',
                author: 'Dijital Marketim Araştırma',
                time: '5 dk önce',
              },
            ].map((article, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <Image src={logoImage} alt="Dijital Marketim" width={20} height={20} />
                  <span className="text-sm font-semibold text-gray-700">Dijital Marketim</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{article.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{article.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{article.author}</span>
                  <span>{article.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
