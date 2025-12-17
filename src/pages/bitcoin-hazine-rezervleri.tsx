import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface CompanyData {
  id: number;
  company: string;
  country: string;
  sector: string;
  bitcoinAmount: number;
  valueUSD: number;
  percentageOfSupply: number;
  marketCapUSD: number;
  lastUpdate: string;
}

interface BitcoinTreasuriesData {
  totalBitcoinSupply: number;
  totalBitcoinHeld: number;
  companies: CompanyData[];
  distribution: Array<{
    name: string;
    amount: number;
    color: string;
  }>;
}

const BitcoinHazineRezervleri: React.FC = () => {
  const router = useRouter();
  const [data, setData] = useState<BitcoinTreasuriesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<'Bitcoin' | 'BNB'>('Bitcoin');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);
  const [selectedFilter, setSelectedFilter] = useState<string>('Tüm Şirketler');
  const [selectedCountry, setSelectedCountry] = useState<string>('Tüm Ülkeler');

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/bitcoin-treasuries');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching bitcoin treasuries data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number): string => {
    if (value >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    return value.toLocaleString();
  };

  // Donut chart calculations
  const donutRadius = 80;
  const donutCenterX = 150;
  const donutCenterY = 150;
  const donutInnerRadius = 60;
  const donutOuterRadius = 100;

  const createDonutPath = (
    centerX: number,
    centerY: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ): string => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + innerRadius * Math.cos(startAngleRad);
    const y1 = centerY + innerRadius * Math.sin(startAngleRad);
    const x2 = centerX + innerRadius * Math.cos(endAngleRad);
    const y2 = centerY + innerRadius * Math.sin(endAngleRad);
    const x3 = centerX + outerRadius * Math.cos(endAngleRad);
    const y3 = centerY + outerRadius * Math.sin(endAngleRad);
    const x4 = centerX + outerRadius * Math.cos(startAngleRad);
    const y4 = centerY + outerRadius * Math.sin(startAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
  };

  let currentAngle = -90;
  const donutSegments = data ? data.distribution.map((segment) => {
    const totalAmount = data.distribution.reduce((sum, s) => sum + s.amount, 0);
    const percentage = (segment.amount / totalAmount) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const path = createDonutPath(donutCenterX, donutCenterY, donutInnerRadius, donutOuterRadius, startAngle, endAngle);
    currentAngle = endAngle;
    return { ...segment, path, startAngle, endAngle, percentage };
  }) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-600">Yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-red-600">Veri yüklenirken bir hata oluştu.</div>
        </div>
      </div>
    );
  }

  const percentageOfSupply = (data.totalBitcoinHeld / data.totalBitcoinSupply) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Bitcoin Hazine Rezervleri | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full py-8">
        {/* Header with Tabs */}
        <div className="w-full px-4 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setSelectedTab('Bitcoin')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedTab === 'Bitcoin'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bitcoin
            </button>
            <button
              onClick={() => router.push('/bnb-hazine-rezervleri')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedTab === 'BNB'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              BNB
            </button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Halka Açık Şirketler Bitcoin Transferleri</h1>
          <p className="text-gray-600 text-base max-w-4xl">
            Bitcoin&apos;i bilançolarında tutan halka açık şirketlerin listesi.
          </p>
        </div>

        {/* Bitcoin Thematic Data Section */}
        <div className="w-full px-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Halka Açık Şirketler Bitcoin Tematik Verileri</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - Statistics */}
            <div className="lg:col-span-1 space-y-6">
              {/* Total Bitcoin Supply */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Toplam Bitcoin Arzı</h3>
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatNumber(data.totalBitcoinHeld)} / {formatNumber(data.totalBitcoinSupply)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Arzın %{percentageOfSupply.toFixed(2)}&apos;si
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F7931A] transition-all duration-300"
                    style={{ width: `${percentageOfSupply}%` }}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtreler</h3>
                <div className="space-y-3">
                  {['Tüm Şirketler', 'Halka Açık', 'Özel', 'ETF'].map((filter) => (
                    <label key={filter} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFilter === filter}
                        onChange={() => setSelectedFilter(filter)}
                        className="w-4 h-4 text-[#2563EB] border-gray-300 rounded focus:ring-[#2563EB]"
                      />
                      <span className="text-sm text-gray-700">{filter}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ülkeler</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  >
                    <option value="Tüm Ülkeler">Tüm Ülkeler</option>
                    <option value="ABD">ABD</option>
                    <option value="Kanada">Kanada</option>
                    <option value="İngiltere">İngiltere</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Right Panel - Donut Chart */}
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bitcoin Dağılımı</h3>
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <svg width="300" height="300" viewBox="0 0 300 300">
                    {donutSegments.map((segment, index) => (
                      <path
                        key={index}
                        d={segment.path}
                        fill={segment.color}
                        stroke="#fff"
                        strokeWidth="2"
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                      />
                    ))}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">Toplam Bitcoin</div>
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(data.totalBitcoinHeld)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {data.distribution.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-sm font-medium text-gray-700">{segment.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{formatNumber(segment.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bitcoin Treasuries Data Table */}
        <div className="w-full px-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Halka Açık Şirketler Bitcoin Tematik Verileri</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Şirket</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ülke</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sektör</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Bitcoin Miktarı</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Değer (USD)</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Toplam Arzın %&apos;si</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Piyasa Değeri (USD)</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Son Güncelleme</th>
                  </tr>
                </thead>
                <tbody>
                  {data.companies.map((company, index) => (
                    <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{company.company}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{company.country}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{company.sector}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatNumber(company.bitcoinAmount)}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatCurrency(company.valueUSD)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">{company.percentageOfSupply.toFixed(2)}%</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatCurrency(company.marketCapUSD)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(company.lastUpdate).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full px-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Halka Açık Şirketler Bitcoin Hazine Rezervleri Hakkında</h2>
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 0 ? null : 0)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  Halka açık şirketler neden Bitcoin tutuyor?
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedFAQ === 0 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFAQ === 0 && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">
                    Halka açık şirketler Bitcoin&apos;i hazinelerinde tutmak için çeşitli nedenlere sahiptir. Bunlar arasında enflasyona karşı korunma, 
                    portföy çeşitlendirmesi, nakit rezervlerinin değer kaybına karşı korunması ve Bitcoin&apos;in uzun vadeli değer artış potansiyeli yer alır. 
                    Ayrıca, bazı şirketler Bitcoin&apos;i bir varlık sınıfı olarak görüp, geleneksel finansal enstrümanlara alternatif olarak değerlendirmektedir.
                  </p>
                </div>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 1 ? null : 1)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  Halka açık şirketler Bitcoin&apos;i nasıl satın alıyor?
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedFAQ === 1 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFAQ === 1 && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">
                    Halka açık şirketler Bitcoin&apos;i genellikle kripto para borsaları üzerinden veya OTC (over-the-counter) işlemler aracılığıyla satın alır. 
                    Büyük miktarlarda Bitcoin satın alan şirketler, genellikle likidite sağlayıcıları veya özel kripto para brokerları ile çalışır. 
                    Satın alınan Bitcoin&apos;ler genellikle soğuk cüzdanlarda veya kurumsal kripto para saklama hizmetleri tarafından güvenli bir şekilde saklanır.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinHazineRezervleri;

