const typedText = document.getElementById("typed-text");

if (typedText) {

const words = [
"Debt Recovery",
"Legal Collections",
"Credit Monitoring",
"Customer Support"
];

let wordIndex = 0;
let letterIndex = 0;
let currentWord = "";
let isDeleting = false;

const type = function() {

currentWord = words[wordIndex];

if (isDeleting) {
typedText.textContent = currentWord.substring(0, letterIndex--);
} else {
typedText.textContent = currentWord.substring(0, letterIndex++);
}

if (!isDeleting && letterIndex === currentWord.length) {
isDeleting = true;
setTimeout(type, 1200);
return;
}

if (isDeleting && letterIndex === 0) {
isDeleting = false;
wordIndex = (wordIndex + 1) % words.length;
}

setTimeout(type, isDeleting ? 50 : 100);

};

type();

}
document.addEventListener("DOMContentLoaded", function () {

const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

if (hamburger && navMenu) {

hamburger.addEventListener("click", function () {
navMenu.classList.toggle("active");
});

}

});

const reveals = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver((entries) => {

entries.forEach((entry) => {

if(entry.isIntersecting){
entry.target.classList.add("active");
}else{
entry.target.classList.remove("active");
}

});

});

reveals.forEach((el) => observer.observe(el));

const counters = document.querySelectorAll(".counter");

const counterObserver = new IntersectionObserver((entries) => {

entries.forEach(entry => {

if(entry.isIntersecting){

const counter = entry.target;
const target = +counter.getAttribute("data-target");

let count = 0;

const updateCounter = () => {

count += target / 100;

if(count < target){
counter.innerText = Math.ceil(count);
requestAnimationFrame(updateCounter);
}else{
counter.innerText = target;
}

};

updateCounter();

counterObserver.unobserve(counter);

}

});

});

counters.forEach(counter => {
counterObserver.observe(counter);
});
