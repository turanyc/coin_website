import React, { useState } from 'react';

export type NetworkFilter = 'all' | 'solana' | 'ethereum' | 'basic' | 'license' | 'bsc' | 'base';
export type SortFilter = 'market_cap' | 'volume_24h' | null;

interface CoinFilterBarProps {
  selectedNetwork: NetworkFilter;
  onNetworkChange: (network: NetworkFilter) => void;
  sortBy: SortFilter;
  onSortChange: (sort: SortFilter) => void;
  onFiltersClick: () => void;
  onColumnsClick: () => void;
}

const CoinFilterBar: React.FC<CoinFilterBarProps> = ({
  selectedNetwork,
  onNetworkChange,
  sortBy,
  onSortChange,
  onFiltersClick,
  onColumnsClick,
}) => {
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);
  const [filtersActive, setFiltersActive] = useState(false);
  const [columnsActive, setColumnsActive] = useState(false);

  const networks = [
    { id: 'all' as NetworkFilter, label: 'All Networks', icon: '🌐' },
    { id: 'bsc' as NetworkFilter, label: 'BSC', icon: '💛' },
    { id: 'solana' as NetworkFilter, label: 'Solana', icon: '💜' },
    { id: 'base' as NetworkFilter, label: 'Base', icon: '🔵' },
    { id: 'ethereum' as NetworkFilter, label: 'Ethereum', icon: '🔷' },
  ];

  return (
    <div className="bg-white sticky top-0 z-40 border-b border-gray-200">
      <div className="w-full pb-4 pt-0">
        <div className="flex flex-nowrap items-center gap-3 md:gap-4 overflow-x-auto scrollbar-hide">
          {/* Sol taraf - Network filtreleri */}
          <div className="flex items-center gap-2 md:gap-3 flex-nowrap shrink-0">
            {/* All Networks butonu - koyu mavi arka plan */}
            <button
              onClick={() => onNetworkChange('all')}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 h-10 rounded-lg text-sm font-medium transition-all duration-200 ml-[15px]
                ${
                  selectedNetwork === 'all'
                    ? 'bg-blue-900 text-cyan-300 shadow-md'
                    : 'bg-blue-900 text-cyan-300 hover:bg-blue-800'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 002 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Tüm Ağlar</span>
            </button>

            {/* Diğer network butonları */}
            {networks.filter(n => n.id !== 'all').map((network) => (
              <button
                key={network.id}
                onClick={() => onNetworkChange(network.id)}
                className={`
                  flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium transition-all duration-200
                  ${
                    selectedNetwork === network.id
                      ? 'text-gray-900 font-semibold'
                      : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-lg">{network.icon}</span>
                <span>{network.label}</span>
              </button>
            ))}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-all"
              >
                <span>Daha Fazla</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showMoreDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMoreDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-20 border border-gray-200">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      🔷 Polygon
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      ❄️ Avalanche
                    </button>
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      ⚡ Arbitrum
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sağ taraf - Sıralama ve filtreler */}
          <div className="flex items-center gap-2 md:gap-3 ml-auto shrink-0">
            {/* Market Cap butonu */}
            <button
              onClick={() => onSortChange(sortBy === 'market_cap' ? null : 'market_cap')}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 h-10 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  sortBy === 'market_cap'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Market Cap</span>
            </button>

            {/* Volume butonu */}
            <button
              onClick={() => onSortChange(sortBy === 'volume_24h' ? null : 'volume_24h')}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 h-10 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  sortBy === 'volume_24h'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Hacim(24h)</span>
            </button>

            {/* Filtreler butonu */}
            <button
              onClick={() => {
                setFiltersActive(!filtersActive);
                onFiltersClick();
              }}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 h-10 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  filtersActive
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span>Filtreler</span>
            </button>

            {/* Sütunlar butonu */}
            <button
              onClick={() => {
                setColumnsActive(!columnsActive);
                onColumnsClick();
              }}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 h-10 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  columnsActive
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Sütunlar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinFilterBar;
