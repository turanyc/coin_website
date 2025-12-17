import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';
import appStoreImage from '../img/app-store.png';
import googlePlayImage from '../img/google-play.png';

const PortfolioLandingPage: React.FC = () => {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Portföy Oluştur | Kripto Tracker</title>
      </Head>
      <Navbar />
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="text-sm font-semibold text-[#2563EB] mb-4">Bugün Kayıt Ol</div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Kripto Portföy Takipçisi
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Kar ve zararlarınızı takip edin. Portföy değerinizi görüntüleyin. Tüm bunları kullanımı kolay platformumuzla yapın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/portfolio')}
                  className="px-8 py-4 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors shadow-lg text-lg"
                >
                  Portföyünü Oluştur
                </button>
                <Link
                  href="/login"
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center text-lg"
                >
                  Giriş Yap
                </Link>
              </div>
            </div>

            {/* Right Visual - Desktop Portfolio */}
            <div className="relative">
              <div className="bg-gradient-to-br from-[#2563EB]/10 to-[#1d4ed8]/5 rounded-2xl p-8 shadow-xl">
                {/* Desktop Monitor */}
                <div className="bg-gray-800 rounded-lg p-4 shadow-2xl">
                  <div className="bg-white rounded-lg p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Mevcut Bakiye</h3>
                      <div className="text-3xl font-bold text-gray-900">$15,525.04</div>
                      <div className="text-green-600 font-semibold">+1.47%</div>
                    </div>
                    {/* Coin Graph */}
                    <div className="h-64 w-full bg-gray-50 rounded-lg p-4 mb-4">
                      <svg width="100%" height="100%" viewBox="0 0 400 200" className="w-full h-full">
                        <defs>
                          <linearGradient id="gradient-portfolio-landing" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map((i) => (
                          <line
                            key={i}
                            x1="0"
                            y1={i * 50}
                            x2="400"
                            y2={i * 50}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                          />
                        ))}
                        {/* Graph area */}
                        <path
                          d="M 0,180 Q 100,120 200,100 T 400,80 L 400,200 L 0,200 Z"
                          fill="url(#gradient-portfolio-landing)"
                        />
                        {/* Graph line */}
                        <path
                          d="M 0,180 Q 100,120 200,100 T 400,80"
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Data points */}
                        {[0, 50, 100, 150, 200, 250, 300, 350, 400].map((x, i) => {
                          const y = 180 - (i * 12) + Math.sin(i) * 10;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#2563EB"
                              stroke="white"
                              strokeWidth="2"
                            />
                          );
                        })}
                      </svg>
                    </div>
                    {/* Asset List */}
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-700 mb-2">Varlıklarınız</div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            B
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Bitcoin (BTC)</div>
                            <div className="text-sm text-gray-500">$94,011</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">0.5 BTC</div>
                          <div className="text-sm text-green-600">+2.5%</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            E
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">Ethereum (ETH)</div>
                            <div className="text-sm text-gray-500">$3,245</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">2.0 ETH</div>
                          <div className="text-sm text-green-600">+1.8%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile App Section */}
        <div className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">iOS ve Android'de de Mevcut</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Masaüstü ve mobil uygulama arasında senkronize edin ve kripto varlıklarınıza istediğiniz yerden erişin.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="hover:opacity-80 transition-opacity">
                    <Image
                      src={appStoreImage}
                      alt="App Store'dan İndir"
                      width={180}
                      height={60}
                      className="h-auto"
                    />
                  </a>
                  <a href="#" className="hover:opacity-80 transition-opacity">
                    <Image
                      src={googlePlayImage}
                      alt="Google Play'den Al"
                      width={180}
                      height={60}
                      className="h-auto"
                    />
                  </a>
                </div>
              </div>

              {/* Right Visual - Mobile Graph */}
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-xl max-w-sm mx-auto">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Mevcut Bakiye</h3>
                    <div className="text-2xl font-bold text-gray-900">$98,507.14</div>
                    <div className="text-green-600 font-semibold">+8324.12 (+1.47%)</div>
                  </div>
                  {/* Mobile Graph */}
                  <div className="h-48 w-full bg-gray-50 rounded-lg p-3 mb-4">
                    <svg width="100%" height="100%" viewBox="0 0 300 150" className="w-full h-full">
                      <defs>
                        <linearGradient id="gradient-mobile-portfolio" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,140 Q 75,100 150,80 T 300,60 L 300,150 L 0,150 Z"
                        fill="url(#gradient-mobile-portfolio)"
                      />
                      <path
                        d="M 0,140 Q 75,100 150,80 T 300,60"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="flex gap-2 mb-4">
                    <button className="flex-1 px-3 py-2 bg-[#2563EB] text-white text-sm font-semibold rounded-lg">
                      Çizgi Grafik
                    </button>
                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg">
                      Pasta Grafik
                    </button>
                    <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg">
                      İstatistikler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#2563EB] transition-colors">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Gerçek zamanlı fiyat verileri</h3>
                <p className="text-gray-600 text-sm">
                  En büyük borsalardan gelen fiyat verilerini kullanarak 7/24 güncelleniyor.
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#2563EB] transition-colors">
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Ücretsiz kullanım</h3>
                <p className="text-gray-600 text-sm">
                  Üst düzey kripto portföy takibi hiçbir maliyet olmadan.
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#2563EB] transition-colors">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Mevcut portföy bakiyenizi ve kar/zararı takip edin</h3>
                <p className="text-gray-600 text-sm">
                  Binlerce coin ve token mevcut.
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#2563EB] transition-colors">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Verileriniz güvenli ve korumalı</h3>
                <p className="text-gray-600 text-sm">
                  Veri güvenliği ve gizliliği konusunda çok ciddiyiz.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-4 py-12">
          <div className="w-full max-w-7xl mx-auto">
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

            {/* Alt Kısım - Copyright */}
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
    </>
  );
};

export default PortfolioLandingPage;
