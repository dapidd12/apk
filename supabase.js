// supabase.js - Supabase Migration Helper
const SUPABASE_MIGRATION = (function() {
    // Supabase configuration (sesuaikan dengan project Anda)
    const SUPABASE_CONFIG = {
        url: 'https://mivweeseoqutfcfcxepf.supabase.co',
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdndlZXNlb3F1dGZjZmN4ZXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMTE3NjYsImV4cCI6MjA4MzY4Nzc2Nn0.JsjFC9-Ry-jb427TWLn4xGTRaFN6TEG8GTn1eEZjwUE'
    };

    let supabase = null;

    // Initialize Supabase client
    function initClient() {
        if (!window.supabase) {
            console.error('Supabase library not loaded');
            return null;
        }
        
        if (!supabase) {
            supabase = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey
            );
        }
        return supabase;
    }

    // Hash password using SHA-256
    async function hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Generate random code
    function generateRandomCode(length) {
        const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        return code;
    }

    // Test database connection
    async function testConnection() {
        try {
            const client = initClient();
            if (!client) {
                return { success: false, message: 'Supabase client not initialized' };
            }

            const { data, error } = await client
                .from('websites')
                .select('count')
                .limit(1);

            if (error) {
                console.error('Connection test error:', error);
                return { success: false, message: error.message };
            }

            return { success: true, message: 'Database connected successfully' };
        } catch (error) {
            console.error('Connection test failed:', error);
            return { success: false, message: error.message };
        }
    }

    // Check if tables exist and create if needed
    async function checkAndCreateTables() {
        try {
            const client = initClient();
            if (!client) {
                return { success: false, message: 'Supabase client not initialized' };
            }

            console.log('🔍 Checking database tables...');

            // Check websites table
            const { error: websitesError } = await client
                .from('websites')
                .select('id')
                .limit(1);

            if (websitesError && websitesError.message.includes('does not exist')) {
                console.log('⚠️  Tables not found. Please run the SQL schema first.');
                return { 
                    success: false, 
                    message: 'Database tables not found. Please run the SQL schema in Supabase SQL Editor.' 
                };
            }

            console.log('✅ All tables exist');
            return { success: true, message: 'Database ready' };
        } catch (error) {
            console.error('❌ Error checking tables:', error);
            return { success: false, message: error.message };
        }
    }

    // Migrate data from localStorage to Supabase
    async function migrateFromLocalStorage() {
        try {
            console.log('🚀 Starting migration from localStorage to Supabase...');
            
            const client = initClient();
            if (!client) {
                return { success: false, message: 'Supabase client not initialized' };
            }

            // Check if Supabase already has data
            const { data: existingWebsites, error: checkError } = await client
                .from('websites')
                .select('id')
                .limit(1);

            if (checkError) throw checkError;

            // If Supabase already has data, skip migration
            if (existingWebsites && existingWebsites.length > 0) {
                console.log('✅ Supabase already has data, skipping migration');
                return { 
                    success: true, 
                    migrated: false,
                    message: 'Database already contains data' 
                };
            }

            console.log('📦 Migrating data from localStorage...');

            // Get data from localStorage
            const savedWebsites = localStorage.getItem('shadow_stellar_websites');
            const savedAdmins = localStorage.getItem('shadow_stellar_admins');
            const savedSettings = localStorage.getItem('shadow_stellar_settings');

            let migratedCount = 0;

            // Migrate websites
            if (savedWebsites) {
                const websitesData = JSON.parse(savedWebsites);
                console.log(`📋 Found ${websitesData.length} websites to migrate`);

                for (const website of websitesData) {
                    const { error } = await client
                        .from('websites')
                        .insert({
                            name: website.name,
                            url: website.url,
                            icon: website.icon || 'fas fa-globe',
                            description: website.description,
                            category: website.category || 'portal',
                            permissions: website.permissions || ['allow-scripts', 'allow-forms'],
                            click_count: website.clickCount || 0,
                            maintenance: website.maintenance || false,
                            maintenance_message: website.maintenanceMessage || '',
                            created_at: new Date().toISOString()
                        });

                    if (error) {
                        console.error(`❌ Error migrating website ${website.name}:`, error);
                    } else {
                        migratedCount++;
                    }
                }
                console.log(`✅ Migrated ${migratedCount} websites`);
            }

            // Migrate admin accounts
            if (savedAdmins) {
                const adminsData = JSON.parse(savedAdmins);
                console.log(`👥 Found ${adminsData.length} admins to migrate`);

                for (const admin of adminsData) {
                    // Use existing hash or create new one
                    let passwordHash = admin.passwordHash;
                    if (!passwordHash) {
                        // Generate default password based on username
                        const defaultPassword = admin.username === 'admin' ? 'admin123' : 'super123';
                        passwordHash = await hashPassword(defaultPassword);
                    }

                    const { error } = await client
                        .from('admins')
                        .insert({
                            username: admin.username,
                            password_hash: passwordHash,
                            role: admin.role || 'admin',
                            created_at: new Date().toISOString(),
                            last_login: admin.lastLogin || null
                        });

                    if (error) {
                        console.error(`❌ Error migrating admin ${admin.username}:`, error);
                    } else {
                        console.log(`✅ Migrated admin: ${admin.username}`);
                    }
                }
            }

            // Migrate system settings
            if (savedSettings) {
                const settingsData = JSON.parse(savedSettings);
                console.log('⚙️  Migrating system settings...');

                const settingsToSave = [
                    { key: 'systemName', value: settingsData.systemName || 'SHADOW STELLAR' },
                    { key: 'tagline', value: settingsData.tagline || 'Silent. Secure. Stellar.' },
                    { key: 'developerCode', value: settingsData.developerCode || generateRandomCode(6) },
                    { key: 'codeLength', value: settingsData.codeLength || 6 },
                    { key: 'maxLoginAttempts', value: settingsData.maxLoginAttempts || 3 },
                    { key: 'lockoutTime', value: settingsData.lockoutTime || 10 },
                    { key: 'sessionTimeout', value: settingsData.sessionTimeout || 30 },
                    { key: 'idleTimeout', value: settingsData.idleTimeout || 15 },
                    { key: 'rememberMeDays', value: settingsData.rememberMeDays || 30 },
                    { key: 'globalMaintenance', value: settingsData.globalMaintenance || false },
                    { key: 'maintenanceMessage', value: settingsData.maintenanceMessage || 'SHADOW STELLAR sedang dalam pemeliharaan sistem.' },
                    { key: 'defaultSandbox', value: settingsData.defaultSandbox || 'allow-scripts allow-forms allow-popups' },
                    { key: 'blockMixedContent', value: settingsData.blockMixedContent !== undefined ? settingsData.blockMixedContent : true },
                    { key: 'disableWebGL', value: settingsData.disableWebGL !== undefined ? settingsData.disableWebGL : true },
                    { key: 'darkMode', value: settingsData.darkMode !== undefined ? settingsData.darkMode : true },
                    { key: 'showDescriptions', value: settingsData.showDescriptions !== undefined ? settingsData.showDescriptions : true }
                ];

                for (const setting of settingsToSave) {
                    const { error } = await client
                        .from('system_settings')
                        .insert({
                            key: setting.key,
                            value: setting.value,
                            created_at: new Date().toISOString()
                        });

                    if (error) {
                        console.error(`❌ Error migrating setting ${setting.key}:`, error);
                    }
                }
                console.log(`✅ Migrated ${settingsToSave.length} settings`);
            }

            // Clear localStorage after successful migration
            localStorage.removeItem('shadow_stellar_websites');
            localStorage.removeItem('shadow_stellar_admins');
            localStorage.removeItem('shadow_stellar_settings');

            console.log('🎉 Migration completed successfully!');
            return { 
                success: true, 
                migrated: true,
                message: `Migrated ${migratedCount} items successfully` 
            };

        } catch (error) {
            console.error('❌ Migration failed:', error);
            return { 
                success: false, 
                migrated: false,
                message: `Migration failed: ${error.message}` 
            };
        }
    }

    // Get migration status
    async function getMigrationStatus() {
        try {
            const client = initClient();
            if (!client) {
                return { hasData: false, canMigrate: false };
            }

            // Check if Supabase has data
            const { data: websites, error } = await client
                .from('websites')
                .select('id')
                .limit(1);

            if (error) {
                return { hasData: false, canMigrate: false, error: error.message };
            }

            const hasDataInSupabase = websites && websites.length > 0;
            const hasDataInLocalStorage = !!localStorage.getItem('shadow_stellar_websites');

            return {
                hasDataInSupabase,
                hasDataInLocalStorage,
                canMigrate: hasDataInLocalStorage && !hasDataInSupabase
            };
        } catch (error) {
            return { 
                hasData: false, 
                canMigrate: false, 
                error: error.message 
            };
        }
    }

    // Export public API
    return {
        // Configuration
        config: SUPABASE_CONFIG,
        
        // Core functions
        initClient,
        testConnection,
        checkAndCreateTables,
        
        // Migration functions
        migrateFromLocalStorage,
        getMigrationStatus,
        
        // Helper functions
        hashPassword,
        generateRandomCode
    };
})();

// Make available globally
window.SUPABASE_MIGRATION = SUPABASE_MIGRATION;