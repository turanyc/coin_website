module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/my-crypto-tracker/src/pages/api/fear-greed.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>handler
]);
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika
let cache = null;
async function handler(req, res) {
    // Cache kontrolü
    if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
        return res.status(200).json(cache.data);
    }
    try {
        // Alternative.me Fear & Greed Index API'den veri çek
        const controller = new AbortController();
        const timeoutId = setTimeout(()=>controller.abort(), 10000);
        const response = await fetch('https://api.alternative.me/fng/', {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            console.error(`Fear & Greed API hatası: ${response.status}`);
            // Cache'den eski veri varsa onu döndür
            if (cache) {
                return res.status(200).json({
                    ...cache.data,
                    warning: 'API hatası, önbellekten veri gösteriliyor'
                });
            }
            return res.status(200).json({
                value: 50,
                classification: 'Neutral',
                error: `API hatası: ${response.status}`
            });
        }
        const data = await response.json();
        if (!data || !data.data || !Array.isArray(data.data) || data.data.length === 0) {
            console.error('Geçersiz Fear & Greed API yanıtı:', data);
            if (cache) {
                return res.status(200).json({
                    ...cache.data,
                    warning: 'Geçersiz API yanıtı, önbellekten veri gösteriliyor'
                });
            }
            return res.status(200).json({
                value: 50,
                classification: 'Neutral',
                error: 'Geçersiz API yanıtı'
            });
        }
        const latestData = data.data[0];
        const value = parseInt(latestData.value, 10);
        const classification = latestData.value_classification;
        const result = {
            value: isNaN(value) ? 50 : value,
            classification: classification || 'Neutral',
            timestamp: latestData.timestamp
        };
        // Cache'e kaydet
        cache = {
            data: result,
            timestamp: Date.now()
        };
        res.status(200).json(result);
    } catch (error) {
        console.error('Fear & Greed API Error:', error);
        // Cache'den eski veri varsa onu döndür
        if (cache) {
            return res.status(200).json({
                ...cache.data,
                warning: 'API hatası, önbellekten veri gösteriliyor'
            });
        }
        res.status(200).json({
            value: 50,
            classification: 'Neutral',
            error: 'API\'den veri çekilemedi.',
            details: error instanceof Error ? error.message : 'Bilinmeyen hata'
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a95f1c50._.js.map