import React, { useState, useEffect } from 'react';

interface DijitalMarketAIProps {
  isOpen: boolean;
  onClose: () => void;
  question: string | null;
}

interface AnswerData {
  question: string;
  answer: string;
  sources?: string;
  generatedTime?: string;
}

const questionAnswers: Record<string, AnswerData> = {
  'Hangi broker kripto ETF işlemlerini yeniden açtı?': {
    question: 'Hangi broker kripto ETF işlemlerini yeniden açtı?',
    answer: `Araştırma süresi: 12s

Son dönemde birçok broker, kripto ETF işlemlerini yeniden açma kararı aldı. Öne çıkan brokerlar şunlar:

**1. Interactive Brokers**
- Bitcoin ve Ethereum ETF'lerini yeniden listeledi
- Müşterilerine spot Bitcoin ETF'lerine erişim sağladı
- Özellikle BlackRock'un IBIT ve Fidelity'in FBTC ürünlerini destekliyor

**2. Charles Schwab**
- Kripto ETF'lerini platformuna geri ekledi
- Müşterilerine geniş bir ETF seçeneği sunuyor
- Düşük komisyon oranları ile dikkat çekiyor

**3. E*TRADE (Morgan Stanley)**
- Bitcoin ETF'lerini yeniden aktif hale getirdi
- Kurumsal müşteriler için özel çözümler sunuyor

**4. TD Ameritrade**
- Schwab ile birleşme sonrası kripto ETF'lere erişim genişletildi
- Hem bireysel hem kurumsal müşteriler için hizmet veriyor

**5. Robinhood**
- Kripto ETF'lerini platformuna ekledi
- Komisyonsuz işlem imkanı sunuyor
- Özellikle genç yatırımcılar arasında popüler

**Önemli Notlar:**
- SEC onaylı spot Bitcoin ETF'leri artık birçok broker tarafından destekleniyor
- Ethereum ETF'leri de yakında benzer bir yol izleyebilir
- Yatırımcılar artık daha kolay bir şekilde kripto varlıklarına erişebiliyor

**Son Güncelleme:** 5 dakika önce`,
    sources: 'X >100 kaynak >',
    generatedTime: '5 dakika önce oluşturuldu'
  },
  'Piyasa neden bugün yükseliyor?': {
    question: 'Piyasa neden bugün yükseliyor?',
    answer: `Araştırma süresi: 15s

Bugün kripto piyasasında görülen yükselişin birkaç önemli nedeni var:

**1. Kurumsal Yatırım Akışları**
- Büyük kurumsal yatırımcılar Bitcoin ETF'lerine önemli miktarda para akışı sağladı
- BlackRock, Fidelity ve diğer büyük fonlar günlük alımlarını artırdı
- Toplam ETF akışları pozitif seyrediyor

**2. Makroekonomik Faktörler**
- Fed'in faiz oranı beklentileri yumuşadı
- Enflasyon verileri beklentilerin altında geldi
- Dolar endeksi zayıfladı, bu da risk varlıkları için olumlu

**3. Teknik Faktörler**
- Bitcoin önemli destek seviyelerini korudu
- Alım baskısı artış gösterdi
- Kısa vadeli teknik göstergeler olumlu sinyal veriyor

**4. Haber Akışı**
- Olumlu regülasyon haberleri
- Kurumsal benimseme haberleri
- Yeni ürün lansmanları

**5. Piyasa Psikolojisi**
- Fear & Greed Index'te iyileşme
- Yatırımcı sentiment'i pozitif
- Alım fırsatı algısı

**Önemli Uyarı:** Piyasa koşulları hızla değişebilir. Yatırım kararlarınızı kendi araştırmanıza dayandırın.

**Son Güncelleme:** 3 dakika önce`,
    sources: 'X >100 kaynak >',
    generatedTime: '3 dakika önce oluşturuldu'
  },
  'Altcoinler Bitcoin\'i geçiyor mu?': {
    question: 'Altcoinler Bitcoin\'i geçiyor mu?',
    answer: `Araştırma süresi: 18s

Altcoin sezonu analizi ve Bitcoin karşılaştırması:

**Mevcut Durum:**
- Altcoin Sezonu Endeksi: 25/100 (Bitcoin hakimiyeti devam ediyor)
- Bitcoin Dominance: %52.3 (yüksek seviyelerde)
- ETH/BTC oranı: 0.062 (düşük seviyede)

**Altcoin Performansı:**
- Ethereum (ETH): Bitcoin'e göre %-5.2 geride
- Solana (SOL): Bitcoin'e göre %+3.1 önde
- XRP: Bitcoin'e göre %-2.8 geride
- Cardano (ADA): Bitcoin'e göre %-4.1 geride

**Bitcoin Hakimiyeti:**
- Bitcoin piyasa değeri: $1.2T
- Toplam altcoin piyasa değeri: $1.1T
- Bitcoin hala lider konumda

**Altcoin Sezonu İşaretleri:**
- Altcoin Sezonu Endeksi 75'in üzerine çıktığında altcoin sezonu başlar
- Şu anda endeks 25 seviyesinde, Bitcoin hakimiyeti sürüyor
- ETH/BTC oranının yükselmesi altcoin sezonunun başlangıcı olabilir

**Tarihsel Perspektif:**
- 2017 altcoin sezonunda endeks 90'a çıkmıştı
- 2021 altcoin sezonunda endeks 85 seviyesine ulaşmıştı
- Şu anki durum henüz altcoin sezonu göstergesi değil

**Sonuç:** Şu anda altcoinler Bitcoin'i geçmiyor. Bitcoin hakimiyeti devam ediyor, ancak bazı altcoinler (özellikle SOL) göreceli olarak daha iyi performans gösteriyor.

**Son Güncelleme:** 7 dakika önce`,
    sources: 'X >100 kaynak >',
    generatedTime: '7 dakika önce oluşturuldu'
  },
  'Trend olan anlatılar nelerdir?': {
    question: 'Trend olan anlatılar nelerdir?',
    answer: `Araştırma süresi: 20s

Şu anda kripto piyasasında öne çıkan ana anlatılar:

**1. Binance Ekosistemi**
- Piyasa Değeri: $2.98T
- 30 Günlük Değişim: +0.23%
- Sosyal Anahtar Kelimeler: BNB, Binance, staking, whales
- Haberler: Binance $500M ETH stake etti
- Öne Çıkan Coinler: BTC, ETH, USDT

**2. 2017/18 Altcoin Sezonu Anlatısı**
- Piyasa Değeri: $1.97T
- 30 Günlük Değişim: +0.83%
- Sosyal Anahtar Kelimeler: BTC, ETH, SOL, XRP, DeFi
- Haberler: Altcoin sezonu döngüleri hakkında tartışmalar
- Altcoin Sezonu Endeksi: 17 (düşük)
- Öne Çıkan Coinler: BTC, XRP, TRX

**3. ABD Stratejik Kripto Rezervi**
- Piyasa Değeri: $2.32T
- 30 Günlük Değişim: +1.23%
- Haberler: ABD Bitcoin rezervi düşünüyor
- Öne Çıkan Coinler: BTC, ETH, XRP

**4. Ethereum 2.0 ve Staking**
- ETH staking oranları artıyor
- Validator sayısı rekor seviyelerde
- Staking getirileri yatırımcıları çekiyor

**5. DeFi Yeniden Canlanması**
- TVL (Total Value Locked) artışı
- Yeni DeFi protokolleri
- Yield farming fırsatları

**6. Layer 2 Çözümler**
- Arbitrum, Optimism, Polygon aktivitesi
- Düşük işlem ücretleri
- Ölçeklenebilirlik vurgusu

**7. RWA (Real World Assets) Tokenizasyonu**
- Geleneksel varlıkların tokenizasyonu
- Yeni yatırım fırsatları
- Regülasyon ilerlemeleri

**Son Güncelleme:** 4 dakika önce`,
    sources: 'X >100 kaynak >',
    generatedTime: '4 dakika önce oluşturuldu'
  },
  'Hangi kriptolar yükseliş momentumu gösteriyor?': {
    question: 'Hangi kriptolar yükseliş momentumu gösteriyor?',
    answer: `Araştırma süresi: 14s

Yükseliş momentumu gösteren kripto paralar:

**1. Bitcoin (BTC)**
- 24s Değişim: +3.2%
- 7 Günlük Değişim: +8.5%
- RSI: 58 (sağlıklı seviye)
- Momentum: Güçlü
- ETF akışları pozitif

**2. Ethereum (ETH)**
- 24s Değişim: +2.8%
- 7 Günlük Değişim: +7.2%
- RSI: 55
- Momentum: Orta-Güçlü
- Staking aktivitesi yüksek

**3. Solana (SOL)**
- 24s Değişim: +5.1%
- 7 Günlük Değişim: +12.3%
- RSI: 62
- Momentum: Çok Güçlü
- Ekosistem büyümesi devam ediyor

**4. XRP**
- 24s Değişim: +1.9%
- 7 Günlük Değişim: +6.8%
- RSI: 52
- Momentum: Orta
- Regülasyon belirsizliği azaldı

**5. Cardano (ADA)**
- 24s Değişim: +2.3%
- 7 Günlük Değişim: +5.4%
- RSI: 48
- Momentum: Orta
- Geliştirme aktivitesi yüksek

**6. Polygon (MATIC)**
- 24s Değişim: +4.2%
- 7 Günlük Değişim: +9.1%
- RSI: 59
- Momentum: Güçlü
- Layer 2 çözümler popüler

**7. Chainlink (LINK)**
- 24s Değişim: +3.5%
- 7 Günlük Değişim: +7.8%
- RSI: 56
- Momentum: Güçlü
- Oracle kullanımı artıyor

**Teknik Göstergeler:**
- Çoğu coin RSI 50'nin üzerinde
- Hacim artışı görülüyor
- Alım baskısı mevcut

**Uyarı:** Momentum göstergeleri hızla değişebilir. Yatırım yapmadan önce kendi araştırmanızı yapın.

**Son Güncelleme:** 6 dakika önce`,
    sources: 'X >100 kaynak >',
    generatedTime: '6 dakika önce oluşturuldu'
  },
  'Yaklaşan hangi olaylar kriptoyu etkileyebilir?': {
    question: 'Yaklaşan hangi olaylar kriptoyu etkileyebilir?',
    answer: `Araştırma süresi: 22s

Yakın gelecekte kripto piyasasını etkileyebilecek önemli olaylar:

**1. Fed Faiz Kararları**
- Tarih: Önümüzdeki FOMC toplantıları
- Etki: Yüksek (makroekonomik faktörler)
- Beklenti: Faiz oranı değişiklikleri piyasayı etkileyebilir
- Bitcoin ve altcoinler genellikle faiz kararlarına duyarlı

**2. Ethereum ETF Onayı**
- Tarih: Yakında bekleniyor
- Etki: Çok Yüksek
- Beklenti: Ethereum ETF onayı büyük yatırım akışı getirebilir
- Benzer Bitcoin ETF etkisi bekleniyor

**3. Bitcoin Halving**
- Tarih: Nisan 2024 (yaklaşıyor)
- Etki: Yüksek
- Beklenti: Tarihsel olarak halving sonrası fiyat artışları görülmüş
- Arz azalması teorik olarak fiyatı yukarı itebilir

**4. Regülasyon Gelişmeleri**
- ABD: SEC ve CFTC düzenlemeleri
- AB: MiCA düzenlemeleri uygulanmaya başlıyor
- Etki: Orta-Yüksek
- Net regülasyonlar piyasa belirsizliğini azaltabilir

**5. Kurumsal Benimseme**
- Büyük şirketlerin Bitcoin alımları
- Kurumsal hazine stratejileri
- Etki: Yüksek
- Örnekler: MicroStrategy, Tesla, Square

**6. Teknoloji Güncellemeleri**
- Ethereum 2.0 gelişmeleri
- Layer 2 çözümler
- Yeni blockchain lansmanları
- Etki: Orta

**7. Makroekonomik Veriler**
- Enflasyon verileri
- İstihdam raporları
- GDP büyümesi
- Etki: Orta-Yüksek

**8. Geopolitik Olaylar**
- Savaşlar ve çatışmalar
- Ekonomik yaptırımlar
- Etki: Değişken

**Önemli Tarihler:**
- Önümüzdeki hafta: Fed toplantısı
- Önümüzdeki ay: Ethereum ETF kararı bekleniyor
- Nisan 2024: Bitcoin Halving

**Son Güncelleme:** 8 dakika önce`,
    sources: 'X >100 kaynak >',
    generatedTime: '8 dakika önce oluşturuldu'
  }
};

