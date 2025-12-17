import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // En çok beğenilen veya yorumlanan postu hot topic olarak seç
    const result = await pool.query(
      `SELECT 
        p.id,
        p.content_text,
        p.image_url,
        p.like_count,
        p.comment_count,
        u.full_name as author_name,
        u.profile_picture_url as author_image
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.is_public = TRUE
        AND p.created_at > NOW() - INTERVAL '7 days'
      ORDER BY (p.like_count + p.comment_count * 2) DESC
      LIMIT 1`
    );

    if (result.rows.length === 0) {
      // Eğer post yoksa, CoinGecko'dan trending haber al
      const response = await fetch(
        'https://api.coingecko.com/api/v3/global',
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const btcPrice = data.data?.market_data?.current_price?.btc || 65000;
        
        return res.status(200).json({
          topic: {
            title: 'BTC Fiyatı Düşüyor',
            description: `Bitcoin fiyatı $${btcPrice.toLocaleString()} seviyesine geriledi.`,
            image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
            coin: 'BTC',
            coinIcon: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
          },
        });
      }
    }

    const post = result.rows[0];
    
    res.status(200).json({
      topic: {
        title: post.content_text.substring(0, 100) + (post.content_text.length > 100 ? '...' : ''),
        description: post.content_text,
        image: post.image_url,
        author: post.author_name,
        authorImage: post.author_image,
        likeCount: post.like_count,
        commentCount: post.comment_count,
      },
    });
  } catch (error) {
    console.error('Hot topic error:', error);
    res.status(200).json({
      topic: {
        title: 'Kripto Piyasası Güncellemesi',
        description: 'Son 24 saatte piyasa hareketleri',
        coin: 'BTC',
      },
    });
  }
}
