module.exports = [
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/react-dom [external] (react-dom, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react-dom", () => require("react-dom"));

module.exports = mod;
}),
"[project]/my-crypto-tracker/src/components/Navbar.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/link.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/contexts/LanguageContext.tsx [ssr] (ecmascript)");
;
;
;
;
;
const Navbar = ({ marketStats })=>{
    const [openDropdown, setOpenDropdown] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [scrolled, setScrolled] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [showLanguageDropdown, setShowLanguageDropdown] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const { language: selectedLanguage, setLanguage, t } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["useLanguage"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    // Sayfa yüklendiğinde tarayıcı hafızasına bak: Kullanıcı var mı?
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);
    // Çıkış Yap Fonksiyonu
    const handleLogout = ()=>{
        localStorage.removeItem('currentUser'); // Hafızadan sil
        setUser(null); // State'i temizle
        router.push('/login'); // Giriş sayfasına at
    };
    const languages = [
        {
            code: 'tr',
            name: 'Türkçe',
            flag: '🇹🇷'
        },
        {
            code: 'en',
            name: 'English',
            flag: '🇺🇸'
        },
        {
            code: 'es',
            name: 'Español',
            flag: '🇪🇸'
        },
        {
            code: 'zh',
            name: '中文',
            flag: '🇨🇳'
        },
        {
            code: 'ar',
            name: 'العربية',
            flag: '🇸🇦'
        },
        {
            code: 'fr',
            name: 'Français',
            flag: '🇫🇷'
        },
        {
            code: 'de',
            name: 'Deutsch',
            flag: '🇩🇪'
        },
        {
            code: 'ja',
            name: '日本語',
            flag: '🇯🇵'
        },
        {
            code: 'pt',
            name: 'Português',
            flag: '🇵🇹'
        },
        {
            code: 'ru',
            name: 'Русский',
            flag: '🇷🇺'
        }
    ];
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const handleScroll = ()=>{
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return ()=>window.removeEventListener('scroll', handleScroll);
    }, []);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const handleRoute = ()=>{
            setOpenDropdown(null);
            setShowLanguageDropdown(false);
        };
        router.events.on('routeChangeComplete', handleRoute);
        return ()=>{
            router.events.off('routeChangeComplete', handleRoute);
        };
    }, [
        router.events
    ]);
    const handleLogoClick = (event)=>{
        event?.preventDefault();
        setOpenDropdown(null);
        setShowLanguageDropdown(false);
        if (router.pathname !== '/') {
            router.push('/');
        }
    };
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            marketStats && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "bg-gradient-to-r from-blue-600 via-yellow-500 via-red-500 to-green-600 text-white relative overflow-hidden",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "absolute inset-0 opacity-10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "absolute top-0 left-0 w-full h-full",
                            style: {
                                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                                backgroundRepeat: 'repeat'
                            }
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 111,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 110,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "relative z-10",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "max-w-7xl mx-auto px-6 py-4",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "flex flex-col lg:flex-row justify-between items-center gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "flex flex-nowrap items-center justify-center gap-x-6 text-sm w-full lg:w-auto overflow-x-auto lg:overflow-visible scrollbar-hide",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 whitespace-nowrap shrink-0 opacity-0 animate-slide-in-rainbow rainbow-1 rounded-lg py-1 px-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-sm opacity-90",
                                                            children: t('stats.marketCap')
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 128,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                    className: "font-bold text-base",
                                                                    children: [
                                                                        formatTrillion(marketStats.marketCap),
                                                                        " $"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 130,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                    className: `text-sm font-semibold px-2 py-0.5 rounded-full ${marketStats.marketCapChange24h >= 0 ? 'bg-green-500/30 text-green-100' : 'bg-red-500/30 text-red-100'}`,
                                                                    children: [
                                                                        marketStats.marketCapChange24h >= 0 ? '▲' : '▼',
                                                                        " ",
                                                                        Math.abs(marketStats.marketCapChange24h).toFixed(2),
                                                                        "%"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 131,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 129,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 127,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 126,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 whitespace-nowrap shrink-0 opacity-0 animate-slide-in-rainbow rainbow-2 rounded-lg py-1 px-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-sm opacity-90",
                                                            children: t('stats.volume24h')
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 141,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "font-bold text-base",
                                                            children: [
                                                                formatTrillion(marketStats.volume24h),
                                                                " $"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 142,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 140,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 139,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 whitespace-nowrap shrink-0 opacity-0 animate-slide-in-rainbow rainbow-3 rounded-lg py-1 px-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-sm opacity-90",
                                                            children: t('stats.activeCoins')
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 149,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "font-bold text-base",
                                                            children: formatNumber(marketStats.totalCoins)
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 150,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 148,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 147,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 whitespace-nowrap shrink-0 opacity-0 animate-slide-in-rainbow rainbow-4 rounded-lg py-1 px-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-sm opacity-90",
                                                            children: t('stats.btcDominance')
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 157,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "font-bold text-base",
                                                            children: [
                                                                typeof marketStats.btcDominance === 'number' ? marketStats.btcDominance.toFixed(1) : marketStats.btcDominance,
                                                                "%"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 158,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 156,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 155,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 whitespace-nowrap shrink-0 opacity-0 animate-slide-in-rainbow rainbow-5 rounded-lg py-1 px-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-sm opacity-90",
                                                            children: t('stats.ethDominance')
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 167,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "font-bold text-base",
                                                            children: [
                                                                typeof marketStats.ethDominance === 'number' ? marketStats.ethDominance.toFixed(1) : marketStats.ethDominance,
                                                                "%"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 168,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 166,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 165,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2 whitespace-nowrap shrink-0 opacity-0 animate-slide-in-rainbow rainbow-6 rounded-lg py-1 px-2",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex flex-col",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-sm opacity-90",
                                                            children: t('stats.gasPrice')
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 177,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "font-bold text-base",
                                                            children: [
                                                                marketStats.gasPrice,
                                                                " GWEI"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 178,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 176,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 175,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 124,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 shrink-0 relative",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setShowLanguageDropdown(!showLanguageDropdown),
                                                        className: "bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                            className: "w-5 h-5 text-gray-900",
                                                            fill: "none",
                                                            stroke: "currentColor",
                                                            viewBox: "0 0 24 24",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    strokeWidth: 2,
                                                                    d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 192,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    strokeWidth: 2,
                                                                    d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 193,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 191,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 187,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    showLanguageDropdown && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "fixed inset-0 z-50",
                                                                onClick: ()=>setShowLanguageDropdown(false)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 200,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px] max-h-[400px] overflow-y-auto",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "p-2",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                            className: "text-sm font-semibold text-gray-500 uppercase tracking-wide px-3 py-2 mb-1",
                                                                            children: "Dil Seç"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                            lineNumber: 206,
                                                                            columnNumber: 29
                                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                                        languages.map((lang)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                                onClick: ()=>{
                                                                                    setLanguage(lang.code);
                                                                                    setShowLanguageDropdown(false);
                                                                                    // Sayfayı yenile ki tüm çeviriler uygulansın
                                                                                    window.location.reload();
                                                                                },
                                                                                className: `w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left ${selectedLanguage === lang.code ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}`,
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                                        className: "text-lg",
                                                                                        children: lang.flag
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                        lineNumber: 222,
                                                                                        columnNumber: 33
                                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                                        className: "text-base font-medium flex-1",
                                                                                        children: lang.name
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                        lineNumber: 223,
                                                                                        columnNumber: 33
                                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                                    selectedLanguage === lang.code && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                                        className: "w-4 h-4 text-blue-600",
                                                                                        fill: "currentColor",
                                                                                        viewBox: "0 0 20 20",
                                                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                                            fillRule: "evenodd",
                                                                                            d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z",
                                                                                            clipRule: "evenodd"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                            lineNumber: 226,
                                                                                            columnNumber: 37
                                                                                        }, ("TURBOPACK compile-time value", void 0))
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                        lineNumber: 225,
                                                                                        columnNumber: 35
                                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                                ]
                                                                            }, lang.code, true, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 210,
                                                                                columnNumber: 31
                                                                            }, ("TURBOPACK compile-time value", void 0)))
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 205,
                                                                    columnNumber: 27
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 204,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 186,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    // Bildirimler veya başka bir özellik için kullanılabilir
                                                    console.log('Notifications clicked');
                                                },
                                                className: "bg-white border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                    className: "text-base font-medium text-gray-900",
                                                    children: "0"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 245,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 238,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            user ? // --- KULLANICI GİRİŞ YAPMIŞSA GÖRÜNECEK ---
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "text-right hidden sm:block",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                                className: "text-xs text-gray-400",
                                                                children: "Hoş geldin,"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 253,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                                className: "text-sm font-bold text-white",
                                                                children: user.name || user.full_name || user.email
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 254,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 252,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: handleLogout,
                                                        className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition",
                                                        children: "Çıkış Yap"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 256,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 251,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0)) : // --- KULLANICI GİRİŞ YAPMAMIŞSA GÖRÜNECEK ---
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        href: "/login",
                                                        className: "bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors inline-block",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-base font-medium text-gray-900",
                                                            children: t('nav.login')
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 267,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 266,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                        href: "/register",
                                                        className: "bg-green-500 rounded-lg px-4 py-2 hover:bg-green-600 transition-colors inline-block",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                            className: "text-base font-medium text-white",
                                                            children: t('nav.signup')
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 270,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 269,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 184,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 122,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 121,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 120,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 108,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("nav", {
                className: `bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg' : 'shadow-sm'}`,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "max-w-7xl mx-auto px-6 py-4 flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-8",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/",
                                        onClick: handleLogoClick,
                                        className: "flex items-center gap-2 group",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "absolute inset-0 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-500 rounded-lg blur opacity-75 group-hover:opacity-100 transition-opacity"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 294,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "relative bg-gradient-to-r from-blue-600 via-yellow-500 to-red-500 text-white px-3 py-1.5 rounded-lg font-bold text-sm",
                                                    children: "Cripto"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 295,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 293,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 288,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "hidden lg:flex items-center gap-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setOpenDropdown(openDropdown === 'kripto' ? null : 'kripto'),
                                                        className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100 whitespace-nowrap",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                children: "Kripto Paralar"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 309,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                className: `w-4 h-4 transition-transform ${openDropdown === 'kripto' ? 'rotate-180' : ''}`,
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                viewBox: "0 0 24 24",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    strokeWidth: 2,
                                                                    d: "M19 9l-7 7-7-7"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 311,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 310,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 305,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    openDropdown === 'kripto' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-3 z-50 border border-gray-100",
                                                        onClick: (e)=>e.stopPropagation(),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "px-4 py-2 border-b border-gray-100",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                                    className: "text-sm font-bold text-gray-900",
                                                                    children: "Kripto Paralar"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 317,
                                                                    columnNumber: 23
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 316,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "py-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                                        href: "/",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Tüm Kripto Paralar"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 321,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Binlerce coin'i keşfedin"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 322,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 320,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Popüler Coinler"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 325,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "En çok takip edilenler"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 326,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 324,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Trend Coinler"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 329,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Son 24 saatte yükselenler"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 330,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 328,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Yeni Listelenenler"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 333,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Yeni eklenen coinler"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 334,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 332,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 319,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 315,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 304,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setOpenDropdown(openDropdown === 'borsalar' ? null : 'borsalar'),
                                                        className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
                                                        children: [
                                                            "Borsalar",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                className: `w-4 h-4 transition-transform ${openDropdown === 'borsalar' ? 'rotate-180' : ''}`,
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                viewBox: "0 0 24 24",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    strokeWidth: 2,
                                                                    d: "M19 9l-7 7-7-7"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 349,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 348,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 343,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    openDropdown === 'borsalar' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-3 z-50 border border-gray-100",
                                                        onClick: (e)=>e.stopPropagation(),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "px-4 py-2 border-b border-gray-100",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                                    className: "text-sm font-bold text-gray-900",
                                                                    children: "Borsalar"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 355,
                                                                    columnNumber: 23
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 354,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "py-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Tüm Borsalar"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 359,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Binlerce borsayı karşılaştırın"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 360,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 358,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Spot Borsalar"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 363,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "En iyi spot borsalar"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 364,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 362,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Derivatif Borsalar"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 367,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Futures ve opsiyonlar"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 368,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 366,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 357,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 353,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 342,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                href: "#",
                                                className: "px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
                                                children: "NFT"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 376,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setOpenDropdown(openDropdown === 'ogren' ? null : 'ogren'),
                                                        className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
                                                        children: [
                                                            "Öğren",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                className: `w-4 h-4 transition-transform ${openDropdown === 'ogren' ? 'rotate-180' : ''}`,
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                viewBox: "0 0 24 24",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    strokeWidth: 2,
                                                                    d: "M19 9l-7 7-7-7"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 388,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 387,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 382,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    openDropdown === 'ogren' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-3 z-50 border border-gray-100",
                                                        onClick: (e)=>e.stopPropagation(),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "px-4 py-2 border-b border-gray-100",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                                    className: "text-sm font-bold text-gray-900",
                                                                    children: "Öğren"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 394,
                                                                    columnNumber: 23
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 393,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "py-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Kripto Para Nedir?"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 398,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Temel bilgiler"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 399,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 397,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Blockchain"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 402,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Teknoloji hakkında"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 403,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 401,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Rehberler"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 406,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Detaylı rehberler"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 407,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 405,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 396,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 392,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 381,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setOpenDropdown(openDropdown === 'urunler' ? null : 'urunler'),
                                                        className: "flex items-center gap-1 px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors rounded-lg hover:bg-gray-100",
                                                        children: [
                                                            "Ürünler",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                className: `w-4 h-4 transition-transform ${openDropdown === 'urunler' ? 'rotate-180' : ''}`,
                                                                fill: "none",
                                                                stroke: "currentColor",
                                                                viewBox: "0 0 24 24",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    strokeWidth: 2,
                                                                    d: "M19 9l-7 7-7-7"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 422,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 421,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 416,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    openDropdown === 'urunler' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-3 z-50 border border-gray-100",
                                                        onClick: (e)=>e.stopPropagation(),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "px-4 py-2 border-b border-gray-100",
                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                                    className: "text-sm font-bold text-gray-900",
                                                                    children: "Ürünler"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                    lineNumber: 428,
                                                                    columnNumber: 23
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 427,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "py-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Portföy Takibi"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 432,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Coin'lerinizi takip edin"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 433,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 431,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Fiyat Alarmları"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 436,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Hedef fiyatlara ulaşınca bildirim alın"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 437,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 435,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-600 transition-all",
                                                                        onClick: ()=>setOpenDropdown(null),
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "font-semibold",
                                                                                children: "Widget"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 440,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                                className: "text-xs text-gray-500",
                                                                                children: "Sitenize entegre edin"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                                lineNumber: 441,
                                                                                columnNumber: 25
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                        lineNumber: 439,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                                lineNumber: 430,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 426,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 415,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 302,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 286,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "flex items-center gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "relative hidden md:block",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "relative",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                    type: "text",
                                                    className: "pl-10 pr-4 py-2.5 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-42 bg-gray-50 border border-gray-200 transition-all"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 456,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                    className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400",
                                                    fill: "none",
                                                    stroke: "currentColor",
                                                    viewBox: "0 0 24 24",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 462,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 461,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 455,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 454,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        className: "hidden lg:flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:text-purple-600 font-medium transition-colors rounded-xl hover:bg-purple-50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                className: "w-5 h-5",
                                                fill: "none",
                                                stroke: "currentColor",
                                                viewBox: "0 0 24 24",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 470,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round",
                                                        strokeWidth: 2,
                                                        d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 471,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 469,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                className: "text-sm",
                                                children: "İzleme Listesi"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 473,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 468,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/portfolio",
                                        className: "hidden lg:flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-500 text-white font-medium rounded-xl hover:shadow-lg transition-all hover:scale-105",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                className: "w-5 h-5",
                                                fill: "currentColor",
                                                viewBox: "0 0 20 20",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                    d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 479,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 478,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                className: "text-sm",
                                                children: "Portföy"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 481,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 477,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setOpenDropdown(openDropdown === 'mobile' ? null : 'mobile'),
                                        className: "lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                            className: "w-6 h-6",
                                            fill: "none",
                                            stroke: "currentColor",
                                            viewBox: "0 0 24 24",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                strokeLinecap: "round",
                                                strokeLinejoin: "round",
                                                strokeWidth: 2,
                                                d: "M4 6h16M4 12h16M4 18h16"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                lineNumber: 491,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 490,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    }, void 0, false, {
                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                        lineNumber: 486,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                lineNumber: 452,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 284,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    openDropdown === 'mobile' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "lg:hidden mt-4 pb-4 pt-4 border-t border-gray-200",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                    href: "/",
                                    className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                                    children: "Kripto Paralar"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 501,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                                    children: "Borsalar"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 502,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                                    children: "NFT"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 503,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                                    children: "Öğren"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 504,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                    href: "#",
                                    className: "px-4 py-3 text-gray-700 hover:text-gray-900 font-medium rounded-lg hover:bg-gray-100",
                                    children: "Ürünler"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 505,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "pt-4 border-t border-gray-200 mt-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                            className: "w-full flex items-center gap-2 px-4 py-3 text-purple-600 font-medium rounded-lg hover:bg-purple-50 mb-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5",
                                                    fill: "currentColor",
                                                    viewBox: "0 0 20 20",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                        d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 509,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 508,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                "Favoriler"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 507,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                            className: "w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg mb-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                    className: "w-5 h-5",
                                                    fill: "currentColor",
                                                    viewBox: "0 0 20 20",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                        d: "M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                        lineNumber: 515,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 514,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                "Portföy"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                            lineNumber: 513,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        user ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "w-full px-4 py-3 text-center mb-2",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                            className: "text-xs text-gray-500",
                                                            children: "Hoş geldin,"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 522,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                            className: "text-sm font-bold text-gray-900",
                                                            children: user.name || user.full_name || user.email
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                            lineNumber: 523,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 521,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                    onClick: handleLogout,
                                                    className: "w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg block text-center",
                                                    children: "Çıkış Yap"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 525,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    href: "/login",
                                                    className: "w-full px-4 py-3 text-gray-700 font-medium rounded-lg hover:bg-gray-100 mb-2 block text-center",
                                                    children: "Giriş Yap"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 534,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                    href: "/register",
                                                    className: "w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg block text-center",
                                                    children: "Kaydol"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                                    lineNumber: 535,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                                    lineNumber: 506,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                            lineNumber: 500,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                        lineNumber: 499,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 283,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            openDropdown && openDropdown !== 'mobile' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "fixed inset-0 z-40",
                onClick: ()=>setOpenDropdown(null)
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/components/Navbar.tsx",
                lineNumber: 546,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true);
};
const __TURBOPACK__default__export__ = Navbar;
}),
"[project]/my-crypto-tracker/src/components/PriceChart.tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
const PriceChart = ({ data, width = 1200, height = 400, timeRange })=>{
    const [hoveredPoint, setHoveredPoint] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const svgRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    if (!data || !Array.isArray(data) || data.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center h-96 text-gray-500",
            children: "Grafik verisi bulunamadı"
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
            lineNumber: 25,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    // Grafik alanı için margin'ler
    const margin = {
        top: 20,
        right: 20,
        bottom: 55,
        left: 60
    };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    // Fiyat aralığını hesapla
    const prices = data.map((d)=>d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    const pricePadding = priceRange * 0.1; // %10 padding
    // Tarih aralığını hesapla
    const timestamps = data.map((d)=>d.timestamp);
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    // Y ekseni için fiyat etiketleri (5 adet)
    const yAxisTicks = 5;
    const yTickValues = [];
    for(let i = 0; i <= yAxisTicks; i++){
        const value = minPrice - pricePadding + (priceRange + pricePadding * 2) * (i / yAxisTicks);
        yTickValues.push(value);
    }
    // X ekseni için tarih etiketleri
    const getXAxisLabels = ()=>{
        const labels = [];
        const labelCount = timeRange === '1y' ? 12 : timeRange === '30d' ? 6 : timeRange === '7d' ? 7 : 6;
        for(let i = 0; i <= labelCount; i++){
            const index = Math.floor((data.length - 1) * (i / labelCount));
            if (index >= 0 && index < data.length) {
                const timestamp = data[index].timestamp;
                const date = new Date(timestamp);
                let label = '';
                if (timeRange === '1y') {
                    // Yıl için: 2012, 2014, 2016, etc.
                    label = date.getFullYear().toString();
                } else if (timeRange === '30d') {
                    // Ay için: Jan, Feb, etc.
                    const monthNames = [
                        'Jan',
                        'Feb',
                        'Mar',
                        'Apr',
                        'May',
                        'Jun',
                        'Jul',
                        'Aug',
                        'Sep',
                        'Oct',
                        'Nov',
                        'Dec'
                    ];
                    label = monthNames[date.getMonth()] + ' \'' + date.getFullYear().toString().slice(-2);
                } else if (timeRange === '7d') {
                    // Gün için: Mon, Tue, etc.
                    const dayNames = [
                        'Sun',
                        'Mon',
                        'Tue',
                        'Wed',
                        'Thu',
                        'Fri',
                        'Sat'
                    ];
                    label = dayNames[date.getDay()];
                } else {
                    // 24h için: saat
                    label = date.getHours().toString().padStart(2, '0') + ':00';
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
    // Koordinat dönüşüm fonksiyonları
    const xScale = (timestamp)=>{
        return (timestamp - minTime) / (maxTime - minTime) * chartWidth;
    };
    const yScale = (price)=>{
        return chartHeight - (price - (minPrice - pricePadding)) / (priceRange + pricePadding * 2) * chartHeight;
    };
    // Fiyat formatı - daha okunabilir
    const formatPrice = (price)=>{
        if (price >= 1000000) {
            return '$' + (price / 1000000).toFixed(2) + 'M';
        } else if (price >= 1000) {
            return '$' + (price / 1000).toFixed(2) + 'K';
        } else if (price >= 1) {
            return '$' + price.toFixed(2);
        } else {
            return '$' + price.toFixed(4);
        }
    };
    // Grafik çizgisi için path oluştur
    const createPath = ()=>{
        if (data.length === 0) return '';
        let path = `M ${xScale(data[0].timestamp)},${yScale(data[0].price)}`;
        for(let i = 1; i < data.length; i++){
            path += ` L ${xScale(data[i].timestamp)},${yScale(data[i].price)}`;
        }
        return path;
    };
    const path = createPath();
    const isPositive = data[data.length - 1].price >= data[0].price;
    const lineColor = isPositive ? '#10b981' : '#ef4444';
    // Mouse move handler
    const handleMouseMove = (e)=>{
        if (!svgRef.current) return;
        const rect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left - margin.left;
        const mouseY = e.clientY - rect.top - margin.top;
        // Mouse grafik alanı içinde mi kontrol et
        if (mouseX < 0 || mouseX > chartWidth || mouseY < 0 || mouseY > chartHeight) {
            setHoveredPoint(null);
            return;
        }
        // Mouse pozisyonuna en yakın veri noktasını bul
        const mouseTimestamp = minTime + mouseX / chartWidth * (maxTime - minTime);
        let closestIndex = 0;
        let minDistance = Math.abs(data[0].timestamp - mouseTimestamp);
        for(let i = 1; i < data.length; i++){
            const distance = Math.abs(data[i].timestamp - mouseTimestamp);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = i;
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
    const handleMouseLeave = ()=>{
        setHoveredPoint(null);
    };
    // Tarih formatı
    const formatDate = (timestamp)=>{
        const date = new Date(timestamp);
        if (timeRange === '5y' || timeRange === '3y') {
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'short'
            });
        } else if (timeRange === '1y') {
            return date.toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } else if (timeRange === '30d') {
            return date.toLocaleDateString('tr-TR', {
                month: 'short',
                day: 'numeric'
            });
        } else if (timeRange === '7d') {
            return date.toLocaleDateString('tr-TR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
            });
        } else {
            return date.toLocaleString('tr-TR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    };
    // Fiyat formatı (tam)
    const formatFullPrice = (price)=>{
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: price < 1 ? 6 : 2
        }).format(price);
    };
    // SVG için ekstra yükseklik (X ekseni etiketleri için)
    const svgHeight = height + 30;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "bg-white rounded-xl p-4 w-full overflow-x-auto relative",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                ref: svgRef,
                width: width,
                height: svgHeight,
                className: "overflow-visible",
                style: {
                    maxWidth: '100%',
                    minHeight: `${svgHeight}px`
                },
                onMouseMove: handleMouseMove,
                onMouseLeave: handleMouseLeave,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("defs", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("pattern", {
                            id: "grid",
                            width: "10",
                            height: "10",
                            patternUnits: "userSpaceOnUse",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                d: "M 10 0 L 0 0 0 10",
                                fill: "none",
                                stroke: "#f3f4f6",
                                strokeWidth: "0.5"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                                lineNumber: 216,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                            lineNumber: 215,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 214,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("rect", {
                        x: margin.left,
                        y: margin.top,
                        width: chartWidth,
                        height: chartHeight,
                        fill: "url(#grid)"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 219,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    yTickValues.map((value, index)=>{
                        const y = margin.top + yScale(value);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                            x1: margin.left,
                            y1: y,
                            x2: margin.left + chartWidth,
                            y2: y,
                            stroke: "#e5e7eb",
                            strokeWidth: "1",
                            strokeDasharray: "2 2",
                            opacity: "0.5"
                        }, `grid-y-${index}`, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                            lineNumber: 231,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0));
                    }),
                    xAxisLabels.map((item, index)=>{
                        const x = margin.left + xScale(item.timestamp);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                            x1: x,
                            y1: margin.top,
                            x2: x,
                            y2: margin.top + chartHeight,
                            stroke: "#e5e7eb",
                            strokeWidth: "1",
                            strokeDasharray: "2 2",
                            opacity: "0.5"
                        }, `grid-x-${index}`, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                            lineNumber: 249,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0));
                    }),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("rect", {
                        x: margin.left,
                        y: margin.top,
                        width: chartWidth,
                        height: chartHeight,
                        fill: "transparent",
                        style: {
                            cursor: 'crosshair'
                        }
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 264,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                        x1: margin.left,
                        y1: margin.top,
                        x2: margin.left,
                        y2: margin.top + chartHeight,
                        stroke: "#d1d5db",
                        strokeWidth: "2"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 274,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                        x1: margin.left,
                        y1: margin.top + chartHeight,
                        x2: margin.left + chartWidth,
                        y2: margin.top + chartHeight,
                        stroke: "#d1d5db",
                        strokeWidth: "2"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 284,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    yTickValues.map((value, index)=>{
                        const y = margin.top + yScale(value);
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("g", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                    x1: margin.left - 8,
                                    y1: y,
                                    x2: margin.left,
                                    y2: y,
                                    stroke: "#9ca3af",
                                    strokeWidth: "1.5"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                                    lineNumber: 298,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("text", {
                                    x: margin.left - 15,
                                    y: y + 5,
                                    textAnchor: "end",
                                    fontSize: "13",
                                    fill: "#374151",
                                    className: "font-semibold",
                                    fontWeight: "600",
                                    children: formatPrice(value)
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                                    lineNumber: 306,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, index, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                            lineNumber: 297,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0));
                    }),
                    xAxisLabels.map((item, index)=>{
                        const x = margin.left + xScale(item.timestamp);
                        const yPos = margin.top + chartHeight;
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("g", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                                    x1: x,
                                    y1: yPos,
                                    x2: x,
                                    y2: yPos + 10,
                                    stroke: "#9ca3af",
                                    strokeWidth: "2"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                                    lineNumber: 327,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("text", {
                                    x: x,
                                    y: yPos + 28,
                                    textAnchor: "middle",
                                    fontSize: "12",
                                    fill: "#374151",
                                    className: "font-semibold",
                                    fontWeight: "600",
                                    style: {
                                        dominantBaseline: 'hanging'
                                    },
                                    children: item.label
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                                    lineNumber: 335,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, index, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                            lineNumber: 326,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0));
                    }),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("defs", {
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("linearGradient", {
                            id: "areaGradient",
                            x1: "0%",
                            y1: "0%",
                            x2: "0%",
                            y2: "100%",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
                                    offset: "0%",
                                    stopColor: lineColor,
                                    stopOpacity: "0.2"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                                    lineNumber: 354,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
                                    offset: "100%",
                                    stopColor: lineColor,
                                    stopOpacity: "0.05"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                                    lineNumber: 355,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                            lineNumber: 353,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 352,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("g", {
                        transform: `translate(${margin.left}, ${margin.top})`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                            d: path + ` L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`,
                            fill: "url(#areaGradient)"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                            lineNumber: 361,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 360,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("g", {
                        transform: `translate(${margin.left}, ${margin.top})`,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                            d: path,
                            fill: "none",
                            stroke: lineColor,
                            strokeWidth: "3.5",
                            strokeLinecap: "round",
                            strokeLinejoin: "round"
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                            lineNumber: 369,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 368,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    hoveredPoint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
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
                                lineNumber: 382,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                                cx: hoveredPoint.x,
                                cy: hoveredPoint.y,
                                r: "6",
                                fill: lineColor,
                                stroke: "white",
                                strokeWidth: "3"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                                lineNumber: 393,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                                cx: hoveredPoint.x,
                                cy: hoveredPoint.y,
                                r: "8",
                                fill: lineColor,
                                opacity: "0.2"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                                lineNumber: 401,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("text", {
                        x: margin.left - 65,
                        y: margin.top + chartHeight / 2,
                        textAnchor: "middle",
                        fontSize: "12",
                        fill: "#6b7280",
                        className: "font-semibold",
                        transform: `rotate(-90 ${margin.left - 65} ${margin.top + chartHeight / 2})`,
                        children: "Fiyat (USD)"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 412,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("text", {
                        x: margin.left + chartWidth / 2,
                        y: svgHeight - 5,
                        textAnchor: "middle",
                        fontSize: "11",
                        fill: "#6b7280",
                        className: "font-semibold",
                        children: "Zaman"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 425,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 204,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            hoveredPoint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "absolute bg-gray-900 text-white rounded-lg px-4 py-3 shadow-xl pointer-events-none z-10 whitespace-nowrap border border-gray-700",
                style: {
                    left: `${24 + Math.min(hoveredPoint.x + 10, width - 200)}px`,
                    top: `${24 + Math.max(hoveredPoint.y - 70, 20)}px`
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "text-xs text-gray-300 mb-2 font-medium",
                        children: formatDate(hoveredPoint.timestamp)
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 446,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "text-base font-bold",
                        children: formatFullPrice(hoveredPoint.price)
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 447,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 border-r border-b border-gray-700 rotate-45"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                        lineNumber: 448,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
                lineNumber: 439,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/my-crypto-tracker/src/components/PriceChart.tsx",
        lineNumber: 203,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = PriceChart;
}),
"[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/head.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/link.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$Navbar$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/components/Navbar.tsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$PriceChart$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/my-crypto-tracker/src/components/PriceChart.tsx [ssr] (ecmascript)");
;
;
;
;
;
;
;
const CoinDetailPage = ()=>{
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const { coinId } = router.query;
    const [coin, setCoin] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [coinDetails, setCoinDetails] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [chartData, setChartData] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        prices: [],
        priceData: []
    });
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [timeRange, setTimeRange] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('7d');
    const [chartLoading, setChartLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [detailsLoading, setDetailsLoading] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [converterAmount, setConverterAmount] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('1');
    const [converterCurrency, setConverterCurrency] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('usd');
    const [news, setNews] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [expandedBlock, setExpandedBlock] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [tooltipContent, setTooltipContent] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [tooltipPosition, setTooltipPosition] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [portfolio, setPortfolio] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return [];
    });
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        message: '',
        visible: false
    });
    const [marketStats, setMarketStats] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
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
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
    }, [
        coinId
    ]);
    // Coin detaylarını çek
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!coinId || typeof coinId !== 'string') return;
        const fetchCoinDetail = async ()=>{
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
        };
        fetchCoinDetail();
    }, [
        coinId
    ]);
    // Grafik verilerini çek
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!coinId || typeof coinId !== 'string') return;
        const fetchChartData = async ()=>{
            setChartLoading(true);
            try {
                const days = timeRangeMap[timeRange].days;
                const response = await fetch(`/api/chart/${coinId}?days=${days}`);
                const data = await response.json();
                if (data.priceData && Array.isArray(data.priceData) && data.priceData.length > 0) {
                    setChartData(data);
                } else if (data.prices && Array.isArray(data.prices) && data.prices.length > 0) {
                    // Eğer priceData yoksa ama prices varsa, priceData oluştur
                    // API'den gelen veri yapısına göre timestamp'leri tahmin et
                    const now = Date.now();
                    const interval = days * 24 * 60 * 60 * 1000 / data.prices.length;
                    const priceData = data.prices.map((price, index)=>({
                            timestamp: now - (data.prices.length - index) * interval,
                            price: price
                        }));
                    setChartData({
                        ...data,
                        priceData: priceData
                    });
                } else {
                    setChartData({
                        prices: [],
                        priceData: [],
                        error: data.error || 'Veri bulunamadı'
                    });
                }
            } catch (err) {
                console.error('Grafik verisi hatası:', err);
                setChartData({
                    prices: [],
                    priceData: []
                });
            } finally{
                setChartLoading(false);
            }
        };
        fetchChartData();
    }, [
        coinId,
        timeRange
    ]);
    // Coin detaylarını çek (CoinGecko'dan)
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!coinId || typeof coinId !== 'string') return;
        // coinId değiştiğinde coinDetails'i sıfırla
        setCoinDetails(null);
        const fetchCoinDetails = async ()=>{
            setDetailsLoading(true);
            try {
                const response = await fetch(`/api/coins/${coinId}/details`);
                const data = await response.json();
                if (!data.error) {
                    setCoinDetails(data);
                    // 7 günlük aralığı hesapla
                    if (chartData.prices && chartData.prices.length > 0) {
                        const prices7d = chartData.prices;
                        const high7d = Math.max(...prices7d);
                        const low7d = Math.min(...prices7d);
                        setCoinDetails((prev)=>prev ? {
                                ...prev,
                                priceRange7d: {
                                    high: high7d,
                                    low: low7d
                                }
                            } : null);
                    }
                }
            } catch (err) {
                console.error('Coin detayları hatası:', err);
            } finally{
                setDetailsLoading(false);
            }
        };
        fetchCoinDetails();
    }, [
        coinId
    ]);
    // Global market stats'ı çek
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const fetchGlobalStats = async ()=>{
            try {
                const response = await fetch('/api/global');
                const data = await response.json();
                if (data) {
                    setMarketStats({
                        totalCoins: data.totalCoins || 0,
                        totalExchanges: data.totalExchanges || 1414,
                        marketCap: data.marketCap || 0,
                        marketCapChange24h: data.marketCapChange24h || 0,
                        volume24h: data.volume24h || 0,
                        btcDominance: data.btcDominance || 0,
                        ethDominance: data.ethDominance || 0,
                        gasPrice: data.gasPrice || 0.518
                    });
                }
            } catch (error) {
                console.error('Global stats çekilemedi:', error);
            }
        };
        fetchGlobalStats();
    }, []);
    // 7 günlük aralığı güncelle
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (chartData.prices && chartData.prices.length > 0 && coinDetails) {
            const prices7d = chartData.prices;
            const high7d = Math.max(...prices7d);
            const low7d = Math.min(...prices7d);
            setCoinDetails((prev)=>prev ? {
                    ...prev,
                    priceRange7d: {
                        high: high7d,
                        low: low7d
                    }
                } : null);
        }
    }, [
        chartData.prices,
        coinDetails
    ]);
    // Haberleri çek
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (!coinId || typeof coinId !== 'string') return;
        const fetchNews = async ()=>{
            try {
                const response = await fetch(`/api/coins/${coinId}/news`);
                const data = await response.json();
                if (data.news && Array.isArray(data.news)) {
                    setNews(data.news);
                }
            } catch (err) {
                console.error('Haberler hatası:', err);
            }
        };
        fetchNews();
    }, [
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
    const formatTrillion = (num)=>{
        if (num >= 1e12) {
            return (num / 1e12).toFixed(3) + ' Tn';
        } else if (num >= 1e9) {
            return (num / 1e9).toFixed(3) + ' Mr';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(3) + ' Mn';
        }
        return formatNumber(num);
    };
    const formatCurrencyTRY = (amount)=>{
        if (amount == null || isNaN(amount)) return '₺0,00';
        return new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
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
    const getDateDifference = (dateString)=>{
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-white flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "text-gray-600 text-lg",
                    children: "Yükleniyor..."
                }, void 0, false, {
                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                    lineNumber: 414,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 413,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
            lineNumber: 412,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    if (error || !coin) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-white flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "text-red-600 text-lg mb-4",
                        children: error || 'Coin bulunamadı'
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 424,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/",
                        className: "text-blue-600 hover:text-blue-800 underline",
                        children: "Ana Sayfaya Dön"
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 425,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 423,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
            lineNumber: 422,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-gray-50",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("title", {
                        children: [
                            coin.name,
                            " (",
                            coin.symbol.toUpperCase(),
                            ") - Dijital Marketim"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 436,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "description",
                        content: `${coin.name} fiyat, grafik ve analiz bilgileri`
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 437,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 435,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$Navbar$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                marketStats: marketStats
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 441,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "max-w-7xl mx-auto px-6 py-8",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("nav", {
                        className: "mb-6 text-sm text-gray-600",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                href: "/",
                                className: "hover:text-gray-900 transition-colors",
                                children: "Ana Sayfa"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 447,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                className: "mx-2",
                                children: "/"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 450,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                className: "text-gray-900 font-medium",
                                children: coin.name
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 451,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 446,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6 items-stretch",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-3 flex flex-col space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: ()=>coinDetails && setExpandedBlock('global-prices'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-2",
                                                children: "Küresel Fiyatlar"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 463,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            coinDetails ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs font-semibold text-gray-900",
                                                                        children: [
                                                                            coin.symbol.toUpperCase(),
                                                                            " / USD"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 468,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs text-gray-500",
                                                                        children: "US Dollar"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 469,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 467,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs font-bold text-gray-900",
                                                                children: formatCurrency(coinDetails.prices.usd)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 471,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 466,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs font-semibold text-gray-900",
                                                                        children: [
                                                                            coin.symbol.toUpperCase(),
                                                                            " / TRY"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 475,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs text-gray-500",
                                                                        children: "Turkish Lira"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 476,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 474,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs font-bold text-gray-900",
                                                                children: formatCurrencyTRY(coinDetails.prices.try)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 478,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 473,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 465,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-8 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 483,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-8 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 484,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 482,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 459,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: ()=>coinDetails && setExpandedBlock('market-stats'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-2",
                                                children: "Piyasa İstatistikleri"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 494,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            coinDetails ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5 text-xs",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-600",
                                                                children: "Piyasa Değeri"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 498,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-900 font-semibold text-xs",
                                                                children: [
                                                                    formatTrillion(coinDetails.marketData.marketCap.usd),
                                                                    " $"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 499,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 497,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-600",
                                                                children: "24s Hacim"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 502,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-900 font-semibold text-xs",
                                                                children: [
                                                                    formatTrillion(coinDetails.marketData.volume24h.usd),
                                                                    " $"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 503,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 501,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-600",
                                                                children: "Dolaşım Arzı"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 506,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-900 font-semibold text-xs",
                                                                children: formatTrillion(coinDetails.supply.circulating)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 507,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 505,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    coinDetails.marketData.marketCapRank && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "flex justify-between pt-1.5 border-t border-gray-100",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-600",
                                                                children: "Sıralama"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 511,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                className: "text-gray-900 font-bold text-xs",
                                                                children: [
                                                                    "#",
                                                                    coinDetails.marketData.marketCapRank
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 512,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 510,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 496,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 518,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 519,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 520,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 517,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 490,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: ()=>coinDetails && setExpandedBlock('historical-price'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-2",
                                                children: "Tarihsel Fiyat"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 530,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            coinDetails ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5 text-xs",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-600 mb-0.5 text-xs",
                                                                children: "24sa Aralık"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 534,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs font-semibold text-gray-900",
                                                                children: [
                                                                    formatCurrency(coinDetails.priceRange24h.low.usd),
                                                                    " - ",
                                                                    formatCurrency(coinDetails.priceRange24h.high.usd)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 535,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 533,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-600 mb-0.5 text-xs",
                                                                children: "7g Aralık"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 540,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs font-semibold text-gray-900",
                                                                children: [
                                                                    formatCurrency(coinDetails.priceRange7d.low),
                                                                    " - ",
                                                                    formatCurrency(coinDetails.priceRange7d.high)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 541,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 539,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "pt-1.5 border-t border-gray-100 grid grid-cols-2 gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-gray-600 mb-0.5 text-xs",
                                                                        children: "ATH"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 547,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs font-bold text-gray-900",
                                                                        children: formatCurrency(coinDetails.ath.price.usd)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 548,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 546,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-gray-600 mb-0.5 text-xs",
                                                                        children: "ATL"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 551,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-xs font-bold text-gray-900",
                                                                        children: formatCurrency(coinDetails.atl.price.usd)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 552,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 550,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 545,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 532,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 558,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 559,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 560,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 557,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 526,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 457,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-6 flex flex-col space-y-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-2xl p-6 shadow-lg",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-4",
                                                        children: [
                                                            coin.image && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                                                src: coin.image,
                                                                alt: coin.name,
                                                                className: "w-16 h-16 rounded-full ring-4 ring-gray-200",
                                                                onError: (e)=>{
                                                                    e.currentTarget.style.display = 'none';
                                                                }
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 573,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                                                                        className: "text-3xl font-bold text-gray-900 mb-1",
                                                                        children: coin.name
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 583,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                                        className: "text-gray-500 uppercase text-base font-semibold",
                                                                        children: coin.symbol
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 584,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 582,
                                                                columnNumber: 15
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 571,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "text-right flex flex-col items-end gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-4xl font-bold text-gray-900 mb-2",
                                                                children: formatCurrency(coin.current_price)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 588,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: `text-xl font-semibold flex items-center gap-2 ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`,
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                        children: coin.price_change_percentage_24h >= 0 ? '▲' : '▼'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 596,
                                                                        columnNumber: 17
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                        children: [
                                                                            Math.abs(coin.price_change_percentage_24h).toFixed(2),
                                                                            "%"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 597,
                                                                        columnNumber: 17
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                        className: "text-gray-500 text-sm font-normal",
                                                                        children: "(24s)"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 598,
                                                                        columnNumber: 17
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 591,
                                                                columnNumber: 15
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                onClick: (e)=>{
                                                                    e.stopPropagation();
                                                                    const isInPortfolio = portfolio.includes(coin.id);
                                                                    if (isInPortfolio) {
                                                                        const newPortfolio = portfolio.filter((id)=>id !== coin.id);
                                                                        setPortfolio(newPortfolio);
                                                                        localStorage.setItem('portfolio', JSON.stringify(newPortfolio));
                                                                    } else {
                                                                        const newPortfolio = [
                                                                            ...portfolio,
                                                                            coin.id
                                                                        ];
                                                                        setPortfolio(newPortfolio);
                                                                        localStorage.setItem('portfolio', JSON.stringify(newPortfolio));
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
                                                                children: portfolio.includes(coin.id) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                    className: "w-5 h-5",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    viewBox: "0 0 24 24",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round",
                                                                        strokeWidth: 3,
                                                                        d: "M5 13l4 4L19 7"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 629,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 628,
                                                                    columnNumber: 19
                                                                }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                                    className: "w-5 h-5",
                                                                    fill: "none",
                                                                    stroke: "currentColor",
                                                                    viewBox: "0 0 24 24",
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                                        strokeLinecap: "round",
                                                                        strokeLinejoin: "round",
                                                                        strokeWidth: 2,
                                                                        d: "M12 4v16m8-8H4"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 633,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 632,
                                                                    columnNumber: 19
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 601,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 587,
                                                        columnNumber: 13
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 570,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "mb-4 pb-4",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "text-right",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "text-xs text-gray-600 mb-1",
                                                            children: "Seçili Zaman Dilimi Değişimi"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 643,
                                                            columnNumber: 15
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "grid grid-cols-2 md:grid-cols-4 gap-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "bg-gray-50 rounded-lg p-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600 mb-1",
                                                                children: "Piyasa Değeri"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 657,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-base font-bold text-gray-900",
                                                                children: [
                                                                    formatTrillion(coin.market_cap),
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
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "bg-gray-50 rounded-lg p-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600 mb-1",
                                                                children: "24s Hacim"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 661,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-base font-bold text-gray-900",
                                                                children: [
                                                                    formatTrillion(coin.total_volume),
                                                                    " $"
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 662,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 660,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "bg-gray-50 rounded-lg p-3 relative",
                                                        onMouseEnter: (e)=>{
                                                            const element = e.currentTarget.querySelector('.value-text');
                                                            if (element && element.scrollWidth > element.clientWidth) {
                                                                const rect = e.currentTarget.getBoundingClientRect();
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
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600 mb-1",
                                                                children: "Tam Piyasa Değeri"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 679,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-base font-bold text-gray-900 value-text truncate",
                                                                children: formatCurrency(coin.market_cap)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 680,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 664,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "bg-gray-50 rounded-lg p-3 relative",
                                                        onMouseEnter: (e)=>{
                                                            const element = e.currentTarget.querySelector('.value-text');
                                                            if (element && element.scrollWidth > element.clientWidth) {
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setTooltipContent(formatCurrency(coin.total_volume));
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
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600 mb-1",
                                                                children: "Tam Hacim"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 697,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-base font-bold text-gray-900 value-text truncate",
                                                                children: formatCurrency(coin.total_volume)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 698,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 682,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 655,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 569,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-2xl p-4 shadow-lg",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between mb-3",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                                        className: "text-lg font-bold text-gray-900",
                                                        children: "Fiyat Grafiği"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 706,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-3",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2 flex-wrap",
                                                                children: [
                                                                    '24h',
                                                                    '7d',
                                                                    '30d',
                                                                    '1y',
                                                                    '3y',
                                                                    '5y'
                                                                ].map((range)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                        onClick: ()=>setTimeRange(range),
                                                                        className: `px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${timeRange === range ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-100 text-gray-700 hover:text-gray-900 hover:bg-gray-200'}`,
                                                                        children: timeRangeMap[range].label
                                                                    }, range, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 711,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 709,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "flex items-center gap-2",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                        className: "text-xs text-gray-600",
                                                                        children: "Veri:"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 725,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                        className: "text-xs font-semibold text-blue-600",
                                                                        children: "CoinGecko"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 726,
                                                                        columnNumber: 21
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 724,
                                                                columnNumber: 13
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 707,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 705,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            chartLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "h-96 flex items-center justify-center",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "text-center",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 734,
                                                            columnNumber: 17
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "text-gray-600",
                                                            children: "Grafik yükleniyor..."
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 735,
                                                            columnNumber: 17
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 733,
                                                    columnNumber: 15
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 732,
                                                columnNumber: 13
                                            }, ("TURBOPACK compile-time value", void 0)) : chartData.priceData && Array.isArray(chartData.priceData) && chartData.priceData.length > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "relative w-full",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "w-full overflow-x-auto",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$my$2d$crypto$2d$tracker$2f$src$2f$components$2f$PriceChart$2e$tsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                                            data: chartData.priceData,
                                                            width: 500,
                                                            height: 200,
                                                            timeRange: timeRange
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 741,
                                                            columnNumber: 17
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 740,
                                                        columnNumber: 15
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "mt-3 flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg px-4 py-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    "Başlangıç: ",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                        className: "text-gray-900 font-semibold",
                                                                        children: formatCurrency(chartData.firstPrice || 0)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 751,
                                                                        columnNumber: 30
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 750,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    "Bitiş: ",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                        className: "text-gray-900 font-semibold",
                                                                        children: formatCurrency(chartData.lastPrice || coin.current_price)
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 754,
                                                                        columnNumber: 26
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 753,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    "Değişim: ",
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                        className: `font-semibold ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`,
                                                                        children: [
                                                                            priceChange >= 0 ? '+' : '',
                                                                            priceChange.toFixed(2),
                                                                            "%"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 757,
                                                                        columnNumber: 28
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 756,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 749,
                                                        columnNumber: 15
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 739,
                                                columnNumber: 13
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "h-96 flex items-center justify-center text-gray-600",
                                                children: chartData.error ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "text-center max-w-md mx-auto px-4",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                            className: "text-red-600 mb-2 font-semibold",
                                                            children: "Grafik verisi yüklenemedi"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 767,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                            className: "text-sm text-gray-500 mb-4",
                                                            children: chartData.error
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 768,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        chartData.error.includes('429') || chartData.error.includes('çok fazla') ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-yellow-50 rounded-lg p-4 mt-4",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                                className: "text-sm text-yellow-800",
                                                                children: "CoinGecko API rate limit'e ulaşıldı. Lütfen birkaç dakika sonra tekrar deneyin."
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 771,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 770,
                                                            columnNumber: 21
                                                        }, ("TURBOPACK compile-time value", void 0)) : null
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 766,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)) : 'Grafik verisi yükleniyor...'
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 764,
                                                columnNumber: 13
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 704,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 567,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "lg:col-span-3 flex flex-col space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: (e)=>{
                                            e.stopPropagation();
                                            coinDetails && setExpandedBlock('converter');
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-2",
                                                children: [
                                                    coin.symbol.toUpperCase(),
                                                    " Çevirici"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 795,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            coinDetails ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                className: "block text-xs font-medium text-gray-700 mb-0.5",
                                                                children: coin.symbol.toUpperCase()
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 799,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                type: "number",
                                                                value: converterAmount,
                                                                onChange: (e)=>{
                                                                    e.stopPropagation();
                                                                    setConverterAmount(e.target.value);
                                                                },
                                                                onClick: (e)=>e.stopPropagation(),
                                                                className: "w-full px-2 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50",
                                                                placeholder: "1"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 800,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 798,
                                                        columnNumber: 15
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                className: "block text-xs font-medium text-gray-700 mb-0.5",
                                                                children: "Para Birimi"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 813,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                                                value: converterCurrency,
                                                                onChange: (e)=>{
                                                                    e.stopPropagation();
                                                                    setConverterCurrency(e.target.value);
                                                                },
                                                                onClick: (e)=>e.stopPropagation(),
                                                                className: "w-full px-2 py-1.5 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                                        value: "usd",
                                                                        children: "USD"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 823,
                                                                        columnNumber: 19
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                                        value: "try",
                                                                        children: "TRY"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 824,
                                                                        columnNumber: 19
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 814,
                                                                columnNumber: 17
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 812,
                                                        columnNumber: 15
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "p-2 bg-gray-50 rounded-lg",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600 mb-0.5",
                                                                children: "Sonuç:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 828,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-sm font-bold text-gray-900",
                                                                children: converterCurrency === 'usd' ? formatCurrency(parseFloat(converterAmount || '0') * coinDetails.prices.usd) : formatCurrencyTRY(parseFloat(converterAmount || '0') * coinDetails.prices.try)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 829,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 827,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 797,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "space-y-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-8 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 838,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-8 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 839,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-12 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 840,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 837,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 788,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: (e)=>{
                                            e.stopPropagation();
                                            coinDetails && setExpandedBlock('info');
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-2",
                                                children: "Bilgi"
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 853,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            coinDetails ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5 text-xs",
                                                children: [
                                                    coinDetails.links.homepage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-600 mb-0.5 text-xs",
                                                                children: "İnternet Sitesi"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 858,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                href: coinDetails.links.homepage,
                                                                target: "_blank",
                                                                rel: "noopener noreferrer",
                                                                className: "text-blue-600 hover:underline text-xs",
                                                                onClick: (e)=>e.stopPropagation(),
                                                                children: coinDetails.links.homepage.replace(/^https?:\/\//, '').replace(/\/$/, '').substring(0, 25)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 859,
                                                                columnNumber: 21
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 857,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    coinDetails.links.blockchainExplorers.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-600 mb-0.5 text-xs",
                                                                children: "Tarayıcılar"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 872,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "flex flex-wrap gap-1",
                                                                children: coinDetails.links.blockchainExplorers.slice(0, 2).map((explorer, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: explorer,
                                                                        target: "_blank",
                                                                        rel: "noopener noreferrer",
                                                                        className: "px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-700 transition-colors",
                                                                        onClick: (e)=>e.stopPropagation(),
                                                                        children: explorer.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0].substring(0, 12)
                                                                    }, idx, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 875,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0)))
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 873,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 871,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    coinDetails.marketData.marketCapRank && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "pt-1.5 border-t border-gray-100",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-gray-600 mb-0.5 text-xs",
                                                                children: "Sıralama"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 891,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs font-bold text-gray-900",
                                                                children: [
                                                                    "#",
                                                                    coinDetails.marketData.marketCapRank
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 892,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 890,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 855,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "space-y-1.5",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 898,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 899,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "h-4 bg-gray-100 rounded animate-pulse"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 900,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 897,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 846,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                        className: "bg-white rounded-xl p-3 shadow-lg cursor-pointer hover:shadow-xl transition-all",
                                        onClick: ()=>setExpandedBlock('sentiment'),
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                className: "text-xs font-bold text-gray-900 mb-1.5",
                                                children: [
                                                    "Bugün ",
                                                    coin.name,
                                                    " hakkında nasıl hissediyorsunuz?"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 910,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "grid grid-cols-2 gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        className: "p-2 bg-white rounded-lg hover:bg-green-50 transition-all text-center shadow-sm",
                                                        onClick: (e)=>e.stopPropagation(),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xl mb-0.5",
                                                                children: "🚀"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 918,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-sm font-bold text-gray-900",
                                                                children: "81%"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 919,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600",
                                                                children: "Yükseliş"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 920,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 914,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                        className: "p-2 bg-white rounded-lg hover:bg-red-50 transition-all text-center shadow-sm",
                                                        onClick: (e)=>e.stopPropagation(),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xl mb-0.5",
                                                                children: "👎"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 926,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-sm font-bold text-gray-900",
                                                                children: "39%"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 927,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-xs text-gray-600",
                                                                children: "Düşüş"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 928,
                                                                columnNumber: 19
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 922,
                                                        columnNumber: 17
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 913,
                                                columnNumber: 15
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 906,
                                        columnNumber: 13
                                    }, ("TURBOPACK compile-time value", void 0))
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 786,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 455,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    coinDetails && coinDetails.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-xl p-4 shadow-lg mb-6 cursor-pointer hover:shadow-xl transition-all",
                        onClick: ()=>setExpandedBlock('about'),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                className: "text-sm font-bold text-gray-900 mb-3",
                                children: [
                                    coin.name,
                                    " (",
                                    coin.symbol.toUpperCase(),
                                    ") nedir?"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 941,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "text-xs text-gray-700 leading-relaxed line-clamp-4",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    dangerouslySetInnerHTML: {
                                        __html: coinDetails.description.split('\n').map((para)=>`<p>${para}</p>`).join('').substring(0, 500) + (coinDetails.description.length > 500 ? '...' : '')
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 943,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 942,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 937,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    news.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl p-8 shadow-lg mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold text-gray-900 mb-6",
                                children: [
                                    coin.name,
                                    " Son Haberleri ve Yorumları"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 959,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
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
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                        href: articleUrl,
                                        target: "_blank",
                                        rel: "noopener noreferrer",
                                        className: "block bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group shadow-sm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "relative w-full h-48 bg-gray-200 overflow-hidden",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                                                    src: article.image,
                                                    alt: article.title,
                                                    className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300",
                                                    onError: (e)=>{
                                                        e.currentTarget.src = 'https://via.placeholder.com/400x250?text=Haber+Görseli';
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 998,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 997,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0)),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "p-4",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                        className: "text-base font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors",
                                                        children: article.title
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1008,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center justify-between text-xs text-gray-500",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                className: "font-medium",
                                                                children: article.source
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1012,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                                children: article.publishedTime
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1013,
                                                                columnNumber: 23
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1011,
                                                        columnNumber: 21
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 1007,
                                                columnNumber: 19
                                            }, ("TURBOPACK compile-time value", void 0))
                                        ]
                                    }, article.id, true, {
                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                        lineNumber: 990,
                                        columnNumber: 17
                                    }, ("TURBOPACK compile-time value", void 0));
                                })
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 960,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "mt-6 text-center",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                    href: `https://cointelegraph.com/search?q=${coin.name}`,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className: "inline-block px-8 py-4 bg-gradient-to-r from-blue-600 via-yellow-500 to-red-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg",
                                    children: "Daha Fazla Haber Gör"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1021,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 1020,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 958,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl p-8 shadow-lg mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "text-2xl font-bold text-gray-900 mb-4",
                                children: "Hakkında"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 1035,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
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
                                lineNumber: 1036,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            coin.last_updated && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "mt-4 text-sm text-gray-600",
                                children: [
                                    "Son Güncelleme: ",
                                    new Date(coin.last_updated).toLocaleString('tr-TR')
                                ]
                            }, void 0, true, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 1043,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 1034,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    tooltipContent && tooltipPosition && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none",
                        style: {
                            left: `${tooltipPosition.x}px`,
                            top: `${tooltipPosition.y}px`,
                            transform: 'translateX(-50%) translateY(-100%)'
                        },
                        children: [
                            tooltipContent,
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                className: "absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 1060,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        ]
                    }, void 0, true, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 1051,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    expandedBlock && coinDetails && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4",
                        onClick: ()=>setExpandedBlock(null),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto",
                            onClick: (e)=>e.stopPropagation(),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
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
                                            lineNumber: 1077,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setExpandedBlock(null),
                                            className: "text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors",
                                            children: "×"
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1086,
                                            columnNumber: 17
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1076,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "p-6",
                                    children: [
                                        expandedBlock === 'global-prices' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: [
                                                                        coin.symbol.toUpperCase(),
                                                                        " / USD"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1100,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-3xl font-bold text-gray-900 mb-2",
                                                                    children: formatCurrency(coinDetails.prices.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1101,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-500",
                                                                    children: "US Dollar"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1102,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1099,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: [
                                                                        coin.symbol.toUpperCase(),
                                                                        " / TRY"
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1105,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-3xl font-bold text-gray-900 mb-2",
                                                                    children: formatCurrencyTRY(coinDetails.prices.try)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1106,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-500",
                                                                    children: "Turkish Lira"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1107,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1104,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1098,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "bg-blue-50 rounded-xl p-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-blue-800",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                                                children: "Not:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1112,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            " Fiyatlar gerçek zamanlı olarak güncellenmektedir. Farklı borsalarda fiyatlar değişiklik gösterebilir."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1111,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1110,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1097,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'market-stats' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "Piyasa Değeri"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1123,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatCurrency(coinDetails.marketData.marketCap.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1124,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500 mt-2",
                                                                    children: [
                                                                        "TRY: ",
                                                                        formatCurrencyTRY(coinDetails.marketData.marketCap.try)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1125,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1122,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "24 Saat Hacim"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1128,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatCurrency(coinDetails.marketData.volume24h.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1129,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500 mt-2",
                                                                    children: [
                                                                        "TRY: ",
                                                                        formatCurrencyTRY(coinDetails.marketData.volume24h.try)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1130,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1127,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "Dolaşım Arzı"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1133,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatNumber(coinDetails.supply.circulating)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1134,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500 mt-2",
                                                                    children: coin.symbol.toUpperCase()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1135,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1132,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "Toplam Arz"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1138,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatNumber(coinDetails.supply.total)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1139,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500 mt-2",
                                                                    children: coin.symbol.toUpperCase()
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1140,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1137,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1121,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                coinDetails.marketData.marketCapRank && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "bg-blue-50 rounded-xl p-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "text-sm text-blue-800",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                                                children: "Piyasa Değeri Sıralaması:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1146,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            " #",
                                                            coinDetails.marketData.marketCapRank
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1145,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1144,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1120,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'historical-price' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "24 Saat Aralık"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1158,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-lg font-semibold text-gray-900 mb-1",
                                                                    children: "Düşük"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1159,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900 mb-4",
                                                                    children: formatCurrency(coinDetails.priceRange24h.low.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1160,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-lg font-semibold text-gray-900 mb-1",
                                                                    children: "Yüksek"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1161,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatCurrency(coinDetails.priceRange24h.high.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1162,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1157,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-gray-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "7 Gün Aralık"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1165,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-lg font-semibold text-gray-900 mb-1",
                                                                    children: "Düşük"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1166,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900 mb-4",
                                                                    children: formatCurrency(coinDetails.priceRange7d.low)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1167,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-lg font-semibold text-gray-900 mb-1",
                                                                    children: "Yüksek"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1168,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900",
                                                                    children: formatCurrency(coinDetails.priceRange7d.high)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1169,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1164,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1156,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-green-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "Tüm Zamanların En Yükseği (ATH)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1174,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900 mb-2",
                                                                    children: formatCurrency(coinDetails.ath.price.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1175,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                coinDetails.ath.date && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500",
                                                                    children: new Date(coinDetails.ath.date).toLocaleDateString('tr-TR')
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1177,
                                                                    columnNumber: 27
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1173,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "bg-red-50 rounded-xl p-6",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-sm text-gray-600 mb-2",
                                                                    children: "Tüm Zamanların En Düşüğü (ATL)"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1181,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-2xl font-bold text-gray-900 mb-2",
                                                                    children: formatCurrency(coinDetails.atl.price.usd)
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1182,
                                                                    columnNumber: 25
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                coinDetails.atl.date && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                    className: "text-xs text-gray-500",
                                                                    children: new Date(coinDetails.atl.date).toLocaleDateString('tr-TR')
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1184,
                                                                    columnNumber: 27
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1180,
                                                            columnNumber: 23
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1172,
                                                    columnNumber: 21
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1155,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'converter' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "bg-gray-50 rounded-xl p-6",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                        className: "block text-sm font-medium text-gray-700 mb-2",
                                                                        children: coin.symbol.toUpperCase()
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1197,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
                                                                        type: "number",
                                                                        value: converterAmount,
                                                                        onChange: (e)=>setConverterAmount(e.target.value),
                                                                        className: "w-full px-4 py-3 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white",
                                                                        placeholder: "1"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1198,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1196,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                                                                        className: "block text-sm font-medium text-gray-700 mb-2",
                                                                        children: "Para Birimi"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1207,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("select", {
                                                                        value: converterCurrency,
                                                                        onChange: (e)=>setConverterCurrency(e.target.value),
                                                                        className: "w-full px-4 py-3 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                                                value: "usd",
                                                                                children: "USD"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                                lineNumber: 1213,
                                                                                columnNumber: 29
                                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("option", {
                                                                                value: "try",
                                                                                children: "TRY"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                                lineNumber: 1214,
                                                                                columnNumber: 29
                                                                            }, ("TURBOPACK compile-time value", void 0))
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1208,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1206,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1195,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "mt-6 p-6 bg-blue-50 rounded-xl",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-sm text-gray-600 mb-2",
                                                                children: "Sonuç:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1219,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                className: "text-4xl font-bold text-gray-900",
                                                                children: converterCurrency === 'usd' ? formatCurrency(parseFloat(converterAmount || '0') * coinDetails.prices.usd) : formatCurrencyTRY(parseFloat(converterAmount || '0') * coinDetails.prices.try)
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1220,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1218,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 1194,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1193,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'info' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: [
                                                coinDetails.links.homepage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "bg-gray-50 rounded-xl p-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "text-sm text-gray-600 mb-2",
                                                            children: "İnternet Sitesi"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1235,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                            href: coinDetails.links.homepage,
                                                            target: "_blank",
                                                            rel: "noopener noreferrer",
                                                            className: "text-blue-600 hover:underline text-lg font-semibold break-all",
                                                            children: coinDetails.links.homepage
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1236,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1234,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                coinDetails.links.blockchainExplorers.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "bg-gray-50 rounded-xl p-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "text-sm text-gray-600 mb-4",
                                                            children: "Blockchain Tarayıcılar"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1248,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "flex flex-wrap gap-3",
                                                            children: coinDetails.links.blockchainExplorers.map((explorer, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                    href: explorer,
                                                                    target: "_blank",
                                                                    rel: "noopener noreferrer",
                                                                    className: "px-4 py-2 bg-white hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors",
                                                                    children: explorer.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
                                                                }, idx, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1251,
                                                                    columnNumber: 29
                                                                }, ("TURBOPACK compile-time value", void 0)))
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1249,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1247,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                coinDetails.links.github && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "bg-gray-50 rounded-xl p-6",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                            className: "text-sm text-gray-600 mb-2",
                                                            children: "GitHub"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1266,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                            href: coinDetails.links.github,
                                                            target: "_blank",
                                                            rel: "noopener noreferrer",
                                                            className: "text-blue-600 hover:underline text-lg font-semibold break-all",
                                                            children: coinDetails.links.github
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1267,
                                                            columnNumber: 25
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1265,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                coinDetails.marketData.marketCapRank && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "bg-blue-50 rounded-xl p-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "text-sm text-blue-800",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                                                children: "Piyasa Değeri Sıralaması:"
                                                            }, void 0, false, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1280,
                                                                columnNumber: 27
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            " #",
                                                            coinDetails.marketData.marketCapRank
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1279,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1278,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1232,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'sentiment' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "bg-gray-50 rounded-xl p-6",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
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
                                                        lineNumber: 1291,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                className: "p-6 bg-white rounded-xl hover:bg-green-50 transition-all text-center shadow-lg",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-5xl mb-3",
                                                                        children: "🚀"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1297,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-4xl font-bold text-gray-900 mb-2",
                                                                        children: "81%"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1298,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-lg text-gray-600",
                                                                        children: "Yükseliş"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1299,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1296,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                                                                className: "p-6 bg-white rounded-xl hover:bg-red-50 transition-all text-center shadow-lg",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-5xl mb-3",
                                                                        children: "👎"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1302,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-4xl font-bold text-gray-900 mb-2",
                                                                        children: "39%"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1303,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0)),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                                        className: "text-lg text-gray-600",
                                                                        children: "Düşüş"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1304,
                                                                        columnNumber: 27
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                lineNumber: 1301,
                                                                columnNumber: 25
                                                            }, ("TURBOPACK compile-time value", void 0))
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1295,
                                                        columnNumber: 23
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 1290,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1289,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        expandedBlock === 'about' && coinDetails.description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "space-y-6",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "bg-gray-50 rounded-xl p-6",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "text-base text-gray-700 leading-relaxed",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                        dangerouslySetInnerHTML: {
                                                            __html: coinDetails.description.split('\n').map((para)=>`<p class="mb-4">${para}</p>`).join('')
                                                        }
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1316,
                                                        columnNumber: 25
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1315,
                                                    columnNumber: 23
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 1314,
                                                columnNumber: 21
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1313,
                                            columnNumber: 19
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1094,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                            lineNumber: 1072,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 1068,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("footer", {
                        className: "bg-white px-6 py-12 mt-6",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "max-w-7xl mx-auto",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "lg:col-span-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    className: "flex items-center gap-2 mb-4",
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                                        className: "text-2xl font-bold text-gray-900 lowercase",
                                                        children: "cripto"
                                                    }, void 0, false, {
                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                        lineNumber: 1341,
                                                        columnNumber: 19
                                                    }, ("TURBOPACK compile-time value", void 0))
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1340,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                    className: "text-sm text-gray-600 mb-4",
                                                    children: "Dijital Marketim, kripto piyasasına dair temel bir analiz sağlar. Dijital Marketim; fiyatı, hacmi ve piyasa değerini takip etmenin yanı sıra topluluk büyümesini, açık kaynak kod geliştirmeyi, önemli olayları ve zincir üstü metrikleri takip eder."
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1343,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1339,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-8",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                            className: "text-sm font-bold text-gray-900 mb-4",
                                                            children: "Kaynaklar"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1352,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                                                            className: "space-y-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Kripto Haberleri"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1355,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1354,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Kripto Para Hazine Rezervleri"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1358,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1357,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Kripto Isı Haritası"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1361,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1360,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Kripto API'si"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1364,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1363,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1353,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1351,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                            className: "text-sm font-bold text-gray-900 mb-4",
                                                            children: "Destek"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1371,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                                                            className: "space-y-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "İletişim Formu"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1374,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1373,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Reklam"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1377,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1376,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Yardım Merkezi"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1380,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1379,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "SSS"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1383,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1382,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1372,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1370,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                            className: "text-sm font-bold text-gray-900 mb-4",
                                                            children: "Cripto Hakkında"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1390,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                                                            className: "space-y-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Hakkımızda"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1393,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1392,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Metodoloji"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1396,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1395,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Gizlilik Politikası"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1399,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1398,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1391,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1389,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                                            className: "text-sm font-bold text-gray-900 mb-4",
                                                            children: "Topluluk"
                                                        }, void 0, false, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1406,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0)),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("ul", {
                                                            className: "space-y-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "X/Twitter"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1409,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1408,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Telegram"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1412,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1411,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0)),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("li", {
                                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                                                        href: "#",
                                                                        className: "text-sm text-gray-600 hover:text-gray-900 transition-colors",
                                                                        children: "Reddit"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                        lineNumber: 1415,
                                                                        columnNumber: 23
                                                                    }, ("TURBOPACK compile-time value", void 0))
                                                                }, void 0, false, {
                                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                                    lineNumber: 1414,
                                                                    columnNumber: 21
                                                                }, ("TURBOPACK compile-time value", void 0))
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                            lineNumber: 1407,
                                                            columnNumber: 19
                                                        }, ("TURBOPACK compile-time value", void 0))
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1405,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1349,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1337,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "pt-8",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "flex flex-col md:flex-row items-center justify-between gap-4 mb-6",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                                className: "text-sm text-gray-600",
                                                children: "© 2025 Cripto. All Rights Reserved."
                                            }, void 0, false, {
                                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                lineNumber: 1425,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1424,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "mt-8 p-4 bg-gray-50 rounded-lg",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h4", {
                                                    className: "text-sm font-bold text-gray-900 mb-2",
                                                    children: "ÖNEMLİ UYARI"
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1432,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0)),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                                    className: "text-xs text-gray-600 leading-relaxed",
                                                    children: 'Bu web sitesinde, bağlantılı sitelerde, uygulamalarda, forumlarda, bloglarda, sosyal medya hesaplarında ve diğer platformlarda (birlikte "Site") yer alan içerikler, yalnızca genel bilgilendirme amaçlıdır ve üçüncü taraflardan kaynaklanmaktadır. Bu içeriklerin doğruluğu, eksiksizliği, güncelliği veya güvenilirliği konusunda hiçbir garanti verilmemektedir. Herhangi bir yatırım kararı vermeden önce, kendi araştırmanızı yapmanız ve bağımsız profesyonel tavsiye almanız önerilir. Ticaret risklidir ve kayıplar meydana gelebilir. Bu sitede yer alan hiçbir içerik, teşvik, tavsiye veya teklif niteliği taşımamaktadır.'
                                                }, void 0, false, {
                                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                                    lineNumber: 1433,
                                                    columnNumber: 17
                                                }, ("TURBOPACK compile-time value", void 0))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                            lineNumber: 1431,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1423,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                            lineNumber: 1335,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    }, void 0, false, {
                        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                        lineNumber: 1334,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 444,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            toast.visible && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "fixed bottom-4 right-4 z-50 animate-slide-in-right",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "bg-gradient-to-r from-blue-500 via-yellow-500 via-red-500 to-green-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px]",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "flex-shrink-0",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                className: "w-6 h-6",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M5 13l4 4L19 7"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1448,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 1447,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                            lineNumber: 1446,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "flex-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                className: "font-semibold text-sm",
                                children: toast.message
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 1452,
                                columnNumber: 15
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                            lineNumber: 1451,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                            onClick: ()=>setToast({
                                    message: '',
                                    visible: false
                                }),
                            className: "flex-shrink-0 text-white/80 hover:text-white transition-colors",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                stroke: "currentColor",
                                viewBox: "0 0 24 24",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                    lineNumber: 1459,
                                    columnNumber: 17
                                }, ("TURBOPACK compile-time value", void 0))
                            }, void 0, false, {
                                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                                lineNumber: 1458,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                            lineNumber: 1454,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                    lineNumber: 1445,
                    columnNumber: 11
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
                lineNumber: 1444,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/my-crypto-tracker/src/pages/currencies/[coinId].tsx",
        lineNumber: 434,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = CoinDetailPage;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__c28752e6._.js.map