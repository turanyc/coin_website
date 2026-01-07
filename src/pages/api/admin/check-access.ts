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
    // Kullanıcıyı bul ve admin durumunu kontrol et
    const result = await pool.query(
      'SELECT id, email, is_admin FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    const user = result.rows[0];

    // Eğer is_admin kolonu yoksa, varsayılan olarak false döndür
    // Veritabanında is_admin kolonu yoksa, bu kolonu eklemek gerekir:
    // ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    const isAdmin = user.is_admin || false;

    res.status(200).json({
      is_admin: isAdmin,
      user_id: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
}

