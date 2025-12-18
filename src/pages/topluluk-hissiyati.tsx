import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface CoinSentiment {
  coin_id: string;
  coin_name: string;
  coin_symbol: string;
  coin_image: string;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_mentions: number;
  sentiment_score: number;
  sentiment_label: string;
}

interface SentimentData {
  overall: {
    sentiment_score: number;
    sentiment_label: string;
    positive_count: number;
    negative_count: number;
    neutral_count: number;
    total_mentions: number;
  };
  coins: CoinSentiment[];
  top_positive: CoinSentiment[];
  top_negative: CoinSentiment[];
}

const ToplulukHissiyatiPage: React.FC = () => {
  const [data, setData] = useState<SentimentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'positive' | 'negative'>('all');

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 60000); // Her 1 dakikada bir güncelle
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/community-sentiment');
      const result = await response.json();
      if (response.ok && !result.error) {
        setData(result);
      } else {
        console.error('API error:', result.error);
        setData(null);
      }
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (score: number): string => {
    if (score >= 60) return '#10B981'; // Yeşil - Çok Olumlu
    if (score >= 20) return '#84CC16'; // Açık Yeşil - Olumlu
    if (score <= -60) return '#EF4444'; // Kırmızı - Çok Olumsuz
    if (score <= -20) return '#F59E0B'; // Turuncu - Olumsuz
    return '#6B7280'; // Gri - Nötr
  };

  const getSentimentIcon = (label: string) => {
    if (label.includes('Çok Olumlu')) return '🚀';
    if (label.includes('Olumlu')) return '📈';
    if (label.includes('Çok Olumsuz')) return '📉';
    if (label.includes('Olumsuz')) return '⚠️';
    return '➡️';
  };

  const getFilteredCoins = () => {
    if (!data) return [];
    
    let filtered = data.coins.filter(coin => coin.total_mentions > 0);
    
    if (selectedFilter === 'positive') {
      filtered = filtered.filter(coin => coin.sentiment_score > 0);
    } else if (selectedFilter === 'negative') {
      filtered = filtered.filter(coin => coin.sentiment_score < 0);
    }
    
    return filtered.sort((a, b) => b.total_mentions - a.total_mentions);
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Topluluk Hissiyatı - Dijital Market</title>
          <meta name="description" content="Kripto para topluluğunun hissiyat analizi" />
        </Head>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Head>
          <title>Topluluk Hissiyatı - Dijital Market</title>
          <meta name="description" content="Kripto para topluluğunun hissiyat analizi" />
        </Head>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">Veri yüklenirken bir hata oluştu.</p>
            <button
              onClick={fetchData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </>
    );
  }

  const filteredCoins = getFilteredCoins();
  const overallPercentage = data.overall.total_mentions > 0
    ? ((data.overall.positive_count - data.overall.negative_count) / data.overall.total_mentions) * 100
    : 0;

  return (
    <>
      <Head>
        <title>Topluluk Hissiyatı - Dijital Market</title>
        <meta name="description" content="Kripto para topluluğunun hissiyat analizi ve trend analizi" />
      </Head>
      <Navbar />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Topluluk Hissiyatı</h1>
                <p className="text-gray-600 mt-1">Kripto para topluluğunun son 30 günlük hissiyat analizi</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Overall Sentiment Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Genel Hissiyat</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Sentiment Score */}
              <div className="text-center">
                <div className="text-5xl font-bold mb-2" style={{ color: getSentimentColor(data.overall.sentiment_score) }}>
                  {data.overall.sentiment_score > 0 ? '+' : ''}{data.overall.sentiment_score.toFixed(1)}
                </div>
                <div className="text-2xl mb-2">{getSentimentIcon(data.overall.sentiment_label)}</div>
                <div className="text-lg font-semibold text-gray-700">{data.overall.sentiment_label}</div>
                <div className="text-sm text-gray-500 mt-1">Hissiyat Skoru</div>
              </div>

              {/* Mentions Breakdown */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-green-600">Olumlu</span>
                    <span className="text-sm font-semibold text-gray-900">{data.overall.positive_count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${data.overall.total_mentions > 0 ? (data.overall.positive_count / data.overall.total_mentions) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-500">Nötr</span>
                    <span className="text-sm font-semibold text-gray-900">{data.overall.neutral_count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-400 h-2 rounded-full"
                      style={{
                        width: `${data.overall.total_mentions > 0 ? (data.overall.neutral_count / data.overall.total_mentions) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-red-600">Olumsuz</span>
                    <span className="text-sm font-semibold text-gray-900">{data.overall.negative_count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${data.overall.total_mentions > 0 ? (data.overall.negative_count / data.overall.total_mentions) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Total Mentions */}
              <div className="text-center flex flex-col justify-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">{data.overall.total_mentions}</div>
                <div className="text-lg text-gray-600">Toplam Bahis</div>
                <div className="text-sm text-gray-500 mt-2">Son 30 gün içinde</div>
              </div>
            </div>
          </div>

          {/* Top Positive & Negative */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Top Positive */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🚀</span>
                En Olumlu Hissiyat
              </h3>
              <div className="space-y-3">
                {data.top_positive.length > 0 ? (
                  data.top_positive.map((coin, index) => (
                    <Link
                      key={coin.coin_id}
                      href={`/currencies/${coin.coin_id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-lg font-bold text-gray-400 w-6">{index + 1}</div>
                      <Image
                        src={coin.coin_image}
                        alt={coin.coin_name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{coin.coin_name}</div>
                        <div className="text-sm text-gray-500">{coin.coin_symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">+{coin.sentiment_score.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">{coin.total_mentions} bahis</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                )}
              </div>
            </div>

            {/* Top Negative */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📉</span>
                En Olumsuz Hissiyat
              </h3>
              <div className="space-y-3">
                {data.top_negative.length > 0 ? (
                  data.top_negative.map((coin, index) => (
                    <Link
                      key={coin.coin_id}
                      href={`/currencies/${coin.coin_id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="text-lg font-bold text-gray-400 w-6">{index + 1}</div>
                      <Image
                        src={coin.coin_image}
                        alt={coin.coin_name}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{coin.coin_name}</div>
                        <div className="text-sm text-gray-500">{coin.coin_symbol}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{coin.sentiment_score.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">{coin.total_mentions} bahis</div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                )}
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tümü
              </button>
              <button
                onClick={() => setSelectedFilter('positive')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedFilter === 'positive'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Olumlu
              </button>
              <button
                onClick={() => setSelectedFilter('negative')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedFilter === 'negative'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Olumsuz
              </button>
            </div>
          </div>

          {/* Coins List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Kripto Para Hissiyatları</h3>
              <p className="text-sm text-gray-500 mt-1">Topluluk bahislerine göre sıralanmıştır</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sıra</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hissiyat</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bahisler</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dağılım</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCoins.length > 0 ? (
                    filteredCoins.map((coin, index) => (
                      <tr key={coin.coin_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-400">#{index + 1}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/currencies/${coin.coin_id}`}
                            className="flex items-center gap-3"
                          >
                            <Image
                              src={coin.coin_image}
                              alt={coin.coin_name}
                              width={32}
                              height={32}
                              className="rounded-full"
                            />
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{coin.coin_name}</div>
                              <div className="text-xs text-gray-500">{coin.coin_symbol}</div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getSentimentIcon(coin.sentiment_label)}</span>
                            <span className="text-sm font-medium text-gray-900">{coin.sentiment_label}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="text-lg font-bold"
                            style={{ color: getSentimentColor(coin.sentiment_score) }}
                          >
                            {coin.sentiment_score > 0 ? '+' : ''}{coin.sentiment_score.toFixed(1)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{coin.total_mentions}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div className="flex h-full">
                                <div
                                  className="bg-green-500"
                                  style={{
                                    width: `${coin.total_mentions > 0 ? (coin.positive_count / coin.total_mentions) * 100 : 0}%`
                                  }}
                                ></div>
                                <div
                                  className="bg-gray-400"
                                  style={{
                                    width: `${coin.total_mentions > 0 ? (coin.neutral_count / coin.total_mentions) * 100 : 0}%`
                                  }}
                                ></div>
                                <div
                                  className="bg-red-500"
                                  style={{
                                    width: `${coin.total_mentions > 0 ? (coin.negative_count / coin.total_mentions) * 100 : 0}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 ml-2 w-16 text-right">
                              {coin.total_mentions > 0
                                ? `${Math.round((coin.positive_count / coin.total_mentions) * 100)}%`
                                : '0%'}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Filtreye uygun veri bulunamadı
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ToplulukHissiyatiPage;
