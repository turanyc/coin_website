// API Health Check - Veritabanı bağlantısını test eder
import { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      connected: false,
      error: null as string | null,
      code: null as string | null,
      env: {
        host: process.env.POSTGRES_HOST ? '✓ Set' : '✗ Missing',
        port: process.env.POSTGRES_PORT || '5432 (default)',
        database: process.env.POSTGRES_DATABASE ? '✓ Set' : '✗ Missing',
        user: process.env.POSTGRES_USER ? '✓ Set' : '✗ Missing',
        password: process.env.POSTGRES_PASSWORD ? '✓ Set (hidden)' : '✗ Missing',
      }
    }
  };

  try {
    // Veritabanı bağlantısını test et
    const result = await pool.query('SELECT NOW(), version()');
    
    health.database.connected = true;
    health.status = 'healthy';
    
    return res.status(200).json({
      ...health,
      database: {
        ...health.database,
        serverTime: result.rows[0].now,
        version: result.rows[0].version?.substring(0, 50) + '...'
      }
    });
  } catch (error: any) {
    health.status = 'unhealthy';
    health.database.error = error.message || 'Unknown error';
    health.database.code = error.code || null;
    
    console.error('Health check failed:', error);
    
    // ECONNREFUSED için özel öneri ekle
    if (error.code === 'ECONNREFUSED') {
      health.database.suggestion = 'PostgreSQL servisi çalışmıyor. Lütfen servisi başlatın.';
    } else if (error.code === '28P01') {
      health.database.suggestion = 'Kullanıcı adı veya şifre hatalı. POSTGRES_USER ve POSTGRES_PASSWORD ayarlarını kontrol edin.';
    } else if (error.code === '3D000') {
      health.database.suggestion = 'Veritabanı bulunamadı. POSTGRES_DATABASE ayarını kontrol edin.';
    }
    
    return res.status(200).json(health); // 200 döndür ki frontend hatayı görebilsin
  }
}

