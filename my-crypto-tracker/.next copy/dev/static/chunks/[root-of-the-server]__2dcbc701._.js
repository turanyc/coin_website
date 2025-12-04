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
"[project]/my-crypto-tracker/src/pages/_app.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>App
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/react/compiler-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/contexts/LanguageContext.tsx [client] (ecmascript)");
;
;
;
;
function App(t0) {
    const $ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$compiler$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["c"])(4);
    if ($[0] !== "1e9861d2016acbb412a9aec58c6f7d893a79f825f600ea27a45ff578fc8b368f") {
        for(let $i = 0; $i < 4; $i += 1){
            $[$i] = Symbol.for("react.memo_cache_sentinel");
        }
        $[0] = "1e9861d2016acbb412a9aec58c6f7d893a79f825f600ea27a45ff578fc8b368f";
    }
    const { Component, pageProps } = t0;
    let t1;
    if ($[1] !== Component || $[2] !== pageProps) {
        t1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["LanguageProvider"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Component, {
                ...pageProps
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/_app.tsx",
                lineNumber: 19,
                columnNumber: 28
            }, this)
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/pages/_app.tsx",
            lineNumber: 19,
            columnNumber: 10
        }, this);
        $[1] = Component;
        $[2] = pageProps;
        $[3] = t1;
    } else {
        t1 = $[3];
    }
    return t1;
}
_c = App;
var _c;
__turbopack_context__.k.register(_c, "App");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/my-crypto-tracker/src/pages/_app.tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/_app";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/my-crypto-tracker/src/pages/_app.tsx [client] (ecmascript)");
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
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/my-crypto-tracker/src/pages/_app\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/my-crypto-tracker/src/pages/_app.tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__2dcbc701._.js.map