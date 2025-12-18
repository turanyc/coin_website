import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { post_id, user_id } = req.body;

      if (!post_id || !user_id) {
        return res.status(400).json({ error: 'post_id ve user_id gerekli' });
      }

      // Kullanıcı daha önce beğenmiş mi kontrol et
      const existingLike = await pool.query(
        'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
        [post_id, user_id]
      );

      if (existingLike.rows.length > 0) {
        // Beğeniyi kaldır
        await pool.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [post_id, user_id]);
        
        // Post'un like_count'unu güncelle
        await pool.query(
          'UPDATE posts SET like_count = GREATEST(0, like_count - 1) WHERE id = $1',
          [post_id]
        );

        res.status(200).json({ liked: false, message: 'Beğeni kaldırıldı' });
      } else {
        // Beğeniyi ekle
        await pool.query(
          'INSERT INTO likes (post_id, user_id) VALUES ($1, $2)',
          [post_id, user_id]
        );

        // Post'un like_count'unu güncelle
        await pool.query(
          'UPDATE posts SET like_count = like_count + 1 WHERE id = $1',
          [post_id]
        );

        res.status(200).json({ liked: true, message: 'Beğeni eklendi' });
      }
    } catch (error) {
      console.error('Like error:', error);
      res.status(500).json({ error: 'Beğeni işlemi başarısız' });
    }
  } else if (req.method === 'GET') {
    try {
      const { post_id, user_id } = req.query;

      if (!post_id || !user_id) {
        return res.status(400).json({ error: 'post_id ve user_id gerekli' });
      }

      const result = await pool.query(
        'SELECT id FROM likes WHERE post_id = $1 AND user_id = $2',
        [post_id, user_id]
      );

      res.status(200).json({ liked: result.rows.length > 0 });
    } catch (error) {
      console.error('Like check error:', error);
      res.status(500).json({ error: 'Beğeni kontrolü başarısız' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
