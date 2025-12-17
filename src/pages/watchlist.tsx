import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Image from 'next/image';
import { getWatchlistFromCookies, hasCookieConsent, removeCoinFromWatchlistCookie } from '../lib/cookieUtils';

interface WatchlistCoin {
  id: string;
  coin_id?: string; // Veritabanından gelen veriler için
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
  price_change_percentage_24h?: number;
  market_cap?: number;
  added_at?: string;
}

const WatchlistPage: React.FC = () => {
  const [watchlist, setWatchlist] = useState<WatchlistCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Kullanıcı bilgisini al
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing user:', error);
        }
      }
    }
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [user]);

  // Watchlist güncelleme event'ini dinle
  useEffect(() => {
    const handleWatchlistUpdate = () => {
      // Kısa bir gecikme ile güncelle (localStorage/API işleminin tamamlanması için)
      setTimeout(() => {
        fetchWatchlist();
      }, 100);
    };

    window.addEventListener('watchlistUpdated', handleWatchlistUpdate);
    return () => {
      window.removeEventListener('watchlistUpdated', handleWatchlistUpdate);
    };
  }, [user]);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        // Kullanıcı giriş yapmışsa API'den getir
        const response = await fetch(`/api/watchlist?user_id=${user.id || user.user_id}`);
        if (response.ok) {
          const data = await response.json();
          // CoinGecko'dan güncel fiyat bilgilerini al
          const coinIds = data.watchlist.map((w: any) => w.coin_id).join(',');
          if (coinIds) {
            const priceResponse = await fetch(
              `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=24h`
            );
            if (priceResponse.ok) {
              const prices = await priceResponse.json();
              const priceMap = new Map(prices.map((p: any) => [p.id, p]));
              const enriched = data.watchlist.map((w: any) => ({
                ...w,
                id: w.coin_id, // coin_id'yi id olarak da ekle
                ...priceMap.get(w.coin_id),
              }));
              setWatchlist(enriched);
            } else {
              setWatchlist(data.watchlist);
            }
          } else {
            setWatchlist(data.watchlist);
          }
        }
      } else if (hasCookieConsent()) {
        // Çerezlerden getir
        const cookieWatchlist = getWatchlistFromCookies();
        if (cookieWatchlist.length > 0) {
          const coinIds = cookieWatchlist.map((c: any) => c.id).join(',');
          const priceResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=24h`
          );
          if (priceResponse.ok) {
            const prices = await priceResponse.json();
            setWatchlist(prices);
          } else {
            setWatchlist(cookieWatchlist);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  // Watchlist güncelleme event'ini dinle
  useEffect(() => {
    const handleWatchlistUpdate = () => {
      // Kısa bir gecikme ile güncelle (localStorage/API işleminin tamamlanması için)
      setTimeout(() => {
        fetchWatchlist();
      }, 100);
    };

    window.addEventListener('watchlistUpdated', handleWatchlistUpdate);
    return () => {
      window.removeEventListener('watchlistUpdated', handleWatchlistUpdate);
    };
  }, [fetchWatchlist]);

  const handleRemoveCoin = async (coin: WatchlistCoin, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      // coin_id veya id kullan (her ikisi de olabilir)
      const coinId = (coin as any).coin_id || coin.id;
      
      // Optimistic update - hemen state'ten kaldır
      setWatchlist(prev => prev.filter(c => {
        const cId = (c as any).coin_id || c.id;
        return cId !== coinId;
      }));
      
      if (user) {
        const response = await fetch(`/api/watchlist?user_id=${user.id || user.user_id}&coin_id=${coinId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          // Hata durumunda geri yükle
          await fetchWatchlist();
          console.error('Failed to remove coin from database');
        }
      } else if (hasCookieConsent()) {
        removeCoinFromWatchlistCookie(coinId);
        // Cookie'den kaldırıldı, state zaten güncellendi
      } else {
        // Cookie consent yoksa geri yükle
        await fetchWatchlist();
        console.error('No cookie consent or user');
      }
    } catch (error) {
      console.error('Error removing coin:', error);
      // Hata durumunda geri yükle
      await fetchWatchlist();
    }
  };

  return (
    <>
      <Head>
        <title>İzleme Listesi | Kripto Tracker</title>
      </Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">İzleme Listem</h1>
            <p className="text-gray-600">Takip ettiğiniz kripto paraların güncel fiyatları ve istatistikleri</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2563EB]"></div>
              <p className="mt-4 text-gray-600">Yükleniyor...</p>
            </div>
          ) : watchlist.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">İzleme Listeniz Boş</h2>
              <p className="text-gray-600 mb-6">İzleme listenize coin eklemek için ana sayfadaki coinlere tıklayın veya navbar'daki İzleme Listesi butonunu kullanın.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Coin</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Fiyat</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">24s Değişim</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Piyasa Değeri</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {watchlist.map((coin, index) => {
                      const coinId = (coin as any).coin_id || coin.id;
                      return (
                      <tr key={coinId} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/coin/${coinId}`)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {coin.image && (
                              <Image src={coin.image} alt={coin.name} width={32} height={32} className="rounded-full" />
                            )}
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{coin.name}</div>
                              <div className="text-xs text-gray-500">{coin.symbol?.toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                          ${coin.current_price?.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) || 'N/A'}
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                          (coin.price_change_percentage_24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {coin.price_change_percentage_24h !== undefined
                            ? `${coin.price_change_percentage_24h >= 0 ? '+' : ''}${coin.price_change_percentage_24h.toFixed(2)}%`
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          ${coin.market_cap?.toLocaleString('tr-TR') || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleRemoveCoin(coin, e)}
                            className="text-red-600 hover:text-red-700 font-semibold text-sm transition-colors px-3 py-1 rounded hover:bg-red-50"
                          >
                            Kaldır
                          </button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default WatchlistPage;
