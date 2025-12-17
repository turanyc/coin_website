import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

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

    // 3. Giriş başarılı
    res.status(200).json({ message: 'Giriş başarılı!', user: { id: user.id, email: user.email, name: user.full_name } });

  } catch (error) {
    console.error('Login hatası:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
}