-- Users tablosuna topluluk özellikleri için gerekli kolonları ekle

-- Eğer kolonlar yoksa ekle
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Mevcut kullanıcılar için username oluştur (eğer yoksa)
UPDATE users 
SET username = COALESCE(
  username,
  LOWER(REGEXP_REPLACE(COALESCE(full_name, email), '[^a-zA-Z0-9]', '', 'g')) || '_' || id::text
)
WHERE username IS NULL OR username = '';

-- Username için index
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
