# Veritabanı Kurulum Rehberi

Bu klasörde topluluk özelliği için gerekli PostgreSQL veritabanı şema dosyaları bulunmaktadır.

## Dosyalar

- `update_users_table.sql` - Users tablosuna topluluk özellikleri için gerekli kolonları ekler
- `community_schema.sql` - Topluluk tablolarını oluşturur (posts, likes, comments, follows, notifications, events)

## Kurulum Adımları

### 1. PostgreSQL'e Bağlanın

```bash
psql -U your_username -d your_database_name
```

### 2. SQL Dosyalarını Çalıştırın

**ÖNEMLİ:** Dosyaları sırayla çalıştırın!

```sql
-- Önce users tablosunu güncelle
\i update_users_table.sql

-- Sonra topluluk tablolarını oluştur
\i community_schema.sql
```

Veya komut satırından:

```bash
psql -U your_username -d your_database_name -f update_users_table.sql
psql -U your_username -d your_database_name -f community_schema.sql
```

### 3. Kurulumu Doğrulayın

Kurulumun başarılı olduğunu kontrol etmek için:

```bash
# PostgreSQL'de tabloları kontrol edin
\dt

# Users tablosundaki kolonları kontrol edin
\d users

# Posts tablosunu kontrol edin
\d posts
```

Veya API endpoint'i kullanın:

```bash
GET http://localhost:3000/api/community/test-db
```

## Oluşturulan Tablolar

1. **posts** - Kullanıcı paylaşımları
2. **likes** - Beğeniler
3. **comments** - Yorumlar
4. **follows** - Takip sistemi
5. **notifications** - Bildirimler
6. **events** - Etkinlikler

## Otomatik Trigger'lar

Şema dosyası aşağıdaki otomatik güncellemeleri içerir:

- **Like sayısı**: Bir post beğenildiğinde/beğeni kaldırıldığında otomatik güncellenir
- **Comment sayısı**: Bir posta yorum yapıldığında/silindiğinde otomatik güncellenir
- **Follower count**: Kullanıcı takip edildiğinde/takipten çıkıldığında otomatik güncellenir

## Sorun Giderme

### "relation already exists" hatası

Eğer tablolar zaten varsa, `IF NOT EXISTS` kullanıldığı için hata vermeyecektir. Ancak yine de hata alırsanız:

```sql
-- Mevcut tabloyu kontrol edin
SELECT * FROM information_schema.tables WHERE table_name = 'posts';

-- Gerekirse tabloyu silin (DİKKAT: Tüm veriler silinir!)
DROP TABLE IF EXISTS posts CASCADE;
```

### "column already exists" hatası

Users tablosunda kolonlar zaten varsa, `IF NOT EXISTS` kullanıldığı için hata vermeyecektir.

### Bağlantı hatası

`.env` dosyanızdaki PostgreSQL bağlantı bilgilerini kontrol edin:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=your_database_name
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
```
