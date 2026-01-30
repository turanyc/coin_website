
// Mock data utility for development to avoid API rate limits

export const getMockCoinDetail = (coinId: string) => ({
    id: coinId,
    name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
    symbol: coinId.substring(0, 3).toUpperCase(),
    current_price: 45000 + Math.random() * 2000,
    price_change_percentage_24h: (Math.random() * 10) - 5,
    market_cap: 850000000000,
    total_volume: 35000000000,
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
    last_updated: new Date().toISOString()
});

export const getMockCoinDetailsData = (coinId: string) => ({
    id: coinId,
    name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
    symbol: coinId.substring(0, 3).toUpperCase(),
    description: "Bitcoin is a decentralized digital currency...",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
    prices: {
        usd: 46250.55,
        try: 1480000.25
    },
    priceRange24h: {
        high: { usd: 47000, try: 1500000 },
        low: { usd: 45000, try: 1450000 }
    },
    priceRange7d: {
        high: 48000,
        low: 44000
    },
    ath: {
        price: { usd: 69000, try: 2200000 },
        date: "2021-11-10T00:00:00.000Z"
    },
    atl: {
        price: { usd: 67.81, try: 200 },
        date: "2013-07-06T00:00:00.000Z"
    },
    priceChanges: {
        '24h': 2.5,
        '7d': -1.2,
        '30d': 15.4
    },
    marketData: {
        marketCap: { usd: 850000000000, try: 27000000000000 },
        volume24h: { usd: 35000000000, try: 1100000000000 },
        fullyDilutedValuation: { usd: 900000000000, try: 28000000000000 },
        marketCapRank: 1
    },
    supply: {
        circulating: 19600000,
        total: 21000000,
        max: 21000000
    },
    links: {
        homepage: "https://bitcoin.org",
        whitepaper: "https://bitcoin.org/bitcoin.pdf",
        blockchainExplorers: ["https://blockchain.com/explorer"],
        officialForum: ["https://bitcointalk.org"],
        subreddit: "/r/bitcoin",
        github: "https://github.com/bitcoin"
    },
    categories: ["Cryptocurrency", "Layer 1"],
    platforms: {},
    error: undefined
});

export const getMockChartData = (days: number) => {
    const points = 100;
    const prices: number[] = [];
    const priceData: { timestamp: number; price: number }[] = [];
    const now = Date.now();
    const interval = (days * 24 * 60 * 60 * 1000) / points;

    let currentPrice = 45000;

    for (let i = points; i >= 0; i--) {
        const change = (Math.random() - 0.5) * 1000;
        currentPrice += change;
        if (currentPrice < 0) currentPrice = 100;

        prices.push(currentPrice);
        priceData.push({
            timestamp: now - (i * interval),
            price: currentPrice
        });
    }

    return {
        prices,
        priceData
    };
};

export const getMockMarkets = () => {
    const exchanges = ['Binance', 'Coinbase', 'Kraken', 'KuCoin', 'Gate.io'];
    const markets = [];

    for (let i = 0; i < 20; i++) {
        const exchange = exchanges[Math.floor(Math.random() * exchanges.length)];
        markets.push({
            exchange,
            pair: 'BTC/USDT',
            price: 45000 + Math.random() * 500,
            volume24h: Math.random() * 100000000,
            volumePercent: Math.random() * 10,
            bidAskSpread: { bid: 44990, ask: 45010 },
            liquidity: Math.random() > 0.5 ? 100 : 50,
            logo: '',
            trustScore: 'green',
            marketType: 'cex'
        });
    }

    return markets.sort((a, b) => b.volume24h - a.volume24h);
};

export const getMockCommunityPosts = () => {
    return [
        {
            id: "1",
            user_id: "user1",
            user_name: "CryptoKing",
            user_email: "king@crypto.com",
            profile_picture_url: null,
            is_verified: true,
            content_text: "Bitcoin is looking very bullish today! 🚀",
            image_url: null,
            created_at: new Date().toISOString(),
            like_count: 150,
            comment_count: 45,
            share_count: 12,
            view_count: 5000,
            bullish_count: 140,
            bearish_count: 10
        },
        {
            id: "2",
            user_id: "user2",
            user_name: "SatoshiFan",
            user_email: "fan@satoshi.com",
            profile_picture_url: null,
            is_verified: false,
            content_text: "Just bought the dip. HODL! 💎🙌",
            image_url: null,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            like_count: 89,
            comment_count: 23,
            share_count: 5,
            view_count: 2300,
            bullish_count: 85,
            bearish_count: 4
        }
    ];
};

export const getMockCoins = () => {
    const coins = [];
    const symbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'AVAX', 'DOGE', 'DOT', 'TRX'];
    const names = ['Bitcoin', 'Ethereum', 'BNB', 'Solana', 'XRP', 'Cardano', 'Avalanche', 'Dogecoin', 'Polkadot', 'TRON'];

    for (let i = 0; i < 50; i++) {
        const symbolIndex = i % symbols.length;
        coins.push({
            id: names[symbolIndex].toLowerCase() + (i > 9 ? `-${i}` : ''),
            name: names[symbolIndex] + (i > 9 ? ` ${i}` : ''),
            symbol: symbols[symbolIndex],
            current_price: 100 + Math.random() * 50000,
            price_change_percentage_1h: (Math.random() * 10) - 5,
            price_change_percentage_24h: (Math.random() * 20) - 10,
            price_change_percentage_7d: (Math.random() * 30) - 15,
            total_volume: Math.random() * 10000000000,
            market_cap: Math.random() * 1000000000000,
            image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
            market_cap_rank: i + 1
        });
    }
    return coins;
};

export const getMockFearGreed = () => ({
    value: Math.floor(Math.random() * 100),
    classification: Math.random() > 0.5 ? 'Greed' : 'Fear'
});

export const getMockGlobalStats = () => ({
    totalCoins: 12500 + Math.floor(Math.random() * 100),
    totalExchanges: 500 + Math.floor(Math.random() * 50),
    marketCap: 2500000000000 + Math.random() * 100000000000,
    marketCapChange24h: (Math.random() * 10) - 5,
    volume24h: 150000000000 + Math.random() * 10000000000,
    btcDominance: 52 + Math.random(),
    ethDominance: 17 + Math.random(),
    gasPrice: 15 + Math.random() * 10
});

export const getMockGainersLosers = () => {
    const gainers = [];
    const losers = [];

    for (let i = 0; i < 10; i++) {
        gainers.push({
            id: `gainer-${i}`,
            name: `Gainer ${i}`,
            symbol: `GNR${i}`,
            image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
            price_change_percentage_24h: 10 + Math.random() * 50
        });

        losers.push({
            id: `loser-${i}`,
            name: `Loser ${i}`,
            symbol: `LSR${i}`,
            image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579",
            price_change_percentage_24h: -10 - Math.random() * 30
        });
    }

    return { gainers, losers };
};
