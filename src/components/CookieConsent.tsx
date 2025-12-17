import React, { useState, useEffect } from 'react';

const CookieConsent: React.FC = () => {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    // Cookie consent durumunu kontrol et
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowConsent(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Çerezler (Cookies)</h3>
            <p className="text-sm text-gray-600">
              Bu web sitesi, size en iyi deneyimi sunmak için çerezler kullanmaktadır. Çerezler, izleme listenizi ve portföyünüzü tarayıcınızda saklamak için kullanılır. 
              Çerezleri kabul ederek, bu özelliklerden yararlanabilirsiniz. Çerezleri reddederseniz, bazı özellikler çalışmayabilir.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reddet
            </button>
            <button
              onClick={handleAccept}
              className="px-6 py-2 text-sm font-medium text-white bg-[#2563EB] rounded-lg hover:bg-[#1d4ed8] transition-colors"
            >
              Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
