import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { post_id, user_id } = req.body;

      if (!post_id || !user_id) {
        return res.status(400).json({ error: 'post_id ve user_id gerekli' });
      }

      // Share kaydı ekle (isteğe bağlı - sadece sayı için)
      // Post'un share_count'unu güncelle
      await pool.query(
        'UPDATE posts SET share_count = share_count + 1 WHERE id = $1',
        [post_id]
      );

      res.status(200).json({ message: 'Paylaşım sayısı güncellendi' });
    } catch (error) {
      console.error('Share error:', error);
      res.status(500).json({ error: 'Paylaşım işlemi başarısız' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
