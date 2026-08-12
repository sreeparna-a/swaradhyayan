/* ============================================================
   Swaradhyayan — Site Shell
   Injects topbar + sidebar into every sub-page (pages/*.html)
   ============================================================ */
(function () {
  "use strict";

  const NAV = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "dashboard.html",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`
    },
    {
      id: "courses",
      label: "Courses",
      href: "courses.html",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>`
    },
    {
      id: "practice",
      label: "Practice",
      href: "practice.html",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><polyline points="8 17 8 5 20 3 20 15"/><line x1="8" y1="11" x2="20" y2="9"/></svg>`
    },
    {
      id: "raaga-knowledge",
      label: "Raaga Knowledge",
      href: "raaga-knowledge.html",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
    },
    {
      id: "tala-library",
      label: "Tala Library",
      href: "tala-library.html",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`
    },
    {
      id: "compositions",
      label: "Compositions",
      href: "compositions.html",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
    },
    {
      id: "assignments",
      label: "Assignments",
      href: "assignments.html",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
    },
    {
      id: "progress",
      label: "Progress",
      href: "progress.html",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`
    }
  ];

  document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const pageId = body.dataset.page || "";
    const contentEl = body.querySelector("[data-page-content]");
    if (!contentEl) return;

    const savedContent = contentEl.innerHTML;

    const navLinks = NAV.map(({ id, label, href, icon }) => `
      <a class="nav-item${id === pageId ? " active" : ""}" href="${href}" data-page="${id}">
        ${icon}
        ${label}
      </a>`
    ).join("");

    const notifBell = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
    const chevron = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    const brandNote = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="15.5" r="2.5"/><polyline points="8 17 8 5 20 3 20 15"/><line x1="8" y1="11" x2="20" y2="9"/></svg>`;
    const shareIcon = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;
    const searchIcon = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;

    body.innerHTML = `
      <header class="topbar">
        <a class="brand" href="../index.html" aria-label="Swaradhyayan landing page">
          <div class="brand-icon" aria-hidden="true">${brandNote}</div>
          <span class="brand-copy">
            <span class="brand-title">Swaradhyayan</span>
            <span class="brand-subtitle">Indian Classical Music Portal</span>
          </span>
        </a>

        <div class="topbar-search" role="search">
          <span class="search-icon" aria-hidden="true">${searchIcon}</span>
          <input type="search" placeholder="Search raagas, talas, compositions..." aria-label="Global search">
          <span class="kbd">⌘K</span>
        </div>

        <div class="topbar-right">
          <button class="notif-btn" aria-label="Notifications" type="button">
            ${notifBell}
            <span class="notif-badge" aria-hidden="true">3</span>
          </button>
          <div class="user-chip" role="button" tabindex="0" aria-label="User menu">
            <div class="user-avatar" aria-hidden="true">AS</div>
            <div class="user-info">
              <span class="user-name">Ananya Sharma</span>
              <span class="user-role">Student</span>
            </div>
            <span class="user-chevron" aria-hidden="true">${chevron}</span>
          </div>
        </div>
      </header>

      <div class="app-body">
        <aside class="sidebar" aria-label="Main navigation">
          <nav class="nav-list">
            ${navLinks}
          </nav>
          <div class="sidebar-cta">
            <div class="sidebar-cta-star" aria-hidden="true">☆</div>
            <div class="sidebar-cta-title">Keep going!</div>
            <p class="sidebar-cta-text">Your dedication brings you closer to excellence.</p>
            <a href="progress.html" class="sidebar-cta-link">View Progress →</a>
          </div>
        </aside>

        <main class="content">
          ${savedContent}
        </main>
      </div>
    `;
  });
})();
