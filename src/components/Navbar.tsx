import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import logoImage from '../img/cripto_logo.png';
import AuthModal from './AuthModal';
import SearchBar from './SearchBar';
import DijitalMarketAI from './DijitalMarketAI';
import { addCoinToWatchlistCookie, hasCookieConsent } from '../lib/cookieUtils';
import {
  Coins,
  TrendingUp,
  Layers,
  Wallet,
  ArrowUpDown,
  Globe,
  BarChart3,
  TrendingDown,
  Sparkles,
  Building2,
  Database,
  BarChart,
  ArrowRightLeft,
  Target,
  BookOpen,
  Search,
  Lightbulb,
  Newspaper,
  FileText,
  GraduationCap,
  Video,
  Mail,
  Briefcase,
  Gift,
  Crown,
  Megaphone,
  Code,
  Terminal,
  Users,
  ChevronDown,
  User,
  LogOut,
  Circle,
  Star,
  X
} from 'lucide-react';

interface User {
  id?: number;
  user_id?: number;
  name?: string;
  full_name?: string;
  email?: string;
  profile_picture_url?: string;
}

interface NavbarProps {
  marketStats?: any;
  onNavbarToggle?: (expanded: boolean) => void;
  fearGreedIndex?: number;
  fearGreedClassification?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onNavbarToggle, fearGreedIndex = 50, fearGreedClassification = 'Neutral' }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [navbarExpanded, setNavbarExpanded] = useState(false);
  const [showWatchlistPopup, setShowWatchlistPopup] = useState(false);
  const [watchlistCoins, setWatchlistCoins] = useState<any[]>([]);
  const [watchlistTab, setWatchlistTab] = useState<'coins' | 'dexscan'>('coins');
  const [watchlistPopupTimeout, setWatchlistPopupTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const navbarRef = useRef<HTMLElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          setUser(null);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const handleUserLogin = (event: CustomEvent) => {
      setUser(event.detail);
      setShowAuthModal(false);
    };

    const handleUserLogout = () => {
      setUser(null);
    };

    window.addEventListener('userLoggedIn' as any, handleUserLogin);
    window.addEventListener('userLoggedOut', handleUserLogout);

    return () => {
      window.removeEventListener('userLoggedIn' as any, handleUserLogin);
      window.removeEventListener('userLoggedOut', handleUserLogout);
    };
  }, [isMounted]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    setShowProfileMenu(false);
  };

  // Navbar toggle fonksiyonu - tıklamaya dayalı
  const handleNavbarToggle = useCallback(() => {
    setNavbarExpanded(prev => {
      const newState = !prev;
      if (!newState) {
        setOpenDropdown(null); // Navbar kapanırken dropdown'ları da kapat
      }
      if (onNavbarToggle) {
        onNavbarToggle(newState);
      }
      return newState;
    });
  }, [onNavbarToggle]);

  // Click outside to close navbar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Navbar içinde tıklanmışsa kapatma (ama butonlar hariç)
      if (navbarRef.current && navbarRef.current.contains(target)) {
        // Eğer bir buton veya link'e tıklandıysa ve navbar kapalıysa açma işlemini yapma
        // Çünkü butonların kendi onClick handler'ları var
        if (target.closest('button') || target.closest('a')) {
          return;
        }
        // Navbar'ın kendisine tıklandıysa ve kapalıysa aç
        if (!navbarExpanded) {
          handleNavbarToggle();
        }
        return;
      }

      // Dropdown menüler içinde tıklanmışsa kapatma
      if (target.closest('[data-dropdown]')) {
        return;
      }

      // Navbar açıksa ve dışarıya tıklandıysa kapat
      if (navbarExpanded) {
        setNavbarExpanded(false);
        setOpenDropdown(null);
        if (onNavbarToggle) {
          onNavbarToggle(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [navbarExpanded, onNavbarToggle, handleNavbarToggle]);

  // Watchlist coins fetch
  useEffect(() => {
    const fetchWatchlistCoins = async () => {
      try {
        const response = await fetch('/api/watchlist/popular-coins');
        const data = await response.json();
        if (data.coins) {
          setWatchlistCoins(data.coins);
        }
      } catch (error) {
        console.error('Watchlist coins fetch error:', error);
      }
    };

    if (showWatchlistPopup) {
      fetchWatchlistCoins();
    }
  }, [showWatchlistPopup]);

  // AI Panel event listeners
  useEffect(() => {
    const handleAIPanelOpen = (event: CustomEvent) => {
      setShowAIPanel(event.detail.isOpen);
      setSelectedQuestion(event.detail.question || null);
    };

    const handleAIPanelClose = () => {
      setShowAIPanel(false);
      setSelectedQuestion(null);
    };

    window.addEventListener('aiPanelOpen', handleAIPanelOpen as EventListener);
    window.addEventListener('aiPanelClose', handleAIPanelClose as EventListener);

    return () => {
      window.removeEventListener('aiPanelOpen', handleAIPanelOpen as EventListener);
      window.removeEventListener('aiPanelClose', handleAIPanelClose as EventListener);
    };
  }, []);

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]') && !target.closest('[data-dropdown-button]')) {
        setOpenDropdown(null);
      }
      if (!target.closest('[data-profile-menu]') && !target.closest('[data-profile-button]')) {
        setShowProfileMenu(false);
      }
    };

    if (openDropdown || showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown, showProfileMenu]);

  return (
    <>
      {/* DijitalMarketAI Panel */}
      {showAIPanel && (
        <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white border-l border-gray-200 z-50 shadow-xl">
          <DijitalMarketAI
            isOpen={showAIPanel}
            onClose={() => {
              setShowAIPanel(false);
              setSelectedQuestion(null);
              window.dispatchEvent(new CustomEvent('aiPanelClose'));
            }}
            question={selectedQuestion}
          />
        </div>
      )}

      {/* Üst Bar - Logo (sol), Portföy/İzleme Listesi/Arama/Profil (sağ) */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 h-16">
        <div className="flex items-center justify-between h-full px-6">
          {/* Sol taraf - Logo */}
          <Link href="/" className="h-10 flex items-center">
            <Image
              src={logoImage}
              alt="Dijital Market Logo"
              height={40}
              width={180}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Sağ taraf - Portföy, İzleme Listesi, Arama ve Profil */}
          <div className="flex items-center gap-4">
            {/* Portfolio */}
            <Link
              href="/portfolio-landing"
              className="hidden lg:flex items-center gap-2 px-3 py-2 text-gray-700 font-medium transition-all duration-200 rounded-lg hover:bg-[#2563EB] hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm">Portföy</span>
            </Link>

            {/* İzleme Listesi */}
            <div
              className="hidden lg:block relative"
              onMouseEnter={() => {
                if (watchlistPopupTimeout) {
                  clearTimeout(watchlistPopupTimeout);
                  setWatchlistPopupTimeout(null);
                }
                setShowWatchlistPopup(true);
              }}
              onMouseLeave={() => {
                const timeout = setTimeout(() => {
                  setShowWatchlistPopup(false);
                }, 200);
                setWatchlistPopupTimeout(timeout);
              }}
            >
              <Link
                href="/watchlist-landing"
                className="flex items-center gap-2 px-3 py-2 text-gray-700 font-medium transition-all duration-200 rounded-lg hover:bg-[#2563EB] hover:text-white"
              >
                <Star className="w-5 h-5" />
                <span className="text-sm">İzleme Listesi</span>
              </Link>

              {/* Watchlist Popup */}
              {showWatchlistPopup && (
                <div
                  className="absolute top-full left-0 w-80 z-50 mt-2"
                  onMouseEnter={() => {
                    if (watchlistPopupTimeout) {
                      clearTimeout(watchlistPopupTimeout);
                      setWatchlistPopupTimeout(null);
                    }
                    setShowWatchlistPopup(true);
                  }}
                  onMouseLeave={() => {
                    const timeout = setTimeout(() => {
                      setShowWatchlistPopup(false);
                    }, 200);
                    setWatchlistPopupTimeout(timeout);
                  }}
                >
                  <div className="bg-white rounded-xl shadow-2xl border border-gray-200">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                        <h3 className="text-base font-bold text-gray-900">Ana İzleme Listem</h3>
                        <Link
                          href="/watchlist"
                          className="text-xs text-[#2563EB] hover:underline font-semibold"
                          onClick={() => setShowWatchlistPopup(false)}
                        >
                          Tam Görünüm &gt;
                        </Link>
                      </div>

                      <div className="flex gap-1 mb-4 border-b border-gray-200">
                        <button
                          onClick={() => setWatchlistTab('coins')}
                          className={`flex-1 pb-2 text-center text-sm font-medium transition-colors relative ${watchlistTab === 'coins'
                              ? 'text-[#2563EB]'
                              : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          Kripto Paralar
                          {watchlistTab === 'coins' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]"></div>
                          )}
                        </button>
                        <button
                          onClick={() => setWatchlistTab('dexscan')}
                          className={`flex-1 pb-2 text-center text-sm font-medium transition-colors relative ${watchlistTab === 'dexscan'
                              ? 'text-[#2563EB]'
                              : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                          DexScan
                          {watchlistTab === 'dexscan' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]"></div>
                          )}
                        </button>
                      </div>

                      {watchlistTab === 'coins' && (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {watchlistCoins.length > 0 ? (
                            watchlistCoins.slice(0, 5).map((coin: any) => (
                              <Link
                                key={coin.id}
                                href={`/currencies/${coin.id}`}
                                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                onClick={() => setShowWatchlistPopup(false)}
                              >
                                {coin.image && (
                                  <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-gray-900 truncate">{coin.name}</div>
                                  <div className="text-xs text-gray-500 uppercase">{coin.symbol}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-900">
                                    ${coin.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) || 'N/A'}
                                  </div>
                                  <div className={`text-xs ${(coin.price_change_percentage_24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {(coin.price_change_percentage_24h || 0) >= 0 ? '+' : ''}
                                    {(coin.price_change_percentage_24h || 0).toFixed(2)}%
                                  </div>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <div className="text-center py-8 text-gray-500 text-sm">
                              İzleme listeniz boş. Coin eklemek için bir coin sayfasına gidin ve yıldız simgesine tıklayın.
                            </div>
                          )}
                        </div>
                      )}

                      {watchlistTab === 'dexscan' && (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          DexScan verileri yakında gelecek.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Arama Bloğu */}
            <div className="max-w-md">
              <SearchBar />
            </div>

            {/* Profil Fotoğrafı / Giriş Yap */}
            {isMounted && user ? (
              <div className="relative" data-profile-menu>
                <button
                  data-profile-button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm text-gray-700">Merhaba, {user.name || user.full_name || user.email}</span>
                  {user.profile_picture_url ? (
                    <Image
                      src={user.profile_picture_url}
                      alt={user.name || user.full_name || user.email}
                      width={32}
                      height={32}
                      className="rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-200">
                      <span className="text-sm text-gray-600 font-medium">
                        {(user.name || user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>

                {/* Profil Menüsü - Sağ tarafa açılır */}
                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50" data-profile-menu>
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        {user.profile_picture_url ? (
                          <Image
                            src={user.profile_picture_url}
                            alt={user.name || user.full_name || user.email}
                            width={48}
                            height={48}
                            className="rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center border-2 border-gray-200">
                            <span className="text-lg text-gray-600 font-medium">
                              {(user.name || user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{user.name || user.full_name || user.email}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/profilim"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profilim</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors"
              >
                Giriş Yap
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sağ Taraf Navbar - Vertical (Tıklamaya dayalı) */}
      <nav
        ref={navbarRef}
        onClick={(e) => {
          // Sadece navbar'ın kendisine tıklandığında (buton/link değilse) aç
          const target = e.target as HTMLElement;
          if (!navbarExpanded && !target.closest('button') && !target.closest('a')) {
            handleNavbarToggle();
          }
        }}
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] bg-white border-l border-gray-200 z-40 overflow-visible ${navbarExpanded ? 'w-64' : 'w-16'} ${!navbarExpanded ? 'cursor-pointer' : ''}`}
      >
        <div className="flex flex-col gap-1 h-full py-4">
          {/* Kripto Paralar */}
          <div
            className="relative"
            data-dropdown
          >
            <button
              data-dropdown-button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!navbarExpanded) {
                  handleNavbarToggle();
                  // Navbar açıldıktan sonra dropdown'ı aç
                  setTimeout(() => {
                    setOpenDropdown('crypto');
                  }, 100);
                } else {
                  setOpenDropdown(prev => prev === 'crypto' ? null : 'crypto');
                }
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${navbarExpanded ? 'justify-start' : 'justify-center'}`}
              title="Kripto Paralar"
            >
              <Coins className="w-5 h-5 shrink-0" />
              {navbarExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">Kripto Paralar</span>
              )}
            </button>
            {openDropdown === 'crypto' && navbarExpanded && (
              <div
                className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                data-dropdown="crypto"
              >
                <Link href="/currencies/ranking" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <TrendingUp className="w-4 h-4" />
                  <span>Piyasa Değerine Göre</span>
                </Link>
                <Link href="/currencies/recently-added" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Sparkles className="w-4 h-4" />
                  <span>En Son Eklenenler</span>
                </Link>
                <Link href="/categories" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Layers className="w-4 h-4" />
                  <span>Kategoriler</span>
                </Link>
                <Link href="/spotlight" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Target className="w-4 h-4" />
                  <span>Vurgular</span>
                </Link>
                <Link href="/gainers-losers" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Kazandıran ve Kaybettirenler</span>
                </Link>
                <Link href="/global-charts" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Globe className="w-4 h-4" />
                  <span>Küresel Grafikler</span>
                </Link>
                <Link href="/historical-snapshots" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Database className="w-4 h-4" />
                  <span>Geçmiş Veriler</span>
                </Link>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-4 py-1">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Zincir Verileri</span>
                </div>
                <Link href="/chains" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Database className="w-4 h-4" />
                  <span>Zincirler</span>
                </Link>
                <Link href="/crypto-treasuries" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Wallet className="w-4 h-4" />
                  <span>Kripto Para Hazineleri</span>
                </Link>
              </div>
            )}
          </div>

          {/* Borsalar */}
          <div
            className="relative"
            data-dropdown
          >
            <button
              data-dropdown-button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!navbarExpanded) {
                  handleNavbarToggle();
                  setTimeout(() => {
                    setOpenDropdown('exchanges');
                  }, 100);
                } else {
                  setOpenDropdown(prev => prev === 'exchanges' ? null : 'exchanges');
                }
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${navbarExpanded ? 'justify-start' : 'justify-center'}`}
              title="Borsalar"
            >
              <Building2 className="w-5 h-5 shrink-0" />
              {navbarExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">Borsalar</span>
              )}
            </button>
            {openDropdown === 'exchanges' && navbarExpanded && (
              <div
                className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                data-dropdown="exchanges"
              >
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Coins className="w-4 h-4" />
                  <span>Kripto Paralar</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Building2 className="w-4 h-4" />
                  <span>Merkezi Borsalar</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Database className="w-4 h-4" />
                  <span>Merkezi Olmayan Borsalar</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <BarChart className="w-4 h-4" />
                  <span>Türevler</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Sürekli Dexler</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Target className="w-4 h-4" />
                  <span>Tahmin Piyasaları</span>
                </Link>
              </div>
            )}
          </div>

          {/* Öğren */}
          <div
            className="relative"
            data-dropdown
          >
            <button
              data-dropdown-button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!navbarExpanded) {
                  handleNavbarToggle();
                  setTimeout(() => {
                    setOpenDropdown('learn');
                  }, 100);
                } else {
                  setOpenDropdown(prev => prev === 'learn' ? null : 'learn');
                }
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${navbarExpanded ? 'justify-start' : 'justify-center'}`}
              title="Öğren"
            >
              <BookOpen className="w-5 h-5 shrink-0" />
              {navbarExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">Öğren</span>
              )}
            </button>
            {openDropdown === 'learn' && navbarExpanded && (
              <div
                className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                data-dropdown="learn"
              >
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <BookOpen className="w-4 h-4" />
                  <span>Kripto Öğren</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Search className="w-4 h-4" />
                  <span>Araştırma</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Lightbulb className="w-4 h-4" />
                  <span>İç Görüleri</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Newspaper className="w-4 h-4" />
                  <span>Haberler</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <FileText className="w-4 h-4" />
                  <span>Raporlar</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <GraduationCap className="w-4 h-4" />
                  <span>Öğren ve Kazan</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Video className="w-4 h-4" />
                  <span>Videolar</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  <span>Bülten</span>
                </Link>
              </div>
            )}
          </div>

          {/* Ürünler */}
          <div
            className="relative"
            data-dropdown
          >
            <button
              data-dropdown-button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!navbarExpanded) {
                  handleNavbarToggle();
                  setTimeout(() => {
                    setOpenDropdown('products');
                  }, 100);
                } else {
                  setOpenDropdown(prev => prev === 'products' ? null : 'products');
                }
              }}
              className={`w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${navbarExpanded ? 'justify-start' : 'justify-center'}`}
              title="Ürünler"
            >
              <Briefcase className="w-5 h-5 shrink-0" />
              {navbarExpanded && (
                <span className="text-sm font-medium whitespace-nowrap">Ürünler</span>
              )}
            </button>
            {openDropdown === 'products' && navbarExpanded && (
              <div
                className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50"
                data-dropdown="products"
              >
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Wallet className="w-4 h-4" />
                  <span>Kripto Portföy</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <BarChart3 className="w-4 h-4" />
                  <span>Veriyor Uygulama</span>
                </Link>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Crown className="w-4 h-4" />
                  <span>Premium</span>
                </Link>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-4 py-1">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Reklam</span>
                </div>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-4 py-1">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Geliştiriciler</span>
                </div>
                <Link href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                  <Database className="w-4 h-4" />
                  <span>Kayıtlı Vücut</span>
                </Link>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="px-4 py-1">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Dijital Marketin Terminal</span>
                </div>
              </div>
            )}
          </div>

          {/* Topluluk */}
          <Link
            href="/topluluk"
            onClick={(e) => {
              if (!navbarExpanded) {
                e.preventDefault();
                handleNavbarToggle();
              } else {
                setOpenDropdown(null);
              }
            }}
            className={`w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${navbarExpanded ? 'justify-start' : 'justify-center'}`}
            title="Topluluk"
          >
            <Users className="w-5 h-5 shrink-0" />
            {navbarExpanded && (
              <span className="text-sm font-medium whitespace-nowrap">Topluluk</span>
            )}
          </Link>

          {/* Dijital Marketim AI */}
          <Link
            href="/ai-chat"
            onClick={(e) => {
              if (!navbarExpanded) {
                e.preventDefault();
                handleNavbarToggle();
              } else {
                setOpenDropdown(null);
              }
            }}
            className={`w-full px-4 py-3 flex items-center gap-3 text-white hover:opacity-90 transition-colors cursor-pointer bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 ${navbarExpanded ? 'justify-start' : 'justify-center'}`}
            title="Dijital Marketim AI"
          >
            <Sparkles className="w-5 h-5 shrink-0" />
            {navbarExpanded && (
              <span className="text-sm font-medium whitespace-nowrap">Dijital Marketim AI</span>
            )}
          </Link>

          {/* Navbar Kapatma Butonu - Sadece açıkken görünür */}
          {navbarExpanded && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavbarToggle();
              }}
              className="w-full px-4 py-3 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer justify-start mt-auto"
              title="Navbar'ı Kapat"
            >
              <X className="w-5 h-5 shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">Kapat</span>
            </button>
          )}
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </>
  );
};

export default Navbar;
