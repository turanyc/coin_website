import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;

  try {
    // 1. Kullanıcıyı e-posta ile bul
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    // Kullanıcı yoksa hata ver
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    const user = result.rows[0];

    // 2. Girilen şifre ile veritabanındaki şifreli şifreyi karşılaştır
    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    // 3. Giriş başarılı - Tüm kullanıcı bilgilerini döndür (profil fotoğrafı dahil)
    res.status(200).json({ 
      message: 'Giriş başarılı!', 
      user: { 
        id: user.id, 
        user_id: user.id, // Bazı yerlerde user_id kullanılıyor
        email: user.email, 
        name: user.full_name,
        full_name: user.full_name,
        profile_picture_url: user.profile_picture_url || null,
        is_verified: user.is_verified || false
      } 
    });

  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
}