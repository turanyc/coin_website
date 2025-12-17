import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { user_id } = req.query;
      
      if (user_id) {
        // Kullanıcının izleme listesini getir
        const result = await pool.query(
          'SELECT * FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC',
          [user_id]
        );
        return res.status(200).json({ watchlist: result.rows });
      } else {
        return res.status(400).json({ error: 'user_id gerekli' });
      }
    } catch (error) {
      console.error('Watchlist fetch error:', error);
      return res.status(500).json({ error: 'İzleme listesi getirilirken hata oluştu' });
    }
  } else if (req.method === 'POST') {
    try {
      const { user_id, coin_id, coin_symbol, coin_name } = req.body;
      
      if (!coin_id || !coin_symbol || !coin_name) {
        return res.status(400).json({ error: 'coin_id, coin_symbol ve coin_name gerekli' });
      }

      // Zaten ekli mi kontrol et
      const existing = await pool.query(
        'SELECT * FROM watchlist WHERE user_id = $1 AND coin_id = $2',
        [user_id || null, coin_id]
      );

      if (existing.rows.length > 0) {
        return res.status(200).json({ message: 'Coin zaten izleme listesinde', watchlist: existing.rows[0] });
      }

      // Yeni coin ekle
      const result = await pool.query(
        `INSERT INTO watchlist (user_id, coin_id, coin_symbol, coin_name)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [user_id || null, coin_id, coin_symbol, coin_name]
      );

      return res.status(201).json({ watchlist: result.rows[0] });
    } catch (error) {
      console.error('Watchlist add error:', error);
      return res.status(500).json({ error: 'Coin eklenirken hata oluştu' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { user_id, coin_id } = req.query;
      
      if (!coin_id) {
        return res.status(400).json({ error: 'coin_id gerekli' });
      }

      await pool.query(
        'DELETE FROM watchlist WHERE user_id = $1 AND coin_id = $2',
        [user_id || null, coin_id]
      );

      return res.status(200).json({ message: 'Coin izleme listesinden kaldırıldı' });
    } catch (error) {
      console.error('Watchlist remove error:', error);
      return res.status(500).json({ error: 'Coin kaldırılırken hata oluştu' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
