import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function LoginPage() {
  // --- MANTIK KISMI ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Backend API'mize (pages/api/auth/login.ts) istek atıyoruz
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Giriş başarısız');
      }

      console.log('Giriş başarılı:', data);

      // --- YENİ EKLENECEK KISIM BAŞLANGIÇ ---
      // Kullanıcı bilgilerini tarayıcı hafızasına kaydediyoruz
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      // --- YENİ EKLENECEK KISIM BİTİŞ ---
      
      // Giriş başarılıysa ana sayfaya yönlendir
      router.push('/'); 
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız');
    }
  };

  // --- TASARIM KISMI ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Giriş Yap | Kripto Tracker</title>
      </Head>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        
        {/* Logo veya Başlık */}
        <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-full bg-blue-100 mb-4">
                {/* Basit bir logo ikonu */}
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Hoş Geldiniz</h1>
            <p className="text-gray-500 text-sm">Devam etmek için giriş yapın</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Hata Mesajı */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
              {error}
            </div>
          )}

          {/* E-posta */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">E-posta</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Şifre */}
          <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-gray-700 text-sm font-semibold">Şifre</label>
                <a href="#" className="text-xs text-blue-600 hover:underline">Şifremi Unuttum?</a>
            </div>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Buton */}
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition duration-200 transform hover:-translate-y-0.5"
          >
            Giriş Yap
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
            Hesabınız yok mu? <Link href="/register" className="text-blue-600 font-bold hover:underline">Hemen Kaydolun</Link>
        </div>
      </div>
    </div>
  );
}


