import React, { useState, useEffect, MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useLanguage } from '../contexts/LanguageContext';
import SearchBar from './SearchBar';
import Image from 'next/image';
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

interface User {
  name?: string;
  full_name?: string;
  email?: string;
}

interface NavbarProps {
  marketStats?: MarketStats;
  fearGreedIndex?: number;
  fearGreedClassification?: string;
  averageRSI?: number;
  altcoinSeason?: number;
}

const Navbar: React.FC<NavbarProps> = ({ marketStats, fearGreedIndex = 50, fearGreedClassification = 'Neutral', averageRSI = 47.48, altcoinSeason = 25 }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch {
          return null;
        }
      }
    }
    return null;
  });
  const { language, setLanguage, t } = useLanguage();
  const router = useRouter();

  // Çıkış Yap Fonksiyonu
  const handleLogout = () => {
    localStorage.removeItem('currentUser'); // Hafızadan sil
    setUser(null); // State'i temizle
    router.push('/login'); // Giriş sayfasına at
  };

  const languages = [
    { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  ];


  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleRoute = () => {
      setOpenDropdown(null);
      setShowLanguageDropdown(false);
      setShowNotificationsDropdown(false);
    };

    router.events.on('routeChangeComplete', handleRoute);
    return () => {
      router.events.off('routeChangeComplete', handleRoute);
    };
  }, [router]);

  // Dil dropdown dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement;
      // Dropdown container'ı veya butonu içinde değilse kapat
      if (showLanguageDropdown && !target.closest('.language-dropdown-container')) {
        console.log("Dışarı tıklandı, dropdown kapanıyor");
        setShowLanguageDropdown(false);
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageDropdown]);

  const handleLogoClick = (event?: MouseEvent<HTMLAnchorElement>) => {
    event?.preventDefault();
    setOpenDropdown(null);
    setShowLanguageDropdown(false);
    if (router.pathname !== '/') {
      router.push('/');
    }
  };

  return (
    <>
      {/* Modern Navigation Bar */}
      <nav className={`bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : 'shadow-sm'}`}>
        <div className="w-full px-4 py-4 flex items-center justify-between">
          {/* Sol taraf - Logo ve Navigasyon */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link
              href="/"
              onClick={handleLogoClick}
              className="flex items-center group"
            >
              {/* Logo Image - cripto_logo.png */}
              <div className="h-14 w-54 flex items-center">
                <Image 
                  src={logoImage}
                  alt="Dijital Market Logo" 
                  height={64}
                  width={250}
                  className="h-16 w-auto object-contain"
                  priority
                />
              </div>
            </Link>

            {/* Navigasyon Menüleri */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Kripto Paralar Dropdown - 3 Blok */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'kripto' ? null : 'kripto')}
                  className="flex items-center gap-1 px-4 py-2 text-gray-700 font-medium transition-all duration-200 rounded-lg hover:bg-[#2563EB] hover:text-white whitespace-nowrap"
                >
                  <span>Kripto Paralar</span>
                  <svg className={`w-4 h-4 transition-transform ${openDropdown === 'kripto' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'kripto' && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-6 px-4 min-w-[800px]">
                      {/* Blok 1 */}
                      <div className="flex-1">
                        <div className="space-y-1">
                          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span className="font-medium">Sıralama</span>
                          </Link>
                          <Link href="/categories" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span className="font-medium">Kategoriler</span>
                          </Link>
                          <Link href="/historical-snapshot" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">Geçmiş Anlık Görüntüler</span>
                          </Link>
                          <Link href="/yield" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Getiri</span>
                          </Link>
                          <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Gerçek Dünya Varlıkları</span>
                          </a>
                        </div>
                      </div>

                      {/* Blok 2 - Leaderboards */}
                      <div className="flex-1 border-l border-gray-200 pl-6">
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Liderlik Tabloları</h4>
                          <div className="space-y-1">
                            <Link href="/trending" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              <span className="font-medium">Trend</span>
                            </Link>
                            <Link href="/upcoming" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Yakında</span>
                            </Link>
                            <Link href="/recently-added" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span className="font-medium">Son Eklenenler</span>
                            </Link>
                            <Link href="/gainers-losers" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                              </svg>
                              <span className="font-medium">Kazananlar ve Kaybedenler</span>
                            </Link>
                            <Link href="/most-visited" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span className="font-medium">En Çok Ziyaret Edilenler</span>
                            </Link>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span className="font-medium">Topluluk Hissiyatı</span>
                            </a>
                            <Link href="/chain-ranking" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Zincir Sıralaması</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dashboard Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'dashboard' ? null : 'dashboard')}
                  className="flex items-center gap-1 px-4 py-2 text-gray-700 font-medium transition-all duration-200 rounded-lg hover:bg-[#2563EB] hover:text-white"
                >
                  Kontrol Paneli
                  <svg className={`w-4 h-4 transition-transform ${openDropdown === 'dashboard' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'dashboard' && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-6 px-4 min-w-[800px]">
                      {/* Blok 1 - Piyasalar */}
                      <div className="flex-1">
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Piyasalar
                          </h4>
                          <div className="space-y-1">
                            <Link href="/market-overview" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span className="font-medium">Piyasa Genel Bakış</span>
                            </Link>
                            <Link href="/spot-piyasa" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                              <span className="font-medium">Spot Piyasa</span>
                            </Link>
                            <Link href="/turev-piyasa" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              <span className="font-medium">Türev Piyasa</span>
                            </Link>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                              <span className="font-medium">Kripto Para Sayısı</span>
                            </a>
                            <Link href="/bitcoin-hazine-rezervleri" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Bitcoin Hazine Rezervleri</span>
                            </Link>
                            <Link href="/bnb-hazine-rezervleri" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">BNB Hazine Rezervleri</span>
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Blok 2 - Göstergeler */}
                      <div className="flex-1 border-l border-gray-200 pl-6">
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Göstergeler
                          </h4>
                          <div className="space-y-1">
                            <Link href="/fear-greed" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span className="font-medium">Korku ve Açgözlülük Endeksi</span>
                            </Link>
                            <Link href="/altcoin-season" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                              <span className="font-medium">Altcoin Sezonu Endeksi</span>
                            </Link>
                            <Link href="/btc-dominance" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">Bitcoin Hakimiyeti</span>
                            </Link>
                            <Link href="/cmc20" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span className="font-medium">Dijital Market 20 Endeksi</span>
                            </Link>
                            <Link href="/rsi" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <span className="font-medium">RSI</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* DexScan Link */}
              <Link href="#" className="px-4 py-2 text-gray-700 font-medium transition-all duration-200 rounded-lg hover:bg-[#2563EB] hover:text-white">
                DexScan
              </Link>

              {/* Borsalar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'borsalar' ? null : 'borsalar')}
                  className="flex items-center gap-1 px-4 py-2 text-gray-700 font-medium transition-all duration-200 rounded-lg hover:bg-[#2563EB] hover:text-white"
                >
                  Borsalar
                  <svg className={`w-4 h-4 transition-transform ${openDropdown === 'borsalar' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'borsalar' && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-6 px-4 min-w-[600px]">
                      {/* Blok 1 - Merkezi Borsalar */}
                      <div className="flex-1">
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Merkezi Borsalar</h4>
                          <div className="space-y-1">
                            <Link href="/exchanges" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">Spot</span>
                            </Link>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">Türevler</span>
                            </a>
                          </div>
                        </div>
                      </div>
                      {/* Blok 2 - Merkezi Olmayan Borsalar */}
                      <div className="flex-1 border-l border-gray-200 pl-6">
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Merkezi Olmayan Borsalar</h4>
                          <div className="space-y-1">
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                              </svg>
                              <span className="font-medium">Spot</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium">Türevler</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Topluluk Link */}
              <Link href="#" className="px-4 py-2 text-gray-700 font-medium transition-all duration-200 rounded-lg hover:bg-[#2563EB] hover:text-white">
                Topluluk
              </Link>

              {/* Ürünler Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'urunler' ? null : 'urunler')}
                  className="flex items-center gap-1 px-4 py-2 text-gray-700 font-medium transition-all duration-200 rounded-lg hover:bg-[#2563EB] hover:text-white"
                >
                  Ürünler
                  <svg className={`w-4 h-4 transition-transform ${openDropdown === 'urunler' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openDropdown === 'urunler' && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-6 px-4 min-w-[800px]">
                      {/* Blok 1 - Ürünler */}
                      <div className="flex-1">
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Ürünler</h4>
                          <div className="space-y-1">
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                              </svg>
                              <span className="font-medium">Dönüştürücü</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">Bülten</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="font-medium">Dijital Market Lansman</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                              </svg>
                              <span className="font-medium">Dijital Market Laboratuvarları</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <span className="font-medium">Telegram Bot</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              <span className="font-medium">Reklam Ver</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                              </svg>
                              <span className="font-medium">Kripto API</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v6a1 1 0 01-1 1h-4a1 1 0 01-1-1v-6z" />
                              </svg>
                              <span className="font-medium">Site Widget&apos;ları</span>
                            </a>
                          </div>
                        </div>
                      </div>
                      {/* Blok 2 - Kampanyalar */}
                      <div className="flex-1 border-l border-gray-200 pl-6">
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Kampanyalar</h4>
                          <div className="space-y-1">
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                              </svg>
                              <span className="font-medium">Airdrop&apos;lar</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                              <span className="font-medium">Elmas Ödülleri</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="font-medium">Öğren ve Kazan</span>
                            </a>
                          </div>
                        </div>
                        <div className="mb-3 mt-6">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Öğren</h4>
                          <div className="space-y-1">
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                              </svg>
                              <span className="font-medium">Haberler</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="font-medium">Akademi</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              <span className="font-medium">Araştırma</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">Videolar</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                              </svg>
                              <span className="font-medium">Sözlük</span>
                            </a>
                          </div>
                        </div>
                      </div>
                      {/* Blok 3 - Takvimler */}
                      <div className="flex-1 border-l border-gray-200 pl-6">
                        <div className="mb-3">
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Takvimler</h4>
                          <div className="space-y-1">
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">ICO Takvimi</span>
                            </a>
                            <a href="#" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group" onClick={() => setOpenDropdown(null)}>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#2563EB]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">Etkinlik Takvimi</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Sağ taraf - Kullanıcı İşlemleri */}
          <div className="flex items-center gap-3">
            {/* Arama - Gelişmiş */}
            <div className="hidden md:block">
              <SearchBar />
            </div>

            {/* CMC AI Button */}
            <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm">Dijital Market AI</span>
            </button>

            {/* Kullanıcı durumuna göre dinamik butonlar */}
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-600">{t('common.welcome')},</p>
                  <p className="text-sm font-bold text-gray-900">{user.name || user.full_name || user.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                >
                  {t('common.logout')}
                </button>
              </div>
            ) : (
              <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Giriş Yap
              </Link>
            )}

            {/* Settings Icon Button - Hidden by default, can be shown on mobile */}
            <div className="relative z-50 language-dropdown-container lg:hidden">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLanguageDropdown(!showLanguageDropdown);
                  setShowNotificationsDropdown(false);
                }}
                className="bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors focus:outline-none"
              >
                <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Dil Seçimi Dropdown */}
              {showLanguageDropdown && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-[60] min-w-[200px] max-h-[400px] overflow-y-auto">
                  <div className="px-4 py-2 border-b border-gray-200 text-xs text-gray-500 font-bold uppercase bg-gray-50">
                    {t('common.language')}
                  </div>
                  
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={(e) => {
                        e.stopPropagation();
                        const langCode = lang.code as 'tr' | 'en' | 'es' | 'zh' | 'ar' | 'fr' | 'de' | 'ja' | 'pt' | 'ru' | 'hi';
                        setLanguage(langCode);
                        setShowLanguageDropdown(false);
                        setTimeout(() => {
                          window.location.reload();
                        }, 100);
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 text-sm transition flex items-center gap-2 ${
                        language === lang.code ? 'bg-[#2563EB]/10 text-[#2563EB] font-semibold' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="flex-1">{lang.name}</span>
                      {language === lang.code && (
                        <svg className="w-4 h-4 text-[#2563EB]" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setOpenDropdown(openDropdown === 'mobile' ? null : 'mobile')}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Portföy */}
            <Link href="/portfolio" className="hidden lg:flex items-center gap-2 px-3 py-2 text-gray-700 font-medium transition-all duration-200 rounded-lg hover:bg-[#2563EB] hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm">Portföy</span>
            </Link>

            {/* İzleme Listesi */}
            <button className="hidden lg:flex items-center gap-2 px-3 py-2 text-gray-700 font-medium transition-all duration-200 rounded-lg hover:bg-[#2563EB] hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <span className="text-sm">İzleme Listesi</span>
            </button>


            {/* Mobile Menu Button */}
            <button
              onClick={() => setOpenDropdown(openDropdown === 'mobile' ? null : 'mobile')}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {openDropdown === 'mobile' && (
          <div className="lg:hidden mt-4 pb-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <Link href="/" className="px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100">Kripto Paralar</Link>
              <a href="#" className="px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100">Borsalar</a>
              <a href="#" className="px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100">Öğren</a>
              <a href="#" className="px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100">Ürünler</a>
              <div className="pt-4 border-t border-gray-200 mt-2">
                <button className="w-full flex items-center gap-2 px-4 py-3 text-[#2563EB] font-medium rounded-lg hover:bg-[#2563EB]/10 mb-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Favoriler
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-3 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-medium rounded-lg mb-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Portföy
                </button>
                {user ? (
                  <>
                    <div className="w-full px-4 py-3 text-center mb-2">
                      <p className="text-xs text-gray-500">{t('common.welcome')},</p>
                      <p className="text-sm font-bold text-gray-900">{user.name || user.full_name || user.email}</p>
                    </div>
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg block text-center"
                    >
                      {t('common.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="w-full px-4 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100 mb-2 block text-center">{t('common.login')}</Link>
                    <Link href="/register" className="w-full px-4 py-3 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-medium rounded-lg block text-center">{t('common.register')}</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Dropdown overlay - click outside to close */}
      {openDropdown && openDropdown !== 'mobile' && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpenDropdown(null)}
        ></div>
      )}

      {/* Tab Menu - Navbar Altında - Sadece Ana Sayfada */}
      {router.pathname === '/' && (
      <>
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
            <button className="px-4 py-3 text-gray-900 font-medium text-2xl whitespace-nowrap border-b-2 border-blue-600 relative">
              En İyiler
            </button>
            <button className="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors">
              Trend
            </button>
            <button className="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors">
              En Çok Ziyaret Edilenler
            </button>
            <button className="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors">
              Yeni
            </button>
            <button className="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors">
              Kazananlar
            </button>
            <button className="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors">
              Gerçek Dünya Varlıkları
            </button>
            <div className="relative">
              <button 
                onClick={() => setOpenDropdown(openDropdown === 'more-tabs' ? null : 'more-tabs')}
                className="px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors flex items-center gap-1"
              >
                Daha Fazla
                <svg className={`w-4 h-4 transition-transform ${openDropdown === 'more-tabs' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openDropdown === 'more-tabs' && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 min-w-[200px]" onClick={(e) => e.stopPropagation()}>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors" onClick={() => setOpenDropdown(null)}>
                    Kaybedenler
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors" onClick={() => setOpenDropdown(null)}>
                    Son 24 Saat
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors" onClick={() => setOpenDropdown(null)}>
                    Son 7 Gün
                  </a>
                  <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors" onClick={() => setOpenDropdown(null)}>
                    Son 30 Gün
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Crypto Market Overview */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="w-full px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Market Cap Card */}
            <Link href="/market-overview">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Piyasa Değeri</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {marketStats ? `$${(marketStats.marketCap / 1e12).toFixed(2)}T` : '$0.00T'}
                  </div>
                  <div className={`text-sm font-semibold flex items-center gap-1 ${marketStats && marketStats.marketCapChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {marketStats && marketStats.marketCapChange24h >= 0 ? '▲' : '▼'} {marketStats && marketStats.marketCapChange24h !== undefined ? Math.abs(marketStats.marketCapChange24h).toFixed(2) : '0.00'}%
                  </div>
                </div>
                {/* Mini Chart */}
                <div className="h-12 w-full mt-2">
                  <svg viewBox="0 0 100 40" className="w-full h-full">
                    <polyline
                      points="0,30 10,25 20,20 30,18 40,15 50,12 60,10 70,8 80,10 90,12 100,10"
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </Link>

            {/* CMC20 Card */}
            <Link href="/cmc20">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Dijital Market 20</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900">$193.84</div>
                  <div className="text-sm font-semibold text-green-600 flex items-center gap-1">
                    ▲ 0.88%
                  </div>
                </div>
                {/* Mini Chart - Top 20 Coins */}
                <div className="h-12 w-full mt-2">
                  <svg viewBox="0 0 100 40" className="w-full h-full">
                    <polyline
                      points="0,35 10,30 20,25 30,20 40,18 50,15 60,12 70,10 80,12 90,15 100,12"
                      fill="none"
                      stroke="#14b8a6"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Fear & Greed Card */}
            <Link href="/fear-greed">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Korku ve Açgözlülük</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900">{fearGreedIndex}</div>
                  <div className="text-xs font-semibold" style={{
                    color: fearGreedIndex <= 25 ? '#ef4444' : fearGreedIndex <= 45 ? '#f59e0b' : fearGreedIndex <= 55 ? '#eab308' : fearGreedIndex <= 75 ? '#10b981' : '#059669'
                  }}>
                    {fearGreedClassification === 'Extreme Fear' ? 'Aşırı Korku' :
                     fearGreedClassification === 'Fear' ? 'Korku' :
                     fearGreedClassification === 'Neutral' ? 'Nötr' :
                     fearGreedClassification === 'Greed' ? 'Açgözlülük' :
                     fearGreedClassification === 'Extreme Greed' ? 'Aşırı Açgözlülük' :
                     'Nötr'}
                  </div>
                </div>
                {/* Horizontal Bar */}
                <div className="relative h-8 rounded-full mt-2 overflow-hidden">
                  <div className="absolute inset-0 flex">
                    <div className="flex-1 bg-red-500"></div>
                    <div className="flex-1 bg-orange-500"></div>
                    <div className="flex-1 bg-yellow-400"></div>
                    <div className="flex-1 bg-green-500"></div>
                    <div className="flex-1 bg-emerald-600"></div>
                  </div>
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                    style={{ left: `${fearGreedIndex}%` }}
                  ></div>
                </div>
              </div>
            </Link>

            {/* Altcoin Season Card */}
            <Link href="/altcoin-season">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Altcoin Sezonu</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900">{altcoinSeason}/100</div>
                </div>
                {/* Gradient Slider */}
                <div className="relative mt-2">
                  <div className="relative h-8 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-300 via-green-300 to-green-500"></div>
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                      style={{ left: `${altcoinSeason}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-600">Bitcoin</span>
                    <span className="text-xs text-gray-600">Altcoin</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Average Crypto RSI Card */}
            <Link href="/rsi">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">Ortalama Kripto RSI</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="text-2xl font-bold text-gray-900">{averageRSI.toFixed(2)}</div>
                </div>
                {/* Slider */}
                <div className="relative mt-2">
                  <div className="relative h-8 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 via-green-400 via-yellow-400 to-pink-500"></div>
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                      style={{ left: `${averageRSI}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-blue-600">Aşırı Satım</span>
                    <span className="text-xs text-pink-600">Aşırı Alım</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* News Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-700">Coinpaper.com</span>
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-500">3 saat</span>
              </div>
              <div className="text-sm text-gray-700 line-clamp-2">
                <span className="text-yellow-500">❤️</span> YENİ: #Visa, CEMEA bölgesinde #stablecoin ödeme hizmetlerini genişletmek için Aquanow ile ortaklık kurdu, veren ve alan kuruluşların...
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Suggested Questions */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="w-full px-4">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
              {/* Question Button 1 */}
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 hover:bg-[#2563EB] hover:text-white hover:border-transparent">
                <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                </svg>
                <span className="text-sm font-medium">Hangi broker kripto ETF işlemlerini yeniden açtı?</span>
              </button>

              {/* Question Button 2 */}
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 hover:bg-[#2563EB] hover:text-white hover:border-transparent">
                <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-sm font-medium">Piyasa neden bugün yükseliyor?</span>
              </button>

              {/* Question Button 3 */}
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 hover:bg-[#2563EB] hover:text-white hover:border-transparent">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-sm font-medium">Altcoinler Bitcoin&apos;i geçiyor mu?</span>
              </button>

              {/* Question Button 4 */}
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 hover:bg-[#2563EB] hover:text-white hover:border-transparent">
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-sm font-medium">Trend olan anlatılar nelerdir?</span>
              </button>

              {/* Question Button 5 */}
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 hover:bg-[#2563EB] hover:text-white hover:border-transparent">
                <svg className="w-4 h-4 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-sm font-medium">Hangi kriptolar yükseliş momentumu gösteriyor?</span>
              </button>

              {/* Question Button 6 */}
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 hover:bg-[#2563EB] hover:text-white hover:border-transparent">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Yaklaşan hangi olaylar kriptoyu etkileyebilir?</span>
              </button>

              {/* More Button */}
              <button className="flex items-center justify-center w-10 h-10 bg-white text-gray-900 border border-gray-200 rounded-full transition-all duration-200 flex-shrink-0 hover:bg-[#2563EB] hover:text-white hover:border-transparent">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        </>
      )}
    </>
  );
};

export default Navbar;
