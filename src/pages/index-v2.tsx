import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import NavbarV2 from '../components/NavbarV2';
import MarketStatsBar from '../components/MarketStatsBar';
import DashboardCards from '../components/DashboardCards';
import { VolumeChart } from '../components/VolumeChart';

interface MarketStats {
  totalCoins: number;
  totalExchanges: number;
  marketCap: number;
  marketCapChange24h: number;
  volume24h: number;
  btcDominance: number;
  ethDominance: number;
  gasPrice: number;
}

const HomePageV2: React.FC = () => {
  const [marketStats, setMarketStats] = useState<MarketStats>({
    totalCoins: 0,
    totalExchanges: 0,
    marketCap: 0,
    marketCapChange24h: 0,
    volume24h: 0,
    btcDominance: 0,
    ethDominance: 0,
    gasPrice: 0,
  });
  const [navbarExpanded, setNavbarExpanded] = useState(false);
  const [fearGreedIndex, setFearGreedIndex] = useState(50);
  const [fearGreedClassification, setFearGreedClassification] = useState('Neutral');

  // Fetch Fear & Greed Index
  useEffect(() => {
    const fetchFearGreed = async () => {
      try {
        const response = await fetch('/api/fear-greed');
        const data = await response.json();

        if (data.value !== undefined) {
          setFearGreedIndex(data.value);
          setFearGreedClassification(data.classification || 'Neutral');
        }
      } catch (error) {
        console.error('Fear & Greed veri çekme hatası:', error);
        setFearGreedIndex(50);
        setFearGreedClassification('Neutral');
      }
    };

    fetchFearGreed();
    const interval = setInterval(fetchFearGreed, 5 * 60 * 1000); // Her 5 dakikada bir güncelle

    return () => clearInterval(interval);
  }, []);

  // Fetch market stats
  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const response = await fetch('/api/global');
        if (response.ok) {
          const data = await response.json();
          setMarketStats({
            totalCoins: data.totalCoins || 0,
            totalExchanges: data.totalExchanges || 0,
            marketCap: data.marketCap || 0,
            marketCapChange24h: data.marketCapChange24h || 0,
            volume24h: data.volume24h || 0,
            btcDominance: data.btcDominance || 0,
            ethDominance: data.ethDominance || 0,
            gasPrice: 0.518,
          });
        }
      } catch (error) {
        console.error('Global stats error:', error);
      }
    };

    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);


  return (
    <>
      <NavbarV2 
        marketStats={marketStats} 
        onNavbarToggle={setNavbarExpanded}
        fearGreedIndex={fearGreedIndex}
        fearGreedClassification={fearGreedClassification}
      />
      
      <Head>
        <title>Dijital Marketim V2 | Kripto Fiyatları</title>
      </Head>
      
      {/* Üst bar yüksekliği için padding (h-16 = 64px) ve sağ navbar genişliği için dinamik margin */}
      <div className={`min-h-screen bg-white pt-16 transition-all duration-300 ${navbarExpanded ? 'pr-64' : 'pr-16'}`}>
        <div className="pl-0 pr-6 py-6">
          {/* 4 Dashboard Cards - Logo ile aynı hizada (sol padding yok) */}
          <DashboardCards 
            marketStats={marketStats}
            fearGreedIndex={fearGreedIndex}
            fearGreedClassification={fearGreedClassification}
          />

          {/* Volume Chart */}
          <VolumeChart />
        </div>
      </div>

      {/* Market Stats Bar */}
      <MarketStatsBar marketStats={marketStats} />
    </>
  );
};

export default HomePageV2;

