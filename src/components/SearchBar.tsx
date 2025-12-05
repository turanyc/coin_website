import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  image: string | null;
}

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className = '' }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<Coin[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Coin listesini yükle
  useEffect(() => {
    const fetchCoins = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/coins');
        if (response.ok) {
          const data = await response.json();
          setCoins(data);
        }
      } catch (error) {
        console.error('Coin listesi yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, []);

  // Arama sorgusuna göre coin'leri filtrele
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCoins([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = coins
      .filter(coin => 
        coin.name.toLowerCase().includes(query) || 
        coin.symbol.toLowerCase().includes(query) ||
        coin.id.toLowerCase().includes(query)
      )
      .slice(0, 8); // En fazla 8 öneri göster

    setFilteredCoins(filtered);
    setShowSuggestions(filtered.length > 0);
  }, [searchQuery, coins]);

  // Dışarı tıklandığında önerileri kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Coin seçildiğinde
  const handleCoinSelect = (coinId: string) => {
    setSearchQuery('');
    setShowSuggestions(false);
    router.push(`/currencies/${coinId}`);
  };

  // Enter tuşuna basıldığında ilk öneriyi seç
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredCoins.length > 0) {
      handleCoinSelect(filteredCoins[0].id);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (filteredCoins.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Coin ara (örn: Bitcoin, BTC, ETH)..."
          className="pl-10 pr-4 py-2.5 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72 bg-gray-50 border border-gray-200 transition-all"
        />
        <svg 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Öneriler Dropdown */}
      {showSuggestions && filteredCoins.length > 0 && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto w-full min-w-[400px]">
          <div className="py-2">
            {filteredCoins.map((coin) => (
              <button
                key={coin.id}
                onClick={() => handleCoinSelect(coin.id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left group"
              >
                {/* Coin Image - Sabit genişlik */}
                <div className="flex-shrink-0">
                  {coin.image ? (
                    <img 
                      src={coin.image} 
                      alt={coin.name}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-400">
                        {coin.symbol.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Coin Info - Esnek genişlik, taşma kontrolü */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span 
                      className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate"
                      title={coin.name}
                    >
                      {coin.name}
                    </span>
                    <span className="text-xs text-gray-500 uppercase flex-shrink-0">
                      {coin.symbol}
                    </span>
                  </div>
                </div>

                {/* Price - Sabit genişlik, sağa hizalı */}
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                    {formatPrice(coin.current_price)}
                  </span>
                </div>

                {/* Arrow Icon - Sabit genişlik */}
                <div className="flex-shrink-0">
                  <svg 
                    className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Yükleniyor durumu */}
      {loading && searchQuery && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4 w-full min-w-[400px]">
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">Yükleniyor...</span>
          </div>
        </div>
      )}

      {/* Sonuç bulunamadı */}
      {searchQuery && !loading && filteredCoins.length === 0 && showSuggestions && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4 w-full min-w-[400px]">
          <div className="text-center text-gray-500 text-sm">
            "{searchQuery}" için sonuç bulunamadı
          </div>
        </div>
      )}
    </div>
  );
}

