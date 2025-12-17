// pages/api/most-visited.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // CoinGecko'dan en popüler coin'leri al (market cap'e göre - en yüksek market cap = en çok ziyaret edilen)
    // Sparkline verilerini de al (7 günlük grafik için)
    const marketsResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      }
    );

    if (!marketsResponse.ok) {
      console.error(`CoinGecko Markets API hatası: ${marketsResponse.status}`);
      return res.status(200).json({
        error: `API hatası: ${marketsResponse.status}`,
        coins: [],
      });
    }

    const marketsData: Array<{
      id: string;
      name: string;
      symbol: string;
      image: string;
      current_price: number;
      market_cap: number;
      total_volume: number;
      price_change_percentage_1h_in_currency: number | null;
      price_change_percentage_24h_in_currency: number | null;
      price_change_percentage_7d_in_currency: number | null;
      sparkline_in_7d: { price: number[] } | null;
      market_cap_rank: number;
    }> = await marketsResponse.json();

    clearTimeout(timeoutId);

    // Veriyi işle
    const coins = marketsData.map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image,
      current_price: coin.current_price || 0,
      market_cap: coin.market_cap || 0,
      total_volume: coin.total_volume || 0,
      price_change_1h: coin.price_change_percentage_1h_in_currency || 0,
      price_change_24h: coin.price_change_percentage_24h_in_currency || 0,
      price_change_7d: coin.price_change_percentage_7d_in_currency || 0,
      sparkline: coin.sparkline_in_7d?.price || [],
      market_cap_rank: coin.market_cap_rank || 999,
    }));

    res.status(200).json({ coins });
  } catch (error) {
    console.error('Most Visited API Error:', error);
    
    res.status(200).json({
      error: 'En çok ziyaret edilen verileri çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      coins: [],
    });
  }
}
