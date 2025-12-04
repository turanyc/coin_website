// pages/api/coins/[coinId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { coinId } = req.query;

  if (!coinId || typeof coinId !== 'string') {
    return res.status(400).json({ error: 'Coin ID gerekli' });
  }

  try {
    // Veritabanından coin detaylarını çek
    const result = await pool.query(
      `SELECT 
        id, name, symbol, current_price, price_change_percentage_24h, 
        market_cap, total_volume, image, last_updated
      FROM coins
      WHERE LOWER(TRIM(id)) = LOWER(TRIM($1))
      ORDER BY last_updated DESC NULLS LAST, market_cap DESC
      LIMIT 1`,
      [coinId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coin bulunamadı' });
    }

    const row = result.rows[0];
    
    // Veriyi parse et ve hazırla
    const coinData = {
      id: row.id,
      name: row.name,
      symbol: row.symbol,
      current_price: parseFloat(row.current_price) || 0,
      price_change_percentage_24h: parseFloat(row.price_change_percentage_24h) || 0,
      market_cap: parseFloat(row.market_cap) || 0,
      total_volume: parseFloat(row.total_volume) || 0,
      image: row.image || null,
      last_updated: row.last_updated,
    };

    res.status(200).json(coinData);
  } catch (error) {
    console.error('Coin Detail API Error:', error);
    res.status(500).json({ error: 'Veritabanından veri çekilemedi.' });
  }
}

