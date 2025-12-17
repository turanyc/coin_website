import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface DEXDerivativeExchange {
  rank: number;
  id: string;
  name: string;
  image: string;
  openInterest: number;
  volume24h: number;
  marketShare: number;
  markets: number;
  type: string;
  launched: string | null;
  volume7d: number[];
  network?: string;
  url: string | null;
}

type SortField = 'rank' | 'openInterest' | 'volume24h' | 'marketShare' | 'markets' | 'launched';
type SortDirection = 'asc' | 'desc';

const networks = [
  { id: 'all', name: 'Tüm Ağlar', icon: '🌐' },
  { id: 'ethereum', name: 'Ethereum', icon: 'Ξ' },
  { id: 'bsc', name: 'BSC', icon: '🟡' },
  { id: 'solana', name: 'Solana', icon: '◎' },
  { id: 'base', name: 'Base', icon: '🔵' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔷' },
  { id: 'avalanche', name: 'Avalanche', icon: '🔺' },
];

const DexDerivativesPage: React.FC = () => {
  const [exchanges, setExchanges] = useState<DEXDerivativeExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');

  useEffect(() => {
    fetchExchanges();
  }, []);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dex-derivatives');
      const data = await response.json();
      
      if (data.exchanges && Array.isArray(data.exchanges)) {
        setExchanges(data.exchanges);
      }
    } catch (error) {
      console.error('DEX türev borsaları çekilemedi:', error);
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
    return `${value.toFixed(4)}%`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // 7 günlük volume grafiği render
  const renderVolumeGraph = (volume7d: number[]) => {
    if (!volume7d || volume7d.length === 0) {
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

    const minValue = Math.min(...volume7d);
    const maxValue = Math.max(...volume7d);
    const range = maxValue - minValue || 1;

    const points = volume7d.map((value, index) => {
      const x = padding + (index / (volume7d.length - 1 || 1)) * chartWidth;
      const normalizedValue = (value - minValue) / range;
      const y = padding + chartHeight - (normalizedValue * chartHeight);
      return `${x},${y}`;
    }).join(' ');

    const firstValue = volume7d[0] || 0;
    const lastValue = volume7d[volume7d.length - 1] || 0;
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

  const sortedExchanges = [...exchanges]
    .filter(ex => selectedNetwork === 'all' || ex.network?.toLowerCase() === selectedNetwork.toLowerCase())
    .sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortField) {
        case 'rank':
          aValue = a.rank;
          bValue = b.rank;
          break;
        case 'openInterest':
          aValue = a.openInterest;
          bValue = b.openInterest;
          break;
        case 'volume24h':
          aValue = a.volume24h;
          bValue = b.volume24h;
          break;
        case 'marketShare':
          aValue = a.marketShare;
          bValue = b.marketShare;
          break;
        case 'markets':
          aValue = a.markets;
          bValue = b.markets;
          break;
        case 'launched':
          // Launched için sadece yılı parse et
          const aYear = a.launched ? parseInt(a.launched.split(' ')[1] || '0') : 0;
          const bYear = b.launched ? parseInt(b.launched.split(' ')[1] || '0') : 0;
          aValue = aYear;
          bValue = bYear;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>En İyi Merkezi Olmayan Türev Borsaları | Dijital Marketim</title>
        </Head>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>En İyi Merkezi Olmayan Türev Borsaları | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full px-4 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            En İyi Merkezi Olmayan Türev Borsaları
          </h1>
          <p className="text-gray-600 text-base max-w-4xl">
            Dijital Marketim, işlem hacimlerine ve DeFi piyasalarındaki pazar payına göre en iyi merkezi olmayan borsaları sıralar.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
          <Link
            href="/exchanges"
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Spot Piyasa
          </Link>
          <Link
            href="/exchanges-derivatives"
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Türevler
          </Link>
          <Link
            href="/dex-spot"
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Merkezi Olmayan Borsa (Spot)
          </Link>
          <button
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-[#2563EB] text-white"
            disabled
          >
            Merkezi Olmayan Borsa (Türevler)
          </button>
        </div>

        {/* Network Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {networks.map((network) => (
            <button
              key={network.id}
              onClick={() => setSelectedNetwork(network.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                selectedNetwork === network.id
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{network.icon}</span>
              <span>{network.name}</span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('rank')}
                >
                  <div className="flex items-center gap-1">
                    #
                    {renderSortIcon('rank')}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                  İsim
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('openInterest')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Açık Pozisyon
                    {renderSortIcon('openInterest')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('volume24h')}
                >
                  <div className="flex items-center justify-end gap-1">
                    İşlem Hacmi (24 Saat)
                    {renderSortIcon('volume24h')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('marketShare')}
                >
                  <div className="flex items-center justify-end gap-1">
                    % Piyasa Payı
                    {renderSortIcon('marketShare')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('markets')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Piyasa Sayısı
                    {renderSortIcon('markets')}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                  Tip
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('launched')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Başlatıldı
                    {renderSortIcon('launched')}
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                  Hacim Grafiği (7 Gün)
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedExchanges.map((exchange, index) => (
                <tr
                  key={exchange.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="py-4 px-4 text-sm text-gray-600 font-medium">{exchange.rank}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {exchange.image && (
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Image
                            src={exchange.image}
                            alt={exchange.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <span className="font-semibold text-gray-900">{exchange.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {formatCurrency(exchange.openInterest)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {formatCurrency(exchange.volume24h)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {formatPercentage(exchange.marketShare)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {exchange.markets.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-900 font-medium">
                    {exchange.type}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {exchange.launched || '-'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end">
                      {renderVolumeGraph(exchange.volume7d)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Results Info */}
        <div className="mt-4 text-sm text-gray-600">
          {sortedExchanges.length > 0 && (
            <p>
              {sortedExchanges.length} borsa gösteriliyor
            </p>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <footer className="bg-white border-t border-gray-200 px-4 py-12 mt-12">
        <div className="w-full">
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
          </div>
        </div>
      </footer>
    </div>
  );
};

export default DexDerivativesPage;
