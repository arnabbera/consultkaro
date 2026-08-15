const siteLoader = document.getElementById("siteLoader");
let loaderDismissed = false;

function dismissLoader() {
  if (loaderDismissed) {
    return;
  }
  loaderDismissed = true;
  document.body.classList.remove("is-loading");
  if (siteLoader) {
    siteLoader.classList.add("hide");
    setTimeout(() => {
      siteLoader.remove();
    }, 620);
  }
}

window.addEventListener("load", () => {
  setTimeout(dismissLoader, 350);
});

// Fallback in case the load event is delayed by external assets.
setTimeout(dismissLoader, 2800);

const menuToggle = document.getElementById("menuToggle");
const siteMenu = document.getElementById("siteMenu");
const navLinks = document.querySelectorAll(".nav-link");

if (menuToggle && siteMenu) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteMenu.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      siteMenu.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const sections = document.querySelectorAll("main section[id]");
if (sections.length && navLinks.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const activeId = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${activeId}`;
          link.classList.toggle("active", isActive);
          if (isActive) {
            link.setAttribute("aria-current", "page");
          } else {
            link.removeAttribute("aria-current");
          }
        });
      });
    },
    { threshold: 0.35, rootMargin: "-20% 0px -50% 0px" }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

const slides = document.querySelectorAll(".hero-slide");
let slideIndex = 0;
let sliderTimer;

function startSlider() {
  if (slides.length < 2 || sliderTimer) {
    return;
  }

  sliderTimer = setInterval(() => {
    slides[slideIndex].classList.remove("active");
    slideIndex = (slideIndex + 1) % slides.length;
    slides[slideIndex].classList.add("active");
  }, 4500);
}

function stopSlider() {
  if (sliderTimer) {
    clearInterval(sliderTimer);
    sliderTimer = null;
  }
}

startSlider();
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopSlider();
  } else {
    startSlider();
  }
});

const revealNodes = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );
  revealNodes.forEach((node) => revealObserver.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("show"));
}

const yearNode = document.getElementById("year");
if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}
