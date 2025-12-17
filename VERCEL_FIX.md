# 🔧 Vercel Build Hatası Çözümü

## ❌ Hata: "Command 'npm run build' exited with 127"

Build loglarında görünen sorun:
```
> build
> cd my-crypto-tracker && npm run build
Command "npm run build" exited with 127
```

Bu, Vercel'in yanlış bir build komutu çalıştırdığını gösteriyor.

---

## ✅ Çözüm 1: Vercel Dashboard'da Root Directory Ayarı

**Sorun:** Vercel projenin `my-crypto-tracker` klasörü içinde olduğunu düşünüyor.

**Çözüm:**

1. **Vercel Dashboard** → **Project Settings** → **General**
2. **Root Directory** bölümünü bulun
3. **Root Directory** alanını **boş bırakın** veya **`.`** (nokta) yazın
4. **Save** butonuna tıklayın

---

## ✅ Çözüm 2: vercel.json Dosyasını Düzelt

`vercel.json` dosyası güncellendi:
- ✅ `buildCommand` düzeltildi: `npm ci --legacy-peer-deps && npm run build`
- ✅ `rootDirectory` eklendi: `"."`

---

## ✅ Çözüm 3: Vercel Dashboard'da Build Ayarları

**Vercel Dashboard** → **Project Settings** → **General** → **Build & Development Settings**:

1. **Root Directory:** Boş bırakın veya `.` yazın
2. **Build Command:** `npm ci --legacy-peer-deps && npm run build`
3. **Install Command:** `npm ci --legacy-peer-deps`
4. **Output Directory:** `.next` (otomatik algılanır)
5. **Development Command:** `npm run dev`

---

## 🔍 Build Log Analizi

**Görünen Hata:**
```
> build
> cd my-crypto-tracker && npm run build
Command "npm run build" exited with 127
```

**Neden:**
- Vercel `my-crypto-tracker` klasörüne girmeye çalışıyor
- Ancak proje zaten root'ta
- Bu yüzden `cd my-crypto-tracker` başarısız oluyor

**Çözüm:**
- Root Directory ayarını düzelt
- Veya `vercel.json`'da `rootDirectory: "."` ekle

---

## 📋 Vercel Deployment Checklist

### Öncesi:
- [x] `vercel.json` doğru yapılandırıldı ✅
- [ ] Root Directory ayarı kontrol edildi (Vercel Dashboard'da)
- [x] Build Command doğru: `npm ci --legacy-peer-deps && npm run build` ✅
- [ ] Environment variables hazır

### Vercel Dashboard'da:
- [ ] **Project Settings** → **General** → **Root Directory** boş veya `.`
- [ ] **Build Command** doğru
- [ ] **Install Command** doğru: `npm ci --legacy-peer-deps`
- [ ] **Environment Variables** eklendi (Production, Preview, Development)

### Sonrası:
- [ ] Build başarılı
- [ ] Site açılıyor
- [ ] API endpoint'ler çalışıyor

---

## 🚀 Hızlı Düzeltme

### Adım 1: Vercel Dashboard'da

1. **Project Settings** → **General**
2. **Root Directory** alanını **boş bırakın** (veya silin)
3. **Save** butonuna tıklayın

### Adım 2: Build Command'i Kontrol Et

1. **Build & Development Settings** bölümüne gidin
2. **Build Command:** `npm ci --legacy-peer-deps && npm run build`
3. **Save** butonuna tıklayın

### Adım 3: Redeploy

1. **Deployments** sayfasına gidin
2. **Redeploy** butonuna tıklayın
3. Build loglarını kontrol edin

---

## 🐛 Yaygın Hatalar

### Hata 1: "cd my-crypto-tracker: No such file or directory"

**Neden:** Root Directory yanlış ayarlanmış

**Çözüm:** Vercel Dashboard'da Root Directory'yi boş bırakın

### Hata 2: "Command exited with 127"

**Neden:** Build komutu bulunamıyor veya yanlış çalıştırılıyor

**Çözüm:** 
- Build Command'i kontrol edin
- `npm ci --legacy-peer-deps && npm run build` kullanın

### Hata 3: "Module not found"

**Neden:** Dependencies düzgün yüklenmemiş

**Çözüm:**
- Install Command: `npm ci --legacy-peer-deps`
- `package-lock.json` Git'te olmalı

---

## 📝 Önemli Notlar

1. **Root Directory:** Vercel'de boş bırakılmalı (proje zaten root'ta)
2. **Build Command:** `npm ci --legacy-peer-deps && npm run build` (legacy-peer-deps önemli)
3. **Install Command:** `npm ci --legacy-peer-deps` (dependencies için)
4. **Environment Variables:** Production, Preview ve Development için ayrı ayrı ekleyin

---

## ✅ Başarı Kriterleri

- ✅ Build başarılı (exit code 0)
- ✅ Root Directory doğru ayarlandı
- ✅ Build Command çalışıyor
- ✅ Site açılıyor
- ✅ API endpoint'ler çalışıyor

---

## 🆘 Hala Çalışmıyorsa

1. **Build loglarını detaylı okuyun** - Hangi adımda hata oldu?
2. **Root Directory'yi kontrol edin** - Boş olmalı
3. **Build Command'i kontrol edin** - Doğru mu?
4. **Local build'i test edin** - Local'de çalışıyor mu?
5. **Vercel Support'a başvurun** - Build loglarını paylaşın

---

## 🔄 Projeyi Yeniden Yapılandırma

Eğer hiçbir şey işe yaramazsa:

1. **Vercel Dashboard** → Projeyi silin
2. **Add New Project** → Repository'yi import edin
3. **Root Directory:** Boş bırakın
4. **Framework Preset:** Next.js (otomatik algılanır)
5. **Build Command:** `npm ci --legacy-peer-deps && npm run build`
6. **Environment Variables** ekleyin
7. **Deploy** butonuna tıklayın
