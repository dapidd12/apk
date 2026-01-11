// SHADOW STELLAR - Configuration File
// Semua konfigurasi awal disimpan di sini

const SHADOW_STELLAR_CONFIG = (function() {
    // Global System Configuration
    const GLOBAL_CONFIG = {
        // System Info
        name: "SHADOW STELLAR",
        tagline: "Silent. Secure. Stellar.",
        version: "3.0",
        lastUpdated: "2024-01-01",
        
        // Maintenance Settings
        maintenance: false,
        maintenanceMessage: "SHADOW STELLAR sedang dalam pemeliharaan sistem.",
        maintenanceCountdown: null,
        
        // Theme Settings
        theme: {
            darkMode: true,
            showDescriptions: true,
            kioskMode: false
        },
        
        // Security Settings
        security: {
            developerCode: "SHADOW123",
            codeLength: 8,
            maxLoginAttempts: 3,
            lockoutTime: 10,
            
            // Browser Security
            defaultSandbox: "allow-scripts allow-forms allow-popups",
            blockMixedContent: true,
            disableWebGL: true
        },
        
        // Feature Flags
        features: {
            maintenanceMode: true,
            kioskMode: true,
            browserSecurity: true
        }
    };

    // Website Database
    const WEBSITES = [
        {
            id: "apk-bug",
            name: "APK BUG",
            url: "http://privserv.my.id:2018",
            icon: "fas fa-home",
            description: "Akses APK SHADOW STELLAR",
            category: "portal",
            tags: ["main", "portal"],
            permissions: ["allow-scripts", "allow-forms"],
            maintenance: false,
            maintenanceMessage: ""
        },
        {
            id: "dashboard",
            name: "Dashboard Panel",
            url: "http://159.65.1.185",
            icon: "fas fa-tachometer-alt",
            description: "Panel kontrol dashboard ",
            category: "tools",
            tags: ["tools", "dashboard"],
            permissions: ["allow-scripts", "allow-forms", "allow-popups"],
            maintenance: false,
            maintenanceMessage: ""
        },
        {
            id: "data-center",
            name: "Data Center",
            url: "https://dapid.my.id",
            icon: "fas fa-database",
            description: "Pusat data dan informasi sistem",
            category: "internal",
            tags: ["internal", "data"],
            permissions: ["allow-scripts"],
            maintenance: false,
            maintenanceMessage: ""
        },
        {
            id: "media-center",
            name: "Media Center",
            url: "https://vimeo.com",
            icon: "fas fa-photo-video",
            description: "Pusat media dan streaming",
            category: "media",
            tags: ["media", "streaming"],
            permissions: ["allow-scripts", "allow-popups"],
            maintenance: false,
            maintenanceMessage: ""
        }
    ];

    // Export configuration
    return {
        GLOBAL_CONFIG,
        WEBSITES
    };
})();