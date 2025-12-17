import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Tüm herkese açık postları getir (en yeni önce)
      const result = await pool.query(
        `SELECT 
          p.id,
          p.user_id,
          p.content_text,
          p.image_url,
          p.post_type,
          p.created_at,
          p.like_count,
          p.comment_count,
          p.share_count,
          p.view_count,
          u.full_name as user_name,
          u.email as user_email,
          u.profile_picture_url,
          u.is_verified
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE p.is_public = TRUE
        ORDER BY p.created_at DESC
        LIMIT 50`
      );

      res.status(200).json({ posts: result.rows });
    } catch (error) {
      console.error('Posts fetch error:', error);
      res.status(500).json({ error: 'Postlar yüklenirken hata oluştu' });
    }
  } else if (req.method === 'POST') {
    try {
      const { user_id, content_text, image_url, post_type } = req.body;

      if (!user_id || !content_text) {
        return res.status(400).json({ error: 'user_id ve content_text gerekli' });
      }

      const result = await pool.query(
        `INSERT INTO posts (user_id, content_text, image_url, post_type)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user_id, content_text, image_url || null, post_type || 'text']
      );

      res.status(201).json({ post: result.rows[0] });
    } catch (error) {
      console.error('Post create error:', error);
      res.status(500).json({ error: 'Post oluşturulurken hata oluştu' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
