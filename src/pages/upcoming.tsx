import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface UpcomingCoin {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  firstListingDate: string;
  description?: string;
  website?: string;
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

const UpcomingPage: React.FC = () => {
  const [coins, setCoins] = useState<UpcomingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
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
    fetchUpcomingCoins();
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

  const fetchUpcomingCoins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/upcoming');
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setCoins([]);
      } else if (data.coins && Array.isArray(data.coins)) {
        setCoins(data.coins);
      } else {
        setCoins([]);
      }
    } catch (error) {
      console.error('Upcoming verileri çekilemedi:', error);
      setError('Upcoming verileri çekilemedi. Lütfen tekrar deneyin.');
      setCoins([]);
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(coins.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedCoins = coins.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar marketStats={marketStats} />
      
      <div className="py-8">
        <div className="w-full px-6">
          {/* Başlık ve Açıklama */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              En İyi Yakında Listelenecek Kripto Paralar
            </h1>
            <p className="text-gray-600 text-lg max-w-3xl">
              Bu liste, önde gelen blockchain ve ekosistemlerden yakında listelenecek en iyi kripto paraları içerir. 
              Dijital Marketim, her projeyi bireysel olarak doğrulayamayacağı için, kendi araştırmanızı yapmanızı ve 
              bağımsız profesyonel tavsiye almanızı öneririz.
            </p>
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
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
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
                      <th scope="col" className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
                        İlk Listeleme Tarihi
                      </th>
                      <th scope="col" className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase">
                        Daha Fazla Bilgi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCoins.map((coin, index) => (
                      <tr
                        key={coin.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 text-gray-500 font-medium">
                          {startIndex + index + 1}
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
                        <td className="py-4 px-6">
                          {coin.firstListingDate === 'N/A' ? (
                            <span className="text-gray-500">N/A</span>
                          ) : coin.firstListingDate.startsWith('✓') ? (
                            <span className="text-gray-700 font-medium">{coin.firstListingDate}</span>
                          ) : (
                            <span className="text-gray-700 font-medium">{coin.firstListingDate}</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {coin.website ? (
                            <a
                              href={coin.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2563EB] hover:underline text-sm"
                            >
                              Daha Fazla Oku
                            </a>
                          ) : (
                            <span className="text-gray-400">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && coins.length > 0 && (
            <div className="flex items-center justify-center gap-2 mb-8">
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
              <div className="ml-4 flex items-center gap-2">
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
              <div className="ml-4 text-sm text-gray-600">
                {startIndex + 1} - {Math.min(endIndex, coins.length)} / {coins.length} gösteriliyor
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
                Bu web sitesinde yer alan içerikler, yalnızca genel bilgilendirme amaçlıdır. Yakında listelenecek kripto paralar hakkındaki bilgiler değişebilir ve Dijital Marketim her projeyi bireysel olarak doğrulayamaz. Herhangi bir yatırım kararı vermeden önce, kendi araştırmanızı yapmanız ve bağımsız profesyonel tavsiye almanız önerilir.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UpcomingPage;
