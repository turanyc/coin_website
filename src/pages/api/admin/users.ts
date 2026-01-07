import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      // Tüm kullanıcıları getir
      const result = await pool.query(
        `SELECT 
          id, 
          email, 
          full_name, 
          is_verified, 
          COALESCE(is_admin, false) as is_admin,
          created_at,
          profile_picture_url
        FROM users 
        ORDER BY created_at DESC`
      );

      res.status(200).json({
        users: result.rows,
      });
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
    return;
  }

  if (req.method === 'PATCH') {
    const { user_id, is_verified, is_admin } = req.body;

    if (!user_id) {
      return res.status(400).json({ message: 'Kullanıcı ID gerekli.' });
    }

    try {
      // Önce is_admin kolonunun var olup olmadığını kontrol et
      // Eğer yoksa, ekle (bu işlem idempotent olmalı)
      try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE');
      } catch (error) {
        // Kolon zaten varsa hata verme
        console.log('is_admin kolonu kontrolü:', error);
      }

      // Güncellenecek alanları belirle
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (is_verified !== undefined) {
        updates.push(`is_verified = $${paramIndex}`);
        values.push(is_verified);
        paramIndex++;
      }

      if (is_admin !== undefined) {
        updates.push(`is_admin = $${paramIndex}`);
        values.push(is_admin);
        paramIndex++;
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: 'Güncellenecek alan belirtilmedi.' });
      }

      // Kullanıcıyı güncelle
      values.push(user_id);
      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
      
      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
      }

      res.status(200).json({
        message: 'Kullanıcı başarıyla güncellendi.',
        user: result.rows[0],
      });
    } catch (error) {
      console.error('User update error:', error);
      res.status(500).json({ message: 'Sunucu hatası oluştu.' });
    }
    return;
  }

  res.status(405).json({ message: 'Method not allowed' });
}

