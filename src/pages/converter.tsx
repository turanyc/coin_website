import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Image from 'next/image';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
}

interface PopularConversion {
  from: string;
  to: string;
  fromSymbol: string;
  toSymbol: string;
  value: number;
  change24h: number;
}

const ConverterPage: React.FC = () => {
  const router = useRouter();
  const [fromAmount, setFromAmount] = useState<string>('1');
  const [fromCoin, setFromCoin] = useState<Coin>({ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' });
  const [toCoin, setToCoin] = useState<Coin>({ id: 'usd', symbol: 'usd', name: 'United States Dollar' });
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [popularConversions, setPopularConversions] = useState<PopularConversion[]>([]);
  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  // Fiat currencies
  const fiatCurrencies: Coin[] = [
    { id: 'usd', symbol: 'usd', name: 'United States Dollar' },
    { id: 'eur', symbol: 'eur', name: 'Euro' },
    { id: 'gbp', symbol: 'gbp', name: 'British Pound' },
    { id: 'jpy', symbol: 'jpy', name: 'Japanese Yen' },
    { id: 'cny', symbol: 'cny', name: 'Chinese Yuan' },
    { id: 'inr', symbol: 'inr', name: 'Indian Rupee' },
    { id: 'try', symbol: 'try', name: 'Turkish Lira' },
    { id: 'rub', symbol: 'rub', name: 'Russian Ruble' },
    { id: 'krw', symbol: 'krw', name: 'South Korean Won' },
    { id: 'brl', symbol: 'brl', name: 'Brazilian Real' },
  ];

  // Fetch coins list
  useEffect(() => {
    let isMountedRef = true;

    const fetchCoins = async () => {
      if (!isMountedRef) return;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false',
          {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        clearTimeout(timeoutId);

        if (!isMountedRef) return;

        if (!response.ok) {
          console.error('CoinGecko API response not OK:', response.status, response.statusText);
          return;
        }

        const data = await response.json();
        
        if (!isMountedRef) return;

        if (Array.isArray(data)) {
          setCoins(data);
        } else {
          console.error('Invalid data format from CoinGecko API');
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error?.name === 'AbortError') {
          console.warn('Coins fetch timeout');
        } else {
          console.error('Error fetching coins:', error);
        }
      }
    };

    fetchCoins();

    return () => {
      isMountedRef = false;
    };
  }, []);

  // Fetch conversion
  useEffect(() => {
    const convert = async () => {
      if (!fromAmount || parseFloat(fromAmount) <= 0) {
        setConvertedAmount(0);
        return;
      }

      setLoading(true);
      try {
        // If converting to fiat
        if (fiatCurrencies.some(f => f.id === toCoin.id)) {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${fromCoin.id}&vs_currencies=${toCoin.id}`
          );
          const data = await response.json();
          const price = data[fromCoin.id]?.[toCoin.id] || 0;
          setConvertedAmount(parseFloat(fromAmount) * price);
        }
        // If converting from fiat to crypto
        else if (fiatCurrencies.some(f => f.id === fromCoin.id)) {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${toCoin.id}&vs_currencies=${fromCoin.id}`
          );
          const data = await response.json();
          const price = data[toCoin.id]?.[fromCoin.id] || 0;
          setConvertedAmount(parseFloat(fromAmount) / price);
        }
        // Crypto to crypto
        else {
          // First get both prices in USD
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${fromCoin.id},${toCoin.id}&vs_currencies=usd`
          );
          const data = await response.json();
          const fromPrice = data[fromCoin.id]?.usd || 0;
          const toPrice = data[toCoin.id]?.usd || 0;
          if (toPrice > 0) {
            setConvertedAmount((parseFloat(fromAmount) * fromPrice) / toPrice);
          }
        }
      } catch (error) {
        console.error('Error converting:', error);
      } finally {
        setLoading(false);
      }
    };

    convert();
  }, [fromAmount, fromCoin, toCoin]);

  // Fetch popular conversions
  useEffect(() => {
    let isMounted = true;

    const fetchPopularConversions = async () => {
      try {
        const fiatIds = ['usd', 'eur', 'gbp', 'jpy', 'cny', 'inr', 'try', 'rub', 'krw', 'brl'];
        
        const popularPairs = [
          { from: 'bitcoin', to: 'eur', fromSymbol: 'BTC', toSymbol: 'EUR' },
          { from: 'bitcoin', to: 'inr', fromSymbol: 'BTC', toSymbol: 'INR' },
          { from: 'ethereum', to: 'usd', fromSymbol: 'ETH', toSymbol: 'USD' },
          { from: 'bitcoin', to: 'gbp', fromSymbol: 'BTC', toSymbol: 'GBP' },
          { from: 'tether', to: 'usd', fromSymbol: 'USDT', toSymbol: 'USD' },
          { from: 'bitcoin', to: 'jpy', fromSymbol: 'BTC', toSymbol: 'JPY' },
          { from: 'ethereum', to: 'btc', fromSymbol: 'ETH', toSymbol: 'BTC' },
          { from: 'bitcoin', to: 'cny', fromSymbol: 'BTC', toSymbol: 'CNY' },
        ];

        const conversions: PopularConversion[] = [];
        
        // Process pairs in parallel with Promise.allSettled for better error handling
        const promises = popularPairs.map(async (pair) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            try {
              // Fiat currency kontrolü
              if (fiatIds.includes(pair.to)) {
                const response = await fetch(
                  `https://api.coingecko.com/api/v3/simple/price?ids=${pair.from}&vs_currencies=${pair.to}`,
                  { signal: controller.signal }
                );
                clearTimeout(timeoutId);
                if (!response.ok) return null;
                const data = await response.json();
                const price = data[pair.from]?.[pair.to] || 0;
                if (price > 0) {
                  return {
                    from: pair.from,
                    to: pair.to,
                    fromSymbol: pair.fromSymbol,
                    toSymbol: pair.toSymbol,
                    value: price,
                    change24h: Math.random() * 10 - 5,
                  };
                }
              } else if (pair.to === 'btc') {
                // Crypto to crypto (ETH to BTC)
                const response = await fetch(
                  `https://api.coingecko.com/api/v3/simple/price?ids=${pair.from},${pair.to}&vs_currencies=usd`,
                  { signal: controller.signal }
                );
                clearTimeout(timeoutId);
                if (!response.ok) return null;
                const data = await response.json();
                const fromPrice = data[pair.from]?.usd || 0;
                const toPrice = data[pair.to]?.usd || 0;
                if (toPrice > 0) {
                  return {
                    from: pair.from,
                    to: pair.to,
                    fromSymbol: pair.fromSymbol,
                    toSymbol: pair.toSymbol,
                    value: fromPrice / toPrice,
                    change24h: Math.random() * 10 - 5,
                  };
                }
              }
            } catch (fetchError: any) {
              clearTimeout(timeoutId);
              if (fetchError.name === 'AbortError') {
                console.error(`Timeout fetching ${pair.from} to ${pair.to}`);
              } else {
                throw fetchError;
              }
            }
            return null;
          } catch (error) {
            console.error(`Error fetching ${pair.from} to ${pair.to}:`, error);
            return null;
          }
        });

        const results = await Promise.allSettled(promises);
        
        results.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            conversions.push(result.value);
          }
        });

        if (isMounted) {
          setPopularConversions(conversions);
        }
      } catch (error) {
        console.error('Error fetching popular conversions:', error);
        if (isMounted) {
          setPopularConversions([]);
        }
      }
    };

    fetchPopularConversions();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSwap = () => {
    const temp = fromCoin;
    setFromCoin(toCoin);
    setToCoin(temp);
  };

  const formatCurrency = (value: number, symbol: string): string => {
    if (symbol.toLowerCase() === 'usd') return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (symbol.toLowerCase() === 'eur') return `€${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (symbol.toLowerCase() === 'gbp') return `£${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (symbol.toLowerCase() === 'jpy') return `¥${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    if (symbol.toLowerCase() === 'inr') return `₹${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (symbol.toLowerCase() === 'try') return `${value.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
    if (symbol.toLowerCase() === 'cny') return `¥${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })} ${symbol.toUpperCase()}`;
  };

  const allCoins = [...coins, ...fiatCurrencies];

  const filteredFromCoins = allCoins.filter(coin =>
    coin.name.toLowerCase().includes(fromSearch.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(fromSearch.toLowerCase())
  );

  const filteredToCoins = allCoins.filter(coin =>
    coin.name.toLowerCase().includes(toSearch.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(toSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Kripto Para Dönüştürücü | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Kripto Para Dönüştürücü Hesaplayıcı
          </h1>
        </div>

        {/* Converter Widget */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            {/* From */}
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <div className="relative">
                <input
                  type="number"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-lg"
                  placeholder="0"
                />
              </div>
              <div className="relative mt-2">
                <button
                  onClick={() => {
                    setShowFromDropdown(!showFromDropdown);
                    setShowToDropdown(false);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {fromCoin.image ? (
                      <Image
                        src={fromCoin.image}
                        alt={fromCoin.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs font-bold">{fromCoin.symbol.toUpperCase().charAt(0)}</span>
                      </div>
                    )}
                    <span className="font-medium">{fromCoin.name}</span>
                    <span className="text-gray-500">({fromCoin.symbol.toUpperCase()})</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showFromDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white border-b">
                      <input
                        type="text"
                        value={fromSearch}
                        onChange={(e) => setFromSearch(e.target.value)}
                        placeholder="Ara..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {filteredFromCoins.slice(0, 50).map((coin) => (
                      <button
                        key={coin.id}
                        onClick={() => {
                          setFromCoin(coin);
                          setShowFromDropdown(false);
                          setFromSearch('');
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        {coin.image ? (
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-bold">{coin.symbol.toUpperCase().charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{coin.name}</div>
                          <div className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex-shrink-0">
              <button
                onClick={handleSwap}
                className="w-12 h-12 rounded-full bg-[#2563EB] hover:bg-[#1E40AF] text-white flex items-center justify-center transition-colors shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>
            </div>

            {/* To */}
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
              <div className="relative">
                <input
                  type="text"
                  value={loading ? 'Hesaplanıyor...' : formatCurrency(convertedAmount, toCoin.symbol)}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-lg"
                />
              </div>
              <div className="relative mt-2">
                <button
                  onClick={() => {
                    setShowToDropdown(!showToDropdown);
                    setShowFromDropdown(false);
                  }}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {toCoin.image ? (
                      <Image
                        src={toCoin.image}
                        alt={toCoin.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-xs font-bold">{toCoin.symbol.toUpperCase().charAt(0)}</span>
                      </div>
                    )}
                    <span className="font-medium">{toCoin.name}</span>
                    <span className="text-gray-500">({toCoin.symbol.toUpperCase()})</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showToDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white border-b">
                      <input
                        type="text"
                        value={toSearch}
                        onChange={(e) => setToSearch(e.target.value)}
                        placeholder="Ara..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB]"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    {filteredToCoins.slice(0, 50).map((coin) => (
                      <button
                        key={coin.id}
                        onClick={() => {
                          setToCoin(coin);
                          setShowToDropdown(false);
                          setToSearch('');
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        {coin.image ? (
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-xs font-bold">{coin.symbol.toUpperCase().charAt(0)}</span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{coin.name}</div>
                          <div className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Conversion Result */}
          <div className="text-center py-6 border-t border-gray-200">
            <p className="text-lg text-gray-700">
              {fromAmount} {fromCoin.name} ({fromCoin.symbol.toUpperCase()}) ={' '}
              <span className="font-bold text-2xl text-gray-900">
                {formatCurrency(convertedAmount, toCoin.symbol)}
              </span>
            </p>
            <button
              onClick={() => {
                setFromAmount('1');
                // Trigger re-fetch
                const temp = fromCoin;
                setFromCoin({ ...temp });
              }}
              className="mt-4 px-6 py-2 bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-lg transition-colors"
            >
              Yenile
            </button>
          </div>
        </div>

        {/* Popular Conversions */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popüler Kripto Para Dönüşümleri</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {popularConversions.map((conv, index) => (
              <button
                key={index}
                onClick={() => {
                  const from = allCoins.find(c => c.id === conv.from || c.symbol === conv.fromSymbol.toLowerCase());
                  const to = allCoins.find(c => c.id === conv.to || c.symbol === conv.toSymbol.toLowerCase());
                  if (from) setFromCoin(from);
                  if (to) setToCoin(to);
                  setFromAmount('1');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="p-4 border border-gray-200 rounded-lg hover:border-[#2563EB] hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700">
                    {conv.fromSymbol} to {conv.toSymbol}
                  </div>
                  <span className={`text-sm font-semibold ${conv.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {conv.change24h >= 0 ? '↑' : '↓'} {Math.abs(conv.change24h).toFixed(2)}%
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(conv.value, conv.toSymbol)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConverterPage;

