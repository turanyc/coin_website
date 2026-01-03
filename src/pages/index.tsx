import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import MarketStatsBar from '../components/MarketStatsBar';
import DashboardCards from '../components/DashboardCards';
import { VolumeChart } from '../components/VolumeChart';
import logoImage from '../img/cripto_logo.png';

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
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalCoins: 0,
    totalExchanges: 0,
    marketCap: 0,
    marketCapChange24h: 0,
    volume24h: 0,
    btcDominance: 0,
    ethDominance: 0,
    gasPrice: 0,
  });
  const [navbarExpanded, setNavbarExpanded] = useState(false);
  const [fearGreedIndex, setFearGreedIndex] = useState(50);
  const [fearGreedClassification, setFearGreedClassification] = useState('Neutral');

  // Fetch Fear & Greed Index
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
        setFearGreedIndex(50);
        setFearGreedClassification('Neutral');
      }
    };

    fetchFearGreed();
    const interval = setInterval(fetchFearGreed, 5 * 60 * 1000); // Her 5 dakikada bir güncelle

    return () => clearInterval(interval);
  }, []);

  // Fetch market stats
  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const response = await fetch('/api/global');
        if (response.ok) {
          const data = await response.json();
          setMarketStats({
            totalCoins: data.totalCoins || 0,
            totalExchanges: data.totalExchanges || 0,
            marketCap: data.marketCap || 0,
            marketCapChange24h: data.marketCapChange24h || 0,
            volume24h: data.volume24h || 0,
            btcDominance: data.btcDominance || 0,
            ethDominance: data.ethDominance || 0,
            gasPrice: 0.518,
          });
        }
      } catch (error) {
        console.error('Global stats error:', error);
      }
    };

    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);


  return (
    <>
      <Navbar 
        marketStats={marketStats} 
        onNavbarToggle={setNavbarExpanded}
        fearGreedIndex={fearGreedIndex}
        fearGreedClassification={fearGreedClassification}
      />
      
      <Head>
        <title>Dijital Marketim | Kripto Fiyatları</title>
      </Head>

      {/* Üst bar yüksekliği için padding (h-16 = 64px) ve sağ navbar genişliği için dinamik margin */}
      <div className={`min-h-screen bg-white pt-16 transition-all duration-300 ${navbarExpanded ? 'pr-64' : 'pr-16'}`}>
        <div className="pl-0 pr-6 py-6">
          {/* Dashboard Cards ve Volume Chart - Yan yana */}
          <div className="px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Dashboard Cards - İlk 3 blok */}
              <DashboardCards 
        marketStats={marketStats}
        fearGreedIndex={fearGreedIndex}
        fearGreedClassification={fearGreedClassification}
              />
              
              {/* Volume Chart - 4. blok olarak */}
              <VolumeChart />
                          </div>
                              </div>
          </div>
        </div>

          {/* Footer Section */}
          <footer className="bg-white border-t border-gray-200 px-4 py-12">
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

      {/* Market Stats Bar */}
      <MarketStatsBar marketStats={marketStats} />
    </>
  );
};

export default HomePage;
