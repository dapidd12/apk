// supabase.js - Supabase Configuration and Client
const SUPABASE_CONFIG = {
    url: 'https://mivweeseoqutfcfcxepf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdndlZXNlb3F1dGZjZmN4ZXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMTE3NjYsImV4cCI6MjA4MzY4Nzc2Nn0.JsjFC9-Ry-jb427TWLn4xGTRaFN6TEG8GTn1eEZjwUE'
};

// Inisialisasi Supabase Client
const supabaseClient = (function() {
    let supabase = null;
    
    function init() {
        if (typeof supabase === 'undefined') {
            console.log('🚀 Initializing Supabase client...');
            supabase = supabaseJs.createClient(SUPABASE_CONFIG.url, SUPABASE_ANON_KEY);
        }
        return supabase;
    }
    
    return {
        getClient: function() {
            if (!supabase) {
                return init();
            }
            return supabase;
        },
        
        // Test connection
        testConnection: async function() {
            try {
                const client = this.getClient();
                const { data, error } = await client
                    .from('websites')
                    .select('count')
                    .limit(1);
                
                if (error) throw error;
                return { success: true, message: 'Supabase connected successfully' };
            } catch (error) {
                console.error('❌ Supabase connection error:', error);
                return { success: false, message: error.message };
            }
        },
        
        // Migration function
        migrateFromLocalStorage: async function() {
            try {
                console.log('🚀 Starting migration from localStorage to Supabase...');
                
                // Check if Supabase tables are empty
                const { data: websites } = await this.getClient()
                    .from('websites')
                    .select('id')
                    .limit(1);
                
                // If Supabase already has data, skip migration
                if (websites && websites.length > 0) {
                    console.log('✅ Supabase already has data, skipping migration');
                    return { success: true, migrated: false };
                }
                
                // Get data from localStorage
                const savedWebsites = localStorage.getItem('shadow_stellar_websites');
                const savedAdmins = localStorage.getItem('shadow_stellar_admins');
                const savedSettings = localStorage.getItem('shadow_stellar_settings');
                
                // Migrate websites
                if (savedWebsites) {
                    const websitesData = JSON.parse(savedWebsites);
                    for (const website of websitesData) {
                        const { error } = await this.getClient()
                            .from('websites')
                            .insert({
                                name: website.name,
                                url: website.url,
                                icon: website.icon,
                                description: website.description,
                                category: website.category,
                                permissions: website.permissions,
                                click_count: website.clickCount || 0,
                                maintenance: website.maintenance || false,
                                maintenance_message: website.maintenanceMessage || ''
                            });
                        
                        if (error) throw error;
                    }
                    console.log(`✅ Migrated ${websitesData.length} websites`);
                }
                
                // Migrate admins
                if (savedAdmins) {
                    const adminsData = JSON.parse(savedAdmins);
                    for (const admin of adminsData) {
                        const { error } = await this.getClient()
                            .from('admins')
                            .insert({
                                username: admin.username,
                                password_hash: admin.passwordHash || '',
                                role: admin.role || 'admin',
                                last_login: admin.lastLogin || null
                            });
                        
                        if (error) throw error;
                    }
                    console.log(`✅ Migrated ${adminsData.length} admins`);
                }
                
                // Migrate settings
                if (savedSettings) {
                    const settingsData = JSON.parse(savedSettings);
                    const settings = [
                        { key: 'globalMaintenance', value: settingsData.globalMaintenance || false },
                        { key: 'maintenanceMessage', value: settingsData.maintenanceMessage || 'SHADOW STELLAR sedang dalam pemeliharaan sistem.' },
                        { key: 'maintenanceCountdown', value: settingsData.maintenanceCountdown || null },
                        { key: 'defaultSandbox', value: settingsData.defaultSandbox || 'allow-scripts allow-forms allow-popups' },
                        { key: 'sessionTimeout', value: settingsData.sessionTimeout || 30 },
                        { key: 'idleTimeout', value: settingsData.idleTimeout || 15 },
                        { key: 'maxLoginAttempts', value: settingsData.maxLoginAttempts || 3 },
                        { key: 'lockoutTime', value: settingsData.lockoutTime || 10 },
                        { key: 'systemName', value: settingsData.systemName || 'SHADOW STELLAR' },
                        { key: 'tagline', value: settingsData.tagline || 'Silent. Secure. Stellar.' },
                        { key: 'developerCode', value: settingsData.developerCode || generateRandomCode(6) },
                        { key: 'codeLength', value: settingsData.codeLength || 6 },
                        { key: 'darkMode', value: settingsData.darkMode || true },
                        { key: 'showDescriptions', value: settingsData.showDescriptions || true },
                        { key: 'blockMixedContent', value: settingsData.blockMixedContent || true },
                        { key: 'disableWebGL', value: settingsData.disableWebGL || true },
                        { key: 'rememberMeDays', value: settingsData.rememberMeDays || 30 }
                    ];
                    
                    for (const setting of settings) {
                        const { error } = await this.getClient()
                            .from('system_settings')
                            .insert({
                                key: setting.key,
                                value: setting.value
                            });
                        
                        if (error) throw error;
                    }
                    console.log(`✅ Migrated ${settings.length} settings`);
                }
                
                console.log('✅ Migration completed successfully');
                return { success: true, migrated: true };
                
            } catch (error) {
                console.error('❌ Migration failed:', error);
                return { success: false, message: error.message };
            }
        }
    };
})();

// Helper function to generate random code (used in migration)
function generateRandomCode(length) {
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// Export
window.SUPABASE = supabaseClient;