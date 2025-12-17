# n8n Entegrasyon Rehberi

Bu dokümantasyon, Digital Marketim AI sistemini n8n otomasyonları ile nasıl entegre edeceğinizi açıklar.

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [API Endpoint'leri](#api-endpointleri)
3. [n8n Workflow Örnekleri](#n8n-workflow-örnekleri)
4. [Kullanım Senaryoları](#kullanım-senaryoları)

## 🎯 Genel Bakış

Sistem iki şekilde n8n ile entegre edilebilir:

1. **Doğrudan Chat API**: `/api/ai/chat` endpoint'ini kullanarak
2. **Webhook Endpoint**: `/api/n8n/webhook` endpoint'ini kullanarak (önerilen)

## 🔌 API Endpoint'leri

### 1. Chat API (Doğrudan)

**URL:** `POST /api/ai/chat`

**Request Body:**
```json
{
  "userMessage": "BTC ne olur?",
  "marketContext": "Bitcoin (BTC): $64,500.00 (+2.5%), Ethereum (ETH): $3,400.00 (-1.2%)..."
}
```

veya mevcut format:

```json
{
  "messages": [
    { "role": "user", "content": "BTC ne olur?" }
  ],
  "marketContext": "Bitcoin (BTC): $64,500.00 (+2.5%)..."
}
```

**Not:** `marketContext` opsiyoneldir. Gönderilmezse backend otomatik olarak CoinGecko'dan top 15 coin'in canlı fiyatlarını çeker.

**Response:**
```json
{
  "message": "Bitcoin (BTC) hakkında...",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150
  }
}
```

### 2. n8n Webhook Endpoint

**URL:** `POST /api/n8n/webhook`

**Request Body:**
```json
{
  "userMessage": "BTC ne olur?",
  "marketContext": "Bitcoin (BTC): $64,500.00 (+2.5%)..." // Opsiyonel
}
```

**Not:** `marketContext` gönderilmezse backend otomatik olarak canlı piyasa verilerini çeker.

**Response:**
```json
{
  "message": "Bitcoin (BTC) hakkında...",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150
  },
  "success": true
}
```

## 🔄 n8n Workflow Örnekleri

### Örnek 1: Basit Chat Workflow

1. **Webhook Node** (Trigger)
   - Method: `POST`
   - Path: `/chat`
   - Response Mode: `Response Node`

2. **HTTP Request Node**
   - Method: `POST`
   - URL: `http://your-domain.com/api/n8n/webhook`
   - Body:
     ```json
     {
       "userMessage": "{{ $json.body.message }}"
     }
     ```

3. **Respond to Webhook Node**
   - Response Body:
     ```json
     {
       "reply": "{{ $json.message }}"
     }
     ```

### Örnek 2: Gemini ile Entegrasyon

1. **Webhook Node** (Trigger)
   - Method: `POST`

2. **HTTP Request Node** (Chat API)
   - Method: `POST`
   - URL: `http://your-domain.com/api/n8n/webhook`
   - Body:
     ```json
     {
       "userMessage": "{{ $json.body.query }}"
     }
     ```

3. **Google Gemini Node**
   - Model: `gemini-pro`
   - Prompt: `{{ $json.message }}` (Chat API'den gelen yanıtı Gemini'ye gönder)

4. **HTTP Request Node** (Sonuç)
   - İşlenmiş yanıtı başka bir servise gönder

### Örnek 3: Zamanlanmış Analiz

1. **Cron Node** (Her gün saat 09:00)
   - Expression: `0 9 * * *`

2. **HTTP Request Node**
   - Method: `POST`
   - URL: `http://your-domain.com/api/n8n/webhook`
   - Body:
     ```json
     {
       "userMessage": "Bugünün kripto piyasa analizi nedir?"
     }
     ```

3. **Email Node**
   - To: `admin@example.com`
   - Subject: `Günlük Kripto Analizi`
   - Body: `{{ $json.message }}`

## 💡 Kullanım Senaryoları

### Senaryo 1: Telegram Bot Entegrasyonu

1. Telegram Webhook al
2. Mesajı `/api/n8n/webhook`'a gönder
3. Yanıtı Telegram'a geri gönder

### Senaryo 2: Discord Bot

1. Discord Webhook al
2. Mesajı işle
3. AI yanıtını Discord kanalına gönder

### Senaryo 3: E-posta Otomasyonu

1. Gelen e-postayı oku
2. AI'ya sor
3. Yanıtı e-posta olarak gönder

## 🔐 Güvenlik Notları

1. **API Key**: `.env` dosyasında `OPENAI_API_KEY` tanımlı olmalı
2. **Rate Limiting**: OpenAI API limitlerine dikkat edin
3. **CORS**: n8n webhook endpoint'i CORS destekler
4. **Authentication**: Production'da webhook'a authentication ekleyin

## 🛠️ Environment Variables

```env
OPENAI_API_KEY=sk-your-api-key-here
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/chat  # n8n webhook URL'i (opsiyonel)
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # Production'da gerçek domain
```

### n8n Webhook URL Kurulumu

1. n8n'de webhook node'unu oluşturun
2. Test URL'ini kopyalayın (örnek: `http://localhost:5678/webhook-test/chat`)
3. `.env` dosyasına `N8N_WEBHOOK_URL` olarak ekleyin
4. Next.js sunucusunu yeniden başlatın

**Not:** `N8N_WEBHOOK_URL` tanımlı değilse veya n8n yanıt vermezse, sistem otomatik olarak OpenAI'ye geçer (fallback).

## 📝 Notlar

- Mevcut frontend sistemi değiştirilmedi, sadece n8n desteği eklendi
- Her iki format (`userMessage` ve `messages`) destekleniyor
- System prompt n8n için optimize edildi
- **YENİ:** Canlı piyasa verileri otomatik olarak AI'a gönderiliyor (CoinGecko API)
- AI artık gerçek zamanlı fiyatları biliyor ve kullanıcıya doğru bilgi verebiliyor
- `marketContext` parametresi opsiyonel - gönderilmezse backend otomatik çeker
- **YENİ:** n8n webhook entegrasyonu - Mesajlar önce n8n'e gönderilir (Gemini için)
- n8n'den yanıt gelirse Gemini yanıtı kullanılır, gelmezse OpenAI'ye fallback yapılır
- n8n webhook timeout: 10 saniye (yanıt vermezse OpenAI'ye geçilir)

## 🐛 Sorun Giderme

**Hata: "API key is not configured"**
- `.env` dosyasında `OPENAI_API_KEY` tanımlı olduğundan emin olun
- Sunucuyu yeniden başlatın

**Hata: "Rate limit exceeded"**
- OpenAI API limitinizi kontrol edin
- İstekler arasında bekleme ekleyin

**Hata: "Network error"**
- n8n'den Next.js API'ye erişilebildiğinden emin olun
- Firewall ayarlarını kontrol edin
