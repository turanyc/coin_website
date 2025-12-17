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
              <div className="bg-white border border-gray-200 rounded-xl p-6">
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
                <div className="w-full overflow-x-auto">
                  <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                    <defs>
                      <linearGradient id="bitcoinSeasonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#F97316" stopOpacity="0.2" />
                        <stop offset="75%" stopColor="#F97316" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="altcoinSeasonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.05" />
                        <stop offset="25%" stopColor="#3B82F6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>
                    
                    {/* Background regions */}
                    <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight * 0.75} fill="url(#bitcoinSeasonGradient)" />
                    <rect x={paddingLeft} y={paddingTop + plotHeight * 0.25} width={plotWidth} height={plotHeight * 0.75} fill="url(#altcoinSeasonGradient)" />
                    
                    {/* Region labels */}
                    <text x={paddingLeft + plotWidth / 2} y={paddingTop + plotHeight * 0.15} textAnchor="middle" className="text-xs fill-gray-500 font-medium">
                      Bitcoin Sezonu
                    </text>
                    <text x={paddingLeft + plotWidth / 2} y={paddingTop + plotHeight * 0.85} textAnchor="middle" className="text-xs fill-gray-500 font-medium">
                      Altcoin Sezonu
                    </text>

                    {/* Left Y-axis - Index (0-100) */}
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
                            strokeDasharray="4 4"
                          />
                          <text
                            x={paddingLeft - 10}
                            y={y + 4}
                            textAnchor="end"
                            className="text-xs fill-gray-700 font-semibold"
                          >
                            {value}
                          </text>
                        </g>
                      );
                    })}

                    {/* Right Y-axis - Market Cap */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = paddingTop + plotHeight - (ratio * plotHeight);
                      const value = marketCapMin + marketCapRange * (1 - ratio);
                      return (
                        <g key={ratio}>
                          <line
                            x1={paddingLeft + plotWidth}
                            y1={y}
                            x2={paddingLeft + plotWidth + 5}
                            y2={y}
                            stroke="#9CA3AF"
                            strokeWidth="1"
                          />
                          <text
                            x={paddingLeft + plotWidth + 10}
                            y={y + 4}
                            textAnchor="start"
                            className="text-xs fill-gray-700 font-semibold"
                          >
                            ${(value / 1e12).toFixed(1)}T
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
                      stroke="#D1D5DB"
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
                            y2={paddingTop + plotHeight + 8}
                            stroke="#9CA3AF"
                            strokeWidth="2"
                          />
                          <text
                            x={x}
                            y={paddingTop + plotHeight + 25}
                            textAnchor="middle"
                            className="text-xs fill-gray-700 font-semibold"
                          >
                            {dateStr}
                          </text>
                        </g>
                      );
                    })}

                    {/* Altcoin Season Index line */}
                    <polyline
                      points={indexLinePoints}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Altcoin Market Cap line */}
                    <polyline
                      points={marketCapLinePoints}
                      fill="none"
                      stroke="#6B7280"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.7"
                    />

                    {/* Current value indicator */}
                    <circle
                      cx={getX(chartData.length - 1)}
                      cy={getIndexY(data.currentValue)}
                      r="6"
                      fill="#3B82F6"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <text
                      x={getX(chartData.length - 1) + 10}
                      y={getIndexY(data.currentValue) - 5}
                      className="text-xs fill-[#3B82F6] font-bold"
                    >
                      {data.currentValue}
                    </text>
                  </svg>
                </div>
                <div className="flex items-center gap-6 mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#3B82F6] rounded shadow-sm"></div>
                    <span className="text-gray-700 font-medium">Altcoin Sezonu Endeksi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#6B7280] rounded shadow-sm opacity-70"></div>
                    <span className="text-gray-700 font-medium">Altcoin Piyasa Değeri</span>
                  </div>
                </div>
              </div>
            </div>
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

        {/* About and Articles Sections - Side by Side */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* About Section */}
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

            {/* Articles Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">DM Altcoin Sezonu Endeksi Makaleleri</h2>
              <div className="space-y-4">
                {[
                  {
                    category: 'DM Güncellemeleri',
                    title: '2024 Yeni Token Listeleme Analizi',
                    description: '2024 yılında listelenen yeni tokenlerin performans analizi ve altcoin sezonu üzerindeki etkileri.',
                    author: 'DM',
                    time: '1 ay önce',
                    readTime: '3 dk',
                  },
                  {
                    category: 'Piyasa Yorumları',
                    title: 'Altcoin Sezonu: Yatırımcılar İçin Rehber',
                    description: 'Altcoin sezonunun ne olduğu, nasıl tespit edileceği ve yatırım stratejileri hakkında kapsamlı bir rehber.',
                    author: 'DM',
                    time: '2 ay önce',
                    readTime: '5 dk',
                  },
                  {
                    category: 'Analiz',
                    title: 'Bitcoin vs Altcoin: Performans Karşılaştırması',
                    description: 'Bitcoin ve altcoinlerin tarihsel performans karşılaştırması ve sezon değişimlerinin analizi.',
                    author: 'DM',
                    time: '3 ay önce',
                    readTime: '4 dk',
                  },
                ].map((article, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="h-32 bg-gradient-to-br from-[#2563EB] to-[#1E40AF] flex items-center justify-center">
                      <Image src={logoImage} alt="DM" width={60} height={60} />
                    </div>
                    <div className="p-4">
                      <div className="text-xs font-semibold text-[#2563EB] mb-2">{article.category}</div>
                      <h3 className="text-base font-bold text-gray-900 mb-2">{article.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{article.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{article.author}</span>
                        <div className="flex items-center gap-2">
                          <span>{article.time}</span>
                          <span>•</span>
                          <span>{article.readTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full bg-white border-t border-gray-200 py-8 mt-12">
          <div className="w-full px-4">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Image src={logoImage} alt="Dijital Marketim" width={120} height={40} />
            </div>
            <div className="text-center text-gray-600 text-sm">
              <p>Dijital Marketim, kripto piyasasına dair temel bir analiz sağlar.</p>
              <p className="mt-2">
                Dijital Marketim; fiyatı, hacmi ve piyasa değerini takip etmenin yanı sıra topluluk büyümesini, 
                açık kaynak kod geliştirmeyi, önemli olayları ve zincir üstü metrikleri takip eder.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AltcoinSeasonPage;
