import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface Exchange {
  rank: number;
  id: string;
  name: string;
  image: string;
  score: number;
  volume24h: number;
  liquidity: number;
  weeklyVisits: number;
  markets: number;
  coins: number;
  fiat: number;
  sparkline: number[];
  trustScore: number;
  yearEstablished: number | null;
  country: string | null;
  url: string | null;
  centralized: boolean;
}

const ExchangesPage: React.FC = () => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<'spot' | 'derivatives' | 'dex'>('spot');
  const [displayedCount, setDisplayedCount] = useState(100);

  useEffect(() => {
    fetchExchanges();
  }, []);

  const fetchExchanges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/exchanges');
      const data = await response.json();
      
      if (data.exchanges && Array.isArray(data.exchanges)) {
        setExchanges(data.exchanges);
      }
    } catch (error) {
      console.error('Borsalar çekilemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number): string => {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    return value.toFixed(0);
  };

  // Sparkline grafiği oluştur
  const renderSparkline = (data: number[]) => {
    const width = 100;
    const height = 30;
    const padding = 4;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Verileri normalize et (0-100 arası)
    const values = data.map(v => Math.max(0, Math.min(100, (v + 1) * 50)));
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;

    // Noktaları oluştur (yukarıdan aşağıya, yüksek değer yukarıda)
    const points = values.map((value, index) => {
      const x = padding + (index / (values.length - 1 || 1)) * chartWidth;
      const normalizedValue = (value - min) / range;
      const y = padding + chartHeight - (normalizedValue * chartHeight);
      return `${x},${y}`;
    }).join(' ');

    // Trend belirle (ilk ve son değere göre)
    const firstValue = values[0] || 0;
    const lastValue = values[values.length - 1] || 0;
    const isPositive = lastValue > firstValue;
    const color = isPositive ? '#16a34a' : '#dc2626';

    return (
      <svg width={width} height={height} className="block" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const filteredExchanges = exchanges
    .filter(ex => {
      if (selectedType === 'dex') {
        return !ex.centralized;
      } else if (selectedType === 'derivatives') {
        // Derivatives için şimdilik tüm centralized exchanges'leri göster
        // Gerçek uygulamada derivatives bilgisi API'den gelmeli
        return ex.centralized;
      }
      // Spot için centralized exchanges
      return ex.centralized;
    })
    .slice(0, displayedCount);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Head>
          <title>En İyi Kripto Para Borsaları | Dijital Marketim</title>
        </Head>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>En İyi Kripto Para Spot Borsaları | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full px-4 py-8">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            En İyi Kripto Para Spot Borsaları
          </h1>
          <p className="text-gray-600 text-base max-w-4xl">
            24 saatlik işlem hacmi, likidite ve web trafiğine göre sıralanan en iyi kripto para spot borsalarının listesi. 
            Aşağıdaki tablo en iyi borsaları ve puanlarını, 24 saatlik hacimlerini, likiditelerini ve daha fazlasını gösterir.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedType('spot')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'spot'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Spot
            </button>
            <button
              onClick={() => setSelectedType('derivatives')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'derivatives'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Türevler
            </button>
            <button
              onClick={() => setSelectedType('dex')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedType === 'dex'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              DEX
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
              Sütunları Özelleştir
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
              Filtreler
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">#</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Borsa</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Puan</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">24s Hacim</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Likidite</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Haftalık Ziyaretler</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Piyasalar</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Coinler</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Fiat</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">Son 7 Gün</th>
              </tr>
            </thead>
            <tbody>
              {filteredExchanges.map((exchange, index) => (
                <tr
                  key={exchange.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="py-4 px-4 text-sm text-gray-600 font-medium">{exchange.rank}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {exchange.image && (
                        <div className="relative w-8 h-8 flex-shrink-0">
                          <Image
                            src={exchange.image}
                            alt={exchange.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <span className="font-semibold text-gray-900">{exchange.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right text-sm font-semibold text-gray-900">
                    {exchange.score.toFixed(1)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {formatCurrency(exchange.volume24h)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {exchange.liquidity}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {formatNumber(exchange.weeklyVisits)}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {exchange.markets.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {exchange.coins.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-gray-900 font-medium">
                    {exchange.fiat.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end">
                      {renderSparkline(exchange.sparkline)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Load More Button */}
        {displayedCount < filteredExchanges.length && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setDisplayedCount(prev => prev + 100)}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              100 Tane Daha Göster
            </button>
          </div>
        )}
      </div>

      {/* Footer Section */}
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
    </div>
  );
};

export default ExchangesPage;

