window.addEventListener("scroll", () => {
  const header = document.querySelector(".main-header");
  if (window.scrollY > 20) {
    header.style.boxShadow = "0 2px 10px rgba(0,0,0,0.15)";
  } else {
    header.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
  }
});

// ===== Typed Text Effect =====
const typedText = document.querySelector(".typed-text");
const words = ["Debt Recovery Experts", "Debt Recovery Experts", "BPO Services", "Smart Solutions for Smart Business"];
let wordIndex = 0;
let letterIndex = 0;
let isDeleting = false;
let typeSpeed = 80;

function type() {
  const currentWord = words[wordIndex];
  if (isDeleting) {
    typedText.textContent = currentWord.substring(0, letterIndex--);
  } else {
    typedText.textContent = currentWord.substring(0, letterIndex++);
  }

  if (!isDeleting && letterIndex === currentWord.length + 1) {
    isDeleting = true;
    setTimeout(type, 1000);
  } else if (isDeleting && letterIndex === 0) {
    isDeleting = false;
    wordIndex = (wordIndex + 1) % words.length;
    setTimeout(type, 500);
  } else {
    setTimeout(type, typeSpeed);
  }
}

document.addEventListener("DOMContentLoaded", type);

// ===== IntersectionObserver for repeated scroll-in animations =====
(function () {
  const options = {
    root: null,            // viewport
    rootMargin: '0px 0px -10% 0px', // trigger a bit earlier
    threshold: 0           // when any part is visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting) {
        // add show when entering view
        el.classList.add('show');
      } else {
        // remove show when leaving view so it can animate again next time
        el.classList.remove('show');
      }
    });
  }, options);

  // observe every .scroll-element inside the problems section (or whole page)
  document.querySelectorAll('.scroll-element').forEach(el => observer.observe(el));
})();

  // ===== Hamburger Menu Toggle =====
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");

  hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    hamburger.querySelector("i").classList.toggle("fa-bars");
    hamburger.querySelector("i").classList.toggle("fa-times");
  });

  // Close menu when clicking a link
  document.querySelectorAll(".nav-menu a").forEach(link =>
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      hamburger.querySelector("i").classList.add("fa-bars");
      hamburger.querySelector("i").classList.remove("fa-times");
    })
  );

  // ===== Close Menu When Clicking a Link =====
  document.querySelectorAll(".nav-menu a").forEach(link =>
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      hamburger.querySelector("i").classList.add("fa-bars");
      hamburger.querySelector("i").classList.remove("fa-times");
    })
  );

// ===== Scroll to Top Button =====
const scrollBtn = document.getElementById("scrollTopBtn");
const circle = document.querySelector(".progress-ring__circle");
const radius = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;

circle.style.strokeDasharray = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

// Show button + update fill as scroll
window.addEventListener("scroll", () => {
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const scrollPercent = scrollTop / docHeight;
  const offset = circumference - scrollPercent * circumference;

  circle.style.strokeDashoffset = offset;

  if (scrollTop > 200) {
    scrollBtn.classList.add("show");
  } else {
    scrollBtn.classList.remove("show");
  }
});

// Scroll smoothly to top
scrollBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

// ===== Modal Open / Close =====
function openModal() {
  document.getElementById("readMoreModal").style.display = "flex";
  document.body.style.overflow = "hidden"; // optional: locks background scroll
}

function closeModal() {
  document.getElementById("readMoreModal").style.display = "none";
  document.body.style.overflow = "auto";
}


// Close modal on clicking outside
window.addEventListener("click", function(e) {
  const modal = document.getElementById("readMoreModal");
  if (e.target === modal) {
    closeModal();
  }
});

// Scroll fade-in animation
const fadeElements = document.querySelectorAll('.scroll-element');
const showOnScroll = () => {
  fadeElements.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 100) {
      el.classList.add('show');
    }
  });
};
window.addEventListener('scroll', showOnScroll);
showOnScroll();

// ===== Animated Counter (reload on scroll) =====

const counters = document.querySelectorAll(".result-number");
let options = {
  threshold: 0.5, // Trigger animation when 50% of section is visible
};

let observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      counters.forEach(counter => {
        animateCounter(counter);
      });
    }
  });
}, options);

document.querySelectorAll(".results-section").forEach(sec => {
  observer.observe(sec);
});

function animateCounter(counter) {
  let target = +counter.getAttribute("data-value");
  let current = 0;
  let speed = 15; // increase = faster

  counter.textContent = "0%";

  let interval = setInterval(() => {
    current++;
    counter.textContent = current + "%";

    if (current >= target) {
      clearInterval(interval);
    }
  }, speed);
}
