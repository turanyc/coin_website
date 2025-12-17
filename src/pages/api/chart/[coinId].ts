// pages/api/chart/[coinId].ts
import { NextApiRequest, NextApiResponse } from 'next';

// Basit in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { coinId } = req.query;
  const { days = '7' } = req.query;

  if (!coinId || typeof coinId !== 'string') {
    return res.status(400).json({ error: 'Coin ID gerekli' });
  }

  // Days parametresini sayıya çevir
  const daysNum = parseInt(days as string, 10);
  if (isNaN(daysNum) || daysNum < 1) {
    return res.status(400).json({ error: 'Geçersiz days parametresi' });
  }

  // Cache key oluştur
  const cacheKey = `${coinId}-${daysNum}`;
  const cached = cache.get(cacheKey);
  
  // Cache kontrolü
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return res.status(200).json(cached.data);
  }

  try {
    // Timeout için AbortController kullan
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye timeout

    // CoinGecko Market Chart API'den veri çek
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${daysNum}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 429 hatası durumunda cache'den eski veriyi döndür
      if (response.status === 429 && cached) {
        console.warn('Rate limit hatası, cache\'den eski veri döndürülüyor');
        return res.status(200).json({
          ...cached.data,
          warning: 'Rate limit nedeniyle önbellekten veri gösteriliyor',
        });
      }
      
      console.error(`CoinGecko Chart API hatası: ${response.status} ${response.statusText}`);
      
      let errorMessage = `API hatası: ${response.status}`;
      if (response.status === 429) {
        errorMessage = 'Çok fazla istek yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.';
      }
      
      return res.status(200).json({
        prices: [],
        priceData: [],
        error: errorMessage,
      });
    }

    const data = await response.json();

    // Veri yapısını kontrol et
    if (!data || !data.prices || !Array.isArray(data.prices)) {
      console.error('Geçersiz Chart API yanıtı:', data);
      return res.status(200).json({
        prices: [],
        error: 'Geçersiz API yanıtı',
      });
    }

    // Fiyat ve timestamp'leri çıkar
    const prices = data.prices.map((entry: [number, number]) => ({
      timestamp: entry[0],
      price: entry[1],
    }));

    // İlk ve son fiyatı hesapla (yüzdelik değişim için)
    const firstPrice = prices[0]?.price || 0;
    const lastPrice = prices[prices.length - 1]?.price || 0;
    const priceChange = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;

    const responseData = {
      prices: prices.map((p: { timestamp: number; price: number }) => p.price),
      priceData: prices,
      priceChange,
      firstPrice,
      lastPrice,
    };

    // Cache'e kaydet
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now(),
    });

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Chart API Error:', error);

    // Hata durumunda bile 200 döndür
    res.status(200).json({
      prices: [],
      priceData: [],
      priceChange: 0,
      firstPrice: 0,
      lastPrice: 0,
      error: 'CoinGecko Chart API\'den veri çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
    });
  }
}

