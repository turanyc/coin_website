import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

interface TopCoin {
  id: string;
  image: string | null;
}

interface Category {
  id: string;
  name: string;
  marketCap: number;
  marketCapChange24h: number;
  description: string;
  topCoins: TopCoin[];
  volume24h: number;
  updatedAt: string;
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

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'market_cap' | 'volume' | 'change_24h'>('market_cap');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
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
    fetchCategories();
    fetchGlobalStats();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      const data = await response.json();
      
      if (data.categories && Array.isArray(data.categories)) {
        setCategories(data.categories);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Kategoriler çekilemedi:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

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

  const formatCurrency = (amount: number) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(2)}T`;
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const sortedCategories = [...categories].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return b.volume24h - a.volume24h;
      case 'change_24h':
        return b.marketCapChange24h - a.marketCapChange24h;
      case 'market_cap':
      default:
        return b.marketCap - a.marketCap;
    }
  });

  const filteredCategories = selectedFilter
    ? sortedCategories.filter((cat) => cat.name.toLowerCase().includes(selectedFilter.toLowerCase()))
    : sortedCategories;

  const filterOptions = [
    'Trending',
    'Recently Added',
    'Large Caps',
    'Gaming',
    'DeFi',
    'NFT',
    'Metaverse',
    'Launchpads',
    'AI',
    'Memes',
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar marketStats={marketStats} />
      
      <div className="py-8">
        <div className="w-full">
          {/* Başlık */}
          <div className="mb-8 px-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Kripto Para Kategorileri</h1>
            <p className="text-gray-600">Kripto para piyasasındaki tüm kategorileri keşfedin</p>
          </div>

          {/* Filtreler */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setSortBy('market_cap')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === 'market_cap'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Market Cap'e Göre Sırala
              </button>
              <button
                onClick={() => setSortBy('volume')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === 'volume'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hacime Göre Sırala
              </button>
              <button
                onClick={() => setSortBy('change_24h')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sortBy === 'change_24h'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                24s Değişime Göre Sırala
              </button>
              
              <div className="flex-1" />
              
              {filterOptions.slice(0, 6).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedFilter === filter
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Kategoriler Tablosu */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-gray-500">Yükleniyor...</div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-gray-500">Kategori bulunamadı.</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-xs font-semibold text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="py-4 px-6 text-left">#</th>
                      <th scope="col" className="py-4 px-6 text-left">İsim</th>
                      <th scope="col" className="py-4 px-6 text-left">En İyi Varlıklar</th>
                      <th scope="col" className="py-4 px-6 text-right">Piyasa Değeri</th>
                      <th scope="col" className="py-4 px-6 text-right">24s Hacim</th>
                      <th scope="col" className="py-4 px-6 text-right">24s %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((category, index) => (
                      <tr
                        key={category.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 text-gray-500 font-medium">{index + 1}</td>
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{category.name}</span>
                            {category.description && (
                              <span className="text-xs text-gray-500 mt-1 line-clamp-1">
                                {category.description.substring(0, 80)}...
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            {category.topCoins.slice(0, 6).map((coin, idx) => (
                              <div
                                key={`${coin.id}-${idx}`}
                                className="relative"
                                title={coin.id}
                              >
                                {coin.image ? (
                                  <>
                                    <img
                                      src={coin.image}
                                      alt={coin.id}
                                      className="w-8 h-8 rounded-full object-cover"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = target.parentElement?.querySelector('.coin-fallback') as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                    />
                                    <div
                                      className="coin-fallback w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600"
                                      style={{ display: 'none' }}
                                    >
                                      {coin.id.replace('coin_', '').substring(0, 2).toUpperCase()}
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                    {coin.id.replace('coin_', '').substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>
                            ))}
                            {category.topCoins.length > 6 && (
                              <span className="text-xs text-gray-500">+{category.topCoins.length - 6}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(category.marketCap)}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="text-gray-700">
                            {formatCurrency(category.volume24h)}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span
                            className={`font-semibold ${
                              category.marketCapChange24h >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {category.marketCapChange24h >= 0 ? '▲' : '▼'}
                            {formatPercentage(category.marketCapChange24h)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
