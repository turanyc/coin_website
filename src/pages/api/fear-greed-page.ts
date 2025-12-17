import { NextApiRequest, NextApiResponse } from 'next';

interface FearGreedData {
  currentValue: number;
  currentClassification: string;
  historicalValues: {
    yesterday: { value: number; classification: string };
    lastWeek: { value: number; classification: string };
    lastMonth: { value: number; classification: string };
  };
  yearlyPerformance: {
    high: { value: number; classification: string; date: string };
    low: { value: number; classification: string; date: string };
  };
  chartData: Array<{
    date: string;
    fearGreedValue: number;
    bitcoinPrice: number;
    bitcoinVolume: number;
  }>;
}

const getClassification = (value: number): string => {
  if (value <= 20) return 'Extreme Fear';
  if (value <= 40) return 'Fear';
  if (value <= 60) return 'Neutral';
  if (value <= 80) return 'Greed';
  return 'Extreme Greed';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Current Fear & Greed Index
    const fngResponse = await fetch('https://api.alternative.me/fng/', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!fngResponse.ok) {
      throw new Error(`Fear & Greed API error: ${fngResponse.status}`);
    }

    const fngData = await fngResponse.json();
    
    if (!fngData || !fngData.data || !Array.isArray(fngData.data) || fngData.data.length === 0) {
      console.error('Invalid Fear & Greed API response:', fngData);
      // Return default values instead of throwing
      return res.status(200).json({
        currentValue: 50,
        currentClassification: 'Neutral',
        historicalValues: {
          yesterday: { value: 50, classification: 'Neutral' },
          lastWeek: { value: 50, classification: 'Neutral' },
          lastMonth: { value: 50, classification: 'Neutral' },
        },
        yearlyPerformance: {
          high: { value: 75, classification: 'Greed', date: new Date().toISOString().split('T')[0] },
          low: { value: 25, classification: 'Fear', date: new Date().toISOString().split('T')[0] },
        },
        chartData: [],
      });
    }

    const currentValue = parseInt(fngData.data[0].value, 10) || 50;
    const currentClassification = fngData.data[0].value_classification || 'Neutral';

    // Historical values (last 30 days)
    const historicalData = fngData.data.slice(0, 30);
    const historicalValues = {
      yesterday: {
        value: historicalData[1] ? parseInt(historicalData[1].value, 10) : currentValue,
        classification: historicalData[1]?.value_classification || currentClassification,
      },
      lastWeek: {
        value: historicalData[7] ? parseInt(historicalData[7].value, 10) : currentValue,
        classification: historicalData[7]?.value_classification || currentClassification,
      },
      lastMonth: {
        value: historicalData[29] ? parseInt(historicalData[29].value, 10) : currentValue,
        classification: historicalData[29]?.value_classification || currentClassification,
      },
    };

    // Yearly high and low
    const allValues = historicalData.map((d: any) => parseInt(d.value || '50', 10)).filter(v => !isNaN(v));
    if (allValues.length === 0) {
      allValues.push(currentValue);
    }
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const maxIndex = allValues.indexOf(maxValue);
    const minIndex = allValues.indexOf(minValue);

    const yearlyPerformance = {
      high: {
        value: maxValue,
        classification: getClassification(maxValue),
        date: historicalData[maxIndex]?.timestamp ? new Date(historicalData[maxIndex].timestamp * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      },
      low: {
        value: minValue,
        classification: getClassification(minValue),
        date: historicalData[minIndex]?.timestamp ? new Date(historicalData[minIndex].timestamp * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      },
    };

    // Bitcoin price and volume data
    let btcPrices: number[][] = [];
    let btcVolumes: number[][] = [];
    
    try {
      const btcResponse = await fetch(
        'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=730&interval=daily',
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (btcResponse.ok) {
        const btcData = await btcResponse.json();
        btcPrices = btcData.prices || [];
        btcVolumes = btcData.total_volumes || [];
      } else {
        console.warn('Bitcoin API error, using fallback data');
      }
    } catch (error) {
      console.warn('Bitcoin API fetch failed, using fallback data:', error);
    }

    // Combine Fear & Greed and Bitcoin data
    const chartData: Array<{
      date: string;
      fearGreedValue: number;
      bitcoinPrice: number;
      bitcoinVolume: number;
    }> = [];

    // Get Fear & Greed historical data (last 730 days if available)
    let fngHistorical: any[] = [];
    try {
      const fngHistoricalResponse = await fetch('https://api.alternative.me/fng/?limit=730', {
        headers: {
          'Accept': 'application/json',
        },
      });
      if (fngHistoricalResponse.ok) {
        const fngHistoricalData = await fngHistoricalResponse.json();
        fngHistorical = fngHistoricalData.data || fngData.data || [];
      } else {
        fngHistorical = fngData.data || [];
      }
    } catch (error) {
      console.warn('Fear & Greed historical fetch failed, using current data:', error);
      fngHistorical = fngData.data || [];
    }

    // Create a map of Fear & Greed data by date
    const fngMap = new Map<string, number>();
    fngHistorical.forEach((entry: any) => {
      const entryDate = new Date(entry.timestamp * 1000);
      const dateStr = entryDate.toISOString().split('T')[0];
      fngMap.set(dateStr, parseInt(entry.value, 10));
    });

    // Create a map of Bitcoin data by timestamp (for exact matching)
    const btcDataByTimestamp = new Map<number, { price: number; volume: number }>();
    
    // Create volume map by timestamp for better matching
    const volumeMap = new Map<number, number>();
    btcVolumes.forEach((vol: number[]) => {
      volumeMap.set(vol[0], vol[1]);
    });
    
    btcPrices.forEach((price: number[]) => {
      const timestamp = price[0];
      // Try exact match first, then find closest within same day
      let volume = volumeMap.get(timestamp) || 0;
      if (!volume) {
        const closest = btcVolumes.find((v: number[]) => {
          const timeDiff = Math.abs(v[0] - timestamp);
          return timeDiff < 86400000; // Within 24 hours
        });
        volume = closest ? closest[1] : 0;
      }
      if (price[1] > 0) {
        btcDataByTimestamp.set(timestamp, { price: price[1], volume: volume || 0 });
      }
    });

    // Match dates and create chart data
    // Use Bitcoin data as base since it has more data points
    if (btcDataByTimestamp.size > 0) {
      // Sort Bitcoin data by timestamp
      const sortedBtcTimestamps = Array.from(btcDataByTimestamp.keys()).sort((a, b) => a - b);
      let lastFgValue = currentValue;
      
      sortedBtcTimestamps.forEach((timestamp) => {
        const btcData = btcDataByTimestamp.get(timestamp)!;
        const date = new Date(timestamp);
        const dateStr = date.toISOString().split('T')[0];
        
        // Find closest Fear & Greed value (within 2 days)
        let fearGreedValue = lastFgValue;
        
        // Try exact match first
        if (fngMap.has(dateStr)) {
          fearGreedValue = fngMap.get(dateStr)!;
          lastFgValue = fearGreedValue;
        } else {
          // Try to find closest match within 2 days
          for (let offset = -2; offset <= 2; offset++) {
            const checkDate = new Date(date);
            checkDate.setDate(checkDate.getDate() + offset);
            const checkDateStr = checkDate.toISOString().split('T')[0];
            if (fngMap.has(checkDateStr)) {
              fearGreedValue = fngMap.get(checkDateStr)!;
              lastFgValue = fearGreedValue;
              break;
            }
          }
        }

        // Only add if we have valid Bitcoin data
        if (btcData.price > 0 && btcData.volume > 0) {
          chartData.push({
            date: dateStr,
            fearGreedValue: isNaN(fearGreedValue) ? currentValue : fearGreedValue,
            bitcoinPrice: btcData.price,
            bitcoinVolume: btcData.volume,
          });
        }
      });
    } else {
      // Fallback: generate data from Fear & Greed only
      const now = Date.now();
      const days = 730;
      let lastFgValue = currentValue;
      const fallbackBtcPrice = 50000;
      const fallbackBtcVolume = 10000000000;

      for (let i = days; i >= 0; i--) {
        const date = new Date(now - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        
        const fearGreedValue = fngMap.get(dateStr) ?? lastFgValue;
        if (fngMap.has(dateStr)) lastFgValue = fearGreedValue;

        chartData.push({
          date: dateStr,
          fearGreedValue: isNaN(fearGreedValue) ? currentValue : fearGreedValue,
          bitcoinPrice: fallbackBtcPrice,
          bitcoinVolume: fallbackBtcVolume,
        });
      }
    }

    const data: FearGreedData = {
      currentValue,
      currentClassification,
      historicalValues,
      yearlyPerformance,
      chartData,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching Fear & Greed page data:', error);
    res.status(500).json({ error: 'Failed to fetch Fear & Greed data' });
  }
}
