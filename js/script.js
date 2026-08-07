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

next.addEventListener("click", ()=>{

    nextSlide();

});

prev.addEventListener("click", ()=>{

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

let slider = setInterval(nextSlide,5000);

// Pause on hover

const heroSlider = document.querySelector(".hero-slider");

heroSlider.addEventListener("mouseenter",()=>{

    clearInterval(slider);

});

heroSlider.addEventListener("mouseleave",()=>{

    slider = setInterval(nextSlide,5000);

});