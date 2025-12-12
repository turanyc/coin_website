import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface RSIData {
  averageRSI: number;
  overboughtPercentage: number;
  oversoldPercentage: number;
  historicalValues: {
    oneDay: number;
    oneWeek: number;
    oneMonth: number;
    threeMonths: number;
  };
  heatmapData: Array<{
    date: string;
    coins: Array<{
      symbol: string;
      rsi: number;
      marketCap: number;
    }>;
  }>;
  coinsData: Array<{
    id: string;
    symbol: string;
    name: string;
    image: string;
    marketCap: number;
    volume24h: number;
    volumeChange24h: number;
    rsi14d: number;
    rsi7d: number;
    rsi14h: number;
    rsi4h: number;
    rsi1h: number;
  }>;
}

const RSIPage: React.FC = () => {
  const [data, setData] = useState<RSIData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ALL');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>('what-is');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 100;

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/rsi');
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

  const formatCurrency = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getRSIColor = (rsi: number): string => {
    if (rsi >= 70) return '#EF4444'; // Red - Overbought
    if (rsi <= 30) return '#10B981'; // Green - Oversold
    return '#6B7280'; // Gray - Neutral
  };

  // Filter heatmap data based on timeframe
  const getFilteredHeatmapData = () => {
    if (!data) return [];
    
    const now = Date.now();
    let days = 90;
    if (selectedTimeframe === '1D') days = 1;
    else if (selectedTimeframe === '7D') days = 7;
    else if (selectedTimeframe === '1M') days = 30;
    else if (selectedTimeframe === '3M') days = 90;
    
    const cutoffDate = now - days * 24 * 60 * 60 * 1000;
    return data.heatmapData.filter(d => new Date(d.date).getTime() >= cutoffDate);
  };

  const heatmapData = getFilteredHeatmapData();
  const paginatedCoins = data?.coinsData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage) || [];
  const totalPages = data ? Math.ceil(data.coinsData.length / rowsPerPage) : 1;

  // Heatmap chart calculations
  const heatmapWidth = 1000;
  const heatmapHeight = 500;
  const paddingLeft = 80;
  const paddingRight = 20;
  const paddingTop = 60;
  const paddingBottom = 80;
  const plotWidth = heatmapWidth - paddingLeft - paddingRight;
  const plotHeight = heatmapHeight - paddingTop - paddingBottom;

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
        <title>Kripto Göreceli Güç Endeksi (RSI) | Dijital Marketim</title>
        <meta name="description" content="Kripto Göreceli Güç Endeksi (RSI) - Momentum göstergesi ile kripto para analizi" />
      </Head>
      <Navbar />

      <div className="w-full">
        {/* Header */}
        <div className="w-full px-4 py-8 bg-white border-b border-gray-200">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kripto Göreceli Güç Endeksi (RSI)</h1>
          <p className="text-gray-600 max-w-4xl">
            Kripto Göreceli Güç Endeksi (RSI), fiyat hareketlerinin hızını ve değişimini ölçen bir momentum göstergesidir. 
            RSI, bir osilatör (iki uç arasında hareket eden bir çizgi grafiği) olarak gösterilir ve 0 ile 100 arasında bir değere sahip olabilir.
          </p>
        </div>

        {/* Top Cards Grid */}
        <div className="w-full px-4 mb-8 mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Average Crypto RSI Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ortalama Kripto RSI</h3>
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-gray-900 mb-2">{data.averageRSI.toFixed(2)}</div>
              </div>
              {/* Gauge */}
              <div className="relative mt-4">
                <div className="relative h-10 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 via-green-400 via-yellow-400 to-pink-500"></div>
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
                    style={{ left: `${data.averageRSI}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-blue-600 font-medium">Aşırı Satım</span>
                  <span className="text-pink-600 font-medium">Aşırı Alım</span>
                </div>
              </div>
            </div>

            {/* Overbought vs Oversold Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aşırı Alım vs Aşırı Satım</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Aşırı Alım</span>
                    <span className="text-lg font-bold text-red-600">{data.overboughtPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-red-500"
                      style={{ width: `${data.overboughtPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Aşırı Satım</span>
                    <span className="text-lg font-bold text-green-600">{data.oversoldPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-green-500"
                      style={{ width: `${data.oversoldPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Historical RSI Values Card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Geçmiş RSI Değerleri</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">1 Gün</span>
                  <span className="font-semibold text-gray-900">{data.historicalValues.oneDay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">1 Hafta</span>
                  <span className="font-semibold text-gray-900">{data.historicalValues.oneWeek.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">1 Ay</span>
                  <span className="font-semibold text-gray-900">{data.historicalValues.oneMonth.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">3 Ay</span>
                  <span className="font-semibold text-gray-900">{data.historicalValues.threeMonths.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Heatmap Placeholder - Will be in next section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Kripto RSI Heatmap</h3>
              <p className="text-sm text-gray-600">Detaylı heatmap grafiği aşağıda görüntülenmektedir.</p>
            </div>
          </div>
        </div>

        {/* Heatmap Chart Section */}
        <div className="w-full px-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Kripto RSI Heatmap</h2>
              <div className="flex gap-1">
                {[
                  { key: '1D', label: '1G' },
                  { key: '7D', label: '7G' },
                  { key: '1M', label: '1A' },
                  { key: '3M', label: '3A' },
                  { key: 'ALL', label: 'Tümü' },
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
              <svg width={heatmapWidth} height={heatmapHeight} viewBox={`0 0 ${heatmapWidth} ${heatmapHeight}`} className="w-full h-auto">
                <defs>
                  <linearGradient id="overboughtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#EF4444" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1" />
                  </linearGradient>
                  <linearGradient id="oversoldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.3" />
                  </linearGradient>
                </defs>

                {/* Background zones */}
                <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight * 0.3} fill="url(#overboughtGradient)" />
                <rect x={paddingLeft} y={paddingTop + plotHeight * 0.7} width={plotWidth} height={plotHeight * 0.3} fill="url(#oversoldGradient)" />
                
                {/* Zone labels */}
                <text x={paddingLeft + plotWidth / 2} y={paddingTop + 20} textAnchor="middle" className="text-xs fill-gray-600 font-medium">
                  Aşırı Alım (70-100)
                </text>
                <text x={paddingLeft + plotWidth / 2} y={paddingTop + plotHeight - 10} textAnchor="middle" className="text-xs fill-gray-600 font-medium">
                  Aşırı Satım (0-30)
                </text>

                {/* Y-axis - RSI (0-100) */}
                {[0, 30, 50, 70, 100].map((value) => {
                  const y = paddingTop + plotHeight - (value / 100) * plotHeight;
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

                {/* X-axis labels */}
                {heatmapData.map((d, i) => {
                  const x = paddingLeft + (i / (heatmapData.length - 1 || 1)) * plotWidth;
                  const date = new Date(d.date);
                  const dateStr = `${date.toLocaleDateString('tr-TR', { month: 'short' })} '${date.getFullYear().toString().slice(-2)}`;
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

                {/* Data points */}
                {heatmapData.map((dayData, dayIndex) => {
                  const x = paddingLeft + (dayIndex / (heatmapData.length - 1 || 1)) * plotWidth;
                  return dayData.coins.map((coin, coinIndex) => {
                    const y = paddingTop + plotHeight - (coin.rsi / 100) * plotHeight;
                    const size = Math.sqrt(coin.marketCap / 1e12) * 3 + 2;
                    return (
                      <circle
                        key={`${dayIndex}-${coinIndex}`}
                        cx={x}
                        cy={y}
                        r={size}
                        fill={getRSIColor(coin.rsi)}
                        opacity="0.7"
                      />
                    );
                  });
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* Cryptocurrency RSI Table */}
        <div className="w-full px-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Kripto Para RSI</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Coin</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Piyasa Değeri</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Hacim (24s)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">RSI (14g)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">RSI (7g)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">RSI (14s)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">RSI (4s)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">RSI (1s)</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCoins.map((coin, index) => (
                    <tr key={coin.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {coin.image && (
                            <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                          )}
                          <div>
                            <div className="font-semibold text-gray-900">{coin.name}</div>
                            <div className="text-xs text-gray-500">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-900">{formatCurrency(coin.marketCap)}</td>
                      <td className="py-3 px-4 text-right text-sm">
                        <div>{formatCurrency(coin.volume24h)}</div>
                        <div className={`text-xs ${coin.volumeChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPercentage(coin.volumeChange24h)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold" style={{ color: getRSIColor(coin.rsi14d) }}>
                        {coin.rsi14d.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold" style={{ color: getRSIColor(coin.rsi7d) }}>
                        {coin.rsi7d.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold" style={{ color: getRSIColor(coin.rsi14h) }}>
                        {coin.rsi14h.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold" style={{ color: getRSIColor(coin.rsi4h) }}>
                        {coin.rsi4h.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-semibold" style={{ color: getRSIColor(coin.rsi1h) }}>
                        {coin.rsi1h.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-600">
                {data.coinsData.length > 0 && (
                  <>Gösterilen {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, data.coinsData.length)} / {data.coinsData.length}</>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                        currentPage === page
                          ? 'bg-[#2563EB] text-white border-[#2563EB]'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="w-full px-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Kripto Piyasa RSI Hakkında</h2>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'what-is' ? null : 'what-is')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">Göreceli Güç Endeksi (RSI) Nedir?</span>
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
                      Göreceli Güç Endeksi (RSI), fiyat hareketlerinin hızını ve değişimini ölçen bir momentum göstergesidir. 
                      RSI, 0 ile 100 arasında bir değere sahiptir. Genellikle 70&apos;in üzeri aşırı alım, 30&apos;un altı aşırı satım olarak kabul edilir.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'momentum' ? null : 'momentum')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">Momentum Osilatörü Nedir?</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'momentum' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === 'momentum' && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">
                      Momentum osilatörü, fiyat momentumunu ölçen teknik analiz araçlarıdır. RSI, en yaygın kullanılan momentum osilatörlerinden biridir 
                      ve fiyatın aşırı alım veya aşırı satım durumunda olup olmadığını belirlemeye yardımcı olur.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'overbought-oversold' ? null : 'overbought-oversold')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">Aşırı Alım vs Aşırı Satım Ne Anlama Gelir?</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'overbought-oversold' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === 'overbought-oversold' && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">
                      Aşırı alım (RSI &gt; 70), varlığın fiyatının aşırı yükseldiği ve düşüş potansiyeli olduğu anlamına gelir. 
                      Aşırı satım (RSI &lt; 30) ise varlığın fiyatının aşırı düştüğü ve yükseliş potansiyeli olduğu anlamına gelir.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'when-overbought' ? null : 'when-overbought')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">Bir Varlık Ne Zaman Aşırı Alım veya Aşırı Satım Olur?</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'when-overbought' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === 'when-overbought' && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">
                      Genel olarak, RSI değeri 70&apos;in üzerine çıktığında varlık aşırı alım bölgesindedir. 
                      RSI değeri 30&apos;un altına düştüğünde ise varlık aşırı satım bölgesindedir. Ancak bu değerler piyasa koşullarına göre değişebilir.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'effective' ? null : 'effective')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">RSI Kripto Para Piyasasında Etkili Mi?</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'effective' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === 'effective' && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">
                      RSI, kripto para piyasasında yaygın olarak kullanılan bir göstergedir. Ancak, volatil yapısı nedeniyle kripto piyasasında 
                      RSI sinyalleri daha sık oluşabilir. Bu nedenle, RSI&apos;yi diğer teknik analiz araçlarıyla birlikte kullanmak önemlidir.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === 'limitations' ? null : 'limitations')}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">Kripto Piyasasında RSI&apos;nin Sınırlamaları Nelerdir?</span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'limitations' ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedFAQ === 'limitations' && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <p className="text-gray-600 leading-relaxed">
                      RSI, güçlü trendlerde yanlış sinyaller verebilir. Ayrıca, kripto para piyasasının yüksek volatilitesi nedeniyle 
                      RSI değerleri daha hızlı değişebilir. RSI, tek başına yatırım kararı vermek için yeterli değildir ve diğer analiz yöntemleriyle birlikte kullanılmalıdır.
                    </p>
                  </div>
                )}
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

export default RSIPage;
