/**
 * Download Sorter Options Page
 * User interface for configuring download sorting rules
 * 
 * @author Will Harrys
 * @version 1.0
 * @license MIT
 */

// Use browser namespace for Firefox compatibility, with chrome fallback
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Production configuration - set DEBUG to false for release builds
const DEBUG = false;
const EXTENSION_NAME = 'Download Sorter Options';

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
 * Input validation and security utilities for options page
 */
const OptionsSecurityUtils = {
    /**
     * Sanitize folder name input
     * @param {string} folderName - User input folder name
     * @returns {string} Sanitized folder name
     */
    sanitizeFolderName(folderName) {
        if (typeof folderName !== 'string') return '';
        
        return folderName
            .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
            .replace(/\.\./g, '') // Remove directory traversal
            .replace(/^\./, '') // Remove leading dots
            .trim()
            .substring(0, 100); // Limit length
    },

    /**
     * Validate file extension pattern
     * @param {string} pattern - Extension pattern to validate
     * @returns {boolean} Whether pattern is safe
     */
    isValidExtensionPattern(pattern) {
        if (typeof pattern !== 'string' || pattern.length > 200) return false;
        
        // Only allow alphanumeric, comma, asterisk, period
        return /^[a-zA-Z0-9,.*\s]+$/.test(pattern);
    },

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

class OptionsManager {
    constructor() {
        this.rules = [];
        this.defaultFolder = 'downloads';
        this.ruleCounter = 1;
        debugLog('OptionsManager created');
        this.init();
    }

    async init() {
        debugLog('Initializing options manager...');
        await this.loadFromStorage();
        this.renderRules();
        this.setupEventListeners();
        debugLog('Options manager initialized');
    }

    async loadFromStorage() {
        try {
            const result = await browserAPI.storage.sync.get(['rules', 'defaultFolder']);
            debugLog('Loaded from storage:', result);
            
            // Parse rules if they're stored as a string
            let rules = result.rules || this.getDefaultRules();
            if (typeof rules === 'string') {
                try {
                    rules = JSON.parse(rules);
                } catch (parseError) {
                    debugLog('Error parsing rules, using defaults:', parseError);
                    rules = this.getDefaultRules();
                }
            }
            
            this.rules = Array.isArray(rules) ? rules : this.getDefaultRules();
            this.defaultFolder = result.defaultFolder || 'downloads';
            
            // Update UI
            const defaultFolderInput = document.getElementById('defaultFolder');
            if (defaultFolderInput) {
                defaultFolderInput.value = this.defaultFolder;
            }
        } catch (error) {
            debugLog('Error loading from storage:', error);
            this.rules = this.getDefaultRules();
            this.defaultFolder = 'downloads';
        }
    }

    /**
     * Save settings to storage with validation and security checks
     * @returns {Promise<void>}
     */
    async saveToStorage() {
        try {
            // Get and sanitize default folder value
            const defaultFolderInput = document.getElementById('defaultFolder');
            if (defaultFolderInput) {
                const rawFolder = defaultFolderInput.value.trim();
                this.defaultFolder = OptionsSecurityUtils.sanitizeFolderName(rawFolder) || 'downloads';
                
                // Update input to show sanitized value
                if (this.defaultFolder !== rawFolder) {
                    defaultFolderInput.value = this.defaultFolder;
                }
            }

            // Get and validate rules from the DOM
            this.rules = [];
            const ruleElements = document.querySelectorAll('.rule-item');
            
            ruleElements.forEach((element, index) => {
                const extensionInput = element.querySelector('.rule-extension');
                const folderInput = element.querySelector('.rule-folder');
                
                if (extensionInput && folderInput) {
                    const rawExtension = extensionInput.value.trim();
                    const rawFolder = folderInput.value.trim();
                    
                    // Validate and sanitize inputs
                    if (rawExtension && rawFolder && 
                        OptionsSecurityUtils.isValidExtensionPattern(rawExtension)) {
                        
                        const sanitizedFolder = OptionsSecurityUtils.sanitizeFolderName(rawFolder);
                        
                        if (sanitizedFolder) {
                            this.rules.push({
                                id: 'rule-' + (index + 1),
                                extension: rawExtension.toLowerCase(),
                                foldername: sanitizedFolder
                            });
                            
                            // Update inputs to show sanitized values
                            if (folderInput.value !== sanitizedFolder) {
                                folderInput.value = sanitizedFolder;
                            }
                        }
                    } else if (rawExtension && !OptionsSecurityUtils.isValidExtensionPattern(rawExtension)) {
                        // Highlight invalid extension pattern
                        extensionInput.style.borderColor = '#e74c3c';
                        setTimeout(() => {
                            extensionInput.style.borderColor = '';
                        }, 3000);
                    }
                }
            });

            // Save to storage using browser API
            await browserAPI.storage.sync.set({
                rules: this.rules,
                defaultFolder: this.defaultFolder
            });
            
            debugLog('Settings saved:', { rulesCount: this.rules.length, defaultFolder: this.defaultFolder });
            this.showNotification('Settings saved successfully!', 'success');
            
        } catch (error) {
            debugLog('Error saving to storage:', error.message);
            this.showNotification('Error saving settings. Please try again.', 'error');
        }
    }

    getDefaultRules() {
        return [
            { id: 'default-1', extension: "jpg,jpeg,gif,png,webp,svg", foldername: "images" },
            { id: 'default-2', extension: "zip,7z,tar,gz,rar", foldername: "compression" },
            { id: 'default-3', extension: "exe,msi,dmg,deb", foldername: "executables" },
            { id: 'default-4', extension: "pdf,doc,docx,txt,rtf", foldername: "documents" },
            { id: 'default-5', extension: "mp4,avi,mkv,mov,wmv", foldername: "videos" },
            { id: 'default-6', extension: "mp3,wav,flac,aac,m4a", foldername: "audio" }
        ];
    }

    setupEventListeners() {
        debugLog('Setting up event listeners...');
        
        // Add rule button
        const addRuleBtn = document.getElementById('addRule');
        if (addRuleBtn) {
            addRuleBtn.addEventListener('click', () => {
                debugLog('Add rule button clicked');
                this.addRule();
            });
        }

        // Save button
        const saveBtn = document.getElementById('saveSettings');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                debugLog('Save button clicked');
                this.saveToStorage();
            });
        }

        // Reset button
        const resetBtn = document.getElementById('resetSettings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                debugLog('Reset button clicked');
                this.resetToDefaults();
            });
        }

        // File type presets
        this.setupPresetEventListeners();

        // Custom extension input
        const customExtensionBtn = document.getElementById('addCustomExtension');
        if (customExtensionBtn) {
            customExtensionBtn.addEventListener('click', () => {
                const input = document.getElementById('customExtensionInput');
                if (input && input.value.trim()) {
                    const extensions = input.value.trim();
                    const folderName = this.suggestFolderName(extensions);
                    debugLog('Custom extension rule added:', extensions);
                    this.addRule(extensions, folderName);
                    input.value = '';
                }
            });
        }

        // Allow Enter key in custom extension input
        const customExtensionInput = document.getElementById('customExtensionInput');
        if (customExtensionInput) {
            customExtensionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    customExtensionBtn.click();
                }
            });
        }
        
        debugLog('Event listeners set up');
    }

    addRule(extensionValue = '', foldernameValue = '') {
        const container = document.getElementById('rulesContainer');
        if (!container) return;

        const ruleElement = this.createRuleElement(extensionValue, foldernameValue);
        container.appendChild(ruleElement);
        
        debugLog('Rule added:', { extension: extensionValue, folder: foldernameValue });
    }

    createRuleElement(extensionValue, foldernameValue) {
        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'rule-item';
        
        ruleDiv.innerHTML = `
            <input type="text" class="rule-extension" placeholder="e.g., pdf,doc,txt" value="${extensionValue}">
            <input type="text" class="rule-folder" placeholder="e.g., documents" value="${foldernameValue}">
            <button type="button" class="btn btn-danger remove-rule">Remove</button>
        `;

        // Add remove functionality
        const removeBtn = ruleDiv.querySelector('.remove-rule');
        removeBtn.addEventListener('click', () => {
            ruleDiv.remove();
            debugLog('Rule removed');
        });

        // Add drag and drop functionality to extension input
        const extensionInput = ruleDiv.querySelector('.rule-extension');
        this.setupDragAndDropTarget(extensionInput);

        return ruleDiv;
    }

    setupDragAndDropTarget(extensionInput) {
        extensionInput.addEventListener('dragover', (e) => {
            e.preventDefault();
            extensionInput.classList.add('drag-over');
        });

        extensionInput.addEventListener('dragleave', (e) => {
            extensionInput.classList.remove('drag-over');
        });

        extensionInput.addEventListener('drop', (e) => {
            e.preventDefault();
            extensionInput.classList.remove('drag-over');
            
            const extensions = e.dataTransfer.getData('text/extensions');
            if (extensions) {
                // If the input is empty, replace it. If it has content, append with comma
                const currentValue = extensionInput.value.trim();
                if (currentValue && !currentValue.includes(extensions)) {
                    extensionInput.value = currentValue + ',' + extensions;
                } else if (!currentValue) {
                    extensionInput.value = extensions;
                }
                debugLog('Extensions dropped:', extensions);
            }
        });
    }

    setupPresetEventListeners() {
        const presets = document.querySelectorAll('.file-type-preset');
        presets.forEach(preset => {
            // Click to add new rule
            preset.addEventListener('click', () => {
                const extensions = preset.getAttribute('data-extensions');
                const name = preset.textContent.toLowerCase();
                debugLog('Preset clicked:', name, extensions);
                this.addRule(extensions, name);
            });

            // Drag start
            preset.addEventListener('dragstart', (e) => {
                const extensions = preset.getAttribute('data-extensions');
                e.dataTransfer.setData('text/extensions', extensions);
                preset.classList.add('dragging');
                debugLog('Drag started:', extensions);
            });

            // Drag end
            preset.addEventListener('dragend', (e) => {
                preset.classList.remove('dragging');
            });
        });
    }

    suggestFolderName(extensions) {
        const ext = extensions.toLowerCase();
        
        // Common patterns
        if (ext.includes('pdf') || ext.includes('doc') || ext.includes('txt')) return 'documents';
        if (ext.includes('jpg') || ext.includes('png') || ext.includes('gif')) return 'images';
        if (ext.includes('mp4') || ext.includes('avi') || ext.includes('mkv')) return 'videos';
        if (ext.includes('mp3') || ext.includes('wav') || ext.includes('flac')) return 'audio';
        if (ext.includes('zip') || ext.includes('rar') || ext.includes('7z')) return 'archives';
        if (ext.includes('exe') || ext.includes('msi') || ext.includes('dmg')) return 'programs';
        if (ext.includes('py') || ext.includes('js') || ext.includes('css') || ext.includes('html')) return 'code';
        
        // Default suggestion
        return 'misc';
    }

    async resetToDefaults() {
        if (confirm('Reset all settings to defaults? This will remove all custom rules.')) {
            this.rules = this.getDefaultRules();
            this.defaultFolder = 'downloads';
            
            // Update UI
            const defaultFolderInput = document.getElementById('defaultFolder');
            if (defaultFolderInput) {
                defaultFolderInput.value = this.defaultFolder;
            }
            
            this.renderRules();
            await this.saveToStorage();
            debugLog('Settings reset to defaults');
        }
    }

    renderRules() {
        const container = document.getElementById('rulesContainer');
        if (!container) return;

        container.innerHTML = '';
        
        this.rules.forEach(rule => {
            const ruleElement = this.createRuleElement(rule.extension, rule.foldername);
            container.appendChild(ruleElement);
        });
        
        debugLog('Rules rendered:', this.rules.length);
    }

    showNotification(message, type = 'info') {
        debugLog(`Notification (${type}):`, message);
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 4px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            font-size: 14px;
            max-width: 300px;
            font-family: system-ui, -apple-system, sans-serif;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        debugLog('DOM loaded, creating OptionsManager');
        new OptionsManager();
    });
} else {
    debugLog('DOM already loaded, creating OptionsManager');
    new OptionsManager();
}

