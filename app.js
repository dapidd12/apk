// SHADOW STELLAR - Main Application Module
// Enhanced with Stealth Mode Browser

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
            // Remove no-js class
            document.documentElement.classList.remove('no-js');
            
            // Cache DOM elements with null safety
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
                    offset: 100,
                    disable: window.innerWidth < 768
                });
            }
            
            // Render UI
            renderUI();
            
            // Check maintenance mode
            checkMaintenanceMode();
            
            console.log('✅ SHADOW STELLAR initialized successfully');
            showStatus('SHADOW STELLAR ready for operation', 'success');
            
            // Hide loading overlay
            setTimeout(hideLoading, 500);
            
        } catch (error) {
            console.error('❌ Error during initialization:', error);
            showStatus('Initialization error, using safe mode', 'error');
            safeFallback();
            hideLoading();
        }
    }
    
    // Safe Fallback - Enhanced
    function safeFallback() {
        // Minimal functional UI
        document.querySelectorAll('.website-button').forEach(btn => {
            btn.onclick = () => showStatus('System in safe mode', 'warning');
        });
        
        // Show fallback message
        const fallback = document.querySelector('.no-js-fallback');
        if (fallback) {
            fallback.style.display = 'block';
        }
    }
    
    // Cache DOM Elements - ENHANCED null safety
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
            try {
                const el = document.getElementById(id);
                if (el) {
                    elements[id] = el;
                } else {
                    console.warn(`⚠️ Element with ID "${id}" not found, will be skipped`);
                }
            } catch (error) {
                console.warn(`⚠️ Error caching element "${id}":`, error);
            }
        });
        
        // Additional safety checks
        if (!elements['main-container']) {
            console.error('CRITICAL: Main container not found');
            document.body.innerHTML = `
                <div style="padding: 40px; color: white; text-align: center; background: #000;">
                    <h1 style="color: #ff0000;">SHADOW STELLAR ERROR</h1>
                    <p>Critical UI elements missing. Please refresh the page.</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #800080; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        Refresh Page
                    </button>
                </div>
            `;
        }
    }
    
    // Open Website - ENHANCED for Stealth Mode
    function openWebsite(website) {
        // Check global maintenance
        if (systemSettings.globalMaintenance) {
            showStatus('System under global maintenance', 'error');
            return;
        }
        
        // Check website-specific maintenance
        if (website.maintenance) {
            showStatus(`${website.name} is under maintenance`, 'error');
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
            
            // Open in STEALTH MODE browser
            openBrowser(website);
            
        } catch (error) {
            console.error('Error in openWebsite:', error);
            showStatus('Failed to open website', 'error');
        }
    }
    
    // Open Browser - STEALTH MODE IMPLEMENTATION
    function openBrowser(website) {
        showLoading(`Opening ${website.name}...`);
        
        const browser = elements['browser-container'];
        const iframe = elements['browser-frame'];
        const title = elements['browser-title'];
        
        if (!browser || !iframe) {
            hideLoading();
            showStatus('Browser not available', 'error');
            return;
        }
        
        // STEALTH MODE: Update browser title without showing URL
        // Only show system name and website name
        if (title) {
            const urlDisplay = title.querySelector('.url-display');
            if (urlDisplay) {
                urlDisplay.textContent = `SHADOW STELLAR - ${website.name}`;
                // Apply stealth styling
                urlDisplay.style.color = 'transparent';
                urlDisplay.style.textShadow = '0 0 12px rgba(255, 255, 255, 0.3)';
                urlDisplay.style.userSelect = 'none';
                urlDisplay.style.cursor = 'default';
            }
        }
        
        // Set iframe sandbox from settings
        try {
            iframe.sandbox.value = systemSettings.defaultSandbox || 'allow-scripts allow-forms allow-popups';
        } catch (e) {
            console.warn('Could not set sandbox, using default');
        }
        
        // Update browser info panel
        updateBrowserInfo(website);
        
        // STEALTH MODE: Set iframe source without URL exposure
        // The URL is never shown to the user
        try {
            iframe.src = website.url;
        } catch (error) {
            console.error('Error setting iframe src:', error);
            showStatus('Invalid website URL', 'error');
            hideLoading();
            return;
        }
        
        // Show browser
        browser.style.display = 'flex';
        
        // Show info panel if available
        if (elements['browser-info']) {
            elements['browser-info'].style.display = 'flex';
        }
        
        // Hide blocked message
        if (elements['frame-blocked']) {
            elements['frame-blocked'].style.display = 'none';
        }
        
        // Add stealth class
        browser.classList.add('stealth-mode-active');
    }
    
    // Update Browser Info Panel - Enhanced
    function updateBrowserInfo(website) {
        try {
            if (elements['info-name']) {
                elements['info-name'].textContent = website.name || 'Unknown';
            }
            if (elements['info-category']) {
                elements['info-category'].textContent = website.category || 'Uncategorized';
            }
            if (elements['info-permissions']) {
                elements['info-permissions'].textContent = 
                    Array.isArray(website.permissions) 
                        ? website.permissions.join(', ') 
                        : 'No special permissions';
            }
            if (elements['info-clicks']) {
                elements['info-clicks'].textContent = website.clickCount || 0;
            }
            
            const status = elements['info-status'];
            if (status) {
                status.className = 'status-indicator';
                if (website.maintenance) {
                    status.classList.add('maintenance');
                    status.title = 'Under Maintenance';
                } else {
                    status.classList.add('active');
                    status.title = 'Active';
                }
            }
        } catch (error) {
            console.warn('Error updating browser info:', error);
        }
    }
    
    // Iframe Load Handler - Enhanced
    function onIframeLoad() {
        hideLoading();
        
        // Update title with stealth mode
        if (currentWebsite && elements['browser-title']) {
            const urlDisplay = elements['browser-title'].querySelector('.url-display');
            if (urlDisplay) {
                // Add subtle animation to hide URL loading
                urlDisplay.style.animation = 'urlStealth 3s infinite';
            }
        }
    }
    
    // Iframe Error Handler - Enhanced
    function onIframeError() {
        hideLoading();
        
        if (elements['frame-blocked']) {
            elements['frame-blocked'].style.display = 'flex';
        }
        
        showStatus('Failed to load website content', 'error');
        
        // Update title to indicate error
        if (elements['browser-title']) {
            const urlDisplay = elements['browser-title'].querySelector('.url-display');
            if (urlDisplay) {
                urlDisplay.textContent = 'SHADOW STELLAR - Access Restricted';
                urlDisplay.style.color = 'rgba(255, 0, 0, 0.7)';
                urlDisplay.style.textShadow = '0 0 10px rgba(255, 0, 0, 0.5)';
            }
        }
    }
    
    // Browser Controls - Enhanced with null safety
    function browserBack() {
        try {
            const iframe = elements['browser-frame'];
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.history.back();
                showStatus('Navigating back', 'info');
            }
        } catch (error) {
            showStatus('Cannot go back', 'error');
        }
    }
    
    function browserForward() {
        try {
            const iframe = elements['browser-frame'];
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.history.forward();
                showStatus('Navigating forward', 'info');
            }
        } catch (error) {
            showStatus('Cannot go forward', 'error');
        }
    }
    
    function browserReload() {
        const iframe = elements['browser-frame'];
        if (iframe) {
            iframe.src = iframe.src;
            showLoading('Reloading...');
            showStatus('Reloading page', 'info');
        }
    }
    
    function browserHome() {
        if (currentWebsite && elements['browser-frame']) {
            elements['browser-frame'].src = currentWebsite.url;
            showLoading('Returning to home...');
            showStatus('Returning to website home', 'info');
        }
    }
    
    function closeBrowser() {
        const browser = elements['browser-container'];
        const iframe = elements['browser-frame'];
        
        if (browser) {
            browser.style.display = 'none';
            browser.classList.remove('stealth-mode-active');
        }
        
        if (iframe) {
            // Clear iframe for security
            iframe.src = 'about:blank';
        }
        
        currentWebsite = null;
        showStatus('Browser closed', 'info');
    }
    
    function openExternal() {
        if (currentWebsite) {
            try {
                window.open(currentWebsite.url, '_blank', 'noopener,noreferrer');
                showStatus('Opened in new tab', 'success');
            } catch (error) {
                showStatus('Cannot open external link', 'error');
            }
        }
    }
    
    // ... (rest of the functions remain the same with enhanced null safety)
    
    // Setup Event Listeners - ENHANCED with error handling
    function setupEventListeners() {
        // Settings button
        if (elements['settings-btn']) {
            elements['settings-btn'].addEventListener('click', toggleSettingsMenu);
        }
        
        // Settings menu items with fallback
        const menuItems = {
            'toggle-descriptions': toggleDescriptions,
            'toggle-mode': toggleDarkMode,
            'export-config': exportConfiguration,
            'import-config': openImportModal,
            'kiosk-mode': toggleKioskMode
        };
        
        Object.entries(menuItems).forEach(([id, handler]) => {
            try {
                const el = document.getElementById(id);
                if (el) {
                    el.addEventListener('click', handler);
                }
            } catch (error) {
                console.warn(`Failed to add listener for ${id}:`, error);
            }
        });
        
        // Browser controls with null safety
        const browserControls = {
            'browser-back': browserBack,
            'browser-forward': browserForward,
            'browser-reload': browserReload,
            'browser-home': browserHome,
            'browser-security': openSecuritySettings,
            'close-browser': closeBrowser,
            'open-external': openExternal,
            'close-info': () => {
                if (elements['browser-info']) {
                    elements['browser-info'].style.display = 'none';
                }
            }
        };
        
        Object.entries(browserControls).forEach(([id, handler]) => {
            try {
                if (elements[id]) {
                    elements[id].addEventListener('click', handler);
                }
            } catch (error) {
                console.warn(`Failed to add browser control for ${id}:`, error);
            }
        });
        
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
        
        // Close settings menu on outside click
        document.addEventListener('click', (e) => {
            const settingsMenu = elements['settings-menu'];
            const settingsBtn = elements['settings-btn'];
            
            if (settingsMenu && settingsMenu.classList.contains('active')) {
                if (!settingsMenu.contains(e.target) && 
                    !settingsBtn.contains(e.target)) {
                    settingsMenu.classList.remove('active');
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
        hideLoading,
        
        // Browser controls (for debugging if needed)
        closeBrowser,
        browserHome
    };
})();

// Initialize on DOM load with enhanced safety
document.addEventListener('DOMContentLoaded', function() {
    // Add loading state
    document.body.classList.add('loading');
    
    setTimeout(function() {
        try {
            SHADOW_STELLAR.init();
            document.body.classList.remove('loading');
            document.body.classList.add('loaded');
        } catch (error) {
            console.error('Fatal error during initialization:', error);
            
            // Enhanced fallback UI
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
                        padding: 30px;
                        font-family: 'Segoe UI', sans-serif;
                        z-index: 10000;
                    ">
                        <div style="max-width: 600px;">
                            <h1 style="color: #ff0000; margin-bottom: 20px; font-size: 2.5rem;">SHADOW STELLAR ERROR</h1>
                            <p style="margin-bottom: 15px; font-size: 1.1rem; color: #ccc;">Critical system error occurred during initialization.</p>
                            <div style="background: rgba(255, 0, 0, 0.1); border-left: 4px solid #ff0000; padding: 15px; margin: 20px 0; text-align: left;">
                                <code style="color: #ff9999; font-family: monospace; font-size: 0.9rem;">${error.message}</code>
                            </div>
                            <div style="display: flex; gap: 15px; margin-top: 30px; flex-wrap: wrap; justify-content: center;">
                                <button onclick="location.reload()" style="
                                    background: linear-gradient(45deg, #ff0000, #800080);
                                    color: white;
                                    border: none;
                                    padding: 12px 25px;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-weight: 600;
                                    font-size: 1rem;
                                    transition: all 0.3s;
                                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(255,0,0,0.3)'"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                                    🔄 Refresh Page
                                </button>
                                <button onclick="localStorage.clear(); location.reload()" style="
                                    background: rgba(255, 255, 255, 0.1);
                                    color: white;
                                    border: 1px solid #800080;
                                    padding: 12px 25px;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-weight: 600;
                                    font-size: 1rem;
                                    transition: all 0.3s;
                                " onmouseover="this.style.background='rgba(128,0,128,0.2)'; this.style.transform='translateY(-2px)'"
                                onmouseout="this.style.background='rgba(255,255,255,0.1)'; this.style.transform='translateY(0)'">
                                    🧹 Clear Data & Refresh
                                </button>
                            </div>
                            <p style="margin-top: 30px; color: #888; font-size: 0.9rem;">
                                If the problem persists, check the browser console (F12) for details.
                            </p>
                        </div>
                    </div>
                `;
            }
        }
    }, 100);
});