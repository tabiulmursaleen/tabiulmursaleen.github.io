// School Website JavaScript
// ===============================
// Hero Slider
// ===============================

const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");
const next = document.querySelector(".next");
const prev = document.querySelector(".prev");

let current = 0;

function showSlide(index){

    slides.forEach(slide => slide.classList.remove("active"));
    dots.forEach(dot => dot.classList.remove("active"));

    slides[index].classList.add("active");
    dots[index].classList.add("active");

}

// News-site logos under the footer contact links.
(() => {
    const newsSites = [
        { name: "The Daily Campus", url: "https://thedailycampus.com/section/technical/114", domain: "thedailycampus.com" },
        { name: "Dainik Shiksha", url: "https://www.dainikshiksha.com/", domain: "dainikshiksha.com" },
        { name: "Shiksha Barta", url: "https://shikshabarta.com/", domain: "shikshabarta.com" },
        { name: "Daily Amardesh", url: "https://dailyamardesh.com/", domain: "dailyamardesh.com" },
        { name: "Prothom Alo", url: "https://www.prothomalo.com/", domain: "prothomalo.com" }
    ];

    document.querySelectorAll(".footer-info").forEach(info => {
        const contactList = info.querySelector(".footer-contact-list");
        if (!contactList || info.querySelector(".footer-news-links")) return;

        const logoList = document.createElement("div");
        logoList.className = "footer-news-links";
        logoList.setAttribute("aria-label", "শিক্ষা ও সংবাদমাধ্যমের লিংক");

        const heading = document.createElement("h4");
        heading.className = "footer-news-heading";
        heading.textContent = "নিউজ লিংক";

        newsSites.forEach(site => {
            const link = document.createElement("a");
            link.href = site.url;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.setAttribute("aria-label", site.name);
            link.title = site.name;

            const logo = document.createElement("img");
            logo.src = `https://www.google.com/s2/favicons?domain=${site.domain}&sz=128`;
            logo.alt = site.name;
            logo.loading = "lazy";
            logo.referrerPolicy = "no-referrer";

            link.append(logo);
            logoList.append(link);
        });

        contactList.insertAdjacentElement("afterend", heading);
        heading.insertAdjacentElement("afterend", logoList);
    });
})();

// Make the school logo and title return visitors to the home page.
document.querySelectorAll(".logo-area").forEach(area => {
    const logoStack = Array.from(area.children).find(child => child.classList.contains("logo-stack"));
    const identity = logoStack?.nextElementSibling;
    if (!logoStack || !identity) return;

    [logoStack, identity].forEach((element, index) => {
        const link = document.createElement("a");
        link.className = "logo-home-link";
        link.href = "index.html";
        if (index === 0) link.setAttribute("aria-label", "হোম পেজ");
        element.replaceWith(link);
        link.append(element);
    });
});

function nextSlide(){

    current++;

    if(current >= slides.length){

        current = 0;

    }

    showSlide(current);

}

function prevSlide(){

    current--;

    if(current < 0){

        current = slides.length - 1;

    }

    showSlide(current);

}

next?.addEventListener("click", ()=>{

    nextSlide();

});

prev?.addEventListener("click", ()=>{

    prevSlide();

});

dots.forEach((dot,index)=>{

    dot.addEventListener("click",()=>{

        current=index;

        showSlide(current);

    });

});

// ===============================
// Auto Slide
// ===============================

let slider = slides.length ? setInterval(nextSlide,5000) : null;

// Pause on hover

const heroSlider = document.querySelector(".hero-slider");

heroSlider?.addEventListener("mouseenter",()=>{

    clearInterval(slider);

});

heroSlider?.addEventListener("mouseleave",()=>{

    slider = setInterval(nextSlide,5000);

});

 // ===============================
// Mobile Navigation Menu
// ===============================

// Compact shortcut ticker fills the otherwise empty mobile navigation ribbon.
const mobileMenuButton = document.getElementById("menuToggle");
const mobileNavContainer = document.querySelector(".navbar .container");

if (mobileMenuButton && mobileNavContainer && !mobileNavContainer.querySelector(".mobile-nav-ticker")) {
    const shortcutPages = [
        ["হোম", "index.html"],
        ["আমাদের কথা", "about.html"],
        ["শিক্ষকমণ্ডলী", "teachers.html"],
        ["কর্মচারীবৃন্দ", "staff.html"],
        ["ছাত্র/ছাত্রী", "students.html"],
        ["নোটিশ", "notice.html"]
    ];
    const ticker = document.createElement("div");
    ticker.className = "mobile-nav-ticker";
    ticker.setAttribute("aria-label", "দ্রুত পেজ লিংক");
    const track = document.createElement("div");
    track.className = "mobile-nav-ticker-track";
    const makeGroup = () => {
        const group = document.createElement("div");
        group.className = "mobile-nav-ticker-group";
        shortcutPages.forEach(([label, href]) => {
            const link = document.createElement("a");
            link.href = href;
            link.textContent = label;
            group.append(link);
        });
        return group;
    };
    track.append(makeGroup());
    const duplicate = makeGroup();
    duplicate.setAttribute("aria-hidden", "true");
    duplicate.querySelectorAll("a").forEach(link => link.tabIndex = -1);
    track.append(duplicate);
    ticker.append(track);
    mobileMenuButton.before(ticker);
}

