import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import {
  Users,
  TrendingUp,
  Database,
  Activity,
  Shield,
  UserCheck,
  UserX,
  BarChart3,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_verified: boolean;
  is_admin: boolean;
  created_at: string;
  profile_picture_url: string | null;
}

interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  adminUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

interface UserData {
  id?: number;
  user_id?: number;
  email?: string;
  name?: string;
  full_name?: string;
}

const AdminPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVerified, setFilterVerified] = useState<string>('all');
  const [filterAdmin, setFilterAdmin] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'users' | 'settings'>('dashboard');
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const router = useRouter();

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Stats fetch error:', error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }
    } catch (error) {
      console.error('Users fetch error:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const checkAdminAccess = useCallback(async (userData: UserData) => {
    try {
      const userId = userData.id || userData.user_id;
      
      if (!userId) {
        alert('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.is_admin) {
          setLoading(false);
          fetchStats();
          fetchUsers();
        } else {
          alert('Bu sayfaya erişim yetkiniz yok. Admin yetkisi gerekli.');
          router.push('/');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Admin check failed:', errorData);
        alert(`Admin kontrolü yapılamadı: ${errorData.message || 'Bilinmeyen hata'}`);
        router.push('/');
      }
    } catch (error) {
      const err = error as Error;
      console.error('Admin check error:', err);
      alert(`Bir hata oluştu: ${err.message || 'Bilinmeyen hata'}`);
      router.push('/');
    }
  }, [router, fetchStats, fetchUsers]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser) as UserData;
          // Admin kontrolü - API'den kontrol edilecek
          checkAdminAccess(userData);
        } catch {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [router, checkAdminAccess]);

  useEffect(() => {
    let filtered = users;

    // Arama filtresi
    if (searchTerm) {
      filtered = filtered.filter(
        (u) =>
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Doğrulama filtresi
    if (filterVerified !== 'all') {
      filtered = filtered.filter((u) =>
        filterVerified === 'verified' ? u.is_verified : !u.is_verified
      );
    }

    // Admin filtresi
    if (filterAdmin !== 'all') {
      filtered = filtered.filter((u) =>
        filterAdmin === 'admin' ? u.is_admin : !u.is_admin
      );
    }

    setFilteredUsers(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterVerified, filterAdmin, users]);

  const handleToggleVerified = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          is_verified: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchUsers();
        fetchStats();
      } else {
        alert('İşlem başarısız oldu.');
      }
    } catch (error) {
      console.error('Toggle verified error:', error);
      alert('Bir hata oluştu.');
    }
  };

  const handleToggleAdmin = async (userId: number, currentStatus: boolean) => {
    if (!confirm('Admin yetkisini değiştirmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          is_admin: !currentStatus,
        }),
      });

      if (response.ok) {
        fetchUsers();
        fetchStats();
      } else {
        const data = await response.json();
        alert(data.error || 'İşlem başarısız oldu.');
      }
    } catch (error) {
      console.error('Toggle admin error:', error);
      alert('Bir hata oluştu.');
    }
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  if (loading) {
    return (
      <>
        <Head>
          <title>Admin Panel - Dijital Market</title>
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

  return (
    <>
      <Head>
        <title>Admin Panel - Dijital Market</title>
        <meta name="description" content="Yönetim paneli" />
      </Head>
      <Navbar />

      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Shield className="w-8 h-8 text-blue-600" />
                  Admin Panel
                </h1>
                <p className="text-gray-600 mt-2">Sistem yönetimi ve kullanıcı kontrolü</p>
              </div>
              <button
                onClick={() => {
                  fetchStats();
                  fetchUsers();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Yenile
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={() => setSelectedTab('dashboard')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  selectedTab === 'dashboard'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setSelectedTab('users')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  selectedTab === 'users'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Kullanıcılar ({users.length})
              </button>
              <button
                onClick={() => setSelectedTab('settings')}
                className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                  selectedTab === 'settings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Ayarlar
              </button>
            </div>
          </div>

          {/* Dashboard Tab */}
          {selectedTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              {loadingStats ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">İstatistikler yükleniyor...</p>
                </div>
              ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Toplam Kullanıcı</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <UserCheck className="w-6 h-6 text-green-600" />
                      </div>
                      <Activity className="w-5 h-5 text-green-500" />
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Doğrulanmış Kullanıcı</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.verifiedUsers}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {stats.totalUsers > 0
                        ? ((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)
                        : 0}
                      % oranında
                    </p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-100 rounded-lg">
                        <Shield className="w-6 h-6 text-purple-600" />
                      </div>
                      <Database className="w-5 h-5 text-purple-500" />
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Admin Kullanıcı</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.adminUsers}</p>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-yellow-600" />
                      </div>
                      <Activity className="w-5 h-5 text-yellow-500" />
                    </div>
                    <h3 className="text-gray-600 text-sm font-medium mb-1">Bu Ay Yeni Kullanıcı</h3>
                    <p className="text-3xl font-bold text-gray-900">{stats.newUsersThisMonth}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Bugün: {stats.newUsersToday} | Bu Hafta: {stats.newUsersThisWeek}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-gray-600">İstatistikler yüklenemedi.</p>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {selectedTab === 'users' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="E-posta veya ad ile ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Verified Filter */}
                  <select
                    value={filterVerified}
                    onChange={(e) => setFilterVerified(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Doğrulama Durumları</option>
                    <option value="verified">Doğrulanmış</option>
                    <option value="unverified">Doğrulanmamış</option>
                  </select>

                  {/* Admin Filter */}
                  <select
                    value={filterAdmin}
                    onChange={(e) => setFilterAdmin(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Roller</option>
                    <option value="admin">Admin</option>
                    <option value="user">Kullanıcı</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              {loadingUsers ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Kullanıcılar yükleniyor...</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kullanıcı
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            E-posta
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Kayıt Tarihi
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentUsers.length > 0 ? (
                          currentUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="shrink-0 h-10 w-10">
                                    {u.profile_picture_url ? (
                                      <Image
                                        src={u.profile_picture_url}
                                        alt={u.full_name || u.email}
                                        width={40}
                                        height={40}
                                        className="h-10 w-10 rounded-full object-cover"
                                      />
                                    ) : (
                                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                        <span className="text-sm font-medium text-gray-600">
                                          {(u.full_name || u.email || 'U').charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {u.full_name || 'İsimsiz Kullanıcı'}
                                    </div>
                                    {u.is_admin && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                                        <Shield className="w-3 h-3 mr-1" />
                                        Admin
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{u.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">
                                  {new Date(u.created_at).toLocaleDateString('tr-TR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                  })}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {u.is_verified ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Doğrulanmış
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Doğrulanmamış
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleToggleVerified(u.id, u.is_verified)}
                                    className={`px-3 py-1 rounded text-xs transition-colors ${
                                      u.is_verified
                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                    }`}
                                  >
                                    {u.is_verified ? (
                                      <UserX className="w-4 h-4" />
                                    ) : (
                                      <UserCheck className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleToggleAdmin(u.id, u.is_admin)}
                                    className={`px-3 py-1 rounded text-xs transition-colors ${
                                      u.is_admin
                                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }`}
                                  >
                                    <Shield className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                              Kullanıcı bulunamadı.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        <span>
                          {indexOfFirstUser + 1} - {Math.min(indexOfLastUser, filteredUsers.length)} /{' '}
                          {filteredUsers.length} kullanıcı gösteriliyor
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Önceki
                        </button>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sonraki
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {selectedTab === 'settings' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Sistem Ayarları</h2>
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Genel Ayarlar</h3>
                  <p className="text-sm text-gray-600">Yakında eklenecek...</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Güvenlik Ayarları</h3>
                  <p className="text-sm text-gray-600">Yakında eklenecek...</p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Bildirimler</h3>
                  <p className="text-sm text-gray-600">Yakında eklenecek...</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminPanel;

