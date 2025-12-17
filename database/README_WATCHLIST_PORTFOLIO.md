# İzleme Listesi ve Portföy Veritabanı Kurulum Rehberi

Bu klasörde izleme listesi (watchlist) ve portföy (portfolio) özellikleri için gerekli PostgreSQL veritabanı şema dosyası bulunmaktadır.

## Dosya

- `watchlist_portfolio_schema.sql` - Watchlist ve Portfolio tablolarını oluşturur

## Kurulum Adımları

### 1. PostgreSQL'e Bağlanın

```bash
psql -U your_username -d your_database_name
```

### 2. SQL Dosyasını Çalıştırın

```sql
\i watchlist_portfolio_schema.sql
```

Veya komut satırından:

```bash
psql -U your_username -d your_database_name -f watchlist_portfolio_schema.sql
```

### 3. Kurulumu Doğrulayın

```bash
# PostgreSQL'de tabloları kontrol edin
\dt

# Watchlist tablosunu kontrol edin
\d watchlist

# Portfolio tablosunu kontrol edin
\d portfolio
```

## Oluşturulan Tablolar

1. **watchlist** - Kullanıcıların izleme listesi
   - `user_id` NULL olabilir (çerez tabanlı kullanıcılar için)
   - Her kullanıcı için aynı coin sadece bir kez eklenebilir

2. **portfolio** - Kullanıcıların portföy coinleri
   - `user_id` NULL olabilir (çerez tabanlı kullanıcılar için)
   - Coin miktarı, alış fiyatı, alış tarihi ve notlar saklanır
   - `updated_at` otomatik olarak güncellenir

## Özellikler

- **Çerez Desteği**: Kullanıcılar kayıt olmadan da izleme listesi ve portföy kullanabilir (çerezler kabul edildiğinde)
- **Kullanıcı Desteği**: Giriş yapmış kullanıcılar için veritabanında saklama
- **Otomatik Güncelleme**: Portfolio tablosunda `updated_at` otomatik olarak güncellenir
