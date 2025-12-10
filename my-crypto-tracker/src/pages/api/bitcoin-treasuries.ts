import { NextApiRequest, NextApiResponse } from 'next';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Sample data based on the screenshot
    const companies: CompanyData[] = [
      {
        id: 1,
        company: 'MicroStrategy',
        country: 'ABD',
        sector: 'Yazılım',
        bitcoinAmount: 158245,
        valueUSD: 4321000000,
        percentageOfSupply: 0.75,
        marketCapUSD: 4321000000,
        lastUpdate: '2023-09-17',
      },
      {
        id: 2,
        company: 'Tesla',
        country: 'ABD',
        sector: 'Otomotiv',
        bitcoinAmount: 10725,
        valueUSD: 293000000,
        percentageOfSupply: 0.05,
        marketCapUSD: 293000000,
        lastUpdate: '2023-06-30',
      },
      {
        id: 3,
        company: 'Marathon Digital Holdings',
        country: 'ABD',
        sector: 'Madencilik',
        bitcoinAmount: 13726,
        valueUSD: 375000000,
        percentageOfSupply: 0.07,
        marketCapUSD: 375000000,
        lastUpdate: '2023-08-31',
      },
      {
        id: 4,
        company: 'Hut 8 Mining',
        country: 'Kanada',
        sector: 'Madencilik',
        bitcoinAmount: 9205,
        valueUSD: 251000000,
        percentageOfSupply: 0.04,
        marketCapUSD: 251000000,
        lastUpdate: '2023-08-31',
      },
      {
        id: 5,
        company: 'Coinbase Global',
        country: 'ABD',
        sector: 'Kripto Borsa',
        bitcoinAmount: 9154,
        valueUSD: 250000000,
        percentageOfSupply: 0.04,
        marketCapUSD: 250000000,
        lastUpdate: '2023-09-30',
      },
      {
        id: 6,
        company: 'Block, Inc.',
        country: 'ABD',
        sector: 'Finansal Hizmetler',
        bitcoinAmount: 8037,
        valueUSD: 219000000,
        percentageOfSupply: 0.04,
        marketCapUSD: 219000000,
        lastUpdate: '2023-06-30',
      },
      {
        id: 7,
        company: 'Riot Platforms',
        country: 'ABD',
        sector: 'Madencilik',
        bitcoinAmount: 7127,
        valueUSD: 194000000,
        percentageOfSupply: 0.03,
        marketCapUSD: 194000000,
        lastUpdate: '2023-08-31',
      },
      {
        id: 8,
        company: 'Galaxy Digital Holdings',
        country: 'Kanada',
        sector: 'Finansal Hizmetler',
        bitcoinAmount: 6418,
        valueUSD: 175000000,
        percentageOfSupply: 0.03,
        marketCapUSD: 175000000,
        lastUpdate: '2023-06-30',
      },
      {
        id: 9,
        company: 'Hive Blockchain',
        country: 'Kanada',
        sector: 'Madencilik',
        bitcoinAmount: 3254,
        valueUSD: 89000000,
        percentageOfSupply: 0.02,
        marketCapUSD: 89000000,
        lastUpdate: '2023-08-31',
      },
      {
        id: 10,
        company: 'CleanSpark',
        country: 'ABD',
        sector: 'Madencilik',
        bitcoinAmount: 2156,
        valueUSD: 59000000,
        percentageOfSupply: 0.01,
        marketCapUSD: 59000000,
        lastUpdate: '2023-08-31',
      },
      {
        id: 11,
        company: 'Bitfarms',
        country: 'Kanada',
        sector: 'Madencilik',
        bitcoinAmount: 1892,
        valueUSD: 52000000,
        percentageOfSupply: 0.01,
        marketCapUSD: 52000000,
        lastUpdate: '2023-08-31',
      },
      {
        id: 12,
        company: 'Argo Blockchain',
        country: 'İngiltere',
        sector: 'Madencilik',
        bitcoinAmount: 1245,
        valueUSD: 34000000,
        percentageOfSupply: 0.01,
        marketCapUSD: 34000000,
        lastUpdate: '2023-06-30',
      },
    ];

    const totalBitcoinSupply = 21000000;
    const totalBitcoinHeld = companies.reduce((sum, company) => sum + company.bitcoinAmount, 0);

    // Distribution for donut chart (top companies + others)
    const distribution = [
      { name: 'MicroStrategy', amount: 158245, color: '#F7931A' },
      { name: 'Tesla', amount: 10725, color: '#E31937' },
      { name: 'Marathon Digital Holdings', amount: 13726, color: '#4A90E2' },
      { name: 'Hut 8 Mining', amount: 9205, color: '#10B981' },
      { name: 'Coinbase Global', amount: 9154, color: '#8B5CF6' },
      { name: 'Block, Inc.', amount: 8037, color: '#EF4444' },
      { name: 'Riot Platforms', amount: 7127, color: '#F59E0B' },
      { name: 'Galaxy Digital Holdings', amount: 6418, color: '#06B6D4' },
      { name: 'Hive Blockchain', amount: 3254, color: '#84CC16' },
      { name: 'CleanSpark', amount: 2156, color: '#EC4899' },
      { 
        name: 'Diğer', 
        amount: companies.slice(10).reduce((sum, c) => sum + c.bitcoinAmount, 0),
        color: '#6B7280' 
      },
    ];

    const data: BitcoinTreasuriesData = {
      totalBitcoinSupply,
      totalBitcoinHeld,
      companies,
      distribution,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching bitcoin treasuries data:', error);
    res.status(500).json({ error: 'Failed to fetch bitcoin treasuries data' });
  }
}

