// pages/api/coins.ts

import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Piyasa Değerine göre sıralanmış ilk 100 coin'i çek (duplicate önlemek için)
    const result = await pool.query(
      `SELECT 
        id, name, symbol, current_price, price_change_percentage_24h, 
        market_cap, total_volume, image 
      FROM (
        SELECT 
          id, name, symbol, current_price, price_change_percentage_24h, 
          market_cap, total_volume, image,
          ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(id)) ORDER BY market_cap DESC, last_updated DESC NULLS LAST) as rn
        FROM coins
      ) AS ranked_coins
      WHERE rn = 1
      ORDER BY market_cap DESC 
      LIMIT 100`
    );
    
    // Veriyi parse et ve hazırla
    const parsedRows = result.rows.map(row => ({
      ...row,
      image: row.image || null,
      current_price: parseFloat(row.current_price) || 0,
      price_change_percentage_24h: parseFloat(row.price_change_percentage_24h) || 0,
      market_cap: parseFloat(row.market_cap) || 0,
      total_volume: parseFloat(row.total_volume) || 0,
    }));
    
    // Duplicate'leri filtrele - önce ID bazlı, sonra symbol bazlı
    const seenIds = new Map<string, typeof parsedRows[0]>();
    
    // İlk adım: ID bazlı duplicate'leri filtrele
    parsedRows.forEach(row => {
      const normalizedId = row.id.toLowerCase().trim();
      if (!seenIds.has(normalizedId)) {
        seenIds.set(normalizedId, row);
      } else {
        const existing = seenIds.get(normalizedId)!;
        if (row.market_cap > existing.market_cap) {
          seenIds.set(normalizedId, row);
        }
      }
    });
    
    // İkinci adım: Symbol bazlı duplicate'leri filtrele (BTC için Bitcoin gibi)
    const seenSymbols = new Map<string, typeof parsedRows[0]>();
    Array.from(seenIds.values()).forEach(row => {
      const normalizedSymbol = row.symbol.toLowerCase().trim();
      if (!seenSymbols.has(normalizedSymbol)) {
        seenSymbols.set(normalizedSymbol, row);
      } else {
        const existing = seenSymbols.get(normalizedSymbol)!;
        if (row.market_cap > existing.market_cap) {
          seenSymbols.set(normalizedSymbol, row);
        }
      }
    });
    
    const uniqueRows = Array.from(seenSymbols.values()).sort((a, b) => b.market_cap - a.market_cap);
    
    // Veriyi JSON olarak döndür
    res.status(200).json(uniqueRows);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Veritabanından veri çekilemedi.' });
  }
}