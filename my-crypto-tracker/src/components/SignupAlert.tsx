import React, { useState, useEffect } from 'react';

interface SignupAlertProps {
  onClose: () => void;
  onDontShowAgain: () => void;
}

const SignupAlert: React.FC<SignupAlertProps> = ({ onClose, onDontShowAgain }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 5 saniye sonra göster
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleDontShowAgain = () => {
    onDontShowAgain();
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100">
        {/* Header with Logo */}
        <div className="bg-[#2563EB] px-6 py-4 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div 
              className="absolute top-0 left-0 w-full h-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat'
              }}
            ></div>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <span className="text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                  DijitalMarketim
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Kripto Yolculuğunuza Başlayın! 🚀
          </h2>
          <p className="text-gray-600 mb-6">
            Ücretsiz hesap oluşturarak kripto para piyasasını takip edin ve yatırımlarınızı yönetin.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Portföyünüzü Oluşturun</h3>
                <p className="text-sm text-gray-600">Yatırımlarınızı takip edin ve performansınızı analiz edin</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">İzleme Listesi</h3>
                <p className="text-sm text-gray-600">Favori coin'lerinizi kaydedin ve anlık fiyat bildirimleri alın</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gelişmiş Grafikler</h3>
                <p className="text-sm text-gray-600">Detaylı teknik analiz araçları ile piyasayı derinlemesine inceleyin</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gerçek Zamanlı Veriler</h3>
                <p className="text-sm text-gray-600">Anlık fiyat güncellemeleri ve piyasa haberleri</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                // Kayıt ol sayfasına yönlendir
                window.location.href = '/register';
              }}
              className="flex-1 px-6 py-3 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Ücretsiz Kayıt Ol
            </button>
            <button
              onClick={() => {
                // Giriş yap sayfasına yönlendir
                window.location.href = '/login';
              }}
              className="flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              Giriş Yap
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Hesap oluşturarak <span className="font-semibold text-gray-700">Kullanım Koşulları</span> ve <span className="font-semibold text-gray-700">Gizlilik Politikası</span>'nı kabul etmiş olursunuz.
          </p>

          {/* Bir daha gösterme butonu */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleDontShowAgain}
              className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-2 py-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Bir daha gösterme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupAlert;

