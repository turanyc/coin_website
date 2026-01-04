import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { TrendingUp, Footprints, Waves } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Rectangle, XAxis, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, LabelList, RadialBar, RadialBarChart, Cell } from "recharts";
import Navbar from '../../components/Navbar';
import MarketStatsBar from '../../components/MarketStatsBar';
import PriceChart from '../../components/PriceChart';
import logoImage from '../../img/cripto_logo.png';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

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

interface TickerData {
  base: string;
  target: string;
  last: number;
  volume: number;
  bid?: number;
  ask?: number;
  bid_ask_spread_percentage?: number;
  trust_score?: string;
  market: {
    name: string;
    identifier: string;
    logo?: string;
    has_trading_incentive?: boolean;
  };
  is_anomaly?: boolean;
}

const CoinDetailPage: React.FC = () => {
  const router = useRouter();
  const { coinId } = router.query;
  const [coin, setCoin] = useState<CoinDetail | null>(null);
  const [coinDetails, setCoinDetails] = useState<CoinDetailsData | null>(null);
  const [chartData, setChartData] = useState<ChartData>({ prices: [], priceData: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navbarExpanded, setNavbarExpanded] = useState(false);
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
  const [chartTab, setChartTab] = useState<'Price' | 'Mkt Cap' | 'TradingView'>('Price');
  const [isLogScale, setIsLogScale] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [marketFilter, setMarketFilter] = useState<'ALL' | 'CEX' | 'DEX' | 'Spot' | 'Perpetual' | 'Futures'>('Spot');
  const [marketPage, setMarketPage] = useState(1);
  const [marketRowsPerPage, setMarketRowsPerPage] = useState(10);
  const [sentimentBullish, setSentimentBullish] = useState(81);
  const [sentimentBearish, setSentimentBearish] = useState(19);
  const [sentimentVotes, setSentimentVotes] = useState(5800000);
  const [sentimentPage, setSentimentPage] = useState(1);
  const [sentimentTotalPages, setSentimentTotalPages] = useState(2);
  const [postFeedTab, setPostFeedTab] = useState<'Top' | 'Latest'>('Top');
  const [communityPosts, setCommunityPosts] = useState<Array<{
    id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    profile_picture_url: string | null;
    is_verified: boolean;
    content_text: string;
    image_url: string | null;
    created_at: string;
    like_count: number;
    comment_count: number;
    share_count: number;
    view_count: number;
    bullish_count?: number;
    bearish_count?: number;
  }>>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [posting, setPosting] = useState(false);
  const [markets, setMarkets] = useState<Array<{
    exchange: string;
    pair: string;
    price: number;
    volume24h: number;
    volumePercent: number;
    bidAskSpread?: { bid: number; ask: number };
    liquidity?: number;
    logo?: string;
    trustScore?: string;
    marketType?: string;
  }>>([]);
  const [marketsLoading, setMarketsLoading] = useState(false);
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
  const [todayGainers, setTodayGainers] = useState<any[]>([]);
  const [todayLosers, setTodayLosers] = useState<any[]>([]);
  const [trendingCoins, setTrendingCoins] = useState<any[]>([]);
  const [topMarketCapCoins, setTopMarketCapCoins] = useState<any[]>([]);
  const [topVolumeCoins, setTopVolumeCoins] = useState<any[]>([]);
  const [recentCoins, setRecentCoins] = useState<any[]>([]);

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
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
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
          setChartData({ 
            prices: [], 
            priceData: [], 
            error: data.error || 'Veri bulunamadı' 
          });
        }
      } catch (err) {
        console.error('Grafik verisi hatası:', err);
        setChartData({ 
          prices: [], 
          priceData: [], 
          error: err instanceof Error ? err.message : 'Grafik verisi yüklenemedi' 
        });
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

  // Markets (tickers) verisini çek
  useEffect(() => {
    if (!coinId || typeof coinId !== 'string') return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    const controller = new AbortController();
    
    const fetchMarkets = async () => {
      setMarketsLoading(true);
      timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/tickers?include_exchange_logo=true&page=1&order=volume_desc`,
          {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }

        if (!response.ok) {
          console.error('Markets API response not OK:', response.status, response.statusText);
          if (isMounted) {
            setMarkets([]);
            setMarketsLoading(false);
          }
          return;
        }

        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Error parsing Markets API JSON:', jsonError);
          if (isMounted) {
            setMarkets([]);
            setMarketsLoading(false);
          }
          return;
        }

        if (!isMounted) {
          setMarketsLoading(false);
          return;
        }

        if (!data || typeof data !== 'object') {
          console.error('Markets API returned invalid data:', data);
          if (isMounted) {
            setMarkets([]);
            setMarketsLoading(false);
          }
          return;
        }

        if (data.tickers && Array.isArray(data.tickers) && data.tickers.length > 0) {
          try {
            const processedMarkets = (data.tickers as TickerData[])
              .filter((ticker) => {
                if (!ticker || typeof ticker !== 'object') return false;
                // Filter by market type
                if (marketFilter === 'ALL') return true;
                if (marketFilter === 'CEX') return ticker.market?.identifier === 'cex';
                if (marketFilter === 'DEX') return ticker.market?.identifier === 'dex';
                if (marketFilter === 'Spot') {
                  return ticker.market?.has_trading_incentive === false && !ticker.is_anomaly;
                }
                if (marketFilter === 'Perpetual') {
                  const target = ticker.target || '';
                  return target.includes('PERP') || target.includes('PERPETUAL');
                }
                if (marketFilter === 'Futures') {
                  const target = ticker.target || '';
                  return target.includes('FUTURES') || target.includes('FUTURE');
                }
                return true;
              })
              .map((ticker) => {
                const base = ticker.base || '';
                const target = ticker.target || '';
                const marketName = ticker.market?.name || 'Bilinmiyor';
                const lastPrice = typeof ticker.last === 'number' ? ticker.last : 0;
                const volume = typeof ticker.volume === 'number' ? ticker.volume : 0;
                const trustScore = ticker.trust_score || 'red';
                const marketIdentifier = ticker.market?.identifier || '';

                return {
                  exchange: marketName,
                  pair: `${base}/${target}`,
                  price: lastPrice,
                  volume24h: volume,
                  volumePercent: 0, // Will calculate after
                  bidAskSpread: ticker.bid_ask_spread_percentage && typeof ticker.bid === 'number' && typeof ticker.ask === 'number' ? {
                    bid: ticker.bid,
                    ask: ticker.ask,
                  } : undefined,
                  liquidity: trustScore === 'green' ? 100 : trustScore === 'yellow' ? 50 : 10,
                  logo: ticker.market?.logo || (marketIdentifier ? `https://assets.coingecko.com/markets/images/${marketIdentifier}/small.png` : ''),
                  trustScore: trustScore,
                  marketType: marketIdentifier,
                };
              })
              .filter((m) => m.volume24h > 0) // Only include markets with volume
              .sort((a, b) => b.volume24h - a.volume24h);

            // Calculate volume percentages
            const totalVolume = processedMarkets.reduce((sum, m) => sum + m.volume24h, 0);
            const marketsWithPercent = processedMarkets.map((m) => ({
              ...m,
              volumePercent: totalVolume > 0 ? (m.volume24h / totalVolume) * 100 : 0,
            }));

            if (isMounted) {
              setMarkets(marketsWithPercent);
            }
          } catch (processError) {
            console.error('Error processing markets data:', processError);
            if (isMounted) {
              setMarkets([]);
              setMarketsLoading(false);
            }
          }
        } else {
          // No tickers data or empty array
          if (isMounted) {
            setMarkets([]);
            setMarketsLoading(false);
          }
        }
      } catch (error: unknown) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn('Markets fetch timeout');
          } else {
            console.error('Error fetching markets:', error.message, error);
          }
        } else {
          console.error('Unknown error fetching markets:', error);
        }
        if (isMounted) {
          setMarkets([]);
          setMarketsLoading(false);
        }
      }
    };

    fetchMarkets();

    return () => {
      isMounted = false;
      controller.abort();
      // Cleanup timeout if component unmounts
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [coinId, marketFilter]);

  // Community posts'ları çek
  useEffect(() => {
    const fetchCommunityPosts = async () => {
      setPostsLoading(true);
      try {
        const response = await fetch('/api/community/posts');
        if (response.ok) {
          const data = await response.json();
          if (data.posts && Array.isArray(data.posts)) {
            let filteredPosts = data.posts;
            
            // Eğer coin bilgisi varsa, o coin ile ilgili post'ları filtrele
            if (coin && coin.symbol && coin.name) {
              const coinSymbol = coin.symbol.toUpperCase();
              const coinName = coin.name.toUpperCase();
              const coinIdUpper = coin.id?.toUpperCase() || '';
              
              filteredPosts = data.posts.filter((post: { content_text?: string }) => {
                const content = post.content_text?.toUpperCase() || '';
                return content.includes(coinSymbol) || 
                       content.includes(coinName) ||
                       content.includes(coinIdUpper) ||
                       content.includes(coin.symbol || '') ||
                       content.includes(coin.name || '');
              });
            }
            
            // Eğer filtrelenmiş post yoksa, tüm post'ları göster (en azından bir şey gösterelim)
            if (filteredPosts.length === 0 && data.posts.length > 0) {
              filteredPosts = data.posts.slice(0, 10); // En son 10 post'u göster
            }
            
            // Sort by feed tab
            const sortedPosts = postFeedTab === 'Top' 
              ? [...filteredPosts].sort((a: { like_count?: number; comment_count?: number }, b: { like_count?: number; comment_count?: number }) => 
                  (b.like_count || 0) + (b.comment_count || 0) - (a.like_count || 0) - (a.comment_count || 0)
                )
              : [...filteredPosts].sort((a: { created_at: string }, b: { created_at: string }) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            
            setCommunityPosts(sortedPosts.slice(0, 10));
            
            // Sentiment değerlerini hesapla (filtrelenmiş post'lardan)
            const totalBullish = filteredPosts.reduce((sum: number, post: { bullish_count?: number }) => sum + (post.bullish_count || 0), 0);
            const totalBearish = filteredPosts.reduce((sum: number, post: { bearish_count?: number }) => sum + (post.bearish_count || 0), 0);
            const totalVotes = totalBullish + totalBearish;
            
            if (totalVotes > 0) {
              const bullishPercent = Math.round((totalBullish / totalVotes) * 100);
              const bearishPercent = Math.round((totalBearish / totalVotes) * 100);
              setSentimentBullish(bullishPercent);
              setSentimentBearish(bearishPercent);
              setSentimentVotes(totalVotes);
            } else {
              // Eğer hiç oy yoksa varsayılan değerler
              setSentimentBullish(50);
              setSentimentBearish(50);
              setSentimentVotes(0);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching community posts:', error);
        setCommunityPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    // Coin yüklenmesini beklemeden post'ları çek
    fetchCommunityPosts();
  }, [coin, postFeedTab]);

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

  // Today's gainers and losers çek
  useEffect(() => {
    const fetchGainersLosers = async () => {
      try {
        const response = await fetch('/api/gainers-losers?timeframe=24h&limit=10');
        if (response.ok) {
          const data = await response.json();
          setTodayGainers(data.gainers || []);
          setTodayLosers(data.losers || []);
        }
      } catch (error) {
        console.error('Error fetching gainers/losers:', error);
      }
    };
    fetchGainersLosers();
  }, []);

  // Top market cap coins çek
  useEffect(() => {
    const fetchTopCoins = async () => {
      try {
        const response = await fetch('/api/coins');
        if (response.ok) {
          const data = await response.json();
          setTopMarketCapCoins(data.slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching top coins:', error);
      }
    };
    fetchTopCoins();
  }, []);

  // Trending coins çek
  useEffect(() => {
    let isMounted = true;
    const fetchTrending = async () => {
      try {
        const response = await fetch('/api/trending');
        if (!isMounted) return;
        if (response.ok) {
          const data = await response.json();
          if (data.coins && data.coins.length > 0) {
            setTrendingCoins(data.coins.slice(0, 10));
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching trending:', error);
      }
    };
    fetchTrending();
    const interval = setInterval(fetchTrending, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fallback: trending coins yoksa gainers'ı kullan (sadece bir kez)
  useEffect(() => {
    if (trendingCoins.length === 0 && todayGainers.length > 0) {
      const timeoutId = setTimeout(() => {
        setTrendingCoins(prev => {
          if (prev.length === 0) {
            return todayGainers.slice(0, 10);
          }
          return prev;
        });
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [todayGainers.length]);

  // Fetch top volume coins
  useEffect(() => {
    const fetchTopVolume = async () => {
      try {
        const response = await fetch('/api/coins');
        if (response.ok) {
          const data = await response.json();
          const sortedByVolume = [...data].sort((a: any, b: any) => (b.total_volume || 0) - (a.total_volume || 0));
          setTopVolumeCoins(sortedByVolume.slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching top volume coins:', error);
      }
    };
    fetchTopVolume();
    const interval = setInterval(fetchTopVolume, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent coins
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await fetch('/api/coins');
        if (response.ok) {
          const data = await response.json();
          const sortedByRank = [...data].sort((a: any, b: any) => (a.market_cap_rank || 999) - (b.market_cap_rank || 999));
          setRecentCoins(sortedByRank.slice(0, 10));
        }
      } catch (error) {
        console.error('Error fetching recent coins:', error);
      }
    };
    fetchRecent();
    const interval = setInterval(fetchRecent, 60000);
    return () => clearInterval(interval);
  }, []);

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
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const handlePostSubmit = async () => {
    if (!newPostText.trim() || posting) return;

    try {
      const storedUser = localStorage.getItem('currentUser');
      if (!storedUser) {
        setToast({ message: 'Lütfen önce giriş yapın', visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 3000);
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = user.id || user.user_id;

      if (!userId) {
        setToast({ message: 'Kullanıcı bilgisi bulunamadı', visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 3000);
        return;
      }

      setPosting(true);

      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          content_text: newPostText.trim(),
          post_type: 'text',
        }),
      });

      if (response.ok) {
        setNewPostText('');
        setToast({ message: 'Post başarıyla paylaşıldı!', visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 3000);
        
        // Refresh posts
        const postsResponse = await fetch('/api/community/posts');
        if (postsResponse.ok) {
          const data = await postsResponse.json();
          if (data.posts && Array.isArray(data.posts)) {
            const coinSymbol = coin?.symbol.toUpperCase() || '';
            const filteredPosts = data.posts.filter((post: { content_text?: string }) => 
              post.content_text?.toUpperCase().includes(coinSymbol) || 
              post.content_text?.toUpperCase().includes(coin?.name.toUpperCase() || '')
            );
            const sortedPosts = postFeedTab === 'Top' 
              ? [...filteredPosts].sort((a: { like_count?: number; comment_count?: number }, b: { like_count?: number; comment_count?: number }) => 
                  (b.like_count || 0) + (b.comment_count || 0) - (a.like_count || 0) - (a.comment_count || 0)
                )
              : [...filteredPosts].sort((a: { created_at: string }, b: { created_at: string }) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
            setCommunityPosts(sortedPosts.slice(0, 10));
          }
        }
      } else {
        const errorData = await response.json();
        setToast({ message: errorData.error || 'Post paylaşılırken hata oluştu', visible: true });
        setTimeout(() => setToast({ message: '', visible: false }), 3000);
      }
    } catch (error) {
      console.error('Error posting:', error);
      setToast({ message: 'Post paylaşılırken hata oluştu', visible: true });
      setTimeout(() => setToast({ message: '', visible: false }), 3000);
    } finally {
      setPosting(false);
    }
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

  // Helper functions for chart data - useCallback to prevent infinite loops
  const generateBarChartData = useCallback((coins: any[], valueKey: string = 'current_price') => {
    if (!coins || coins.length === 0) return [];
    return coins.slice(0, 5).map((coin: any, index: number) => {
      let value = coin[valueKey] || 0;
      // price_change_24h için mutlak değer al
      if (valueKey === 'price_change_24h') {
        value = Math.abs(coin.price_change_24h || coin.price_change_percentage_24h || 0);
      }
      return {
        name: (coin.symbol || coin.name || `Coin ${index + 1}`).substring(0, 4).toUpperCase(),
        value: value,
        fill: `hsl(217, 91%, ${Math.max(25, 65 - index * 8)}%)`,
      };
    });
  }, []);

  const generatePieChartData = useCallback((coins: any[], valueKey: string = 'current_price') => {
    if (!coins || coins.length === 0) return [];
    const values = coins.slice(0, 5).map((c: any) => {
      let val = c[valueKey] || 0;
      if (valueKey === 'price_change_24h') {
        val = Math.abs(c.price_change_24h || c.price_change_percentage_24h || 0);
      }
      return val;
    });
    const maxValue = Math.max(...values, 1);
    return coins.slice(0, 5).map((coin: any, index: number) => {
      let val = coin[valueKey] || 0;
      if (valueKey === 'price_change_24h') {
        val = Math.abs(coin.price_change_24h || coin.price_change_percentage_24h || 0);
      }
      return {
        browser: (coin.symbol || coin.name || `Coin ${index + 1}`).substring(0, 4).toUpperCase(),
        visitors: (val / maxValue) * 100,
        fill: `hsl(217, 91%, ${Math.max(25, 65 - index * 8)}%)`,
      };
    });
  }, []);

  const generateRadarChartData = useCallback((coins: any[], valueKey: string = 'current_price') => {
    if (!coins || coins.length === 0) return [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return coins.slice(0, 6).map((coin: any, index: number) => ({
      month: months[index] || `M${index + 1}`,
      desktop: (coin[valueKey] || 0) / 1000,
    }));
  }, []);

  const generateRadialChartData = useCallback((coins: any[], valueKey: string = 'current_price') => {
    if (!coins || coins.length === 0) return [];
    const maxValue = Math.max(...coins.slice(0, 5).map((c: any) => c[valueKey] || 0), 1);
    return coins.slice(0, 5).map((coin: any, index: number) => ({
      browser: (coin.symbol || coin.name || `Coin ${index + 1}`).substring(0, 4).toUpperCase(),
      visitors: ((coin[valueKey] || 0) / maxValue) * 100,
      fill: `hsl(217, 91%, ${Math.max(25, 65 - index * 8)}%)`,
    }));
  }, []);

  const generateStackedBarData = useCallback((coins: any[]) => {
    if (!coins || coins.length === 0) return [];
    const dates = ['2024-07-15', '2024-07-16', '2024-07-17', '2024-07-18', '2024-07-19', '2024-07-20'];
    return coins.slice(0, 6).map((coin: any, index: number) => ({
      date: dates[index] || `2024-07-${15 + index}`,
      running: (coin.current_price || 0) / 10,
      swimming: (coin.total_volume || 0) / 1e9,
    }));
  }, []);

  const generateNegativeBarData = useCallback((coins: any[]) => {
    if (!coins || coins.length === 0) return [];
    const months = ['January', 'February', 'March', 'April', 'May', 'June'];
    return coins.slice(0, 6).map((coin: any, index: number) => ({
      month: months[index] || `Month ${index + 1}`,
      visitors: (coin.price_change_percentage_24h || 0) * 10,
    }));
  }, []);

  // Chart configs - useMemo to prevent recreation
  const barChartConfig = useMemo(() => ({
    value: { label: "Değer" },
  } satisfies ChartConfig), []);

  const pieChartConfig = useMemo(() => ({
    visitors: { label: "Visitors" },
  } satisfies ChartConfig), []);

  const radarChartConfig = useMemo(() => ({
    desktop: { label: "Desktop", color: "var(--chart-1)" },
  } satisfies ChartConfig), []);

  const stackedBarConfig = useMemo(() => ({
    running: { label: "Running", color: "var(--chart-1)", icon: Footprints },
    swimming: { label: "Swimming", color: "var(--chart-2)", icon: Waves },
  } satisfies ChartConfig), []);

  const negativeBarConfig = useMemo(() => ({
    visitors: { label: "Visitors" },
  } satisfies ChartConfig), []);

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
    <div className={`min-h-screen bg-white pb-14 pt-16 transition-all duration-300 ${navbarExpanded ? 'pr-64' : 'pr-16'}`}>
      <Head>
        <title>{coin.name} ({coin.symbol.toUpperCase()}) - Dijital Marketim</title>
        <meta name="description" content={`${coin.name} fiyat, grafik ve analiz bilgileri`} />
      </Head>

      {/* Navbar */}
      <Navbar 
        marketStats={marketStats} 
        onNavbarToggle={setNavbarExpanded}
      />

      {/* Coin Detay İçeriği - 3 Blok Layout */}
      <div className="w-full px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            Ana Sayfa
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{coin.name}</span>
        </nav>

        {/* 3 Column Layout - x-3x-x (1-3-1) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-200px)]">
          {/* Sol Blok - Coin Info */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Coin Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {coin.image && (
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="w-12 h-12 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-4xl font-bold text-gray-900">{coin.name}</h1>
                      <span className="text-gray-600 text-lg">{coin.symbol.toUpperCase()}</span>
                      {coinDetails?.marketData.marketCapRank && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-semibold">
                          #{coinDetails.marketData.marketCapRank}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price and Change */}
              <div>
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(coin.current_price)}
                </div>
                <div className={`text-lg font-semibold ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}% (24s)
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-gray-600">Vol/Mkt Cap (24h)</span>
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {coinDetails ? ((coinDetails.marketData.volume24h.usd / coinDetails.marketData.marketCap.usd) * 100).toFixed(3) : '0.876'}%
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-gray-600">Toplam arz</span>
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {coinDetails ? formatTrillion(coinDetails.supply.total) : '19.96M'} {coin.symbol.toUpperCase()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-gray-600">Max. supply</span>
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {coinDetails && coinDetails.supply.max ? formatTrillion(coinDetails.supply.max) : '21M'} {coin.symbol.toUpperCase()}
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-gray-600">Dolaşımdaki arz</span>
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-gray-900">
                      {coinDetails ? formatTrillion(coinDetails.supply.circulating) : '19.96M'} {coin.symbol.toUpperCase()}
                    </div>
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Profile Score */}
              <div>
                <div className="flex items-center gap-1 mb-2">
                  <span className="text-sm text-gray-600">Profile score</span>
                  <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <div className="text-sm font-semibold text-gray-900 mb-3">100%</div>
              </div>

              {/* External Links */}
              <div className="space-y-4">
                {/* Website */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Website</span>
                  <div className="flex items-center gap-2">
                    {coinDetails?.links.homepage && (
                      <a
                        href={coinDetails.links.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        Web Sitesi
                      </a>
                    )}
                    {coinDetails?.links.whitepaper && (
                      <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Whitepaper
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Socials */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sosyal medya</span>
                  <div className="flex items-center gap-2">
                    {coinDetails?.links.subreddit && (
                      <a
                        href={`https://reddit.com${coinDetails.links.subreddit}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                        </svg>
                      </a>
                    )}
                    {coinDetails?.links.github && (
                      <a
                        href={coinDetails.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Değerlendirme</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">4.7</span>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <svg key={i} className={`w-4 h-4 ${i <= 4 ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Explorers */}
                {coinDetails && coinDetails.links.blockchainExplorers && coinDetails.links.blockchainExplorers.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Keşifçiler</span>
                    <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors">
                      {coinDetails.links.blockchainExplorers[0]?.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0].substring(0, 15) || 'Keşifçi'}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                )}

              </div>

              {/* Converter */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">{coin.symbol.toUpperCase()} to USD converter</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">{coin.symbol.toUpperCase()}</label>
                    <input
                      type="number"
                      value={converterAmount}
                      onChange={(e) => setConverterAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">USD</label>
                    <input
                      type="text"
                      value={coinDetails ? formatCurrency(parseFloat(converterAmount || '0') * coinDetails.prices.usd) : '0.00'}
                      readOnly
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Price Performance */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Fiyat performansı</h3>
                  <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors">
                    24h
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                {coinDetails && (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Düşük</div>
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(coinDetails.priceRange24h.low.usd)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600 mb-1">Yüksek</div>
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(coinDetails.priceRange24h.high.usd)}</div>
                      </div>
                    </div>
                    <div className="relative w-full h-2 bg-gray-200 rounded-full mb-4">
                      <div className="absolute left-0 top-0 h-2 bg-blue-500 rounded-full" style={{ width: '50%' }}></div>
                      <div className="absolute left-1/2 top-0 w-1 h-2 bg-gray-900 rounded-full transform -translate-x-1/2"></div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Tüm zamanların en yükseği</span>
                          <span className="text-xs text-gray-600">{coinDetails.ath.date ? formatDate(coinDetails.ath.date) : 'Bilinmiyor'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(coinDetails.ath.price.usd)}</span>
                          <span className="text-xs text-red-600">
                            {coinDetails.ath.price.usd > 0 ? (((coin.current_price - coinDetails.ath.price.usd) / coinDetails.ath.price.usd) * 100).toFixed(2) : '0.00'}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600">Tüm zamanların en düşüğü</span>
                          <span className="text-xs text-gray-600">{coinDetails.atl.date ? formatDate(coinDetails.atl.date) : 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-900">{formatCurrency(coinDetails.atl.price.usd)}</span>
                          <span className="text-xs text-green-600">
                            {coinDetails.atl.price.usd > 0 ? (((coin.current_price - coinDetails.atl.price.usd) / coinDetails.atl.price.usd) * 100).toFixed(2) : '0.00'}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <a href="#" className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block">Geçmiş verileri gör</a>
                  </>
                )}
              </div>

              {/* Tags */}
              {coinDetails && coinDetails.categories.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {coinDetails.categories.slice(0, 6).map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Orta Blok - Chart, CMC AI, Markets */}
          <div className="lg:col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Chart Section */}
              <div className="space-y-4">
                {/* Chart Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setChartTab('Price')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        chartTab === 'Price'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Fiyat
                    </button>
                    <button
                      onClick={() => setChartTab('Mkt Cap')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        chartTab === 'Mkt Cap'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Mkt Cap
                    </button>
                    <button
                      onClick={() => {
                        const tradingViewUrl = `https://www.tradingview.com/chart/?symbol=BINANCE:${coin.symbol.toUpperCase()}USDT`;
                        window.open(tradingViewUrl, '_blank');
                      }}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                        chartTab === 'TradingView'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      TradingView
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        // Karşılaştırma sayfasına yönlendir veya modal aç
                        router.push(`/compare?coin1=${coin.id}`);
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      Karşılaştır
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Time Range Selectors */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    {(['24h', '1W', '1M', '1Y', 'All'] as const).map((range) => {
                      const rangeMap: Record<string, TimeRange> = {
                        '24h': '24h',
                        '1W': '7d',
                        '1M': '30d',
                        '1Y': '1y',
                        'All': '5y',
                      };
                      const isActive = timeRange === rangeMap[range];
                      return (
                        <button
                          key={range}
                          onClick={() => setTimeRange(rangeMap[range])}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {range}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsLogScale(!isLogScale)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        isLogScale
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Log
                    </button>
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Fullscreen"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Chart */}
                {chartLoading ? (
                  <div className="flex items-center justify-center h-96 text-gray-500 bg-gray-50 rounded-lg">
                    Grafik verisi yükleniyor...
                  </div>
                ) : chartData.priceData && chartData.priceData.length > 0 ? (
                  <div className="relative">
                    {isFullscreen && (
                      <div className="fixed inset-0 bg-white z-50 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-xl font-bold text-gray-900">{coin?.name} Fiyat Grafiği</h2>
                          <button
                            onClick={() => setIsFullscreen(false)}
                            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <PriceChart
                          data={chartData.priceData}
                          width={typeof window !== 'undefined' ? window.innerWidth - 48 : 1200}
                          height={typeof window !== 'undefined' ? window.innerHeight - 200 : 600}
                          timeRange={timeRange}
                        />
                      </div>
                    )}
                    <PriceChart
                      data={chartData.priceData}
                      width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 100, 1200) : 1200}
                      height={500}
                      timeRange={timeRange}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-500 bg-gray-50 rounded-lg">
                    {chartData.error ? (
                      <div className="text-center">
                        <p className="text-red-600 mb-2">{chartData.error}</p>
                        <p className="text-sm text-gray-500">Grafik verisi yüklenemedi</p>
                      </div>
                    ) : (
                      'Grafik verisi bulunamadı'
                    )}
                  </div>
                )}
              </div>

              {/* About Section */}
              {coinDetails && coinDetails.description && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">Hakkında {coin?.name}</h3>
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {coinDetails.description}
                    </p>
                </div>
                </div>
              )}

              {/* Markets Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{coin?.name} Piyasalar</h3>
                  <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filtreler
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-2 flex-wrap">
                  {(['ALL', 'CEX', 'DEX', 'Spot', 'Perpetual', 'Futures'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setMarketFilter(filter)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        marketFilter === filter
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>

                {/* Markets Table */}
                <div className="overflow-x-auto">
                  {marketsLoading ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      Markets yükleniyor...
                    </div>
                  ) : markets.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      Piyasa verisi bulunamadı
                    </div>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-2 text-gray-600 font-medium">#</th>
                          <th className="text-left py-3 px-2 text-gray-600 font-medium">Exchange</th>
                          <th className="text-left py-3 px-2 text-gray-600 font-medium">Pair</th>
                          <th className="text-right py-3 px-2 text-gray-600 font-medium">Price</th>
                          <th className="text-right py-3 px-2 text-gray-600 font-medium">+2%/-2% Depth</th>
                          <th className="text-right py-3 px-2 text-gray-600 font-medium">Volume (24h)</th>
                          <th className="text-right py-3 px-2 text-gray-600 font-medium">Volume %</th>
                          <th className="text-right py-3 px-2 text-gray-600 font-medium">Liquidity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {markets
                          .slice((marketPage - 1) * marketRowsPerPage, marketPage * marketRowsPerPage)
                          .map((market, index) => (
                            <tr key={`${market.exchange}-${market.pair}-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-2 text-gray-600">{(marketPage - 1) * marketRowsPerPage + index + 1}</td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  {market.logo ? (
                                    <img
                                      src={market.logo}
                                      alt={market.exchange}
                                      className="w-6 h-6 rounded-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                                  )}
                                  <span className="text-gray-900 font-medium">{market.exchange}</span>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-900">{market.pair}</span>
                                  <a
                                    href={`https://www.coingecko.com/en/exchanges/${market.exchange.toLowerCase().replace(/\s+/g, '-')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </a>
                                </div>
                              </td>
                              <td className="py-3 px-2 text-right text-gray-900 font-medium">
                                {formatCurrency(market.price)}
                              </td>
                              <td className="py-3 px-2 text-right text-gray-600">
                                {market.bidAskSpread ? (
                                  <>
                                    {formatCurrency(market.bidAskSpread.bid * 0.98)}/{formatCurrency(market.bidAskSpread.ask * 1.02)}
                                  </>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-right text-green-600 font-medium">
                                {formatCurrency(market.volume24h)}
                              </td>
                              <td className="py-3 px-2 text-right text-gray-600">
                                {market.volumePercent.toFixed(2)}%
                              </td>
                              <td className="py-3 px-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                                  </svg>
                                  <span className="text-gray-600">{market.liquidity?.toFixed(2) || 'Bilinmiyor'}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Coin History Paragraph */}
                {coinDetails && coinDetails.description && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{coin.name} Tarihçesi</h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {coinDetails.description.length > 800 
                        ? `${coinDetails.description.substring(0, 800)}...` 
                        : coinDetails.description}
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {!marketsLoading && markets.length > 0 && (
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="text-sm text-gray-600">
                      {((marketPage - 1) * marketRowsPerPage) + 1} - {Math.min(marketPage * marketRowsPerPage, markets.length)} / {markets.length} gösteriliyor
                    </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setMarketPage(Math.max(1, marketPage - 1))}
                      disabled={marketPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &lt;
                    </button>
                    {(() => {
                      const totalPages = Math.ceil(markets.length / marketRowsPerPage);
                      const maxVisiblePages = 5;
                      const pages: (number | string)[] = [];
                      
                      if (totalPages <= maxVisiblePages) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        if (marketPage <= 3) {
                          for (let i = 1; i <= 4; i++) {
                            pages.push(i);
                          }
                          pages.push('...');
                          pages.push(totalPages);
                        } else if (marketPage >= totalPages - 2) {
                          pages.push(1);
                          pages.push('...');
                          for (let i = totalPages - 3; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          pages.push(1);
                          pages.push('...');
                          for (let i = marketPage - 1; i <= marketPage + 1; i++) {
                            pages.push(i);
                          }
                          pages.push('...');
                          pages.push(totalPages);
                        }
                      }
                      
                      return pages.map((page, idx) => {
                        if (page === '...') {
                          return <span key={`ellipsis-${idx}`} className="px-2 text-gray-600">...</span>;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setMarketPage(page as number)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              marketPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                    <button
                      onClick={() => {
                        const totalPages = Math.ceil(markets.length / marketRowsPerPage);
                        setMarketPage(Math.min(totalPages, marketPage + 1));
                      }}
                      disabled={marketPage >= Math.ceil(markets.length / marketRowsPerPage)}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      &gt;
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Satır göster</span>
                    <select
                      value={marketRowsPerPage}
                      onChange={(e) => {
                        setMarketRowsPerPage(Number(e.target.value));
                        setMarketPage(1);
                      }}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                  </div>
                )}
                  </div>
                </div>

              </div>

          {/* Sağ Blok - Community Sentiment */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Community Sentiment Section */}
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Topluluk Hissiyatı</h3>
                    <p className="text-sm text-gray-600">{formatNumber(sentimentVotes)} votes</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSentimentPage(Math.max(1, sentimentPage - 1))}
                      disabled={sentimentPage === 1}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-gray-600">{sentimentPage}/{sentimentTotalPages}</span>
                    <button
                      onClick={() => setSentimentPage(Math.min(sentimentTotalPages, sentimentPage + 1))}
                      disabled={sentimentPage === sentimentTotalPages}
                      className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Sentiment Bar */}
                <div className="relative w-full h-8 bg-gray-200 rounded-lg overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-green-500 flex items-center justify-start pl-2" style={{ width: `${sentimentBullish}%` }}>
                    <span className="text-white text-sm font-semibold">{sentimentBullish}%</span>
                  </div>
                  <div className="absolute right-0 top-0 h-full bg-red-500 flex items-center justify-end pr-2" style={{ width: `${sentimentBearish}%` }}>
                    <span className="text-white text-sm font-semibold">{sentimentBearish}%</span>
                  </div>
                </div>

                {/* Sentiment Buttons */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        const storedUser = localStorage.getItem('currentUser');
                        if (!storedUser) {
                          setToast({ message: 'Lütfen önce giriş yapın', visible: true });
                          setTimeout(() => setToast({ message: '', visible: false }), 3000);
                          return;
                        }
                        
                        // Client-side olarak sentiment güncelle (gerçek uygulamada API'ye kaydedilebilir)
                        const currentBullishVotes = Math.round((sentimentBullish / 100) * sentimentVotes);
                        const newBullishVotes = currentBullishVotes + 1;
                        const newTotal = sentimentVotes + 1;
                        const newBullishPercent = Math.round((newBullishVotes / newTotal) * 100);
                        const newBearishPercent = 100 - newBullishPercent;
                        
                        setSentimentBullish(newBullishPercent);
                        setSentimentBearish(newBearishPercent);
                        setSentimentVotes(newTotal);
                        
                        setToast({ message: 'Yükseliş oyu eklendi!', visible: true });
                        setTimeout(() => setToast({ message: '', visible: false }), 3000);
                      } catch (error) {
                        console.error('Error voting bullish:', error);
                        setToast({ message: 'Oy verilirken hata oluştu', visible: true });
                        setTimeout(() => setToast({ message: '', visible: false }), 3000);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Yükseliş
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        const storedUser = localStorage.getItem('currentUser');
                        if (!storedUser) {
                          setToast({ message: 'Lütfen önce giriş yapın', visible: true });
                          setTimeout(() => setToast({ message: '', visible: false }), 3000);
                          return;
                        }
                        
                        // Client-side olarak sentiment güncelle (gerçek uygulamada API'ye kaydedilebilir)
                        const currentBearishVotes = Math.round((sentimentBearish / 100) * sentimentVotes);
                        const newBearishVotes = currentBearishVotes + 1;
                        const newTotal = sentimentVotes + 1;
                        const newBearishPercent = Math.round((newBearishVotes / newTotal) * 100);
                        const newBullishPercent = 100 - newBearishPercent;
                        
                        setSentimentBullish(newBullishPercent);
                        setSentimentBearish(newBearishPercent);
                        setSentimentVotes(newTotal);
                        
                        setToast({ message: 'Düşüş oyu eklendi!', visible: true });
                        setTimeout(() => setToast({ message: '', visible: false }), 3000);
                      } catch (error) {
                        console.error('Error voting bearish:', error);
                        setToast({ message: 'Oy verilirken hata oluştu', visible: true });
                        setTimeout(() => setToast({ message: '', visible: false }), 3000);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6 6" />
                    </svg>
                    Düşüş
                  </button>
                </div>
              </div>

              {/* Post Feed Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-200">
                <button
                  onClick={() => setPostFeedTab('Top')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    postFeedTab === 'Top'
                      ? 'text-gray-900 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  En İyi
                </button>
                <button
                  onClick={() => setPostFeedTab('Latest')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    postFeedTab === 'Latest'
                      ? 'text-gray-900 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  En Son
                </button>
              </div>

              {/* Post Feed */}
              <div className="space-y-4">
                {postsLoading ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    Yükleniyor...
                  </div>
                ) : communityPosts.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500">
                    Henüz post yok
                  </div>
                ) : (
                  communityPosts.map((post) => (
                    <div key={post.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                      {/* User Info */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {post.profile_picture_url ? (
                            <img
                              src={post.profile_picture_url}
                              alt={post.user_name}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-gray-500 text-xs">{post.user_name?.[0]?.toUpperCase() || 'U'}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-gray-900">{post.user_name}</span>
                            {post.is_verified && (
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.001 3.001 0 011.709-1.709L8 1.586a1 1 0 011.414 0l1.154.293a3 3 0 011.709 1.709L12.414 4a1 1 0 010 1.414l-.293 1.154a3 3 0 01-1.709 1.709L10.586 8a1 1 0 01-1.414 0l-1.154-.293a3 3 0 01-1.709-1.709L6 5.586a1 1 0 010-1.414l.293-1.154zM10 10a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                <path d="M2 10a8 8 0 018-8v8a8 8 0 11-16 0zm8-6a6 6 0 100 12A6 6 0 0010 4z" />
                              </svg>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{formatPostDate(post.created_at)}</span>
                        </div>
                        <button className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                          + Follow
                        </button>
                      </div>

                      {/* Post Content */}
                      <div className="mb-3">
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{post.content_text}</p>
                        {post.image_url && (
                          <div className="mt-2 w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={post.image_url}
                              alt="Post"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Reactions */}
                      <div className="flex items-center gap-4 flex-wrap mb-2">
                        <button className="flex items-center gap-1 text-green-600 hover:text-green-700 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-xs font-medium">{post.bullish_count || 0}</span>
                        </button>
                        <button className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-medium">{post.like_count || 0}</span>
                        </button>
                        <button className="flex items-center gap-1 text-orange-500 hover:text-orange-600 transition-colors">
                          <span className="text-xs">🔥</span>
                          <span className="text-xs font-medium">10</span>
                        </button>
                        <button className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors">
                          <span className="text-xs">🐋</span>
                          <span className="text-xs font-medium">2</span>
                        </button>
                        <button className="flex items-center gap-1 text-green-500 hover:text-green-600 transition-colors">
                          <span className="text-xs">🐢</span>
                          <span className="text-xs font-medium">2</span>
                        </button>
                        <button className="flex items-center gap-1 text-yellow-500 hover:text-yellow-600 transition-colors">
                          <span className="text-xs">👷</span>
                          <span className="text-xs font-medium">2</span>
                        </button>
                        <button className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                          </svg>
                          <span className="text-xs font-medium">{post.bearish_count || 0}</span>
                        </button>
                      </div>

                      {/* Engagement Metrics */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{formatNumber(post.view_count || 0)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <span>{post.comment_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>{post.share_count || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{post.like_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Post Input */}
              <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  {typeof window !== 'undefined' && localStorage.getItem('currentUser') ? (
                    (() => {
                      try {
                        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
                        return user.profile_picture_url ? (
                          <img
                            src={user.profile_picture_url}
                            alt={user.name || 'User'}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 text-xs">{(user.name || user.full_name || 'U')[0]?.toUpperCase()}</span>
                          </div>
                        );
                      } catch {
                        return (
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-500 text-xs">U</span>
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-xs">U</span>
                    </div>
                  )}
                  <input
                    type="text"
                    value={newPostText}
                    onChange={(e) => setNewPostText(e.target.value)}
                    placeholder={`${coin?.symbol.toUpperCase() || 'BTC'} How do you feel today?`}
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !posting && newPostText.trim()) {
                        handlePostSubmit();
                      }
                    }}
                  />
                  <button
                    onClick={handlePostSubmit}
                    disabled={posting || !newPostText.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {posting ? 'Paylaşılıyor...' : 'Paylaş'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed bottom-12 right-4 z-50 animate-slide-in-right">
          <div className="bg-[#2563EB] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]">
            <div className="shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{toast.message}</p>
            </div>
            <button
              onClick={() => setToast({ message: '', visible: false })}
              className="shrink-0 text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Additional Stats Section - Scroll edildiğinde görünür */}
        <div className="w-full px-4 py-8 bg-white">
          <div className="max-w-7xl mx-auto">
          <div className="space-y-8">
              {/* Today's Gainers & Losers */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Bugün Artan ve Azalan Coinler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Gainers */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-green-600 mb-4">En Çok Artanlar (24s)</h4>
                    <div className="space-y-3">
                      {todayGainers.slice(0, 5).map((coin: any, index: number) => (
                        <div key={coin.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => router.push(`/currencies/${coin.id}`)}>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                            {coin.image && <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />}
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{coin.name}</div>
                              <div className="text-xs text-gray-500">{coin.symbol}</div>
              </div>
            </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">${coin.current_price?.toLocaleString() || '0'}</div>
                            <div className="text-xs text-green-600 font-medium">+{coin.price_change_24h?.toFixed(2) || '0'}%</div>
          </div>
        </div>
                      ))}
                    </div>
                  </div>
                  {/* Losers */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h4 className="text-lg font-semibold text-red-600 mb-4">En Çok Azalanlar (24s)</h4>
                    <div className="space-y-3">
                      {todayLosers.slice(0, 5).map((coin: any, index: number) => (
                        <div key={coin.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => router.push(`/currencies/${coin.id}`)}>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500 w-6">{index + 1}</span>
                            {coin.image && <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />}
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{coin.name}</div>
                              <div className="text-xs text-gray-500">{coin.symbol}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900">${coin.current_price?.toLocaleString() || '0'}</div>
                            <div className="text-xs text-red-600 font-medium">{coin.price_change_24h?.toFixed(2) || '0'}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Veri Tabloları */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Veri Tabloları</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Tablo 1: Gainers - Bar Chart Active */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600">En Çok Artanlar (24s)</CardTitle>
                      <CardDescription>Son 24 saatte en çok yükselen coinler</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={barChartConfig}>
                        <BarChart accessibilityLayer data={generateBarChartData(todayGainers, 'price_change_24h')}>
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Bar
                            dataKey="value"
                            strokeWidth={2}
                            radius={8}
                            activeIndex={2}
                            activeBar={({ ...props }) => (
                              <Rectangle
                                {...props}
                                fillOpacity={0.8}
                                stroke={props.payload.fill}
                                strokeDasharray={4}
                                strokeDashoffset={4}
                              />
                            )}
                          />
                        </BarChart>
                      </ChartContainer>
                      <div className="space-y-2 mt-4">
                        {todayGainers.length > 0 ? (
                          todayGainers.slice(0, 5).map((coin: any, index: number) => (
                            <div key={coin.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => router.push(`/currencies/${coin.id}`)}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                                {coin.image && <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />}
                                <div>
                                  <div className="text-xs font-semibold text-gray-900">{coin.name}</div>
                                  <div className="text-xs text-gray-500">{coin.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold text-gray-900">${coin.current_price?.toLocaleString() || '0'}</div>
                                <div className="text-xs text-green-600 font-medium">+{(coin.price_change_24h || coin.price_change_percentage_24h || 0).toFixed(2)}%</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 text-xs py-4">Yükleniyor...</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm">
                      <div className="flex gap-2 leading-none font-medium">
                        Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Tablo 2: Losers - Pie Chart Label List */}
                  <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                      <CardTitle className="text-red-600">En Çok Azalanlar (24s)</CardTitle>
                      <CardDescription>Son 24 saatte en çok düşen coinler</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                      <ChartContainer
                        config={pieChartConfig}
                        className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[200px] mb-4"
                      >
                        <PieChart>
                          <ChartTooltip
                            content={<ChartTooltipContent nameKey="visitors" hideLabel />}
                          />
                          <Pie data={generatePieChartData(todayLosers, 'price_change_24h')} dataKey="visitors">
                            <LabelList
                              dataKey="browser"
                              className="fill-background"
                              stroke="none"
                              fontSize={10}
                            />
                          </Pie>
                        </PieChart>
                      </ChartContainer>
                      <div className="space-y-2">
                        {todayLosers.length > 0 ? (
                          todayLosers.slice(0, 5).map((coin: any, index: number) => (
                            <div key={coin.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => router.push(`/currencies/${coin.id}`)}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                                {coin.image && <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />}
                                <div>
                                  <div className="text-xs font-semibold text-gray-900">{coin.name}</div>
                                  <div className="text-xs text-gray-500">{coin.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold text-gray-900">${coin.current_price?.toLocaleString() || '0'}</div>
                                <div className="text-xs text-red-600 font-medium">{(coin.price_change_24h || coin.price_change_percentage_24h || 0).toFixed(2)}%</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 text-xs py-4">Yükleniyor...</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 leading-none font-medium">
                        Trending down this month <TrendingUp className="h-4 w-4 rotate-180" />
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Tablo 3: Top Market Cap - Radar Chart Dots */}
                  <Card>
                    <CardHeader className="items-center">
                      <CardTitle>En Yüksek Piyasa Değeri</CardTitle>
                      <CardDescription>Piyasa değerine göre en büyük coinler</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-0">
                      <ChartContainer
                        config={radarChartConfig}
                        className="mx-auto aspect-square max-h-[200px] mb-4"
                      >
                        <RadarChart data={generateRadarChartData(topMarketCapCoins, 'market_cap')}>
                          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                          <PolarAngleAxis dataKey="month" />
                          <PolarGrid />
                          <Radar
                            dataKey="desktop"
                            fill="var(--color-desktop)"
                            fillOpacity={0.6}
                            dot={{
                              r: 4,
                              fillOpacity: 1,
                            }}
                          />
                        </RadarChart>
                      </ChartContainer>
                      <div className="space-y-2">
                        {topMarketCapCoins.length > 0 ? (
                          topMarketCapCoins.slice(0, 5).map((coin: any, index: number) => (
                            <div key={coin.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => router.push(`/currencies/${coin.id}`)}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                                {coin.image && <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />}
                                <div>
                                  <div className="text-xs font-semibold text-gray-900">{coin.name}</div>
                                  <div className="text-xs text-gray-500">{coin.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold text-gray-900">{formatCurrency(coin.market_cap || 0)}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 text-xs py-4">Yükleniyor...</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 leading-none font-medium">
                        Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Tablo 4: Trending - Radial Chart Label */}
                  <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                      <CardTitle>En Trend Coinler</CardTitle>
                      <CardDescription>En popüler ve trend olan coinler</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                      <ChartContainer
                        config={pieChartConfig}
                        className="mx-auto aspect-square max-h-[200px] mb-4"
                      >
                        <RadialBarChart
                          data={generateRadialChartData(trendingCoins, 'current_price')}
                          startAngle={-90}
                          endAngle={380}
                          innerRadius={30}
                          outerRadius={90}
                        >
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel nameKey="browser" />}
                          />
                          <RadialBar dataKey="visitors" background>
                            <LabelList
                              position="insideStart"
                              dataKey="browser"
                              className="fill-white capitalize mix-blend-luminosity"
                              fontSize={10}
                            />
                          </RadialBar>
                        </RadialBarChart>
                      </ChartContainer>
                      <div className="space-y-2">
                        {trendingCoins.length > 0 ? (
                          trendingCoins.slice(0, 5).map((coin: any, index: number) => (
                            <div key={coin.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => router.push(`/currencies/${coin.id}`)}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                                {coin.image && <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />}
                                <div>
                                  <div className="text-xs font-semibold text-gray-900">{coin.name}</div>
                                  <div className="text-xs text-gray-500">{coin.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold text-gray-900">${coin.current_price?.toLocaleString() || '0'}</div>
                                <div className={`text-xs font-medium ${(coin.price_change_24h || coin.price_change_percentage_24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {((coin.price_change_24h || coin.price_change_percentage_24h || 0) >= 0 ? '+' : '')}{(coin.price_change_24h || coin.price_change_percentage_24h || 0).toFixed(2)}%
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 text-xs py-4">Yükleniyor...</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-2 text-sm">
                      <div className="flex items-center gap-2 leading-none font-medium">
                        Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                      </div>
                    </CardFooter>
                  </Card>

                  {/* Tablo 5: Top Volume - Stacked Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>En Yüksek Hacim</CardTitle>
                      <CardDescription>24 saatlik işlem hacmine göre</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={stackedBarConfig}>
                        <BarChart accessibilityLayer data={generateStackedBarData(topVolumeCoins)}>
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => {
                              return new Date(value).toLocaleDateString("en-US", {
                                weekday: "short",
                              })
                            }}
                          />
                          <Bar
                            dataKey="running"
                            stackId="a"
                            fill="var(--color-running)"
                            radius={[0, 0, 4, 4]}
                          />
                          <Bar
                            dataKey="swimming"
                            stackId="a"
                            fill="var(--color-swimming)"
                            radius={[4, 4, 0, 0]}
                          />
                          <ChartTooltip
                            content={<ChartTooltipContent hideLabel />}
                            cursor={false}
                            defaultIndex={1}
                          />
                        </BarChart>
                      </ChartContainer>
                      <div className="space-y-2 mt-4">
                        {topVolumeCoins.length > 0 ? (
                          topVolumeCoins.slice(0, 5).map((coin: any, index: number) => (
                            <div key={coin.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => router.push(`/currencies/${coin.id}`)}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                                {coin.image && <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />}
                                <div>
                                  <div className="text-xs font-semibold text-gray-900">{coin.name}</div>
                                  <div className="text-xs text-gray-500">{coin.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold text-gray-900">${coin.current_price?.toLocaleString() || '0'}</div>
                                <div className="text-xs text-gray-600 font-medium">
                                  {coin.total_volume ? `$${(coin.total_volume / 1e9).toFixed(2)}B` : '-'}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 text-xs py-4">Yükleniyor...</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tablo 6: Recent - Bar Chart Negative */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Yeni Eklenenler</CardTitle>
                      <CardDescription>Yeni listelenen coinler</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={negativeBarConfig}>
                        <BarChart accessibilityLayer data={generateNegativeBarData(recentCoins)}>
                          <CartesianGrid vertical={false} />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel hideIndicator />}
                          />
                          <Bar dataKey="visitors">
                            <LabelList position="top" dataKey="month" fillOpacity={1} />
                            {generateNegativeBarData(recentCoins).map((item, index) => (
                              <Cell
                                key={item.month}
                                fill={item.visitors > 0 ? "var(--chart-1)" : "var(--chart-2)"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                      <div className="space-y-2 mt-4">
                        {recentCoins.length > 0 ? (
                          recentCoins.slice(0, 5).map((coin: any, index: number) => (
                            <div key={coin.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer" onClick={() => router.push(`/currencies/${coin.id}`)}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 w-4">{index + 1}</span>
                                {coin.image && <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />}
                                <div>
                                  <div className="text-xs font-semibold text-gray-900">{coin.name}</div>
                                  <div className="text-xs text-gray-500">{coin.symbol}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold text-gray-900">${coin.current_price?.toLocaleString() || '0'}</div>
                                <div className="text-xs text-gray-600 font-medium">
                                  Rank: {coin.market_cap_rank || '-'}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 text-xs py-4">Yükleniyor...</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex-col items-start gap-2 text-sm">
                      <div className="flex gap-2 leading-none font-medium">
                        Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-12 mt-12">
        <div className="w-full">
          {/* Üst Kısım - Logo ve Açıklama */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
            {/* Sol Taraf - Logo ve Açıklama */}
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
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Şeker Ödülleri Listelemesi</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Yardım Merkezi</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Hata Ödülü</a>
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
                    <a href="#" className="text-sm text-green-600 hover:text-green-700 transition-colors font-semibold">Kariyer <span className="text-xs">(Bize Katılın)</span></a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Markalama Rehberi</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Metodoloji</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Feragatname</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Hizmet Koşulları</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Gizlilik Politikası</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Reklam Politikası</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Çerez Tercihleri</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Güven Merkezi</a>
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
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Telegram Sohbeti</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Telegram Haberleri</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Instagram</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Reddit</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Discord</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Facebook</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">YouTube</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">TikTok</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bülten Aboneliği */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Kripto paralar hakkında devamlı güncel bilgiye sahip olmak ister misiniz?
                </h3>
                <p className="text-sm text-gray-600">
                  Ücretsiz bültenimize abone olarak en son kripto para haberlerini, güncellemeleri ve raporları alın.
                </p>
              </div>
              <button className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium px-6 py-3 rounded-lg transition-colors whitespace-nowrap">
                Abone Ol
              </button>
            </div>
          </div>

          {/* Alt Kısım - Copyright ve App Store */}
          <div className="border-t border-gray-200 pt-8">
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

      {/* Market Stats Bar - Fixed at Bottom */}
      <MarketStatsBar marketStats={marketStats} />
    </div>
  );
};

export default CoinDetailPage;

