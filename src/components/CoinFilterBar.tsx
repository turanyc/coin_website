import React, { useState } from 'react';
import { Globe, Coins, Network, Layers, Filter, LayoutGrid, ChevronDown } from 'lucide-react';

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
    { id: 'ethereum' as NetworkFilter, label: 'Ethereum', icon: Network, color: 'text-blue-500' },
    { id: 'bsc' as NetworkFilter, label: 'BSC', icon: Coins, color: 'text-yellow-500' },
    { id: 'solana' as NetworkFilter, label: 'Solana', icon: Layers, color: 'text-purple-500' },
    { id: 'base' as NetworkFilter, label: 'Base', icon: Layers, color: 'text-blue-400' },
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
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }
              `}
            >
              <Globe className="w-4 h-4" />
              <span>Tüm Ağlar</span>
            </button>

            {/* Network butonları - Ethereum ilk sırada */}
            {networks.map((network) => {
              const IconComponent = network.icon;
              return (
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
                  <IconComponent className={`w-4 h-4 ${network.color}`} />
                  <span>{network.label}</span>
                </button>
              );
            })}

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-[#2563EB] hover:text-white rounded-lg transition-all"
              >
                <span>Daha Fazla</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMoreDropdown ? 'rotate-180' : ''}`} />
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
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Filter className="w-4 h-4" />
              <span>Market Cap</span>
            </button>

            {/* Volume butonu */}
            <button
              onClick={() => onSortChange(sortBy === 'volume_24h' ? null : 'volume_24h')}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 h-10 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  sortBy === 'volume_24h'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Filter className="w-4 h-4" />
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
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <Filter className="w-4 h-4" />
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
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Sütunlar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoinFilterBar;
