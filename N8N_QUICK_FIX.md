# n8n Webhook Hızlı Çözüm Rehberi

## 🚨 Sorun: n8n webhook yanıt vermiyor

### ✅ Hızlı Çözüm 1: OPENAI_API_KEY'yi Aktif Et (Fallback için)

`.env` dosyanızı açın ve `OPENAI_API_KEY` satırındaki `#` işaretini kaldırın:

**Önce:**
```env
# OPENAI_API_KEY=sk-your-api-key-here
```

**Sonra:**
```env
OPENAI_API_KEY=sk-your-api-key-here
```

**Sonra Next.js sunucusunu yeniden başlatın:**
```bash
# Ctrl+C ile durdurun, sonra:
npm run dev
```

Bu sayede n8n yanıt vermese bile OpenAI fallback çalışacak.

---

### 🔍 Hızlı Çözüm 2: n8n Webhook'unu Düzelt

#### Adım 1: n8n'in Çalıştığını Kontrol Edin
Tarayıcıda şu adrese gidin: http://localhost:5678

#### Adım 2: n8n'de "Listen for test event" Butonuna Basın
1. n8n workflow'unuzu açın
2. **Webhook** node'unu bulun
3. **"Listen for test event"** (turuncu buton) butonuna basın
4. Test URL'ini kopyalayın (örnek: `http://localhost:5678/webhook-test/chat`)

#### Adım 3: Webhook URL'ini Kontrol Edin
`.env` dosyanızda `N8N_WEBHOOK_URL` değerini kontrol edin:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat
```

**ÖNEMLİ:** Eğer n8n'de test URL'i `/webhook-test/chat` ise, `.env` dosyasını şu şekilde güncelleyin:

```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/chat
```

#### Adım 4: "Respond to Webhook" Node'unu Kontrol Edin
1. n8n workflow'unuzda **Respond to Webhook** node'unu açın
2. **Response Body** alanına şunu yazın:

```json
{
  "message": "{{ $json.output || $json.text || $json.message }}"
}
```

3. **Save** butonuna basın
4. Workflow'u **Execute** edin

#### Adım 5: Test Edin
Terminal'den test edin:

```bash
curl -X POST http://localhost:5678/webhook-test/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"Test mesajı\"}"
```

**Beklenen yanıt:**
```json
{
  "message": "Gemini'den gelen yanıt..."
}
```

---

### 📊 Debug: Next.js Console Loglarını Kontrol Edin

Next.js server console'unu açın ve şu logları arayın:

#### ✅ Başarılı Durum:
```
📤 n8n webhook'a gönderiliyor: http://localhost:5678/webhook-test/chat
📤 Gönderilen veri: {"message":"...","marketContext":"..."}
📥 n8n yanıt durumu: 200 OK
📥 n8n ham yanıt: {"message":"..."}
✅ n8n webhook yanıtı alındı (Gemini)
```

#### ❌ Hata Durumları:

**1. Timeout Hatası:**
```
⏱️ n8n webhook timeout (20s) - n8n çok yavaş yanıt veriyor veya çalışmıyor
💡 İpucu: n8n workflow'unu kontrol edin ve "Listen for test event" butonuna basın
```
**Çözüm:** n8n workflow'u çok yavaş çalışıyor. Timeout süresini artırdık (15s → 20s).

**2. Bağlantı Hatası:**
```
🔌 n8n webhook bağlantı hatası - n8n çalışmıyor olabilir
💡 İpucu: http://localhost:5678/webhook-test/chat adresine erişilemiyor. n8n'in çalıştığından emin olun: http://localhost:5678
```
**Çözüm:** n8n çalışıyor mu kontrol edin. `http://localhost:5678` adresine gidin.

**3. Format Hatası:**
```
⚠️ n8n yanıt formatı beklenmeyen veya boş
⚠️ Ham yanıt: {...}
```
**Çözüm:** "Respond to Webhook" node'unun Response Body formatını kontrol edin (Adım 4).

---

### 🎯 Özet: Yapılacaklar Listesi

- [ ] `.env` dosyasında `OPENAI_API_KEY` satırındaki `#` işaretini kaldır (fallback için)
- [ ] Next.js sunucusunu yeniden başlat
- [ ] n8n'in çalıştığını kontrol et: http://localhost:5678
- [ ] n8n'de "Listen for test event" butonuna bas
- [ ] `.env` dosyasındaki `N8N_WEBHOOK_URL` değerini kontrol et (test URL ile eşleşmeli)
- [ ] "Respond to Webhook" node'unun Response Body formatını kontrol et
- [ ] Terminal'den curl ile test et
- [ ] Next.js console loglarını kontrol et

---

### 💡 Yapılan İyileştirmeler

1. ✅ **Timeout süresi artırıldı:** 15 saniye → 20 saniye
2. ✅ **Daha detaylı hata mesajları:** Her hata türü için özel ipuçları
3. ✅ **Daha iyi log mesajları:** Timeout ve bağlantı hataları için açıklayıcı mesajlar

---

### 🆘 Hala Çalışmıyorsa

1. n8n workflow'unu tamamen silip yeniden oluşturun
2. `N8N_DEBUG.md` dosyasındaki detaylı debug adımlarını takip edin
3. n8n console loglarını kontrol edin
4. Next.js server console loglarını kontrol edin (📤 ve 📥 işaretli loglar)
