-- Topluluk (Community) özellikleri için veritabanı şeması

-- Users tablosu zaten var, sadece gerekli kolonları kontrol edelim
-- Eğer yoksa ekleyelim:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Posts tablosu - Kullanıcıların paylaşımları
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_text TEXT NOT NULL,
    image_url TEXT,
    post_type VARCHAR(20) DEFAULT 'text' CHECK (post_type IN ('text', 'image', 'article_link')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE
);

-- Likes tablosu - Beğeniler
CREATE TABLE IF NOT EXISTS likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post_id, user_id)
);

-- Comments tablosu - Yorumlar
CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parent_comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE
);

-- Follows tablosu - Takip sistemi
CREATE TABLE IF NOT EXISTS follows (
    id SERIAL PRIMARY KEY,
    follower_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_user_id, followed_user_id),
    CHECK (follower_user_id != followed_user_id)
);

-- Notifications tablosu - Bildirimler
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'mention')),
    target_id INTEGER,
    target_type VARCHAR(20) CHECK (target_type IN ('post', 'comment', 'user')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events tablosu - Yaklaşan canlı yayınlar
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_datetime TIMESTAMP NOT NULL,
    presenter_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reminder_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index'ler - Performans için
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_is_public ON posts(is_public);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_user_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Trigger'lar - Like/Comment sayılarını otomatik güncelle
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_like_count
    AFTER INSERT OR DELETE ON likes
    FOR EACH ROW EXECUTE FUNCTION update_post_like_count();

CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_comment_count
    AFTER INSERT OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_post_comment_count();

-- Follower count trigger
CREATE OR REPLACE FUNCTION update_follower_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET follower_count = follower_count + 1 WHERE id = NEW.followed_user_id;
        UPDATE users SET following_count = following_count + 1 WHERE id = NEW.follower_user_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET follower_count = follower_count - 1 WHERE id = OLD.followed_user_id;
        UPDATE users SET following_count = following_count - 1 WHERE id = OLD.follower_user_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_follower_count
    AFTER INSERT OR DELETE ON follows
    FOR EACH ROW EXECUTE FUNCTION update_follower_count();
