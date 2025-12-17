import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface FearGreedData {
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
    fearGreedValue: number;
    bitcoinPrice: number;
    bitcoinVolume: number;
  }>;
}

const FearGreedPage: React.FC = () => {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');
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
      const response = await fetch('/api/fear-greed-page');
      const result = await response.json();
      if (response.ok && !result.error) {
        setData(result);
      } else {
        console.error('API error:', result.error);
        setData(null);
      }
    } catch (error) {
      console.error('Error fetching Fear & Greed data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getClassificationColor = (classification: string): string => {
    if (classification.includes('Extreme Fear')) return '#EF4444';
    if (classification.includes('Fear')) return '#F59E0B';
    if (classification.includes('Neutral')) return '#EAB308';
    if (classification.includes('Greed')) return '#10B981';
    if (classification.includes('Extreme Greed')) return '#059669';
    return '#6B7280';
  };

  const getClassificationText = (classification: string): string => {
    if (classification.includes('Extreme Fear')) return 'Aşırı Korku';
    if (classification.includes('Fear')) return 'Korku';
    if (classification.includes('Neutral')) return 'Nötr';
    if (classification.includes('Greed')) return 'Açgözlülük';
    if (classification.includes('Extreme Greed')) return 'Aşırı Açgözlülük';
    return 'Nötr';
  };

  const getFearGreedAngle = (value: number): number => {
    return (value / 100) * 360 - 90; // -90 to start from top
  };

  // Filter chart data based on timeframe
  const getFilteredChartData = () => {
    if (!data) return [];
    
    const now = Date.now();
    let days = 30;
    if (selectedTimeframe === '1y') days = 365;
    else if (selectedTimeframe === 'All') days = 730;
    
    const cutoffDate = now - days * 24 * 60 * 60 * 1000;
    return data.chartData.filter(d => new Date(d.date).getTime() >= cutoffDate);
  };

  const chartData = getFilteredChartData();

  // Chart calculations
  const chartWidth = 900;
  const chartHeight = 500;
  const paddingLeft = 80;
  const paddingRight = 80;
  const paddingTop = 40;
  const paddingBottom = 80;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Fear & Greed values (left Y-axis: 0-100)
  const fgValues = chartData.map(d => d.fearGreedValue);
  const fgMax = 100;
  const fgMin = 0;
  const fgRange = fgMax - fgMin;

  // Bitcoin price values (right Y-axis) - filter out invalid values
  const validBtcPrices = chartData
    .map(d => d.bitcoinPrice)
    .filter(p => p != null && p > 0 && !isNaN(p) && isFinite(p));
  const btcMax = validBtcPrices.length > 0 ? Math.max(...validBtcPrices) : 100000;
  const btcMin = validBtcPrices.length > 0 ? Math.min(...validBtcPrices) : btcMax * 0.8;
  const btcRange = btcMax - btcMin || 1;

  // Bitcoin volume values (right Y-axis, scaled) - filter out invalid values
  const validBtcVolumes = chartData
    .map(d => d.bitcoinVolume)
    .filter(v => v != null && v > 0 && !isNaN(v) && isFinite(v));
  const volumeMax = validBtcVolumes.length > 0 ? Math.max(...validBtcVolumes) : 10000000000;

  const getX = (index: number) => paddingLeft + (index / (chartData.length - 1 || 1)) * plotWidth;
  const getFgY = (value: number) => paddingTop + plotHeight - ((value - fgMin) / fgRange) * plotHeight;
  const getBtcY = (value: number) => paddingTop + plotHeight - ((value - btcMin) / btcRange) * plotHeight;
  const getVolumeHeight = (value: number) => (value / volumeMax) * plotHeight * 0.2; // 20% of chart height

  const fgLinePoints = chartData.map((d, i) => `${getX(i)},${getFgY(d.fearGreedValue)}`).join(' ');
  
  // Bitcoin line points - ensure all valid points are included
  const btcLinePoints = chartData
    .map((d, i) => {
      // Check if Bitcoin price is valid and greater than 0
      if (d.bitcoinPrice && d.bitcoinPrice > 0 && !isNaN(d.bitcoinPrice) && isFinite(d.bitcoinPrice)) {
        const y = getBtcY(d.bitcoinPrice);
        if (isFinite(y) && y > 0) {
          return `${getX(i)},${y}`;
        }
      }
      return null;
    })
    .filter((point): point is string => point !== null && point.length > 0)
    .join(' ');

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
        <title>DM Kripto Korku ve Açgözlülük Endeksi | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full py-8">
        {/* Header */}
        <div className="w-full px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">DM Kripto Korku ve Açgözlülük Endeksi</h1>
            <button className="px-4 py-2 bg-[#2563EB] hover:bg-[#1E40AF] text-white text-sm font-semibold rounded-lg transition-colors">
              API Detaylarını Gör
            </button>
          </div>
          <p className="text-gray-600 text-lg max-w-4xl">
            Piyasa hissiyatını analiz ederek bilinçli kripto yatırım kararları vermenize yardımcı olan güçlü bir araç olan 
            Korku ve Açgözlülük Endeksimizi keşfedin. Kullanımı kolay API&apos;miz aracılığıyla gerçek zamanlı ve geçmiş verilerle 
            piyasa trendlerinin önünde olun.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              {/* Fear & Greed Gauge */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">DM Kripto Korku ve Açgözlülük Endeksi</h2>
                <div className="flex items-center justify-center">
                  <div className="relative w-64 h-64">
                    <svg width="256" height="256" viewBox="0 0 256 256" className="transform -rotate-90">
                      {/* Background circle */}
                      <circle cx="128" cy="128" r="110" fill="none" stroke="#E5E7EB" strokeWidth="16" />
                      {/* Colored segments - Modern gradient colors */}
                      {[0, 20, 40, 60, 80, 100].map((val, i) => {
                        if (i === 0) return null;
                        const startAngle = ((i - 1) * 20 / 100) * 360 - 90;
                        const endAngle = (i * 20 / 100) * 360 - 90;
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = (endAngle * Math.PI) / 180;
                        const x1 = 128 + 110 * Math.cos(startRad);
                        const y1 = 128 + 110 * Math.sin(startRad);
                        const x2 = 128 + 110 * Math.cos(endRad);
                        const y2 = 128 + 110 * Math.sin(endRad);
                        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
                        // Modern vibrant colors
                        const color = val <= 20 ? '#DC2626' : val <= 40 ? '#F97316' : val <= 60 ? '#EAB308' : val <= 80 ? '#22C55E' : '#10B981';
                        const isActive = data.currentValue >= val - 20 && data.currentValue < val;
                        return (
                          <path
                            key={i}
                            d={`M 128 128 L ${x1} ${y1} A 110 110 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={color}
                            opacity={isActive ? 1 : 0.15}
                          />
                        );
                      })}
                      {/* Needle - Modern design */}
                      <circle cx="128" cy="128" r="8" fill="#1F2937" />
                      <line
                        x1="128"
                        y1="128"
                        x2={128 + 95 * Math.cos((getFearGreedAngle(data.currentValue) * Math.PI) / 180)}
                        y2={128 + 95 * Math.sin((getFearGreedAngle(data.currentValue) * Math.PI) / 180)}
                        stroke="#1F2937"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                      <circle
                        cx={128 + 95 * Math.cos((getFearGreedAngle(data.currentValue) * Math.PI) / 180)}
                        cy={128 + 95 * Math.sin((getFearGreedAngle(data.currentValue) * Math.PI) / 180)}
                        r="4"
                        fill={getClassificationColor(data.currentClassification)}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-gray-900">{data.currentValue}</div>
                        <div className="text-sm font-semibold mt-2" style={{ color: getClassificationColor(data.currentClassification) }}>
                          {getClassificationText(data.currentClassification)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Values */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Geçmiş Değerler</h3>
                <div className="space-y-3">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Dün</div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">{data.historicalValues.yesterday.value}</div>
                      <div className="text-sm font-semibold" style={{ color: getClassificationColor(data.historicalValues.yesterday.classification) }}>
                        {getClassificationText(data.historicalValues.yesterday.classification)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Geçen Hafta</div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">{data.historicalValues.lastWeek.value}</div>
                      <div className="text-sm font-semibold" style={{ color: getClassificationColor(data.historicalValues.lastWeek.classification) }}>
                        {getClassificationText(data.historicalValues.lastWeek.classification)}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="text-sm text-gray-600 mb-1">Geçen Ay</div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">{data.historicalValues.lastMonth.value}</div>
                      <div className="text-sm font-semibold" style={{ color: getClassificationColor(data.historicalValues.lastMonth.classification) }}>
                        {getClassificationText(data.historicalValues.lastMonth.classification)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yearly High and Low */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Yıllık Yüksek ve Düşük</h3>
                <div className="space-y-3">
                  <div className="rounded-lg p-3" style={{ backgroundColor: getClassificationColor(data.yearlyPerformance.high.classification) + '20' }}>
                    <div className="text-sm text-gray-600 mb-1">
                      Yıllık Yüksek ({new Date(data.yearlyPerformance.high.date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })})
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">{data.yearlyPerformance.high.value}</div>
                      <div className="px-3 py-1 rounded text-sm font-semibold text-white" style={{ backgroundColor: getClassificationColor(data.yearlyPerformance.high.classification) }}>
                        {getClassificationText(data.yearlyPerformance.high.classification)}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg p-3" style={{ backgroundColor: getClassificationColor(data.yearlyPerformance.low.classification) + '20' }}>
                    <div className="text-sm text-gray-600 mb-1">
                      Yıllık Düşük ({new Date(data.yearlyPerformance.low.date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })})
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-gray-900">{data.yearlyPerformance.low.value}</div>
                      <div className="px-3 py-1 rounded text-sm font-semibold text-white" style={{ backgroundColor: getClassificationColor(data.yearlyPerformance.low.classification) }}>
                        {getClassificationText(data.yearlyPerformance.low.classification)}
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
                  <h2 className="text-2xl font-bold text-gray-900">Korku ve Açgözlülük Endeksi Grafiği</h2>
                  <div className="flex gap-1">
                    {[
                      { key: '30d', label: '30g' },
                      { key: '1y', label: '1y' },
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
                      <linearGradient id="fearGreedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
                        <stop offset="25%" stopColor="#22C55E" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#EAB308" stopOpacity="0.2" />
                        <stop offset="75%" stopColor="#F97316" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#DC2626" stopOpacity="0.2" />
                      </linearGradient>
                      <linearGradient id="btcPriceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#F7931A" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#F7931A" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Background gradient */}
                    <rect x={paddingLeft} y={paddingTop} width={plotWidth} height={plotHeight} fill="url(#fearGreedGradient)" />

                    {/* Left Y-axis - Fear & Greed (0-100) */}
                    {[0, 20, 40, 60, 80, 100].map((value) => {
                      const y = getFgY(value);
                      const label = value === 0 ? 'Aşırı Korku' : value === 20 ? 'Korku' : value === 40 ? 'Nötr' : value === 60 ? 'Açgözlülük' : value === 80 ? 'Aşırı Açgözlülük' : '';
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
                          {label && (
                            <text
                              x={paddingLeft - 15}
                              y={y - 5}
                              textAnchor="end"
                              className="text-xs fill-gray-600 font-medium"
                            >
                              {label}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Right Y-axis - Bitcoin Price */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = paddingTop + plotHeight - (ratio * plotHeight);
                      const value = btcMin + btcRange * (1 - ratio);
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
                            ${(value / 1000).toFixed(0)}K
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
                      const dateStr = `${date.getDate()} ${date.toLocaleDateString('tr-TR', { month: 'short' })}${selectedTimeframe === 'All' || selectedTimeframe === '1y' ? ' ' + date.getFullYear() : ''}`;
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

                    {/* Bitcoin Volume bars - Modern design */}
                    {chartData.map((d, i) => {
                      if (d.bitcoinVolume <= 0 || isNaN(d.bitcoinVolume)) return null;
                      const x = getX(i);
                      const barWidth = plotWidth / chartData.length;
                      const height = getVolumeHeight(d.bitcoinVolume);
                      return (
                        <rect
                          key={i}
                          x={x - barWidth / 2}
                          y={paddingTop + plotHeight - height}
                          width={barWidth * 0.7}
                          height={height}
                          fill="#6366F1"
                          opacity="0.4"
                          rx="2"
                        />
                      );
                    })}

                    {/* Fear & Greed line - Modern vibrant blue */}
                    <polyline
                      points={fgLinePoints}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Fear & Greed area fill */}
                    <polyline
                      points={`${paddingLeft},${paddingTop + plotHeight} ${fgLinePoints} ${paddingLeft + plotWidth},${paddingTop + plotHeight}`}
                      fill="url(#fearGreedGradient)"
                      opacity="0.3"
                    />

                    {/* Bitcoin Price line - More prominent */}
                    {btcLinePoints && btcLinePoints.length > 0 && (
                      <>
                        <polyline
                          points={btcLinePoints}
                          fill="none"
                          stroke="#F7931A"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Bitcoin price area fill */}
                        <polyline
                          points={`${paddingLeft},${paddingTop + plotHeight} ${btcLinePoints} ${paddingLeft + plotWidth},${paddingTop + plotHeight}`}
                          fill="url(#btcPriceGradient)"
                          opacity="0.2"
                        />
                      </>
                    )}

                    {/* Current Fear & Greed point */}
                    <circle
                      cx={getX(chartData.length - 1)}
                      cy={getFgY(data.currentValue)}
                      r="6"
                      fill="#2563EB"
                      stroke="#fff"
                      strokeWidth="2"
                    />
                    <text
                      x={getX(chartData.length - 1) + 10}
                      y={getFgY(data.currentValue) - 5}
                      className="text-xs fill-[#2563EB] font-bold"
                    >
                      {data.currentValue} F&G
                    </text>
                  </svg>
                </div>
                <div className="flex items-center gap-6 mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#3B82F6] rounded shadow-sm"></div>
                    <span className="text-gray-700 font-medium">Korku ve Açgözlülük Endeksi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#F7931A] rounded shadow-sm"></div>
                    <span className="text-gray-700 font-medium">Bitcoin Fiyatı</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-[#6366F1] rounded shadow-sm opacity-60"></div>
                    <span className="text-gray-700 font-medium">Bitcoin Hacmi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About and Articles Sections - Side by Side */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* About Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">DM Kripto Korku ve Açgözlülük Endeksi Hakkında</h2>
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === 'what-is' ? null : 'what-is')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-semibold text-gray-900">DM Korku ve Açgözlülük Endeksi nedir?</span>
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
                  <p className="text-gray-600 leading-relaxed mb-4">
                    DM Korku ve Açgözlülük Endeksi, kripto para piyasasındaki duygusal durumu ölçen bir göstergedir. 
                    Endeks, 0 ile 100 arasında değer alır ve piyasadaki korku (0-50) ile açgözlülük (50-100) seviyelerini gösterir.
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    Endeks, volatilite, piyasa momentumu/hacmi, sosyal medya, Google Trends, Bitcoin dominance ve diğer faktörleri 
                    analiz ederek hesaplanır. Bu veriler, yatırımcıların piyasa hakkındaki duygularını yansıtır.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 'how-use' ? null : 'how-use')}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900">Bu endeksi nasıl kullanabilirim?</span>
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
                    Endeks, yatırım kararlarınızı desteklemek için kullanılabilir. Örneğin, aşırı korku seviyelerinde 
                    (0-25) piyasa aşırı satılmış olabilir ve alım fırsatı sunabilir. Aşırı açgözlülük seviyelerinde (75-100) 
                    ise piyasa aşırı alınmış olabilir ve dikkatli olunmalıdır.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 'how-calculated' ? null : 'how-calculated')}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900">Bu endeks nasıl hesaplanır?</span>
                <svg
                  className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'how-calculated' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFAQ === 'how-calculated' && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    Endeks, volatilite (25%), piyasa momentumu/hacmi (25%), sosyal medya (15%), Google Trends (10%), 
                    Bitcoin dominance (10%) ve diğer faktörleri (15%) analiz ederek hesaplanır. Her faktör normalize edilir 
                    ve ağırlıklı ortalaması alınarak 0-100 arası bir değer üretilir.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 'api' ? null : 'api')}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900">Bu verilere API üzerinden erişebilir miyim?</span>
                <svg
                  className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'api' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFAQ === 'api' && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    Evet, DM API&apos;si ile Korku ve Açgözlülük Endeksi verilerine erişebilirsiniz. 
                    API endpoint&apos;imiz: <code className="bg-gray-100 px-2 py-1 rounded">GET /api/fear-greed-page</code>
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 'leading' ? null : 'leading')}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-lg font-semibold text-gray-900">Dünyanın Önde Gelen Kripto Korku ve Açgözlülük Endeksi</span>
                <svg
                  className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'leading' ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFAQ === 'leading' && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <p className="text-gray-600 leading-relaxed">
                    DM Korku ve Açgözlülük Endeksi, dünya çapında milyonlarca yatırımcı tarafından kullanılan 
                    en güvenilir piyasa hissiyat göstergelerinden biridir. Gerçek zamanlı veriler ve kapsamlı analizlerle, 
                    kripto para piyasasındaki duygusal durumu anlamanıza yardımcı olur.
                  </p>
                </div>
              )}
            </div>
          </div>
            </div>

            {/* Articles Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">DM Kripto Korku ve Açgözlülük Endeksi Makaleleri</h2>
              <div className="space-y-4">
            {[
              {
                category: 'DM Güncellemeleri',
                title: 'Korku ve Açgözlülük Endeksi: Piyasa Hissiyatını Anlamak',
                description: 'Kripto para piyasasındaki duygusal durumu ölçen endeksin nasıl çalıştığını ve yatırım kararlarınızda nasıl kullanabileceğinizi öğrenin.',
                author: 'DM',
                time: '1 yıl önce',
                readTime: '4 dk',
              },
              {
                category: 'Piyasa Yorumları',
                title: 'Aşırı Korku Zamanlarında Yatırım Stratejileri',
                description: 'Piyasa aşırı korku seviyelerindeyken nasıl hareket edilmesi gerektiğine dair uzman görüşleri ve stratejiler.',
                author: 'DM',
                time: '8 ay önce',
                readTime: '6 dk',
              },
              {
                category: 'Analiz',
                title: 'Bitcoin Fiyatı ve Korku-Açgözlülük Endeksi İlişkisi',
                description: 'Bitcoin fiyat hareketleri ile piyasa hissiyatı arasındaki korelasyonu inceleyen detaylı bir analiz.',
                author: 'DM',
                time: '6 ay önce',
                readTime: '5 dk',
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

export default FearGreedPage;
