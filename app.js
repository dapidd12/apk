// SHADOW STELLAR - Main Application Module
// Menggunakan IIFE untuk enkapsulasi

const SHADOW_STELLAR = (function() {
    // Supabase Client
    let supabase = null;
    
    // Initialize Supabase
    function initSupabase() {
        try {
            supabase = window.supabase.createClient(
                SHADOW_STELLAR_CONFIG.SUPABASE_CONFIG.url,
                SHADOW_STELLAR_CONFIG.SUPABASE_CONFIG.anonKey
            );
            console.log('✅ Supabase client initialized');
            return true;
        } catch (error) {
            console.error('❌ Supabase initialization failed:', error);
            showStatus('Koneksi database gagal', 'error');
            return false;
        }
    }

    // Private Variables
    let websitesDB = [];
    let adminAccounts = [];
    let systemSettings = {};
    let accessLog = [];
    let statistics = {};
    let currentSession = null;
    let currentWebsite = null;
    
    // Security State
    let loginAttempts = 0;
    let sessionTimer = null;
    let idleTimer = null;
    let kioskMode = false;
    
    // Migration State
    let migrationCompleted = false;
    
    // DOM Elements Cache
    const elements = {};
    
    // Initialize Application
    async function init() {
        console.log('🚀 SHADOW STELLAR v3.0 - Supabase Edition - Initializing...');
        
        // Cache DOM elements
        cacheElements();
        
        // Initialize Supabase
        if (!initSupabase()) {
            showStatus('SHADOW STELLAR offline mode', 'warning');
            loadDataFromLocalStorage();
        } else {
            // Load data from Supabase
            await loadDataFromSupabase();
        }
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup keyboard shortcuts
        setupKeyboardShortcuts();
        
        // Setup Page Visibility API
        setupPageVisibility();
        
        // Initialize AOS
        if (window.AOS) {
            AOS.init({
                duration: 1000,
                once: true,
                offset: 100
            });
        }
        
        // Render UI
        renderUI();
        
        // Check maintenance mode
        checkMaintenanceMode();
        
        // Check existing session
        checkExistingSession();
        
        // Update statistics display
        updateStatistics();
        
        console.log('✅ SHADOW STELLAR initialized successfully');
        showStatus('SHADOW STELLAR siap digunakan', 'success');
    }
    
    // Cache DOM Elements
    function cacheElements() {
        const ids = [
            'status-message', 'loading-overlay', 'session-badge',
            'session-username', 'logout-btn', 'settings-btn',
            'settings-menu', 'toggle-descriptions', 'toggle-mode',
            'export-config', 'import-config', 'kiosk-mode',
            'horizontal-buttons', 'total-websites', 'total-clicks',
            'active-admins', 'admin-btn', 'browser-container',
            'browser-frame', 'browser-back', 'browser-forward',
            'browser-reload', 'browser-home', 'browser-security',
            'browser-title', 'close-browser', 'frame-blocked',
            'open-external', 'browser-info', 'close-info',
            'info-name', 'info-category', 'info-permissions',
            'info-clicks', 'info-status', 'maintenance-mode',
            'maintenance-message', 'countdown-timer', 'timer-display',
            'access-code-form', 'access-code', 'submit-code',
            'attempts-info', 'access-log', 'log-entries',
            'show-access-form', 'login-modal', 'login-form',
            'login-username', 'login-password', 'remember-me',
            'login-submit', 'login-delay-info', 'admin-modal',
            'close-admin', 'current-admin', 'tab-content-container',
            'developer-modal', 'current-dev-code', 'copy-dev-code',
            'close-developer-modal', 'import-modal', 'import-json',
            'import-file', 'browse-file', 'file-info',
            'confirm-import', 'cancel-import', 'security-modal',
            'allow-scripts', 'allow-forms', 'allow-popups',
            'allow-same-origin', 'block-mixed-content', 'disable-webgl',
            'apply-security', 'reset-security'
        ];
        
        ids.forEach(id => {
            elements[id] = document.getElementById(id);
        });
        
        // Tab buttons
        if (document.querySelectorAll('.tab-btn')) {
            elements.tabButtons = document.querySelectorAll('.tab-btn');
        }
    }
    
    // Load Data from Supabase
    async function loadDataFromSupabase() {
        showLoading('Menyinkronkan dengan database...');
        
        try {
            // Check if we need to run migration
            await checkAndRunMigration();
            
            // Load websites
            const { data: websitesData, error: websitesError } = await supabase
                .from('websites')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (websitesError) throw websitesError;
            
            if (websitesData && websitesData.length > 0) {
                websitesDB = websitesData.map(w => ({
                    id: w.id,
                    name: w.name,
                    url: w.url,
                    icon: w.icon,
                    description: w.description,
                    category: w.category,
                    permissions: w.permissions || [],
                    clickCount: w.click_count || 0,
                    maintenance: w.maintenance || false,
                    maintenanceMessage: w.maintenance_message || ''
                }));
                console.log(`✅ Loaded ${websitesDB.length} websites from Supabase`);
            }
            
            // Load admin accounts
            const { data: adminsData, error: adminsError } = await supabase
                .from('admins')
                .select('*');
            
            if (adminsError) throw adminsError;
            
            if (adminsData && adminsData.length > 0) {
                adminAccounts = adminsData.map(a => ({
                    id: a.id,
                    username: a.username,
                    passwordHash: a.password_hash,
                    role: a.role,
                    createdAt: a.created_at,
                    lastLogin: a.last_login
                }));
                console.log(`✅ Loaded ${adminAccounts.length} admin accounts from Supabase`);
            }
            
            // Load system settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('system_settings')
                .select('*');
            
            if (settingsError) throw settingsError;
            
            systemSettings = { ...SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS };
            
            if (settingsData && settingsData.length > 0) {
                settingsData.forEach(setting => {
                    if (setting.key && setting.value) {
                        systemSettings[setting.key] = setting.value;
                    }
                });
                
                // Generate developer code if not exists
                if (!systemSettings.developerCode) {
                    systemSettings.developerCode = generateRandomCode(systemSettings.codeLength);
                    await saveSystemSetting('developerCode', systemSettings.developerCode);
                }
            } else {
                // Initialize default settings in Supabase
                await initializeDefaultSettings();
            }
            
            // Load access logs (last 50)
            const { data: logsData, error: logsError } = await supabase
                .from('access_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(50);
            
            if (!logsError && logsData) {
                accessLog = logsData.map(log => ({
                    timestamp: log.timestamp,
                    code: log.code_masked,
                    success: log.success
                }));
            }
            
            // Load statistics
            statistics = await loadStatistics();
            
            hideLoading();
            console.log('✅ All data loaded from Supabase');
            
        } catch (error) {
            console.error('❌ Error loading data from Supabase:', error);
            hideLoading();
            
            // Fallback to localStorage
            showStatus('Database offline, menggunakan mode lokal', 'warning');
            loadDataFromLocalStorage();
        }
    }
    
    // Load Statistics from Supabase
    async function loadStatistics() {
        const stats = {
            totalClicks: 0,
            dailyClicks: {},
            websiteStats: {},
            adminActivity: {}
        };
        
        try {
            // Get total clicks from websites
            const { data: websitesData, error: websitesError } = await supabase
                .from('websites')
                .select('id, click_count');
            
            if (!websitesError && websitesData) {
                stats.totalClicks = websitesData.reduce((sum, w) => sum + (w.click_count || 0), 0);
                
                // Populate website stats
                websitesData.forEach(w => {
                    stats.websiteStats[w.id] = {
                        clicks: w.click_count || 0
                    };
                });
            }
            
            // Load statistics table data
            const { data: statsData, error: statsError } = await supabase
                .from('statistics')
                .select('*');
            
            if (!statsError && statsData) {
                statsData.forEach(stat => {
                    if (stat.website_id) {
                        stats.websiteStats[stat.website_id] = stats.websiteStats[stat.website_id] || {};
                        stats.websiteStats[stat.website_id].lastAccess = stat.last_access;
                        stats.websiteStats[stat.website_id].clicks = stats.websiteStats[stat.website_id].clicks || 0;
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ Error loading statistics:', error);
        }
        
        return stats;
    }
    
    // Initialize Default Settings in Supabase
    async function initializeDefaultSettings() {
        try {
            const settingsToSave = [
                { key: 'systemName', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.systemName },
                { key: 'tagline', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.tagline },
                { key: 'developerCode', value: generateRandomCode(SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.codeLength) },
                { key: 'codeLength', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.codeLength },
                { key: 'maxLoginAttempts', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.maxLoginAttempts },
                { key: 'lockoutTime', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.lockoutTime },
                { key: 'sessionTimeout', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.sessionTimeout },
                { key: 'idleTimeout', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.idleTimeout },
                { key: 'rememberMeDays', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.rememberMeDays },
                { key: 'globalMaintenance', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.globalMaintenance },
                { key: 'maintenanceMessage', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.maintenanceMessage },
                { key: 'defaultSandbox', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.defaultSandbox },
                { key: 'blockMixedContent', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.blockMixedContent },
                { key: 'disableWebGL', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.disableWebGL },
                { key: 'darkMode', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.darkMode },
                { key: 'showDescriptions', value: SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.showDescriptions }
            ];
            
            for (const setting of settingsToSave) {
                await saveSystemSetting(setting.key, setting.value);
            }
            
            // Update local systemSettings
            systemSettings = { ...SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS };
            systemSettings.developerCode = settingsToSave.find(s => s.key === 'developerCode').value;
            
        } catch (error) {
            console.error('❌ Error initializing default settings:', error);
        }
    }
    
    // Save System Setting to Supabase
    async function saveSystemSetting(key, value) {
        if (!supabase) return false;
        
        try {
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key: key,
                    value: value,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'key'
                });
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`❌ Error saving system setting ${key}:`, error);
            return false;
        }
    }
    
    // Check and Run Migration
    async function checkAndRunMigration() {
        try {
            // Check if migration is needed by checking if websites table is empty
            const { data: websitesData, error: websitesError } = await supabase
                .from('websites')
                .select('id')
                .limit(1);
            
            if (websitesError) throw websitesError;
            
            // If no websites in database, run migration
            if (!websitesData || websitesData.length === 0) {
                console.log('🚀 Running database migration...');
                await runMigration();
                migrationCompleted = true;
            }
        } catch (error) {
            console.error('❌ Error checking migration status:', error);
        }
    }
    
    // Run Database Migration
    async function runMigration() {
        showLoading('Migrasi data ke database...');
        
        try {
            // Migrate websites
            for (const website of SHADOW_STELLAR_CONFIG.DEFAULT_WEBSITES) {
                const { error } = await supabase
                    .from('websites')
                    .insert({
                        name: website.name,
                        url: website.url,
                        icon: website.icon,
                        description: website.description,
                        category: website.category,
                        permissions: website.permissions,
                        click_count: website.clickCount,
                        maintenance: website.maintenance,
                        maintenance_message: website.maintenanceMessage,
                        created_at: new Date().toISOString()
                    });
                
                if (error) throw error;
            }
            
            // Migrate admin accounts with hashed passwords
            for (const admin of SHADOW_STELLAR_CONFIG.DEFAULT_ADMINS) {
                const defaultPassword = admin.username === 'admin' ? 'admin123' : 'super123';
                const passwordHash = await hashPassword(defaultPassword);
                
                const { error } = await supabase
                    .from('admins')
                    .insert({
                        username: admin.username,
                        password_hash: passwordHash,
                        role: admin.role,
                        created_at: new Date().toISOString()
                    });
                
                if (error) throw error;
            }
            
            // Initialize system settings
            await initializeDefaultSettings();
            
            console.log('✅ Database migration completed');
            hideLoading();
            
        } catch (error) {
            console.error('❌ Migration failed:', error);
            hideLoading();
            showStatus('Migrasi database gagal', 'error');
        }
    }
    
    // Load Data from localStorage (Fallback)
    function loadDataFromLocalStorage() {
        try {
            // Load websites
            const savedWebsites = localStorage.getItem('shadow_stellar_websites');
            websitesDB = savedWebsites ? JSON.parse(savedWebsites) : [...SHADOW_STELLAR_CONFIG.DEFAULT_WEBSITES];
            
            // Load admin accounts
            const savedAdmins = localStorage.getItem('shadow_stellar_admins');
            adminAccounts = savedAdmins ? JSON.parse(savedAdmins) : [...SHADOW_STELLAR_CONFIG.DEFAULT_ADMINS];
            
            // Load system settings
            const savedSettings = localStorage.getItem('shadow_stellar_settings');
            systemSettings = savedSettings ? JSON.parse(savedSettings) : {...SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS};
            
            // Generate developer code if not exists
            if (!systemSettings.developerCode) {
                systemSettings.developerCode = generateRandomCode(systemSettings.codeLength);
                localStorage.setItem('shadow_stellar_settings', JSON.stringify(systemSettings));
            }
            
            // Initialize admin passwords (first run only)
            initAdminPasswords();
            
        } catch (error) {
            console.error('❌ Error loading data from localStorage:', error);
            resetToDefaults();
        }
    }
    
    // Initialize Admin Passwords (localStorage fallback)
    async function initAdminPasswords() {
        const needsInit = adminAccounts.some(admin => !admin.passwordHash);
        
        if (needsInit) {
            console.log('🔐 Initializing admin passwords...');
            
            for (let admin of adminAccounts) {
                if (!admin.passwordHash) {
                    const defaultPassword = admin.username === 'admin' ? 'admin123' : 'super123';
                    admin.passwordHash = await hashPassword(defaultPassword);
                }
            }
            
            localStorage.setItem('shadow_stellar_admins', JSON.stringify(adminAccounts));
            console.log('✅ Admin passwords initialized');
        }
    }
    
    // Save Data to Supabase
    async function saveWebsite(website) {
        if (!supabase) {
            // Fallback to localStorage
            const index = websitesDB.findIndex(w => w.id === website.id);
            if (index !== -1) {
                websitesDB[index] = website;
                localStorage.setItem('shadow_stellar_websites', JSON.stringify(websitesDB));
            }
            return false;
        }
        
        try {
            const websiteData = {
                name: website.name,
                url: website.url,
                icon: website.icon,
                description: website.description,
                category: website.category,
                permissions: website.permissions,
                click_count: website.clickCount,
                maintenance: website.maintenance,
                maintenance_message: website.maintenanceMessage,
                updated_at: new Date().toISOString()
            };
            
            if (website.id && typeof website.id === 'string' && website.id.includes('-')) {
                // UUID - update existing
                const { error } = await supabase
                    .from('websites')
                    .update(websiteData)
                    .eq('id', website.id);
                
                if (error) throw error;
            } else {
                // New website - insert
                websiteData.created_at = new Date().toISOString();
                const { data, error } = await supabase
                    .from('websites')
                    .insert([websiteData])
                    .select();
                
                if (error) throw error;
                
                if (data && data[0]) {
                    website.id = data[0].id;
                }
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error saving website:', error);
            return false;
        }
    }
    
    // Update Website Click Count in Supabase
    async function updateWebsiteClick(websiteId) {
        if (!supabase) return false;
        
        try {
            // Update website click_count
            const { data: websiteData, error: websiteError } = await supabase
                .from('websites')
                .select('click_count')
                .eq('id', websiteId)
                .single();
            
            if (websiteError) throw websiteError;
            
            const newClickCount = (websiteData.click_count || 0) + 1;
            
            const { error: updateError } = await supabase
                .from('websites')
                .update({ 
                    click_count: newClickCount,
                    updated_at: new Date().toISOString()
                })
                .eq('id', websiteId);
            
            if (updateError) throw updateError;
            
            // Update statistics table
            const { error: statsError } = await supabase
                .from('statistics')
                .upsert({
                    website_id: websiteId,
                    clicks: newClickCount,
                    last_access: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'website_id'
                });
            
            if (statsError) throw statsError;
            
            return true;
        } catch (error) {
            console.error('❌ Error updating website click:', error);
            return false;
        }
    }
    
    // Log Developer Access to Supabase
    async function logDeveloperAccess(code, success) {
        if (!supabase) return false;
        
        try {
            const { error } = await supabase
                .from('access_logs')
                .insert({
                    code_masked: '••••••',
                    success: success,
                    timestamp: new Date().toISOString()
                });
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('❌ Error logging access:', error);
            return false;
        }
    }
    
    // Delete Website from Supabase
    async function deleteWebsiteFromSupabase(websiteId) {
        if (!supabase) return false;
        
        try {
            // Delete related statistics first
            await supabase
                .from('statistics')
                .delete()
                .eq('website_id', websiteId);
            
            // Delete website
            const { error } = await supabase
                .from('websites')
                .delete()
                .eq('id', websiteId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('❌ Error deleting website:', error);
            return false;
        }
    }
    
    // Add Admin Account to Supabase
    async function addAdminToSupabase(admin) {
        if (!supabase) return false;
        
        try {
            const { data, error } = await supabase
                .from('admins')
                .insert({
                    username: admin.username,
                    password_hash: admin.passwordHash,
                    role: admin.role,
                    created_at: new Date().toISOString()
                })
                .select();
            
            if (error) throw error;
            return data && data[0] ? data[0] : null;
        } catch (error) {
            console.error('❌ Error adding admin:', error);
            return null;
        }
    }
    
    // Delete Admin Account from Supabase
    async function deleteAdminFromSupabase(username) {
        if (!supabase) return false;
        
        try {
            const { error } = await supabase
                .from('admins')
                .delete()
                .eq('username', username);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('❌ Error deleting admin:', error);
            return false;
        }
    }
    
    // Update Admin Password in Supabase
    async function updateAdminPassword(username, newPasswordHash) {
        if (!supabase) return false;
        
        try {
            const { error } = await supabase
                .from('admins')
                .update({
                    password_hash: newPasswordHash,
                    updated_at: new Date().toISOString()
                })
                .eq('username', username);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('❌ Error updating admin password:', error);
            return false;
        }
    }
    
    // Update Admin Last Login
    async function updateAdminLastLogin(username) {
        if (!supabase) return false;
        
        try {
            const { error } = await supabase
                .from('admins')
                .update({
                    last_login: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('username', username);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('❌ Error updating admin last login:', error);
            return false;
        }
    }
    
    // Reset to Defaults
    function resetToDefaults() {
        if (confirm('Reset semua data ke pengaturan default?')) {
            if (supabase) {
                showStatus('Reset tidak tersedia di mode online', 'error');
                return;
            }
            localStorage.clear();
            location.reload();
        }
    }
    
    // Hash Password using Web Crypto API
    async function hashPassword(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('❌ Password hashing error:', error);
            return '';
        }
    }
    
    // Verify Password
    async function verifyPassword(password, hash) {
        const newHash = await hashPassword(password);
        return newHash === hash;
    }
    
    // Generate Random Code
    function generateRandomCode(length) {
        const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }
    
    // Validate URL
    function isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }
    
    // Obfuscate URL for display
    function obfuscateURL(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname;
            const path = urlObj.pathname;
            return `https://${'•'.repeat(Math.min(hostname.length, 12))}${path.length > 15 ? '/...' : path}`;
        } catch {
            return 'https://' + '•'.repeat(10) + '/***';
        }
    }
    
    // Show Status Message
    function showStatus(message, type = 'info') {
        const status = elements['status-message'];
        if (!status) return;
        
        const colors = {
            'success': 'linear-gradient(45deg, #008800, #00cc00)',
            'error': 'linear-gradient(45deg, #ff0000, #cc0000)',
            'warning': 'linear-gradient(45deg, #ff9900, #ff6600)',
            'info': 'linear-gradient(45deg, #800080, #cc00cc)'
        };
        
        status.style.background = colors[type] || colors.info;
        status.textContent = `SHADOW STELLAR: ${message}`;
        status.style.display = 'block';
        
        // Auto hide
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
    
    // Show Loading Overlay
    function showLoading(message = 'Memuat...') {
        if (elements['loading-overlay']) {
            const p = elements['loading-overlay'].querySelector('p');
            if (p) p.textContent = message;
            elements['loading-overlay'].style.display = 'flex';
        }
    }
    
    // Hide Loading Overlay
    function hideLoading() {
        if (elements['loading-overlay']) {
            elements['loading-overlay'].style.display = 'none';
        }
    }
    
    // Render UI
    function renderUI() {
        // Update page title
        document.title = `${systemSettings.systemName} | ${systemSettings.tagline}`;
        
        // Update dark mode from localStorage or systemSettings
        const savedDarkMode = localStorage.getItem('shadow_stellar_darkmode');
        const useDarkMode = savedDarkMode !== null ? savedDarkMode === 'true' : systemSettings.darkMode;
        
        if (useDarkMode) {
            document.body.classList.add('darker-mode');
        } else {
            document.body.classList.remove('darker-mode');
        }
        
        // Save dark mode preference to localStorage
        localStorage.setItem('shadow_stellar_darkmode', useDarkMode.toString());
        
        // Update show descriptions from localStorage or systemSettings
        const savedShowDescriptions = localStorage.getItem('shadow_stellar_descriptions');
        const showDescriptions = savedShowDescriptions !== null ? savedShowDescriptions === 'true' : systemSettings.showDescriptions;
        
        // Update toggle switches in settings menu
        updateSettingsMenuToggles();
        
        // Render website buttons
        renderWebsiteButtons();
        
        // Update statistics
        updateStatistics();
    }
    
    // Update Settings Menu Toggles
    function updateSettingsMenuToggles() {
        const showDescriptions = localStorage.getItem('shadow_stellar_descriptions') === 'true' || 
                                systemSettings.showDescriptions;
        
        const darkMode = localStorage.getItem('shadow_stellar_darkmode') === 'true' || 
                        systemSettings.darkMode;
        
        // Update toggle switches
        const descToggle = document.querySelector('#toggle-descriptions .toggle-switch');
        const modeToggle = document.querySelector('#toggle-mode .toggle-switch');
        const kioskToggle = document.querySelector('#kiosk-mode .toggle-switch');
        
        if (descToggle) {
            descToggle.classList.toggle('active', showDescriptions);
        }
        
        if (modeToggle) {
            modeToggle.classList.toggle('active', darkMode);
        }
        
        if (kioskToggle) {
            kioskToggle.classList.toggle('active', kioskMode);
        }
        
        // Update mode button icon
        const modeIcon = document.querySelector('#toggle-mode i');
        if (modeIcon) {
            modeIcon.className = darkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        // Update kiosk button icon
        const kioskIcon = document.querySelector('#kiosk-mode i');
        if (kioskIcon) {
            kioskIcon.className = kioskMode ? 'fas fa-lock' : 'fas fa-tv';
        }
    }
    
    // Render Website Buttons
    function renderWebsiteButtons() {
        const container = elements['horizontal-buttons'];
        if (!container) return;
        
        container.innerHTML = '';
        
        websitesDB.forEach((website, index) => {
            const button = document.createElement('button');
            button.className = `website-button lazy-load ${website.maintenance ? 'maintenance' : ''}`;
            if (window.AOS) {
                button.setAttribute('data-aos', 'fade-up');
                button.setAttribute('data-aos-delay', index * 100);
            }
            button.setAttribute('data-id', website.id);
            
            const showDescriptions = localStorage.getItem('shadow_stellar_descriptions') === 'true' || 
                                    systemSettings.showDescriptions;
            const descriptionClass = showDescriptions ? 'show' : '';
            
            button.innerHTML = `
                <i class="${website.icon}"></i>
                <div class="button-content">
                    <div class="button-title">${website.name} ${website.maintenance ? '(Maintenance)' : ''}</div>
                    <div class="button-desc ${descriptionClass}">${website.description}</div>
                </div>
            `;
            
            button.onclick = () => openWebsite(website);
            container.appendChild(button);
        });
        
        // Animate lazy load
        setTimeout(() => {
            document.querySelectorAll('.lazy-load').forEach((btn, index) => {
                setTimeout(() => btn.classList.add('loaded'), index * 100);
            });
        }, 100);
    }
    
    // Toggle Settings Menu
    function toggleSettingsMenu() {
        const menu = elements['settings-menu'];
        if (menu) {
            menu.classList.toggle('active');
            
            // Close menu when clicking outside
            if (menu.classList.contains('active')) {
                setTimeout(() => {
                    document.addEventListener('click', closeSettingsMenuOnOutsideClick);
                }, 10);
            } else {
                document.removeEventListener('click', closeSettingsMenuOnOutsideClick);
            }
        }
    }
    
    function closeSettingsMenuOnOutsideClick(e) {
        const menu = elements['settings-menu'];
        const settingsBtn = elements['settings-btn'];
        
        if (menu && !menu.contains(e.target) && !settingsBtn.contains(e.target)) {
            menu.classList.remove('active');
            document.removeEventListener('click', closeSettingsMenuOnOutsideClick);
        }
    }
    
    // Toggle Descriptions
    function toggleDescriptions() {
        const current = localStorage.getItem('shadow_stellar_descriptions') === 'true' || 
                       systemSettings.showDescriptions;
        const newValue = !current;
        
        localStorage.setItem('shadow_stellar_descriptions', newValue.toString());
        
        // Update toggle switch
        const descToggle = document.querySelector('#toggle-descriptions .toggle-switch');
        if (descToggle) {
            descToggle.classList.toggle('active', newValue);
        }
        
        // Update website buttons
        document.querySelectorAll('.button-desc').forEach(desc => {
            desc.classList.toggle('show', newValue);
        });
        
        showStatus(`Deskripsi ${newValue ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
    }
    
    // Toggle Dark Mode
    function toggleDarkMode() {
        const current = localStorage.getItem('shadow_stellar_darkmode') === 'true' || 
                       systemSettings.darkMode;
        const newValue = !current;
        
        localStorage.setItem('shadow_stellar_darkmode', newValue.toString());
        document.body.classList.toggle('darker-mode', newValue);
        
        // Update toggle switch and icon
        const modeToggle = document.querySelector('#toggle-mode .toggle-switch');
        const modeIcon = document.querySelector('#toggle-mode i');
        
        if (modeToggle) {
            modeToggle.classList.toggle('active', newValue);
        }
        
        if (modeIcon) {
            modeIcon.className = newValue ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        showStatus(`Mode ${newValue ? 'darker' : 'dark'} diaktifkan`, 'info');
    }
    
    // Toggle Kiosk Mode
    function toggleKioskMode() {
        kioskMode = !kioskMode;
        
        if (kioskMode) {
            // Hide admin button
            if (elements['admin-btn']) {
                elements['admin-btn'].style.display = 'none';
            }
            
            // Disable right-click
            document.addEventListener('contextmenu', preventContextMenu);
            
            // Lock keyboard shortcuts
            document.addEventListener('keydown', preventKioskKeys);
            
            // Auto-logout if logged in
            if (currentSession) {
                logout();
            }
            
            showStatus('Mode Kiosk diaktifkan - Admin dinonaktifkan', 'warning');
        } else {
            // Restore UI
            if (elements['admin-btn']) {
                elements['admin-btn'].style.display = 'flex';
            }
            
            // Remove event listeners
            document.removeEventListener('contextmenu', preventContextMenu);
            document.removeEventListener('keydown', preventKioskKeys);
            
            showStatus('Mode Kiosk dinonaktifkan', 'info');
        }
        
        // Update toggle switch and icon
        const kioskToggle = document.querySelector('#kiosk-mode .toggle-switch');
        const kioskIcon = document.querySelector('#kiosk-mode i');
        
        if (kioskToggle) {
            kioskToggle.classList.toggle('active', kioskMode);
        }
        
        if (kioskIcon) {
            kioskIcon.className = kioskMode ? 'fas fa-lock' : 'fas fa-tv';
        }
    }
    
    function preventContextMenu(e) {
        e.preventDefault();
    }
    
    function preventKioskKeys(e) {
        // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            showStatus('Fitur developer dinonaktifkan di mode kiosk', 'warning');
        }
    }
    
    // Open Website
    async function openWebsite(website) {
        // Check global maintenance
        if (systemSettings.globalMaintenance) {
            showMaintenanceScreen();
            return;
        }
        
        // Check website-specific maintenance
        if (website.maintenance) {
            showStatus(`${website.name} sedang dalam maintenance`, 'error');
            return;
        }
        
        // Update click statistics in Supabase
        if (supabase) {
            await updateWebsiteClick(website.id);
        } else {
            // Fallback to local update
            website.clickCount++;
            statistics.totalClicks++;
            const index = websitesDB.findIndex(w => w.id === website.id);
            if (index !== -1) {
                websitesDB[index].clickCount = website.clickCount;
                localStorage.setItem('shadow_stellar_websites', JSON.stringify(websitesDB));
            }
        }
        
        // Update local statistics
        statistics.totalClicks++;
        
        // Update daily statistics in localStorage only
        const today = new Date().toDateString();
        statistics.dailyClicks[today] = (statistics.dailyClicks[today] || 0) + 1;
        localStorage.setItem('shadow_stellar_statistics', JSON.stringify(statistics));
        
        // Update UI statistics
        updateStatistics();
        
        // Set current website
        currentWebsite = website;
        
        // Open in browser
        openBrowser(website);
    }
    
    // Open Browser
    function openBrowser(website) {
        showLoading(`Membuka ${website.name}...`);
        
        const browser = elements['browser-container'];
        const iframe = elements['browser-frame'];
        const title = elements['browser-title'];
        
        // Update browser title
        if (title) {
            title.innerHTML = `<span class="url-display">${systemSettings.systemName} - ${website.name}</span>`;
        }
        
        // Build sandbox attributes
        let sandbox = systemSettings.defaultSandbox;
        if (website.permissions.includes('allow-same-origin')) {
            sandbox += ' allow-same-origin';
        }
        iframe.sandbox.value = sandbox;
        
        // Update browser info panel
        updateBrowserInfo(website);
        
        // Set iframe source
        iframe.src = website.url;
        
        // Show browser
        browser.style.display = 'flex';
        if (elements['browser-info']) {
            elements['browser-info'].style.display = 'flex';
        }
        if (elements['frame-blocked']) {
            elements['frame-blocked'].style.display = 'none';
        }
        
        // Reset session timer
        resetSessionTimer();
    }
    
    // Update Browser Info Panel
    function updateBrowserInfo(website) {
        if (elements['info-name']) {
            elements['info-name'].textContent = website.name;
        }
        if (elements['info-category']) {
            elements['info-category'].textContent = website.category;
        }
        if (elements['info-permissions']) {
            elements['info-permissions'].textContent = website.permissions.join(', ');
        }
        if (elements['info-clicks']) {
            elements['info-clicks'].textContent = website.clickCount;
        }
        
        const status = elements['info-status'];
        if (status) {
            status.className = 'status-indicator';
            status.classList.add(website.maintenance ? 'maintenance' : 'active');
        }
    }
    
    // Iframe Load Handler
    function onIframeLoad() {
        hideLoading();
        
        // Check for X-Frame-Options denial
        try {
            const iframe = elements['browser-frame'];
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            
            // If we can access the document, it's loaded successfully
            if (iframeDoc && iframeDoc.location) {
                console.log('✅ Iframe loaded successfully');
            }
        } catch (error) {
            // X-Frame-Options or other restriction
            console.log('❌ Iframe blocked by X-Frame-Options');
            if (elements['frame-blocked']) {
                elements['frame-blocked'].style.display = 'flex';
            }
        }
    }
    
    // Iframe Error Handler
    function onIframeError() {
        hideLoading();
        if (elements['frame-blocked']) {
            elements['frame-blocked'].style.display = 'flex';
        }
        showStatus('Gagal memuat halaman website', 'error');
    }
    
    // Browser Controls
    function browserBack() {
        try {
            const iframe = elements['browser-frame'];
            iframe.contentWindow.history.back();
        } catch (error) {
            showStatus('Tidak bisa kembali', 'error');
        }
    }
    
    function browserForward() {
        try {
            const iframe = elements['browser-frame'];
            iframe.contentWindow.history.forward();
        } catch (error) {
            showStatus('Tidak bisa maju', 'error');
        }
    }
    
    function browserReload() {
        const iframe = elements['browser-frame'];
        iframe.src = iframe.src;
        showLoading('Memuat ulang...');
    }
    
    function browserHome() {
        if (currentWebsite) {
            const iframe = elements['browser-frame'];
            iframe.src = currentWebsite.url;
            showLoading('Kembali ke beranda...');
        }
    }
    
    function closeBrowser() {
        if (elements['browser-container']) {
            elements['browser-container'].style.display = 'none';
        }
        if (elements['browser-frame']) {
            elements['browser-frame'].src = 'about:blank';
        }
        currentWebsite = null;
    }
    
    function openExternal() {
        if (currentWebsite) {
            window.open(currentWebsite.url, '_blank');
        }
    }
    
    // Open Security Settings
    function openSecuritySettings() {
        // Load current settings
        if (elements['allow-scripts']) {
            elements['allow-scripts'].checked = systemSettings.defaultSandbox.includes('allow-scripts');
        }
        if (elements['allow-forms']) {
            elements['allow-forms'].checked = systemSettings.defaultSandbox.includes('allow-forms');
        }
        if (elements['allow-popups']) {
            elements['allow-popups'].checked = systemSettings.defaultSandbox.includes('allow-popups');
        }
        if (elements['allow-same-origin']) {
            elements['allow-same-origin'].checked = systemSettings.defaultSandbox.includes('allow-same-origin');
        }
        if (elements['block-mixed-content']) {
            elements['block-mixed-content'].checked = systemSettings.blockMixedContent;
        }
        if (elements['disable-webgl']) {
            elements['disable-webgl'].checked = systemSettings.disableWebGL;
        }
        
        if (elements['security-modal']) {
            elements['security-modal'].style.display = 'flex';
        }
    }
    
    async function applySecuritySettings() {
        // Build sandbox string
        let sandbox = '';
        if (elements['allow-scripts'] && elements['allow-scripts'].checked) sandbox += 'allow-scripts ';
        if (elements['allow-forms'] && elements['allow-forms'].checked) sandbox += 'allow-forms ';
        if (elements['allow-popups'] && elements['allow-popups'].checked) sandbox += 'allow-popups ';
        if (elements['allow-same-origin'] && elements['allow-same-origin'].checked) sandbox += 'allow-same-origin ';
        
        systemSettings.defaultSandbox = sandbox.trim();
        
        if (elements['block-mixed-content']) {
            systemSettings.blockMixedContent = elements['block-mixed-content'].checked;
        }
        if (elements['disable-webgl']) {
            systemSettings.disableWebGL = elements['disable-webgl'].checked;
        }
        
        // Save to Supabase
        if (supabase) {
            await saveSystemSetting('defaultSandbox', systemSettings.defaultSandbox);
            await saveSystemSetting('blockMixedContent', systemSettings.blockMixedContent);
            await saveSystemSetting('disableWebGL', systemSettings.disableWebGL);
        } else {
            // Fallback to localStorage
            localStorage.setItem('shadow_stellar_settings', JSON.stringify(systemSettings));
        }
        
        closeSecurityModal();
        
        showStatus('Pengaturan keamanan diperbarui', 'success');
    }
    
    async function resetSecuritySettings() {
        systemSettings.defaultSandbox = SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.defaultSandbox;
        systemSettings.blockMixedContent = SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.blockMixedContent;
        systemSettings.disableWebGL = SHADOW_STELLAR_CONFIG.DEFAULT_SETTINGS.disableWebGL;
        
        // Save to Supabase
        if (supabase) {
            await saveSystemSetting('defaultSandbox', systemSettings.defaultSandbox);
            await saveSystemSetting('blockMixedContent', systemSettings.blockMixedContent);
            await saveSystemSetting('disableWebGL', systemSettings.disableWebGL);
        } else {
            // Fallback to localStorage
            localStorage.setItem('shadow_stellar_settings', JSON.stringify(systemSettings));
        }
        
        openSecuritySettings();
        
        showStatus('Pengaturan keamanan direset ke default', 'info');
    }
    
    function closeSecurityModal() {
        if (elements['security-modal']) {
            elements['security-modal'].style.display = 'none';
        }
    }
    
    // Maintenance Mode Functions
    function checkMaintenanceMode() {
        if (systemSettings.globalMaintenance) {
            showMaintenanceScreen();
        } else {
            hideMaintenanceScreen();
        }
    }
    
    function showMaintenanceScreen() {
        if (elements['maintenance-mode']) {
            elements['maintenance-mode'].style.display = 'flex';
        }
        if (elements['main-container']) {
            elements['main-container'].style.display = 'none';
        }
        if (elements['admin-btn']) {
            elements['admin-btn'].style.display = 'none';
        }
        
        // Update maintenance message
        if (elements['maintenance-message']) {
            elements['maintenance-message'].textContent = systemSettings.maintenanceMessage;
        }
        
        // Show countdown if set
        if (systemSettings.maintenanceCountdown) {
            const endTime = new Date(systemSettings.maintenanceCountdown).getTime();
            const now = Date.now();
            
            if (endTime > now && elements['countdown-timer'] && elements['timer-display']) {
                elements['countdown-timer'].style.display = 'block';
                startMaintenanceCountdown(endTime);
            }
        }
        
        // Update access log
        updateAccessLog();
    }
    
    function hideMaintenanceScreen() {
        if (elements['maintenance-mode']) {
            elements['maintenance-mode'].style.display = 'none';
        }
        if (elements['main-container']) {
            elements['main-container'].style.display = 'block';
        }
        if (elements['admin-btn']) {
            elements['admin-btn'].style.display = 'flex';
        }
    }
    
    function startMaintenanceCountdown(endTime) {
        function updateTimer() {
            const now = Date.now();
            const remaining = endTime - now;
            
            if (remaining <= 0) {
                if (elements['timer-display']) {
                    elements['timer-display'].textContent = '00:00:00';
                }
                return;
            }
            
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            
            if (elements['timer-display']) {
                elements['timer-display'].textContent = 
                    `${hours.toString().padStart(2, '0')}:` +
                    `${minutes.toString().padStart(2, '0')}:` +
                    `${seconds.toString().padStart(2, '0')}`;
            }
            
            setTimeout(updateTimer, 1000);
        }
        
        updateTimer();
    }
    
    function showAccessForm() {
        if (elements['access-code-form']) {
            elements['access-code-form'].style.display = 'block';
        }
        if (elements['access-code']) {
            elements['access-code'].focus();
        }
        updateAttemptsInfo();
    }
    
    function updateAttemptsInfo() {
        if (elements['attempts-info']) {
            const remaining = systemSettings.maxLoginAttempts - loginAttempts;
            elements['attempts-info'].textContent = 
                `Sisa percobaan: ${remaining} dari ${systemSettings.maxLoginAttempts}`;
            elements['attempts-info'].style.color = remaining <= 1 ? '#ff0000' : '#ff9900';
        }
    }
    
    async function submitAccessCode() {
        if (!elements['access-code']) return;
        
        const inputCode = elements['access-code'].value.trim().toUpperCase();
        
        if (!inputCode) {
            showStatus('Masukkan kode akses!', 'error');
            return;
        }
        
        // Log the attempt to Supabase
        if (supabase) {
            await logDeveloperAccess(inputCode, false);
        }
        
        if (inputCode === systemSettings.developerCode) {
            // Success
            if (supabase) {
                await logDeveloperAccess(inputCode, true);
            }
            
            // Disable maintenance
            systemSettings.globalMaintenance = false;
            systemSettings.maintenanceCountdown = null;
            loginAttempts = 0;
            
            // Save to Supabase
            if (supabase) {
                await saveSystemSetting('globalMaintenance', false);
                await saveSystemSetting('maintenanceCountdown', null);
            } else {
                localStorage.setItem('shadow_stellar_settings', JSON.stringify(systemSettings));
            }
            
            checkMaintenanceMode();
            hideAccessForm();
            
            showStatus('Akses developer berhasil! Maintenance dimatikan', 'success');
        } else {
            // Failed
            loginAttempts++;
            
            if (loginAttempts >= systemSettings.maxLoginAttempts) {
                // Lockout
                showStatus(`Terlalu banyak percobaan! Sistem terkunci ${systemSettings.lockoutTime} menit.`, 'error');
                if (elements['access-code']) {
                    elements['access-code'].disabled = true;
                }
                if (elements['submit-code']) {
                    elements['submit-code'].disabled = true;
                }
                
                setTimeout(() => {
                    if (elements['access-code']) {
                        elements['access-code'].disabled = false;
                    }
                    if (elements['submit-code']) {
                        elements['submit-code'].disabled = false;
                    }
                    loginAttempts = 0;
                    updateAttemptsInfo();
                    showStatus('Sistem dibuka kembali', 'info');
                }, systemSettings.lockoutTime * 60 * 1000);
            } else {
                const remaining = systemSettings.maxLoginAttempts - loginAttempts;
                showStatus(`Kode salah! Sisa percobaan: ${remaining}`, 'error');
            }
            
            if (elements['access-code']) {
                elements['access-code'].value = '';
                elements['access-code'].focus();
            }
            updateAttemptsInfo();
        }
    }
    
    function hideAccessForm() {
        if (elements['access-code-form']) {
            elements['access-code-form'].style.display = 'none';
        }
        if (elements['access-code']) {
            elements['access-code'].value = '';
        }
        loginAttempts = 0;
        updateAttemptsInfo();
    }
    
    async function updateAccessLog() {
        const container = elements['log-entries'];
        if (!container) return;
        
        container.innerHTML = '';
        
        try {
            // Load logs from Supabase
            let logs = [];
            if (supabase) {
                const { data, error } = await supabase
                    .from('access_logs')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(10);
                
                if (!error && data) {
                    logs = data.map(log => ({
                        timestamp: log.timestamp,
                        code: log.code_masked,
                        success: log.success
                    }));
                }
            } else {
                // Fallback to localStorage
                const savedLogs = localStorage.getItem('shadow_stellar_access_log');
                logs = savedLogs ? JSON.parse(savedLogs).slice(0, 10) : [];
            }
            
            logs.forEach(entry => {
                const div = document.createElement('div');
                div.className = `log-entry ${entry.success ? 'success' : 'failed'}`;
                
                const date = new Date(entry.timestamp);
                const timeStr = date.toLocaleTimeString('id-ID', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                });
                
                div.innerHTML = `
                    <div>${timeStr}</div>
                    <div>${entry.success ? '✓ Berhasil' : '✗ Gagal'}</div>
                    <div>Kode: ${entry.code}</div>
                `;
                
                container.appendChild(div);
            });
            
            // Show log if there are entries
            if (elements['access-log']) {
                elements['access-log'].style.display = logs.length > 0 ? 'block' : 'none';
            }
        } catch (error) {
            console.error('❌ Error updating access log:', error);
        }
    }
    
    // Session Management
    function checkExistingSession() {
        const savedSession = sessionStorage.getItem('shadow_stellar_session');
        
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                const now = Date.now();
                
                // Check if session is expired
                if (now - session.loginTime > session.timeout) {
                    sessionStorage.removeItem('shadow_stellar_session');
                    showStatus('Sesi telah berakhir', 'warning');
                    return;
                }
                
                // Session is valid
                currentSession = session;
                updateSessionUI();
                startSessionTimer();
                startIdleTimer();
            } catch (error) {
                console.error('❌ Session parse error:', error);
                sessionStorage.removeItem('shadow_stellar_session');
            }
        }
    }
    
    async function handleLogin(e) {
        e.preventDefault();
        
        if (!elements['login-username'] || !elements['login-password']) return;
        
        const username = elements['login-username'].value.trim();
        const password = elements['login-password'].value.trim();
        const rememberMe = elements['remember-me'] ? elements['remember-me'].checked : false;
        
        if (!username || !password) {
            showStatus('Username dan password harus diisi', 'error');
            return;
        }
        
        // Progressive delay based on attempts
        const delay = Math.min(1000 + (loginAttempts * 2000), 5000);
        if (elements['login-delay-info']) {
            elements['login-delay-info'].textContent = `Memverifikasi... (${delay/1000}s)`;
        }
        if (elements['login-submit']) {
            elements['login-submit'].disabled = true;
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Find admin account
        let admin = null;
        if (supabase) {
            // Fetch admin from Supabase
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('username', username)
                .single();
            
            if (!error && data) {
                admin = {
                    id: data.id,
                    username: data.username,
                    passwordHash: data.password_hash,
                    role: data.role,
                    createdAt: data.created_at,
                    lastLogin: data.last_login
                };
            }
        } else {
            // Fallback to localStorage
            admin = adminAccounts.find(a => a.username === username);
        }
        
        if (admin && await verifyPassword(password, admin.passwordHash)) {
            // Login successful
            loginAttempts = 0;
            
            // Update admin last login in Supabase
            if (supabase) {
                await updateAdminLastLogin(username);
            } else {
                // Update local admin
                const adminIndex = adminAccounts.findIndex(a => a.username === username);
                if (adminIndex !== -1) {
                    adminAccounts[adminIndex].lastLogin = new Date().toISOString();
                    localStorage.setItem('shadow_stellar_admins', JSON.stringify(adminAccounts));
                }
            }
            
            // Create session
            const sessionTimeout = rememberMe ? 
                systemSettings.rememberMeDays * 24 * 60 * 60 * 1000 : // days to ms
                systemSettings.sessionTimeout * 60 * 1000; // minutes to ms
            
            currentSession = {
                username: username,
                loginTime: Date.now(),
                timeout: sessionTimeout,
                role: admin.role
            };
            
            // Save to sessionStorage
            if (rememberMe) {
                localStorage.setItem('shadow_stellar_remembered_user', username);
            }
            sessionStorage.setItem('shadow_stellar_session', JSON.stringify(currentSession));
            
            // Update UI
            updateSessionUI();
            closeLogin();
            
            // Start timers
            startSessionTimer();
            startIdleTimer();
            
            // Open admin panel
            openAdminPanel();
            
            showStatus(`Selamat datang, ${username}!`, 'success');
        } else {
            // Login failed
            loginAttempts++;
            if (elements['login-password']) {
                elements['login-password'].value = '';
            }
            
            const remaining = systemSettings.maxLoginAttempts - loginAttempts;
            if (remaining <= 0) {
                showStatus(`Akun terkunci! Tunggu ${systemSettings.lockoutTime} menit.`, 'error');
                if (elements['login-submit']) {
                    elements['login-submit'].disabled = true;
                }
                
                setTimeout(() => {
                    loginAttempts = 0;
                    if (elements['login-submit']) {
                        elements['login-submit'].disabled = false;
                    }
                    showStatus('Silakan coba login kembali', 'info');
                }, systemSettings.lockoutTime * 60 * 1000);
            } else {
                showStatus(`Login gagal! Sisa percobaan: ${remaining}`, 'error');
                if (elements['login-submit']) {
                    elements['login-submit'].disabled = false;
                }
            }
        }
        
        if (elements['login-delay-info']) {
            elements['login-delay-info'].textContent = '';
        }
    }
    
    function updateSessionUI() {
        if (currentSession && elements['session-badge'] && elements['session-username']) {
            elements['session-badge'].style.display = 'flex';
            elements['session-username'].textContent = 
                `${systemSettings.systemName} | Login sebagai: ${currentSession.username}`;
            
            if (elements['current-admin']) {
                elements['current-admin'].textContent = currentSession.username;
            }
        } else if (elements['session-badge']) {
            elements['session-badge'].style.display = 'none';
        }
    }
    
    function startSessionTimer() {
        if (sessionTimer) clearTimeout(sessionTimer);
        
        sessionTimer = setTimeout(() => {
            logout();
            showStatus('Sesi telah berakhir (timeout)', 'warning');
        }, currentSession.timeout);
    }
    
    function startIdleTimer() {
        if (idleTimer) clearTimeout(idleTimer);
        
        idleTimer = setTimeout(() => {
            logout();
            showStatus('Sesi berakhir (tidak aktif)', 'warning');
        }, systemSettings.idleTimeout * 60 * 1000);
    }
    
    function resetSessionTimer() {
        if (currentSession) {
            currentSession.loginTime = Date.now();
            sessionStorage.setItem('shadow_stellar_session', JSON.stringify(currentSession));
            startSessionTimer();
        }
    }
    
    function resetIdleTimer() {
        if (currentSession) {
            startIdleTimer();
        }
    }
    
    function logout() {
        if (currentSession) {
            // Log admin activity to localStorage only
            if (!statistics.adminActivity[currentSession.username]) {
                statistics.adminActivity[currentSession.username] = [];
            }
            
            statistics.adminActivity[currentSession.username].push({
                action: 'logout',
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('shadow_stellar_statistics', JSON.stringify(statistics));
        }
        
        // Clear session
        currentSession = null;
        sessionStorage.removeItem('shadow_stellar_session');
        
        // Clear timers
        if (sessionTimer) clearTimeout(sessionTimer);
        if (idleTimer) clearTimeout(idleTimer);
        
        // Update UI
        updateSessionUI();
        closeAdminPanel();
        
        showStatus('Anda telah logout', 'info');
    }
    
    // Admin Panel Functions
    function openLogin() {
        if (kioskMode) {
            showStatus('Admin dinonaktifkan di mode kiosk', 'warning');
            return;
        }
        
        // Pre-fill remembered username
        const remembered = localStorage.getItem('shadow_stellar_remembered_user');
        if (remembered && elements['login-username']) {
            elements['login-username'].value = remembered;
            if (elements['remember-me']) {
                elements['remember-me'].checked = true;
            }
            if (elements['login-password']) {
                elements['login-password'].focus();
            }
        }
        
        if (elements['login-modal']) {
            elements['login-modal'].style.display = 'flex';
        }
        if (elements['login-username']) {
            elements['login-username'].focus();
        }
    }
    
    function closeLogin() {
        if (elements['login-modal']) {
            elements['login-modal'].style.display = 'none';
        }
        if (elements['login-form']) {
            elements['login-form'].reset();
        }
        if (elements['login-delay-info']) {
            elements['login-delay-info'].textContent = '';
        }
        if (elements['login-submit']) {
            elements['login-submit'].disabled = false;
        }
    }
    
    function openAdminPanel() {
        if (!currentSession) {
            openLogin();
            return;
        }
        
        // Load tab content
        switchAdminTab('websites');
        
        // Show panel
        if (elements['admin-modal']) {
            elements['admin-modal'].style.display = 'flex';
        }
        
        // Log admin activity to localStorage only
        if (currentSession && !statistics.adminActivity[currentSession.username]) {
            statistics.adminActivity[currentSession.username] = [];
        }
        
        if (currentSession) {
            statistics.adminActivity[currentSession.username].push({
                action: 'open_panel',
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('shadow_stellar_statistics', JSON.stringify(statistics));
        }
    }
    
    function closeAdminPanel() {
        if (elements['admin-modal']) {
            elements['admin-modal'].style.display = 'none';
        }
    }
    
    function switchAdminTab(tabName) {
        // Update active tab button
        if (elements.tabButtons) {
            elements.tabButtons.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === tabName);
            });
        }
        
        // Load tab content
        let content = '';
        
        switch(tabName) {
            case 'websites':
                content = getWebsitesTabContent();
                break;
            case 'maintenance':
                content = getMaintenanceTabContent();
                break;
            case 'accounts':
                content = getAccountsTabContent();
                break;
            case 'settings':
                content = getSettingsTabContent();
                break;
            case 'stats':
                content = getStatsTabContent();
                break;
            case 'security':
                content = getSecurityTabContent();
                break;
        }
        
        if (elements['tab-content-container']) {
            elements['tab-content-container'].innerHTML = content;
        }
        
        // Attach event listeners for new elements
        attachTabEventListeners(tabName);
    }
    
    function getWebsitesTabContent() {
        let websitesList = '';
        
        websitesDB.forEach(website => {
            websitesList += `
                <li>
                    <div>
                        <strong style="color: #ff0000;">${website.name}</strong><br>
                        <small style="color: #ccc;">URL: <span class="url-display">${obfuscateURL(website.url)}</span></small><br>
                        <small style="color: #ccc;">Kategori: ${website.category} | Klik: ${website.clickCount}</small>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-secondary" onclick="SHADOW_STELLAR.editWebsite('${website.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        ${!website.id.toString().includes('default-') ? `
                            <button class="btn-danger" onclick="SHADOW_STELLAR.deleteWebsite('${website.id}')">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        ` : ''}
                    </div>
                </li>
            `;
        });
        
        return `
            <div id="tab-websites" class="tab-content active">
                <h3><i class="fas fa-plus-circle"></i> Tambah Website Baru</h3>
                
                <div class="form-group">
                    <label for="web-name"><i class="fas fa-signature"></i> Nama Website:</label>
                    <input type="text" id="web-name" class="form-control" placeholder="Masukkan nama website" autocomplete="off">
                </div>
                
                <div class="form-group">
                    <label for="web-url"><i class="fas fa-link"></i> URL Website:</label>
                    <input type="text" id="web-url" class="form-control" placeholder="https://example.com" autocomplete="off">
                </div>
                
                <div class="form-group">
                    <label for="web-icon"><i class="fas fa-icons"></i> Icon FontAwesome:</label>
                    <input type="text" id="web-icon" class="form-control" placeholder="fas fa-globe" value="fas fa-globe" autocomplete="off">
                </div>
                
                <div class="form-group">
                    <label for="web-category"><i class="fas fa-tag"></i> Kategori:</label>
                    <select id="web-category" class="form-control">
                        <option value="portal">Portal</option>
                        <option value="tools">Tools</option>
                        <option value="media">Media</option>
                        <option value="internal">Internal</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="web-description"><i class="fas fa-align-left"></i> Deskripsi:</label>
                    <input type="text" id="web-description" class="form-control" placeholder="Deskripsi website" autocomplete="off">
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-shield-alt"></i> Izin Iframe:</label>
                    <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-top: 10px;">
                        <label class="checkbox-label">
                            <input type="checkbox" id="perm-scripts" checked> Scripts
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="perm-forms" checked> Forms
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="perm-popups" checked> Popups
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="perm-same-origin"> Same Origin
                        </label>
                    </div>
                </div>
                
                <button class="btn-primary" id="add-website-btn">
                    <i class="fas fa-save"></i> SIMPAN WEBSITE
                </button>
                
                <h3 style="margin-top: 40px;"><i class="fas fa-list"></i> Daftar Website (${websitesDB.length})</h3>
                
                <ul class="website-list" id="admin-website-list">
                    ${websitesList}
                </ul>
            </div>
        `;
    }
    
    function getMaintenanceTabContent() {
        const isMaintenance = systemSettings.globalMaintenance;
        
        return `
            <div id="tab-maintenance" class="tab-content">
                <h3><i class="fas fa-tools"></i> Kontrol Maintenance Mode</h3>
                
                <div class="maintenance-status">
                    <div class="status-display">
                        <div class="status-indicator ${isMaintenance ? 'on' : 'off'}" id="status-indicator"></div>
                        <div class="status-text ${isMaintenance ? 'on' : 'off'}" id="status-text">
                            STATUS: ${isMaintenance ? 'ON' : 'OFF'}
                        </div>
                    </div>
                    <div class="code-display" id="access-code-display">
                        KODE: ${systemSettings.developerCode || '--------'}
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="maintenance-message-input"><i class="fas fa-comment"></i> Pesan Maintenance:</label>
                    <textarea id="maintenance-message-input" class="form-control" rows="3" placeholder="Pesan yang ditampilkan saat maintenance">${systemSettings.maintenanceMessage}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="maintenance-countdown"><i class="fas fa-clock"></i> Countdown Selesai (opsional):</label>
                    <input type="datetime-local" id="maintenance-countdown" class="form-control" value="${systemSettings.maintenanceCountdown ? new Date(systemSettings.maintenanceCountdown).toISOString().slice(0, 16) : ''}">
                </div>
                
                <div class="maintenance-controls">
                    <button class="btn-primary" id="enable-maintenance-btn" ${isMaintenance ? 'disabled' : ''}>
                        <i class="fas fa-power-off"></i> AKTIFKAN MAINTENANCE
                    </button>
                    <button class="btn-primary" id="disable-maintenance-btn" style="background: linear-gradient(45deg, #00cc00, #008800);" ${!isMaintenance ? 'disabled' : ''}>
                        <i class="fas fa-times-circle"></i> NONAKTIFKAN
                    </button>
                    <button class="btn-primary" id="generate-code-btn" style="background: linear-gradient(45deg, #008080, #0044cc);">
                        <i class="fas fa-key"></i> GENERATE KODE BARU
                    </button>
                    <button class="btn-primary" id="show-dev-code-btn" style="background: linear-gradient(45deg, #800080, #4b0082);">
                        <i class="fas fa-eye"></i> LIHAT KODE
                    </button>
                </div>
                
                <h3 style="margin-top: 40px;"><i class="fas fa-history"></i> Website Maintenance</h3>
                <p style="color: #ccc; margin-bottom: 20px;">Atur maintenance per website:</p>
                
                <div class="website-maintenance-list" id="website-maintenance-list">
                    ${websitesDB.map(website => `
                        <div class="website-maintenance-item">
                            <div>
                                <strong>${website.name}</strong><br>
                                <small>${obfuscateURL(website.url)}</small>
                            </div>
                            <div>
                                <label class="checkbox-label">
                                    <input type="checkbox" class="website-maintenance-checkbox" data-id="${website.id}" ${website.maintenance ? 'checked' : ''}>
                                    <span>Maintenance</span>
                                </label>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <button class="btn-primary" id="save-website-maintenance" style="margin-top: 20px;">
                    <i class="fas fa-save"></i> SIMPAN PERUBAHAN
                </button>
            </div>
        `;
    }
    
    function getAccountsTabContent() {
        let adminList = '';
        
        adminAccounts.forEach((admin, index) => {
            adminList += `
                <li>
                    <div>
                        <strong style="color: #ff0000;">${admin.username}</strong><br>
                        <small style="color: #ccc;">Role: ${admin.role}</small><br>
                        <small style="color: #ccc;">Dibuat: ${new Date(admin.createdAt).toLocaleDateString('id-ID')}</small>
                    </div>
                    <div>
                        ${index > 0 ? `
                            <button class="btn-danger" onclick="SHADOW_STELLAR.deleteAdminAccount('${admin.username}')">
                                <i class="fas fa-trash"></i> Hapus
                            </button>
                        ` : '<small style="color: #ccc;">Akun sistem</small>'}
                    </div>
                </li>
            `;
        });
        
        return `
            <div id="tab-accounts" class="tab-content">
                <h3><i class="fas fa-users-cog"></i> Manajemen Akun Admin</h3>
                
                <div class="form-group">
                    <label for="new-username"><i class="fas fa-user-plus"></i> Username Baru:</label>
                    <input type="text" id="new-username" class="form-control" placeholder="Masukkan username baru" autocomplete="off">
                </div>
                
                <div class="form-group">
                    <label for="new-password"><i class="fas fa-lock"></i> Password Baru:</label>
                    <input type="password" id="new-password" class="form-control" placeholder="Minimal 8 karakter" autocomplete="new-password">
                </div>
                
                <div class="form-group">
                    <label for="new-role"><i class="fas fa-user-tag"></i> Role:</label>
                    <select id="new-role" class="form-control">
                        <option value="admin">Admin</option>
                        <option value="supervisor">Supervisor</option>
                    </select>
                </div>
                
                <button class="btn-primary" id="add-admin-btn">
                    <i class="fas fa-user-plus"></i> TAMBAH ADMIN BARU
                </button>
                
                <h3 style="margin-top: 40px;"><i class="fas fa-user-friends"></i> Daftar Admin (${adminAccounts.length})</h3>
                
                <ul class="website-list" id="admin-account-list">
                    ${adminList}
                </ul>
                
                <div class="form-group" style="margin-top: 40px;">
                    <h4><i class="fas fa-key"></i> Ubah Password Akun Saat Ini</h4>
                    <input type="password" id="current-password" class="form-control" placeholder="Password saat ini" style="margin-bottom: 10px;">
                    <input type="password" id="new-password-current" class="form-control" placeholder="Password baru">
                    <button class="btn-primary" id="change-password-btn" style="margin-top: 15px;">
                        <i class="fas fa-key"></i> UBAH PASSWORD
                    </button>
                </div>
            </div>
        `;
    }
    
    function getSettingsTabContent() {
        return `
            <div id="tab-settings" class="tab-content">
                <h3><i class="fas fa-cogs"></i> Pengaturan Sistem</h3>
                
                <div class="form-group">
                    <label for="system-name"><i class="fas fa-signature"></i> Nama Sistem:</label>
                    <input type="text" id="system-name" class="form-control" value="${systemSettings.systemName}" autocomplete="off">
                </div>
                
                <div class="form-group">
                    <label for="system-tagline"><i class="fas fa-quote-left"></i> Tagline:</label>
                    <input type="text" id="system-tagline" class="form-control" value="${systemSettings.tagline}" autocomplete="off">
                </div>
                
                <div class="form-group">
                    <label for="code-length"><i class="fas fa-key"></i> Panjang Kode Developer:</label>
                    <select id="code-length" class="form-control">
                        <option value="4" ${systemSettings.codeLength === 4 ? 'selected' : ''}>4 Digit</option>
                        <option value="6" ${systemSettings.codeLength === 6 ? 'selected' : ''}>6 Digit</option>
                        <option value="8" ${systemSettings.codeLength === 8 ? 'selected' : ''}>8 Digit</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="session-timeout"><i class="fas fa-clock"></i> Timeout Sesi (menit):</label>
                    <select id="session-timeout" class="form-control">
                        <option value="15" ${systemSettings.sessionTimeout === 15 ? 'selected' : ''}>15 menit</option>
                        <option value="30" ${systemSettings.sessionTimeout === 30 ? 'selected' : ''}>30 menit</option>
                        <option value="60" ${systemSettings.sessionTimeout === 60 ? 'selected' : ''}>60 menit</option>
                        <option value="120" ${systemSettings.sessionTimeout === 120 ? 'selected' : ''}>2 jam</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="idle-timeout"><i class="fas fa-user-clock"></i> Idle Timeout (menit):</label>
                    <select id="idle-timeout" class="form-control">
                        <option value="5" ${systemSettings.idleTimeout === 5 ? 'selected' : ''}>5 menit</option>
                        <option value="15" ${systemSettings.idleTimeout === 15 ? 'selected' : ''}>15 menit</option>
                        <option value="30" ${systemSettings.idleTimeout === 30 ? 'selected' : ''}>30 menit</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="max-attempts"><i class="fas fa-lock"></i> Maks. Percobaan Login:</label>
                    <select id="max-attempts" class="form-control">
                        <option value="3" ${systemSettings.maxLoginAttempts === 3 ? 'selected' : ''}>3 kali</option>
                        <option value="5" ${systemSettings.maxLoginAttempts === 5 ? 'selected' : ''}>5 kali</option>
                        <option value="10" ${systemSettings.maxLoginAttempts === 10 ? 'selected' : ''}>10 kali</option>
                    </select>
                </div>
                
                <button class="btn-primary" id="save-settings-btn">
                    <i class="fas fa-save"></i> SIMPAN PENGATURAN
                </button>
                
                <div class="form-group" style="margin-top: 40px;">
                    <h4><i class="fas fa-database"></i> Manajemen Data</h4>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 15px;">
                        <button class="btn-secondary" id="reset-stats-btn">
                            <i class="fas fa-chart-bar"></i> Reset Statistik
                        </button>
                        <button class="btn-secondary" id="clear-log-btn">
                            <i class="fas fa-history"></i> Bersihkan Log
                        </button>
                        ${!supabase ? `
                            <button class="btn-danger" id="reset-all-btn">
                                <i class="fas fa-bomb"></i> Reset Semua Data
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    
    function getStatsTabContent() {
        // Calculate statistics
        const totalClicks = statistics.totalClicks;
        const totalWebsites = websitesDB.length;
        const totalAdmins = adminAccounts.length;
        
        // Most clicked website
        let mostClicked = { name: 'Tidak ada', clicks: 0 };
        websitesDB.forEach(website => {
            if (website.clickCount > mostClicked.clicks) {
                mostClicked = { name: website.name, clicks: website.clickCount };
            }
        });
        
        // Today's clicks
        const today = new Date().toDateString();
        const todayClicks = statistics.dailyClicks[today] || 0;
        
        // Yesterday's clicks
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const yesterdayClicks = statistics.dailyClicks[yesterday] || 0;
        
        // Calculate trend
        const trend = yesterdayClicks > 0 ? 
            ((todayClicks - yesterdayClicks) / yesterdayClicks * 100).toFixed(1) : 0;
        
        return `
            <div id="tab-stats" class="tab-content">
                <h3><i class="fas fa-chart-bar"></i> Statistik Sistem</h3>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h4>Total Website</h4>
                        <div class="stat-value">${totalWebsites}</div>
                        <div class="stat-trend">Aktif: ${websitesDB.filter(w => !w.maintenance).length}</div>
                    </div>
                    
                    <div class="stat-card">
                        <h4>Total Klik</h4>
                        <div class="stat-value">${totalClicks}</div>
                        <div class="stat-trend">Hari ini: ${todayClicks}</div>
                    </div>
                    
                    <div class="stat-card">
                        <h4>Admin Aktif</h4>
                        <div class="stat-value">${totalAdmins}</div>
                        <div class="stat-trend">Superadmin: ${adminAccounts.filter(a => a.role === 'superadmin').length}</div>
                    </div>
                    
                    <div class="stat-card">
                        <h4>Klik/Hari</h4>
                        <div class="stat-value">${todayClicks}</div>
                        <div class="stat-trend ${trend >= 0 ? 'positive' : 'negative'}">
                            ${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend)}%
                        </div>
                    </div>
                </div>
                
                <h3 style="margin-top: 40px;"><i class="fas fa-trophy"></i> Website Terpopuler</h3>
                <div class="stat-card" style="text-align: left; margin-top: 20px;">
                    <h4>${mostClicked.name}</h4>
                    <div class="stat-value">${mostClicked.clicks} klik</div>
                    <div class="stat-trend">
                        ${mostClicked.clicks > 0 ? 
                            `${((mostClicked.clicks / totalClicks) * 100).toFixed(1)}% dari total klik` : 
                            'Belum ada klik'}
                    </div>
                </div>
                
                <h3 style="margin-top: 40px;"><i class="fas fa-history"></i> Aktivitas Admin</h3>
                <div class="activity-list" style="margin-top: 20px; max-height: 200px; overflow-y: auto;">
                    ${getAdminActivityHTML()}
                </div>
                
                <button class="btn-primary" id="export-stats-btn" style="margin-top: 20px;">
                    <i class="fas fa-file-export"></i> Ekspor Statistik
                </button>
            </div>
        `;
    }
    
    function getSecurityTabContent() {
        const isOnline = supabase !== null;
        
        return `
            <div id="tab-security" class="tab-content">
                <h3><i class="fas fa-shield-alt"></i> Keamanan Sistem</h3>
                
                <div class="form-group">
                    <label><i class="fas fa-lock"></i> Status Keamanan:</label>
                    <div style="padding: 20px; background: ${isOnline ? 'rgba(0, 128, 0, 0.1)' : 'rgba(255, 165, 0, 0.1)'}; border: 2px solid ${isOnline ? '#008800' : '#ff9900'}; border-radius: 10px; margin-top: 10px;">
                        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                            <i class="fas ${isOnline ? 'fa-check-circle' : 'fa-exclamation-triangle'}" style="color: ${isOnline ? '#00ff00' : '#ff9900'}; font-size: 1.5rem;"></i>
                            <div>
                                <strong style="color: ${isOnline ? '#00ff00' : '#ff9900'};">${isOnline ? 'Sistem Aman (Online)' : 'Mode Offline'}</strong><br>
                                <small style="color: #ccc;">${isOnline ? 'Semua fitur keamanan aktif' : 'Menggunakan penyimpanan lokal'}</small>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                            <div class="security-item">
                                <i class="fas ${isOnline ? 'fa-check' : 'fa-exclamation'}" style="color: ${isOnline ? '#00ff00' : '#ff9900'};"></i>
                                <span>${isOnline ? 'Database Online' : 'Database Offline'}</span>
                            </div>
                            <div class="security-item">
                                <i class="fas fa-check" style="color: #00ff00;"></i>
                                <span>Password Terenkripsi</span>
                            </div>
                            <div class="security-item">
                                <i class="fas fa-check" style="color: #00ff00;"></i>
                                <span>Session Management</span>
                            </div>
                            <div class="security-item">
                                <i class="fas fa-check" style="color: #00ff00;"></i>
                                <span>Iframe Sandboxing</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="auto-logout"><i class="fas fa-sign-out-alt"></i> Auto Logout:</label>
                    <div style="display: flex; align-items: center; gap: 15px; margin-top: 10px;">
                        <label class="checkbox-label">
                            <input type="checkbox" id="auto-logout-tab" checked>
                            <span>Saat ganti tab</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="auto-logout-idle" checked>
                            <span>Saat idle</span>
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <label><i class="fas fa-exclamation-triangle"></i> Tindakan Keamanan:</label>
                    <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 10px;">
                        <button class="btn-secondary" id="force-logout-all">
                            <i class="fas fa-user-slash"></i> Logout Semua Session
                        </button>
                        ${isOnline ? `
                            <button class="btn-secondary" id="invalidate-codes">
                                <i class="fas fa-key"></i> Invalidasi Semua Kode
                            </button>
                        ` : ''}
                        ${!isOnline ? `
                            <button class="btn-danger" id="wipe-data">
                                <i class="fas fa-trash"></i> Hapus Semua Data
                            </button>
                        ` : ''}
                    </div>
                </div>
                
                <h3 style="margin-top: 40px;"><i class="fas fa-file-contract"></i> Log Keamanan</h3>
                <div class="security-log" style="margin-top: 20px; max-height: 200px; overflow-y: auto; padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 10px;">
                    ${getSecurityLogHTML()}
                </div>
            </div>
        `;
    }
    
    function getAdminActivityHTML() {
        let html = '';
        
        // Get recent activity from localStorage
        const allActivities = [];
        
        Object.entries(statistics.adminActivity).forEach(([username, activities]) => {
            activities.forEach(activity => {
                allActivities.push({
                    username,
                    ...activity
                });
            });
        });
        
        // Sort by timestamp (newest first) and take top 10
        allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        allActivities.slice(0, 10).forEach(activity => {
            const time = new Date(activity.timestamp).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit'
            });
            
            html += `
                <div style="padding: 10px; border-bottom: 1px solid rgba(128, 0, 128, 0.3);">
                    <div style="display: flex; justify-content: space-between;">
                        <span><strong>${activity.username}</strong></span>
                        <span style="color: #ccc;">${time}</span>
                    </div>
                    <div style="color: #ccc; font-size: 0.9rem;">${activity.action}</div>
                </div>
            `;
        });
        
        if (allActivities.length === 0) {
            html = '<p style="color: #ccc; text-align: center; padding: 20px;">Belum ada aktivitas</p>';
        }
        
        return html;
    }
    
    function getSecurityLogHTML() {
        // Get recent security events from access log
        const recentLogs = accessLog.slice(0, 5);
        
        if (recentLogs.length === 0) {
            return '<p style="color: #ccc; text-align: center;">Belum ada log keamanan</p>';
        }
        
        return recentLogs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            const icon = log.success ? 'fa-check-circle' : 'fa-times-circle';
            const color = log.success ? '#00ff00' : '#ff0000';
            
            return `
                <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1);">
                    <i class="fas ${icon}" style="color: ${color};"></i>
                    <div style="flex: 1;">
                        <div>${log.success ? 'Akses berhasil' : 'Akses gagal'}</div>
                        <div style="font-size: 0.8rem; color: #ccc;">${time}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    function attachTabEventListeners(tabName) {
        setTimeout(() => {
            switch(tabName) {
                case 'websites':
                    const addWebsiteBtn = document.getElementById('add-website-btn');
                    if (addWebsiteBtn) {
                        addWebsiteBtn.addEventListener('click', addWebsiteFromAdmin);
                    }
                    break;
                case 'maintenance':
                    const enableBtn = document.getElementById('enable-maintenance-btn');
                    const disableBtn = document.getElementById('disable-maintenance-btn');
                    const generateBtn = document.getElementById('generate-code-btn');
                    const showBtn = document.getElementById('show-dev-code-btn');
                    const saveBtn = document.getElementById('save-website-maintenance');
                    const msgInput = document.getElementById('maintenance-message-input');
                    const countdownInput = document.getElementById('maintenance-countdown');
                    
                    if (enableBtn) enableBtn.addEventListener('click', enableMaintenance);
                    if (disableBtn) disableBtn.addEventListener('click', disableMaintenance);
                    if (generateBtn) generateBtn.addEventListener('click', generateNewCode);
                    if (showBtn) showBtn.addEventListener('click', showDeveloperCode);
                    if (saveBtn) saveBtn.addEventListener('click', saveWebsiteMaintenance);
                    if (msgInput) {
                        msgInput.addEventListener('input', (e) => {
                            systemSettings.maintenanceMessage = e.target.value;
                        });
                    }
                    if (countdownInput) {
                        countdownInput.addEventListener('change', (e) => {
                            systemSettings.maintenanceCountdown = e.target.value ? new Date(e.target.value).toISOString() : null;
                        });
                    }
                    break;
                case 'accounts':
                    const addAdminBtn = document.getElementById('add-admin-btn');
                    const changePassBtn = document.getElementById('change-password-btn');
                    
                    if (addAdminBtn) addAdminBtn.addEventListener('click', addAdminAccount);
                    if (changePassBtn) changePassBtn.addEventListener('click', changeCurrentPassword);
                    break;
                case 'settings':
                    const saveSettingsBtn = document.getElementById('save-settings-btn');
                    const resetStatsBtn = document.getElementById('reset-stats-btn');
                    const clearLogBtn = document.getElementById('clear-log-btn');
                    const resetAllBtn = document.getElementById('reset-all-btn');
                    
                    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveSystemSettings);
                    if (resetStatsBtn) resetStatsBtn.addEventListener('click', resetStatistics);
                    if (clearLogBtn) clearLogBtn.addEventListener('click', clearAccessLog);
                    if (resetAllBtn) resetAllBtn.addEventListener('click', resetToDefaults);
                    break;
                case 'stats':
                    const exportStatsBtn = document.getElementById('export-stats-btn');
                    if (exportStatsBtn) exportStatsBtn.addEventListener('click', exportStatistics);
                    break;
                case 'security':
                    const forceLogoutBtn = document.getElementById('force-logout-all');
                    const invalidateBtn = document.getElementById('invalidate-codes');
                    const wipeBtn = document.getElementById('wipe-data');
                    
                    if (forceLogoutBtn) forceLogoutBtn.addEventListener('click', forceLogoutAll);
                    if (invalidateBtn) invalidateBtn.addEventListener('click', invalidateAllCodes);
                    if (wipeBtn) wipeBtn.addEventListener('click', wipeAllData);
                    break;
            }
        }, 100);
    }
    
    // Admin Functions
    async function addWebsiteFromAdmin() {
        const name = document.getElementById('web-name') ? document.getElementById('web-name').value.trim() : '';
        const url = document.getElementById('web-url') ? document.getElementById('web-url').value.trim() : '';
        const icon = document.getElementById('web-icon') ? document.getElementById('web-icon').value.trim() : '';
        const category = document.getElementById('web-category') ? document.getElementById('web-category').value : 'portal';
        const description = document.getElementById('web-description') ? document.getElementById('web-description').value.trim() : '';
        
        if (!name || !url) {
            showStatus('Nama dan URL harus diisi!', 'error');
            return;
        }
        
        if (!isValidUrl(url)) {
            showStatus('URL tidak valid! Pastikan dimulai dengan http:// atau https://', 'error');
            return;
        }
        
        // Build permissions array
        const permissions = [];
        const scripts = document.getElementById('perm-scripts');
        const forms = document.getElementById('perm-forms');
        const popups = document.getElementById('perm-popups');
        const sameOrigin = document.getElementById('perm-same-origin');
        
        if (scripts && scripts.checked) permissions.push('allow-scripts');
        if (forms && forms.checked) permissions.push('allow-forms');
        if (popups && popups.checked) permissions.push('allow-popups');
        if (sameOrigin && sameOrigin.checked) permissions.push('allow-same-origin');
        
        const newWebsite = {
            id: `temp-${Date.now()}`,
            name,
            url,
            icon: icon || 'fas fa-globe',
            category: category || 'portal',
            description: description || 'Klik untuk membuka',
            permissions,
            clickCount: 0,
            maintenance: false,
            maintenanceMessage: ''
        };
        
        // Save to Supabase
        if (supabase) {
            const success = await saveWebsite(newWebsite);
            if (success) {
                // Reload websites from Supabase
                await loadDataFromSupabase();
            } else {
                showStatus('Gagal menyimpan website ke database', 'error');
                return;
            }
        } else {
            // Save to localStorage
            websitesDB.push(newWebsite);
            localStorage.setItem('shadow_stellar_websites', JSON.stringify(websitesDB));
        }
        
        renderUI();
        
        // Reset form
        const nameInput = document.getElementById('web-name');
        const urlInput = document.getElementById('web-url');
        const iconInput = document.getElementById('web-icon');
        const descInput = document.getElementById('web-description');
        
        if (nameInput) nameInput.value = '';
        if (urlInput) urlInput.value = '';
        if (iconInput) iconInput.value = 'fas fa-globe';
        if (descInput) descInput.value = '';
        
        showStatus(`Website "${name}" berhasil ditambahkan!`, 'success');
        
        // Log admin activity to localStorage
        if (currentSession) {
            if (!statistics.adminActivity[currentSession.username]) {
                statistics.adminActivity[currentSession.username] = [];
            }
            
            statistics.adminActivity[currentSession.username].push({
                action: `add_website: ${name}`,
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('shadow_stellar_statistics', JSON.stringify(statistics));
        }
    }
    
    function editWebsite(id) {
        const website = websitesDB.find(w => w.id === id);
        if (!website) return;
        
        // Fill form with website data
        const nameInput = document.getElementById('web-name');
        const urlInput = document.getElementById('web-url');
        const iconInput = document.getElementById('web-icon');
        const categoryInput = document.getElementById('web-category');
        const descInput = document.getElementById('web-description');
        
        if (nameInput) nameInput.value = website.name;
        if (urlInput) urlInput.value = website.url;
        if (iconInput) iconInput.value = website.icon;
        if (categoryInput) categoryInput.value = website.category;
        if (descInput) descInput.value = website.description;
        
        // Set permissions
        const scripts = document.getElementById('perm-scripts');
        const forms = document.getElementById('perm-forms');
        const popups = document.getElementById('perm-popups');
        const sameOrigin = document.getElementById('perm-same-origin');
        
        if (scripts) scripts.checked = website.permissions.includes('allow-scripts');
        if (forms) forms.checked = website.permissions.includes('allow-forms');
        if (popups) popups.checked = website.permissions.includes('allow-popups');
        if (sameOrigin) sameOrigin.checked = website.permissions.includes('allow-same-origin');
        
        // Change button text
        const btn = document.getElementById('add-website-btn');
        if (btn) {
            btn.innerHTML = `<i class="fas fa-save"></i> UPDATE WEBSITE`;
            btn.onclick = () => updateWebsite(id);
        }
        
        showStatus(`Edit website "${website.name}"`, 'info');
    }
    
    async function updateWebsite(id) {
        const website = websitesDB.find(w => w.id === id);
        if (!website) return;
        
        const nameInput = document.getElementById('web-name');
        const urlInput = document.getElementById('web-url');
        const iconInput = document.getElementById('web-icon');
        const categoryInput = document.getElementById('web-category');
        const descInput = document.getElementById('web-description');
        
        if (nameInput) website.name = nameInput.value.trim();
        if (urlInput) website.url = urlInput.value.trim();
        if (iconInput) website.icon = iconInput.value.trim();
        if (categoryInput) website.category = categoryInput.value;
        if (descInput) website.description = descInput.value.trim();
        
        // Update permissions
        website.permissions = [];
        const scripts = document.getElementById('perm-scripts');
        const forms = document.getElementById('perm-forms');
        const popups = document.getElementById('perm-popups');
        const sameOrigin = document.getElementById('perm-same-origin');
        
        if (scripts && scripts.checked) website.permissions.push('allow-scripts');
        if (forms && forms.checked) website.permissions.push('allow-forms');
        if (popups && popups.checked) website.permissions.push('allow-popups');
        if (sameOrigin && sameOrigin.checked) website.permissions.push('allow-same-origin');
        
        // Save to Supabase
        if (supabase) {
            const success = await saveWebsite(website);
            if (!success) {
                showStatus('Gagal memperbarui website di database', 'error');
                return;
            }
        } else {
            // Save to localStorage
            localStorage.setItem('shadow_stellar_websites', JSON.stringify(websitesDB));
        }
        
        renderUI();
        
        // Reset form
        if (nameInput) nameInput.value = '';
        if (urlInput) urlInput.value = '';
        if (iconInput) iconInput.value = 'fas fa-globe';
        if (descInput) descInput.value = '';
        
        // Reset button
        const btn = document.getElementById('add-website-btn');
        if (btn) {
            btn.innerHTML = `<i class="fas fa-save"></i> SIMPAN WEBSITE`;
            btn.onclick = addWebsiteFromAdmin;
        }
        
        showStatus(`Website "${website.name}" berhasil diperbarui!`, 'success');
    }
    
    async function deleteWebsite(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus website ini?')) return;
        
        const website = websitesDB.find(w => w.id === id);
        if (!website) return;
        
        if (supabase) {
            // Delete from Supabase
            const success = await deleteWebsiteFromSupabase(id);
            if (!success) {
                showStatus('Gagal menghapus website dari database', 'error');
                return;
            }
        }
        
        // Remove from local array
        websitesDB = websitesDB.filter(w => w.id !== id);
        
        // Save to localStorage if offline
        if (!supabase) {
            localStorage.setItem('shadow_stellar_websites', JSON.stringify(websitesDB));
        }
        
        renderUI();
        
        // Log admin activity to localStorage
        if (currentSession) {
            if (!statistics.adminActivity[currentSession.username]) {
                statistics.adminActivity[currentSession.username] = [];
            }
            
            statistics.adminActivity[currentSession.username].push({
                action: `delete_website: ${website.name}`,
                timestamp: new Date().toISOString()
            });
            
            localStorage.setItem('shadow_stellar_statistics', JSON.stringify(statistics));
        }
        
        showStatus(`Website "${website.name}" berhasil dihapus`, 'warning');
    }
    
    async function enableMaintenance() {
        systemSettings.globalMaintenance = true;
        
        // Update message and countdown from inputs
        const messageInput = document.getElementById('maintenance-message-input');
        const countdownInput = document.getElementById('maintenance-countdown');
        
        if (messageInput) {
            systemSettings.maintenanceMessage = messageInput.value;
        }
        
        if (countdownInput && countdownInput.value) {
            systemSettings.maintenanceCountdown = new Date(countdownInput.value).toISOString();
        }
        
        // Save to Supabase
        if (supabase) {
            await saveSystemSetting('globalMaintenance', true);
            await saveSystemSetting('maintenanceMessage', systemSettings.maintenanceMessage);
            if (systemSettings.maintenanceCountdown) {
                await saveSystemSetting('maintenanceCountdown', systemSettings.maintenanceCountdown);
            }
        } else {
            localStorage.setItem('shadow_stellar_settings', JSON.stringify(systemSettings));
        }
        
        checkMaintenanceMode();
        
        // Update UI in admin panel
        switchAdminTab('maintenance');
        
        showStatus('Maintenance mode global diaktifkan!', 'error');
    }
    
    async function disableMaintenance() {
        systemSettings.globalMaintenance = false;
        systemSettings.maintenanceCountdown = null;
        
        // Save to Supabase
        if (supabase) {
            await saveSystemSetting('globalMaintenance', false);
            await saveSystemSetting('maintenanceCountdown', null);
        } else {
            localStorage.setItem('shadow_stellar_settings', JSON.stringify(systemSettings));
        }
        
        checkMaintenanceMode();
        switchAdminTab('maintenance');
        showStatus('Maintenance mode global dinonaktifkan', 'success');
    }
    
    async function generateNewCode() {
        systemSettings.developerCode = generateRandomCode(systemSettings.codeLength);
        
        // Save to Supabase
        if (supabase) {
            await saveSystemSetting('developerCode', systemSettings.developerCode);
        } else {
            localStorage.setItem('shadow_stellar_settings', JSON.stringify(systemSettings));
        }
        
        switchAdminTab('maintenance');
        showStatus('Kode developer baru telah digenerate', 'info');
    }
    
    function showDeveloperCode() {
        if (elements['developer-modal']) {
            elements['developer-modal'].style.display = 'flex';
        }
        if (elements['current-dev-code']) {
            elements['current-dev-code'].textContent = systemSettings.developerCode;
        }
    }
    
    function copyDeveloperCode() {
        navigator.clipboard.writeText(systemSettings.developerCode)
            .then(() => {
                showStatus('Kode developer disalin ke clipboard', 'success');
            })
            .catch(err => {
                console.error('❌ Copy failed:', err);
                showStatus('Gagal menyalin kode', 'error');
            });
    }
    
    function closeDeveloperModal() {
        if (elements['developer-modal']) {
            elements['developer-modal'].style.display = 'none';
        }
    }
    
    async function saveWebsiteMaintenance() {
        const checkboxes = document.querySelectorAll('.website-maintenance-checkbox');
        let hasChanges = false;
        
        for (const checkbox of checkboxes) {
            const websiteId = checkbox.dataset.id;
            const website = websitesDB.find(w => w.id === websiteId);
            
            if (website && website.maintenance !== checkbox.checked) {
                website.maintenance = checkbox.checked;
                hasChanges = true;
                
                // Save to Supabase
                if (supabase) {
                    await saveWebsite(website);
                }
            }
        }
        
        if (hasChanges) {
            // Save to localStorage if offline
            if (!supabase) {
                localStorage.setItem('shadow_stellar_websites', JSON.stringify(websitesDB));
            }
            
            renderUI();
            showStatus('Status maintenance website diperbarui', 'success');
        } else {
            showStatus('Tidak ada perubahan', 'info');
        }
    }
    
    async function addAdminAccount() {
        const username = document.getElementById('new-username') ? document.getElementById('new-username').value.trim() : '';
        const password = document.getElementById('new-password') ? document.getElementById('new-password').value.trim() : '';
        const role = document.getElementById('new-role') ? document.getElementById('new-role').value : 'admin';
        
        if (!username || !password) {
            showStatus('Username dan password harus diisi!', 'error');
            return;
        }
        
        if (username.length < 3) {
            showStatus('Username minimal 3 karakter!', 'error');
            return;
        }
        
        if (password.length < 8) {
            showStatus('Password minimal 8 karakter!', 'error');
            return;
        }
        
        // Check if username already exists
        if (adminAccounts.some(acc => acc.username === username)) {
            showStatus('Username sudah digunakan!', 'error');
            return;
        }
        
        const passwordHash = await hashPassword(password);
        
        const newAdmin = {
            username,
            passwordHash,
            role,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        if (supabase) {
            const result = await addAdminToSupabase(newAdmin);
            if (!result) {
                showStatus('Gagal menambahkan admin ke database', 'error');
                return;
            }
        } else {
            // Save to localStorage
            adminAccounts.push(newAdmin);
            localStorage.setItem('shadow_stellar_admins', JSON.stringify(adminAccounts));
        }
        
        // Reload admin accounts
        if (supabase) {
            const { data: adminsData, error: adminsError } = await supabase
                .from('admins')
                .select('*');
            
            if (!adminsError && adminsData) {
                adminAccounts = adminsData.map(a => ({
                    id: a.id,
                    username: a.username,
                    passwordHash: a.password_hash,
                    role: a.role,
                    createdAt: a.created_at,
                    lastLogin: a.last_login
                }));
            }
        }
        
        switchAdminTab('accounts');
        
        // Reset form
        const userInput = document.getElementById('new-username');
        const passInput = document.getElementById('new-password');
        
        if (userInput) userInput.value = '';
        if (passInput) passInput.value = '';
        
        showStatus(`Admin "${username}" berhasil ditambahkan!`, 'success');
    }
    
    async function changeCurrentPassword() {
        const currentPassword = document.getElementById('current-password') ? document.getElementById('current-password').value.trim() : '';
        const newPassword = document.getElementById('new-password-current') ? document.getElementById('new-password-current').value.trim() : '';
        
        if (!currentPassword || !newPassword) {
            showStatus('Password saat ini dan baru harus diisi!', 'error');
            return;
        }
        
        if (newPassword.length < 8) {
            showStatus('Password baru minimal 8 karakter!', 'error');
            return;
        }
        
        // Verify current password
        let admin = null;
        if (supabase) {
            // Fetch admin from Supabase
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('username', currentSession.username)
                .single();
            
            if (!error && data) {
                admin = {
                    passwordHash: data.password_hash
                };
            }
        } else {
            // Fallback to localStorage
            admin = adminAccounts.find(a => a.username === currentSession.username);
        }
        
        if (!admin || !(await verifyPassword(currentPassword, admin.passwordHash))) {
            showStatus('Password saat ini salah!', 'error');
            return;
        }
        
        // Update password
        const newPasswordHash = await hashPassword(newPassword);
        
        if (supabase) {
            const success = await updateAdminPassword(currentSession.username, newPasswordHash);
            if (!success) {
                showStatus('Gagal mengubah password di database', 'error');
                return;
            }
        } else {
            // Update local admin
            const adminIndex = adminAccounts.findIndex(a => a.username === currentSession.username);
            if (adminIndex !== -1) {
                adminAccounts[adminIndex].passwordHash = newPasswordHash;
                localStorage.setItem('shadow_stellar_admins', JSON.stringify(adminAccounts));
            }
        }
        
        // Clear form
        const currPassInput = document.getElementById('current-password');
        const newPassInput = document.getElementById('new-password-current');
        
        if (currPassInput) currPassInput.value = '';
        if (newPassInput) newPassInput.value = '';
        
        showStatus('Password berhasil diubah!', 'success');
    }
    
    async function deleteAdminAccount(username) {
        if (!confirm(`Apakah Anda yakin ingin menghapus admin "${username}"?`)) return;
        
        if (supabase) {
            const success = await deleteAdminFromSupabase(username);
            if (!success) {
                showStatus('Gagal menghapus admin dari database', 'error');
                return;
            }
        }
        
        // Remove from local array
        adminAccounts = adminAccounts.filter(acc => acc.username !== username);
        
        // Save to localStorage if offline
        if (!supabase) {
            localStorage.setItem('shadow_stellar_admins', JSON.stringify(adminAccounts));
        }
        
        switchAdminTab('accounts');
        
        showStatus(`Admin "${username}" berhasil dihapus`, 'warning');
    }
    
    async function saveSystemSettings() {
        const nameInput = document.getElementById('system-name');
        const taglineInput = document.getElementById('system-tagline');
        const codeLengthInput = document.getElementById('code-length');
        const sessionTimeoutInput = document.getElementById('session-timeout');
        const idleTimeoutInput = document.getElementById('idle-timeout');
        const maxAttemptsInput = document.getElementById('max-attempts');
        
        if (nameInput) {
            systemSettings.systemName = nameInput.value.trim();
        }
        if (taglineInput) {
            systemSettings.tagline = taglineInput.value.trim();
        }
        
        if (codeLengthInput) {
            systemSettings.codeLength = parseInt(codeLengthInput.value);
        }
        if (sessionTimeoutInput) {
            systemSettings.sessionTimeout = parseInt(sessionTimeoutInput.value);
        }
        if (idleTimeoutInput) {
            systemSettings.idleTimeout = parseInt(idleTimeoutInput.value);
        }
        if (maxAttemptsInput) {
            systemSettings.maxLoginAttempts = parseInt(maxAttemptsInput.value);
        }
        
        // Save to Supabase
        if (supabase) {
            const settingsToSave = [
                { key: 'systemName', value: systemSettings.systemName },
                { key: 'tagline', value: systemSettings.tagline },
                { key: 'codeLength', value: systemSettings.codeLength },
                { key: 'sessionTimeout', value: systemSettings.sessionTimeout },
                { key: 'idleTimeout', value: systemSettings.idleTimeout },
                { key: 'maxLoginAttempts', value: systemSettings.maxLoginAttempts }
            ];
            
            for (const setting of settingsToSave) {
                await saveSystemSetting(setting.key, setting.value);
            }
        } else {
            // Save to localStorage
            localStorage.setItem('shadow_stellar_settings', JSON.stringify(systemSettings));
        }
        
        renderUI();
        
        showStatus('Pengaturan sistem berhasil disimpan', 'success');
    }
    
    async function resetStatistics() {
        if (!confirm('Reset semua statistik ke nol?')) return;
        
        if (supabase) {
            // Reset click counts in Supabase
            for (const website of websitesDB) {
                const { error } = await supabase
                    .from('websites')
                    .update({ 
                        click_count: 0,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', website.id);
                
                if (error) {
                    console.error(`❌ Error resetting website ${website.id}:`, error);
                }
            }
            
            // Clear statistics table
            const { error: statsError } = await supabase
                .from('statistics')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            
            if (statsError) {
                console.error('❌ Error clearing statistics:', statsError);
            }
        } else {
            // Reset website click counts
            websitesDB.forEach(website => {
                website.clickCount = 0;
            });
            
            // Save to localStorage
            localStorage.setItem('shadow_stellar_websites', JSON.stringify(websitesDB));
        }
        
        // Reset local statistics
        statistics.totalClicks = 0;
        statistics.dailyClicks = {};
        statistics.websiteStats = {};
        statistics.lastReset = new Date().toISOString();
        
        // Save local statistics
        localStorage.setItem('shadow_stellar_statistics', JSON.stringify(statistics));
        
        updateStatistics();
        switchAdminTab('stats');
        
        showStatus('Statistik berhasil direset', 'warning');
    }
    
    async function clearAccessLog() {
        if (!confirm('Bersihkan semua log akses?')) return;
        
        if (supabase) {
            // Clear access logs in Supabase
            const { error } = await supabase
                .from('access_logs')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            
            if (error) {
                console.error('❌ Error clearing access logs:', error);
                showStatus('Gagal membersihkan log', 'error');
                return;
            }
        }
        
        // Clear local access log
        accessLog = [];
        localStorage.setItem('shadow_stellar_access_log', JSON.stringify(accessLog));
        
        updateAccessLog();
        
        showStatus('Log akses berhasil dibersihkan', 'warning');
    }
    
    function exportStatistics() {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                system: systemSettings.systemName,
                version: 'SHADOW STELLAR v3.0 (Supabase)',
                database: supabase ? 'Supabase' : 'LocalStorage'
            },
            statistics: {
                totalClicks: statistics.totalClicks,
                totalWebsites: websitesDB.length,
                websiteStats: statistics.websiteStats,
                dailyClicks: statistics.dailyClicks,
                adminActivity: statistics.adminActivity
            },
            websites: websitesDB.map(w => ({
                name: w.name,
                clicks: w.clickCount,
                lastAccess: statistics.websiteStats[w.id]?.lastAccess
            }))
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `shadow_stellar_stats_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showStatus('Statistik berhasil diekspor', 'success');
    }
    
    function forceLogoutAll() {
        if (!confirm('Logout semua sesi admin yang aktif?')) return;
        
        // Clear all sessions
        sessionStorage.removeItem('shadow_stellar_session');
        localStorage.removeItem('shadow_stellar_remembered_user');
        
        // Clear current session
        currentSession = null;
        updateSessionUI();
        closeAdminPanel();
        
        showStatus('Semua sesi admin telah logout', 'warning');
    }
    
    async function invalidateAllCodes() {
        if (!confirm('Invalidasi semua kode developer yang ada?')) return;
        
        systemSettings.developerCode = generateRandomCode(systemSettings.codeLength);
        
        // Save to Supabase
        if (supabase) {
            await saveSystemSetting('developerCode', systemSettings.developerCode);
        } else {
            localStorage.setItem('shadow_stellar_settings', JSON.stringify(systemSettings));
        }
        
        showStatus('Semua kode developer diinvalidasi, kode baru digenerate', 'warning');
    }
    
    function wipeAllData() {
        if (!confirm('HAPUS SEMUA DATA? Tindakan ini tidak dapat dibatalkan!')) return;
        
        if (supabase) {
            showStatus('Tidak dapat menghapus data database online', 'error');
            return;
        }
        
        localStorage.clear();
        sessionStorage.clear();
        location.reload();
    }
    
    // Export/Import Functions
    function exportConfiguration() {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                system: systemSettings.systemName,
                version: 'SHADOW_STELLAR_CONFIG',
                database: supabase ? 'Supabase' : 'LocalStorage'
            },
            websites: websitesDB,
            adminAccounts: adminAccounts.map(acc => ({
                username: acc.username,
                role: acc.role,
                createdAt: acc.createdAt
                // Note: passwords are not exported for security
            })),
            settings: {
                systemName: systemSettings.systemName,
                tagline: systemSettings.tagline,
                codeLength: systemSettings.codeLength,
                sessionTimeout: systemSettings.sessionTimeout,
                idleTimeout: systemSettings.idleTimeout,
                maxLoginAttempts: systemSettings.maxLoginAttempts,
                darkMode: localStorage.getItem('shadow_stellar_darkmode') === 'true',
                showDescriptions: localStorage.getItem('shadow_stellar_descriptions') === 'true',
                defaultSandbox: systemSettings.defaultSandbox,
                blockMixedContent: systemSettings.blockMixedContent,
                disableWebGL: systemSettings.disableWebGL
            }
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `shadow_stellar_config_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showStatus('Konfigurasi berhasil diekspor', 'success');
    }
    
    function openImportModal() {
        if (elements['import-modal']) {
            elements['import-modal'].style.display = 'flex';
        }
        if (elements['import-json']) {
            elements['import-json'].value = '';
        }
        if (elements['file-info']) {
            elements['file-info'].textContent = '';
        }
    }
    
    function closeImportModal() {
        if (elements['import-modal']) {
            elements['import-modal'].style.display = 'none';
        }
    }
    
    function handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (elements['file-info']) {
            elements['file-info'].textContent = `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const json = JSON.parse(event.target.result);
                if (elements['import-json']) {
                    elements['import-json'].value = JSON.stringify(json, null, 2);
                }
            } catch (error) {
                showStatus('File tidak valid!', 'error');
                if (elements['file-info']) {
                    elements['file-info'].textContent = 'File tidak valid';
                }
            }
        };
        reader.readAsText(file);
    }
    
    async function confirmImport() {
        if (!elements['import-json']) return;
        
        const jsonText = elements['import-json'].value.trim();
        
        if (!jsonText) {
            showStatus('Masukkan konfigurasi JSON!', 'error');
            return;
        }
        
        try {
            const config = JSON.parse(jsonText);
            
            // Validate config structure
            if (!config.websites || !Array.isArray(config.websites)) {
                throw new Error('Format konfigurasi tidak valid');
            }
            
            if (!confirm('Impor konfigurasi akan mengganti semua data saat ini. Lanjutkan?')) {
                return;
            }
            
            if (supabase) {
                showStatus('Impor tidak tersedia di mode online', 'error');
                return;
            }
            
            // Import websites to localStorage
            websitesDB = config.websites.map((website, index) => ({
                id: `imported-${Date.now()}-${index}`,
                name: website.name || `Website ${index + 1}`,
                url: website.url || '#',
                icon: website.icon || 'fas fa-globe',
                category: website.category || 'portal',
                description: website.description || 'Klik untuk membuka',
                permissions: website.permissions || ['allow-scripts', 'allow-forms'],
                clickCount: 0,
                maintenance: false,
                maintenanceMessage: ''
            }));
            
            // Import settings if available
            if (config.settings) {
                systemSettings.systemName = config.settings.systemName || systemSettings.systemName;
                systemSettings.tagline = config.settings.tagline || systemSettings.tagline;
                systemSettings.codeLength = config.settings.codeLength || systemSettings.codeLength;
                systemSettings.sessionTimeout = config.settings.sessionTimeout || systemSettings.sessionTimeout;
                systemSettings.idleTimeout = config.settings.idleTimeout || systemSettings.idleTimeout;
                systemSettings.maxLoginAttempts = config.settings.maxLoginAttempts || systemSettings.maxLoginAttempts;
                systemSettings.darkMode = config.settings.darkMode !== undefined ? config.settings.darkMode : systemSettings.darkMode;
                systemSettings.showDescriptions = config.settings.showDescriptions !== undefined ? config.settings.showDescriptions : systemSettings.showDescriptions;
                systemSettings.defaultSandbox = config.settings.defaultSandbox || systemSettings.defaultSandbox;
                systemSettings.blockMixedContent = config.settings.blockMixedContent !== undefined ? config.settings.blockMixedContent : systemSettings.blockMixedContent;
                systemSettings.disableWebGL = config.settings.disableWebGL !== undefined ? config.settings.disableWebGL : systemSettings.disableWebGL;
            }
            
            // Save to localStorage
            localStorage.setItem('shadow_stellar_websites', JSON.stringify(websitesDB));
            localStorage.setItem('shadow_stellar_settings', JSON.stringify(systemSettings));
            localStorage.setItem('shadow_stellar_darkmode', systemSettings.darkMode.toString());
            localStorage.setItem('shadow_stellar_descriptions', systemSettings.showDescriptions.toString());
            
            // Reset statistics
            statistics.totalClicks = 0;
            statistics.dailyClicks = {};
            statistics.websiteStats = {};
            statistics.adminActivity = {};
            statistics.lastReset = new Date().toISOString();
            
            // Reset access log
            accessLog = [];
            localStorage.setItem('shadow_stellar_access_log', JSON.stringify(accessLog));
            localStorage.setItem('shadow_stellar_statistics', JSON.stringify(statistics));
            
            // Save and reload
            closeImportModal();
            showStatus('Konfigurasi berhasil diimpor', 'success');
            
            // Reload UI
            setTimeout(() => {
                renderUI();
                updateStatistics();
            }, 500);
            
        } catch (error) {
            console.error('❌ Import error:', error);
            showStatus('Format konfigurasi tidak valid!', 'error');
        }
    }
    
    // Statistics Functions
    function updateStatistics() {
        if (elements['total-websites']) {
            elements['total-websites'].textContent = websitesDB.length;
        }
        if (elements['total-clicks']) {
            elements['total-clicks'].textContent = statistics.totalClicks;
        }
        if (elements['active-admins']) {
            elements['active-admins'].textContent = adminAccounts.length;
        }
    }
    
    // Setup Event Listeners
    function setupEventListeners() {
        // Settings button
        if (elements['settings-btn']) {
            elements['settings-btn'].addEventListener('click', toggleSettingsMenu);
        }
        
        // Settings menu items
        const menuItems = {
            'toggle-descriptions': toggleDescriptions,
            'toggle-mode': toggleDarkMode,
            'export-config': exportConfiguration,
            'import-config': openImportModal,
            'kiosk-mode': toggleKioskMode
        };
        
        Object.entries(menuItems).forEach(([id, handler]) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('click', handler);
            }
        });
        
        // Admin button
        if (elements['admin-btn']) {
            elements['admin-btn'].addEventListener('click', openLogin);
        }
        
        // Session logout
        if (elements['logout-btn']) {
            elements['logout-btn'].addEventListener('click', logout);
        }
        
        // Browser controls
        if (elements['browser-back']) {
            elements['browser-back'].addEventListener('click', browserBack);
        }
        if (elements['browser-forward']) {
            elements['browser-forward'].addEventListener('click', browserForward);
        }
        if (elements['browser-reload']) {
            elements['browser-reload'].addEventListener('click', browserReload);
        }
        if (elements['browser-home']) {
            elements['browser-home'].addEventListener('click', browserHome);
        }
        if (elements['browser-security']) {
            elements['browser-security'].addEventListener('click', openSecuritySettings);
        }
        if (elements['close-browser']) {
            elements['close-browser'].addEventListener('click', closeBrowser);
        }
        if (elements['open-external']) {
            elements['open-external'].addEventListener('click', openExternal);
        }
        if (elements['close-info']) {
            elements['close-info'].addEventListener('click', () => {
                if (elements['browser-info']) {
                    elements['browser-info'].style.display = 'none';
                }
            });
        }
        
        // Browser iframe events
        if (elements['browser-frame']) {
            elements['browser-frame'].addEventListener('load', onIframeLoad);
            elements['browser-frame'].addEventListener('error', onIframeError);
        }
        
        // Maintenance mode
        if (elements['show-access-form']) {
            elements['show-access-form'].addEventListener('click', showAccessForm);
        }
        if (elements['submit-code']) {
            elements['submit-code'].addEventListener('click', submitAccessCode);
        }
        if (elements['access-code']) {
            elements['access-code'].addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submitAccessCode();
            });
        }
        
        // Login
        if (elements['login-form']) {
            elements['login-form'].addEventListener('submit', handleLogin);
        }
        
        // Admin panel
        if (elements['close-admin']) {
            elements['close-admin'].addEventListener('click', closeAdminPanel);
        }
        
        // Tabs
        if (elements.tabButtons) {
            elements.tabButtons.forEach(btn => {
                btn.addEventListener('click', () => switchAdminTab(btn.dataset.tab));
            });
        }
        
        // Developer modal
        if (elements['copy-dev-code']) {
            elements['copy-dev-code'].addEventListener('click', copyDeveloperCode);
        }
        if (elements['close-developer-modal']) {
            elements['close-developer-modal'].addEventListener('click', closeDeveloperModal);
        }
        
        // Import modal
        if (elements['browse-file']) {
            elements['browse-file'].addEventListener('click', () => {
                if (elements['import-file']) {
                    elements['import-file'].click();
                }
            });
        }
        if (elements['import-file']) {
            elements['import-file'].addEventListener('change', handleFileImport);
        }
        if (elements['confirm-import']) {
            elements['confirm-import'].addEventListener('click', confirmImport);
        }
        if (elements['cancel-import']) {
            elements['cancel-import'].addEventListener('click', closeImportModal);
        }
        
        // Security modal
        if (elements['apply-security']) {
            elements['apply-security'].addEventListener('click', applySecuritySettings);
        }
        if (elements['reset-security']) {
            elements['reset-security'].addEventListener('click', resetSecuritySettings);
        }
        
        // Close modals on outside click
        document.querySelectorAll('.login-modal, .admin-modal, .developer-modal, .import-modal, .security-modal')
            .forEach(modal => {
                if (modal) {
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.style.display = 'none';
                        }
                    });
                }
            });
        
        // Page unload warning
        window.addEventListener('beforeunload', (e) => {
            if (currentSession && !kioskMode) {
                e.preventDefault();
                e.returnValue = 'Anda masih login ke SHADOW STELLAR. Yakin ingin meninggalkan halaman?';
            }
        });
    }
    
    // Setup Keyboard Shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if in input field or kiosk mode
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || kioskMode) return;
            
            // Ctrl+Shift+S for settings
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                toggleSettingsMenu();
                showStatus('Menu settings', 'info');
            }
            
            // Esc to close
            if (e.key === 'Escape') {
                if (elements['browser-container'] && elements['browser-container'].style.display === 'flex') {
                    closeBrowser();
                } else if (elements['admin-modal'] && elements['admin-modal'].style.display === 'flex') {
                    closeAdminPanel();
                } else if (elements['login-modal'] && elements['login-modal'].style.display === 'flex') {
                    closeLogin();
                } else if (elements['settings-menu'] && elements['settings-menu'].classList.contains('active')) {
                    elements['settings-menu'].classList.remove('active');
                }
            }
            
            // Ctrl+Shift+D for developer mode
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                showDeveloperCode();
            }
        });
    }
    
    // Setup Page Visibility API
    function setupPageVisibility() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && currentSession) {
                // User switched tabs - update idle timer
                resetIdleTimer();
            }
        });
    }
    
    // Public API
    return {
        // Initialization
        init,
        
        // Public functions for HTML onclick
        deleteWebsite,
        deleteAdminAccount,
        editWebsite,
        
        // Utility functions
        showStatus,
        showLoading,
        hideLoading
    };
})();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', SHADOW_STELLAR.init);