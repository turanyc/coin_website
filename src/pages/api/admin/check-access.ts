import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: 'Kullanıcı ID gerekli.' });
  }

  try {
    // Önce is_admin kolonunun var olup olmadığını kontrol et ve yoksa ekle
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE');
    } catch (error: any) {
      // Kolon zaten varsa veya başka bir hata varsa devam et
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate column')) {
        console.log('is_admin kolonu kontrolü:', error.message);
      }
    }

    // Kullanıcıyı bul ve admin durumunu kontrol et
    let result;
    try {
      result = await pool.query(
        'SELECT id, email, COALESCE(is_admin, false) as is_admin FROM users WHERE id = $1',
        [user_id]
      );
    } catch (error: any) {
      // Eğer is_admin kolonu hala yoksa, sadece id ve email'i getir
      if (error.message?.includes('column') && error.message?.includes('is_admin')) {
        result = await pool.query(
          'SELECT id, email FROM users WHERE id = $1',
          [user_id]
        );
      } else {
        throw error;
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const user = result.rows[0];

    // Eğer is_admin kolonu yoksa, varsayılan olarak false döndür
    const isAdmin = user.is_admin !== undefined ? user.is_admin : false;

    res.status(200).json({
      is_admin: isAdmin,
      user_id: user.id,
      email: user.email,
    });
  } catch (error: any) {
    console.error('Admin check error:', error);
    res.status(500).json({ 
      message: 'Sunucu hatası oluştu.',
      error: error.message || 'Bilinmeyen hata'
    });
  }
}

