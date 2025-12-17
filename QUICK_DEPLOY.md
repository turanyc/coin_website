# ⚡ Hızlı Deploy Rehberi

## 🎯 En Hızlı Yol: Vercel (2-3 dakika)

### Adım 1: GitHub'a Push Yap
```bash
git add .
git commit -m "Ready for deployment"
git push
```

### Adım 2: Vercel'e Git
1. https://vercel.com → **Sign up** (GitHub ile)
2. **"Add New Project"** → Repository seç
3. **"Import"** butonuna tıkla

### Adım 3: Environment Variables Ekle
**Environment Variables** bölümüne şunları ekle:

```
OPENAI_API_KEY=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
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=kripto_tracker_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=turanyc
```

**ÖNEMLİ:** Her değişken için **Production**, **Preview** ve **Development** seçeneklerini işaretle.

### Adım 4: Deploy
**"Deploy"** butonuna tıkla → 2-3 dakika bekle → **Canlı URL hazır!** 🎉

---

## 🌐 Alternatif: Netlify

### Adım 1: GitHub'a Push Yap
```bash
git add .
git commit -m "Ready for deployment"
git push
```

### Adım 2: Netlify'e Git
1. https://www.netlify.com → **Sign up** (GitHub ile)
2. **"Add new site"** → **"Import an existing project"**
3. Repository seç → **"Deploy site"**

### Adım 3: Environment Variables Ekle
**Site settings** → **Environment variables** → Aynı değişkenleri ekle

### Adım 4: Deploy
Otomatik başlar → 2-5 dakika bekle → **Canlı URL hazır!** 🎉

---

## ⚠️ ÖNEMLİ NOTLAR

### Database Bağlantısı
Production'da localhost çalışmaz! Şunlardan birini kullan:
- **Supabase** (ücretsiz): https://supabase.com
- **Railway** (ücretsiz): https://railway.app
- **Neon** (ücretsiz): https://neon.tech

Production database bilgilerini environment variables'a ekle.

### n8n Webhook
Production'da localhost çalışmaz! n8n'i de deploy et:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **DigitalOcean**: https://digitalocean.com

---

## 🧪 Test Et

Deploy tamamlandıktan sonra:
1. Ana sayfayı aç: `https://your-project.vercel.app`
2. AI Chat'i test et: `/ai-chat`
3. API'yi test et: Console'da network tab'ını kontrol et

---

## 🔄 Güncelleme

Her `git push` yaptığında otomatik deploy olur! 🚀

---

## 📊 Hangi Platform?

- **Vercel** → Next.js için en iyi (önerilen) ⭐
- **Netlify** → Alternatif, iyi çalışır

Her ikisi de ücretsiz ve otomatik deploy yapıyor!
