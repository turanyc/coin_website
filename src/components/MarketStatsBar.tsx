import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

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

interface MarketStatsBarProps {
  marketStats?: MarketStats;
}

const MarketStatsBar: React.FC<MarketStatsBarProps> = ({ marketStats }) => {
  const { t } = useLanguage();

  if (!marketStats) return null;

  const formatNumber = (num: number) => {
    if (num >= 1e12) {
      return (num / 1e12).toFixed(2) + 'T';
    } else if (num >= 1e9) {
      return (num / 1e9).toFixed(2) + 'B';
    } else if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    } else if (num >= 1e3) {
      return (num / 1e3).toFixed(2) + 'K';
    }
    return num.toFixed(2);
  };

  const formatTrillion = (num: number) => {
    if (num >= 1e12) {
      return '$' + (num / 1e12).toFixed(2) + 'T';
    } else if (num >= 1e9) {
      return '$' + (num / 1e9).toFixed(2) + 'B';
    }
    return '$' + formatNumber(num);
  };

  const formatCoins = (num: number) => {
    if (num >= 1e6) {
      return (num / 1e6).toFixed(2) + 'M';
    }
    return formatNumber(num);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#2563EB] via-[#1E40AF] to-[#1E3A8A] text-white z-50 border-t border-blue-600/50 shadow-lg">
      <div className="w-full px-4 py-3">
        <div className="flex flex-nowrap items-center gap-6 text-xs overflow-x-auto scrollbar-hide">
          {/* Market Cap */}
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="text-white opacity-90">{t('stats.marketCap')}:</span>
            <span className="text-white font-semibold">{formatTrillion(marketStats.marketCap)}</span>
            {marketStats.marketCapChange24h !== undefined && (
              <span className={`text-xs font-semibold ${marketStats.marketCapChange24h >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {marketStats.marketCapChange24h >= 0 ? '▲' : '▼'} {Math.abs(marketStats.marketCapChange24h).toFixed(2)}%
              </span>
            )}
          </div>

          {/* 24h Volume */}
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="text-white opacity-90">{t('stats.volume24h')}:</span>
            <span className="text-white font-semibold">{formatTrillion(marketStats.volume24h)}</span>
          </div>

          {/* Total Coins */}
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="text-white opacity-90">{t('stats.activeCoins')}:</span>
            <span className="text-white font-semibold">{formatCoins(marketStats.totalCoins)}</span>
          </div>

          {/* BTC Dominance */}
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="text-white opacity-90">BTC {t('stats.btcDominance')}:</span>
            <span className="text-white font-semibold">
              {typeof marketStats.btcDominance === 'number' ? marketStats.btcDominance.toFixed(1) : marketStats.btcDominance}%
            </span>
          </div>

          {/* ETH Dominance */}
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="text-white opacity-90">ETH {t('stats.ethDominance')}:</span>
            <span className="text-white font-semibold">
              {typeof marketStats.ethDominance === 'number' ? marketStats.ethDominance.toFixed(1) : marketStats.ethDominance}%
            </span>
          </div>

          {/* Gas Price */}
          <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
            <span className="text-white opacity-90">{t('stats.gasPrice')}:</span>
            <span className="text-white font-semibold">{marketStats.gasPrice.toFixed(2)} GWEI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketStatsBar;

