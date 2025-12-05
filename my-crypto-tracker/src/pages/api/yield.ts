// pages/api/yield.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface YieldProduct {
  id: string;
  coinId: string;
  coinName: string;
  coinSymbol: string;
  coinImage: string;
  serviceProviders: string[];
  netAPY: {
    min: number;
    max: number;
  };
  yieldType: string[];
  defiOrCefi: 'DeFi' | 'CeFi';
  chain?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // CoinGecko'dan top coin'leri al
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
        products: [],
      });
    }

    const marketsData: Array<{
      id: string;
      name: string;
      symbol: string;
      image: string;
    }> = await marketsResponse.json();

    clearTimeout(timeoutId);

    // Yield products oluştur (simüle edilmiş veri - gerçek yield API'si yok)
    // UYARI: APY değerleri, provider'lar ve yield tipleri simüle edilmiştir.
    // Gerçek yield verileri için DeFi protokollerinin (Aave, Compound) veya 
    // merkezi borsaların (Binance, Coinbase) API'lerini kullanmak gerekir.
    const yieldProducts: YieldProduct[] = marketsData.slice(0, 50).map((coin, index) => {
      // Rastgele yield tipleri
      const yieldTypes = [
        ['Earn (Fixed)', 'Earn (Locked)', 'Staking'],
        ['Earn (Fixed)'],
        ['Staking'],
        ['Lending'],
        ['Earn (Locked)', 'Staking'],
        ['Earn (Fixed)', 'Lending'],
      ];
      
      // Rastgele provider'lar
      const providers = [
        ['Binance', 'Coinbase', 'Kraken'],
        ['Binance'],
        ['Coinbase', 'Kraken'],
        ['Binance', 'Coinbase'],
        ['Kraken'],
        ['Binance', 'Kraken', 'Gemini'],
      ];

      const isDeFi = Math.random() > 0.5;
      const apyMin = Math.random() * 5;
      const apyMax = apyMin + Math.random() * 15;

      return {
        id: `yield-${coin.id}`,
        coinId: coin.id,
        coinName: coin.name,
        coinSymbol: coin.symbol.toUpperCase(),
        coinImage: coin.image,
        serviceProviders: providers[Math.floor(Math.random() * providers.length)],
        netAPY: {
          min: parseFloat(apyMin.toFixed(2)),
          max: parseFloat(apyMax.toFixed(2)),
        },
        yieldType: yieldTypes[Math.floor(Math.random() * yieldTypes.length)],
        defiOrCefi: isDeFi ? 'DeFi' : 'CeFi',
        chain: isDeFi ? ['Ethereum', 'Binance Smart Chain', 'Polygon', 'Solana'][Math.floor(Math.random() * 4)] : undefined,
      };
    });

    res.status(200).json({ products: yieldProducts });
  } catch (error) {
    console.error('Yield API Error:', error);
    
    res.status(200).json({
      error: 'Yield verileri çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      products: [],
    });
  }
}
