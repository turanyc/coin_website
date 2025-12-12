import { NextApiRequest, NextApiResponse } from 'next';

interface TopCoin {
  id: string;
  name: string;
  symbol: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface MarketOverviewData {
  topCoins: TopCoin[];
  fearGreedIndex: number;
  fearGreedLabel: string;
  altcoinSeasonIndex: number;
  altcoinSeasonLabel: string;
  cmc20Index: number;
  cmc20Change: number;
  totalMarketCap: number;
  totalVolume: number;
  marketCapHistory: Array<{ date: string; value: number }>;
  volumeHistory: Array<{ date: string; value: number }>;
  etfNetFlow: Array<{ date: string; value: number }>;
  bitcoinDominance: number;
  ethereumDominance: number;
  othersDominance: number;
  openInterestPerpetuals: number;
  openInterestFutures: number;
  btcImpliedVolatility: number;
  ethImpliedVolatility: number;
  ethGasSlow: number;
  ethGasStandard: number;
  ethGasFast: number;
  ethGasChange: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Top 5 coin'leri çek (Bitcoin, Ethereum, BNB, Solana, XRP)
    const topCoinIds = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'ripple'];
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${topCoinIds.join(',')}&order=market_cap_desc&per_page=5&page=1&sparkline=true&price_change_percentage=24h`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('CoinGecko API error');
    }

    const topCoinsData: TopCoin[] = await response.json();

    // Global market data
    const globalResponse = await fetch('https://api.coingecko.com/api/v3/global');
    const globalData = await globalResponse.json();
    const totalMarketCap = globalData.data?.total_market_cap?.usd || 0;
    const totalVolume = globalData.data?.total_volume?.usd || 0;
    const btcDominance = globalData.data?.market_cap_percentage?.btc || 0;
    const ethDominance = globalData.data?.market_cap_percentage?.eth || 0;
    const othersDominance = 100 - btcDominance - ethDominance;

    // Market cap history (simulated - 30 days)
    const marketCapHistory: Array<{ date: string; value: number }> = [];
    const volumeHistory: Array<{ date: string; value: number }> = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const variation = Math.sin(i * 0.2) * 0.1 + Math.random() * 0.05;
      marketCapHistory.push({
        date: dateStr,
        value: totalMarketCap * (1 + variation),
      });
      volumeHistory.push({
        date: dateStr,
        value: totalVolume * (1 + variation * 2),
      });
    }

    // ETF Net Flow (simulated)
    const etfNetFlow: Array<{ date: string; value: number }> = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const flow = (Math.random() - 0.5) * 500000000; // -250M to +250M
      etfNetFlow.push({
        date: dateStr,
        value: flow,
      });
    }

    // Simulated data
    const timeSeed = Date.now();
    const fearGreedIndex = Math.floor((Math.sin(timeSeed * 0.0001) + 1) * 50); // 0-100
    const fearGreedLabels = ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed'];
    const fearGreedLabel = fearGreedLabels[Math.floor(fearGreedIndex / 20)];

    const altcoinSeasonIndex = Math.floor((Math.sin(timeSeed * 0.00005) + 1) * 50); // 0-100
    const altcoinSeasonLabel = altcoinSeasonIndex < 50 ? 'Bitcoin Season' : 'Altcoin Season';

    const cmc20Index = 189.2 + (Math.sin(timeSeed * 0.0001) * 10);
    const cmc20Change = (Math.sin(timeSeed * 0.0001) * 5);

    const openInterestPerpetuals = 764910000000 + (Math.sin(timeSeed * 0.0001) * 10000000000);
    const openInterestFutures = 4290000000 + (Math.sin(timeSeed * 0.0001) * 500000000);

    const btcImpliedVolatility = 51.36 + (Math.sin(timeSeed * 0.0001) * 5);
    const ethImpliedVolatility = 76.60 + (Math.sin(timeSeed * 0.0001) * 5);

    const ethGasBase = 0.04;
    const ethGasChange = -45 + (Math.sin(timeSeed * 0.0001) * 10);

    const data: MarketOverviewData = {
      topCoins: topCoinsData,
      fearGreedIndex,
      fearGreedLabel,
      altcoinSeasonIndex,
      altcoinSeasonLabel,
      cmc20Index,
      cmc20Change,
      totalMarketCap,
      totalVolume,
      marketCapHistory,
      volumeHistory,
      etfNetFlow,
      bitcoinDominance: btcDominance,
      ethereumDominance: ethDominance,
      othersDominance,
      openInterestPerpetuals,
      openInterestFutures,
      btcImpliedVolatility,
      ethImpliedVolatility,
      ethGasSlow: ethGasBase,
      ethGasStandard: ethGasBase,
      ethGasFast: ethGasBase,
      ethGasChange,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching market overview:', error);
    res.status(500).json({ error: 'Failed to fetch market overview data' });
  }
}
