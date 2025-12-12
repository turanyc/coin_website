import { NextApiRequest, NextApiResponse } from 'next';

interface RSIData {
  averageRSI: number;
  overboughtPercentage: number;
  oversoldPercentage: number;
  historicalValues: {
    oneDay: number;
    oneWeek: number;
    oneMonth: number;
    threeMonths: number;
  };
  heatmapData: Array<{
    date: string;
    coins: Array<{
      symbol: string;
      rsi: number;
      marketCap: number;
    }>;
  }>;
  coinsData: Array<{
    id: string;
    symbol: string;
    name: string;
    image: string;
    marketCap: number;
    volume24h: number;
    volumeChange24h: number;
    rsi14d: number;
    rsi7d: number;
    rsi14h: number;
    rsi4h: number;
    rsi1h: number;
  }>;
}

// Calculate RSI from price array
const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50; // Default neutral value

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }

  // Calculate average gain and loss
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return Math.round(rsi * 100) / 100;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch top 200 coins from CoinGecko
    const coinsResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false&price_change_percentage=24h',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!coinsResponse.ok) {
      throw new Error(`CoinGecko API error: ${coinsResponse.status}`);
    }

    const coinsData = await coinsResponse.json();

    // Fetch historical data for RSI calculation
    const coinsWithRSI = await Promise.all(
      coinsData.slice(0, 100).map(async (coin: any) => {
        try {
          // Fetch 30 days of price data for RSI calculation
          const historyResponse = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=30&interval=daily`,
            {
              headers: {
                'Accept': 'application/json',
              },
            }
          );

          let rsi14d = 50;
          let rsi7d = 50;
          let rsi14h = 50;
          let rsi4h = 50;
          let rsi1h = 50;

          if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            const prices = historyData.prices?.map((p: number[]) => p[1]) || [];
            
            if (prices.length >= 15) {
              rsi14d = calculateRSI(prices, 14);
              rsi7d = calculateRSI(prices.slice(-8), 7);
            }

            // For hourly RSI, we'll use daily data as proxy (simplified)
            if (prices.length >= 15) {
              rsi14h = calculateRSI(prices.slice(-15), 14);
              rsi4h = calculateRSI(prices.slice(-5), 4);
              rsi1h = calculateRSI(prices.slice(-2), 1);
            }
          }

          return {
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            image: coin.image || '',
            marketCap: coin.market_cap || 0,
            volume24h: coin.total_volume || 0,
            volumeChange24h: coin.price_change_percentage_24h || 0,
            rsi14d,
            rsi7d,
            rsi14h,
            rsi4h,
            rsi1h,
          };
        } catch (error) {
          console.warn(`Error fetching data for ${coin.id}:`, error);
          return {
            id: coin.id,
            symbol: coin.symbol.toUpperCase(),
            name: coin.name,
            image: coin.image || '',
            marketCap: coin.market_cap || 0,
            volume24h: coin.total_volume || 0,
            volumeChange24h: coin.price_change_percentage_24h || 0,
            rsi14d: 50,
            rsi7d: 50,
            rsi14h: 50,
            rsi4h: 50,
            rsi1h: 50,
          };
        }
      })
    );

    // Calculate average RSI
    const validRSIs = coinsWithRSI.map(c => c.rsi14d).filter(r => r > 0 && r <= 100);
    const averageRSI = validRSIs.length > 0
      ? validRSIs.reduce((a, b) => a + b, 0) / validRSIs.length
      : 50;

    // Calculate overbought and oversold percentages
    const overboughtCount = coinsWithRSI.filter(c => c.rsi14d >= 70).length;
    const oversoldCount = coinsWithRSI.filter(c => c.rsi14d <= 30).length;
    const overboughtPercentage = (overboughtCount / coinsWithRSI.length) * 100;
    const oversoldPercentage = (oversoldCount / coinsWithRSI.length) * 100;

    // Historical values (simulated based on current)
    const timeSeed = Date.now();
    const historicalValues = {
      oneDay: averageRSI + Math.sin(timeSeed * 0.0001) * 5,
      oneWeek: averageRSI + Math.sin(timeSeed * 0.00005) * 8,
      oneMonth: averageRSI + Math.sin(timeSeed * 0.00002) * 12,
      threeMonths: averageRSI + Math.sin(timeSeed * 0.00001) * 15,
    };

    // Generate heatmap data (last 3 months, monthly)
    const heatmapData: Array<{
      date: string;
      coins: Array<{
        symbol: string;
        rsi: number;
        marketCap: number;
      }>;
    }> = [];

    const now = Date.now();
    const months = 3;
    const top20Coins = coinsWithRSI.slice(0, 20);

    for (let i = months; i >= 0; i--) {
      const date = new Date(now - i * 30 * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      const coins = top20Coins.map(coin => ({
        symbol: coin.symbol,
        rsi: coin.rsi14d + Math.sin((i / months) * Math.PI * 2) * 20,
        marketCap: coin.marketCap,
      }));

      heatmapData.push({
        date: dateStr,
        coins,
      });
    }

    const data: RSIData = {
      averageRSI: Math.round(averageRSI * 100) / 100,
      overboughtPercentage: Math.round(overboughtPercentage * 10) / 10,
      oversoldPercentage: Math.round(oversoldPercentage * 10) / 10,
      historicalValues: {
        oneDay: Math.round(historicalValues.oneDay * 100) / 100,
        oneWeek: Math.round(historicalValues.oneWeek * 100) / 100,
        oneMonth: Math.round(historicalValues.oneMonth * 100) / 100,
        threeMonths: Math.round(historicalValues.threeMonths * 100) / 100,
      },
      heatmapData,
      coinsData: coinsWithRSI,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching RSI data:', error);
    res.status(500).json({ error: 'Failed to fetch RSI data' });
  }
}
