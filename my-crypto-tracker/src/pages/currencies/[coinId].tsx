import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import MarketStatsBar from '../../components/MarketStatsBar';
import PriceChart from '../../components/PriceChart';

interface CoinDetail {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string | null;
  last_updated: string | null;
}

interface ChartData {
  prices: number[];
  priceData?: Array<{ timestamp: number; price: number }>;
  priceChange?: number;
  firstPrice?: number;
  lastPrice?: number;
  error?: string;
}

interface CoinDetailsData {
  id: string;
  name: string;
  symbol: string;
  description: string;
  image: string | null;
  prices: {
    usd: number;
    try: number;
  };
  priceRange24h: {
    high: { usd: number; try: number };
    low: { usd: number; try: number };
  };
  priceRange7d: {
    high: number;
    low: number;
  };
  ath: {
    price: { usd: number; try: number };
    date: string | null;
  };
  atl: {
    price: { usd: number; try: number };
    date: string | null;
  };
  priceChanges: {
    '24h': number;
    '7d': number;
    '30d': number;
  };
  marketData: {
    marketCap: { usd: number; try: number };
    volume24h: { usd: number; try: number };
    fullyDilutedValuation: { usd: number; try: number };
    marketCapRank: number | null;
  };
  supply: {
    circulating: number;
    total: number;
    max: number;
  };
  links: {
    homepage: string | null;
    whitepaper: string | null;
    blockchainExplorers: string[];
    officialForum: string[];
    subreddit: string | null;
    github: string | null;
  };
  categories: string[];
  platforms: Record<string, string>;
  error?: string;
}

type TimeRange = '24h' | '7d' | '30d' | '1y' | '3y' | '5y';

