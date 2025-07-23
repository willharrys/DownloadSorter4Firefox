/**
 * Download Sorter for Firefox
 * Automatically organizes downloads into folders based on file extensions
 * 
 * @author Will Harrys
 * @version 1.0
 * @license MIT
 */

// Use browser namespace for Firefox compatibility, with chrome fallback
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Production configuration - set DEBUG to false for release builds
const DEBUG = false;
const EXTENSION_NAME = 'Download Sorter';

/**
 * Secure logging function that only logs in debug mode
 * @param {...any} args - Arguments to log
 */
function debugLog(...args) {
    if (DEBUG) {
        console.log(`[${EXTENSION_NAME}]`, new Date().toISOString(), ...args);
    }
}

/**
 * Security-focused input validation utilities
 */
const SecurityUtils = {
    /**
     * Sanitize folder name to prevent path traversal attacks
     * @param {string} folderName - Folder name to sanitize
     * @returns {string} Sanitized folder name
     */
    sanitizeFolderName(folderName) {
        if (typeof folderName !== 'string') return 'downloads';
        
        return folderName
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
            .replace(/\.\./g, '') // Remove directory traversal
            .replace(/^\./, '') // Remove leading dots
            .trim()
            .substring(0, 100) // Limit length
            || 'downloads'; // Fallback to safe default
    },

    /**
     * Validate file extension pattern
     * @param {string} pattern - Extension pattern to validate
     * @returns {boolean} Whether pattern is safe
     */
    isValidExtensionPattern(pattern) {
        if (typeof pattern !== 'string' || pattern.length > 200) return false;
        
        // Only allow alphanumeric, comma, asterisk, period
        return /^[a-zA-Z0-9,.*]+$/.test(pattern);
    },

    /**
     * Validate URL to prevent malicious redirects
     * @param {string} url - URL to validate
     * @returns {boolean} Whether URL is safe
     */
    isValidDownloadUrl(url) {
        try {
            const urlObj = new URL(url);
            // Only allow http/https protocols
            return ['http:', 'https:'].includes(urlObj.protocol);
        } catch {
            return false;
        }
    }
};

debugLog('Background script starting...');

// Default rules configuration
const DEFAULT_RULES = [
    { id: 'default-1', extension: "jpg,jpeg,gif,png,webp,svg", foldername: "images" },
    { id: 'default-2', extension: "zip,7z,tar,gz,rar", foldername: "compression" },
    { id: 'default-3', extension: "exe,msi,dmg,deb", foldername: "executables" },
    { id: 'default-4', extension: "pdf,doc,docx,txt,rtf", foldername: "documents" },
    { id: 'default-5', extension: "mp4,avi,mkv,mov,wmv", foldername: "videos" },
    { id: 'default-6', extension: "mp3,wav,flac,aac,m4a", foldername: "audio" }
];

const DEFAULT_FOLDER = "downloads";

/**
 * Secure storage management with validation and fallback mechanisms
 */
