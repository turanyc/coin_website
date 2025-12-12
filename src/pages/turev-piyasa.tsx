import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface DerivativesMarketData {
  futuresOpenInterest: number;
  futuresOpenInterestChange24h: number;
  perpetualsOpenInterest: number;
  perpetualsOpenInterestChange24h: number;
  futuresOpenInterestYesterday: number;
  perpetualsOpenInterestYesterday: number;
  futuresOpenInterestLastWeek: number;
  perpetualsOpenInterestLastWeek: number;
  futuresOpenInterestLastMonth: number;
  perpetualsOpenInterestLastMonth: number;
  futuresOpenInterestYearlyHigh: number;
  futuresOpenInterestYearlyHighDate: string;
  perpetualsOpenInterestYearlyHigh: number;
  perpetualsOpenInterestYearlyHighDate: string;
  futuresOpenInterestYearlyLow: number;
  futuresOpenInterestYearlyLowDate: string;
  perpetualsOpenInterestYearlyLow: number;
  perpetualsOpenInterestYearlyLowDate: string;
  openInterestHistory: Array<{ date: string; futures: number; perpetuals: number; marketCap: number }>;
  derivativesVolumeHistory: Array<{ date: string; futures: number; perpetuals: number; marketCap: number }>;
  fundingRatesHistory: Array<{ date: string; fundingRate: number; marketCap: number }>;
  futuresVolume24h: number;
  futuresVolumeChange24h: number;
  perpetualsVolume24h: number;
  perpetualsVolumeChange24h: number;
  marketCap: number;
  marketCapChange24h: number;
  currentFundingRate: number;
}

