import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';

interface SentimentData {
  coin_id: string;
  coin_name: string;
  coin_symbol: string;
  coin_image: string;
  positive_count: number;
  negative_count: number;
  neutral_count: number;
  total_mentions: number;
  sentiment_score: number; // -100 to 100
  sentiment_label: string; // 'Çok Olumlu', 'Olumlu', 'Nötr', 'Olumsuz', 'Çok Olumsuz'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Top 20 coin'leri CoinGecko'dan al
    const coinsResponse = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false',
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0',
        },
      }
    );

    let coins: any[] = [];
    if (coinsResponse.ok) {
      coins = await coinsResponse.json();
    }

    // Veritabanından post verilerini al ve sentiment analizi yap
    const postsResult = await pool.query(
      `SELECT 
        p.content_text,
        p.created_at,
        p.like_count,
        p.comment_count
      FROM posts p
      WHERE p.is_public = TRUE
        AND p.created_at > NOW() - INTERVAL '30 days'
      ORDER BY p.created_at DESC`
    );

    const posts = postsResult.rows;

    // Her coin için sentiment hesapla
    const sentimentData: SentimentData[] = coins.map((coin) => {
      const coinName = coin.name.toLowerCase();
      const coinSymbol = coin.symbol.toLowerCase();
      
      let positiveCount = 0;
      let negativeCount = 0;
      let neutralCount = 0;

      // Post içeriğinde coin adı/sembolü geçenleri bul ve sentiment analizi yap
      posts.forEach((post: any) => {
        const content = post.content_text?.toLowerCase() || '';
        
        if (content.includes(coinName) || content.includes(coinSymbol)) {
          // Basit sentiment analizi (gerçek uygulamada daha gelişmiş NLP kullanılabilir)
          const positiveWords = ['güzel', 'harika', 'yükseliyor', 'artıyor', 'bullish', 'pump', 'moon', 'lambo', 'to the moon', 'buy', 'satın al', 'al', 'yükseliş', 'kazanç', 'kar', 'profit'];
          const negativeWords = ['düşüyor', 'düşüş', 'bearish', 'dump', 'crash', 'sat', 'sell', 'kayıp', 'zarar', 'loss', 'scam', 'dolandırıcılık', 'kötü', 'berbat'];
          
          const hasPositive = positiveWords.some(word => content.includes(word));
          const hasNegative = negativeWords.some(word => content.includes(word));
          
          if (hasPositive && !hasNegative) {
            positiveCount++;
          } else if (hasNegative && !hasPositive) {
            negativeCount++;
          } else {
            neutralCount++;
          }
        }
      });

      const totalMentions = positiveCount + negativeCount + neutralCount;
      
      // Sentiment score hesapla (-100 to 100)
      let sentimentScore = 0;
      if (totalMentions > 0) {
        sentimentScore = ((positiveCount - negativeCount) / totalMentions) * 100;
      }

      // Sentiment label belirle
      let sentimentLabel = 'Nötr';
      if (sentimentScore >= 60) sentimentLabel = 'Çok Olumlu';
      else if (sentimentScore >= 20) sentimentLabel = 'Olumlu';
      else if (sentimentScore <= -60) sentimentLabel = 'Çok Olumsuz';
      else if (sentimentScore <= -20) sentimentLabel = 'Olumsuz';

      return {
        coin_id: coin.id,
        coin_name: coin.name,
        coin_symbol: coin.symbol.toUpperCase(),
        coin_image: coin.image,
        positive_count: positiveCount,
        negative_count: negativeCount,
        neutral_count: neutralCount,
        total_mentions: totalMentions,
        sentiment_score: Math.round(sentimentScore * 100) / 100,
        sentiment_label: sentimentLabel,
      };
    });

    // Toplam sentiment istatistikleri
    const totalPositive = sentimentData.reduce((sum, coin) => sum + coin.positive_count, 0);
    const totalNegative = sentimentData.reduce((sum, coin) => sum + coin.negative_count, 0);
    const totalNeutral = sentimentData.reduce((sum, coin) => sum + coin.neutral_count, 0);
    const totalMentions = totalPositive + totalNegative + totalNeutral;
    
    const overallSentimentScore = totalMentions > 0 
      ? ((totalPositive - totalNegative) / totalMentions) * 100 
      : 0;

    let overallSentimentLabel = 'Nötr';
    if (overallSentimentScore >= 60) overallSentimentLabel = 'Çok Olumlu';
    else if (overallSentimentScore >= 20) overallSentimentLabel = 'Olumlu';
    else if (overallSentimentScore <= -60) overallSentimentLabel = 'Çok Olumsuz';
    else if (overallSentimentScore <= -20) overallSentimentLabel = 'Olumsuz';

    // En olumlu ve en olumsuz coin'ler
    const sortedBySentiment = [...sentimentData]
      .filter(coin => coin.total_mentions > 0)
      .sort((a, b) => b.sentiment_score - a.sentiment_score);

    res.status(200).json({
      overall: {
        sentiment_score: Math.round(overallSentimentScore * 100) / 100,
        sentiment_label: overallSentimentLabel,
        positive_count: totalPositive,
        negative_count: totalNegative,
        neutral_count: totalNeutral,
        total_mentions: totalMentions,
      },
      coins: sentimentData.sort((a, b) => b.total_mentions - a.total_mentions),
      top_positive: sortedBySentiment.slice(0, 5),
      top_negative: sortedBySentiment.slice(-5).reverse(),
    });
  } catch (error) {
    console.error('Community sentiment error:', error);
    res.status(500).json({ error: 'Topluluk hissiyatı verileri yüklenirken hata oluştu' });
  }
}
