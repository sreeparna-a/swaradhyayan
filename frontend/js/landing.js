/* ============================================================
   Swaradhyayan — Landing Page JS
   Navbar: scroll state, active link, mobile drawer
   ============================================================ */
(function () {
  "use strict";

  const nav     = document.getElementById("l-nav");
  const toggle  = document.getElementById("l-nav-toggle");
  const drawer  = document.getElementById("l-nav-drawer");
  const navLinks = document.querySelectorAll(".l-nav-link");

  /* ---- Scroll: add/remove .scrolled ---- */
  function updateNav() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 40);
  }
  window.addEventListener("scroll", updateNav, { passive: true });
  updateNav();

  /* ---- Active nav link: highlight based on scroll position ---- */
  const sections = ["about", "modules", "raagas", "voices"].map((id) =>
    document.getElementById(id)
  ).filter(Boolean);

  function updateActiveLink() {
    const navH = parseInt(getComputedStyle(document.documentElement)
      .getPropertyValue("--nav-h")) || 68;
    const scrollMid = window.scrollY + navH + 80;
    let current = "";

    sections.forEach((sec) => {
      if (sec.offsetTop <= scrollMid) current = sec.id;
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute("href").replace("#", "");
      link.classList.toggle("active", href === current);
    });
  }
  window.addEventListener("scroll", updateActiveLink, { passive: true });
  updateActiveLink();

  /* ---- Mobile drawer toggle ---- */
  if (toggle && drawer) {
    toggle.addEventListener("click", () => {
      const isOpen = drawer.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      drawer.setAttribute("aria-hidden", String(!isOpen));
    });

    /* Close drawer on link click */
    drawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        drawer.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        drawer.setAttribute("aria-hidden", "true");
      });
    });

    /* Close on outside click */
    document.addEventListener("click", (e) => {
      if (!nav.contains(e.target)) {
        drawer.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        drawer.setAttribute("aria-hidden", "true");
      }
    });
  }

  /* ---- Smooth anchor scroll (offset for fixed nav) ---- */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const navH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue("--nav-h")) || 68;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  /* ---- Fade-in on scroll ---- */
  const fadeEls = document.querySelectorAll(
    ".l-module-card, .l-raaga-card, .l-voice-card, .l-about-grid"
  );

  if ("IntersectionObserver" in window && fadeEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );
    fadeEls.forEach((el) => {
      el.classList.add("fade-in");
      io.observe(el);
    });
  }

})();
