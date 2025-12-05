import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface YieldProduct {
  id: string;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  serviceProviders: string[];
  netAPY: {
    min: number;
    max: number;
  };
  yieldType: string[];
  defiOrCefi: 'DeFi' | 'CeFi';
  chain?: string;
}

interface MarketStats {
  totalCoins: number;
  totalExchanges: number;
  marketCap: number;
  marketCapChange24h: number;
  volume24h: number;
  btcDominance: number;
  ethDominance: number;
  gasPrice: number;
}

const YieldPage: React.FC = () => {
  const [products, setProducts] = useState<YieldProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'staking' | 'defi' | 'cex'>('all');
  const [selectedYield, setSelectedYield] = useState<string>('all');
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'apy' | 'coin' | 'providers'>('apy');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalCoins: 0,
    totalExchanges: 1414,
    marketCap: 0,
    marketCapChange24h: 0,
    volume24h: 0,
    btcDominance: 0,
    ethDominance: 0,
    gasPrice: 0.518,
  });

  useEffect(() => {
    fetchGlobalStats();
    fetchYieldProducts();
  }, []);

  const fetchGlobalStats = async () => {
    try {
      const response = await fetch('/api/global');
      const data = await response.json();
      if (data) {
        setMarketStats({
          totalCoins: data.totalCoins || 0,
          totalExchanges: data.totalExchanges || 1414,
          marketCap: data.marketCap || 0,
          marketCapChange24h: data.marketCapChange24h || 0,
          volume24h: data.volume24h || 0,
          btcDominance: data.btcDominance || 0,
          ethDominance: data.ethDominance || 0,
          gasPrice: data.gasPrice || 0.518,
        });
      }
    } catch (error) {
      console.error('Global stats çekilemedi:', error);
    }
  };

  const fetchYieldProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/yield');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setProducts([]);
      } else if (data.products && Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Yield verileri çekilemedi:', error);
      setError('Yield verileri çekilemedi. Lütfen tekrar deneyin.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtreleme ve sıralama
  const filteredProducts = products.filter((product) => {
    if (selectedFilter === 'staking' && !product.yieldType.includes('Staking')) return false;
    if (selectedFilter === 'defi' && product.defiOrCefi !== 'DeFi') return false;
    if (selectedFilter === 'cex' && product.defiOrCefi !== 'CeFi') return false;
    if (selectedChain !== 'all' && product.chain !== selectedChain) return false;
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'apy') {
      const aAvg = (a.netAPY.min + a.netAPY.max) / 2;
      const bAvg = (b.netAPY.min + b.netAPY.max) / 2;
      return sortOrder === 'asc' ? aAvg - bAvg : bAvg - aAvg;
    } else if (sortBy === 'coin') {
      return sortOrder === 'asc' 
        ? a.coinName.localeCompare(b.coinName)
        : b.coinName.localeCompare(a.coinName);
    } else {
      return sortOrder === 'asc'
        ? a.serviceProviders.length - b.serviceProviders.length
        : b.serviceProviders.length - a.serviceProviders.length;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedProducts.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);

  const handleSort = (column: 'apy' | 'coin' | 'providers') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getProviderLogos = (providers: string[]) => {
    const logoMap: { [key: string]: string } = {
      'Binance': 'https://assets.coingecko.com/markets/images/52/small/binance.jpg',
      'Coinbase': 'https://assets.coingecko.com/markets/images/23/small/Coinbase_Coin_Primary.png',
      'Kraken': 'https://assets.coingecko.com/markets/images/24/small/kraken.jpg',
      'Gemini': 'https://assets.coingecko.com/markets/images/25/small/gemini.png',
    };
    return providers.map(p => logoMap[p] || null).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar marketStats={marketStats} />
      
      <div className="py-8">
        <div className="w-full px-6">
          {/* Başlık ve Açıklama */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Getiri Ürünlerini Keşfedin</h1>
            <p className="text-gray-600 text-lg">
              Getiri varlıkları bilgilerini keşfedin. Yıllık Yüzde Getirisi (APY) ve platform ücretlerini kontrol ederek en yüksek APY kripto staking ve kazanç ürünlerini bulun.
            </p>
          </div>

          {/* Filtreler */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <button className="px-6 py-2 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-medium rounded-lg transition-all">
                Keşfet
              </button>
              
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedFilter('all')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    selectedFilter === 'all'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Tümü
                </button>
                <button
                  onClick={() => setSelectedFilter('staking')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    selectedFilter === 'staking'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Staking
                </button>
                <button
                  onClick={() => setSelectedFilter('defi')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    selectedFilter === 'defi'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  DeFi
                </button>
                <button
                  onClick={() => setSelectedFilter('cex')}
                  className={`px-4 py-2 text-sm font-medium transition-all ${
                    selectedFilter === 'cex'
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  CEX
                </button>
              </div>

              <select
                value={selectedYield}
                onChange={(e) => setSelectedYield(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              >
                <option value="all">Tüm Getiriler</option>
                <option value="high">Yüksek Getiri</option>
                <option value="medium">Orta Getiri</option>
                <option value="low">Düşük Getiri</option>
              </select>

              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
              >
                <option value="all">Tüm Zincirler</option>
                <option value="Ethereum">Ethereum</option>
                <option value="Binance Smart Chain">Binance Smart Chain</option>
                <option value="Polygon">Polygon</option>
                <option value="Solana">Solana</option>
              </select>
            </div>
          </div>

          {/* Tablo */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-gray-500">Yükleniyor...</div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-red-600 font-semibold mb-2">Hata</div>
              <div className="text-gray-600">{error}</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
                        #
                      </th>
                      <th scope="col" className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
                        <button
                          onClick={() => handleSort('coin')}
                          className="flex items-center gap-1 hover:text-[#2563EB] transition-colors"
                        >
                          Getiri Coin
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </button>
                      </th>
                      <th scope="col" className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
                        <button
                          onClick={() => handleSort('providers')}
                          className="flex items-center gap-1 hover:text-[#2563EB] transition-colors"
                        >
                          Hizmet Sağlayıcılar
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </button>
                      </th>
                      <th scope="col" className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
                        <button
                          onClick={() => handleSort('apy')}
                          className="flex items-center gap-1 hover:text-[#2563EB] transition-colors"
                        >
                          Net APY
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </button>
                      </th>
                      <th scope="col" className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
                        Getiri Tipi
                      </th>
                      <th scope="col" className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
                        DeFi/CeFi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedProducts.map((product, index) => (
                      <tr
                        key={product.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 text-gray-500 font-medium">
                          {startIndex + index + 1}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            {product.coinImage ? (
                              <img
                                src={product.coinImage}
                                alt={product.coinName}
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                {product.coinSymbol.substring(0, 2)}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <Link
                                href={`/currencies/${product.coinId}`}
                                className="font-semibold text-gray-900 hover:text-[#2563EB] hover:underline"
                              >
                                {product.coinName}
                              </Link>
                              <span className="text-xs text-gray-500 uppercase">{product.coinSymbol}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">
                              {product.serviceProviders.length > 3 
                                ? `${product.serviceProviders.length - 3} + 3`
                                : product.serviceProviders.length
                              }
                            </span>
                            <div className="flex items-center gap-1">
                              {getProviderLogos(product.serviceProviders.slice(0, 3)).map((logo, idx) => (
                                <img
                                  key={idx}
                                  src={logo}
                                  alt="Provider"
                                  className="w-6 h-6 rounded-full border border-gray-200"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-semibold text-gray-900">
                            {product.netAPY.min.toFixed(2)}% - {product.netAPY.max.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1">
                            {product.yieldType.map((type, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              product.defiOrCefi === 'DeFi'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {product.defiOrCefi}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && sortedProducts.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ←
                </button>
                {Array.from({ length: Math.min(10, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 10) {
                    pageNum = i + 1;
                  } else if (currentPage <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 4) {
                    pageNum = totalPages - 9 + i;
                  } else {
                    pageNum = currentPage - 4 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        currentPage === pageNum
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  →
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Satır göster:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-3 py-1 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  >
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
                <div className="text-sm text-gray-600">
                  {startIndex + 1} - {Math.min(endIndex, sortedProducts.length)} / {sortedProducts.length} gösteriliyor
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
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
            <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Kaynaklar</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto Haberleri</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto Para Hazine Rezervleri</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto Isı Haritası</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto API&apos;si</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Destek</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">İletişim Formu</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Reklam</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Hakkımızda</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Topluluk</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Telegram</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Discord</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Twitter</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Yasal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kullanım Şartları</a></li>
                  <li><a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Gizlilik Politikası</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-8">
            <div className="text-sm text-gray-600 mb-6">
              © 2025 Cripto. All Rights Reserved.
            </div>
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-bold text-gray-900 mb-2">ÖNEMLİ UYARI</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Bu web sitesinde yer alan içerikler, yalnızca genel bilgilendirme amaçlıdır. Getiri ürünleri risk içerir ve kayıplar meydana gelebilir. Herhangi bir yatırım kararı vermeden önce, kendi araştırmanızı yapmanız ve bağımsız profesyonel tavsiye almanız önerilir.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default YieldPage;
