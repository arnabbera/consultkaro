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

const consultModal = document.getElementById("consultModal");
const closeConsult = document.getElementById("closeConsult");
const openButtons = [
  document.getElementById("openConsultHero"),
  document.getElementById("openConsultContact")
];

function openConsultModal() {
  if (!consultModal) {
    return;
  }
  consultModal.classList.add("open");
  consultModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeConsultModal() {
  if (!consultModal) {
    return;
  }
  consultModal.classList.remove("open");
  consultModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

openButtons.forEach((button) => {
  if (button) {
    button.addEventListener("click", openConsultModal);
  }
});

if (closeConsult) {
  closeConsult.addEventListener("click", closeConsultModal);
}

if (consultModal) {
  consultModal.addEventListener("click", (event) => {
    if (event.target === consultModal) {
      closeConsultModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && consultModal && consultModal.classList.contains("open")) {
    closeConsultModal();
  }
});

const consultForm = document.getElementById("consultForm");
if (consultForm) {
  consultForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("cName").value.trim();
    const phone = document.getElementById("cPhone").value.trim();
    const query = document.getElementById("cQuery").value.trim();
    const message = encodeURIComponent(
      "Free Consultation Request\n" +
      "Name: " + name + "\n" +
      "Phone: " + phone + "\n" +
      "Requirement: " + (query || "Not provided")
    );
    window.open("https://wa.me/917439297280?text=" + message, "_blank");
    closeConsultModal();
    consultForm.reset();
  });
}

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
