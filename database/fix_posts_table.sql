-- Posts tablosunu kontrol et ve gerekirse düzelt
-- Bu script posts tablosunda herhangi bir kısıtlama olmadığından emin olur

-- Önce mevcut kısıtlamaları kontrol et
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'posts'::regclass;

-- Eğer unique constraint varsa kaldır (sadece gerekirse)
-- ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_user_id_content_text_key;

-- Posts tablosunun yapısını kontrol et
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'posts'
ORDER BY ordinal_position;

-- Posts tablosuna index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON posts(is_public);

-- Kullanıcıların istediği kadar post paylaşabilmesi için herhangi bir limit yok
-- Her post benzersiz bir ID'ye sahip olacak ve aynı içerik bile olsa farklı post olarak kaydedilecek
