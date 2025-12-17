import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isTyping?: boolean;
  displayedContent?: string;
}

interface MarketCoin {
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

interface QuickInsights {
  marketCap: { value: number; change: number };
  volume24h: { value: number; change: number };
  altcoinIndex: { value: number; max: number };
  fearGreed: { value: number; label: string };
}

const AIChatPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState<string>('');
  const [quickInsights, setQuickInsights] = useState<QuickInsights | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Quick Insights verilerini çek
  useEffect(() => {
    const fetchQuickInsights = async () => {
      try {
        // Global market data
        const globalRes = await fetch('/api/global');
        const globalData = await globalRes.json();
        
        // Fear & Greed Index
        const fgRes = await fetch('/api/fear-greed');
        const fgData = await fgRes.json();
        
        // Altcoin Season Index
        let altcoinIndex = 20; // Varsayılan
        try {
          const altcoinRes = await fetch('/api/altcoin-season');
          if (altcoinRes.ok) {
            const altcoinData = await altcoinRes.json();
            altcoinIndex = altcoinData.currentValue || 20;
          }
        } catch (e) {
          // Altcoin API hatası - varsayılan değer kullan
        }
        
        // 24h Volume change hesapla (basit hesaplama)
        const volumeChange = -14.27; // Varsayılan (gerçek API'den alınabilir)
        
        setQuickInsights({
          marketCap: {
            value: globalData.marketCap || 0,
            change: globalData.marketCapChange24h || 0,
          },
          volume24h: {
            value: globalData.volume24h || 0,
            change: volumeChange,
          },
          altcoinIndex: {
            value: altcoinIndex,
            max: 100,
          },
          fearGreed: {
            value: fgData.value || 25,
            label: fgData.classification || 'Fear',
          },
        });
      } catch (error) {
        console.error('Error fetching quick insights:', error);
      }
    };

    fetchQuickInsights();
    const interval = setInterval(fetchQuickInsights, 30000);
    return () => clearInterval(interval);
  }, []);

  // Market verilerini çek
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h',
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const coins: MarketCoin[] = await response.json();
          
