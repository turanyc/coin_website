import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { user_id } = req.query;
      
      if (user_id) {
        // Kullanıcının portföyünü getir
        const result = await pool.query(
          'SELECT * FROM portfolio WHERE user_id = $1 ORDER BY added_at DESC',
          [user_id]
        );
        return res.status(200).json({ portfolio: result.rows });
      } else {
        return res.status(400).json({ error: 'user_id gerekli' });
      }
    } catch (error) {
      console.error('Portfolio fetch error:', error);
      return res.status(500).json({ error: 'Portföy getirilirken hata oluştu' });
    }
  } else if (req.method === 'POST') {
    try {
      const { user_id, coin_id, coin_symbol, coin_name, amount, purchase_price, purchase_date, notes } = req.body;
      
      if (!coin_id || !coin_symbol || !coin_name || amount === undefined) {
        return res.status(400).json({ error: 'coin_id, coin_symbol, coin_name ve amount gerekli' });
      }

      // Zaten ekli mi kontrol et, varsa güncelle
      const existing = await pool.query(
        'SELECT * FROM portfolio WHERE user_id = $1 AND coin_id = $2',
        [user_id || null, coin_id]
      );

      if (existing.rows.length > 0) {
        // Güncelle
        const result = await pool.query(
          `UPDATE portfolio 
           SET amount = $3, purchase_price = $4, purchase_date = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $1 AND coin_id = $2
           RETURNING *`,
          [user_id || null, coin_id, amount, purchase_price || null, purchase_date || null, notes || null]
        );
        return res.status(200).json({ portfolio: result.rows[0] });
      } else {
        // Yeni coin ekle
        const result = await pool.query(
          `INSERT INTO portfolio (user_id, coin_id, coin_symbol, coin_name, amount, purchase_price, purchase_date, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [user_id || null, coin_id, coin_symbol, coin_name, amount, purchase_price || null, purchase_date || null, notes || null]
        );
        return res.status(201).json({ portfolio: result.rows[0] });
      }
    } catch (error) {
      console.error('Portfolio add/update error:', error);
      return res.status(500).json({ error: 'Portföy güncellenirken hata oluştu' });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { user_id, coin_id } = req.query;
      
      if (!coin_id) {
        return res.status(400).json({ error: 'coin_id gerekli' });
      }

      const result = await pool.query(
        'DELETE FROM portfolio WHERE user_id = $1 AND coin_id = $2',
        [user_id || null, coin_id]
      );

      // Silinen satır sayısını kontrol et
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Coin portföyde bulunamadı' });
      }

      return res.status(200).json({ message: 'Coin portföyden kaldırıldı', deleted: true });
    } catch (error) {
      console.error('Portfolio remove error:', error);
      return res.status(500).json({ error: 'Coin kaldırılırken hata oluştu' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
