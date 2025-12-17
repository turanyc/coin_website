# n8n Workflow Kurulum Rehberi

Bu rehber, n8n workflow'unu doğru şekilde kurmanız için adım adım talimatlar içerir.

## 🔧 n8n Workflow Yapılandırması

### 1. Webhook Node Ayarları

1. **Webhook Node** ekleyin
2. **Settings:**
   - Method: `POST`
   - Path: `/chat` (veya istediğiniz path)
   - Response Mode: `Using 'Respond to Webhook' Node`

### 2. Basic LLM Chain Node Ayarları

1. **Basic LLM Chain** node'unu ekleyin
2. **Settings:**
   - **Prompt:** `{{ $json.body.message }}` veya `{{ $json.message }}`
   - **Model:** Google Gemini Chat Model'e bağlı olmalı
   - **System Message (Opsiyonel):** Market context'i eklemek için:
     ```
     Sen Dijital Market AI'sın. Kripto para ve borsa konularında uzman bir asistan.
     Canlı piyasa verileri: {{ $json.body.marketContext }}
     ```

### 3. Google Gemini Chat Model Node Ayarları

1. **Google Gemini Chat Model** node'unu ekleyin
2. **Settings:**
   - **Model:** `gemini-pro` veya `gemini-1.5-pro`
   - **Temperature:** 0.7
   - **Max Tokens:** 1000

### 4. Respond to Webhook Node Ayarları

**ÖNEMLİ:** Bu node'un yanıt formatı doğru olmalı!

1. **Respond to Webhook** node'unu ekleyin
2. **Settings:**
   - **Response Body:**
     ```json
     {
       "message": "{{ $json.output }}"
     }
     ```
   
   **VEYA** Basic LLM Chain'in döndürdüğü format:
   
   ```json
   {
     "message": "{{ $json.text }}"
   }
   ```
   
   **VEYA** tüm yanıtı göndermek için:
   
   ```json
   {
     "message": "{{ $json.output || $json.text || $json }}"
   }
   ```

## 🔍 Yanıt Formatı Kontrolü

n8n'den gelen yanıt şu formatlardan biri olmalı:

```json
{
  "message": "Yanıt metni"
}
```

veya

```json
{
  "output": "Yanıt metni"
}
```

veya

```json
{
  "text": "Yanıt metni"
}
```

## 🧪 Test Etme

1. n8n'de **"Listen for test event"** butonuna basın
2. Terminal'de veya Postman'de test edin:
   ```bash
   curl -X POST http://localhost:5678/webhook-test/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "BTC fiyatı ne?"}'
   ```
3. n8n'de yanıtın geldiğini kontrol edin
4. Next.js chat sayfasından test edin

## 🐛 Sorun Giderme

### Sorun: "OpenAI API key is not configured"

**Neden:** n8n'den yanıt gelmiyor veya format yanlış, bu yüzden OpenAI'ye fallback yapılıyor.

**Çözüm:**
1. n8n workflow'unun çalıştığından emin olun
2. "Respond to Webhook" node'unun doğru formatı döndürdüğünü kontrol edin
3. n8n console loglarını kontrol edin
4. Next.js server console loglarını kontrol edin (n8n yanıt durumu görünecek)

### Sorun: n8n'den yanıt gelmiyor

**Kontrol Listesi:**
- ✅ Webhook node "Listen for test event" modunda mı?
- ✅ Basic LLM Chain node Gemini'ye bağlı mı?
- ✅ Respond to Webhook node doğru formatta mı?
- ✅ Workflow kaydedildi mi ve aktif mi?

### Sorun: Yanıt formatı yanlış

**Çözüm:** "Respond to Webhook" node'unda yanıt formatını kontrol edin:

```json
{
  "message": "{{ $json.output || $json.text || $json.message }}"
}
```

## 📝 Örnek n8n Workflow JSON

```json
{
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "chat",
        "responseMode": "responseNode"
      }
    },
    {
      "type": "n8n-nodes-base.basicLLMChain",
      "parameters": {
        "prompt": "{{ $json.body.message }}"
      }
    },
    {
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ { \"message\": $json.output } }}"
      }
    }
  ]
}
```

## ✅ Başarı Kriterleri

n8n workflow'u doğru çalışıyorsa:
- ✅ Webhook'a POST isteği geldiğinde yanıt döner
- ✅ Gemini'den yanıt alınır
- ✅ "Respond to Webhook" node'u `{ "message": "..." }` formatında yanıt döner
- ✅ Next.js chat sayfasında Gemini yanıtı görünür