class StorageManager {
    /**
     * Get value from storage with security validation
     * @param {string} key - Storage key
     * @returns {Promise<any>} Stored value or null
     */
    static async get(key) {
        if (typeof key !== 'string' || key.length > 50) {
            debugLog('Invalid storage key:', key);
            return null;
        }

        try {
            // Primary: Use browser.storage.sync for persistent storage
            try {
                const result = await browserAPI.storage.sync.get(key);
                debugLog(`Storage get ${key}:`, result[key] ? 'found' : 'not found');
                return result[key];
            } catch (storageError) {
                debugLog('Browser storage failed, using localStorage fallback:', storageError.message);
                
                // Fallback: Use localStorage for temporary add-ons
                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        return JSON.parse(value);
                    } catch (parseError) {
                        debugLog('Failed to parse localStorage value:', parseError.message);
                        return null;
                    }
                }
                return null;
            }
        } catch (error) {
            debugLog(`Critical error getting ${key} from storage:`, error.message);
            return null;
        }
    }

    /**
     * Set value in storage with validation
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @returns {Promise<boolean>} Success status
     */
    static async set(key, value) {
        if (typeof key !== 'string' || key.length > 50) {
            debugLog('Invalid storage key:', key);
            return false;
        }

        try {
            // Validate value size (Chrome sync storage has 8KB limit per item)
            const serialized = JSON.stringify(value);
            if (serialized.length > 7000) {
                debugLog(`Value too large for key ${key}: ${serialized.length} characters`);
                return false;
            }

            // Primary: Use browser.storage.sync
            try {
                await browserAPI.storage.sync.set({ [key]: value });
                debugLog(`Storage set ${key}: success`);
                return true;
            } catch (storageError) {
                debugLog('Browser storage failed, using localStorage fallback:', storageError.message);
                
                // Fallback: Use localStorage
                localStorage.setItem(key, serialized);
                return true;
            }
        } catch (error) {
            debugLog(`Critical error setting ${key} in storage:`, error.message);
            return false;
        }
    }

    /**
     * Get sanitized default folder
     * @returns {Promise<string>} Default folder name
     */
    static async getDefaultFolder() {
        const folder = await this.get('defaultFolder');
        return SecurityUtils.sanitizeFolderName(folder) || DEFAULT_FOLDER;
    }

    /**
     * Get validated rules array
     * @returns {Promise<Array>} Rules array
     */
    static async getRules() {
        try {
            const rules = await this.get('rules');
            let parsedRules;

            if (typeof rules === 'string') {
                try {
                    parsedRules = JSON.parse(rules);
                } catch (parseError) {
                    debugLog('Failed to parse rules string, using defaults');
                    return DEFAULT_RULES;
                }
            } else {
                parsedRules = rules;
            }

            // Validate rules structure and sanitize
            if (Array.isArray(parsedRules)) {
                return parsedRules
                    .filter(rule => rule && typeof rule === 'object')
                    .map(rule => ({
                        id: String(rule.id || '').substring(0, 50),
                        extension: SecurityUtils.isValidExtensionPattern(rule.extension) ? rule.extension : '',
                        foldername: SecurityUtils.sanitizeFolderName(rule.foldername)
                    }))
                    .filter(rule => rule.extension && rule.foldername);
            }

            return DEFAULT_RULES;
        } catch (error) {
            debugLog('Error getting rules, using defaults:', error.message);
            return DEFAULT_RULES;
        }
    }

    /**
     * Set default folder with validation
     * @param {string} folder - Folder name
     * @returns {Promise<boolean>} Success status
     */
    static async setDefaultFolder(folder) {
        const sanitizedFolder = SecurityUtils.sanitizeFolderName(folder);
        return await this.set('defaultFolder', sanitizedFolder);
    }

    /**
     * Set rules with validation
     * @param {Array} rules - Rules array
     * @returns {Promise<boolean>} Success status
     */
    static async setRules(rules) {
        if (!Array.isArray(rules)) {
            debugLog('Invalid rules format, must be array');
            return false;
        }

        // Validate and sanitize each rule
        const validatedRules = rules
            .filter(rule => rule && typeof rule === 'object')
            .map(rule => ({
                id: String(rule.id || '').substring(0, 50),
                extension: SecurityUtils.isValidExtensionPattern(rule.extension) ? rule.extension : '',
                foldername: SecurityUtils.sanitizeFolderName(rule.foldername)
            }))
            .filter(rule => rule.extension && rule.foldername);

        return await this.set('rules', JSON.stringify(validatedRules));
    }
}

// File matching logic
class FileMatcherService {
    static getFileExtension(filename) {
        if (!filename) return '';
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1) return '';
        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

