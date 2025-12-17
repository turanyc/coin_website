# 🔧 Vercel Build Hatası - Exit Code Sorunu

## ❌ Sorun: "Command exited with [kod]"

Vercel build sırasında `npm ci --legacy-peer-deps && npm run build` komutu hata veriyor.

---

## ✅ Çözüm: vercel.json Optimizasyonu

`vercel.json` dosyası sadeleştirildi:

**Önce:**
```json
{
  "buildCommand": "npm ci --legacy-peer-deps && npm run build",
  "installCommand": "npm ci --legacy-peer-deps"
}
```

**Sonra:**
```json
{
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "npm run build"
}
```

**Neden:**
- `npm ci` bazen `package-lock.json` ile uyumsuzluk yaratabilir
- `npm install` daha esnek ve genellikle daha iyi çalışır
- Build command'i basitleştirdik (Vercel otomatik algılar)

---

## 🚀 Vercel Dashboard'da Yapılacaklar

### 1. Root Directory Kontrolü

1. **Project Settings** → **General**
2. **Root Directory** alanını **boş bırakın** (veya silin)
3. **Save**

### 2. Build Ayarları (Opsiyonel - Vercel otomatik algılar)

1. **Build & Development Settings**
2. **Install Command:** `npm install --legacy-peer-deps` (veya boş bırakın)
3. **Build Command:** `npm run build` (veya boş bırakın - otomatik algılanır)
4. **Save**

---

## 🔍 Yaygın Exit Code'lar ve Çözümleri

### Exit Code 127: "Command not found"
**Neden:** Komut bulunamıyor
**Çözüm:** Build command'i kontrol edin, basit tutun

### Exit Code 1: "Build failed"
**Neden:** Build sırasında hata
**Çözüm:** Build loglarını kontrol edin, TypeScript/ESLint hatalarını düzeltin

### Exit Code 2: "Dependencies error"
**Neden:** npm install başarısız
**Çözüm:** `--legacy-peer-deps` flag'ini kullanın

---

## 📋 Checklist

- [x] `vercel.json` sadeleştirildi ✅
- [ ] Vercel Dashboard'da Root Directory boş
- [ ] Environment variables eklendi
- [ ] Build logları kontrol edildi

---

## 🆘 Hala Çalışmıyorsa

1. **Vercel Dashboard'da Root Directory'yi kontrol edin** - Boş olmalı
2. **Build loglarını detaylı okuyun** - Hangi adımda hata?
3. **Local build'i test edin:** `npm install --legacy-peer-deps && npm run build`
4. **Vercel Support'a başvurun** - Build loglarını paylaşın

---

## 💡 İpucu

Vercel Next.js'i otomatik algılar. `vercel.json` dosyasını mümkün olduğunca basit tutun. Sadece gerekli ayarları ekleyin.
