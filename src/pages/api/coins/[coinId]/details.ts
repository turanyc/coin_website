// pages/api/coins/[coinId]/details.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface CoinGeckoCoinData {
  id: string;
  name: string;
  symbol: string;
  description: {
    en: string;
    tr?: string;
  };
  links: {
    homepage?: string[];
    whitepaper?: string;
    blockchain_site?: string[];
    official_forum_url?: string[];
    subreddit_url?: string;
    repos_url?: {
      github?: string[];
    };
  };
  image: {
    large?: string;
  };
  market_data: {
    current_price: {
      usd: number;
      try: number;
    };
    market_cap: {
      usd: number;
      try: number;
    };
    total_volume: {
      usd: number;
      try: number;
    };
    high_24h: {
      usd: number;
      try: number;
    };
    low_24h: {
      usd: number;
      try: number;
    };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    ath: {
      usd: number;
      try: number;
    };
    ath_date: {
      usd: string;
      try: string;
    };
    atl: {
      usd: number;
      try: number;
    };
    atl_date: {
      usd: string;
      try: string;
    };
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    market_cap_rank: number;
    fully_diluted_valuation: {
      usd: number;
      try: number;
    };
  };
  categories?: string[];
  platforms?: Record<string, string>;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { coinId } = req.query;

  if (!coinId || typeof coinId !== 'string') {
    return res.status(400).json({ error: 'Coin ID gerekli' });
  }

  try {
    // Timeout için AbortController kullan
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    // CoinGecko Coin Details API'den veri çek
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true&sparkline=false`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`CoinGecko Details API hatası: ${response.status} ${response.statusText}`);
      return res.status(200).json({
        error: `API hatası: ${response.status}`,
        coinId,
      });
    }

    const data: CoinGeckoCoinData = await response.json();

    // Veriyi işle ve döndür
    const coinDetails = {
      id: data.id,
      name: data.name,
      symbol: data.symbol.toUpperCase(),
      description: data.description?.tr || data.description?.en || '',
      image: data.image?.large || null,
      
      // Fiyatlar
      prices: {
        usd: data.market_data?.current_price?.usd || 0,
        try: data.market_data?.current_price?.try || 0,
      },
      
      // 24 saatlik aralık
      priceRange24h: {
        high: {
          usd: data.market_data?.high_24h?.usd || 0,
          try: data.market_data?.high_24h?.try || 0,
        },
        low: {
          usd: data.market_data?.low_24h?.usd || 0,
          try: data.market_data?.low_24h?.try || 0,
        },
      },
      
      // 7 günlük aralık (tahmini - CoinGecko'da direkt yok, chart'tan hesaplanabilir)
      priceRange7d: {
        high: 0, // Chart API'den gelecek
        low: 0, // Chart API'den gelecek
      },
      
      // All-time high/low
      ath: {
        price: {
          usd: data.market_data?.ath?.usd || 0,
          try: data.market_data?.ath?.try || 0,
        },
        date: data.market_data?.ath_date?.usd || null,
      },
      atl: {
        price: {
          usd: data.market_data?.atl?.usd || 0,
          try: data.market_data?.atl?.try || 0,
        },
        date: data.market_data?.atl_date?.usd || null,
      },
      
      // Yüzdelik değişimler
      priceChanges: {
        '24h': data.market_data?.price_change_percentage_24h || 0,
        '7d': data.market_data?.price_change_percentage_7d || 0,
        '30d': data.market_data?.price_change_percentage_30d || 0,
      },
      
      // Piyasa verileri
      marketData: {
        marketCap: {
          usd: data.market_data?.market_cap?.usd || 0,
          try: data.market_data?.market_cap?.try || 0,
        },
        volume24h: {
          usd: data.market_data?.total_volume?.usd || 0,
          try: data.market_data?.total_volume?.try || 0,
        },
        fullyDilutedValuation: {
          usd: data.market_data?.fully_diluted_valuation?.usd || 0,
          try: data.market_data?.fully_diluted_valuation?.try || 0,
        },
        marketCapRank: data.market_data?.market_cap_rank || null,
      },
      
      // Arz bilgileri
      supply: {
        circulating: data.market_data?.circulating_supply || 0,
        total: data.market_data?.total_supply || 0,
        max: data.market_data?.max_supply || 0,
      },
      
      // Linkler
      links: {
        homepage: data.links?.homepage?.[0] || null,
        whitepaper: data.links?.whitepaper || null,
        blockchainExplorers: data.links?.blockchain_site || [],
        officialForum: data.links?.official_forum_url || [],
        subreddit: data.links?.subreddit_url || null,
        github: data.links?.repos_url?.github?.[0] || null,
      },
      
      // Kategoriler
      categories: data.categories || [],
      
      // Platformlar (blockchain)
      platforms: data.platforms || {},
    };

    res.status(200).json(coinDetails);
  } catch (error) {
    console.error('Coin Details API Error:', error);
    
    // Hata durumunda bile 200 döndür (frontend'in çökmesini önlemek için)
    res.status(200).json({
      error: 'CoinGecko API\'den detaylı veri çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      coinId,
    });
  }
}

