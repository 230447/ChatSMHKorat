/**
 * SMH Hospital Chat - Mobile Responsive JS
 * ใส่ในทุกหน้าที่ต้องการ responsive behavior
 */

(function () {
    'use strict';

    /* ========================================
       LANDING PAGE - Hamburger Menu
    ======================================== */
    function initLandingNav() {
        const nav = document.querySelector('nav');
        const header = document.querySelector('.landing-header .container');
        if (!nav || !header) return;

        // สร้าง hamburger button
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-btn';
        hamburger.setAttribute('aria-label', 'เปิดเมนู');
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        header.appendChild(hamburger);

        // สร้าง close button ใน nav
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-nav';
        closeBtn.setAttribute('aria-label', 'ปิดเมนู');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        nav.appendChild(closeBtn);

        // Toggle nav
        hamburger.addEventListener('click', () => {
            nav.classList.add('open');
            document.body.style.overflow = 'hidden';
        });

        closeBtn.addEventListener('click', closeNav);

        // ปิดเมื่อคลิก link
        nav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', closeNav);
        });

        // ปิดเมื่อ resize ไป desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) closeNav();
        });

        function closeNav() {
            nav.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    /* ========================================
       CHAT PAGE - Sidebar Toggle
    ======================================== */
    function initChatSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const chatHeader = document.querySelector('.chat-header .header-left');
        const overlay = document.getElementById('mobileOverlay');
        if (!sidebar || !chatHeader) return;

        // สร้าง hamburger button ใน chat header
        const menuBtn = document.createElement('button');
        menuBtn.className = 'mobile-menu-btn';
        menuBtn.setAttribute('aria-label', 'เปิด/ปิด Sidebar');
        menuBtn.setAttribute('id', 'mobileSidebarBtn');
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        chatHeader.insertBefore(menuBtn, chatHeader.firstChild);

        menuBtn.addEventListener('click', openSidebar);

        if (overlay) {
            overlay.addEventListener('click', closeSidebar);
        }

        // swipe left เพื่อปิด sidebar
        let touchStartX = 0;
        sidebar.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });

        sidebar.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (diff > 60) closeSidebar(); // swipe left 60px
        }, { passive: true });

        // swipe right จากขอบซ้ายเพื่อเปิด sidebar
        document.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });

        document.addEventListener('touchend', e => {
            const diff = e.changedTouches[0].clientX - touchStartX;
            if (touchStartX < 30 && diff > 60 && window.innerWidth <= 768) {
                openSidebar();
            }
        }, { passive: true });

        function openSidebar() {
            sidebar.classList.add('open');
            if (overlay) overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        function closeSidebar() {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('show');
            document.body.style.overflow = '';
        }

        // ปิด sidebar เมื่อเลือกห้อง
        document.addEventListener('click', e => {
            const roomItem = e.target.closest('.room-item, .user-item');
            if (roomItem && window.innerWidth <= 768) {
                closeSidebar();
            }
        });

        // ปิดเมื่อ resize ไป desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) closeSidebar();
        });

        // expose ให้ใช้ globally
        window.toggleSidebar = function () {
            sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
        };
    }

    /* ========================================
       INPUT HEIGHT - Virtual Keyboard Fix
       ป้องกัน keyboard บน mobile บังช่อง input
    ======================================== */
    function initKeyboardFix() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        // ใช้ visualViewport API ถ้ามี
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => {
                const mainChat = document.querySelector('.main-chat');
                if (!mainChat) return;

                const viewportHeight = window.visualViewport.height;
                if (window.innerWidth <= 768) {
                    mainChat.style.height = viewportHeight + 'px';
                } else {
                    mainChat.style.height = '';
                }
            });
        }

        // scroll ไปข้อความล่าสุดเมื่อ focus input
        messageInput.addEventListener('focus', () => {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    const msgContainer = document.querySelector('.messages-container');
                    if (msgContainer) {
                        msgContainer.scrollTop = msgContainer.scrollHeight;
                    }
                }, 300);
            }
        });
    }

    /* ========================================
       DETECT & INIT
    ======================================== */
    function init() {
        const page = detectPage();

        if (page === 'landing') {
            initLandingNav();
        } else if (page === 'chat') {
            initChatSidebar();
            initKeyboardFix();
        }

        // เพิ่ม class ให้ body บอกประเภท device
        updateDeviceClass();
        window.addEventListener('resize', updateDeviceClass);
    }

    function detectPage() {
        if (document.querySelector('.landing-header')) return 'landing';
        if (document.querySelector('.chat-app')) return 'chat';
        if (document.querySelector('.auth-container')) return 'auth';
        if (document.querySelector('.profile-container')) return 'profile';
        return 'other';
    }

    function updateDeviceClass() {
        const w = window.innerWidth;
        document.body.classList.remove('is-mobile', 'is-tablet', 'is-desktop');
        if (w <= 768) document.body.classList.add('is-mobile');
        else if (w <= 1024) document.body.classList.add('is-tablet');
        else document.body.classList.add('is-desktop');
    }

    // รัน
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();