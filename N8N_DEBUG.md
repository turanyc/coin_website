# n8n Webhook Debug Rehberi

Bu rehber, n8n webhook'unun neden yanıt vermediğini bulmanıza yardımcı olur.

## 🔍 Adım 1: n8n Workflow'unu Kontrol Et

### 1.1 Webhook Node Kontrolü

1. n8n'de **Webhook** node'unu açın
2. **"Listen for test event"** butonuna basın (turuncu buton)
3. **Test URL**'i kopyalayın (örnek: `http://localhost:5678/webhook-test/chat`)
4. Bu URL'in `.env` dosyasındaki `N8N_WEBHOOK_URL` ile aynı olduğundan emin olun

### 1.2 Respond to Webhook Node Kontrolü

**EN ÖNEMLİ:** Bu node'un doğru formatta yanıt döndürmesi gerekiyor!

1. **Respond to Webhook** node'unu açın
2. **Response Body** alanını kontrol edin
3. Şu formatlardan birini kullanın:

```json
{
  "message": "{{ $json.output }}"
}
```

**VEYA** eğer Basic LLM Chain farklı format döndürüyorsa:

```json
{
  "message": "{{ $json.output || $json.text || $json.message }}"
}
```

## 🧪 Adım 2: Terminal'den Test Et

n8n workflow'unu doğrudan test edin:

```bash
curl -X POST http://localhost:5678/webhook-test/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Test mesajı\", \"marketContext\": \"Bitcoin: $50000\"}"
```

**Beklenen yanıt:**
```json
{
  "message": "Gemini'den gelen yanıt..."
}
```

Eğer yanıt gelmiyorsa veya format yanlışsa, n8n workflow'unu kontrol edin.

## 📊 Adım 3: Next.js Console Loglarını Kontrol Et

Next.js server console'unu açın ve şu logları arayın:

### Başarılı Durum:
```
📤 n8n webhook'a gönderiliyor: http://localhost:5678/webhook-test/chat
📤 Gönderilen veri: {"message":"...","marketContext":"..."}
📥 n8n yanıt durumu: 200 OK
📥 n8n ham yanıt: {"message":"..."}
✅ n8n webhook yanıtı alındı (Gemini)
```

### Hata Durumları:

**1. Timeout Hatası:**
```
⚠️ n8n webhook hatası, OpenAI'ye geçiliyor: The operation was aborted
```
**Çözüm:** n8n workflow'u çok yavaş çalışıyor. Timeout süresini artırın veya workflow'u optimize edin.

**2. Bağlantı Hatası:**
```
⚠️ n8n webhook hatası, OpenAI'ye geçiliyor: fetch failed
```
**Çözüm:** n8n çalışıyor mu kontrol edin. `http://localhost:5678` adresine gidin.

**3. Format Hatası:**
```
⚠️ n8n yanıt formatı beklenmeyen veya boş
⚠️ Ham yanıt: {...}
```
**Çözüm:** "Respond to Webhook" node'unun Response Body formatını kontrol edin.

## 🔧 Adım 4: n8n Workflow'unu Düzelt

### 4.1 Respond to Webhook Node'unu Düzelt

1. **Respond to Webhook** node'unu açın
2. **Response Body** alanına şunu yazın:

```json
{
  "message": "{{ $json.output || $json.text || $json.message || $json }}"
}
```

3. **Save** butonuna basın
4. Workflow'u **Execute** edin

### 4.2 Basic LLM Chain Node'unu Kontrol Et

1. **Basic LLM Chain** node'unu açın
2. **Prompt** alanının doğru olduğundan emin olun:
   ```
   {{ $json.body.message }}
   ```
3. **Model** alanının **Google Gemini Chat Model**'e bağlı olduğundan emin olun

## ✅ Adım 5: Test Et

1. n8n'de **"Listen for test event"** butonuna basın
2. Next.js chat sayfasından bir mesaj gönderin
3. Next.js console loglarını kontrol edin
4. n8n'de yanıtın geldiğini kontrol edin

## 🐛 Yaygın Hatalar ve Çözümleri

### Hata: "n8n webhook yanıt vermedi"

**Olası Nedenler:**
1. ❌ n8n çalışmıyor
2. ❌ Webhook URL yanlış
3. ❌ "Listen for test event" aktif değil
4. ❌ Respond to Webhook node yanıt döndürmüyor

**Çözüm:**
1. n8n'in çalıştığından emin olun (`http://localhost:5678`)
2. `.env` dosyasındaki `N8N_WEBHOOK_URL`'i kontrol edin
3. n8n'de "Listen for test event" butonuna basın
4. Respond to Webhook node'unun Response Body formatını kontrol edin

### Hata: "Yanıt formatı beklenmeyen"

**Çözüm:** Respond to Webhook node'unun Response Body'sini şu şekilde güncelleyin:

```json
{
  "message": "{{ $json.output || $json.text || $json.message }}"
}
```

## 📝 Debug Checklist

- [ ] n8n çalışıyor mu? (`http://localhost:5678`)
- [ ] Webhook node "Listen for test event" modunda mı?
- [ ] `.env` dosyasında `N8N_WEBHOOK_URL` doğru mu?
- [ ] Respond to Webhook node Response Body formatı doğru mu?
- [ ] Basic LLM Chain node Gemini'ye bağlı mı?
- [ ] Workflow kaydedildi mi?
- [ ] Next.js server console loglarını kontrol ettiniz mi?

## 🎯 Hızlı Test Komutu

Terminal'de çalıştırın:

```bash
curl -X POST http://localhost:5678/webhook-test/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"BTC fiyatı ne?\"}" \
  -v
```

`-v` flag'i detaylı bilgi gösterir. Yanıt geliyorsa n8n çalışıyor demektir.
