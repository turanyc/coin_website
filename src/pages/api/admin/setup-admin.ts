import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

/**
 * Bu endpoint ilk admin kullanıcıyı oluşturmak için kullanılabilir.
 * GÜVENLİK UYARISI: Bu endpoint'i production'da devre dışı bırakın veya
 * sadece ilk kurulum sırasında kullanın.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, user_id } = req.body;

  if (!email && !user_id) {
    return res.status(400).json({ message: 'E-posta veya kullanıcı ID gerekli.' });
  }

  try {
    // is_admin kolonunu ekle (yoksa)
    try {
      await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE');
    } catch (error: any) {
      // Kolon zaten varsa devam et
      if (!error.message?.includes('already exists') && !error.message?.includes('duplicate column')) {
        console.log('is_admin kolonu kontrolü:', error.message);
      }
    }

    // Kullanıcıyı bul
    let result;
    if (user_id) {
      result = await pool.query('SELECT id, email FROM users WHERE id = $1', [user_id]);
    } else {
      result = await pool.query('SELECT id, email FROM users WHERE email = $1', [email]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const user = result.rows[0];

    // Kullanıcıyı admin yap
    await pool.query('UPDATE users SET is_admin = true WHERE id = $1', [user.id]);

    res.status(200).json({
      message: 'Kullanıcı başarıyla admin yapıldı.',
      user: {
        id: user.id,
        email: user.email,
        is_admin: true,
      },
    });
  } catch (error: any) {
    console.error('Setup admin error:', error);
    res.status(500).json({
      message: 'Sunucu hatası oluştu.',
      error: error.message || 'Bilinmeyen hata',
    });
  }
}

