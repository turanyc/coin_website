import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Image from 'next/image';
import { getPortfolioFromCookies, hasCookieConsent, removeCoinFromPortfolioCookie } from '../lib/cookieUtils';

interface PortfolioCoin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  amount: number;
  purchase_price?: number | null;
  purchase_date?: string | null;
  notes?: string | null;
  current_price?: number;
  price_change_percentage_24h?: number;
  market_cap?: number;
}

const PortfolioPage: React.FC = () => {
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<PortfolioCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
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

  const fetchPortfolio = useCallback(async () => {
    setLoading(true);
    try {
      if (user) {
        const userId = user.id || user.user_id;
        if (!userId) {
          console.error('User ID is missing');
          setLoading(false);
          return;
        }
        
        try {
          const response = await fetch(`/api/portfolio?user_id=${userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            // API hatası - boş portföy göster
            console.error(`API error: ${response.status} ${response.statusText}`);
            setPortfolio([]);
            setLoading(false);
            return;
          }
          
          const data = await response.json();
          const coinIds = data.portfolio?.map((p: any) => p.coin_id).filter(Boolean).join(',');
          if (coinIds) {
            try {
              const priceResponse = await fetch(
                `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=24h`
              );
              if (priceResponse.ok) {
                const prices = await priceResponse.json();
                const priceMap = new Map(prices.map((p: any) => [p.id, p]));
                const enriched = data.portfolio.map((p: any) => ({
                  ...p,
                  id: p.coin_id,
                  ...priceMap.get(p.coin_id),
                }));
                setPortfolio(enriched);
              } else {
                // CoinGecko API hatası - sadece veritabanı verilerini göster
                setPortfolio(data.portfolio.map((p: any) => ({ ...p, id: p.coin_id })));
              }
            } catch (priceError) {
              console.error('Error fetching prices from CoinGecko:', priceError);
              // CoinGecko hatası - sadece veritabanı verilerini göster
              setPortfolio(data.portfolio.map((p: any) => ({ ...p, id: p.coin_id })));
            }
          } else {
            setPortfolio(data.portfolio?.map((p: any) => ({ ...p, id: p.coin_id })) || []);
          }
        } catch (fetchError) {
          console.error('Error fetching portfolio from API:', fetchError);
          // Network hatası - boş portföy göster
          setPortfolio([]);
        }
      } else if (hasCookieConsent()) {
        // Çerezlerden getir
        try {
          const cookiePortfolio = getPortfolioFromCookies();
          if (cookiePortfolio.length > 0) {
            const coinIds = cookiePortfolio.map((c: any) => c.id || c.coin_id).filter(Boolean).join(',');
            if (coinIds) {
              try {
                const priceResponse = await fetch(
                  `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=100&sparkline=false&price_change_percentage=24h`
                );
                if (priceResponse.ok) {
                  const prices = await priceResponse.json();
                  setPortfolio(prices);
                } else {
                  setPortfolio(cookiePortfolio);
                }
              } catch (priceError) {
                console.error('Error fetching prices from CoinGecko:', priceError);
                setPortfolio(cookiePortfolio);
              }
            } else {
              setPortfolio(cookiePortfolio);
            }
          } else {
            setPortfolio([]);
          }
        } catch (cookieError) {
          console.error('Error reading portfolio from cookies:', cookieError);
          setPortfolio([]);
        }
      } else {
        setPortfolio([]);
      }
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setPortfolio([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);



  const handleRemoveCoin = async (coinId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      // Optimistic update - hemen state'ten kaldır
      setPortfolio(prev => prev.filter(c => {
        const cId = (c as any).coin_id || c.id;
        return cId !== coinId;
      }));
      
      if (user) {
        const userId = user.id || user.user_id;
        if (!userId) {
          console.error('User ID is missing');
          // Hata durumunda geri yükle
          await fetchPortfolio();
          return;
        }
        
        try {
          const response = await fetch(`/api/portfolio?user_id=${userId}&coin_id=${coinId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            // Hata durumunda geri yükle
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.error('Failed to remove coin from database:', errorData);
            // State'i geri yükle
            await fetchPortfolio();
            alert(`Coin kaldırılırken bir hata oluştu: ${errorData.error || 'Bilinmeyen hata'}`);
            return;
          }
          
          // Başarılı - response'u kontrol et
          const result = await response.json().catch(() => ({}));
          if (result.deleted !== false) {
            // Başarılı - state zaten güncellendi, fetchPortfolio çağırmaya gerek yok
            console.log('Coin successfully removed from database');
          } else {
            // Silme başarısız - geri yükle
            console.error('Coin was not found in database');
            await fetchPortfolio();
          }
        } catch (fetchError) {
          console.error('Error calling DELETE API:', fetchError);
          // Hata durumunda geri yükle
          await fetchPortfolio();
          alert('Coin kaldırılırken bir hata oluştu.');
        }
      } else if (hasCookieConsent()) {
        removeCoinFromPortfolioCookie(coinId);
        // Cookie'den kaldırıldı, state zaten güncellendi
        // fetchPortfolio çağırmaya gerek yok
      } else {
        // Cookie consent yoksa geri yükle
        await fetchPortfolio();
        console.error('No cookie consent or user');
      }
    } catch (error) {
      console.error('Error removing coin:', error);
      // Hata durumunda geri yükle
      await fetchPortfolio();
    }
  };

  const calculateTotalValue = () => {
    return portfolio.reduce((total, coin) => {
      const amount = coin.amount || 1; // Default 1
      const currentValue = (coin.current_price || 0) * amount;
      return total + currentValue;
    }, 0);
  };

  const calculateTotalCost = () => {
    return portfolio.reduce((total, coin) => {
      const amount = coin.amount || 1; // Default 1
      const cost = (coin.purchase_price || coin.current_price || 0) * amount;
      return total + cost;
    }, 0);
  };

  const totalValue = calculateTotalValue();
  const totalCost = calculateTotalCost();
  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

  // Grafik verilerini oluştur
  const generateSparklineData = (coinId: string, currentPrice: number, change24h: number) => {
    const points = 168;
    const data: number[] = [];
    let seed = 0;
    for (let i = 0; i < coinId.length; i++) {
      seed += coinId.charCodeAt(i);
    }
    seed = Math.abs(seed);
    const sevenDayChangePercent = (change24h * 7) / 100;
    const startPrice = currentPrice / (1 + sevenDayChangePercent);
    const maxVariation = currentPrice * 0.015;
    const getSmoothVariation = (index: number) => {
      const wave = Math.sin((seed + index) * 0.8) * 0.5;
      return wave * maxVariation * 0.4;
    };
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1);
      const linearPrice = startPrice + (currentPrice - startPrice) * t;
      const dailyCycle = Math.sin((t * 7) * Math.PI * 2) * 0.02;
      const smoothVariation = getSmoothVariation(i);
      const pseudoRandom = Math.sin(seed * 0.001 + i * 0.1) * 0.5 + 0.5;
      const deterministicVariation = (pseudoRandom - 0.5) * maxVariation * 0.1;
      const price = linearPrice + smoothVariation + (linearPrice * dailyCycle) + deterministicVariation;
      const priceDiff = Math.abs(currentPrice - startPrice);
      const minPrice = Math.min(startPrice, currentPrice) - priceDiff * 0.15;
      const maxPrice = Math.max(startPrice, currentPrice) + priceDiff * 0.15;
      data.push(Math.max(minPrice, Math.min(maxPrice, price)));
    }
    return data;
  };

  // Grafik verilerini cache'le
  const chartDataCache = useMemo(() => {
    const cache = new Map<string, number[]>();
    portfolio.forEach((coin) => {
      const coinId = (coin as any).coin_id || coin.id;
      if (coin.current_price && coin.price_change_percentage_24h !== undefined && coinId) {
        cache.set(coinId, generateSparklineData(coinId, coin.current_price, coin.price_change_percentage_24h || 0));
      }
    });
    return cache;
  }, [portfolio]);

  return (
    <>
      <Head>
        <title>Portföy | Kripto Tracker</title>
      </Head>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#2563EB]/5 via-white to-[#2563EB]/5">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] rounded-xl shadow-xl p-8 mb-6 text-white">
            <h1 className="text-4xl font-bold mb-2">Portföyüm</h1>
            <p className="text-blue-100">Kripto varlıklarınızın detaylı takibi</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-[#2563EB]">
              <div className="text-sm text-gray-600 mb-1">Toplam Değer</div>
              <div className="text-2xl font-bold text-gray-900">${(totalValue || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-gray-400">
              <div className="text-sm text-gray-600 mb-1">Toplam Maliyet</div>
              <div className="text-2xl font-bold text-gray-900">${(totalCost || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${totalProfit >= 0 ? 'border-green-500' : 'border-red-500'}`}>
              <div className="text-sm text-gray-600 mb-1">Toplam Kar/Zarar</div>
              <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${(totalProfit || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${totalProfitPercent >= 0 ? 'border-green-500' : 'border-red-500'}`}>
              <div className="text-sm text-gray-600 mb-1">Kar/Zarar %</div>
              <div className={`text-2xl font-bold ${totalProfitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfitPercent >= 0 ? '+' : ''}{totalProfitPercent.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Add Coin Button */}
          <div className="mb-6">
            <button
              onClick={() => {
                // Ana sayfaya yönlendir ve coin tablosunu göster
                router.push('/#coins');
              }}
              className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white font-semibold px-6 py-3 rounded-lg shadow-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Coin Ekle
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2563EB]"></div>
              <p className="mt-4 text-gray-600">Yükleniyor...</p>
            </div>
          ) : portfolio.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <svg className="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Portföyünüz Boş</h2>
              <p className="text-gray-600 mb-6">Portföyünüze coin eklemek için yukarıdaki "Coin Ekle" butonuna tıklayın.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Coin</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Alış Fiyatı</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Güncel Fiyat</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Değer</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Kar/Zarar</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Son 7 Gün</th>
                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {portfolio.map((coin) => {
                      // Güvenli değer atamaları - coin_id veya id kullan
                      const coinId = (coin as any).coin_id || coin.id;
                      const amount = coin.amount || 1; // Default 1
                      const purchasePrice = coin.purchase_price || coin.current_price || 0;
                      const currentPrice = coin.current_price || 0;
                      const value = currentPrice * amount;
                      const cost = purchasePrice * amount;
                      const profit = value - cost;
                      const profitPercent = cost > 0 ? (profit / cost) * 100 : 0;

                      const chartData = chartDataCache.get(coinId);
                      const isPositive = (coin.price_change_percentage_24h || 0) >= 0;

                      return (
                        <tr key={coinId} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/coin/${coinId}`)}>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                            ${(purchasePrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                            ${(currentPrice || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                            ${(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                            profit >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {profit >= 0 ? '+' : ''}${(profit || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({profitPercent >= 0 ? '+' : ''}{(profitPercent || 0).toFixed(2)}%)
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end items-center h-12 w-40">
                              {chartData && chartData.length > 0 ? (
                                (() => {
                                  const minValue = Math.min(...chartData);
                                  const maxValue = Math.max(...chartData);
                                  const range = maxValue - minValue || 1;
                                  const width = 160;
                                  const height = 48;
                                  const lineColor = isPositive ? '#10b981' : '#ef4444';
                                  const points = chartData.map((value, index) => {
                                    const x = (index / (chartData.length - 1)) * width;
                                    const y = height - ((value - minValue) / range) * height;
                                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                  }).join(' ');

                                  return (
                                    <svg width={width} height={height} className="w-full">
                                      <defs>
                                        <linearGradient id={`gradient-portfolio-${coinId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                                          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                                        </linearGradient>
                                      </defs>
                                      <path
                                        d={`${points} L ${width} ${height} L 0 ${height} Z`}
                                        fill={`url(#gradient-portfolio-${coinId})`}
                                      />
                                      <path
                                        d={points}
                                        fill="none"
                                        stroke={lineColor}
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  );
                                })()
                              ) : (
                                <div className="w-40 h-12 flex items-center justify-center text-gray-400 text-xs">
                                  -
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleRemoveCoin(coinId, e)}
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

export default PortfolioPage;
