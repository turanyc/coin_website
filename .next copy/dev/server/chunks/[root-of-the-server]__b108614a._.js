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
"[project]/my-crypto-tracker/src/pages/api/coins/[coinId].ts [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

// pages/api/coins/[coinId].ts
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
const pool = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$29$__["Pool"]({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT || '5432')
});
async function handler(req, res) {
    const { coinId } = req.query;
    if (!coinId || typeof coinId !== 'string') {
        return res.status(400).json({
            error: 'Coin ID gerekli'
        });
    }
    try {
        // Veritabanından coin detaylarını çek
        const result = await pool.query(`SELECT 
        id, name, symbol, current_price, price_change_percentage_24h, 
        market_cap, total_volume, image, last_updated
      FROM coins
      WHERE LOWER(TRIM(id)) = LOWER(TRIM($1))
      ORDER BY last_updated DESC NULLS LAST, market_cap DESC
      LIMIT 1`, [
            coinId
        ]);
        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Coin bulunamadı'
            });
        }
        const row = result.rows[0];
        // Veriyi parse et ve hazırla
        const coinData = {
            id: row.id,
            name: row.name,
            symbol: row.symbol,
            current_price: parseFloat(row.current_price) || 0,
            price_change_percentage_24h: parseFloat(row.price_change_percentage_24h) || 0,
            market_cap: parseFloat(row.market_cap) || 0,
            total_volume: parseFloat(row.total_volume) || 0,
            image: row.image || null,
            last_updated: row.last_updated
        };
        res.status(200).json(coinData);
    } catch (error) {
        console.error('Coin Detail API Error:', error);
        res.status(500).json({
            error: 'Veritabanından veri çekilemedi.'
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__b108614a._.js.map