import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import logoImage from '../img/cripto_logo.png';

interface CompanyData {
  id: number;
  companyName: string;
  ticker: string;
  country: string;
  bnbHoldings: number;
  currentValue: number;
  latestAcquisitions: string;
  costBasis: number;
  source: string;
  lastUpdate: string;
}

interface BNBTreasuriesData {
  totalBNBSupply: number;
  totalBNBHeld: number;
  companies: CompanyData[];
  distribution: Array<{
    name: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  countriesBreakdown: Array<{
    country: string;
    percentage: number;
    color: string;
  }>;
}

const BNBHazineRezervleri: React.FC = () => {
  const router = useRouter();
  const [data, setData] = useState<BNBTreasuriesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<'Bitcoin' | 'BNB'>('BNB');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/bnb-treasuries');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching BNB treasuries data:', error);
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
    const angle = (segment.percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    const path = createDonutPath(donutCenterX, donutCenterY, donutInnerRadius, donutOuterRadius, startAngle, endAngle);
    currentAngle = endAngle;
    return { ...segment, path, startAngle, endAngle };
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

  const percentageOfSupply = (data.totalBNBHeld / data.totalBNBSupply) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>BNB Hazine Rezervleri | Dijital Marketim</title>
      </Head>

      <Navbar />

      <div className="w-full py-8">
        {/* Header with Tabs */}
        <div className="w-full px-4 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/bitcoin-hazine-rezervleri')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedTab === 'Bitcoin'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Bitcoin
            </button>
            <button
              onClick={() => setSelectedTab('BNB')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedTab === 'BNB'
                  ? 'bg-[#2563EB] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              BNB
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Halka Açık Şirketler BNB Hazine Rezervleri</h1>
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 text-base max-w-4xl">
            Halka açık şirketlerin BNB hazine rezervlerine dair kapsamlı verileri keşfedin. Hangi halka açık şirketlerin BNB tuttuğunu, 
            BNB rezervlerini, mevcut piyasa değerini ve satın alma geçmişini takip edin. Kurumsal benimsenmeyi ve kurumsal BNB stratejilerini izleyin.
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="w-full px-4 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total BNB Supply Held */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Toplam BNB Arzı Tutuldu</h3>
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatNumber(data.totalBNBHeld)} / {formatNumber(data.totalBNBSupply)}
                </div>
                <div className="text-sm text-gray-600">
                  Arzın %{percentageOfSupply.toFixed(2)}&apos;si
                </div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#F3BA2F] transition-all duration-300"
                  style={{ width: `${percentageOfSupply}%` }}
                />
              </div>
            </div>

            {/* Countries Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ülkelere Göre Dağılım</h3>
              <div className="space-y-4">
                {data.countriesBreakdown.map((country, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{country.country}</span>
                      <span className="text-sm font-semibold text-gray-900">{country.percentage}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{ 
                          width: `${country.percentage}%`,
                          backgroundColor: country.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BNB Holdings by Company - Donut Chart */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Şirketlere Göre BNB Rezervleri</h3>
              <div className="flex items-center justify-center mb-4">
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
                      <div className="text-sm text-gray-600 mb-1">Toplam BNB Tutuldu</div>
                      <div className="text-2xl font-bold text-gray-900">{formatNumber(data.totalBNBHeld)}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {data.distribution.map((segment, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-sm text-gray-700">{segment.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{segment.percentage.toFixed(2)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* BNB Treasuries Data Table */}
        <div className="w-full px-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Halka Açık Şirketler BNB Hazine Rezervleri Verileri</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Şirket Adı</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ticker</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Ülke</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">BNB Rezervleri</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Mevcut Değer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Son Satın Almalar</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Maliyet Tabanı</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Kaynak</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Son Güncelleme</th>
                  </tr>
                </thead>
                <tbody>
                  {data.companies.map((company, index) => (
                    <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{company.companyName}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{company.ticker}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{company.country}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatNumber(company.bnbHoldings)}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">{formatCurrency(company.currentValue)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{company.latestAcquisitions}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">{company.costBasis}%</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{company.source}</td>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Halka Açık Şirketler BNB Hazine Rezervleri Hakkında</h2>
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 0 ? null : 0)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  Halka açık şirketler neden hazinelerinde BNB tutuyor?
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
                    Halka açık şirketler BNB&apos;yi hazinelerinde tutmak için çeşitli nedenlere sahiptir. Bunlar arasında portföy çeşitlendirmesi, 
                    Binance ekosisteminde işlem maliyetlerini azaltma gibi faydalı kullanım durumları, Web3&apos;e stratejik yatırım ve 
                    piyasa değerinin artacağı beklentisi yer alır. BNB, Binance Smart Chain (BSC) üzerinde çalışan uygulamalar ve hizmetler için 
                    işlem ücretlerini ödemek için kullanılabilir, bu da şirketlerin operasyonel maliyetlerini düşürebilir.
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
                  Hangi halka açık şirket şu anda en fazla BNB&apos;ye sahip ve ne kadar tutuyor?
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
                    Şu anda en fazla BNB&apos;ye sahip halka açık şirket CEA Industries&apos;tir ve yaklaşık 515,054 BNB tutmaktadır. 
                    Bu, toplam BNB arzının yaklaşık %0.37&apos;sine karşılık gelmektedir. İkinci sırada Nano Labs yer almakta olup, 
                    yaklaşık 128,000 BNB tutmaktadır.
                  </p>
                </div>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === 2 ? null : 2)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  Kurumsal BNB benimsenmesindeki mevcut trendler nelerdir ve piyasayı nasıl etkiliyor?
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedFAQ === 2 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expandedFAQ === 2 && (
                <div className="px-6 pb-6">
                  <p className="text-gray-600 leading-relaxed">
                    Kurumsal BNB benimsenmesi, özellikle Binance ekosisteminde faaliyet gösteren veya Web3 projelerine yatırım yapan şirketler 
                    arasında artmaktadır. Bu trend, BNB&apos;nin faydalı kullanım durumları ve Binance Smart Chain&apos;in büyümesi tarafından 
                    desteklenmektedir. Kurumsal benimsenme, BNB&apos;nin likiditesini artırabilir ve uzun vadeli değer istikrarına katkıda bulunabilir.
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

export default BNBHazineRezervleri;

