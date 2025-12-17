import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface DerivativeExchange {
  rank: number;
  id: string;
  name: string;
  image: string;
  volume24h: number;
  openInterest: number;
  markets: number;
  avgLiquidity: number;
  weeklyVisits: number;
  coins: number;
  fiatCurrencies: number;
  yearLaunched: number | null;
  url: string | null;
}

type SortField = 'rank' | 'volume24h' | 'openInterest' | 'markets' | 'avgLiquidity' | 'weeklyVisits' | 'coins' | 'fiatCurrencies' | 'yearLaunched';
type SortDirection = 'asc' | 'desc';

const ExchangesDerivativesPage: React.FC = () => {
  const [exchanges, setExchanges] = useState<DerivativeExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('volume24h');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    fetchExchanges();
  }, []);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/exchanges-derivatives');
      const data = await response.json();
      
      if (data.exchanges && Array.isArray(data.exchanges)) {
        setExchanges(data.exchanges);
      }
    } catch (error) {
      console.error('Türev borsaları çekilemedi:', error);
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

  const formatNumber = (value: number): string => {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedExchanges = [...exchanges].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortField) {
      case 'rank':
        aValue = a.rank;
        bValue = b.rank;
        break;
      case 'volume24h':
        aValue = a.volume24h;
        bValue = b.volume24h;
        break;
      case 'openInterest':
        aValue = a.openInterest;
        bValue = b.openInterest;
        break;
      case 'markets':
        aValue = a.markets;
        bValue = b.markets;
        break;
      case 'avgLiquidity':
        aValue = a.avgLiquidity;
        bValue = b.avgLiquidity;
        break;
      case 'weeklyVisits':
        aValue = a.weeklyVisits;
        bValue = b.weeklyVisits;
        break;
      case 'coins':
        aValue = a.coins;
        bValue = b.coins;
        break;
      case 'fiatCurrencies':
        aValue = a.fiatCurrencies;
        bValue = b.fiatCurrencies;
        break;
      case 'yearLaunched':
        aValue = a.yearLaunched || 0;
        bValue = b.yearLaunched || 0;
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

  // Avg. Liquidity bar render
  const renderLiquidityBar = (liquidity: number) => {
    const width = Math.min(100, liquidity);
    const color = liquidity >= 80 ? '#10b981' : liquidity >= 50 ? '#f59e0b' : '#ef4444';
    
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all"
            style={{ width: `${width}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs text-gray-600 min-w-[30px]">{liquidity.toFixed(0)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>En İyi Kripto Para Türev Borsaları | Dijital Marketim</title>
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
        <title>En İyi Kripto Para Türev Borsaları | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full px-4 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            En İyi Kripto Para Türev Borsaları
          </h1>
          <p className="text-gray-600 text-base max-w-4xl">
            24 saatlik işlem hacmine göre sıralanan en iyi kripto para türev borsalarının listesi. 
            Sütun başlıklarına tıklayarak 24 saatlik işlem hacmi, açık pozisyon, piyasalar ve daha fazlasına göre sıralayabilirsiniz.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
          <Link
            href="/exchanges"
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Spot Piyasa
          </Link>
          <button
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-[#2563EB] text-white"
            disabled
          >
            Türevler
          </button>
          <Link
            href="/dex-spot"
            className="px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Merkezi Olmayan Borsa
          </Link>
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
                  Borsa
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('volume24h')}
                  title="Türev İşlem Hacmi (24 Saat)"
                >
                  <div className="flex items-center justify-end gap-1">
                    24 Saatlik İşlem Hacmi
                    {renderSortIcon('volume24h')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('openInterest')}
                  title="Toplam Açık Pozisyon"
                >
                  <div className="flex items-center justify-end gap-1">
                    Açık Pozisyon
                    {renderSortIcon('openInterest')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('markets')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Piyasalar
                    {renderSortIcon('markets')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('avgLiquidity')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Ortalama Likidite
                    {renderSortIcon('avgLiquidity')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('weeklyVisits')}
                  title="Ortalama haftalık ziyaretler"
                >
                  <div className="flex items-center justify-end gap-1">
                    Haftalık Ziyaretler
                    {renderSortIcon('weeklyVisits')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('coins')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Kripto Paralar
                    {renderSortIcon('coins')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('fiatCurrencies')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Geleneksel Para Birimleri
                    {renderSortIcon('fiatCurrencies')}
                  </div>
                </th>
                <th 
                  className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('yearLaunched')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Başlatıldı
                    {renderSortIcon('yearLaunched')}
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
                  Kaynak
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
                    {formatCurrency(exchange.volume24h)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {formatCurrency(exchange.openInterest)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {exchange.markets.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {renderLiquidityBar(exchange.avgLiquidity)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {formatNumber(exchange.weeklyVisits)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {exchange.coins.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {exchange.fiatCurrencies.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {exchange.yearLaunched || '-'}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {exchange.url && (
                      <a
                        href={exchange.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center w-6 h-6 text-gray-400 hover:text-[#2563EB] transition-colors"
                        title="Borsa web sitesine git"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default ExchangesDerivativesPage;
