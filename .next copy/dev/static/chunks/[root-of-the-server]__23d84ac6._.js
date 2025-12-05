(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/my-crypto-tracker/src/contexts/LanguageContext.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LanguageProvider",
    ()=>LanguageProvider,
    "useLanguage",
    ()=>useLanguage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/compiler-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
const LanguageContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const translations = {
    tr: {
        // Navbar
        'nav.crypto': 'Kripto Paralar',
        'nav.exchanges': 'Borsalar',
        'nav.learn': 'Öğren',
        'nav.products': 'Ürünler',
        'nav.watchlist': 'İzleme Listesi',
        'nav.portfolio': 'Portföy',
        'nav.login': 'Giriş yapmak',
        'nav.signup': 'Üye olmak',
        // Market Stats
        'stats.marketCap': 'Piyasa Değeri',
        'stats.volume24h': '24sa Hacim',
        'stats.activeCoins': 'Aktif Coin',
        'stats.btcDominance': 'BTC Hakimiyeti',
        'stats.ethDominance': 'ETH Hakimiyeti',
        'stats.gasPrice': 'Gas Fiyatı',
        // Common
        'common.welcome': 'Hoş geldin',
        'common.logout': 'Çıkış Yap',
        'common.login': 'Giriş Yap',
        'common.register': 'Kayıt Ol',
        'common.market': 'Piyasa',
        'common.exchanges': 'Borsalar',
        'common.news': 'Haberler',
        'common.language': 'Dil Seçimi',
        'common.settings': 'Ayarlar',
        'common.searchPlaceholder': 'Ara...'
    },
    en: {
        'nav.crypto': 'Cryptocurrencies',
        'nav.exchanges': 'Exchanges',
        'nav.learn': 'Learn',
        'nav.products': 'Products',
        'nav.watchlist': 'Watchlist',
        'nav.portfolio': 'Portfolio',
        'nav.login': 'Login',
        'nav.signup': 'Sign Up',
        'stats.marketCap': 'Market Cap',
        'stats.volume24h': '24h Volume',
        'stats.activeCoins': 'Active Coins',
        'stats.btcDominance': 'BTC Dominance',
        'stats.ethDominance': 'ETH Dominance',
        'stats.gasPrice': 'Gas Price',
        // Common
        'common.welcome': 'Welcome',
        'common.logout': 'Logout',
        'common.login': 'Login',
        'common.register': 'Register',
        'common.market': 'Market',
        'common.exchanges': 'Exchanges',
        'common.news': 'News',
        'common.language': 'Language',
        'common.settings': 'Settings',
        'common.searchPlaceholder': 'Search...'
    },
    es: {
        'nav.crypto': 'Criptomonedas',
        'nav.exchanges': 'Intercambios',
        'nav.learn': 'Aprender',
        'nav.products': 'Productos',
        'nav.watchlist': 'Lista de seguimiento',
        'nav.portfolio': 'Cartera',
        'nav.login': 'Iniciar sesión',
        'nav.signup': 'Registrarse',
        'stats.marketCap': 'Capitalización de mercado',
        'stats.volume24h': 'Volumen 24h',
        'stats.activeCoins': 'Monedas activas',
        'stats.btcDominance': 'Dominancia BTC',
        'stats.ethDominance': 'Dominancia ETH',
        'stats.gasPrice': 'Precio del gas',
        // Common
        'common.welcome': 'Bienvenido',
        'common.logout': 'Cerrar sesión',
        'common.login': 'Acceso',
        'common.register': 'Registro',
        'common.market': 'Mercado',
        'common.exchanges': 'Intercambios',
        'common.news': 'Noticias',
        'common.language': 'Idioma',
        'common.settings': 'Ajustes',
        'common.searchPlaceholder': 'Buscar...'
    },
    zh: {
        'nav.crypto': '加密货币',
        'nav.exchanges': '交易所',
        'nav.learn': '学习',
        'nav.products': '产品',
        'nav.watchlist': '观察列表',
        'nav.portfolio': '投资组合',
        'nav.login': '登录',
        'nav.signup': '注册',
        'stats.marketCap': '市值',
        'stats.volume24h': '24小时交易量',
        'stats.activeCoins': '活跃币种',
        'stats.btcDominance': 'BTC主导地位',
        'stats.ethDominance': 'ETH主导地位',
        'stats.gasPrice': 'Gas价格',
        // Common
        'common.welcome': '欢迎',
        'common.logout': '登出',
        'common.login': '登录',
        'common.register': '注册',
        'common.market': '市场',
        'common.exchanges': '交易所',
        'common.news': '新闻',
        'common.language': '语言',
        'common.settings': '设置',
        'common.searchPlaceholder': '搜索...'
    },
    ar: {
        'nav.crypto': 'العملات المشفرة',
        'nav.exchanges': 'التبادلات',
        'nav.learn': 'تعلم',
        'nav.products': 'المنتجات',
        'nav.watchlist': 'قائمة المراقبة',
        'nav.portfolio': 'المحفظة',
        'nav.login': 'تسجيل الدخول',
        'nav.signup': 'التسجيل',
        'stats.marketCap': 'القيمة السوقية',
        'stats.volume24h': 'حجم 24 ساعة',
        'stats.activeCoins': 'العملات النشطة',
        'stats.btcDominance': 'هيمنة BTC',
        'stats.ethDominance': 'هيمنة ETH',
        'stats.gasPrice': 'سعر الغاز',
        // Common
        'common.welcome': 'مرحبا',
        'common.logout': 'تسجيل الخروج',
        'common.login': 'تسجيل الدخول',
        'common.register': 'التسجيل',
        'common.market': 'السوق',
        'common.exchanges': 'التبادلات',
        'common.news': 'الأخبار',
        'common.language': 'اللغة',
        'common.settings': 'الإعدادات',
        'common.searchPlaceholder': 'بحث...'
    },
    fr: {
        'nav.crypto': 'Cryptomonnaies',
        'nav.exchanges': 'Échanges',
        'nav.learn': 'Apprendre',
        'nav.products': 'Produits',
        'nav.watchlist': 'Liste de surveillance',
        'nav.portfolio': 'Portefeuille',
        'nav.login': 'Se connecter',
        'nav.signup': 'S\'inscrire',
        'stats.marketCap': 'Capitalisation boursière',
        'stats.volume24h': 'Volume 24h',
        'stats.activeCoins': 'Pièces actives',
        'stats.btcDominance': 'Dominance BTC',
        'stats.ethDominance': 'Dominance ETH',
        'stats.gasPrice': 'Prix du gaz',
        // Common
        'common.welcome': 'Bienvenue',
        'common.logout': 'Déconnexion',
        'common.login': 'Connexion',
        'common.register': 'S\'inscrire',
        'common.market': 'Marché',
        'common.exchanges': 'Échanges',
        'common.news': 'Actualités',
        'common.language': 'Langue',
        'common.settings': 'Paramètres',
        'common.searchPlaceholder': 'Rechercher...'
    },
    de: {
        'nav.crypto': 'Kryptowährungen',
        'nav.exchanges': 'Börsen',
        'nav.learn': 'Lernen',
        'nav.products': 'Produkte',
        'nav.watchlist': 'Beobachtungsliste',
        'nav.portfolio': 'Portfolio',
        'nav.login': 'Anmelden',
        'nav.signup': 'Registrieren',
        'stats.marketCap': 'Marktkapitalisierung',
        'stats.volume24h': '24h Volumen',
        'stats.activeCoins': 'Aktive Münzen',
        'stats.btcDominance': 'BTC Dominanz',
        'stats.ethDominance': 'ETH Dominanz',
        'stats.gasPrice': 'Gaspreis',
        // Common
        'common.welcome': 'Willkommen',
        'common.logout': 'Abmelden',
        'common.login': 'Anmelden',
        'common.register': 'Registrieren',
        'common.market': 'Markt',
        'common.exchanges': 'Börsen',
        'common.news': 'Nachrichten',
        'common.language': 'Sprache',
        'common.settings': 'Einstellungen',
        'common.searchPlaceholder': 'Suchen...'
    },
    ja: {
        'nav.crypto': '暗号通貨',
        'nav.exchanges': '取引所',
        'nav.learn': '学ぶ',
        'nav.products': '製品',
        'nav.watchlist': 'ウォッチリスト',
        'nav.portfolio': 'ポートフォリオ',
        'nav.login': 'ログイン',
        'nav.signup': '登録',
        'stats.marketCap': '時価総額',
        'stats.volume24h': '24時間取引量',
        'stats.activeCoins': 'アクティブコイン',
        'stats.btcDominance': 'BTC優位性',
        'stats.ethDominance': 'ETH優位性',
        'stats.gasPrice': 'ガス価格',
        // Common
        'common.welcome': 'ようこそ',
        'common.logout': 'ログアウト',
        'common.login': 'ログイン',
        'common.register': '登録',
        'common.market': '市場',
        'common.exchanges': '取引所',
        'common.news': 'ニュース',
        'common.language': '言語',
        'common.settings': '設定',
        'common.searchPlaceholder': '検索...'
    },
    pt: {
        'nav.crypto': 'Criptomoedas',
        'nav.exchanges': 'Corretoras',
        'nav.learn': 'Aprender',
        'nav.products': 'Produtos',
        'nav.watchlist': 'Lista de observação',
        'nav.portfolio': 'Carteira',
        'nav.login': 'Entrar',
        'nav.signup': 'Cadastrar',
        'stats.marketCap': 'Capitalização de mercado',
        'stats.volume24h': 'Volume 24h',
        'stats.activeCoins': 'Moedas ativas',
        'stats.btcDominance': 'Dominância BTC',
        'stats.ethDominance': 'Dominância ETH',
        'stats.gasPrice': 'Preço do gás',
        // Common
        'common.welcome': 'Bem-vindo',
        'common.logout': 'Sair',
        'common.login': 'Entrar',
        'common.register': 'Registrar',
        'common.market': 'Mercado',
        'common.exchanges': 'Corretoras',
        'common.news': 'Notícias',
        'common.language': 'Idioma',
        'common.settings': 'Configurações',
        'common.searchPlaceholder': 'Pesquisar...'
    },
    ru: {
        'nav.crypto': 'Криптовалюты',
        'nav.exchanges': 'Биржи',
        'nav.learn': 'Узнать',
        'nav.products': 'Продукты',
        'nav.watchlist': 'Список наблюдения',
        'nav.portfolio': 'Портфель',
        'nav.login': 'Войти',
        'nav.signup': 'Зарегистрироваться',
        'stats.marketCap': 'Рыночная капитализация',
        'stats.volume24h': 'Объем за 24ч',
        'stats.activeCoins': 'Активные монеты',
        'stats.btcDominance': 'Доминирование BTC',
        'stats.ethDominance': 'Доминирование ETH',
        'stats.gasPrice': 'Цена газа',
        // Common
        'common.welcome': 'Добро пожаловать',
        'common.logout': 'Выйти',
        'common.login': 'Войти',
        'common.register': 'Регистрация',
        'common.market': 'Рынок',
        'common.exchanges': 'Биржи',
        'common.news': 'Новости',
        'common.language': 'Язык',
        'common.settings': 'Настройки',
        'common.searchPlaceholder': 'Поиск...'
    },
    hi: {
        'nav.crypto': 'क्रिप्टोकरेंसी',
        'nav.exchanges': 'एक्सचेंज',
        'nav.learn': 'सीखें',
        'nav.products': 'उत्पाद',
        'nav.watchlist': 'वॉचलिस्ट',
        'nav.portfolio': 'पोर्टफोलियो',
        'nav.login': 'लॉग इन करें',
        'nav.signup': 'साइन अप करें',
        'stats.marketCap': 'बाज़ार पूंजी',
        'stats.volume24h': '24घंटे आयतन',
        'stats.activeCoins': 'सक्रिय सिक्के',
        'stats.btcDominance': 'BTC प्रभुत्व',
        'stats.ethDominance': 'ETH प्रभुत्व',
        'stats.gasPrice': 'गैस मूल्य',
        // Common
        'common.welcome': 'स्वागत',
        'common.logout': 'लॉग आउट',
        'common.login': 'लॉग इन करें',
        'common.register': 'पंजीकरण',
        'common.market': 'बाज़ार',
        'common.exchanges': 'एक्सचेंज',
        'common.news': 'समाचार',
        'common.language': 'भाषा',
        'common.settings': 'सेटिंग्स',
        'common.searchPlaceholder': 'खोज...'
    }
};
const LanguageProvider = (t0)=>{
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["c"])(13);
    if ($[0] !== "c2af6e59a5e85cfb291bd824c281fa67ac9e0f9630e25391b7fc40b24914800f") {
        for(let $i = 0; $i < 13; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "c2af6e59a5e85cfb291bd824c281fa67ac9e0f9630e25391b7fc40b24914800f";
    }
    const { children } = t0;
    const [language, setLanguageState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(_temp);
    let t1;
    let t2;
    if ($[1] !== language) {
        t1 = ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                localStorage.setItem("selectedLanguage", language);
            }
        };
        t2 = [
            language
        ];
        $[1] = language;
        $[2] = t1;
        $[3] = t2;
    } else {
        t1 = $[2];
        t2 = $[3];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t1, t2);
    let t3;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = (lang)=>{
            setLanguageState(lang);
        };
        $[4] = t3;
    } else {
        t3 = $[4];
    }
    const setLanguage = t3;
    let t4;
    if ($[5] !== language) {
        t4 = (key)=>translations[language][key] || key;
        $[5] = language;
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    const t = t4;
    let t5;
    if ($[7] !== language || $[8] !== t) {
        t5 = {
            language,
            setLanguage,
            t
        };
        $[7] = language;
        $[8] = t;
        $[9] = t5;
    } else {
        t5 = $[9];
    }
    let t6;
    if ($[10] !== children || $[11] !== t5) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(LanguageContext.Provider, {
            value: t5,
            children: children
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/contexts/LanguageContext.tsx",
            lineNumber: 376,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[10] = children;
        $[11] = t5;
        $[12] = t6;
    } else {
        t6 = $[12];
    }
    return t6;
};
_s(LanguageProvider, "QMRQXfoVWrfXk+yQwm1j1C01r9g=");
_c = LanguageProvider;
const useLanguage = ()=>{
    _s1();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["c"])(1);
    if ($[0] !== "c2af6e59a5e85cfb291bd824c281fa67ac9e0f9630e25391b7fc40b24914800f") {
        for(let $i = 0; $i < 1; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "c2af6e59a5e85cfb291bd824c281fa67ac9e0f9630e25391b7fc40b24914800f";
    }
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useContext"])(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
_s1(useLanguage, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
function _temp() {
    if ("TURBOPACK compile-time truthy", 1) {
        const saved = localStorage.getItem("selectedLanguage");
        return saved || "tr";
    }
    //TURBOPACK unreachable
    ;
}
var _c;
__turbopack_context__.k.register(_c, "LanguageProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/my-crypto-tracker/src/components/SearchBar.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SearchBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/router.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
function SearchBar({ className = '' }) {
    _s();
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [coins, setCoins] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [filteredCoins, setFilteredCoins] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [showSuggestions, setShowSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const searchRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    // Coin listesini yükle
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchBar.useEffect": ()=>{
            const fetchCoins = {
                "SearchBar.useEffect.fetchCoins": async ()=>{
                    setLoading(true);
                    try {
                        const response = await fetch('/api/coins');
                        if (response.ok) {
                            const data = await response.json();
                            setCoins(data);
                        }
                    } catch (error) {
                        console.error('Coin listesi yüklenirken hata:', error);
                    } finally{
                        setLoading(false);
                    }
                }
            }["SearchBar.useEffect.fetchCoins"];
            fetchCoins();
        }
    }["SearchBar.useEffect"], []);
    // Arama sorgusuna göre coin'leri filtrele
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchBar.useEffect": ()=>{
            if (!searchQuery.trim()) {
                setFilteredCoins([]);
                setShowSuggestions(false);
                return;
            }
            const query = searchQuery.toLowerCase().trim();
            const filtered = coins.filter({
                "SearchBar.useEffect.filtered": (coin)=>coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query) || coin.id.toLowerCase().includes(query)
            }["SearchBar.useEffect.filtered"]).slice(0, 8); // En fazla 8 öneri göster
            setFilteredCoins(filtered);
            setShowSuggestions(filtered.length > 0);
        }
    }["SearchBar.useEffect"], [
        searchQuery,
        coins
    ]);
    // Dışarı tıklandığında önerileri kapat
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchBar.useEffect": ()=>{
            const handleClickOutside = {
                "SearchBar.useEffect.handleClickOutside": (event)=>{
                    if (searchRef.current && !searchRef.current.contains(event.target)) {
                        setShowSuggestions(false);
                    }
                }
            }["SearchBar.useEffect.handleClickOutside"];
            document.addEventListener('mousedown', handleClickOutside);
            return ({
                "SearchBar.useEffect": ()=>{
                    document.removeEventListener('mousedown', handleClickOutside);
                }
            })["SearchBar.useEffect"];
        }
    }["SearchBar.useEffect"], []);
    // Coin seçildiğinde
    const handleCoinSelect = (coinId)=>{
        setSearchQuery('');
        setShowSuggestions(false);
        router.push(`/currencies/${coinId}`);
    };
    // Enter tuşuna basıldığında ilk öneriyi seç
    const handleKeyDown = (e)=>{
        if (e.key === 'Enter' && filteredCoins.length > 0) {
            handleCoinSelect(filteredCoins[0].id);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setSearchQuery('');
        }
    };
    const formatPrice = (price)=>{
        if (price < 0.01) {
            return `$${price.toFixed(6)}`;
        } else if (price < 1) {
            return `$${price.toFixed(4)}`;
        } else {
            return `$${price.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: `relative ${className}`,
        ref: searchRef,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: searchQuery,
                        onChange: (e_0)=>setSearchQuery(e_0.target.value),
                        onFocus: ()=>{
                            if (filteredCoins.length > 0) {
                                setShowSuggestions(true);
                            }
                        },
                        onKeyDown: handleKeyDown,
                        placeholder: "Coin ara (örn: Bitcoin, BTC, ETH)...",
                        className: "pl-10 pr-4 py-2.5 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-72 bg-gray-50 border border-gray-200 transition-all"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                        lineNumber: 101,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                            lineNumber: 107,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                        lineNumber: 106,
                        columnNumber: 9
                    }, this),
                    searchQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>{
                            setSearchQuery('');
                            setShowSuggestions(false);
                        },
                        className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "w-4 h-4",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeWidth: 2,
                                d: "M6 18L18 6M6 6l12 12"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                lineNumber: 114,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                            lineNumber: 113,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                        lineNumber: 109,
                        columnNumber: 25
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            showSuggestions && filteredCoins.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-y-auto w-full min-w-[400px]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "py-2",
                    children: filteredCoins.map((coin_0)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>handleCoinSelect(coin_0.id),
                            className: "w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left group",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-shrink-0",
                                    children: coin_0.image ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                        src: coin_0.image,
                                        alt: coin_0.name,
                                        className: "w-8 h-8 rounded-full",
                                        onError: (e_1)=>{
                                            e_1.target.style.display = 'none';
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                        lineNumber: 125,
                                        columnNumber: 35
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs font-bold text-gray-400",
                                            children: coin_0.symbol.charAt(0).toUpperCase()
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                            lineNumber: 128,
                                            columnNumber: 23
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                        lineNumber: 127,
                                        columnNumber: 21
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                    lineNumber: 124,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1 min-w-0 overflow-hidden",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 flex-wrap",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate",
                                                title: coin_0.name,
                                                children: coin_0.name
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                                lineNumber: 137,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs text-gray-500 uppercase flex-shrink-0",
                                                children: coin_0.symbol
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                                lineNumber: 140,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                        lineNumber: 136,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                    lineNumber: 135,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-right flex-shrink-0 ml-2",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-sm font-medium text-gray-900 whitespace-nowrap",
                                        children: formatPrice(coin_0.current_price)
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                        lineNumber: 148,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                    lineNumber: 147,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-shrink-0",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M9 5l7 7-7 7"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                            lineNumber: 156,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                        lineNumber: 155,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                    lineNumber: 154,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, coin_0.id, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                            lineNumber: 122,
                            columnNumber: 42
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                    lineNumber: 121,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                lineNumber: 120,
                columnNumber: 55
            }, this),
            loading && searchQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4 w-full min-w-[400px]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-center gap-2 text-gray-500",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "animate-spin h-5 w-5",
                            xmlns: "http://www.w3.org/2000/svg",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    className: "opacity-25",
                                    cx: "12",
                                    cy: "12",
                                    r: "10",
                                    stroke: "currentColor",
                                    strokeWidth: "4"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                    lineNumber: 167,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    className: "opacity-75",
                                    fill: "currentColor",
                                    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                                    lineNumber: 168,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                            lineNumber: 166,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-sm",
                            children: "Yükleniyor..."
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                            lineNumber: 170,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                    lineNumber: 165,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                lineNumber: 164,
                columnNumber: 34
            }, this),
            searchQuery && !loading && filteredCoins.length === 0 && showSuggestions && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 p-4 w-full min-w-[400px]",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center text-gray-500 text-sm",
                    children: [
                        '"',
                        searchQuery,
                        '" için sonuç bulunamadı'
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                    lineNumber: 176,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
                lineNumber: 175,
                columnNumber: 84
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/my-crypto-tracker/src/components/SearchBar.tsx",
        lineNumber: 99,
        columnNumber: 10
    }, this);
}
_s(SearchBar, "NJh1Zt80zZjt3YcPL53VQk9p+qI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = SearchBar;
var _c;
__turbopack_context__.k.register(_c, "SearchBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/my-crypto-tracker/src/img/cripto_logo.png (static in ecmascript, tag client)", ((__turbopack_context__) => {

__turbopack_context__.v("/_next/static/media/cripto_logo.df1bb6c5.png");}),
"[project]/my-crypto-tracker/src/img/cripto_logo.png.mjs { IMAGE => \"[project]/my-crypto-tracker/src/img/cripto_logo.png (static in ecmascript, tag client)\" } [client] (structured image object with data url, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$img$2f$cripto_logo$2e$png__$28$static__in__ecmascript$2c$__tag__client$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/img/cripto_logo.png (static in ecmascript, tag client)");
;
const __TURBOPACK__default__export__ = {
    src: __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$img$2f$cripto_logo$2e$png__$28$static__in__ecmascript$2c$__tag__client$29$__["default"],
    width: 500,
    height: 100,
    blurWidth: 8,
    blurHeight: 2,
    blurDataURL: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAACCAYAAABllJ3tAAAATUlEQVR42gFCAL3/ACQ+eXgUI0NAEyA+OQ0WKikKESAeDBMlIgwUJyMKESAdACM7dHIWJUdEEh46NhAbNDEOFywpDhguKg4XLCgJEB4bWfcJrFNLqoYAAAAASUVORK5CYII="
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/my-crypto-tracker/src/components/Navbar.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/compiler-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/contexts/LanguageContext.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$SearchBar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/components/SearchBar.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/image.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$img$2f$cripto_logo$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$img$2f$cripto_logo$2e$png__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__ = __turbopack_context__.i('[project]/my-crypto-tracker/src/img/cripto_logo.png.mjs { IMAGE => "[project]/my-crypto-tracker/src/img/cripto_logo.png (static in ecmascript, tag client)" } [client] (structured image object with data url, ecmascript)');
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
;
const Navbar = (t0)=>{
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["c"])(234);
    if ($[0] !== "40e0bebab6663c996cc6c9788e6f273038a7f61aba59f0719857380b01f08ce8") {
        for(let $i = 0; $i < 234; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "40e0bebab6663c996cc6c9788e6f273038a7f61aba59f0719857380b01f08ce8";
    }
    const { marketStats, fearGreedIndex: t1, fearGreedClassification: t2, averageRSI: t3, altcoinSeason: t4 } = t0;
    const fearGreedIndex = t1 === undefined ? 50 : t1;
    const fearGreedClassification = t2 === undefined ? "Neutral" : t2;
    const averageRSI = t3 === undefined ? 47.48 : t3;
    const altcoinSeason = t4 === undefined ? 25 : t4;
    const [openDropdown, setOpenDropdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [scrolled, setScrolled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [, setShowNotificationsDropdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { language, setLanguage, t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useLanguage"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    let t5;
    let t6;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = ()=>{
            const storedUser = localStorage.getItem("currentUser");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        };
        t6 = [];
        $[1] = t5;
        $[2] = t6;
    } else {
        t5 = $[1];
        t6 = $[2];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t5, t6);
    let t7;
    if ($[3] !== router) {
        t7 = ()=>{
            localStorage.removeItem("currentUser");
            setUser(null);
            router.push("/login");
        };
        $[3] = router;
        $[4] = t7;
    } else {
        t7 = $[4];
    }
    const handleLogout = t7;
    let t8;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = [
            {
                code: "tr",
                name: "T\xFCrk\xE7e",
                flag: "\uD83C\uDDF9\uD83C\uDDF7"
            },
            {
                code: "en",
                name: "English",
                flag: "\uD83C\uDDFA\uD83C\uDDF8"
            },
            {
                code: "es",
                name: "Espa\xF1ol",
                flag: "\uD83C\uDDEA\uD83C\uDDF8"
            },
            {
                code: "zh",
                name: "\u4E2D\u6587",
                flag: "\uD83C\uDDE8\uD83C\uDDF3"
            },
            {
                code: "ar",
                name: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629",
                flag: "\uD83C\uDDF8\uD83C\uDDE6"
            },
            {
                code: "fr",
                name: "Fran\xE7ais",
                flag: "\uD83C\uDDEB\uD83C\uDDF7"
            },
            {
                code: "de",
                name: "Deutsch",
                flag: "\uD83C\uDDE9\uD83C\uDDEA"
            },
            {
                code: "ja",
                name: "\u65E5\u672C\u8A9E",
                flag: "\uD83C\uDDEF\uD83C\uDDF5"
            },
            {
                code: "pt",
                name: "Portugu\xEAs",
                flag: "\uD83C\uDDF5\uD83C\uDDF9"
            },
            {
                code: "ru",
                name: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439",
                flag: "\uD83C\uDDF7\uD83C\uDDFA"
            },
            {
                code: "hi",
                name: "\u0939\u093F\u0928\u094D\u0926\u0940",
                flag: "\uD83C\uDDEE\uD83C\uDDF3"
            }
        ];
        $[5] = t8;
    } else {
        t8 = $[5];
    }
    const languages = t8;
    let t10;
    let t9;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t9 = ()=>{
            const handleScroll = ()=>{
                setScrolled(window.scrollY > 20);
            };
            window.addEventListener("scroll", handleScroll);
            return ()=>window.removeEventListener("scroll", handleScroll);
        };
        t10 = [];
        $[6] = t10;
        $[7] = t9;
    } else {
        t10 = $[6];
        t9 = $[7];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t9, t10);
    let t11;
    let t12;
    if ($[8] !== router.events) {
        t11 = ()=>{
            const handleRoute = ()=>{
                setOpenDropdown(null);
                setShowLanguageDropdown(false);
                setShowNotificationsDropdown(false);
            };
            router.events.on("routeChangeComplete", handleRoute);
            return ()=>{
                router.events.off("routeChangeComplete", handleRoute);
            };
        };
        t12 = [
            router.events
        ];
        $[8] = router.events;
        $[9] = t11;
        $[10] = t12;
    } else {
        t11 = $[9];
        t12 = $[10];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t11, t12);
    let t13;
    let t14;
    if ($[11] !== showLanguageDropdown) {
        t13 = ()=>{
            const handleClickOutside = (event)=>{
                const target = event.target;
                if (showLanguageDropdown && !target.closest(".language-dropdown-container")) {
                    console.log("D\u0131\u015Far\u0131 t\u0131kland\u0131, dropdown kapan\u0131yor");
                    setShowLanguageDropdown(false);
                }
            };
            if (showLanguageDropdown) {
                document.addEventListener("mousedown", handleClickOutside);
            }
            return ()=>{
                document.removeEventListener("mousedown", handleClickOutside);
            };
        };
        t14 = [
            showLanguageDropdown
        ];
        $[11] = showLanguageDropdown;
        $[12] = t13;
        $[13] = t14;
    } else {
        t13 = $[12];
        t14 = $[13];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t13, t14);
    let t15;
    if ($[14] !== router) {
        t15 = (event_0)=>{
            event_0?.preventDefault();
            setOpenDropdown(null);
            setShowLanguageDropdown(false);
            if (router.pathname !== "/") {
                router.push("/");
            }
        };
        $[14] = router;
        $[15] = t15;
    } else {
        t15 = $[15];
    }
    const handleLogoClick = t15;
    const t16 = `bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300 ${scrolled ? "shadow-lg" : "shadow-sm"}`;
    let t17;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-14 w-54 flex items-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                src: __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$img$2f$cripto_logo$2e$png$2e$mjs__$7b$__IMAGE__$3d3e$__$225b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$img$2f$cripto_logo$2e$png__$28$static__in__ecmascript$2c$__tag__client$2922$__$7d$__$5b$client$5d$__$28$structured__image__object__with__data__url$2c$__ecmascript$29$__["default"],
                alt: "Dijital Market Logo",
                height: 64,
                width: 250,
                className: "h-16 w-auto object-contain",
                priority: true
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 225,
                columnNumber: 56
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 225,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[16] = t17;
    } else {
        t17 = $[16];
    }
    let t18;
    if ($[17] !== handleLogoClick) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "/",
            onClick: handleLogoClick,
            className: "flex items-center group",
            children: t17
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 232,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[17] = handleLogoClick;
        $[18] = t18;
    } else {
        t18 = $[18];
    }
    let t19;
    if ($[19] !== openDropdown) {
        t19 = ()=>setOpenDropdown(openDropdown === "kripto" ? null : "kripto");
        $[19] = openDropdown;
        $[20] = t19;
    } else {
        t19 = $[20];
    }
    let t20;
    if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: "Kripto Paralar"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 248,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[21] = t20;
    } else {
        t20 = $[21];
    }
    const t21 = `w-4 h-4 transition-transform ${openDropdown === "kripto" ? "rotate-180" : ""}`;
    let t22;
    if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 256,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[22] = t22;
    } else {
        t22 = $[22];
    }
    let t23;
    if ($[23] !== t21) {
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t21,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t22
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 263,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[23] = t21;
        $[24] = t23;
    } else {
        t23 = $[24];
    }
    let t24;
    if ($[25] !== t19 || $[26] !== t23) {
        t24 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t19,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100 whitespace-nowrap",
            children: [
                t20,
                t23
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 271,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[25] = t19;
        $[26] = t23;
        $[27] = t24;
    } else {
        t24 = $[27];
    }
    let t25;
    if ($[28] !== openDropdown) {
        t25 = openDropdown === "kripto" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200",
            onClick: _temp,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-6 px-4 min-w-[800px]",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "space-y-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                    onClick: ()=>setOpenDropdown(null),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                strokeWidth: 2,
                                                d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 280,
                                                columnNumber: 573
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 453
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Sıralama"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 849
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 280,
                                    columnNumber: 265
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                    onClick: ()=>setOpenDropdown(null),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                strokeWidth: 2,
                                                d: "M4 6h16M4 12h16M4 18h16"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 280,
                                                columnNumber: 1206
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 1086
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Kategoriler"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 1309
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 280,
                                    columnNumber: 898
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                    onClick: ()=>setOpenDropdown(null),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 1669
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 1903
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 1549
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Geçmiş Anlık Görüntüler"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 2015
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 280,
                                    columnNumber: 1361
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                    onClick: ()=>setOpenDropdown(null),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                strokeWidth: 2,
                                                d: "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 280,
                                                columnNumber: 2387
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 2267
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Token Kilidi Açılmaları"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 2559
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 280,
                                    columnNumber: 2079
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                    onClick: ()=>setOpenDropdown(null),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                strokeWidth: 2,
                                                d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 280,
                                                columnNumber: 2931
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 2811
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Getiri"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 3182
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 280,
                                    columnNumber: 2623
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                    onClick: ()=>setOpenDropdown(null),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                            className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                strokeWidth: 2,
                                                d: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 280,
                                                columnNumber: 3537
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 3417
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Gerçek Dünya Varlıkları"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 3813
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 280,
                                    columnNumber: 3229
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 280,
                            columnNumber: 238
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 280,
                        columnNumber: 214
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 border-l border-gray-200 pl-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                    children: "Liderlik Tabloları"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 280,
                                    columnNumber: 3965
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "#",
                                            className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                            onClick: ()=>setOpenDropdown(null),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 4400
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 4280
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Trend"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 4510
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 4092
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "#",
                                            className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                            onClick: ()=>setOpenDropdown(null),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 4864
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 4744
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Yakında"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 4987
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 4556
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "#",
                                            className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                            onClick: ()=>setOpenDropdown(null),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M12 4v16m8-8H4"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 5343
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 5223
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Son Eklenenler"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 5437
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 5035
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "#",
                                            className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                            onClick: ()=>setOpenDropdown(null),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 280,
                                                            columnNumber: 5800
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 280,
                                                            columnNumber: 5904
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 5680
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Kazananlar ve Kaybedenler"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 6015
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 5492
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "#",
                                            className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                            onClick: ()=>setOpenDropdown(null),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 280,
                                                            columnNumber: 6389
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 280,
                                                            columnNumber: 6495
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 6269
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "En Çok Ziyaret Edilenler"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 6694
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 6081
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "#",
                                            className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                            onClick: ()=>setOpenDropdown(null),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 7067
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 6947
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Topluluk Hissiyatı"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 7304
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 6759
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "#",
                                            className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                            onClick: ()=>setOpenDropdown(null),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 7671
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 7551
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Zincir Sıralaması"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 7796
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 7363
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 280,
                                    columnNumber: 4065
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 280,
                            columnNumber: 3943
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 280,
                        columnNumber: 3889
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex-1 border-l border-gray-200 pl-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "mb-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                    className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                    children: "NFT"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 280,
                                    columnNumber: 7948
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "#",
                                            className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                            onClick: ()=>setOpenDropdown(null),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 8368
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 8248
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Genel NFT İstatistikleri"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 8644
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 8060
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: "#",
                                            className: "flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all group",
                                            onClick: ()=>setOpenDropdown(null),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5 text-gray-400 group-hover:text-[#2563EB]",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 280,
                                                        columnNumber: 9017
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 8897
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Yaklaşan Satışlar"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 280,
                                                    columnNumber: 9183
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 280,
                                            columnNumber: 8709
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 280,
                                    columnNumber: 8033
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 280,
                            columnNumber: 7926
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 280,
                        columnNumber: 7872
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 280,
                columnNumber: 167
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 280,
            columnNumber: 40
        }, ("TURBOPACK compile-time value", void 0));
        $[28] = openDropdown;
        $[29] = t25;
    } else {
        t25 = $[29];
    }
    let t26;
    if ($[30] !== t24 || $[31] !== t25) {
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t24,
                t25
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 288,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[30] = t24;
        $[31] = t25;
        $[32] = t26;
    } else {
        t26 = $[32];
    }
    let t27;
    if ($[33] !== openDropdown) {
        t27 = ()=>setOpenDropdown(openDropdown === "dashboard" ? null : "dashboard");
        $[33] = openDropdown;
        $[34] = t27;
    } else {
        t27 = $[34];
    }
    const t28 = `w-4 h-4 transition-transform ${openDropdown === "dashboard" ? "rotate-180" : ""}`;
    let t29;
    if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
        t29 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 306,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[35] = t29;
    } else {
        t29 = $[35];
    }
    let t30;
    if ($[36] !== t28) {
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t28,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t29
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 313,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[36] = t28;
        $[37] = t30;
    } else {
        t30 = $[37];
    }
    let t31;
    if ($[38] !== t27 || $[39] !== t30) {
        t31 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t27,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                "Dashboard",
                t30
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 321,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[38] = t27;
        $[39] = t30;
        $[40] = t31;
    } else {
        t31 = $[40];
    }
    let t32;
    if ($[41] !== openDropdown) {
        t32 = openDropdown === "dashboard" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200 min-w-[600px]",
            onClick: _temp2,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 space-y-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 330,
                                            columnNumber: 402
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 323
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Piyasalar"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 330,
                                columnNumber: 222
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Piyasa Genel Bakış"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 609
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Spot Piyasa"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 795
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Türev Piyasa"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 974
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Kripto Para Sayısı"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 1154
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bitcoin Hazine Rezervleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 1340
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "BNB Hazine Rezervleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 1533
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 330,
                                columnNumber: 582
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 330,
                        columnNumber: 217
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 330,
                                            columnNumber: 1919
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 1840
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Göstergeler"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 330,
                                columnNumber: 1739
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Korku ve Açgözlülük Endeksi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 2238
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Altcoin Sezonu Endeksi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 2433
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Piyasa Döngüsü Göstergeleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 2623
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bitcoin Hakimiyeti"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 2818
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market 20 Endeksi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 3004
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market 100 Endeksi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 3197
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 330,
                                columnNumber: 2211
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 330,
                        columnNumber: 1734
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 330,
                                            columnNumber: 3588
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 3509
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "ETF Akışları"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 330,
                                columnNumber: 3408
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Kripto ETF'leri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 3742
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bitcoin ETF'leri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 3925
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Ethereum ETF'leri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 4109
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 330,
                                columnNumber: 3715
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 330,
                        columnNumber: 3403
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4",
                                        fill: "none",
                                        stroke: "currentColor",
                                        viewBox: "0 0 24 24",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 330,
                                            columnNumber: 4491
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 4412
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Teknik Analiz"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 330,
                                columnNumber: 4311
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "RSI"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 4812
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "MACD"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 330,
                                        columnNumber: 4983
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 330,
                                columnNumber: 4785
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 330,
                        columnNumber: 4306
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 330,
                columnNumber: 185
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 330,
            columnNumber: 43
        }, ("TURBOPACK compile-time value", void 0));
        $[41] = openDropdown;
        $[42] = t32;
    } else {
        t32 = $[42];
    }
    let t33;
    if ($[43] !== t31 || $[44] !== t32) {
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t31,
                t32
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 338,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[43] = t31;
        $[44] = t32;
        $[45] = t33;
    } else {
        t33 = $[45];
    }
    let t34;
    if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
        t34 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "#",
            className: "px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: "DexScan"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 347,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[46] = t34;
    } else {
        t34 = $[46];
    }
    let t35;
    if ($[47] !== openDropdown) {
        t35 = ()=>setOpenDropdown(openDropdown === "borsalar" ? null : "borsalar");
        $[47] = openDropdown;
        $[48] = t35;
    } else {
        t35 = $[48];
    }
    const t36 = `w-4 h-4 transition-transform ${openDropdown === "borsalar" ? "rotate-180" : ""}`;
    let t37;
    if ($[49] === Symbol.for("react.memo_cache_sentinel")) {
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 363,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[49] = t37;
    } else {
        t37 = $[49];
    }
    let t38;
    if ($[50] !== t36) {
        t38 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t36,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t37
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 370,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[50] = t36;
        $[51] = t38;
    } else {
        t38 = $[51];
    }
    let t39;
    if ($[52] !== t35 || $[53] !== t38) {
        t39 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t35,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                "Borsalar",
                t38
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 378,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[52] = t35;
        $[53] = t38;
        $[54] = t39;
    } else {
        t39 = $[54];
    }
    let t40;
    if ($[55] !== openDropdown) {
        t40 = openDropdown === "borsalar" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200 min-w-[300px]",
            onClick: _temp3,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Merkezi Borsalar"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 387,
                                columnNumber: 221
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "w-4 h-4",
                                                fill: "currentColor",
                                                viewBox: "0 0 20 20",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 387,
                                                        columnNumber: 593
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        fillRule: "evenodd",
                                                        d: "M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z",
                                                        clipRule: "evenodd"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 387,
                                                        columnNumber: 639
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 387,
                                                columnNumber: 528
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Spot"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 387,
                                                columnNumber: 923
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 387,
                                        columnNumber: 346
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "w-4 h-4",
                                                fill: "currentColor",
                                                viewBox: "0 0 20 20",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    fillRule: "evenodd",
                                                    d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
                                                    clipRule: "evenodd"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 387,
                                                    columnNumber: 1191
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 387,
                                                columnNumber: 1126
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Türevler"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 387,
                                                columnNumber: 1362
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 387,
                                        columnNumber: 944
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 387,
                                columnNumber: 319
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 387,
                        columnNumber: 216
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Merkezi Olmayan Borsalar"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 387,
                                columnNumber: 1404
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "w-4 h-4",
                                                fill: "currentColor",
                                                viewBox: "0 0 20 20",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    d: "M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 387,
                                                    columnNumber: 1784
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 387,
                                                columnNumber: 1719
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Spot"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 387,
                                                columnNumber: 1957
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 387,
                                        columnNumber: 1537
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "w-4 h-4",
                                                fill: "currentColor",
                                                viewBox: "0 0 20 20",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    fillRule: "evenodd",
                                                    d: "M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z",
                                                    clipRule: "evenodd"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 387,
                                                    columnNumber: 2225
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 387,
                                                columnNumber: 2160
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Türevler"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 387,
                                                columnNumber: 2396
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 387,
                                        columnNumber: 1978
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 387,
                                columnNumber: 1510
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 387,
                        columnNumber: 1399
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 387,
                columnNumber: 184
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 387,
            columnNumber: 42
        }, ("TURBOPACK compile-time value", void 0));
        $[55] = openDropdown;
        $[56] = t40;
    } else {
        t40 = $[56];
    }
    let t41;
    if ($[57] !== t39 || $[58] !== t40) {
        t41 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t39,
                t40
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 395,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[57] = t39;
        $[58] = t40;
        $[59] = t41;
    } else {
        t41 = $[59];
    }
    let t42;
    if ($[60] === Symbol.for("react.memo_cache_sentinel")) {
        t42 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "#",
            className: "px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: "Topluluk"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 404,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[60] = t42;
    } else {
        t42 = $[60];
    }
    let t43;
    if ($[61] !== openDropdown) {
        t43 = ()=>setOpenDropdown(openDropdown === "urunler" ? null : "urunler");
        $[61] = openDropdown;
        $[62] = t43;
    } else {
        t43 = $[62];
    }
    const t44 = `w-4 h-4 transition-transform ${openDropdown === "urunler" ? "rotate-180" : ""}`;
    let t45;
    if ($[63] === Symbol.for("react.memo_cache_sentinel")) {
        t45 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 420,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[63] = t45;
    } else {
        t45 = $[63];
    }
    let t46;
    if ($[64] !== t44) {
        t46 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t44,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t45
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 427,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[64] = t44;
        $[65] = t46;
    } else {
        t46 = $[65];
    }
    let t47;
    if ($[66] !== t43 || $[67] !== t46) {
        t47 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t43,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                "Ürünler",
                t46
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 435,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[66] = t43;
        $[67] = t46;
        $[68] = t47;
    } else {
        t47 = $[68];
    }
    let t48;
    if ($[69] !== openDropdown) {
        t48 = openDropdown === "urunler" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200 min-w-[300px]",
            onClick: _temp4,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "px-4 space-y-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Ürünler"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 444,
                                columnNumber: 220
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dönüştürücü"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 336
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bülten"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 515
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market Lansman"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 689
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market Laboratuvarları"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 879
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Telegram Bot"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 1077
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Reklam Ver"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 1257
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Kripto API"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 1435
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Site Widget'ları"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 1613
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 444,
                                columnNumber: 309
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 444,
                        columnNumber: 215
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Kampanyalar"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 444,
                                columnNumber: 1814
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Airdrop'lar"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 1934
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Elmas Ödülleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 2113
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Öğren ve Kazan"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 2295
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 444,
                                columnNumber: 1907
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 444,
                        columnNumber: 1809
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Öğren"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 444,
                                columnNumber: 2494
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Haberler"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 2608
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Akademi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 2784
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Araştırma"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 2959
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Videolar"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 3136
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Sözlük"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 3312
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 444,
                                columnNumber: 2581
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 444,
                        columnNumber: 2489
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Takvimler"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 444,
                                columnNumber: 3503
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "ICO Takvimi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 3621
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Etkinlik Takvimi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 444,
                                        columnNumber: 3800
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 444,
                                columnNumber: 3594
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 444,
                        columnNumber: 3498
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 444,
                columnNumber: 183
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 444,
            columnNumber: 41
        }, ("TURBOPACK compile-time value", void 0));
        $[69] = openDropdown;
        $[70] = t48;
    } else {
        t48 = $[70];
    }
    let t49;
    if ($[71] !== t47 || $[72] !== t48) {
        t49 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t47,
                t48
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 452,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[71] = t47;
        $[72] = t48;
        $[73] = t49;
    } else {
        t49 = $[73];
    }
    let t50;
    if ($[74] !== t26 || $[75] !== t33 || $[76] !== t41 || $[77] !== t49) {
        t50 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "hidden lg:flex items-center gap-1",
            children: [
                t26,
                t33,
                t34,
                t41,
                t42,
                t49
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 461,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[74] = t26;
        $[75] = t33;
        $[76] = t41;
        $[77] = t49;
        $[78] = t50;
    } else {
        t50 = $[78];
    }
    let t51;
    if ($[79] !== t18 || $[80] !== t50) {
        t51 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-8",
            children: [
                t18,
                t50
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 472,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[79] = t18;
        $[80] = t50;
        $[81] = t51;
    } else {
        t51 = $[81];
    }
    let t52;
    if ($[82] === Symbol.for("react.memo_cache_sentinel")) {
        t52 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "hidden md:block",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$SearchBar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 481,
                columnNumber: 44
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 481,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[82] = t52;
    } else {
        t52 = $[82];
    }
    let t53;
    if ($[83] === Symbol.for("react.memo_cache_sentinel")) {
        t53 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "hidden lg:flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "w-5 h-5",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 488,
                        columnNumber: 240
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 488,
                    columnNumber: 161
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm",
                    children: "Dijital Market AI"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 488,
                    columnNumber: 477
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 488,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[83] = t53;
    } else {
        t53 = $[83];
    }
    let t54;
    if ($[84] !== handleLogout || $[85] !== t || $[86] !== user) {
        t54 = user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-right hidden sm:block",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-gray-600",
                            children: [
                                t("common.welcome"),
                                ","
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 495,
                            columnNumber: 103
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm font-bold text-gray-900",
                            children: user.name || user.full_name || user.email
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 495,
                            columnNumber: 166
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 495,
                    columnNumber: 59
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: handleLogout,
                    className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition",
                    children: t("common.logout")
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 495,
                    columnNumber: 266
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 495,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "/login",
            className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            children: "Giriş Yap"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 495,
            columnNumber: 426
        }, ("TURBOPACK compile-time value", void 0));
        $[84] = handleLogout;
        $[85] = t;
        $[86] = user;
        $[87] = t54;
    } else {
        t54 = $[87];
    }
    let t55;
    if ($[88] !== showLanguageDropdown) {
        t55 = (e_3)=>{
            e_3.stopPropagation();
            setShowLanguageDropdown(!showLanguageDropdown);
            setShowNotificationsDropdown(false);
        };
        $[88] = showLanguageDropdown;
        $[89] = t55;
    } else {
        t55 = $[89];
    }
    let t56;
    if ($[90] === Symbol.for("react.memo_cache_sentinel")) {
        t56 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-5 h-5 text-gray-900",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 517,
                    columnNumber: 104
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 517,
                    columnNumber: 661
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 517,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[90] = t56;
    } else {
        t56 = $[90];
    }
    let t57;
    if ($[91] !== t55) {
        t57 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t55,
            className: "bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors focus:outline-none",
            children: t56
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 524,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[91] = t55;
        $[92] = t57;
    } else {
        t57 = $[92];
    }
    let t58;
    if ($[93] !== language || $[94] !== setLanguage || $[95] !== showLanguageDropdown || $[96] !== t) {
        t58 = showLanguageDropdown && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-[60] min-w-[200px] max-h-[400px] overflow-y-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-4 py-2 border-b border-gray-200 text-xs text-gray-500 font-bold uppercase bg-gray-50",
                    children: t("common.language")
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 532,
                    columnNumber: 193
                }, ("TURBOPACK compile-time value", void 0)),
                languages.map((lang)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: (e_4)=>{
                            e_4.stopPropagation();
                            const langCode = lang.code;
                            setLanguage(langCode);
                            setShowLanguageDropdown(false);
                            setTimeout(_temp5, 100);
                        },
                        className: `w-full text-left px-4 py-3 hover:bg-gray-50 text-sm transition flex items-center gap-2 ${language === lang.code ? "bg-[#2563EB]/10 text-[#2563EB] font-semibold" : "text-gray-700"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-lg",
                                children: lang.flag
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 538,
                                columnNumber: 204
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex-1",
                                children: lang.name
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 538,
                                columnNumber: 248
                            }, ("TURBOPACK compile-time value", void 0)),
                            language === lang.code && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-4 h-4 text-[#2563EB]",
                                fill: "currentColor",
                                viewBox: "0 0 20 20",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    fillRule: "evenodd",
                                    d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                                    clipRule: "evenodd"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 538,
                                    columnNumber: 398
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 538,
                                columnNumber: 318
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, lang.code, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 532,
                        columnNumber: 349
                    }, ("TURBOPACK compile-time value", void 0)))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 532,
            columnNumber: 35
        }, ("TURBOPACK compile-time value", void 0));
        $[93] = language;
        $[94] = setLanguage;
        $[95] = showLanguageDropdown;
        $[96] = t;
        $[97] = t58;
    } else {
        t58 = $[97];
    }
    let t59;
    if ($[98] !== t57 || $[99] !== t58) {
        t59 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative z-50 language-dropdown-container lg:hidden",
            children: [
                t57,
                t58
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 549,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[98] = t57;
        $[99] = t58;
        $[100] = t59;
    } else {
        t59 = $[100];
    }
    let t60;
    if ($[101] !== openDropdown) {
        t60 = ()=>setOpenDropdown(openDropdown === "mobile" ? null : "mobile");
        $[101] = openDropdown;
        $[102] = t60;
    } else {
        t60 = $[102];
    }
    let t61;
    if ($[103] === Symbol.for("react.memo_cache_sentinel")) {
        t61 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-6 h-6",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M4 6h16M4 12h16M4 18h16"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 566,
                columnNumber: 90
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 566,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[103] = t61;
    } else {
        t61 = $[103];
    }
    let t62;
    if ($[104] !== t60) {
        t62 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t60,
            className: "lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100",
            children: t61
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 573,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[104] = t60;
        $[105] = t62;
    } else {
        t62 = $[105];
    }
    let t63;
    if ($[106] === Symbol.for("react.memo_cache_sentinel")) {
        t63 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "/portfolio",
            className: "hidden lg:flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "w-5 h-5",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 581,
                        columnNumber: 263
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 581,
                    columnNumber: 184
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm",
                    children: "Portföy"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 581,
                    columnNumber: 539
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 581,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[106] = t63;
    } else {
        t63 = $[106];
    }
    let t64;
    if ($[107] === Symbol.for("react.memo_cache_sentinel")) {
        t64 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "hidden lg:flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "w-5 h-5",
                    fill: "none",
                    stroke: "currentColor",
                    viewBox: "0 0 24 24",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        strokeLinecap: "round",
                        strokeLinejoin: "round",
                        strokeWidth: 2,
                        d: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 588,
                        columnNumber: 247
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 588,
                    columnNumber: 168
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm",
                    children: "İzleme Listesi"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 588,
                    columnNumber: 686
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 588,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[107] = t64;
    } else {
        t64 = $[107];
    }
    let t65;
    if ($[108] !== openDropdown) {
        t65 = ()=>setOpenDropdown(openDropdown === "mobile" ? null : "mobile");
        $[108] = openDropdown;
        $[109] = t65;
    } else {
        t65 = $[109];
    }
    let t66;
    if ($[110] === Symbol.for("react.memo_cache_sentinel")) {
        t66 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-6 h-6",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M4 6h16M4 12h16M4 18h16"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 603,
                columnNumber: 90
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 603,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[110] = t66;
    } else {
        t66 = $[110];
    }
    let t67;
    if ($[111] !== t65) {
        t67 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t65,
            className: "lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100",
            children: t66
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 610,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[111] = t65;
        $[112] = t67;
    } else {
        t67 = $[112];
    }
    let t68;
    if ($[113] !== t54 || $[114] !== t59 || $[115] !== t62 || $[116] !== t67) {
        t68 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-3",
            children: [
                t52,
                t53,
                t54,
                t59,
                t62,
                t63,
                t64,
                t67
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 618,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[113] = t54;
        $[114] = t59;
        $[115] = t62;
        $[116] = t67;
        $[117] = t68;
    } else {
        t68 = $[117];
    }
    let t69;
    if ($[118] !== t51 || $[119] !== t68) {
        t69 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full px-4 py-4 flex items-center justify-between",
            children: [
                t51,
                t68
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 629,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[118] = t51;
        $[119] = t68;
        $[120] = t69;
    } else {
        t69 = $[120];
    }
    let t70;
    if ($[121] !== handleLogout || $[122] !== openDropdown || $[123] !== t || $[124] !== user) {
        t70 = openDropdown === "mobile" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "lg:hidden mt-4 pb-4 pt-4 border-t border-gray-200",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "/",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Kripto Paralar"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 638,
                        columnNumber: 144
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Borsalar"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 638,
                        columnNumber: 271
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "NFT"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 638,
                        columnNumber: 392
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Öğren"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 638,
                        columnNumber: 508
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Ürünler"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 638,
                        columnNumber: 626
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "pt-4 border-t border-gray-200 mt-2",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "w-full flex items-center gap-2 px-4 py-3 text-[#2563EB] font-medium rounded-lg hover:bg-[#2563EB]/10 mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-5 h-5",
                                        fill: "currentColor",
                                        viewBox: "0 0 20 20",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 638,
                                            columnNumber: 989
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 638,
                                        columnNumber: 924
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Favoriler"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 638,
                                columnNumber: 798
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                className: "w-full flex items-center gap-2 px-4 py-3 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-medium rounded-lg mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-5 h-5",
                                        fill: "currentColor",
                                        viewBox: "0 0 20 20",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 638,
                                            columnNumber: 1567
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 638,
                                        columnNumber: 1502
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Portföy"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 638,
                                columnNumber: 1370
                            }, ("TURBOPACK compile-time value", void 0)),
                            user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-full px-4 py-3 text-center mb-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-gray-500",
                                                children: [
                                                    t("common.welcome"),
                                                    ","
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 638,
                                                columnNumber: 2007
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm font-bold text-gray-900",
                                                children: user.name || user.full_name || user.email
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 638,
                                                columnNumber: 2070
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 638,
                                        columnNumber: 1956
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleLogout,
                                        className: "w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg block text-center",
                                        children: t("common.logout")
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 638,
                                        columnNumber: 2170
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/login",
                                        className: "w-full px-4 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100 mb-2 block text-center",
                                        children: t("common.login")
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 638,
                                        columnNumber: 2347
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/register",
                                        className: "w-full px-4 py-3 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-medium rounded-lg block text-center",
                                        children: t("common.register")
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 638,
                                        columnNumber: 2500
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 638,
                        columnNumber: 746
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 638,
                columnNumber: 107
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 638,
            columnNumber: 40
        }, ("TURBOPACK compile-time value", void 0));
        $[121] = handleLogout;
        $[122] = openDropdown;
        $[123] = t;
        $[124] = user;
        $[125] = t70;
    } else {
        t70 = $[125];
    }
    let t71;
    if ($[126] !== t16 || $[127] !== t69 || $[128] !== t70) {
        t71 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
            className: t16,
            children: [
                t69,
                t70
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 649,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[126] = t16;
        $[127] = t69;
        $[128] = t70;
        $[129] = t71;
    } else {
        t71 = $[129];
    }
    let t72;
    if ($[130] !== openDropdown) {
        t72 = openDropdown && openDropdown !== "mobile" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 z-40",
            onClick: ()=>setOpenDropdown(null)
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 659,
            columnNumber: 56
        }, ("TURBOPACK compile-time value", void 0));
        $[130] = openDropdown;
        $[131] = t72;
    } else {
        t72 = $[131];
    }
    let t73;
    let t74;
    let t75;
    let t76;
    let t77;
    let t78;
    if ($[132] === Symbol.for("react.memo_cache_sentinel")) {
        t73 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-900 font-medium text-2xl whitespace-nowrap border-b-2 border-blue-600 relative",
            children: "En İyiler"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 672,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t74 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Trend"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 673,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t75 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "En Çok Ziyaret Edilenler"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 674,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t76 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Yeni"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 675,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t77 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Kazananlar"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 676,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t78 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Gerçek Dünya Varlıkları"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 677,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[132] = t73;
        $[133] = t74;
        $[134] = t75;
        $[135] = t76;
        $[136] = t77;
        $[137] = t78;
    } else {
        t73 = $[132];
        t74 = $[133];
        t75 = $[134];
        t76 = $[135];
        t77 = $[136];
        t78 = $[137];
    }
    let t79;
    if ($[138] !== openDropdown) {
        t79 = ()=>setOpenDropdown(openDropdown === "more-tabs" ? null : "more-tabs");
        $[138] = openDropdown;
        $[139] = t79;
    } else {
        t79 = $[139];
    }
    const t80 = `w-4 h-4 transition-transform ${openDropdown === "more-tabs" ? "rotate-180" : ""}`;
    let t81;
    if ($[140] === Symbol.for("react.memo_cache_sentinel")) {
        t81 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 703,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[140] = t81;
    } else {
        t81 = $[140];
    }
    let t82;
    if ($[141] !== t80) {
        t82 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t80,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t81
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 710,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[141] = t80;
        $[142] = t82;
    } else {
        t82 = $[142];
    }
    let t83;
    if ($[143] !== t79 || $[144] !== t82) {
        t83 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t79,
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors flex items-center gap-1",
            children: [
                "Daha Fazla",
                t82
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 718,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[143] = t79;
        $[144] = t82;
        $[145] = t83;
    } else {
        t83 = $[145];
    }
    let t84;
    if ($[146] !== openDropdown) {
        t84 = openDropdown === "more-tabs" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 min-w-[200px]",
            onClick: _temp6,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Kaybedenler"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 727,
                    columnNumber: 184
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Son 24 Saat"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 727,
                    columnNumber: 354
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Son 7 Gün"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 727,
                    columnNumber: 524
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Son 30 Gün"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 727,
                    columnNumber: 692
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 727,
            columnNumber: 43
        }, ("TURBOPACK compile-time value", void 0));
        $[146] = openDropdown;
        $[147] = t84;
    } else {
        t84 = $[147];
    }
    let t85;
    if ($[148] !== t83 || $[149] !== t84) {
        t85 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border-b border-gray-200",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full px-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-6 overflow-x-auto scrollbar-hide",
                    children: [
                        t73,
                        t74,
                        t75,
                        t76,
                        t77,
                        t78,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                t83,
                                t84
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 735,
                            columnNumber: 193
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 735,
                    columnNumber: 91
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 735,
                columnNumber: 62
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 735,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[148] = t83;
        $[149] = t84;
        $[150] = t85;
    } else {
        t85 = $[150];
    }
    let t86;
    if ($[151] === Symbol.for("react.memo_cache_sentinel")) {
        t86 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
            className: "text-xl font-bold text-gray-900 mb-4",
            children: "Kripto Piyasa Genel Bakış"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 744,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[151] = t86;
    } else {
        t86 = $[151];
    }
    let t87;
    if ($[152] === Symbol.for("react.memo_cache_sentinel")) {
        t87 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Piyasa Değeri"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 751,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[152] = t87;
    } else {
        t87 = $[152];
    }
    let t88;
    if ($[153] === Symbol.for("react.memo_cache_sentinel")) {
        t88 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t87,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-4 h-4 text-gray-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M9 5l7 7-7 7"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 758,
                            columnNumber: 206
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 758,
                        columnNumber: 113
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 758,
                columnNumber: 67
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 758,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[153] = t88;
    } else {
        t88 = $[153];
    }
    let t89;
    if ($[154] !== marketStats) {
        t89 = marketStats ? `$${(marketStats.marketCap / 1000000000000).toFixed(2)}T` : "$0.00T";
        $[154] = marketStats;
        $[155] = t89;
    } else {
        t89 = $[155];
    }
    let t90;
    if ($[156] !== t89) {
        t90 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-2xl font-bold text-gray-900",
            children: t89
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 773,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[156] = t89;
        $[157] = t90;
    } else {
        t90 = $[157];
    }
    const t91 = `text-sm font-semibold flex items-center gap-1 ${marketStats && marketStats.marketCapChange24h >= 0 ? "text-green-600" : "text-red-600"}`;
    const t92 = marketStats && marketStats.marketCapChange24h >= 0 ? "\u25B2" : "\u25BC";
    let t93;
    if ($[158] !== marketStats) {
        t93 = marketStats && marketStats.marketCapChange24h !== undefined ? Math.abs(marketStats.marketCapChange24h).toFixed(2) : "0.00";
        $[158] = marketStats;
        $[159] = t93;
    } else {
        t93 = $[159];
    }
    let t94;
    if ($[160] !== t91 || $[161] !== t92 || $[162] !== t93) {
        t94 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t91,
            children: [
                t92,
                " ",
                t93,
                "%"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 791,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[160] = t91;
        $[161] = t92;
        $[162] = t93;
        $[163] = t94;
    } else {
        t94 = $[163];
    }
    let t95;
    if ($[164] !== t90 || $[165] !== t94) {
        t95 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: [
                t90,
                t94
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 801,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[164] = t90;
        $[165] = t94;
        $[166] = t95;
    } else {
        t95 = $[166];
    }
    let t96;
    if ($[167] === Symbol.for("react.memo_cache_sentinel")) {
        t96 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "h-12 w-full mt-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                viewBox: "0 0 100 40",
                className: "w-full h-full",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                    points: "0,30 10,25 20,20 30,18 40,15 50,12 60,10 70,8 80,10 90,12 100,10",
                    fill: "none",
                    stroke: "#14b8a6",
                    strokeWidth: "2"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 810,
                    columnNumber: 97
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 810,
                columnNumber: 45
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 810,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[167] = t96;
    } else {
        t96 = $[167];
    }
    let t97;
    if ($[168] !== t95) {
        t97 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t88,
                t95,
                t96
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 817,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[168] = t95;
        $[169] = t97;
    } else {
        t97 = $[169];
    }
    let t98;
    if ($[170] === Symbol.for("react.memo_cache_sentinel")) {
        t98 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Dijital Market 20"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 825,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[170] = t98;
    } else {
        t98 = $[170];
    }
    let t99;
    if ($[171] === Symbol.for("react.memo_cache_sentinel")) {
        t99 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t98,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-4 h-4 text-gray-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M9 5l7 7-7 7"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 832,
                            columnNumber: 206
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 832,
                        columnNumber: 113
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 832,
                columnNumber: 67
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 832,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[171] = t99;
    } else {
        t99 = $[171];
    }
    let t100;
    if ($[172] === Symbol.for("react.memo_cache_sentinel")) {
        t100 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-2xl font-bold text-gray-900",
                    children: "$193.84"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 839,
                    columnNumber: 34
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm font-semibold text-green-600 flex items-center gap-1",
                    children: "▲ 0.88%"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 839,
                    columnNumber: 97
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 839,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[172] = t100;
    } else {
        t100 = $[172];
    }
    let t101;
    if ($[173] === Symbol.for("react.memo_cache_sentinel")) {
        t101 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t99,
                t100,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "h-12 w-full mt-2",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        viewBox: "0 0 100 40",
                        className: "w-full h-full",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("polyline", {
                            points: "0,35 10,30 20,25 30,20 40,18 50,15 60,12 70,10 80,12 90,15 100,12",
                            fill: "none",
                            stroke: "#14b8a6",
                            strokeWidth: "2"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 846,
                            columnNumber: 222
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 846,
                        columnNumber: 170
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 846,
                    columnNumber: 136
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 846,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[173] = t101;
    } else {
        t101 = $[173];
    }
    let t102;
    if ($[174] === Symbol.for("react.memo_cache_sentinel")) {
        t102 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Korku ve Açgözlülük"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 853,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[174] = t102;
    } else {
        t102 = $[174];
    }
    let t103;
    if ($[175] === Symbol.for("react.memo_cache_sentinel")) {
        t103 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t102,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-4 h-4 text-gray-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M9 5l7 7-7 7"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 860,
                            columnNumber: 208
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 860,
                        columnNumber: 115
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 860,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 860,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[175] = t103;
    } else {
        t103 = $[175];
    }
    let t104;
    if ($[176] !== fearGreedIndex) {
        t104 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-2xl font-bold text-gray-900",
            children: fearGreedIndex
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 867,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[176] = fearGreedIndex;
        $[177] = t104;
    } else {
        t104 = $[177];
    }
    const t105 = fearGreedIndex <= 25 ? "#ef4444" : fearGreedIndex <= 45 ? "#f59e0b" : fearGreedIndex <= 55 ? "#eab308" : fearGreedIndex <= 75 ? "#10b981" : "#059669";
    let t106;
    if ($[178] !== t105) {
        t106 = {
            color: t105
        };
        $[178] = t105;
        $[179] = t106;
    } else {
        t106 = $[179];
    }
    const t107 = fearGreedClassification === "Extreme Fear" ? "A\u015F\u0131r\u0131 Korku" : fearGreedClassification === "Fear" ? "Korku" : fearGreedClassification === "Neutral" ? "N\xF6tr" : fearGreedClassification === "Greed" ? "A\xE7g\xF6zl\xFCl\xFCk" : fearGreedClassification === "Extreme Greed" ? "A\u015F\u0131r\u0131 A\xE7g\xF6zl\xFCl\xFCk" : "N\xF6tr";
    let t108;
    if ($[180] !== t106 || $[181] !== t107) {
        t108 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-xs font-semibold",
            style: t106,
            children: t107
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 887,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[180] = t106;
        $[181] = t107;
        $[182] = t108;
    } else {
        t108 = $[182];
    }
    let t109;
    if ($[183] !== t104 || $[184] !== t108) {
        t109 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: [
                t104,
                t108
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 896,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[183] = t104;
        $[184] = t108;
        $[185] = t109;
    } else {
        t109 = $[185];
    }
    let t110;
    if ($[186] === Symbol.for("react.memo_cache_sentinel")) {
        t110 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 flex",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 bg-red-500"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 905,
                    columnNumber: 51
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 bg-orange-500"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 905,
                    columnNumber: 88
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 bg-yellow-400"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 905,
                    columnNumber: 128
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 bg-green-500"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 905,
                    columnNumber: 168
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 bg-emerald-600"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 905,
                    columnNumber: 207
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 905,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[186] = t110;
    } else {
        t110 = $[186];
    }
    const t111 = `${fearGreedIndex}%`;
    let t112;
    if ($[187] !== t111) {
        t112 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative h-8 rounded-full mt-2 overflow-hidden",
            children: [
                t110,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-0 bottom-0 w-1 bg-white shadow-lg",
                    style: {
                        left: t111
                    }
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 913,
                    columnNumber: 82
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 913,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[187] = t111;
        $[188] = t112;
    } else {
        t112 = $[188];
    }
    let t113;
    if ($[189] !== t109 || $[190] !== t112) {
        t113 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t103,
                t109,
                t112
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 923,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[189] = t109;
        $[190] = t112;
        $[191] = t113;
    } else {
        t113 = $[191];
    }
    let t114;
    if ($[192] === Symbol.for("react.memo_cache_sentinel")) {
        t114 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Altcoin Sezonu"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 932,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[192] = t114;
    } else {
        t114 = $[192];
    }
    let t115;
    if ($[193] === Symbol.for("react.memo_cache_sentinel")) {
        t115 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t114,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-4 h-4 text-gray-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M9 5l7 7-7 7"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 939,
                            columnNumber: 208
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 939,
                        columnNumber: 115
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 939,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 939,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[193] = t115;
    } else {
        t115 = $[193];
    }
    let t116;
    if ($[194] !== altcoinSeason) {
        t116 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-2xl font-bold text-gray-900",
                children: [
                    altcoinSeason,
                    "/100"
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 946,
                columnNumber: 34
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 946,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[194] = altcoinSeason;
        $[195] = t116;
    } else {
        t116 = $[195];
    }
    let t117;
    if ($[196] === Symbol.for("react.memo_cache_sentinel")) {
        t117 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-300 via-green-300 to-green-500"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 954,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[196] = t117;
    } else {
        t117 = $[196];
    }
    const t118 = `${altcoinSeason}%`;
    let t119;
    if ($[197] !== t118) {
        t119 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative h-8 rounded-full overflow-hidden",
            children: [
                t117,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-0 bottom-0 w-1 bg-white shadow-lg",
                    style: {
                        left: t118
                    }
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 962,
                    columnNumber: 77
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 962,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[197] = t118;
        $[198] = t119;
    } else {
        t119 = $[198];
    }
    let t120;
    if ($[199] === Symbol.for("react.memo_cache_sentinel")) {
        t120 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-between mt-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-gray-600",
                    children: "Bitcoin"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 972,
                    columnNumber: 55
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-gray-600",
                    children: "Altcoin"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 972,
                    columnNumber: 109
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 972,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[199] = t120;
    } else {
        t120 = $[199];
    }
    let t121;
    if ($[200] !== t119) {
        t121 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative mt-2",
            children: [
                t119,
                t120
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 979,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[200] = t119;
        $[201] = t121;
    } else {
        t121 = $[201];
    }
    let t122;
    if ($[202] !== t116 || $[203] !== t121) {
        t122 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t115,
                t116,
                t121
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 987,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[202] = t116;
        $[203] = t121;
        $[204] = t122;
    } else {
        t122 = $[204];
    }
    let t123;
    if ($[205] === Symbol.for("react.memo_cache_sentinel")) {
        t123 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Ortalama Kripto RSI"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 996,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[205] = t123;
    } else {
        t123 = $[205];
    }
    let t124;
    if ($[206] === Symbol.for("react.memo_cache_sentinel")) {
        t124 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t123,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-4 h-4 text-gray-400",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M9 5l7 7-7 7"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 1003,
                            columnNumber: 208
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 1003,
                        columnNumber: 115
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 1003,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1003,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[206] = t124;
    } else {
        t124 = $[206];
    }
    let t125;
    if ($[207] !== averageRSI) {
        t125 = averageRSI.toFixed(2);
        $[207] = averageRSI;
        $[208] = t125;
    } else {
        t125 = $[208];
    }
    let t126;
    if ($[209] !== t125) {
        t126 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-2xl font-bold text-gray-900",
                children: t125
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 1018,
                columnNumber: 34
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1018,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[209] = t125;
        $[210] = t126;
    } else {
        t126 = $[210];
    }
    let t127;
    if ($[211] === Symbol.for("react.memo_cache_sentinel")) {
        t127 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 via-green-400 via-yellow-400 to-pink-500"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1026,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[211] = t127;
    } else {
        t127 = $[211];
    }
    const t128 = `${averageRSI}%`;
    let t129;
    if ($[212] !== t128) {
        t129 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative h-8 rounded-full overflow-hidden",
            children: [
                t127,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-0 bottom-0 w-1 bg-white shadow-lg",
                    style: {
                        left: t128
                    }
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1034,
                    columnNumber: 77
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1034,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[212] = t128;
        $[213] = t129;
    } else {
        t129 = $[213];
    }
    let t130;
    if ($[214] === Symbol.for("react.memo_cache_sentinel")) {
        t130 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-between mt-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-blue-600",
                    children: "Aşırı Satım"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1044,
                    columnNumber: 55
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-pink-600",
                    children: "Aşırı Alım"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1044,
                    columnNumber: 113
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1044,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[214] = t130;
    } else {
        t130 = $[214];
    }
    let t131;
    if ($[215] !== t129) {
        t131 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative mt-2",
            children: [
                t129,
                t130
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1051,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[215] = t129;
        $[216] = t131;
    } else {
        t131 = $[216];
    }
    let t132;
    if ($[217] !== t126 || $[218] !== t131) {
        t132 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t124,
                t126,
                t131
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1059,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[217] = t126;
        $[218] = t131;
        $[219] = t132;
    } else {
        t132 = $[219];
    }
    let t133;
    let t134;
    if ($[220] === Symbol.for("react.memo_cache_sentinel")) {
        t133 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-6 h-6 bg-gray-300 rounded-full"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1069,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        t134 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Coinpaper.com"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1070,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[220] = t133;
        $[221] = t134;
    } else {
        t133 = $[220];
        t134 = $[221];
    }
    let t135;
    if ($[222] === Symbol.for("react.memo_cache_sentinel")) {
        t135 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2 mb-2",
            children: [
                t133,
                t134,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                    className: "w-4 h-4 text-blue-500",
                    fill: "currentColor",
                    viewBox: "0 0 20 20",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        fillRule: "evenodd",
                        d: "M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
                        clipRule: "evenodd"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 1079,
                        columnNumber: 149
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1079,
                    columnNumber: 70
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-gray-500",
                    children: "3 saat"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1079,
                    columnNumber: 749
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1079,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[222] = t135;
    } else {
        t135 = $[222];
    }
    let t136;
    if ($[223] === Symbol.for("react.memo_cache_sentinel")) {
        t136 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t135,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm text-gray-700 line-clamp-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-yellow-500",
                            children: "❤️"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 1086,
                            columnNumber: 183
                        }, ("TURBOPACK compile-time value", void 0)),
                        " YENİ: #Visa, CEMEA bölgesinde #stablecoin ödeme hizmetlerini genişletmek için Aquanow ile ortaklık kurdu, veren ve alan kuruluşların..."
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1086,
                    columnNumber: 131
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1086,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[223] = t136;
    } else {
        t136 = $[223];
    }
    let t137;
    if ($[224] !== t113 || $[225] !== t122 || $[226] !== t132 || $[227] !== t97) {
        t137 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border-b border-gray-200 py-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full px-4",
                children: [
                    t86,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4",
                        children: [
                            t97,
                            t101,
                            t113,
                            t122,
                            t132,
                            t136
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 1093,
                        columnNumber: 102
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 1093,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1093,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[224] = t113;
        $[225] = t122;
        $[226] = t132;
        $[227] = t97;
        $[228] = t137;
    } else {
        t137 = $[228];
    }
    let t138;
    if ($[229] !== t137 || $[230] !== t71 || $[231] !== t72 || $[232] !== t85) {
        t138 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                t71,
                t72,
                t85,
                t137
            ]
        }, void 0, true);
        $[229] = t137;
        $[230] = t71;
        $[231] = t72;
        $[232] = t85;
        $[233] = t138;
    } else {
        t138 = $[233];
    }
    return t138;
};
_s(Navbar, "A3P2k8sViVrLkEQL3h0ogoeBeS8=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useLanguage"],
        __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Navbar;
const __TURBOPACK__default__export__ = Navbar;
function _temp(e) {
    return e.stopPropagation();
}
function _temp2(e_0) {
    return e_0.stopPropagation();
}
function _temp3(e_1) {
    return e_1.stopPropagation();
}
function _temp4(e_2) {
    return e_2.stopPropagation();
}
function _temp5() {
    window.location.reload();
}
function _temp6(e_5) {
    return e_5.stopPropagation();
}
var _c;
__turbopack_context__.k.register(_c, "Navbar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/compiler-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/contexts/LanguageContext.tsx [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
const MarketStatsBar = (t0)=>{
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["c"])(75);
    if ($[0] !== "a20dd32717643d269a93a599eb3a04ec54009d3b04ba25d7e84171dff6310948") {
        for(let $i = 0; $i < 75; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "a20dd32717643d269a93a599eb3a04ec54009d3b04ba25d7e84171dff6310948";
    }
    const { marketStats } = t0;
    const { t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useLanguage"])();
    if (!marketStats) {
        return null;
    }
    const formatNumber = _temp;
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = (num_0)=>{
            if (num_0 >= 1000000000000) {
                return "$" + (num_0 / 1000000000000).toFixed(2) + "T";
            } else {
                if (num_0 >= 1000000000) {
                    return "$" + (num_0 / 1000000000).toFixed(2) + "B";
                }
            }
            return "$" + formatNumber(num_0);
        };
        $[1] = t1;
    } else {
        t1 = $[1];
    }
    const formatTrillion = t1;
    let t2;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = (num_1)=>{
            if (num_1 >= 1000000) {
                return (num_1 / 1000000).toFixed(2) + "M";
            }
            return formatNumber(num_1);
        };
        $[2] = t2;
    } else {
        t2 = $[2];
    }
    const formatCoins = t2;
    let t3;
    if ($[3] !== t) {
        t3 = t("stats.marketCap");
        $[3] = t;
        $[4] = t3;
    } else {
        t3 = $[4];
    }
    let t4;
    if ($[5] !== t3) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white opacity-90",
            children: [
                t3,
                ":"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 75,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[5] = t3;
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    const t5 = formatTrillion(marketStats.marketCap);
    let t6;
    if ($[7] !== t5) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white font-semibold",
            children: t5
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 84,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[7] = t5;
        $[8] = t6;
    } else {
        t6 = $[8];
    }
    let t7;
    if ($[9] !== marketStats.marketCapChange24h) {
        t7 = marketStats.marketCapChange24h !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: `text-xs font-semibold ${marketStats.marketCapChange24h >= 0 ? "text-green-300" : "text-red-300"}`,
            children: [
                marketStats.marketCapChange24h >= 0 ? "\u25B2" : "\u25BC",
                " ",
                Math.abs(marketStats.marketCapChange24h).toFixed(2),
                "%"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 92,
            columnNumber: 58
        }, ("TURBOPACK compile-time value", void 0));
        $[9] = marketStats.marketCapChange24h;
        $[10] = t7;
    } else {
        t7 = $[10];
    }
    let t8;
    if ($[11] !== t4 || $[12] !== t6 || $[13] !== t7) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2 whitespace-nowrap shrink-0",
            children: [
                t4,
                t6,
                t7
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 100,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[11] = t4;
        $[12] = t6;
        $[13] = t7;
        $[14] = t8;
    } else {
        t8 = $[14];
    }
    let t9;
    if ($[15] !== t) {
        t9 = t("stats.volume24h");
        $[15] = t;
        $[16] = t9;
    } else {
        t9 = $[16];
    }
    let t10;
    if ($[17] !== t9) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white opacity-90",
            children: [
                t9,
                ":"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 118,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[17] = t9;
        $[18] = t10;
    } else {
        t10 = $[18];
    }
    const t11 = formatTrillion(marketStats.volume24h);
    let t12;
    if ($[19] !== t11) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white font-semibold",
            children: t11
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 127,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[19] = t11;
        $[20] = t12;
    } else {
        t12 = $[20];
    }
    let t13;
    if ($[21] !== t10 || $[22] !== t12) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2 whitespace-nowrap shrink-0",
            children: [
                t10,
                t12
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 135,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[21] = t10;
        $[22] = t12;
        $[23] = t13;
    } else {
        t13 = $[23];
    }
    let t14;
    if ($[24] !== t) {
        t14 = t("stats.activeCoins");
        $[24] = t;
        $[25] = t14;
    } else {
        t14 = $[25];
    }
    let t15;
    if ($[26] !== t14) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white opacity-90",
            children: [
                t14,
                ":"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 152,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[26] = t14;
        $[27] = t15;
    } else {
        t15 = $[27];
    }
    let t16;
    if ($[28] !== marketStats.totalCoins) {
        t16 = formatCoins(marketStats.totalCoins);
        $[28] = marketStats.totalCoins;
        $[29] = t16;
    } else {
        t16 = $[29];
    }
    let t17;
    if ($[30] !== t16) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white font-semibold",
            children: t16
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 168,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[30] = t16;
        $[31] = t17;
    } else {
        t17 = $[31];
    }
    let t18;
    if ($[32] !== t15 || $[33] !== t17) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2 whitespace-nowrap shrink-0",
            children: [
                t15,
                t17
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 176,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[32] = t15;
        $[33] = t17;
        $[34] = t18;
    } else {
        t18 = $[34];
    }
    let t19;
    if ($[35] !== t) {
        t19 = t("stats.btcDominance");
        $[35] = t;
        $[36] = t19;
    } else {
        t19 = $[36];
    }
    let t20;
    if ($[37] !== t19) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white opacity-90",
            children: [
                "BTC ",
                t19,
                ":"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 193,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[37] = t19;
        $[38] = t20;
    } else {
        t20 = $[38];
    }
    let t21;
    if ($[39] !== marketStats.btcDominance) {
        t21 = typeof marketStats.btcDominance === "number" ? marketStats.btcDominance.toFixed(1) : marketStats.btcDominance;
        $[39] = marketStats.btcDominance;
        $[40] = t21;
    } else {
        t21 = $[40];
    }
    let t22;
    if ($[41] !== t21) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white font-semibold",
            children: [
                t21,
                "%"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 209,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[41] = t21;
        $[42] = t22;
    } else {
        t22 = $[42];
    }
    let t23;
    if ($[43] !== t20 || $[44] !== t22) {
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2 whitespace-nowrap shrink-0",
            children: [
                t20,
                t22
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 217,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[43] = t20;
        $[44] = t22;
        $[45] = t23;
    } else {
        t23 = $[45];
    }
    let t24;
    if ($[46] !== t) {
        t24 = t("stats.ethDominance");
        $[46] = t;
        $[47] = t24;
    } else {
        t24 = $[47];
    }
    let t25;
    if ($[48] !== t24) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white opacity-90",
            children: [
                "ETH ",
                t24,
                ":"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 234,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[48] = t24;
        $[49] = t25;
    } else {
        t25 = $[49];
    }
    let t26;
    if ($[50] !== marketStats.ethDominance) {
        t26 = typeof marketStats.ethDominance === "number" ? marketStats.ethDominance.toFixed(1) : marketStats.ethDominance;
        $[50] = marketStats.ethDominance;
        $[51] = t26;
    } else {
        t26 = $[51];
    }
    let t27;
    if ($[52] !== t26) {
        t27 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white font-semibold",
            children: [
                t26,
                "%"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 250,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[52] = t26;
        $[53] = t27;
    } else {
        t27 = $[53];
    }
    let t28;
    if ($[54] !== t25 || $[55] !== t27) {
        t28 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2 whitespace-nowrap shrink-0",
            children: [
                t25,
                t27
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 258,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[54] = t25;
        $[55] = t27;
        $[56] = t28;
    } else {
        t28 = $[56];
    }
    let t29;
    if ($[57] !== t) {
        t29 = t("stats.gasPrice");
        $[57] = t;
        $[58] = t29;
    } else {
        t29 = $[58];
    }
    let t30;
    if ($[59] !== t29) {
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white opacity-90",
            children: [
                t29,
                ":"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 275,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[59] = t29;
        $[60] = t30;
    } else {
        t30 = $[60];
    }
    let t31;
    if ($[61] !== marketStats.gasPrice) {
        t31 = marketStats.gasPrice.toFixed(2);
        $[61] = marketStats.gasPrice;
        $[62] = t31;
    } else {
        t31 = $[62];
    }
    let t32;
    if ($[63] !== t31) {
        t32 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-white font-semibold",
            children: [
                t31,
                " GWEI"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 291,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[63] = t31;
        $[64] = t32;
    } else {
        t32 = $[64];
    }
    let t33;
    if ($[65] !== t30 || $[66] !== t32) {
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2 whitespace-nowrap shrink-0",
            children: [
                t30,
                t32
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 299,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[65] = t30;
        $[66] = t32;
        $[67] = t33;
    } else {
        t33 = $[67];
    }
    let t34;
    if ($[68] !== t13 || $[69] !== t18 || $[70] !== t23 || $[71] !== t28 || $[72] !== t33 || $[73] !== t8) {
        t34 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#2563EB] via-[#1E40AF] to-[#1E3A8A] text-white z-50 border-t border-blue-600/50 shadow-lg",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full px-4 py-3",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-nowrap items-center gap-6 text-xs overflow-x-auto scrollbar-hide",
                    children: [
                        t8,
                        t13,
                        t18,
                        t23,
                        t28,
                        t33
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
                    lineNumber: 308,
                    columnNumber: 205
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
                lineNumber: 308,
                columnNumber: 171
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx",
            lineNumber: 308,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[68] = t13;
        $[69] = t18;
        $[70] = t23;
        $[71] = t28;
        $[72] = t33;
        $[73] = t8;
        $[74] = t34;
    } else {
        t34 = $[74];
    }
    return t34;
};
_s(MarketStatsBar, "NOb/gJCLVjznRzrG0IpBeuqUR5k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useLanguage"]
    ];
});
_c = MarketStatsBar;
const __TURBOPACK__default__export__ = MarketStatsBar;
function _temp(num) {
    if (num >= 1000000000000) {
        return (num / 1000000000000).toFixed(2) + "T";
    } else {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(2) + "B";
        } else {
            if (num >= 1000000) {
                return (num / 1000000).toFixed(2) + "M";
            } else {
                if (num >= 1000) {
                    return (num / 1000).toFixed(2) + "K";
                }
            }
        }
    }
    return num.toFixed(2);
}
var _c;
__turbopack_context__.k.register(_c, "MarketStatsBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/my-crypto-tracker/src/components/SignupAlert.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/compiler-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
const SignupAlert = (t0)=>{
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["c"])(26);
    if ($[0] !== "2aa512c66f951cd79984abaa8121a51ad103671ff590e44b67f036582b478051") {
        for(let $i = 0; $i < 26; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "2aa512c66f951cd79984abaa8121a51ad103671ff590e44b67f036582b478051";
    }
    const { onClose, onDontShowAgain } = t0;
    const [isVisible, setIsVisible] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    let t1;
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = ()=>{
            const timer = setTimeout(()=>{
                setIsVisible(true);
            }, 5000);
            return ()=>clearTimeout(timer);
        };
        t2 = [];
        $[1] = t1;
        $[2] = t2;
    } else {
        t1 = $[1];
        t2 = $[2];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t1, t2);
    let t3;
    if ($[3] !== onClose || $[4] !== onDontShowAgain) {
        t3 = ()=>{
            onDontShowAgain();
            onClose();
        };
        $[3] = onClose;
        $[4] = onDontShowAgain;
        $[5] = t3;
    } else {
        t3 = $[5];
    }
    const handleDontShowAgain = t3;
    if (!isVisible) {
        return null;
    }
    let t4;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 opacity-20",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute top-0 left-0 w-full h-full",
                style: {
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
                    backgroundRepeat: "repeat"
                }
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                lineNumber: 55,
                columnNumber: 55
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 55,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[6] = t4;
    } else {
        t4 = $[6];
    }
    let t5;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-3",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-2xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent",
                    children: "DijitalMarketim"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 65,
                    columnNumber: 118
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                lineNumber: 65,
                columnNumber: 51
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 65,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[7] = t5;
    } else {
        t5 = $[7];
    }
    let t6;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-6 h-6",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M6 18L18 6M6 6l12 12"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                lineNumber: 72,
                columnNumber: 89
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 72,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[8] = t6;
    } else {
        t6 = $[8];
    }
    let t7;
    if ($[9] !== onClose) {
        t7 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-gradient-to-r from-blue-600 via-yellow-500 via-red-500 to-green-600 px-6 py-4 relative overflow-hidden",
            children: [
                t4,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative z-10 flex items-center justify-between",
                    children: [
                        t5,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: onClose,
                            className: "text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-lg",
                            children: t6
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 79,
                            columnNumber: 206
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 79,
                    columnNumber: 137
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 79,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[9] = onClose;
        $[10] = t7;
    } else {
        t7 = $[10];
    }
    let t8;
    let t9;
    if ($[11] === Symbol.for("react.memo_cache_sentinel")) {
        t8 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
            className: "text-2xl font-bold text-gray-900 mb-2",
            children: "Kripto Yolculuğunuza Başlayın! 🚀"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 88,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t9 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-gray-600 mb-6",
            children: "Ücretsiz hesap oluşturarak kripto para piyasasını takip edin ve yatırımlarınızı yönetin."
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 89,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[11] = t8;
        $[12] = t9;
    } else {
        t8 = $[11];
        t9 = $[12];
    }
    let t10;
    if ($[13] === Symbol.for("react.memo_cache_sentinel")) {
        t10 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-start gap-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-5 h-5 text-white",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 98,
                            columnNumber: 276
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                        lineNumber: 98,
                        columnNumber: 186
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 98,
                    columnNumber: 51
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "font-semibold text-gray-900",
                            children: "Portföyünüzü Oluşturun"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 98,
                            columnNumber: 412
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-gray-600",
                            children: "Yatırımlarınızı takip edin ve performansınızı analiz edin"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 98,
                            columnNumber: 483
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 98,
                    columnNumber: 407
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 98,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[13] = t10;
    } else {
        t10 = $[13];
    }
    let t11;
    if ($[14] === Symbol.for("react.memo_cache_sentinel")) {
        t11 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-start gap-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-5 h-5 text-white",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeWidth: 2,
                                d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                                lineNumber: 105,
                                columnNumber: 276
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                strokeLinecap: "round",
                                strokeLinejoin: "round",
                                strokeWidth: 2,
                                d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                                lineNumber: 105,
                                columnNumber: 382
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                        lineNumber: 105,
                        columnNumber: 186
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 105,
                    columnNumber: 51
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "font-semibold text-gray-900",
                            children: "İzleme Listesi"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 105,
                            columnNumber: 592
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-gray-600",
                            children: "Favori coin'lerinizi kaydedin ve anlık fiyat bildirimleri alın"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 105,
                            columnNumber: 655
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 105,
                    columnNumber: 587
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 105,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[14] = t11;
    } else {
        t11 = $[14];
    }
    let t12;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
        t12 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-start gap-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-8 h-8 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                        className: "w-5 h-5 text-white",
                        fill: "none",
                        stroke: "currentColor",
                        viewBox: "0 0 24 24",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M13 10V3L4 14h7v7l9-11h-7z"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 112,
                            columnNumber: 274
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                        lineNumber: 112,
                        columnNumber: 184
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 112,
                    columnNumber: 51
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "font-semibold text-gray-900",
                            children: "Gelişmiş Grafikler"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 112,
                            columnNumber: 391
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm text-gray-600",
                            children: "Detaylı teknik analiz araçları ile piyasayı derinlemesine inceleyin"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 112,
                            columnNumber: 458
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 112,
                    columnNumber: 386
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 112,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[15] = t12;
    } else {
        t12 = $[15];
    }
    let t13;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "space-y-3 mb-6",
            children: [
                t10,
                t11,
                t12,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-start gap-3",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5 text-white",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                                    lineNumber: 119,
                                    columnNumber: 321
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                                lineNumber: 119,
                                columnNumber: 231
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 119,
                            columnNumber: 98
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "font-semibold text-gray-900",
                                    children: "Gerçek Zamanlı Veriler"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                                    lineNumber: 119,
                                    columnNumber: 455
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-600",
                                    children: "Anlık fiyat güncellemeleri ve piyasa haberleri"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                                    lineNumber: 119,
                                    columnNumber: 526
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                            lineNumber: 119,
                            columnNumber: 450
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 119,
                    columnNumber: 58
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 119,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[16] = t13;
    } else {
        t13 = $[16];
    }
    let t14;
    if ($[17] === Symbol.for("react.memo_cache_sentinel")) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex flex-col sm:flex-row gap-3",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: _temp,
                    className: "flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200",
                    children: "Ücretsiz Kayıt Ol"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 126,
                    columnNumber: 60
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: _temp2,
                    className: "flex-1 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200",
                    children: "Giriş Yap"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 126,
                    columnNumber: 308
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 126,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[17] = t14;
    } else {
        t14 = $[17];
    }
    let t15;
    if ($[18] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "font-semibold text-gray-700",
            children: "Kullanım Koşulları"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 133,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[18] = t15;
    } else {
        t15 = $[18];
    }
    let t16;
    if ($[19] === Symbol.for("react.memo_cache_sentinel")) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "text-xs text-gray-500 text-center mt-4",
            children: [
                "Hesap oluşturarak ",
                t15,
                " ve ",
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "font-semibold text-gray-700",
                    children: "Gizlilik Politikası"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 140,
                    columnNumber: 92
                }, ("TURBOPACK compile-time value", void 0)),
                "'nı kabul etmiş olursunuz."
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 140,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[19] = t16;
    } else {
        t16 = $[19];
    }
    let t17;
    if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
        t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: "w-4 h-4",
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                strokeLinecap: "round",
                strokeLinejoin: "round",
                strokeWidth: 2,
                d: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                lineNumber: 147,
                columnNumber: 90
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 147,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[20] = t17;
    } else {
        t17 = $[20];
    }
    let t18;
    if ($[21] !== handleDontShowAgain) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "px-6 py-6",
            children: [
                t8,
                t9,
                t13,
                t14,
                t16,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "mt-4 pt-4 border-t border-gray-200",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleDontShowAgain,
                        className: "w-full text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-2 py-2",
                        children: [
                            t17,
                            "Bir daha gösterme"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                        lineNumber: 154,
                        columnNumber: 113
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                    lineNumber: 154,
                    columnNumber: 61
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 154,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[21] = handleDontShowAgain;
        $[22] = t18;
    } else {
        t18 = $[22];
    }
    let t19;
    if ($[23] !== t18 || $[24] !== t7) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 scale-100",
                children: [
                    t7,
                    t18
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
                lineNumber: 162,
                columnNumber: 132
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/SignupAlert.tsx",
            lineNumber: 162,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[23] = t18;
        $[24] = t7;
        $[25] = t19;
    } else {
        t19 = $[25];
    }
    return t19;
};
_s(SignupAlert, "J3yJOyGdBT4L7hs1p1XQYVGMdrY=");
_c = SignupAlert;
const __TURBOPACK__default__export__ = SignupAlert;
function _temp() {
    window.location.href = "/register";
}
function _temp2() {
    window.location.href = "/login";
}
var _c;
__turbopack_context__.k.register(_c, "SignupAlert");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/my-crypto-tracker/src/pages/index.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/head.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$Navbar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/components/Navbar.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$MarketStatsBar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$SignupAlert$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/components/SignupAlert.tsx [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
const HomePage = ()=>{
    _s();
    const [coins, setCoins] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [highlightsEnabled, setHighlightsEnabled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [openDropdown, setOpenDropdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [selectedNetwork, setSelectedNetwork] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('all');
    const [sortBy, setSortBy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showFiltersModal, setShowFiltersModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showColumnsModal, setShowColumnsModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [displayedCoins, setDisplayedCoins] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(30);
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const tableRef = __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"].useRef(null);
    const [fearGreedIndex, setFearGreedIndex] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(50);
    const [averageRSI, setAverageRSI] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(47.48);
    const [fearGreedClassification, setFearGreedClassification] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('Neutral');
    const [portfolio, setPortfolio] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        "HomePage.useState": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                const saved = localStorage.getItem('portfolio');
                return saved ? JSON.parse(saved) : [];
            }
            //TURBOPACK unreachable
            ;
        }
    }["HomePage.useState"]);
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        message: '',
        visible: false
    });
    // localStorage'dan "bir daha gösterme" tercihini kontrol et
    const [showSignupAlert, setShowSignupAlert] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        "HomePage.useState": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                const dontShowAgain = localStorage.getItem('dontShowSignupAlert');
                return dontShowAgain !== 'true';
            }
            //TURBOPACK unreachable
            ;
        }
    }["HomePage.useState"]);
    const handleDontShowAgain = ()=>{
        localStorage.setItem('dontShowSignupAlert', 'true');
        setShowSignupAlert(false);
    };
    const [marketStats, setMarketStats] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        totalCoins: 0,
        totalExchanges: 1414,
        marketCap: 0,
        marketCapChange24h: 0,
        volume24h: 0,
        btcDominance: 0,
        ethDominance: 0,
        gasPrice: 0.518
    });
    // CoinGecko Global API'den veri çekme fonksiyonu
    const fetchGlobalStats = async ()=>{
        try {
            // Timeout için AbortController kullan (browser uyumluluğu için)
            const controller = new AbortController();
            const timeoutId = setTimeout(()=>controller.abort(), 15000);
            const response = await fetch('/api/global', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                console.warn(`Global API yanıt hatası: ${response.status}`);
                // Hata durumunda mevcut verileri koru
                return;
            }
            const data = await response.json();
            if (data.error) {
                console.warn('Global API hatası:', data.error, data.details || '');
                // Hata durumunda mevcut verileri koru, sıfırlama
                return;
            }
            // Verileri güncelle
            setMarketStats({
                totalCoins: data.totalCoins || 0,
                totalExchanges: data.totalExchanges || 0,
                marketCap: data.marketCap || 0,
                marketCapChange24h: data.marketCapChange24h || 0,
                volume24h: data.volume24h || 0,
                btcDominance: data.btcDominance || 0,
                ethDominance: data.ethDominance || 0,
                gasPrice: 0.518 // Gas fiyatı için ayrı API gerekebilir
            });
        } catch (error) {
            // AbortError (timeout) veya network hatası
            if (error instanceof Error && error.name === 'AbortError') {
                console.warn('Global API timeout - veri çekme çok uzun sürdü');
            } else {
                console.error('Global stats çekme hatası:', error);
            }
        // Hata durumunda mevcut verileri koru, sessizce devam et
        }
    };
    // Kendi API'mizden veri çekme fonksiyonu
    const fetchCoins = async ()=>{
        setLoading(true);
        setError(null);
        try {
            // Oluşturduğunuz /api/coins rotasını çağırıyoruz
            const response = await fetch('/api/coins');
            if (!response.ok) {
                throw new Error(`API hatası: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                setError(data.error);
                setCoins([]);
            } else {
                // Duplicate'leri filtrele - hem ID hem symbol bazlı kontrol
                // Önce ID bazlı unique yap, sonra symbol bazlı unique yap
                const coinMapById = new Map();
                // İlk adım: ID bazlı duplicate'leri filtrele
                (data || []).forEach((coin)=>{
                    const normalizedId = coin.id.toLowerCase().trim();
                    const existing = coinMapById.get(normalizedId);
                    if (!existing || coin.market_cap > existing.market_cap) {
                        coinMapById.set(normalizedId, coin);
                    }
                });
                // İkinci adım: Symbol bazlı duplicate'leri filtrele (BTC, ETH gibi)
                const coinMapBySymbol = new Map();
                Array.from(coinMapById.values()).forEach((coin)=>{
                    const normalizedSymbol = coin.symbol.toLowerCase().trim();
                    const existing = coinMapBySymbol.get(normalizedSymbol);
                    if (!existing || coin.market_cap > existing.market_cap) {
                        coinMapBySymbol.set(normalizedSymbol, coin);
                    }
                });
                // Map'ten array'e çevir ve market_cap'e göre sırala
                const uniqueCoins = Array.from(coinMapBySymbol.values()).sort((a, b)=>b.market_cap - a.market_cap);
                setCoins(uniqueCoins);
            }
        } catch (error) {
            console.error("Frontend veri çekme hatası:", error);
            setError('Veri yüklenirken bir hata oluştu.');
            setCoins([]);
        } finally{
            setLoading(false);
        }
    };
    // Fear & Greed Index güncelleme - CNN/Alternative.me API'den
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HomePage.useEffect": ()=>{
            const fetchFearGreed = {
                "HomePage.useEffect.fetchFearGreed": async ()=>{
                    try {
                        const response = await fetch('/api/fear-greed');
                        const data = await response.json();
                        if (data.value !== undefined) {
                            setFearGreedIndex(data.value);
                            setFearGreedClassification(data.classification || 'Neutral');
                        }
                    } catch (error) {
                        console.error('Fear & Greed veri çekme hatası:', error);
                        // Hata durumunda varsayılan değer
                        setFearGreedIndex(50);
                        setFearGreedClassification('Neutral');
                    }
                }
            }["HomePage.useEffect.fetchFearGreed"];
            fetchFearGreed();
            const interval = setInterval(fetchFearGreed, 5 * 60 * 1000); // Her 5 dakikada bir güncelle
            return ({
                "HomePage.useEffect": ()=>clearInterval(interval)
            })["HomePage.useEffect"];
        }
    }["HomePage.useEffect"], []);
    // Average RSI simülasyonu (gerçek uygulamada API'den gelecek)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HomePage.useEffect": ()=>{
            // RSI değerini 30-70 arasında simüle et
            const simulateRSI = {
                "HomePage.useEffect.simulateRSI": ()=>{
                    const baseRSI = 47.48;
                    const variation = (Math.random() - 0.5) * 5; // -2.5 ile +2.5 arası varyasyon
                    const newRSI = Math.max(30, Math.min(70, baseRSI + variation));
                    setAverageRSI(newRSI);
                }
            }["HomePage.useEffect.simulateRSI"];
            simulateRSI();
            const interval = setInterval(simulateRSI, 60000); // Her 1 dakikada bir güncelle
            return ({
                "HomePage.useEffect": ()=>clearInterval(interval)
            })["HomePage.useEffect"];
        }
    }["HomePage.useEffect"], []);
    // Portfolio değiştiğinde localStorage'a kaydet
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HomePage.useEffect": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                localStorage.setItem('portfolio', JSON.stringify(portfolio));
            }
        }
    }["HomePage.useEffect"], [
        portfolio
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HomePage.useEffect": ()=>{
            // İlk yüklemede hem coin'leri hem global stats'ı çek
            fetchGlobalStats();
            fetchCoins();
            // Global stats'ı her 60 saniyede bir güncelle
            const globalIntervalId = setInterval(fetchGlobalStats, 60000);
            // Tabloyu her 30 saniyede bir güncelleyelim (Kullanıcıya canlı hissi vermek için)
            const coinsIntervalId = setInterval(fetchCoins, 30000);
            // 5 saniye sonra signup alert'i göster (eğer kullanıcı "bir daha gösterme" demediyse)
            let signupTimer = null;
            const dontShowAgain = localStorage.getItem('dontShowSignupAlert');
            if (dontShowAgain !== 'true') {
                signupTimer = setTimeout({
                    "HomePage.useEffect": ()=>{
                        setShowSignupAlert(true);
                    }
                }["HomePage.useEffect"], 5000);
            }
            return ({
                "HomePage.useEffect": ()=>{
                    clearInterval(globalIntervalId);
                    clearInterval(coinsIntervalId);
                    if (signupTimer) {
                        clearTimeout(signupTimer);
                    }
                }
            })["HomePage.useEffect"];
        }
    }["HomePage.useEffect"], []);
    // Sayfa değiştiğinde scroll to top (sadece currentPage değiştiğinde, displayedCoins değiştiğinde değil)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HomePage.useEffect": ()=>{
            if (tableRef.current && displayedCoins > 30) {
                // Sadece sayfalama modunda ve sayfa değiştiğinde scroll yap
                tableRef.current.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }
    }["HomePage.useEffect"], [
        currentPage
    ]); // Sadece currentPage değiştiğinde tetikle (displayedCoins değiştiğinde scroll yapma)
    // --- Yardımcı Fonksiyonlar ---
    const formatCurrency = (amount)=>{
        if (amount == null || isNaN(amount)) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: amount < 1 ? 6 : 2
        }).format(amount);
    };
    // Grafik verilerini oluştur - Daha detaylı ve gerçekçi grafikler
    const generateSparklineData = (coinId, currentPrice, change24h)=>{
        const points = 168; // 7 gün x 24 saat = 168 nokta (daha detaylı grafik)
        const data = [];
        // Coin id'sine göre sabit seed (her coin için tutarlı veri)
        let seed = 0;
        for(let i = 0; i < coinId.length; i++){
            seed += coinId.charCodeAt(i);
        }
        seed = Math.abs(seed);
        // 7 günlük değişime göre başlangıç fiyatını hesapla
        const sevenDayChangePercent = change24h * 7 / 100;
        const startPrice = currentPrice / (1 + sevenDayChangePercent);
        // CoinGecko gibi çok minimal volatilite - sadece hafif varyasyon
        const maxVariation = currentPrice * 0.015; // %1.5 maksimum varyasyon
        // Basit deterministik varyasyon (her coin için farklı ama tutarlı)
        const getSmoothVariation = (index)=>{
            // Çok yumuşak sinüs dalgası (CoinGecko benzeri pürüzsüz eğri)
            const wave = Math.sin((seed + index) * 0.8) * 0.5;
            return wave * maxVariation * 0.4; // Çok minimal varyasyon
        };
        // Her nokta için pürüzsüz ve detaylı eğri oluştur
        for(let i = 0; i < points; i++){
            const t = i / (points - 1); // 0'dan 1'e progress
            // Ana trend: başlangıçtan mevcut fiyata eğimli geçiş
            const linearPrice = startPrice + (currentPrice - startPrice) * t;
            // Daha gerçekçi varyasyon (günlük döngüler ve deterministik dalgalanmalar)
            const dailyCycle = Math.sin(t * 7 * Math.PI * 2) * 0.02; // Günlük döngü
            const smoothVariation = getSmoothVariation(i);
            // Deterministik "rastgele" varyasyon (seed kullanarak)
            const pseudoRandom = Math.sin(seed * 0.001 + i * 0.1) * 0.5 + 0.5;
            const deterministicVariation = (pseudoRandom - 0.5) * maxVariation * 0.1;
            const price = linearPrice + smoothVariation + linearPrice * dailyCycle + deterministicVariation;
            // Fiyat aralığını kontrol et
            const priceDiff = Math.abs(currentPrice - startPrice);
            const minPrice = Math.min(startPrice, currentPrice) - priceDiff * 0.15;
            const maxPrice = Math.max(startPrice, currentPrice) + priceDiff * 0.15;
            data.push(Math.max(minPrice, Math.min(maxPrice, price)));
        }
        return data;
    };
    // Grafik verilerini state olarak sakla
    const [chartDataCache, setChartDataCache] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(new Map());
    // Grafik verilerini oluştur (simüle edilmiş - API yükünü azaltmak için)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HomePage.useEffect": ()=>{
            if (coins.length === 0) return;
            const newCache = new Map();
            coins.forEach({
                "HomePage.useEffect": (coin)=>{
                    newCache.set(coin.id, generateSparklineData(coin.id, coin.current_price, coin.price_change_percentage_24h));
                }
            }["HomePage.useEffect"]);
            setChartDataCache(newCache);
        }
    }["HomePage.useEffect"], [
        coins
    ]);
    // Sayfa değiştiğinde scroll'u tablonun başına getir
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "HomePage.useEffect": ()=>{
            if (displayedCoins > 30 && tableRef.current) {
                tableRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }["HomePage.useEffect"], [
        currentPage,
        displayedCoins
    ]);
    // Filtrelenmiş ve sıralanmış coin listesi
    const filteredAndSortedCoins = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "HomePage.useMemo[filteredAndSortedCoins]": ()=>{
            let filtered = [
                ...coins
            ];
            // Network filtresi (şimdilik sadece görsel, gerçek filtreleme için coin verilerinde network bilgisi gerekir)
            // Bu örnekte tüm coin'leri gösteriyoruz, gerçek uygulamada coin.platform veya coin.network gibi bir alan olmalı
            if (selectedNetwork !== 'all') {
                // Örnek: Ethereum coin'leri için symbol veya id kontrolü
                // Gerçek uygulamada coin.platforms veya coin.network bilgisi kullanılmalı
                filtered = filtered.filter({
                    "HomePage.useMemo[filteredAndSortedCoins]": (coin)=>{
                        const symbol = coin.symbol.toLowerCase();
                        const id = coin.id.toLowerCase();
                        switch(selectedNetwork){
                            case 'ethereum':
                                return id.includes('ethereum') || symbol === 'eth' || id.includes('erc20');
                            case 'solana':
                                return id.includes('solana') || symbol === 'sol' || id.includes('spl');
                            case 'basic':
                                return symbol === 'btc' || symbol === 'eth' || symbol === 'bnb';
                            case 'license':
                                // Lisanslı coin'ler için özel kontrol (örnek)
                                return coin.market_cap > 1000000000;
                            // 1B+ market cap
                            default:
                                return true;
                        }
                    }
                }["HomePage.useMemo[filteredAndSortedCoins]"]);
            }
            // Sıralama
            if (sortBy) {
                filtered.sort({
                    "HomePage.useMemo[filteredAndSortedCoins]": (a, b)=>{
                        switch(sortBy){
                            case 'market_cap':
                                return b.market_cap - a.market_cap;
                            case 'volume_24h':
                                return b.total_volume - a.total_volume;
                            default:
                                return 0;
                        }
                    }
                }["HomePage.useMemo[filteredAndSortedCoins]"]);
            } else {
                // Varsayılan sıralama: market cap
                filtered.sort({
                    "HomePage.useMemo[filteredAndSortedCoins]": (a, b)=>b.market_cap - a.market_cap
                }["HomePage.useMemo[filteredAndSortedCoins]"]);
            }
            return filtered;
        }
    }["HomePage.useMemo[filteredAndSortedCoins]"], [
        coins,
        selectedNetwork,
        sortBy
    ]);
    // Sayfalama için coin'leri hesapla
    const coinsPerPage = 60;
    const totalPages = Math.ceil(filteredAndSortedCoins.length / coinsPerPage);
    const startIndex = (currentPage - 1) * coinsPerPage;
    const endIndex = startIndex + coinsPerPage;
    // İlk 30 coin göster, sonra sayfalama
    let displayedCoinsList;
    if (displayedCoins <= 30) {
        // Default: İlk 30 coin göster
        displayedCoinsList = filteredAndSortedCoins.slice(0, 30);
    } else {
        // Sayfalama aktif (60 coin per page)
        displayedCoinsList = filteredAndSortedCoins.slice(startIndex, endIndex);
    }
    // Format number helper
    const formatNumber = (num, decimals = 0)=>{
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    };
    const formatTrillion = (num)=>{
        if (num >= 1e12) {
            return (num / 1e12).toFixed(3) + ' Tn';
        } else if (num >= 1e9) {
            return (num / 1e9).toFixed(3) + ' Mr';
        }
        return formatNumber(num);
    };
    const formatTrillionWithComma = (num)=>{
        if (num >= 1e12) {
            const trillions = (num / 1e12).toFixed(2);
            return trillions.replace('.', ',') + ' Trilyon';
        }
        return formatNumber(num);
    };
    // --- YÜKLEME VE HATA DURUMLARI ---
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-center p-10 text-gray-700 bg-white",
        children: "Yükleniyor..."
    }, void 0, false, {
        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
        lineNumber: 435,
        columnNumber: 23
    }, ("TURBOPACK compile-time value", void 0));
    if (error) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-center p-10 text-red-600 bg-white",
        children: [
            "Hata: ",
            error
        ]
    }, void 0, true, {
        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
        lineNumber: 436,
        columnNumber: 21
    }, ("TURBOPACK compile-time value", void 0));
    if (!coins.length) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-center p-10 text-yellow-600 bg-white",
        children: "Veri bulunamadı. Veritabanınızda coin verisi var mı?"
    }, void 0, false, {
        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
        lineNumber: 437,
        columnNumber: 29
    }, ("TURBOPACK compile-time value", void 0));
    // --- TABLO GÖSTERİMİ (Tailwind CSS Kullanılarak) ---
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-white pb-14",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                    children: "Dijital Marketim | Kripto Fiyatları"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                    lineNumber: 442,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 441,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            showSignupAlert && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$SignupAlert$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                onClose: ()=>setShowSignupAlert(false),
                onDontShowAgain: handleDontShowAgain
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 446,
                columnNumber: 27
            }, ("TURBOPACK compile-time value", void 0)),
            toast.visible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "fixed bottom-4 right-4 z-50 animate-slide-in-right",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-gradient-to-r from-blue-500 via-yellow-500 via-red-500 to-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-shrink-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-6 h-6",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M5 13l4 4L19 7"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 453,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                lineNumber: 452,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 451,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-semibold text-sm",
                                children: toast.message
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                lineNumber: 457,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 456,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setToast({
                                    message: '',
                                    visible: false
                                }),
                            className: "flex-shrink-0 text-white/80 hover:text-white transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 464,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                lineNumber: 463,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 459,
                            columnNumber: 17
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                    lineNumber: 450,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 449,
                columnNumber: 25
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$Navbar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                marketStats: marketStats,
                fearGreedIndex: fearGreedIndex,
                fearGreedClassification: fearGreedClassification,
                averageRSI: averageRSI,
                altcoinSeason: 25
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 471,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "py-20 bg-gradient-to-b from-white via-blue-50/30 to-yellow-50/30",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full px-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center mb-12",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-bold text-gray-900 mb-4",
                                    children: [
                                        "Popüler ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 bg-clip-text text-transparent",
                                            children: "Coin'ler"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 478,
                                            columnNumber: 23
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 477,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[22px] text-gray-600",
                                    children: "En çok takip edilen kripto paralar"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 480,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 476,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        coins.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12",
                            children: coins.slice(0, 8).map((coin)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: `/currencies/${coin.id}`,
                                    className: "group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-300 transform hover:-translate-y-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-yellow-50",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-4 mb-4",
                                            children: [
                                                coin.image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: coin.image,
                                                    alt: coin.name,
                                                    className: "w-12 h-12 rounded-full"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 486,
                                                    columnNumber: 36
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "text-lg font-bold text-gray-900",
                                                            children: coin.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 488,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-gray-500 uppercase",
                                                            children: coin.symbol
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 489,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 487,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 485,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between items-center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-gray-600",
                                                            children: "Fiyat"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 494,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-lg font-bold text-gray-900",
                                                            children: formatCurrency(coin.current_price)
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 495,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 493,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex justify-between items-center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm text-gray-600",
                                                            children: "24s Değişim"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 498,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `text-lg font-bold ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`,
                                                            children: [
                                                                coin.price_change_percentage_24h >= 0 ? '+' : '',
                                                                coin.price_change_percentage_24h.toFixed(2),
                                                                "%"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 499,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 497,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 492,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, coin.id, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 484,
                                    columnNumber: 46
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 483,
                            columnNumber: 32
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                    lineNumber: 475,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 474,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                id: "market-dashboard",
                className: "py-12 bg-white",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full px-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between mb-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-bold text-gray-900",
                                    children: "Piyasa Verileri"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 513,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-4",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setHighlightsEnabled(!highlightsEnabled),
                                        className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${highlightsEnabled ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`,
                                        children: highlightsEnabled ? 'Vurguları Kapat' : 'Vurguları Aç'
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                        lineNumber: 515,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 514,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 512,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm opacity-90 mb-1",
                                            children: "Toplam Coin"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 524,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-2xl font-bold",
                                            children: formatNumber(marketStats.totalCoins)
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 525,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 523,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm opacity-90 mb-1",
                                            children: "Piyasa Değeri"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 528,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-2xl font-bold",
                                            children: formatNumber(marketStats.marketCap)
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 529,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 527,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm opacity-90 mb-1",
                                            children: "24s Hacim"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 532,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-2xl font-bold",
                                            children: formatNumber(marketStats.volume24h)
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 533,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 531,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-sm opacity-90 mb-1",
                                            children: "BTC Dominansı"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 536,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "text-2xl font-bold",
                                            children: [
                                                marketStats.btcDominance.toFixed(2),
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 537,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 535,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 522,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                    lineNumber: 511,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 510,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "py-12 bg-gray-50",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full px-4",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-lg shadow-lg overflow-hidden",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "overflow-x-auto",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("table", {
                                className: "w-full",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("thead", {
                                        className: "bg-gray-100",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-3 text-left text-sm font-semibold text-gray-700",
                                                    children: "#"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 551,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-3 text-left text-sm font-semibold text-gray-700",
                                                    children: "Coin"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 552,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-3 text-right text-sm font-semibold text-gray-700",
                                                    children: "Fiyat"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 553,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-3 text-right text-sm font-semibold text-gray-700",
                                                    children: "24s Değişim"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 554,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-3 text-right text-sm font-semibold text-gray-700",
                                                    children: "Piyasa Değeri"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 555,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("th", {
                                                    className: "px-4 py-3 text-right text-sm font-semibold text-gray-700",
                                                    children: "24s Hacim"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 556,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 550,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                        lineNumber: 549,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tbody", {
                                        children: coins.slice(0, displayedCoins).map((coin, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("tr", {
                                                className: `border-b border-gray-200 hover:bg-gray-50 transition-colors ${highlightsEnabled && coin.price_change_percentage_24h > 5 ? 'bg-green-50' : highlightsEnabled && coin.price_change_percentage_24h < -5 ? 'bg-red-50' : ''}`,
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-sm text-gray-600",
                                                        children: index + 1
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                        lineNumber: 561,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-2",
                                                            children: [
                                                                coin.image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                    src: coin.image,
                                                                    alt: coin.name,
                                                                    className: "w-8 h-8 rounded-full"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                    lineNumber: 564,
                                                                    columnNumber: 42
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "font-semibold text-gray-900",
                                                                            children: coin.name
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                            lineNumber: 566,
                                                                            columnNumber: 29
                                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "text-xs text-gray-500 uppercase",
                                                                            children: coin.symbol
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                            lineNumber: 567,
                                                                            columnNumber: 29
                                                                        }, ("TURBOPACK compile-time value", void 0))
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                    lineNumber: 565,
                                                                    columnNumber: 27
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 563,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                        lineNumber: 562,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right text-sm font-semibold text-gray-900",
                                                        children: formatCurrency(coin.current_price)
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                        lineNumber: 571,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: `px-4 py-3 text-right text-sm font-semibold ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`,
                                                        children: [
                                                            coin.price_change_percentage_24h >= 0 ? '+' : '',
                                                            coin.price_change_percentage_24h.toFixed(2),
                                                            "%"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                        lineNumber: 574,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right text-sm text-gray-600",
                                                        children: formatCurrency(coin.market_cap)
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                        lineNumber: 577,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("td", {
                                                        className: "px-4 py-3 text-right text-sm text-gray-600",
                                                        children: formatCurrency(coin.total_volume)
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                        lineNumber: 580,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, coin.id, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                lineNumber: 560,
                                                columnNumber: 72
                                            }, ("TURBOPACK compile-time value", void 0)))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                        lineNumber: 559,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                lineNumber: 548,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 547,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                        lineNumber: 546,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                    lineNumber: 545,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 544,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "py-20 bg-gradient-to-b from-white via-blue-50/30 to-yellow-50/30",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full px-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center mb-12",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    className: "text-2xl font-bold text-gray-900 mb-4",
                                    children: [
                                        "Popüler ",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 bg-clip-text text-transparent",
                                            children: "Coin'ler"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 596,
                                            columnNumber: 23
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 595,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-[22px] text-gray-600",
                                    children: "En çok takip edilen kripto paralar"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 598,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 594,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        coins.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12",
                            children: coins.slice(0, 8).map((coin)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    href: `/currencies/${coin.id}`,
                                    className: "group bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-300 transform hover:-translate-y-2 hover:bg-gradient-to-br hover:from-blue-50 hover:to-yellow-50",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-4 mb-4",
                                            children: [
                                                coin.image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: coin.image,
                                                    alt: coin.name,
                                                    className: "w-12 h-12 rounded-full group-hover:scale-110 transition-transform",
                                                    onError: (e)=>{
                                                        e.currentTarget.style.display = 'none';
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 604,
                                                    columnNumber: 36
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "font-bold text-gray-900 text-base",
                                                            children: coin.name
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 608,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-gray-500 text-sm uppercase",
                                                            children: coin.symbol
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 609,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 607,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 603,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-base font-bold text-gray-900",
                                                    children: formatCurrency(coin.current_price)
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 613,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `text-sm font-semibold ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`,
                                                    children: [
                                                        coin.price_change_percentage_24h >= 0 ? '▲' : '▼',
                                                        " ",
                                                        Math.abs(coin.price_change_percentage_24h).toFixed(2),
                                                        "%"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 614,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 612,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, coin.id, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 602,
                                    columnNumber: 46
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 601,
                            columnNumber: 32
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "#coins",
                                className: "inline-block px-8 py-4 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg",
                                children: "Tüm Coin'leri Görüntüle"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                lineNumber: 622,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 621,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                    lineNumber: 593,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 592,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                id: "coins",
                className: "py-12 bg-white",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bg-white",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold mb-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-black",
                                        children: "Piyasa Değerine Göre Kripto Para "
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                        lineNumber: 636,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 bg-clip-text text-transparent",
                                        children: "Fiyatları"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                        lineNumber: 637,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                lineNumber: 635,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 634,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                        lineNumber: 632,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                    lineNumber: 631,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 630,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                className: "bg-gradient-to-b from-white to-blue-50/30 px-4 py-12",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between mb-8",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-black",
                                        children: "En Son Kripto "
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                        lineNumber: 651,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 bg-clip-text text-transparent",
                                        children: "Haberleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                        lineNumber: 652,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                lineNumber: 650,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 649,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",
                            children: [
                                {
                                    id: '1',
                                    title: 'Gözler Ölüm Çaprazında, ABD ve XRP Coin Hareketliliği',
                                    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
                                    source: 'Cointurk',
                                    sourceUrl: 'https://cointurk.com',
                                    publishedTime: 'yaklaşık 1 saat önce',
                                    coinSymbol: 'XRP',
                                    coinChange: -2.4
                                },
                                {
                                    id: '2',
                                    title: 'Ayı piyasası bitiyor iddiası: Piyasada korku zirvede ama umut artıyor',
                                    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
                                    source: 'CoinTelegraph Turkey',
                                    sourceUrl: 'https://cointelegraph.com.tr',
                                    publishedTime: 'yaklaşık 1 saat önce'
                                },
                                {
                                    id: '3',
                                    title: 'Sıcak Gelişme: Bitcoin Düştükçe Düşüyor, Hedef Kaç Dolar? Kriptoda Ne Oluyor?',
                                    image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop',
                                    source: 'Cointurk',
                                    sourceUrl: 'https://cointurk.com',
                                    publishedTime: 'yaklaşık 1 saat önce',
                                    coinSymbol: 'BTC',
                                    coinChange: -1.4
                                },
                                {
                                    id: '4',
                                    title: 'Harvard Üniversitesinin Bitcoin (BTC) Stratejisi ve Güncel Görünüm',
                                    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
                                    source: 'Cointurk',
                                    sourceUrl: 'https://cointurk.com',
                                    publishedTime: 'yaklaşık 2 saat önce',
                                    coinSymbol: 'BTC',
                                    coinChange: -1.4
                                }
                            ].map((article)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: article.sourceUrl,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className: "group relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "relative w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: article.image,
                                                    alt: article.title,
                                                    className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500",
                                                    onError: (e)=>{
                                                        e.currentTarget.src = 'https://via.placeholder.com/400x250?text=Haber+Görseli';
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 695,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 699,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                article.coinSymbol && article.coinChange !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-lg",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-sm font-bold text-gray-900",
                                                            children: article.coinSymbol
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 702,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: `text-sm font-bold ${article.coinChange >= 0 ? 'text-green-600' : 'text-red-600'}`,
                                                            children: [
                                                                article.coinChange >= 0 ? '▲' : '▼',
                                                                " ",
                                                                Math.abs(article.coinChange).toFixed(1),
                                                                "%"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 703,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 701,
                                                    columnNumber: 78
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 694,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "p-5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-base font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:via-yellow-500 group-hover:to-red-600 group-hover:bg-clip-text transition-all",
                                                    children: article.title
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 711,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center justify-between text-sm",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-full",
                                                            children: article.source
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 715,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            className: "text-gray-500",
                                                            children: article.publishedTime
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 716,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 714,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 710,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, article.id, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 692,
                                    columnNumber: 29
                                }, ("TURBOPACK compile-time value", void 0)))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 656,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-center",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "https://cointurk.com",
                                target: "_blank",
                                rel: "noopener noreferrer",
                                className: "inline-block px-8 py-4 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm",
                                children: "Daha Fazla Haber Gör"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                lineNumber: 724,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 723,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                    lineNumber: 648,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 647,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "bg-white border-t border-gray-200 px-4 py-12",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "lg:col-span-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2 mb-4",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-2xl font-bold text-gray-900 lowercase",
                                                children: "cripto"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                lineNumber: 740,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 738,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-gray-600 mb-4",
                                            children: "Dijital Marketim, kripto piyasasına dair temel bir analiz sağlar. Dijital Marketim; fiyatı, hacmi ve piyasa değerini takip etmenin yanı sıra topluluk büyümesini, açık kaynak kod geliştirmeyi, önemli olayları ve zincir üstü metrikleri takip eder."
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 742,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 737,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-sm font-bold text-gray-900 mb-4",
                                                    children: "Kaynaklar"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 753,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                    className: "space-y-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Kripto Haberleri"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 756,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 755,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Kripto Para Hazine Rezervleri"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 759,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 758,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Kripto Isı Haritası"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 762,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 761,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Kripto API'si"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 765,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 764,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 754,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 752,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-sm font-bold text-gray-900 mb-4",
                                                    children: "Destek"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 772,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                    className: "space-y-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "İletişim Formu"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 775,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 774,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Reklam"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 778,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 777,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Şeker Ödülleri Listelemesi"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 781,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 780,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Yardım Merkezi"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 784,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 783,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Hata Ödülü"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 787,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 786,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "SSS"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 790,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 789,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 773,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 771,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-sm font-bold text-gray-900 mb-4",
                                                    children: "Cripto Hakkında"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 797,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                    className: "space-y-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Hakkımızda"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 800,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 799,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-green-600 hover:text-green-700 transition-colors font-semibold",
                                                                children: [
                                                                    "Kariyer ",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-xs",
                                                                        children: "(Bize Katılın)"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                        lineNumber: 803,
                                                                        columnNumber: 129
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 803,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 802,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Markalama Rehberi"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 806,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 805,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Metodoloji"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 809,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 808,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Feragatname"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 812,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 811,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Hizmet Koşulları"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 815,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 814,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Gizlilik Politikası"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 818,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 817,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Reklam Politikası"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 821,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 820,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Çerez Tercihleri"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 824,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 823,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Güven Merkezi"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 827,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 826,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 798,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 796,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                    className: "text-sm font-bold text-gray-900 mb-4",
                                                    children: "Topluluk"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 834,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                    className: "space-y-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "X/Twitter"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 837,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 836,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Telegram Sohbeti"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 840,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 839,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Telegram Haberleri"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 843,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 842,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Instagram"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 846,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 845,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Reddit"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 849,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 848,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Discord"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 852,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 851,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "Facebook"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 855,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 854,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "YouTube"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 858,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 857,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: "#",
                                                                className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                children: "TikTok"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                                lineNumber: 861,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                            lineNumber: 860,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                    lineNumber: 835,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 833,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 750,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 735,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-gray-50 rounded-lg p-6 mb-8",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col md:flex-row items-start md:items-center justify-between gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-lg font-bold text-gray-900 mb-2",
                                                children: "Kripto paralar hakkında devamlı güncel bilgiye sahip olmak ister misiniz?"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                lineNumber: 872,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-gray-600",
                                                children: "Ücretsiz bültenimize abone olarak en son kripto para haberlerini, güncellemeleri ve raporları alın."
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                                lineNumber: 875,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                        lineNumber: 871,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        className: "bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium px-6 py-3 rounded-lg transition-colors whitespace-nowrap",
                                        children: "Abone Ol"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                        lineNumber: 879,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                lineNumber: 870,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 869,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border-t border-gray-200 pt-8",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex flex-col md:flex-row items-center justify-between gap-4 mb-6",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-sm text-gray-600",
                                        children: "© 2025 Cripto. All Rights Reserved."
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                        lineNumber: 888,
                                        columnNumber: 15
                                    }, ("TURBOPACK compile-time value", void 0))
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 887,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "mt-8 p-4 bg-gray-50 rounded-lg",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                            className: "text-sm font-bold text-gray-900 mb-2",
                                            children: "ÖNEMLİ UYARI"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 896,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-600 leading-relaxed",
                                            children: 'Bu web sitesinde, bağlantılı sitelerde, uygulamalarda, forumlarda, bloglarda, sosyal medya hesaplarında ve diğer platformlarda (birlikte "Site") yer alan içerikler, yalnızca genel bilgilendirme amaçlıdır ve üçüncü taraflardan kaynaklanmaktadır. Bu içeriklerin doğruluğu, eksiksizliği, güncelliği veya güvenilirliği konusunda hiçbir garanti verilmemektedir. Herhangi bir yatırım kararı vermeden önce, kendi araştırmanızı yapmanız ve bağımsız profesyonel tavsiye almanız önerilir. Ticaret risklidir ve kayıplar meydana gelebilir. Bu sitede yer alan hiçbir içerik, teşvik, tavsiye veya teklif niteliği taşımamaktadır.'
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                            lineNumber: 897,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                                    lineNumber: 895,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                            lineNumber: 886,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                    lineNumber: 733,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 732,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$MarketStatsBar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                marketStats: marketStats
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
                lineNumber: 906,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/my-crypto-tracker/src/pages/index.tsx",
        lineNumber: 440,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
_s(HomePage, "mM63psvOmVS2AJbRvWPF5P157JU=");
_c = HomePage;
const __TURBOPACK__default__export__ = HomePage;
var _c;
__turbopack_context__.k.register(_c, "HomePage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/my-crypto-tracker/src/pages/index.tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/my-crypto-tracker/src/pages/index.tsx [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/my-crypto-tracker/src/pages/index\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/my-crypto-tracker/src/pages/index.tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__23d84ac6._.js.map