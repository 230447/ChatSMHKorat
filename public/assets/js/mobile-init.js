(function () {
    'use strict';

    /* ========================================
       LANDING PAGE - Hamburger Menu
    ======================================== */
    function initLandingNav() {
        const nav = document.querySelector('nav');
        const header = document.querySelector('.landing-header .container');
        if (!nav || !header) return;

     
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-btn';
        hamburger.setAttribute('aria-label', 'เปิดเมนู');
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        header.appendChild(hamburger);

      
        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-nav';
        closeBtn.setAttribute('aria-label', 'ปิดเมนู');
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        nav.appendChild(closeBtn);

      
        hamburger.addEventListener('click', () => {
            nav.classList.add('open');
            document.body.style.overflow = 'hidden';
        });

        closeBtn.addEventListener('click', closeNav);

     
        nav.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', closeNav);
        });

       
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

   
        let touchStartX = 0;
        sidebar.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].clientX;
        }, { passive: true });

        sidebar.addEventListener('touchend', e => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (diff > 60) closeSidebar(); 
        }, { passive: true });

        
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

       
        document.addEventListener('click', e => {
            const roomItem = e.target.closest('.room-item, .user-item');
            if (roomItem && window.innerWidth <= 768) {
                closeSidebar();
            }
        });

       
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) closeSidebar();
        });

      
        window.toggleSidebar = function () {
            sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
        };
    }

   
    function initKeyboardFix() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        
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

 
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();