const CoinDetailPage: React.FC = () => {
  const router = useRouter();
  const { coinId } = router.query;
  const [coin, setCoin] = useState<CoinDetail | null>(null);
  const [coinDetails, setCoinDetails] = useState<CoinDetailsData | null>(null);
  const [chartData, setChartData] = useState<ChartData>({ prices: [], priceData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [chartLoading, setChartLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [converterAmount, setConverterAmount] = useState<string>('1');
  const [converterCurrency, setConverterCurrency] = useState<'usd' | 'try'>('usd');
  const [news, setNews] = useState<Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    image: string;
    source: string;
    publishedTime: string;
  }>>([]);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const [portfolio, setPortfolio] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const [marketStats, setMarketStats] = useState({
    totalCoins: 0,
    totalExchanges: 1414,
    marketCap: 0,
    marketCapChange24h: 0,
    volume24h: 0,
    btcDominance: 0,
    ethDominance: 0,
    gasPrice: 0.518,
  });

  // Zaman dilimi mapping
  const timeRangeMap: Record<TimeRange, { days: number; label: string }> = {
    '24h': { days: 1, label: '24 Saat' },
    '7d': { days: 7, label: '1 Hafta' },
    '30d': { days: 30, label: '1 Ay' },
    '1y': { days: 365, label: '1 Yıl' },
    '3y': { days: 1095, label: '3 Yıl' },
    '5y': { days: 1825, label: '5 Yıl' },
  };

  // Portfolio'yu localStorage'dan yükle ve coinId değiştiğinde güncelle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio');
      if (saved) {
        try {
          const portfolioIds = JSON.parse(saved);
          setPortfolio(portfolioIds);
        } catch (error) {
          console.error('Portfolio verisi parse edilemedi:', error);
        }
      }
    }
  }, [coinId]);

  // Coin detaylarını çek
  useEffect(() => {
    if (!coinId || typeof coinId !== 'string') return;

    const fetchCoinDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/coins/${coinId}`);
        if (!response.ok) {
          throw new Error('Coin bulunamadı');
        }
        const data = await response.json();
        setCoin(data);
      } catch (err) {
        console.error('Coin detay hatası:', err);
        setError(err instanceof Error ? err.message : 'Coin yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchCoinDetail();
  }, [coinId]);

  // Grafik verilerini çek
  useEffect(() => {
    if (!coinId || typeof coinId !== 'string') return;

    const fetchChartData = async () => {
      setChartLoading(true);
      try {
        const days = timeRangeMap[timeRange].days;
        const response = await fetch(`/api/chart/${coinId}?days=${days}`);
        const data: ChartData = await response.json();
        
        if (data.priceData && Array.isArray(data.priceData) && data.priceData.length > 0) {
          setChartData(data);
        } else if (data.prices && Array.isArray(data.prices) && data.prices.length > 0) {
          // Eğer priceData yoksa ama prices varsa, priceData oluştur
          // API'den gelen veri yapısına göre timestamp'leri tahmin et
          const now = Date.now();
          const interval = (days * 24 * 60 * 60 * 1000) / data.prices.length;
          const priceData = data.prices.map((price, index) => ({
            timestamp: now - (data.prices.length - index) * interval,
            price: price
          }));
          setChartData({
            ...data,
            priceData: priceData
          });
        } else {
          setChartData({ prices: [], priceData: [], error: data.error || 'Veri bulunamadı' });
        }
      } catch (err) {
        console.error('Grafik verisi hatası:', err);
        setChartData({ prices: [], priceData: [] });
      } finally {
        setChartLoading(false);
      }
    };

    fetchChartData();
  }, [coinId, timeRange]);

  // Coin detaylarını çek (CoinGecko'dan)
  useEffect(() => {
    if (!coinId || typeof coinId !== 'string') return;

    // coinId değiştiğinde coinDetails'i sıfırla
    setCoinDetails(null);

    const fetchCoinDetails = async () => {
      setDetailsLoading(true);
      try {
        const response = await fetch(`/api/coins/${coinId}/details`);
        const data: CoinDetailsData = await response.json();
        if (!data.error) {
          setCoinDetails(data);
          
          // 7 günlük aralığı hesapla
          if (chartData.prices && chartData.prices.length > 0) {
            const prices7d = chartData.prices;
            const high7d = Math.max(...prices7d);
            const low7d = Math.min(...prices7d);
            setCoinDetails(prev => prev ? {
              ...prev,
              priceRange7d: { high: high7d, low: low7d }
            } : null);
          }
        }
      } catch (err) {
        console.error('Coin detayları hatası:', err);
      } finally {
        setDetailsLoading(false);
      }
    };

    fetchCoinDetails();
  }, [coinId]);

  // Global market stats'ı çek
  useEffect(() => {
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
    fetchGlobalStats();
  }, []);

  // 7 günlük aralığı güncelle
  useEffect(() => {
    if (chartData.prices && chartData.prices.length > 0 && coinDetails) {
      const prices7d = chartData.prices;
      const high7d = Math.max(...prices7d);
      const low7d = Math.min(...prices7d);
      setCoinDetails(prev => prev ? {
        ...prev,
        priceRange7d: { high: high7d, low: low7d }
      } : null);
    }
  }, [chartData.prices, coinDetails]);

  // Haberleri çek
  useEffect(() => {
    if (!coinId || typeof coinId !== 'string') return;

    const fetchNews = async () => {
      try {
        const response = await fetch(`/api/coins/${coinId}/news`);
        const data = await response.json();
        if (data.news && Array.isArray(data.news)) {
          setNews(data.news);
        }
      } catch (err) {
        console.error('Haberler hatası:', err);
      }
    };

    fetchNews();
  }, [coinId]);

  // Format helpers
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: amount < 1 ? 8 : 2,
    }).format(amount);
  };

  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatTrillion = (num: number) => {
    if (num >= 1e12) {
      return (num / 1e12).toFixed(3) + ' Tn';
    } else if (num >= 1e9) {
      return (num / 1e9).toFixed(3) + ' Mr';
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(3) + ' Mn';
    }
    return formatNumber(num);
  };

  const formatCurrencyTRY = (amount: number | null | undefined) => {
    if (amount == null || isNaN(amount)) return '₺0,00';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Tarih formatla
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Bilinmiyor';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Tarih farkını hesapla
  const getDateDifference = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffYears > 0) {
      return `${diffYears} yıldan fazla`;
    } else if (diffMonths > 0) {
      return `yaklaşık ${diffMonths} ay`;
    } else if (diffDays > 0) {
      return `yaklaşık ${diffDays} gün`;
    }
    return 'yaklaşık 1 gün';
  };

  // Yüzdelik değişimi hesapla (ATH/ATL için)
  const calculatePercentageChange = (current: number, target: number) => {
    if (target === 0) return 0;
    return ((current - target) / target) * 100;
  };

  // Yüzdelik değişimi hesapla
  const getPriceChange = () => {
    if (chartData.priceChange !== undefined) {
      return chartData.priceChange;
    }
    // Fallback: coin'in 24h değişimini kullan
    if (coin) {
      const multiplier = 
        timeRange === '24h' ? 1 : 
        timeRange === '7d' ? 7 : 
        timeRange === '30d' ? 30 : 
        timeRange === '1y' ? 365 : 
        timeRange === '3y' ? 1095 : 
        timeRange === '5y' ? 1825 : 365;
      return (coin.price_change_percentage_24h || 0) * (multiplier / 24);
    }
    return 0;
  };

  const priceChange = getPriceChange();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-lg">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error || !coin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error || 'Coin bulunamadı'}</div>
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-14">
      <Head>
        <title>{coin.name} ({coin.symbol.toUpperCase()}) - Dijital Marketim</title>
        <meta name="description" content={`${coin.name} fiyat, grafik ve analiz bilgileri`} />
      </Head>

      {/* Navbar */}
      <Navbar marketStats={marketStats} />

      {/* Coin Detay İçeriği */}
      <div className="w-full px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Ana Sayfa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{coin.name}</span>
        </nav>

        {/* Header ve Grafik ile Yan Bloklar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch">
          {/* Sol Yan Bloklar */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            {/* Küresel Fiyatlar - Küçültülmüş */}
            <div 
              className="bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={() => coinDetails && setExpandedBlock('global-prices')}
            >
              <h3 className="text-xs font-bold text-gray-900 mb-2">Küresel Fiyatlar</h3>
              {coinDetails ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{coin.symbol.toUpperCase()} / USD</div>
                      <div className="text-xs text-gray-500">US Dollar</div>
                    </div>
                    <div className="text-xs font-bold text-gray-900">{formatCurrency(coinDetails.prices.usd)}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-gray-900">{coin.symbol.toUpperCase()} / TRY</div>
                      <div className="text-xs text-gray-500">Turkish Lira</div>
                    </div>
                    <div className="text-xs font-bold text-gray-900">{formatCurrencyTRY(coinDetails.prices.try)}</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Piyasa İstatistikleri - Küçültülmüş */}
            <div 
              className="bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={() => coinDetails && setExpandedBlock('market-stats')}
            >
              <h3 className="text-xs font-bold text-gray-900 mb-2">Piyasa İstatistikleri</h3>
              {coinDetails ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Piyasa Değeri</span>
                    <span className="text-gray-900 font-semibold text-xs">{formatTrillion(coinDetails.marketData.marketCap.usd)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">24s Hacim</span>
                    <span className="text-gray-900 font-semibold text-xs">{formatTrillion(coinDetails.marketData.volume24h.usd)} $</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dolaşım Arzı</span>
                    <span className="text-gray-900 font-semibold text-xs">{formatTrillion(coinDetails.supply.circulating)}</span>
                  </div>
                  {coinDetails.marketData.marketCapRank && (
                    <div className="flex justify-between pt-1.5 border-t border-gray-100">
                      <span className="text-gray-600">Sıralama</span>
                      <span className="text-gray-900 font-bold text-xs">#{coinDetails.marketData.marketCapRank}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Tarihsel Fiyat - Küçültülmüş */}
            <div 
              className="bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={() => coinDetails && setExpandedBlock('historical-price')}
            >
              <h3 className="text-xs font-bold text-gray-900 mb-2">Tarihsel Fiyat</h3>
              {coinDetails ? (
                <div className="space-y-1.5 text-xs">
                  <div>
                    <div className="text-gray-600 mb-0.5 text-xs">24sa Aralık</div>
                    <div className="text-xs font-semibold text-gray-900">
                      {formatCurrency(coinDetails.priceRange24h.low.usd)} - {formatCurrency(coinDetails.priceRange24h.high.usd)}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600 mb-0.5 text-xs">7g Aralık</div>
                    <div className="text-xs font-semibold text-gray-900">
                      {formatCurrency(coinDetails.priceRange7d.low)} - {formatCurrency(coinDetails.priceRange7d.high)}
                    </div>
                  </div>
                  <div className="pt-1.5 border-t border-gray-100 grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-gray-600 mb-0.5 text-xs">ATH</div>
                      <div className="text-xs font-bold text-gray-900">{formatCurrency(coinDetails.ath.price.usd)}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-0.5 text-xs">ATL</div>
                      <div className="text-xs font-bold text-gray-900">{formatCurrency(coinDetails.atl.price.usd)}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                </div>
              )}
            </div>
          </div>

          {/* Orta Kısım - Header ve Grafik */}
          <div className="lg:col-span-6 flex flex-col space-y-6">
        {/* Coin Header - Modern Card */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
              {coin.image && (
                <img
                  src={coin.image}
                  alt={coin.name}
                      className="w-16 h-16 rounded-full ring-4 ring-gray-200"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-1">{coin.name}</h1>
                    <p className="text-gray-500 uppercase text-base font-semibold">{coin.symbol}</p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-3">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                {formatCurrency(coin.current_price)}
              </div>
              <div
                    className={`text-xl font-semibold flex items-center gap-2 ${
                  coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                <span>{coin.price_change_percentage_24h >= 0 ? '▲' : '▼'}</span>
                <span>{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%</span>
                <span className="text-gray-500 text-sm font-normal">(24s)</span>
              </div>
              {/* Portfolio Butonu */}
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  const isInPortfolio = portfolio.includes(coin.id);
                  if (isInPortfolio) {
                    const newPortfolio = portfolio.filter(id => id !== coin.id);
                    setPortfolio(newPortfolio);
                    localStorage.setItem('portfolio', JSON.stringify(newPortfolio));
                  } else {
                    const newPortfolio = [...portfolio, coin.id];
                    setPortfolio(newPortfolio);
                    localStorage.setItem('portfolio', JSON.stringify(newPortfolio));
                    // Toast bildirimi göster
                    setToast({ message: `${coin.name} portföye eklendi`, visible: true });
                    setTimeout(() => {
                      setToast({ message: '', visible: false });
                    }, 3000);
                  }
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  portfolio.includes(coin.id)
                    ? 'bg-gradient-to-r from-blue-500 via-yellow-500 via-red-500 to-green-500 text-white shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                }`}
                title={portfolio.includes(coin.id) ? 'Portföyden çıkar' : 'Portföye ekle'}
              >
                {portfolio.includes(coin.id) ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                )}
                </button>
            </div>
          </div>

          {/* Yüzdelik Değişim */}
          <div className="mb-4 pb-4">
            <div className="text-right">
              <div className="text-xs text-gray-600 mb-1">Seçili Zaman Dilimi Değişimi</div>
              <div
                className={`text-2xl font-bold ${
                  priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {priceChange >= 0 ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
              </div>
            </div>
          </div>

          {/* İstatistikler Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Piyasa Değeri</div>
                  <div className="text-base font-bold text-gray-900">{formatTrillion(coin.market_cap)} $</div>
            </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">24s Hacim</div>
                  <div className="text-base font-bold text-gray-900">{formatTrillion(coin.total_volume)} $</div>
            </div>
                <div 
                  className="bg-gray-50 rounded-lg p-3 relative"
                  onMouseEnter={(e) => {
                    const element = e.currentTarget.querySelector('.value-text') as HTMLElement;
                    if (element && element.scrollWidth > element.clientWidth) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipContent(formatCurrency(coin.market_cap));
                      setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
                    }
                  }}
                  onMouseLeave={() => {
                    setTooltipContent(null);
                    setTooltipPosition(null);
                  }}
                >
                  <div className="text-xs text-gray-600 mb-1">Tam Piyasa Değeri</div>
                  <div className="text-base font-bold text-gray-900 value-text truncate">{formatCurrency(coin.market_cap)}</div>
            </div>
                <div 
                  className="bg-gray-50 rounded-lg p-3 relative"
                  onMouseEnter={(e) => {
                    const element = e.currentTarget.querySelector('.value-text') as HTMLElement;
                    if (element && element.scrollWidth > element.clientWidth) {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltipContent(formatCurrency(coin.total_volume));
                      setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top - 10 });
                    }
                  }}
                  onMouseLeave={() => {
                    setTooltipContent(null);
                    setTooltipPosition(null);
                  }}
                >
                  <div className="text-xs text-gray-600 mb-1">Tam Hacim</div>
                  <div className="text-base font-bold text-gray-900 value-text truncate">{formatCurrency(coin.total_volume)}</div>
            </div>
          </div>
        </div>

        {/* Modern Grafik Kartı */}
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">Fiyat Grafiği</h2>
                <div className="flex items-center gap-3">
                  {/* Zaman Dilimi Seçenekleri */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['24h', '7d', '30d', '1y', '3y', '5y'] as TimeRange[]).map((range) => (
                      <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          timeRange === range
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        {timeRangeMap[range].label}
                      </button>
                    ))}
                  </div>
            <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Veri:</span>
                    <span className="text-xs font-semibold text-blue-600">CoinGecko</span>
                  </div>
            </div>
          </div>

          {chartLoading ? (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-gray-600">Grafik yükleniyor...</div>
              </div>
            </div>
          ) : chartData.priceData && Array.isArray(chartData.priceData) && chartData.priceData.length > 0 ? (
            <div className="relative w-full">
              <div className="w-full overflow-x-auto">
                <PriceChart 
                  data={chartData.priceData} 
                  width={500} 
                  height={200}
                  timeRange={timeRange}
                />
              </div>
              {/* Grafik Alt Bilgi */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-4 py-2">
                <div>
                  Başlangıç: <span className="text-gray-900 font-semibold">{formatCurrency(chartData.firstPrice || 0)}</span>
                </div>
                <div>
                  Bitiş: <span className="text-gray-900 font-semibold">{formatCurrency(chartData.lastPrice || coin.current_price)}</span>
                </div>
                <div>
                  Değişim: <span className={`font-semibold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-600">
              {chartData.error ? (
                <div className="text-center max-w-md mx-auto px-4">
                  <p className="text-red-600 mb-2 font-semibold">Grafik verisi yüklenemedi</p>
                  <p className="text-sm text-gray-500 mb-4">{chartData.error}</p>
                  {chartData.error.includes('429') || chartData.error.includes('çok fazla') ? (
                    <div className="bg-yellow-50 rounded-lg p-4 mt-4">
                      <p className="text-sm text-yellow-800">
                        CoinGecko API rate limit&apos;e ulaşıldı. Lütfen birkaç dakika sonra tekrar deneyin.
                      </p>
            </div>
                  ) : null}
                </div>
              ) : (
                'Grafik verisi yükleniyor...'
          )}
        </div>
          )}
                </div>
              </div>

          {/* Sağ Yan Bloklar */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            {/* Coin Çevirici - Küçültülmüş */}
            <div 
              className="bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={(e) => {
                e.stopPropagation();
                coinDetails && setExpandedBlock('converter');
              }}
            >
              <h3 className="text-xs font-bold text-gray-900 mb-2">{coin.symbol.toUpperCase()} Çevirici</h3>
              {coinDetails ? (
                <div className="space-y-2">
              <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">{coin.symbol.toUpperCase()}</label>
                <input
                  type="number"
                  value={converterAmount}
                  onChange={(e) => {
                        e.stopPropagation();
                    setConverterAmount(e.target.value);
                  }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  placeholder="1"
                />
              </div>
              <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">Para Birimi</label>
                <select
                  value={converterCurrency}
                      onChange={(e) => {
                        e.stopPropagation();
                        setConverterCurrency(e.target.value as 'usd' | 'try');
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                >
                  <option value="usd">USD</option>
                  <option value="try">TRY</option>
                </select>
              </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <div className="text-xs text-gray-600 mb-0.5">Sonuç:</div>
                    <div className="text-sm font-bold text-gray-900">
                {converterCurrency === 'usd'
                  ? formatCurrency(parseFloat(converterAmount || '0') * coinDetails.prices.usd)
                  : formatCurrencyTRY(parseFloat(converterAmount || '0') * coinDetails.prices.try)}
              </div>
            </div>
          </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-8 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                </div>
                  )}
                </div>

            {/* Bilgi Bölümü - Küçültülmüş */}
            <div 
              className="bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={(e) => {
                e.stopPropagation();
                coinDetails && setExpandedBlock('info');
              }}
            >
              <h3 className="text-xs font-bold text-gray-900 mb-2">Bilgi</h3>
              {coinDetails ? (
                <div className="space-y-1.5 text-xs">
              {coinDetails.links.homepage && (
                <div>
                      <div className="text-gray-600 mb-0.5 text-xs">İnternet Sitesi</div>
                    <a
                      href={coinDetails.links.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {coinDetails.links.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '').substring(0, 25)}
                      </a>
                </div>
              )}
              {coinDetails.links.blockchainExplorers.length > 0 && (
                <div>
                      <div className="text-gray-600 mb-0.5 text-xs">Tarayıcılar</div>
                      <div className="flex flex-wrap gap-1">
                        {coinDetails.links.blockchainExplorers.slice(0, 2).map((explorer, idx) => (
                      <a
                        key={idx}
                        href={explorer}
                        target="_blank"
                        rel="noopener noreferrer"
                            className="px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                      >
                            {explorer.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0].substring(0, 12)}
                      </a>
                    ))}
                  </div>
                </div>
              )}
                  {coinDetails.marketData.marketCapRank && (
                    <div className="pt-1.5 border-t border-gray-100">
                      <div className="text-gray-600 mb-0.5 text-xs">Sıralama</div>
                      <div className="text-xs font-bold text-gray-900">#{coinDetails.marketData.marketCapRank}</div>
                    </div>
                  )}
                  </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-100 rounded animate-pulse"></div>
                </div>
              )}
                </div>

            {/* Topluluk Duygu Anketi - Küçültülmüş */}
            <div 
              className="bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all"
              onClick={() => setExpandedBlock('sentiment')}
            >
              <h3 className="text-xs font-bold text-gray-900 mb-1.5">
                Bugün {coin.name} hakkında nasıl hissediyorsunuz?
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="p-2 bg-white rounded-lg hover:bg-green-50 transition-all text-center shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-xl mb-0.5">🚀</div>
                  <div className="text-sm font-bold text-gray-900">81%</div>
                  <div className="text-xs text-gray-600">Yükseliş</div>
                </button>
                <button 
                  className="p-2 bg-white rounded-lg hover:bg-red-50 transition-all text-center shadow-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-xl mb-0.5">👎</div>
                  <div className="text-sm font-bold text-gray-900">39%</div>
                  <div className="text-xs text-gray-600">Düşüş</div>
                </button>
                  </div>
                </div>
            </div>
          </div>

        {/* Coin Hakkında Detaylı Bilgiler - Küçültülmüş */}
        {coinDetails && coinDetails.description && (
          <div 
            className="bg-white rounded-xl p-4 shadow-lg mb-6 cursor-pointer hover:shadow-xl transition-all"
            onClick={() => setExpandedBlock('about')}
          >
            <h3 className="text-sm font-bold text-gray-900 mb-3">{coin.name} ({coin.symbol.toUpperCase()}) nedir?</h3>
            <div className="text-xs text-gray-700 leading-relaxed line-clamp-4">
              <div
                dangerouslySetInnerHTML={{
                  __html: coinDetails.description
                    .split('\n')
                    .map((para) => `<p>${para}</p>`)
                    .join('')
                    .substring(0, 500) + (coinDetails.description.length > 500 ? '...' : ''),
                }}
              />
            </div>
          </div>
        )}

        {/* Haberler Bölümü */}
        {news.length > 0 && (
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{coin.name} Son Haberleri ve Yorumları</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((article) => {
                // URL'yi kontrol et ve düzelt
                let articleUrl = article.url || '';
                
                // URL boş veya geçersizse varsayılan URL oluştur
                if (!articleUrl || articleUrl.trim() === '' || articleUrl === '#') {
                  articleUrl = `https://cointelegraph.com/search?q=${encodeURIComponent(coin.name)}`;
                } else {
                  // URL geçerli mi kontrol et ve düzelt
                  try {
                    // URL'i parse et
                    const url = new URL(articleUrl);
                    articleUrl = url.toString();
                  } catch {
                    // URL geçerli değilse, http/https ekle
                    if (!articleUrl.startsWith('http://') && !articleUrl.startsWith('https://')) {
                      articleUrl = `https://${articleUrl}`;
                    }
                    // Tekrar kontrol et
                    try {
                      new URL(articleUrl);
                    } catch {
                      // Hala geçersizse varsayılan URL kullan
                      articleUrl = `https://cointelegraph.com/search?q=${encodeURIComponent(coin.name)}`;
                    }
                  }
                }
                
                return (
                <a
                  key={article.id}
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group shadow-sm"
                >
                  <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/400x250?text=Haber+Görseli';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium">{article.source}</span>
                      <span>{article.publishedTime}</span>
                    </div>
                  </div>
                </a>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <a
                href={`https://cointelegraph.com/search?q=${coin.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg"
              >
                Daha Fazla Haber Gör
              </a>
            </div>
          </div>
        )}

        {/* Ek Bilgiler */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Hakkında</h2>
          <p className="text-gray-700 leading-relaxed">
            {coin.name} ({coin.symbol.toUpperCase()}), kripto para piyasasında aktif olarak işlem gören bir
            dijital varlıktır. Mevcut fiyatı {formatCurrency(coin.current_price)} seviyesindedir ve son 24
            saatte %{Math.abs(coin.price_change_percentage_24h).toFixed(2)}{' '}
            {coin.price_change_percentage_24h >= 0 ? 'artış' : 'düşüş'} göstermiştir.
          </p>
          {coin.last_updated && (
            <div className="mt-4 text-sm text-gray-600">
              Son Güncelleme: {new Date(coin.last_updated).toLocaleString('tr-TR')}
            </div>
          )}
        </div>

        {/* Tooltip */}
        {tooltipContent && tooltipPosition && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translateX(-50%) translateY(-100%)',
            }}
          >
            {tooltipContent}
            <div
              className="absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
            />
          </div>
        )}

        {/* Genişletilmiş Blok Modal */}
        {expandedBlock && coinDetails && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setExpandedBlock(null)}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900">
                  {expandedBlock === 'global-prices' && 'Küresel Fiyatlar'}
                  {expandedBlock === 'market-stats' && 'Piyasa İstatistikleri'}
                  {expandedBlock === 'historical-price' && 'Tarihsel Fiyat'}
                  {expandedBlock === 'converter' && `${coin.symbol.toUpperCase()} Çevirici`}
                  {expandedBlock === 'info' && 'Bilgi'}
                  {expandedBlock === 'sentiment' && `Bugün ${coin.name} hakkında nasıl hissediyorsunuz?`}
                  {expandedBlock === 'about' && `${coin.name} (${coin.symbol.toUpperCase()}) nedir?`}
                </h2>
                <button
                  onClick={() => setExpandedBlock(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6">
                {/* Küresel Fiyatlar */}
                {expandedBlock === 'global-prices' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">{coin.symbol.toUpperCase()} / USD</div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">{formatCurrency(coinDetails.prices.usd)}</div>
                        <div className="text-sm text-gray-500">US Dollar</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">{coin.symbol.toUpperCase()} / TRY</div>
                        <div className="text-3xl font-bold text-gray-900 mb-2">{formatCurrencyTRY(coinDetails.prices.try)}</div>
                        <div className="text-sm text-gray-500">Turkish Lira</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Not:</strong> Fiyatlar gerçek zamanlı olarak güncellenmektedir. Farklı borsalarda fiyatlar değişiklik gösterebilir.
                      </p>
                    </div>
                  </div>
                )}

                {/* Piyasa İstatistikleri */}
                {expandedBlock === 'market-stats' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">Piyasa Değeri</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(coinDetails.marketData.marketCap.usd)}</div>
                        <div className="text-xs text-gray-500 mt-2">TRY: {formatCurrencyTRY(coinDetails.marketData.marketCap.try)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">24 Saat Hacim</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(coinDetails.marketData.volume24h.usd)}</div>
                        <div className="text-xs text-gray-500 mt-2">TRY: {formatCurrencyTRY(coinDetails.marketData.volume24h.try)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">Dolaşım Arzı</div>
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(coinDetails.supply.circulating)}</div>
                        <div className="text-xs text-gray-500 mt-2">{coin.symbol.toUpperCase()}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">Toplam Arz</div>
                        <div className="text-2xl font-bold text-gray-900">{formatNumber(coinDetails.supply.total)}</div>
                        <div className="text-xs text-gray-500 mt-2">{coin.symbol.toUpperCase()}</div>
                      </div>
                    </div>
                    {coinDetails.marketData.marketCapRank && (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="text-sm text-blue-800">
                          <strong>Piyasa Değeri Sıralaması:</strong> #{coinDetails.marketData.marketCapRank}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tarihsel Fiyat */}
                {expandedBlock === 'historical-price' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">24 Saat Aralık</div>
                        <div className="text-lg font-semibold text-gray-900 mb-1">Düşük</div>
                        <div className="text-2xl font-bold text-gray-900 mb-4">{formatCurrency(coinDetails.priceRange24h.low.usd)}</div>
                        <div className="text-lg font-semibold text-gray-900 mb-1">Yüksek</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(coinDetails.priceRange24h.high.usd)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">7 Gün Aralık</div>
                        <div className="text-lg font-semibold text-gray-900 mb-1">Düşük</div>
                        <div className="text-2xl font-bold text-gray-900 mb-4">{formatCurrency(coinDetails.priceRange7d.low)}</div>
                        <div className="text-lg font-semibold text-gray-900 mb-1">Yüksek</div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(coinDetails.priceRange7d.high)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-green-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">Tüm Zamanların En Yükseği (ATH)</div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(coinDetails.ath.price.usd)}</div>
                        {coinDetails.ath.date && (
                          <div className="text-xs text-gray-500">{new Date(coinDetails.ath.date).toLocaleDateString('tr-TR')}</div>
                        )}
                      </div>
                      <div className="bg-red-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">Tüm Zamanların En Düşüğü (ATL)</div>
                        <div className="text-2xl font-bold text-gray-900 mb-2">{formatCurrency(coinDetails.atl.price.usd)}</div>
                        {coinDetails.atl.date && (
                          <div className="text-xs text-gray-500">{new Date(coinDetails.atl.date).toLocaleDateString('tr-TR')}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Çevirici */}
                {expandedBlock === 'converter' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{coin.symbol.toUpperCase()}</label>
                          <input
                            type="number"
                            value={converterAmount}
                            onChange={(e) => setConverterAmount(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Para Birimi</label>
                          <select
                            value={converterCurrency}
                            onChange={(e) => setConverterCurrency(e.target.value as 'usd' | 'try')}
                            className="w-full px-4 py-3 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          >
                            <option value="usd">USD</option>
                            <option value="try">TRY</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-6 p-6 bg-blue-50 rounded-xl">
                        <div className="text-sm text-gray-600 mb-2">Sonuç:</div>
                        <div className="text-4xl font-bold text-gray-900">
                          {converterCurrency === 'usd'
                            ? formatCurrency(parseFloat(converterAmount || '0') * coinDetails.prices.usd)
                            : formatCurrencyTRY(parseFloat(converterAmount || '0') * coinDetails.prices.try)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bilgi */}
                {expandedBlock === 'info' && (
                  <div className="space-y-6">
                    {coinDetails.links.homepage && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">İnternet Sitesi</div>
                        <a
                          href={coinDetails.links.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-lg font-semibold break-all"
                        >
                          {coinDetails.links.homepage}
                        </a>
                      </div>
                    )}
                    {coinDetails.links.blockchainExplorers.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-4">Blockchain Tarayıcılar</div>
                        <div className="flex flex-wrap gap-3">
                          {coinDetails.links.blockchainExplorers.map((explorer, idx) => (
                            <a
                              key={idx}
                              href={explorer}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-white hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                            >
                              {explorer.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    {coinDetails.links.github && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="text-sm text-gray-600 mb-2">GitHub</div>
                        <a
                          href={coinDetails.links.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-lg font-semibold break-all"
                        >
                          {coinDetails.links.github}
                        </a>
                      </div>
                    )}
                    {coinDetails.marketData.marketCapRank && (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="text-sm text-blue-800">
                          <strong>Piyasa Değeri Sıralaması:</strong> #{coinDetails.marketData.marketCapRank}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Topluluk Duygu Anketi */}
                {expandedBlock === 'sentiment' && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <p className="text-base text-gray-700 mb-6">
                        Topluluk bugün {coin.name} ({coin.symbol.toUpperCase()}) kripto parasının{' '}
                        {coin.price_change_percentage_24h >= 0 ? 'yükseleceğini' : 'düşeceğini'} düşünüyor.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button className="p-6 bg-white rounded-xl hover:bg-green-50 transition-all text-center shadow-lg">
                          <div className="text-5xl mb-3">🚀</div>
                          <div className="text-4xl font-bold text-gray-900 mb-2">81%</div>
                          <div className="text-lg text-gray-600">Yükseliş</div>
                        </button>
                        <button className="p-6 bg-white rounded-xl hover:bg-red-50 transition-all text-center shadow-lg">
                          <div className="text-5xl mb-3">👎</div>
                          <div className="text-4xl font-bold text-gray-900 mb-2">39%</div>
                          <div className="text-lg text-gray-600">Düşüş</div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Coin Hakkında */}
                {expandedBlock === 'about' && coinDetails.description && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <div className="text-base text-gray-700 leading-relaxed">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: coinDetails.description
                              .split('\n')
                              .map((para) => `<p class="mb-4">${para}</p>`)
                              .join(''),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-white px-4 py-12 mt-6">
          <div className="w-full">
            {/* Üst Kısım - Logo ve Açıklama */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
              {/* Sol Taraf - Logo ve Açıklama */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900 lowercase">cripto</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Dijital Marketim, kripto piyasasına dair temel bir analiz sağlar. Dijital Marketim; fiyatı, hacmi ve piyasa değerini takip etmenin yanı sıra topluluk büyümesini, açık kaynak kod geliştirmeyi, önemli olayları ve zincir üstü metrikleri takip eder.
                </p>
              </div>

              {/* Sağ Taraf - Link Sütunları */}
              <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8">
                {/* Kaynaklar */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Kaynaklar</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto Haberleri</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto Para Hazine Rezervleri</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto Isı Haritası</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kripto API&apos;si</a>
                    </li>
                  </ul>
                </div>

                {/* Destek */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Destek</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">İletişim Formu</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Reklam</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Yardım Merkezi</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">SSS</a>
                    </li>
                  </ul>
                </div>

                {/* Cripto Hakkında */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Cripto Hakkında</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Hakkımızda</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Metodoloji</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Gizlilik Politikası</a>
                    </li>
                  </ul>
                </div>

                {/* Topluluk */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Topluluk</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">X/Twitter</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Telegram</a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Reddit</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Alt Kısım - Copyright */}
            <div className="pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="text-sm text-gray-600">
                  © 2025 Cripto. All Rights Reserved.
                </div>
              </div>

              {/* Önemli Uyarı */}
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-bold text-gray-900 mb-2">ÖNEMLİ UYARI</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Bu web sitesinde, bağlantılı sitelerde, uygulamalarda, forumlarda, bloglarda, sosyal medya hesaplarında ve diğer platformlarda (birlikte &quot;Site&quot;) yer alan içerikler, yalnızca genel bilgilendirme amaçlıdır ve üçüncü taraflardan kaynaklanmaktadır. Bu içeriklerin doğruluğu, eksiksizliği, güncelliği veya güvenilirliği konusunda hiçbir garanti verilmemektedir. Herhangi bir yatırım kararı vermeden önce, kendi araştırmanızı yapmanız ve bağımsız profesyonel tavsiye almanız önerilir. Ticaret risklidir ve kayıplar meydana gelebilir. Bu sitede yer alan hiçbir içerik, teşvik, tavsiye veya teklif niteliği taşımamaktadır.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-r from-blue-500 via-yellow-500 via-red-500 to-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast({ message: '', visible: false })}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            </button>
        </div>
      </div>
      )}

      {/* Market Stats Bar - Fixed at Bottom */}
      <MarketStatsBar marketStats={marketStats} />
    </div>
  );
};

export default CoinDetailPage;

