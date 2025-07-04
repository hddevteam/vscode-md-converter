// Document Converter Website JavaScript

(function() {
    'use strict';

    // DOM Ready
    document.addEventListener('DOMContentLoaded', function() {
        initializeNavigation();
        initializeScrollEffects();
        initializeAnimations();
        initializeAnalytics();
    });

    // Navigation functionality
    function initializeNavigation() {
        const navbar = document.querySelector('.navbar');
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Navbar scroll effect
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(255, 255, 255, 0.98)';
                navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
            } else {
                navbar.style.background = 'rgba(255, 255, 255, 0.95)';
                navbar.style.boxShadow = 'none';
            }
        });

        // Smooth scroll for navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                
                // Only handle internal links
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        const offsetTop = targetElement.offsetTop - 80; // Account for fixed navbar
                        window.scrollTo({
                            top: offsetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });

        // Active navigation highlighting
        window.addEventListener('scroll', updateActiveNavigation);
    }

    // Update active navigation based on scroll position
    function updateActiveNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
        let currentSection = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    // Scroll effects and animations
    function initializeScrollEffects() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animateElements = document.querySelectorAll(
            '.feature-card, .step, .method, .support-card, .section-header'
        );
        
        animateElements.forEach(el => {
            observer.observe(el);
        });

        // Parallax effect for hero section
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const hero = document.querySelector('.hero');
            const heroVisual = document.querySelector('.hero-visual');
            
            if (hero && heroVisual) {
                const rate = scrolled * -0.5;
                heroVisual.style.transform = `translateY(${rate}px)`;
            }
        });
    }

    // Initialize animations
    function initializeAnimations() {
        // Add animation classes to CSS
        const style = document.createElement('style');
        style.textContent = `
            .animate-in {
                animation: fadeInUp 0.6s ease forwards;
            }
            
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(30px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .feature-card,
            .step,
            .method,
            .support-card,
            .section-header {
                opacity: 0;
                transform: translateY(30px);
                transition: all 0.6s ease;
            }
            
            .nav-link.active {
                color: #007acc !important;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);

        // Stagger animations for grid items
        const gridContainers = document.querySelectorAll(
            '.features-grid, .installation-steps, .usage-methods, .support-grid'
        );

        gridContainers.forEach(container => {
            const items = container.children;
            Array.from(items).forEach((item, index) => {
                item.style.animationDelay = `${index * 0.1}s`;
            });
        });
    }

    // Copy to clipboard functionality
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function() {
                showNotification('Copied to clipboard!');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification('Copied to clipboard!');
        }
    }

    // Show notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #007acc;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Add notification animations
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(notificationStyles);

    // Analytics and tracking
    function initializeAnalytics() {
        // Track button clicks
        const trackButtons = document.querySelectorAll('.btn, .support-link');
        
        trackButtons.forEach(button => {
            button.addEventListener('click', function() {
                const buttonText = this.textContent.trim();
                const href = this.getAttribute('href');
                
                // Track external links
                if (href && (href.includes('marketplace.visualstudio.com') || href.includes('github.com'))) {
                    trackEvent('External Link Click', {
                        button_text: buttonText,
                        destination: href
                    });
                }
            });
        });

        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', function() {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
            if (scrollPercent > maxScroll) {
                maxScroll = scrollPercent;
                
                // Track milestone scroll depths
                if (maxScroll >= 25 && !window.tracked25) {
                    trackEvent('Scroll Depth', { percent: 25 });
                    window.tracked25 = true;
                }
                if (maxScroll >= 50 && !window.tracked50) {
                    trackEvent('Scroll Depth', { percent: 50 });
                    window.tracked50 = true;
                }
                if (maxScroll >= 75 && !window.tracked75) {
                    trackEvent('Scroll Depth', { percent: 75 });
                    window.tracked75 = true;
                }
            }
        });

        // Track time on page
        const startTime = Date.now();
        window.addEventListener('beforeunload', function() {
            const timeOnPage = Math.round((Date.now() - startTime) / 1000);
            trackEvent('Time on Page', { seconds: timeOnPage });
        });
    }

    // Generic event tracking function
    function trackEvent(eventName, parameters = {}) {
        // For Google Analytics 4
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, parameters);
        }
        
        // For other analytics platforms
        console.log('Event tracked:', eventName, parameters);
    }

    // Performance monitoring
    window.addEventListener('load', function() {
        // Track page load time
        setTimeout(function() {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                const loadTime = Math.round(perfData.loadEventEnd - perfData.fetchStart);
                trackEvent('Page Load Time', { milliseconds: loadTime });
            }
        }, 0);
    });

    // Error tracking
    window.addEventListener('error', function(e) {
        trackEvent('JavaScript Error', {
            message: e.message,
            filename: e.filename,
            line: e.lineno
        });
    });

    // Handle reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // Disable animations for users who prefer reduced motion
        const style = document.createElement('style');
        style.textContent = `
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Keyboard navigation support
    document.addEventListener('keydown', function(e) {
        // Handle escape key to close any open elements
        if (e.key === 'Escape') {
            // Close any modals or dropdowns if they exist
            const activeElements = document.querySelectorAll('.active, .open');
            activeElements.forEach(el => {
                el.classList.remove('active', 'open');
            });
        }
    });

    // Expose utilities to global scope for potential use
    window.DocumentConverterUtils = {
        copyToClipboard,
        showNotification,
        trackEvent
    };

})();
