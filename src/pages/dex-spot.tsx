import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface Coin {
  id: string;
  rank: number;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  high_24h: number;
  low_24h: number;
  total_volume: number;
  market_cap: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

const DexSpotPage: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'spot' | 'futures' | 'new-listings' | 'zones'>('spot');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const fetchCoins = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h'
      );
      const data = await response.json();
      setCoins(data);
    } catch (error) {
      console.error('Coins çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
    const interval = setInterval(() => {
      fetchCoins();
    }, 60000); // Her 1 dakikada bir güncelle
    return () => clearInterval(interval);
  }, [fetchCoins]);

  const formatCurrency = (value: number | null): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
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

  const formatPrice = (value: number | null): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    if (value >= 1) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return `$${value.toFixed(6)}`;
    }
  };

  const formatPercentage = (value: number | null): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const renderSparkline = (coin: Coin) => {
    const sparkline = coin.sparkline_in_7d?.price || [];
    if (sparkline.length === 0) {
      return (
        <div className="w-24 h-10 flex items-center justify-center text-gray-400 text-xs">
          N/A
        </div>
      );
    }

    const width = 96;
    const height = 40;
    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const minValue = Math.min(...sparkline);
    const maxValue = Math.max(...sparkline);
    const range = maxValue - minValue || 1;

    const points = sparkline.map((value, index) => {
      const x = padding + (index / (sparkline.length - 1 || 1)) * chartWidth;
      const normalizedValue = (value - minValue) / range;
      const y = padding + chartHeight - (normalizedValue * chartHeight);
      return `${x},${y}`;
    }).join(' ');

    const firstValue = sparkline[0] || 0;
    const lastValue = sparkline[sparkline.length - 1] || 0;
    const isPositive = lastValue > firstValue;
    const color = isPositive ? '#16a34a' : '#dc2626';

    return (
      <svg width={width} height={height} className="block" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedCoins = [...coins].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue: number;
    let bValue: number;

    switch (sortConfig.key) {
      case 'rank':
        aValue = a.rank;
        bValue = b.rank;
        break;
      case 'price':
        aValue = a.current_price;
        bValue = b.current_price;
        break;
      case 'change':
        aValue = a.price_change_percentage_24h ?? 0;
        bValue = b.price_change_percentage_24h ?? 0;
        break;
      case 'high':
        aValue = a.high_24h;
        bValue = b.high_24h;
        break;
      case 'low':
        aValue = a.low_24h;
        bValue = b.low_24h;
        break;
      case 'volume':
        aValue = a.total_volume;
        bValue = b.total_volume;
        break;
      case 'marketCap':
        aValue = a.market_cap;
        bValue = b.market_cap;
        break;
      default:
        return 0;
    }

    if (sortConfig.direction === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const filteredCoins = sortedCoins.filter(coin =>
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Head>
          <title>DEX Spot | Merkezi Olmayan Borsalar | Dijital Marketim</title>
        </Head>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>DEX Spot | Merkezi Olmayan Borsalar | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full">
        {/* Sub-Navigation and Controls */}
        <div className="bg-white border-b border-gray-200">
          <div className="w-full px-4 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSelectedTab('spot')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    selectedTab === 'spot'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Spot
                </button>
                <button
                  onClick={() => setSelectedTab('futures')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    selectedTab === 'futures'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Futures
                </button>
                <button
                  onClick={() => setSelectedTab('new-listings')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    selectedTab === 'new-listings'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  New Listings
                </button>
                <button
                  onClick={() => setSelectedTab('zones')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    selectedTab === 'zones'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Zones
                </button>
              </div>

              {/* Search and Action Buttons */}
              <div className="flex items-center gap-3 flex-1 justify-end min-w-[300px]">
                <div className="relative flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search coin name"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors whitespace-nowrap">
                  Add to Watchlist
                </button>
                <button className="px-4 py-2 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-medium rounded-lg transition-colors whitespace-nowrap">
                  Trade
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Table */}
        <div className="w-full px-4 py-6">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('rank')}
                    >
                      <div className="flex items-center gap-1">
                        Coin
                        <SortIcon columnKey="rank" />
                      </div>
                    </th>
                    <th
                      className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Last Price
                        <SortIcon columnKey="price" />
                      </div>
                    </th>
                    <th
                      className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('change')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        24h Change
                        <SortIcon columnKey="change" />
                      </div>
                    </th>
                    <th
                      className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('high')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        24h High
                        <SortIcon columnKey="high" />
                      </div>
                    </th>
                    <th
                      className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('low')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        24h Low
                        <SortIcon columnKey="low" />
                      </div>
                    </th>
                    <th
                      className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('volume')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        24h Volume
                        <SortIcon columnKey="volume" />
                      </div>
                    </th>
                    <th
                      className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('marketCap')}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Market Cap
                        <SortIcon columnKey="marketCap" />
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                      Chart (7d)
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoins.map((coin, index) => (
                    <tr
                      key={coin.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      {/* Coin */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-500 font-medium w-8">{coin.rank}</span>
                          {coin.image && (
                            <div className="relative w-8 h-8 shrink-0">
                              <Image
                                src={coin.image}
                                alt={coin.name}
                                width={32}
                                height={32}
                                className="rounded-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{coin.symbol.toUpperCase()}</span>
                            <span className="text-xs text-gray-500">{coin.name}</span>
                          </div>
                        </div>
                      </td>

                      {/* Last Price */}
                      <td className="py-4 px-4 text-right text-sm font-semibold text-gray-900">
                        {formatPrice(coin.current_price)}
                      </td>

                      {/* 24h Change */}
                      <td className={`py-4 px-4 text-right text-sm font-semibold ${
                        coin.price_change_percentage_24h !== null && coin.price_change_percentage_24h >= 0 ? 'text-green-600' : coin.price_change_percentage_24h !== null ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {formatPercentage(coin.price_change_percentage_24h)}
                      </td>

                      {/* 24h High */}
                      <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                        {formatPrice(coin.high_24h)}
                      </td>

                      {/* 24h Low */}
                      <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                        {formatPrice(coin.low_24h)}
                      </td>

                      {/* 24h Volume */}
                      <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                        {formatCurrency(coin.total_volume)}
                      </td>

                      {/* Market Cap */}
                      <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                        {formatCurrency(coin.market_cap)}
                      </td>

                      {/* Chart (7d) */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end">
                          {renderSparkline(coin)}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <button className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1E40AF] text-white text-sm font-medium rounded-lg transition-colors">
                          Trade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
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
  );
};

export default DexSpotPage;

