import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { post_id, user_id, content_text } = req.body;

      if (!post_id || !user_id || !content_text) {
        return res.status(400).json({ error: 'post_id, user_id ve content_text gerekli' });
      }

      const result = await pool.query(
        `INSERT INTO comments (post_id, user_id, content_text)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [post_id, user_id, content_text]
      );

      // Post'un comment_count'unu güncelle
      await pool.query(
        'UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1',
        [post_id]
      );

      // Kullanıcı bilgilerini de getir
      const userResult = await pool.query(
        'SELECT id, full_name, email, profile_picture_url, is_verified FROM users WHERE id = $1',
        [user_id]
      );

      const comment = result.rows[0];
      const user = userResult.rows[0];

      res.status(201).json({
        comment: {
          ...comment,
          user_name: user?.full_name || user?.email?.split('@')[0] || 'Kullanıcı',
          user_email: user?.email,
          profile_picture_url: user?.profile_picture_url,
          is_verified: user?.is_verified || false,
        },
      });
    } catch (error) {
      console.error('Comment create error:', error);
      res.status(500).json({ error: 'Yorum oluşturulurken hata oluştu' });
    }
  } else if (req.method === 'GET') {
    try {
      const { post_id } = req.query;

      if (!post_id) {
        return res.status(400).json({ error: 'post_id gerekli' });
      }

      const result = await pool.query(
        `SELECT 
          c.id,
          c.post_id,
          c.user_id,
          c.content_text,
          c.created_at,
          u.full_name as user_name,
          u.email as user_email,
          u.profile_picture_url,
          u.is_verified
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = $1
        ORDER BY c.created_at ASC`,
        [post_id]
      );

      res.status(200).json({ comments: result.rows });
    } catch (error) {
      console.error('Comments fetch error:', error);
      res.status(500).json({ error: 'Yorumlar yüklenirken hata oluştu' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
