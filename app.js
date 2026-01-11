// SHADOW STELLAR - Main Application Module
// Menggunakan IIFE untuk enkapsulasi

const SHADOW_STELLAR = (function() {
    // Private Variables
    let websitesDB = [];
    let systemSettings = {};
    let currentWebsite = null;
    
    // Security State
    let kioskMode = false;
    
    // Statistics
    let statistics = {
        totalClicks: 0,
        websiteStats: {}
    };
    
    // DOM Elements Cache
    const elements = {};
    
    // Initialize Application
    function init() {
        console.log('🚀 SHADOW STELLAR v3.0 - Config-Driven Edition - Initializing...');
        
        try {
            // Cache DOM elements
            cacheElements();
            
            // Load data from config
            loadDataFromConfig();
            
            // Setup event listeners
            setupEventListeners();
            
            // Setup keyboard shortcuts
            setupKeyboardShortcuts();
            
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
            
            console.log('✅ SHADOW STELLAR initialized successfully');
            showStatus('SHADOW STELLAR siap digunakan', 'success');
        } catch (error) {
            console.error('❌ Error during initialization:', error);
            showStatus('Error inisialisasi, menggunakan mode aman', 'error');
            safeFallback();
        }
    }
    
    // Safe Fallback
    function safeFallback() {
        // Minimal functional UI
        document.querySelectorAll('.website-button').forEach(btn => {
            btn.onclick = () => showStatus('Sistem dalam mode aman', 'warning');
        });
    }
    
    // Cache DOM Elements (DIPERBAIKI)
    function cacheElements() {
        const ids = [
            'status-message', 'loading-overlay',
            'settings-btn', 'settings-menu',
            'toggle-descriptions', 'toggle-mode',
            'export-config', 'import-config', 'kiosk-mode',
            'horizontal-buttons', 'total-websites', 'total-clicks',
            'browser-container', 'main-container',
            'browser-frame', 'browser-back', 'browser-forward',
            'browser-reload', 'browser-home', 'browser-security',
            'browser-title', 'close-browser', 'frame-blocked',
            'open-external', 'browser-info', 'close-info',
            'info-name', 'info-category', 'info-permissions',
            'info-clicks', 'info-status', 'maintenance-mode',
            'maintenance-message', 'countdown-timer', 'timer-display',
            'security-modal', 'allow-scripts', 'allow-forms',
            'allow-popups', 'allow-same-origin', 'block-mixed-content',
            'disable-webgl', 'apply-security', 'reset-security'
        ];
        
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                elements[id] = el;
            } else {
                console.warn(`⚠️ Element with ID "${id}" not found`);
            }
        });
    }
    
    // Load Data from Config (DIPERBAIKI)
    function loadDataFromConfig() {
        console.log('📋 Loading data from configuration...');
        
        try {
            if (!window.SHADOW_STELLAR_CONFIG) {
                throw new Error('Configuration not found');
            }
            
            // Load websites from config
            websitesDB = SHADOW_STELLAR_CONFIG.WEBSITES.map(w => ({
                ...w,
                clickCount: 0 // Initialize click count
            }));
            
            // Load system settings from config
            systemSettings = {
                // System info
                systemName: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.name,
                tagline: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.tagline,
                
                // Maintenance
                globalMaintenance: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.maintenance || false,
                maintenanceMessage: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.maintenanceMessage,
                maintenanceCountdown: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.maintenanceCountdown,
                
                // Security
                developerCode: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.developerCode,
                
                // Browser security
                defaultSandbox: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.defaultSandbox,
                blockMixedContent: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.blockMixedContent,
                disableWebGL: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.security.disableWebGL,
                
                // UI
                darkMode: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.theme.darkMode,
                showDescriptions: SHADOW_STELLAR_CONFIG.GLOBAL_CONFIG.theme.showDescriptions
            };
            
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
        websitesDB = [];
        systemSettings = {
            systemName: "SHADOW STELLAR",
            tagline: "Silent. Secure. Stellar.",
            globalMaintenance: false,
            maintenanceMessage: "Sistem dalam pemeliharaan.",
            darkMode: true,
            showDescriptions: true
        };
        
        showStatus('Menggunakan konfigurasi default', 'warning');
        renderUI();
    }
    
    // Show Status Message (AMAN)
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
    
    // Show Loading Overlay (AMAN)
    function showLoading(message = 'Memuat...') {
        const overlay = elements['loading-overlay'];
        if (overlay) {
            const p = overlay.querySelector('p');
            if (p) p.textContent = message;
            overlay.style.display = 'flex';
        }
    }
    
    // Hide Loading Overlay (AMAN)
    function hideLoading() {
        const overlay = elements['loading-overlay'];
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    // Render UI (DIPERBAIKI)
    function renderUI() {
        try {
            // Update page title
            document.title = `${systemSettings.systemName} | ${systemSettings.tagline}`;
            
            // Update dark mode
            if (systemSettings.darkMode) {
                document.body.classList.add('darker-mode');
            } else {
                document.body.classList.remove('darker-mode');
            }
            
            // Update toggle switches
            updateSettingsMenuToggles();
            
            // Render website buttons
            renderWebsiteButtons();
            
            // Update statistics
            updateStatistics();
            
        } catch (error) {
            console.error('Error in renderUI:', error);
        }
    }
    
    // Update Settings Menu Toggles (AMAN)
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
    }
    
    // Render Website Buttons (AMAN)
    function renderWebsiteButtons() {
        const container = elements['horizontal-buttons'];
        if (!container) return;
        
        container.innerHTML = '';
        
        websitesDB.forEach((website, index) => {
            const button = document.createElement('button');
            button.className = `website-button lazy-load ${website.maintenance ? 'maintenance' : ''}`;
            
            // Add AOS animation if available
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
            
            // Safe event binding
            button.onclick = () => {
                try {
                    openWebsite(website);
                } catch (error) {
                    console.error('Error opening website:', error);
                    showStatus('Gagal membuka website', 'error');
                }
            };
            
            container.appendChild(button);
        });
        
        // Animate lazy load
        setTimeout(() => {
            document.querySelectorAll('.lazy-load').forEach((btn, index) => {
                setTimeout(() => btn.classList.add('loaded'), index * 100);
            });
        }, 100);
    }
    
    // Toggle Settings Menu (AMAN)
    function toggleSettingsMenu() {
        const menu = elements['settings-menu'];
        if (menu) {
            menu.classList.toggle('active');
        }
    }
    
    // Toggle Descriptions (AMAN)
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
    
    // Toggle Dark Mode (AMAN)
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
    
    // Toggle Kiosk Mode (AMAN)
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
        
        // Update toggle switch
        const kioskToggle = document.querySelector('#kiosk-mode .toggle-switch');
        if (kioskToggle) {
            kioskToggle.classList.toggle('active', kioskMode);
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
        }
    }
    
    // Open Website (DIPERBAIKI)
    function openWebsite(website) {
        // Check global maintenance
        if (systemSettings.globalMaintenance) {
            showStatus('Sistem dalam maintenance global', 'error');
            return;
        }
        
        // Check website-specific maintenance
        if (website.maintenance) {
            showStatus(`${website.name} sedang dalam maintenance`, 'error');
            return;
        }
        
        try {
            // Update click statistics
            website.clickCount = (website.clickCount || 0) + 1;
            statistics.totalClicks++;
            
            // Update UI statistics
            updateStatistics();
            
            // Set current website
            currentWebsite = website;
            
            // Open in browser
            openBrowser(website);
            
        } catch (error) {
            console.error('Error in openWebsite:', error);
            showStatus('Gagal membuka website', 'error');
        }
    }
    
    // Open Browser (AMAN)
    function openBrowser(website) {
        showLoading(`Membuka ${website.name}...`);
        
        const browser = elements['browser-container'];
        const iframe = elements['browser-frame'];
        const title = elements['browser-title'];
        
        if (!browser || !iframe) {
            hideLoading();
            showStatus('Browser tidak tersedia', 'error');
            return;
        }
        
        // Update browser title
        if (title) {
            title.innerHTML = `<span class="url-display">${systemSettings.systemName} - ${website.name}</span>`;
        }
        
        // Set iframe sandbox
        iframe.sandbox.value = systemSettings.defaultSandbox;
        
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
    
    // Update Browser Info Panel (AMAN)
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
            elements['info-clicks'].textContent = website.clickCount || 0;
        }
        
        const status = elements['info-status'];
        if (status) {
            status.className = 'status-indicator';
            status.classList.add(website.maintenance ? 'maintenance' : 'active');
        }
    }
    
    // Iframe Load Handler (AMAN)
    function onIframeLoad() {
        hideLoading();
    }
    
    // Iframe Error Handler (AMAN)
    function onIframeError() {
        hideLoading();
        if (elements['frame-blocked']) {
            elements['frame-blocked'].style.display = 'flex';
        }
        showStatus('Gagal memuat halaman website', 'error');
    }
    
    // Browser Controls (AMAN)
    function browserBack() {
        try {
            const iframe = elements['browser-frame'];
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.history.back();
            }
        } catch (error) {
            showStatus('Tidak bisa kembali', 'error');
        }
    }
    
    function browserForward() {
        try {
            const iframe = elements['browser-frame'];
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.history.forward();
            }
        } catch (error) {
            showStatus('Tidak bisa maju', 'error');
        }
    }
    
    function browserReload() {
        const iframe = elements['browser-frame'];
        if (iframe) {
            iframe.src = iframe.src;
            showLoading('Memuat ulang...');
        }
    }
    
    function browserHome() {
        if (currentWebsite && elements['browser-frame']) {
            elements['browser-frame'].src = currentWebsite.url;
            showLoading('Kembali ke beranda...');
        }
    }
    
    function closeBrowser() {
        const browser = elements['browser-container'];
        const iframe = elements['browser-frame'];
        
        if (browser) {
            browser.style.display = 'none';
        }
        
        if (iframe) {
            iframe.src = 'about:blank';
        }
        
        currentWebsite = null;
    }
    
    function openExternal() {
        if (currentWebsite) {
            window.open(currentWebsite.url, '_blank');
        }
    }
    
    // Open Security Settings (AMAN)
    function openSecuritySettings() {
        const modal = elements['security-modal'];
        if (!modal) return;
        
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
        
        modal.style.display = 'flex';
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
        const modal = elements['security-modal'];
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    // Maintenance Mode Functions (DIPERBAIKI)
    function checkMaintenanceMode() {
        const maintenanceMode = elements['maintenance-mode'];
        const mainContainer = elements['main-container'];
        
        if (!maintenanceMode || !mainContainer) return;
        
        if (systemSettings.globalMaintenance) {
            maintenanceMode.style.display = 'flex';
            mainContainer.style.display = 'none';
            
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
        } else {
            maintenanceMode.style.display = 'none';
            mainContainer.style.display = 'block';
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
    
    // Export Configuration (AMAN)
    function exportConfiguration() {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                system: systemSettings.systemName,
                version: 'SHADOW_STELLAR_CONFIG'
            },
            websites: websitesDB.map(w => ({
                id: w.id,
                name: w.name,
                url: w.url,
                icon: w.icon,
                description: w.description,
                category: w.category,
                permissions: w.permissions,
                maintenance: w.maintenance,
                maintenanceMessage: w.maintenanceMessage
            }))
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
        showStatus('Fitur impor dinonaktifkan di mode config-driven', 'warning');
    }
    
    // Statistics Functions (AMAN)
    function updateStatistics() {
        if (elements['total-websites']) {
            elements['total-websites'].textContent = websitesDB.length;
        }
        if (elements['total-clicks']) {
            elements['total-clicks'].textContent = statistics.totalClicks;
        }
    }
    
    // Setup Event Listeners (DIPERBAIKI - null safety)
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
        
        // Security modal
        if (elements['apply-security']) {
            elements['apply-security'].addEventListener('click', applySecuritySettings);
        }
        if (elements['reset-security']) {
            elements['reset-security'].addEventListener('click', resetSecuritySettings);
        }
        
        // Close modals on outside click
        const modal = elements['security-modal'];
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }
    
    // Setup Keyboard Shortcuts (AMAN)
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if in input field or kiosk mode
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || kioskMode) return;
            
            // Ctrl+Shift+S for settings
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                toggleSettingsMenu();
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

// Initialize on DOM load with safety
document.addEventListener('DOMContentLoaded', function() {
    try {
        SHADOW_STELLAR.init();
    } catch (error) {
        console.error('Fatal error during initialization:', error);
        const body = document.body;
        if (body) {
            body.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #000;
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    text-align: center;
                    padding: 20px;
                    font-family: monospace;
                ">
                    <h1 style="color: #ff0000; margin-bottom: 20px;">SHADOW STELLAR ERROR</h1>
                    <p style="margin-bottom: 10px;">Sistem mengalami error kritis.</p>
                    <p style="margin-bottom: 20px; color: #ccc;">Silakan refresh halaman atau periksa konsol.</p>
                    <button onclick="location.reload()" style="
                        background: #800080;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">
                        Refresh Halaman
                    </button>
                </div>
            `;
        }
    }
});