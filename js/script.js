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

const menuToggle = document.getElementById("menuToggle");
const mainMenu = document.getElementById("mainMenu");
const navbar = document.querySelector(".navbar");

if (menuToggle && mainMenu) {

    // Main menu open/close
    function closeMenu() {
        mainMenu.classList.remove("active");
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

        if (!isOpen) {
            mainMenu.querySelectorAll(".has-submenu.open").forEach(item => {
                item.classList.remove("open");
            });
        }
    }

    menuToggle.addEventListener("click", toggleMenu);

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


