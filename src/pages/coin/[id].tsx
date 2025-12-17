import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import Image from 'next/image';
import Link from 'next/link';

interface CoinDetails {
  id: string;
  name: string;
  symbol: string;
  image?: {
    large: string;
    small: string;
    thumb: string;
  };
  market_data?: {
    current_price: {
      usd: number;
    };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    market_cap: {
      usd: number;
    };
    total_volume: {
      usd: number;
    };
    high_24h: {
      usd: number;
    };
    low_24h: {
      usd: number;
    };
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
  };
  description?: {
    en: string;
    tr: string;
  };
  links?: {
    homepage: string[];
    blockchain_site: string[];
  };
}

const CoinDetailsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [coin, setCoin] = useState<CoinDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sparklineData, setSparklineData] = useState<number[]>([]);

  useEffect(() => {
    if (id) {
      fetchCoinDetails(id as string);
    }
  }, [id]);

  const fetchCoinDetails = async (coinId: string) => {
    try {
      setLoading(true);
      // Coin detaylarını ve sparkline verilerini paralel olarak çek
      const [detailsResponse, sparklineResponse] = await Promise.all([
        fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`
        ),
        fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=7&interval=hourly`
        )
      ]);
      
      if (detailsResponse.ok) {
        const data = await detailsResponse.json();
        setCoin(data);
        
        // Sparkline verilerini işle
        if (sparklineResponse.ok) {
          const sparklineData = await sparklineResponse.json();
          if (sparklineData.prices && sparklineData.prices.length > 0) {
            const prices = sparklineData.prices.map((item: [number, number]) => item[1]);
            setSparklineData(prices);
          } else {
            // API'den veri gelmezse simüle et
            generateSparklineData(coinId, data.market_data?.current_price?.usd || 0, data.market_data?.price_change_percentage_24h || 0);
          }
        } else {
          // Sparkline API hatası durumunda simüle et
          generateSparklineData(coinId, data.market_data?.current_price?.usd || 0, data.market_data?.price_change_percentage_24h || 0);
        }
      } else {
        setError('Coin bulunamadı');
      }
    } catch (error) {
      console.error('Error fetching coin details:', error);
      setError('Coin detayları yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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
    setSparklineData(data);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);
  };

  const formatNumber = (value: number | null | undefined) => {
    if (value == null || isNaN(value)) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Yükleniyor... | Kripto Tracker</title>
        </Head>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2563EB]"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !coin) {
    return (
      <>
        <Head>
          <title>Hata | Kripto Tracker</title>
        </Head>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Hata</h1>
            <p className="text-gray-600 mb-4">{error || 'Coin bulunamadı'}</p>
            <Link href="/" className="text-[#2563EB] hover:underline">
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </>
    );
  }

  const marketData = coin.market_data;
  const priceChange24h = marketData?.price_change_percentage_24h || 0;
  const priceChange7d = marketData?.price_change_percentage_7d || 0;

  return (
    <>
      <Head>
        <title>{coin.name} ({coin.symbol.toUpperCase()}) | Kripto Tracker</title>
      </Head>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-4">
              {coin.image?.large && (
                <Image src={coin.image.large} alt={coin.name} width={64} height={64} className="rounded-full" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{coin.name}</h1>
                <p className="text-lg text-gray-600">{coin.symbol.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Price Card with Chart */}
          <div className="bg-gradient-to-r from-[#2563EB] to-[#1d4ed8] rounded-xl shadow-xl p-8 mb-6 text-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="text-sm text-blue-100 mb-2">Güncel Fiyat</div>
                <div className="text-4xl font-bold mb-4">
                  {formatCurrency(marketData?.current_price?.usd)}
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className={`text-2xl font-bold ${priceChange24h >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
                    </div>
                    <div className="text-sm text-blue-100">24 saat</div>
                  </div>
                  {priceChange7d !== undefined && (
                    <div>
                      <div className={`text-xl font-semibold ${priceChange7d >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {priceChange7d >= 0 ? '+' : ''}{priceChange7d.toFixed(2)}%
                      </div>
                      <div className="text-sm text-blue-100">7 gün</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center">
                {sparklineData.length > 0 && (
                  <div className="w-full h-48 bg-white/10 rounded-lg p-4">
                    {(() => {
                      const minValue = Math.min(...sparklineData);
                      const maxValue = Math.max(...sparklineData);
                      const range = maxValue - minValue || 1;
                      const width = 100;
                      const height = 100;
                      const isPositive = sparklineData[sparklineData.length - 1] > sparklineData[0];
                      const lineColor = isPositive ? '#86efac' : '#fca5a5';
                      const points = sparklineData.map((value, index) => {
                        const x = (index / (sparklineData.length - 1)) * width;
                        const y = height - ((value - minValue) / range) * height;
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ');

                      return (
                        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                          <defs>
                            <linearGradient id={`gradient-${coin.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
                              <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          <path
                            d={`${points} L ${width} ${height} L 0 ${height} Z`}
                            fill={`url(#gradient-${coin.id})`}
                          />
                          <path
                            d={points}
                            fill="none"
                            stroke={lineColor}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Piyasa Değeri</div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(marketData?.market_cap?.usd)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">24 Saatlik Hacim</div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(marketData?.total_volume?.usd)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">24s Yüksek</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(marketData?.high_24h?.usd)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">24s Düşük</div>
              <div className="text-xl font-bold text-red-600">{formatCurrency(marketData?.low_24h?.usd)}</div>
            </div>
          </div>

          {/* Supply Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Dolaşımdaki Arz</div>
              <div className="text-xl font-bold text-gray-900">{formatNumber(marketData?.circulating_supply)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Toplam Arz</div>
              <div className="text-xl font-bold text-gray-900">{formatNumber(marketData?.total_supply)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-600 mb-1">Maksimum Arz</div>
              <div className="text-xl font-bold text-gray-900">{formatNumber(marketData?.max_supply) || 'Sınırsız'}</div>
            </div>
          </div>

          {/* Description */}
          {coin.description?.en && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 max-w-7xl mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Hakkında</h2>
              <div 
                className="text-gray-700 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: coin.description.en.substring(0, 500) + '...' }}
              />
            </div>
          )}

          {/* Links */}
          {coin.links?.homepage && coin.links.homepage.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Bağlantılar</h2>
              <div className="flex flex-wrap gap-2">
                {coin.links.homepage.slice(0, 5).map((link, index) => (
                  <a
                    key={index}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#2563EB] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
                  >
                    {new URL(link).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CoinDetailsPage;
