document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Main.js loaded');
    
    // Hamburger menu
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const nav = document.querySelector('nav');
    
    if (hamburgerBtn && nav) {
        hamburgerBtn.addEventListener('click', function() {
            nav.classList.toggle('open');
        });
    }
    
    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
});