    static getFilenameFromUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            
            // Remove query parameters and fragments
            const cleanFilename = filename.split('?')[0].split('#')[0];
            return cleanFilename || 'download';
        } catch (error) {
            debugLog('Error parsing URL:', url, error);
            return 'download';
        }
    }

    static isLikelyDownloadableFile(url) {
        const filename = this.getFilenameFromUrl(url);
        const extension = this.getFileExtension(filename);
        
        // Common downloadable file extensions - excluding subtitle/streaming files
        const downloadableExtensions = [
            'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico',
            'mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm',
            'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg',
            'zip', '7z', 'tar', 'gz', 'rar', 'bz2',
            'exe', 'msi', 'dmg', 'deb', 'rpm', 'pkg',
            'xml', 'json', 'csv', 'xls', 'xlsx', 'ppt', 'pptx',
            'iso', 'img', 'bin', 'apk', 'jar'
        ];

        // Extensions that should NOT be auto-downloaded (streaming/subtitle files)
        const excludedExtensions = ['vtt', 'srt', 'ass', 'm3u8', 'ts'];
        
        if (excludedExtensions.includes(extension)) {
            debugLog(`Excluded extension detected: ${extension}, skipping download`);
            return false;
        }
        
        const isDownloadable = extension && downloadableExtensions.includes(extension);
        debugLog(`File extension check: ${filename} -> ${extension} -> downloadable: ${isDownloadable}`);
        return isDownloadable;
    }

    static createRegexPattern(extensionPattern) {
        // Clean and normalize the pattern
        const cleanPattern = extensionPattern.toLowerCase().replace(/\s/g, '');
        
        // Replace commas with regex OR operator
        let regexPattern = cleanPattern.replace(/,/g, '|');
        
        // Handle wildcards
        regexPattern = regexPattern.replace(/\*/g, '[a-z0-9]*');
        
        // Create proper regex with anchors
        const patterns = regexPattern.split('|').map(pattern => `^${pattern}$`);
        return new RegExp(patterns.join('|'));
    }

    static matches(extensionPattern, filename) {
        if (!extensionPattern || !filename) return false;

        const fileExtension = this.getFileExtension(filename);
        if (!fileExtension) return false;

        debugLog(`Matching extension "${fileExtension}" against pattern "${extensionPattern}"`);

        // Handle simple patterns and complex patterns with wildcards/commas
        if (extensionPattern.includes('*') || extensionPattern.includes(',')) {
            try {
                const pattern = this.createRegexPattern(extensionPattern);
                const result = pattern.test(fileExtension);
                debugLog(`Regex match result:`, result);
                return result;
            } catch (error) {
                debugLog('Invalid regex pattern:', extensionPattern, error);
                return false;
            }
        }

        // Simple exact match
        const result = fileExtension === extensionPattern.toLowerCase().trim();
        debugLog(`Exact match result:`, result);
        return result;
    }

    static async determineTargetFolder(url, suggestedFilename) {
        try {
            const rules = await StorageManager.getRules();
            const defaultFolder = await StorageManager.getDefaultFolder();
            
            // Determine filename - prefer suggested, fall back to URL
            const filename = suggestedFilename || this.getFilenameFromUrl(url);
            debugLog('Determining target folder for:', { url, suggestedFilename, filename });

            // Find matching rule
            for (const rule of rules) {
                if (this.matches(rule.extension, filename)) {
                    debugLog(`Matched rule:`, rule);
                    return rule.foldername;
                }
            }

            // No rule matched, use default folder
            debugLog(`No rule matched, using default folder: ${defaultFolder}`);
            return defaultFolder;
        } catch (error) {
            debugLog('Error determining target folder:', error);
            return DEFAULT_FOLDER;
        }
    }
}

// Enhanced download interception using multiple detection methods
class DownloadInterceptor {
    static pendingDownloads = new Set();
    static interceptedUrls = new Set();

    static init() {
        debugLog('Initializing enhanced download interceptor...');
        
        // Check if webRequest API is available
        if (!browserAPI.webRequest) {
            debugLog('ERROR: webRequest API not available');
            return;
        }

        // Listen for main frame requests to detect direct file navigation
        browserAPI.webRequest.onBeforeRequest.addListener(
            this.handleMainFrameRequest.bind(this),
            {
                urls: ["<all_urls>"],
                types: ["main_frame"]
            },
            ["blocking"]
        );

        // Also listen for response headers to detect downloads via Content-Disposition
        // Only listen for main_frame to avoid intercepting background requests
        browserAPI.webRequest.onHeadersReceived.addListener(
            this.handleResponse.bind(this),
            {
                urls: ["<all_urls>"],
                types: ["main_frame"]
            },
            ["blocking", "responseHeaders"]
        );

        debugLog('Enhanced download interceptor initialized');
    }

