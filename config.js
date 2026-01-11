// SHADOW STELLAR - Configuration File
// Semua konfigurasi awal disimpan di sini

const SHADOW_STELLAR_CONFIG = (function() {
    // Default websites database
    const DEFAULT_WEBSITES = [
        {
            id: 1,
            name: "Portal Utama",
            url: "https://www.google.com",
            icon: "fas fa-home",
            description: "Akses portal utama SHADOW STELLAR",
            category: "portal",
            permissions: ["allow-scripts", "allow-forms"],
            clickCount: 0,
            maintenance: false,
            maintenanceMessage: ""
        },
        {
            id: 2,
            name: "Dashboard",
            url: "https://www.youtube.com",
            icon: "fas fa-tachometer-alt",
            description: "Panel kontrol dashboard sistem",
            category: "tools",
            permissions: ["allow-scripts", "allow-forms", "allow-popups"],
            clickCount: 0,
            maintenance: false,
            maintenanceMessage: ""
        },
        {
            id: 3,
            name: "Data Center",
            url: "https://github.com",
            icon: "fas fa-database",
            description: "Pusat data dan informasi sistem",
            category: "internal",
            permissions: ["allow-scripts"],
            clickCount: 0,
            maintenance: false,
            maintenanceMessage: ""
        },
        {
            id: 4,
            name: "Media Center",
            url: "https://vimeo.com",
            icon: "fas fa-photo-video",
            description: "Pusat media dan streaming",
            category: "media",
            permissions: ["allow-scripts", "allow-popups"],
            clickCount: 0,
            maintenance: false,
            maintenanceMessage: ""
        }
    ];

    // Default admin accounts (passwords will be hashed)
    const DEFAULT_ADMINS = [
        {
            username: "admin",
            passwordHash: "", // Will be set on first run
            role: "superadmin",
            createdAt: new Date().toISOString(),
            lastLogin: null
        },
        {
            username: "supervisor",
            passwordHash: "", // Will be set on first run
            role: "admin",
            createdAt: new Date().toISOString(),
            lastLogin: null
        }
    ];

    // Default system settings
    const DEFAULT_SETTINGS = {
        // System
        systemName: "SHADOW STELLAR",
        tagline: "Silent. Secure. Stellar.",
        
        // Security
        developerCode: null, // Will be generated
        codeLength: 6,
        maxLoginAttempts: 3,
        lockoutTime: 10, // minutes
        
        // Session
        sessionTimeout: 30, // minutes
        idleTimeout: 15, // minutes
        rememberMeDays: 30,
        
        // Maintenance
        globalMaintenance: false,
        maintenanceMessage: "SHADOW STELLAR sedang dalam pemeliharaan sistem.",
        maintenanceCountdown: null,
        
        // Browser
        defaultSandbox: "allow-scripts allow-forms allow-popups",
        blockMixedContent: true,
        disableWebGL: true,
        
        // UI
        darkMode: true,
        showDescriptions: true,
        kioskMode: false,
        
        // Statistics
        totalClicks: 0,
        lastReset: new Date().toISOString()
    };

    // Maintenance access log structure
    const DEFAULT_ACCESS_LOG = [];

    // Statistics data structure
    const DEFAULT_STATS = {
        dailyClicks: {},
        websiteStats: {},
        adminActivity: {}
    };

    // Supabase Configuration (GANTI DENGAN KONFIGURASI ANDA)
    const SUPABASE_CONFIG = {
        url: "https://mivweeseoqutfcfcxepf.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdndlZXNlb3F1dGZjZmN4ZXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMTE3NjYsImV4cCI6MjA4MzY4Nzc2Nn0.JsjFC9-Ry-jb427TWLn4xGTRaFN6TEG8GTn1eEZjwUE"
    };

    // Export configuration
    return {
        DEFAULT_WEBSITES,
        DEFAULT_ADMINS,
        DEFAULT_SETTINGS,
        DEFAULT_ACCESS_LOG,
        DEFAULT_STATS,
        SUPABASE_CONFIG
    };
})();