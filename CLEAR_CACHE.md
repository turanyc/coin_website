# 🔧 Cache Temizleme Rehberi

## ❌ Hata: "Module not found: Can't resolve 'bcrypt'"

Bu hata genellikle Next.js cache sorunundan kaynaklanır. Aşağıdaki adımları takip edin:

## ✅ Çözüm Adımları

### 1. Next.js Cache'ini Temizle

```bash
# .next klasörünü sil
rm -rf .next

# Windows PowerShell'de:
Remove-Item -Recurse -Force .next
```

### 2. Node Modules Cache'ini Temizle

```bash
# node_modules/.cache klasörünü sil
rm -rf node_modules/.cache

# Windows PowerShell'de:
Remove-Item -Recurse -Force node_modules/.cache
```

### 3. TypeScript Cache'ini Temizle

```bash
# TypeScript build info dosyasını sil
rm -f *.tsbuildinfo

# Windows PowerShell'de:
Remove-Item -Force *.tsbuildinfo
```

### 4. Dev Server'ı Durdur ve Yeniden Başlat

```bash
# Ctrl+C ile dev server'ı durdurun
# Sonra:
npm run dev
```

### 5. Eğer Hala Çalışmıyorsa: Node Modules'ı Yeniden Yükle

```bash
# node_modules ve package-lock.json'ı sil
rm -rf node_modules package-lock.json

# Windows PowerShell'de:
Remove-Item -Recurse -Force node_modules, package-lock.json

# Yeniden yükle
npm install
```

### 6. Build'i Test Et

```bash
npm run build
```

---

## 🎯 Hızlı Çözüm (Tüm Cache'leri Temizle)

Windows PowerShell'de:

```powershell
# Tüm cache'leri temizle
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules/.cache -ErrorAction SilentlyContinue
Remove-Item -Force *.tsbuildinfo -ErrorAction SilentlyContinue

# Dev server'ı yeniden başlat
npm run dev
```

---

## 📝 Notlar

- `bcryptjs` paketi `package.json`'da mevcut
- Tüm import'lar `bcryptjs` kullanıyor
- Sorun genellikle cache'den kaynaklanır

---

## 🆘 Hala Çalışmıyorsa

1. **IDE'yi yeniden başlatın** (VS Code, Cursor, vb.)
2. **Terminal'i kapatıp yeniden açın**
3. **Node.js versiyonunu kontrol edin:** `node --version` (20.x önerilir)
4. **package.json'ı kontrol edin:** `bcryptjs` ve `@types/bcryptjs` olmalı
