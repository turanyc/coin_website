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
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isEtfFullscreen, setIsEtfFullscreen] = useState<boolean>(false);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; value: number; date: string } | null>(null);
  const [etfTooltipData, setEtfTooltipData] = useState<{ x: number; y: number; value: number; date: string } | null>(null);

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

  // Generate OHLC data from market cap history (for candlestick)
  const generateCandlestickData = (values: Array<{ date: string; value: number }>) => {
    return values.map((d, i) => {
      const prevValue = i > 0 ? values[i - 1].value : d.value;
      const nextValue = i < values.length - 1 ? values[i + 1].value : d.value;
      const volatility = Math.abs(d.value - prevValue) * 0.3; // %30 volatility
      
      const open = prevValue;
      const close = d.value;
      const high = Math.max(open, close) + volatility;
      const low = Math.min(open, close) - volatility;
      
      return { ...d, open, high, low, close };
    });
  };

  const marketCapCandles = generateCandlestickData(history.marketCap);
  const etfCandles = generateCandlestickData(history.etf);

  // Market Cap Chart - Candlestick
  const marketCapChartWidth = 1200;
  const marketCapChartHeight = 500;
  const paddingLeft = 90; // Increased for larger y-axis labels
  const paddingRight = 20;
  const paddingTop = 50;
  const paddingBottom = 150; // Increased for larger x-axis labels
  const plotWidth = marketCapChartWidth - paddingLeft - paddingRight;
  const plotHeight = marketCapChartHeight - paddingTop - paddingBottom;
  const volumeHeight = 80; // Volume chart height at bottom

  // For line chart, use actual values instead of OHLC
  const marketCapValues = history.marketCap.map(d => d.value);
  const marketCapMax = Math.max(...marketCapValues, 1);
  const marketCapMin = Math.min(...marketCapValues, marketCapMax * 0.85);
  const marketCapRange = marketCapMax - marketCapMin || 1;

  const getMarketCapX = (index: number) => paddingLeft + (index / (history.marketCap.length - 1 || 1)) * plotWidth;
  const getMarketCapY = (value: number) => paddingTop + plotHeight - volumeHeight - ((value - marketCapMin) / marketCapRange) * (plotHeight - volumeHeight);

  // Volume bars
  const volumeValues = history.volume.map(d => d.value);
  const volumeMax = Math.max(...volumeValues, 1);
  const getVolumeY = (value: number) => paddingTop + plotHeight - ((value / volumeMax) * volumeHeight);

  // ETF Chart - Candlestick
  const etfChartWidth = 1200;
  const etfChartHeight = 500;
  const etfPaddingLeft = 90; // Increased for larger y-axis labels
  const etfPaddingRight = 20;
  const etfPaddingTop = 50;
  const etfPaddingBottom = 150; // Increased for larger x-axis labels
  const etfPlotWidth = etfChartWidth - etfPaddingLeft - etfPaddingRight;
  const etfPlotHeight = etfChartHeight - etfPaddingTop - etfPaddingBottom;
  const etfVolumeHeight = 80;

  const etfHighs = etfCandles.map(d => d.high);
  const etfLows = etfCandles.map(d => d.low);
  const etfMax = Math.max(...etfHighs.map(Math.abs), 1);
  const etfMin = -etfMax;
  const etfRange = etfMax - etfMin || 1;
  const etfZeroY = etfPaddingTop + etfPlotHeight - etfVolumeHeight - ((0 - etfMin) / etfRange) * (etfPlotHeight - etfVolumeHeight);

  const getEtfX = (index: number) => etfPaddingLeft + (index / (etfCandles.length - 1 || 1)) * etfPlotWidth;
  const getEtfY = (value: number) => {
    if (value >= 0) {
      return etfZeroY - ((value / etfMax) * (etfZeroY - etfPaddingTop));
    } else {
      return etfZeroY + ((Math.abs(value) / etfMax) * (etfPaddingTop + etfPlotHeight - etfVolumeHeight - etfZeroY));
    }
  };

  // ETF Volume
  const etfVolumeValues = history.volume.map(d => d.value);
  const etfVolumeMax = Math.max(...etfVolumeValues, 1);

  // Calculate Moving Averages (20-period and 50-period)
  const calculateMA = (data: Array<{ close: number }>, period: number) => {
    return data.map((_, i) => {
      if (i < period - 1) return null;
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.close, 0);
      return sum / period;
    });
  };

  const marketCapMA20 = calculateMA(marketCapCandles, 20);
  const marketCapMA50 = calculateMA(marketCapCandles, 50);
  const etfMA20 = calculateMA(etfCandles, 20);
  const etfMA50 = calculateMA(etfCandles, 50);

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
                      const fearGreedValue = 38; // Sabit değer
                      const isActive = fearGreedValue >= val - 20 && fearGreedValue < val;
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
                      x2={80 + 60 * Math.cos((getFearGreedAngle(38) * Math.PI) / 180)}
                      y2={80 + 60 * Math.sin((getFearGreedAngle(38) * Math.PI) / 180)}
                      stroke="#000"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center transform rotate-90">
                      <div className="text-3xl font-bold transform -rotate-90" style={{ color: getFearGreedColor(38) }}>
                        38
                      </div>
                      <div className="text-xs text-gray-600 mt-1 transform -rotate-90">Fear</div>
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
            {/* Market Cap Chart - Minimalist Line Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 relative">
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
              <div className="w-full overflow-x-auto relative">
                <svg 
                  width={marketCapChartWidth} 
                  height={marketCapChartHeight} 
                  viewBox={`0 0 ${marketCapChartWidth} ${marketCapChartHeight}`} 
                  className="w-full h-auto"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Find closest data point
                    let closestIndex = 0;
                    let minDistance = Infinity;
                    history.marketCap.forEach((d, i) => {
                      const dataX = getMarketCapX(i);
                      const distance = Math.abs(x - dataX);
                      if (distance < minDistance) {
                        minDistance = distance;
                        closestIndex = i;
                      }
                    });
                    
                    const point = history.marketCap[closestIndex];
                    const pointX = getMarketCapX(closestIndex);
                    const pointY = getMarketCapY(point.value);
                    
                    setTooltipData({
                      x: pointX,
                      y: pointY,
                      value: point.value,
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
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
                    </linearGradient>
                    {/* Area gradient fill */}
                    <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                    </linearGradient>
                    {/* Glow filter */}
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  {/* White background */}
                  <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight - volumeHeight} fill="#FFFFFF" />
                  
                  {/* Subtle grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = paddingTop + (plotHeight - volumeHeight) - (ratio * (plotHeight - volumeHeight));
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
                          strokeDasharray="2 2"
                          opacity="0.5"
                        />
                        <text
                          x={paddingLeft - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="text-sm fill-gray-600 font-medium"
                          style={{ fontSize: '14px' }}
                        >
                          {formatCurrency(value)}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Area fill with gradient */}
                  <path
                    d={`M ${paddingLeft} ${paddingTop + plotHeight - volumeHeight} ${history.marketCap.map((d, i) => {
                      const x = getMarketCapX(i);
                      const y = getMarketCapY(d.value);
                      return `L ${x} ${y}`;
                    }).join(' ')} L ${paddingLeft + plotWidth} ${paddingTop + plotHeight - volumeHeight} Z`}
                    fill="url(#areaGradient)"
                  />
                  
                  {/* Glowing green line */}
                  <polyline
                    points={history.marketCap.map((d, i) => `${getMarketCapX(i)},${getMarketCapY(d.value)}`).join(' ')}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
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
                        filter="url(#glow)"
                      />
                      <line
                        x1={tooltipData.x}
                        y1={paddingTop}
                        x2={tooltipData.x}
                        y2={paddingTop + plotHeight - volumeHeight}
                        stroke="#10B981"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                        opacity="0.5"
                      />
                    </g>
                  )}
                  
                  {/* Volume bars at bottom */}
                  <rect x={paddingLeft} y={paddingTop + plotHeight - volumeHeight} width={plotWidth} height={volumeHeight} fill="#F9FAFB" />
                  {history.volume.map((d, i) => {
                    const x = getMarketCapX(i);
                    const barWidth = Math.max(1, plotWidth / history.volume.length * 0.8);
                    const volumeY = getVolumeY(d.value);
                    return (
                      <rect
                        key={i}
                        x={x - barWidth / 2}
                        y={volumeY}
                        width={barWidth}
                        height={paddingTop + plotHeight - volumeY - volumeHeight}
                        fill="#10B981"
                        opacity="0.3"
                      />
                    );
                  })}
                  
                  {/* Volume separator line */}
                  <line
                    x1={paddingLeft}
                    y1={paddingTop + plotHeight - volumeHeight}
                    x2={paddingLeft + plotWidth}
                    y2={paddingTop + plotHeight - volumeHeight}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                  
                  {/* X-axis labels - rendered after volume bars to ensure visibility */}
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
                          y={paddingTop + plotHeight + 25}
                          textAnchor="middle"
                          className="text-sm fill-gray-600 font-medium"
                          style={{ fontSize: '14px' }}
                        >
                          {dateStr}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Interactive Tooltip */}
                {tooltipData && (
                  <div
                    className="absolute bg-white border border-gray-300 rounded-lg p-3 shadow-xl pointer-events-none z-10"
                    style={{
                      left: `${(tooltipData.x / marketCapChartWidth) * 100}%`,
                      top: `${((tooltipData.y - 30) / marketCapChartHeight) * 100}%`,
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
                      {formatCurrency(tooltipData.value)}
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
            </div>
            
            {/* Fullscreen Modal */}
            {isFullscreen && (
              <div 
                className="fixed inset-0 bg-white z-50 flex items-center justify-center p-8"
                onClick={() => setIsFullscreen(false)}
              >
                <div className="w-full h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Kripto Piyasa Değeri - Tam Ekran</h2>
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
                      viewBox={`0 0 ${marketCapChartWidth} ${marketCapChartHeight}`}
                      preserveAspectRatio="xMidYMid meet"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        let closestIndex = 0;
                        let minDistance = Infinity;
                        history.marketCap.forEach((d, i) => {
                          const dataX = getMarketCapX(i);
                          const distance = Math.abs(x - dataX);
                          if (distance < minDistance) {
                            minDistance = distance;
                            closestIndex = i;
                          }
                        });
                        
                        const point = history.marketCap[closestIndex];
                        const pointX = getMarketCapX(closestIndex);
                        const pointY = getMarketCapY(point.value);
                        
                        setTooltipData({
                          x: pointX,
                          y: pointY,
                          value: point.value,
                          date: point.date,
                        });
                      }}
                      onMouseLeave={() => setTooltipData(null)}
                    >
                      <defs>
                        <linearGradient id="lineGradientFull" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
                        </linearGradient>
                        <linearGradient id="areaGradientFull" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                        <filter id="glowFull">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight - volumeHeight} fill="#FFFFFF" />
                      
                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                        const y = paddingTop + (plotHeight - volumeHeight) - (ratio * (plotHeight - volumeHeight));
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
                              strokeDasharray="2 2"
                              opacity="0.5"
                            />
                            <text
                              x={paddingLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="text-sm fill-gray-600 font-medium"
                              style={{ fontSize: '14px' }}
                            >
                              {formatCurrency(value)}
                            </text>
                          </g>
                        );
                      })}
                      
                      
                      <path
                        d={`M ${paddingLeft} ${paddingTop + plotHeight - volumeHeight} ${history.marketCap.map((d, i) => {
                          const x = getMarketCapX(i);
                          const y = getMarketCapY(d.value);
                          return `L ${x} ${y}`;
                        }).join(' ')} L ${paddingLeft + plotWidth} ${paddingTop + plotHeight - volumeHeight} Z`}
                        fill="url(#areaGradientFull)"
                      />
                      
                      <polyline
                        points={history.marketCap.map((d, i) => `${getMarketCapX(i)},${getMarketCapY(d.value)}`).join(' ')}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#glowFull)"
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
                            filter="url(#glowFull)"
                          />
                          <line
                            x1={tooltipData.x}
                            y1={paddingTop}
                            x2={tooltipData.x}
                            y2={paddingTop + plotHeight - volumeHeight}
                            stroke="#10B981"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.5"
                          />
                        </g>
                      )}
                      
                      <rect x={paddingLeft} y={paddingTop + plotHeight - volumeHeight} width={plotWidth} height={volumeHeight} fill="#F9FAFB" />
                      {history.volume.map((d, i) => {
                        const x = getMarketCapX(i);
                        const barWidth = Math.max(1, plotWidth / history.volume.length * 0.8);
                        const volumeY = getVolumeY(d.value);
                        return (
                          <rect
                            key={i}
                            x={x - barWidth / 2}
                            y={volumeY}
                            width={barWidth}
                            height={paddingTop + plotHeight - volumeY - volumeHeight}
                            fill="#10B981"
                            opacity="0.3"
                          />
                        );
                      })}
                      
                      <line
                        x1={paddingLeft}
                        y1={paddingTop + plotHeight - volumeHeight}
                        x2={paddingLeft + plotWidth}
                        y2={paddingTop + plotHeight - volumeHeight}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />
                      
                      {/* X-axis labels - rendered after volume bars to ensure visibility */}
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
                              y={paddingTop + plotHeight + 25}
                              textAnchor="middle"
                              className="text-sm fill-gray-600 font-medium"
                              style={{ fontSize: '14px' }}
                            >
                              {dateStr}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    
                    {tooltipData && (
                      <div
                        className="absolute bg-white border border-gray-300 rounded-lg p-3 shadow-xl pointer-events-none"
                        style={{
                          left: `${(tooltipData.x / marketCapChartWidth) * 100}%`,
                          top: `${((tooltipData.y - 30) / marketCapChartHeight) * 100}%`,
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
                          {formatCurrency(tooltipData.value)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ETF Net Flow Chart - Candlestick */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Kripto ETF Net Akışı</h2>
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={() => setSelectedTimeframe('30d')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      selectedTimeframe === '30d'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    30d
                  </button>
                  <button 
                    onClick={() => setSelectedTimeframe('1y')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      selectedTimeframe === '1y'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    1y
                  </button>
                  <button 
                    onClick={() => setSelectedTimeframe('All')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      selectedTimeframe === 'All'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
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
              <div className="w-full overflow-x-auto relative">
                <svg width={etfChartWidth} height={etfChartHeight} viewBox={`0 0 ${etfChartWidth} ${etfChartHeight}`} className="w-full h-auto">
                  {/* White background */}
                  <rect x={etfPaddingLeft} y={etfPaddingTop} width={etfPlotWidth} height={etfPlotHeight - etfVolumeHeight} fill="#FFFFFF" />
                  
                  {/* Grid lines */}
                  {[-1, -0.5, 0, 0.5, 1].map((ratio) => {
                    const y = etfPaddingTop + (etfPlotHeight - etfVolumeHeight) - ((ratio + 1) / 2) * (etfPlotHeight - etfVolumeHeight);
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
                          strokeDasharray="2 2"
                        />
                        <text
                          x={etfPaddingLeft - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="text-sm fill-gray-600 font-medium"
                          style={{ fontSize: '14px' }}
                        >
                          {formatCurrency(value)}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Zero line */}
                  <line
                    x1={etfPaddingLeft}
                    y1={etfZeroY}
                    x2={etfPaddingLeft + etfPlotWidth}
                    y2={etfZeroY}
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  
                  
                  {/* Moving Averages */}
                  {etfMA20.map((ma, i) => {
                    if (ma === null || i === 0) return null;
                    const x1 = getEtfX(i - 1);
                    const y1 = getEtfY(etfMA20[i - 1] || ma);
                    const x2 = getEtfX(i);
                    const y2 = getEtfY(ma);
                    return (
                      <line
                        key={`etf-ma20-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#F59E0B"
                        strokeWidth="2"
                        opacity="0.8"
                      />
                    );
                  })}
                  
                  {etfMA50.map((ma, i) => {
                    if (ma === null || i === 0) return null;
                    const x1 = getEtfX(i - 1);
                    const y1 = getEtfY(etfMA50[i - 1] || ma);
                    const x2 = getEtfX(i);
                    const y2 = getEtfY(ma);
                    return (
                      <line
                        key={`etf-ma50-${i}`}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#8B5CF6"
                        strokeWidth="2"
                        opacity="0.8"
                      />
                    );
                  })}
                  
                  {/* Candlesticks */}
                  {etfCandles.map((candle, i) => {
                    const x = getEtfX(i);
                    const barWidth = Math.max(2, etfPlotWidth / etfCandles.length * 0.6);
                    const isGreen = candle.close >= candle.open;
                    const highY = getEtfY(candle.high);
                    const lowY = getEtfY(candle.low);
                    const openY = getEtfY(candle.open);
                    const closeY = getEtfY(candle.close);
                    
                    return (
                      <g key={i}>
                        {/* Wick */}
                        <line
                          x1={x}
                          y1={highY}
                          x2={x}
                          y2={lowY}
                          stroke={isGreen ? '#10B981' : '#EF4444'}
                          strokeWidth="1"
                        />
                        {/* Body */}
                        <rect
                          x={x - barWidth / 2}
                          y={Math.min(openY, closeY)}
                          width={barWidth}
                          height={Math.abs(closeY - openY) || 1}
                          fill={isGreen ? '#10B981' : '#EF4444'}
                          stroke={isGreen ? '#059669' : '#DC2626'}
                          strokeWidth="0.5"
                        />
                      </g>
                    );
                  })}
                  
                  {/* Volume bars at bottom */}
                  <rect x={etfPaddingLeft} y={etfPaddingTop + etfPlotHeight - etfVolumeHeight} width={etfPlotWidth} height={etfVolumeHeight} fill="#F9FAFB" />
                  {history.volume.map((d, i) => {
                    const x = getEtfX(i);
                    const barWidth = Math.max(1, etfPlotWidth / history.volume.length * 0.8);
                    const volumeY = etfPaddingTop + etfPlotHeight - etfVolumeHeight + etfVolumeHeight - ((d.value / etfVolumeMax) * etfVolumeHeight);
                    const isGreen = i > 0 && etfCandles[i].close >= etfCandles[i - 1].close;
                    return (
                      <rect
                        key={i}
                        x={x - barWidth / 2}
                        y={volumeY}
                        width={barWidth}
                        height={etfPaddingTop + etfPlotHeight - volumeY - etfVolumeHeight}
                        fill={isGreen ? '#10B981' : '#EF4444'}
                        opacity="0.4"
                      />
                    );
                  })}
                  
                  {/* Volume separator line */}
                  <line
                    x1={etfPaddingLeft}
                    y1={etfPaddingTop + etfPlotHeight - etfVolumeHeight}
                    x2={etfPaddingLeft + etfPlotWidth}
                    y2={etfPaddingTop + etfPlotHeight - etfVolumeHeight}
                    stroke="#E5E7EB"
                    strokeWidth="1"
                  />
                  
                  {/* X-axis labels - rendered after volume bars to ensure visibility */}
                  {etfCandles.map((d, i) => {
                    if (i % Math.ceil(etfCandles.length / 6) !== 0 && i !== etfCandles.length - 1) return null;
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
                          y={etfPaddingTop + etfPlotHeight + 25}
                          textAnchor="middle"
                          className="text-sm fill-gray-600 font-medium"
                          style={{ fontSize: '14px' }}
                        >
                          {dateStr}
                        </text>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Fullscreen button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEtfFullscreen(true);
                  }}
                  className="absolute bottom-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition-colors z-10"
                  title="Tam Ekran"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* ETF Fullscreen Modal */}
            {isEtfFullscreen && (
              <div 
                className="fixed inset-0 bg-white z-50 flex items-center justify-center p-8"
                onClick={() => setIsEtfFullscreen(false)}
              >
                <div className="w-full h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">Kripto ETF Net Akışı - Tam Ekran</h2>
                    <button
                      onClick={() => setIsEtfFullscreen(false)}
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
                      viewBox={`0 0 ${etfChartWidth} ${etfChartHeight}`}
                      preserveAspectRatio="xMidYMid meet"
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        let closestIndex = 0;
                        let minDistance = Infinity;
                        history.etf.forEach((d, i) => {
                          const dataX = getEtfX(i);
                          const distance = Math.abs(x - dataX);
                          if (distance < minDistance) {
                            minDistance = distance;
                            closestIndex = i;
                          }
                        });
                        
                        const point = history.etf[closestIndex];
                        const pointX = getEtfX(closestIndex);
                        const pointY = getEtfY(point.value);
                        
                        setEtfTooltipData({
                          x: pointX,
                          y: pointY,
                          value: point.value,
                          date: point.date,
                        });
                      }}
                      onMouseLeave={() => setEtfTooltipData(null)}
                    >
                      <defs>
                        <linearGradient id="etfLineGradientFull" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
                        </linearGradient>
                        <linearGradient id="etfAreaGradientFull" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                        <filter id="etfGlowFull">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      <rect x={etfPaddingLeft} y={etfPaddingTop} width={etfPlotWidth} height={etfPlotHeight - etfVolumeHeight} fill="#FFFFFF" />
                      
                      {[-1, -0.5, 0, 0.5, 1].map((ratio) => {
                        const y = etfPaddingTop + (etfPlotHeight - etfVolumeHeight) - ((ratio + 1) / 2) * (etfPlotHeight - etfVolumeHeight);
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
                              strokeDasharray="2 2"
                            />
                            <text
                              x={etfPaddingLeft - 10}
                              y={y + 4}
                              textAnchor="end"
                              className="text-sm fill-gray-600 font-medium"
                              style={{ fontSize: '14px' }}
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
                        stroke="#9CA3AF"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      
                      
                      {etfMA20.map((ma, i) => {
                        if (ma === null || i === 0) return null;
                        const x1 = getEtfX(i - 1);
                        const y1 = getEtfY(etfMA20[i - 1] || ma);
                        const x2 = getEtfX(i);
                        const y2 = getEtfY(ma);
                        return (
                          <line
                            key={`etf-ma20-full-${i}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#F59E0B"
                            strokeWidth="2"
                            opacity="0.8"
                          />
                        );
                      })}
                      
                      {etfMA50.map((ma, i) => {
                        if (ma === null || i === 0) return null;
                        const x1 = getEtfX(i - 1);
                        const y1 = getEtfY(etfMA50[i - 1] || ma);
                        const x2 = getEtfX(i);
                        const y2 = getEtfY(ma);
                        return (
                          <line
                            key={`etf-ma50-full-${i}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#8B5CF6"
                            strokeWidth="2"
                            opacity="0.8"
                          />
                        );
                      })}
                      
                      {etfCandles.map((candle, i) => {
                        const x = getEtfX(i);
                        const barWidth = Math.max(2, etfPlotWidth / etfCandles.length * 0.6);
                        const isGreen = candle.close >= candle.open;
                        const highY = getEtfY(candle.high);
                        const lowY = getEtfY(candle.low);
                        const openY = getEtfY(candle.open);
                        const closeY = getEtfY(candle.close);
                        
                        return (
                          <g key={i}>
                            <line
                              x1={x}
                              y1={highY}
                              x2={x}
                              y2={lowY}
                              stroke={isGreen ? '#10B981' : '#EF4444'}
                              strokeWidth="1"
                            />
                            <rect
                              x={x - barWidth / 2}
                              y={Math.min(openY, closeY)}
                              width={barWidth}
                              height={Math.abs(closeY - openY) || 1}
                              fill={isGreen ? '#10B981' : '#EF4444'}
                              stroke={isGreen ? '#059669' : '#DC2626'}
                              strokeWidth="0.5"
                            />
                          </g>
                        );
                      })}
                      
                      <rect x={etfPaddingLeft} y={etfPaddingTop + etfPlotHeight - etfVolumeHeight} width={etfPlotWidth} height={etfVolumeHeight} fill="#F9FAFB" />
                      {history.volume.map((d, i) => {
                        const x = getEtfX(i);
                        const barWidth = Math.max(1, etfPlotWidth / history.volume.length * 0.8);
                        const volumeY = etfPaddingTop + etfPlotHeight - etfVolumeHeight + etfVolumeHeight - ((d.value / etfVolumeMax) * etfVolumeHeight);
                        const isGreen = i > 0 && etfCandles[i].close >= etfCandles[i - 1].close;
                        return (
                          <rect
                            key={i}
                            x={x - barWidth / 2}
                            y={volumeY}
                            width={barWidth}
                            height={etfPaddingTop + etfPlotHeight - volumeY - etfVolumeHeight}
                            fill={isGreen ? '#10B981' : '#EF4444'}
                            opacity="0.4"
                          />
                        );
                      })}
                      
                      <line
                        x1={etfPaddingLeft}
                        y1={etfPaddingTop + etfPlotHeight - etfVolumeHeight}
                        x2={etfPaddingLeft + etfPlotWidth}
                        y2={etfPaddingTop + etfPlotHeight - etfVolumeHeight}
                        stroke="#E5E7EB"
                        strokeWidth="1"
                      />
                      
                      {/* X-axis labels - rendered after volume bars to ensure visibility */}
                      {etfCandles.map((d, i) => {
                        if (i % Math.ceil(etfCandles.length / 6) !== 0 && i !== etfCandles.length - 1) return null;
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
                              y={etfPaddingTop + etfPlotHeight + 25}
                              textAnchor="middle"
                              className="text-sm fill-gray-600 font-medium"
                              style={{ fontSize: '14px' }}
                            >
                              {dateStr}
                            </text>
                          </g>
                        );
                      })}
                      
                      {etfTooltipData && (
                        <g>
                          <circle
                            cx={etfTooltipData.x}
                            cy={etfTooltipData.y}
                            r="6"
                            fill={etfTooltipData.value >= 0 ? '#10B981' : '#EF4444'}
                            stroke="#FFFFFF"
                            strokeWidth="2"
                          />
                          <line
                            x1={etfTooltipData.x}
                            y1={etfPaddingTop}
                            x2={etfTooltipData.x}
                            y2={etfPaddingTop + etfPlotHeight - etfVolumeHeight}
                            stroke={etfTooltipData.value >= 0 ? '#10B981' : '#EF4444'}
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity="0.5"
                          />
                        </g>
                      )}
                    </svg>
                    
                    {etfTooltipData && (
                      <div
                        className="absolute bg-white border border-gray-300 rounded-lg p-3 shadow-xl pointer-events-none"
                        style={{
                          left: `${(etfTooltipData.x / etfChartWidth) * 100}%`,
                          top: `${((etfTooltipData.y - 30) / etfChartHeight) * 100}%`,
                          transform: 'translate(-50%, -100%)',
                        }}
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          {new Date(etfTooltipData.date).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className={`text-lg font-bold ${getPercentageColor(etfTooltipData.value)}`}>
                          {formatCurrency(etfTooltipData.value)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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

export default MarketOverview;
