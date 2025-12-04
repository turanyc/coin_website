import React, { useState, useRef } from 'react';

interface PriceData {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  data: PriceData[];
  width?: number;
  height?: number;
  timeRange: '24h' | '7d' | '30d' | '1y' | '3y' | '5y';
}

const PriceChart: React.FC<PriceChartProps> = ({ 
  data, 
  width = 1200, 
  height = 400,
  timeRange 
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; timestamp: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Grafik verisi bulunamadı
      </div>
    );
  }

  // Grafik alanı için margin'ler
  const margin = { top: 20, right: 20, bottom: 55, left: 60 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Fiyat aralığını hesapla
  const prices = data.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const pricePadding = priceRange * 0.1; // %10 padding

  // Tarih aralığını hesapla
  const timestamps = data.map(d => d.timestamp);
  const minTime = Math.min(...timestamps);
  const maxTime = Math.max(...timestamps);

  // Y ekseni için fiyat etiketleri (5 adet)
  const yAxisTicks = 5;
  const yTickValues: number[] = [];
  for (let i = 0; i <= yAxisTicks; i++) {
    const value = minPrice - pricePadding + (priceRange + pricePadding * 2) * (i / yAxisTicks);
    yTickValues.push(value);
  }

  // X ekseni için tarih etiketleri
  const getXAxisLabels = () => {
    const labels: Array<{ timestamp: number; label: string }> = [];
    const labelCount = timeRange === '1y' ? 12 : timeRange === '30d' ? 6 : timeRange === '7d' ? 7 : 6;
    
    for (let i = 0; i <= labelCount; i++) {
      const index = Math.floor((data.length - 1) * (i / labelCount));
      if (index >= 0 && index < data.length) {
        const timestamp = data[index].timestamp;
        const date = new Date(timestamp);
        
        let label = '';
        if (timeRange === '1y') {
          // Yıl için: 2012, 2014, 2016, etc.
          label = date.getFullYear().toString();
        } else if (timeRange === '30d') {
          // Ay için: Jan, Feb, etc.
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          label = monthNames[date.getMonth()] + ' \'' + date.getFullYear().toString().slice(-2);
        } else if (timeRange === '7d') {
          // Gün için: Mon, Tue, etc.
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          label = dayNames[date.getDay()];
        } else {
          // 24h için: saat
          label = date.getHours().toString().padStart(2, '0') + ':00';
        }
        
        labels.push({ timestamp, label });
      }
    }
    return labels;
  };

  const xAxisLabels = getXAxisLabels();

  // Koordinat dönüşüm fonksiyonları
  const xScale = (timestamp: number) => {
    return ((timestamp - minTime) / (maxTime - minTime)) * chartWidth;
  };

  const yScale = (price: number) => {
    return chartHeight - ((price - (minPrice - pricePadding)) / (priceRange + pricePadding * 2)) * chartHeight;
  };

  // Fiyat formatı - daha okunabilir
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return '$' + (price / 1000000).toFixed(2) + 'M';
    } else if (price >= 1000) {
      return '$' + (price / 1000).toFixed(2) + 'K';
    } else if (price >= 1) {
      return '$' + price.toFixed(2);
    } else {
      return '$' + price.toFixed(4);
    }
  };

  // Grafik çizgisi için path oluştur
  const createPath = () => {
    if (data.length === 0) return '';
    
    let path = `M ${xScale(data[0].timestamp)},${yScale(data[0].price)}`;
    for (let i = 1; i < data.length; i++) {
      path += ` L ${xScale(data[i].timestamp)},${yScale(data[i].price)}`;
    }
    return path;
  };

  const path = createPath();
  const isPositive = data[data.length - 1].price >= data[0].price;
  const lineColor = isPositive ? '#10b981' : '#ef4444';

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - margin.left;
    const mouseY = e.clientY - rect.top - margin.top;
    
    // Mouse grafik alanı içinde mi kontrol et
    if (mouseX < 0 || mouseX > chartWidth || mouseY < 0 || mouseY > chartHeight) {
      setHoveredPoint(null);
      return;
    }
    
    // Mouse pozisyonuna en yakın veri noktasını bul
    const mouseTimestamp = minTime + (mouseX / chartWidth) * (maxTime - minTime);
    
    let closestIndex = 0;
    let minDistance = Math.abs(data[0].timestamp - mouseTimestamp);
    
    for (let i = 1; i < data.length; i++) {
      const distance = Math.abs(data[i].timestamp - mouseTimestamp);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }
    
    const closestPoint = data[closestIndex];
    const x = margin.left + xScale(closestPoint.timestamp);
    const y = margin.top + yScale(closestPoint.price);
    
    setHoveredPoint({
      x,
      y,
      price: closestPoint.price,
      timestamp: closestPoint.timestamp,
    });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Tarih formatı
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    if (timeRange === '5y' || timeRange === '3y') {
      return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' });
    } else if (timeRange === '1y') {
      return date.toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' });
    } else if (timeRange === '30d') {
      return date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' });
    } else if (timeRange === '7d') {
      return date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
    } else {
      return date.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  };

  // Fiyat formatı (tam)
  const formatFullPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price);
  };

  // SVG için ekstra yükseklik (X ekseni etiketleri için)
  const svgHeight = height + 30;
  
  return (
    <div className="bg-white rounded-xl p-4 w-full overflow-x-auto relative">
      <svg 
        ref={svgRef}
        width={width} 
        height={svgHeight} 
        className="overflow-visible" 
        style={{ maxWidth: '100%', minHeight: `${svgHeight}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Arka plan grid */}
        <defs>
          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect
          x={margin.left}
          y={margin.top}
          width={chartWidth}
          height={chartHeight}
          fill="url(#grid)"
        />

        {/* Yatay grid çizgileri */}
        {yTickValues.map((value, index) => {
          const y = margin.top + yScale(value);
          return (
            <line
              key={`grid-y-${index}`}
              x1={margin.left}
              y1={y}
              x2={margin.left + chartWidth}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.5"
            />
          );
        })}

        {/* Dikey grid çizgileri */}
        {xAxisLabels.map((item, index) => {
          const x = margin.left + xScale(item.timestamp);
          return (
            <line
              key={`grid-x-${index}`}
              x1={x}
              y1={margin.top}
              x2={x}
              y2={margin.top + chartHeight}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.5"
            />
          );
        })}

        {/* Invisible overlay for better hover detection */}
        <rect
          x={margin.left}
          y={margin.top}
          width={chartWidth}
          height={chartHeight}
          fill="transparent"
          style={{ cursor: 'crosshair' }}
        />
        
        {/* Y ekseni çizgisi */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={margin.top + chartHeight}
          stroke="#d1d5db"
          strokeWidth="2"
        />

        {/* X ekseni çizgisi */}
        <line
          x1={margin.left}
          y1={margin.top + chartHeight}
          x2={margin.left + chartWidth}
          y2={margin.top + chartHeight}
          stroke="#d1d5db"
          strokeWidth="2"
        />

        {/* Y ekseni etiketleri (Fiyat) */}
        {yTickValues.map((value, index) => {
          const y = margin.top + yScale(value);
          return (
            <g key={index}>
              <line
                x1={margin.left - 8}
                y1={y}
                x2={margin.left}
                y2={y}
                stroke="#9ca3af"
                strokeWidth="1.5"
              />
              <text
                x={margin.left - 15}
                y={y + 5}
                textAnchor="end"
                fontSize="13"
                fill="#374151"
                className="font-semibold"
                fontWeight="600"
              >
                {formatPrice(value)}
              </text>
            </g>
          );
        })}

        {/* X ekseni etiketleri (Tarih) */}
        {xAxisLabels.map((item, index) => {
          const x = margin.left + xScale(item.timestamp);
          const yPos = margin.top + chartHeight;
          return (
            <g key={index}>
              <line
                x1={x}
                y1={yPos}
                x2={x}
                y2={yPos + 10}
                stroke="#9ca3af"
                strokeWidth="2"
              />
              <text
                x={x}
                y={yPos + 28}
                textAnchor="middle"
                fontSize="12"
                fill="#374151"
                className="font-semibold"
                fontWeight="600"
                style={{ dominantBaseline: 'hanging' }}
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Grafik alanı gradyan arka plan */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        {/* Grafik alanı dolgusu */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <path
            d={path + ` L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`}
            fill="url(#areaGradient)"
          />
        </g>

        {/* Grafik çizgisi */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <path
            d={path}
            fill="none"
            stroke={lineColor}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Hover durumunda dikey çizgi */}
        {hoveredPoint && (
          <>
            <line
              x1={hoveredPoint.x}
              y1={margin.top}
              x2={hoveredPoint.x}
              y2={margin.top + chartHeight}
              stroke="#374151"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.6"
            />
            {/* Hover noktası */}
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="6"
              fill={lineColor}
              stroke="white"
              strokeWidth="3"
            />
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="8"
              fill={lineColor}
              opacity="0.2"
            />
          </>
        )}

        {/* Y ekseni başlığı */}
        <text
          x={margin.left - 65}
          y={margin.top + chartHeight / 2}
          textAnchor="middle"
          fontSize="12"
          fill="#6b7280"
          className="font-semibold"
          transform={`rotate(-90 ${margin.left - 65} ${margin.top + chartHeight / 2})`}
        >
          Fiyat (USD)
        </text>

        {/* X ekseni başlığı */}
        <text
          x={margin.left + chartWidth / 2}
          y={svgHeight - 5}
          textAnchor="middle"
          fontSize="11"
          fill="#6b7280"
          className="font-semibold"
        >
          Zaman
        </text>
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute bg-gray-900 text-white rounded-lg px-4 py-3 shadow-xl pointer-events-none z-10 whitespace-nowrap border border-gray-700"
          style={{
            left: `${24 + Math.min(hoveredPoint.x + 10, width - 200)}px`,
            top: `${24 + Math.max(hoveredPoint.y - 70, 20)}px`,
          }}
        >
          <div className="text-xs text-gray-300 mb-2 font-medium">{formatDate(hoveredPoint.timestamp)}</div>
          <div className="text-base font-bold">{formatFullPrice(hoveredPoint.price)}</div>
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

export default PriceChart;

