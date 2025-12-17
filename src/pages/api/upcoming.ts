// pages/api/upcoming.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface UpcomingCoin {
  id: string;
  name: string;
  symbol: string;
  image: string | null;
  firstListingDate: string;
  description?: string;
  website?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // CoinGecko'da upcoming coins için özel bir endpoint yok
    // Bu yüzden yeni eklenen coin'leri veya yakında listelenecek coin'leri simüle ediyoruz
    // Gerçek uygulamada bu veriler başka bir kaynaktan (ICO takvimi, proje duyuruları) gelebilir
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // Son eklenen coin'leri al (yeni coin'ler genellikle "upcoming" olarak kabul edilebilir)
    const marketsResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=id_asc&per_page=100&page=1&sparkline=false',
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
    }> = await marketsResponse.json();

    clearTimeout(timeoutId);

    // Upcoming coin'ler oluştur (simüle edilmiş listing tarihleri ile)
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    // Rastgele listing tarihleri oluştur (gelecek aylar/yıllar)
    const upcomingCoins: UpcomingCoin[] = marketsData.slice(0, 50).map((coin, index) => {
      const monthsAhead = Math.floor(Math.random() * 12) + 1;
      const targetMonth = (currentMonth + monthsAhead) % 12;
      const targetYear = currentYear + Math.floor((currentMonth + monthsAhead) / 12);
      
      let listingDate: string;
      if (Math.random() > 0.7) {
        // Bazı coin'ler için sadece yıl veya çeyrek göster
        if (Math.random() > 0.5) {
          listingDate = `${targetYear}`;
        } else {
          const quarter = Math.floor(targetMonth / 3) + 1;
          listingDate = `Q${quarter} ${targetYear}`;
        }
      } else {
        listingDate = `${months[targetMonth]} ${targetYear}`;
      }
      
      // Bazı coin'ler için "N/A" göster
      if (Math.random() > 0.8) {
        listingDate = 'N/A';
      }

      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        image: coin.image,
        firstListingDate: listingDate,
        description: `${coin.name} yakında listelenecek`,
        website: `https://www.coingecko.com/en/coins/${coin.id}`,
      };
    });

    res.status(200).json({ coins: upcomingCoins });
  } catch (error) {
    console.error('Upcoming API Error:', error);
    
    res.status(200).json({
      error: 'Upcoming verileri çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      coins: [],
    });
  }
}
