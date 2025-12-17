import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';
import appStoreImage from '../img/app-store.png';
import googlePlayImage from '../img/google-play.png';

const WatchlistLandingPage: React.FC = () => {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Kripto para izleme listesi ticaret stratejinizi nasıl geliştirebilir?',
      answer: 'İzleme listesi, ilginizi çeken coinleri takip etmenizi ve fiyat hareketlerini analiz etmenizi sağlar. Bu sayede daha bilinçli yatırım kararları alabilirsiniz.',
    },
    {
      question: 'Coin izleme listesinin faydaları nelerdir?',
      answer: 'İzleme listesi sayesinde favori coinlerinizi tek bir yerde toplayabilir, fiyat değişimlerini kolayca takip edebilir ve yatırım fırsatlarını kaçırmazsınız.',
    },
  ];

  return (
    <>
      <Head>
        <title>İzleme Listesi Oluştur | Kripto Tracker</title>
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
                Bugün kayıt olun ve kendi kripto İzleme Listenizi alın
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Kar ve zararlarınızı takip edin. Portföy değerinizi görüntüleyin. Tüm bunları kullanımı kolay platformumuzla yapın.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/watchlist')}
                  className="px-8 py-4 bg-[#2563EB] text-white font-semibold rounded-lg hover:bg-[#1d4ed8] transition-colors shadow-lg text-lg"
                >
                  Kendi İzleme Listemi Oluştur
                </button>
                <Link
                  href="/login"
                  className="px-8 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center text-lg"
                >
                  Giriş Yap
                </Link>
              </div>
            </div>

            {/* Right Visual - Desktop and Mobile Watchlist */}
            <div className="relative">
              <div className="bg-gradient-to-br from-[#2563EB]/10 to-[#1d4ed8]/5 rounded-2xl p-8 shadow-xl">
                {/* Desktop Monitor */}
                <div className="bg-gray-800 rounded-lg p-4 shadow-2xl mb-4">
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Üçüncü İzleme Listem</h3>
                    {/* Watchlist Table */}
                    <div className="space-y-2">
                      {[
                        { name: 'Bitcoin', symbol: 'BTC', price: '$94,011', change: '+2.5%', positive: true },
                        { name: 'Ethereum', symbol: 'ETH', price: '$3,245', change: '+1.8%', positive: true },
                        { name: 'Tether', symbol: 'USDT', price: '$1.00', change: '+0.01%', positive: true },
                        { name: 'BNB', symbol: 'BNB', price: '$585', change: '-0.5%', positive: false },
                        { name: 'Solana', symbol: 'SOL', price: '$185', change: '+3.2%', positive: true },
                      ].map((coin, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                              index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-green-500' : index === 3 ? 'bg-yellow-500' : 'bg-purple-500'
                            }`}>
                              {coin.symbol[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{coin.name}</div>
                              <div className="text-sm text-gray-500">{coin.symbol}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{coin.price}</div>
                            <div className={`text-sm font-semibold ${coin.positive ? 'text-green-600' : 'text-red-600'}`}>
                              {coin.change}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Watchlist Overlay */}
                <div className="bg-white rounded-lg p-4 shadow-lg max-w-xs ml-auto border-4 border-gray-800">
                  <div className="flex gap-2 mb-3">
                    <button className="px-3 py-1 bg-[#2563EB] text-white text-xs font-semibold rounded">
                      Coinler
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                      İzleme Listeleri
                    </button>
                    <button className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                      Borsa
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 mb-3">Ana İzleme Listesi</h4>
                  {/* Mobile Coin Graph */}
                  <div className="h-32 w-full bg-gray-50 rounded-lg p-2 mb-3">
                    <svg width="100%" height="100%" viewBox="0 0 200 100" className="w-full h-full">
                      <defs>
                        <linearGradient id="gradient-mobile-watchlist" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0,90 Q 50,70 100,50 T 200,30 L 200,100 L 0,100 Z"
                        fill="url(#gradient-mobile-watchlist)"
                      />
                      <path
                        d="M 0,90 Q 50,70 100,50 T 200,30"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: 'Bitcoin', symbol: 'BTC', price: '$94,011', change: '+2.5%' },
                      { name: 'Ethereum', symbol: 'ETH', price: '$3,245', change: '+1.8%' },
                    ].map((coin, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            index === 0 ? 'bg-orange-500' : 'bg-blue-500'
                          }`}>
                            {coin.symbol[0]}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-900">{coin.name}</div>
                            <div className="text-xs text-gray-500">{coin.price}</div>
                          </div>
                        </div>
                        <div className="text-xs text-green-600 font-semibold">{coin.change}</div>
                      </div>
                    ))}
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
                  Masaüstü ve uygulama arasında senkronize edin ve kripto varlıklarınıza istediğiniz yerden erişin.
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

              {/* Right Features */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-400 transition-colors">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Anında fiyat uyarıları</h3>
                  <p className="text-gray-600 text-xs">
                    Büyük kripto hareketlerinde zamanında bildirimler alın.
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-cyan-400 transition-colors">
                  <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Ücretsiz kullanım</h3>
                  <p className="text-gray-600 text-xs">
                    Üst düzey kripto portföy takibi hiçbir maliyet olmadan.
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-colors">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Listelerinizi istediğiniz gibi organize edin</h3>
                  <p className="text-gray-600 text-xs">
                    Çeşitli kripto alanlarını takip etmek için ayrı listeler oluşturun.
                  </p>
                </div>

                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-400 transition-colors">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342c-.400 0-.784.148-1.069.414l-3.614 3.025a1.5 1.5 0 01-1.897-1.897l3.025-3.614a1.5 1.5 0 011.069-.414h.684V8.684c0-.4.148-.784.414-1.069l3.614-3.025a1.5 1.5 0 011.897 1.897l-3.025 3.614a1.5 1.5 0 01-.414 1.069v.684h.684zm6.632 0c.4 0 .784-.148 1.069-.414l3.614-3.025a1.5 1.5 0 011.897 1.897l-3.025 3.614a1.5 1.5 0 01-.414 1.069v.684h-.684c-.4 0-.784.148-1.069.414l-3.614 3.025a1.5 1.5 0 01-1.897-1.897l3.025-3.614a1.5 1.5 0 01.414-1.069v-.684h.684z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Paylaşmak önemsemektir</h3>
                  <p className="text-gray-600 text-xs">
                    İzleme listelerinizi tek dokunuşla paylaşın.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Sıkça Sorulan Sorular (SSS)
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 cursor-pointer hover:border-[#2563EB] transition-colors"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</h3>
                    <svg
                      className={`w-6 h-6 text-gray-500 transition-transform flex-shrink-0 ${
                        openFaq === index ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {openFaq === index && (
                    <p className="mt-4 text-gray-600 leading-relaxed">{faq.answer}</p>
                  )}
                </div>
              ))}
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

export default WatchlistLandingPage;
