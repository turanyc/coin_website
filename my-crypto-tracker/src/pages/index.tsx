import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import CoinFilterBar, { NetworkFilter, SortFilter } from '../components/CoinFilterBar';
import Navbar from '../components/Navbar';
import MarketStatsBar from '../components/MarketStatsBar';
import SignupAlert from '../components/SignupAlert';

// Bu bir placeholder/taslak tablodur. 
// components/CryptoTable.tsx dosyasını oluşturarak bu içeriği oraya taşıyabilirsiniz.

interface Coin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string | null;
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

const HomePage: React.FC = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightsEnabled, setHighlightsEnabled] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<NetworkFilter>('all');
  const [sortBy, setSortBy] = useState<SortFilter>(null);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [displayedCoins, setDisplayedCoins] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);
  const tableRef = React.useRef<HTMLDivElement>(null);
  const [fearGreedIndex, setFearGreedIndex] = useState(50);
  const [averageRSI, setAverageRSI] = useState(47.48);
  const [fearGreedClassification, setFearGreedClassification] = useState('Neutral');
  const [portfolio, setPortfolio] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('portfolio');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  // localStorage'dan "bir daha gösterme" tercihini kontrol et
  const [showSignupAlert, setShowSignupAlert] = useState(() => {
    if (typeof window !== 'undefined') {
      const dontShowAgain = localStorage.getItem('dontShowSignupAlert');
      return dontShowAgain !== 'true';
    }
    return true;
  });

  const handleDontShowAgain = () => {
    localStorage.setItem('dontShowSignupAlert', 'true');
    setShowSignupAlert(false);
  };
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

  // CoinGecko Global API'den veri çekme fonksiyonu
  const fetchGlobalStats = async () => {
    try {
      // Timeout için AbortController kullan (browser uyumluluğu için)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch('/api/global', {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Global API yanıt hatası: ${response.status}`);
        // Hata durumunda mevcut verileri koru
        return;
      }

      const data = await response.json();

      if (data.error) {
        console.warn('Global API hatası:', data.error, data.details || '');
        // Hata durumunda mevcut verileri koru, sıfırlama
        return;
      }

      // Verileri güncelle
      setMarketStats({
        totalCoins: data.totalCoins || 0,
        totalExchanges: data.totalExchanges || 0,
        marketCap: data.marketCap || 0,
        marketCapChange24h: data.marketCapChange24h || 0,
        volume24h: data.volume24h || 0,
        btcDominance: data.btcDominance || 0,
        ethDominance: data.ethDominance || 0,
        gasPrice: 0.518, // Gas fiyatı için ayrı API gerekebilir
      });
    } catch (error) {
      // AbortError (timeout) veya network hatası
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Global API timeout - veri çekme çok uzun sürdü');
      } else {
        console.error('Global stats çekme hatası:', error);
      }
      // Hata durumunda mevcut verileri koru, sessizce devam et
    }
  };

  // Kendi API'mizden veri çekme fonksiyonu
  const fetchCoins = async () => {
    setLoading(true);
    setError(null);
    try {
      // Oluşturduğunuz /api/coins rotasını çağırıyoruz
      const response = await fetch('/api/coins');

      if (!response.ok) {
        throw new Error(`API hatası: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setCoins([]);
      } else {
        // Duplicate'leri filtrele - hem ID hem symbol bazlı kontrol
        // Önce ID bazlı unique yap, sonra symbol bazlı unique yap
        const coinMapById = new Map<string, Coin>();

        // İlk adım: ID bazlı duplicate'leri filtrele
        (data || []).forEach((coin: Coin) => {
          const normalizedId = coin.id.toLowerCase().trim();
          const existing = coinMapById.get(normalizedId);
          if (!existing || (coin.market_cap > existing.market_cap)) {
            coinMapById.set(normalizedId, coin);
          }
        });

        // İkinci adım: Symbol bazlı duplicate'leri filtrele (BTC, ETH gibi)
        const coinMapBySymbol = new Map<string, Coin>();
        Array.from(coinMapById.values()).forEach((coin) => {
          const normalizedSymbol = coin.symbol.toLowerCase().trim();
          const existing = coinMapBySymbol.get(normalizedSymbol);
          if (!existing || (coin.market_cap > existing.market_cap)) {
            coinMapBySymbol.set(normalizedSymbol, coin);
          }
        });

        // Map'ten array'e çevir ve market_cap'e göre sırala
        const uniqueCoins = Array.from(coinMapBySymbol.values()).sort((a, b) => b.market_cap - a.market_cap);
        setCoins(uniqueCoins);
      }
    } catch (error) {
      console.error("Frontend veri çekme hatası:", error);
      setError('Veri yüklenirken bir hata oluştu.');
      setCoins([]);
    } finally {
      setLoading(false);
    }
  };

  // Fear & Greed Index güncelleme - CNN/Alternative.me API'den
  useEffect(() => {
    const fetchFearGreed = async () => {
      try {
        const response = await fetch('/api/fear-greed');
        const data = await response.json();

        if (data.value !== undefined) {
          setFearGreedIndex(data.value);
          setFearGreedClassification(data.classification || 'Neutral');
        }
      } catch (error) {
        console.error('Fear & Greed veri çekme hatası:', error);
        // Hata durumunda varsayılan değer
        setFearGreedIndex(50);
        setFearGreedClassification('Neutral');
      }
    };

    fetchFearGreed();
    const interval = setInterval(fetchFearGreed, 5 * 60 * 1000); // Her 5 dakikada bir güncelle

    return () => clearInterval(interval);
  }, []);

  // Average RSI simülasyonu (gerçek uygulamada API'den gelecek)
  useEffect(() => {
    // RSI değerini 30-70 arasında simüle et
    const simulateRSI = () => {
      const baseRSI = 47.48;
      const variation = (Math.random() - 0.5) * 5; // -2.5 ile +2.5 arası varyasyon
      const newRSI = Math.max(30, Math.min(70, baseRSI + variation));
      setAverageRSI(newRSI);
    };

    simulateRSI();
    const interval = setInterval(simulateRSI, 60000); // Her 1 dakikada bir güncelle

    return () => clearInterval(interval);
  }, []);

  // Portfolio değiştiğinde localStorage'a kaydet
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('portfolio', JSON.stringify(portfolio));
    }
  }, [portfolio]);

  useEffect(() => {
    // İlk yüklemede hem coin'leri hem global stats'ı çek
    fetchGlobalStats();
    fetchCoins();

    // Global stats'ı her 60 saniyede bir güncelle
    const globalIntervalId = setInterval(fetchGlobalStats, 60000);

    // Tabloyu her 30 saniyede bir güncelleyelim (Kullanıcıya canlı hissi vermek için)
    const coinsIntervalId = setInterval(fetchCoins, 30000);

    // 5 saniye sonra signup alert'i göster (eğer kullanıcı "bir daha gösterme" demediyse)
    let signupTimer: NodeJS.Timeout | null = null;
    const dontShowAgain = localStorage.getItem('dontShowSignupAlert');
    if (dontShowAgain !== 'true') {
      signupTimer = setTimeout(() => {
        setShowSignupAlert(true);
      }, 5000);
    }

    return () => {
      clearInterval(globalIntervalId);
      clearInterval(coinsIntervalId);
      if (signupTimer) {
        clearTimeout(signupTimer);
      }
    };
  }, []);

  // Sayfa değiştiğinde scroll to top (sadece currentPage değiştiğinde, displayedCoins değiştiğinde değil)
  useEffect(() => {
    if (tableRef.current && displayedCoins > 30) {
      // Sadece sayfalama modunda ve sayfa değiştiğinde scroll yap
      tableRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]); // Sadece currentPage değiştiğinde tetikle (displayedCoins değiştiğinde scroll yapma)

  // --- Yardımcı Fonksiyonlar ---
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null || isNaN(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: amount < 1 ? 6 : 2,
    }).format(amount);
  };

  // Grafik verilerini oluştur - Daha detaylı ve gerçekçi grafikler
  const generateSparklineData = (coinId: string, currentPrice: number, change24h: number) => {
    const points = 168; // 7 gün x 24 saat = 168 nokta (daha detaylı grafik)
    const data: number[] = [];

    // Coin id'sine göre sabit seed (her coin için tutarlı veri)
    let seed = 0;
    for (let i = 0; i < coinId.length; i++) {
      seed += coinId.charCodeAt(i);
    }
    seed = Math.abs(seed);

    // 7 günlük değişime göre başlangıç fiyatını hesapla
    const sevenDayChangePercent = (change24h * 7) / 100;
    const startPrice = currentPrice / (1 + sevenDayChangePercent);

    // CoinGecko gibi çok minimal volatilite - sadece hafif varyasyon
    const maxVariation = currentPrice * 0.015; // %1.5 maksimum varyasyon

    // Basit deterministik varyasyon (her coin için farklı ama tutarlı)
    const getSmoothVariation = (index: number) => {
      // Çok yumuşak sinüs dalgası (CoinGecko benzeri pürüzsüz eğri)
      const wave = Math.sin((seed + index) * 0.8) * 0.5;
      return wave * maxVariation * 0.4; // Çok minimal varyasyon
    };

    // Her nokta için pürüzsüz ve detaylı eğri oluştur
    for (let i = 0; i < points; i++) {
      const t = i / (points - 1); // 0'dan 1'e progress

      // Ana trend: başlangıçtan mevcut fiyata eğimli geçiş
      const linearPrice = startPrice + (currentPrice - startPrice) * t;

      // Daha gerçekçi varyasyon (günlük döngüler ve deterministik dalgalanmalar)
      const dailyCycle = Math.sin((t * 7) * Math.PI * 2) * 0.02; // Günlük döngü
      const smoothVariation = getSmoothVariation(i);
      // Deterministik "rastgele" varyasyon (seed kullanarak)
      const pseudoRandom = Math.sin(seed * 0.001 + i * 0.1) * 0.5 + 0.5;
      const deterministicVariation = (pseudoRandom - 0.5) * maxVariation * 0.1;

      const price = linearPrice + smoothVariation + (linearPrice * dailyCycle) + deterministicVariation;

      // Fiyat aralığını kontrol et
      const priceDiff = Math.abs(currentPrice - startPrice);
      const minPrice = Math.min(startPrice, currentPrice) - priceDiff * 0.15;
      const maxPrice = Math.max(startPrice, currentPrice) + priceDiff * 0.15;
      data.push(Math.max(minPrice, Math.min(maxPrice, price)));
    }

    return data;
  };

  // Grafik verilerini state olarak sakla
  const [chartDataCache, setChartDataCache] = useState<Map<string, number[]>>(new Map());

  // Grafik verilerini oluştur (simüle edilmiş - API yükünü azaltmak için)
  useEffect(() => {
    if (coins.length === 0) return;

    const newCache = new Map<string, number[]>();
    coins.forEach((coin) => {
      newCache.set(coin.id, generateSparklineData(coin.id, coin.current_price, coin.price_change_percentage_24h));
    });
    setChartDataCache(newCache);
  }, [coins]);

  // Sayfa değiştiğinde scroll'u tablonun başına getir
  useEffect(() => {
    if (displayedCoins > 30 && tableRef.current) {
      tableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentPage, displayedCoins]);

  // Filtrelenmiş ve sıralanmış coin listesi
  const filteredAndSortedCoins = useMemo(() => {
    let filtered = [...coins];

    // Network filtresi (şimdilik sadece görsel, gerçek filtreleme için coin verilerinde network bilgisi gerekir)
    // Bu örnekte tüm coin'leri gösteriyoruz, gerçek uygulamada coin.platform veya coin.network gibi bir alan olmalı
    if (selectedNetwork !== 'all') {
      // Örnek: Ethereum coin'leri için symbol veya id kontrolü
      // Gerçek uygulamada coin.platforms veya coin.network bilgisi kullanılmalı
      filtered = filtered.filter((coin) => {
        const symbol = coin.symbol.toLowerCase();
        const id = coin.id.toLowerCase();

        switch (selectedNetwork) {
          case 'ethereum':
            return id.includes('ethereum') || symbol === 'eth' || id.includes('erc20');
          case 'solana':
            return id.includes('solana') || symbol === 'sol' || id.includes('spl');
          case 'basic':
            return symbol === 'btc' || symbol === 'eth' || symbol === 'bnb';
          case 'license':
            // Lisanslı coin'ler için özel kontrol (örnek)
            return coin.market_cap > 1000000000; // 1B+ market cap
          default:
            return true;
        }
      });
    }

    // Sıralama
    if (sortBy) {
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'market_cap':
            return b.market_cap - a.market_cap;
          case 'volume_24h':
            return b.total_volume - a.total_volume;
          default:
            return 0;
        }
      });
    } else {
      // Varsayılan sıralama: market cap
      filtered.sort((a, b) => b.market_cap - a.market_cap);
    }

    return filtered;
  }, [coins, selectedNetwork, sortBy]);

  // Sayfalama için coin'leri hesapla
  const coinsPerPage = 60;
  const totalPages = Math.ceil(filteredAndSortedCoins.length / coinsPerPage);
  const startIndex = (currentPage - 1) * coinsPerPage;
  const endIndex = startIndex + coinsPerPage;

  // İlk 30 coin göster, sonra sayfalama
  let displayedCoinsList: Coin[];
  if (displayedCoins <= 30) {
    // Default: İlk 30 coin göster
    displayedCoinsList = filteredAndSortedCoins.slice(0, 30);
  } else {
    // Sayfalama aktif (60 coin per page)
    displayedCoinsList = filteredAndSortedCoins.slice(startIndex, endIndex);
  }

  // Format number helper
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
    }
    return formatNumber(num);
  };

  const formatTrillionWithComma = (num: number) => {
    if (num >= 1e12) {
      const trillions = (num / 1e12).toFixed(2);
      return trillions.replace('.', ',') + ' Trilyon';
    }
    return formatNumber(num);
  };

  // --- YÜKLEME VE HATA DURUMLARI ---
  if (loading) return <div className="text-center p-10 text-gray-700 bg-white">Yükleniyor...</div>;
  if (error) return <div className="text-center p-10 text-red-600 bg-white">Hata: {error}</div>;
  if (!coins.length) return <div className="text-center p-10 text-yellow-600 bg-white">Veri bulunamadı. Veritabanınızda coin verisi var mı?</div>;

  // --- TABLO GÖSTERİMİ (Tailwind CSS Kullanılarak) ---
  return (
    <div className="min-h-screen bg-white pb-14">
      <Head>
        <title>Dijital Marketim | Kripto Fiyatları</title>
      </Head>

      {/* Signup Alert */}
      {showSignupAlert && (
        <SignupAlert
          onClose={() => setShowSignupAlert(false)}
          onDontShowAgain={handleDontShowAgain}
        />
      )}

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

      {/* Navbar */}
      <Navbar
        marketStats={marketStats}
        fearGreedIndex={fearGreedIndex}
        fearGreedClassification={fearGreedClassification}
        averageRSI={averageRSI}
        altcoinSeason={25}
      />

      {/* Market Overview Section */}
      <section id="coins" className="pb-12 bg-white">
        {/* Coin Filter Bar */}
        <CoinFilterBar
          selectedNetwork={selectedNetwork}
          onNetworkChange={setSelectedNetwork}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onFiltersClick={() => setShowFiltersModal(true)}
          onColumnsClick={() => setShowColumnsModal(true)}
        />

        <div ref={tableRef}>
          <div className="w-full px-4 py-6">
            <div className="overflow-x-auto bg-white">
              <table className="min-w-full text-base text-left">
                <thead className="text-sm font-semibold text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="py-4 px-6">#</th>
                    <th scope="col" className="py-4 px-6">Coin</th>
                    <th scope="col" className="py-4 px-6 text-right">Fiyat</th>
                    <th scope="col" className="py-4 px-6 text-right">1sa</th>
                    <th scope="col" className="py-4 px-6 text-right">24sa</th>
                    <th scope="col" className="py-4 px-6 text-right">7g</th>
                    <th scope="col" className="py-4 px-6 text-right">24 Saatlik Hacim</th>
                    <th scope="col" className="py-4 px-6 text-right">Piyasa Değeri</th>
                    <th scope="col" className="py-4 px-6 text-right">Son 7 Gün</th>
                    <th scope="col" className="py-4 px-6 text-center">Portföy</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCoinsList.map((coin, index) => {
                    // 1 saatlik ve 7 günlük değişim için tahmin (gerçek veri yoksa)
                    const priceChange1h = (coin.price_change_percentage_24h || 0) / 24; // 1 saat için tahmin
                    const priceChange7d = (coin.price_change_percentage_24h || 0) * 7; // 7 gün için tahmin

                    return (
                      <tr key={coin.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">

                        {/* SIRA NUMARASI */}
                        <td className="py-4 px-6 text-gray-500 font-medium">
                          {displayedCoins <= 30 ? index + 1 : startIndex + index + 1}
                        </td>

                        {/* COIN */}
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
                            <span className="text-gray-500 uppercase text-sm font-normal">{coin.symbol}</span>
                          </div>
                        </td>

                        {/* FİYAT */}
                        <td className="py-4 px-6 text-right text-gray-900 font-medium">
                          {formatCurrency(coin.current_price)}
                        </td>

                        {/* 1SA YÜZDE DEĞİŞİM */}
                        <td className="py-4 px-6 text-right font-semibold">
                          <span
                            style={{
                              color: priceChange1h >= 0 ? '#16a34a' : '#dc2626',
                              display: 'inline-block'
                            }}
                          >
                            {priceChange1h >= 0 ? '▲' : '▼'}
                            {Math.abs(priceChange1h).toFixed(1)}%
                          </span>
                        </td>

                        {/* 24SA YÜZDE DEĞİŞİM */}
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

                        {/* 7G YÜZDE DEĞİŞİM */}
                        <td className="py-4 px-6 text-right font-semibold">
                          <span
                            style={{
                              color: priceChange7d >= 0 ? '#16a34a' : '#dc2626',
                              display: 'inline-block'
                            }}
                          >
                            {priceChange7d >= 0 ? '▲' : '▼'}
                            {Math.abs(priceChange7d).toFixed(1)}%
                          </span>
                        </td>

                        {/* 24 SAATLİK HACİM */}
                        <td className="py-4 px-6 text-right text-gray-700">
                          {formatCurrency(coin.total_volume)}
                        </td>

                        {/* PİYASA DEĞERİ */}
                        <td className="py-4 px-6 text-right text-gray-700">
                          {formatCurrency(coin.market_cap)}
                        </td>

                        {/* GRAFİK - Son 7 Gün */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end items-center h-12 w-40">
                            {chartDataCache.get(coin.id) && chartDataCache.get(coin.id)!.length > 0 ? (
                              (() => {
                                const chartData = chartDataCache.get(coin.id)!;
                                const minValue = Math.min(...chartData);
                                const maxValue = Math.max(...chartData);
                                const range = maxValue - minValue || 1;
                                const width = 160;
                                const height = 48;
                                const isPositive = coin.price_change_percentage_24h >= 0;
                                const lineColor = isPositive ? '#10b981' : '#ef4444';

                                // Path oluştur
                                const points = chartData.map((value, index) => {
                                  const x = (index / (chartData.length - 1)) * width;
                                  const y = height - ((value - minValue) / range) * height;
                                  return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                }).join(' ');

                                return (
                                  <svg width={width} height={height} className="w-full">
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
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                );
                              })()
                            ) : (
                              <div className="w-40 h-12 flex items-center justify-center text-gray-400 text-xs">
                                Yükleniyor...
                              </div>
                            )}
                          </div>
                        </td>

                        {/* PORTFÖY BUTONU */}
                        <td className="py-4 px-6 text-center">
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
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${portfolio.includes(coin.id)
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
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            )}
                          </button>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Daha Fazla Butonu ve Sayfalama */}
        <div className="bg-white">
          <div className="w-full px-4 py-6">
            {displayedCoins <= 30 ? (
              <div className="text-center">
                <button
                  onClick={() => {
                    setDisplayedCoins(31); // Sayfalama modunu aktif et
                    setCurrentPage(1);
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-base"
                >
                  Daha Fazla Göster
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {/* Sayfalama */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                      }`}
                  >
                    ← Önceki
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-12 h-12 rounded-xl font-bold transition-all ${currentPage === pageNum
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:scale-105'
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl font-semibold transition-all ${currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                      }`}
                  >
                    Sonraki →
                  </button>
                </div>

                <div className="text-base text-gray-600 font-medium">
                  Sayfa {currentPage} / {totalPages} (Toplam {filteredAndSortedCoins.length} coin)
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filtreler Modal */}
        {showFiltersModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Filtreler</h3>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fiyat Aralığı</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Piyasa Değeri</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">24 Saat Değişim</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min %"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max %"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={() => setShowFiltersModal(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Uygula
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sütunlar Modal */}
        {showColumnsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Sütunları Özelleştir</h3>
                <button
                  onClick={() => setShowColumnsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-2">
                {[
                  'Coin',
                  'Fiyat',
                  '1sa',
                  '24sa',
                  '7g',
                  '24 Saatlik Hacim',
                  'Piyasa Değeri',
                  'Son 7 Gün',
                ].map((column) => (
                  <label key={column} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">{column}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowColumnsModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  İptal
                </button>
                <button
                  onClick={() => setShowColumnsModal(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

      </section>

      {/* News Section - Modern Haber Bölümü */}
      <section className="bg-gradient-to-b from-white to-blue-50/30 px-4 py-12">
        <div className="w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">
              <span className="text-black">En Son Kripto </span>
              <span className="bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 bg-clip-text text-transparent">Haberleri</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Örnek Haber Verileri */}
            {[
              {
                id: '1',
                title: 'Gözler Ölüm Çaprazında, ABD ve XRP Coin Hareketliliği',
                image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
                source: 'Cointurk',
                sourceUrl: 'https://cointurk.com',
                publishedTime: 'yaklaşık 1 saat önce',
                coinSymbol: 'XRP',
                coinChange: -2.4,
              },
              {
                id: '2',
                title: 'Ayı piyasası bitiyor iddiası: Piyasada korku zirvede ama umut artıyor',
                image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
                source: 'CoinTelegraph Turkey',
                sourceUrl: 'https://cointelegraph.com.tr',
                publishedTime: 'yaklaşık 1 saat önce',
              },
              {
                id: '3',
                title: 'Sıcak Gelişme: Bitcoin Düştükçe Düşüyor, Hedef Kaç Dolar? Kriptoda Ne Oluyor?',
                image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop',
                source: 'Cointurk',
                sourceUrl: 'https://cointurk.com',
                publishedTime: 'yaklaşık 1 saat önce',
                coinSymbol: 'BTC',
                coinChange: -1.4,
              },
              {
                id: '4',
                title: 'Harvard Üniversitesinin Bitcoin (BTC) Stratejisi ve Güncel Görünüm',
                image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
                source: 'Cointurk',
                sourceUrl: 'https://cointurk.com',
                publishedTime: 'yaklaşık 2 saat önce',
                coinSymbol: 'BTC',
                coinChange: -1.4,
              },
            ].map((article) => (
              <a
                key={article.id}
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                {/* Haber Görseli */}
                <div className="relative w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/400x250?text=Haber+Görseli';
                    }}
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {/* Coin Badge (varsa) */}
                  {article.coinSymbol && article.coinChange !== undefined && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg">
                      <span className="text-sm font-bold text-gray-900">{article.coinSymbol}</span>
                      <span className={`text-sm font-bold ${article.coinChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {article.coinChange >= 0 ? '▲' : '▼'} {Math.abs(article.coinChange).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Haber İçeriği */}
                <div className="p-5">
                  <h3 className="text-base font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:via-yellow-500 group-hover:to-red-600 group-hover:bg-clip-text transition-all">
                    {article.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full">{article.source}</span>
                    <span className="text-gray-500">{article.publishedTime}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Daha Fazla Haber Butonu */}
          <div className="text-center">
            <a
              href="https://cointurk.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm"
            >
              Daha Fazla Haber Gör
            </a>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-white border-t border-gray-200 px-4 py-12">
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
              {/* Sertifika Rozetleri */}

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

export default HomePage;