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
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["c"])(232);
    if ($[0] !== "a89350ff0c6b8655e31118eade5134678c8aef42e6d25455a5cafa6798bbb9b9") {
        for(let $i = 0; $i < 232; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "a89350ff0c6b8655e31118eade5134678c8aef42e6d25455a5cafa6798bbb9b9";
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
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(_temp);
    const { language, setLanguage, t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useLanguage"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    let t5;
    if ($[1] !== router) {
        t5 = ()=>{
            localStorage.removeItem("currentUser");
            setUser(null);
            router.push("/login");
        };
        $[1] = router;
        $[2] = t5;
    } else {
        t5 = $[2];
    }
    const handleLogout = t5;
    let t6;
    if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t6 = [
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
        $[3] = t6;
    } else {
        t6 = $[3];
    }
    const languages = t6;
    let t7;
    let t8;
    if ($[4] === Symbol.for("react.memo_cache_sentinel")) {
        t7 = ()=>{
            const handleScroll = ()=>{
                setScrolled(window.scrollY > 20);
            };
            window.addEventListener("scroll", handleScroll);
            return ()=>window.removeEventListener("scroll", handleScroll);
        };
        t8 = [];
        $[4] = t7;
        $[5] = t8;
    } else {
        t7 = $[4];
        t8 = $[5];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t7, t8);
    let t9;
    if ($[6] !== router.events) {
        t9 = ()=>{
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
        $[6] = router.events;
        $[7] = t9;
    } else {
        t9 = $[7];
    }
    let t10;
    if ($[8] !== router) {
        t10 = [
            router
        ];
        $[8] = router;
        $[9] = t10;
    } else {
        t10 = $[9];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t9, t10);
    let t11;
    let t12;
    if ($[10] !== showLanguageDropdown) {
        t11 = ()=>{
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
        t12 = [
            showLanguageDropdown
        ];
        $[10] = showLanguageDropdown;
        $[11] = t11;
        $[12] = t12;
    } else {
        t11 = $[11];
        t12 = $[12];
    }
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])(t11, t12);
    let t13;
    if ($[13] !== router) {
        t13 = (event_0)=>{
            event_0?.preventDefault();
            setOpenDropdown(null);
            setShowLanguageDropdown(false);
            if (router.pathname !== "/") {
                router.push("/");
            }
        };
        $[13] = router;
        $[14] = t13;
    } else {
        t13 = $[14];
    }
    const handleLogoClick = t13;
    const t14 = `bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300 ${scrolled ? "shadow-lg" : "shadow-sm"}`;
    let t15;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
        t15 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                lineNumber: 217,
                columnNumber: 56
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 217,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[15] = t15;
    } else {
        t15 = $[15];
    }
    let t16;
    if ($[16] !== handleLogoClick) {
        t16 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "/",
            onClick: handleLogoClick,
            className: "flex items-center group",
            children: t15
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 224,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[16] = handleLogoClick;
        $[17] = t16;
    } else {
        t16 = $[17];
    }
    let t17;
    if ($[18] !== openDropdown) {
        t17 = ()=>setOpenDropdown(openDropdown === "kripto" ? null : "kripto");
        $[18] = openDropdown;
        $[19] = t17;
    } else {
        t17 = $[19];
    }
    let t18;
    if ($[20] === Symbol.for("react.memo_cache_sentinel")) {
        t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            children: "Kripto Paralar"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 240,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[20] = t18;
    } else {
        t18 = $[20];
    }
    const t19 = `w-4 h-4 transition-transform ${openDropdown === "kripto" ? "rotate-180" : ""}`;
    let t20;
    if ($[21] === Symbol.for("react.memo_cache_sentinel")) {
        t20 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 248,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[21] = t20;
    } else {
        t20 = $[21];
    }
    let t21;
    if ($[22] !== t19) {
        t21 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t19,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t20
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 255,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[22] = t19;
        $[23] = t21;
    } else {
        t21 = $[23];
    }
    let t22;
    if ($[24] !== t17 || $[25] !== t21) {
        t22 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t17,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100 whitespace-nowrap",
            children: [
                t18,
                t21
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 263,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[24] = t17;
        $[25] = t21;
        $[26] = t22;
    } else {
        t22 = $[26];
    }
    let t23;
    if ($[27] !== openDropdown) {
        t23 = openDropdown === "kripto" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200",
            onClick: _temp2,
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
                                                lineNumber: 272,
                                                columnNumber: 574
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 454
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Sıralama"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 850
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 272,
                                    columnNumber: 266
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
                                                lineNumber: 272,
                                                columnNumber: 1207
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 1087
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Kategoriler"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 1310
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 272,
                                    columnNumber: 899
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
                                                    lineNumber: 272,
                                                    columnNumber: 1670
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                    strokeLinecap: "round",
                                                    strokeLinejoin: "round",
                                                    strokeWidth: 2,
                                                    d: "M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 1904
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 1550
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Geçmiş Anlık Görüntüler"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 2016
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 272,
                                    columnNumber: 1362
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
                                                lineNumber: 272,
                                                columnNumber: 2388
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 2268
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Token Kilidi Açılmaları"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 2560
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 272,
                                    columnNumber: 2080
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
                                                lineNumber: 272,
                                                columnNumber: 2932
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 2812
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Getiri"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 3183
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 272,
                                    columnNumber: 2624
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
                                                lineNumber: 272,
                                                columnNumber: 3538
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 3418
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "font-medium",
                                            children: "Gerçek Dünya Varlıkları"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 3814
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 272,
                                    columnNumber: 3230
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 272,
                            columnNumber: 239
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 272,
                        columnNumber: 215
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
                                    lineNumber: 272,
                                    columnNumber: 3966
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
                                                        lineNumber: 272,
                                                        columnNumber: 4401
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 4281
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Trend"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 4511
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 4093
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
                                                        lineNumber: 272,
                                                        columnNumber: 4865
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 4745
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Yakında"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 4988
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 4557
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
                                                        lineNumber: 272,
                                                        columnNumber: 5344
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 5224
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Son Eklenenler"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 5438
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 5036
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
                                                            lineNumber: 272,
                                                            columnNumber: 5801
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 272,
                                                            columnNumber: 5905
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 5681
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Kazananlar ve Kaybedenler"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 6016
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 5493
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
                                                            lineNumber: 272,
                                                            columnNumber: 6390
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            strokeLinecap: "round",
                                                            strokeLinejoin: "round",
                                                            strokeWidth: 2,
                                                            d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 272,
                                                            columnNumber: 6496
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 6270
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "En Çok Ziyaret Edilenler"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 6695
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 6082
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
                                                        lineNumber: 272,
                                                        columnNumber: 7068
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 6948
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Topluluk Hissiyatı"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 7305
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 6760
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
                                                        lineNumber: 272,
                                                        columnNumber: 7672
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 7552
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Zincir Sıralaması"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 7797
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 7364
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 272,
                                    columnNumber: 4066
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 272,
                            columnNumber: 3944
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 272,
                        columnNumber: 3890
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
                                    lineNumber: 272,
                                    columnNumber: 7949
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
                                                        lineNumber: 272,
                                                        columnNumber: 8369
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 8249
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Genel NFT İstatistikleri"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 8645
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 8061
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
                                                        lineNumber: 272,
                                                        columnNumber: 9018
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 8898
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-medium",
                                                    children: "Yaklaşan Satışlar"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 272,
                                                    columnNumber: 9184
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 272,
                                            columnNumber: 8710
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 272,
                                    columnNumber: 8034
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 272,
                            columnNumber: 7927
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 272,
                        columnNumber: 7873
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 272,
                columnNumber: 168
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 272,
            columnNumber: 40
        }, ("TURBOPACK compile-time value", void 0));
        $[27] = openDropdown;
        $[28] = t23;
    } else {
        t23 = $[28];
    }
    let t24;
    if ($[29] !== t22 || $[30] !== t23) {
        t24 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t22,
                t23
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 280,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[29] = t22;
        $[30] = t23;
        $[31] = t24;
    } else {
        t24 = $[31];
    }
    let t25;
    if ($[32] !== openDropdown) {
        t25 = ()=>setOpenDropdown(openDropdown === "dashboard" ? null : "dashboard");
        $[32] = openDropdown;
        $[33] = t25;
    } else {
        t25 = $[33];
    }
    const t26 = `w-4 h-4 transition-transform ${openDropdown === "dashboard" ? "rotate-180" : ""}`;
    let t27;
    if ($[34] === Symbol.for("react.memo_cache_sentinel")) {
        t27 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 298,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[34] = t27;
    } else {
        t27 = $[34];
    }
    let t28;
    if ($[35] !== t26) {
        t28 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t26,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t27
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 305,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[35] = t26;
        $[36] = t28;
    } else {
        t28 = $[36];
    }
    let t29;
    if ($[37] !== t25 || $[38] !== t28) {
        t29 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t25,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                "Dashboard",
                t28
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 313,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[37] = t25;
        $[38] = t28;
        $[39] = t29;
    } else {
        t29 = $[39];
    }
    let t30;
    if ($[40] !== openDropdown) {
        t30 = openDropdown === "dashboard" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200 min-w-[600px]",
            onClick: _temp3,
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
                                            lineNumber: 322,
                                            columnNumber: 402
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 323
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Piyasalar"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 322,
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
                                        lineNumber: 322,
                                        columnNumber: 609
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Spot Piyasa"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 795
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Türev Piyasa"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 974
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Kripto Para Sayısı"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 1154
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bitcoin Hazine Rezervleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 1340
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "BNB Hazine Rezervleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 1533
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 322,
                                columnNumber: 582
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 322,
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
                                            lineNumber: 322,
                                            columnNumber: 1919
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 1840
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Göstergeler"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 322,
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
                                        lineNumber: 322,
                                        columnNumber: 2238
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Altcoin Sezonu Endeksi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 2433
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Piyasa Döngüsü Göstergeleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 2623
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bitcoin Hakimiyeti"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 2818
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market 20 Endeksi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 3004
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market 100 Endeksi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 3197
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 322,
                                columnNumber: 2211
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 322,
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
                                            lineNumber: 322,
                                            columnNumber: 3588
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 3509
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "ETF Akışları"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 322,
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
                                        lineNumber: 322,
                                        columnNumber: 3742
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bitcoin ETF'leri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 3925
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Ethereum ETF'leri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 4109
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 322,
                                columnNumber: 3715
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 322,
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
                                            lineNumber: 322,
                                            columnNumber: 4491
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 4412
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Teknik Analiz"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 322,
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
                                        lineNumber: 322,
                                        columnNumber: 4812
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "MACD"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 322,
                                        columnNumber: 4983
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 322,
                                columnNumber: 4785
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 322,
                        columnNumber: 4306
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 322,
                columnNumber: 185
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 322,
            columnNumber: 43
        }, ("TURBOPACK compile-time value", void 0));
        $[40] = openDropdown;
        $[41] = t30;
    } else {
        t30 = $[41];
    }
    let t31;
    if ($[42] !== t29 || $[43] !== t30) {
        t31 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t29,
                t30
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 330,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[42] = t29;
        $[43] = t30;
        $[44] = t31;
    } else {
        t31 = $[44];
    }
    let t32;
    if ($[45] === Symbol.for("react.memo_cache_sentinel")) {
        t32 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "#",
            className: "px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: "DexScan"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 339,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[45] = t32;
    } else {
        t32 = $[45];
    }
    let t33;
    if ($[46] !== openDropdown) {
        t33 = ()=>setOpenDropdown(openDropdown === "borsalar" ? null : "borsalar");
        $[46] = openDropdown;
        $[47] = t33;
    } else {
        t33 = $[47];
    }
    const t34 = `w-4 h-4 transition-transform ${openDropdown === "borsalar" ? "rotate-180" : ""}`;
    let t35;
    if ($[48] === Symbol.for("react.memo_cache_sentinel")) {
        t35 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 355,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[48] = t35;
    } else {
        t35 = $[48];
    }
    let t36;
    if ($[49] !== t34) {
        t36 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t34,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t35
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 362,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[49] = t34;
        $[50] = t36;
    } else {
        t36 = $[50];
    }
    let t37;
    if ($[51] !== t33 || $[52] !== t36) {
        t37 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t33,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                "Borsalar",
                t36
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 370,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[51] = t33;
        $[52] = t36;
        $[53] = t37;
    } else {
        t37 = $[53];
    }
    let t38;
    if ($[54] !== openDropdown) {
        t38 = openDropdown === "borsalar" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200 min-w-[300px]",
            onClick: _temp4,
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
                                lineNumber: 379,
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
                                                        lineNumber: 379,
                                                        columnNumber: 593
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        fillRule: "evenodd",
                                                        d: "M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z",
                                                        clipRule: "evenodd"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 379,
                                                        columnNumber: 639
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 379,
                                                columnNumber: 528
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Spot"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 379,
                                                columnNumber: 923
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 379,
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
                                                    lineNumber: 379,
                                                    columnNumber: 1191
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 379,
                                                columnNumber: 1126
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Türevler"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 379,
                                                columnNumber: 1362
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 379,
                                        columnNumber: 944
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 379,
                                columnNumber: 319
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 379,
                        columnNumber: 216
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Merkezi Olmayan Borsalar"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 379,
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
                                                    lineNumber: 379,
                                                    columnNumber: 1784
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 379,
                                                columnNumber: 1719
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Spot"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 379,
                                                columnNumber: 1957
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 379,
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
                                                    lineNumber: 379,
                                                    columnNumber: 2225
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 379,
                                                columnNumber: 2160
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Türevler"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 379,
                                                columnNumber: 2396
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 379,
                                        columnNumber: 1978
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 379,
                                columnNumber: 1510
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 379,
                        columnNumber: 1399
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 379,
                columnNumber: 184
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 379,
            columnNumber: 42
        }, ("TURBOPACK compile-time value", void 0));
        $[54] = openDropdown;
        $[55] = t38;
    } else {
        t38 = $[55];
    }
    let t39;
    if ($[56] !== t37 || $[57] !== t38) {
        t39 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t37,
                t38
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 387,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[56] = t37;
        $[57] = t38;
        $[58] = t39;
    } else {
        t39 = $[58];
    }
    let t40;
    if ($[59] === Symbol.for("react.memo_cache_sentinel")) {
        t40 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "#",
            className: "px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: "Topluluk"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 396,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[59] = t40;
    } else {
        t40 = $[59];
    }
    let t41;
    if ($[60] !== openDropdown) {
        t41 = ()=>setOpenDropdown(openDropdown === "urunler" ? null : "urunler");
        $[60] = openDropdown;
        $[61] = t41;
    } else {
        t41 = $[61];
    }
    const t42 = `w-4 h-4 transition-transform ${openDropdown === "urunler" ? "rotate-180" : ""}`;
    let t43;
    if ($[62] === Symbol.for("react.memo_cache_sentinel")) {
        t43 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 412,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[62] = t43;
    } else {
        t43 = $[62];
    }
    let t44;
    if ($[63] !== t42) {
        t44 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t42,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t43
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 419,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[63] = t42;
        $[64] = t44;
    } else {
        t44 = $[64];
    }
    let t45;
    if ($[65] !== t41 || $[66] !== t44) {
        t45 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t41,
            className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
            children: [
                "Ürünler",
                t44
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 427,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[65] = t41;
        $[66] = t44;
        $[67] = t45;
    } else {
        t45 = $[67];
    }
    let t46;
    if ($[68] !== openDropdown) {
        t46 = openDropdown === "urunler" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl py-4 z-50 border border-gray-200 min-w-[300px]",
            onClick: _temp5,
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
                                lineNumber: 436,
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
                                        lineNumber: 436,
                                        columnNumber: 336
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Bülten"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 515
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market Lansman"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 689
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Dijital Market Laboratuvarları"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 879
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Telegram Bot"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 1077
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Reklam Ver"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 1257
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Kripto API"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 1435
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Site Widget'ları"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 1613
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 436,
                                columnNumber: 309
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 436,
                        columnNumber: 215
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Kampanyalar"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 436,
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
                                        lineNumber: 436,
                                        columnNumber: 1934
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Elmas Ödülleri"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 2113
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Öğren ve Kazan"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 2295
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 436,
                                columnNumber: 1907
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 436,
                        columnNumber: 1809
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Öğren"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 436,
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
                                        lineNumber: 436,
                                        columnNumber: 2608
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Akademi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 2784
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Araştırma"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 2959
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Videolar"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 3136
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Sözlük"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 3312
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 436,
                                columnNumber: 2581
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 436,
                        columnNumber: 2489
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-xs font-bold text-gray-500 uppercase tracking-wide mb-2",
                                children: "Takvimler"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 436,
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
                                        lineNumber: 436,
                                        columnNumber: 3621
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: "#",
                                        className: "block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#2563EB] rounded-lg transition-all",
                                        onClick: ()=>setOpenDropdown(null),
                                        children: "Etkinlik Takvimi"
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 436,
                                        columnNumber: 3800
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 436,
                                columnNumber: 3594
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 436,
                        columnNumber: 3498
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 436,
                columnNumber: 183
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 436,
            columnNumber: 41
        }, ("TURBOPACK compile-time value", void 0));
        $[68] = openDropdown;
        $[69] = t46;
    } else {
        t46 = $[69];
    }
    let t47;
    if ($[70] !== t45 || $[71] !== t46) {
        t47 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative",
            children: [
                t45,
                t46
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 444,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[70] = t45;
        $[71] = t46;
        $[72] = t47;
    } else {
        t47 = $[72];
    }
    let t48;
    if ($[73] !== t24 || $[74] !== t31 || $[75] !== t39 || $[76] !== t47) {
        t48 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "hidden lg:flex items-center gap-1",
            children: [
                t24,
                t31,
                t32,
                t39,
                t40,
                t47
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 453,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[73] = t24;
        $[74] = t31;
        $[75] = t39;
        $[76] = t47;
        $[77] = t48;
    } else {
        t48 = $[77];
    }
    let t49;
    if ($[78] !== t16 || $[79] !== t48) {
        t49 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-8",
            children: [
                t16,
                t48
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 464,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[78] = t16;
        $[79] = t48;
        $[80] = t49;
    } else {
        t49 = $[80];
    }
    let t50;
    if ($[81] === Symbol.for("react.memo_cache_sentinel")) {
        t50 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "hidden md:block",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$SearchBar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 473,
                columnNumber: 44
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 473,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[81] = t50;
    } else {
        t50 = $[81];
    }
    let t51;
    if ($[82] === Symbol.for("react.memo_cache_sentinel")) {
        t51 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                        lineNumber: 480,
                        columnNumber: 240
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 480,
                    columnNumber: 161
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm",
                    children: "Dijital Market AI"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 480,
                    columnNumber: 477
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 480,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[82] = t51;
    } else {
        t51 = $[82];
    }
    let t52;
    if ($[83] !== handleLogout || $[84] !== t || $[85] !== user) {
        t52 = user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            lineNumber: 487,
                            columnNumber: 103
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-sm font-bold text-gray-900",
                            children: user.name || user.full_name || user.email
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 487,
                            columnNumber: 166
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 487,
                    columnNumber: 59
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: handleLogout,
                    className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition",
                    children: t("common.logout")
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 487,
                    columnNumber: 266
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 487,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
            href: "/login",
            className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            children: "Giriş Yap"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 487,
            columnNumber: 426
        }, ("TURBOPACK compile-time value", void 0));
        $[83] = handleLogout;
        $[84] = t;
        $[85] = user;
        $[86] = t52;
    } else {
        t52 = $[86];
    }
    let t53;
    if ($[87] !== showLanguageDropdown) {
        t53 = (e_3)=>{
            e_3.stopPropagation();
            setShowLanguageDropdown(!showLanguageDropdown);
            setShowNotificationsDropdown(false);
        };
        $[87] = showLanguageDropdown;
        $[88] = t53;
    } else {
        t53 = $[88];
    }
    let t54;
    if ($[89] === Symbol.for("react.memo_cache_sentinel")) {
        t54 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
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
                    lineNumber: 509,
                    columnNumber: 104
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: 2,
                    d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 509,
                    columnNumber: 661
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 509,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[89] = t54;
    } else {
        t54 = $[89];
    }
    let t55;
    if ($[90] !== t53) {
        t55 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t53,
            className: "bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors focus:outline-none",
            children: t54
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 516,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[90] = t53;
        $[91] = t55;
    } else {
        t55 = $[91];
    }
    let t56;
    if ($[92] !== language || $[93] !== setLanguage || $[94] !== showLanguageDropdown || $[95] !== t) {
        t56 = showLanguageDropdown && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-[60] min-w-[200px] max-h-[400px] overflow-y-auto",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-4 py-2 border-b border-gray-200 text-xs text-gray-500 font-bold uppercase bg-gray-50",
                    children: t("common.language")
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 524,
                    columnNumber: 193
                }, ("TURBOPACK compile-time value", void 0)),
                languages.map((lang)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: (e_4)=>{
                            e_4.stopPropagation();
                            const langCode = lang.code;
                            setLanguage(langCode);
                            setShowLanguageDropdown(false);
                            setTimeout(_temp6, 100);
                        },
                        className: `w-full text-left px-4 py-3 hover:bg-gray-50 text-sm transition flex items-center gap-2 ${language === lang.code ? "bg-[#2563EB]/10 text-[#2563EB] font-semibold" : "text-gray-700"}`,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-lg",
                                children: lang.flag
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 530,
                                columnNumber: 204
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "flex-1",
                                children: lang.name
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 530,
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
                                    lineNumber: 530,
                                    columnNumber: 398
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 530,
                                columnNumber: 318
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, lang.code, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 524,
                        columnNumber: 349
                    }, ("TURBOPACK compile-time value", void 0)))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 524,
            columnNumber: 35
        }, ("TURBOPACK compile-time value", void 0));
        $[92] = language;
        $[93] = setLanguage;
        $[94] = showLanguageDropdown;
        $[95] = t;
        $[96] = t56;
    } else {
        t56 = $[96];
    }
    let t57;
    if ($[97] !== t55 || $[98] !== t56) {
        t57 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative z-50 language-dropdown-container lg:hidden",
            children: [
                t55,
                t56
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 541,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[97] = t55;
        $[98] = t56;
        $[99] = t57;
    } else {
        t57 = $[99];
    }
    let t58;
    if ($[100] !== openDropdown) {
        t58 = ()=>setOpenDropdown(openDropdown === "mobile" ? null : "mobile");
        $[100] = openDropdown;
        $[101] = t58;
    } else {
        t58 = $[101];
    }
    let t59;
    if ($[102] === Symbol.for("react.memo_cache_sentinel")) {
        t59 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
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
                lineNumber: 558,
                columnNumber: 90
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 558,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[102] = t59;
    } else {
        t59 = $[102];
    }
    let t60;
    if ($[103] !== t58) {
        t60 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t58,
            className: "lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100",
            children: t59
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 565,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[103] = t58;
        $[104] = t60;
    } else {
        t60 = $[104];
    }
    let t61;
    if ($[105] === Symbol.for("react.memo_cache_sentinel")) {
        t61 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
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
                        lineNumber: 573,
                        columnNumber: 263
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 573,
                    columnNumber: 184
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm",
                    children: "Portföy"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 573,
                    columnNumber: 539
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 573,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[105] = t61;
    } else {
        t61 = $[105];
    }
    let t62;
    if ($[106] === Symbol.for("react.memo_cache_sentinel")) {
        t62 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                        lineNumber: 580,
                        columnNumber: 247
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 580,
                    columnNumber: 168
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-sm",
                    children: "İzleme Listesi"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 580,
                    columnNumber: 686
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 580,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[106] = t62;
    } else {
        t62 = $[106];
    }
    let t63;
    if ($[107] !== openDropdown) {
        t63 = ()=>setOpenDropdown(openDropdown === "mobile" ? null : "mobile");
        $[107] = openDropdown;
        $[108] = t63;
    } else {
        t63 = $[108];
    }
    let t64;
    if ($[109] === Symbol.for("react.memo_cache_sentinel")) {
        t64 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
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
                lineNumber: 595,
                columnNumber: 90
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 595,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[109] = t64;
    } else {
        t64 = $[109];
    }
    let t65;
    if ($[110] !== t63) {
        t65 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t63,
            className: "lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100",
            children: t64
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 602,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[110] = t63;
        $[111] = t65;
    } else {
        t65 = $[111];
    }
    let t66;
    if ($[112] !== t52 || $[113] !== t57 || $[114] !== t60 || $[115] !== t65) {
        t66 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-3",
            children: [
                t50,
                t51,
                t52,
                t57,
                t60,
                t61,
                t62,
                t65
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 610,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[112] = t52;
        $[113] = t57;
        $[114] = t60;
        $[115] = t65;
        $[116] = t66;
    } else {
        t66 = $[116];
    }
    let t67;
    if ($[117] !== t49 || $[118] !== t66) {
        t67 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-full px-4 py-4 flex items-center justify-between",
            children: [
                t49,
                t66
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 621,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[117] = t49;
        $[118] = t66;
        $[119] = t67;
    } else {
        t67 = $[119];
    }
    let t68;
    if ($[120] !== handleLogout || $[121] !== openDropdown || $[122] !== t || $[123] !== user) {
        t68 = openDropdown === "mobile" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "lg:hidden mt-4 pb-4 pt-4 border-t border-gray-200",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Kripto Paralar"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 630,
                        columnNumber: 144
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Borsalar"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 630,
                        columnNumber: 277
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "NFT"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 630,
                        columnNumber: 398
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Öğren"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 630,
                        columnNumber: 514
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        href: "#",
                        className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                        children: "Ürünler"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 630,
                        columnNumber: 632
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
                                            lineNumber: 630,
                                            columnNumber: 995
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 630,
                                        columnNumber: 930
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Favoriler"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 630,
                                columnNumber: 804
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
                                            lineNumber: 630,
                                            columnNumber: 1573
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 630,
                                        columnNumber: 1508
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    "Portföy"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 630,
                                columnNumber: 1376
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
                                                lineNumber: 630,
                                                columnNumber: 2013
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm font-bold text-gray-900",
                                                children: user.name || user.full_name || user.email
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 630,
                                                columnNumber: 2076
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 630,
                                        columnNumber: 1962
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleLogout,
                                        className: "w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg block text-center",
                                        children: t("common.logout")
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 630,
                                        columnNumber: 2176
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
                                        lineNumber: 630,
                                        columnNumber: 2353
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/register",
                                        className: "w-full px-4 py-3 bg-[#2563EB] hover:bg-[#1E40AF] text-white font-medium rounded-lg block text-center",
                                        children: t("common.register")
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 630,
                                        columnNumber: 2506
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 630,
                        columnNumber: 752
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 630,
                columnNumber: 107
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 630,
            columnNumber: 40
        }, ("TURBOPACK compile-time value", void 0));
        $[120] = handleLogout;
        $[121] = openDropdown;
        $[122] = t;
        $[123] = user;
        $[124] = t68;
    } else {
        t68 = $[124];
    }
    let t69;
    if ($[125] !== t14 || $[126] !== t67 || $[127] !== t68) {
        t69 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
            className: t14,
            children: [
                t67,
                t68
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 641,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[125] = t14;
        $[126] = t67;
        $[127] = t68;
        $[128] = t69;
    } else {
        t69 = $[128];
    }
    let t70;
    if ($[129] !== openDropdown) {
        t70 = openDropdown && openDropdown !== "mobile" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "fixed inset-0 z-40",
            onClick: ()=>setOpenDropdown(null)
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 651,
            columnNumber: 56
        }, ("TURBOPACK compile-time value", void 0));
        $[129] = openDropdown;
        $[130] = t70;
    } else {
        t70 = $[130];
    }
    let t71;
    let t72;
    let t73;
    let t74;
    let t75;
    let t76;
    if ($[131] === Symbol.for("react.memo_cache_sentinel")) {
        t71 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-900 font-medium text-2xl whitespace-nowrap border-b-2 border-blue-600 relative",
            children: "En İyiler"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 664,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t72 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Trend"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 665,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t73 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "En Çok Ziyaret Edilenler"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 666,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t74 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Yeni"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 667,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t75 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Kazananlar"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 668,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        t76 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors",
            children: "Gerçek Dünya Varlıkları"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 669,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[131] = t71;
        $[132] = t72;
        $[133] = t73;
        $[134] = t74;
        $[135] = t75;
        $[136] = t76;
    } else {
        t71 = $[131];
        t72 = $[132];
        t73 = $[133];
        t74 = $[134];
        t75 = $[135];
        t76 = $[136];
    }
    let t77;
    if ($[137] !== openDropdown) {
        t77 = ()=>setOpenDropdown(openDropdown === "more-tabs" ? null : "more-tabs");
        $[137] = openDropdown;
        $[138] = t77;
    } else {
        t77 = $[138];
    }
    const t78 = `w-4 h-4 transition-transform ${openDropdown === "more-tabs" ? "rotate-180" : ""}`;
    let t79;
    if ($[139] === Symbol.for("react.memo_cache_sentinel")) {
        t79 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M19 9l-7 7-7-7"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 695,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[139] = t79;
    } else {
        t79 = $[139];
    }
    let t80;
    if ($[140] !== t78) {
        t80 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: t78,
            fill: "none",
            stroke: "currentColor",
            viewBox: "0 0 24 24",
            children: t79
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 702,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[140] = t78;
        $[141] = t80;
    } else {
        t80 = $[141];
    }
    let t81;
    if ($[142] !== t77 || $[143] !== t80) {
        t81 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
            onClick: t77,
            className: "px-4 py-3 text-gray-600 hover:text-gray-900 font-medium text-2xl whitespace-nowrap transition-colors flex items-center gap-1",
            children: [
                "Daha Fazla",
                t80
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 710,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[142] = t77;
        $[143] = t80;
        $[144] = t81;
    } else {
        t81 = $[144];
    }
    let t82;
    if ($[145] !== openDropdown) {
        t82 = openDropdown === "more-tabs" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 min-w-[200px]",
            onClick: _temp7,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Kaybedenler"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 719,
                    columnNumber: 184
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Son 24 Saat"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 719,
                    columnNumber: 354
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Son 7 Gün"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 719,
                    columnNumber: 524
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "#",
                    className: "block px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors",
                    onClick: ()=>setOpenDropdown(null),
                    children: "Son 30 Gün"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 719,
                    columnNumber: 692
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 719,
            columnNumber: 43
        }, ("TURBOPACK compile-time value", void 0));
        $[145] = openDropdown;
        $[146] = t82;
    } else {
        t82 = $[146];
    }
    let t83;
    if ($[147] !== t81 || $[148] !== t82) {
        t83 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border-b border-gray-200",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full px-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-6 overflow-x-auto scrollbar-hide",
                    children: [
                        t71,
                        t72,
                        t73,
                        t74,
                        t75,
                        t76,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "relative",
                            children: [
                                t81,
                                t82
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 727,
                            columnNumber: 193
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 727,
                    columnNumber: 91
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 727,
                columnNumber: 62
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 727,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[147] = t81;
        $[148] = t82;
        $[149] = t83;
    } else {
        t83 = $[149];
    }
    let t84;
    if ($[150] === Symbol.for("react.memo_cache_sentinel")) {
        t84 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Piyasa Değeri"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 736,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[150] = t84;
    } else {
        t84 = $[150];
    }
    let t85;
    if ($[151] === Symbol.for("react.memo_cache_sentinel")) {
        t85 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t84,
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
                            lineNumber: 743,
                            columnNumber: 206
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 743,
                        columnNumber: 113
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 743,
                columnNumber: 67
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 743,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[151] = t85;
    } else {
        t85 = $[151];
    }
    let t86;
    if ($[152] !== marketStats) {
        t86 = marketStats ? `$${(marketStats.marketCap / 1000000000000).toFixed(2)}T` : "$0.00T";
        $[152] = marketStats;
        $[153] = t86;
    } else {
        t86 = $[153];
    }
    let t87;
    if ($[154] !== t86) {
        t87 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-2xl font-bold text-gray-900",
            children: t86
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 758,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[154] = t86;
        $[155] = t87;
    } else {
        t87 = $[155];
    }
    const t88 = `text-sm font-semibold flex items-center gap-1 ${marketStats && marketStats.marketCapChange24h >= 0 ? "text-green-600" : "text-red-600"}`;
    const t89 = marketStats && marketStats.marketCapChange24h >= 0 ? "\u25B2" : "\u25BC";
    let t90;
    if ($[156] !== marketStats) {
        t90 = marketStats && marketStats.marketCapChange24h !== undefined ? Math.abs(marketStats.marketCapChange24h).toFixed(2) : "0.00";
        $[156] = marketStats;
        $[157] = t90;
    } else {
        t90 = $[157];
    }
    let t91;
    if ($[158] !== t88 || $[159] !== t89 || $[160] !== t90) {
        t91 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t88,
            children: [
                t89,
                " ",
                t90,
                "%"
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 776,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[158] = t88;
        $[159] = t89;
        $[160] = t90;
        $[161] = t91;
    } else {
        t91 = $[161];
    }
    let t92;
    if ($[162] !== t87 || $[163] !== t91) {
        t92 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: [
                t87,
                t91
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 786,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[162] = t87;
        $[163] = t91;
        $[164] = t92;
    } else {
        t92 = $[164];
    }
    let t93;
    if ($[165] === Symbol.for("react.memo_cache_sentinel")) {
        t93 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                    lineNumber: 795,
                    columnNumber: 97
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 795,
                columnNumber: 45
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 795,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[165] = t93;
    } else {
        t93 = $[165];
    }
    let t94;
    if ($[166] !== t92) {
        t94 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t85,
                t92,
                t93
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 802,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[166] = t92;
        $[167] = t94;
    } else {
        t94 = $[167];
    }
    let t95;
    if ($[168] === Symbol.for("react.memo_cache_sentinel")) {
        t95 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Dijital Market 20"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 810,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[168] = t95;
    } else {
        t95 = $[168];
    }
    let t96;
    if ($[169] === Symbol.for("react.memo_cache_sentinel")) {
        t96 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t95,
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
                            lineNumber: 817,
                            columnNumber: 206
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 817,
                        columnNumber: 113
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 817,
                columnNumber: 67
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 817,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[169] = t96;
    } else {
        t96 = $[169];
    }
    let t97;
    if ($[170] === Symbol.for("react.memo_cache_sentinel")) {
        t97 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-2xl font-bold text-gray-900",
                    children: "$193.84"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 824,
                    columnNumber: 33
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm font-semibold text-green-600 flex items-center gap-1",
                    children: "▲ 0.88%"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 824,
                    columnNumber: 96
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 824,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[170] = t97;
    } else {
        t97 = $[170];
    }
    let t98;
    if ($[171] === Symbol.for("react.memo_cache_sentinel")) {
        t98 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t96,
                t97,
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
                            lineNumber: 831,
                            columnNumber: 220
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 831,
                        columnNumber: 168
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 831,
                    columnNumber: 134
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 831,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[171] = t98;
    } else {
        t98 = $[171];
    }
    let t99;
    if ($[172] === Symbol.for("react.memo_cache_sentinel")) {
        t99 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Korku ve Açgözlülük"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 838,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[172] = t99;
    } else {
        t99 = $[172];
    }
    let t100;
    if ($[173] === Symbol.for("react.memo_cache_sentinel")) {
        t100 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t99,
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
                            lineNumber: 845,
                            columnNumber: 207
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 845,
                        columnNumber: 114
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 845,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 845,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[173] = t100;
    } else {
        t100 = $[173];
    }
    let t101;
    if ($[174] !== fearGreedIndex) {
        t101 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-2xl font-bold text-gray-900",
            children: fearGreedIndex
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 852,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[174] = fearGreedIndex;
        $[175] = t101;
    } else {
        t101 = $[175];
    }
    const t102 = fearGreedIndex <= 25 ? "#ef4444" : fearGreedIndex <= 45 ? "#f59e0b" : fearGreedIndex <= 55 ? "#eab308" : fearGreedIndex <= 75 ? "#10b981" : "#059669";
    let t103;
    if ($[176] !== t102) {
        t103 = {
            color: t102
        };
        $[176] = t102;
        $[177] = t103;
    } else {
        t103 = $[177];
    }
    const t104 = fearGreedClassification === "Extreme Fear" ? "A\u015F\u0131r\u0131 Korku" : fearGreedClassification === "Fear" ? "Korku" : fearGreedClassification === "Neutral" ? "N\xF6tr" : fearGreedClassification === "Greed" ? "A\xE7g\xF6zl\xFCl\xFCk" : fearGreedClassification === "Extreme Greed" ? "A\u015F\u0131r\u0131 A\xE7g\xF6zl\xFCl\xFCk" : "N\xF6tr";
    let t105;
    if ($[178] !== t103 || $[179] !== t104) {
        t105 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-xs font-semibold",
            style: t103,
            children: t104
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 872,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[178] = t103;
        $[179] = t104;
        $[180] = t105;
    } else {
        t105 = $[180];
    }
    let t106;
    if ($[181] !== t101 || $[182] !== t105) {
        t106 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: [
                t101,
                t105
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 881,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[181] = t101;
        $[182] = t105;
        $[183] = t106;
    } else {
        t106 = $[183];
    }
    let t107;
    if ($[184] === Symbol.for("react.memo_cache_sentinel")) {
        t107 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 flex",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 bg-red-500"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 890,
                    columnNumber: 51
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 bg-orange-500"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 890,
                    columnNumber: 88
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 bg-yellow-400"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 890,
                    columnNumber: 128
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 bg-green-500"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 890,
                    columnNumber: 168
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 bg-emerald-600"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 890,
                    columnNumber: 207
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 890,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[184] = t107;
    } else {
        t107 = $[184];
    }
    const t108 = `${fearGreedIndex}%`;
    let t109;
    if ($[185] !== t108) {
        t109 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative h-8 rounded-full mt-2 overflow-hidden",
            children: [
                t107,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-0 bottom-0 w-1 bg-white shadow-lg",
                    style: {
                        left: t108
                    }
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 898,
                    columnNumber: 82
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 898,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[185] = t108;
        $[186] = t109;
    } else {
        t109 = $[186];
    }
    let t110;
    if ($[187] !== t106 || $[188] !== t109) {
        t110 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t100,
                t106,
                t109
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 908,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[187] = t106;
        $[188] = t109;
        $[189] = t110;
    } else {
        t110 = $[189];
    }
    let t111;
    if ($[190] === Symbol.for("react.memo_cache_sentinel")) {
        t111 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Altcoin Sezonu"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 917,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[190] = t111;
    } else {
        t111 = $[190];
    }
    let t112;
    if ($[191] === Symbol.for("react.memo_cache_sentinel")) {
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
                            lineNumber: 924,
                            columnNumber: 208
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 924,
                        columnNumber: 115
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 924,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 924,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[191] = t112;
    } else {
        t112 = $[191];
    }
    let t113;
    if ($[192] !== altcoinSeason) {
        t113 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-2xl font-bold text-gray-900",
                children: [
                    altcoinSeason,
                    "/100"
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 931,
                columnNumber: 34
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 931,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[192] = altcoinSeason;
        $[193] = t113;
    } else {
        t113 = $[193];
    }
    let t114;
    if ($[194] === Symbol.for("react.memo_cache_sentinel")) {
        t114 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-300 via-green-300 to-green-500"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 939,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[194] = t114;
    } else {
        t114 = $[194];
    }
    const t115 = `${altcoinSeason}%`;
    let t116;
    if ($[195] !== t115) {
        t116 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative h-8 rounded-full overflow-hidden",
            children: [
                t114,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-0 bottom-0 w-1 bg-white shadow-lg",
                    style: {
                        left: t115
                    }
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 947,
                    columnNumber: 77
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 947,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[195] = t115;
        $[196] = t116;
    } else {
        t116 = $[196];
    }
    let t117;
    if ($[197] === Symbol.for("react.memo_cache_sentinel")) {
        t117 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-between mt-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-gray-600",
                    children: "Bitcoin"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 957,
                    columnNumber: 55
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-gray-600",
                    children: "Altcoin"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 957,
                    columnNumber: 109
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 957,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[197] = t117;
    } else {
        t117 = $[197];
    }
    let t118;
    if ($[198] !== t116) {
        t118 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative mt-2",
            children: [
                t116,
                t117
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 964,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[198] = t116;
        $[199] = t118;
    } else {
        t118 = $[199];
    }
    let t119;
    if ($[200] !== t113 || $[201] !== t118) {
        t119 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t112,
                t113,
                t118
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 972,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[200] = t113;
        $[201] = t118;
        $[202] = t119;
    } else {
        t119 = $[202];
    }
    let t120;
    if ($[203] === Symbol.for("react.memo_cache_sentinel")) {
        t120 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Ortalama Kripto RSI"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 981,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[203] = t120;
    } else {
        t120 = $[203];
    }
    let t121;
    if ($[204] === Symbol.for("react.memo_cache_sentinel")) {
        t121 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-between mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center gap-2",
                children: [
                    t120,
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
                            lineNumber: 988,
                            columnNumber: 208
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 988,
                        columnNumber: 115
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 988,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 988,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[204] = t121;
    } else {
        t121 = $[204];
    }
    let t122;
    if ($[205] !== averageRSI) {
        t122 = averageRSI.toFixed(2);
        $[205] = averageRSI;
        $[206] = t122;
    } else {
        t122 = $[206];
    }
    let t123;
    if ($[207] !== t122) {
        t123 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "mb-2",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-2xl font-bold text-gray-900",
                children: t122
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 1003,
                columnNumber: 34
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1003,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[207] = t122;
        $[208] = t123;
    } else {
        t123 = $[208];
    }
    let t124;
    if ($[209] === Symbol.for("react.memo_cache_sentinel")) {
        t124 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-500 via-green-400 via-yellow-400 to-pink-500"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1011,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[209] = t124;
    } else {
        t124 = $[209];
    }
    const t125 = `${averageRSI}%`;
    let t126;
    if ($[210] !== t125) {
        t126 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative h-8 rounded-full overflow-hidden",
            children: [
                t124,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute top-0 bottom-0 w-1 bg-white shadow-lg",
                    style: {
                        left: t125
                    }
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1019,
                    columnNumber: 77
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1019,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[210] = t125;
        $[211] = t126;
    } else {
        t126 = $[211];
    }
    let t127;
    if ($[212] === Symbol.for("react.memo_cache_sentinel")) {
        t127 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex justify-between mt-1",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-blue-600",
                    children: "Aşırı Satım"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1029,
                    columnNumber: 55
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-pink-600",
                    children: "Aşırı Alım"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1029,
                    columnNumber: 113
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1029,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[212] = t127;
    } else {
        t127 = $[212];
    }
    let t128;
    if ($[213] !== t126) {
        t128 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative mt-2",
            children: [
                t126,
                t127
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1036,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[213] = t126;
        $[214] = t128;
    } else {
        t128 = $[214];
    }
    let t129;
    if ($[215] !== t123 || $[216] !== t128) {
        t129 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t121,
                t123,
                t128
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1044,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[215] = t123;
        $[216] = t128;
        $[217] = t129;
    } else {
        t129 = $[217];
    }
    let t130;
    let t131;
    if ($[218] === Symbol.for("react.memo_cache_sentinel")) {
        t130 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "w-6 h-6 bg-gray-300 rounded-full"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1054,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        t131 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
            className: "text-sm font-semibold text-gray-700",
            children: "Coinpaper.com"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1055,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[218] = t130;
        $[219] = t131;
    } else {
        t130 = $[218];
        t131 = $[219];
    }
    let t132;
    if ($[220] === Symbol.for("react.memo_cache_sentinel")) {
        t132 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center gap-2 mb-2",
            children: [
                t130,
                t131,
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
                        lineNumber: 1064,
                        columnNumber: 149
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1064,
                    columnNumber: 70
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "text-xs text-gray-500",
                    children: "3 saat"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1064,
                    columnNumber: 749
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1064,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[220] = t132;
    } else {
        t132 = $[220];
    }
    let t133;
    if ($[221] === Symbol.for("react.memo_cache_sentinel")) {
        t133 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer",
            children: [
                t132,
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-sm text-gray-700 line-clamp-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-yellow-500",
                            children: "❤️"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 1071,
                            columnNumber: 183
                        }, ("TURBOPACK compile-time value", void 0)),
                        " YENİ: #Visa, CEMEA bölgesinde #stablecoin ödeme hizmetlerini genişletmek için Aquanow ile ortaklık kurdu, veren ve alan kuruluşların..."
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1071,
                    columnNumber: 131
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1071,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[221] = t133;
    } else {
        t133 = $[221];
    }
    let t134;
    if ($[222] !== t110 || $[223] !== t119 || $[224] !== t129 || $[225] !== t94) {
        t134 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bg-white border-b border-gray-200 py-6",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full px-4",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4",
                    children: [
                        t94,
                        t98,
                        t110,
                        t119,
                        t129,
                        t133
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                    lineNumber: 1078,
                    columnNumber: 97
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 1078,
                columnNumber: 68
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
            lineNumber: 1078,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
        $[222] = t110;
        $[223] = t119;
        $[224] = t129;
        $[225] = t94;
        $[226] = t134;
    } else {
        t134 = $[226];
    }
    let t135;
    if ($[227] !== t134 || $[228] !== t69 || $[229] !== t70 || $[230] !== t83) {
        t135 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                t69,
                t70,
                t83,
                t134
            ]
        }, void 0, true);
        $[227] = t134;
        $[228] = t69;
        $[229] = t70;
        $[230] = t83;
        $[231] = t135;
    } else {
        t135 = $[231];
    }
    return t135;
};
_s(Navbar, "RTYlRyjZ5ifwGxM6d2QLyeRQm1s=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["useLanguage"],
        __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Navbar;
const __TURBOPACK__default__export__ = Navbar;
function _temp() {
    if ("TURBOPACK compile-time truthy", 1) {
        const storedUser = localStorage.getItem("currentUser");
        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch  {
                return null;
            }
        }
    }
    return null;
}
function _temp2(e) {
    return e.stopPropagation();
}
function _temp3(e_0) {
    return e_0.stopPropagation();
}
function _temp4(e_1) {
    return e_1.stopPropagation();
}
function _temp5(e_2) {
    return e_2.stopPropagation();
}
function _temp6() {
    window.location.reload();
}
function _temp7(e_5) {
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
"[project]/my-crypto-tracker/src/components/PriceChart.tsx [client] (ecmascript)", ((__turbopack_context__) => {
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
const PriceChart = (t0)=>{
    _s();
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["c"])(131);
    if ($[0] !== "016e1ff238ef61f7282b419d904e344e5db9be9c07bb601013f554ccf30d8b69") {
        for(let $i = 0; $i < 131; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "016e1ff238ef61f7282b419d904e344e5db9be9c07bb601013f554ccf30d8b69";
    }
    const { data, width: t1, height: t2, timeRange } = t0;
    const width = t1 === undefined ? 1200 : t1;
    const height = t2 === undefined ? 400 : t2;
    const [hoveredPoint, setHoveredPoint] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const svgRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    if (!data || !Array.isArray(data) || data.length === 0) {
        let t3;
        if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
            t3 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex items-center justify-center h-96 text-gray-500",
                children: "Grafik verisi bulunamadı"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 34,
                columnNumber: 12
            }, ("TURBOPACK compile-time value", void 0));
            $[1] = t3;
        } else {
            t3 = $[1];
        }
        return t3;
    }
    let t3;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        t3 = {
            top: 20,
            right: 20,
            bottom: 55,
            left: 60
        };
        $[2] = t3;
    } else {
        t3 = $[2];
    }
    const margin = t3;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    let minPrice;
    let t4;
    if ($[3] !== data) {
        const prices = data.map(_temp);
        minPrice = Math.min(...prices);
        t4 = Math.max(...prices);
        $[3] = data;
        $[4] = minPrice;
        $[5] = t4;
    } else {
        minPrice = $[4];
        t4 = $[5];
    }
    const maxPrice = t4;
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1;
    let minTime;
    let t5;
    if ($[6] !== data) {
        const timestamps = data.map(_temp2);
        minTime = Math.min(...timestamps);
        t5 = Math.max(...timestamps);
        $[6] = data;
        $[7] = minTime;
        $[8] = t5;
    } else {
        minTime = $[7];
        t5 = $[8];
    }
    const maxTime = t5;
    let formatDate;
    let formatFullPrice;
    let lineColor;
    let path_0;
    let svgHeight;
    let t10;
    let t11;
    let t12;
    let t13;
    let t14;
    let t15;
    let t16;
    let t17;
    let t18;
    let t19;
    let t20;
    let t21;
    let t22;
    let t6;
    let t7;
    let t8;
    let t9;
    if ($[9] !== chartHeight || $[10] !== chartWidth || $[11] !== data || $[12] !== height || $[13] !== maxTime || $[14] !== minPrice || $[15] !== minTime || $[16] !== pricePadding || $[17] !== priceRange || $[18] !== timeRange || $[19] !== width) {
        const yTickValues = [];
        for(let i = 0; i <= 5; i++){
            const value = minPrice - pricePadding + (priceRange + pricePadding * 2) * (i / 5);
            yTickValues.push(value);
        }
        const getXAxisLabels = ()=>{
            const labels = [];
            const labelCount = timeRange === "1y" ? 12 : timeRange === "30d" ? 6 : timeRange === "7d" ? 7 : 6;
            for(let i_0 = 0; i_0 <= labelCount; i_0++){
                const index = Math.floor((data.length - 1) * (i_0 / labelCount));
                if (index >= 0 && index < data.length) {
                    const timestamp = data[index].timestamp;
                    const date = new Date(timestamp);
                    let label;
                    if (timeRange === "1y") {
                        label = date.getFullYear().toString();
                    } else {
                        if (timeRange === "30d") {
                            const monthNames = [
                                "Jan",
                                "Feb",
                                "Mar",
                                "Apr",
                                "May",
                                "Jun",
                                "Jul",
                                "Aug",
                                "Sep",
                                "Oct",
                                "Nov",
                                "Dec"
                            ];
                            label = monthNames[date.getMonth()] + " '" + date.getFullYear().toString().slice(-2);
                        } else {
                            if (timeRange === "7d") {
                                const dayNames = [
                                    "Sun",
                                    "Mon",
                                    "Tue",
                                    "Wed",
                                    "Thu",
                                    "Fri",
                                    "Sat"
                                ];
                                label = dayNames[date.getDay()];
                            } else {
                                label = date.getHours().toString().padStart(2, "0") + ":00";
                            }
                        }
                    }
                    labels.push({
                        timestamp,
                        label
                    });
                }
            }
            return labels;
        };
        const xAxisLabels = getXAxisLabels();
        let t23;
        if ($[42] !== chartWidth || $[43] !== maxTime || $[44] !== minTime) {
            t23 = (timestamp_0)=>(timestamp_0 - minTime) / (maxTime - minTime) * chartWidth;
            $[42] = chartWidth;
            $[43] = maxTime;
            $[44] = minTime;
            $[45] = t23;
        } else {
            t23 = $[45];
        }
        const xScale = t23;
        let t24;
        if ($[46] !== chartHeight || $[47] !== minPrice || $[48] !== pricePadding || $[49] !== priceRange) {
            t24 = (price)=>chartHeight - (price - (minPrice - pricePadding)) / (priceRange + pricePadding * 2) * chartHeight;
            $[46] = chartHeight;
            $[47] = minPrice;
            $[48] = pricePadding;
            $[49] = priceRange;
            $[50] = t24;
        } else {
            t24 = $[50];
        }
        const yScale = t24;
        const formatPrice = _temp3;
        let t25;
        if ($[51] !== data || $[52] !== xScale || $[53] !== yScale) {
            t25 = ()=>{
                if (data.length === 0) {
                    return "";
                }
                let path = `M ${xScale(data[0].timestamp)},${yScale(data[0].price)}`;
                for(let i_1 = 1; i_1 < data.length; i_1++){
                    path = path + ` L ${xScale(data[i_1].timestamp)},${yScale(data[i_1].price)}`;
                }
                return path;
            };
            $[51] = data;
            $[52] = xScale;
            $[53] = yScale;
            $[54] = t25;
        } else {
            t25 = $[54];
        }
        const createPath = t25;
        path_0 = createPath();
        const isPositive = data[data.length - 1].price >= data[0].price;
        lineColor = isPositive ? "#10b981" : "#ef4444";
        let t26;
        if ($[55] !== chartHeight || $[56] !== chartWidth || $[57] !== data || $[58] !== maxTime || $[59] !== minTime || $[60] !== xScale || $[61] !== yScale) {
            t26 = (e)=>{
                if (!svgRef.current) {
                    return;
                }
                const rect = svgRef.current.getBoundingClientRect();
                const mouseX = e.clientX - rect.left - margin.left;
                const mouseY = e.clientY - rect.top - margin.top;
                if (mouseX < 0 || mouseX > chartWidth || mouseY < 0 || mouseY > chartHeight) {
                    setHoveredPoint(null);
                    return;
                }
                const mouseTimestamp = minTime + mouseX / chartWidth * (maxTime - minTime);
                let closestIndex = 0;
                let minDistance = Math.abs(data[0].timestamp - mouseTimestamp);
                for(let i_2 = 1; i_2 < data.length; i_2++){
                    const distance = Math.abs(data[i_2].timestamp - mouseTimestamp);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestIndex = i_2;
                    }
                }
                const closestPoint = data[closestIndex];
                const x = margin.left + xScale(closestPoint.timestamp);
                const y = margin.top + yScale(closestPoint.price);
                setHoveredPoint({
                    x,
                    y,
                    price: closestPoint.price,
                    timestamp: closestPoint.timestamp
                });
            };
            $[55] = chartHeight;
            $[56] = chartWidth;
            $[57] = data;
            $[58] = maxTime;
            $[59] = minTime;
            $[60] = xScale;
            $[61] = yScale;
            $[62] = t26;
        } else {
            t26 = $[62];
        }
        const handleMouseMove = t26;
        let t27;
        if ($[63] === Symbol.for("react.memo_cache_sentinel")) {
            t27 = ()=>{
                setHoveredPoint(null);
            };
            $[63] = t27;
        } else {
            t27 = $[63];
        }
        const handleMouseLeave = t27;
        let t28;
        if ($[64] !== timeRange) {
            t28 = (timestamp_1)=>{
                const date_0 = new Date(timestamp_1);
                if (timeRange === "5y" || timeRange === "3y") {
                    return date_0.toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "short"
                    });
                } else {
                    if (timeRange === "1y") {
                        return date_0.toLocaleDateString("tr-TR", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                        });
                    } else {
                        if (timeRange === "30d") {
                            return date_0.toLocaleDateString("tr-TR", {
                                month: "short",
                                day: "numeric"
                            });
                        } else {
                            if (timeRange === "7d") {
                                return date_0.toLocaleDateString("tr-TR", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short"
                                });
                            } else {
                                return date_0.toLocaleString("tr-TR", {
                                    day: "numeric",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                });
                            }
                        }
                    }
                }
            };
            $[64] = timeRange;
            $[65] = t28;
        } else {
            t28 = $[65];
        }
        formatDate = t28;
        formatFullPrice = _temp4;
        svgHeight = height + 30;
        t22 = "bg-white rounded-xl p-4 w-full overflow-x-auto relative";
        t6 = svgRef;
        t7 = width;
        t8 = svgHeight;
        t9 = "overflow-visible";
        const t29 = `${svgHeight}px`;
        if ($[66] !== t29) {
            t10 = {
                maxWidth: "100%",
                minHeight: t29
            };
            $[66] = t29;
            $[67] = t10;
        } else {
            t10 = $[67];
        }
        t11 = handleMouseMove;
        t12 = handleMouseLeave;
        if ($[68] === Symbol.for("react.memo_cache_sentinel")) {
            t13 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pattern", {
                    id: "grid",
                    width: "10",
                    height: "10",
                    patternUnits: "userSpaceOnUse",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                        d: "M 10 0 L 0 0 0 10",
                        fill: "none",
                        stroke: "#f3f4f6",
                        strokeWidth: "0.5"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 317,
                        columnNumber: 91
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                    lineNumber: 317,
                    columnNumber: 19
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 317,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0));
            $[68] = t13;
        } else {
            t13 = $[68];
        }
        if ($[69] !== chartHeight || $[70] !== chartWidth) {
            t14 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: margin.left,
                y: margin.top,
                width: chartWidth,
                height: chartHeight,
                fill: "url(#grid)"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 323,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0));
            $[69] = chartHeight;
            $[70] = chartWidth;
            $[71] = t14;
        } else {
            t14 = $[71];
        }
        t15 = yTickValues.map((value_0, index_0)=>{
            const y_0 = margin.top + yScale(value_0);
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: margin.left,
                y1: y_0,
                x2: margin.left + chartWidth,
                y2: y_0,
                stroke: "#e5e7eb",
                strokeWidth: "1",
                strokeDasharray: "2 2",
                opacity: "0.5"
            }, `grid-y-${index_0}`, false, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 332,
                columnNumber: 14
            }, ("TURBOPACK compile-time value", void 0));
        });
        t16 = xAxisLabels.map((item, index_1)=>{
            const x_0 = margin.left + xScale(item.timestamp);
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: x_0,
                y1: margin.top,
                x2: x_0,
                y2: margin.top + chartHeight,
                stroke: "#e5e7eb",
                strokeWidth: "1",
                strokeDasharray: "2 2",
                opacity: "0.5"
            }, `grid-x-${index_1}`, false, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 336,
                columnNumber: 14
            }, ("TURBOPACK compile-time value", void 0));
        });
        let t30;
        if ($[72] === Symbol.for("react.memo_cache_sentinel")) {
            t30 = {
                cursor: "crosshair"
            };
            $[72] = t30;
        } else {
            t30 = $[72];
        }
        if ($[73] !== chartHeight || $[74] !== chartWidth) {
            t17 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                x: margin.left,
                y: margin.top,
                width: chartWidth,
                height: chartHeight,
                fill: "transparent",
                style: t30
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 348,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0));
            $[73] = chartHeight;
            $[74] = chartWidth;
            $[75] = t17;
        } else {
            t17 = $[75];
        }
        const t31 = margin.top + chartHeight;
        if ($[76] !== t31) {
            t18 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: margin.left,
                y1: margin.top,
                x2: margin.left,
                y2: t31,
                stroke: "#d1d5db",
                strokeWidth: "2"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 357,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0));
            $[76] = t31;
            $[77] = t18;
        } else {
            t18 = $[77];
        }
        const t32 = margin.top + chartHeight;
        const t33 = margin.left + chartWidth;
        const t34 = margin.top + chartHeight;
        if ($[78] !== t32 || $[79] !== t33 || $[80] !== t34) {
            t19 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                x1: margin.left,
                y1: t32,
                x2: t33,
                y2: t34,
                stroke: "#d1d5db",
                strokeWidth: "2"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 367,
                columnNumber: 13
            }, ("TURBOPACK compile-time value", void 0));
            $[78] = t32;
            $[79] = t33;
            $[80] = t34;
            $[81] = t19;
        } else {
            t19 = $[81];
        }
        t20 = yTickValues.map((value_1, index_2)=>{
            const y_1 = margin.top + yScale(value_1);
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                        x1: margin.left - 8,
                        y1: y_1,
                        x2: margin.left,
                        y2: y_1,
                        stroke: "#9ca3af",
                        strokeWidth: "1.5"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 377,
                        columnNumber: 31
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: margin.left - 15,
                        y: y_1 + 5,
                        textAnchor: "end",
                        fontSize: "13",
                        fill: "#374151",
                        className: "font-semibold",
                        fontWeight: "600",
                        children: formatPrice(value_1)
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 377,
                        columnNumber: 130
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, index_2, true, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 377,
                columnNumber: 14
            }, ("TURBOPACK compile-time value", void 0));
        });
        t21 = xAxisLabels.map((item_0, index_3)=>{
            const x_1 = margin.left + xScale(item_0.timestamp);
            const yPos = margin.top + chartHeight;
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                        x1: x_1,
                        y1: yPos,
                        x2: x_1,
                        y2: yPos + 10,
                        stroke: "#9ca3af",
                        strokeWidth: "2"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 382,
                        columnNumber: 31
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                        x: x_1,
                        y: yPos + 28,
                        textAnchor: "middle",
                        fontSize: "12",
                        fill: "#374151",
                        className: "font-semibold",
                        fontWeight: "600",
                        style: {
                            dominantBaseline: "hanging"
                        },
                        children: item_0.label
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 382,
                        columnNumber: 115
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, index_3, true, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 382,
                columnNumber: 14
            }, ("TURBOPACK compile-time value", void 0));
        });
        $[9] = chartHeight;
        $[10] = chartWidth;
        $[11] = data;
        $[12] = height;
        $[13] = maxTime;
        $[14] = minPrice;
        $[15] = minTime;
        $[16] = pricePadding;
        $[17] = priceRange;
        $[18] = timeRange;
        $[19] = width;
        $[20] = formatDate;
        $[21] = formatFullPrice;
        $[22] = lineColor;
        $[23] = path_0;
        $[24] = svgHeight;
        $[25] = t10;
        $[26] = t11;
        $[27] = t12;
        $[28] = t13;
        $[29] = t14;
        $[30] = t15;
        $[31] = t16;
        $[32] = t17;
        $[33] = t18;
        $[34] = t19;
        $[35] = t20;
        $[36] = t21;
        $[37] = t22;
        $[38] = t6;
        $[39] = t7;
        $[40] = t8;
        $[41] = t9;
    } else {
        formatDate = $[20];
        formatFullPrice = $[21];
        lineColor = $[22];
        path_0 = $[23];
        svgHeight = $[24];
        t10 = $[25];
        t11 = $[26];
        t12 = $[27];
        t13 = $[28];
        t14 = $[29];
        t15 = $[30];
        t16 = $[31];
        t17 = $[32];
        t18 = $[33];
        t19 = $[34];
        t20 = $[35];
        t21 = $[36];
        t22 = $[37];
        t6 = $[38];
        t7 = $[39];
        t8 = $[40];
        t9 = $[41];
    }
    let t23;
    if ($[82] !== lineColor) {
        t23 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                id: "areaGradient",
                x1: "0%",
                y1: "0%",
                x2: "0%",
                y2: "100%",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                        offset: "0%",
                        stopColor: lineColor,
                        stopOpacity: "0.2"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 445,
                        columnNumber: 85
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                        offset: "100%",
                        stopColor: lineColor,
                        stopOpacity: "0.05"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 445,
                        columnNumber: 145
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 445,
                columnNumber: 17
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
            lineNumber: 445,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[82] = lineColor;
        $[83] = t23;
    } else {
        t23 = $[83];
    }
    const t24 = path_0 + ` L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
    let t25;
    if ($[84] !== t24) {
        t25 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
            transform: `translate(${margin.left}, ${margin.top})`,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: t24,
                fill: "url(#areaGradient)"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 454,
                columnNumber: 69
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
            lineNumber: 454,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[84] = t24;
        $[85] = t25;
    } else {
        t25 = $[85];
    }
    let t26;
    if ($[86] !== lineColor || $[87] !== path_0) {
        t26 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
            transform: `translate(${margin.left}, ${margin.top})`,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: path_0,
                fill: "none",
                stroke: lineColor,
                strokeWidth: "3.5",
                strokeLinecap: "round",
                strokeLinejoin: "round"
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 462,
                columnNumber: 69
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
            lineNumber: 462,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[86] = lineColor;
        $[87] = path_0;
        $[88] = t26;
    } else {
        t26 = $[88];
    }
    let t27;
    if ($[89] !== chartHeight || $[90] !== hoveredPoint || $[91] !== lineColor) {
        t27 = hoveredPoint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                    x1: hoveredPoint.x,
                    y1: margin.top,
                    x2: hoveredPoint.x,
                    y2: margin.top + chartHeight,
                    stroke: "#374151",
                    strokeWidth: "2",
                    strokeDasharray: "4 4",
                    opacity: "0.6"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                    lineNumber: 471,
                    columnNumber: 29
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: hoveredPoint.x,
                    cy: hoveredPoint.y,
                    r: "6",
                    fill: lineColor,
                    stroke: "white",
                    strokeWidth: "3"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                    lineNumber: 471,
                    columnNumber: 192
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: hoveredPoint.x,
                    cy: hoveredPoint.y,
                    r: "8",
                    fill: lineColor,
                    opacity: "0.2"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                    lineNumber: 471,
                    columnNumber: 296
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true);
        $[89] = chartHeight;
        $[90] = hoveredPoint;
        $[91] = lineColor;
        $[92] = t27;
    } else {
        t27 = $[92];
    }
    const t28 = margin.top + chartHeight / 2;
    const t29 = `rotate(-90 ${margin.left - 65} ${margin.top + chartHeight / 2})`;
    let t30;
    if ($[93] !== t28 || $[94] !== t29) {
        t30 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
            x: margin.left - 65,
            y: t28,
            textAnchor: "middle",
            fontSize: "12",
            fill: "#6b7280",
            className: "font-semibold",
            transform: t29,
            children: "Fiyat (USD)"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
            lineNumber: 483,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[93] = t28;
        $[94] = t29;
        $[95] = t30;
    } else {
        t30 = $[95];
    }
    const t31 = margin.left + chartWidth / 2;
    const t32 = svgHeight - 5;
    let t33;
    if ($[96] !== t31 || $[97] !== t32) {
        t33 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
            x: t31,
            y: t32,
            textAnchor: "middle",
            fontSize: "11",
            fill: "#6b7280",
            className: "font-semibold",
            children: "Zaman"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
            lineNumber: 494,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[96] = t31;
        $[97] = t32;
        $[98] = t33;
    } else {
        t33 = $[98];
    }
    let t34;
    if ($[99] !== t10 || $[100] !== t11 || $[101] !== t12 || $[102] !== t13 || $[103] !== t14 || $[104] !== t15 || $[105] !== t16 || $[106] !== t17 || $[107] !== t18 || $[108] !== t19 || $[109] !== t20 || $[110] !== t21 || $[111] !== t23 || $[112] !== t25 || $[113] !== t26 || $[114] !== t27 || $[115] !== t30 || $[116] !== t33 || $[117] !== t6 || $[118] !== t7 || $[119] !== t8 || $[120] !== t9) {
        t34 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            ref: t6,
            width: t7,
            height: t8,
            className: t9,
            style: t10,
            onMouseMove: t11,
            onMouseLeave: t12,
            children: [
                t13,
                t14,
                t15,
                t16,
                t17,
                t18,
                t19,
                t20,
                t21,
                t23,
                t25,
                t26,
                t27,
                t30,
                t33
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
            lineNumber: 503,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[99] = t10;
        $[100] = t11;
        $[101] = t12;
        $[102] = t13;
        $[103] = t14;
        $[104] = t15;
        $[105] = t16;
        $[106] = t17;
        $[107] = t18;
        $[108] = t19;
        $[109] = t20;
        $[110] = t21;
        $[111] = t23;
        $[112] = t25;
        $[113] = t26;
        $[114] = t27;
        $[115] = t30;
        $[116] = t33;
        $[117] = t6;
        $[118] = t7;
        $[119] = t8;
        $[120] = t9;
        $[121] = t34;
    } else {
        t34 = $[121];
    }
    let t35;
    if ($[122] !== formatDate || $[123] !== formatFullPrice || $[124] !== hoveredPoint || $[125] !== width) {
        t35 = hoveredPoint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "absolute bg-gray-900 text-white rounded-lg px-4 py-3 shadow-xl pointer-events-none z-10 whitespace-nowrap border border-gray-700",
            style: {
                left: `${24 + Math.min(hoveredPoint.x + 10, width - 200)}px`,
                top: `${24 + Math.max(hoveredPoint.y - 70, 20)}px`
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-xs text-gray-300 mb-2 font-medium",
                    children: formatDate(hoveredPoint.timestamp)
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                    lineNumber: 535,
                    columnNumber: 8
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-base font-bold",
                    children: formatFullPrice(hoveredPoint.price)
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                    lineNumber: 535,
                    columnNumber: 106
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45"
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                    lineNumber: 535,
                    columnNumber: 186
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
            lineNumber: 532,
            columnNumber: 27
        }, ("TURBOPACK compile-time value", void 0));
        $[122] = formatDate;
        $[123] = formatFullPrice;
        $[124] = hoveredPoint;
        $[125] = width;
        $[126] = t35;
    } else {
        t35 = $[126];
    }
    let t36;
    if ($[127] !== t22 || $[128] !== t34 || $[129] !== t35) {
        t36 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: t22,
            children: [
                t34,
                t35
            ]
        }, void 0, true, {
            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
            lineNumber: 546,
            columnNumber: 11
        }, ("TURBOPACK compile-time value", void 0));
        $[127] = t22;
        $[128] = t34;
        $[129] = t35;
        $[130] = t36;
    } else {
        t36 = $[130];
    }
    return t36;
};
_s(PriceChart, "RbJG+W1XFzWRcW7UZ1a6IJkLANE=");
_c = PriceChart;
const __TURBOPACK__default__export__ = PriceChart;
function _temp(d) {
    return d.price;
}
function _temp2(d_0) {
    return d_0.timestamp;
}
function _temp3(price_0) {
    if (price_0 >= 1000000) {
        return "$" + (price_0 / 1000000).toFixed(2) + "M";
    } else {
        if (price_0 >= 1000) {
            return "$" + (price_0 / 1000).toFixed(2) + "K";
        } else {
            if (price_0 >= 1) {
                return "$" + price_0.toFixed(2);
            } else {
                return "$" + price_0.toFixed(4);
            }
        }
    }
}
function _temp4(price_1) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: price_1 < 1 ? 6 : 2
    }).format(price_1);
}
var _c;
__turbopack_context__.k.register(_c, "PriceChart");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/head.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$Navbar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/components/Navbar.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$MarketStatsBar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/components/MarketStatsBar.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$PriceChart$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/components/PriceChart.tsx [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
const CoinDetailPage = ()=>{
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const { coinId } = router.query;
    const [coin, setCoin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [coinDetails, setCoinDetails] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [chartData, setChartData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        prices: [],
        priceData: []
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [timeRange, setTimeRange] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('7d');
    const [chartLoading, setChartLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [detailsLoading, setDetailsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [converterAmount, setConverterAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('1');
    const [converterCurrency, setConverterCurrency] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('usd');
    const [news, setNews] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [expandedBlock, setExpandedBlock] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [tooltipContent, setTooltipContent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [tooltipPosition, setTooltipPosition] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [portfolio, setPortfolio] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        "CoinDetailPage.useState": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                const saved = localStorage.getItem('portfolio');
                return saved ? JSON.parse(saved) : [];
            }
            //TURBOPACK unreachable
            ;
        }
    }["CoinDetailPage.useState"]);
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        message: '',
        visible: false
    });
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
    // Zaman dilimi mapping
    const timeRangeMap = {
        '24h': {
            days: 1,
            label: '24 Saat'
        },
        '7d': {
            days: 7,
            label: '1 Hafta'
        },
        '30d': {
            days: 30,
            label: '1 Ay'
        },
        '1y': {
            days: 365,
            label: '1 Yıl'
        },
        '3y': {
            days: 1095,
            label: '3 Yıl'
        },
        '5y': {
            days: 1825,
            label: '5 Yıl'
        }
    };
    // Portfolio'yu localStorage'dan yükle ve coinId değiştiğinde güncelle
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CoinDetailPage.useEffect": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                const saved_0 = localStorage.getItem('portfolio');
                if (saved_0) {
                    try {
                        const portfolioIds = JSON.parse(saved_0);
                        setPortfolio(portfolioIds);
                    } catch (error_0) {
                        console.error('Portfolio verisi parse edilemedi:', error_0);
                    }
                }
            }
        }
    }["CoinDetailPage.useEffect"], [
        coinId
    ]);
    // Coin detaylarını çek
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CoinDetailPage.useEffect": ()=>{
            if (!coinId || typeof coinId !== 'string') return;
            const fetchCoinDetail = {
                "CoinDetailPage.useEffect.fetchCoinDetail": async ()=>{
                    setLoading(true);
                    setError(null);
                    try {
                        const response = await fetch(`/api/coins/${coinId}`);
                        if (!response.ok) {
                            throw new Error('Coin bulunamadı');
                        }
                        const data = await response.json();
                        setCoin(data);
                    } catch (err) {
                        console.error('Coin detay hatası:', err);
                        setError(err instanceof Error ? err.message : 'Coin yüklenirken hata oluştu');
                    } finally{
                        setLoading(false);
                    }
                }
            }["CoinDetailPage.useEffect.fetchCoinDetail"];
            fetchCoinDetail();
        }
    }["CoinDetailPage.useEffect"], [
        coinId
    ]);
    // Grafik verilerini çek
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CoinDetailPage.useEffect": ()=>{
            if (!coinId || typeof coinId !== 'string') return;
            const fetchChartData = {
                "CoinDetailPage.useEffect.fetchChartData": async ()=>{
                    setChartLoading(true);
                    try {
                        const days = timeRangeMap[timeRange].days;
                        const response_0 = await fetch(`/api/chart/${coinId}?days=${days}`);
                        const data_0 = await response_0.json();
                        if (data_0.priceData && Array.isArray(data_0.priceData) && data_0.priceData.length > 0) {
                            setChartData(data_0);
                        } else if (data_0.prices && Array.isArray(data_0.prices) && data_0.prices.length > 0) {
                            // Eğer priceData yoksa ama prices varsa, priceData oluştur
                            // API'den gelen veri yapısına göre timestamp'leri tahmin et
                            const now = Date.now();
                            const interval = days * 24 * 60 * 60 * 1000 / data_0.prices.length;
                            const priceData = data_0.prices.map({
                                "CoinDetailPage.useEffect.fetchChartData.priceData": (price, index)=>({
                                        timestamp: now - (data_0.prices.length - index) * interval,
                                        price: price
                                    })
                            }["CoinDetailPage.useEffect.fetchChartData.priceData"]);
                            setChartData({
                                ...data_0,
                                priceData: priceData
                            });
                        } else {
                            setChartData({
                                prices: [],
                                priceData: [],
                                error: data_0.error || 'Veri bulunamadı'
                            });
                        }
                    } catch (err_0) {
                        console.error('Grafik verisi hatası:', err_0);
                        setChartData({
                            prices: [],
                            priceData: []
                        });
                    } finally{
                        setChartLoading(false);
                    }
                }
            }["CoinDetailPage.useEffect.fetchChartData"];
            fetchChartData();
        }
    }["CoinDetailPage.useEffect"], [
        coinId,
        timeRange
    ]);
    // Coin detaylarını çek (CoinGecko'dan)
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CoinDetailPage.useEffect": ()=>{
            if (!coinId || typeof coinId !== 'string') return;
            // coinId değiştiğinde coinDetails'i sıfırla
            setCoinDetails(null);
            const fetchCoinDetails = {
                "CoinDetailPage.useEffect.fetchCoinDetails": async ()=>{
                    setDetailsLoading(true);
                    try {
                        const response_1 = await fetch(`/api/coins/${coinId}/details`);
                        const data_1 = await response_1.json();
                        if (!data_1.error) {
                            setCoinDetails(data_1);
                            // 7 günlük aralığı hesapla
                            if (chartData.prices && chartData.prices.length > 0) {
                                const prices7d = chartData.prices;
                                const high7d = Math.max(...prices7d);
                                const low7d = Math.min(...prices7d);
                                setCoinDetails({
                                    "CoinDetailPage.useEffect.fetchCoinDetails": (prev)=>prev ? {
                                            ...prev,
                                            priceRange7d: {
                                                high: high7d,
                                                low: low7d
                                            }
                                        } : null
                                }["CoinDetailPage.useEffect.fetchCoinDetails"]);
                            }
                        }
                    } catch (err_1) {
                        console.error('Coin detayları hatası:', err_1);
                    } finally{
                        setDetailsLoading(false);
                    }
                }
            }["CoinDetailPage.useEffect.fetchCoinDetails"];
            fetchCoinDetails();
        }
    }["CoinDetailPage.useEffect"], [
        coinId
    ]);
    // Global market stats'ı çek
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CoinDetailPage.useEffect": ()=>{
            const fetchGlobalStats = {
                "CoinDetailPage.useEffect.fetchGlobalStats": async ()=>{
                    try {
                        const response_2 = await fetch('/api/global');
                        const data_2 = await response_2.json();
                        if (data_2) {
                            setMarketStats({
                                totalCoins: data_2.totalCoins || 0,
                                totalExchanges: data_2.totalExchanges || 1414,
                                marketCap: data_2.marketCap || 0,
                                marketCapChange24h: data_2.marketCapChange24h || 0,
                                volume24h: data_2.volume24h || 0,
                                btcDominance: data_2.btcDominance || 0,
                                ethDominance: data_2.ethDominance || 0,
                                gasPrice: data_2.gasPrice || 0.518
                            });
                        }
                    } catch (error_1) {
                        console.error('Global stats çekilemedi:', error_1);
                    }
                }
            }["CoinDetailPage.useEffect.fetchGlobalStats"];
            fetchGlobalStats();
        }
    }["CoinDetailPage.useEffect"], []);
    // 7 günlük aralığı güncelle
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CoinDetailPage.useEffect": ()=>{
            if (chartData.prices && chartData.prices.length > 0 && coinDetails) {
                const prices7d_0 = chartData.prices;
                const high7d_0 = Math.max(...prices7d_0);
                const low7d_0 = Math.min(...prices7d_0);
                setCoinDetails({
                    "CoinDetailPage.useEffect": (prev_0)=>prev_0 ? {
                            ...prev_0,
                            priceRange7d: {
                                high: high7d_0,
                                low: low7d_0
                            }
                        } : null
                }["CoinDetailPage.useEffect"]);
            }
        }
    }["CoinDetailPage.useEffect"], [
        chartData.prices,
        coinDetails
    ]);
    // Haberleri çek
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "CoinDetailPage.useEffect": ()=>{
            if (!coinId || typeof coinId !== 'string') return;
            const fetchNews = {
                "CoinDetailPage.useEffect.fetchNews": async ()=>{
                    try {
                        const response_3 = await fetch(`/api/coins/${coinId}/news`);
                        const data_3 = await response_3.json();
                        if (data_3.news && Array.isArray(data_3.news)) {
                            setNews(data_3.news);
                        }
                    } catch (err_2) {
                        console.error('Haberler hatası:', err_2);
                    }
                }
            }["CoinDetailPage.useEffect.fetchNews"];
            fetchNews();
        }
    }["CoinDetailPage.useEffect"], [
        coinId
    ]);
    // Format helpers
    const formatCurrency = (amount)=>{
        if (amount == null || isNaN(amount)) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: amount < 1 ? 8 : 2
        }).format(amount);
    };
    const formatNumber = (num, decimals = 0)=>{
        return new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(num);
    };
    const formatTrillion = (num_0)=>{
        if (num_0 >= 1e12) {
            return (num_0 / 1e12).toFixed(3) + ' Tn';
        } else if (num_0 >= 1e9) {
            return (num_0 / 1e9).toFixed(3) + ' Mr';
        } else if (num_0 >= 1e6) {
            return (num_0 / 1e6).toFixed(3) + ' Mn';
        }
        return formatNumber(num_0);
    };
    const formatCurrencyTRY = (amount_0)=>{
        if (amount_0 == null || isNaN(amount_0)) return '₺0,00';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount_0);
    };
    // Tarih formatla
    const formatDate = (dateString)=>{
        if (!dateString) return 'Bilinmiyor';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    // Tarih farkını hesapla
    const getDateDifference = (dateString_0)=>{
        if (!dateString_0) return '';
        const date_0 = new Date(dateString_0);
        const now_0 = new Date();
        const diffTime = Math.abs(now_0.getTime() - date_0.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);
        if (diffYears > 0) {
            return `${diffYears} yıldan fazla`;
        } else if (diffMonths > 0) {
            return `yaklaşık ${diffMonths} ay`;
        } else if (diffDays > 0) {
            return `yaklaşık ${diffDays} gün`;
        }
        return 'yaklaşık 1 gün';
    };
    // Yüzdelik değişimi hesapla (ATH/ATL için)
    const calculatePercentageChange = (current, target)=>{
        if (target === 0) return 0;
        return (current - target) / target * 100;
    };
    // Yüzdelik değişimi hesapla
    const getPriceChange = ()=>{
        if (chartData.priceChange !== undefined) {
            return chartData.priceChange;
        }
        // Fallback: coin'in 24h değişimini kullan
        if (coin) {
            const multiplier = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '1y' ? 365 : timeRange === '3y' ? 1095 : timeRange === '5y' ? 1825 : 365;
            return (coin.price_change_percentage_24h || 0) * (multiplier / 24);
        }
        return 0;
    };
    const priceChange = getPriceChange();
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-white flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-gray-600 text-lg",
                    children: "Yükleniyor..."
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                    lineNumber: 460,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 459,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
            lineNumber: 458,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
    }
    if (error || !coin) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-white flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-red-600 text-lg mb-4",
                        children: error || 'Coin bulunamadı'
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 467,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "text-blue-600 hover:text-blue-800 underline",
                        children: "Ana Sayfaya Dön"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 468,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 466,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
            lineNumber: 465,
            columnNumber: 12
        }, ("TURBOPACK compile-time value", void 0));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50 pb-14",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                        children: [
                            coin.name,
                            " (",
                            coin.symbol.toUpperCase(),
                            ") - Dijital Marketim"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 476,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "description",
                        content: `${coin.name} fiyat, grafik ve analiz bilgileri`
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 477,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 475,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$Navbar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                marketStats: marketStats
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 481,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full px-4 py-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "mb-6 text-sm text-gray-600",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/",
                                className: "hover:text-gray-900 transition-colors",
                                children: "Ana Sayfa"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 487,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "mx-2",
                                children: "/"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 490,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-gray-900 font-medium",
                                children: coin.name
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 491,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 486,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-3 flex flex-col space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: ()=>coinDetails && setExpandedBlock('global-prices'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-2",
                                                children: "Küresel Fiyatlar"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 500,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            coinDetails ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs font-semibold text-gray-900",
                                                                        children: [
                                                                            coin.symbol.toUpperCase(),
                                                                            " / USD"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 504,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs text-gray-500",
                                                                        children: "US Dollar"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 505,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 503,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs font-bold text-gray-900",
                                                                children: formatCurrency(coinDetails.prices.usd)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 507,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 502,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs font-semibold text-gray-900",
                                                                        children: [
                                                                            coin.symbol.toUpperCase(),
                                                                            " / TRY"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 511,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs text-gray-500",
                                                                        children: "Turkish Lira"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 512,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 510,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs font-bold text-gray-900",
                                                                children: formatCurrencyTRY(coinDetails.prices.try)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 514,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 509,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 501,
                                                columnNumber: 30
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-8 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 517,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-8 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 518,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 516,
                                                columnNumber: 26
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 499,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: ()=>coinDetails && setExpandedBlock('market-stats'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-2",
                                                children: "Piyasa İstatistikleri"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 524,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            coinDetails ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5 text-xs",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-600",
                                                                children: "Piyasa Değeri"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 527,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-900 font-semibold text-xs",
                                                                children: [
                                                                    formatTrillion(coinDetails.marketData.marketCap.usd),
                                                                    " $"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 528,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 526,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-600",
                                                                children: "24s Hacim"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 531,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-900 font-semibold text-xs",
                                                                children: [
                                                                    formatTrillion(coinDetails.marketData.volume24h.usd),
                                                                    " $"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 532,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 530,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-600",
                                                                children: "Dolaşım Arzı"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 535,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-900 font-semibold text-xs",
                                                                children: formatTrillion(coinDetails.supply.circulating)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 536,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 534,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    coinDetails.marketData.marketCapRank && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between pt-1.5 border-t border-gray-100",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-600",
                                                                children: "Sıralama"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 539,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-900 font-bold text-xs",
                                                                children: [
                                                                    "#",
                                                                    coinDetails.marketData.marketCapRank
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 540,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 538,
                                                        columnNumber: 60
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 525,
                                                columnNumber: 30
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 543,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 544,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 545,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 542,
                                                columnNumber: 26
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 523,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: ()=>coinDetails && setExpandedBlock('historical-price'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-2",
                                                children: "Tarihsel Fiyat"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 551,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            coinDetails ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5 text-xs",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-600 mb-0.5 text-xs",
                                                                children: "24sa Aralık"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 554,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs font-semibold text-gray-900",
                                                                children: [
                                                                    formatCurrency(coinDetails.priceRange24h.low.usd),
                                                                    " - ",
                                                                    formatCurrency(coinDetails.priceRange24h.high.usd)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 555,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 553,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-600 mb-0.5 text-xs",
                                                                children: "7g Aralık"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 560,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs font-semibold text-gray-900",
                                                                children: [
                                                                    formatCurrency(coinDetails.priceRange7d.low),
                                                                    " - ",
                                                                    formatCurrency(coinDetails.priceRange7d.high)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 561,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 559,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "pt-1.5 border-t border-gray-100 grid grid-cols-2 gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-gray-600 mb-0.5 text-xs",
                                                                        children: "ATH"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 567,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs font-bold text-gray-900",
                                                                        children: formatCurrency(coinDetails.ath.price.usd)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 568,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 566,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-gray-600 mb-0.5 text-xs",
                                                                        children: "ATL"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 571,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs font-bold text-gray-900",
                                                                        children: formatCurrency(coinDetails.atl.price.usd)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 572,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 570,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 565,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 552,
                                                columnNumber: 30
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 576,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 577,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 578,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 575,
                                                columnNumber: 26
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 550,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 497,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-6 flex flex-col space-y-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-2xl p-6 shadow-lg",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            coin.image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                src: coin.image,
                                                                alt: coin.name,
                                                                className: "w-16 h-16 rounded-full ring-4 ring-gray-200",
                                                                onError: (e)=>{
                                                                    e.currentTarget.style.display = 'none';
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 589,
                                                                columnNumber: 30
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                                        className: "text-3xl font-bold text-gray-900 mb-1",
                                                                        children: coin.name
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 593,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        className: "text-gray-500 uppercase text-base font-semibold",
                                                                        children: coin.symbol
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 594,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 592,
                                                                columnNumber: 15
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 588,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-right flex flex-col items-end gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-4xl font-bold text-gray-900 mb-2",
                                                                children: formatCurrency(coin.current_price)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 598,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: `text-xl font-semibold flex items-center gap-2 ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: coin.price_change_percentage_24h >= 0 ? '▲' : '▼'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 602,
                                                                        columnNumber: 17
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: [
                                                                            Math.abs(coin.price_change_percentage_24h).toFixed(2),
                                                                            "%"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 603,
                                                                        columnNumber: 17
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-gray-500 text-sm font-normal",
                                                                        children: "(24s)"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 604,
                                                                        columnNumber: 17
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 601,
                                                                columnNumber: 15
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                onClick: (e_0)=>{
                                                                    e_0.stopPropagation();
                                                                    const isInPortfolio = portfolio.includes(coin.id);
                                                                    if (isInPortfolio) {
                                                                        const newPortfolio = portfolio.filter((id)=>id !== coin.id);
                                                                        setPortfolio(newPortfolio);
                                                                        localStorage.setItem('portfolio', JSON.stringify(newPortfolio));
                                                                    } else {
                                                                        const newPortfolio_0 = [
                                                                            ...portfolio,
                                                                            coin.id
                                                                        ];
                                                                        setPortfolio(newPortfolio_0);
                                                                        localStorage.setItem('portfolio', JSON.stringify(newPortfolio_0));
                                                                        // Toast bildirimi göster
                                                                        setToast({
                                                                            message: `${coin.name} portföye eklendi`,
                                                                            visible: true
                                                                        });
                                                                        setTimeout(()=>{
                                                                            setToast({
                                                                                message: '',
                                                                                visible: false
                                                                            });
                                                                        }, 3000);
                                                                    }
                                                                },
                                                                className: `w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${portfolio.includes(coin.id) ? 'bg-gradient-to-r from-blue-500 via-yellow-500 via-red-500 to-green-500 text-white shadow-lg' : 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-600'}`,
                                                                title: portfolio.includes(coin.id) ? 'Portföyden çıkar' : 'Portföye ekle',
                                                                children: portfolio.includes(coin.id) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                    className: "w-5 h-5",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    viewBox: "0 0 24 24",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round",
                                                                        strokeWidth: 3,
                                                                        d: "M5 13l4 4L19 7"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 632,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 631,
                                                                    columnNumber: 48
                                                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                                    className: "w-5 h-5",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    viewBox: "0 0 24 24",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round",
                                                                        strokeWidth: 2,
                                                                        d: "M12 4v16m8-8H4"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 634,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 633,
                                                                    columnNumber: 28
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 607,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 597,
                                                        columnNumber: 13
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 587,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mb-4 pb-4",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-right",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-xs text-gray-600 mb-1",
                                                            children: "Seçili Zaman Dilimi Değişimi"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 643,
                                                            columnNumber: 15
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: `text-2xl font-bold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`,
                                                            children: [
                                                                priceChange >= 0 ? '▲' : '▼',
                                                                " ",
                                                                Math.abs(priceChange).toFixed(2),
                                                                "%"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 644,
                                                            columnNumber: 15
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 642,
                                                    columnNumber: 13
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 641,
                                                columnNumber: 11
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "grid grid-cols-2 md:grid-cols-4 gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bg-gray-50 rounded-lg p-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600 mb-1",
                                                                children: "Piyasa Değeri"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 653,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-base font-bold text-gray-900",
                                                                children: [
                                                                    formatTrillion(coin.market_cap),
                                                                    " $"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 654,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 652,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bg-gray-50 rounded-lg p-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600 mb-1",
                                                                children: "24s Hacim"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 657,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-base font-bold text-gray-900",
                                                                children: [
                                                                    formatTrillion(coin.total_volume),
                                                                    " $"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 658,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 656,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bg-gray-50 rounded-lg p-3 relative",
                                                        onMouseEnter: (e_1)=>{
                                                            const element = e_1.currentTarget.querySelector('.value-text');
                                                            if (element && element.scrollWidth > element.clientWidth) {
                                                                const rect = e_1.currentTarget.getBoundingClientRect();
                                                                setTooltipContent(formatCurrency(coin.market_cap));
                                                                setTooltipPosition({
                                                                    x: rect.left + rect.width / 2,
                                                                    y: rect.top - 10
                                                                });
                                                            }
                                                        },
                                                        onMouseLeave: ()=>{
                                                            setTooltipContent(null);
                                                            setTooltipPosition(null);
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600 mb-1",
                                                                children: "Tam Piyasa Değeri"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 674,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-base font-bold text-gray-900 value-text truncate",
                                                                children: formatCurrency(coin.market_cap)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 675,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 660,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bg-gray-50 rounded-lg p-3 relative",
                                                        onMouseEnter: (e_2)=>{
                                                            const element_0 = e_2.currentTarget.querySelector('.value-text');
                                                            if (element_0 && element_0.scrollWidth > element_0.clientWidth) {
                                                                const rect_0 = e_2.currentTarget.getBoundingClientRect();
                                                                setTooltipContent(formatCurrency(coin.total_volume));
                                                                setTooltipPosition({
                                                                    x: rect_0.left + rect_0.width / 2,
                                                                    y: rect_0.top - 10
                                                                });
                                                            }
                                                        },
                                                        onMouseLeave: ()=>{
                                                            setTooltipContent(null);
                                                            setTooltipPosition(null);
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600 mb-1",
                                                                children: "Tam Hacim"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 691,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-base font-bold text-gray-900 value-text truncate",
                                                                children: formatCurrency(coin.total_volume)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 692,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 677,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 651,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 586,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-2xl p-4 shadow-lg",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between mb-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        className: "text-lg font-bold text-gray-900",
                                                        children: "Fiyat Grafiği"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 700,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2 flex-wrap",
                                                                children: [
                                                                    '24h',
                                                                    '7d',
                                                                    '30d',
                                                                    '1y',
                                                                    '3y',
                                                                    '5y'
                                                                ].map((range)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>setTimeRange(range),
                                                                        className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === range ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200'}`,
                                                                        children: timeRangeMap[range].label
                                                                    }, range, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 704,
                                                                        columnNumber: 91
                                                                    }, ("TURBOPACK compile-time value", void 0)))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 703,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-xs text-gray-600",
                                                                        children: "Veri:"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 709,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-xs font-semibold text-blue-600",
                                                                        children: "CoinGecko"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 710,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 708,
                                                                columnNumber: 13
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 701,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 699,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            chartLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-96 flex items-center justify-center",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 717,
                                                            columnNumber: 17
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-600",
                                                            children: "Grafik yükleniyor..."
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 718,
                                                            columnNumber: 17
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 716,
                                                    columnNumber: 15
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 715,
                                                columnNumber: 27
                                            }, ("TURBOPACK compile-time value", void 0)) : chartData.priceData && Array.isArray(chartData.priceData) && chartData.priceData.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative w-full",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "w-full overflow-x-auto",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$PriceChart$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                                            data: chartData.priceData,
                                                            width: 500,
                                                            height: 200,
                                                            timeRange: timeRange
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 722,
                                                            columnNumber: 17
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 721,
                                                        columnNumber: 15
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-3 flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-4 py-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    "Başlangıç: ",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-gray-900 font-semibold",
                                                                        children: formatCurrency(chartData.firstPrice || 0)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 727,
                                                                        columnNumber: 30
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 726,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    "Bitiş: ",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "text-gray-900 font-semibold",
                                                                        children: formatCurrency(chartData.lastPrice || coin.current_price)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 730,
                                                                        columnNumber: 26
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 729,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    "Değişim: ",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: `font-semibold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`,
                                                                        children: [
                                                                            priceChange >= 0 ? '+' : '',
                                                                            priceChange.toFixed(2),
                                                                            "%"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 733,
                                                                        columnNumber: 28
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 732,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 725,
                                                        columnNumber: 15
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 720,
                                                columnNumber: 116
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "h-96 flex items-center justify-center text-gray-600",
                                                children: chartData.error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-center max-w-md mx-auto px-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-red-600 mb-2 font-semibold",
                                                            children: "Grafik verisi yüklenemedi"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 740,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-gray-500 mb-4",
                                                            children: chartData.error
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 741,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        chartData.error.includes('429') || chartData.error.includes('çok fazla') ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-yellow-50 rounded-lg p-4 mt-4",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-yellow-800",
                                                                children: "CoinGecko API rate limit'e ulaşıldı. Lütfen birkaç dakika sonra tekrar deneyin."
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 743,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 742,
                                                            columnNumber: 95
                                                        }, ("TURBOPACK compile-time value", void 0)) : null
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 739,
                                                    columnNumber: 34
                                                }, ("TURBOPACK compile-time value", void 0)) : 'Grafik verisi yükleniyor...'
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 738,
                                                columnNumber: 22
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 698,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 584,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-3 flex flex-col space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: (e_3)=>{
                                            e_3.stopPropagation();
                                            coinDetails && setExpandedBlock('converter');
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-2",
                                                children: [
                                                    coin.symbol.toUpperCase(),
                                                    " Çevirici"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 759,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            coinDetails ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                className: "block text-xs font-medium text-gray-700 mb-0.5",
                                                                children: coin.symbol.toUpperCase()
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 762,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "number",
                                                                value: converterAmount,
                                                                onChange: (e_4)=>{
                                                                    e_4.stopPropagation();
                                                                    setConverterAmount(e_4.target.value);
                                                                },
                                                                onClick: (e_5)=>e_5.stopPropagation(),
                                                                className: "w-full px-2 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50",
                                                                placeholder: "1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 763,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 761,
                                                        columnNumber: 15
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                className: "block text-xs font-medium text-gray-700 mb-0.5",
                                                                children: "Para Birimi"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 769,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                value: converterCurrency,
                                                                onChange: (e_6)=>{
                                                                    e_6.stopPropagation();
                                                                    setConverterCurrency(e_6.target.value);
                                                                },
                                                                onClick: (e_7)=>e_7.stopPropagation(),
                                                                className: "w-full px-2 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "usd",
                                                                        children: "USD"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 774,
                                                                        columnNumber: 19
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                        value: "try",
                                                                        children: "TRY"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 775,
                                                                        columnNumber: 19
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 770,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 768,
                                                        columnNumber: 15
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "p-2 bg-gray-50 rounded-lg",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600 mb-0.5",
                                                                children: "Sonuç:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 779,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm font-bold text-gray-900",
                                                                children: converterCurrency === 'usd' ? formatCurrency(parseFloat(converterAmount || '0') * coinDetails.prices.usd) : formatCurrencyTRY(parseFloat(converterAmount || '0') * coinDetails.prices.try)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 780,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 778,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 760,
                                                columnNumber: 30
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-8 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 785,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-8 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 786,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-12 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 787,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 784,
                                                columnNumber: 20
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 755,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: (e_8)=>{
                                            e_8.stopPropagation();
                                            coinDetails && setExpandedBlock('info');
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-2",
                                                children: "Bilgi"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 796,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            coinDetails ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5 text-xs",
                                                children: [
                                                    coinDetails.links.homepage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-600 mb-0.5 text-xs",
                                                                children: "İnternet Sitesi"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 799,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                href: coinDetails.links.homepage,
                                                                target: "_blank",
                                                                rel: "noopener noreferrer",
                                                                className: "text-blue-600 hover:underline text-xs",
                                                                onClick: (e_9)=>e_9.stopPropagation(),
                                                                children: coinDetails.links.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '').substring(0, 25)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 800,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 798,
                                                        columnNumber: 46
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    coinDetails.links.blockchainExplorers.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-600 mb-0.5 text-xs",
                                                                children: "Tarayıcılar"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 805,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "flex flex-wrap gap-1",
                                                                children: coinDetails.links.blockchainExplorers.slice(0, 2).map((explorer, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: explorer,
                                                                        target: "_blank",
                                                                        rel: "noopener noreferrer",
                                                                        className: "px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors",
                                                                        onClick: (e_10)=>e_10.stopPropagation(),
                                                                        children: explorer.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0].substring(0, 12)
                                                                    }, idx, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 807,
                                                                        columnNumber: 99
                                                                    }, ("TURBOPACK compile-time value", void 0)))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 806,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 804,
                                                        columnNumber: 68
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    coinDetails.marketData.marketCapRank && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "pt-1.5 border-t border-gray-100",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-600 mb-0.5 text-xs",
                                                                children: "Sıralama"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 813,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs font-bold text-gray-900",
                                                                children: [
                                                                    "#",
                                                                    coinDetails.marketData.marketCapRank
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 814,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 812,
                                                        columnNumber: 60
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 797,
                                                columnNumber: 30
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 817,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 818,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 819,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 816,
                                                columnNumber: 28
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 792,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: ()=>setExpandedBlock('sentiment'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-1.5",
                                                children: [
                                                    "Bugün ",
                                                    coin.name,
                                                    " hakkında nasıl hissediyorsunuz?"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 825,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "grid grid-cols-2 gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "p-2 bg-white rounded-lg hover:bg-green-50 transition-all text-center shadow-sm",
                                                        onClick: (e_11)=>e_11.stopPropagation(),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xl mb-0.5",
                                                                children: "🚀"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 830,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm font-bold text-gray-900",
                                                                children: "81%"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 831,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600",
                                                                children: "Yükseliş"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 832,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 829,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "p-2 bg-white rounded-lg hover:bg-red-50 transition-all text-center shadow-sm",
                                                        onClick: (e_12)=>e_12.stopPropagation(),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xl mb-0.5",
                                                                children: "👎"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 835,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm font-bold text-gray-900",
                                                                children: "39%"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 836,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600",
                                                                children: "Düşüş"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 837,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 834,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 828,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 824,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 753,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 495,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    coinDetails && coinDetails.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-xl p-4 shadow-lg mb-6 cursor-pointer hover:shadow-xl transition-all",
                        onClick: ()=>setExpandedBlock('about'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-bold text-gray-900 mb-3",
                                children: [
                                    coin.name,
                                    " (",
                                    coin.symbol.toUpperCase(),
                                    ") nedir?"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 846,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-xs text-gray-700 leading-relaxed line-clamp-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    dangerouslySetInnerHTML: {
                                        __html: coinDetails.description.split('\n').map((para)=>`<p>${para}</p>`).join('').substring(0, 500) + (coinDetails.description.length > 500 ? '...' : '')
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 848,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 847,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 845,
                        columnNumber: 52
                    }, ("TURBOPACK compile-time value", void 0)),
                    news.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl p-8 shadow-lg mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold text-gray-900 mb-6",
                                children: [
                                    coin.name,
                                    " Son Haberleri ve Yorumları"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 856,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
                                children: news.map((article)=>{
                                    // URL'yi kontrol et ve düzelt
                                    let articleUrl = article.url || '';
                                    // URL boş veya geçersizse varsayılan URL oluştur
                                    if (!articleUrl || articleUrl.trim() === '' || articleUrl === '#') {
                                        articleUrl = `https://cointelegraph.com/search?q=${encodeURIComponent(coin.name)}`;
                                    } else {
                                        // URL geçerli mi kontrol et ve düzelt
                                        try {
                                            // URL'i parse et
                                            const url = new URL(articleUrl);
                                            articleUrl = url.toString();
                                        } catch  {
                                            // URL geçerli değilse, http/https ekle
                                            if (!articleUrl.startsWith('http://') && !articleUrl.startsWith('https://')) {
                                                articleUrl = `https://${articleUrl}`;
                                            }
                                            // Tekrar kontrol et
                                            try {
                                                new URL(articleUrl);
                                            } catch  {
                                                // Hala geçersizse varsayılan URL kullan
                                                articleUrl = `https://cointelegraph.com/search?q=${encodeURIComponent(coin.name)}`;
                                            }
                                        }
                                    }
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        href: articleUrl,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className: "block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group shadow-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative w-full h-48 bg-gray-200 overflow-hidden",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                    src: article.image,
                                                    alt: article.title,
                                                    className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                                                    onError: (e_13)=>{
                                                        e_13.currentTarget.src = 'https://via.placeholder.com/400x250?text=Haber+Görseli';
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 887,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 886,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                        className: "text-base font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors",
                                                        children: article.title
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 892,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center justify-between text-xs text-gray-500",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-medium",
                                                                children: article.source
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 896,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                children: article.publishedTime
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 897,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 895,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 891,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, article.id, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 885,
                                        columnNumber: 20
                                    }, ("TURBOPACK compile-time value", void 0));
                                })
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 857,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 text-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    href: `https://cointelegraph.com/search?q=${coin.name}`,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className: "inline-block px-8 py-4 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg",
                                    children: "Daha Fazla Haber Gör"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 904,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 903,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 855,
                        columnNumber: 29
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl p-8 shadow-lg mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold text-gray-900 mb-4",
                                children: "Hakkında"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 912,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-gray-700 leading-relaxed",
                                children: [
                                    coin.name,
                                    " (",
                                    coin.symbol.toUpperCase(),
                                    "), kripto para piyasasında aktif olarak işlem gören bir dijital varlıktır. Mevcut fiyatı ",
                                    formatCurrency(coin.current_price),
                                    " seviyesindedir ve son 24 saatte %",
                                    Math.abs(coin.price_change_percentage_24h).toFixed(2),
                                    ' ',
                                    coin.price_change_percentage_24h >= 0 ? 'artış' : 'düşüş',
                                    " göstermiştir."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 913,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            coin.last_updated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-4 text-sm text-gray-600",
                                children: [
                                    "Son Güncelleme: ",
                                    new Date(coin.last_updated).toLocaleString('tr-TR')
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 919,
                                columnNumber: 33
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 911,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    tooltipContent && tooltipPosition && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none",
                        style: {
                            left: `${tooltipPosition.x}px`,
                            top: `${tooltipPosition.y}px`,
                            transform: 'translateX(-50%) translateY(-100%)'
                        },
                        children: [
                            tooltipContent,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 931,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 925,
                        columnNumber: 47
                    }, ("TURBOPACK compile-time value", void 0)),
                    expandedBlock && coinDetails && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4",
                        onClick: ()=>setExpandedBlock(null),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto",
                            onClick: (e_14)=>e_14.stopPropagation(),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-2xl font-bold text-gray-900",
                                            children: [
                                                expandedBlock === 'global-prices' && 'Küresel Fiyatlar',
                                                expandedBlock === 'market-stats' && 'Piyasa İstatistikleri',
                                                expandedBlock === 'historical-price' && 'Tarihsel Fiyat',
                                                expandedBlock === 'converter' && `${coin.symbol.toUpperCase()} Çevirici`,
                                                expandedBlock === 'info' && 'Bilgi',
                                                expandedBlock === 'sentiment' && `Bugün ${coin.name} hakkında nasıl hissediyorsunuz?`,
                                                expandedBlock === 'about' && `${coin.name} (${coin.symbol.toUpperCase()}) nedir?`
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 938,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setExpandedBlock(null),
                                            className: "text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors",
                                            children: "×"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 947,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 937,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-6",
                                    children: [
                                        expandedBlock === 'global-prices' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: [
                                                                        coin.symbol.toUpperCase(),
                                                                        " / USD"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 957,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-3xl font-bold text-gray-900 mb-2",
                                                                    children: formatCurrency(coinDetails.prices.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 958,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-500",
                                                                    children: "US Dollar"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 959,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 956,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: [
                                                                        coin.symbol.toUpperCase(),
                                                                        " / TRY"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 962,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-3xl font-bold text-gray-900 mb-2",
                                                                    children: formatCurrencyTRY(coinDetails.prices.try)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 963,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-500",
                                                                    children: "Turkish Lira"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 964,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 961,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 955,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-blue-50 rounded-xl p-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-blue-800",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                children: "Not:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 969,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            " Fiyatlar gerçek zamanlı olarak güncellenmektedir. Farklı borsalarda fiyatlar değişiklik gösterebilir."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 968,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 967,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 954,
                                            columnNumber: 55
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'market-stats' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "Piyasa Değeri"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 978,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatCurrency(coinDetails.marketData.marketCap.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 979,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500 mt-2",
                                                                    children: [
                                                                        "TRY: ",
                                                                        formatCurrencyTRY(coinDetails.marketData.marketCap.try)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 980,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 977,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "24 Saat Hacim"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 983,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatCurrency(coinDetails.marketData.volume24h.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 984,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500 mt-2",
                                                                    children: [
                                                                        "TRY: ",
                                                                        formatCurrencyTRY(coinDetails.marketData.volume24h.try)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 985,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 982,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "Dolaşım Arzı"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 988,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatNumber(coinDetails.supply.circulating)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 989,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500 mt-2",
                                                                    children: coin.symbol.toUpperCase()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 990,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 987,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "Toplam Arz"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 993,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatNumber(coinDetails.supply.total)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 994,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500 mt-2",
                                                                    children: coin.symbol.toUpperCase()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 995,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 992,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 976,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                coinDetails.marketData.marketCapRank && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-blue-50 rounded-xl p-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm text-blue-800",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                children: "Piyasa Değeri Sıralaması:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1000,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            " #",
                                                            coinDetails.marketData.marketCapRank
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 999,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 998,
                                                    columnNumber: 62
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 975,
                                            columnNumber: 54
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'historical-price' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "24 Saat Aralık"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1009,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-lg font-semibold text-gray-900 mb-1",
                                                                    children: "Düşük"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1010,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900 mb-4",
                                                                    children: formatCurrency(coinDetails.priceRange24h.low.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1011,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-lg font-semibold text-gray-900 mb-1",
                                                                    children: "Yüksek"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1012,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatCurrency(coinDetails.priceRange24h.high.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1013,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1008,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "7 Gün Aralık"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1016,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-lg font-semibold text-gray-900 mb-1",
                                                                    children: "Düşük"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1017,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900 mb-4",
                                                                    children: formatCurrency(coinDetails.priceRange7d.low)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1018,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-lg font-semibold text-gray-900 mb-1",
                                                                    children: "Yüksek"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1019,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatCurrency(coinDetails.priceRange7d.high)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1020,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1015,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1007,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-green-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "Tüm Zamanların En Yükseği (ATH)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1025,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900 mb-2",
                                                                    children: formatCurrency(coinDetails.ath.price.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1026,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                coinDetails.ath.date && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500",
                                                                    children: new Date(coinDetails.ath.date).toLocaleDateString('tr-TR')
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1027,
                                                                    columnNumber: 50
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1024,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bg-red-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "Tüm Zamanların En Düşüğü (ATL)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1030,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900 mb-2",
                                                                    children: formatCurrency(coinDetails.atl.price.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1031,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                coinDetails.atl.date && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500",
                                                                    children: new Date(coinDetails.atl.date).toLocaleDateString('tr-TR')
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1032,
                                                                    columnNumber: 50
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1029,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1023,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1006,
                                            columnNumber: 58
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'converter' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-gray-50 rounded-xl p-6",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                        className: "block text-sm font-medium text-gray-700 mb-2",
                                                                        children: coin.symbol.toUpperCase()
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1042,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                        type: "number",
                                                                        value: converterAmount,
                                                                        onChange: (e_15)=>setConverterAmount(e_15.target.value),
                                                                        className: "w-full px-4 py-3 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white",
                                                                        placeholder: "1"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1043,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1041,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                                        className: "block text-sm font-medium text-gray-700 mb-2",
                                                                        children: "Para Birimi"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1046,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                        value: converterCurrency,
                                                                        onChange: (e_16)=>setConverterCurrency(e_16.target.value),
                                                                        className: "w-full px-4 py-3 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: "usd",
                                                                                children: "USD"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                                lineNumber: 1048,
                                                                                columnNumber: 29
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                value: "try",
                                                                                children: "TRY"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                                lineNumber: 1049,
                                                                                columnNumber: 29
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1047,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1045,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1040,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "mt-6 p-6 bg-blue-50 rounded-xl",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-sm text-gray-600 mb-2",
                                                                children: "Sonuç:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1054,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "text-4xl font-bold text-gray-900",
                                                                children: converterCurrency === 'usd' ? formatCurrency(parseFloat(converterAmount || '0') * coinDetails.prices.usd) : formatCurrencyTRY(parseFloat(converterAmount || '0') * coinDetails.prices.try)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1055,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1053,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 1039,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1038,
                                            columnNumber: 51
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'info' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: [
                                                coinDetails.links.homepage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-gray-50 rounded-xl p-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-sm text-gray-600 mb-2",
                                                            children: "İnternet Sitesi"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1065,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                            href: coinDetails.links.homepage,
                                                            target: "_blank",
                                                            rel: "noopener noreferrer",
                                                            className: "text-blue-600 hover:underline text-lg font-semibold break-all",
                                                            children: coinDetails.links.homepage
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1066,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1064,
                                                    columnNumber: 52
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                coinDetails.links.blockchainExplorers.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-gray-50 rounded-xl p-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-sm text-gray-600 mb-4",
                                                            children: "Blockchain Tarayıcılar"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1071,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex flex-wrap gap-3",
                                                            children: coinDetails.links.blockchainExplorers.map((explorer_0, idx_0)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                    href: explorer_0,
                                                                    target: "_blank",
                                                                    rel: "noopener noreferrer",
                                                                    className: "px-4 py-2 bg-white hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors",
                                                                    children: explorer_0.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
                                                                }, idx_0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1073,
                                                                    columnNumber: 93
                                                                }, ("TURBOPACK compile-time value", void 0)))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1072,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1070,
                                                    columnNumber: 74
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                coinDetails.links.github && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-gray-50 rounded-xl p-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "text-sm text-gray-600 mb-2",
                                                            children: "GitHub"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1079,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                            href: coinDetails.links.github,
                                                            target: "_blank",
                                                            rel: "noopener noreferrer",
                                                            className: "text-blue-600 hover:underline text-lg font-semibold break-all",
                                                            children: coinDetails.links.github
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1080,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1078,
                                                    columnNumber: 50
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                coinDetails.marketData.marketCapRank && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bg-blue-50 rounded-xl p-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "text-sm text-blue-800",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                children: "Piyasa Değeri Sıralaması:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1086,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            " #",
                                                            coinDetails.marketData.marketCapRank
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1085,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1084,
                                                    columnNumber: 62
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1063,
                                            columnNumber: 46
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'sentiment' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-gray-50 rounded-xl p-6",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-base text-gray-700 mb-6",
                                                        children: [
                                                            "Topluluk bugün ",
                                                            coin.name,
                                                            " (",
                                                            coin.symbol.toUpperCase(),
                                                            ") kripto parasının",
                                                            ' ',
                                                            coin.price_change_percentage_24h >= 0 ? 'yükseleceğini' : 'düşeceğini',
                                                            " düşünüyor."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1094,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                className: "p-6 bg-white rounded-xl hover:bg-green-50 transition-all text-center shadow-lg",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-5xl mb-3",
                                                                        children: "🚀"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1100,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-4xl font-bold text-gray-900 mb-2",
                                                                        children: "81%"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1101,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-lg text-gray-600",
                                                                        children: "Yükseliş"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1102,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1099,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                className: "p-6 bg-white rounded-xl hover:bg-red-50 transition-all text-center shadow-lg",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-5xl mb-3",
                                                                        children: "👎"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1105,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-4xl font-bold text-gray-900 mb-2",
                                                                        children: "39%"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1106,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "text-lg text-gray-600",
                                                                        children: "Düşüş"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1107,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1104,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1098,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 1093,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1092,
                                            columnNumber: 51
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'about' && coinDetails.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bg-gray-50 rounded-xl p-6",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "text-base text-gray-700 leading-relaxed",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        dangerouslySetInnerHTML: {
                                                            __html: coinDetails.description.split('\n').map((para_0)=>`<p class="mb-4">${para_0}</p>`).join('')
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1117,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1116,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 1115,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1114,
                                            columnNumber: 74
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 952,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                            lineNumber: 936,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 935,
                        columnNumber: 42
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                        className: "bg-white px-4 py-12 mt-6",
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
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1135,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1134,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-gray-600 mb-4",
                                                    children: "Dijital Marketim, kripto piyasasına dair temel bir analiz sağlar. Dijital Marketim; fiyatı, hacmi ve piyasa değerini takip etmenin yanı sıra topluluk büyümesini, açık kaynak kod geliştirmeyi, önemli olayları ve zincir üstü metrikleri takip eder."
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1137,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1133,
                                            columnNumber: 15
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
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1146,
                                                            columnNumber: 19
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
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1149,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1148,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Kripto Para Hazine Rezervleri"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1152,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1151,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Kripto Isı Haritası"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1155,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1154,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Kripto API'si"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1158,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1157,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1147,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1145,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "text-sm font-bold text-gray-900 mb-4",
                                                            children: "Destek"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1165,
                                                            columnNumber: 19
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
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1168,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1167,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Reklam"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1171,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1170,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Yardım Merkezi"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1174,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1173,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "SSS"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1177,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1176,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1166,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1164,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "text-sm font-bold text-gray-900 mb-4",
                                                            children: "Cripto Hakkında"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1184,
                                                            columnNumber: 19
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
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1187,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1186,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Metodoloji"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1190,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1189,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Gizlilik Politikası"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1193,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1192,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1185,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1183,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                            className: "text-sm font-bold text-gray-900 mb-4",
                                                            children: "Topluluk"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1200,
                                                            columnNumber: 19
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
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1203,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1202,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Telegram"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1206,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1205,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Reddit"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1209,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1208,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1201,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1199,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1143,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1131,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "pt-8",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col md:flex-row items-center justify-between gap-4 mb-6",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "text-sm text-gray-600",
                                                children: "© 2025 Cripto. All Rights Reserved."
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 1219,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1218,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-8 p-4 bg-gray-50 rounded-lg",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                                    className: "text-sm font-bold text-gray-900 mb-2",
                                                    children: "ÖNEMLİ UYARI"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1226,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-600 leading-relaxed",
                                                    children: 'Bu web sitesinde, bağlantılı sitelerde, uygulamalarda, forumlarda, bloglarda, sosyal medya hesaplarında ve diğer platformlarda (birlikte "Site") yer alan içerikler, yalnızca genel bilgilendirme amaçlıdır ve üçüncü taraflardan kaynaklanmaktadır. Bu içeriklerin doğruluğu, eksiksizliği, güncelliği veya güvenilirliği konusunda hiçbir garanti verilmemektedir. Herhangi bir yatırım kararı vermeden önce, kendi araştırmanızı yapmanız ve bağımsız profesyonel tavsiye almanız önerilir. Ticaret risklidir ve kayıplar meydana gelebilir. Bu sitede yer alan hiçbir içerik, teşvik, tavsiye veya teklif niteliği taşımamaktadır.'
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1227,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1225,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1217,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                            lineNumber: 1129,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 1128,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 484,
                columnNumber: 7
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
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1241,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 1240,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                            lineNumber: 1239,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "font-semibold text-sm",
                                children: toast.message
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 1245,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                            lineNumber: 1244,
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
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1252,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 1251,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                            lineNumber: 1247,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                    lineNumber: 1238,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 1237,
                columnNumber: 25
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$MarketStatsBar$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                marketStats: marketStats
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 1259,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
        lineNumber: 474,
        columnNumber: 10
    }, ("TURBOPACK compile-time value", void 0));
};
_s(CoinDetailPage, "IKYRXddhVm3Dd0wNQZbySN3eHQk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = CoinDetailPage;
const __TURBOPACK__default__export__ = CoinDetailPage;
var _c;
__turbopack_context__.k.register(_c, "CoinDetailPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/currencies/[coinId]";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__ef773a1d._.js.map