const peopleAlsoAsk = [
  { icon: '🔥', question: 'Hangi broker kripto ETF işlemlerini yeniden açtı?' },
  { icon: '📈', question: 'Piyasa neden bugün yükseliyor?' },
  { icon: '🏗️', question: 'Hangi kriptolar yükseliş momentumu gösteriyor?' },
  { icon: '⏰', question: 'Yaklaşan hangi olaylar kriptoyu etkileyebilir?' },
  { icon: '📊', question: 'Piyasa hissiyatı nedir?' },
  { icon: '💬', question: 'KOL\'ler ne tartışıyor?' }
];

// Eksik sorular için cevaplar
const additionalAnswers: Record<string, AnswerData> = {
  'Piyasa hissiyatı nedir?': {
    question: 'Piyasa hissiyatı nedir?',
    answer: `Araştırma süresi: 10s

**Mevcut Piyasa Hissiyatı:**

**Fear & Greed Index: 38 (Korku)**
- Piyasa şu anda korku bölgesinde
- Yatırımcılar temkinli davranıyor
- Alım fırsatları görülebilir

**Genel Sentiment:**
- **Bullish (Yükseliş):** %35
- **Bearish (Düşüş):** %45
- **Neutral (Nötr):** %20

**Sosyal Medya Sentiment:**
- Twitter/X: Genel olarak nötr-olumlu
- Reddit: Temkinli ama umutlu
- Telegram: Aktif tartışmalar devam ediyor

**Kurumsal Yatırımcı Sentiment:**
- ETF akışları: Pozitif
- Kurumsal alımlar: Devam ediyor
- Hazine stratejileri: Bitcoin'e ilgi yüksek

**Teknik Analiz Sentiment:**
- RSI: 47.48 (Nötr bölge)
- Trend: Yatay hareket
- Destek seviyeleri: Güçlü

**Sonuç:** Piyasa genel olarak temkinli bir sentiment içinde. Korku endeksi yüksek ama kurumsal yatırımcılar pozitif kalıyor.

**Son Güncelleme:** 2 dakika önce`,
    sources: 'X >100 kaynak >',
    generatedTime: '2 dakika önce oluşturuldu'
  },
  'KOL\'ler ne tartışıyor?': {
    question: 'KOL\'ler ne tartışıyor?',
    answer: `Araştırma süresi: 16s

**Kripto Influencer'lar ve Uzmanların Güncel Tartışmaları:**

**1. Bitcoin ETF Akışları**
- @CryptoWhale: "Bitcoin ETF'lerine günlük $500M+ akış devam ediyor. Kurumsal benimseme hızlanıyor."
- @BitcoinMaxi: "ETF akışları Bitcoin fiyatını destekliyor. Uzun vadeli bakış açısı olumlu."

**2. Ethereum ve Layer 2 Çözümler**
- @EthereumDev: "Layer 2 çözümler Ethereum'un ölçeklenebilirliğini artırıyor. Arbitrum ve Optimism öne çıkıyor."
- @DeFiExpert: "DeFi protokolleri yeniden canlanıyor. TVL artışı umut verici."

**3. Altcoin Sezonu**
- @AltcoinGuru: "Altcoin Sezonu Endeksi düşük ama bazı altcoinler göreceli olarak güçlü. SOL öne çıkıyor."
- @CryptoAnalyst: "Bitcoin dominance yüksek. Altcoin sezonu için daha fazla sabır gerekiyor."

**4. Regülasyon Gelişmeleri**
- @CryptoLawyer: "ABD'de net regülasyonlar geliyor. Bu piyasa için olumlu olabilir."
- @RegulationWatch: "MiCA düzenlemeleri Avrupa'da uygulanmaya başlıyor. Uyum süreci önemli."

**5. Makroekonomik Faktörler**
- @MacroCrypto: "Fed faiz kararları kripto piyasasını etkilemeye devam ediyor. Enflasyon verileri takip edilmeli."
- @EconomicCrypto: "Dolar endeksi zayıflıyor. Bu risk varlıkları için olumlu."

**6. Teknoloji ve İnovasyon**
- @BlockchainTech: "Yeni blockchain protokolleri geliştiriliyor. Ölçeklenebilirlik odak noktası."
- @Web3Builder: "Web3 ekosistemi büyümeye devam ediyor. NFT ve Metaverse projeleri aktif."

**Öne Çıkan Tartışma Konuları:**
- Bitcoin Halving etkisi
- Ethereum 2.0 gelişmeleri
- DeFi yeniden canlanması
- RWA (Real World Assets) tokenizasyonu
- Layer 2 çözümlerin geleceği

**Son Güncelleme:** 4 dakika önce`,
    sources: 'X >100 kaynak >',
    generatedTime: '4 dakika önce oluşturuldu'
  }
};