          // Null/undefined kontrolü ve güvenli işleme
          if (Array.isArray(coins) && coins.length > 0) {
            const marketSummary = coins
              .map((coin) => {
                try {
                  const change = coin.price_change_percentage_24h || 0;
                  const changeSign = change >= 0 ? '+' : '';
                  const price = coin.current_price || 0;
                  
                  // Güvenli fiyat formatlama
                  let priceStr = 'N/A';
                  if (price > 0 && typeof price === 'number') {
                    try {
                      priceStr = price.toLocaleString('en-US', { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                      });
                    } catch (e) {
                      priceStr = price.toFixed(2);
                    }
                  }
                  
                  const name = coin.name || 'Unknown';
                  const symbol = (coin.symbol || 'N/A').toUpperCase();
                  
                  return `${name} (${symbol}): $${priceStr} (${changeSign}${change.toFixed(2)}%)`;
                } catch (e) {
                  console.warn('Error processing coin:', coin, e);
                  return null;
                }
              })
              .filter((item): item is string => item !== null && typeof item === 'string')
              .join(', ');
            
            if (marketSummary && marketSummary.length > 0) {
              setMarketData(marketSummary);
            }
          }
        } else {
          console.warn('CoinGecko API response not OK:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching market data:', error);
        // Hata durumunda boş bırak, backend fallback kullanır
      }
    };

    // İlk çağrıyı hemen yap
    fetchMarketData();
    
    // Her 30 saniyede bir güncelle
    const interval = setInterval(() => {
      fetchMarketData();
    }, 30000);
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // Client-side only initialization
  useEffect(() => {
    setIsMounted(true);
    setMessages([
      {
        id: '1',
        role: 'assistant',
        content: 'Merhaba! Ben Dijital Market AI. Kripto para, borsa analizi, yatırım stratejileri ve blockchain teknolojisi hakkında sorularınızı yanıtlayabilirim. Canlı piyasa verilerine erişebilirim. Size nasıl yardımcı olabilirim?',
        timestamp: new Date().toISOString(),
        isTyping: false,
        displayedContent: undefined,
      },
    ]);
  }, []);

  useEffect(() => {
    if (isMounted) {
      scrollToBottom();
    }
  }, [messages, isMounted]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          marketContext: marketData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = 'AI yanıtı alınamadı.';
        
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (response.status === 401) {
          errorMessage = 'API anahtarı geçersiz. Lütfen .env dosyasındaki OPENAI_API_KEY değerini kontrol edin.';
        } else if (response.status === 429) {
          errorMessage = errorData.error || 'API limiti aşıldı. Lütfen birkaç dakika sonra tekrar deneyin.';
        } else if (response.status >= 500) {
          errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
        } else {
          errorMessage = `Hata (${response.status}): ${response.statusText || 'Bilinmeyen hata'}`;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.message) {
        throw new Error('AI\'dan geçersiz yanıt alındı.');
      }

      // Daktilo efekti için mesajı ekle
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
        isTyping: true,
        displayedContent: '',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Daktilo efekti
      const fullText = data.message;
      let currentIndex = 0;
      const typingSpeed = 15;

      setTimeout(() => {
        const typingInterval = setInterval(() => {
          currentIndex++;
          const displayedText = fullText.substring(0, currentIndex);
          
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, displayedContent: displayedText, isTyping: true }
                : msg
            )
          );

          if (currentIndex % 5 === 0) {
            scrollToBottom();
          }

          if (currentIndex >= fullText.length) {
            clearInterval(typingInterval);
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, isTyping: false, displayedContent: fullText, content: fullText }
                  : msg
              )
            );
            scrollToBottom();
          }
        }, typingSpeed);
      }, 100);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date().toISOString(),
        isTyping: false,
        displayedContent: undefined,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    if (typeof window === 'undefined') return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const suggestedQuestions = [
    'Which CFTC changes affect crypto?',
    'Why is the market up today?',
    'Are altcoins outperforming Bitcoin?',
    'What are the trending narratives?',
    'What cryptos are showing bullish momentum?',
    'What upcoming events may impact crypto?',
    'What is the market sentiment?',
    'What are KOLs discussing?',
  ];

  if (!isMounted) {
    return (
      <>
        <Head>
          <title>Dijital Market AI | Kripto Asistan</title>
        </Head>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mb-4 animate-pulse">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Dijital Market AI | Kripto Asistan</title>
        <meta name="description" content="Kripto para ve borsa hakkında sorularınızı yanıtlayan AI asistan" />
      </Head>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex">
        {/* Sol Sidebar */}
        <div className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Dijital Market AI</h2>
            </div>
            <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-sm font-semibold text-gray-500 mb-2">Chats</div>
            <div className="space-y-1">
              {messages.length > 1 && (
                <div className="px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer text-sm text-gray-700">
                  Current Chat
                </div>
              )}
            </div>
          </div>
          <div className="p-4 border-t border-gray-200">
            <button className="w-full px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors text-sm">
              Sign Up for Free Credits
            </button>
          </div>
        </div>

        {/* Ana İçerik Alanı */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Unlock the Full Power of Dijital Market AI</h3>
                <p className="text-sm text-blue-100">Get advanced insights and analysis</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm">
                  Sign Up
                </button>
                <button className="px-4 py-2 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors text-sm">
                  Learn More
                </button>
              </div>
            </div>
          </div>

          {/* Quick Insights */}
          {quickInsights && (
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="max-w-4xl mx-auto">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Insights</h3>
                <div className="grid grid-cols-4 gap-4">
                  {/* Market Cap */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Market Cap</div>
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {formatCurrency(quickInsights.marketCap.value)}
                    </div>
                    <div className={`text-xs font-semibold flex items-center gap-1 ${quickInsights.marketCap.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{quickInsights.marketCap.change >= 0 ? '▲' : '▼'}</span>
                      {Math.abs(quickInsights.marketCap.change).toFixed(2)}%
                    </div>
                  </div>

                  {/* 24h Volume */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">24h Volume</div>
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {formatCurrency(quickInsights.volume24h.value)}
                    </div>
                    <div className={`text-xs font-semibold flex items-center gap-1 ${quickInsights.volume24h.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <span>{quickInsights.volume24h.change >= 0 ? '▲' : '▼'}</span>
                      {Math.abs(quickInsights.volume24h.change).toFixed(2)}%
                    </div>
                  </div>

                  {/* Altcoin Index */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Altcoin Index</div>
                    <div className="text-lg font-bold text-gray-900 mb-2">
                      {quickInsights.altcoinIndex.value}/{quickInsights.altcoinIndex.max}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(quickInsights.altcoinIndex.value / quickInsights.altcoinIndex.max) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Fear & Greed */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Fear & Greed</div>
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {quickInsights.fearGreed.value}
                    </div>
                    <div className="text-xs font-semibold text-gray-600">
                      {quickInsights.fearGreed.label}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50">
            <div className="max-w-4xl mx-auto px-6 py-8">
              {/* Messages */}
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    What upcoming events may impact crypto?
                  </div>
                  <div className="text-gray-500 mb-8">Ask me anything about crypto markets</div>
                  
                  {/* Suggested Questions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
                    {suggestedQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(question)}
                        className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        disabled={isLoading}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-4 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.role === 'assistant' && message.isTyping ? (
                            <>
                              {message.displayedContent || ''}
                              <span className="inline-block w-2 h-4 bg-gray-400 ml-1 animate-pulse">|</span>
                            </>
                          ) : (
                            message.content
                          )}
                        </p>
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              {/* Suggested Questions (eğer mesaj varsa) */}
              {messages.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {suggestedQuestions.slice(0, 4).map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(question)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                        disabled={isLoading}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything about crypto..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
                    rows={1}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span>Crypto Experience: Regular</span>
                  <span>Writing Style: Default</span>
                  <span>Sources: Live Prices, News</span>
                </div>
                <div>Pro • Unlimited questions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIChatPage;
