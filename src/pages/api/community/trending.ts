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
      console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      return res.status(200).json({ coins: [] });
    }

    const coins = await response.json();
    
    // Veri kontrolü
    if (!Array.isArray(coins) || coins.length === 0) {
      console.error('CoinGecko API returned empty or invalid data');
      return res.status(200).json({ coins: [] });
    }
    
    const formattedCoins = coins.map((coin: any, index: number) => ({
      rank: index + 1,
      id: coin.id || `coin-${index}`,
      name: coin.name || 'Unknown',
      symbol: (coin.symbol || 'UNK').toUpperCase(),
      image: coin.image || '',
      market_cap: coin.market_cap || 0,
      current_price: coin.current_price || 0,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
    }));

    console.log(`Successfully fetched ${formattedCoins.length} coins`);
    res.status(200).json({ coins: formattedCoins });
  } catch (error) {
    console.error('Trending coins error:', error);
    res.status(200).json({ coins: [] });
  }
}