// Tüm cevapları birleştir
const allAnswers: Record<string, AnswerData> = { ...questionAnswers, ...additionalAnswers };

const DijitalMarketAI: React.FC<DijitalMarketAIProps> = ({ isOpen, onClose, question }) => {
  const [currentAnswer, setCurrentAnswer] = useState<AnswerData | null>(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (question && allAnswers[question]) {
      setCurrentAnswer(allAnswers[question]);
    } else {
      setCurrentAnswer(null);
    }
  }, [question]);

  const handleQuestionClick = (selectedQuestion: string) => {
    if (allAnswers[selectedQuestion]) {
      setCurrentAnswer(allAnswers[selectedQuestion]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Eğer soru cevaplar arasında varsa göster
      if (allAnswers[inputValue.trim()]) {
        setCurrentAnswer(allAnswers[inputValue.trim()]);
      } else {
        // Varsayılan bir cevap göster
        setCurrentAnswer({
          question: inputValue.trim(),
          answer: 'Bu soru için henüz bir cevap hazırlanmamış. Lütfen önerilen sorulardan birini seçin veya farklı bir soru deneyin.',
          sources: 'X >100 kaynak >',
          generatedTime: 'Az önce oluşturuldu'
        });
      }
      setInputValue('');
    }
  };

  // Mobil için overlay ve fixed panel
  if (typeof window !== 'undefined' && window.innerWidth < 1024) {
    if (!isOpen) return null;
    return (
      <>
        {/* Overlay - Sadece mobilde */}
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
        
        {/* AI Panel - Mobil */}
        <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Dijital Marketim AI</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {currentAnswer && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{currentAnswer.question}</p>
                  <button
                    onClick={() => setCurrentAnswer(null)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {currentAnswer ? (
              <div className="p-4 space-y-4">
                <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {currentAnswer.answer}
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Dijital Marketim AI hata yapabilir, lütfen DYOR. Finansal tavsiye değildir.
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{currentAnswer.sources || 'X >100 kaynak >'}</span>
                  <span>{currentAnswer.generatedTime || 'Az önce oluşturuldu'}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">Bir soru seçin veya sorunuzu yazın</p>
              </div>
            )}
            {currentAnswer && (
              <div className="p-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">İnsanlar Ayrıca Soruyor</h3>
                <div className="space-y-2">
                  {peopleAlsoAsk.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuestionClick(item.question)}
                      className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-sm text-gray-700 flex-1">{item.question}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex items-center gap-2">
                <button type="button" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Dijital Marketim AI'ye sor"
                  className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button type="submit" className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Pro • 0 soru kaldı</span>
              </div>
            </form>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Dijital Marketim AI erken erişim aşamasındadır. Lütfen DYOR.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Desktop için normal flow - yan yana layout için
  if (!isOpen) return null;

  return (
    <div className="w-[420px] bg-white border-l border-gray-200 flex flex-col h-screen sticky top-0 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900">Dijital Marketim AI</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
      </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Current Question */}
          {currentAnswer && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{currentAnswer.question}</p>
                <button
                  onClick={() => setCurrentAnswer(null)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Answer Content */}
          {currentAnswer ? (
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                {currentAnswer.answer}
              </div>
              
              {/* Disclaimer */}
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Dijital Marketim AI hata yapabilir, lütfen DYOR. Finansal tavsiye değildir.
                </p>
              </div>

              {/* Sources and Generated Time */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{currentAnswer.sources || 'X >100 kaynak >'}</span>
                <span>{currentAnswer.generatedTime || 'Az önce oluşturuldu'}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 019.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p className="text-sm">Bir soru seçin veya sorunuzu yazın</p>
            </div>
          )}

          {/* People Also Ask */}
          {currentAnswer && (
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">İnsanlar Ayrıca Soruyor</h3>
              <div className="space-y-2">
                {peopleAlsoAsk.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(item.question)}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm text-gray-700 flex-1">{item.question}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Section */}
        <div className="p-4 border-t border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Dijital Marketim AI'ye sor"
                className="flex-1 bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Pro • 0 soru kaldı</span>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Dijital Marketim AI erken erişim aşamasındadır. Lütfen DYOR.
          </p>
        </div>
    </div>
  );
};

export default DijitalMarketAI;
