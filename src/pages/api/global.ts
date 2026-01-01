// pages/api/global.ts
// CoinGecko Global Market Data API

import { NextApiRequest, NextApiResponse } from 'next';

interface CoinGeckoGlobalData {
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    markets: number;
    total_market_cap: Record<string, number>;
    total_volume: Record<string, number>;
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    updated_at: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Timeout için AbortController kullan
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye timeout

    // CoinGecko Global API'den veri çek
    const apiKey = process.env.COINGECKO_API_KEY;
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0',
    };
    
    // Eğer API key varsa ekle
    if (apiKey) {
      headers['x-cg-demo-api-key'] = apiKey;
    }

    let response: Response;
    try {
      response = await fetch('https://api.coingecko.com/api/v3/global', {
        headers,
        signal: controller.signal,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('CoinGecko API fetch hatası:', fetchError);
      return res.status(200).json({
        totalCoins: 0,
        totalExchanges: 0,
        marketCap: 0,
        marketCapChange24h: 0,
        volume24h: 0,
        btcDominance: 0,
        ethDominance: 0,
        updatedAt: Date.now(),
        error: 'CoinGecko API\'ye bağlanılamadı.',
        details: fetchError instanceof Error ? fetchError.message : 'Network hatası'
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Bilinmeyen hata');
      console.error(`CoinGecko API hatası: ${response.status} ${response.statusText}`, errorText);
      
      // Rate limit hatası özel mesaj
      if (response.status === 429) {
        return res.status(200).json({
          totalCoins: 0,
          totalExchanges: 0,
          marketCap: 0,
          marketCapChange24h: 0,
          volume24h: 0,
          btcDominance: 0,
          ethDominance: 0,
          updatedAt: Date.now(),
          error: 'Rate limit aşıldı. Lütfen birkaç dakika sonra tekrar deneyin.',
        });
      }
      
      // Hata durumunda fallback değerler döndür
      return res.status(200).json({
        totalCoins: 0,
        totalExchanges: 0,
        marketCap: 0,
        marketCapChange24h: 0,
        volume24h: 0,
        btcDominance: 0,
        ethDominance: 0,
        updatedAt: Date.now(),
        error: `API hatası: ${response.status}`,
        details: errorText.substring(0, 200) // İlk 200 karakteri göster
      });
    }

    const data: CoinGeckoGlobalData = await response.json();

    // Veri yapısını kontrol et
    if (!data || !data.data) {
      console.error('Geçersiz API yanıtı:', data);
      return res.status(200).json({
        totalCoins: 0,
        totalExchanges: 0,
        marketCap: 0,
        marketCapChange24h: 0,
        volume24h: 0,
        btcDominance: 0,
        ethDominance: 0,
        updatedAt: Date.now(),
        error: 'Geçersiz API yanıtı',
      });
    }

    // Veriyi işle ve döndür
    const globalData = data.data;
    
    res.status(200).json({
      totalCoins: globalData.active_cryptocurrencies || 0,
      totalExchanges: globalData.markets || 0,
      marketCap: globalData.total_market_cap?.usd || 0,
      marketCapChange24h: globalData.market_cap_change_percentage_24h_usd || 0,
      volume24h: globalData.total_volume?.usd || 0,
      btcDominance: globalData.market_cap_percentage?.btc || 0,
      ethDominance: globalData.market_cap_percentage?.eth || 0,
      updatedAt: globalData.updated_at || Date.now(),
    });

  } catch (error) {
    console.error('Global API Error:', error);
    
    // Hata durumunda bile 200 döndür (frontend'in çökmesini önlemek için)
    // Frontend'de error kontrolü yapılacak
    res.status(200).json({ 
      totalCoins: 0,
      totalExchanges: 0,
      marketCap: 0,
      marketCapChange24h: 0,
      volume24h: 0,
      btcDominance: 0,
      ethDominance: 0,
      updatedAt: Date.now(),
      error: 'CoinGecko API\'den veri çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
}

