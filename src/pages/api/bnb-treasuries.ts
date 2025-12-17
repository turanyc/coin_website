import { NextApiRequest, NextApiResponse } from 'next';

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Sample data based on the screenshot
    const companies: CompanyData[] = [
      {
        id: 1,
        companyName: 'CEA Industries',
        ticker: 'BNC',
        country: 'US',
        bnbHoldings: 515054,
        currentValue: 464160000,
        latestAcquisitions: '--',
        costBasis: 0.374,
        source: '--',
        lastUpdate: '2023-09-30',
      },
      {
        id: 2,
        companyName: 'Nano Labs',
        ticker: 'NA',
        country: 'CN',
        bnbHoldings: 128000,
        currentValue: 115350000,
        latestAcquisitions: '--',
        costBasis: 0.093,
        source: '--',
        lastUpdate: '2023-08-31',
      },
    ];

    const totalBNBSupply = 137700000; // 137.7M
    const totalBNBHeld = companies.reduce((sum, company) => sum + company.bnbHoldings, 0);

    // Distribution for donut chart
    const distribution = [
      { 
        name: 'CEA Industries', 
        amount: 515054, 
        percentage: 80.09,
        color: '#F3BA2F' 
      },
      { 
        name: 'Nano Labs', 
        amount: 128000, 
        percentage: 19.91,
        color: '#4A90E2' 
      },
    ];

    // Countries breakdown
    const countriesBreakdown = [
      { country: 'US', percentage: 80.1, color: '#F3BA2F' },
      { country: 'CN', percentage: 19.9, color: '#4A90E2' },
    ];

    const data: BNBTreasuriesData = {
      totalBNBSupply,
      totalBNBHeld,
      companies,
      distribution,
      countriesBreakdown,
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching BNB treasuries data:', error);
    res.status(500).json({ error: 'Failed to fetch BNB treasuries data' });
  }
}

