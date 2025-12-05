// pages/api/historical-snapshot.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface CoinGeckoHistoricalCoin {
  id: string;
  symbol: string;
  name: string;
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  market_data: {
    current_price: {
      usd: number;
    };
    market_cap: {
      usd: number;
    };
    total_volume: {
      usd: number;
    };
    circulating_supply: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
  };
  market_cap_rank: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { date } = req.query;

  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'Tarih parametresi gerekli (format: dd-mm-yyyy)' });
  }

  // Tarih formatını kontrol et (dd-mm-yyyy)
  const dateRegex = /^\d{2}-\d{2}-\d{4}$/;
  if (!dateRegex.test(date)) {
    return res.status(400).json({ error: 'Geçersiz tarih formatı. Format: dd-mm-yyyy olmalı' });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    // Önce top 100 coin'in ID'lerini al
    const marketsResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false',
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

    const marketsData: Array<{ id: string }> = await marketsResponse.json();
    const coinIds = marketsData.map((coin) => coin.id);

    // Her coin için geçmiş verilerini çek (paralel olarak, ama rate limit için sınırlı)
    const historicalData: CoinGeckoHistoricalCoin[] = [];
    const batchSize = 10; // Her seferde 10 coin çek

    for (let i = 0; i < coinIds.length; i += batchSize) {
      const batch = coinIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (coinId) => {
        try {
          const historyResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${date}&localization=false`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0',
              },
              signal: controller.signal,
            }
          );

          if (historyResponse.ok) {
            const coinData: CoinGeckoHistoricalCoin = await historyResponse.json();
            return coinData;
          }
          return null;
        } catch (error) {
          console.error(`Coin ${coinId} için geçmiş veri çekilemedi:`, error);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      historicalData.push(...batchResults.filter((coin): coin is CoinGeckoHistoricalCoin => coin !== null));

      // Rate limit için kısa bir bekleme
      if (i + batchSize < coinIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Veriyi işle ve döndür
    const coins = historicalData
      .map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        image: coin.image?.large || coin.image?.small || coin.image?.thumb || null,
        current_price: coin.market_data?.current_price?.usd || 0,
        market_cap: coin.market_data?.market_cap?.usd || 0,
        total_volume: coin.market_data?.total_volume?.usd || 0,
        circulating_supply: coin.market_data?.circulating_supply || 0,
        price_change_percentage_24h: coin.market_data?.price_change_percentage_24h || 0,
        price_change_percentage_7d: coin.market_data?.price_change_percentage_7d || 0,
        market_cap_rank: coin.market_cap_rank || 999,
      }))
      .sort((a, b) => a.market_cap_rank - b.market_cap_rank);

    clearTimeout(timeoutId);

    res.status(200).json({ coins, date });
  } catch (error) {
    console.error('Historical Snapshot API Error:', error);
    
    res.status(200).json({
      error: 'CoinGecko API\'den geçmiş veriler çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      coins: [],
      date,
    });
  }
}
