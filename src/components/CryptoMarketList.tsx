"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Bookmark, TrendingUp, TrendingDown } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { addCoinToWatchlistCookie, removeCoinFromWatchlistCookie, getWatchlistFromCookies, hasCookieConsent } from '@/lib/cookieUtils';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_1h?: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d?: number;
  total_volume: number;
  market_cap: number;
  image: string | null;
  market_cap_rank?: number;
}

interface User {
  id?: string;
  user_id?: string;
}

const CryptoMarketList: React.FC = () => {
  const router = useRouter();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);

  // Fetch user data
  useEffect(() => {
    const handleUserLoggedIn = (event: CustomEvent) => {
      setUser(event.detail);
    };

    const handleUserLoggedOut = () => {
      setUser(null);
    };

    window.addEventListener('userLoggedIn', handleUserLoggedIn as EventListener);
    window.addEventListener('userLoggedOut', handleUserLoggedOut);

    // Check for existing user
    const userEvent = new CustomEvent('getUser');
    window.dispatchEvent(userEvent);

    return () => {
      window.removeEventListener('userLoggedIn', handleUserLoggedIn as EventListener);
      window.removeEventListener('userLoggedOut', handleUserLoggedOut);
    };
  }, []);

  // Fetch watchlist
  useEffect(() => {
    const fetchWatchlist = async () => {
      if (user?.id || user?.user_id) {
        try {
          const userId = user.id || user.user_id;
          const response = await fetch(`/api/watchlist?user_id=${userId}`);
          if (response.ok) {
            const data = await response.json();
            const coinIds = data.watchlist?.map((item: any) => item.coin_id || item.id) || [];
            setWatchlist(coinIds);
          }
        } catch (error) {
          console.error('Error fetching watchlist:', error);
        }
      } else if (hasCookieConsent()) {
        const cookieWatchlist = getWatchlistFromCookies();
        setWatchlist(cookieWatchlist.map((c: any) => c.id || c.coin_id));
      }
    };

    fetchWatchlist();

    const handleWatchlistUpdate = () => {
      fetchWatchlist();
    };

    window.addEventListener('watchlistUpdated', handleWatchlistUpdate);
    return () => {
      window.removeEventListener('watchlistUpdated', handleWatchlistUpdate);
    };
  }, [user]);

  // Fetch coins data
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await fetch('/api/coins');
        if (response.ok) {
          const data = await response.json();
          setCoins(data.slice(0, 100)); // Top 100 coins
        }
      } catch (error) {
        console.error('Error fetching coins:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
    const interval = setInterval(fetchCoins, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Toggle watchlist
  const toggleWatchlist = async (coin: Coin, e: React.MouseEvent) => {
    e.stopPropagation();
    const coinId = coin.id;
    const isInWatchlist = watchlist.includes(coinId);

    // Optimistic update
    if (isInWatchlist) {
      setWatchlist(prev => prev.filter(id => id !== coinId));
    } else {
      setWatchlist(prev => [...prev, coinId]);
    }

    try {
      if (user?.id || user?.user_id) {
        const userId = user.id || user.user_id;
        if (isInWatchlist) {
          await fetch(`/api/watchlist?user_id=${userId}&coin_id=${coinId}`, {
            method: 'DELETE',
          });
        } else {
          await fetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              coin_id: coinId,
              coin_symbol: coin.symbol,
              coin_name: coin.name,
            }),
          });
        }
      } else if (hasCookieConsent()) {
        if (isInWatchlist) {
          removeCoinFromWatchlistCookie(coinId);
        } else {
          addCoinToWatchlistCookie(coinId, coin.symbol, coin.name);
        }
      }

      window.dispatchEvent(new CustomEvent('watchlistUpdated'));
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      // Revert optimistic update
      if (isInWatchlist) {
        setWatchlist(prev => [...prev, coinId]);
      } else {
        setWatchlist(prev => prev.filter(id => id !== coinId));
      }
    }
  };

  // Format currency
  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  // Format price
  const formatPrice = (value: number) => {
    if (value >= 1000) {
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  };

  // Generate sparkline data (7 days)
  const generateSparklineData = (coin: Coin) => {
    const basePrice = coin.current_price;
    const change24h = coin.price_change_percentage_24h || 0;
    const change7d = coin.price_change_percentage_7d || 0;
    
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const progress = (6 - i) / 6;
      const variation = Math.sin(i * 0.8) * 0.02;
      const trend = change7d > 0 ? 1 + (change7d / 100) * progress : 1 + (change7d / 100) * progress;
      const price = basePrice * trend * (1 + variation);
      data.push({ day: i, price: Math.max(0, price) });
    }
    return data;
  };

  const chartConfig = {
    price: {
      label: "Price",
      color: "hsl(217.2, 91.2%, 59.8%)",
    },
  } satisfies ChartConfig;

  if (loading) {
    return (
      <div className="px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="text-center text-gray-500">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">

        {/* Table */}
        <div className="overflow-x-auto -mx-6 sm:mx-0">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                  
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[200px]">
                  Coin
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fiyat
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  1sa
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  24sa
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  7g
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  24 Saatlik Hacim
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Piyasa Değeri
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[120px]">
                  Son 7 Gün
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coins.map((coin, index) => {
                const isInWatchlist = watchlist.includes(coin.id);
                const sparklineData = generateSparklineData(coin);
                const isPositive24h = (coin.price_change_percentage_24h || 0) >= 0;
                const isPositive1h = (coin.price_change_percentage_1h || 0) >= 0;
                const isPositive7d = (coin.price_change_percentage_7d || 0) >= 0;

                return (
                  <tr
                    key={coin.id}
                    onClick={() => router.push(`/currencies/${coin.id}`)}
                    className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {coin.market_cap_rank || index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => toggleWatchlist(coin, e)}
                        className={`p-1.5 rounded-lg transition-all ${
                          isInWatchlist
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title={isInWatchlist ? 'İzleme listesinden kaldır' : 'İzleme listesine ekle'}
                      >
                        <Bookmark className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {coin.image && (
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{coin.name}</div>
                          <div className="text-xs text-gray-500 uppercase">{coin.symbol}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                      ${formatPrice(coin.current_price)}
                    </td>
                    <td className={`px-4 py-4 text-right text-sm font-medium ${
                      isPositive1h ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {isPositive1h ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {isPositive1h ? '+' : ''}
                          {(coin.price_change_percentage_1h || 0).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-4 text-right text-sm font-medium ${
                      isPositive24h ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {isPositive24h ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {isPositive24h ? '+' : ''}
                          {coin.price_change_percentage_24h.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className={`px-4 py-4 text-right text-sm font-medium ${
                      isPositive7d ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className="flex items-center justify-end gap-1">
                        {isPositive7d ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span>
                          {isPositive7d ? '+' : ''}
                          {(coin.price_change_percentage_7d || 0).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {formatCurrency(coin.total_volume)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-gray-600">
                      {formatCurrency(coin.market_cap)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-[40px] w-full">
                        <ChartContainer config={chartConfig} className="h-full w-full">
                          <AreaChart
                            data={sparklineData}
                            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
                          >
                            <defs>
                              <linearGradient id={`fill-${coin.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop
                                  offset="5%"
                                  stopColor={isPositive7d ? "hsl(217.2, 91.2%, 59.8%)" : "hsl(0, 84.2%, 60.2%)"}
                                  stopOpacity={0.8}
                                />
                                <stop
                                  offset="95%"
                                  stopColor={isPositive7d ? "hsl(217.2, 91.2%, 59.8%)" : "hsl(0, 84.2%, 60.2%)"}
                                  stopOpacity={0.1}
                                />
                              </linearGradient>
                            </defs>
                            <Area
                              type="natural"
                              dataKey="price"
                              stroke={isPositive7d ? "hsl(217.2, 91.2%, 59.8%)" : "hsl(0, 84.2%, 60.2%)"}
                              fill={`url(#fill-${coin.id})`}
                              strokeWidth={1.5}
                            />
                          </AreaChart>
                        </ChartContainer>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CryptoMarketList;

