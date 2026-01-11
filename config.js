
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
        
        // Announcement
        announcement: {
            enabled: false,
            message: "",
            type: "info" // info, warning, error, success
        },
        
        // Theme Settings
        theme: {
            darkMode: true,
            showDescriptions: true,
            kioskMode: false
        },
        
        // Security Settings
        security: {
            developerCode: "SHADOW123", // Default developer code
            codeLength: 8,
            maxLoginAttempts: 3,
            lockoutTime: 10, // minutes
            
            // Browser Security
            defaultSandbox: "allow-scripts allow-forms allow-popups",
            blockMixedContent: true,
            disableWebGL: true
        },
        
        // Session Settings
        session: {
            timeout: 30, // minutes
            idleTimeout: 15 // minutes
        },
        
        // Feature Flags
        features: {
            maintenanceMode: true,
            developerAccess: true,
            kioskMode: true,
            browserSecurity: true,
            statistics: true,
            exportImport: true
        },
        
        // Statistics (Initial)
        statistics: {
            totalClicks: 0,
            totalWebsites: 4,
            activeAdmins: 0
        }
    };

    // Website Database
    const WEBSITES = [
        {
            id: "portal-utama",
            name: "Portal Utama",
            url: "https://www.google.com",
            icon: "fas fa-home",
            description: "Akses portal utama SHADOW STELLAR",
            category: "portal",
            tags: ["main", "portal"],
            permissions: ["allow-scripts", "allow-forms"],
            clickCount: 0,
            isActive: true,
            maintenance: false,
            maintenanceMessage: "",
            createdAt: "2024-01-01"
        },
        {
            id: "dashboard",
            name: "Dashboard",
            url: "https://www.youtube.com",
            icon: "fas fa-tachometer-alt",
            description: "Panel kontrol dashboard sistem",
            category: "tools",
            tags: ["tools", "dashboard"],
            permissions: ["allow-scripts", "allow-forms", "allow-popups"],
            clickCount: 0,
            isActive: true,
            maintenance: false,
            maintenanceMessage: "",
            createdAt: "2024-01-01"
        },
        {
            id: "data-center",
            name: "Data Center",
            url: "https://github.com",
            icon: "fas fa-database",
            description: "Pusat data dan informasi sistem",
            category: "internal",
            tags: ["internal", "data"],
            permissions: ["allow-scripts"],
            clickCount: 0,
            isActive: true,
            maintenance: false,
            maintenanceMessage: "",
            createdAt: "2024-01-01"
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
            clickCount: 0,
            isActive: true,
            maintenance: false,
            maintenanceMessage: "",
            createdAt: "2024-01-01"
        }
    ];

    // Admin Accounts (Read-only for display)
    const ADMIN_ACCOUNTS = [
        {
            username: "admin",
            role: "superadmin",
            createdAt: "2024-01-01",
            lastLogin: null
        },
        {
            username: "supervisor",
            role: "admin",
            createdAt: "2024-01-01",
            lastLogin: null
        }
    ];

    // Export configuration
    return {
        GLOBAL_CONFIG,
        WEBSITES,
        ADMIN_ACCOUNTS
    };
})();
[file content end]