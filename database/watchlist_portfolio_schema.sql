-- İzleme Listesi (Watchlist) ve Portföy (Portfolio) özellikleri için veritabanı şeması

-- Watchlist tablosu - Kullanıcıların izleme listesi
CREATE TABLE IF NOT EXISTS watchlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    coin_id VARCHAR(100) NOT NULL, -- CoinGecko coin ID (örn: 'bitcoin', 'ethereum')
    coin_symbol VARCHAR(20) NOT NULL, -- Coin sembolü (örn: 'BTC', 'ETH')
    coin_name VARCHAR(100) NOT NULL, -- Coin adı
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, coin_id),
    -- user_id NULL olabilir (çerez tabanlı kullanıcılar için)
    CHECK (coin_id IS NOT NULL AND coin_id != '')
);

-- Portfolio tablosu - Kullanıcıların portföy coinleri
CREATE TABLE IF NOT EXISTS portfolio (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    coin_id VARCHAR(100) NOT NULL,
    coin_symbol VARCHAR(20) NOT NULL,
    coin_name VARCHAR(100) NOT NULL,
    amount DECIMAL(20, 8) NOT NULL DEFAULT 0, -- Coin miktarı
    purchase_price DECIMAL(20, 8), -- Alış fiyatı (USD)
    purchase_date TIMESTAMP, -- Alış tarihi
    notes TEXT, -- Notlar
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, coin_id),
    CHECK (amount >= 0),
    CHECK (purchase_price IS NULL OR purchase_price >= 0)
);

-- Index'ler - Performans için
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_coin_id ON watchlist(coin_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_coin_id ON portfolio(coin_id);

-- Portfolio güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_portfolio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portfolio_updated_at
    BEFORE UPDATE ON portfolio
    FOR EACH ROW
    EXECUTE FUNCTION update_portfolio_updated_at();
