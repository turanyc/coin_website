module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/pg [external] (pg, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("pg");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/my-crypto-tracker/src/pages/api/coins.ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

// pages/api/coins.ts
__turbopack_context__.s([
    "default",
    ()=>handler
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
// 🚨 Bağlantı bilgileriniz
const pool = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["Pool"]({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432')
});
async function handler(req, res) {
    try {
        // Piyasa Değerine göre sıralanmış ilk 100 coin'i çek (duplicate önlemek için)
        const result = await pool.query(`SELECT 
        id, name, symbol, current_price, price_change_percentage_24h, 
        market_cap, total_volume, image 
      FROM (
        SELECT 
          id, name, symbol, current_price, price_change_percentage_24h, 
          market_cap, total_volume, image,
          ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(id)) ORDER BY market_cap DESC, last_updated DESC NULLS LAST) as rn
        FROM coins
      ) AS ranked_coins
      WHERE rn = 1
      ORDER BY market_cap DESC 
      LIMIT 100`);
        // Veriyi parse et ve hazırla
        const parsedRows = result.rows.map((row)=>({
                ...row,
                image: row.image || null,
                current_price: parseFloat(row.current_price) || 0,
                price_change_percentage_24h: parseFloat(row.price_change_percentage_24h) || 0,
                market_cap: parseFloat(row.market_cap) || 0,
                total_volume: parseFloat(row.total_volume) || 0
            }));
        // Duplicate'leri filtrele - önce ID bazlı, sonra symbol bazlı
        const seenIds = new Map();
        // İlk adım: ID bazlı duplicate'leri filtrele
        parsedRows.forEach((row)=>{
            const normalizedId = row.id.toLowerCase().trim();
            if (!seenIds.has(normalizedId)) {
                seenIds.set(normalizedId, row);
            } else {
                const existing = seenIds.get(normalizedId);
                if (row.market_cap > existing.market_cap) {
                    seenIds.set(normalizedId, row);
                }
            }
        });
        // İkinci adım: Symbol bazlı duplicate'leri filtrele (BTC için Bitcoin gibi)
        const seenSymbols = new Map();
        Array.from(seenIds.values()).forEach((row)=>{
            const normalizedSymbol = row.symbol.toLowerCase().trim();
            if (!seenSymbols.has(normalizedSymbol)) {
                seenSymbols.set(normalizedSymbol, row);
            } else {
                const existing = seenSymbols.get(normalizedSymbol);
                if (row.market_cap > existing.market_cap) {
                    seenSymbols.set(normalizedSymbol, row);
                }
            }
        });
        const uniqueRows = Array.from(seenSymbols.values()).sort((a, b)=>b.market_cap - a.market_cap);
        // Veriyi JSON olarak döndür
        res.status(200).json(uniqueRows);
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({
            error: 'Veritabanından veri çekilemedi.'
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__aaa2e647._.js.map