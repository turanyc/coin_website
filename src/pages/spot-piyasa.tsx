import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface SpotMarketData {
  totalMarketCap: number;
  marketCapChange24h: number;
  marketCapHistory: Array<{ date: string; value: number }>;
  marketCapYesterday: number;
  marketCapLastWeek: number;
  marketCapLastMonth: number;
  marketCapYearlyHigh: number;
  marketCapYearlyHighDate: string;
  marketCapYearlyLow: number;
  marketCapYearlyLowDate: string;
  spotVolume24h: number;
  spotVolumeHistory: Array<{ date: string; value: number }>;
  cexVolumeHistory: Array<{ date: string; exchanges: { name: string; volume: number }[] }>;
  dexVolumeHistory: Array<{ date: string; exchanges: { name: string; volume: number }[] }>;
}

const SpotPiyasa: React.FC = () => {
  const [data, setData] = useState<SpotMarketData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');
  const [selectedTab, setSelectedTab] = useState<string>('Overview');
  const [cexView, setCexView] = useState<'Market Share' | 'Total'>('Market Share');
  const [dexView, setDexView] = useState<'Market Share' | 'Total'>('Market Share');

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/spot-market');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching spot market data:', error);
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

  const getFilteredHistory = () => {
    if (!data) return { marketCap: [], volume: [], cex: [], dex: [] };
    
    const all = data.marketCapHistory.length;
    let count = 30;
    if (selectedTimeframe === '1y') count = Math.min(365, all);
    else if (selectedTimeframe === 'All') count = all;
    else if (selectedTimeframe === '7d') count = 7;
    else if (selectedTimeframe === '24h') count = 1;
    
    const start = all - count;
    return {
      marketCap: data.marketCapHistory.slice(start),
      volume: data.spotVolumeHistory.slice(start),
      cex: data.cexVolumeHistory.slice(start),
      dex: data.dexVolumeHistory.slice(start),
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

  // Volume Chart
  const volumeChartWidth = 600;
  const volumeChartHeight = 300;
  const volumePaddingLeft = 60;
  const volumePaddingRight = 20;
  const volumePaddingTop = 40;
  const volumePaddingBottom = 80;
  const volumePlotWidth = volumeChartWidth - volumePaddingLeft - volumePaddingRight;
  const volumePlotHeight = volumeChartHeight - volumePaddingTop - volumePaddingBottom;

  const volumeValues = history.volume.map(d => d.value);
  const volumeMax = Math.max(...volumeValues, 1);
  const getVolumeX = (index: number) => volumePaddingLeft + (index / (history.volume.length - 1 || 1)) * volumePlotWidth;
  const getVolumeY = (value: number) => volumePaddingTop + volumePlotHeight - ((value / volumeMax) * volumePlotHeight);
  const getVolumeBarHeight = (value: number) => (value / volumeMax) * volumePlotHeight;

  // CEX/DEX Stacked Area Chart
  const stackedChartWidth = 600;
  const stackedChartHeight = 300;
  const stackedPaddingLeft = 60;
  const stackedPaddingRight = 20;
  const stackedPaddingTop = 40;
  const stackedPaddingBottom = 80;
  const stackedPlotWidth = stackedChartWidth - stackedPaddingLeft - stackedPaddingRight;
  const stackedPlotHeight = stackedChartHeight - stackedPaddingTop - stackedPaddingBottom;

  const getStackedX = (index: number, total: number) => stackedPaddingLeft + (index / (total - 1 || 1)) * stackedPlotWidth;

  const getCexColors = (name: string): string => {
    const colors: { [key: string]: string } = {
      'Binance': '#F0B90B',
      'Coinbase Exchange': '#0052FF',
      'Bybit': '#F7A600',
      'OKX': '#000000',
      'Crypto.com Exchange': '#1038CC',
      'Others': '#9CA3AF',
    };
    return colors[name] || '#9CA3AF';
  };

  const getDexColors = (name: string): string => {
    const colors: { [key: string]: string } = {
      'Uniswap v2': '#FF007A',
      'Raydium': '#00D4FF',
      'Uniswap v3 (Ethereum)': '#FF007A',
      'PancakeSwap v3 (BSC)': '#1FC7D4',
      'Curve (Ethereum)': '#3465A4',
      'Others': '#9CA3AF',
    };
    return colors[name] || '#9CA3AF';
  };

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
        <title>Spot Piyasa | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full py-8">
        {/* Header */}
        <div className="w-full px-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Spot Piyasa</h1>
          <p className="text-gray-600 text-base max-w-4xl">
            Merkezi (CEX) ve merkezi olmayan (DEX) borsalardaki spot piyasa aktivitesini analiz edin. 
            İşlem hacimlerini, tarihsel performansı ve piyasa paylarını takip edin.
          </p>
        </div>

        {/* Market Cap Chart with Historical Values and Yearly Performance */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Market Cap Chart - Takes 2 columns */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Kripto Piyasa Değeri</h2>
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalMarketCap)}</div>
                    <div className={`text-sm font-semibold ${getPercentageColor(data.marketCapChange24h)}`}>
                      {formatPercentage(data.marketCapChange24h)} (24s)
                    </div>
                  </div>
                </div>
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
                  {['24h', '7d', '30d', '1y', 'All'].map((timeframe) => (
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
                  
                  {/* Current market cap line */}
                  <line
                    x1={paddingLeft}
                    y1={getMarketCapY(data.totalMarketCap)}
                    x2={paddingLeft + plotWidth}
                    y2={getMarketCapY(data.totalMarketCap)}
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>
              </div>
            </div>

            {/* Historical Values and Yearly Performance - Takes 1 column, stacked */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Market Cap Historical Values */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Piyasa Değeri Geçmiş Değerleri</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Dün</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(data.marketCapYesterday)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Geçen Hafta</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(data.marketCapLastWeek)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Geçen Ay</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(data.marketCapLastMonth)}</div>
                  </div>
                </div>
              </div>

              {/* Market Cap Yearly Performance */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Piyasa Değeri Yıllık Performans</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Yıllık Yüksek</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(data.marketCapYearlyHigh)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(data.marketCapYearlyHighDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Yıllık Düşük</div>
                    <div className="text-xl font-bold text-red-600">{formatCurrency(data.marketCapYearlyLow)}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(data.marketCapYearlyLowDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Volume Charts */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Crypto Spot Volume (24h) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Kripto Spot Hacim (24s)</h2>
                <div className="flex gap-2">
                  {['24h', '7d', '30d', '1y', 'All'].map((timeframe) => (
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
              <div className="w-full overflow-x-auto">
                <svg width={volumeChartWidth} height={volumeChartHeight} viewBox={`0 0 ${volumeChartWidth} ${volumeChartHeight}`} className="w-full h-auto">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = volumePaddingTop + volumePlotHeight - (ratio * volumePlotHeight);
                    const value = volumeMax * (1 - ratio);
                    return (
                      <g key={ratio}>
                        <line
                          x1={volumePaddingLeft}
                          y1={y}
                          x2={volumePaddingLeft + volumePlotWidth}
                          y2={y}
                          stroke="#E5E7EB"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={volumePaddingLeft - 10}
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
                    x1={volumePaddingLeft}
                    y1={volumePaddingTop + volumePlotHeight}
                    x2={volumePaddingLeft + volumePlotWidth}
                    y2={volumePaddingTop + volumePlotHeight}
                    stroke="#D1D5DB"
                    strokeWidth="2"
                  />
                  
                  {history.volume.map((d, i) => {
                    if (i % Math.ceil(history.volume.length / 6) !== 0 && i !== history.volume.length - 1) return null;
                    const x = getVolumeX(i);
                    const date = new Date(d.date);
                    const dateStr = `${date.getDate()} ${date.toLocaleDateString('tr-TR', { month: 'short' })}`;
                    return (
                      <g key={i}>
                        <line
                          x1={x}
                          y1={volumePaddingTop + volumePlotHeight}
                          x2={x}
                          y2={volumePaddingTop + volumePlotHeight + 5}
                          stroke="#9CA3AF"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={volumePaddingTop + volumePlotHeight + 20}
                          textAnchor="middle"
                          className="text-xs fill-gray-600 font-medium"
                        >
                          {dateStr}
                        </text>
                      </g>
                    );
                  })}
                  
                  {history.volume.map((d, i) => {
                    const x = getVolumeX(i);
                    const barWidth = volumePlotWidth / history.volume.length;
                    const height = getVolumeBarHeight(d.value);
                    return (
                      <rect
                        key={i}
                        x={x - barWidth / 2}
                        y={volumePaddingTop + volumePlotHeight - height}
                        width={barWidth * 0.8}
                        height={height}
                        fill="#2563EB"
                        opacity="0.7"
                      />
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* CEX Spot Volume (24h) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">CEX Spot Hacim (24s)</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCexView('Market Share')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      cexView === 'Market Share'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Piyasa Payı
                  </button>
                  <button
                    onClick={() => setCexView('Total')}
                    className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                      cexView === 'Total'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Toplam
                  </button>
                  {['24h', '7d', '30d', '1y', 'All'].map((timeframe) => (
                    <button
                      key={timeframe}
                      className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <svg width={stackedChartWidth} height={stackedChartHeight} viewBox={`0 0 ${stackedChartWidth} ${stackedChartHeight}`} className="w-full h-auto">
                  {/* Stacked area chart for CEX */}
                  {history.cex.map((day, dayIndex) => {
                    const x = getStackedX(dayIndex, history.cex.length);
                    const totalVolume = day.exchanges.reduce((sum, ex) => sum + ex.volume, 0);
                    let currentY = stackedPaddingTop + stackedPlotHeight;
                    
                    return day.exchanges.map((exchange, exIndex) => {
                      const height = (exchange.volume / totalVolume) * stackedPlotHeight;
                      const y = currentY - height;
                      const color = getCexColors(exchange.name);
                      currentY = y;
                      
                      return (
                        <rect
                          key={`${dayIndex}-${exIndex}`}
                          x={x - (stackedPlotWidth / history.cex.length) / 2}
                          y={y}
                          width={stackedPlotWidth / history.cex.length * 0.8}
                          height={height}
                          fill={color}
                          opacity="0.8"
                        />
                      );
                    });
                  })}
                </svg>
              </div>
            </div>
          </div>

          {/* DEX Spot Volume (24h) */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">DEX Spot Hacim (24s)</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setDexView('Market Share')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    dexView === 'Market Share'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Piyasa Payı
                </button>
                <button
                  onClick={() => setDexView('Total')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    dexView === 'Total'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Toplam
                </button>
                {['24h', '7d', '30d', '1y', 'All'].map((timeframe) => (
                  <button
                    key={timeframe}
                    className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full overflow-x-auto">
              <svg width={stackedChartWidth} height={stackedChartHeight} viewBox={`0 0 ${stackedChartWidth} ${stackedChartHeight}`} className="w-full h-auto">
                {/* Stacked area chart for DEX */}
                {history.dex.map((day, dayIndex) => {
                  const x = getStackedX(dayIndex, history.dex.length);
                  const totalVolume = day.exchanges.reduce((sum, ex) => sum + ex.volume, 0);
                  let currentY = stackedPaddingTop + stackedPlotHeight;
                  
                  return day.exchanges.map((exchange, exIndex) => {
                    const height = (exchange.volume / totalVolume) * stackedPlotHeight;
                    const y = currentY - height;
                    const color = getDexColors(exchange.name);
                    currentY = y;
                    
                    return (
                      <rect
                        key={`${dayIndex}-${exIndex}`}
                        x={x - (stackedPlotWidth / history.dex.length) / 2}
                        y={y}
                        width={stackedPlotWidth / history.dex.length * 0.8}
                        height={height}
                        fill={color}
                        opacity="0.8"
                      />
                    );
                  });
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Spot Market Articles */}
        <div className="w-full px-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Spot Piyasa Makaleleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Spot Piyasa',
                subtitle: 'Spot Market',
                description: 'Kripto paranın anında teslimatı için halka açık bir piyasa.',
                author: 'Dijital Marketim Akademi',
                time: '1 yıl önce 3 ay',
              },
              {
                title: 'Spot İşlem',
                subtitle: 'Spot Trading',
                description: 'Bir finansal enstrümanın anında değişimi.',
                author: 'Dijital Marketim Akademi',
                time: '1 yıl önce 3 ay',
              },
              {
                title: 'Spot',
                subtitle: 'Spot',
                description: 'Kripto paranın anında teslimatı için bir sözleşme veya işlem.',
                author: 'Dijital Marketim Akademi',
                time: '1 yıl önce 3 ay',
              },
            ].map((article, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <Image src={logoImage} alt="Dijital Marketim" width={20} height={20} />
                  <span className="text-sm font-semibold text-gray-700">Dijital Marketim</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">{article.title}</h3>
                <p className="text-sm text-gray-600 mb-1">{article.subtitle}</p>
                <p className="text-gray-600 text-sm mb-4">{article.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{article.author}</span>
                  <span>{article.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Section */}
        <footer className="bg-white border-t border-gray-200 px-4 py-12 mt-12">
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

export default SpotPiyasa;

