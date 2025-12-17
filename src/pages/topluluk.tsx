import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface TrendingCoin {
  rank: number;
  id: string;
  name: string;
  symbol: string;
  image: string;
  market_cap: number;
  current_price: number;
  price_change_percentage_24h: number;
}

interface HotTopic {
  title: string;
  description?: string;
  image?: string;
  coin?: string;
  coinIcon?: string;
  author?: string;
  authorImage?: string;
  likeCount?: number;
  commentCount?: number;
}

interface Event {
  id: number;
  title: string;
  description?: string;
  event_datetime: string;
  reminder_count: number;
  presenter_name?: string;
  presenter_image?: string;
}

interface Influencer {
  rank: number;
  id: number;
  name: string;
  email: string;
  profile_picture?: string;
  is_verified: boolean;
  follower_count: number;
  post_count: number;
}

interface Post {
  id: number;
  user_id: number;
  content_text: string;
  image_url?: string;
  post_type: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  view_count: number;
  user_name: string;
  user_email: string;
  profile_picture_url?: string;
  is_verified: boolean;
}

const ToplulukPage: React.FC = () => {
  const [trendingCoins, setTrendingCoins] = useState<TrendingCoin[]>([]);
  const [hotTopic, setHotTopic] = useState<HotTopic | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [selectedTab, setSelectedTab] = useState<'trending' | 'top' | 'watchlist'>('trending');
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showPostModal, setShowPostModal] = useState(false);

  useEffect(() => {
    fetchData();
    fetchPosts();
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

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/community/posts');
      const data = await response.json();
      if (data.posts) {
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Posts fetch error:', error);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trendingRes, hotTopicRes, eventsRes, influencersRes] = await Promise.all([
        fetch('/api/community/trending'),
        fetch('/api/community/hot-topic'),
        fetch('/api/community/events'),
        fetch('/api/community/influencers'),
      ]);

      const [trendingData, hotTopicData, eventsData, influencersData] = await Promise.all([
        trendingRes.json(),
        hotTopicRes.json(),
        eventsRes.json(),
        influencersRes.json(),
      ]);

      if (trendingData.coins) setTrendingCoins(trendingData.coins);
      if (hotTopicData.topic) setHotTopic(hotTopicData.topic);
      if (eventsData.events) setEvents(eventsData.events);
      if (influencersData.influencers) setInfluencers(influencersData.influencers);
    } catch (error) {
      console.error('Data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPrice = (value: number): string => {
    if (value >= 1) {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${value.toFixed(6)}`;
  };

  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk`;
    if (diffHours < 24) return `${diffHours} sa`;
    if (diffDays < 7) return `${diffDays} g`;
    
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${day} ${month}`;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPostImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !postContent.trim()) return;

    setIsPosting(true);
    try {
      let imageUrl = null;
      
      if (postImage) {
        // Görsel yükleme için FormData kullan
        const formData = new FormData();
        formData.append('image', postImage);
        
        // Not: Gerçek uygulamada görseli bir storage servisine (S3, Cloudinary, vb.) yüklemeniz gerekir
        // Şimdilik base64 olarak kaydediyoruz
        imageUrl = postImagePreview;
      }

      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          content_text: postContent,
          image_url: imageUrl,
          post_type: postImage ? 'image' : 'text',
        }),
      });

      if (response.ok) {
        setPostContent('');
        setPostImage(null);
        setPostImagePreview(null);
        setShowPostModal(false);
        fetchPosts();
      }
    } catch (error) {
      console.error('Post create error:', error);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Topluluk | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="flex w-full">
        {/* Sol Sidebar - Trending Coins */}
        <aside className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-semibold text-gray-700">
                Gösterilen Paylaşımlar:
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedTab('trending')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedTab === 'trending'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Trend
              </button>
              <button
                onClick={() => setSelectedTab('top')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedTab === 'top'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                En İyi
              </button>
              <button
                onClick={() => setSelectedTab('watchlist')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedTab === 'watchlist'
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                İzleme Listesi
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-gray-500 py-8">Yükleniyor...</div>
          ) : (
            <div className="space-y-2">
              {trendingCoins.map((coin) => (
                <div
                  key={coin.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <span className="text-xs text-gray-500 font-medium w-6">{coin.rank}</span>
                  {coin.image && (
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <Image
                        src={coin.image}
                        alt={coin.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {coin.symbol}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{coin.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-gray-900">
                      {formatCurrency(coin.market_cap)}
                    </div>
                    <div className="text-xs text-gray-600">{formatPrice(coin.current_price)}</div>
                    <div
                      className={`text-xs font-medium ${
                        coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {coin.price_change_percentage_24h >= 0 ? '▲' : '▼'}{' '}
                      {formatPercentage(coin.price_change_percentage_24h)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Orta Kısım - Feed */}
        <main className="flex-1 p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Post Listesi */}
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                    <div className="flex items-start gap-3 mb-3">
                      {post.profile_picture_url ? (
                        <Image
                          src={post.profile_picture_url}
                          alt={post.user_name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 font-medium">
                            {post.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{post.user_name}</span>
                          {post.is_verified && (
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className="text-xs text-gray-500">{formatDate(post.created_at)}</span>
                        </div>
                        <p className="text-gray-900 whitespace-pre-wrap">{post.content_text}</p>
                        {post.image_url && (
                          <div className="mt-3 rounded-lg overflow-hidden">
                            <Image
                              src={post.image_url}
                              alt="Post image"
                              width={600}
                              height={400}
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100">
                          <button className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span className="text-sm">{post.like_count}</span>
                          </button>
                          <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <span className="text-sm">{post.comment_count}</span>
                          </button>
                          <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            <span className="text-sm">Paylaş</span>
                          </button>
                          <div className="ml-auto text-xs text-gray-500">
                            {post.view_count.toLocaleString()} görüntüleme
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <p className="text-gray-500">Henüz paylaşım yok. İlk paylaşımı siz yapın!</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Sağ Sidebar */}
        <aside className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {/* Hot Topic */}
          {hotTopic && (
            <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-sm font-bold text-gray-900">Sıcak Konu</h3>
                <span className="text-xs text-gray-500 ml-auto">&gt;</span>
              </div>
              {hotTopic.image && (
                <div className="mb-3 rounded-lg overflow-hidden">
                  <Image
                    src={hotTopic.image}
                    alt={hotTopic.title}
                    width={300}
                    height={150}
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
              <h4 className="text-sm font-semibold text-gray-900 mb-2">{hotTopic.title}</h4>
              {hotTopic.coin && (
                <div className="flex items-center gap-2 mb-3">
                  {hotTopic.coinIcon && (
                    <Image
                      src={hotTopic.coinIcon}
                      alt={hotTopic.coin}
                      width={20}
                      height={20}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-xs font-medium text-gray-700">{hotTopic.coin}</span>
                </div>
              )}
              <button className="w-full px-4 py-2 bg-[#2563EB] hover:bg-[#1E40AF] text-white text-sm font-medium rounded-lg transition-colors">
                İncele
              </button>
            </div>
          )}

          {/* Upcoming Lives */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-sm font-bold text-gray-900">Yaklaşan Canlı Yayınlar</h3>
              <span className="text-xs text-gray-500 ml-auto">&gt;</span>
            </div>
            {loading ? (
              <div className="text-center text-gray-500 py-4 text-xs">Yükleniyor...</div>
            ) : events.length > 0 ? (
              <div className="space-y-3">
                {events.slice(0, 3).map((event) => (
                  <div key={event.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      {formatDate(event.event_datetime)} | {event.reminder_count} katılımcı
                    </p>
                    <button className="text-xs text-[#2563EB] hover:underline font-medium">
                      Hatırlatıcı Ayarla
                    </button>
                  </div>
                ))}
                {events.length > 3 && (
                  <div className="text-center text-xs text-gray-500 pt-2">
                    &lt; 1/{Math.ceil(events.length / 3)} &gt;
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4 text-xs">
                Yaklaşan etkinlik yok
              </div>
            )}
          </div>

          {/* Top Influencers */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">En İyi Etkileyiciler</h3>
            {loading ? (
              <div className="text-center text-gray-500 py-4 text-xs">Yükleniyor...</div>
            ) : influencers.length > 0 ? (
              <div className="space-y-3">
                {influencers.map((influencer) => (
                  <div
                    key={influencer.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-gray-500 font-medium w-6">{influencer.rank}</span>
                    {influencer.profile_picture ? (
                      <div className="relative w-8 h-8 flex-shrink-0">
                        <Image
                          src={influencer.profile_picture}
                          alt={influencer.name}
                          width={32}
                          height={32}
                          className="rounded-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-600 font-medium">
                          {influencer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {influencer.name}
                        </span>
                        {influencer.is_verified && (
                          <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {influencer.follower_count.toLocaleString()} Takipçi
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4 text-xs">
                Henüz etkileyici yok
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Floating Post Now Button */}
      <button
        onClick={() => {
          if (user) {
            setShowPostModal(true);
          } else {
            // Giriş modalını aç (Navbar'dan erişilebilir)
            const event = new CustomEvent('openAuthModal', { detail: { mode: 'login' } });
            window.dispatchEvent(event);
          }
        }}
        className="fixed bottom-8 right-8 bg-[#2563EB] hover:bg-[#1E40AF] text-white rounded-full shadow-2xl flex items-center gap-2 px-6 py-3 transition-all hover:scale-105 z-50"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="font-semibold">Post now</span>
      </button>

      {/* Post Paylaşma Modalı */}
      {showPostModal && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={() => setShowPostModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Yeni Paylaşım</h2>
                <button
                  onClick={() => {
                    setShowPostModal(false);
                    setPostContent('');
                    setPostImage(null);
                    setPostImagePreview(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex items-start gap-3 mb-4">
                {user.profile_picture_url ? (
                  <Image
                    src={user.profile_picture_url}
                    alt={user.full_name || user.email}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 font-medium">
                      {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Borsa hakkında görüşlerinizi paylaşın..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none"
                    rows={4}
                  />
                  {postImagePreview && (
                    <div className="mt-3 relative">
                      <Image
                        src={postImagePreview}
                        alt="Preview"
                        width={500}
                        height={300}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setPostImage(null);
                          setPostImagePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#2563EB] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm">Fotoğraf</span>
                </label>
                <button
                  onClick={handlePostSubmit}
                  disabled={!postContent.trim() || isPosting}
                  className="bg-[#2563EB] hover:bg-[#1E40AF] text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPosting ? 'Paylaşılıyor...' : 'Paylaş'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToplulukPage;
