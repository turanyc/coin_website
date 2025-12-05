import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Backend'deki kayıt API'sine istek atıyoruz
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Kayıt başarısız');
      }

      // Kayıt başarılıysa giriş sayfasına yönlendir
      alert('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
      router.push('/login');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Head>
        <title>Kayıt Ol | Kripto Tracker</title>
      </Head>

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Hesap Oluştur</h1>
            <p className="text-gray-500 text-sm">Aramıza katılmak için bilgilerinizi girin</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">
              {error}
            </div>
          )}

          {/* Ad Soyad */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Ad Soyad</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Adınız Soyadınız"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* E-posta */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">E-posta</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="ornek@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Şifre */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Şifre</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition duration-200 transform hover:-translate-y-0.5"
          >
            Kayıt Ol
          </button>

        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
            Zaten hesabınız var mı? <Link href="/login" className="text-blue-600 font-bold hover:underline">Giriş Yap</Link>
        </div>

      </div>
    </div>
  );
}

