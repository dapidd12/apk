
// SHADOW STELLAR - Main Application Module
// Menggunakan IIFE untuk enkapsulasi

const SHADOW_STELLAR = (function() {
    // Private Variables
    let websitesDB = [];
    let systemSettings = {};
    let accessLog = [];
    let statistics = {};
    let currentWebsite = null;
    
    // Security State
    let loginAttempts = 0;
    let kioskMode = false;
    
    // DOM Elements Cache
    const elements = {};
    
    // Initialize Application
    function init() {
        console.log('🚀 SHADOW STELLAR v3.0 - Config-Driven Edition - Initializing...');
        
        // Cache DOM elements
        cacheElements();
        
        // Load data from config
        loadDataFromConfig();
        
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
        
        // Update statistics display
        updateStatistics();
        
        console.log('✅ SHADOW STELLAR initialized successfully');
        showStatus('SHADOW STELLAR siap digunakan', 'success');
    }
    
    // Cache DOM Elements
    function cacheElements() {
        const ids = [
            'status-message', 'loading-overlay',
            'settings-btn', 'settings-menu',
            'toggle-descriptions', 'toggle-mode',
            'export-config', 'import-config', 'kiosk-mode',
            'horizontal-buttons', 'total-websites', 'total-clicks',
            'active-admins', 'browser-container',
            'browser-frame', 'browser-back', 'browser-forward',
            'browser-reload', 'browser-home', 'browser-security',
            'browser-title', 'close-browser', 'frame-blocked',
            'open-external', 'browser-info', 'close-info',
            'info-name', 'info-category', 'info-permissions',
            'info-clicks', 'info-status', 'maintenance-mode',
            'maintenance-message', 'countdown-timer', 'timer-display',
            'access-code-form', 'access-code', 'submit-code',
            'attempts-info', 'access-log', 'log-entries',
            'show-access-form', 'security-modal',
            'allow-scripts', 'allow-forms', 'allow-popups',
            'allow-same-origin', 'block-mixed-content', 'disable-webgl',
            'apply-security', 'reset-security'
        ];
        
        ids.forEach(id => {
            elements[id] = document.getElementById(id);
        });
    }
    
    // Load Data from Config
    function loadDataFromConfig() {
        console.log('📋 Loading data from configuration...');
        
        try {
            // Load websites from config
            websitesDB = SHADOW_STELLAR_CONFIG.WEBSITES.map(w => ({
                ...w,
                maintenance: w.maintenance || false
            }));
            
            // Load system settings from config
            systemSettings = {
                // System info
                systemName: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.name,
                tagline: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.tagline,
                
                // Maintenance
                globalMaintenance: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.maintenance,
                maintenanceMessage: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.maintenanceMessage,
                maintenanceCountdown: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.maintenanceCountdown,
                
                // Security
                developerCode: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.developerCode,
                codeLength: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.codeLength,
                maxLoginAttempts: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.maxLoginAttempts,
                lockoutTime: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.lockoutTime,
                
                // Session
                sessionTimeout: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.session.timeout,
                idleTimeout: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.session.idleTimeout,
                
                // Browser security
                defaultSandbox: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.defaultSandbox,
                blockMixedContent: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.blockMixedContent,
                disableWebGL: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.disableWebGL,
                
                // UI
                darkMode: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.theme.darkMode,
                showDescriptions: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.theme.showDescriptions,
                kioskMode: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.theme.kioskMode
            };
            
            // Initialize statistics
            statistics = {
                totalClicks: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.statistics.totalClicks,
                totalWebsites: websitesDB.length,
                activeAdmins: SHADOW_STELLAR_CONFIG.ADMIN_ACCOUNTS.length,
                dailyClicks: {},
                websiteStats: {},
                adminActivity: {}
            };
            
            // Initialize access log
            accessLog = [];
            
            console.log(`✅ Loaded ${websitesDB.length} websites from config`);
            console.log(`✅ Loaded system settings`);
            
        } catch (error) {
            console.error('❌ Error loading data from config:', error);
            showStatus('Gagal memuat konfigurasi', 'error');
            resetToDefaults();
        }
    }
    
    // Reset to Defaults
    function resetToDefaults() {
        websitesDB = [...SHADOW_STELLAR_CONFIG.WEBSITES];
        systemSettings = {
            systemName: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.name,
            tagline: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.tagline,
            globalMaintenance: false,
            maintenanceMessage: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.maintenanceMessage,
            developerCode: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.developerCode
        };
        
        showStatus('Menggunakan konfigurasi default', 'warning');
        renderUI();
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
        
        // Update dark mode from systemSettings
        const useDarkMode = systemSettings.darkMode;
        
        if (useDarkMode) {
            document.body.classList.add('darker-mode');
        } else {
            document.body.classList.remove('darker-mode');
        }
        
        // Update toggle switches in settings menu
        updateSettingsMenuToggles();
        
        // Render website buttons
        renderWebsiteButtons();
        
        // Update statistics
        updateStatistics();
    }
    
    // Update Settings Menu Toggles
    function updateSettingsMenuToggles() {
        const showDescriptions = systemSettings.showDescriptions;
        const darkMode = systemSettings.darkMode;
        
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
            
            const descriptionClass = systemSettings.showDescriptions ? 'show' : '';
            
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
        systemSettings.showDescriptions = !systemSettings.showDescriptions;
        
        // Update toggle switch
        const descToggle = document.querySelector('#toggle-descriptions .toggle-switch');
        if (descToggle) {
            descToggle.classList.toggle('active', systemSettings.showDescriptions);
        }
        
        // Update website buttons
        document.querySelectorAll('.button-desc').forEach(desc => {
            desc.classList.toggle('show', systemSettings.showDescriptions);
        });
        
        showStatus(`Deskripsi ${systemSettings.showDescriptions ? 'diaktifkan' : 'dinonaktifkan'}`, 'info');
    }
    
    // Toggle Dark Mode
    function toggleDarkMode() {
        systemSettings.darkMode = !systemSettings.darkMode;
        document.body.classList.toggle('darker-mode', systemSettings.darkMode);
        
        // Update toggle switch and icon
        const modeToggle = document.querySelector('#toggle-mode .toggle-switch');
        const modeIcon = document.querySelector('#toggle-mode i');
        
        if (modeToggle) {
            modeToggle.classList.toggle('active', systemSettings.darkMode);
        }
        
        if (modeIcon) {
            modeIcon.className = systemSettings.darkMode ? 'fas fa-sun' : 'fas fa-moon';
        }
        
        showStatus(`Mode ${systemSettings.darkMode ? 'darker' : 'dark'} diaktifkan`, 'info');
    }
    
    // Toggle Kiosk Mode
    function toggleKioskMode() {
        kioskMode = !kioskMode;
        
        if (kioskMode) {
            // Disable right-click
            document.addEventListener('contextmenu', preventContextMenu);
            
            // Lock keyboard shortcuts
            document.addEventListener('keydown', preventKioskKeys);
            
            showStatus('Mode Kiosk diaktifkan', 'warning');
        } else {
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
    function openWebsite(website) {
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
        
        // Update click statistics
        website.clickCount++;
        statistics.totalClicks++;
        
        // Update daily statistics
        const today = new Date().toDateString();
        statistics.dailyClicks[today] = (statistics.dailyClicks[today] || 0) + 1;
        
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
                
                // Enable audio and video
                try {
                    if (iframe.contentWindow) {
                        // Allow audio and video playback
                        iframe.contentWindow.postMessage('enableMedia', '*');
                    }
                } catch (e) {
                    console.log('Media enablement not needed');
                }
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
    
    function applySecuritySettings() {
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
        
        closeSecurityModal();
        showStatus('Pengaturan keamanan diperbarui', 'success');
    }
    
    function resetSecuritySettings() {
        systemSettings.defaultSandbox = 'allow-scripts allow-forms allow-popups';
        systemSettings.blockMixedContent = true;
        systemSettings.disableWebGL = true;
        
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
    }
    
    function startMaintenanceCountdown(endTime) {
        function updateTimer() {
            const now = Date.now();
            const remaining = endTime - now;
            
            if (remaining <= 0) {
                if (elements['timer-display']) {
                    elements['timer-display'].textContent = '00:00:00';
                }
                // Auto-disable maintenance when countdown ends
                systemSettings.globalMaintenance = false;
                checkMaintenanceMode();
                showStatus('Maintenance selesai secara otomatis', 'success');
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
    
    function submitAccessCode() {
        if (!elements['access-code']) return;
        
        const inputCode = elements['access-code'].value.trim().toUpperCase();
        
        if (!inputCode) {
            showStatus('Masukkan kode akses!', 'error');
            return;
        }
        
        // Log the attempt
        accessLog.push({
            timestamp: new Date().toISOString(),
            code: '••••••',
            success: false
        });
        
        if (inputCode === systemSettings.developerCode) {
            // Success
            accessLog.push({
                timestamp: new Date().toISOString(),
                code: '••••••',
                success: true
            });
            
            // Disable maintenance
            systemSettings.globalMaintenance = false;
            systemSettings.maintenanceCountdown = null;
            loginAttempts = 0;
            
            checkMaintenanceMode();
            hideAccessForm();
            updateAccessLog();
            
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
    
    function updateAccessLog() {
        const container = elements['log-entries'];
        if (!container) return;
        
        container.innerHTML = '';
        
        // Show last 5 logs
        const recentLogs = accessLog.slice(-5).reverse();
        
        recentLogs.forEach(entry => {
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
            elements['access-log'].style.display = accessLog.length > 0 ? 'block' : 'none';
        }
    }
    
    // Export/Import Functions
    function exportConfiguration() {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                system: systemSettings.systemName,
                version: 'SHADOW_STELLAR_CONFIG',
                database: 'Config-Driven'
            },
            websites: websitesDB,
            settings: {
                systemName: systemSettings.systemName,
                tagline: systemSettings.tagline,
                developerCode: systemSettings.developerCode,
                darkMode: systemSettings.darkMode,
                showDescriptions: systemSettings.showDescriptions
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
        // Feature disabled in config-driven mode
        showStatus('Fitur impor dinonaktifkan di mode config-driven', 'warning');
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
            elements['active-admins'].textContent = statistics.activeAdmins;
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
        
        // Security modal
        if (elements['apply-security']) {
            elements['apply-security'].addEventListener('click', applySecuritySettings);
        }
        if (elements['reset-security']) {
            elements['reset-security'].addEventListener('click', resetSecuritySettings);
        }
        
        // Close modals on outside click
        document.querySelectorAll('.security-modal')
            .forEach(modal => {
                if (modal) {
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) {
                            modal.style.display = 'none';
                        }
                    });
                }
            });
        
        // Add event listener for enabling media in iframes
        window.addEventListener('message', (event) => {
            if (event.data === 'enableMedia' && elements['browser-frame']) {
                try {
                    // Try to enable media in iframe
                    const iframe = elements['browser-frame'];
                    if (iframe.contentWindow) {
                        // Media should already be enabled by allow-scripts
                        console.log('Media enabled for iframe');
                    }
                } catch (e) {
                    console.log('Media enablement not available');
                }
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
                } else if (elements['settings-menu'] && elements['settings-menu'].classList.contains('active')) {
                    elements['settings-menu'].classList.remove('active');
                }
                if (elements['security-modal'] && elements['security-modal'].style.display === 'flex') {
                    elements['security-modal'].style.display = 'none';
                }
            }
            
            // Ctrl+Shift+D for developer mode
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                if (SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.features.developerAccess) {
                    showAccessForm();
                    showStatus('Developer access form', 'info');
                }
            }
        });
    }
    
    // Setup Page Visibility API
    function setupPageVisibility() {
        document.addEventListener('visibilitychange', () => {
            // Optional: Add visibility change logic if needed
            // Currently not needed for config-driven mode
        });
    }
    
    // Public API
    return {
        // Initialization
        init,
        
        // Utility functions
        showStatus,
        showLoading,
        hideLoading
    };
})();

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', SHADOW_STELLAR.init);
[file content end]