    static async handleMainFrameRequest(details) {
        try {
            const url = details.url;
            debugLog('Main frame request intercepted:', url);
            
            // Only intercept if this is a CLEAR direct file download
            // Must be a simple URL without complex query params or analytics tracking
            if (this.isUserInitiatedDownload(url)) {
                debugLog('Detected user-initiated direct file download:', url);
                
                // Prevent duplicate handling
                if (this.interceptedUrls.has(url)) {
                    debugLog('URL already intercepted, skipping:', url);
                    return {};
                }
                
                this.interceptedUrls.add(url);
                
                // Cancel the navigation and start our controlled download
                setTimeout(async () => {
                    await this.initiateControlledDownload(url, null);
                    // Clean up after a delay
                    setTimeout(() => this.interceptedUrls.delete(url), 5000);
                }, 0);
                
                return { cancel: true };
            }
        } catch (error) {
            debugLog('Error handling main frame request:', error);
        }
        
        return {};
    }

    static isUserInitiatedDownload(url) {
        try {
            // Don't intercept tracking/analytics/ad URLs
            if (this.isTrackingOrAnalyticsUrl(url)) {
                return false;
            }

            // Only consider simple, direct file URLs
            if (!FileMatcherService.isLikelyDownloadableFile(url)) {
                return false;
            }

            // Additional checks for user intent
            const urlObj = new URL(url);
            
            // Skip URLs with complex tracking parameters
            const suspiciousParams = ['utm_', 'gclid', 'fbclid', '_ga', 'mc_', 'tracking', 'analytics'];
            const hasTrackingParams = suspiciousParams.some(param => 
                urlObj.search.includes(param)
            );
            
            if (hasTrackingParams) {
                debugLog('Skipping URL with tracking parameters:', url);
                return false;
            }

            // Only intercept if the URL path looks like a direct file
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop();
            const extension = FileMatcherService.getFileExtension(filename);
            
            // Must have a clear file extension and simple path
            return extension && filename.length > 3 && !pathname.includes('/ad/') && !pathname.includes('/track');
            
        } catch (error) {
            debugLog('Error checking user initiated download:', error);
            return false;
        }
    }