const TurevPiyasa: React.FC = () => {
  const [data, setData] = useState<DerivativesMarketData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');
  const [selectedOpenInterestType, setSelectedOpenInterestType] = useState<string>('Futures');
  const [selectedVolumeType, setSelectedVolumeType] = useState<string>('Futures');
  const [selectedTopCoins, setSelectedTopCoins] = useState<string>('Top Coins');

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/derivatives-market');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching derivatives market data:', error);
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
    if (!data) return { openInterest: [], volume: [], funding: [] };
    
    const all = data.openInterestHistory.length;
    let count = 30;
    if (selectedTimeframe === '1y') count = Math.min(365, all);
    else if (selectedTimeframe === 'All') count = all;
    else if (selectedTimeframe === '7d') count = 7;
    else if (selectedTimeframe === '24h') count = 1;
    
    const start = all - count;
    return {
      openInterest: data.openInterestHistory.slice(start),
      volume: data.derivativesVolumeHistory.slice(start),
      funding: data.fundingRatesHistory.slice(start),
    };
  };

  const history = getFilteredHistory();

  // Open Interest Chart
  const openInterestChartWidth = 1200;
  const openInterestChartHeight = 400;
  const oiPaddingLeft = 60;
  const oiPaddingRight = 20;
  const oiPaddingTop = 40;
  const oiPaddingBottom = 80;
  const oiPlotWidth = openInterestChartWidth - oiPaddingLeft - oiPaddingRight;
  const oiPlotHeight = openInterestChartHeight - oiPaddingTop - oiPaddingBottom;

  const futuresValues = history.openInterest.map(d => d.futures);
  const perpetualsValues = history.openInterest.map(d => d.perpetuals);
  const marketCapValues = history.openInterest.map(d => d.marketCap);
  const oiMax = Math.max(...futuresValues, ...perpetualsValues, ...marketCapValues, 1);
  const oiMin = Math.min(...futuresValues, ...perpetualsValues, ...marketCapValues, oiMax * 0.5);
  const oiRange = oiMax - oiMin || 1;

  const getOiX = (index: number) => oiPaddingLeft + (index / (history.openInterest.length - 1 || 1)) * oiPlotWidth;
  const getOiY = (value: number) => oiPaddingTop + oiPlotHeight - ((value - oiMin) / oiRange) * oiPlotHeight;

  const futuresLinePoints = history.openInterest.map((d, i) => `${getOiX(i)},${getOiY(d.futures)}`).join(' ');
  const perpetualsLinePoints = history.openInterest.map((d, i) => `${getOiX(i)},${getOiY(d.perpetuals)}`).join(' ');
  const marketCapLinePoints = history.openInterest.map((d, i) => `${getOiX(i)},${getOiY(d.marketCap)}`).join(' ');

  // Derivatives Volume Chart
  const volumeChartWidth = 1200;
  const volumeChartHeight = 400;
  const volPaddingLeft = 60;
  const volPaddingRight = 20;
  const volPaddingTop = 40;
  const volPaddingBottom = 80;
  const volPlotWidth = volumeChartWidth - volPaddingLeft - volPaddingRight;
  const volPlotHeight = volumeChartHeight - volPaddingTop - volPaddingBottom;

  const futuresVolValues = history.volume.map(d => d.futures);
  const perpetualsVolValues = history.volume.map(d => d.perpetuals);
  const volMarketCapValues = history.volume.map(d => d.marketCap);
  const volMax = Math.max(...futuresVolValues, ...perpetualsVolValues, ...volMarketCapValues, 1);
  const volMin = Math.min(...futuresVolValues, ...perpetualsVolValues, ...volMarketCapValues, volMax * 0.5);
  const volRange = volMax - volMin || 1;

  const getVolX = (index: number) => volPaddingLeft + (index / (history.volume.length - 1 || 1)) * volPlotWidth;
  const getVolY = (value: number) => volPaddingTop + volPlotHeight - ((value - volMin) / volRange) * volPlotHeight;

  const futuresVolLinePoints = history.volume.map((d, i) => `${getVolX(i)},${getVolY(d.futures)}`).join(' ');
  const perpetualsVolLinePoints = history.volume.map((d, i) => `${getVolX(i)},${getVolY(d.perpetuals)}`).join(' ');
  const volMarketCapLinePoints = history.volume.map((d, i) => `${getVolX(i)},${getVolY(d.marketCap)}`).join(' ');

  // Funding Rates Chart
  const fundingChartWidth = 1200;
  const fundingChartHeight = 400;
  const fundPaddingLeft = 60;
  const fundPaddingRight = 20;
  const fundPaddingTop = 40;
  const fundPaddingBottom = 80;
  const fundPlotWidth = fundingChartWidth - fundPaddingLeft - fundPaddingRight;
  const fundPlotHeight = fundingChartHeight - fundPaddingTop - fundPaddingBottom;

  const fundingRateValues = history.funding.map(d => d.fundingRate);
  const fundMarketCapValues = history.funding.map(d => d.marketCap);
  const fundRateMax = Math.max(...fundingRateValues.map(Math.abs), 0.01);
  const fundRateMin = -fundRateMax;
  const fundRateRange = fundRateMax - fundRateMin || 1;
  const fundMarketCapMax = Math.max(...fundMarketCapValues, 1);
  const fundMarketCapMin = Math.min(...fundMarketCapValues, fundMarketCapMax * 0.8);
  const fundMarketCapRange = fundMarketCapMax - fundMarketCapMin || 1;

  const getFundX = (index: number) => fundPaddingLeft + (index / (history.funding.length - 1 || 1)) * fundPlotWidth;
  const getFundRateY = (value: number) => {
    const ratio = (value - fundRateMin) / fundRateRange;
    return fundPaddingTop + fundPlotHeight * 0.3 - (ratio * fundPlotHeight * 0.3);
  };
  const getFundMarketCapY = (value: number) => {
    const ratio = (value - fundMarketCapMin) / fundMarketCapRange;
    return fundPaddingTop + fundPlotHeight * 0.3 + (ratio * fundPlotHeight * 0.7);
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
        <title>Türev Piyasa | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full py-8">
        {/* Header */}
        <div className="w-full px-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Türev Piyasa</h1>
          <p className="text-gray-600 text-base max-w-4xl">
            Kripto para türev piyasası veri sayfamızı keşfedin; vadeli işlem ve sürekli sözleşmeler için açık pozisyon, 
            işlem hacimleri ve fonlama oranlarını gösterir. Tarihsel değerler, yıllık performans ve en iyi 100 coin fonlama 
            oranı dağılımına dalın.
          </p>
        </div>

        {/* Open Interest Section */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Open Interest Data - Left Panel */}
            <div className="lg:col-span-1 flex flex-col gap-6">
              {/* Current Open Interest */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Açık Pozisyon</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Vadeli İşlemler</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(data.futuresOpenInterest)}</div>
                    <div className={`text-sm font-semibold ${getPercentageColor(data.futuresOpenInterestChange24h)}`}>
                      {formatPercentage(data.futuresOpenInterestChange24h)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Sürekli Sözleşmeler</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(data.perpetualsOpenInterest)}</div>
                    <div className={`text-sm font-semibold ${getPercentageColor(data.perpetualsOpenInterestChange24h)}`}>
                      {formatPercentage(data.perpetualsOpenInterestChange24h)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Values */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Geçmiş Değerler</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Dün</div>
                    <div className="text-sm font-semibold text-gray-900">
                      Vadeli: {formatCurrency(data.futuresOpenInterestYesterday)}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Sürekli: {formatCurrency(data.perpetualsOpenInterestYesterday)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Geçen Hafta</div>
                    <div className="text-sm font-semibold text-gray-900">
                      Vadeli: {formatCurrency(data.futuresOpenInterestLastWeek)}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Sürekli: {formatCurrency(data.perpetualsOpenInterestLastWeek)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Geçen Ay</div>
                    <div className="text-sm font-semibold text-gray-900">
                      Vadeli: {formatCurrency(data.futuresOpenInterestLastMonth)}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      Sürekli: {formatCurrency(data.perpetualsOpenInterestLastMonth)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Yearly Performance */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Yıllık Performans</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Yıllık Yüksek</div>
                    <div className="text-sm font-semibold text-green-600">
                      Vadeli: {formatCurrency(data.futuresOpenInterestYearlyHigh)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(data.futuresOpenInterestYearlyHighDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-sm font-semibold text-green-600 mt-2">
                      Sürekli: {formatCurrency(data.perpetualsOpenInterestYearlyHigh)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(data.perpetualsOpenInterestYearlyHighDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Yıllık Düşük</div>
                    <div className="text-sm font-semibold text-red-600">
                      Vadeli: {formatCurrency(data.futuresOpenInterestYearlyLow)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(data.futuresOpenInterestYearlyLowDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-sm font-semibold text-red-600 mt-2">
                      Sürekli: {formatCurrency(data.perpetualsOpenInterestYearlyLow)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(data.perpetualsOpenInterestYearlyLowDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Open Interest Chart - Right Panel */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Açık Pozisyon</h2>
                <div className="flex gap-2 flex-wrap">
                  {['Futures', 'Perpetuals', 'Crypto Market Cap'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedOpenInterestType(type)}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        selectedOpenInterestType === type
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
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
                <svg width={openInterestChartWidth} height={openInterestChartHeight} viewBox={`0 0 ${openInterestChartWidth} ${openInterestChartHeight}`} className="w-full h-auto">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = oiPaddingTop + oiPlotHeight - (ratio * oiPlotHeight);
                    const value = oiMin + oiRange * (1 - ratio);
                    return (
                      <g key={ratio}>
                        <line
                          x1={oiPaddingLeft}
                          y1={y}
                          x2={oiPaddingLeft + oiPlotWidth}
                          y2={y}
                          stroke="#E5E7EB"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={oiPaddingLeft - 10}
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
                    x1={oiPaddingLeft}
                    y1={oiPaddingTop + oiPlotHeight}
                    x2={oiPaddingLeft + oiPlotWidth}
                    y2={oiPaddingTop + oiPlotHeight}
                    stroke="#D1D5DB"
                    strokeWidth="2"
                  />
                  
                  {history.openInterest.map((d, i) => {
                    if (i % Math.ceil(history.openInterest.length / 6) !== 0 && i !== history.openInterest.length - 1) return null;
                    const x = getOiX(i);
                    const date = new Date(d.date);
                    const dateStr = `${date.getDate()} ${date.toLocaleDateString('tr-TR', { month: 'short' })}`;
                    return (
                      <g key={i}>
                        <line
                          x1={x}
                          y1={oiPaddingTop + oiPlotHeight}
                          x2={x}
                          y2={oiPaddingTop + oiPlotHeight + 5}
                          stroke="#9CA3AF"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={oiPaddingTop + oiPlotHeight + 20}
                          textAnchor="middle"
                          className="text-xs fill-gray-600 font-medium"
                        >
                          {dateStr}
                        </text>
                      </g>
                    );
                  })}
                  
                  {(selectedOpenInterestType === 'Futures' || selectedOpenInterestType === 'All') && (
                    <polyline
                      points={futuresLinePoints}
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {(selectedOpenInterestType === 'Perpetuals' || selectedOpenInterestType === 'All') && (
                    <polyline
                      points={perpetualsLinePoints}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {(selectedOpenInterestType === 'Crypto Market Cap' || selectedOpenInterestType === 'All') && (
                    <polyline
                      points={marketCapLinePoints}
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Derivatives Volume and Funding Rates Charts - Side by Side */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Derivatives Volume Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Türev Hacim</h2>
                <div className="flex gap-2 flex-wrap">
                  {['Futures', 'Perpetuals', 'Crypto Market Cap'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedVolumeType(type)}
                      className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                        selectedVolumeType === type
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
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
              <div className="mb-4 flex gap-6">
                <div>
                  <div className="text-sm text-gray-600">Vadeli İşlemler</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.futuresVolume24h)}</div>
                  <div className={`text-sm font-semibold ${getPercentageColor(data.futuresVolumeChange24h)}`}>
                    {formatPercentage(data.futuresVolumeChange24h)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Sürekli Sözleşmeler</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.perpetualsVolume24h)}</div>
                  <div className={`text-sm font-semibold ${getPercentageColor(data.perpetualsVolumeChange24h)}`}>
                    {formatPercentage(data.perpetualsVolumeChange24h)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Kripto Piyasa Değeri</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.marketCap)}</div>
                  <div className={`text-sm font-semibold ${getPercentageColor(data.marketCapChange24h)}`}>
                    {formatPercentage(data.marketCapChange24h)}
                  </div>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <svg width={volumeChartWidth} height={volumeChartHeight} viewBox={`0 0 ${volumeChartWidth} ${volumeChartHeight}`} className="w-full h-auto">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = volPaddingTop + volPlotHeight - (ratio * volPlotHeight);
                    const value = volMin + volRange * (1 - ratio);
                    return (
                      <g key={ratio}>
                        <line
                          x1={volPaddingLeft}
                          y1={y}
                          x2={volPaddingLeft + volPlotWidth}
                          y2={y}
                          stroke="#E5E7EB"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={volPaddingLeft - 10}
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
                    x1={volPaddingLeft}
                    y1={volPaddingTop + volPlotHeight}
                    x2={volPaddingLeft + volPlotWidth}
                    y2={volPaddingTop + volPlotHeight}
                    stroke="#D1D5DB"
                    strokeWidth="2"
                  />
                  
                  {history.volume.map((d, i) => {
                    if (i % Math.ceil(history.volume.length / 6) !== 0 && i !== history.volume.length - 1) return null;
                    const x = getVolX(i);
                    const date = new Date(d.date);
                    const dateStr = `${date.getDate()} ${date.toLocaleDateString('tr-TR', { month: 'short' })} ${date.getFullYear()}`;
                    return (
                      <g key={i}>
                        <line
                          x1={x}
                          y1={volPaddingTop + volPlotHeight}
                          x2={x}
                          y2={volPaddingTop + volPlotHeight + 5}
                          stroke="#9CA3AF"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={volPaddingTop + volPlotHeight + 20}
                          textAnchor="middle"
                          className="text-xs fill-gray-600 font-medium"
                        >
                          {dateStr}
                        </text>
                      </g>
                    );
                  })}
                  
                  {(selectedVolumeType === 'Futures' || selectedVolumeType === 'All') && (
                    <polyline
                      points={futuresVolLinePoints}
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {(selectedVolumeType === 'Perpetuals' || selectedVolumeType === 'All') && (
                    <polyline
                      points={perpetualsVolLinePoints}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {(selectedVolumeType === 'Crypto Market Cap' || selectedVolumeType === 'All') && (
                    <polyline
                      points={volMarketCapLinePoints}
                      fill="none"
                      stroke="#D1D5DB"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* Funding Rates Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Fonlama Oranları</h2>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={selectedTopCoins}
                    onChange={(e) => setSelectedTopCoins(e.target.value)}
                    className="px-3 py-1 text-sm font-medium rounded bg-gray-100 text-gray-600 border border-gray-300"
                  >
                    <option value="Top Coins">En İyi Coinler</option>
                  </select>
                  {['24h', '7d', '30d'].map((timeframe) => (
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
                  <div className="text-sm text-gray-600">Fonlama Oranı</div>
                  <div className="text-2xl font-bold text-gray-900">{data.currentFundingRate.toFixed(3)}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Kripto Piyasa Değeri</div>
                  <div className="text-2xl font-bold text-gray-900">{formatCurrency(data.marketCap)}</div>
                </div>
              </div>
              <div className="w-full overflow-x-auto">
                <svg width={fundingChartWidth} height={fundingChartHeight} viewBox={`0 0 ${fundingChartWidth} ${fundingChartHeight}`} className="w-full h-auto">
                  {/* Funding Rate Y-axis (left, top 30%) */}
                  {[-1, -0.5, 0, 0.5, 1].map((ratio) => {
                    const y = fundPaddingTop + fundPlotHeight * 0.3 - (ratio * fundPlotHeight * 0.3);
                    const value = fundRateMin + fundRateRange * ((ratio + 1) / 2);
                    return (
                      <g key={ratio}>
                        <line
                          x1={fundPaddingLeft}
                          y1={y}
                          x2={fundPaddingLeft + fundPlotWidth}
                          y2={y}
                          stroke="#E5E7EB"
                          strokeWidth="1"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={fundPaddingLeft - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="text-xs fill-gray-600 font-medium"
                        >
                          {value.toFixed(2)}%
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Market Cap Y-axis (right, bottom 70%) */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = fundPaddingTop + fundPlotHeight * 0.3 + (ratio * fundPlotHeight * 0.7);
                    const value = fundMarketCapMin + fundMarketCapRange * (1 - ratio);
                    return (
                      <g key={`mcap-${ratio}`}>
                        <text
                          x={fundPaddingLeft + fundPlotWidth + 10}
                          y={y + 4}
                          textAnchor="start"
                          className="text-xs fill-gray-600 font-medium"
                        >
                          {formatCurrency(value)}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Zero line for funding rate */}
                  <line
                    x1={fundPaddingLeft}
                    y1={fundPaddingTop + fundPlotHeight * 0.3}
                    x2={fundPaddingLeft + fundPlotWidth}
                    y2={fundPaddingTop + fundPlotHeight * 0.3}
                    stroke="#D1D5DB"
                    strokeWidth="2"
                  />
                  
                  <line
                    x1={fundPaddingLeft}
                    y1={fundPaddingTop + fundPlotHeight}
                    x2={fundPaddingLeft + fundPlotWidth}
                    y2={fundPaddingTop + fundPlotHeight}
                    stroke="#D1D5DB"
                    strokeWidth="2"
                  />
                  
                  {history.funding.map((d, i) => {
                    if (i % Math.ceil(history.funding.length / 6) !== 0 && i !== history.funding.length - 1) return null;
                    const x = getFundX(i);
                    const date = new Date(d.date);
                    const dateStr = `${date.getDate()} ${date.toLocaleDateString('tr-TR', { month: 'short' })}`;
                    return (
                      <g key={i}>
                        <line
                          x1={x}
                          y1={fundPaddingTop + fundPlotHeight}
                          x2={x}
                          y2={fundPaddingTop + fundPlotHeight + 5}
                          stroke="#9CA3AF"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={fundPaddingTop + fundPlotHeight + 20}
                          textAnchor="middle"
                          className="text-xs fill-gray-600 font-medium"
                        >
                          {dateStr}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* Funding rate bars */}
                  {history.funding.map((d, i) => {
                    const x = getFundX(i);
                    const barWidth = fundPlotWidth / history.funding.length;
                    const rateY = getFundRateY(d.fundingRate);
                    const zeroY = fundPaddingTop + fundPlotHeight * 0.3;
                    const height = Math.abs(rateY - zeroY);
                    return (
                      <rect
                        key={i}
                        x={x - barWidth / 2}
                        y={d.fundingRate >= 0 ? zeroY - height : zeroY}
                        width={barWidth * 0.8}
                        height={height}
                        fill={d.fundingRate >= 0 ? '#10B981' : '#EF4444'}
                        opacity="0.7"
                      />
                    );
                  })}
                  
                  {/* Market Cap line */}
                  <polyline
                    points={history.funding.map((d, i) => `${getFundX(i)},${getFundMarketCapY(d.marketCap)}`).join(' ')}
                    fill="none"
                    stroke="#9CA3AF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Derivatives Market Articles */}
        <div className="w-full px-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Türev Piyasa Makaleleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Kripto Sözlük - Türev Piyasa',
                subtitle: 'Crypto Glossary - Derivatives Market',
                description: 'Vadeli işlem sözleşmeleri veya opsiyonlar gibi diğer kripto para varlık biçimlerinden türetilen enstrümanlar için halka açık bir piyasa.',
                author: 'Dijital Marketim Akademi',
                time: '1 yıl önce • 3 dk',
              },
              {
                title: 'Dijital Marketim Araştırma - Kripto Türevleri: Bir Ekosistem Ön İncelemesi',
                subtitle: 'CMC Research - Crypto Derivatives: An Ecosystem Primer',
                description: 'Kripto türevlerinin küresel olarak rekor ~%79 kripto işlem hacmi payına sahip olmasıyla, yaygın türevleri ve kullanım durumlarının bir özetini sunuyoruz.',
                author: 'GSR',
                time: '1 yıl önce • 23 dk',
              },
              {
                title: 'Teknik Derinlemesine - Kripto Ekonomisinde Türevlerin Temel İşlevleri Nelerdir?',
                subtitle: 'Tech Deep Dives - What Are the Essential Functions of Derivatives in the Crypto Economy?',
                description: 'Binance Futures, kripto türevlerinin kripto alanında nasıl işlev gördüğünü derinlemesine inceliyor.',
                author: 'Binance Futures',
                time: '3 yıl önce • 7 dk',
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

export default TurevPiyasa;

