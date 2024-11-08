document.addEventListener("DOMContentLoaded", () => {
    // Constants
    const FETCH_TIMEOUT = 5000; // 5 seconds
    const MAX_NAME_LENGTH = 50;
    const VALID_NAME_REGEX = /^[a-zA-Z\s'-]+$/;

    /**
     * Fetches and appends content to a specified element
     * @param {string} url - URL to fetch content from
     * @param {string} elementId - Target element ID
     * @returns {Promise<void>}
     */
    async function fetchAndAppendContent(url, elementId) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return;
            }

            const data = await response.text();
            const element = document.getElementById(elementId);
            if (!element) {
                console.error(`Element with ID '${elementId}' not found`);
                return;
            }

            element.innerHTML = data;

            if (elementId === "navbar") {
                initializeNavbar();
            }
        } catch (error) {
            console.error(`Error fetching content from ${url}:`, error);
        }
    }

    /**
     * Initializes navbar functionality
     */
    function initializeNavbar() {
        const menu = document.getElementById("menu");
        const hamburger = document.getElementById("hamburger");

        if (!menu || !hamburger) {
            console.error("Required navbar elements not found");
            return;
        }

        function toggleMenu(show) {
            menu.classList.toggle("show", show);
            hamburger.classList.toggle("active", show);
            hamburger.setAttribute("aria-expanded", show);
        }

        // Hamburger click handler
        hamburger.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleMenu(!menu.classList.contains("show"));
        });

        // Outside click handler
        document.addEventListener("click", (e) => {
            if (menu.classList.contains("show") &&
                !menu.contains(e.target) &&
                !hamburger.contains(e.target)) {
                toggleMenu(false);
            }
        });

        // Initialize navigation links
        initializeNavLinks(menu, toggleMenu);
    }

    /**
     * Initializes navigation link functionality
     * @param {HTMLElement} menu - The menu element
     * @param {Function} toggleMenu - Function to toggle menu state
     */
    function initializeNavLinks(menu, toggleMenu) {
        document.querySelectorAll(".nav-link").forEach(link => {
            link.addEventListener("click", async function(e) {
                e.preventDefault();
                const href = this.getAttribute("href");

                if (!href) return;

                // Handle same page navigation
                if (window.location.pathname === href ||
                    window.location.hash === href) {
                    return;
                }

                try {
                    if (href.startsWith("#")) {
                        const element = document.querySelector(href);
                        if (element) {
                            element.scrollIntoView({ behavior: "smooth" });
                        }
                    } else {
                        await loadNewPage(href);
                    }

                    // Close mobile menu
                    toggleMenu(false);
                } catch (error) {
                    console.error("Navigation error:", error);
                }
            });
        });
    }

    /**
     * Initializes image lazy loading
     */
    function initializeImageLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    /**
     * Loads new page content
     * @param {string} href - Page URL to load
     * @returns {Promise<void>}
     */
    async function loadNewPage(href) {
        try {
            history.pushState(null, null, href);
            const response = await fetch(href);
            if (!response.ok) {
                console.error(`HTTP error! status: ${response.status}`);
                return;
            }

            const data = await response.text();
            // Create a temporary container to parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');

            // Get only the main content
            const newMainContent = doc.querySelector('.main-content');

            if (!newMainContent) {
                console.error("Main content element not found in new page");
                return;
            }

            // Replace only the main content
            const currentMainContent = document.querySelector('.main-content');
            if (currentMainContent) {
                currentMainContent.innerHTML = newMainContent.innerHTML;
            }

            initializeImageLoading();
        } catch (error) {
            console.error("Page load error:", error);
        }
    }

    /**
     * Displays welcome message
     */
    function displayMessage() {
        const userNameInput = document.getElementById("userName");
        const outputMessage = document.getElementById("outputMessage");

        if (!userNameInput || !outputMessage) return;

        const userName = userNameInput.value.trim();
        outputMessage.textContent = "";

        if (!userName) {
            outputMessage.textContent = "Please enter your name.";
            return;
        }

        if (!VALID_NAME_REGEX.test(userName)) {
            outputMessage.textContent = "Please enter a valid name (letters, spaces, hyphens, and apostrophes only).";
            return;
        }

        if (userName.length > MAX_NAME_LENGTH) {
            outputMessage.textContent = `Please enter a shorter name (max ${MAX_NAME_LENGTH} characters).`;
            return;
        }

        outputMessage.textContent = `Hello, ${userName}! Welcome to the Fork in the Road! If you like what you see, please consider joining other trailblazers to prove that second chances are worth it!`;
    }

    // Initialize page
    Promise.all([
        fetchAndAppendContent("navbar.html", "navbar"),
        fetchAndAppendContent("footer.html", "footer")
    ]).then(() => {
        initializeImageLoading();
    }).catch(error => {
        console.error("Error initializing page:", error);
    });

    // Setup message functionality
    const submitButton = document.getElementById("submitButton");
    if (submitButton) {
        submitButton.addEventListener("click", displayMessage);
    }
});