import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // En çok takipçisi olan kullanıcıları getir
    const result = await pool.query(
      `SELECT 
        u.id,
        u.full_name,
        u.email,
        u.profile_picture_url,
        u.is_verified,
        u.follower_count,
        COUNT(DISTINCT p.id) as post_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id AND p.is_public = TRUE
      WHERE u.follower_count > 0
      GROUP BY u.id, u.full_name, u.email, u.profile_picture_url, u.is_verified, u.follower_count
      ORDER BY u.follower_count DESC, post_count DESC
      LIMIT 10`
    );

    const influencers = result.rows.map((row, index) => ({
      rank: index + 1,
      id: row.id,
      name: row.full_name || row.email?.split('@')[0] || 'Kullanıcı',
      email: row.email,
      profile_picture: row.profile_picture_url,
      is_verified: row.is_verified || false,
      follower_count: parseInt(row.follower_count) || 0,
      post_count: parseInt(row.post_count) || 0,
    }));

    res.status(200).json({ influencers });
  } catch (error) {
    console.error('Influencers fetch error:', error);
    res.status(200).json({ influencers: [] });
  }
}
