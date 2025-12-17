import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_24h: number;
  total_volume: number;
  market_cap_rank: number;
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

const GainersLosersPage: React.FC = () => {
  const [gainers, setGainers] = useState<Coin[]>([]);
  const [losers, setLosers] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<string>('24h');
  const [limit, setLimit] = useState<string>('100');
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
    fetchGainersLosers();
  }, [timeframe, limit]);

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

  const fetchGainersLosers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/gainers-losers?timeframe=${timeframe}&limit=${limit}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setGainers([]);
        setLosers([]);
      } else {
        setGainers(data.gainers || []);
        setLosers(data.losers || []);
      }
    } catch (error) {
      console.error('Kazananlar ve kaybedenler verileri çekilemedi:', error);
      setError('Kazananlar ve kaybedenler verileri çekilemedi. Lütfen tekrar deneyin.');
      setGainers([]);
      setLosers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(amount) || amount === 0) {
      return '-';
    }
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(2)}T`;
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(6)}`;
  };

  const formatPercentage = (value: number) => {
    if (value === null || value === undefined || isNaN(value)) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const renderTable = (coins: Coin[], title: string, isGainers: boolean) => (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
                  #
                </th>
                <th scope="col" className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
                  İsim
                </th>
                <th scope="col" className="py-4 px-6 text-right text-xs font-semibold text-gray-600 uppercase">
                  Fiyat
                </th>
                <th scope="col" className="py-4 px-6 text-right text-xs font-semibold text-gray-600 uppercase">
                  24s %
                </th>
                <th scope="col" className="py-4 px-6 text-right text-xs font-semibold text-gray-600 uppercase">
                  Hacim (24s)
                </th>
              </tr>
            </thead>
            <tbody>
              {coins.map((coin, index) => (
                <tr
                  key={coin.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-6 text-gray-500 font-medium">
                    {coin.market_cap_rank || index + 1}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {coin.image ? (
                        <img
                          src={coin.image}
                          alt={coin.name}
                          className="w-8 h-8 rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                          {coin.symbol.substring(0, 2)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <Link
                          href={`/currencies/${coin.id}`}
                          className="font-semibold text-gray-900 hover:text-[#2563EB] hover:underline"
                        >
                          {coin.name}
                        </Link>
                        <span className="text-xs text-gray-500 uppercase">{coin.symbol}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(coin.current_price)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span
                      className={`font-semibold flex items-center justify-end gap-1 ${
                        isGainers ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {isGainers ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      )}
                      {formatPercentage(coin.price_change_24h)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-gray-700">
                      {formatCurrency(coin.total_volume)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar marketStats={marketStats} />
      
      <div className="py-8">
        <div className="w-full px-6">
          {/* Başlık ve Açıklama */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Bugünün En Çok Kazanan ve Kaybeden Kripto Paraları
            </h1>
            <p className="text-gray-600 text-lg">
              Hacim (24s) &gt; $50,000 olan kripto paralar ve tokenler arasında son 24 saatte en çok kazanan ve kaybedenler hangileri?
            </p>
          </div>

          {/* Filtreler */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Zaman Aralığı:</span>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                >
                  <option value="24h">24s</option>
                  <option value="7d">7g</option>
                  <option value="30d">30g</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Coinler:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 text-sm font-medium focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                >
                  <option value="50">Top 50</option>
                  <option value="100">Top 100</option>
                  <option value="200">Top 200</option>
                </select>
              </div>
            </div>
          </div>

          {/* İçerik */}
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
            <div>
              {/* Top Gainers */}
              {renderTable(gainers, 'En Çok Kazananlar', true)}
              
              {/* Top Losers */}
              {renderTable(losers, 'En Çok Kaybedenler', false)}
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
                Bu web sitesinde yer alan içerikler, yalnızca genel bilgilendirme amaçlıdır. Herhangi bir yatırım kararı vermeden önce, kendi araştırmanızı yapmanız ve bağımsız profesyonel tavsiye almanız önerilir.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GainersLosersPage;
