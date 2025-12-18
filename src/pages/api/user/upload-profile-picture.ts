import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id, profile_picture_url } = req.body;

    if (!user_id || !profile_picture_url) {
      return res.status(400).json({ error: 'user_id ve profile_picture_url gerekli' });
    }

    // Kullanıcının profil fotoğrafını güncelle
    const result = await pool.query(
      `UPDATE users 
       SET profile_picture_url = $1 
       WHERE id = $2 
       RETURNING id, full_name, email, profile_picture_url, is_verified`,
      [profile_picture_url, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    res.status(500).json({ error: 'Profil fotoğrafı güncellenirken hata oluştu' });
  }
}