    static isTrackingOrAnalyticsUrl(url) {
        const trackingDomains = [
            'google-analytics.com',
            'googletagmanager.com',
            'googlesyndication.com',
            'doubleclick.net',
            'criteo.com',
            'facebook.com',
            'fbcdn.net',
            'media.net',
            'ezoic',
            'rubiconproject.com',
            'openx.net',
            'yieldmo.com',
            '3lift.com',
            'amazon-adsystem.com',
            'dnacdn.net',
            'onetag-sys.com',
            'token.rubiconproject.com',
            'eb2.3lift.com',
            'hbx.media.net',
            'gum.criteo.com',
            'ag.gbc.criteo.com',
            'gem.gbc.criteo.com',
            'securepubads.g.doubleclick.net',
            'pagead2.googlesyndication.com',
            'go.ezodn.com'
        ];

        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.toLowerCase();
            
            return trackingDomains.some(domain => 
                hostname.includes(domain) || hostname.endsWith('.' + domain)
            );
        } catch (error) {
            return false;
        }
    }

    static async handleResponse(details) {
        try {
            const headers = details.responseHeaders || [];
            debugLog('Response headers intercepted for:', details.url);
            
            // Don't intercept tracking/analytics URLs
            if (this.isTrackingOrAnalyticsUrl(details.url)) {
                return {};
            }
            
            // Check if this is a download based on Content-Disposition header
            let isDownload = false;
            let filename = null;
            
            for (const header of headers) {
                if (header.name.toLowerCase() === 'content-disposition') {
                    const headerValue = header.value.toLowerCase();
                    debugLog('Content-Disposition found:', header.value);
                    
                    // Only intercept if it's explicitly marked as attachment
                    if (headerValue.includes('attachment')) {
                        isDownload = true;
                        
                        // Extract filename from Content-Disposition
                        const match = header.value.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                        if (match && match[1]) {
                            filename = match[1].replace(/['"]/g, '');
                            debugLog('Extracted filename:', filename);
                        }
                        break;
                    } else {
                        debugLog('Content-Disposition found but not attachment, skipping:', header.value);
                    }
                }
            }

            // If it's a download via Content-Disposition attachment, try to redirect it
            if (isDownload && !this.interceptedUrls.has(details.url)) {
                debugLog('Download detected via Content-Disposition attachment!', { url: details.url, filename });
                
                this.interceptedUrls.add(details.url);
                
                // Cancel the original request and start our own download
                setTimeout(async () => {
                    await this.initiateControlledDownload(details.url, filename);
                    // Clean up after a delay
                    setTimeout(() => this.interceptedUrls.delete(details.url), 5000);
                }, 0);
                
                return { cancel: true };
            }

        } catch (error) {
            debugLog('Error handling response:', error);
        }
        
        return {};
    }

    /**
     * Securely initiate a controlled download with validation
     * @param {string} url - Download URL
     * @param {string|null} suggestedFilename - Optional filename
     * @returns {Promise<number|null>} Download ID or null on failure
     */
    static async initiateControlledDownload(url, suggestedFilename) {
        try {
            // Security: Validate URL before processing
            if (!SecurityUtils.isValidDownloadUrl(url)) {
                debugLog('Invalid or unsafe download URL rejected:', url);
                return null;
            }

            debugLog('Initiating controlled download:', { url: url.substring(0, 100) + '...', suggestedFilename });
            
            // Performance: Prevent duplicate downloads with timeout-based cleanup
            const downloadKey = url + (suggestedFilename || '');
            if (this.pendingDownloads.has(downloadKey)) {
                debugLog('Download already pending, skipping duplicate');
                return null;
            }
            
            this.pendingDownloads.add(downloadKey);
            
            // Get target folder and sanitize filename
            const targetFolder = await FileMatcherService.determineTargetFolder(url, suggestedFilename);
            const rawFilename = suggestedFilename || FileMatcherService.getFilenameFromUrl(url);
            const sanitizedFilename = SecurityUtils.sanitizeFolderName(rawFilename) || 'download';
            const targetPath = `${targetFolder}/${sanitizedFilename}`;
            
            debugLog('Download target path:', targetPath);

            // Use downloads API with security options
            const downloadOptions = {
                url: url,
                filename: targetPath,
                conflictAction: 'uniquify'
            };

            const downloadId = await browserAPI.downloads.download(downloadOptions);
            debugLog('Controlled download started with ID:', downloadId);
            
            // Performance: Clean up pending downloads after reasonable timeout
            setTimeout(() => {
                this.pendingDownloads.delete(downloadKey);
            }, 30000); // 30 second timeout

            return downloadId;

        } catch (error) {
            debugLog('Error initiating controlled download:', error.message);
            
            // Clean up on error
            const downloadKey = url + (suggestedFilename || '');
            this.pendingDownloads.delete(downloadKey);
            return null;
        }
    }
}

// Monitor downloads that happen outside our control
class DownloadMonitor {
    static init() {
        debugLog('Initializing download monitor...');

        if (!browserAPI.downloads || !browserAPI.downloads.onCreated) {
            debugLog('ERROR: downloads API not available');
            return;
        }

        // Monitor new downloads
        browserAPI.downloads.onCreated.addListener(this.handleDownloadCreated.bind(this));
        
        // Monitor download changes
        if (browserAPI.downloads.onChanged) {
            browserAPI.downloads.onChanged.addListener(this.handleDownloadChanged.bind(this));
        }

        debugLog('Download monitor initialized');
    }

    static async handleDownloadCreated(downloadItem) {
        debugLog('Download created:', downloadItem);
        
        // Check if this download was organized by us
        const filename = downloadItem.filename;
        const hasSubfolder = filename.includes('/') || filename.includes('\\');
        
        if (!hasSubfolder) {
            debugLog('Unorganized download detected:', filename);
            
            // Try to organize it after the fact
            await this.organizeExistingDownload(downloadItem);
        } else {
            debugLog('Download appears to be organized:', filename);
        }
    }

    static async organizeExistingDownload(downloadItem) {
        try {
            debugLog('Attempting to organize existing download:', downloadItem);
            
            const targetFolder = await FileMatcherService.determineTargetFolder(downloadItem.url, downloadItem.filename);
            const currentFilename = downloadItem.filename.split(/[/\\]/).pop(); // Get just the filename
            const newPath = `${targetFolder}/${currentFilename}`;
            
            if (targetFolder !== DEFAULT_FOLDER) {
                debugLog('Should move download to:', newPath);
                
                // Cancel the current download and restart with proper path
                try {
                    await browserAPI.downloads.cancel(downloadItem.id);
                    debugLog('Cancelled original download, restarting with organized path');
                    
                    const newDownloadId = await browserAPI.downloads.download({
                        url: downloadItem.url,
                        filename: newPath,
                        conflictAction: 'uniquify'
                    });
                    
                    debugLog('Restarted download with ID:', newDownloadId);
                } catch (error) {
                    debugLog('Error reorganizing download:', error);
                }
            }
        } catch (error) {
            debugLog('Error organizing existing download:', error);
        }
    }

    static handleDownloadChanged(downloadDelta) {
        debugLog('Download changed:', downloadDelta);
        
        if (downloadDelta.state && downloadDelta.state.current === 'complete') {
            debugLog(`Download ${downloadDelta.id} completed`);
        }
        
        if (downloadDelta.error) {
            debugLog(`Download ${downloadDelta.id} error:`, downloadDelta.error);
        }
    }
}

// Check API availability and provide fallback
function checkApiAvailability() {
    debugLog('Checking API availability...');
    
    const apis = {
        'downloads': !!browserAPI.downloads,
        'downloads.download': !!(browserAPI.downloads && browserAPI.downloads.download),
        'downloads.onCreated': !!(browserAPI.downloads && browserAPI.downloads.onCreated),
        'downloads.onDeterminingFilename': !!(browserAPI.downloads && browserAPI.downloads.onDeterminingFilename),
        'webRequest': !!browserAPI.webRequest,
        'webRequest.onBeforeRequest': !!(browserAPI.webRequest && browserAPI.webRequest.onBeforeRequest),
        'webRequest.onHeadersReceived': !!(browserAPI.webRequest && browserAPI.webRequest.onHeadersReceived),
        'storage': !!browserAPI.storage,
        'storage.sync': !!(browserAPI.storage && browserAPI.storage.sync),
    };

    debugLog('API availability:', apis);
    return apis;
}

// Initialization
async function initialize() {
    debugLog('=== Download Sorter Extension Starting ===');
    
    // Check what APIs are available
    const apiAvailability = checkApiAvailability();
    
    // Initialize storage with defaults
    try {
        const currentFolder = await StorageManager.getDefaultFolder();
        const currentRules = await StorageManager.getRules();
        
        debugLog('Current settings:', {
            defaultFolder: currentFolder,
            rulesCount: currentRules.length
        });

        // If no rules exist, set defaults
        if (!currentRules || currentRules.length === 0) {
            await StorageManager.setRules(DEFAULT_RULES);
            debugLog('Default rules set');
        }

        if (!currentFolder) {
            await StorageManager.setDefaultFolder(DEFAULT_FOLDER);
            debugLog('Default folder set');
        }

    } catch (error) {
        debugLog('Error initializing storage:', error);
    }

    // Try to set up download interception
    if (apiAvailability['webRequest.onBeforeRequest'] && apiAvailability['webRequest.onHeadersReceived']) {
        debugLog('Setting up enhanced webRequest-based download interception...');
        DownloadInterceptor.init();
    } else {
        debugLog('webRequest API not available, cannot intercept downloads');
    }

    // Set up download monitoring
    if (apiAvailability['downloads.onCreated']) {
        debugLog('Setting up download monitoring...');
        DownloadMonitor.init();
    } else {
        debugLog('downloads API not available, cannot monitor downloads');
    }

    debugLog('=== Download Sorter Extension Initialized ===');
}

// Extension lifecycle events
browserAPI.runtime.onInstalled.addListener(async (details) => {
    debugLog('Extension installed/updated:', details);
    
    try {
        if (details.reason === 'install') {
            debugLog('First install - setting up defaults');
            await StorageManager.setDefaultFolder(DEFAULT_FOLDER);
            await StorageManager.setRules(DEFAULT_RULES);
            
            // Open options page
            if (browserAPI.tabs && browserAPI.tabs.create) {
                browserAPI.tabs.create({ url: 'options.html' });
            }
        } else if (details.reason === 'update') {
            debugLog('Extension updated');
        }
    } catch (error) {
        debugLog('Error during installation:', error);
    }
});

browserAPI.runtime.onStartup.addListener(() => {
    debugLog('Browser startup detected');
    initialize();
});

// Start initialization
initialize().catch(error => {
    debugLog('Initialization failed:', error);
});

debugLog('Background script loaded');
