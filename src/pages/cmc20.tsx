import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface Constituent {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  image: string;
  weight: number;
}

interface CMC20Data {
  currentValue: number;
  change24h: number;
  historicalValues: {
    yesterday: number;
    lastWeek: number;
    lastMonth: number;
  };
  yearlyPerformance: {
    high: number;
    highDate: string;
    low: number;
    lowDate: string;
  };
  chartData: Array<{ date: string; value: number }>;
  constituents: Constituent[];
  totalConstituents: number;
}

const CMC20Page: React.FC = () => {
  const [data, setData] = useState<CMC20Data | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('All');
  const [selectedView, setSelectedView] = useState<string>('CMC20');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>('what-is');
  const [showAllConstituents, setShowAllConstituents] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/cmc20');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching CMC20 data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return `$${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getPercentageColor = (value: number): string => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  // Filter chart data based on timeframe
  const getFilteredChartData = () => {
    if (!data) return [];
    
    const now = Date.now();
    let days = 730; // All
    if (selectedTimeframe === '24h') days = 1;
    else if (selectedTimeframe === '7d') days = 7;
    else if (selectedTimeframe === '30d') days = 30;
    else if (selectedTimeframe === '1y') days = 365;
    
    const cutoffDate = now - days * 24 * 60 * 60 * 1000;
    return data.chartData.filter(d => new Date(d.date).getTime() >= cutoffDate);
  };

  const chartData = getFilteredChartData();

  // Chart calculations
  const chartWidth = 800;
  const chartHeight = 400;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 40;
  const paddingBottom = 80;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const values = chartData.map(d => d.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, maxValue * 0.5);
  const valueRange = maxValue - minValue || 1;

  const getX = (index: number) => paddingLeft + (index / (chartData.length - 1 || 1)) * plotWidth;
  const getY = (value: number) => paddingTop + plotHeight - ((value - minValue) / valueRange) * plotHeight;

  const linePoints = chartData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  // Donut chart for constituents
  const topConstituents = data ? data.constituents.slice(0, 10) : [];
  const totalTopWeight = topConstituents.reduce((sum, c) => sum + c.weight, 0);

  const createDonutPath = (
    centerX: number,
    centerY: number,
    outerRadius: number,
    innerRadius: number,
    startAngle: number,
    endAngle: number
  ): string => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
    const y2 = centerY + outerRadius * Math.sin(endAngleRad);
    
    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  const colors = [
    '#F7931A', '#627EEA', '#000000', '#14F195', '#F3BA2F',
    '#C9B037', '#0D1E30', '#3C3C3D', '#00D9A5', '#9CA3AF',
  ];

  let currentAngle = -90;
  const donutCenterX = 200;
  const donutCenterY = 200;
  const donutRadius = 160;
  const donutInnerRadius = 110;
  const donutSegments = topConstituents.map((constituent, index) => {
    const percentage = (constituent.weight / totalTopWeight) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const path = createDonutPath(donutCenterX, donutCenterY, donutRadius, donutInnerRadius, startAngle, endAngle);
    currentAngle = endAngle;
    return { ...constituent, path, color: colors[index % colors.length] };
  });

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

  const displayedConstituents = showAllConstituents ? data.constituents : data.constituents.slice(0, 10);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Dijital Market 20 Index | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full py-8">
        {/* Header */}
        <div className="w-full px-4 mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dijital Market 20 Index</h1>
          <div className="flex gap-3 mb-4">
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Factsheet
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              Methodology
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              API Details
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              More Details
            </button>
          </div>
          <p className="text-gray-600 text-lg max-w-4xl">
            Dünyanın en güvenilir kripto para veri otoritesi tarafından oluşturulan Dijital Market 20 Index (DM20), 
            kripto para piyasalarının performansını takip etmenin en tarafsız, şeffaf ve veri odaklı yolunu sunar.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Cards */}
            <div className="lg:col-span-1 space-y-6">
              {/* CMC20 Current Value */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="text-sm text-gray-600 mb-2">DM20</div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {formatCurrency(data.currentValue)}
                </div>
                <div className={`text-lg font-semibold ${getPercentageColor(data.change24h)}`}>
                  {formatPercentage(data.change24h)} (24h)
                </div>
              </div>

              {/* Historical Values */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Geçmiş Değerler</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Dün</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(data.historicalValues.yesterday)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Geçen Hafta</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(data.historicalValues.lastWeek)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Geçen Ay</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(data.historicalValues.lastMonth)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Yearly Performance */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Yıllık Performans</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">
                      Yıllık Yüksek ({new Date(data.yearlyPerformance.highDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })})
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(data.yearlyPerformance.high)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">
                      Yıllık Düşük ({new Date(data.yearlyPerformance.lowDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })})
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(data.yearlyPerformance.low)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Chart */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Dijital Market 20 Index Grafiği</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedView('CMC20')}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        selectedView === 'CMC20'
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      DM20
                    </button>
                    <button
                      onClick={() => setSelectedView('Weights')}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        selectedView === 'Weights'
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Bileşen Ağırlıkları
                    </button>
                    <div className="flex gap-1 ml-2">
                      {[
                        { key: '24h', label: '24s' },
                        { key: '7d', label: '7g' },
                        { key: '30d', label: '30g' },
                        { key: '1y', label: '1y' },
                        { key: 'All', label: 'Tümü' },
                      ].map((timeframe) => (
                        <button
                          key={timeframe.key}
                          onClick={() => setSelectedTimeframe(timeframe.key)}
                          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                            selectedTimeframe === timeframe.key
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {timeframe.label}
                        </button>
                      ))}
                    </div>
                    <button className="ml-2 p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="w-full overflow-x-auto">
                  <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                    {/* Y-axis grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                      const y = paddingTop + plotHeight - (ratio * plotHeight);
                      const value = minValue + valueRange * (1 - ratio);
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
                            x={paddingLeft - 15}
                            y={y + 5}
                            textAnchor="end"
                            className="text-sm fill-gray-700 font-semibold"
                          >
                            {formatCurrency(value)}
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
                    
                    {/* Current value line */}
                    <line
                      x1={paddingLeft}
                      y1={getY(data.currentValue)}
                      x2={paddingLeft + plotWidth}
                      y2={getY(data.currentValue)}
                      stroke="#2563EB"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                      opacity="0.5"
                    />
                    <text
                      x={paddingLeft + plotWidth - 5}
                      y={getY(data.currentValue) - 8}
                      textAnchor="end"
                      className="text-sm fill-[#2563EB] font-bold"
                    >
                      {formatCurrency(data.currentValue)}
                    </text>
                    
                    {/* Line chart */}
                    <polyline
                      points={linePoints}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Constituents Section */}
        <div className="w-full px-4 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-gray-900">Dijital Market 20 Index Bileşenleri</h2>
            <div className="text-sm text-gray-600">
              Son Güncelleme {new Date().toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Constituents Table */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">#</th>
                        <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase">Coin Adı</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase">Fiyat</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase">Fiyat 24h%</th>
                        <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 uppercase">Piyasa Değeri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {displayedConstituents.map((constituent, index) => (
                        <tr key={constituent.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 text-sm text-gray-900">{index + 1}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Image
                                src={constituent.image}
                                alt={constituent.name}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                              <div>
                                <div className="text-sm font-semibold text-gray-900">{constituent.name}</div>
                                <div className="text-xs text-gray-600">{constituent.symbol.toUpperCase()}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(constituent.current_price)}
                          </td>
                          <td className={`py-4 px-4 text-right text-sm font-semibold ${getPercentageColor(constituent.price_change_percentage_24h)}`}>
                            <div className="flex items-center justify-end gap-1">
                              {constituent.price_change_percentage_24h >= 0 ? '▲' : '▼'}
                              {formatPercentage(constituent.price_change_percentage_24h)}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right text-sm text-gray-900">
                            {formatCurrency(constituent.market_cap)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!showAllConstituents && data.constituents.length > 10 && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => setShowAllConstituents(true)}
                      className="w-full py-2 text-center text-sm font-medium text-[#2563EB] hover:text-[#1E40AF] transition-colors"
                    >
                      Daha Fazla Göster
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">En Büyük Bileşenler</h3>
                <div className="flex items-center justify-center mb-4">
                  <svg width="400" height="400" viewBox="0 0 400 400">
                    {donutSegments.map((segment, index) => (
                      <path
                        key={index}
                        d={segment.path}
                        fill={segment.color}
                        stroke="#fff"
                        strokeWidth="4"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                    <text
                      x={200}
                      y={180}
                      textAnchor="middle"
                      className="text-sm font-semibold fill-gray-600"
                    >
                      Toplam Bileşenler:
                    </text>
                    <text
                      x={200}
                      y={200}
                      textAnchor="middle"
                      className="text-xl font-bold fill-gray-900"
                    >
                      {data.totalConstituents}
                    </text>
                  </svg>
                </div>
                <div className="space-y-2">
                  {donutSegments.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }} />
                        <span className="text-sm text-gray-700">{segment.symbol.toUpperCase()}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{segment.weight.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About and Learn More Sections - Side by Side */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* About Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Dijital Market 20 Index Hakkında</h2>
              <div className="space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === 'what-is' ? null : 'what-is')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-semibold text-gray-900">Dijital Market 20 Index nedir?</span>
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
                        Dijital Market 20 Index (DM20), dünyanın en güvenilir kripto para veri otoritesi tarafından oluşturulan, 
                        kripto para piyasalarının performansını takip etmenin en tarafsız, şeffaf ve veri odaklı yoludur. 
                        Index, piyasa değerine göre en büyük 20 kripto paranın ağırlıklı ortalamasına dayanmaktadır.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === 'methodology' ? null : 'methodology')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-semibold text-gray-900">Dijital Market 20 Index metodolojisi nedir?</span>
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
                        DM20 Index, piyasa değerine göre en büyük 20 kripto paranın ağırlıklı ortalamasına dayanır. 
                        Her bileşenin ağırlığı, toplam piyasa değerine göre belirlenir ve düzenli olarak güncellenir.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === 'importance' ? null : 'importance')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-semibold text-gray-900">Dijital Market 20 Index neden önemlidir?</span>
                    <svg
                      className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'importance' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFAQ === 'importance' && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <p className="text-gray-600 leading-relaxed">
                        DM20 Index, kripto para piyasasının genel sağlığını ve trendlerini anlamak için önemli bir göstergedir. 
                        Yatırımcılar ve analistler, piyasanın genel performansını takip etmek için bu index&apos;i kullanabilir.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === 'invest' ? null : 'invest')}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-lg font-semibold text-gray-900">Dijital Market Index&apos;e doğrudan yatırım yapabilir miyim?</span>
                    <svg
                      className={`w-5 h-5 text-gray-600 transform transition-transform ${expandedFAQ === 'invest' ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {expandedFAQ === 'invest' && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <p className="text-gray-600 leading-relaxed">
                        DM20 Index bir yatırım aracı değil, bir performans göstergesidir. Ancak, index&apos;in bileşenlerine 
                        bireysel olarak yatırım yaparak benzer bir portföy oluşturabilirsiniz.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Learn More Section */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">DM20 Hakkında Daha Fazla Bilgi</h2>
              <div className="space-y-4">
                {[
                  { title: 'FACTSHEET', subtitle: 'Dijital Market 20 Index' },
                  { title: 'METHODOLOGY', subtitle: 'Dijital Market 20 Index' },
                  { title: 'PRESS RELEASE', subtitle: 'Dijital Market 20 Index' },
                ].map((item, index) => (
                  <button
                    key={index}
                    className="w-full bg-gradient-to-br from-[#2563EB] to-[#1E40AF] rounded-xl p-6 text-white hover:shadow-xl transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="text-sm font-semibold">{item.title}</span>
                    </div>
                    <div className="text-lg font-bold">{item.subtitle}</div>
                  </button>
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

export default CMC20Page;
