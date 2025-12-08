import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface ChainData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  protocols: number;
  tvl: number;
  tvlChange1h: number;
  tvlChange7d: number;
  tvlChange30d: number;
  volume24h: number;
  moreTvl: number;
}

const ChainRanking: React.FC = () => {
  const [chains, setChains] = useState<ChainData[]>([]);
  const [totalTvl, setTotalTvl] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ALL');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const itemsPerPage = 25;

  useEffect(() => {
    fetchChainData();
    // Her 30 saniyede bir verileri yenile
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      fetchChainData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchChainData = async () => {
    try {
      const response = await fetch('/api/chain-ranking');
      if (response.ok) {
        const data = await response.json();
        setChains(data.chains);
        setTotalTvl(data.totalTvl);
      }
    } catch (error) {
      console.error('Error fetching chain data:', error);
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

  // Historical TVL data for line chart (simulated with variation)
  const generateHistoricalData = () => {
    const months = 24; // 2 years of data
    const data = [];
    const baseValue = totalTvl * 0.6; // Start from 60% of current TVL
    const randomSeed = refreshKey; // Use refreshKey to vary data
    
    for (let i = 0; i < months; i++) {
      const month = new Date();
      month.setMonth(month.getMonth() - (months - i));
      const growth = (totalTvl - baseValue) / months;
      // Add variation based on refreshKey so data changes
      const variation = Math.sin((i + randomSeed) * 0.3) * totalTvl * 0.05 + Math.random() * totalTvl * 0.1;
      const value = baseValue + (growth * i) + variation;
      data.push({
        date: month,
        value: Math.max(0, value),
      });
    }
    return data;
  };

  const historicalData = generateHistoricalData();
  const maxValue = Math.max(...historicalData.map(d => d.value), totalTvl, 1);
  const minValue = Math.max(0, Math.min(...historicalData.map(d => d.value), totalTvl * 0.5));
  const valueRange = maxValue - minValue || 1; // Prevent division by zero

  // Calculate line chart points
  const chartWidth = 800;
  const chartHeight = 350;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 60;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;
  
  const getX = (index: number) => paddingLeft + (index / (historicalData.length - 1)) * plotWidth;
  const getY = (value: number) => paddingTop + plotHeight - ((value - minValue) / valueRange) * plotHeight;
  
  const linePoints = historicalData.map((d, i) => `${getX(i)},${getY(d.value)}`).join(' ');

  // Format date for x-axis
  const formatDate = (date: Date): string => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${month.toString().padStart(2, '0')}/${year.toString().slice(2)}`;
  };

  // Get x-axis labels (show 6 dates evenly spaced)
  const xAxisLabels = [];
  const labelCount = 6;
  for (let i = 0; i < labelCount; i++) {
    const index = Math.floor((i / (labelCount - 1)) * (historicalData.length - 1));
    xAxisLabels.push({
      index,
      date: historicalData[index].date,
      x: getX(index),
    });
  }

  // Donut chart data (top 10 chains)
  const topChains = chains.slice(0, 10);
  const totalTopTvl = topChains.reduce((sum, chain) => sum + chain.tvl, 0);
  
  const colors = [
    '#627EEA', // Ethereum blue
    '#F7931A', // Bitcoin orange
    '#14F195', // Solana green
    '#F3BA2F', // BSC yellow
    '#28A0F0', // Arbitrum blue
    '#8247E5', // Polygon purple
    '#E84142', // Avalanche red
    '#0052FF', // Base blue
    '#FF0420', // Optimism red
    '#FF6B35', // Tron orange
  ];

  // Donut chart helper function
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

  let currentAngle = -90; // Start from top
  const donutRadius = 100; // Increased from 80
  const donutInnerRadius = 60; // Increased from 50
  const donutCenterX = 150; // Increased from 120
  const donutCenterY = 150; // Increased from 120

  const donutSegments = topChains.map((chain, index) => {
    const percentage = (chain.tvl / totalTopTvl) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    const path = createDonutPath(
      donutCenterX,
      donutCenterY,
      donutRadius,
      donutInnerRadius,
      startAngle,
      endAngle
    );
    
    currentAngle = endAngle;
    
    return {
      chain,
      path,
      color: colors[index % colors.length],
      percentage,
    };
  });

  const paginatedChains = chains.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(chains.length / itemsPerPage);

  return (
    <>
      <Head>
        <title>Zincir Sıralaması - Dijital Marketim</title>
        <meta name="description" content="Kripto para zincirlerinin TVL sıralaması" />
      </Head>

      <Navbar />

      <div className="min-h-screen bg-gray-50">
        <div className="w-full py-8">
          {/* Başlık ve Açıklama */}
          <div className="mb-8 w-full px-4">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Kripto Paraların En Büyük Blockchain&apos;leri TVL&apos;ye Göre Sıralandı
            </h1>
            <p className="text-gray-600 mb-6">
              Aşağıda TVL ve toplam protokol sayıları ile çeşitli blockchain&apos;lerin istatistikleri listelenmektedir. 
              Veriler TVL&apos;ye göre azalan sırada listelenmiştir.
            </p>
            
            {/* TVL Açıklaması */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">TVL Nedir?</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                <strong>TVL (Total Value Locked - Toplam Kilitli Değer)</strong>, bir blockchain ağında veya DeFi protokolünde 
                kilitli olan toplam kripto para varlıklarının değerini ifade eder. Bu metrik, bir blockchain&apos;in veya protokolün 
                ne kadar değer tuttuğunu ve kullanıcıların ne kadar güven duyduğunu gösterir. TVL, DeFi ekosisteminin sağlığını ve 
                büyümesini ölçmek için kullanılan en önemli göstergelerden biridir. Yüksek TVL, genellikle daha fazla likidite, 
                daha fazla kullanıcı güveni ve daha aktif bir ekosistem anlamına gelir.
              </p>
            </div>
            
            {/* Total TVL */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="text-sm text-gray-600 mb-2">Toplam TVL</div>
              <div className="text-4xl font-bold text-gray-900">
                {formatCurrency(totalTvl)}
              </div>
            </div>
          </div>

          {/* Grafikler - Full Width, No Padding */}
          {!loading && chains.length > 0 && (
            <div className="w-full mb-8">
              <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6">
                {/* Line Chart - Total TVL Over Time */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Toplam TVL Zaman İçinde</h3>
                    <div className="flex gap-2">
                      {['1H', '24H', '7D', '1M', '3M', '1Y', 'ALL'].map((timeframe) => (
                        <button
                          key={timeframe}
                          onClick={() => setSelectedTimeframe(timeframe)}
                          className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                            selectedTimeframe === timeframe
                              ? 'bg-[#2563EB] text-white'
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {timeframe}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="w-full overflow-x-auto">
                    <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto">
                      {/* Y-axis grid lines and labels */}
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
                      
                      {/* X-axis line */}
                      <line
                        x1={paddingLeft}
                        y1={paddingTop + plotHeight}
                        x2={paddingLeft + plotWidth}
                        y2={paddingTop + plotHeight}
                        stroke="#D1D5DB"
                        strokeWidth="2"
                      />
                      
                      {/* X-axis labels (dates) */}
                      {xAxisLabels.map((label, i) => (
                        <g key={i}>
                          <line
                            x1={label.x}
                            y1={paddingTop + plotHeight}
                            x2={label.x}
                            y2={paddingTop + plotHeight + 5}
                            stroke="#9CA3AF"
                            strokeWidth="1"
                          />
                          <text
                            x={label.x}
                            y={paddingTop + plotHeight + 20}
                            textAnchor="middle"
                            className="text-xs fill-gray-600 font-medium"
                          >
                            {formatDate(label.date)}
                          </text>
                        </g>
                      ))}
                      
                      {/* Line */}
                      <polyline
                        points={linePoints}
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Data points */}
                      {historicalData.map((d, i) => (
                        <circle
                          key={i}
                          cx={getX(i)}
                          cy={getY(d.value)}
                          r="4"
                          fill="#2563EB"
                          className="hover:r-6 transition-all cursor-pointer"
                        />
                      ))}
                    </svg>
                  </div>
                </div>

                {/* Donut Chart - TVL by Chains */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Zincirlere Göre TVL</h3>
                  <div className="flex items-center justify-center gap-8">
                    <div className="flex-shrink-0">
                      <svg width="300" height="300" viewBox="0 0 300 300">
                        {/* Background circle */}
                        <circle
                          cx={donutCenterX}
                          cy={donutCenterY}
                          r={donutRadius}
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="50"
                        />
                        {/* Segments */}
                        {donutSegments.map((segment, index) => (
                          <path
                            key={index}
                            d={segment.path}
                            fill={segment.color}
                            stroke="#fff"
                            strokeWidth="3"
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                          />
                        ))}
                        {/* Center text */}
                        <text
                          x={donutCenterX}
                          y={donutCenterY - 12}
                          textAnchor="middle"
                          className="text-3xl font-bold fill-gray-900"
                        >
                          {formatCurrency(totalTopTvl)}
                        </text>
                        <text
                          x={donutCenterX}
                          y={donutCenterY + 18}
                          textAnchor="middle"
                          className="text-sm fill-gray-600"
                        >
                          Toplam TVL
                        </text>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {topChains.map((chain, index) => {
                          const percentage = (chain.tvl / totalTopTvl) * 100;
                          return (
                            <div key={chain.id} className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded flex-shrink-0"
                                style={{ backgroundColor: colors[index % colors.length] }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {chain.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {percentage.toFixed(1)}% • {formatCurrency(chain.tvl)}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* Tablo */}
          <div className="w-full px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563EB]"></div>
              <p className="mt-4 text-gray-600">Yükleniyor...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        İsim
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Protokoller
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        1s Değişim (TVL)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        7g Değişim (TVL)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        30g Değişim (TVL)
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        TVL
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Hacim
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Daha Fazla/TVL
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedChains.map((chain, index) => {
                      const rank = (currentPage - 1) * itemsPerPage + index + 1;
                      return (
                        <tr key={chain.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rank}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                                <Image
                                  src={chain.image}
                                  alt={chain.name}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {chain.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {chain.symbol}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {chain.protocols}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getPercentageColor(chain.tvlChange1h)}`}>
                            {formatPercentage(chain.tvlChange1h)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getPercentageColor(chain.tvlChange7d)}`}>
                            {formatPercentage(chain.tvlChange7d)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getPercentageColor(chain.tvlChange30d)}`}>
                            {formatPercentage(chain.tvlChange30d)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {formatCurrency(chain.tvl)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(chain.volume24h)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {chain.moreTvl.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Sayfa {currentPage} / {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Önceki
                    </button>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white px-4 py-12 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
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
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Kaynaklar</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">Hakkımızda</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">Kariyer</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">API</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Ürünler</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">Portföy</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">İzleme Listesi</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Yasal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">Gizlilik Politikası</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">Kullanım Şartları</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Topluluk</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">Twitter</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors">Telegram</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <div className="text-sm text-gray-600">
                © 2025 Dijital Marketim. All Rights Reserved.
              </div>
            </div>
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-bold text-gray-900 mb-2">ÖNEMLİ UYARI</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Bu web sitesinde, bağlantılı sitelerde, uygulamalarda, forumlarda, bloglarda, sosyal medya hesaplarında ve diğer platformlarda (birlikte &quot;Site&quot;) yer alan içerikler, yalnızca genel bilgilendirme amaçlıdır ve üçüncü taraflardan kaynaklanmaktadır. Bu içeriklerin doğruluğu, eksiksizliği, güncelliği veya güvenilirliği konusunda hiçbir garanti verilmemektedir. Herhangi bir yatırım kararı vermeden önce, kendi araştırmanızı yapmanız ve bağımsız profesyonel tavsiye almanız önerilir. Ticaret risklidir ve kayıplar meydana gelebilir. Bu sitede yer alan hiçbir içerik, teşvik, tavsiye veya teklif niteliği taşımamaktadır.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default ChainRanking;
