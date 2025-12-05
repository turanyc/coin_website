// pages/api/gainers-losers.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { timeframe = '24h', limit = '100' } = req.query;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // CoinGecko'dan coin'leri al (hacim > $50,000 olanlar)
    const marketsResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`,
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
        gainers: [],
        losers: [],
      });
    }

    const marketsData: Array<{
      id: string;
      name: string;
      symbol: string;
      image: string;
      current_price: number;
      total_volume: number;
      price_change_percentage_24h_in_currency: number | null;
      market_cap_rank: number;
    }> = await marketsResponse.json();

    clearTimeout(timeoutId);

    // Hacim filtresi: $50,000'den fazla olanlar
    const minVolume = 50000;
    const filteredCoins = marketsData.filter(coin => 
      coin.total_volume >= minVolume && 
      coin.price_change_percentage_24h_in_currency !== null
    );

    // Kazananlar ve kaybedenleri ayır
    const gainers = filteredCoins
      .filter(coin => coin.price_change_percentage_24h_in_currency! > 0)
      .sort((a, b) => (b.price_change_percentage_24h_in_currency || 0) - (a.price_change_percentage_24h_in_currency || 0))
      .slice(0, parseInt(limit as string))
      .map((coin, index) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        image: coin.image,
        current_price: coin.current_price,
        price_change_24h: coin.price_change_percentage_24h_in_currency || 0,
        total_volume: coin.total_volume,
        market_cap_rank: coin.market_cap_rank,
      }));

    const losers = filteredCoins
      .filter(coin => coin.price_change_percentage_24h_in_currency! < 0)
      .sort((a, b) => (a.price_change_percentage_24h_in_currency || 0) - (b.price_change_percentage_24h_in_currency || 0))
      .slice(0, parseInt(limit as string))
      .map((coin, index) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        image: coin.image,
        current_price: coin.current_price,
        price_change_24h: coin.price_change_percentage_24h_in_currency || 0,
        total_volume: coin.total_volume,
        market_cap_rank: coin.market_cap_rank,
      }));

    res.status(200).json({ gainers, losers, timeframe, limit });
  } catch (error) {
    console.error('Gainers Losers API Error:', error);
    
    res.status(200).json({
      error: 'Kazananlar ve kaybedenler verileri çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      gainers: [],
      losers: [],
    });
  }
}
