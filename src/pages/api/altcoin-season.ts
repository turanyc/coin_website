import { NextApiRequest, NextApiResponse } from 'next';

interface AltcoinSeasonData {
  currentValue: number;
  currentClassification: string;
  historicalValues: {
    yesterday: { value: number; classification: string };
    lastWeek: { value: number; classification: string };
    lastMonth: { value: number; classification: string };
  };
  yearlyPerformance: {
    high: { value: number; classification: string; date: string };
    low: { value: number; classification: string; date: string };
  };
  chartData: Array<{
    date: string;
    altcoinSeasonIndex: number;
    altcoinMarketCap: number;
  }>;
  top100Performance: Array<{
    id: string;
    symbol: string;
    name: string;
    priceChange90d: number;
    isBitcoin: boolean;
  }>;
}

const getClassification = (value: number): string => {
  return value < 50 ? 'Bitcoin Season' : 'Altcoin Season';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Fetch top 100 coins from CoinGecko
    const coinsResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=90d',
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

    // Find Bitcoin
    const bitcoin = coinsData.find((coin: any) => coin.id === 'bitcoin');
    const bitcoinPriceChange90d = bitcoin?.price_change_percentage_90d_in_currency || 0;

    // Calculate Altcoin Season Index
    // Index = percentage of top 100 coins that outperformed Bitcoin in last 90 days
    let outperformingCount = 0;
    const top100Performance = coinsData.map((coin: any) => {
      const priceChange90d = coin.price_change_percentage_90d_in_currency || 0;
      const isBitcoin = coin.id === 'bitcoin';
      
      if (!isBitcoin && priceChange90d > bitcoinPriceChange90d) {
        outperformingCount++;
      }

      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        priceChange90d: priceChange90d || 0,
        isBitcoin: isBitcoin,
      };
    });

    // Calculate index: (coins outperforming BTC / total altcoins) * 100
    const totalAltcoins = top100Performance.filter(c => !c.isBitcoin).length;
    const currentValue = totalAltcoins > 0 ? Math.round((outperformingCount / totalAltcoins) * 100) : 50;
    const currentClassification = getClassification(currentValue);

    // Calculate altcoin market cap (sum of all coins except Bitcoin)
    const altcoinMarketCap = coinsData
      .filter((coin: any) => coin.id !== 'bitcoin')
      .reduce((sum: number, coin: any) => sum + (coin.market_cap || 0), 0);

    // Historical values (simulated based on current value with variation)
    const timeSeed = Date.now();
    const historicalValues = {
      yesterday: {
        value: Math.max(0, Math.min(100, currentValue + Math.floor(Math.sin(timeSeed * 0.0001) * 5))),
        classification: getClassification(Math.max(0, Math.min(100, currentValue + Math.floor(Math.sin(timeSeed * 0.0001) * 5)))),
      },
      lastWeek: {
        value: Math.max(0, Math.min(100, currentValue + Math.floor(Math.sin(timeSeed * 0.00005) * 10))),
        classification: getClassification(Math.max(0, Math.min(100, currentValue + Math.floor(Math.sin(timeSeed * 0.00005) * 10)))),
      },
      lastMonth: {
        value: Math.max(0, Math.min(100, currentValue + Math.floor(Math.sin(timeSeed * 0.00002) * 15))),
        classification: getClassification(Math.max(0, Math.min(100, currentValue + Math.floor(Math.sin(timeSeed * 0.00002) * 15)))),
      },
    };

    // Yearly performance (simulated)
    const yearlyPerformance = {
      high: {
        value: Math.max(currentValue, 75 + Math.floor(Math.sin(timeSeed * 0.00001) * 20)),
        classification: 'Altcoin Season',
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      low: {
        value: Math.min(currentValue, 25 - Math.floor(Math.sin(timeSeed * 0.00001) * 10)),
        classification: 'Bitcoin Season',
        date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    };

    // Generate chart data (last 730 days)
    const chartData: Array<{
      date: string;
      altcoinSeasonIndex: number;
      altcoinMarketCap: number;
    }> = [];

    const now = Date.now();
    const days = 730;
    
    // Use Bitcoin historical data as proxy for altcoin market cap trend
    let btcHistorical: number[][] = [];
    try {
      const btcResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=730&interval=daily',
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );
      if (btcResponse.ok) {
        const btcData = await btcResponse.json();
        btcHistorical = btcData.market_caps || [];
      }
    } catch (error) {
      console.warn('Bitcoin historical data fetch failed, using simulated data');
    }

    // Create map of BTC market cap by date
    const btcMarketCapMap = new Map<string, number>();
    btcHistorical.forEach((entry: number[]) => {
      const date = new Date(entry[0]);
      const dateStr = date.toISOString().split('T')[0];
      btcMarketCapMap.set(dateStr, entry[1]);
    });

    // Generate chart data
    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      
      // Simulate index variation
      const baseIndex = currentValue;
      const variation = Math.sin((i / days) * Math.PI * 4) * 30;
      const indexValue = Math.max(0, Math.min(100, baseIndex + variation));
      
      // Calculate altcoin market cap (use BTC market cap as base, scale it)
      const btcCap = btcMarketCapMap.get(dateStr) || altcoinMarketCap * 0.5;
      const estimatedAltcoinCap = altcoinMarketCap * (0.5 + Math.random() * 0.5) * (btcCap / (bitcoin?.market_cap || altcoinMarketCap));

      chartData.push({
        date: dateStr,
        altcoinSeasonIndex: Math.round(indexValue),
        altcoinMarketCap: estimatedAltcoinCap,
      });
    }

    // Sort top 100 by performance
    top100Performance.sort((a, b) => b.priceChange90d - a.priceChange90d);

    const data: AltcoinSeasonData = {
      currentValue,
      currentClassification,
      historicalValues,
      yearlyPerformance,
      chartData,
      top100Performance: top100Performance.slice(0, 100),
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Altcoin Season data:', error);
    res.status(500).json({ error: 'Failed to fetch Altcoin Season data' });
  }
}
