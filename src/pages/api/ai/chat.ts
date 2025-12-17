import type { NextApiRequest, NextApiResponse } from 'next';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface CoinGeckoMarketCoin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
}

/**
 * CoinGecko'dan canlı piyasa verilerini çek
 * Top 15 coin'i al (token tasarrufu için)
 */
async function fetchMarketContext(): Promise<string> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('CoinGecko API error, using fallback');
      return 'Piyasa verileri şu anda alınamıyor.';
    }

    const coins: CoinGeckoMarketCoin[] = await response.json();
    
    const marketSummary = coins
      .map((coin) => {
        const change = coin.price_change_percentage_24h || 0;
        const changeSign = change >= 0 ? '+' : '';
        return `${coin.name} (${coin.symbol.toUpperCase()}): $${coin.current_price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'} (${changeSign}${change.toFixed(2)}%)`;
      })
      .join(', ');

    return marketSummary || 'Piyasa verileri alınamadı.';
  } catch (error) {
    console.error('Error fetching market context:', error);
    return 'Piyasa verileri şu anda alınamıyor.';
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // n8n entegrasyonu için hem 'messages' hem de 'userMessage' formatını destekle
  // marketContext opsiyonel - eğer gönderilmezse backend'den çekilir
  const { messages, userMessage, marketContext } = req.body;

  // Eğer userMessage varsa (n8n'den geliyorsa), messages formatına çevir
  let chatMessages: ChatMessage[] = [];
  
  if (userMessage && typeof userMessage === 'string') {
    // n8n'den gelen tek mesaj formatı
    chatMessages = [
      { role: 'user', content: userMessage }
    ];
  } else if (messages && Array.isArray(messages)) {
    // Mevcut format (frontend'den gelen)
    chatMessages = messages;
  } else {
    return res.status(400).json({ 
      error: 'Either "messages" array or "userMessage" string is required' 
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

  try {
    // Market context'i al - frontend'den gelirse kullan, yoksa backend'den çek
    let marketData = marketContext;
    if (!marketData || typeof marketData !== 'string') {
      // Backend'den otomatik çek (n8n veya direkt API çağrıları için)
      marketData = await fetchMarketContext();
    }

    // n8n webhook entegrasyonu - Önce n8n'e gönder (Gemini yanıtı için)
    let n8nResponse: string | null = null;
    if (n8nWebhookUrl) {
      try {
        // Son kullanıcı mesajını al
        const lastUserMessage = chatMessages[chatMessages.length - 1]?.content || 
          (userMessage && typeof userMessage === 'string' ? userMessage : '');
        
        const requestBody = {
          message: lastUserMessage,
          marketContext: marketData,
          timestamp: new Date().toISOString(),
        };
        
        console.log('📤 n8n webhook\'a gönderiliyor:', n8nWebhookUrl);
        console.log('📤 Gönderilen veri:', JSON.stringify(requestBody).substring(0, 300));
        
        // n8n webhook'una gönder
        // Timeout: 20 saniye (n8n yanıt vermezse OpenAI'ye geç)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        
        const n8nResponse_fetch = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        console.log('📥 n8n yanıt durumu:', n8nResponse_fetch.status, n8nResponse_fetch.statusText);

        if (n8nResponse_fetch.ok) {
          const responseText = await n8nResponse_fetch.text();
          console.log('📥 n8n ham yanıt (ilk 500 karakter):', responseText.substring(0, 500));
          
          let n8nData: any;
          try {
            n8nData = JSON.parse(responseText);
            console.log('📥 n8n parse edilmiş yanıt:', JSON.stringify(n8nData).substring(0, 500));
          } catch (parseError) {
            console.warn('⚠️ n8n yanıtı JSON değil, string olarak kullanılıyor');
            n8nData = responseText;
          }
          
          // n8n'den gelen yanıtı kontrol et (Basic LLM Chain ve farklı formatlar için)
          // Basic LLM Chain genellikle { output: "..." } veya { text: "..." } formatında döner
          n8nResponse = 
            n8nData.message || 
            n8nData.response || 
            n8nData.text || 
            n8nData.content || 
            n8nData.output || 
            (n8nData.data && (n8nData.data.message || n8nData.data.text || n8nData.data.output)) ||
            (typeof n8nData === 'string' ? n8nData : null);
          
          console.log('🔍 Çıkarılan yanıt:', n8nResponse ? n8nResponse.substring(0, 200) : 'YOK');
          
          if (n8nResponse && typeof n8nResponse === 'string' && n8nResponse.trim().length > 0) {
            console.log('✅ n8n webhook yanıtı alındı (Gemini) - Uzunluk:', n8nResponse.length);
            // n8n'den yanıt geldi, OpenAI'ye gerek yok
            return res.status(200).json({
              message: n8nResponse.trim(),
              source: 'n8n-gemini',
              usage: null,
            });
          } else {
            console.warn('⚠️ n8n yanıt formatı beklenmeyen veya boş');
            console.warn('⚠️ Ham yanıt:', JSON.stringify(n8nData).substring(0, 1000));
          }
        } else {
          const errorText = await n8nResponse_fetch.text().catch(() => '');
          console.error('❌ n8n webhook hata yanıtı:', n8nResponse_fetch.status, errorText.substring(0, 500));
        }
      } catch (n8nError) {
        // n8n hatası - Detaylı log
        const errorMsg = n8nError instanceof Error ? n8nError.message : 'Unknown error';
        console.error('❌ n8n webhook hatası:', errorMsg);
        console.error('❌ Hata detayları:', n8nError);
        
        // Timeout hatası mı kontrol et
        if (errorMsg.includes('aborted') || errorMsg.includes('timeout')) {
          console.error('⏱️ n8n webhook timeout (20s) - n8n çok yavaş yanıt veriyor veya çalışmıyor');
          console.error('💡 İpucu: n8n workflow\'unu kontrol edin ve "Listen for test event" butonuna basın');
        } else if (errorMsg.includes('fetch') || errorMsg.includes('ECONNREFUSED') || errorMsg.includes('ENOTFOUND')) {
          console.error('🔌 n8n webhook bağlantı hatası - n8n çalışmıyor olabilir');
          console.error(`💡 İpucu: ${n8nWebhookUrl} adresine erişilemiyor. n8n\'in çalıştığından emin olun: http://localhost:5678`);
        }
      }
    }

    // n8n'den yanıt gelmediyse OpenAI'ye geç
    if (!apiKey) {
      // Detaylı hata mesajı
      let errorDetails = 'n8n webhook yanıt vermedi. ';
      
      if (n8nWebhookUrl) {
        errorDetails += `\n\n🔍 Debug Adımları:\n`;
        errorDetails += `1. n8n'in çalıştığından emin olun: http://localhost:5678\n`;
        errorDetails += `2. n8n'de "Listen for test event" butonuna basın\n`;
        errorDetails += `3. Webhook URL'i kontrol edin: ${n8nWebhookUrl}\n`;
        errorDetails += `4. "Respond to Webhook" node'unun Response Body formatını kontrol edin:\n`;
        errorDetails += `   {\n`;
        errorDetails += `     "message": "{{ $json.output || $json.text || $json.message }}"\n`;
        errorDetails += `   }\n`;
        errorDetails += `5. Next.js server console loglarını kontrol edin (📤 ve 📥 işaretli loglar)\n\n`;
        errorDetails += `VEYA geçici çözüm: .env dosyasına OPENAI_API_KEY ekleyin (fallback için)`;
      } else {
        errorDetails += `\n\nN8N_WEBHOOK_URL tanımlı değil. .env dosyasına ekleyin veya OPENAI_API_KEY ekleyin.`;
      }
      
      return res.status(500).json({ 
        error: errorDetails,
        n8nConfigured: !!n8nWebhookUrl,
        n8nUrl: n8nWebhookUrl || 'Not configured'
      });
    }

    // System prompt - Borsa ve kripto odaklı (n8n uyumlu + canlı veriler)
    const systemPrompt: ChatMessage = {
      role: 'system',
      content: `Sen Dijital Market AI'sın, kripto para ve borsa konularında uzman bir asistan. 
Adın 'Digital Marketim AI'. 

ŞU ANKİ CANLI PİYASA VERİLERİ (Bu verilere göre cevap ver):
${marketData}

ÖNEMLİ KURALLAR:
- Kullanıcı fiyat sorduğunda yukarıdaki CANLI VERİLERİ kullan. Eski veya tahmini fiyat söyleme.
- Eğer sorulan coin yukarıdaki listede yoksa, "Bu coin şu anda listede yok, ancak genel olarak..." diye başla.
- Türkçe yanıt ver ve teknik terimleri açıkla.
- Sadece finans, borsa, coinler ve ekonomi hakkında konuş. 
- Bunun dışındaki sorulara (örneğin yemek tarifi, spor) nazikçe cevap vermeyi reddet ve konuyu finansa getir.
- Yatırım tavsiyesi vermiyorsun, sadece analiz yaptığını her zaman hatırlat. Bilgilendirici içerik sunuyorsun.
- Fiyat değişimlerini yorumlarken yukarıdaki 24 saatlik değişim yüzdelerini kullan.
- YANITLARINI KISA TUT! Maksimum 2-3 paragraf. Kullanıcı sıkılmasın. Öz ve net ol.`
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // n8n'de 'gpt-3.5-turbo' veya 'gpt-4' kullanmak istersen .env'den alabilirsin
        messages: [systemPrompt, ...chatMessages],
        temperature: 0.7,
        max_tokens: 500, // Kısa yanıtlar için azaltıldı (1000'den 500'e)
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      let errorMessage = 'OpenAI API hatası oluştu.';
      
      if (response.status === 401) {
        errorMessage = 'API anahtarı geçersiz veya süresi dolmuş. Lütfen .env dosyasındaki OPENAI_API_KEY değerini kontrol edin.';
      } else if (response.status === 429) {
        // Rate limit hatası - Retry-After header'ını kontrol et
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter) {
          const seconds = parseInt(retryAfter, 10);
          const minutes = Math.ceil(seconds / 60);
          errorMessage = `API limiti aşıldı. Lütfen ${minutes} dakika sonra tekrar deneyin. (Rate limit: ${seconds} saniye)`;
        } else {
          errorMessage = 'API limiti aşıldı. Lütfen birkaç dakika sonra tekrar deneyin. OpenAI ücretsiz planında dakikada sınırlı istek yapabilirsiniz.';
        }
      } else if (response.status === 500) {
        errorMessage = 'OpenAI sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      } else if (errorData.error?.message) {
        errorMessage = `OpenAI API hatası: ${errorData.error.message}`;
      } else if (errorData.error) {
        errorMessage = `OpenAI API hatası: ${JSON.stringify(errorData.error)}`;
      }
      
      return res.status(response.status).json({ 
        error: errorMessage,
        details: errorData 
      });
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ error: 'Invalid response from OpenAI' });
    }

    return res.status(200).json({
      message: data.choices[0].message.content,
      source: 'openai',
      usage: data.usage,
    });
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return res.status(500).json({ 
        error: 'Ağ hatası. İnternet bağlantınızı kontrol edin.',
        details: errorMessage
      });
    }
    
    return res.status(500).json({ 
      error: 'AI yanıtı alınamadı. Lütfen tekrar deneyin.',
      details: errorMessage
    });
  }
}
