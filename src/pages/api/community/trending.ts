import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // CoinGecko'dan trending coin'leri al
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    if (!response.ok) {
      return res.status(200).json({ coins: [] });
    }

    const coins = await response.json();
    
    const formattedCoins = coins.map((coin: any, index: number) => ({
      rank: index + 1,
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image,
      market_cap: coin.market_cap || 0,
      current_price: coin.current_price || 0,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
    }));

    res.status(200).json({ coins: formattedCoins });
  } catch (error) {
    console.error('Trending coins error:', error);
    res.status(200).json({ coins: [] });
  }
}
