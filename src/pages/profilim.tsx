import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/router';

interface User {
  id: number;
  full_name?: string;
  email: string;
  profile_picture_url?: string;
  is_verified: boolean;
}

const ProfilimPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          if (userData.profile_picture_url) {
            setProfilePicturePreview(userData.profile_picture_url);
          }
        } catch {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
    setLoading(false);
  }, [router]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
        return;
      }
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!user || !profilePicture || !profilePicturePreview) return;

    setUploading(true);
    try {
      const userId = user.id || (user as any).user_id;
      
      // Base64 olarak kaydet (gerçek uygulamada bir storage servisine yüklenmeli)
      const response = await fetch('/api/user/upload-profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          profile_picture_url: profilePicturePreview,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // LocalStorage'ı güncelle
        const updatedUser = { ...user, profile_picture_url: data.user.profile_picture_url };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        // Navbar'ı güncellemek için event gönder
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
        
        alert('Profil fotoğrafı başarıyla güncellendi!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Profil fotoğrafı yüklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Profil fotoğrafı yüklenirken bir hata oluştu.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Profilim - Dijital Market</title>
        </Head>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Profilim - Dijital Market</title>
        <meta name="description" content="Kullanıcı profil sayfası" />
      </Head>
      <Navbar />
      
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Profilim</h1>

            {/* Profil Fotoğrafı */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Profil Fotoğrafı</h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  {profilePicturePreview ? (
                    <Image
                      src={profilePicturePreview}
                      alt="Profil"
                      width={120}
                      height={120}
                      className="rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-30 h-30 rounded-full bg-gray-300 flex items-center justify-center border-4 border-gray-200">
                      <span className="text-4xl text-gray-600 font-bold">
                        {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Fotoğraf Seç</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </label>
                  {profilePicture && (
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="ml-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Yükleniyor...' : 'Yükle'}
                    </button>
                  )}
                  <p className="text-sm text-gray-500 mt-2">Maksimum dosya boyutu: 5MB</p>
                </div>
              </div>
            </div>

            {/* Kullanıcı Bilgileri */}
            <div className="border-t border-gray-200 pt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Kullanıcı Bilgileri</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {user.full_name || 'Belirtilmemiş'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {user.email}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doğrulama Durumu</label>
                  <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    {user.is_verified ? (
                      <span className="inline-flex items-center gap-2 text-green-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Doğrulanmış
                      </span>
                    ) : (
                      <span className="text-gray-600">Doğrulanmamış</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilimPage;
