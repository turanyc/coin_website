import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Toplam kullanıcı sayısı
    const totalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(totalUsersResult.rows[0].count) || 0;

    // Doğrulanmış kullanıcı sayısı
    const verifiedUsersResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE is_verified = true'
    );
    const verifiedUsers = parseInt(verifiedUsersResult.rows[0].count) || 0;

    // Admin kullanıcı sayısı
    // Eğer is_admin kolonu yoksa, 0 döndür
    let adminUsers = 0;
    try {
      const adminUsersResult = await pool.query(
        'SELECT COUNT(*) as count FROM users WHERE is_admin = true'
      );
      adminUsers = parseInt(adminUsersResult.rows[0].count) || 0;
    } catch (error) {
      // is_admin kolonu yoksa, hata verme, sadece 0 kullan
      console.log('is_admin kolonu bulunamadı, 0 olarak ayarlanıyor.');
    }

    // Bugün kayıt olan kullanıcılar
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
      [today]
    );
    const newUsersToday = parseInt(todayResult.rows[0].count) || 0;

    // Bu hafta kayıt olan kullanıcılar
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
      [weekAgo]
    );
    const newUsersThisWeek = parseInt(weekResult.rows[0].count) || 0;

    // Bu ay kayıt olan kullanıcılar
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);
    const monthResult = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
      [monthAgo]
    );
    const newUsersThisMonth = parseInt(monthResult.rows[0].count) || 0;

    res.status(200).json({
      totalUsers,
      verifiedUsers,
      adminUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Sunucu hatası oluştu.' });
  }
}

