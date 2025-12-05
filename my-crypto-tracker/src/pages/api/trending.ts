// pages/api/trending.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    slug: string;
    price_btc: number;
    score: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // CoinGecko Trending API
    const trendingResponse = await fetch(
      'https://api.coingecko.com/api/v3/search/trending',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      }
    );

    if (!trendingResponse.ok) {
      console.error(`CoinGecko Trending API hatası: ${trendingResponse.status}`);
      return res.status(200).json({
        error: `API hatası: ${trendingResponse.status}`,
        coins: [],
      });
    }

    const trendingData: { coins: TrendingCoin[] } = await trendingResponse.json();
    
    // Trending coin'lerin detaylarını al
    const coinIds = trendingData.coins.map(coin => coin.item.id);
    
    // Coin detaylarını al (price, market cap, volume, price changes)
    const coinsResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=1h,24h,7d`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      }
    );

    if (!coinsResponse.ok) {
      console.error(`CoinGecko Markets API hatası: ${coinsResponse.status}`);
      return res.status(200).json({
        error: `API hatası: ${coinsResponse.status}`,
        coins: [],
      });
    }

    const coinsData: Array<{
      id: string;
      name: string;
      symbol: string;
      image: string;
      current_price: number;
      market_cap: number;
      total_volume: number;
      price_change_percentage_1h_in_currency: number;
      price_change_percentage_24h_in_currency: number;
      price_change_percentage_7d_in_currency: number;
      sparkline_in_7d: { price: number[] } | null;
      market_cap_rank: number;
    }> = await coinsResponse.json();

    clearTimeout(timeoutId);

    // Trending score'ları eşleştir
    const trendingScores = new Map(
      trendingData.coins.map(coin => [coin.item.id, coin.item.score])
    );

    // Veriyi birleştir ve sırala
    const coins = coinsData
      .map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        image: coin.image,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        total_volume: coin.total_volume,
        price_change_1h: coin.price_change_percentage_1h_in_currency || 0,
        price_change_24h: coin.price_change_percentage_24h_in_currency || 0,
        price_change_7d: coin.price_change_percentage_7d_in_currency || 0,
        sparkline: coin.sparkline_in_7d?.price || [],
        market_cap_rank: coin.market_cap_rank,
        trending_score: trendingScores.get(coin.id) || 0,
      }))
      .sort((a, b) => b.trending_score - a.trending_score);

    res.status(200).json({ coins });
  } catch (error) {
    console.error('Trending API Error:', error);
    
    res.status(200).json({
      error: 'Trending verileri çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      coins: [],
    });
  }
}
