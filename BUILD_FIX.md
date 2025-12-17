# 🔧 Build Hatası Çözüm Rehberi

## ❌ Hata: "next: command not found"

Bu hata genellikle dependencies'in düzgün yüklenmemesinden kaynaklanır.

---

## ✅ Çözüm 1: Netlify Build Ayarları

`netlify.toml` dosyası güncellendi. Artık build sırasında önce `npm ci` çalışacak.

### Manuel Kontrol:

1. **Netlify Dashboard** → **Site settings** → **Build & deploy**
2. **Build command** şu şekilde olmalı:
   ```
   npm ci && npm run build
   ```
3. **Publish directory:** `.next` (veya Netlify Next.js plugin otomatik ayarlar)

### Eğer Hala Çalışmıyorsa:

**Netlify Dashboard'da:**
1. **Site settings** → **Build & deploy** → **Environment**
2. Şu environment variable'ı ekleyin:
   ```
   NPM_FLAGS=--legacy-peer-deps
   ```

---

## ✅ Çözüm 2: Vercel Build Ayarları

`vercel.json` dosyası güncellendi. Vercel genellikle otomatik algılar ama yine de kontrol edin.

### Manuel Kontrol:

1. **Vercel Dashboard** → **Project Settings** → **General**
2. **Build & Development Settings** bölümünde:
   - **Install Command:** `npm ci --legacy-peer-deps`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next` (otomatik algılanır)

---

## ✅ Çözüm 3: package-lock.json Kontrolü

`package-lock.json` dosyasının Git'e commit edildiğinden emin olun:

```bash
# Kontrol et
git status

# Eğer package-lock.json görünmüyorsa:
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

---

## ✅ Çözüm 4: Local Build Test

Deploy etmeden önce local'de build'i test edin:

```bash
# Dependencies'i temizle ve yeniden yükle
rm -rf node_modules package-lock.json
npm install

# Build'i test et
npm run build
```

Eğer local'de çalışıyorsa, deploy'da da çalışmalı.

---

## ✅ Çözüm 5: Node.js Versiyonu

Netlify ve Vercel'de Node.js versiyonunu kontrol edin:

### Netlify:
`netlify.toml` dosyasında:
```toml
[build.environment]
  NODE_VERSION = "20"
```

### Vercel:
Vercel otomatik algılar, ama manuel ayarlamak için:
1. **Project Settings** → **General** → **Node.js Version**
2. **20.x** seçin

---

## ✅ Çözüm 6: package.json Scripts Kontrolü

`package.json` dosyanızda build script'i doğru olmalı:

```json
{
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "start": "next start"
  }
}
```

---

## 🐛 Yaygın Hatalar ve Çözümleri

### Hata 1: "Cannot find module 'next'"
**Çözüm:** `npm ci` komutu dependencies'i yükler. Build command'da `npm ci && npm run build` kullanın.

### Hata 2: "Peer dependency conflicts"
**Çözüm:** `NPM_FLAGS=--legacy-peer-deps` environment variable'ını ekleyin.

### Hata 3: "Build timeout"
**Çözüm:** Build süresini artırın veya build'i optimize edin.

### Hata 4: "Module not found"
**Çözüm:** `package.json`'da tüm dependencies'in doğru olduğundan emin olun.

---

## 📋 Deployment Öncesi Checklist

- [ ] `package-lock.json` Git'e commit edildi
- [ ] Local'de `npm run build` başarılı
- [ ] `netlify.toml` veya `vercel.json` doğru yapılandırıldı
- [ ] Node.js versiyonu belirtildi (20.x)
- [ ] Environment variables eklendi
- [ ] Build command doğru (`npm ci && npm run build`)

---

## 🚀 Hızlı Düzeltme

Eğer hala çalışmıyorsa, Netlify Dashboard'da:

1. **Site settings** → **Build & deploy** → **Build settings**
2. **Build command** alanına şunu yazın:
   ```
   npm ci --legacy-peer-deps && npm run build
   ```
3. **Deploy** butonuna tıklayın

---

## 🆘 Hala Çalışmıyorsa

1. **Build loglarını kontrol edin:**
   - Netlify: **Deploys** → Build logları
   - Vercel: **Deployments** → Build logları

2. **Hata mesajının tamamını okuyun** - genellikle hangi modülün eksik olduğunu söyler

3. **Local build'i test edin** - eğer local'de çalışmıyorsa, deploy'da da çalışmaz

4. **Dependencies'i kontrol edin:**
   ```bash
   npm list --depth=0
   ```

---

## 📝 Notlar

- `npm ci` komutu `package-lock.json`'a göre dependencies'i yükler (daha güvenilir)
- `--legacy-peer-deps` flag'i peer dependency uyarılarını yok sayar
- Netlify Next.js plugin otomatik olarak Next.js'i algılar ve optimize eder
- Vercel Next.js'in yaratıcıları tarafından yapıldığı için en iyi Next.js desteğine sahiptir
