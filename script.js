const animatedElements = document.querySelectorAll(
  ".era-card, .link-card, .timeline-entry, .profile-card, .gallery-card, .lore-block"
);

animatedElements.forEach((el) => el.classList.add("fade-in"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  {
    threshold: 0.12,
  }
);

animatedElements.forEach((el) => observer.observe(el));