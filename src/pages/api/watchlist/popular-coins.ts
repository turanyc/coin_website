import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Popüler coin'leri getir (Bitcoin, Ethereum, BNB, XRP, vb.)
    const popularCoinIds = [
      'bitcoin',
      'ethereum',
      'binancecoin',
      'ripple',
      'solana',
      'cardano',
      'dogecoin',
      'polkadot',
      'polygon',
      'chainlink',
      'litecoin',
      'avalanche-2',
      'uniswap',
      'theorique',
      'rayls',
    ];

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${popularCoinIds.join(',')}&order=market_cap_desc&per_page=15&page=1&sparkline=false&price_change_percentage=24h`,
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
    
    const formattedCoins = coins.map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      image: coin.image,
      current_price: coin.current_price || 0,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
    }));

    res.status(200).json({ coins: formattedCoins });
  } catch (error) {
    console.error('Popular coins error:', error);
    res.status(200).json({ coins: [] });
  }
}
