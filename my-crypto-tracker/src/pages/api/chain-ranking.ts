import { NextApiRequest, NextApiResponse } from 'next';

interface ChainData {
  id: string;
  name: string;
  symbol: string;
  image: string;
  protocols: number;
  tvl: number;
  tvlChange1h: number;
  tvlChange7d: number;
  tvlChange30d: number;
  volume24h: number;
  moreTvl: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // CoinGecko'dan top coin'leri çekiyoruz (blockchain'ler için proxy olarak)
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false'
    );

    if (!response.ok) {
      throw new Error('CoinGecko API error');
    }

    const marketsData = await response.json();

    // Blockchain verilerini simüle ediyoruz
    // Not: Gerçek TVL verileri için DeFiLlama API kullanılabilir
    const chainNames = [
      'Ethereum', 'Tron', 'Solana', 'BSC', 'Arbitrum', 'Polygon', 'Avalanche', 
      'Base', 'Optimism', 'Cosmos', 'Polkadot', 'Cardano', 'Sui', 'Aptos',
      'Near', 'Fantom', 'Cronos', 'Linea', 'zkSync', 'Starknet', 'Mantle',
      'Blast', 'Scroll', 'Metis', 'Moonbeam', 'Moonriver', 'Gnosis', 'Celo',
      'Harmony', 'Kava', 'Osmosis', 'Juno', 'Terra', 'Injective', 'Sei',
      'Celestia', 'Dymension', 'Berachain', 'Ethereum Classic', 'Bitcoin',
      'Litecoin', 'Dogecoin', 'BNB Chain', 'Hedera', 'Algorand', 'Tezos',
      'Flow', 'Waves', 'Zilliqa', 'Ontology'
    ];

    // Her API çağrısında farklı veriler için timestamp kullan
    const timeSeed = Date.now();
    
    const chains: ChainData[] = marketsData.slice(0, 50).map((coin: any, index: number) => {
      const chainName = chainNames[index] || coin.name;
      const chainSymbol = coin.symbol.toUpperCase();
      
      // TVL ve değişim değerlerini simüle ediyoruz (her çağrıda farklı olması için timeSeed kullan)
      const baseTvl = (coin.market_cap || 0) * 0.1; // Market cap'in %10'u kadar TVL
      const tvlVariation = Math.sin((timeSeed + index) * 0.01) * baseTvl * 0.1; // %10 varyasyon
      const protocols = Math.floor((Math.sin((timeSeed + index) * 0.05) + 1) * 500) + 50;
      
      // Değişim değerleri için sinüs fonksiyonu kullanarak daha gerçekçi varyasyon
      const change1h = Math.sin((timeSeed + index) * 0.1) * 2.5; // -2.5% ile +2.5% arası
      const change7d = Math.sin((timeSeed + index) * 0.05) * 5; // -5% ile +5% arası
      const change30d = Math.sin((timeSeed + index) * 0.02) * 7.5; // -7.5% ile +7.5% arası
      
      return {
        id: coin.id,
        name: chainName,
        symbol: chainSymbol,
        image: coin.image || `https://assets.coingecko.com/coins/images/${coin.id}/large/${coin.id}.png`,
        protocols,
        tvl: baseTvl + tvlVariation,
        tvlChange1h: change1h,
        tvlChange7d: change7d,
        tvlChange30d: change30d,
        volume24h: coin.total_volume || 0,
        moreTvl: (Math.sin((timeSeed + index) * 0.1) + 1) * 2.5, // 0 ile 5 arası
      };
    });

    // TVL'ye göre sırala
    chains.sort((a, b) => b.tvl - a.tvl);

    // Total TVL hesapla
    const totalTvl = chains.reduce((sum, chain) => sum + chain.tvl, 0);

    res.status(200).json({
      chains,
      totalTvl,
    });
  } catch (error) {
    console.error('Error fetching chain ranking:', error);
    res.status(500).json({ error: 'Failed to fetch chain ranking data' });
  }
}
