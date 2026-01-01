import { Pool } from 'pg';

// Veritabanı bağlantı ayarlarını kontrol et
const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_DATABASE', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn('⚠️  Veritabanı ortam değişkenleri eksik:', missingVars.join(', '));
  console.warn('📝 .env dosyasında POSTGRES_HOST, POSTGRES_DATABASE, POSTGRES_USER, POSTGRES_PASSWORD tanımlı olmalı.');
}

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  // Connection pool ayarları
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000, // 10 saniye
  statement_timeout: 30000, // 30 saniye query timeout
});

// Bağlantı hatası event listener'ı
pool.on('error', (err, client) => {
  console.error('⚠️  Beklenmeyen veritabanı istemci hatası:', err);
});

// Test bağlantısı
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Veritabanı bağlantı hatası:', err.message);
    console.error('💡 Lütfen .env dosyasındaki veritabanı ayarlarını kontrol edin.');
  } else {
    console.log('✅ Veritabanı bağlantısı başarılı');
  }
});

export default pool;