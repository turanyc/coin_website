# 🔄 Vercel'den GitHub'a Değişiklik Aktarma

## ❌ Sorun: Vercel Dashboard'da Yapılan Değişiklikler GitHub'da Yok

Vercel Dashboard'da yaptığınız değişiklikler (Root Directory, Build Command, vb.) sadece Vercel'de kalır, GitHub repository'nize otomatik olarak yansımaz.

---

## ✅ Çözüm: Değişiklikleri Local'e Çek ve Push Et

### Yöntem 1: Vercel CLI Kullan (Önerilen)

#### Adım 1: Vercel CLI Kur

```bash
npm install -g vercel
```

#### Adım 2: Vercel'e Login Ol

```bash
vercel login
```

#### Adım 3: Projeyi Link Et

```bash
vercel link
```

Bu komut:
- Vercel projenizi local repository ile linkler
- `.vercel` klasörü oluşturur (Git'e commit edin)
- Vercel ayarlarını local'e çeker

#### Adım 4: Vercel Ayarlarını Çek

```bash
vercel pull
```

Bu komut Vercel'deki environment variables ve ayarları local'e çeker.

---

### Yöntem 2: Manuel Olarak Local'de Düzelt (Daha Hızlı)

Vercel Dashboard'da yaptığınız değişiklikleri local dosyalarda yapın:

#### 1. Root Directory Ayarı

**Vercel Dashboard'da:** Root Directory boş bırakın (zaten yapıldı)

**Local'de:** `vercel.json` dosyasını kontrol edin (zaten doğru)

#### 2. Build Command Ayarı

**Vercel Dashboard'da:** Build Command: `npm run build`

**Local'de:** `vercel.json` dosyasında:
```json
{
  "buildCommand": "npm run build"
}
```

#### 3. Environment Variables

**Vercel Dashboard'da:** Environment variables ekleyin

**Local'de:** `.env.example` dosyası oluşturun (opsiyonel):
```env
OPENAI_API_KEY=sk-your-api-key-here
POSTGRES_HOST=your-host
POSTGRES_PORT=5432
POSTGRES_DATABASE=your-database
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password
```

**ÖNEMLİ:** `.env` dosyasını Git'e commit ETMEYİN! Sadece `.env.example` commit edin.

---

## 🚀 Hızlı Çözüm (Şu An İçin)

### Adım 1: Local Dosyaları Düzelt

`next.config.ts` dosyası zaten düzeltildi (eslint kaldırıldı).

### Adım 2: Commit ve Push

```bash
git add next.config.ts
git commit -m "Fix next.config.ts - remove deprecated eslint config"
git push origin main
```

### Adım 3: Vercel Otomatik Deploy

Vercel otomatik olarak yeni deploy başlatacak.

---

## 📋 Vercel Dashboard Ayarları (GitHub'a Aktarılmaz)

Bu ayarlar sadece Vercel'de kalır, GitHub'a aktarılmaz:

- ✅ **Root Directory** - Vercel Dashboard'da ayarlanır
- ✅ **Environment Variables** - Vercel Dashboard'da ayarlanır
- ✅ **Custom Domain** - Vercel Dashboard'da ayarlanır
- ✅ **Build & Development Settings** - `vercel.json` ile override edilebilir

**Çözüm:** Önemli ayarları `vercel.json` dosyasına ekleyin, böylece GitHub'da da olur.

---

## 🔄 Senkronizasyon Stratejisi

### 1. Local'de Çalış (Önerilen)

- Tüm değişiklikleri local'de yap
- `vercel.json` dosyasını güncelle
- Git'e commit et ve push et
- Vercel otomatik deploy yapar

### 2. Vercel Dashboard'da Yapılan Değişiklikler

Eğer Vercel Dashboard'da değişiklik yaptıysanız:

1. **Root Directory:** Local'de `vercel.json`'a ekleyemezsiniz (desteklenmiyor), sadece Dashboard'da ayarlanır
2. **Build Command:** `vercel.json`'a ekleyin
3. **Environment Variables:** Dashboard'da kalır (güvenlik için)

---

## ✅ Şu An Yapılacaklar

1. ✅ `next.config.ts` düzeltildi (eslint kaldırıldı)
2. ⏳ Commit ve push yap
3. ⏳ Vercel otomatik deploy başlayacak

---

## 📝 Notlar

- Vercel Dashboard ayarları GitHub'a otomatik aktarılmaz
- Önemli ayarları `vercel.json`'a ekleyin
- Environment variables sadece Vercel Dashboard'da olmalı (güvenlik için)
- Root Directory sadece Vercel Dashboard'da ayarlanır
