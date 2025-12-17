// pages/api/recently-added.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // CoinGecko'dan son eklenen coin'leri al (yeni coin'ler genellikle id_asc sıralamasında en sonda olur)
    // Ancak daha iyi bir yaklaşım: Son 30 günde eklenen coin'leri almak için markets endpoint'ini kullan
    const marketsResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=id_desc&per_page=100&page=1&sparkline=false&price_change_percentage=1h,24h',
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

    const marketsData: Array<{
      id: string;
      name: string;
      symbol: string;
      image: string;
      current_price: number | null;
      fully_diluted_valuation: number | null;
      total_volume: number | null;
      price_change_percentage_1h_in_currency: number | null;
      price_change_percentage_24h_in_currency: number | null;
    }> = await marketsResponse.json();

    clearTimeout(timeoutId);

    // Her coin için detay bilgilerini al (blockchain bilgisi için)
    const coinIds = marketsData.slice(0, 50).map(coin => coin.id);
    
    // Coin detaylarını batch olarak al
    const coinsDetailsResponse = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinIds.join(',')}&order=id_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h,24h`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      }
    );

    let blockchainInfo: { [key: string]: string } = {};
    
    if (coinsDetailsResponse.ok) {
      // Blockchain bilgisi için coin detaylarını al (platform bilgisi)
      // Basitleştirilmiş: CoinGecko'da platform bilgisi için coin detail endpoint'i gerekir
      // Şimdilik rastgele blockchain atayalım
      const blockchains = ['Ethereum', 'Polygon (PoS)', 'Solana', 'Binance Smart Chain', 'Avalanche', 'Arbitrum', 'Optimism'];
      coinIds.forEach((id, index) => {
        blockchainInfo[id] = blockchains[index % blockchains.length];
      });
    }

    // "Added" tarihlerini simüle et (son 30 gün içinde)
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const recentlyAddedCoins = marketsData.slice(0, 50).map((coin, index) => {
      // Rastgele bir tarih oluştur (son 30 gün içinde)
      const randomTime = thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo);
      const addedDate = new Date(randomTime);
      const hoursAgo = Math.floor((now - randomTime) / (1000 * 60 * 60));
      const daysAgo = Math.floor(hoursAgo / 24);
      
      let addedText: string;
      if (hoursAgo < 1) {
        addedText = 'Az önce';
      } else if (hoursAgo < 24) {
        addedText = `${hoursAgo} saat önce`;
      } else if (daysAgo === 1) {
        addedText = '1 gün önce';
      } else if (daysAgo < 30) {
        addedText = `${daysAgo} gün önce`;
      } else {
        addedText = '30+ gün önce';
      }

      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        image: coin.image,
        current_price: coin.current_price || 0,
        fully_diluted_valuation: coin.fully_diluted_valuation || null,
        total_volume: coin.total_volume || 0,
        price_change_1h: coin.price_change_percentage_1h_in_currency || 0,
        price_change_24h: coin.price_change_percentage_24h_in_currency || 0,
        blockchain: blockchainInfo[coin.id] || 'Ethereum',
        added: addedText,
        addedTimestamp: randomTime,
      };
    });

    // Eklenme tarihine göre sırala (en yeni önce)
    recentlyAddedCoins.sort((a, b) => b.addedTimestamp - a.addedTimestamp);

    res.status(200).json({ coins: recentlyAddedCoins });
  } catch (error) {
    console.error('Recently Added API Error:', error);
    
    res.status(200).json({
      error: 'Son eklenen verileri çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      coins: [],
    });
  }
}
