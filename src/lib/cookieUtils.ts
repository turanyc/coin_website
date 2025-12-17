// Cookie yönetimi için utility fonksiyonları

export const getCookieConsent = (): 'accepted' | 'rejected' | null => {
  if (typeof window === 'undefined') return null;
  const consent = localStorage.getItem('cookieConsent');
  return consent as 'accepted' | 'rejected' | null;
};

export const hasCookieConsent = (): boolean => {
  return getCookieConsent() === 'accepted';
};

export const getWatchlistFromCookies = (): string[] => {
  if (typeof window === 'undefined' || !hasCookieConsent()) return [];
  try {
    const watchlist = localStorage.getItem('watchlist_coins');
    if (watchlist) {
      return JSON.parse(watchlist);
    }
  } catch (error) {
    console.error('Error reading watchlist from cookies:', error);
  }
  return [];
};

export const addCoinToWatchlistCookie = (coinId: string, coinSymbol: string, coinName: string): void => {
  if (typeof window === 'undefined' || !hasCookieConsent()) return;
  try {
    const watchlist = getWatchlistFromCookies();
    const coin = { id: coinId, symbol: coinSymbol, name: coinName };
    
    // Zaten ekli mi kontrol et
    if (!watchlist.find((c: any) => c.id === coinId)) {
      watchlist.push(coin);
      localStorage.setItem('watchlist_coins', JSON.stringify(watchlist));
    }
  } catch (error) {
    console.error('Error adding coin to watchlist cookie:', error);
  }
};

export const removeCoinFromWatchlistCookie = (coinId: string): void => {
  if (typeof window === 'undefined' || !hasCookieConsent()) return;
  try {
    const watchlist = getWatchlistFromCookies();
    const filtered = watchlist.filter((c: any) => c.id !== coinId);
    localStorage.setItem('watchlist_coins', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing coin from watchlist cookie:', error);
  }
};

export const getPortfolioFromCookies = (): any[] => {
  if (typeof window === 'undefined' || !hasCookieConsent()) return [];
  try {
    const portfolio = localStorage.getItem('portfolio_coins');
    if (portfolio) {
      return JSON.parse(portfolio);
    }
  } catch (error) {
    console.error('Error reading portfolio from cookies:', error);
  }
  return [];
};

export const addCoinToPortfolioCookie = (coinData: {
  coinId: string;
  coinSymbol: string;
  coinName: string;
  amount: number;
  purchasePrice?: number;
  purchaseDate?: string;
  notes?: string;
}): void => {
  if (typeof window === 'undefined' || !hasCookieConsent()) return;
  try {
    const portfolio = getPortfolioFromCookies();
    const coin = {
      id: coinData.coinId,
      symbol: coinData.coinSymbol,
      name: coinData.coinName,
      amount: coinData.amount,
      purchase_price: coinData.purchasePrice || null,
      purchase_date: coinData.purchaseDate || null,
      notes: coinData.notes || null,
      added_at: new Date().toISOString(),
    };
    
    // Zaten ekli mi kontrol et, varsa güncelle
    const existingIndex = portfolio.findIndex((c: any) => c.id === coinData.coinId);
    if (existingIndex >= 0) {
      portfolio[existingIndex] = coin;
    } else {
      portfolio.push(coin);
    }
    localStorage.setItem('portfolio_coins', JSON.stringify(portfolio));
  } catch (error) {
    console.error('Error adding coin to portfolio cookie:', error);
  }
};

export const removeCoinFromPortfolioCookie = (coinId: string): void => {
  if (typeof window === 'undefined' || !hasCookieConsent()) return;
  try {
    const portfolio = getPortfolioFromCookies();
    // Hem id hem de coin_id kontrolü yap
    const filtered = portfolio.filter((c: any) => {
      const cId = c.id || c.coin_id;
      return cId !== coinId;
    });
    localStorage.setItem('portfolio_coins', JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing coin from portfolio cookie:', error);
  }
};
