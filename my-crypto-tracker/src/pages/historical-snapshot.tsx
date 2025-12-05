import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface HistoricalCoin {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  current_price: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d: number;
  market_cap_rank: number;
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

const HistoricalSnapshotPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Bugünün tarihini varsayılan olarak ayarla (format: YYYY-MM-DD)
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const [displayDate, setDisplayDate] = useState<string>('');
  const [coins, setCoins] = useState<HistoricalCoin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<number>(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(() => new Date().getFullYear());
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

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchHistoricalData(selectedDate);
      // Takvimi seçilen tarihe göre güncelle
      const [year, month] = selectedDate.split('-');
      setCalendarYear(parseInt(year));
      setCalendarMonth(parseInt(month) - 1);
    }
  }, [selectedDate]);

  const fetchHistoricalData = async (date: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Tarihi dd-mm-yyyy formatına çevir
      const [year, month, day] = date.split('-');
      const formattedDate = `${day}-${month}-${year}`;
      
      const response = await fetch(`/api/historical-snapshot?date=${formattedDate}`);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setCoins([]);
      } else if (data.coins && Array.isArray(data.coins)) {
        setCoins(data.coins);
        setDisplayDate(formattedDate);
      } else {
        setCoins([]);
      }
    } catch (error) {
      console.error('Geçmiş veriler çekilemedi:', error);
      setError('Geçmiş veriler çekilemedi. Lütfen tekrar deneyin.');
      setCoins([]);
    } finally {
      setLoading(false);
    }
  };

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

  const formatCurrency = (amount: number) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(2)}T`;
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(2)}M`;
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toLocaleString();
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split('-');
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return `${day} ${months[parseInt(month) - 1]} ${year}`;
  };

  const navigateDate = (days: number) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + days);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    setCalendarMonth(currentDate.getMonth());
    setCalendarYear(currentDate.getFullYear());
  };

  const navigateMonth = (direction: number) => {
    setCalendarMonth((prev) => {
      let newMonth = prev + direction;
      let newYear = calendarYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      setCalendarYear(newYear);
      return newMonth;
    });
  };


  const handleDateSelect = (day: number) => {
    const year = calendarYear;
    const month = String(calendarMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    
    // Bugünden sonraki tarihleri seçilemez yap
    const today = new Date().toISOString().split('T')[0];
    if (dateStr <= today) {
      setSelectedDate(dateStr);
      setShowCalendar(false);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      calendarMonth === today.getMonth() &&
      calendarYear === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    const [year, month, dayStr] = selectedDate.split('-');
    return (
      day === parseInt(dayStr) &&
      calendarMonth === parseInt(month) - 1 &&
      calendarYear === parseInt(year)
    );
  };

  const isDisabled = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0];
    const minDate = '2013-05-01';
    return dateStr > today || dateStr < minDate;
  };

  // Maksimum tarih bugün olmalı
  const today = new Date().toISOString().split('T')[0];
  const minDate = '2013-05-01'; // CoinGecko'nun başlangıç tarihi

  const monthNames = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
  const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar marketStats={marketStats} />
      
      <div className="py-8">
        <div className="w-full">
          {/* Başlık ve Tarih Seçimi */}
          <div className="mb-8 px-6">
            <h1 className="text-5xl font-bold text-gray-900 mb-6 text-center">Geçmiş Anlık Görüntüler</h1>
            
            {/* Tarih Gösterimi ve Seç Butonu - Ortalanmış */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-2">Seçilen Tarih</div>
                <div className="text-3xl font-bold text-gray-900">
                  {displayDate ? formatDateForDisplay(displayDate) : formatDateForDisplay(selectedDate.split('-').reverse().join('-'))}
                </div>
              </div>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="px-8 py-4 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {showCalendar ? 'Takvimi Kapat' : 'Tarih Seç'}
              </button>
            </div>
            
            {/* Modern Tarih Seçici */}
            {showCalendar && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100 max-w-2xl mx-auto">

              {/* Hafta Navigasyonu */}
              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => navigateDate(-7)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all text-sm"
                >
                  ← Önceki Hafta
                </button>
                <button
                  onClick={() => navigateDate(7)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={selectedDate >= today}
                >
                  Sonraki Hafta →
                </button>
              </div>

              {/* Takvim */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                  <div className="max-w-md mx-auto">
                    {/* Ay ve Yıl Navigasyonu */}
                    <div className="flex items-center justify-between mb-4">
                      <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <div className="flex items-center gap-4">
                        <select
                          value={calendarMonth}
                          onChange={(e) => setCalendarMonth(parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-semibold text-gray-900"
                        >
                          {monthNames.map((month, index) => (
                            <option key={index} value={index}>
                              {month}
                            </option>
                          ))}
                        </select>
                        <select
                          value={calendarYear}
                          onChange={(e) => setCalendarYear(parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-semibold text-gray-900"
                        >
                          {Array.from({ length: new Date().getFullYear() - 2012 }, (_, i) => 2013 + i)
                            .reverse()
                            .map((year) => (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            ))}
                        </select>
                      </div>
                      <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-all"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Gün İsimleri */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {dayNames.map((day, index) => (
                        <div
                          key={index}
                          className="text-center text-xs font-semibold text-gray-600 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Takvim Günleri */}
                    <div className="grid grid-cols-7 gap-1">
                      {emptyDays.map((_, index) => (
                        <div key={`empty-${index}`} className="aspect-square"></div>
                      ))}
                      {days.map((day) => {
                        const disabled = isDisabled(day);
                        const selected = isSelected(day);
                        const todayDate = isToday(day);
                        return (
                          <button
                            key={day}
                            onClick={() => !disabled && handleDateSelect(day)}
                            disabled={disabled}
                            className={`
                              aspect-square rounded-lg transition-all text-sm font-medium
                              ${disabled
                                ? 'text-gray-300 cursor-not-allowed'
                                : selected
                                ? 'bg-[#2563EB] text-white shadow-md'
                                : todayDate
                                ? 'bg-blue-50 text-[#2563EB] font-bold border-2 border-[#2563EB]'
                                : 'text-gray-700 hover:bg-gray-100'
                              }
                            `}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Filtreler */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 mx-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Filtreler:</span>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                Market Cap: Tümü
              </button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                Fiyat: Tümü
              </button>
              <button className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all">
                Hacim (24s): Tümü
              </button>
            </div>
          </div>

          {/* Coin Listesi */}
          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center mx-6">
              <div className="text-gray-500">Yükleniyor...</div>
              <div className="text-sm text-gray-400 mt-2">Geçmiş veriler çekiliyor, lütfen bekleyin...</div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center mx-6">
              <div className="text-red-600 font-semibold mb-2">Hata</div>
              <div className="text-gray-600">{error}</div>
            </div>
          ) : coins.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center mx-6">
              <div className="text-gray-500">Bu tarih için veri bulunamadı.</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mx-6">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-xs font-semibold text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="py-4 px-6 text-left">Sıra</th>
                      <th scope="col" className="py-4 px-6 text-left">İsim</th>
                      <th scope="col" className="py-4 px-6 text-right">Piyasa Değeri</th>
                      <th scope="col" className="py-4 px-6 text-right">Fiyat</th>
                      <th scope="col" className="py-4 px-6 text-right">Dolaşımdaki Arz</th>
                      <th scope="col" className="py-4 px-6 text-right">% 1s</th>
                      <th scope="col" className="py-4 px-6 text-right">% 24s</th>
                      <th scope="col" className="py-4 px-6 text-right">% 7g</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.map((coin) => (
                      <tr
                        key={coin.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 text-gray-500 font-medium">{coin.market_cap_rank}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
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
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600">
                                {coin.symbol.substring(0, 2)}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <Link
                                href={`/currencies/${coin.id}`}
                                className="font-semibold text-gray-900 hover:text-[#2563EB] hover:underline"
                              >
                                {coin.name}
                              </Link>
                              <span className="text-xs text-gray-500 uppercase">{coin.symbol}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(coin.market_cap)}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(coin.current_price)}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="text-gray-700">
                            {formatNumber(coin.circulating_supply)} {coin.symbol}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="text-gray-600">-</span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span
                            className={`font-semibold ${
                              coin.price_change_percentage_24h >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'}
                            {formatPercentage(coin.price_change_percentage_24h)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span
                            className={`font-semibold ${
                              coin.price_change_percentage_7d >= 0
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {coin.price_change_percentage_7d >= 0 ? '▲' : '▼'}
                            {formatPercentage(coin.price_change_percentage_7d)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
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
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Hakkımızda</a>
                  </li>
                </ul>
              </div>

              {/* Topluluk */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Topluluk</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Telegram</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Discord</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Twitter</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Reddit</a>
                  </li>
                </ul>
              </div>

              {/* Yasal */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Yasal</h3>
                <ul className="space-y-2">
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Kullanım Şartları</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Gizlilik Politikası</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Çerez Politikası</a>
                  </li>
                  <li>
                    <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Yasal Uyarı</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

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

export default HistoricalSnapshotPage;
