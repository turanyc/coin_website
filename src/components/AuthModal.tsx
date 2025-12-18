import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Kullanıcı bilgilerini tam olarak kaydet (profil fotoğrafı dahil)
          const userData = {
            id: data.user.id,
            user_id: data.user.user_id || data.user.id,
            email: data.user.email,
            name: data.user.name || data.user.full_name,
            full_name: data.user.full_name || data.user.name,
            profile_picture_url: data.user.profile_picture_url || null,
            is_verified: data.user.is_verified || false
          };
          localStorage.setItem('currentUser', JSON.stringify(userData));
          // Kullanıcı giriş yaptı event'i gönder
          window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));
          onClose();
          // Sayfayı reload etmek yerine event ile state güncelle
        } else {
          setError(data.message || 'Giriş başarısız');
        }
      } else {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, fullName }),
        });

        const data = await response.json();

        if (response.ok) {
          // Kayıt başarılı - kullanıcı bilgilerini kaydet (eğer varsa)
          if (data.user) {
            const userData = {
              id: data.user.id,
              user_id: data.user.user_id || data.user.id,
              email: data.user.email,
              name: data.user.name || data.user.full_name,
              full_name: data.user.full_name || data.user.name,
              profile_picture_url: data.user.profile_picture_url || null,
              is_verified: data.user.is_verified || false
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: userData }));
          }
          
          setMode('login');
          setError('');
          setEmail('');
          setPassword('');
          setFullName('');
        } else {
          setError(data.message || 'Kayıt başarısız');
        }
      }
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 border-b border-gray-200">
            <button
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors relative ${
                mode === 'login'
                  ? 'text-[#2563EB]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Giriş Yap
              {mode === 'login' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]"></div>
              )}
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`flex-1 pb-3 text-center text-sm font-semibold transition-colors relative ${
                mode === 'register'
                  ? 'text-[#2563EB]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Kayıt Ol
              {mode === 'register' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB]"></div>
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  placeholder="Adınız ve soyadınız"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                E-posta Adresi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                placeholder="E-posta adresinizi girin..."
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-gray-700">
                  Şifre
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      // Forgot password functionality
                    }}
                    className="text-xs text-[#2563EB] hover:underline"
                  >
                    Şifremi unuttum?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-3 py-2.5 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent"
                  placeholder="Şifrenizi girin..."
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.132m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-[#1E40AF] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? 'Yükleniyor...' : mode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>
          </form>

          {/* OR Separator */}
          <div className="flex items-center my-4">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-3 text-xs text-gray-500">VEYA</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-medium text-gray-700">Google ile Devam Et</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.96-3.24-1.44-1.56-.62-2.53-1.16-3.36-1.99C6.24 15.28 5.4 13.75 5.4 12c0-1.83.84-3.28 2.5-4.04-.5-1.22-.67-2.64.19-3.86 1.05-1.5 2.84-1.84 4.17-.8 1.19.9 1.67 2.24 2.05 3.6.5-.12 1-.18 1.53-.18 1.56 0 2.97.6 4.03 1.66.38.38.7.8.95 1.25-.9.53-1.96 1.11-2.87 1.85-.27-.48-.6-.92-1-1.32-.85-.85-1.95-1.32-3.11-1.32-.74 0-1.44.18-2.05.5-.18-.58-.5-1.1-.95-1.52-.9-.85-2.1-1.32-3.4-1.32-1.58 0-3 .64-4.03 1.66C2.64 6.36 2 7.78 2 9.36c0 1.58.64 3 1.66 4.03.9.9 2.1 1.4 3.4 1.4.5 0 1-.1 1.5-.3.3.6.7 1.1 1.2 1.5.85.7 1.9 1.25 3.05 1.6.5.15 1 .25 1.5.3.5.05 1 .08 1.5.08.9 0 1.8-.15 2.65-.45.4-.15.8-.35 1.15-.6z"/>
              </svg>
              <span className="font-medium text-gray-700">Apple ile Devam Et</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="#F0B90B" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span className="font-medium text-gray-700">Binance ile Devam Et</span>
            </button>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium text-gray-700">Cüzdan ile Devam Et</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
