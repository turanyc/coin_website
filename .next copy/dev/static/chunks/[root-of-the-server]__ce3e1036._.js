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
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["c"])(202);
    if ($[0] !== "eb5daf52540b8b3f0072d8c183e42e46622aec91f3b5fe9c8a478c7a0396028d") {
        for(let $i = 0; $i < 202; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "eb5daf52540b8b3f0072d8c183e42e46622aec91f3b5fe9c8a478c7a0396028d";
    }
    const { marketStats } = t0;
    const [openDropdown, setOpenDropdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [scrolled, setScrolled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [, setShowNotificationsDropdown] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const { language, setLanguage, t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useLanguage"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    let t1;
    let t2;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t1 = ()=>{
            const storedUser = localStorage.getItem("currentUser");
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
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
    if ($[3] !== router) {
        t3 = ()=>{
            localStorage.removeItem("currentUser");
            setUser(null);
            router.push("/login");
        };
        $[3] = router;
        $[4] = t3;
    } else {
        t3 = $[4];
    }
    const handleLogout = t3;
    let t4;
    if ($[5] === Symbol.for("react.memo_cache_sentinel")) {
        t4 = [
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
        $[5] = t4;
    } else {
        t4 = $[5];
    }
    const languages = t4;
    let t5;
    let t6;
    if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
        t5 = ()=>{
            const handleScroll = ()=>{
                setScrolled(window.scrollY > 20);
            };
            window.addEventListener("scroll", handleScroll);
            return ()=>window.removeEventListener("scroll", handleScroll);
        };
        t6 = [];
        $[6] = t5;
        $[7] = t6;
    } else {
        t5 = $[6];
        t6 = $[7];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t5, t6);
    let t7;
    let t8;
    if ($[8] !== router.events) {
        t7 = ()=>{
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
        t8 = [
            router.events
        ];
        $[8] = router.events;
        $[9] = t7;
        $[10] = t8;
    } else {
        t7 = $[9];
        t8 = $[10];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t7, t8);
    let t10;
    let t9;
    if ($[11] !== showLanguageDropdown) {
        t9 = ()=>{
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
        t10 = [
            showLanguageDropdown
        ];
        $[11] = showLanguageDropdown;
        $[12] = t10;
        $[13] = t9;
    } else {
        t10 = $[12];
        t9 = $[13];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t9, t10);
    let t11;
    if ($[14] !== router) {
        t11 = (event_0)=>{
            event_0?.preventDefault();
            setOpenDropdown(null);
            setShowLanguageDropdown(false);
            if (router.pathname !== "/") {
                router.push("/");
            }
        };
        $[14] = router;
        $[15] = t11;
    } else {
        t11 = $[15];
    }
    const handleLogoClick = t11;
    const t12 = `bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300 ${scrolled ? "shadow-lg" : "shadow-sm"}`;
    let t13;
    if ($[16] === Symbol.for("react.memo_cache_sentinel")) {
        t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                lineNumber: 213,
                columnNumber: 56
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 213,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[16] = t13;
    } else {
        t13 = $[16];
    }
    let t14;
    if ($[17] !== handleLogoClick) {
        t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "/",
            onClick: handleLogoClick,
            className: "flex items-center group",
            children: t13
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 220,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[17] = handleLogoClick;
        $[18] = t14;
    } else {
        t14 = $[18];
    }
    let t15;
    if ($[19] !== openDropdown) {
        t15 = ()=>setOpenDropdown(openDropdown === "kripto" ? null : "kripto");
        $[19] = openDropdown;
        $[20] = t15;
    } else {
        t15 = $[20];
    }
    let t16;
    if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: "Kripto Paralar"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 236,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[21] = t16;
    } else {
        t16 = $[21];
    }
    const t17 = `w-4 h-4 transition-transform ${openDropdown === "kripto" ? "rotate-180" : ""}`;
    let t18;
    if ($[22] === Symbol.for("react.memo_cache_sentinel")) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 244,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[22] = t18;
    } else {
        t18 = $[22];
    }
    let t19;
    if ($[23] !== t17) {
        t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t17,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t18
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 251,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[23] = t17;
        $[24] = t19;
    } else {
        t19 = $[24];
    }
    let t20;
    if ($[25] !== t15 || $[26] !== t19) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t15,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100 whitespace-nowrap",
            children: [
                t16,
                t19
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 259,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[25] = t15;
        $[26] = t19;
        $[27] = t20;
    } else {
        t20 = $[27];
    }
    let t21;
    if ($[28] !== openDropdown) {
        t21 = openDropdown === "kripto" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                                lineNumber: 268,
                                                columnNumber: 573
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 453
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Sıralama"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 849
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 268,
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
                                                lineNumber: 268,
                                                columnNumber: 1206
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 1086
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Kategoriler"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 1309
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 268,
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
                                                    lineNumber: 268,
                                                    columnNumber: 1669
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 1903
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 1549
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Geçmiş Anlık Görüntüler"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 2015
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 268,
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
                                                lineNumber: 268,
                                                columnNumber: 2387
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 2267
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Token Kilidi Açılmaları"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 2559
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 268,
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
                                                lineNumber: 268,
                                                columnNumber: 2931
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 2811
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Getiri"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 3182
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 268,
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
                                                lineNumber: 268,
                                                columnNumber: 3537
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 3417
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Gerçek Dünya Varlıkları"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 3813
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 268,
                                    columnNumber: 3229
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 268,
                            columnNumber: 238
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 268,
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
                                    lineNumber: 268,
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
                                                        lineNumber: 268,
                                                        columnNumber: 4400
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 4280
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Trend"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 4510
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
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
                                                        lineNumber: 268,
                                                        columnNumber: 4864
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 4744
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Yakında"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 4987
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
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
                                                        lineNumber: 268,
                                                        columnNumber: 5343
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 5223
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Son Eklenenler"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 5437
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
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
                                                            lineNumber: 268,
                                                            columnNumber: 5800
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 268,
                                                            columnNumber: 5904
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 5680
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Kazananlar ve Kaybedenler"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 6015
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
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
                                                            lineNumber: 268,
                                                            columnNumber: 6389
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 268,
                                                            columnNumber: 6495
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 6269
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "En Çok Ziyaret Edilenler"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 6694
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
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
                                                        lineNumber: 268,
                                                        columnNumber: 7067
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 6947
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Topluluk Hissiyatı"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 7304
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
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
                                                        lineNumber: 268,
                                                        columnNumber: 7671
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 7551
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Zincir Sıralaması"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 7796
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 7363
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 268,
                                    columnNumber: 4065
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 268,
                            columnNumber: 3943
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 268,
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
                                    lineNumber: 268,
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
                                                        lineNumber: 268,
                                                        columnNumber: 8368
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 8248
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Genel NFT İstatistikleri"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 8644
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
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
                                                        lineNumber: 268,
                                                        columnNumber: 9017
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 8897
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Yaklaşan Satışlar"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 9183
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 268,
                                            columnNumber: 8709
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 268,
                                    columnNumber: 8033
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 268,
                            columnNumber: 7926
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 268,
                        columnNumber: 7872
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 268,
                columnNumber: 167
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 268,
            columnNumber: 40
        }, ("TURBOPACK compile-time value", void 0));
        $[28] = openDropdown;
        $[29] = t21;
    } else {
        t21 = $[29];
    }
    let t22;
    if ($[30] !== t20 || $[31] !== t21) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t20,
                t21
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 276,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[30] = t20;
        $[31] = t21;
        $[32] = t22;
    } else {
        t22 = $[32];
    }
    let t23;
    if ($[33] !== openDropdown) {
        t23 = ()=>setOpenDropdown(openDropdown === "dashboard" ? null : "dashboard");
        $[33] = openDropdown;
        $[34] = t23;
    } else {
        t23 = $[34];
    }
    const t24 = `w-4 h-4 transition-transform ${openDropdown === "dashboard" ? "rotate-180" : ""}`;
    let t25;
    if ($[35] === Symbol.for("react.memo_cache_sentinel")) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 294,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[35] = t25;
    } else {
        t25 = $[35];
    }
    let t26;
    if ($[36] !== t24) {
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t24,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t25
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 301,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[36] = t24;
        $[37] = t26;
    } else {
        t26 = $[37];
    }
    let t27;
    if ($[38] !== t23 || $[39] !== t26) {
        t27 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t23,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                "Dashboard",
                t26
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 309,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[38] = t23;
        $[39] = t26;
        $[40] = t27;
    } else {
        t27 = $[40];
    }
    let t28;
    if ($[41] !== openDropdown) {
        t28 = openDropdown === "dashboard" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                            lineNumber: 318,
                                            columnNumber: 402
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 323
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Piyasalar"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 318,
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
                                        lineNumber: 318,
                                        columnNumber: 609
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Spot Piyasa"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 795
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Türev Piyasa"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 974
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Kripto Para Sayısı"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 1154
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bitcoin Hazine Rezervleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 1340
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "BNB Hazine Rezervleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 1533
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 318,
                                columnNumber: 582
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 318,
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
                                            lineNumber: 318,
                                            columnNumber: 1919
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 1840
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Göstergeler"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 318,
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
                                        lineNumber: 318,
                                        columnNumber: 2238
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Altcoin Sezonu Endeksi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 2433
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Piyasa Döngüsü Göstergeleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 2623
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bitcoin Hakimiyeti"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 2818
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market 20 Endeksi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 3004
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market 100 Endeksi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 3197
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 318,
                                columnNumber: 2211
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 318,
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
                                            lineNumber: 318,
                                            columnNumber: 3588
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 3509
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "ETF Akışları"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 318,
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
                                        lineNumber: 318,
                                        columnNumber: 3742
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bitcoin ETF'leri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 3925
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Ethereum ETF'leri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 4109
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 318,
                                columnNumber: 3715
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 318,
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
                                            lineNumber: 318,
                                            columnNumber: 4491
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 4412
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Teknik Analiz"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 318,
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
                                        lineNumber: 318,
                                        columnNumber: 4812
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "MACD"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 318,
                                        columnNumber: 4983
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 318,
                                columnNumber: 4785
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 318,
                        columnNumber: 4306
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 318,
                columnNumber: 185
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 318,
            columnNumber: 43
        }, ("TURBOPACK compile-time value", void 0));
        $[41] = openDropdown;
        $[42] = t28;
    } else {
        t28 = $[42];
    }
    let t29;
    if ($[43] !== t27 || $[44] !== t28) {
        t29 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t27,
                t28
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 326,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[43] = t27;
        $[44] = t28;
        $[45] = t29;
    } else {
        t29 = $[45];
    }
    let t30;
    if ($[46] === Symbol.for("react.memo_cache_sentinel")) {
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "#",
            className: "px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: "DexScan"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 335,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[46] = t30;
    } else {
        t30 = $[46];
    }
    let t31;
    if ($[47] !== openDropdown) {
        t31 = ()=>setOpenDropdown(openDropdown === "borsalar" ? null : "borsalar");
        $[47] = openDropdown;
        $[48] = t31;
    } else {
        t31 = $[48];
    }
    const t32 = `w-4 h-4 transition-transform ${openDropdown === "borsalar" ? "rotate-180" : ""}`;
    let t33;
    if ($[49] === Symbol.for("react.memo_cache_sentinel")) {
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 351,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[49] = t33;
    } else {
        t33 = $[49];
    }
    let t34;
    if ($[50] !== t32) {
        t34 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t32,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t33
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 358,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[50] = t32;
        $[51] = t34;
    } else {
        t34 = $[51];
    }
    let t35;
    if ($[52] !== t31 || $[53] !== t34) {
        t35 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t31,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                "Borsalar",
                t34
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 366,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[52] = t31;
        $[53] = t34;
        $[54] = t35;
    } else {
        t35 = $[54];
    }
    let t36;
    if ($[55] !== openDropdown) {
        t36 = openDropdown === "borsalar" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                lineNumber: 375,
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
                                                        lineNumber: 375,
                                                        columnNumber: 593
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        fillRule: "evenodd",
                                                        d: "M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z",
                                                        clipRule: "evenodd"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 375,
                                                        columnNumber: 639
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 375,
                                                columnNumber: 528
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Spot"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 375,
                                                columnNumber: 923
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 375,
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
                                                    lineNumber: 375,
                                                    columnNumber: 1191
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 375,
                                                columnNumber: 1126
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Türevler"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 375,
                                                columnNumber: 1362
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 375,
                                        columnNumber: 944
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 375,
                                columnNumber: 319
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 375,
                        columnNumber: 216
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Merkezi Olmayan Borsalar"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 375,
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
                                                    lineNumber: 375,
                                                    columnNumber: 1784
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 375,
                                                columnNumber: 1719
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Spot"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 375,
                                                columnNumber: 1957
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 375,
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
                                                    lineNumber: 375,
                                                    columnNumber: 2225
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 375,
                                                columnNumber: 2160
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Türevler"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 375,
                                                columnNumber: 2396
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 375,
                                        columnNumber: 1978
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 375,
                                columnNumber: 1510
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 375,
                        columnNumber: 1399
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 375,
                columnNumber: 184
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 375,
            columnNumber: 42
        }, ("TURBOPACK compile-time value", void 0));
        $[55] = openDropdown;
        $[56] = t36;
    } else {
        t36 = $[56];
    }
    let t37;
    if ($[57] !== t35 || $[58] !== t36) {
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t35,
                t36
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 383,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[57] = t35;
        $[58] = t36;
        $[59] = t37;
    } else {
        t37 = $[59];
    }
    let t38;
    if ($[60] === Symbol.for("react.memo_cache_sentinel")) {
        t38 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "#",
            className: "px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: "Topluluk"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 392,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[60] = t38;
    } else {
        t38 = $[60];
    }
    let t39;
    if ($[61] !== openDropdown) {
        t39 = ()=>setOpenDropdown(openDropdown === "urunler" ? null : "urunler");
        $[61] = openDropdown;
        $[62] = t39;
    } else {
        t39 = $[62];
    }
    const t40 = `w-4 h-4 transition-transform ${openDropdown === "urunler" ? "rotate-180" : ""}`;
    let t41;
    if ($[63] === Symbol.for("react.memo_cache_sentinel")) {
        t41 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 408,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[63] = t41;
    } else {
        t41 = $[63];
    }
    let t42;
    if ($[64] !== t40) {
        t42 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t40,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t41
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 415,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[64] = t40;
        $[65] = t42;
    } else {
        t42 = $[65];
    }
    let t43;
    if ($[66] !== t39 || $[67] !== t42) {
        t43 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t39,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                "Ürünler",
                t42
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 423,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[66] = t39;
        $[67] = t42;
        $[68] = t43;
    } else {
        t43 = $[68];
    }
    let t44;
    if ($[69] !== openDropdown) {
        t44 = openDropdown === "urunler" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                lineNumber: 432,
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
                                        lineNumber: 432,
                                        columnNumber: 336
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bülten"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 515
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market Lansman"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 689
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market Laboratuvarları"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 879
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Telegram Bot"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 1077
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Reklam Ver"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 1257
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Kripto API"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 1435
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Site Widget'ları"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 1613
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 432,
                                columnNumber: 309
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 432,
                        columnNumber: 215
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Kampanyalar"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 432,
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
                                        lineNumber: 432,
                                        columnNumber: 1934
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Elmas Ödülleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 2113
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Öğren ve Kazan"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 2295
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 432,
                                columnNumber: 1907
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 432,
                        columnNumber: 1809
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Öğren"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 432,
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
                                        lineNumber: 432,
                                        columnNumber: 2608
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Akademi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 2784
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Araştırma"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 2959
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Videolar"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 3136
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Sözlük"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 3312
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 432,
                                columnNumber: 2581
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 432,
                        columnNumber: 2489
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Takvimler"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 432,
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
                                        lineNumber: 432,
                                        columnNumber: 3621
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Etkinlik Takvimi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 432,
                                        columnNumber: 3800
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 432,
                                columnNumber: 3594
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 432,
                        columnNumber: 3498
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 432,
                columnNumber: 183
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 432,
            columnNumber: 41
        }, ("TURBOPACK compile-time value", void 0));
        $[69] = openDropdown;
        $[70] = t44;
    } else {
        t44 = $[70];
    }
    let t45;
    if ($[71] !== t43 || $[72] !== t44) {
        t45 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t43,
                t44
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 440,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[71] = t43;
        $[72] = t44;
        $[73] = t45;
    } else {
        t45 = $[73];
    }
    let t46;
    if ($[74] !== t22 || $[75] !== t29 || $[76] !== t37 || $[77] !== t45) {
        t46 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "hidden lg:flex items-center gap-1",
            children: [
                t22,
                t29,
                t30,
                t37,
                t38,
                t45
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 449,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[74] = t22;
        $[75] = t29;
        $[76] = t37;
        $[77] = t45;
        $[78] = t46;
    } else {
        t46 = $[78];
    }
    let t47;
    if ($[79] !== t14 || $[80] !== t46) {
        t47 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-8",
            children: [
                t14,
                t46
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 460,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[79] = t14;
        $[80] = t46;
        $[81] = t47;
    } else {
        t47 = $[81];
    }
    let t48;
    if ($[82] === Symbol.for("react.memo_cache_sentinel")) {
        t48 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "hidden md:block",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$SearchBar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 469,
                columnNumber: 44
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 469,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[82] = t48;
    } else {
        t48 = $[82];
    }
    let t49;
    if ($[83] === Symbol.for("react.memo_cache_sentinel")) {
        t49 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                        lineNumber: 476,
                        columnNumber: 240
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 476,
                    columnNumber: 161
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm",
                    children: "Dijital Market AI"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 476,
                    columnNumber: 477
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 476,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[83] = t49;
    } else {
        t49 = $[83];
    }
    let t50;
    if ($[84] !== handleLogout || $[85] !== t || $[86] !== user) {
        t50 = user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            lineNumber: 483,
                            columnNumber: 103
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm font-bold text-gray-900",
                            children: user.name || user.full_name || user.email
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 483,
                            columnNumber: 166
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 483,
                    columnNumber: 59
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: handleLogout,
                    className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition",
                    children: t("common.logout")
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 483,
                    columnNumber: 266
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 483,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "/login",
            className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            children: "Giriş Yap"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 483,
            columnNumber: 426
        }, ("TURBOPACK compile-time value", void 0));
        $[84] = handleLogout;
        $[85] = t;
        $[86] = user;
        $[87] = t50;
    } else {
        t50 = $[87];
    }
    let t51;
    if ($[88] !== showLanguageDropdown) {
        t51 = (e_3)=>{
            e_3.stopPropagation();
            setShowLanguageDropdown(!showLanguageDropdown);
            setShowNotificationsDropdown(false);
        };
        $[88] = showLanguageDropdown;
        $[89] = t51;
    } else {
        t51 = $[89];
    }
    let t52;
    if ($[90] === Symbol.for("react.memo_cache_sentinel")) {
        t52 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
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
                    lineNumber: 505,
                    columnNumber: 104
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 505,
                    columnNumber: 661
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 505,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[90] = t52;
    } else {
        t52 = $[90];
    }
    let t53;
    if ($[91] !== t51) {
        t53 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t51,
            className: "bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors focus:outline-none",
            children: t52
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 512,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[91] = t51;
        $[92] = t53;
    } else {
        t53 = $[92];
    }
    let t54;
    if ($[93] !== language || $[94] !== setLanguage || $[95] !== showLanguageDropdown || $[96] !== t) {
        t54 = showLanguageDropdown && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-[60] min-w-[200px] max-h-[400px] overflow-y-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-4 py-2 border-b border-gray-200 text-xs text-gray-500 font-bold uppercase bg-gray-50",
                    children: t("common.language")
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 520,
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
                                lineNumber: 526,
                                columnNumber: 204
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex-1",
                                children: lang.name
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 526,
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
                                    lineNumber: 526,
                                    columnNumber: 398
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 526,
                                columnNumber: 318
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, lang.code, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 520,
                        columnNumber: 349
                    }, ("TURBOPACK compile-time value", void 0)))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 520,
            columnNumber: 35
        }, ("TURBOPACK compile-time value", void 0));
        $[93] = language;
        $[94] = setLanguage;
        $[95] = showLanguageDropdown;
        $[96] = t;
        $[97] = t54;
    } else {
        t54 = $[97];
    }
    let t55;
    if ($[98] !== t53 || $[99] !== t54) {
        t55 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative z-50 language-dropdown-container lg:hidden",
            children: [
                t53,
                t54
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 537,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[98] = t53;
        $[99] = t54;
        $[100] = t55;
    } else {
        t55 = $[100];
    }
    let t56;
    if ($[101] !== openDropdown) {
        t56 = ()=>setOpenDropdown(openDropdown === "mobile" ? null : "mobile");
        $[101] = openDropdown;
        $[102] = t56;
    } else {
        t56 = $[102];
    }
    let t57;
    if ($[103] === Symbol.for("react.memo_cache_sentinel")) {
        t57 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
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
                lineNumber: 554,
                columnNumber: 90
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 554,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[103] = t57;
    } else {
        t57 = $[103];
    }
    let t58;
    if ($[104] !== t56) {
        t58 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t56,
            className: "lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100",
            children: t57
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 561,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[104] = t56;
        $[105] = t58;
    } else {
        t58 = $[105];
    }
    let t59;
    if ($[106] === Symbol.for("react.memo_cache_sentinel")) {
        t59 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
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
                        lineNumber: 569,
                        columnNumber: 263
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 569,
                    columnNumber: 184
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm",
                    children: "Portföy"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 569,
                    columnNumber: 539
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 569,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[106] = t59;
    } else {
        t59 = $[106];
    }
    let t60;
    if ($[107] === Symbol.for("react.memo_cache_sentinel")) {
        t60 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                        lineNumber: 576,
                        columnNumber: 247
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 576,
                    columnNumber: 168
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm",
                    children: "İzleme Listesi"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 576,
                    columnNumber: 686
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 576,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[107] = t60;
    } else {
        t60 = $[107];
    }
    let t61;
    if ($[108] !== openDropdown) {
        t61 = ()=>setOpenDropdown(openDropdown === "mobile" ? null : "mobile");
        $[108] = openDropdown;
        $[109] = t61;
    } else {
        t61 = $[109];
    }
    let t62;
    if ($[110] === Symbol.for("react.memo_cache_sentinel")) {
        t62 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
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
                lineNumber: 591,
                columnNumber: 90
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 591,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[110] = t62;
    } else {
        t62 = $[110];
    }
    let t63;
    if ($[111] !== t61) {
        t63 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t61,
            className: "lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100",
            children: t62
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 598,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[111] = t61;
        $[112] = t63;
    } else {
        t63 = $[112];
    }
    let t64;
    if ($[113] !== t50 || $[114] !== t55 || $[115] !== t58 || $[116] !== t63) {
        t64 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-3",
            children: [
                t48,
                t49,
                t50,
                t55,
                t58,
                t59,
                t60,
                t63
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 606,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[113] = t50;
        $[114] = t55;
        $[115] = t58;
        $[116] = t63;
        $[117] = t64;
    } else {
        t64 = $[117];
    }
    let t65;
    if ($[118] !== t47 || $[119] !== t64) {
        t65 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full px-4 py-4 flex items-center justify-between",
            children: [
                t47,
                t64
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 617,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[118] = t47;
        $[119] = t64;
        $[120] = t65;
    } else {
        t65 = $[120];
    }
    let t66;
    if ($[121] !== handleLogout || $[122] !== openDropdown || $[123] !== t || $[124] !== user) {
        t66 = openDropdown === "mobile" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                        lineNumber: 626,
                        columnNumber: 144
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Borsalar"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 626,
                        columnNumber: 271
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "NFT"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 626,
                        columnNumber: 392
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Öğren"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 626,
                        columnNumber: 508
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Ürünler"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 626,
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
                                            lineNumber: 626,
                                            columnNumber: 989
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 626,
                                        columnNumber: 924
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Favoriler"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 626,
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
                                            lineNumber: 626,
                                            columnNumber: 1567
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 626,
                                        columnNumber: 1502
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Portföy"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 626,
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
                                                lineNumber: 626,
                                                columnNumber: 2007
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm font-bold text-gray-900",
                                                children: user.name || user.full_name || user.email
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 626,
                                                columnNumber: 2070
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 626,
                                        columnNumber: 1956
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleLogout,
                                        className: "w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg block text-center",
                                        children: t("common.logout")
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 626,
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
                                        lineNumber: 626,
                                        columnNumber: 2347
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/register",
                                        className: "w-full px-4 py-3 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-medium rounded-lg block text-center",
                                        children: t("common.register")
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 626,
                                        columnNumber: 2500
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 626,
                        columnNumber: 746
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 626,
                columnNumber: 107
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 626,
            columnNumber: 40
        }, ("TURBOPACK compile-time value", void 0));
        $[121] = handleLogout;
        $[122] = openDropdown;
        $[123] = t;
        $[124] = user;
        $[125] = t66;
    } else {
        t66 = $[125];
    }
    let t67;
    if ($[126] !== t12 || $[127] !== t65 || $[128] !== t66) {
        t67 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
            className: t12,
            children: [
                t65,
                t66
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 637,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[126] = t12;
        $[127] = t65;
        $[128] = t66;
        $[129] = t67;
    } else {
        t67 = $[129];
    }
    let t68;
    if ($[130] !== openDropdown) {
        t68 = openDropdown && openDropdown !== "mobile" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 z-40",
            onClick: ()=>setOpenDropdown(null)
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 647,
            columnNumber: 56
        }, ("TURBOPACK compile-time value", void 0));
        $[130] = openDropdown;
        $[131] = t68;
    } else {
        t68 = $[131];
    }
    let t69;
    let t70;
    let t71;
    let t72;
    let t73;
    let t74;
    if ($[132] === Symbol.for("react.memo_cache_sentinel")) {
        t69 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-900 font-medium text-2xl whitespace-nowrap border-b-2 border-blue-600 relative",
            children: "En İyiler"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 660,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t70 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Trend"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 661,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t71 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "En Çok Ziyaret Edilenler"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 662,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t72 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Yeni"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 663,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t73 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Kazananlar"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 664,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t74 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Gerçek Dünya Varlıkları"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 665,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[132] = t69;
        $[133] = t70;
        $[134] = t71;
        $[135] = t72;
        $[136] = t73;
        $[137] = t74;
    } else {
        t69 = $[132];
        t70 = $[133];
        t71 = $[134];
        t72 = $[135];
        t73 = $[136];
        t74 = $[137];
    }
    let t75;
    if ($[138] !== openDropdown) {
        t75 = ()=>setOpenDropdown(openDropdown === "more-tabs" ? null : "more-tabs");
        $[138] = openDropdown;
        $[139] = t75;
    } else {
        t75 = $[139];
    }
    const t76 = `w-4 h-4 transition-transform ${openDropdown === "more-tabs" ? "rotate-180" : ""}`;
    let t77;
    if ($[140] === Symbol.for("react.memo_cache_sentinel")) {
        t77 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 691,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[140] = t77;
    } else {
        t77 = $[140];
    }
    let t78;
    if ($[141] !== t76) {
        t78 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t76,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t77
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 698,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[141] = t76;
        $[142] = t78;
    } else {
        t78 = $[142];
    }
    let t79;
    if ($[143] !== t75 || $[144] !== t78) {
        t79 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t75,
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors flex items-center gap-1",
            children: [
                "Daha Fazla",
                t78
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 706,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[143] = t75;
        $[144] = t78;
        $[145] = t79;
    } else {
        t79 = $[145];
    }
    let t80;
    if ($[146] !== openDropdown) {
        t80 = openDropdown === "more-tabs" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    lineNumber: 715,
                    columnNumber: 184
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Son 24 Saat"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 715,
                    columnNumber: 354
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Son 7 Gün"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 715,
                    columnNumber: 524
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Son 30 Gün"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 715,
                    columnNumber: 692
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 715,
            columnNumber: 43
        }, ("TURBOPACK compile-time value", void 0));
        $[146] = openDropdown;
        $[147] = t80;
    } else {
        t80 = $[147];
    }
    let t81;
    if ($[148] !== t79 || $[149] !== t80) {
        t81 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border-b border-gray-200",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full px-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-6 overflow-x-auto scrollbar-hide",
                    children: [
                        t69,
                        t70,
                        t71,
                        t72,
                        t73,
                        t74,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                t79,
                                t80
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 723,
                            columnNumber: 193
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 723,
                    columnNumber: 91
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 723,
                columnNumber: 62
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 723,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[148] = t79;
        $[149] = t80;
        $[150] = t81;
    } else {
        t81 = $[150];
    }
    let t82;
    if ($[151] === Symbol.for("react.memo_cache_sentinel")) {
        t82 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
            className: "text-xl font-bold text-gray-900 mb-4",
            children: "Kripto Piyasa Genel Bakış"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 732,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[151] = t82;
    } else {
        t82 = $[151];
    }
    let t83;
    if ($[152] === Symbol.for("react.memo_cache_sentinel")) {
        t83 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Piyasa Değeri"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 739,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[152] = t83;
    } else {
        t83 = $[152];
    }
    let t84;
    if ($[153] === Symbol.for("react.memo_cache_sentinel")) {
        t84 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t83,
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
                            lineNumber: 746,
                            columnNumber: 206
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 746,
                        columnNumber: 113
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 746,
                columnNumber: 67
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 746,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[153] = t84;
    } else {
        t84 = $[153];
    }
    let t85;
    if ($[154] !== marketStats) {
        t85 = marketStats ? `$${(marketStats.marketCap / 1000000000000).toFixed(2)}T` : "$0.00T";
        $[154] = marketStats;
        $[155] = t85;
    } else {
        t85 = $[155];
    }
    let t86;
    if ($[156] !== t85) {
        t86 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-2xl font-bold text-gray-900",
            children: t85
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 761,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[156] = t85;
        $[157] = t86;
    } else {
        t86 = $[157];
    }
    const t87 = `text-sm font-semibold flex items-center gap-1 ${marketStats && marketStats.marketCapChange24h >= 0 ? "text-green-600" : "text-red-600"}`;
    const t88 = marketStats && marketStats.marketCapChange24h >= 0 ? "\u25B2" : "\u25BC";
    let t89;
    if ($[158] !== marketStats) {
        t89 = marketStats && marketStats.marketCapChange24h !== undefined ? Math.abs(marketStats.marketCapChange24h).toFixed(2) : "0.00";
        $[158] = marketStats;
        $[159] = t89;
    } else {
        t89 = $[159];
    }
    let t90;
    if ($[160] !== t87 || $[161] !== t88 || $[162] !== t89) {
        t90 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t87,
            children: [
                t88,
                " ",
                t89,
                "%"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 779,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[160] = t87;
        $[161] = t88;
        $[162] = t89;
        $[163] = t90;
    } else {
        t90 = $[163];
    }
    let t91;
    if ($[164] !== t86 || $[165] !== t90) {
        t91 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: [
                t86,
                t90
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 789,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[164] = t86;
        $[165] = t90;
        $[166] = t91;
    } else {
        t91 = $[166];
    }
    let t92;
    if ($[167] === Symbol.for("react.memo_cache_sentinel")) {
        t92 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    lineNumber: 798,
                    columnNumber: 97
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 798,
                columnNumber: 45
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 798,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[167] = t92;
    } else {
        t92 = $[167];
    }
    let t93;
    if ($[168] !== t91) {
        t93 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t84,
                t91,
                t92
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 805,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[168] = t91;
        $[169] = t93;
    } else {
        t93 = $[169];
    }
    let t94;
    if ($[170] === Symbol.for("react.memo_cache_sentinel")) {
        t94 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Dijital Market 20"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 813,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[170] = t94;
    } else {
        t94 = $[170];
    }
    let t95;
    if ($[171] === Symbol.for("react.memo_cache_sentinel")) {
        t95 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t94,
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
                            lineNumber: 820,
                            columnNumber: 206
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 820,
                        columnNumber: 113
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 820,
                columnNumber: 67
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 820,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[171] = t95;
    } else {
        t95 = $[171];
    }
    let t96;
    if ($[172] === Symbol.for("react.memo_cache_sentinel")) {
        t96 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-2xl font-bold text-gray-900",
                    children: "$193.84"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 827,
                    columnNumber: 33
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm font-semibold text-green-600 flex items-center gap-1",
                    children: "▲ 0.88%"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 827,
                    columnNumber: 96
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 827,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[172] = t96;
    } else {
        t96 = $[172];
    }
    let t97;
    if ($[173] === Symbol.for("react.memo_cache_sentinel")) {
        t97 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t95,
                t96,
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
                            lineNumber: 834,
                            columnNumber: 220
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 834,
                        columnNumber: 168
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 834,
                    columnNumber: 134
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 834,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[173] = t97;
    } else {
        t97 = $[173];
    }
    let t98;
    if ($[174] === Symbol.for("react.memo_cache_sentinel")) {
        t98 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Korku ve Açgözlülük"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 841,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[174] = t98;
    } else {
        t98 = $[174];
    }
    let t99;
    if ($[175] === Symbol.for("react.memo_cache_sentinel")) {
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
                            lineNumber: 848,
                            columnNumber: 206
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 848,
                        columnNumber: 113
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 848,
                columnNumber: 67
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 848,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[175] = t99;
    } else {
        t99 = $[175];
    }
    let t100;
    let t101;
    let t102;
    let t103;
    if ($[176] === Symbol.for("react.memo_cache_sentinel")) {
        t100 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M 20 80 A 80 80 0 0 1 180 80",
            fill: "none",
            stroke: "#e5e7eb",
            strokeWidth: "12",
            strokeLinecap: "round"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 858,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        t101 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M 20 80 A 80 80 0 0 1 60 50",
            fill: "none",
            stroke: "#ef4444",
            strokeWidth: "12",
            strokeLinecap: "round"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 859,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        t102 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M 60 50 A 80 80 0 0 1 100 45",
            fill: "none",
            stroke: "#f59e0b",
            strokeWidth: "12",
            strokeLinecap: "round"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 860,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        t103 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M 100 45 A 80 80 0 0 1 140 50",
            fill: "none",
            stroke: "#10b981",
            strokeWidth: "12",
            strokeLinecap: "round"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 861,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[176] = t100;
        $[177] = t101;
        $[178] = t102;
        $[179] = t103;
    } else {
        t100 = $[176];
        t101 = $[177];
        t102 = $[178];
        t103 = $[179];
    }
    let t104;
    if ($[180] === Symbol.for("react.memo_cache_sentinel")) {
        t104 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            viewBox: "0 0 200 100",
            className: "w-full h-full",
            preserveAspectRatio: "xMidYMid meet",
            children: [
                t100,
                t101,
                t102,
                t103,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                    transform: "rotate(-70 100 80)",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                            x1: "100",
                            y1: "80",
                            x2: "100",
                            y2: "30",
                            stroke: "#ffffff",
                            strokeWidth: "3",
                            strokeLinecap: "round"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 874,
                            columnNumber: 159
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                            cx: "100",
                            cy: "80",
                            r: "5",
                            fill: "#ffffff",
                            stroke: "#9ca3af",
                            strokeWidth: "2"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 874,
                            columnNumber: 256
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 874,
                    columnNumber: 125
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 874,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[180] = t104;
    } else {
        t104 = $[180];
    }
    let t105;
    if ($[181] === Symbol.for("react.memo_cache_sentinel")) {
        t105 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t99,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative h-24 mb-2 flex items-center justify-center",
                    children: [
                        t104,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute bottom-0 left-1/2 transform -translate-x-1/2 text-center",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-2xl font-bold text-gray-900",
                                    children: "20"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 881,
                                    columnNumber: 288
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-xs text-red-600 font-semibold",
                                    children: "Korku"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 881,
                                    columnNumber: 346
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 881,
                            columnNumber: 205
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 881,
                    columnNumber: 130
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 881,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[181] = t105;
    } else {
        t105 = $[181];
    }
    let t106;
    if ($[182] === Symbol.for("react.memo_cache_sentinel")) {
        t106 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Altcoin Sezonu"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 888,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[182] = t106;
    } else {
        t106 = $[182];
    }
    let t107;
    if ($[183] === Symbol.for("react.memo_cache_sentinel")) {
        t107 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t106,
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
                            lineNumber: 895,
                            columnNumber: 208
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 895,
                        columnNumber: 115
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 895,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 895,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[183] = t107;
    } else {
        t107 = $[183];
    }
    let t108;
    if ($[184] === Symbol.for("react.memo_cache_sentinel")) {
        t108 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-2xl font-bold text-gray-900",
                children: "25/100"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 902,
                columnNumber: 34
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 902,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[184] = t108;
    } else {
        t108 = $[184];
    }
    let t109;
    if ($[185] === Symbol.for("react.memo_cache_sentinel")) {
        t109 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative h-8 bg-gray-100 rounded-full",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute left-0 top-0 h-full w-1/4 bg-yellow-400 rounded-full"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 909,
                    columnNumber: 67
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute left-1/4 top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-400"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 909,
                    columnNumber: 148
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 909,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[185] = t109;
    } else {
        t109 = $[185];
    }
    let t110;
    if ($[186] === Symbol.for("react.memo_cache_sentinel")) {
        t110 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t107,
                t108,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative mt-2",
                    children: [
                        t109,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex justify-between mt-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs text-gray-600",
                                    children: "Bitcoin"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 916,
                                    columnNumber: 217
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "text-xs text-gray-600",
                                    children: "Altcoin"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 916,
                                    columnNumber: 271
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 916,
                            columnNumber: 174
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 916,
                    columnNumber: 137
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 916,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[186] = t110;
    } else {
        t110 = $[186];
    }
    let t111;
    if ($[187] === Symbol.for("react.memo_cache_sentinel")) {
        t111 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Ortalama Kripto RSI"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 923,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[187] = t111;
    } else {
        t111 = $[187];
    }
    let t112;
    if ($[188] === Symbol.for("react.memo_cache_sentinel")) {
        t112 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t111,
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
                            lineNumber: 930,
                            columnNumber: 208
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 930,
                        columnNumber: 115
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 930,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 930,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[188] = t112;
    } else {
        t112 = $[188];
    }
    let t113;
    if ($[189] === Symbol.for("react.memo_cache_sentinel")) {
        t113 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-2xl font-bold text-gray-900",
                children: "49.26"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 937,
                columnNumber: 34
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 937,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[189] = t113;
    } else {
        t113 = $[189];
    }
    let t114;
    if ($[190] === Symbol.for("react.memo_cache_sentinel")) {
        t114 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t112,
                t113,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative h-8 bg-gradient-to-r from-blue-200 via-blue-100 to-pink-200 rounded-full mt-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute left-[45%] top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-gray-400"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 944,
                            columnNumber: 241
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute left-0 bottom-full mb-1 text-xs text-blue-600",
                            children: "Aşırı Satım"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 944,
                            columnNumber: 370
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute right-0 bottom-full mb-1 text-xs text-pink-600",
                            children: "Aşırı Alım"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 944,
                            columnNumber: 459
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 944,
                    columnNumber: 137
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 944,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[190] = t114;
    } else {
        t114 = $[190];
    }
    let t115;
    let t116;
    if ($[191] === Symbol.for("react.memo_cache_sentinel")) {
        t115 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-6 h-6 bg-gray-300 rounded-full"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 952,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        t116 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Coinpaper.com"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 953,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[191] = t115;
        $[192] = t116;
    } else {
        t115 = $[191];
        t116 = $[192];
    }
    let t117;
    if ($[193] === Symbol.for("react.memo_cache_sentinel")) {
        t117 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2 mb-2",
            children: [
                t115,
                t116,
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
                        lineNumber: 962,
                        columnNumber: 149
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 962,
                    columnNumber: 70
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-gray-500",
                    children: "3 saat"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 962,
                    columnNumber: 749
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 962,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[193] = t117;
    } else {
        t117 = $[193];
    }
    let t118;
    if ($[194] === Symbol.for("react.memo_cache_sentinel")) {
        t118 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t117,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm text-gray-700 line-clamp-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-yellow-500",
                            children: "❤️"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 969,
                            columnNumber: 183
                        }, ("TURBOPACK compile-time value", void 0)),
                        " YENİ: #Visa, CEMEA bölgesinde #stablecoin ödeme hizmetlerini genişletmek için Aquanow ile ortaklık kurdu, veren ve alan kuruluşların..."
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 969,
                    columnNumber: 131
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 969,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[194] = t118;
    } else {
        t118 = $[194];
    }
    let t119;
    if ($[195] !== t93) {
        t119 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border-b border-gray-200 py-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full px-4",
                children: [
                    t82,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4",
                        children: [
                            t93,
                            t97,
                            t105,
                            t110,
                            t114,
                            t118
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 976,
                        columnNumber: 102
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 976,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 976,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[195] = t93;
        $[196] = t119;
    } else {
        t119 = $[196];
    }
    let t120;
    if ($[197] !== t119 || $[198] !== t67 || $[199] !== t68 || $[200] !== t81) {
        t120 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                t67,
                t68,
                t81,
                t119
            ]
        }, void 0, true);
        $[197] = t119;
        $[198] = t67;
        $[199] = t68;
        $[200] = t81;
        $[201] = t120;
    } else {
        t120 = $[201];
    }
    return t120;
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
"[project]/my-crypto-tracker/src/pages/market-cap.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/compiler-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/head.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$Navbar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/components/Navbar.tsx [client] (ecmascript)");
;
;
;
;
;
const MarketCapPage = ()=>{
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["c"])(4);
    if ($[0] !== "6715ee703d757de5653dccf0d30cd7acbe3c240390a1d5e571e2e4adba5a6835") {
        for(let $i = 0; $i < 4; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "6715ee703d757de5653dccf0d30cd7acbe3c240390a1d5e571e2e4adba5a6835";
    }
    let t0;
    let t1;
    if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
        t0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                children: "Piyasa Değeri Detayları | Dijital Marketim"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/market-cap.tsx",
                lineNumber: 17,
                columnNumber: 16
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/pages/market-cap.tsx",
            lineNumber: 17,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$Navbar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            marketStats: null
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/pages/market-cap.tsx",
            lineNumber: 18,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[1] = t0;
        $[2] = t1;
    } else {
        t0 = $[1];
        t1 = $[2];
    }
    let t2;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t2 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-white",
            children: [
                t0,
                t1,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "max-w-7xl mx-auto px-6 py-12",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-4xl font-bold text-gray-900 mb-4",
                                children: "Piyasa Değeri Detayları"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/market-cap.tsx",
                                lineNumber: 27,
                                columnNumber: 132
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-600 mb-8",
                                children: "Bu sayfa yakında eklenecektir."
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/market-cap.tsx",
                                lineNumber: 27,
                                columnNumber: 214
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/",
                                className: "inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all",
                                children: "Ana Sayfaya Dön"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/market-cap.tsx",
                                lineNumber: 27,
                                columnNumber: 282
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/market-cap.tsx",
                        lineNumber: 27,
                        columnNumber: 103
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/pages/market-cap.tsx",
                    lineNumber: 27,
                    columnNumber: 57
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/pages/market-cap.tsx",
            lineNumber: 27,
            columnNumber: 10
        }, ("TURBOPACK compile-time value", void 0));
        $[3] = t2;
    } else {
        t2 = $[3];
    }
    return t2;
};
_c = MarketCapPage;
const __TURBOPACK__default__export__ = MarketCapPage;
var _c;
__turbopack_context__.k.register(_c, "MarketCapPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/my-crypto-tracker/src/pages/market-cap.tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/market-cap";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/my-crypto-tracker/src/pages/market-cap.tsx [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/my-crypto-tracker/src/pages/market-cap\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/my-crypto-tracker/src/pages/market-cap.tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__ce3e1036._.js.map