# 🚀 Deployment Rehberi - Canlıya Alma

Bu rehber, websitesini Netlify veya Vercel üzerinde canlıya almak için adım adım talimatlar içerir.

## 📋 Ön Hazırlık

### 1. Git Repository Hazırlığı

Projenizi GitHub'a yükleyin (eğer yoksa):

```bash
# Git repository oluştur
git init
git add .
git commit -m "Initial commit"
git branch -M main

# GitHub'da yeni repository oluştur, sonra:
git remote add origin https://github.com/KULLANICI_ADI/REPO_ADI.git
git push -u origin main
```

### 2. Environment Variables Hazırlığı

`.env` dosyanızdaki değerleri not edin (production'da kullanacağız):

- `OPENAI_API_KEY`
- `N8N_WEBHOOK_URL` (opsiyonel)
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DATABASE`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

---

## 🌐 Seçenek 1: Netlify ile Deploy

### Adım 1: Netlify Hesabı Oluştur

1. https://www.netlify.com adresine gidin
2. "Sign up" butonuna tıklayın
3. GitHub hesabınızla giriş yapın (önerilen)

### Adım 2: Yeni Site Oluştur

1. Netlify dashboard'da **"Add new site"** → **"Import an existing project"** seçin
2. **"Deploy with GitHub"** seçin
3. GitHub repository'nizi seçin
4. **Build settings** otomatik algılanacak (Next.js için):
   - **Build command:** `npm run build`
   - **Publish directory:** `.next` (Netlify Next.js plugin otomatik ayarlar)

### Adım 3: Environment Variables Ekle

1. Site ayarlarına gidin: **Site settings** → **Environment variables**
2. Aşağıdaki değişkenleri ekleyin:

```
OPENAI_API_KEY=sk-proj-...
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat (opsiyonel)
POSTGRES_HOST=your-host
POSTGRES_PORT=5432
POSTGRES_DATABASE=your-database
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password
```

### Adım 4: Deploy

1. **"Deploy site"** butonuna tıklayın
2. Build işlemi başlayacak (2-5 dakika sürebilir)
3. Deploy tamamlandığında otomatik bir URL alacaksınız: `https://random-name-123.netlify.app`

### Adım 5: Custom Domain (Opsiyonel)

1. **Site settings** → **Domain management**
2. **"Add custom domain"** butonuna tıklayın
3. Domain adresinizi girin

---

## ⚡ Seçenek 2: Vercel ile Deploy (Önerilen - Next.js için)

### Adım 1: Vercel Hesabı Oluştur

1. https://vercel.com adresine gidin
2. "Sign up" butonuna tıklayın
3. GitHub hesabınızla giriş yapın

### Adım 2: Yeni Proje Oluştur

1. Vercel dashboard'da **"Add New..."** → **"Project"** seçin
2. GitHub repository'nizi seçin
3. **"Import"** butonuna tıklayın

### Adım 3: Build Ayarları

Vercel otomatik olarak Next.js'i algılar, ayarlar hazır olacak:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

### Adım 4: Environment Variables Ekle

1. **"Environment Variables"** bölümüne gidin
2. Aşağıdaki değişkenleri ekleyin:

```
OPENAI_API_KEY=sk-proj-...
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat (opsiyonel)
POSTGRES_HOST=your-host
POSTGRES_PORT=5432
POSTGRES_DATABASE=your-database
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password
```

**ÖNEMLİ:** Her değişken için **Production**, **Preview** ve **Development** ortamlarını seçin.

### Adım 5: Deploy

1. **"Deploy"** butonuna tıklayın
2. Build işlemi başlayacak (1-3 dakika sürebilir)
3. Deploy tamamlandığında otomatik bir URL alacaksınız: `https://your-project.vercel.app`

### Adım 6: Custom Domain (Opsiyonel)

1. **Settings** → **Domains**
2. Domain adresinizi girin
3. DNS ayarlarını yapın (Vercel talimatları verir)

---

## 🔧 Production için Önemli Notlar

### 1. Database Bağlantısı

Production'da PostgreSQL database'iniz için:
- **Hosted database kullanın** (örnek: Supabase, Railway, Neon, AWS RDS)
- Localhost yerine production database URL'i kullanın
- Environment variables'da production database bilgilerini girin

### 2. n8n Webhook URL

Production'da n8n kullanıyorsanız:
- n8n'i de deploy etmeniz gerekir (örnek: Railway, Render, DigitalOcean)
- Production n8n URL'ini `N8N_WEBHOOK_URL` olarak ekleyin

### 3. API Rate Limits

- OpenAI API rate limit'lerini kontrol edin
- Production'da daha fazla istek olabilir

### 4. Build Optimizasyonu

Next.js otomatik olarak optimize eder, ancak:
- Image optimization aktif
- Static generation kullanılıyor
- API routes serverless functions olarak çalışıyor

---

## 🧪 Test Etme

Deploy tamamlandıktan sonra:

1. **Ana sayfa:** `https://your-site.netlify.app` veya `https://your-project.vercel.app`
2. **AI Chat:** `/ai-chat` sayfasını test edin
3. **API Endpoints:** `/api/ai/chat` endpoint'ini test edin
4. **Database bağlantısı:** Community özelliklerini test edin

---

## 🔄 Güncelleme

Her `git push` yaptığınızda otomatik olarak:
- **Netlify:** Yeni deploy başlar
- **Vercel:** Yeni deploy başlar

Manuel deploy için:
- **Netlify:** Dashboard → **"Trigger deploy"** → **"Deploy site"**
- **Vercel:** Dashboard → **"Deployments"** → **"Redeploy"**

---

## 🐛 Sorun Giderme

### Build Hatası

1. **Console loglarını kontrol edin:**
   - Netlify: **Deploys** → Build logları
   - Vercel: **Deployments** → Build logları

2. **Yaygın hatalar:**
   - Environment variables eksik
   - TypeScript hataları
   - Dependency sorunları

### Runtime Hatası

1. **Browser console'u kontrol edin**
2. **Network tab'ını kontrol edin**
3. **API endpoint'lerini test edin**

### Database Bağlantı Hatası

1. Environment variables'ı kontrol edin
2. Database'in public IP'ye izin verdiğinden emin olun
3. Firewall ayarlarını kontrol edin

---

## 📊 Önerilen Platform Karşılaştırması

| Özellik | Netlify | Vercel |
|---------|---------|--------|
| Next.js Desteği | ✅ İyi | ✅ Mükemmel (Yaratıcıları) |
| Ücretsiz Plan | ✅ 100GB bandwidth | ✅ 100GB bandwidth |
| Build Süresi | 2-5 dakika | 1-3 dakika |
| Otomatik Deploy | ✅ | ✅ |
| Custom Domain | ✅ Ücretsiz | ✅ Ücretsiz |
| SSL Sertifikası | ✅ Otomatik | ✅ Otomatik |

**Öneri:** Next.js projesi için **Vercel** daha uygun (Next.js'in yaratıcıları tarafından yapıldı).

---

## 🎯 Hızlı Başlangıç (Vercel - Önerilen)

1. **GitHub'a push yapın:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Vercel'e gidin:** https://vercel.com
3. **"Add New Project"** → Repository seçin
4. **Environment variables ekleyin**
5. **"Deploy"** butonuna tıklayın
6. **2-3 dakika bekleyin** → Canlı URL hazır! 🎉

---

## 📝 Checklist

Deploy öncesi kontrol listesi:

- [ ] Git repository'ye push yapıldı
- [ ] `.env` dosyasındaki tüm değerler not edildi
- [ ] Production database hazır (hosted)
- [ ] Environment variables eklendi (platform'da)
- [ ] Build başarılı
- [ ] Ana sayfa açılıyor
- [ ] AI Chat çalışıyor
- [ ] API endpoints çalışıyor
- [ ] Database bağlantısı çalışıyor

---

## 🆘 Yardım

Sorun yaşarsanız:
1. Build loglarını kontrol edin
2. Browser console'u kontrol edin
3. API endpoint'lerini test edin
4. Environment variables'ı kontrol edin
