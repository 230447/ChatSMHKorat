// Utility Functions for Chat Application

class Utils {
    // Format date to Thai locale
    static formatDateThai(date) {
        const thaiMonths = [
            'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
            'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
            'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
        ];
        
        const d = new Date(date);
        const day = d.getDate();
        const month = thaiMonths[d.getMonth()];
        const year = d.getFullYear() + 543;
        const time = d.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `${day} ${month} ${year} ${time}`;
    }

    // Format relative time (e.g., "2 นาทีที่แล้ว")
    static formatRelativeTime(date) {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) {
            return 'เมื่อสักครู่';
        } else if (diffMin < 60) {
            return `${diffMin} นาทีที่แล้ว`;
        } else if (diffHour < 24) {
            return `${diffHour} ชั่วโมงที่แล้ว`;
        } else if (diffDay < 7) {
            return `${diffDay} วันที่แล้ว`;
        } else {
            return this.formatDateThai(date);
        }
    }

    // Validate email format
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Validate Thai phone number
    static isValidThaiPhone(phone) {
        const re = /^0[0-9]{8,9}$/;
        return re.test(phone);
    }

    // Debounce function for limiting API calls
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function for scroll events
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Generate unique ID
    static generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Safe JSON parse with fallback
    static safeJsonParse(str, fallback = {}) {
        try {
            return JSON.parse(str);
        } catch (e) {
            return fallback;
        }
    }

    // Check if object is empty
    static isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }

    // Deep clone object
    static deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // Get file extension
    static getFileExtension(filename) {
        return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
    }

    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Check if file is image
    static isImageFile(filename) {
        const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
        const ext = this.getFileExtension(filename).toLowerCase();
        return imageExtensions.includes(ext);
    }

    // Check if file is document
    static isDocumentFile(filename) {
        const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
        const ext = this.getFileExtension(filename).toLowerCase();
        return docExtensions.includes(ext);
    }

    // Check if file is audio
    static isAudioFile(filename) {
        const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac'];
        const ext = this.getFileExtension(filename).toLowerCase();
        return audioExtensions.includes(ext);
    }

    // Check if file is video
    static isVideoFile(filename) {
        const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv'];
        const ext = this.getFileExtension(filename).toLowerCase();
        return videoExtensions.includes(ext);
    }

    // Get file icon based on type
    static getFileIcon(filename) {
        if (this.isImageFile(filename)) return 'fa-file-image';
        if (this.isDocumentFile(filename)) return 'fa-file-alt';
        if (this.isAudioFile(filename)) return 'fa-file-audio';
        if (this.isVideoFile(filename)) return 'fa-file-video';
        return 'fa-file';
    }

    // Sanitize HTML to prevent XSS
    static sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    // Capitalize first letter of each word
    static capitalizeWords(str) {
        return str.replace(/\b\w/g, char => char.toUpperCase());
    }

    // Truncate text with ellipsis
    static truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // Check if user is online (based on last seen)
    static isUserOnline(lastSeen) {
        if (!lastSeen) return false;
        const lastSeenDate = new Date(lastSeen);
        const now = new Date();
        const diffMinutes = (now - lastSeenDate) / (1000 * 60);
        return diffMinutes < 5; // Consider online if seen within 5 minutes
    }

    // Get current timestamp in ISO format
    static getCurrentTimestamp() {
        return new Date().toISOString();
    }

    // Parse URL parameters
    static getUrlParams() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return params;
    }

    // Set URL parameter
    static setUrlParam(key, value) {
        const url = new URL(window.location);
        url.searchParams.set(key, value);
        window.history.pushState({}, '', url);
    }

    // Remove URL parameter
    static removeUrlParam(key) {
        const url = new URL(window.location);
        url.searchParams.delete(key);
        window.history.pushState({}, '', url);
    }

    // Copy text to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err2) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    // Download file from URL
    static downloadFile(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // Open file in new tab
    static openFile(url) {
        window.open(url, '_blank');
    }

    // Check if mobile device
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    // Check if touch device
    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    // Get browser info
    static getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'Unknown';
        
        if (ua.includes('Chrome')) browser = 'Chrome';
        else if (ua.includes('Firefox')) browser = 'Firefox';
        else if (ua.includes('Safari')) browser = 'Safari';
        else if (ua.includes('Edge')) browser = 'Edge';
        else if (ua.includes('Opera')) browser = 'Opera';
        else if (ua.includes('MSIE') || ua.includes('Trident/')) browser = 'IE';
        
        return browser;
    }

    // Get OS info
    static getOSInfo() {
        const ua = navigator.userAgent;
        let os = 'Unknown';
        
        if (ua.includes('Windows')) os = 'Windows';
        else if (ua.includes('Mac')) os = 'MacOS';
        else if (ua.includes('Linux')) os = 'Linux';
        else if (ua.includes('Android')) os = 'Android';
        else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
        
        return os;
    }

    // Check if dark mode is enabled
    static isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Create data URL from file
    static createDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Compress image file
    static compressImage(file, maxWidth = 800, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    canvas.toBlob(
                        (blob) => resolve(blob),
                        file.type,
                        quality
                    );
                };
                
                img.onerror = reject;
            };
            
            reader.onerror = reject;
        });
    }

    // Format number with commas (Thai style)
    static formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Generate random color
    static getRandomColor() {
        const colors = [
            '#3498db', '#2ecc71', '#e74c3c', '#f39c12',
            '#9b59b6', '#1abc9c', '#d35400', '#34495e',
            '#16a085', '#27ae60', '#2980b9', '#8e44ad'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Get initials from name
    static getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    // Check if URL is valid
    static isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    // Get query string from object
    static objectToQueryString(obj) {
        const params = new URLSearchParams();
        Object.keys(obj).forEach(key => {
            if (obj[key] !== null && obj[key] !== undefined) {
                params.append(key, obj[key]);
            }
        });
        return params.toString();
    }

    // Get object from query string
    static queryStringToObject(queryString) {
        const params = new URLSearchParams(queryString);
        const obj = {};
        for (const [key, value] of params) {
            obj[key] = value;
        }
        return obj;
    }

    // Sleep function for async operations
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Retry async function with exponential backoff
    static async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) {
                    const delay = baseDelay * Math.pow(2, i);
                    await this.sleep(delay);
                }
            }
        }
        
        throw lastError;
    }

    // Local storage with expiration
    static setLocalStorage(key, value, expirationMinutes = null) {
        const item = {
            value: value,
            expires: expirationMinutes ? Date.now() + (expirationMinutes * 60 * 1000) : null
        };
        localStorage.setItem(key, JSON.stringify(item));
    }

    static getLocalStorage(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        const item = JSON.parse(itemStr);
        
        if (item.expires && Date.now() > item.expires) {
            localStorage.removeItem(key);
            return null;
        }
        
        return item.value;
    }

    // Session storage helper
    static setSessionStorage(key, value) {
        sessionStorage.setItem(key, JSON.stringify(value));
    }

    static getSessionStorage(key) {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    }

    // Cookie helper
    static setCookie(name, value, days = 7) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
    }

    static getCookie(name) {
        return document.cookie.split('; ').reduce((r, v) => {
            const parts = v.split('=');
            return parts[0] === name ? decodeURIComponent(parts[1]) : r;
        }, '');
    }

    static deleteCookie(name) {
        this.setCookie(name, '', -1);
    }

    // Detect internet connection
    static isOnline() {
        return navigator.onLine;
    }

    // Register online/offline handlers
    static registerConnectionHandlers(onlineCallback, offlineCallback) {
        window.addEventListener('online', onlineCallback);
        window.addEventListener('offline', offlineCallback);
    }

    // Unregister connection handlers
    static unregisterConnectionHandlers(onlineCallback, offlineCallback) {
        window.removeEventListener('online', onlineCallback);
        window.removeEventListener('offline', offlineCallback);
    }

    // Vibrate device (if supported)
    static vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    // Share content (Web Share API)
    static async shareContent({ title, text, url }) {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return true;
            } catch (error) {
                console.log('Share cancelled:', error);
                return false;
            }
        }
        return false;
    }

    // Print content
    static printContent(elementId) {
        const content = document.getElementById(elementId);
        if (!content) return;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print</title>
                    <style>
                        body { font-family: 'Prompt', sans-serif; }
                        @media print {
                            @page { margin: 0; }
                            body { margin: 1.6cm; }
                        }
                    </style>
                </head>
                <body>${content.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    }

    // Fullscreen API
    static toggleFullscreen(element = document.documentElement) {
        if (!document.fullscreenElement) {
            element.requestFullscreen().catch(err => {
                console.log(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Check if fullscreen is supported
    static isFullscreenSupported() {
        return document.fullscreenEnabled;
    }

    // Get screen orientation
    static getScreenOrientation() {
        if (screen.orientation) {
            return screen.orientation.type;
        } else if (window.orientation !== undefined) {
            return Math.abs(window.orientation) === 90 ? 'landscape' : 'portrait';
        }
        return 'unknown';
    }

    // Register orientation change handler
    static registerOrientationHandler(callback) {
        const eventName = screen.orientation ? 'change' : 'orientationchange';
        window.addEventListener(eventName, callback);
    }

    // Unregister orientation change handler
    static unregisterOrientationHandler(callback) {
        const eventName = screen.orientation ? 'change' : 'orientationchange';
        window.removeEventListener(eventName, callback);
    }

    // Get device pixel ratio
    static getDevicePixelRatio() {
        return window.devicePixelRatio || 1;
    }

    // Check if PWA is installed
    static isPWAInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    }

    // Register beforeinstallprompt handler for PWA
    static registerPWAInstallHandler(callback) {
        window.addEventListener('beforeinstallprompt', callback);
    }

    // Unregister beforeinstallprompt handler
    static unregisterPWAInstallHandler(callback) {
        window.removeEventListener('beforeinstallprompt', callback);
    }

    // Register service worker
    static async registerServiceWorker(swUrl) {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register(swUrl);
                console.log('ServiceWorker registered:', registration);
                return registration;
            } catch (error) {
                console.error('ServiceWorker registration failed:', error);
                return null;
            }
        }
        return null;
    }

    // Unregister service worker
    static async unregisterServiceWorker() {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            await registration.unregister();
            console.log('ServiceWorker unregistered');
        }
    }

    // Send analytics event
    static sendAnalytics(eventName, eventData = {}) {
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        
        // You can add other analytics providers here
        console.log('Analytics event:', eventName, eventData);
    }

    // Performance measurement
    static startPerformanceMeasure(name) {
        if (performance.mark) {
            performance.mark(`${name}-start`);
        }
    }

    static endPerformanceMeasure(name) {
        if (performance.mark && performance.measure) {
            performance.mark(`${name}-end`);
            performance.measure(name, `${name}-start`, `${name}-end`);
            const measures = performance.getEntriesByName(name);
            measures.forEach(measure => {
                console.log(`${name}: ${measure.duration.toFixed(2)}ms`);
            });
            performance.clearMarks(`${name}-start`);
            performance.clearMarks(`${name}-end`);
            performance.clearMeasures(name);
        }
    }

    // Error reporting
    static reportError(error, context = {}) {
        const errorData = {
            error: error.message || error.toString(),
            stack: error.stack,
            context: context,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        // Send to error reporting service
        console.error('Error reported:', errorData);
        
        // You can send this to your error tracking service
        // Example: Sentry, Rollbar, etc.
        
        return errorData;
    }

    // Log with timestamp
    static logWithTimestamp(...args) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}]`, ...args);
    }

    // Warn with timestamp
    static warnWithTimestamp(...args) {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}]`, ...args);
    }

    // Error with timestamp
    static errorWithTimestamp(...args) {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}]`, ...args);
    }
}

// Make Utils available globally
window.Utils = Utils;

// Polyfill for older browsers
if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
        if (typeof start !== 'number') {
            start = 0;
        }
        if (start + search.length > this.length) {
            return false;
        } else {
            return this.indexOf(search, start) !== -1;
        }
    };
}

if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, 'includes', {
        value: function(searchElement, fromIndex) {
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            const o = Object(this);
            const len = o.length >>> 0;
            if (len === 0) {
                return false;
            }
            const n = fromIndex | 0;
            let k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
            while (k < len) {
                if (o[k] === searchElement) {
                    return true;
                }
                k++;
            }
            return false;
        }
    });
}
