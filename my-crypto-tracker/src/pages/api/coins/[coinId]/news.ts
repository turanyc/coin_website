// pages/api/coins/[coinId]/news.ts
import { NextApiRequest, NextApiResponse } from 'next';

interface CoinGeckoNewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  image?: {
    thumbnail?: {
      contentUrl?: string;
    };
  };
  provider: Array<{
    name: string;
  }>;
  datePublished: string;
}

interface CoinGeckoNewsResponse {
  value: CoinGeckoNewsItem[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { coinId } = req.query;

  if (!coinId || typeof coinId !== 'string') {
    return res.status(400).json({ error: 'Coin ID gerekli' });
  }

  try {
    // Timeout için AbortController kullan
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    // Bing News Search API veya alternatif bir haber API'si kullanılabilir
    // Şimdilik CoinGecko'nun haber API'si yok, bu yüzden örnek veri döndürelim
    // Gerçek uygulamada bir haber API'si entegre edilebilir

    clearTimeout(timeoutId);

    // Coin adını URL-safe hale getir
    const coinNameEncoded = encodeURIComponent(coinId);
    const coinNameDisplay = coinId.charAt(0).toUpperCase() + coinId.slice(1);

    // Örnek haber verileri (gerçek API entegrasyonu için değiştirilebilir)
    const sampleNews = [
      {
        id: '1',
        title: `${coinNameDisplay} Fiyat Analizi ve Güncel Gelişmeler`,
        description: `${coinId} hakkında son gelişmeler ve piyasa analizi.`,
        url: `https://cointelegraph.com/search?q=${coinNameEncoded}`,
        image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
        source: 'CoinTelegraph',
        publishedTime: 'yaklaşık 1 saat önce',
      },
      {
        id: '2',
        title: `${coinNameDisplay} Piyasa Görünümü ve Yatırımcı Yorumları`,
        description: `${coinId} için piyasa görünümü ve uzman yorumları.`,
        url: `https://cointurk.com/search?q=${coinNameEncoded}`,
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
        source: 'Cointurk',
        publishedTime: 'yaklaşık 2 saat önce',
      },
      {
        id: '3',
        title: `${coinNameDisplay} Teknik Analiz ve Gelecek Tahminleri`,
        description: `${coinId} için teknik analiz ve gelecek fiyat tahminleri.`,
        url: `https://cointelegraph.com/search?q=${coinNameEncoded}`,
        image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop',
        source: 'CoinTelegraph',
        publishedTime: 'yaklaşık 3 saat önce',
      },
    ];

    res.status(200).json({
      news: sampleNews,
    });
  } catch (error) {
    console.error('News API Error:', error);
    
    res.status(200).json({
      news: [],
      error: 'Haberler yüklenirken bir hata oluştu.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
    });
  }
}

