// pages/api/coins.ts

import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Piyasa Değerine göre sıralanmış ilk 100 coin'i çek (duplicate önlemek için)
    let result;
    try {
      result = await pool.query(
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
    } catch (dbError: any) {
      console.error('Veritabanı bağlantı hatası:', dbError);
      
      // Veritabanı bağlantı hatası durumunda detaylı hata mesajı
      let errorMessage = 'Veritabanı hatası';
      let userFriendlyMessage = 'Veritabanına bağlanılamıyor.';
      
      if (dbError?.code === 'ECONNREFUSED') {
        errorMessage = 'Veritabanı sunucusuna bağlanılamıyor.';
        userFriendlyMessage = 'Veritabanı çalışmıyor veya bağlantı ayarları yanlış. Lütfen veritabanının çalıştığından emin olun.';
      } else if (dbError?.code === 'ENOTFOUND') {
        errorMessage = 'Veritabanı sunucusu bulunamadı.';
        userFriendlyMessage = 'Veritabanı sunucu adresi bulunamadı. POSTGRES_HOST ayarını kontrol edin.';
      } else if (dbError?.code === '28P01' || dbError?.message?.includes('password')) {
        errorMessage = 'Kullanıcı adı veya şifre hatalı.';
        userFriendlyMessage = 'Veritabanı kullanıcı adı veya şifresi yanlış. POSTGRES_USER ve POSTGRES_PASSWORD ayarlarını kontrol edin.';
      } else if (dbError?.code === '3D000' || dbError?.message?.includes('database')) {
        errorMessage = 'Veritabanı bulunamadı.';
        userFriendlyMessage = 'Belirtilen veritabanı mevcut değil. POSTGRES_DATABASE ayarını kontrol edin.';
      } else if (dbError?.code === 'ETIMEDOUT' || dbError?.code === 'ETIME') {
        errorMessage = 'Veritabanı bağlantı zaman aşımı.';
        userFriendlyMessage = 'Veritabanına bağlanırken zaman aşımı oluştu. Sunucu yanıt vermiyor olabilir.';
      } else if (dbError?.code === 'ECONNREFUSED') {
        errorMessage = 'Veritabanı sunucusuna bağlanılamıyor (ECONNREFUSED).';
        userFriendlyMessage = 'PostgreSQL servisi çalışmıyor. Lütfen PostgreSQL servisini başlatın.';
      } else {
        errorMessage = dbError?.message || 'Bilinmeyen veritabanı hatası';
        userFriendlyMessage = errorMessage;
      }
      
      // ECONNREFUSED için özel öneri
      let suggestion = 'Lütfen .env dosyasındaki POSTGRES_* ayarlarını kontrol edin ve veritabanının çalıştığından emin olun.';
      if (dbError?.code === 'ECONNREFUSED') {
        suggestion = 'PostgreSQL servisi çalışmıyor. Windows\'ta: Services → PostgreSQL servisini başlatın. Veya terminalde: `pg_ctl start` veya `net start postgresql-x64-XX` komutunu çalıştırın.';
      }
      
      return res.status(500).json({ 
        error: 'Veritabanından veri çekilemedi.',
        details: userFriendlyMessage,
        technical: errorMessage,
        code: dbError?.code,
        suggestion: suggestion
      });
    }
    
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      code: (error as any)?.code,
      errno: (error as any)?.errno,
      syscall: (error as any)?.syscall,
      address: (error as any)?.address,
      port: (error as any)?.port
    });
    
    res.status(500).json({ 
      error: 'Veritabanından veri çekilemedi.',
      details: error instanceof Error ? error.message : 'Bilinmeyen hata',
      code: (error as any)?.code,
      suggestion: 'Lütfen server console loglarını kontrol edin.'
    });
  }
}