const menuToggle = document.getElementById("menuToggle");
const mainMenu = document.getElementById("mainMenu");
const navbar = document.querySelector(".navbar");

if (menuToggle && mainMenu) {
    let menuPageScrollY = 0;

    function lockPageBehindMenu() {
        if (document.body.classList.contains("mobile-menu-scroll-lock")) return;
        menuPageScrollY = window.scrollY;
        document.body.style.top = `-${menuPageScrollY}px`;
        document.body.classList.add("mobile-menu-scroll-lock");
        document.documentElement.classList.add("mobile-menu-scroll-lock");
    }

    function unlockPageBehindMenu() {
        if (!document.body.classList.contains("mobile-menu-scroll-lock")) return;
        document.body.classList.remove("mobile-menu-scroll-lock");
        document.documentElement.classList.remove("mobile-menu-scroll-lock");
        document.body.style.top = "";
        window.scrollTo(0, menuPageScrollY);
    }

    function fitMobileMenuToViewport() {
        if (!mainMenu.classList.contains("active") ||
            !window.matchMedia("(max-width: 768px)").matches) {
            unlockPageBehindMenu();
            mainMenu.style.position = "";
            mainMenu.style.top = "";
            mainMenu.style.left = "";
            mainMenu.style.right = "";
            mainMenu.style.width = "";
            mainMenu.style.height = "";
            mainMenu.style.minHeight = "";
            mainMenu.style.maxHeight = "";
            return;
        }

        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const menuTop = navbar?.getBoundingClientRect().bottom ??
            mainMenu.getBoundingClientRect().top;
        mainMenu.style.position = "fixed";
        mainMenu.style.top = `${Math.max(0, menuTop)}px`;
        mainMenu.style.left = "0";
        mainMenu.style.right = "0";
        mainMenu.style.width = "100vw";
        const menuHeight = Math.max(120, viewportHeight - menuTop - 8);
        mainMenu.style.height = `${menuHeight}px`;
        mainMenu.style.minHeight = "0";
        mainMenu.style.maxHeight = `${menuHeight}px`;
        mainMenu.style.overflowY = "auto";
        lockPageBehindMenu();
    }

    // Main menu open/close
    function closeMenu() {
        mainMenu.classList.remove("active");
        fitMobileMenuToViewport();
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "মেনু খুলুন");

        // Close all open submenus
        mainMenu.querySelectorAll(".has-submenu.open").forEach(item => {
            item.classList.remove("open");
        });
    }

    function toggleMenu() {
        const isOpen = mainMenu.classList.toggle("active");

        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"
        );

        if (isOpen) {
            mainMenu.scrollTop = 0;
            requestAnimationFrame(fitMobileMenuToViewport);
        } else {
            fitMobileMenuToViewport();
        }

        if (!isOpen) {
            mainMenu.querySelectorAll(".has-submenu.open").forEach(item => {
                item.classList.remove("open");
            });
        }
    }

    menuToggle.addEventListener("click", toggleMenu);
    window.addEventListener("resize", fitMobileMenuToViewport, { passive: true });
    window.visualViewport?.addEventListener("resize", fitMobileMenuToViewport, { passive: true });

    // Submenu handling on mobile
    mainMenu.querySelectorAll(".has-submenu > a").forEach(link => {

        link.addEventListener("click", function (event) {

            // Only use click-to-toggle on mobile
            if (window.matchMedia("(max-width: 768px)").matches) {

                const parent = this.parentElement;
                const submenu = parent.querySelector(":scope > .submenu");

                if (submenu) {
                    event.preventDefault();

                    const isOpen = parent.classList.toggle("open");

                    // Close sibling submenus at the same level
                    const siblings = Array.from(parent.parentElement.children);

                    siblings.forEach(sibling => {
                        if (
                            sibling !== parent &&
                            sibling.classList.contains("has-submenu")
                        ) {
                            sibling.classList.remove("open");
                            sibling.querySelectorAll(".has-submenu.open")
                                .forEach(child => child.classList.remove("open"));
                        }
                    });

                    // Keep track of submenu state if needed
                    parent.setAttribute("aria-expanded", String(isOpen));
                }
            }

        });

    });

    // Close menu when clicking outside
    document.addEventListener("click", function (event) {

        if (
            navbar &&
            !navbar.contains(event.target) &&
            mainMenu.classList.contains("active")
        ) {
            closeMenu();
        }

    });

    // Close menu with Escape key
    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeMenu();
            menuToggle.focus();
        }

    });

    // Reset mobile menu when switching to desktop
    window.matchMedia("(min-width: 769px)").addEventListener("change", function (event) {

        if (event.matches) {
            closeMenu();
        }

    });

}


