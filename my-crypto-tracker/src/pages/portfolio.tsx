import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
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

const PortfolioPage: React.FC = () => {
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
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

  const loadPortfolio = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio');
      if (saved) {
        try {
          const portfolioIds = JSON.parse(saved);
          setPortfolio(portfolioIds);
          fetchPortfolioCoins(portfolioIds);
        } catch (error) {
          console.error('Portfolio verisi parse edilemedi:', error);
          setLoading(false);
        }
      } else {
        setPortfolio([]);
        setCoins([]);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadPortfolio();

    // Storage event listener - başka tab'da değişiklik olduğunda algıla
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'portfolio') {
        loadPortfolio();
      }
    };

    // Sayfa focus olduğunda da kontrol et
    const handleFocus = () => {
      loadPortfolio();
    };

    // Sayfa görünür olduğunda kontrol et (aynı tab'da değişiklik için)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPortfolio();
      }
    };

    // Periyodik kontrol (her 2 saniyede bir)
    const intervalId = setInterval(() => {
      loadPortfolio();
    }, 2000);

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchPortfolioCoins = async (portfolioIds: string[]) => {
    if (portfolioIds.length === 0) {
      setCoins([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/coins');
      const data = await response.json();
      
      if (data.coins && Array.isArray(data.coins)) {
        // Portfolio'daki ID'lere göre coinleri filtrele
        const portfolioCoins = data.coins.filter((coin: Coin) => 
          portfolioIds.includes(coin.id)
        );
        
        // Portfolio sırasını koru
        const sortedCoins = portfolioIds
          .map(id => portfolioCoins.find(coin => coin.id === id))
          .filter((coin): coin is Coin => coin !== undefined);
        
        setCoins(sortedCoins);
      } else {
        setCoins([]);
      }
    } catch (error) {
      console.error('Portfolio coin verileri çekilemedi:', error);
      setCoins([]);
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

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const removeFromPortfolio = (coinId: string) => {
    const newPortfolio = portfolio.filter(id => id !== coinId);
    setPortfolio(newPortfolio);
    setCoins(coins.filter(coin => coin.id !== coinId));
    localStorage.setItem('portfolio', JSON.stringify(newPortfolio));
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: amount < 1 ? 6 : 2,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar marketStats={marketStats} />
      
      <div className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Portföyüm</h1>
            <p className="text-gray-600">Takip ettiğiniz coinlerin listesi</p>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-gray-500">Yükleniyor...</div>
            </div>
          ) : portfolio.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Portföyünüz boş</h2>
              <p className="text-gray-600 mb-6">Coin listesinden coin ekleyerek portföyünüzü oluşturabilirsiniz.</p>
              <Link 
                href="/"
                className="inline-block px-6 py-3 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                Coin Listesine Git
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead className="text-xs font-semibold text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="py-4 px-6">Coin</th>
                      <th scope="col" className="py-4 px-6 text-right">Fiyat</th>
                      <th scope="col" className="py-4 px-6 text-right">24sa Değişim</th>
                      <th scope="col" className="py-4 px-6 text-right">24 Saatlik Hacim</th>
                      <th scope="col" className="py-4 px-6 text-right">Piyasa Değeri</th>
                      <th scope="col" className="py-4 px-6 text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.map((coin) => (
                      <tr key={coin.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 font-medium text-gray-900 flex items-center">
                          {coin.image && (
                            <img 
                              src={coin.image} 
                              alt={coin.name} 
                              className="w-8 h-8 mr-3 rounded-full" 
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex flex-col">
                            <Link href={`/currencies/${coin.id}`} className="hover:underline text-gray-900 font-semibold">
                              {coin.name}
                            </Link>
                            <span className="text-gray-500 uppercase text-xs font-normal">{coin.symbol}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right text-gray-900 font-medium">
                          {formatCurrency(coin.current_price)}
                        </td>
                        <td className="py-4 px-6 text-right font-semibold">
                          <span 
                            style={{ 
                              color: Number(coin.price_change_percentage_24h || 0) >= 0 ? '#16a34a' : '#dc2626',
                              display: 'inline-block'
                            }}
                          >
                            {Number(coin.price_change_percentage_24h || 0) >= 0 ? '▲' : '▼'}
                            {Math.abs(Number(coin.price_change_percentage_24h || 0)).toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right text-gray-700">
                          {formatCurrency(coin.total_volume)}
                        </td>
                        <td className="py-4 px-6 text-right text-gray-700">
                          {formatCurrency(coin.market_cap)}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => removeFromPortfolio(coin.id)}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 font-medium rounded-lg transition-colors"
                          >
                            Çıkar
                          </button>
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

export default PortfolioPage;

