// pages/api/categories.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface CoinGeckoCategory {
  id: string;
  name: string;
  market_cap: number;
  market_cap_change_24h: number;
  content: string;
  top_3_coins: string[];
  top_3_coins_id?: string[];
  volume_24h: number;
  updated_at: string;
}

interface CoinGeckoCoin {
  id: string;
  image: string;
  symbol: string;
  name: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // CoinGecko Categories API'den veri çek
    const categoriesResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/categories',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      }
    );

    if (!categoriesResponse.ok) {
      console.error(`CoinGecko Categories API hatası: ${categoriesResponse.status} ${categoriesResponse.statusText}`);
      return res.status(200).json({
        error: `API hatası: ${categoriesResponse.status}`,
        categories: [],
      });
    }

    const categoriesData: CoinGeckoCategory[] = await categoriesResponse.json();
    
    // Debug: İlk kategoriyi log'la
    if (categoriesData.length > 0) {
      console.log('Sample category data:', {
        name: categoriesData[0].name,
        top_3_coins: categoriesData[0].top_3_coins,
        top_3_coins_id: categoriesData[0].top_3_coins_id,
      });
    }

    // Tüm coin ID'lerini topla (top_3_coins_id varsa onu kullan)
    const allCoinIds = new Set<string>();
    categoriesData.forEach((category) => {
      if (category.top_3_coins_id && Array.isArray(category.top_3_coins_id)) {
        category.top_3_coins_id.forEach((coinId) => allCoinIds.add(coinId));
      }
    });

    // Coin görsellerini çek (top 1000 coin'den - daha fazla kapsama için)
    let coinImages: Map<string, string> = new Map();
    try {
      // Birden fazla sayfa çek (her sayfada 250 coin)
      for (let page = 1; page <= 4; page++) {
        const coinsResponse = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0',
            },
            signal: controller.signal,
          }
        );

        if (coinsResponse.ok) {
          const coinsData: CoinGeckoCoin[] = await coinsResponse.json();
          if (coinsData.length === 0) break; // Sayfa boşsa dur
          
          coinsData.forEach((coin) => {
            if (coin.image) {
              coinImages.set(coin.id, coin.image);
            }
          });
        } else {
          break;
        }
      }
      
      // Eksik coin'ler için coin listesini çek (daha fazla coin için)
      if (allCoinIds.size > 0) {
        const missingCoinIds = Array.from(allCoinIds).filter(id => !coinImages.has(id));
        if (missingCoinIds.length > 0 && missingCoinIds.length <= 50) {
          // Eksik coin'ler için ayrı ayrı coin detaylarını çek (max 50 coin)
          for (const coinId of missingCoinIds.slice(0, 50)) {
            try {
              const coinResponse = await fetch(
                `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`,
                {
                  headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0',
                  },
                  signal: controller.signal,
                }
              );
              
              if (coinResponse.ok) {
                const coinData: any = await coinResponse.json();
                if (coinData.image?.large) {
                  coinImages.set(coinId, coinData.image.large);
                } else if (coinData.image?.small) {
                  coinImages.set(coinId, coinData.image.small);
                }
              }
            } catch (error) {
              // Tek bir coin için hata olsa bile devam et
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Coin images çekilemedi, devam ediliyor:', error);
    }

    // Veriyi işle ve döndür
    const categories = categoriesData.map((category) => {
      // top_3_coins image URL'leri içeriyor, top_3_coins_id coin ID'lerini içeriyor
      const topCoins = (category.top_3_coins || []).map((item, index) => {
        // Önce top_3_coins_id'den coin ID'yi al
        let coinId = category.top_3_coins_id?.[index];
        
        // Eğer item bir URL ise (CoinGecko genellikle image URL'leri döndürür)
        if (item.startsWith('http')) {
          // Eğer top_3_coins_id yoksa, URL'den coin ID'yi çıkarmaya çalış
          // URL formatı: https://assets.coingecko.com/coins/images/{image_id}/small/{coin_id}.png
          if (!coinId && item.includes('/coins/images/')) {
            const urlParts = item.split('/');
            const fileName = urlParts[urlParts.length - 1];
            if (fileName) {
              coinId = fileName.replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
            }
          }
          
          // Eğer hala coinId yoksa, index kullan
          if (!coinId) {
            coinId = `coin_${index}`;
          }
          
          return {
            id: coinId,
            image: item,
          };
        } else {
          // Item bir coin ID ise
          if (!coinId) {
            coinId = item;
          }
          
          // Markets API'den image'ı bul
          const image = coinImages.get(coinId);
          
          // Eğer markets API'de yoksa, CoinGecko'nun standart image URL formatını kullan
          const fallbackImage = image || `https://assets.coingecko.com/coins/images/${coinId}/small/${coinId}.png`;
          
          return {
            id: coinId,
            image: image || fallbackImage,
          };
        }
      });

      return {
        id: category.id,
        name: category.name,
        marketCap: category.market_cap || 0,
        marketCapChange24h: category.market_cap_change_24h || 0,
        description: category.content || '',
        topCoins,
        volume24h: category.volume_24h || 0,
        updatedAt: category.updated_at,
      };
    });

    // Market cap'e göre sırala
    categories.sort((a, b) => b.marketCap - a.marketCap);

    clearTimeout(timeoutId);

    res.status(200).json({ categories });
  } catch (error) {
    console.error('Categories API Error:', error);
    
    res.status(200).json({
      error: 'CoinGecko API\'den kategoriler çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      categories: [],
    });
  }
}
