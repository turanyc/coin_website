import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Navbar from '../components/Navbar';

const MarketCapPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Piyasa Değeri Detayları | Dijital Marketim</title>
      </Head>
      
      <Navbar marketStats={null} />
      
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Piyasa Değeri Detayları</h1>
          <p className="text-gray-600 mb-8">Bu sayfa yakında eklenecektir.</p>
          <Link href="/" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all">
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MarketCapPage;

