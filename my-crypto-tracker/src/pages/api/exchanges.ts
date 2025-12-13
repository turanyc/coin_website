import { NextApiRequest, NextApiResponse } from 'next';

interface Exchange {
  id: string;
  name: string;
  image: string;
  trust_score: number;
  trust_score_rank: number;
  trade_volume_24h_btc: number;
  trade_volume_24h_btc_normalized: number;
  year_established?: number;
  country?: string;
  url?: string;
  description?: string;
  has_trading_incentive?: boolean;
  centralized?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // CoinGecko'dan exchange listesini al
    const response = await fetch(
      'https://api.coingecko.com/api/v3/exchanges?per_page=250&page=1',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      console.error(`CoinGecko Exchanges API hatası: ${response.status}`);
      return res.status(200).json({
        error: `API hatası: ${response.status}`,
        exchanges: [],
      });
    }

    const exchangesData: Exchange[] = await response.json();
    clearTimeout(timeoutId);

    // Verileri formatla ve ek bilgiler ekle
    const formattedExchanges = exchangesData.map((exchange, index) => {
      // Score hesaplama (trust_score bazlı, 0-10 arası)
      const score = exchange.trust_score ? (exchange.trust_score / 10).toFixed(1) : '0.0';
      
      // 24h Volume (USD olarak - BTC * BTC fiyatı yaklaşık 65000)
      const btcPrice = 65000; // Approximate
      const volume24h = exchange.trade_volume_24h_btc * btcPrice;
      
      // Liquidity score (normalize edilmiş volume bazlı, 0-1000 arası)
      const liquidity = Math.min(1000, Math.round((exchange.trade_volume_24h_btc_normalized / 100) * 100));
      
      // Weekly visits (simüle edilmiş - volume bazlı)
      const weeklyVisits = Math.round((volume24h / 1000000) * 1000);
      
      // Markets ve Coins (simüle edilmiş)
      const markets = Math.round(100 + Math.random() * 1500);
      const coins = Math.round(50 + Math.random() * 700);
      const fiat = Math.round(5 + Math.random() * 85);
      
      // Last 7 days sparkline data (simüle edilmiş)
      const sparkline = Array.from({ length: 7 }, () => 
        Math.random() > 0.5 ? Math.random() * 0.3 - 0.15 : -(Math.random() * 0.3 - 0.15)
      );
      
      return {
        rank: index + 1,
        id: exchange.id,
        name: exchange.name,
        image: exchange.image,
        score: parseFloat(score),
        volume24h: volume24h,
        liquidity: liquidity,
        weeklyVisits: weeklyVisits,
        markets: markets,
        coins: coins,
        fiat: fiat,
        sparkline: sparkline,
        trustScore: exchange.trust_score || 0,
        yearEstablished: exchange.year_established || null,
        country: exchange.country || null,
        url: exchange.url || null,
        centralized: exchange.centralized !== false, // Default true
      };
    });

    // Score'a göre sırala (yüksekten düşüğe)
    formattedExchanges.sort((a, b) => b.score - a.score);

    // Rank'leri güncelle
    formattedExchanges.forEach((exchange, index) => {
      exchange.rank = index + 1;
    });

    res.status(200).json({
      exchanges: formattedExchanges,
    });
  } catch (error) {
    console.error('Exchanges API hatası:', error);
    res.status(200).json({
      error: 'Veri yüklenirken bir hata oluştu',
      exchanges: [],
    });
  }
}

